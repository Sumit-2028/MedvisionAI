import os
import uuid
import io
import json
from app.services.report_service import generate_medical_report
from sqlalchemy import func
# ============================================================
# FastAPI Imports
# ============================================================

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


router = APIRouter(
    prefix="/diagnosis",
    tags=["Diagnosis"]
)


# ============================================================
# CONFIGURATION
# ============================================================

UPLOAD_DIR = "uploads"

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png"
}

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png"
}





# ============================================================
# UPLOAD + AI ANALYSIS
# ============================================================

@router.post("/upload")
async def upload_xray(
    file: UploadFile = File(...),
    age: int = Form(...),
    gender: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # ========================================================
    # Validate patient age
    # ========================================================

    if age < 1 or age > 120:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Age must be between 1 and 120"
        )


        # ========================================================
    # Validate patient gender
    # ========================================================

    gender = gender.strip()

    allowed_genders = {
        "Male",
        "Female",
        "Other",
        "Prefer not to say"
    }

    if gender not in allowed_genders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gender must be Male, Female, Other, or Prefer not to say"
        )

    
    # ========================================================
    # 1. Validate content type
    # ========================================================

    if file.content_type not in ALLOWED_CONTENT_TYPES:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, JPEG and PNG images are allowed"
        )


    # ========================================================
    # 2. Read file
    # ========================================================

    file_data = await file.read()


    # ========================================================
    # 3. Validate file size
    # ========================================================

    if len(file_data) > MAX_FILE_SIZE:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must not exceed 10 MB"
        )


    # ========================================================
    # 4. Validate actual image
    # ========================================================

    try:

        image = Image.open(
            io.BytesIO(file_data)
        )

        image.verify()

    except Exception:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or corrupted image file"
        )


    # ========================================================
    # 5. Check file extension
    # ========================================================

    extension = os.path.splitext(
        file.filename or ""
    )[1].lower()


    if extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file extension"
        )


    # ========================================================
    # 6. Find patient associated with logged-in user
    # ========================================================

    patient = (
        db.query(Patient)
        .filter(
            Patient.user_id == current_user.user_id
        )
        .first()
    )


    if patient is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found. Please create your patient profile first."
        )

    # ========================================================
    # Update patient information
    # ========================================================

    patient.age = age
    patient.gender = gender

    db.flush()


    # ========================================================
    # 7. Create upload directory
    # ========================================================

    os.makedirs(
        UPLOAD_DIR,
        exist_ok=True
    )


    # ========================================================
    # 8. Generate unique filename
    # ========================================================

    unique_filename = (
        f"{uuid.uuid4()}{extension}"
    )


    file_path = os.path.join(
        UPLOAD_DIR,
        unique_filename
    )


    # ========================================================
    # 9. Save X-ray
    # ========================================================

    with open(
        file_path,
        "wb"
    ) as buffer:

        buffer.write(file_data)


    # ========================================================
    # 10. Open image for AI analysis
    # ========================================================

    try:

        image = Image.open(
            file_path
        ).convert("RGB")

    except Exception:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to process uploaded image"
        )


    # ========================================================
    # 11. Run DenseNet121
    # ========================================================

    try:

        prediction_result = predict_image(
            image
        )

    except Exception as e:

        # Remove uploaded image if prediction fails

        if os.path.exists(file_path):
            os.remove(file_path)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model prediction failed: {str(e)}"
        )


    # ========================================================
    # 12. Extract analysis
    # ========================================================

    result = prediction_result["result"]

    findings = prediction_result["findings"]

    top_predictions = prediction_result["top_predictions"]

    all_predictions = prediction_result["all_predictions"]


    # ========================================================
    # 13. Determine predicted disease
    # ========================================================

    if result["status"] == "NORMAL":

        predicted_disease = "No abnormality detected"

        confidence_score = 1.0

    else:

        predicted_disease = findings[0]["disease"]

        confidence_score = (
            findings[0]["probability"] / 100
        )


    # ========================================================
    # 14. Create Diagnosis database record
    # ========================================================

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
    # 15. Create Medical Report
    # ========================================================

    medical_report = MedicalReport(
        diagnosis_id=diagnosis.diagnosis_id,
        report_path="pending"
    )

    db.add(medical_report)
    db.flush()

    # ========================================================
    # Generate PDF report
    # ========================================================

    try:

        generated_report_path = generate_medical_report(
            report_id=medical_report.report_id,
            diagnosis=diagnosis,
            patient=patient,
            user=current_user
        )

    except Exception as e:

        db.rollback()

        if os.path.exists(file_path):
            os.remove(file_path)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Medical report generation failed: {str(e)}"
        )

    # ========================================================
    # Update report path
    # ========================================================

    medical_report.report_path = generated_report_path

    db.commit()

    db.refresh(diagnosis)
    db.refresh(medical_report)


    # ========================================================
    # 16. Return response
    # ========================================================

    return {
        "message": "X-ray uploaded and analyzed successfully",

        "patient_id": patient.patient_id,
        "diagnosis_id": diagnosis.diagnosis_id,
        "report_id": medical_report.report_id,

        "age": patient.age,
        "gender": patient.gender,

        "filename": unique_filename,

        "result": result,

        "predicted_disease": predicted_disease,

        "confidence_score": round(
            confidence_score * 100,
            2
        ),

        "findings": findings,

        "top_predictions": top_predictions,

        "all_predictions": all_predictions,

        "uploaded_by": current_user.user_id
    }


