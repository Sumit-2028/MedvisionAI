import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin
from app.database.connection import get_db
from app.database.models import Diagnosis, MedicalReport, Patient, User


router = APIRouter(prefix="/admin", tags=["Admin"])


def _user_summary(user: User) -> dict:
    return {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "registration_date": user.registration_date,
    }


def _parse_json(value: str, fallback):
    try:
        return json.loads(value)
    except (TypeError, ValueError, json.JSONDecodeError):
        return fallback


@router.get("/me")
def get_admin_profile(current_admin: User = Depends(get_current_admin)):
    return _user_summary(current_admin)


@router.get("/dashboard")
def get_admin_dashboard(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    total_users = db.query(User).count()
    total_physicians = db.query(User).filter(User.role == "PHYSICIAN").count()
    total_patients = db.query(Patient).count()
    total_diagnoses = db.query(Diagnosis).count()
    abnormal_cases = db.query(Diagnosis).filter(Diagnosis.result_status == "ABNORMAL").count()
    normal_cases = db.query(Diagnosis).filter(Diagnosis.result_status == "NORMAL").count()
    recent = (
        db.query(Diagnosis, Patient, User)
        .join(Patient, Diagnosis.patient_id == Patient.patient_id)
        .join(User, Patient.created_by == User.user_id)
        .order_by(Diagnosis.diagnosis_timestamp.desc())
        .limit(8)
        .all()
    )
    return {
        "admin": _user_summary(current_admin),
        "statistics": {
            "total_users": total_users,
            "total_physicians": total_physicians,
            "total_patients": total_patients,
            "total_diagnoses": total_diagnoses,
            "abnormal_cases": abnormal_cases,
            "normal_cases": normal_cases,
        },
        "recent_activity": [
            {
                "diagnosis_id": diagnosis.diagnosis_id,
                "patient_id": patient.patient_id,
                "patient_name": patient.full_name,
                "physician_name": physician.full_name,
                "predicted_disease": diagnosis.predicted_disease,
                "result_status": diagnosis.result_status,
                "confidence_score": round(diagnosis.confidence_score * 100, 2),
                "diagnosis_timestamp": diagnosis.diagnosis_timestamp,
            }
            for diagnosis, patient, physician in recent
        ],
    }


@router.get("/users")
def list_users(
    search: str | None = Query(default=None, max_length=100),
    role: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=25, ge=1, le=100),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(or_(User.full_name.ilike(term), User.email.ilike(term)))
    if role:
        normalized_role = role.strip().upper()
        if normalized_role not in {"PHYSICIAN", "ADMIN"}:
            raise HTTPException(status_code=400, detail="Role must be PHYSICIAN or ADMIN")
        query = query.filter(User.role == normalized_role)
    total = query.count()
    users = query.order_by(User.registration_date.desc()).offset(skip).limit(limit).all()
    return {"total": total, "skip": skip, "limit": limit, "users": [_user_summary(user) for user in users]}


@router.get("/patients")
def list_patients(
    search: str | None = Query(default=None, max_length=100),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=25, ge=1, le=100),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Patient, User).join(User, Patient.created_by == User.user_id)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(or_(Patient.full_name.ilike(term), User.full_name.ilike(term), User.email.ilike(term)))
    total = query.count()
    rows = query.order_by(Patient.patient_id.desc()).offset(skip).limit(limit).all()
    patients = []
    for patient, physician in rows:
        latest = (
            db.query(Diagnosis)
            .filter(Diagnosis.patient_id == patient.patient_id)
            .order_by(Diagnosis.diagnosis_timestamp.desc())
            .first()
        )
        patients.append({
            "patient_id": patient.patient_id,
            "full_name": patient.full_name,
            "age": patient.age,
            "gender": patient.gender,
            "created_by": physician.user_id,
            "physician_name": physician.full_name,
            "physician_email": physician.email,
            "diagnosis_count": len(patient.diagnoses),
            "latest_diagnosis_id": latest.diagnosis_id if latest else None,
            "latest_diagnosis": latest.predicted_disease if latest else None,
            "latest_result_status": latest.result_status if latest else None,
            "latest_analysis_date": latest.diagnosis_timestamp if latest else None,
        })
    return {"total": total, "skip": skip, "limit": limit, "patients": patients}


