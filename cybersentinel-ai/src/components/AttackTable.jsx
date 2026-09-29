import React, { useState } from 'react';
import './AttackTable.css';

function RiskBadge({ risk }) {
  const level = (risk || '').toUpperCase();
  if (level === 'HIGH') return <span className="badge badge--high">HIGH</span>;
  if (level === 'MEDIUM') return <span className="badge badge--medium">MEDIUM</span>;
  return <span className="badge badge--low">LOW</span>;
}

function StatusBadge({ status }) {
  const s = (status || '').toUpperCase();
  if (s === 'BLOCKED') return <span className="badge badge--blocked">BLOCKED</span>;
  if (s === 'FLAGGED') return <span className="badge badge--flagged">FLAGGED</span>;
  return <span className="badge badge--clean">CLEAN</span>;
}

export default function AttackTable({ data, searchable = false }) {
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');

  const filtered = data.filter((row) => {
    const matchSearch =
      !search ||
      Object.values(row).some((v) =>
        String(v).toLowerCase().includes(search.toLowerCase())
      );
    const matchRisk =
      filterRisk === 'ALL' ||
      (row.risk || '').toUpperCase() === filterRisk;
    return matchSearch && matchRisk;
  });

  return (
    <div className="attack-table-wrapper">
      {searchable && (
        <div className="table-controls">
          <input
            className="table-search"
            type="text"
            placeholder="Search by attack type, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="table-filter-group">
            {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((r) => (
              <button
                key={r}
                className={`filter-btn ${filterRisk === r ? 'filter-btn--active' : ''}`}
                onClick={() => setFilterRisk(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="table-scroll">
        <table className="attack-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Attack Type</th>
              <th>Confidence</th>
              <th>Risk</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-empty">No records found.</td>
              </tr>
            ) : (
              filtered.map((row, idx) => (
                <tr key={idx}>
                  <td className="td-mono">{row.timestamp}</td>
                  <td className="td-type">{row.attackType}</td>
                  <td>
                    <div className="confidence-bar-wrapper">
                      <div
                        className="confidence-bar"
                        style={{ width: `${Math.min(100, (row.confidence || 0) * 100).toFixed(0)}%` }}
                      ></div>
                      <span className="confidence-text">
                        {row.confidence != null
                          ? `${(row.confidence * 100).toFixed(1)}%`
                          : '—'}
                      </span>
                    </div>
                  </td>
                  <td><RiskBadge risk={row.risk} /></td>
                  <td><StatusBadge status={row.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        Showing {filtered.length} of {data.length} records
      </div>
    </div>
  );
}
