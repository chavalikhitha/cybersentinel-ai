import React from 'react';
import Header from '../components/Header';
import {
  AttackBarChart,
  RiskDistributionChart,
  ConfidenceDistributionChart,
  TrafficTimelineChart,
} from '../components/Charts';
import './Page.css';

const ATTACK_DATA = [
  { name: 'BENIGN', value: 2400 },
  { name: 'DoS Hulk', value: 580 },
  { name: 'PortScan', value: 320 },
  { name: 'DDoS', value: 210 },
  { name: 'FTP-Patator', value: 160 },
  { name: 'SSH-Patator', value: 120 },
  { name: 'Web Attack', value: 90 },
  { name: 'Infiltration', value: 45 },
];

const RISK_DATA = [
  { name: 'LOW', value: 2398 },
  { name: 'MEDIUM', value: 370 },
  { name: 'HIGH', value: 957 },
];

const CONFIDENCE_DATA = [
  { name: '50–60%', value: 120 },
  { name: '60–70%', value: 280 },
  { name: '70–80%', value: 610 },
  { name: '80–90%', value: 1340 },
  { name: '90–100%', value: 1375 },
];

const TIMELINE_DATA = [
  { time: '00:00', benign: 300, attacks: 20 },
  { time: '02:00', benign: 250, attacks: 35 },
  { time: '04:00', benign: 180, attacks: 45 },
  { time: '06:00', benign: 400, attacks: 30 },
  { time: '08:00', benign: 520, attacks: 80 },
  { time: '10:00', benign: 600, attacks: 120 },
  { time: '12:00', benign: 580, attacks: 90 },
  { time: '14:00', benign: 490, attacks: 110 },
  { time: '16:00', benign: 530, attacks: 85 },
  { time: '18:00', benign: 460, attacks: 60 },
  { time: '20:00', benign: 380, attacks: 40 },
  { time: '22:00', benign: 310, attacks: 25 },
];

export default function Analytics() {
  return (
    <div className="page">
      <Header title="Analytics" />
      <div className="page-content">

        <div className="charts-grid-2">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Attack Type Distribution</h2>
            </div>
            <AttackBarChart data={ATTACK_DATA} />
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Risk Distribution</h2>
            </div>
            <RiskDistributionChart data={RISK_DATA} />
          </div>
        </div>

        <div className="charts-grid-2">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Confidence Distribution</h2>
            </div>
            <ConfidenceDistributionChart data={CONFIDENCE_DATA} />
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Traffic Analysis Timeline</h2>
              <span className="card-badge">24h Sample</span>
            </div>
            <TrafficTimelineChart data={TIMELINE_DATA} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Dataset Statistics</h2>
          </div>
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-item-value">3,725</div>
              <div className="stat-item-label">Total Records (Sample)</div>
            </div>
            <div className="stat-item">
              <div className="stat-item-value">12</div>
              <div className="stat-item-label">Attack Classes</div>
            </div>
            <div className="stat-item">
              <div className="stat-item-value">78</div>
              <div className="stat-item-label">Features per Record</div>
            </div>
            <div className="stat-item">
              <div className="stat-item-value">94.3%</div>
              <div className="stat-item-label">Overall Accuracy</div>
            </div>
            <div className="stat-item">
              <div className="stat-item-value">64.4%</div>
              <div className="stat-item-label">BENIGN Traffic</div>
            </div>
            <div className="stat-item">
              <div className="stat-item-value">35.6%</div>
              <div className="stat-item-label">Attack Traffic</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
