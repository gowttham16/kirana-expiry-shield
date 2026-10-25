import React, { useState, useEffect } from 'react';
import { fetchExpiringInventory } from '../api/apiService';
import { AlertTriangle, Tag } from 'lucide-react';

export default function LiquidationDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmClearId, setConfirmClearId] = useState(null);

  useEffect(() => {
    loadExpiringStock();
  }, []);

  const loadExpiringStock = async () => {
    setLoading(true);
    const data = await fetchExpiringInventory();
    setItems(data || []);
    setLoading(false);
  };

  const sendWhatsAppOffer = (item) => {
    let offerPrice = item.potential_loss_rupees / item.quantity;
    let discountText = "";
    if (item.action.includes("50%")) {
      offerPrice = (offerPrice * 0.5).toFixed(2);
      discountText = `(Flat 50% OFF!)`;
    } else if (item.action.includes("20%")) {
      offerPrice = (offerPrice * 0.8).toFixed(2);
      discountText = `(Flat 20% OFF!)`;
    }
    const text = `🚨 *KIRANA FLASH SALE* 🚨\n\nGrab *${item.product_name}* before it runs out!\n✅ Offer Price: ₹${offerPrice} ${discountText}\n📦 Stock available: ${item.quantity} units\n\nVisit our shop today to claim this deal!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleSellOne = async (batchId) => {
    try {
      await fetch(`https://kirana-expiry-shield.onrender.com/api/inventory/batch/${batchId}/sell?quantity=1`, { method: 'PATCH' });
      setItems(prevItems => prevItems.map(item => 
        item.batch_id === batchId ? { ...item, quantity: item.quantity - 1 } : item
      ).filter(item => item.quantity > 0));
    } catch (error) {
      console.error("Sell error:", error);
    }
  };

  const executeClearAll = async (batchId) => {
    try {
      await fetch(`https://kirana-expiry-shield.onrender.com/api/inventory/batch/${batchId}`, { method: 'DELETE' });
      setItems(prevItems => prevItems.filter(item => item.batch_id !== batchId));
      setConfirmClearId(null);
    } catch (error) {
      console.error("Clear error:", error);
    }
  };

  return (
    <div className="container mt-4">
      <h4 className="fw-bold mb-4 d-flex align-items-center text-danger">
        <AlertTriangle className="me-2" /> Liquidation & Expiry Alerts
      </h4>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
      ) : items.length === 0 ? (
        <div className="alert alert-success">No items are expiring within the next 30 days!</div>
      ) : (
        <div className="row g-3">
          {items.map((item) => {
            const cardColor = item.days_left < 0 ? 'border-danger' : item.days_left <= 7 ? 'border-danger' : 'border-warning';
            const badgeColor = item.days_left < 0 ? 'bg-danger' : item.days_left <= 7 ? 'bg-danger' : 'bg-warning text-dark';

            return (
              <div key={item.batch_id} className="col-12 col-md-6 col-lg-4">
                <div className={`card h-100 shadow-sm ${cardColor}`}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title fw-bold mb-0">{item.product_name}</h5>
                      <span className={`badge ${badgeColor}`}>{item.status}</span>
                    </div>
                    <p className="text-muted small mb-3">Barcode: {item.barcode}</p>
                    
                    <ul className="list-unstyled mb-3 small">
                      <li><strong>Stock:</strong> {item.quantity} units</li>
                      <li><strong>Remaining:</strong> {item.days_left} days</li>
                      <li className="text-danger"><strong>Capital at Risk:</strong> ₹{item.potential_loss_rupees}</li>
                    </ul>

                    <div className="p-2 bg-light rounded border d-flex align-items-center justify-content-between">
                      <span className="fw-bold small text-primary">
                        <Tag size={14} className="me-1" /> Action:
                      </span>
                      <span className="fw-bold text-dark small">{item.action}</span>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-3">
                      <button className="btn btn-outline-success btn-sm" onClick={() => sendWhatsAppOffer(item)}>
                        Offer on WA
                      </button>
                      <button className="btn btn-outline-primary btn-sm" onClick={() => handleSellOne(item.batch_id)}>
                        Sell 1
                      </button>
                      
                      {confirmClearId === item.batch_id ? (
                        <div className="d-flex gap-1 align-items-center bg-light p-1 rounded border border-danger">
                          <span className="small text-danger fw-bold ms-1 me-1">Clear?</span>
                          <button className="btn btn-danger btn-sm px-2 py-0" onClick={() => executeClearAll(item.batch_id)}>Yes</button>
                          <button className="btn btn-secondary btn-sm px-2 py-0" onClick={() => setConfirmClearId(null)}>No</button>
                        </div>
                      ) : (
                        <button className="btn btn-outline-danger btn-sm" onClick={() => setConfirmClearId(item.batch_id)}>Clear All</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}