import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TrafficAnalysis from './pages/TrafficAnalysis';
import Analytics from './pages/Analytics';
import AttackDetection from './pages/AttackDetection';
import About from './pages/About';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/traffic" element={<TrafficAnalysis />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/detection" element={<AttackDetection />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
