import React, { useState } from 'react';
import { Tag } from 'lucide-react';

export default function AlertCard({ item, onRefresh }) {
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
    const text = `🚨 *KIRANA FLASH SALE* 🚨\n\nGrab *${item.product_name}* before it runs out!\n\n✅ Offer Price: ₹${offerPrice} ${discountText}\n📦 Stock available: ${item.quantity} units\n\nVisit our shop today to claim this deal!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleSellOne = async () => {
    try {
      await fetch(`https://kirana-expiry-shield.onrender.com/api/inventory/batch/${item.batch_id}/sell?quantity=1`, { method: 'PATCH' });
      if (onRefresh) onRefresh(); 
    } catch (error) {
      console.error("Sell error:", error);
    }
  };

  const executeClearAll = async () => {
    try {
      await fetch(`https://kirana-expiry-shield.onrender.com/api/inventory/batch/${item.batch_id}`, { method: 'DELETE' });
      setShowConfirm(false);
      if (onRefresh) onRefresh(); 
    } catch (error) {
      console.error("Clear error:", error);
    }
  };

  const cardColor = item.days_left < 0 ? 'border-danger' : item.days_left <= 7 ? 'border-danger' : 'border-warning';
  const badgeColor = item.days_left < 0 ? 'bg-danger text-white' : item.days_left <= 7 ? 'bg-danger text-white' : 'bg-warning text-dark';

  return (
    <div className={`card shadow-sm mb-3 border-0 border-start ${cardColor} border-4 bg-dark text-light`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
          <div>
            <h5 className="card-title fw-bold mb-0">{item.product_name}</h5>
            <p className="text-secondary small mb-1">Barcode: {item.barcode}</p>
          </div>
          <span className={`badge ${badgeColor} flex-shrink-0`}>{item.status}</span>
        </div>
        
        <div className="row small mb-3">
          <div className="col-4">
            <strong className="text-gray-300">Stock:</strong> {item.quantity}
          </div>
          <div className="col-4">
            <strong className="text-gray-300">Left:</strong> {item.days_left}d
          </div>
          <div className="col-4 text-danger fw-bold">
            Risk: ₹{item.potential_loss_rupees}
          </div>
        </div>

        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mt-3 gap-3">
          <div className="d-flex align-items-center bg-secondary bg-opacity-25 px-2 py-1 rounded border border-secondary w-100 w-sm-auto">
            <Tag size={14} className="me-1 text-primary" />
            <span className="fw-bold text-light small">{item.action}</span>
          </div>
          
          <div className="d-flex flex-wrap gap-2 w-100 justify-content-end">
            <button className="btn btn-outline-success btn-sm flex-grow-1 flex-sm-grow-0" onClick={sendWhatsAppOffer}>
              Offer on WA
            </button>
            <button className="btn btn-outline-primary btn-sm flex-grow-1 flex-sm-grow-0" onClick={handleSellOne}>
              Sell 1
            </button>
            
            {showConfirm ? (
              <div className="d-flex gap-1 align-items-center bg-dark p-1 rounded border border-danger flex-grow-1 flex-sm-grow-0 justify-content-center">
                <span className="small text-danger fw-bold ms-1 me-1">Clear?</span>
                <button className="btn btn-danger btn-sm px-2 py-0" onClick={executeClearAll}>Yes</button>
                <button className="btn btn-secondary btn-sm px-2 py-0" onClick={() => setShowConfirm(false)}>No</button>
              </div>
            ) : (
              <button className="btn btn-outline-danger btn-sm flex-grow-1 flex-sm-grow-0" onClick={() => setShowConfirm(true)}>
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}