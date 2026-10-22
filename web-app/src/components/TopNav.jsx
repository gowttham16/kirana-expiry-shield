import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldAlert, Package, LayoutDashboard } from 'lucide-react';

export default function TopNav({ onOpenModal }) {
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

          {/* This simply opens your modal now! */}
          <button className="btn btn-sm btn-success fw-semibold ms-2" onClick={onOpenModal}>
            + Scan New Stock
          </button>
        </div>
      </div>
    </nav>
  );
}