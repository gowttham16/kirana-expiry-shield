import React from 'react';
import AlertCard from '../components/AlertCard';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Professional color palette for the chart
const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];

export default function Dashboard({ alerts, loading, onRefresh }) {
  const totalRisk = alerts.reduce((sum, item) => sum + (item.potential_loss_rupees || 0), 0);
  const criticalCount = alerts.filter(a => a.status === 'CRITICAL' || a.status === 'EXPIRED').length;

  // Dynamically group the financial risk by product name
  const chartData = Object.values(alerts.reduce((acc, item) => {
    if (item.potential_loss_rupees > 0) {
      if (!acc[item.product_name]) {
        acc[item.product_name] = { name: item.product_name, value: 0 };
      }
      acc[item.product_name].value += item.potential_loss_rupees;
    }
    return acc;
  }, {})).sort((a, b) => b.value - a.value); // Sort by highest financial risk

  return (
    <div>
      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm border-0 border-start border-danger border-4 p-3 bg-white h-100">
            <span className="text-muted small fw-semibold">Total Capital at Risk</span>
            <h3 className="fw-bold text-danger mb-0">₹{totalRisk}</h3>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm border-0 border-start border-warning border-4 p-3 bg-white h-100">
            <span className="text-muted small fw-semibold">Urgent Batches (≤30 Days)</span>
            <h3 className="fw-bold text-dark mb-0">{criticalCount}</h3>
          </div>
        </div>
      </div>

      {/* Analytics Chart Section */}
      {!loading && chartData.length > 0 && (
        <div className="card shadow-sm border-0 mb-4 p-4 bg-white">
          <h6 className="fw-bold text-secondary mb-3">Risk Breakdown by Product</h6>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value}`} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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