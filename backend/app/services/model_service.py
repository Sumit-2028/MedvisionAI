import os

import torch
import torch.nn as nn
from torchvision.models import densenet121
from torchvision import transforms
from PIL import Image


# ============================================================
# DISEASES
# ============================================================

DISEASES = [
    "Atelectasis",
    "Cardiomegaly",
    "Effusion",
    "Infiltration",
    "Mass",
    "Nodule",
    "Pneumonia",
    "Pneumothorax",
    "Consolidation",
    "Edema",
    "Emphysema",
    "Fibrosis",
    "Pleural_Thickening",
    "Hernia"
]


# ============================================================
# MODEL PATH
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "MedVisionAI_DenseNet121_best.pth"
)


# ============================================================
# DEVICE
# ============================================================

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)


# ============================================================
# IMAGE TRANSFORMATION
# Same preprocessing used during training
# ============================================================

transform = transforms.Compose([
    transforms.Resize((224, 224)),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ============================================================
# LOAD MODEL
# ============================================================

def load_model():

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model file not found: {MODEL_PATH}"
        )

    model = densenet121(weights=None)

    model.classifier = nn.Linear(
        model.classifier.in_features,
        len(DISEASES)
    )

    checkpoint = torch.load(
        MODEL_PATH,
        map_location=device,
        weights_only=False
    )

    # --------------------------------------------------------
    # Handle different checkpoint formats
    # --------------------------------------------------------

    if isinstance(checkpoint, dict):

        if "model_state_dict" in checkpoint:

            state_dict = checkpoint["model_state_dict"]

        elif "state_dict" in checkpoint:

            state_dict = checkpoint["state_dict"]

        else:

            state_dict = checkpoint

    else:

        raise ValueError(
            "Unsupported model checkpoint format"
        )


    # --------------------------------------------------------
    # Remove DataParallel prefix if present
    # --------------------------------------------------------

    cleaned_state_dict = {}

    for key, value in state_dict.items():

        if key.startswith("module."):
            key = key[7:]

        cleaned_state_dict[key] = value


    # --------------------------------------------------------
    # Load weights
    # --------------------------------------------------------

    model.load_state_dict(
        cleaned_state_dict,
        strict=True
    )

    model.to(device)

    model.eval()

    return model


model = load_model()


# ============================================================
# PROTOTYPE THRESHOLD
# ============================================================

# For now we use 0.50 as a simple prototype threshold.
#
# IMPORTANT:
# These are NOT clinically validated thresholds.
# Later we can calculate disease-specific thresholds
# using validation-set predictions.

DEFAULT_THRESHOLD = 0.50


# ============================================================
# PREDICT IMAGE
# ============================================================

def predict_image(image: Image.Image):

    image = image.convert("RGB")

    image_tensor = transform(image)

    image_tensor = image_tensor.unsqueeze(0)

    image_tensor = image_tensor.to(device)


    # --------------------------------------------------------
    # Model inference
    # --------------------------------------------------------

    with torch.no_grad():

        logits = model(image_tensor)

        probabilities = torch.sigmoid(logits)


    probabilities = probabilities[0].cpu().numpy()


    # --------------------------------------------------------
    # Create predictions
    # --------------------------------------------------------

    predictions = {}

    for disease, probability in zip(
        DISEASES,
        probabilities
    ):

        predictions[disease] = float(probability)


    # --------------------------------------------------------
    # Detect positive findings
    # --------------------------------------------------------

    findings = []

    for disease, probability in predictions.items():

        if probability >= DEFAULT_THRESHOLD:

            findings.append({
                "disease": disease,
                "probability": round(
                    probability * 100,
                    2
                ),
                "status": "positive"
            })


    # --------------------------------------------------------
    # Sort findings by probability
    # --------------------------------------------------------

    findings.sort(
        key=lambda x: x["probability"],
        reverse=True
    )


    # --------------------------------------------------------
    # NORMAL / ABNORMAL
    # --------------------------------------------------------

    if len(findings) == 0:

        result = {
            "status": "NORMAL",
            "summary": "No abnormality detected"
        }

    else:

        result = {
            "status": "ABNORMAL",
            "summary": "Potential abnormality detected"
        }


    # --------------------------------------------------------
    # Top prediction
    # --------------------------------------------------------

    sorted_predictions = sorted(
        predictions.items(),
        key=lambda x: x[1],
        reverse=True
    )


    top_predictions = []

    for disease, probability in sorted_predictions[:5]:

        top_predictions.append({
            "disease": disease,
            "probability": round(
                probability * 100,
                2
            )
        })


    # --------------------------------------------------------
    # Return complete result
    # --------------------------------------------------------

    return {

        "result": result,

        "findings": findings,

        "top_predictions": top_predictions,

        "all_predictions": {
            disease: round(
                probability * 100,
                2
            )

            for disease, probability
            in predictions.items()
        }

    }