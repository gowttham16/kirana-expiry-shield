import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TopNav from './components/TopNav';
// Corrected path: Dashboard is in the pages folder
import Dashboard from './pages/Dashboard'; 
import AddStockForm from './components/AddStockForm';
import { fetchExpiringInventory } from './api/apiService';
import AllInventory from './components/AllInventory'; 

export default function App() {
  const [showScanner, setShowScanner] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    setLoading(true);
    const data = await fetchExpiringInventory();
    setAlerts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  return (
    <Router>
      <div className="bg-light min-vh-100">
        <TopNav onOpenModal={() => setShowScanner(true)} />
        
        <div className="container py-4">
          <Routes>
            <Route path="/" element={<Dashboard alerts={alerts} loading={loading} onRefresh={loadAlerts} />} />
            <Route path="/inventory" element={<AllInventory />} />
          </Routes>
        </div>

        {showScanner && (
          <AddStockForm 
            onClose={() => setShowScanner(false)} 
            onRefresh={loadAlerts} 
          />
        )}
      </div>
    </Router>
  );
}