@router.get("/dashboard-stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find the logged-in user's patient profile
    patient = (
        db.query(Patient)
        .filter(Patient.user_id == current_user.user_id)
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )

    # Total analyses performed by this patient
    total_analyses = (
        db.query(Diagnosis)
        .filter(
            Diagnosis.patient_id == patient.patient_id
        )
        .count()
    )

    # Abnormal analyses
    abnormal_results = (
        db.query(Diagnosis)
        .filter(
            Diagnosis.patient_id == patient.patient_id,
            Diagnosis.result_status == "ABNORMAL"
        )
        .count()
    )

    # Normal analyses
    normal_results = (
        db.query(Diagnosis)
        .filter(
            Diagnosis.patient_id == patient.patient_id,
            Diagnosis.result_status == "NORMAL"
        )
        .count()
    )

    return {
        "total_analyses": total_analyses,
        "abnormal_results": abnormal_results,
        "normal_results": normal_results
    }

# ============================================================
# DOWNLOAD MEDICAL REPORT
# ============================================================
# Returns the generated PDF medical report.
#
# Endpoint:
# GET /diagnosis/report/{report_id}
#
# Security:
# The report must belong to the currently logged-in user.
# ============================================================

@router.get("/report/{report_id}")
def download_medical_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # Find the patient's profile for the logged-in user
    # --------------------------------------------------------

    patient = (
        db.query(Patient)
        .filter(
            Patient.user_id == current_user.user_id
        )
        .first()
    )

    if patient is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )


    # --------------------------------------------------------
    # Find the requested medical report
    # --------------------------------------------------------
    # Join through Diagnosis so we can verify that this
    # report belongs to the logged-in patient's diagnosis.
    # --------------------------------------------------------

    medical_report = (
        db.query(MedicalReport)
        .join(
            Diagnosis,
            MedicalReport.diagnosis_id ==
            Diagnosis.diagnosis_id
        )
        .filter(
            MedicalReport.report_id == report_id,
            Diagnosis.patient_id == patient.patient_id
        )
        .first()
    )


    # --------------------------------------------------------
    # Report does not exist or does not belong to user
    # --------------------------------------------------------

    if medical_report is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical report not found"
        )


    # --------------------------------------------------------
    # Check that the PDF path exists in the database
    # --------------------------------------------------------

    if not medical_report.report_path:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical report file is not available"
        )


    # --------------------------------------------------------
    # Check that the actual PDF file exists
    # --------------------------------------------------------

    if not os.path.exists(medical_report.report_path):

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical report file could not be found"
        )


    # --------------------------------------------------------
    # Return the PDF file
    # --------------------------------------------------------

    return FileResponse(
        path=medical_report.report_path,
        media_type="application/pdf",
        filename=f"MedVisionAI_Report_{report_id}.pdf"
    )

# ============================================================
# GET DIAGNOSIS HISTORY
# ============================================================
# Returns all previous X-ray analyses for the logged-in
# patient's account.
#
# Each history record also includes report_id so the frontend
# can download the corresponding generated PDF report.
# ============================================================

@router.get("/history")
def get_diagnosis_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # Find patient belonging to logged-in user
    # --------------------------------------------------------

    patient = (
        db.query(Patient)
        .filter(
            Patient.user_id == current_user.user_id
        )
        .first()
    )

    if patient is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )


    # --------------------------------------------------------
    # Get all diagnoses for this patient
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
    # Prepare history response
    # --------------------------------------------------------

    history = []


    for diagnosis in diagnoses:

        # ----------------------------------------------------
        # Parse stored findings JSON
        # ----------------------------------------------------

        findings = json.loads(
            diagnosis.findings_json
        )


        # ----------------------------------------------------
        # Find the medical report associated with this
        # diagnosis.
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
        # Add diagnosis + report information
        # ----------------------------------------------------

        history.append({

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

            "image_path":
                diagnosis.image_path,

            "timestamp":
                diagnosis.diagnosis_timestamp

        })


    # --------------------------------------------------------
    # Return history
    # --------------------------------------------------------

    return {

        "patient_id":
            patient.patient_id,

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

    # --------------------------------------------------------
    # Find patient belonging to logged-in user
    # --------------------------------------------------------

    patient = (
        db.query(Patient)
        .filter(
            Patient.user_id == current_user.user_id
        )
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )


    # --------------------------------------------------------
    # Find diagnosis belonging to this patient
    # --------------------------------------------------------

    diagnosis = (
        db.query(Diagnosis)
        .filter(
            Diagnosis.diagnosis_id == diagnosis_id,
            Diagnosis.patient_id == patient.patient_id
        )
        .first()
    )


    if diagnosis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diagnosis not found"
        )


    # --------------------------------------------------------
    # Get medical report
    # --------------------------------------------------------

    medical_report = (
        db.query(MedicalReport)
        .filter(
            MedicalReport.diagnosis_id ==
            diagnosis.diagnosis_id
        )
        .first()
    )


    # --------------------------------------------------------
    # Parse JSON fields
    # --------------------------------------------------------

    findings = json.loads(
        diagnosis.findings_json
    )

    all_predictions = json.loads(
        diagnosis.all_predictions_json
    )


    # --------------------------------------------------------
    # Return complete diagnosis
    # --------------------------------------------------------

    return {

        "diagnosis_id":
            diagnosis.diagnosis_id,

        "report_id":
            medical_report.report_id
            if medical_report
            else None,

        "patient_id":
            diagnosis.patient_id,

        "image_path":
            diagnosis.image_path,

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

        "ai_disclaimer":
            "This AI-generated assessment is for "
            "research and decision-support purposes "
            "and is not a definitive medical diagnosis."
    }

