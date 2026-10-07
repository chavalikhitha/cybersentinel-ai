import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TrafficAnalysis from './pages/TrafficAnalysis';
import Analytics from './pages/Analytics';
import AttackDetection from './pages/AttackDetection';
import About from './pages/About';
import { Landing } from './components/Landing';
import { Technology } from './components/Technology';
import './App.css';

function LandingPage() {
  const navigate = useNavigate();
  return (
    <Landing
      onLaunch={() => navigate('/dashboard')}
      onTech={() => navigate('/technology')}
    />
  );
}

function TechnologyPage() {
  const navigate = useNavigate();
  return (
    <Technology
      onBack={() => navigate('/')}
      onLaunch={() => navigate('/dashboard')}
    />
  );
}

function DashboardLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 3D Cybersecurity Landing Page at "/" */}
        <Route path="/" element={<LandingPage />} />

        {/* 3D Experience Technology Overview at "/technology" */}
        <Route path="/technology" element={<TechnologyPage />} />

        {/* Existing CyberSentinel Dashboard at "/dashboard" */}
        <Route
          path="/dashboard"
          element={
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          }
        />

        {/* Existing Traffic Analysis */}
        <Route
          path="/traffic"
          element={
            <DashboardLayout>
              <TrafficAnalysis />
            </DashboardLayout>
          }
        />

        {/* Existing Analytics */}
        <Route
          path="/analytics"
          element={
            <DashboardLayout>
              <Analytics />
            </DashboardLayout>
          }
        />

        {/* Existing Attack Detection (supporting both /detection and /attack-detection) */}
        <Route
          path="/detection"
          element={
            <DashboardLayout>
              <AttackDetection />
            </DashboardLayout>
          }
        />
        <Route
          path="/attack-detection"
          element={
            <DashboardLayout>
              <AttackDetection />
            </DashboardLayout>
          }
        />

        {/* Existing About */}
        <Route
          path="/about"
          element={
            <DashboardLayout>
              <About />
            </DashboardLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
