import React, { useState } from 'react';
import { Camera, Save, Search } from 'lucide-react';
import { scanExpiryImage, addInventoryBatch, getProductByBarcode } from '../api/apiService';

export default function AddStockForm({ onClose, onRefresh }) {
  const [loadingOcr, setLoadingOcr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category: 'General',
    mrp: '',
    batch_number: '',
    quantity: '',
    expiry_date: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // NEW: Barcode Lookup Logic
  const handleBarcodeLookup = async () => {
    if (!formData.barcode) return;
    setLookingUp(true);
    
    const result = await getProductByBarcode(formData.barcode);
    if (result.exists) {
      // Auto-fill the form with the database details
      setFormData(prev => ({
        ...prev,
        name: result.product.name,
        mrp: result.product.mrp,
        category: result.product.category || 'General'
      }));
    }
    setLookingUp(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoadingOcr(true);
    try {
      const result = await scanExpiryImage(file);
      if (result.success && result.expiry_date) {
        setFormData({ ...formData, expiry_date: result.expiry_date });
      } else {
        alert("Could not detect a clear date. Please type it manually.");
      }
    } catch (error) {
      alert("OCR failed. Check backend connection.");
    }
    setLoadingOcr(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        mrp: parseFloat(formData.mrp),
        quantity: parseInt(formData.quantity)
      };
      await addInventoryBatch(payload);
      onRefresh(); 
      onClose();   
    } catch (error) {
      alert("Failed to save inventory.");
      setSaving(false);
    }
  };

  return (
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title fw-bold">Scan & Add Stock</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          
          <div className="modal-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* UPADTED: Barcode field with a lookup button */}
                <div className="col-12">
                  <label className="form-label small fw-bold">Barcode</label>
                  <div className="input-group">
                    <input 
                      type="text" 
                      name="barcode" 
                      className="form-control" 
                      value={formData.barcode}
                      onChange={handleChange} 
                      onBlur={handleBarcodeLookup} // Triggers when user clicks out of the box
                      required 
                    />
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary d-flex align-items-center"
                      onClick={handleBarcodeLookup}
                      disabled={lookingUp}
                    >
                      <Search size={16} className={lookingUp ? "text-muted" : "text-primary"} />
                    </button>
                  </div>
                  {lookingUp && <small className="text-primary">Searching catalog...</small>}
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold">Product Name</label>
                  <input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold">MRP (₹)</label>
                  <input type="number" step="0.01" name="mrp" className="form-control" value={formData.mrp} onChange={handleChange} required />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold">Quantity</label>
                  <input type="number" name="quantity" className="form-control" value={formData.quantity} onChange={handleChange} required />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-bold">Batch Number (Optional)</label>
                  <input type="text" name="batch_number" className="form-control" value={formData.batch_number} onChange={handleChange} />
                </div>
                
                <div className="col-12 mt-4 p-3 bg-light rounded border">
                  <label className="form-label small fw-bold d-flex align-items-center text-primary">
                    <Camera size={18} className="me-2" />
                    Upload Label to Auto-Extract Expiry
                  </label>
                  <input type="file" accept="image/*" className="form-control mb-2" onChange={handleImageUpload} />
                  {loadingOcr && <small className="text-muted">Scanning image... please wait.</small>}
                  
                  <label className="form-label small fw-bold mt-2">Expiry Date (YYYY-MM-DD)</label>
                  <input type="date" name="expiry_date" className="form-control bg-white" value={formData.expiry_date} onChange={handleChange} required />
                </div>
              </div>

              <div className="mt-4 d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-success d-flex align-items-center" disabled={saving || loadingOcr}>
                  <Save size={18} className="me-2" />
                  {saving ? "Saving..." : "Save Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}