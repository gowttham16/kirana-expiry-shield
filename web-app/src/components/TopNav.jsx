import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldAlert, Package, LayoutDashboard, Sun, Moon } from 'lucide-react';

export default function TopNav({ onOpenModal }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4 py-3 shadow-sm">
      <div className="container-fluid">
        <NavLink className="navbar-brand d-flex align-items-center fw-bold fs-4 text-white" to="/">
          <ShieldAlert className="me-2 text-primary" size={28} />
          Kirana Expiry Shield
        </NavLink>

        <div className="d-flex align-items-center gap-3">
          <NavLink 
            to="/" 
            className={({ isActive }) => `btn btn-sm d-flex align-items-center ${isActive ? 'btn-primary' : 'btn-outline-light'}`}
          >
            <LayoutDashboard size={18} className="me-1" />
            Alerts Dashboard
          </NavLink>

          <NavLink 
            to="/inventory" 
            className={({ isActive }) => `btn btn-sm d-flex align-items-center ${isActive ? 'btn-primary' : 'btn-outline-light'}`}
          >
            <Package size={18} className="me-1" />
            All Inventory
          </NavLink>

          <button 
            className="btn btn-sm btn-outline-light d-flex align-items-center" 
            onClick={() => setIsDarkMode(!isDarkMode)}
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="btn btn-sm btn-success fw-semibold ms-2" onClick={onOpenModal}>
            + Scan New Stock
          </button>
        </div>
      </div>
    </nav>
  );
}