@router.get("/patients/{patient_id}")
def get_patient(
    patient_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    physician = db.query(User).filter(User.user_id == patient.created_by).first()
    diagnoses = (
        db.query(Diagnosis)
        .filter(Diagnosis.patient_id == patient.patient_id)
        .order_by(Diagnosis.diagnosis_timestamp.desc())
        .all()
    )
    return {
        "patient_id": patient.patient_id,
        "full_name": patient.full_name,
        "age": patient.age,
        "gender": patient.gender,
        "created_by": patient.created_by,
        "physician": _user_summary(physician) if physician else None,
        "diagnoses": [
            {
                "diagnosis_id": diagnosis.diagnosis_id,
                "predicted_disease": diagnosis.predicted_disease,
                "confidence_score": round(diagnosis.confidence_score * 100, 2),
                "result_status": diagnosis.result_status,
                "diagnosis_timestamp": diagnosis.diagnosis_timestamp,
            }
            for diagnosis in diagnoses
        ],
    }


@router.get("/diagnoses")
def list_diagnoses(
    search: str | None = Query(default=None, max_length=100),
    result_status: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=25, ge=1, le=100),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Diagnosis, Patient, User, MedicalReport)
        .join(Patient, Diagnosis.patient_id == Patient.patient_id)
        .join(User, Patient.created_by == User.user_id)
        .outerjoin(MedicalReport, MedicalReport.diagnosis_id == Diagnosis.diagnosis_id)
    )
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(or_(Patient.full_name.ilike(term), User.full_name.ilike(term), Diagnosis.predicted_disease.ilike(term)))
    if result_status:
        normalized_status = result_status.strip().upper()
        if normalized_status not in {"NORMAL", "ABNORMAL"}:
            raise HTTPException(status_code=400, detail="Result status must be NORMAL or ABNORMAL")
        query = query.filter(Diagnosis.result_status == normalized_status)
    total = query.count()
    rows = query.order_by(Diagnosis.diagnosis_timestamp.desc()).offset(skip).limit(limit).all()
    diagnoses = [
        {
            "diagnosis_id": diagnosis.diagnosis_id,
            "patient_id": patient.patient_id,
            "patient_name": patient.full_name,
            "physician_id": physician.user_id,
            "physician_name": physician.full_name,
            "predicted_disease": diagnosis.predicted_disease,
            "confidence_score": round(diagnosis.confidence_score * 100, 2),
            "result_status": diagnosis.result_status,
            "diagnosis_timestamp": diagnosis.diagnosis_timestamp,
            "report_id": report.report_id if report else None,
            "report_available": bool(report and report.report_path),
        }
        for diagnosis, patient, physician, report in rows
    ]
    return {"total": total, "skip": skip, "limit": limit, "diagnoses": diagnoses}


@router.get("/diagnoses/{diagnosis_id}")
def get_diagnosis(
    diagnosis_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    row = (
        db.query(Diagnosis, Patient, User, MedicalReport)
        .join(Patient, Diagnosis.patient_id == Patient.patient_id)
        .join(User, Patient.created_by == User.user_id)
        .outerjoin(MedicalReport, MedicalReport.diagnosis_id == Diagnosis.diagnosis_id)
        .filter(Diagnosis.diagnosis_id == diagnosis_id)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diagnosis not found")
    diagnosis, patient, physician, report = row
    return {
        "diagnosis_id": diagnosis.diagnosis_id,
        "patient_id": patient.patient_id,
        "patient_name": patient.full_name,
        "physician": _user_summary(physician),
        "predicted_disease": diagnosis.predicted_disease,
        "confidence_score": round(diagnosis.confidence_score * 100, 2),
        "result_status": diagnosis.result_status,
        "findings": _parse_json(diagnosis.findings_json, []),
        "all_predictions": _parse_json(diagnosis.all_predictions_json, {}),
        "diagnosis_timestamp": diagnosis.diagnosis_timestamp,
        "report_id": report.report_id if report else None,
        "report_available": bool(report and report.report_path),
        "ai_disclaimer": "AI-assisted assessment only; not a definitive diagnosis. A qualified clinician must review the findings.",
    }
