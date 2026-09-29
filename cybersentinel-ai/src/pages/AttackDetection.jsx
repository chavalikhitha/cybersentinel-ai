import React from 'react';
import Header from '../components/Header';
import AttackTable from '../components/AttackTable';
import './Page.css';

const ALL_DETECTIONS = [
  { timestamp: '2024-01-15 14:22:01', attackType: 'DoS Hulk', confidence: 0.97, risk: 'HIGH', status: 'BLOCKED' },
  { timestamp: '2024-01-15 14:20:44', attackType: 'BENIGN', confidence: 0.99, risk: 'LOW', status: 'CLEAN' },
  { timestamp: '2024-01-15 14:19:32', attackType: 'PortScan', confidence: 0.88, risk: 'MEDIUM', status: 'FLAGGED' },
  { timestamp: '2024-01-15 14:17:10', attackType: 'DDoS', confidence: 0.95, risk: 'HIGH', status: 'BLOCKED' },
  { timestamp: '2024-01-15 14:15:56', attackType: 'FTP-Patator', confidence: 0.82, risk: 'MEDIUM', status: 'FLAGGED' },
  { timestamp: '2024-01-15 14:14:03', attackType: 'BENIGN', confidence: 0.98, risk: 'LOW', status: 'CLEAN' },
  { timestamp: '2024-01-15 14:12:49', attackType: 'Web Attack XSS', confidence: 0.76, risk: 'MEDIUM', status: 'FLAGGED' },
  { timestamp: '2024-01-15 14:11:22', attackType: 'SSH-Patator', confidence: 0.91, risk: 'HIGH', status: 'BLOCKED' },
  { timestamp: '2024-01-15 14:09:44', attackType: 'BENIGN', confidence: 0.96, risk: 'LOW', status: 'CLEAN' },
  { timestamp: '2024-01-15 14:08:11', attackType: 'DoS GoldenEye', confidence: 0.89, risk: 'HIGH', status: 'BLOCKED' },
  { timestamp: '2024-01-15 14:06:30', attackType: 'BENIGN', confidence: 0.99, risk: 'LOW', status: 'CLEAN' },
  { timestamp: '2024-01-15 14:05:02', attackType: 'Infiltration', confidence: 0.71, risk: 'HIGH', status: 'BLOCKED' },
  { timestamp: '2024-01-15 14:03:27', attackType: 'PortScan', confidence: 0.84, risk: 'MEDIUM', status: 'FLAGGED' },
  { timestamp: '2024-01-15 14:01:55', attackType: 'Web Attack SQLi', confidence: 0.93, risk: 'HIGH', status: 'BLOCKED' },
  { timestamp: '2024-01-15 14:00:18', attackType: 'BENIGN', confidence: 0.97, risk: 'LOW', status: 'CLEAN' },
  { timestamp: '2024-01-15 13:58:44', attackType: 'DoS Slowloris', confidence: 0.85, risk: 'HIGH', status: 'BLOCKED' },
  { timestamp: '2024-01-15 13:57:09', attackType: 'BENIGN', confidence: 0.98, risk: 'LOW', status: 'CLEAN' },
  { timestamp: '2024-01-15 13:55:30', attackType: 'FTP-Patator', confidence: 0.79, risk: 'MEDIUM', status: 'FLAGGED' },
  { timestamp: '2024-01-15 13:53:52', attackType: 'BENIGN', confidence: 0.99, risk: 'LOW', status: 'CLEAN' },
  { timestamp: '2024-01-15 13:52:11', attackType: 'Bot', confidence: 0.68, risk: 'MEDIUM', status: 'FLAGGED' },
];

export default function AttackDetection() {
  return (
    <div className="page">
      <Header title="Attack Detection" />
      <div className="page-content">

        <div className="section-summary">
          <div className="section-summary-item">
            <span className="ss-value">{ALL_DETECTIONS.length}</span>
            <span className="ss-label">Total Records</span>
          </div>
          <div className="section-summary-item">
            <span className="ss-value" style={{ color: '#ef4444' }}>
              {ALL_DETECTIONS.filter((d) => d.risk === 'HIGH').length}
            </span>
            <span className="ss-label">High Risk</span>
          </div>
          <div className="section-summary-item">
            <span className="ss-value" style={{ color: '#f59e0b' }}>
              {ALL_DETECTIONS.filter((d) => d.risk === 'MEDIUM').length}
            </span>
            <span className="ss-label">Medium Risk</span>
          </div>
          <div className="section-summary-item">
            <span className="ss-value" style={{ color: '#22c55e' }}>
              {ALL_DETECTIONS.filter((d) => d.risk === 'LOW').length}
            </span>
            <span className="ss-label">Low Risk</span>
          </div>
          <div className="section-summary-item">
            <span className="ss-value" style={{ color: '#dc2626' }}>
              {ALL_DETECTIONS.filter((d) => d.status === 'BLOCKED').length}
            </span>
            <span className="ss-label">Blocked</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Detection Log</h2>
            <span className="card-badge">Searchable &amp; Filterable</span>
          </div>
          <AttackTable data={ALL_DETECTIONS} searchable />
        </div>

      </div>
    </div>
  );
}
