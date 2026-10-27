import React, { useEffect, useState } from 'react';
import { fetchAllInventory, deleteInventoryBatch } from '../api/apiService';
import { Search, Trash2, Download } from 'lucide-react';

export default function InventoryList() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [exportStatus, setExportStatus] = useState("");

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAllInventory();
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (batchId) => {
    if (window.confirm("Remove this batch from store records?")) {
      await deleteInventoryBatch(batchId);
      loadData();
    }
  };

  const filtered = items.filter(i => 
    (i.name && i.name.toLowerCase().includes(search.toLowerCase())) ||
    (i.barcode && i.barcode.includes(search))
  );

  const handleExportReport = () => {
    if (!items || items.length === 0) {
      alert("No inventory data to export.");
      return;
    }

    const headers = ["Product Name,Barcode,Category,Stock Quantity,MRP (Rs),Total Value (Rs),Expiry Date,Days Left"];
    
    const rows = items.map(item => {
      const safeName = item.name ? item.name.replace(/,/g, '') : 'Unknown'; 
      return `${safeName},${item.barcode},${item.category || 'General'},${item.quantity},${item.mrp},${item.total_value},${item.expiry_date},${item.days_left}`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Kirana_Inventory_Report_${today}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportStatus("✅ Downloaded!");
    setTimeout(() => setExportStatus(""), 3000);
  };

  return (
    <div className="text-white">
      {/* Mobile-first Header: Stacks on small screens, side-by-side on desktop */}
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center mb-4 gap-3">
        <h4 className="fw-bold text-light mb-0">Store Inventory Catalog</h4>
        
        <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-3 w-100" style={{ maxWidth: '600px' }}>
          {exportStatus && <span className="text-success small fw-bold mb-0 text-center">{exportStatus}</span>}
          
          <button className="btn btn-success d-flex justify-content-center align-items-center flex-shrink-0" onClick={handleExportReport}>
            <Download size={18} className="me-2" />
            Export Report
          </button>

          <div className="input-group flex-grow-1">
            <span className="input-group-text bg-dark text-secondary border-secondary"><Search size={16} /></span>
            <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Search name, barcode..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card shadow-lg border-0 bg-dark">
        {/* Removed table-responsive horizontal scrolling in favor of hiding less critical columns on mobile */}
        <div className="w-100">
          <table className="table table-dark table-hover align-middle mb-0">
            <thead className="table-active text-secondary">
              <tr>
                <th>Product</th>
                <th className="d-none d-lg-table-cell">Barcode</th>
                <th className="d-none d-md-table-cell">Category</th>
                <th className="d-none d-sm-table-cell">MRP</th>
                <th>Stock</th>
                <th className="d-none d-lg-table-cell">Total Value</th>
                <th className="d-none d-md-table-cell">Expiry</th>
                <th>Days Left</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="text-center py-5 text-secondary">Loading inventory data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-5 text-secondary">No matching inventory items found.</td></tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.batch_id}>
                    <td className="fw-semibold text-light">{row.name}</td>
                    <td className="d-none d-lg-table-cell"><code className="text-secondary">{row.barcode}</code></td>
                    <td className="d-none d-md-table-cell"><span className="badge bg-secondary bg-opacity-25 text-light border border-secondary">{row.category}</span></td>
                    <td className="d-none d-sm-table-cell text-light">₹{row.mrp}</td>
                    <td><span className="badge bg-secondary fs-6">{row.quantity}</span></td>
                    <td className="d-none d-lg-table-cell fw-semibold text-light">₹{row.total_value}</td>
                    <td className="d-none d-md-table-cell text-light">{row.expiry_date}</td>
                    <td>
                      {/* High contrast badges for dark mode */}
                      <span className={`badge border fs-6 ${row.days_left <= 30 ? 'bg-danger text-white border-danger' : row.days_left <= 90 ? 'bg-warning text-dark border-warning' : 'bg-success bg-opacity-25 text-success border-success'}`}>
                        {row.days_left}d
                      </span>
                    </td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(row.batch_id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}