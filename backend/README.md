# CyberSentinel AI — Backend

FastAPI backend for network traffic classification using a pre-trained Random Forest model.

## Folder Structure

```
backend/
├── app.py                    ← FastAPI application
├── requirements.txt          ← Python dependencies
├── cybersentinel_model.pkl   ← ⬅ Place your Colab-trained model here
├── label_encoder.pkl         ← ⬅ Place your Colab-trained encoder here
└── feature_columns.pkl       ← ⬅ Place your Colab-trained feature list here
```

> **The three `.pkl` files are NOT included.** Copy them from your Google Colab output into this folder before starting the server.

---

## Setup

### 1. Create a virtual environment (recommended)
```bash
cd "/Applications/Coding/DWDM PROJECT/backend"
python3 -m venv venv
source venv/bin/activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Place your `.pkl` files
Copy these three files from your Colab into the `backend/` folder:
- `cybersentinel_model.pkl`
- `label_encoder.pkl`
- `feature_columns.pkl`

### 4. Start the server
```bash
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

Server runs at: **http://127.0.0.1:8000**

---

## API Endpoints

### `GET /health`
Returns model load status.
```json
{
  "status": "ready",
  "model_loaded": true,
  "label_encoder_loaded": true,
  "feature_columns_loaded": true,
  "num_features": 78,
  "classes": ["BENIGN", "Bot", "DDoS", ...]
}
```

### `POST /predict-csv`
Upload a CSV file for classification.

**Request:** `multipart/form-data` with `file` field (`.csv`)

**Response:**
```json
{
  "total_records": 1000,
  "predictions": [
    {
      "record_index": 0,
      "attack_type": "BENIGN",
      "confidence": 0.9921,
      "risk": "LOW"
    }
  ],
  "summary": {
    "BENIGN": 800,
    "DoS Hulk": 200
  }
}
```

---

## Notes
- The CSV must contain the same features used during training (whitespace in column names is stripped automatically).
- If your CSV has a `Label` column it will be automatically removed before prediction.
- Missing feature columns are filled with `0`.
- The server starts even if `.pkl` files are missing — `/health` will report `"status": "model_not_loaded"` and `/predict-csv` will return a clear `503` error.
