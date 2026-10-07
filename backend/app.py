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

import httpx
import numpy as np
import pandas as pd
from collections import deque
from datetime import datetime
from typing import Any
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# NovaTech backend URL — the source of live traffic predictions.
# Override via env var when running on Render or changing the port.
# ---------------------------------------------------------------------------
NOVATECH_URL = os.getenv("NOVATECH_URL", "http://127.0.0.1:8001")

# In-memory history for live captured flow predictions
MAX_HISTORY = 500
PREDICTION_HISTORY: deque[dict[str, Any]] = deque(maxlen=MAX_HISTORY)

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
    allow_origin_regex=r"https://.*\.onrender\.com",
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
        "returned_predictions": int,
        "predictions_truncated": bool,
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
        df = pd.read_csv(io.BytesIO(contents), low_memory=False)
    except UnicodeDecodeError:
        try:
            df = pd.read_csv(io.BytesIO(contents), encoding="latin-1", low_memory=False)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    if df.empty:
        raise HTTPException(status_code=400, detail="The uploaded CSV file is empty.")

    total_rows = len(df)
    logger.info(f"Received CSV: {file.filename} | Rows: {total_rows} | Cols: {len(df.columns)}")

    # --- Strip whitespace from column names (common Colab export issue) ---
    df.columns = df.columns.str.strip()

    # --- Align columns to training feature order ---
    # Drop any label/target column if present
    label_col_candidates = ["Label", "label", " Label", "LABEL"]
    for col in label_col_candidates:
        if col in df.columns:
            df = df.drop(columns=[col])

    # Keep only training features; fill missing with 0
    missing_cols = [c for c in feature_cols if c not in df.columns]
    if missing_cols:
        logger.warning(f"Missing {len(missing_cols)} feature columns — filling with 0: {missing_cols[:5]}...")

    X = df.reindex(columns=feature_cols, fill_value=0)

    # Coerce any dirty non-numeric strings ('Infinity', 'NaN', spaces) to numeric and clean
    X = X.apply(pd.to_numeric, errors="coerce")
    X = X.replace([np.inf, -np.inf], np.nan).fillna(0).astype(np.float32)

    # --- Batch Prediction (5,000 rows per chunk) ---
    BATCH_SIZE = 5000
    MAX_PER_RECORD_LIMIT = 1000
    is_large_dataset = total_rows > 10000

    predictions = []
    summary: dict[str, int] = {}

    logger.info(f"Processing {total_rows} records in batches of {BATCH_SIZE} (truncated per-record list: {is_large_dataset})...")

    try:
        for start_idx in range(0, total_rows, BATCH_SIZE):
            end_idx = min(start_idx + BATCH_SIZE, total_rows)
            X_batch = X.iloc[start_idx:end_idx]

            probabilities = model.predict_proba(X_batch)
            predicted_indices = np.argmax(probabilities, axis=1)
            predicted_labels = label_encoder.inverse_transform(predicted_indices)
            confidences = probabilities[np.arange(len(probabilities)), predicted_indices]

            for i_offset, (label, conf) in enumerate(zip(predicted_labels, confidences)):
                global_index = start_idx + i_offset
                risk = get_risk(label)

                # For large datasets (>10,000), return only the first 1,000 per-record predictions
                # to prevent multi-megabyte payloads that cause browser network timeouts.
                if not is_large_dataset or len(predictions) < MAX_PER_RECORD_LIMIT:
                    predictions.append({
                        "record_index": global_index,
                        "attack_type": label,
                        "confidence": round(float(conf), 4),
                        "risk": risk,
                    })

                # Summary is computed across ALL records in the dataset
                summary[label] = summary.get(label, 0) + 1

    except Exception as e:
        logger.error(f"Prediction error during batch processing: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

    logger.info(f"Analysis complete for {total_rows} records. Summary: {summary} | Returned predictions: {len(predictions)}")

    return JSONResponse(content={
        "total_records": total_rows,
        "returned_predictions": len(predictions),
        "predictions_truncated": is_large_dataset,
        "predictions": predictions,
        "summary": summary,
    })

# ---------------------------------------------------------------------------
# Live Traffic Ingestion & Recent Predictions
# ---------------------------------------------------------------------------

@app.post("/api/ingest-flow", tags=["Live Traffic"])
async def ingest_flow(request: Request):
    """
    Receives a single network flow feature dictionary (78 CIC-IDS2017 features)
    from the capture script, runs the Random Forest model prediction,
    and stores the result for /api/recent-predictions.
    """
    if model is None or label_encoder is None or feature_cols is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Model files are not loaded. "
                "Place cybersentinel_model.pkl, label_encoder.pkl, and "
                "feature_columns.pkl in the backend directory."
            ),
        )

    try:
        body = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {e}")

    if isinstance(body, list):
        if not body:
            raise HTTPException(status_code=400, detail="Empty list received")
        feat_dict = body[0]
    elif isinstance(body, dict):
        feat_dict = body
    else:
        raise HTTPException(status_code=400, detail="Expected JSON dictionary of features")

    # Align columns to training feature order
    df = pd.DataFrame([feat_dict])
    df.columns = df.columns.str.strip()

    # Drop any label column if present
    for col in ["Label", "label", " Label"]:
        if col in df.columns:
            df = df.drop(columns=[col])

    X = df.reindex(columns=feature_cols, fill_value=0)
    X = X.replace([np.inf, -np.inf], np.nan).fillna(0)

    try:
        probabilities = model.predict_proba(X)
        pred_idx = int(np.argmax(probabilities, axis=1)[0])
        label = str(label_encoder.inverse_transform([pred_idx])[0])
        conf = float(probabilities[0, pred_idx])
    except Exception as e:
        logger.error(f"Prediction error during ingest-flow: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

    risk = get_risk(label)
    timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    record = {
        "record_index": len(PREDICTION_HISTORY),
        "timestamp": timestamp_str,
        "attack_type": label,
        "prediction": label,
        "confidence": round(conf, 4),
        "risk": risk,
        "risk_level": "Low" if label == "BENIGN" else "High",
        **feat_dict,
    }

    PREDICTION_HISTORY.append(record)
    logger.info(f"Ingested live flow #{record['record_index']} → {label} ({conf:.2%}) | Risk: {risk}")

    return JSONResponse(content={
        "status": "ok",
        "message": "Flow ingested and predicted",
        "prediction": label,
        "confidence": round(conf, 4),
        "risk": risk,
    })


@app.get("/api/recent-predictions", tags=["Live Traffic"])
async def recent_predictions(limit: int = 50):
    """
    Returns the latest predictions from live traffic ingestion.
    If no local flows have been ingested yet, attempts to query NOVATECH_URL
    if running, or returns an empty list without error.
    """
    limit = max(1, min(limit, 500))

    if len(PREDICTION_HISTORY) > 0:
        entries = list(PREDICTION_HISTORY)[-limit:]
        return JSONResponse(content={
            "total_stored": len(PREDICTION_HISTORY),
            "returned": len(entries),
            "feature_count": len(feature_cols) if feature_cols else 0,
            "predictions": entries,
            "flows": entries,
        })

    # If no local predictions yet, check if NovaTech backend has any
    if NOVATECH_URL:
        url = f"{NOVATECH_URL}/api/recent-predictions"
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(url, params={"limit": limit})
                if resp.status_code == 200:
                    return JSONResponse(content=resp.json())
        except Exception:
            pass

    return JSONResponse(content={
        "total_stored": 0,
        "returned": 0,
        "predictions": [],
        "flows": [],
    })
