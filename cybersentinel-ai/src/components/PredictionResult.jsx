import React, { useState } from 'react';
import { CheckCircle, Database, TrendingUp, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import './PredictionResult.css';

/* ── Badges ── */
function RiskBadge({ risk }) {
  const level = (risk || '').toUpperCase();
  if (level === 'HIGH')   return <span className="badge badge--high">HIGH</span>;
  if (level === 'MEDIUM') return <span className="badge badge--medium">MEDIUM</span>;
  return <span className="badge badge--low">LOW</span>;
}

/* ── Confidence bar ── */
function ConfBar({ value }) {
  const pct = Math.min(100, ((value || 0) * 100)).toFixed(1);
  return (
    <div className="conf-bar-wrap">
      <div className="conf-bar" style={{ width: `${pct}%` }} />
      <span className="conf-text">{pct}%</span>
    </div>
  );
}

/* ── Derive aggregate stats from real predictions array ── */
function buildStats(predictions) {
  if (!predictions || predictions.length === 0) return {};

  const totalConf   = predictions.reduce((s, p) => s + (p.confidence || 0), 0);
  const avgConf     = totalConf / predictions.length;

  const riskCounts  = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  predictions.forEach(p => {
    const r = (p.risk || 'LOW').toUpperCase();
    riskCounts[r] = (riskCounts[r] || 0) + 1;
  });

  const dominantRisk =
    riskCounts.HIGH   > 0 ? 'HIGH'   :
    riskCounts.MEDIUM > 0 ? 'MEDIUM' : 'LOW';

  return { avgConf, dominantRisk, riskCounts };
}

/* ── Main component ── */
export default function PredictionResult({ result }) {
  const [showTable, setShowTable] = useState(false);
  const [page, setPage]           = useState(0);
  const PAGE_SIZE = 25;

  if (!result) return null;

  const { total_records, predictions = [], summary = {} } = result;
  const { avgConf, dominantRisk, riskCounts } = buildStats(predictions);

  /* top attack by count from summary */
  const topAttack =
    Object.keys(summary).length > 0
      ? Object.entries(summary).sort((a, b) => b[1] - a[1])[0]
      : null;

  /* pagination */
  const totalPages   = Math.ceil(predictions.length / PAGE_SIZE);
  const sliced       = predictions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="prediction-result">

      {/* ── Header bar ── */}
      <div className="prediction-header">
        <CheckCircle size={17} className="pr-check-icon" />
        <span>Analysis Complete — results from your trained model</span>
      </div>

      {/* ── Top stat row ── */}
      <div className="pr-stats">
        <div className="pr-stat">
          <Database size={17} />
          <div>
            <div className="pr-stat-value">{total_records?.toLocaleString() ?? '—'}</div>
            <div className="pr-stat-label">Records Analyzed</div>
          </div>
        </div>

        {topAttack && (
          <div className="pr-stat">
            <Shield size={17} />
            <div>
              <div className="pr-stat-value pr-stat-value--sm">{topAttack[0]}</div>
              <div className="pr-stat-label">Top Attack Type ({topAttack[1].toLocaleString()} records)</div>
            </div>
          </div>
        )}

        <div className="pr-stat">
          <TrendingUp size={17} />
          <div>
            <div className="pr-stat-value">
              {avgConf != null ? `${(avgConf * 100).toFixed(1)}%` : 'N/A'}
            </div>
            <div className="pr-stat-label">Avg Confidence</div>
          </div>
        </div>

        <div className="pr-stat">
          <Shield size={17} />
          <div>
            <div className="pr-stat-value">
              <RiskBadge risk={dominantRisk} />
            </div>
            <div className="pr-stat-label">Overall Risk</div>
          </div>
        </div>
      </div>

      {/* ── Risk breakdown ── */}
      {riskCounts && (
        <div className="pr-risk-row">
          <div className="pr-risk-item pr-risk-item--low">
            <span className="pr-risk-num">{riskCounts.LOW ?? 0}</span>
            <span className="pr-risk-lbl">LOW</span>
          </div>
          <div className="pr-risk-item pr-risk-item--medium">
            <span className="pr-risk-num">{riskCounts.MEDIUM ?? 0}</span>
            <span className="pr-risk-lbl">MEDIUM</span>
          </div>
          <div className="pr-risk-item pr-risk-item--high">
            <span className="pr-risk-num">{riskCounts.HIGH ?? 0}</span>
            <span className="pr-risk-lbl">HIGH</span>
          </div>
        </div>
      )}

      {/* ── Summary breakdown ── */}
      {Object.keys(summary).length > 0 && (
        <div className="pr-summary">
          <p className="pr-summary-title">Attack Class Breakdown</p>
          <div className="pr-summary-bars">
            {Object.entries(summary)
              .sort((a, b) => b[1] - a[1])
              .map(([label, count]) => {
                const pct = ((count / total_records) * 100).toFixed(1);
                return (
                  <div key={label} className="pr-bar-row">
                    <span className="pr-bar-label">{label}</span>
                    <div className="pr-bar-track">
                      <div
                        className="pr-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: label === 'BENIGN' ? '#22c55e' : '#1d4ed8',
                        }}
                      />
                    </div>
                    <span className="pr-bar-count">{count.toLocaleString()}</span>
                    <span className="pr-bar-pct">{pct}%</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── Per-record prediction table (collapsible) ── */}
      {predictions.length > 0 && (
        <div className="pr-table-section">
          <button
            className="pr-toggle-btn"
            onClick={() => { setShowTable(v => !v); setPage(0); }}
          >
            {showTable ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            {showTable ? 'Hide' : 'Show'} per-record predictions
            <span className="pr-toggle-count">({predictions.length.toLocaleString()} records)</span>
          </button>

          {showTable && (
            <>
              <div className="pr-table-scroll">
                <table className="pr-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Attack Type</th>
                      <th>Confidence</th>
                      <th>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sliced.map((row) => (
                      <tr key={row.record_index}>
                        <td className="td-idx">{row.record_index + 1}</td>
                        <td className="td-type">{row.attack_type}</td>
                        <td><ConfBar value={row.confidence} /></td>
                        <td><RiskBadge risk={row.risk} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pr-pagination">
                  <button
                    className="pg-btn"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    ← Prev
                  </button>
                  <span className="pg-info">
                    Page {page + 1} of {totalPages} &nbsp;·&nbsp;
                    Showing {sliced.length} of {predictions.length} records
                  </span>
                  <button
                    className="pg-btn"
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

    </div>
  );
}
