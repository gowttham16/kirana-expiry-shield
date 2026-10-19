import React from 'react';
import AlertCard from '../components/AlertCard';

export default function Dashboard({ alerts, loading, onRefresh }) {
  const totalRisk = alerts.reduce((sum, item) => sum + (item.potential_loss_rupees || 0), 0);
  const criticalCount = alerts.filter(a => a.status === 'CRITICAL' || a.status === 'EXPIRED').length;

  return (
    <div>
      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm border-0 border-start border-danger border-4 p-3 bg-white">
            <span className="text-muted small fw-semibold">Total Capital at Risk</span>
            <h3 className="fw-bold text-danger mb-0">₹{totalRisk}</h3>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm border-0 border-start border-warning border-4 p-3 bg-white">
            <span className="text-muted small fw-semibold">Urgent Batches (≤30 Days)</span>
            <h3 className="fw-bold text-dark mb-0">{criticalCount}</h3>
          </div>
        </div>
      </div>

      <h4 className="fw-bold mb-3 text-secondary">Priority Expiry Alerts</h4>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Analyzing batch risks...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="alert alert-success text-center py-4 shadow-sm border-0">
          All stock is fresh! No urgent expiry alerts right now.
        </div>
      ) : (
        alerts.map((item) => (
          <AlertCard key={item.batch_id} item={item} onRefresh={onRefresh} />
        ))
      )}
    </div>
  );
}