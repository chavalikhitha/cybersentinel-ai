const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Upload a CSV file to the backend for traffic analysis.
 * POST /predict-csv
 *
 * Expected response:
 * {
 *   "total_records": 1000,
 *   "predictions": [...],
 *   "summary": { "BENIGN": 800, "DoS": 200, ... }
 * }
 */
export async function analyzeCsv(file) {
  const formData = new FormData();
  formData.append('file', file);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(`${API_URL}/predict-csv`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The backend may be processing a large file.');
    }
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error(`Backend unavailable. Make sure the FastAPI server is running at ${API_URL}`);
    }
    throw err;
  }
}

/**
 * Health check for the backend.
 * GET /health or GET /
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_URL}/health`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch recent predictions from the backend.
 * GET /api/recent-predictions?limit=50
 *
 * Proxied through the CyberSentinel FastAPI backend, which forwards
 * the request to the NovaTech live-capture backend.
 */
export async function getRecentPredictions(limit = 50) {
  try {
    const response = await fetch(`${API_URL}/api/recent-predictions?limit=${limit}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error(`Backend unavailable. Make sure the FastAPI server is running at ${API_URL}`);
    }
    throw err;
  }
}
