import os
import uuid
import io
import json
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status
)

from fastapi.responses import FileResponse

from PIL import Image

from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.database.models import (
    User,
    Patient,
    Diagnosis,
    MedicalReport
)

from app.services.model_service import predict_image
from app.services.report_service import generate_medical_report


BASE_DIR = Path(__file__).resolve().parents[2]


# ============================================================
# ROUTER CONFIGURATION
# ============================================================

router = APIRouter(
    prefix="/diagnosis",
    tags=["Diagnosis"]
)


# ============================================================
# FILE UPLOAD CONFIGURATION
# ============================================================

# Directory where uploaded X-ray images will be stored.
UPLOAD_DIR = str(BASE_DIR / "uploads")

# Maximum allowed X-ray file size.
# 10 MB is sufficient for the prototype.
MAX_FILE_SIZE = 10 * 1024 * 1024


# Allowed file extensions.
ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png"
}


# Allowed MIME/content types.
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png"
}


# ============================================================
# HELPER FUNCTION
# ============================================================

def get_owned_patient(
    patient_id: int,
    current_user: User,
    db: Session
):
    """
    Retrieve a patient only if the patient belongs to
    the currently logged-in physician.

    This is an important security check.

    A physician must not be able to access another
    physician's patients simply by changing patient_id.
    """

    patient = (
        db.query(Patient)
        .filter(
            Patient.patient_id == patient_id,
            Patient.created_by == current_user.user_id
        )
        .first()
    )

    return patient


# ============================================================
# UPLOAD + AI ANALYSIS
# ============================================================

