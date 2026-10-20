import axios from 'axios';

// const API_BASE_URL = 'http://127.0.0.1:8000/api';

// 1. Fetch priority expiring stock for the main dashboard
export const fetchExpiringInventory = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/inventory/expiring`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching expiring inventory:", error);
    return [];
  }
};

// 2. Fetch complete store inventory for the inventory catalog page
export const fetchAllInventory = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/inventory/all`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching all inventory:", error);
    return [];
  }
};

// 3. Search product catalog by barcode (exported under both names)
export const getProductByBarcode = async (barcode) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/products/${barcode}`);
    return response.data;
  } catch (error) {
    console.error("Error looking up barcode:", error);
    return null;
  }
};
export const lookupBarcode = getProductByBarcode;

// 4. Send image to OCR backend (exported under both names)
export const extractExpiryDate = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API_BASE_URL}/ocr/extract-date`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
export const extractDateFromImage = extractExpiryDate;

// 5. Save new inventory batch (exported under both names)
export const addInventoryBatch = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/inventory/add`, payload);
  return response.data;
};
export const saveStock = addInventoryBatch;

// 6. Delete a batch
export const deleteInventoryBatch = async (batchId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/inventory/batch/${batchId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting batch:", error);
    return { success: false };
  }
};

export const scanExpiryImage = extractExpiryDate;


export const sellBatchUnit = async (batchId, quantity = 1) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/inventory/batch/${batchId}/sell?quantity=${quantity}`);
    return response.data;
  } catch (error) {
    console.error("Error updating batch quantity:", error);
    return { success: false };
  }
};




const API_BASE_URL = "https://your-new-link.ngrok-free.app/api"; // Make sure /api is at the end if needed!



export const scanProductImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);

  try {
    const response = await fetch(`${API_BASE_URL}/scan`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) throw new Error("Failed to scan image");
    
    return await response.json();
  } catch (error) {
    console.error("OCR API Error:", error);
    return null;
  }
};