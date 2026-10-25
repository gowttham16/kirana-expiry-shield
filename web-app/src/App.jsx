import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TopNav from './components/TopNav';
import Dashboard from './pages/Dashboard'; 
import AddStockForm from './components/AddStockForm';
import { fetchExpiringInventory } from './api/apiService';
import AllInventory from './components/AllInventory'; 
import Login from './pages/Login';
import { supabase } from './supabaseClient';
// import ChatAssistant from '../components/ChatAssistant';

export default function App() {
  const [session, setSession] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check for active login session on page load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    const data = await fetchExpiringInventory();
    setAlerts(data || []);
    setLoading(false);
  };

  // Only fetch inventory data if the user is successfully logged in
  useEffect(() => {
    if (session) {
      loadAlerts();
    }
  }, [session]);

  // Lock the app behind the login screen if no session exists
  if (!session) {
    return <Login onLoginSuccess={setSession} />;
  }

  // Render the main application for authenticated users
  return (
    <Router>
      <div className="bg-body-tertiary min-vh-100">
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