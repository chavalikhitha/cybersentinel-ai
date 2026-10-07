import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  BarChart2,
  ShieldAlert,
  Info,
  Shield,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/traffic', icon: <Activity size={18} />, label: 'Traffic Analysis' },
  { to: '/analytics', icon: <BarChart2 size={18} />, label: 'Analytics' },
  { to: '/detection', icon: <ShieldAlert size={18} />, label: 'Attack Detection' },
  { to: '/about', icon: <Info size={18} />, label: 'About' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar-logo" title="Back to 3D Overview">
        <div className="logo-icon">
          <Shield size={22} strokeWidth={2.5} />
        </div>
        <div className="logo-text">
          <span className="logo-title">CyberSentinel</span>
          <span className="logo-ai">AI</span>
        </div>
      </Link>

      <nav className="sidebar-nav">
        <p className="nav-section-label">NAVIGATION</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-item--active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-version">
          <span className="version-dot"></span>
          <span>v1.0.0 &middot; CIC-IDS2017</span>
        </div>
      </div>
    </aside>
  );
}
