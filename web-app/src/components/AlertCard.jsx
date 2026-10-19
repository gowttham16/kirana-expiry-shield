import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Check, MinusCircle, MessageCircle } from 'lucide-react';
import { deleteInventoryBatch, sellBatchUnit } from './api/inventoryApi';

export default function AlertCard({ item, onRefresh }) {
  const [loadingAction, setLoadingAction] = useState(false);

  let statusColor = "success";
  let Icon = CheckCircle;
  let badgeBg = "bg-success";
  
  if (item.status === 'CRITICAL' || item.status === 'EXPIRED') {
    statusColor = "danger";
    Icon = AlertCircle;
    badgeBg = "bg-danger text-white";
  } else if (item.status === 'WARNING') {
    statusColor = "warning";
    Icon = AlertTriangle;
    badgeBg = "bg-warning text-dark";
  }

  const handleSellOne = async () => {
    setLoadingAction(true);
    await sellBatchUnit(item.batch_id, 1);
    setLoadingAction(false);
    onRefresh();
  };

  const handleClear = async () => {
    setLoadingAction(true);
    await deleteInventoryBatch(item.batch_id);
    setLoadingAction(false);
    onRefresh();
  };

  const shareOnWhatsApp = () => {
    const discountedPrice = Math.round(item.potential_loss_rupees / item.quantity * 0.7); // 30% off suggestion
    const text = `*Flash Clearance Deal!*%0A${item.product_name} available at special offer price: Rs. ${discountedPrice}!%0ALimited stock (${item.quantity} units left). Grab before stocks run out!`;
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className={`card shadow-sm border-0 border-start border-${statusColor} border-5 mb-3`}>
      <div className="card-body d-flex flex-wrap justify-content-between align-items-center p-4 gap-3">
        
        <div>
          <h5 className="card-title fw-bold mb-1 text-dark">
            {item.product_name}
          </h5>
          <p className="card-text text-muted small mb-2">
            Barcode: <code>{item.barcode}</code> &nbsp;|&nbsp; 
            Batch: {item.batch_id.slice(0, 8)} &nbsp;|&nbsp; 
            Stock: <span className="badge bg-secondary">{item.quantity}</span>
          </p>
          <div className={`d-flex align-items-center text-${statusColor} fw-semibold`}>
            <Icon className="me-2" size={20} />
            {item.days_left < 0 ? `Expired ${Math.abs(item.days_left)} days ago` : `${item.days_left} Days Left`}
          </div>
        </div>

        <div className="text-end d-flex flex-column align-items-end">
          <p className="text-muted small mb-0">Capital at Risk</p>
          <h4 className="fw-bold text-dark mb-2">₹{item.potential_loss_rupees}</h4>
          
          <div className="d-flex flex-wrap gap-2 mt-1">
            {/* WhatsApp Liquidation Trigger */}
            <button 
              className="btn btn-sm btn-outline-success fw-bold d-flex align-items-center shadow-sm"
              onClick={shareOnWhatsApp}
              title="Share discount offer via WhatsApp"
            >
              <MessageCircle size={15} className="me-1" />
              Offer on WA
            </button>

            {/* Sell -1 Unit */}
            <button 
              className="btn btn-sm btn-outline-primary fw-bold d-flex align-items-center shadow-sm"
              onClick={handleSellOne}
              disabled={loadingAction}
            >
              <MinusCircle size={15} className="me-1" />
              Sell 1
            </button>

            {/* Clear Entire Batch */}
            <button 
              className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold d-flex align-items-center shadow-sm"
              onClick={handleClear}
              disabled={loadingAction}
            >
              <Check size={15} className="me-1" />
              Clear All
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}