import json
import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_admin
from app.database.connection import get_db
from app.database.models import Administrator, Diagnosis, MedicalReport, Patient, User


router = APIRouter(prefix="/admin", tags=["Admin"])
logger = logging.getLogger(__name__)
BASE_DIR = Path(__file__).resolve().parents[2]
UPLOADS_DIR = settings.upload_path
REPORTS_DIR = settings.reports_path


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


def _safe_file_path(value: str | None, root: Path) -> Path | None:
    """Return a path only when it is inside the expected storage directory."""
    if not value:
        return None

    candidate = Path(value)
    if not candidate.is_absolute():
        candidate = BASE_DIR / candidate

    candidate = candidate.resolve()
    try:
        candidate.relative_to(root)
    except ValueError:
        return None
    return candidate


def _remove_stored_files(paths: list[tuple[str | None, Path]]) -> None:
    for value, root in paths:
        path = _safe_file_path(value, root)
        if path is None or not path.is_file():
            continue
        try:
            path.unlink()
        except OSError:
            # Database deletion has already succeeded. Keep the API reliable
            # and leave an operator-visible log for cleanup of an orphan file.
            logger.warning("Could not remove stored file during admin deletion: %s", path)


def _stage_patient_deletion(db: Session, patient: Patient) -> tuple[int, int, list[tuple[str | None, Path]]]:
    """Stage explicit child deletes and return counts plus safe file paths."""
    diagnoses = db.query(Diagnosis).filter(Diagnosis.patient_id == patient.patient_id).all()
    diagnosis_ids = [diagnosis.diagnosis_id for diagnosis in diagnoses]
    reports = []
    if diagnosis_ids:
        reports = db.query(MedicalReport).filter(MedicalReport.diagnosis_id.in_(diagnosis_ids)).all()

    files: list[tuple[str | None, Path]] = []
    for diagnosis in diagnoses:
        files.append((diagnosis.image_path, UPLOADS_DIR))
        files.append((diagnosis.heatmap_path, UPLOADS_DIR))
    for report in reports:
        files.append((report.report_path, REPORTS_DIR))

    # Delete children explicitly rather than relying on database-level
    # cascades, which are not present in the existing migrations.
    for report in reports:
        db.delete(report)
    for diagnosis in diagnoses:
        db.delete(diagnosis)
    db.delete(patient)
    return len(diagnoses), len(reports), files


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


@router.delete("/users/{user_id}")
def delete_physician(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if user_id == current_admin.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own administrator account",
        )

    physician = db.query(User).filter(User.user_id == user_id).first()
    if physician is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if physician.role != "PHYSICIAN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only physician accounts can be deleted from this endpoint",
        )

    patients = db.query(Patient).filter(Patient.created_by == physician.user_id).all()
    deleted_diagnoses = 0
    deleted_reports = 0
    stored_files: list[tuple[str | None, Path]] = []
    deleted_user_id = physician.user_id

    try:
        for patient in patients:
            diagnoses, reports, files = _stage_patient_deletion(db, patient)
            deleted_diagnoses += diagnoses
            deleted_reports += reports
            stored_files.extend(files)

        administrator = db.query(Administrator).filter(Administrator.user_id == physician.user_id).first()
        if administrator is not None:
            db.delete(administrator)
        db.delete(physician)
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to delete physician %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Physician could not be deleted",
        )

    _remove_stored_files(stored_files)
    return {
        "message": "Physician and associated records deleted successfully",
        "deleted_user_id": deleted_user_id,
        "deleted_patients": len(patients),
        "deleted_diagnoses": deleted_diagnoses,
        "deleted_reports": deleted_reports,
    }


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


@router.delete("/patients/{patient_id}")
def delete_patient(
    patient_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    try:
        deleted_diagnoses, deleted_reports, stored_files = _stage_patient_deletion(db, patient)
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to delete patient %s", patient_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Patient could not be deleted",
        )

    _remove_stored_files(stored_files)
    return {
        "message": "Patient and associated records deleted successfully",
        "deleted_patient_id": patient_id,
        "deleted_diagnoses": deleted_diagnoses,
        "deleted_reports": deleted_reports,
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
