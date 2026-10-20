import React, { useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldAlert, Package, LayoutDashboard } from 'lucide-react';
import { scanProductImage } from '../api/apiService.js';

export default function TopNav({ onOpenModal }) {
  const fileInputRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsScanning(true);
    const result = await scanProductImage(file);
    setIsScanning(false);

    if (result && result.success) {
      alert(`Scanned Text: ${result.extracted_text}\nExpiry Date: ${result.expiry_date}`);
      // In the next step, we will change this alert to automatically open your AddStockForm modal!
    } else {
      alert("Failed to read the image. Please try again.");
    }
    
    // Reset the input so the same file can be selected again if needed
    event.target.value = ''; 
  };

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

          {/* Hidden file input for camera/gallery */}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            style={{ display: 'none' }} 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          
          {/* Your original button, now wired to trigger the hidden scanner */}
          <button 
            className="btn btn-sm btn-success fw-semibold ms-2" 
            onClick={() => fileInputRef.current.click()}
            disabled={isScanning}
          >
            {isScanning ? "Scanning..." : "+ Scan New Stock"}
          </button>
        </div>
      </div>
    </nav>
  );
}