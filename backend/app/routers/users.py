import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.database.models import (
    User,
    Patient,
    Diagnosis,
    MedicalReport
)
from app.schemas.patient import PatientCreate
from pydantic import BaseModel
from app.core.security import hash_password, verify_password


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# =========================================================
# GET CURRENT USER PROFILE
# =========================================================

@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "user_id": current_user.user_id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "registration_date": current_user.registration_date,
    }


# =========================================================
# GET PHYSICIAN'S PATIENTS
# =========================================================

@router.get("/patients")
def get_all_patients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns patients created by the logged-in physician,
    along with their latest diagnosis information.
    """

    # -----------------------------------------------------
    # Get only patients belonging to the logged-in physician
    # -----------------------------------------------------

    patients = (
        db.query(Patient)
        .filter(
            Patient.created_by == current_user.user_id
        )
        .order_by(
            Patient.patient_id.asc()
        )
        .all()
    )

    result = []

    # =====================================================
    # PROCESS EACH PATIENT
    # =====================================================

    for patient in patients:

        # -------------------------------------------------
        # Find latest diagnosis for this patient
        # -------------------------------------------------

        latest_diagnosis = (
            db.query(Diagnosis)
            .filter(
                Diagnosis.patient_id == patient.patient_id
            )
            .order_by(
                Diagnosis.diagnosis_timestamp.desc()
            )
            .first()
        )

        # -------------------------------------------------
        # Default patient information
        # -------------------------------------------------

        patient_data = {
            "patient_id": patient.patient_id,
            "created_by": patient.created_by,
            "full_name": patient.full_name,
            "age": patient.age,
            "gender": patient.gender,
            "contact_information": patient.contact_information,

            "latest_diagnosis_id": None,
            "report_id": None,
            "predicted_disease": None,
            "result_status": None,
            "confidence_score": None,
            "diagnosis_timestamp": None
        }

        # -------------------------------------------------
        # Add latest diagnosis information
        # -------------------------------------------------

        if latest_diagnosis:

            patient_data["latest_diagnosis_id"] = (
                latest_diagnosis.diagnosis_id
            )

            patient_data["predicted_disease"] = (
                latest_diagnosis.predicted_disease
            )

            patient_data["result_status"] = (
                latest_diagnosis.result_status
            )

            patient_data["confidence_score"] = round(
                latest_diagnosis.confidence_score * 100,
                2
            )

            patient_data["diagnosis_timestamp"] = (
                latest_diagnosis.diagnosis_timestamp
            )

            # -------------------------------------------------
            # Get generated medical report
            # -------------------------------------------------

            if latest_diagnosis.medical_report:

                patient_data["report_id"] = (
                    latest_diagnosis.medical_report.report_id
                )

        result.append(patient_data)

    # =====================================================
    # FINAL RESPONSE
    # =====================================================

    return {
        "total_patients": len(result),
        "patients": result
    }



# =========================================================
# CREATE NEW PATIENT
# =========================================================

@router.post("/patients")
def create_patient(
    patient_data: PatientCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a new patient for the logged-in physician.

    The patient ID is generated automatically by the database.
    """

    # -----------------------------------------------------
    # Validate gender
    # -----------------------------------------------------

    allowed_genders = {
        "Male",
        "Female",
        "Other",
        "Prefer not to say"
    }

    if patient_data.gender not in allowed_genders:
        raise HTTPException(
            status_code=400,
            detail=(
                "Gender must be Male, Female, Other, "
                "or Prefer not to say"
            )
        )

    # -----------------------------------------------------
    # Create patient
    # -----------------------------------------------------

    patient = Patient(
        created_by=current_user.user_id,
        full_name=patient_data.full_name.strip(),
        age=patient_data.age,
        gender=patient_data.gender,
        contact_information=patient_data.contact_information
    )

    db.add(patient)
    db.commit()
    db.refresh(patient)

    # -----------------------------------------------------
    # Return created patient
    # -----------------------------------------------------

    return {
        "message": "Patient created successfully",
        "patient": {
            "patient_id": patient.patient_id,
            "created_by": patient.created_by,
            "full_name": patient.full_name,
            "age": patient.age,
            "gender": patient.gender,
            "contact_information": patient.contact_information
        }
    }


