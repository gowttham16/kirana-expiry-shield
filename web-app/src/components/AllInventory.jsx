import React, { useEffect, useState } from 'react';
import { fetchAllInventory, deleteInventoryBatch } from '../api/apiService';
import { Search, Trash2, Download, AlertCircle } from 'lucide-react';

export default function AllInventory() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [exportStatus, setExportStatus] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);

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

  const filtered = items.filter(i => {
    const matchesSearch = (i.name && i.name.toLowerCase().includes(search.toLowerCase())) || (i.barcode && i.barcode.includes(search));
    const matchesStock = showLowStock ? i.quantity < 5 : true;
    return matchesSearch && matchesStock;
  });

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
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Kirana_Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportStatus("✅ File Downloaded!");
    setTimeout(() => setExportStatus(""), 3000);
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0 d-flex align-items-center text-primary">
          Master Inventory Catalog
        </h4>
        <div className="d-flex align-items-center gap-2">
          {exportStatus && <span className="text-success small fw-bold mb-0">{exportStatus}</span>}
          
          <button 
            className={`btn ${showLowStock ? 'btn-warning' : 'btn-outline-warning'} d-flex align-items-center fw-bold`} 
            onClick={() => setShowLowStock(!showLowStock)}
          >
            <AlertCircle size={18} className="me-2" /> 
            {showLowStock ? "Show All Stock" : "Low Stock Alerts"}
          </button>

          <button className="btn btn-success d-flex align-items-center" onClick={handleExportReport}>
            <Download size={18} className="me-2" /> Export Report
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="input-group">
          <span className="input-group-text bg-white"><Search size={16} /></span>
          <input type="text" className="form-control" placeholder="Search by product name or barcode..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Product Name</th>
                <th>Barcode</th>
                <th>Category</th>
                <th>Expiry Date</th>
                <th>Stock</th>
                <th>MRP</th>
                <th>Total Value</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="text-center py-4 text-muted">Loading inventory data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-4 text-muted">No matching inventory items found.</td></tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.batch_id} className={row.quantity < 5 ? "table-warning" : ""}>
                    <td className="fw-semibold">{row.name}</td>
                    <td><span className="text-muted small">{row.barcode}</span></td>
                    <td><span className="badge bg-secondary">{row.category}</span></td>
                    <td>{row.expiry_date}</td>
                    <td>
                      <span className={`badge ${row.quantity < 5 ? 'bg-danger' : 'bg-primary'}`}>
                        {row.quantity} {row.quantity < 5 && ' (Reorder)'}
                      </span>
                    </td>
                    <td>₹{row.mrp}</td>
                    <td className="text-primary fw-semibold">₹{row.total_value}</td>
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