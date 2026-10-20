import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopNav from './components/TopNav';
import AddStockForm from './components/AddStockForm';
import Dashboard from './pages/Dashboard';
import InventoryList from './pages/InventoryList';
// import { fetchExpiringInventory } from './api/inventoryApi';
import { fetchExpiringInventory } from './api/apiService.js';

export default function App() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    const data = await fetchExpiringInventory();
    setAlerts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-vh-100 bg-light">
        <TopNav onOpenModal={() => setShowModal(true)} />

        <div className="container py-4">
          <Routes>
            <Route 
              path="/" 
              element={<Dashboard alerts={alerts} loading={loading} onRefresh={fetchInventory} />} 
            />
            <Route 
              path="/inventory" 
              element={<InventoryList />} 
            />
          </Routes>
        </div>

        {showModal && (
          <AddStockForm 
            onClose={() => setShowModal(false)} 
            onStockAdded={fetchInventory} 
          />
        )}
      </div>
    </BrowserRouter>
  );
}