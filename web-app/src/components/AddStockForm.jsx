import React, { useState, useEffect } from 'react';
import { Camera, Save, Search, ScanBarcode } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { scanProductImage, addInventoryBatch, getProductByBarcode } from '../api/apiService';

export default function AddStockForm({ onClose, onRefresh }) {
  const [loadingOcr, setLoadingOcr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [scannedTextHelper, setScannedTextHelper] = useState("");
  const [isScanningBarcode, setIsScanningBarcode] = useState(false);

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

  // Modified to optionally accept a directly scanned barcode
  const handleBarcodeLookup = async (scannedCode = null) => {
    const codeToSearch = typeof scannedCode === 'string' ? scannedCode : formData.barcode;
    if (!codeToSearch) return;
    
    setLookingUp(true);
    const result = await getProductByBarcode(codeToSearch);
    if (result && result.exists) {
      setFormData(prev => ({
        ...prev,
        barcode: codeToSearch,
        name: result.product.name,
        mrp: result.product.mrp,
        category: result.product.category || 'General'
      }));
    } else if (typeof scannedCode === 'string') {
      // If it was a camera scan but product isn't in DB, just fill the barcode box
      setFormData(prev => ({ ...prev, barcode: codeToSearch }));
    }
    setLookingUp(false);
  };

  // Webcam Scanner Logic
  useEffect(() => {
    let scanner = null;
    if (isScanningBarcode) {
      scanner = new Html5QrcodeScanner(
        "barcode-reader", 
        { fps: 10, qrbox: { width: 250, height: 100 } }, 
        false
      );
      
      scanner.render(
        (decodedText) => {
          // On Success: Stop scanner, fill form, and lookup product!
          scanner.clear();
          setIsScanningBarcode(false);
          handleBarcodeLookup(decodedText);
        },
        (error) => {
          // Silently ignore active scanning errors
        }
      );
    }
    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error("Scanner cleanup error", e));
      }
    };
  }, [isScanningBarcode]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoadingOcr(true);
    setScannedTextHelper(""); 
    
    try {
      const result = await scanProductImage(file);
      
      if (result && result.success) {
        setScannedTextHelper(`AI Found: ${result.expiry_date || "N/A"} | Raw Text: ${result.extracted_text.substring(0, 50)}...`);

        if (result.expiry_date) {
          let foundDate = result.expiry_date.trim();
          const parts = foundDate.split(/[-/]/); 
          
          if (parts.length === 3) {
            let d = parts[0].padStart(2, '0');
            let m = parts[1].padStart(2, '0');
            let y = parts[2];
            if (y.length === 2) y = "20" + y; 
            setFormData({ ...formData, expiry_date: `${y}-${m}-${d}` });
            
          } else if (parts.length === 2) {
            let month = parseInt(parts[1]) <= 12 ? parts[1] : parts[0];
            let year = parseInt(parts[0]) > 12 ? parts[0] : parts[1];
            if (year.length === 2) year = "20" + year;
            setFormData({ ...formData, expiry_date: `${year}-${month.padStart(2, '0')}-01` });
            
          } else {
             alert(`The AI found an unusual date format: "${foundDate}". Please select the date manually.`);
          }
        }
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
            
            {/* NEW: Barcode Webcam View Area */}
            {isScanningBarcode && (
              <div className="mb-4">
                <div id="barcode-reader" className="w-100 overflow-hidden rounded border border-2 border-primary"></div>
                <button 
                  type="button" 
                  className="btn btn-sm btn-danger w-100 mt-2" 
                  onClick={() => setIsScanningBarcode(false)}
                >
                  Cancel Camera
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: isScanningBarcode ? 'none' : 'block' }}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-bold">Barcode</label>
                  <div className="input-group">
                    <input 
                      type="text" 
                      name="barcode" 
                      className="form-control" 
                      value={formData.barcode}
                      onChange={handleChange} 
                      onBlur={handleBarcodeLookup}
                      required 
                    />
                    
                    {/* Look Up Button */}
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary"
                      onClick={handleBarcodeLookup}
                      disabled={lookingUp}
                      title="Search Database"
                    >
                      <Search size={16} className={lookingUp ? "text-muted" : "text-primary"} />
                    </button>

                    {/* NEW: Camera Scan Button */}
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={() => setIsScanningBarcode(true)}
                      title="Scan with Camera"
                    >
                      <ScanBarcode size={16} className="text-white" />
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
                  
                  {loadingOcr && <small className="text-muted d-block mb-2">Scanning image... please wait.</small>}
                  
                  {scannedTextHelper && (
                    <div className="alert alert-info py-2 small mb-2 shadow-sm">
                      <strong>Scanner Result:</strong><br/>
                      {scannedTextHelper}
                    </div>
                  )}
                  
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