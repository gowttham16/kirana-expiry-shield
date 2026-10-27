import React, { useState, useEffect } from 'react';
import { Camera, Save, Search, ScanBarcode, ScanText, Image as ImageIcon } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { scanProductImage, addInventoryBatch, getProductByBarcode } from '../api/apiService';

export default function AddStockForm({ onClose, onRefresh }) {
  const [loadingOcr, setLoadingOcr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [scannedTextHelper, setScannedTextHelper] = useState("");
  const [isScanningBarcode, setIsScanningBarcode] = useState(false);

  const [formData, setFormData] = useState({
    barcode: '', name: '', category: 'General', mrp: '', batch_number: '', quantity: '', mfg_date: '', expiry_date: '', remaining_days: null
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleBarcodeLookup = async (scannedCode = null) => {
    const codeToSearch = typeof scannedCode === 'string' ? scannedCode : formData.barcode;
    if (!codeToSearch) return;
    setLookingUp(true);
    const result = await getProductByBarcode(codeToSearch);
    if (result && result.exists) {
      setFormData(prev => ({ ...prev, barcode: codeToSearch, name: result.product.name, mrp: result.product.mrp, category: result.product.category || 'General' }));
    } else if (typeof scannedCode === 'string') {
      setFormData(prev => ({ ...prev, barcode: codeToSearch }));
    }
    setLookingUp(false);
  };

  useEffect(() => {
    let scanner = null;
    if (isScanningBarcode) {
      scanner = new Html5QrcodeScanner("barcode-reader", { fps: 10, qrbox: { width: 250, height: 100 } }, false);
      scanner.render((decodedText) => {
        scanner.clear();
        setIsScanningBarcode(false);
        handleBarcodeLookup(decodedText);
      }, () => {});
    }
    return () => { if (scanner) scanner.clear().catch(() => {}); };
  }, [isScanningBarcode]);

  const onSelectFile = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setLoadingOcr(true);
      setScannedTextHelper("");
      const file = e.target.files[0];
      await processOcrImage(file);
    }
  };

  const processOcrImage = async (file) => {
    try {
      const result = await scanProductImage(file);
      const foundExp = result.expiry_date || result.exp_date;
      
      if (result && (result.mfg_date || foundExp)) {
        const rawText = result.extracted_text || result.text || "";
        setScannedTextHelper(`AI Found: ${foundExp || "N/A"} | Raw Text: ${rawText.substring(0, 50)}...`);
        setFormData(prev => ({ 
            ...prev, 
            mfg_date: result.mfg_date || prev.mfg_date,
            expiry_date: foundExp || prev.expiry_date,
            remaining_days: result.remaining_days !== undefined ? result.remaining_days : prev.remaining_days
        }));
      } else {
        alert("Could not detect clear dates. Please type them manually.");
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
      await addInventoryBatch({ ...formData, mrp: parseFloat(formData.mrp), quantity: parseInt(formData.quantity) });
      onRefresh(); 
      onClose();   
    } catch (error) {
      alert("Failed to save inventory.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-gray-900 rounded-xl shadow-2xl p-4 md:p-6 text-white border border-gray-700">
        
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-2">
          <h5 className="fw-bold mb-0 text-white">Scan & Add Stock</h5>
          <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
        </div>
          
        {isScanningBarcode && (
          <div className="mb-4">
            <div id="barcode-reader" className="w-100 overflow-hidden rounded border border-2 border-primary bg-white"></div>
            <button type="button" className="btn btn-sm btn-danger w-100 mt-2" onClick={() => setIsScanningBarcode(false)}>Cancel Barcode Scanner</button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: isScanningBarcode ? 'none' : 'block' }}>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label small fw-bold text-gray-300">Barcode</label>
              <div className="input-group">
                <input type="text" name="barcode" className="form-control bg-dark text-white border-secondary" value={formData.barcode} onChange={handleChange} onBlur={handleBarcodeLookup} required />
                <button type="button" className="btn btn-outline-secondary" onClick={handleBarcodeLookup} disabled={lookingUp}><Search size={16} /></button>
                <button type="button" className="btn btn-primary" onClick={() => setIsScanningBarcode(true)}><ScanBarcode size={16} className="text-white" /></button>
              </div>
            </div>

            <div className="col-12">
              <label className="form-label small fw-bold text-gray-300">Product Name</label>
              <input type="text" name="name" className="form-control bg-dark text-white border-secondary" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="col-6">
              <label className="form-label small fw-bold text-gray-300">MRP (₹)</label>
              <input type="number" step="0.01" name="mrp" className="form-control bg-dark text-white border-secondary" value={formData.mrp} onChange={handleChange} required />
            </div>
            <div className="col-6">
              <label className="form-label small fw-bold text-gray-300">Quantity</label>
              <input type="number" name="quantity" className="form-control bg-dark text-white border-secondary" value={formData.quantity} onChange={handleChange} required />
            </div>
            
            <div className="col-12 mt-4 p-3 bg-gray-800 rounded border border-gray-700">
              <label className="form-label small fw-bold d-flex align-items-center text-primary mb-3">
                <ScanText size={18} className="me-2" /> Auto-Extract Expiry Date
              </label>
              
              <div className="d-flex gap-2 mb-3">
                <div className="flex-grow-1 position-relative">
                  <input type="file" accept="image/*" capture="environment" className="form-control position-absolute opacity-0 w-100 h-100" style={{ cursor: 'pointer', zIndex: 10 }} onChange={onSelectFile} />
                  <button type="button" className="btn btn-primary w-100 shadow-sm"><Camera size={18} className="me-2" /> Use Camera</button>
                </div>
                <div className="flex-grow-1 position-relative">
                  <input type="file" accept="image/*" className="form-control position-absolute opacity-0 w-100 h-100" style={{ cursor: 'pointer', zIndex: 10 }} onChange={onSelectFile} />
                  <button type="button" className="btn btn-outline-secondary text-white w-100 shadow-sm"><ImageIcon size={18} className="me-2" /> Gallery</button>
                </div>
              </div>
              
              {loadingOcr && (
                <div className="flex items-center justify-center p-3 mb-4 bg-yellow-900/30 rounded-lg animate-pulse border border-yellow-700/50">
                  <svg className="animate-spin h-5 w-5 text-yellow-500 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span className="text-yellow-400 font-medium">Extracting dates... (10-30s)</span>
                </div>
              )}
              
              {scannedTextHelper && <div className="alert alert-info bg-blue-900/30 text-blue-300 border-blue-800 py-2 small mb-2 shadow-sm"><strong>Scanner Result:</strong><br/>{scannedTextHelper}</div>}
              
              <div className="row mt-2">
                  <div className="col-6">
                      <label className="form-label small fw-bold text-gray-300">Mfg Date (YYYY-MM-DD)</label>
                      <input type="date" name="mfg_date" className="form-control bg-dark text-white border-secondary" value={formData.mfg_date} onChange={handleChange} />
                  </div>
                  <div className="col-6">
                      <label className="form-label small fw-bold text-gray-300">Expiry Date (YYYY-MM-DD)</label>
                      <input type="date" name="expiry_date" className="form-control bg-dark text-white border-secondary" value={formData.expiry_date} onChange={handleChange} required />
                  </div>
              </div>

              {formData.remaining_days !== null && (
                  <div className={`alert mt-3 py-2 small fw-bold text-center ${formData.remaining_days > 0 ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-red-900/30 text-red-400 border-red-800'}`}>
                      Shelf Life: {formData.remaining_days > 0 ? `${formData.remaining_days} days remaining` : 'EXPIRED!'}
                  </div>
              )}
            </div>
          </div>

          <div className="mt-4 d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-light" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={saving || loadingOcr}><Save size={18} className="me-2" /> Save Stock</button>
          </div>
        </form>
      </div>
    </div>
  );
}