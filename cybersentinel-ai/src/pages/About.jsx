import React from 'react';
import { Shield, Database, Cpu, Tag, Layers, GitBranch } from 'lucide-react';
import Header from '../components/Header';
import './Page.css';

const ATTACK_CLASSES = [
  'BENIGN',
  'DoS Hulk',
  'PortScan',
  'DDoS',
  'DoS GoldenEye',
  'FTP-Patator',
  'SSH-Patator',
  'DoS Slowloris',
  'DoS Slowhttptest',
  'Bot',
  'Web Attack',
  'Infiltration',
];

export default function About() {
  return (
    <div className="page">
      <Header title="About" />
      <div className="page-content">

        {/* Hero */}
        <div className="card about-hero">
          <div className="about-hero-icon">
            <Shield size={36} />
          </div>
          <div>
            <h1 className="about-project-name">CyberSentinel AI</h1>
            <p className="about-subtitle">
              Network Traffic Classification System for Intrusion Detection
            </p>
            <p className="about-desc">
              CyberSentinel AI is a machine learning-powered web application designed to classify
              network traffic and detect potential cyber attacks. It is built as a college project
              demonstration using the CIC-IDS2017 benchmark dataset and a Random Forest classifier.
            </p>
          </div>
        </div>

        {/* Project Details */}
        <div className="section-row">
          <div className="card flex-1">
            <div className="card-header">
              <h2 className="card-title">Project Details</h2>
            </div>
            <div className="detail-list">
              <div className="detail-row">
                <span className="detail-icon"><Database size={16} /></span>
                <span className="detail-key">Project</span>
                <span className="detail-val">CyberSentinel AI</span>
              </div>
              <div className="detail-row">
                <span className="detail-icon"><Database size={16} /></span>
                <span className="detail-key">Dataset</span>
                <span className="detail-val">CIC-IDS2017 (Canadian Institute for Cybersecurity)</span>
              </div>
              <div className="detail-row">
                <span className="detail-icon"><Cpu size={16} /></span>
                <span className="detail-key">Algorithm</span>
                <span className="detail-val">Random Forest Classifier</span>
              </div>
              <div className="detail-row">
                <span className="detail-icon"><Tag size={16} /></span>
                <span className="detail-key">Features</span>
                <span className="detail-val">78 network traffic features per record</span>
              </div>
              <div className="detail-row">
                <span className="detail-icon"><Layers size={16} /></span>
                <span className="detail-key">Classes</span>
                <span className="detail-val">12 attack categories (including BENIGN)</span>
              </div>
              <div className="detail-row">
                <span className="detail-icon"><GitBranch size={16} /></span>
                <span className="detail-key">Backend</span>
                <span className="detail-val">FastAPI + scikit-learn</span>
              </div>
              <div className="detail-row">
                <span className="detail-icon"><GitBranch size={16} /></span>
                <span className="detail-key">Frontend</span>
                <span className="detail-val">React + Vite + Recharts</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ width: 280 }}>
            <div className="card-header">
              <h2 className="card-title">Attack Classes</h2>
            </div>
            <div className="class-list">
              {ATTACK_CLASSES.map((cls, idx) => (
                <div key={cls} className="class-item">
                  <span className="class-num">{String(idx + 1).padStart(2, '0')}</span>
                  <span className="class-name">{cls}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Scope */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">System Scope &amp; Limitations</h2>
          </div>
          <div className="scope-grid">
            <div className="scope-item scope-item--green">
              <h3>✓ What This System Does</h3>
              <ul>
                <li>Classifies network traffic records into 12 attack categories</li>
                <li>Processes CSV files with 78-feature CIC-IDS2017 format</li>
                <li>Provides per-record classification with confidence scores</li>
                <li>Visualizes attack distributions and risk levels</li>
                <li>Connects to a FastAPI ML backend via REST API</li>
              </ul>
            </div>
            <div className="scope-item scope-item--blue">
              <h3>→ Designed for Extension</h3>
              <ul>
                <li>
                  The current system performs <strong>retrospective classification</strong> of
                  network traffic — it analyzes records and identifies what type of traffic they
                  contain.
                </li>
                <li>
                  It is architecturally designed to be extended with <strong>temporal attack
                  forecasting</strong> capabilities in future iterations, such as LSTM-based
                  sequential modeling.
                </li>
                <li>
                  <em>The current model does not predict future attacks.</em> It classifies
                  existing traffic samples only.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Technology Stack</h2>
          </div>
          <div className="tech-grid">
            {[
              { name: 'React + Vite', role: 'Frontend Framework', color: '#06b6d4' },
              { name: 'Recharts', role: 'Data Visualization', color: '#8b5cf6' },
              { name: 'FastAPI', role: 'Backend REST API', color: '#10b981' },
              { name: 'scikit-learn', role: 'ML Library', color: '#f59e0b' },
              { name: 'Random Forest', role: 'Classification Model', color: '#ef4444' },
              { name: 'CIC-IDS2017', role: 'Training Dataset', color: '#1d4ed8' },
            ].map((tech) => (
              <div key={tech.name} className="tech-card">
                <div className="tech-bar" style={{ background: tech.color }} />
                <div className="tech-name">{tech.name}</div>
                <div className="tech-role">{tech.role}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