@router.post("/upload")
async def upload_xray(
    file: UploadFile = File(...),

    # --------------------------------------------------------
    # NEW:
    # The frontend now sends patient_id instead of age/gender.
    # --------------------------------------------------------

    patient_id: int = Form(...),

    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # ========================================================
    # 1. FIND AND VERIFY PATIENT
    # ========================================================

    """
    We do NOT trust patient information from the frontend.

    The frontend only sends patient_id.

    The backend verifies:
        patient exists
        AND
        patient belongs to current physician
    """

    patient = get_owned_patient(
        patient_id=patient_id,
        current_user=current_user,
        db=db
    )

    if patient is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found or you do not have access to this patient."
        )


    # ========================================================
    # 2. VALIDATE PATIENT INFORMATION
    # ========================================================

    # Age and gender are now taken from the Patient table.
    # They are NOT supplied by the X-ray upload form.

    if patient.age is None:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient age is missing. Please update the patient information."
        )


    if patient.gender is None:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient gender is missing. Please update the patient information."
        )


    # ========================================================
    # 3. VALIDATE FILE CONTENT TYPE
    # ========================================================

    if file.content_type not in ALLOWED_CONTENT_TYPES:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, JPEG and PNG images are allowed."
        )


    # ========================================================
    # 4. READ UPLOADED FILE
    # ========================================================

    file_data = await file.read()


    # ========================================================
    # 5. VALIDATE FILE SIZE
    # ========================================================

    if len(file_data) > MAX_FILE_SIZE:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must not exceed 10 MB."
        )


    # ========================================================
    # 6. VALIDATE ACTUAL IMAGE
    # ========================================================

    try:

        image = Image.open(
            io.BytesIO(file_data)
        )

        # Verify that the file is a valid image.
        image.verify()

    except Exception:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or corrupted image file."
        )


    # ========================================================
    # 7. VALIDATE FILE EXTENSION
    # ========================================================

    extension = os.path.splitext(
        file.filename or ""
    )[1].lower()


    if extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file extension."
        )


    # ========================================================
    # 8. CREATE UPLOAD DIRECTORY
    # ========================================================

    os.makedirs(
        UPLOAD_DIR,
        exist_ok=True
    )


    # ========================================================
    # 9. GENERATE UNIQUE FILE NAME
    # ========================================================

    """
    UUID prevents filename collisions and avoids trusting
    the original filename supplied by the user.
    """

    unique_filename = (
        f"{uuid.uuid4()}{extension}"
    )


    file_path = os.path.join(
        UPLOAD_DIR,
        unique_filename
    )


    # ========================================================
    # 10. SAVE X-RAY IMAGE
    # ========================================================

    with open(
        file_path,
        "wb"
    ) as buffer:

        buffer.write(file_data)


    # ========================================================
    # 11. OPEN IMAGE FOR AI ANALYSIS
    # ========================================================

    try:

        image = Image.open(
            file_path
        ).convert("RGB")

    except Exception:

        # Remove invalid uploaded file.
        if os.path.exists(file_path):

            os.remove(file_path)

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to process uploaded image."
        )


    # ========================================================
    # 12. RUN DENSENET121 AI MODEL
    # ========================================================

    try:

        prediction_result = predict_image(
            image
        )

    except Exception as e:

        # ----------------------------------------------------
        # If AI prediction fails, remove uploaded image.
        # ----------------------------------------------------

        if os.path.exists(file_path):

            os.remove(file_path)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model prediction failed. Please try again later."
        )


    # ========================================================
    # 13. EXTRACT AI ANALYSIS
    # ========================================================

    result = prediction_result["result"]

    findings = prediction_result["findings"]

    top_predictions = prediction_result["top_predictions"]

    all_predictions = prediction_result["all_predictions"]


    # ========================================================
    # 14. DETERMINE PRIMARY PREDICTED DISEASE
    # ========================================================

    if result["status"] == "NORMAL":

        predicted_disease = "No abnormality detected"

        # ----------------------------------------------------
        # For NORMAL result, confidence is represented as 1.0
        # for compatibility with the existing database model.
        # ----------------------------------------------------

        confidence_score = 1.0

    else:

        # ----------------------------------------------------
        # The first finding is the highest-probability finding.
        # ----------------------------------------------------

        predicted_disease = findings[0]["disease"]

        confidence_score = (
            findings[0]["probability"] / 100
        )


    # ========================================================
    # 15. CREATE DIAGNOSIS DATABASE RECORD
    # ========================================================

    """
    The diagnosis is directly associated with the selected
    patient through patient_id.
    """

    diagnosis = Diagnosis(

        patient_id=patient.patient_id,

        image_path=file_path,

        predicted_disease=predicted_disease,

        confidence_score=confidence_score,

        result_status=result["status"],

        findings_json=json.dumps(
            findings
        ),

        all_predictions_json=json.dumps(
            all_predictions
        ),

        heatmap_path=None
    )


    db.add(diagnosis)

    db.flush()


    # ========================================================
    # 16. CREATE MEDICAL REPORT DATABASE RECORD
    # ========================================================

    medical_report = MedicalReport(

        diagnosis_id=diagnosis.diagnosis_id,

        # Temporary value.
        # It will be replaced after PDF generation.
        report_path="pending"
    )


    db.add(medical_report)

    db.flush()


    # ========================================================
    # 17. GENERATE MEDICAL REPORT PDF
    # ========================================================

    try:

        generated_report_path = generate_medical_report(

            report_id=medical_report.report_id,

            diagnosis=diagnosis,

            patient=patient,

            user=current_user
        )

    except Exception as e:

        # ----------------------------------------------------
        # Roll back database changes.
        # ----------------------------------------------------

        db.rollback()


        # ----------------------------------------------------
        # Remove uploaded X-ray if report generation fails.
        # ----------------------------------------------------

        if os.path.exists(file_path):

            os.remove(file_path)


        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Medical report generation failed: {str(e)}"
        )


    # ========================================================
    # 18. SAVE GENERATED REPORT PATH
    # ========================================================

    medical_report.report_path = (
        generated_report_path
    )


    # ========================================================
    # 19. COMMIT DATABASE TRANSACTION
    # ========================================================

    db.commit()


    # Refresh objects so generated IDs and database values
    # are available in the response.

    db.refresh(diagnosis)

    db.refresh(medical_report)


    # ========================================================
    # 20. RETURN ANALYSIS RESPONSE
    # ========================================================

    return {

        "message":
            "X-ray uploaded and analyzed successfully",

        # ----------------------------------------------------
        # Patient information
        # ----------------------------------------------------

        "patient_id":
            patient.patient_id,

        "patient_name":
            patient.full_name,

        "age":
            patient.age,

        "gender":
            patient.gender,

        # ----------------------------------------------------
        # Diagnosis information
        # ----------------------------------------------------

        "diagnosis_id":
            diagnosis.diagnosis_id,

        "report_id":
            medical_report.report_id,

        "filename":
            unique_filename,

        # ----------------------------------------------------
        # AI result
        # ----------------------------------------------------

        "result":
            result,

        "predicted_disease":
            predicted_disease,

        "confidence_score":
            round(
                confidence_score * 100,
                2
            ),

        "findings":
            findings,

        "top_predictions":
            top_predictions,

        "all_predictions":
            all_predictions,

        # ----------------------------------------------------
        # Audit information
        # ----------------------------------------------------

        "uploaded_by":
            current_user.user_id
    }


# ============================================================
# DASHBOARD STATISTICS
# ============================================================

