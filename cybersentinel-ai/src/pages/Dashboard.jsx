import React from 'react';
import { Shield, Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import AttackTable from '../components/AttackTable';
import { AttackDistributionPieChart } from '../components/Charts';
import './Page.css';

// Demo data for the dashboard
const DEMO_STATS = {
  totalTraffic: '2,847,392',
  attacksDetected: '14,821',
  currentRisk: 'MEDIUM',
  modelConfidence: '94.3%',
};

const DEMO_CHART_DATA = [
  { name: 'BENIGN', value: 2400 },
  { name: 'DoS Hulk', value: 580 },
  { name: 'PortScan', value: 320 },
  { name: 'DDoS', value: 210 },
  { name: 'FTP-Patator', value: 160 },
  { name: 'SSH-Patator', value: 120 },
  { name: 'Web Attack', value: 90 },
  { name: 'Infiltration', value: 45 },
];

const DEMO_DETECTIONS = [
  { timestamp: '2024-01-15 14:22:01', attackType: 'DoS Hulk', confidence: 0.97, risk: 'HIGH', status: 'BLOCKED' },
  { timestamp: '2024-01-15 14:20:44', attackType: 'BENIGN', confidence: 0.99, risk: 'LOW', status: 'CLEAN' },
  { timestamp: '2024-01-15 14:19:32', attackType: 'PortScan', confidence: 0.88, risk: 'MEDIUM', status: 'FLAGGED' },
  { timestamp: '2024-01-15 14:17:10', attackType: 'DDoS', confidence: 0.95, risk: 'HIGH', status: 'BLOCKED' },
  { timestamp: '2024-01-15 14:15:56', attackType: 'FTP-Patator', confidence: 0.82, risk: 'MEDIUM', status: 'FLAGGED' },
  { timestamp: '2024-01-15 14:14:03', attackType: 'BENIGN', confidence: 0.98, risk: 'LOW', status: 'CLEAN' },
  { timestamp: '2024-01-15 14:12:49', attackType: 'Web Attack XSS', confidence: 0.76, risk: 'MEDIUM', status: 'FLAGGED' },
  { timestamp: '2024-01-15 14:11:22', attackType: 'SSH-Patator', confidence: 0.91, risk: 'HIGH', status: 'BLOCKED' },
];

export default function Dashboard() {
  return (
    <div className="page">
      <Header title="Dashboard" />
      <div className="page-content">

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard
            icon={<Activity size={20} />}
            label="Total Traffic Analyzed"
            value={DEMO_STATS.totalTraffic}
            sub="All-time records processed"
            accent="blue"
          />
          <StatCard
            icon={<AlertTriangle size={20} />}
            label="Attacks Detected"
            value={DEMO_STATS.attacksDetected}
            sub="Across all categories"
            accent="red"
          />
          <StatCard
            icon={<Shield size={20} />}
            label="Current Risk"
            value={DEMO_STATS.currentRisk}
            sub="Based on recent traffic"
            accent="yellow"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="Model Confidence"
            value={DEMO_STATS.modelConfidence}
            sub="Random Forest accuracy"
            accent="green"
          />
        </div>

        {/* Chart */}
        <div className="section-row">
          <div className="card flex-1">
            <div className="card-header">
              <h2 className="card-title">Attack Distribution</h2>
              <span className="card-badge">Live Overview</span>
            </div>
            <AttackDistributionPieChart data={DEMO_CHART_DATA} />
          </div>

          <div className="card" style={{ width: 280 }}>
            <div className="card-header">
              <h2 className="card-title">Attack Summary</h2>
            </div>
            <div className="summary-list">
              {DEMO_CHART_DATA.map((item, idx) => (
                <div key={item.name} className="summary-row">
                  <div className="summary-dot" style={{ background: [
                    '#1d4ed8','#06b6d4','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1'
                  ][idx % 8] }} />
                  <span className="summary-name">{item.name}</span>
                  <span className="summary-count">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Detections Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Detections</h2>
            <span className="card-badge">Last 8 records</span>
          </div>
          <AttackTable data={DEMO_DETECTIONS} />
        </div>

      </div>
    </div>
  );
}
