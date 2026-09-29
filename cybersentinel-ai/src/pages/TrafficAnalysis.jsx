import React, { useState } from 'react';
import { Upload, Loader2, AlertCircle, WifiOff } from 'lucide-react';
import Header from '../components/Header';
import FileUpload from '../components/FileUpload';
import PredictionResult from '../components/PredictionResult';
import { AttackDistributionPieChart } from '../components/Charts';
import { analyzeCsv } from '../services/api';
import './Page.css';

// Reads VITE_API_URL at build time; falls back to localhost for local dev
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/* Convert backend summary { "BENIGN": 800, "DoS": 200 } → Recharts data */
function summaryToChartData(summary) {
  return Object.entries(summary)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
}

export default function TrafficAnalysis() {
  const [file, setFile]       = useState(null);
  const [status, setStatus]   = useState('idle'); // idle | loading | success | error
  const [result, setResult]   = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAnalyze = async () => {
    if (!file) return;
    setStatus('loading');
    setResult(null);
    setErrorMsg('');

    try {
      const data = await analyzeCsv(file);
      setResult(data);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
      setStatus('error');
    }
  };

  const handleClear = () => {
    setFile(null);
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
  };

  const chartData =
    result?.summary && Object.keys(result.summary).length > 0
      ? summaryToChartData(result.summary)
      : null;

  return (
    <div className="page">
      <Header title="Traffic Analysis" />
      <div className="page-content">

        {/* ── Upload card ── */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Upload Network Traffic CSV</h2>
            <span className="card-badge">POST {API_URL}/predict-csv</span>
          </div>
          <p className="card-desc">
            Upload a CSV file containing network traffic features (CIC-IDS2017 format, 78 features).
            The FastAPI backend will classify every record using the trained Random Forest model.
          </p>

          <FileUpload
            onFileSelect={setFile}
            selectedFile={file}
            onClear={handleClear}
          />

          <div className="upload-actions">
            <button
              className="btn-primary"
              onClick={handleAnalyze}
              disabled={!file || status === 'loading'}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Analyze Traffic
                </>
              )}
            </button>

            {file && status !== 'loading' && (
              <button className="btn-secondary" onClick={handleClear}>
                Clear
              </button>
            )}
          </div>

          {/* Error state */}
          {status === 'error' && (
            <div className="alert-error">
              <WifiOff size={16} />
              <div>
                <p className="alert-title">Analysis Failed</p>
                <p className="alert-msg">{errorMsg}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Loading state ── */}
        {status === 'loading' && (
          <div className="card loading-card">
            <Loader2 size={26} className="spin" />
            <div>
              <p className="loading-text">Sending file to backend and running classification...</p>
              <p className="loading-sub">This may take a moment for large files.</p>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {status === 'success' && result && (
          <>
            {/* Main result panel */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Analysis Results</h2>
                <span className="card-badge">{result.total_records?.toLocaleString()} records</span>
              </div>
              <PredictionResult result={result} />
            </div>

            {/* Distribution chart from real summary */}
            {chartData && (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Attack Distribution</h2>
                  <span className="card-badge">From your model output</span>
                </div>
                <AttackDistributionPieChart data={chartData} />
              </div>
            )}
          </>
        )}

        {/* ── How it works ── */}
        <div className="card info-card">
          <h3 className="info-title">How It Works</h3>
          <div className="info-steps">
            <div className="info-step">
              <span className="step-num">1</span>
              <div>
                <strong>Upload CSV</strong>
                <p>Select a network traffic CSV file in CIC-IDS2017 format (78 features per record).</p>
              </div>
            </div>
            <div className="info-step">
              <span className="step-num">2</span>
              <div>
                <strong>Classification</strong>
                <p>Each record is sent to the FastAPI backend and classified by your trained Random Forest model.</p>
              </div>
            </div>
            <div className="info-step">
              <span className="step-num">3</span>
              <div>
                <strong>Results</strong>
                <p>View confidence scores, risk levels, attack type breakdown, and per-record predictions.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