@router.get("/dashboard-stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    """
    Returns statistics for the logged-in physician.

    IMPORTANT:
    The old implementation treated the logged-in user
    as a patient.

    The new implementation treats the logged-in user
    as a physician and aggregates statistics across
    that physician's patients.
    """

    # ========================================================
    # GET PHYSICIAN'S PATIENTS
    # ========================================================

    patients = (
        db.query(Patient)
        .filter(
            Patient.created_by == current_user.user_id
        )
        .all()
    )


    # If physician has no patients yet,
    # return zero statistics.

    if not patients:

        return {
            "total_patients": 0,
            "total_analyses": 0,
            "abnormal_results": 0,
            "normal_results": 0
        }


    # ========================================================
    # GET PATIENT IDS
    # ========================================================

    patient_ids = [
        patient.patient_id
        for patient in patients
    ]


    # ========================================================
    # TOTAL ANALYSES
    # ========================================================

    total_analyses = (
        db.query(Diagnosis)
        .filter(
            Diagnosis.patient_id.in_(patient_ids)
        )
        .count()
    )


    # ========================================================
    # ABNORMAL ANALYSES
    # ========================================================

    abnormal_results = (
        db.query(Diagnosis)
        .filter(
            Diagnosis.patient_id.in_(patient_ids),
            Diagnosis.result_status == "ABNORMAL"
        )
        .count()
    )


    # ========================================================
    # NORMAL ANALYSES
    # ========================================================

    normal_results = (
        db.query(Diagnosis)
        .filter(
            Diagnosis.patient_id.in_(patient_ids),
            Diagnosis.result_status == "NORMAL"
        )
        .count()
    )


    # ========================================================
    # RETURN DASHBOARD STATISTICS
    # ========================================================

    return {

        "total_patients":
            len(patient_ids),

        "total_analyses":
            total_analyses,

        "abnormal_results":
            abnormal_results,

        "normal_results":
            normal_results
    }


# ============================================================
# DOWNLOAD MEDICAL REPORT
# ============================================================

@router.get("/report/{report_id}")
def download_medical_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    """
    Downloads a medical report only if the report belongs
    to a patient created by the logged-in physician.
    """

    # ========================================================
    # FIND REPORT + ASSOCIATED PATIENT
    # ========================================================

    medical_report = (
        db.query(MedicalReport)
        .join(
            Diagnosis,
            MedicalReport.diagnosis_id ==
            Diagnosis.diagnosis_id
        )
        .join(
            Patient,
            Diagnosis.patient_id ==
            Patient.patient_id
        )
        .filter(
            MedicalReport.report_id == report_id,
            Patient.created_by == current_user.user_id
            if current_user.role != "ADMIN"
            else True
        )
        .first()
    )


    # ========================================================
    # REPORT NOT FOUND / UNAUTHORIZED
    # ========================================================

    if medical_report is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical report not found"
        )


    # ========================================================
    # CHECK REPORT PATH
    # ========================================================

    if not medical_report.report_path:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical report file is not available"
        )


    # ========================================================
    # CHECK ACTUAL PDF FILE
    # ========================================================

    report_path = Path(medical_report.report_path).resolve()
    reports_root = (BASE_DIR / "reports").resolve()

    try:
        report_path.relative_to(reports_root)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical report file could not be found"
        )

    if not report_path.is_file():

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical report file could not be found"
        )


    # ========================================================
    # RETURN PDF
    # ========================================================

    return FileResponse(

        path=str(report_path),

        media_type="application/pdf",

        filename=(
            f"MedVisionAI_Report_{report_id}.pdf"
        )
    )


# ============================================================
# GET DIAGNOSIS HISTORY
# ============================================================

@router.get("/history")
def get_diagnosis_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    """
    Returns all X-ray analyses belonging to patients
    created by the logged-in physician.

    Each history item contains patient information so the
    frontend can display the patient's name.
    """

    # ========================================================
    # GET PHYSICIAN'S PATIENTS
    # ========================================================

    patients = (
        db.query(Patient)
        .filter(
            Patient.created_by == current_user.user_id
        )
        .all()
    )


    # ========================================================
    # NO PATIENTS
    # ========================================================

    if not patients:

        return {
            "total_reports": 0,
            "history": []
        }


    # ========================================================
    # GET PATIENT IDS
    # ========================================================

    patient_ids = [
        patient.patient_id
        for patient in patients
    ]


    # Create a dictionary so we can quickly get
    # patient details for each diagnosis.

    patient_map = {
        patient.patient_id: patient
        for patient in patients
    }


    # ========================================================
    # GET ALL DIAGNOSES
    # ========================================================

    diagnoses = (
        db.query(Diagnosis)
        .filter(
            Diagnosis.patient_id.in_(patient_ids)
        )
        .order_by(
            Diagnosis.diagnosis_timestamp.desc()
        )
        .all()
    )


    # ========================================================
    # PREPARE HISTORY RESPONSE
    # ========================================================

    history = []


    for diagnosis in diagnoses:

        # ----------------------------------------------------
        # Get patient
        # ----------------------------------------------------

        patient = patient_map.get(
            diagnosis.patient_id
        )


        if patient is None:

            continue


        # ----------------------------------------------------
        # Parse stored findings JSON
        # ----------------------------------------------------

        try:

            findings = json.loads(
                diagnosis.findings_json
            )

        except Exception:

            findings = []


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
        # Add history record
        # ----------------------------------------------------

        history.append({

            "diagnosis_id":
                diagnosis.diagnosis_id,

            "report_id":
                medical_report.report_id
                if medical_report
                else None,

            # ------------------------------------------------
            # Patient information
            # ------------------------------------------------

            "patient_id":
                patient.patient_id,

            "patient_name":
                patient.full_name,

            "patient_age":
                patient.age,

            "patient_gender":
                patient.gender,

            # ------------------------------------------------
            # Diagnosis information
            # ------------------------------------------------

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

            "image_path":
                diagnosis.image_path,

            "timestamp":
                diagnosis.diagnosis_timestamp,

            # Keep the explicit database field name available to newer
            # clients while retaining timestamp for existing dashboard UI.
            "diagnosis_timestamp":
                diagnosis.diagnosis_timestamp
        })


    # ========================================================
    # RETURN HISTORY
    # ========================================================

    return {

        "total_reports":
            len(history),

        "history":
            history
    }


# ============================================================
# GET SINGLE DIAGNOSIS
# ============================================================

@router.get("/{diagnosis_id}")
def get_diagnosis(
    diagnosis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    """
    Returns a single diagnosis.

    Access is granted only if the diagnosis belongs
    to a patient created by the logged-in physician.
    """

    # ========================================================
    # FIND DIAGNOSIS
    # ========================================================

    diagnosis = (
        db.query(Diagnosis)
        .join(
            Patient,
            Diagnosis.patient_id ==
            Patient.patient_id
        )
        .filter(
            Diagnosis.diagnosis_id == diagnosis_id,
            Patient.created_by == current_user.user_id
        )
        .first()
    )


    # ========================================================
    # DIAGNOSIS NOT FOUND / UNAUTHORIZED
    # ========================================================

    if diagnosis is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diagnosis not found"
        )


    # ========================================================
    # GET ASSOCIATED MEDICAL REPORT
    # ========================================================

    medical_report = (
        db.query(MedicalReport)
        .filter(
            MedicalReport.diagnosis_id ==
            diagnosis.diagnosis_id
        )
        .first()
    )


    # ========================================================
    # GET PATIENT
    # ========================================================

    patient = (
        db.query(Patient)
        .filter(
            Patient.patient_id ==
            diagnosis.patient_id
        )
        .first()
    )


    # ========================================================
    # PARSE JSON FIELDS
    # ========================================================

    try:

        findings = json.loads(
            diagnosis.findings_json
        )

    except Exception:

        findings = []


    try:

        all_predictions = json.loads(
            diagnosis.all_predictions_json
        )

    except Exception:

        all_predictions = []


    # ========================================================
    # RETURN COMPLETE DIAGNOSIS
    # ========================================================

    return {

        # ----------------------------------------------------
        # Diagnosis
        # ----------------------------------------------------

        "diagnosis_id":
            diagnosis.diagnosis_id,

        "report_id":
            medical_report.report_id
            if medical_report
            else None,

        # ----------------------------------------------------
        # Patient
        # ----------------------------------------------------

        "patient_id":
            diagnosis.patient_id,

        "patient_name":
            patient.full_name
            if patient
            else None,

        "patient_age":
            patient.age
            if patient
            else None,

        "patient_gender":
            patient.gender
            if patient
            else None,

        # ----------------------------------------------------
        # X-ray
        # ----------------------------------------------------

        "image_path":
            diagnosis.image_path,

        # ----------------------------------------------------
        # AI result
        # ----------------------------------------------------

        "result_status":
            diagnosis.result_status,

        "predicted_disease":
            diagnosis.predicted_disease,

        "confidence_score":
            round(
                diagnosis.confidence_score * 100,
                2
            ),

        "findings":
            findings,

        "all_predictions":
            all_predictions,

        "heatmap_path":
            diagnosis.heatmap_path,

        "diagnosis_timestamp":
            diagnosis.diagnosis_timestamp,

        # ----------------------------------------------------
        # Medical safety disclaimer
        # ----------------------------------------------------

        "ai_disclaimer":
            "This AI-generated assessment is for "
            "research and clinical decision-support "
            "purposes only and is not a definitive "
            "medical diagnosis."
    }
