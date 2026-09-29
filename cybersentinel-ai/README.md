# CyberSentinel AI — Frontend Dashboard

A modern, professional cybersecurity dashboard for network traffic classification built with React + Vite.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | FastAPI (separate) |

## Project Structure

```
src/
├── components/
│   ├── Sidebar.jsx / .css       ← Left navigation
│   ├── Header.jsx / .css        ← Top bar with status
│   ├── StatCard.jsx / .css      ← Summary metric cards
│   ├── FileUpload.jsx / .css    ← Drag-and-drop CSV upload
│   ├── PredictionResult.jsx/.css← Backend result display
│   ├── AttackTable.jsx / .css   ← Detection log table
│   └── Charts.jsx / .css        ← Recharts chart components
├── pages/
│   ├── Dashboard.jsx            ← Overview with stat cards + pie chart
│   ├── TrafficAnalysis.jsx      ← CSV upload + API call + results
│   ├── Analytics.jsx            ← 4 charts + dataset stats
│   ├── AttackDetection.jsx      ← Searchable/filterable detection table
│   ├── About.jsx                ← Project info + scope
│   └── Page.css                 ← Shared page styles
├── services/
│   └── api.js                   ← FastAPI integration (POST /predict-csv)
├── App.jsx                      ← Router + layout
├── App.css                      ← App-level layout CSS
├── main.jsx                     ← Entry point
└── index.css                    ← Global reset + fonts
```

## Getting Started

### 1. Install dependencies
```bash
cd cybersentinel-ai
npm install
```

### 2. Configure backend URL
Edit `.env`:
```
VITE_API_URL=http://127.0.0.1:8000
```

### 3. Run development server
```bash
npm run dev
```

Open: http://localhost:5173

### 4. Build for production
```bash
npm run build
```

## Backend API

The frontend expects a FastAPI backend running at `http://127.0.0.1:8000`.

### Endpoint: `POST /predict-csv`

**Request:** `multipart/form-data` with a `file` field (CSV)

**Response:**
```json
{
  "total_records": 1000,
  "predictions": [
    {
      "attack_type": "DoS Hulk",
      "confidence": 0.97,
      "risk": "HIGH"
    }
  ],
  "summary": {
    "BENIGN": 800,
    "DoS Hulk": 200
  }
}
```

### Optional: `GET /health`
Used to verify backend availability.

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | 4 stat cards, attack pie chart, recent detections |
| `/traffic` | Traffic Analysis | CSV upload → backend analysis → results |
| `/analytics` | Analytics | 4 Recharts visualizations + dataset stats |
| `/detection` | Attack Detection | Searchable/filterable full detection table |
| `/about` | About | Project details, classes, scope, tech stack |

## Design System

- **Background:** `#f8fafc` (page), `#ffffff` (cards)
- **Primary accent:** `#1d4ed8` (blue)
- **Text:** `#0f172a` (dark navy)
- **Borders:** `#e5e7eb` (light gray)
- **Success:** `#22c55e` (green)
- **Warning:** `#f59e0b` (amber)
- **Danger:** `#ef4444` (red)
