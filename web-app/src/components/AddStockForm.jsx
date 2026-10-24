import React, { useState, useEffect, useRef } from 'react';
import { Camera, Save, Search, ScanBarcode, ScanText, Image as ImageIcon, Crop as CropIcon } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { scanProductImage, addInventoryBatch, getProductByBarcode } from '../api/apiService';

export default function AddStockForm({ onClose, onRefresh }) {
  const [loadingOcr, setLoadingOcr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [scannedTextHelper, setScannedTextHelper] = useState("");
  const [isScanningBarcode, setIsScanningBarcode] = useState(false);

  // Cropper State
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

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

  // Load image into the cropper instead of sending immediately
  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Generate cropped image and send to backend
  const confirmCrop = () => {
    if (!completedCrop || !imgRef.current) return;
    setLoadingOcr(true);
    setScannedTextHelper(""); 

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0, completedCrop.width, completedCrop.height
    );

    canvas.toBlob(async (blob) => {
      const croppedFile = new File([blob], "cropped_date.jpg", { type: 'image/jpeg' });
      setImgSrc(''); // Hide cropper modal
      await processOcrImage(croppedFile);
    }, 'image/jpeg', 0.9);
  };

  const processOcrImage = async (file) => {
    try {
      const result = await scanProductImage(file);
      if (result && (result.mfg_date || result.exp_date)) {
        const rawText = result.text || "";
        setScannedTextHelper(`AI Found: ${result.exp_date || "N/A"} | Raw Text: ${rawText.substring(0, 50)}...`);
        setFormData(prev => ({ 
            ...prev, 
            mfg_date: result.mfg_date || prev.mfg_date,
            expiry_date: result.exp_date || prev.expiry_date,
            remaining_days: result.remaining_days !== undefined ? result.remaining_days : prev.remaining_days
        }));
      } else {
        alert("Could not detect clear dates in that cropped area. Please type them manually.");
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
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title fw-bold">Scan & Add Stock</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          
          <div className="modal-body p-4">
            
            {/* Cropper Overlay */}
            {imgSrc && (
              <div className="position-absolute top-0 start-0 w-100 h-100 bg-white z-3 p-3 d-flex flex-column align-items-center">
                <h6 className="fw-bold mb-3"><CropIcon size={18} className="me-2"/>Crop exactly around the dates</h6>
                <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
                    <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)}>
                        <img ref={imgRef} src={imgSrc} alt="Crop me" style={{ maxWidth: '100%' }} />
                    </ReactCrop>
                </div>
                <div className="d-flex gap-2 mt-3 w-100">
                    <button className="btn btn-secondary flex-grow-1" onClick={() => setImgSrc('')}>Cancel</button>
                    <button className="btn btn-primary flex-grow-1" onClick={confirmCrop}>Scan Cropped Area</button>
                </div>
              </div>
            )}

            {isScanningBarcode && (
              <div className="mb-4">
                <div id="barcode-reader" className="w-100 overflow-hidden rounded border border-2 border-primary"></div>
                <button type="button" className="btn btn-sm btn-danger w-100 mt-2" onClick={() => setIsScanningBarcode(false)}>Cancel Barcode Scanner</button>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: isScanningBarcode || imgSrc ? 'none' : 'block' }}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-bold">Barcode</label>
                  <div className="input-group">
                    <input type="text" name="barcode" className="form-control" value={formData.barcode} onChange={handleChange} onBlur={handleBarcodeLookup} required />
                    <button type="button" className="btn btn-outline-secondary" onClick={handleBarcodeLookup} disabled={lookingUp}><Search size={16} /></button>
                    <button type="button" className="btn btn-primary" onClick={() => setIsScanningBarcode(true)}><ScanBarcode size={16} className="text-white" /></button>
                  </div>
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
                
                <div className="col-12 mt-4 p-3 bg-light rounded border">
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
                      <button type="button" className="btn btn-outline-secondary w-100 bg-white shadow-sm"><ImageIcon size={18} className="me-2" /> Gallery</button>
                    </div>
                  </div>
                  
                  {loadingOcr && <div className="alert alert-warning small mb-2 py-2">Scanning cropped area... please wait.</div>}
                  {scannedTextHelper && <div className="alert alert-info py-2 small mb-2 shadow-sm"><strong>Scanner Result:</strong><br/>{scannedTextHelper}</div>}
                  
                  <div className="row mt-2">
                      <div className="col-6">
                          <label className="form-label small fw-bold">Mfg Date (YYYY-MM-DD)</label>
                          <input type="date" name="mfg_date" className="form-control bg-white" value={formData.mfg_date} onChange={handleChange} />
                      </div>
                      <div className="col-6">
                          <label className="form-label small fw-bold">Expiry Date (YYYY-MM-DD)</label>
                          <input type="date" name="expiry_date" className="form-control bg-white" value={formData.expiry_date} onChange={handleChange} required />
                      </div>
                  </div>

                  {formData.remaining_days !== null && (
                      <div className={`alert mt-3 py-2 small fw-bold text-center ${formData.remaining_days > 0 ? 'alert-success' : 'alert-danger'}`}>
                          Shelf Life: {formData.remaining_days > 0 ? `${formData.remaining_days} days remaining` : 'EXPIRED!'}
                      </div>
                  )}
                </div>
              </div>

              <div className="mt-4 d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={saving || loadingOcr}><Save size={18} className="me-2" /> Save Stock</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}