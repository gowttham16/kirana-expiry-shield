import React, { useState, useEffect } from 'react';
import { Search, Download, Package } from 'lucide-react';
import { fetchAllInventory } from '../api/apiService';

export default function AllInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    const data = await fetchAllInventory();
    setInventory(data);
    setLoading(false);
  };

  // Live search filter matching name or barcode
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.barcode.includes(searchTerm)
  );

  // One-Click CSV Export Logic
  const exportToCSV = () => {
    const headers = ["Batch ID,Barcode,Product Name,Category,MRP,Quantity,Expiry Date,Days Left,Total Value (Rs)"];
    const rows = filteredInventory.map(item => 
      `${item.batch_id},${item.barcode},"${item.name}",${item.category},${item.mrp},${item.quantity},${item.expiry_date},${item.days_left},${item.total_value}`
    );
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "kirana_inventory_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-dark d-flex align-items-center">
          <Package className="me-2 text-primary" size={28} />
          Master Inventory Catalog
        </h3>
        
        {/* CSV Export Button */}
        <button 
          className="btn btn-success fw-bold d-flex align-items-center shadow-sm"
          onClick={exportToCSV}
          disabled={filteredInventory.length === 0}
        >
          <Download size={18} className="me-2" />
          Export Report
        </button>
      </div>

      <div className="card shadow-sm border-0 bg-white">
        <div className="card-header bg-white border-bottom p-3">
          {/* Live Search Bar */}
          <div className="input-group w-50">
            <span className="input-group-text bg-light border-end-0">
              <Search size={18} className="text-muted" />
            </span>
            <input 
              type="text" 
              className="form-control border-start-0 bg-light" 
              placeholder="Search by product name or barcode..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted">Loading catalog...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted small">
                  <tr>
                    <th>Product Name</th>
                    <th>Barcode</th>
                    <th>Category</th>
                    <th>Expiry Date</th>
                    <th>Stock</th>
                    <th>MRP</th>
                    <th>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.length > 0 ? (
                    filteredInventory.map((item) => (
                      <tr key={item.batch_id}>
                        <td className="fw-bold">{item.name}</td>
                        <td><code className="text-muted">{item.barcode}</code></td>
                        <td><span className="badge bg-secondary bg-opacity-25 text-dark">{item.category}</span></td>
                        <td>
                          <span className={item.days_left <= 30 ? "text-danger fw-bold" : "text-dark"}>
                            {item.expiry_date}
                          </span>
                        </td>
                        <td>{item.quantity}</td>
                        <td>₹{item.mrp}</td>
                        <td className="fw-semibold text-primary">₹{item.total_value}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No products found matching "{searchTerm}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}