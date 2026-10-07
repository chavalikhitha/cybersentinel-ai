import React, { useState, useEffect, useRef } from 'react';
import { Shield, Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import AttackTable from '../components/AttackTable';
import { AttackDistributionPieChart } from '../components/Charts';
import { getRecentPredictions, getTrafficEvents } from '../services/api';
import './Page.css';

const COLORS = [
  '#1d4ed8', '#06b6d4', '#8b5cf6', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#6366f1',
];

const POLL_INTERVAL_MS = 3000;

/* ── Derive dashboard stats from the predictions array ── */
function buildDashboardData(predictions) {
  const total = predictions.length;

  const attacks = predictions.filter(
    (p) => (p.attack_type || '').toUpperCase() !== 'BENIGN'
  );

  const hasHigh = predictions.some(
    (p) => (p.risk || '').toUpperCase() === 'HIGH'
  );
  const currentRisk = hasHigh ? 'HIGH' : total === 0 ? '—' : 'LOW';

  // Build attack distribution counts
  const counts = {};
  predictions.forEach((p) => {
    const label = p.attack_type || 'UNKNOWN';
    counts[label] = (counts[label] || 0) + 1;
  });
  const chartData = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // Format records for AttackTable — map API fields → table fields
  const tableData = predictions.map((p, idx) => ({
    id: p.record_index ?? idx,
    timestamp: p.timestamp || '—',
    attackType: p.attack_type || '—',
    confidence: p.confidence ?? null,
    risk: p.risk || 'LOW',
    status:
      (p.risk || '').toUpperCase() === 'HIGH'
        ? 'BLOCKED'
        : (p.risk || '').toUpperCase() === 'MEDIUM'
        ? 'FLAGGED'
        : 'CLEAN',
  }));

  return {
    totalTraffic: total.toLocaleString(),
    attacksDetected: attacks.length.toLocaleString(),
    currentRisk,
    chartData,
    tableData,
  };
}

export default function Dashboard() {
  const [predictions, setPredictions]     = useState([]);
  const [trafficEvents, setTrafficEvents] = useState([]);
  const [hasData, setHasData]             = useState(false);
  const [fetchError, setFetchError]       = useState(null);
  const intervalRef                       = useRef(null);

  const fetchData = async () => {
    try {
      const [predRes, eventsRes] = await Promise.allSettled([
        getRecentPredictions(50),
        getTrafficEvents(50),
      ]);

      if (predRes.status === 'fulfilled') {
        const data = predRes.value;
        const list = Array.isArray(data) ? data : (data?.predictions ?? []);
        setPredictions(list);
        setHasData(list.length > 0);
        setFetchError(null);
      } else {
        setFetchError(predRes.reason?.message || 'Failed to fetch predictions');
      }

      if (eventsRes.status === 'fulfilled') {
        const evData = eventsRes.value;
        const evList = Array.isArray(evData) ? evData : (evData?.events ?? []);
        setTrafficEvents(evList);
      }
    } catch (err) {
      setFetchError(err.message);
    }
  };

  useEffect(() => {
    // Fetch immediately on mount, then poll every 3 s
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL_MS);

    return () => clearInterval(intervalRef.current);
  }, []);

  const {
    totalTraffic,
    attacksDetected,
    currentRisk,
    chartData,
    tableData,
  } = buildDashboardData(predictions);

  const waitingMsg = 'Waiting for live traffic...';

  return (
    <div className="page">
      <Header title="Dashboard" />
      <div className="page-content">

        {/* Backend error banner */}
        {fetchError && (
          <div className="alert-error" style={{ marginBottom: 16 }}>
            <Shield size={15} />
            <div>
              <p className="alert-title">Backend Unavailable</p>
              <p className="alert-msg">{fetchError}</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard
            icon={<Activity size={20} />}
            label="Total Traffic Analyzed"
            value={hasData ? totalTraffic : waitingMsg}
            sub="Records from last 50 predictions"
            accent="blue"
          />
          <StatCard
            icon={<AlertTriangle size={20} />}
            label="Attacks Detected"
            value={hasData ? attacksDetected : waitingMsg}
            sub="Non-BENIGN predictions"
            accent="red"
          />
          <StatCard
            icon={<Shield size={20} />}
            label="Current Risk"
            value={hasData ? currentRisk : waitingMsg}
            sub="Based on recent predictions"
            accent="yellow"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="Model Confidence"
            value="N/A"
            sub="Not provided by this endpoint"
            accent="green"
          />
        </div>

        {/* Chart + Summary */}
        <div className="section-row">
          <div className="card flex-1">
            <div className="card-header">
              <h2 className="card-title">Attack Distribution</h2>
              <span className="card-badge">
                {hasData ? `Live · polled every ${POLL_INTERVAL_MS / 1000}s` : 'Waiting for data'}
              </span>
            </div>
            {hasData ? (
              <AttackDistributionPieChart data={chartData} />
            ) : (
              <p style={{ padding: '24px 20px', color: '#9ca3af', fontSize: 13 }}>
                {fetchError ? 'Backend unavailable.' : waitingMsg}
              </p>
            )}
          </div>

          <div className="card" style={{ width: 280 }}>
            <div className="card-header">
              <h2 className="card-title">Attack Summary</h2>
            </div>
            <div className="summary-list">
              {hasData ? (
                chartData.map((item, idx) => (
                  <div key={item.name} className="summary-row">
                    <div
                      className="summary-dot"
                      style={{ background: COLORS[idx % COLORS.length] }}
                    />
                    <span className="summary-name">{item.name}</span>
                    <span className="summary-count">{item.value.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p style={{ padding: '12px 16px', color: '#9ca3af', fontSize: 13 }}>
                  {fetchError ? 'Backend unavailable.' : waitingMsg}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Detections Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Detections</h2>
            <span className="card-badge">
              {hasData ? `Last ${tableData.length} records` : 'Waiting for data'}
            </span>
          </div>
          {hasData ? (
            <AttackTable data={tableData} />
          ) : (
            <p style={{ padding: '24px 20px', color: '#9ca3af', fontSize: 13 }}>
              {fetchError ? 'Backend unavailable.' : waitingMsg}
            </p>
          )}
        </div>

        {/* Recent Live Traffic Table */}
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={18} style={{ color: '#1d4ed8' }} />
              <h2 className="card-title">Recent Live Traffic</h2>
            </div>
            <span className="card-badge">
              {trafficEvents.length > 0 ? `Last ${trafficEvents.length} events` : 'Live Telemetry'}
            </span>
          </div>
          {trafficEvents.length > 0 ? (
            <div className="table-scroll">
              <table className="attack-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Method</th>
                    <th>Path</th>
                    <th>Status</th>
                    <th>Response Time</th>
                    <th>Client IP</th>
                  </tr>
                </thead>
                <tbody>
                  {trafficEvents.map((evt, idx) => {
                    const statusClass =
                      evt.status_code >= 500
                        ? 'badge--high'
                        : evt.status_code >= 400
                        ? 'badge--medium'
                        : 'badge--clean';

                    const methodStyle =
                      evt.method === 'GET'
                        ? { background: '#eff6ff', color: '#1d4ed8' }
                        : evt.method === 'POST'
                        ? { background: '#ecfdf5', color: '#047857' }
                        : evt.method === 'DELETE'
                        ? { background: '#fef2f2', color: '#dc2626' }
                        : { background: '#fffbeb', color: '#b45309' };

                    let timeStr = evt.timestamp || '—';
                    if (evt.timestamp) {
                      const d = new Date(evt.timestamp);
                      if (!isNaN(d.getTime())) {
                        timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      }
                    }

                    return (
                      <tr key={evt.id || idx}>
                        <td className="td-mono">{timeStr}</td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            ...methodStyle,
                          }}>
                            {evt.method}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 13, color: '#0f172a' }}>
                          {evt.path}{evt.query ? `?${evt.query}` : ''}
                        </td>
                        <td>
                          <span className={`badge ${statusClass}`}>
                            {evt.status_code}
                          </span>
                        </td>
                        <td className="td-mono">
                          {typeof evt.response_time_ms === 'number'
                            ? `${evt.response_time_ms.toFixed(1)} ms`
                            : `${evt.response_time_ms || '0'} ms`}
                        </td>
                        <td className="td-mono">{evt.client_ip || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ padding: '24px 20px', color: '#9ca3af', fontSize: 13 }}>
              {waitingMsg}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
