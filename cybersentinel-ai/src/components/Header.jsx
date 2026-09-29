import React from 'react';
import { User, Wifi } from 'lucide-react';
import './Header.css';

export default function Header({ title }) {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
      </div>
      <div className="header-right">
        <div className="status-badge">
          <span className="status-dot"></span>
          <Wifi size={13} />
          <span className="status-text">System Status: ONLINE</span>
        </div>
        <div className="user-avatar">
          <User size={18} />
        </div>
      </div>
    </header>
  );
}