# ============================================================
# GET SINGLE PATIENT DETAILS
# ============================================================
#
# Endpoint:
# GET /users/patients/{patient_id}
#
# Purpose:
# - Return complete information about one patient
# - Return all diagnosis history for that patient
# - Ensure the patient belongs to the logged-in physician
#
# Security:
# A physician can only access patients created by that physician.
# ============================================================

@router.get("/patients/{patient_id}")
def get_patient_details(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # Find the patient
    #
    # IMPORTANT:
    # We check both:
    #   1. patient_id
    #   2. created_by = logged-in physician
    #
    # This prevents one physician from accessing another
    # physician's patients.
    # --------------------------------------------------------

    patient = (
        db.query(Patient)
        .filter(
            Patient.patient_id == patient_id,
            Patient.created_by == current_user.user_id
        )
        .first()
    )


    # --------------------------------------------------------
    # Patient not found / unauthorized
    # --------------------------------------------------------

    if patient is None:

        raise HTTPException(
            status_code=404,
            detail="Patient not found or access denied"
        )


    # --------------------------------------------------------
    # Get all diagnoses belonging to this patient
    # --------------------------------------------------------

    diagnoses = (
        db.query(Diagnosis)
        .filter(
            Diagnosis.patient_id == patient.patient_id
        )
        .order_by(
            Diagnosis.diagnosis_timestamp.desc()
        )
        .all()
    )


    # --------------------------------------------------------
    # Prepare diagnosis history
    # --------------------------------------------------------

    diagnosis_history = []


    for diagnosis in diagnoses:

        # ----------------------------------------------------
        # Parse findings JSON safely
        # ----------------------------------------------------

        try:

            findings = json.loads(
                diagnosis.findings_json
            )

        except Exception:

            findings = []


        # ----------------------------------------------------
        # Parse all predictions JSON safely
        # ----------------------------------------------------

        try:

            all_predictions = json.loads(
                diagnosis.all_predictions_json
            )

        except Exception:

            all_predictions = {}


        # ----------------------------------------------------
        # Find associated medical report
        # ----------------------------------------------------

        medical_report = (
            db.query(MedicalReport)
            .filter(
                MedicalReport.diagnosis_id ==
                diagnosis.diagnosis_id
            )
            .first()
        )


        # ----------------------------------------------------
        # Add diagnosis information
        # ----------------------------------------------------

        diagnosis_history.append({

            "diagnosis_id":
                diagnosis.diagnosis_id,

            "report_id":
                medical_report.report_id
                if medical_report
                else None,

            "predicted_disease":
                diagnosis.predicted_disease,

            "confidence_score":
                round(
                    diagnosis.confidence_score * 100,
                    2
                ),

            "result_status":
                diagnosis.result_status,

            "findings":
                findings,

            "all_predictions":
                all_predictions,

            "image_path":
                diagnosis.image_path,

            "heatmap_path":
                diagnosis.heatmap_path,

            "diagnosis_timestamp":
                diagnosis.diagnosis_timestamp,

        })


    # ========================================================
    # Return clean response
    # ========================================================
    #
    # Keep patient fields at the ROOT level.
    #
    # This makes the frontend very simple:
    #
    # patient.full_name
    # patient.age
    # patient.gender
    # patient.diagnoses
    #
    # ========================================================

    return {

        # ----------------------------------------------------
        # Patient information
        # ----------------------------------------------------

        "patient_id":
            patient.patient_id,

        "full_name":
            patient.full_name,

        "age":
            patient.age,

        "gender":
            patient.gender,

        "contact_information":
            patient.contact_information,

        "created_by":
            patient.created_by,


        # ----------------------------------------------------
        # Diagnosis history
        # ----------------------------------------------------

        "diagnoses":
            diagnosis_history,

        "total_analyses":
            len(diagnosis_history),

    }


@router.put("/me/password")
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative credentials are managed by the deployment configuration.",
        )

    # Verify current password
    if not verify_password(
        request.current_password,
        current_user.password
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    # Validate new password
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must contain at least 8 characters",
        )

    # Prevent using the same password
    if verify_password(
        request.new_password,
        current_user.password
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password",
        )

    # Hash the new password
    current_user.password = hash_password(
        request.new_password
    )

    db.commit()

    return {
        "message": "Password changed successfully"
    }
