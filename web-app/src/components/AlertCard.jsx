import React, { useState } from 'react';
import { Tag } from 'lucide-react';

export default function AlertCard({ item, onRefresh }) {
  // Local state just for this specific card's Yes/No confirmation
  const [showConfirm, setShowConfirm] = useState(false);

  const sendWhatsAppOffer = () => {
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

  const handleSellOne = async () => {
    try {
      await fetch(`https://kirana-expiry-shield.onrender.com/api/inventory/batch/${item.batch_id}/sell?quantity=1`, { method: 'PATCH' });
      if (onRefresh) onRefresh(); // Refresh dashboard data instantly
    } catch (error) {
      console.error("Sell error:", error);
    }
  };

  const executeClearAll = async () => {
    try {
      await fetch(`https://kirana-expiry-shield.onrender.com/api/inventory/batch/${item.batch_id}`, { method: 'DELETE' });
      setShowConfirm(false);
      if (onRefresh) onRefresh(); // Refresh dashboard data instantly
    } catch (error) {
      console.error("Clear error:", error);
    }
  };

  const cardColor = item.days_left < 0 ? 'border-danger' : item.days_left <= 7 ? 'border-danger' : 'border-warning';
  const badgeColor = item.days_left < 0 ? 'bg-danger' : item.days_left <= 7 ? 'bg-danger' : 'bg-warning text-dark';

  return (
    <div className={`card shadow-sm mb-3 border-0 border-start ${cardColor} border-4`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h5 className="card-title fw-bold mb-0">{item.product_name}</h5>
            <p className="text-muted small mb-1">Barcode: {item.barcode}</p>
          </div>
          <span className={`badge ${badgeColor}`}>{item.status}</span>
        </div>
        
        <div className="row small mb-3">
          <div className="col-4">
            <strong>Stock:</strong> {item.quantity} units
          </div>
          <div className="col-4">
            <strong>Remaining:</strong> {item.days_left} days
          </div>
          <div className="col-4 text-danger">
            <strong>Risk:</strong> ₹{item.potential_loss_rupees}
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="d-flex align-items-center bg-light px-2 py-1 rounded border">
            <Tag size={14} className="me-1 text-primary" />
            <span className="fw-bold text-dark small">{item.action}</span>
          </div>
          
          <div className="d-flex gap-2">
            <button className="btn btn-outline-success btn-sm" onClick={sendWhatsAppOffer}>
              Offer on WA
            </button>
            <button className="btn btn-outline-primary btn-sm" onClick={handleSellOne}>
              Sell 1
            </button>
            
            {showConfirm ? (
              <div className="d-flex gap-1 align-items-center bg-light p-1 rounded border border-danger">
                <span className="small text-danger fw-bold ms-1 me-1">Clear?</span>
                <button className="btn btn-danger btn-sm px-2 py-0" onClick={executeClearAll}>Yes</button>
                <button className="btn btn-secondary btn-sm px-2 py-0" onClick={() => setShowConfirm(false)}>No</button>
              </div>
            ) : (
              <button className="btn btn-outline-danger btn-sm" onClick={() => setShowConfirm(true)}>
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}