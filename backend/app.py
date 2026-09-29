"""
CyberSentinel AI — FastAPI Backend
====================================
Loads pre-trained Random Forest model + label encoder + feature columns
from .pkl files trained in Google Colab on the CIC-IDS2017 dataset.

Expected files (place in this same directory):
  - cybersentinel_model.pkl   → trained RandomForestClassifier
  - label_encoder.pkl         → fitted LabelEncoder for attack class names
  - feature_columns.pkl       → list of 78 feature column names (in order)

Run:
  uvicorn app:app --reload --host 127.0.0.1 --port 8000
"""

import os
import io
import joblib
import logging

import numpy as np
import pandas as pd
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="CyberSentinel AI",
    description="Network traffic classification using a pre-trained Random Forest model (CIC-IDS2017).",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS — reads ALLOWED_ORIGINS env var (comma-separated list of URLs).
# Local dev default: localhost:5173
# Production: set ALLOWED_ORIGINS=https://your-frontend.onrender.com in Render dashboard.
# ---------------------------------------------------------------------------
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]
logger.info(f"CORS allowed origins: {ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Load .pkl files at startup
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def _load_pkl(filename: str):
    path = os.path.join(BASE_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Required file not found: {filename}\n"
            f"Place your Colab-trained .pkl files in: {BASE_DIR}"
        )
    return joblib.load(path)

try:
    model          = _load_pkl("cybersentinel_model.pkl")
    label_encoder  = _load_pkl("label_encoder.pkl")
    feature_cols   = _load_pkl("feature_columns.pkl")
    logger.info("✅ All model files loaded successfully.")
    logger.info(f"   Features   : {len(feature_cols)} columns")
    logger.info(f"   Classes    : {list(label_encoder.classes_)}")
except FileNotFoundError as e:
    # Allow the server to start so /health can report the problem clearly.
    logger.warning(f"⚠️  Model not ready: {e}")
    model = label_encoder = feature_cols = None

# ---------------------------------------------------------------------------
# Risk helper
# ---------------------------------------------------------------------------
RISK_MAP = {
    "BENIGN": "LOW",
    # High-risk attacks
    "DoS Hulk": "HIGH",
    "DoS GoldenEye": "HIGH",
    "DoS Slowloris": "HIGH",
    "DoS Slowhttptest": "HIGH",
    "DDoS": "HIGH",
    "Infiltration": "HIGH",
    "Web Attack – Sql Injection": "HIGH",
    "Web Attack – XSS": "MEDIUM",
    "Web Attack – Brute Force": "MEDIUM",
    # Medium-risk attacks
    "PortScan": "MEDIUM",
    "FTP-Patator": "MEDIUM",
    "SSH-Patator": "MEDIUM",
    "Bot": "MEDIUM",
}

def get_risk(label: str) -> str:
    return RISK_MAP.get(label, "MEDIUM")

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
def root():
    return {"message": "CyberSentinel AI backend is running.", "status": "ok"}


@app.get("/health", tags=["Health"])
def health():
    ready = model is not None and label_encoder is not None and feature_cols is not None
    return {
        "status": "ready" if ready else "model_not_loaded",
        "model_loaded": model is not None,
        "label_encoder_loaded": label_encoder is not None,
        "feature_columns_loaded": feature_cols is not None,
        "num_features": len(feature_cols) if feature_cols else 0,
        "classes": list(label_encoder.classes_) if label_encoder else [],
    }


@app.post("/predict-csv", tags=["Prediction"])
async def predict_csv(file: UploadFile = File(...)):
    """
    Accept a CSV file of network traffic records and return predictions.

    The CSV must contain the same feature columns used during training.
    Missing columns are filled with 0; extra columns are ignored.

    Response schema:
    {
        "total_records": int,
        "predictions": [
            {
                "record_index": int,
                "attack_type": str,
                "confidence": float,   // 0.0 – 1.0
                "risk": str            // "LOW" | "MEDIUM" | "HIGH"
            },
            ...
        ],
        "summary": {
            "<attack_type>": int,
            ...
        }
    }
    """
    # --- Guard: model must be loaded ---
    if model is None or label_encoder is None or feature_cols is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Model files are not loaded. "
                "Place cybersentinel_model.pkl, label_encoder.pkl, and "
                "feature_columns.pkl in the backend directory and restart the server."
            ),
        )

    # --- Read uploaded CSV ---
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted.")

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    if df.empty:
        raise HTTPException(status_code=400, detail="The uploaded CSV file is empty.")

    logger.info(f"Received CSV: {file.filename} | Rows: {len(df)} | Cols: {len(df.columns)}")

    # --- Strip whitespace from column names (common Colab export issue) ---
    df.columns = df.columns.str.strip()

    # --- Align columns to training feature order ---
    # Drop any label/target column if present
    label_col_candidates = ["Label", "label", " Label"]
    for col in label_col_candidates:
        if col in df.columns:
            df = df.drop(columns=[col])

    # Keep only training features; fill missing with 0
    missing_cols = [c for c in feature_cols if c not in df.columns]
    if missing_cols:
        logger.warning(f"Missing {len(missing_cols)} feature columns — filling with 0: {missing_cols[:5]}...")

    X = df.reindex(columns=feature_cols, fill_value=0)

    # Replace inf / NaN values
    X = X.replace([np.inf, -np.inf], np.nan).fillna(0)

    # --- Predict ---
    try:
        probabilities = model.predict_proba(X)          # shape: (n_rows, n_classes)
        predicted_indices = np.argmax(probabilities, axis=1)
        predicted_labels = label_encoder.inverse_transform(predicted_indices)
        confidences = probabilities[np.arange(len(probabilities)), predicted_indices]
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

    # --- Build response ---
    predictions = []
    summary: dict[str, int] = {}

    for i, (label, conf) in enumerate(zip(predicted_labels, confidences)):
        risk = get_risk(label)
        predictions.append({
            "record_index": i,
            "attack_type": label,
            "confidence": round(float(conf), 4),
            "risk": risk,
        })
        summary[label] = summary.get(label, 0) + 1

    return JSONResponse(content={
        "total_records": len(df),
        "predictions": predictions,
        "summary": summary,
    })
