from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.database.models import User, Patient, Diagnosis


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# =========================================================
# GET CURRENT USER PROFILE
# =========================================================

@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


# =========================================================
# GET ALL PATIENTS
# =========================================================

@router.get("/patients")
def get_all_patients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns all registered patients along with
    their latest diagnosis information.
    """

    patients = (
        db.query(Patient)
        .join(User, Patient.user_id == User.user_id)
        .order_by(Patient.patient_id.asc())
        .all()
    )

    result = []

    for patient in patients:

        # -------------------------------------------------
        # Find the latest diagnosis for this patient
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
        # Default values when patient has no diagnosis
        # -------------------------------------------------

        patient_data = {
            "patient_id": patient.patient_id,
            "user_id": patient.user_id,
            "full_name": patient.user.full_name,
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