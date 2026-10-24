import React, { useState, useEffect } from 'react';
import { fetchExpiringInventory } from '../api/apiService';
import { AlertTriangle, Tag, Trash2 } from 'lucide-react';

export default function LiquidationDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpiringStock();
  }, []);

  const loadExpiringStock = async () => {
    setLoading(true);
    const data = await fetchExpiringInventory();
    setItems(data || []);
    setLoading(false);
  };

  // Automated Discount Logic
  const getLiquidationStrategy = (days) => {
    if (days < 0) return { card: 'border-danger', badge: 'bg-danger', status: 'Expired', action: 'Dispose Immediately' };
    if (days <= 7) return { card: 'border-danger', badge: 'bg-danger', status: 'Critical', action: 'Liquidate @ 50% OFF' };
    if (days <= 30) return { card: 'border-warning', badge: 'bg-warning text-dark', status: 'Expiring Soon', action: 'Discount @ 20% OFF' };
    return { card: 'border-success', badge: 'bg-success', status: 'Healthy', action: 'Sell at MRP' };
  };

  const sendWhatsAppOffer = (item, strategy) => {
    let offerPrice = item.mrp;
    let discountText = "";

    if (strategy.action.includes("50%")) {
      offerPrice = (item.mrp * 0.5).toFixed(2);
      discountText = `(Flat 50% OFF!)`;
    } else if (strategy.action.includes("20%")) {
      offerPrice = (item.mrp * 0.8).toFixed(2);
      discountText = `(Flat 20% OFF!)`;
    }

    const text = `🚨 *KIRANA FLASH SALE* 🚨\n\nGrab *${item.name}* before it runs out!\n\n❌ MRP: ₹${item.mrp}\n✅ Offer Price: ₹${offerPrice}${discountText}\n📦 Stock available: ${item.quantity} units\n\nVisit our shop today to claim this deal!`;
    
    // Opens WhatsApp with the pre-filled message
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleSellOne = async (batchId) => {
    // Ensure your backend API is called here, e.g.: await sellInventoryUnit(batchId, 1);
    
    // Updates the UI instantly without refreshing the page
    setItems(prevItems => prevItems.map(item => 
      item.id === batchId ? { ...item, quantity: item.quantity - 1 } : item
    ).filter(item => item.quantity > 0));
  };

  const handleClearAll = async (batchId) => {
    const isConfirmed = window.confirm("Shall I clear all?");
    if (isConfirmed) {
      // Ensure your backend API is called here, e.g.: await clearInventoryBatch(batchId);
      
      // Removes the item from the UI instantly
      setItems(prevItems => prevItems.filter(item => item.id !== batchId));
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
            const strategy = getLiquidationStrategy(item.remaining_days);
            
            return (
              <div key={item.id} className="col-12 col-md-6 col-lg-4">
                <div className={`card h-100 shadow-sm ${strategy.card}`}> <div className="card-body"> <div className="d-flex justify-content-between align-items-start mb-2"> <h5 className="card-title fw-bold mb-0">{item.name}</h5> <span className={`badge ${strategy.badge}`}>{strategy.status}</span>
                    </div>
                    <p className="text-muted small mb-3">Barcode: {item.barcode}</p>
                    
                    <ul className="list-unstyled mb-3 small">
                      <li><strong>Stock:</strong> {item.quantity} units</li>
                      <li><strong>Expires:</strong> {item.expiry_date}</li>
                      <li><strong>Remaining:</strong> {item.remaining_days} days</li>
                    </ul>

                    <div className="p-2 bg-light rounded border d-flex align-items-center justify-content-between">
                      <span className="fw-bold small text-primary">
                        <Tag size={14} className="me-1" /> Action:
                      </span>
                      <span className="fw-bold text-dark small">{strategy.action}</span>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-3">
                      <button 
                        className="btn btn-outline-success btn-sm d-flex align-items-center" 
                        onClick={() => sendWhatsAppOffer(item, strategy)}
                      >
                        Offer on WA
                      </button>
                      <button className="btn btn-outline-primary btn-sm" onClick={() => handleSellOne(item.id)}>Sell 1</button>
                      <button className="btn btn-outline-danger btn-sm" onClick={() => handleClearAll(item.id)}>Clear All</button>
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