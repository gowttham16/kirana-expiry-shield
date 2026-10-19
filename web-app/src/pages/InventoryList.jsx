import React, { useEffect, useState } from 'react';
import { fetchAllInventory, deleteInventoryBatch } from '../api/inventoryApi';
import { Search, Trash2 } from 'lucide-react';

export default function InventoryList() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAllInventory();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (batchId) => {
    if (confirm("Remove this batch from store records?")) {
      await deleteInventoryBatch(batchId);
      loadData();
    }
  };

  const filtered = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.barcode.includes(search) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold text-secondary mb-0">Store Inventory Catalog</h4>
        <div className="input-group" style={{ maxWidth: '320px' }}>
          <span className="input-group-text bg-white"><Search size={16} /></span>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search name, barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Product</th>
                <th>Barcode</th>
                <th>Category</th>
                <th>MRP</th>
                <th>Stock</th>
                <th>Total Value</th>
                <th>Expiry</th>
                <th>Days Left</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">Loading inventory data...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">No matching inventory items found.</td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.batch_id}>
                    <td className="fw-semibold">{row.name}</td>
                    <td><code>{row.barcode}</code></td>
                    <td><span className="badge bg-light text-dark border">{row.category}</span></td>
                    <td>₹{row.mrp}</td>
                    <td><span className="badge bg-secondary">{row.quantity}</span></td>
                    <td className="fw-semibold">₹{row.total_value}</td>
                    <td>{row.expiry_date}</td>
                    <td>
                      <span className={`badge ${row.days_left <= 30 ? 'bg-danger' : row.days_left <= 90 ? 'bg-warning text-dark' : 'bg-success'}`}>
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