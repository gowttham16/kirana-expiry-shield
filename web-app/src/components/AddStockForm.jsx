import React, { useState, useEffect, useRef } from 'react';
import { Camera, Save, Search, ScanBarcode, ScanText } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { scanProductImage, addInventoryBatch, getProductByBarcode } from '../api/apiService';

export default function AddStockForm({ onClose, onRefresh }) {
  const [loadingOcr, setLoadingOcr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [scannedTextHelper, setScannedTextHelper] = useState("");
  const [isScanningBarcode, setIsScanningBarcode] = useState(false);
  
  // NEW: State for the live expiry date camera
  const [isDateCameraOpen, setIsDateCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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
      setFormData(prev => ({ ...prev, barcode: codeToSearch }));
    }
    setLookingUp(false);
  };

  // Barcode Scanner Logic
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
          scanner.clear();
          setIsScanningBarcode(false);
          handleBarcodeLookup(decodedText);
        },
        (error) => {}
      );
    }
    return () => {
      if (scanner) scanner.clear().catch(e => console.error(e));
    };
  }, [isScanningBarcode]);

  // NEW: Start the Expiry Date Camera
  const startDateCamera = async () => {
    setIsDateCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Camera access denied or unavailable.");
      setIsDateCameraOpen(false);
    }
  };

  // NEW: Stop the Expiry Date Camera
  const stopDateCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsDateCameraOpen(false);
  };

  // NEW: Snap frame from video and send to AI
  const captureAndExtractDate = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    stopDateCamera();

    canvas.toBlob(async (blob) => {
      const file = new File([blob], "captured_date.jpg", { type: "image/jpeg" });
      await processOcrImage(file);
    }, 'image/jpeg');
  };

  // REFACTORED: Unified AI logic for both file uploads and live camera snaps
  const processOcrImage = async (file) => {
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
            setFormData(prev => ({ ...prev, expiry_date: `${y}-${m}-${d}` }));
          } else if (parts.length === 2) {
            let month = parseInt(parts[1]) <= 12 ? parts[1] : parts[0];
            let year = parseInt(parts[0]) > 12 ? parts[0] : parts[1];
            if (year.length === 2) year = "20" + year;
            setFormData(prev => ({ ...prev, expiry_date: `${year}-${month.padStart(2, '0')}-01` }));
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
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title fw-bold">Scan & Add Stock</h5>
            <button type="button" className="btn-close btn-close-white" onClick={() => { stopDateCamera(); onClose(); }}></button>
          </div>
          
          <div className="modal-body p-4">
            
            {isScanningBarcode && (
              <div className="mb-4">
                <div id="barcode-reader" className="w-100 overflow-hidden rounded border border-2 border-primary"></div>
                <button type="button" className="btn btn-sm btn-danger w-100 mt-2" onClick={() => setIsScanningBarcode(false)}>
                  Cancel Barcode Scanner
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
                    <button type="button" className="btn btn-outline-secondary" onClick={handleBarcodeLookup} disabled={lookingUp}>
                      <Search size={16} className={lookingUp ? "text-muted" : "text-primary"} />
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => setIsScanningBarcode(true)} title="Live Scan Barcode">
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
                
                <div className="col-12 mt-4 p-3 bg-light rounded border">
                  <label className="form-label small fw-bold d-flex align-items-center text-primary mb-3">
                    <ScanText size={18} className="me-2" />
                    Auto-Extract Expiry Date
                  </label>
                  
                  {/* NEW: Live Date Camera View */}
                  {isDateCameraOpen ? (
                    <div className="mb-3 text-center">
                      <video ref={videoRef} autoPlay playsInline className="w-100 rounded border bg-dark mb-2" style={{ maxHeight: '250px', objectFit: 'cover' }}></video>
                      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                      <div className="d-flex gap-2 justify-content-center">
                        <button type="button" className="btn btn-success fw-bold flex-grow-1" onClick={captureAndExtractDate}>
                          <Camera size={18} className="me-2"/> Snap & Extract
                        </button>
                        <button type="button" className="btn btn-danger" onClick={stopDateCamera}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex gap-2 mb-3">
                      <button type="button" className="btn btn-outline-primary d-flex align-items-center justify-content-center flex-grow-1" onClick={startDateCamera}>
                        <Camera size={18} className="me-2" /> Live Scan Date
                      </button>
                      <div className="flex-grow-1 position-relative">
                        <input type="file" accept="image/*" className="form-control position-absolute opacity-0 w-100 h-100" style={{ cursor: 'pointer' }} onChange={(e) => processOcrImage(e.target.files[0])} />
                        <button type="button" className="btn btn-outline-secondary w-100">Upload Photo</button>
                      </div>
                    </div>
                  )}
                  
                  {loadingOcr && <div className="alert alert-warning small mb-2 py-2">Scanning AI image... please wait.</div>}
                  
                  {scannedTextHelper && (
                    <div className="alert alert-info py-2 small mb-2 shadow-sm">
                      <strong>Scanner Result:</strong><br/>{scannedTextHelper}
                    </div>
                  )}
                  
                  <label className="form-label small fw-bold mt-2">Expiry Date (YYYY-MM-DD)</label>
                  <input type="date" name="expiry_date" className="form-control bg-white" value={formData.expiry_date} onChange={handleChange} required />
                </div>
              </div>

              <div className="mt-4 d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-light" onClick={() => { stopDateCamera(); onClose(); }}>Cancel</button>
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