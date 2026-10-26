import axios from 'axios';

// 1. Globally bypass Ngrok's browser warning for ALL requests
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

// 2. Set your active Live Render URL
const API_BASE_URL = "https://kirana-backend-3k05.onrender.com/api";
// const API_BASE_URL = "http://127.0.0.1:8000/api"; 
// Note: Change this back to the Render URL before deploying to production.

// Fetch priority expiring stock for the main dashboard
export const fetchExpiringInventory = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/inventory/expiring`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching expiring inventory:", error);
    return [];
  }
};

// Fetch complete store inventory for the inventory catalog page
export const fetchAllInventory = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/inventory/all`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching all inventory:", error);
    return [];
  }
};

// Search product catalog by barcode
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

// Single, unified image scanning function pointing to your working /scan route
export const scanProductImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);

  try {
    const response = await axios.post(`${API_BASE_URL}/scan`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    console.error("OCR API Error:", error);
    return null;
  }
};
// Aliases so your older components don't crash
export const extractExpiryDate = scanProductImage;
export const extractDateFromImage = scanProductImage;
export const scanExpiryImage = scanProductImage;

// Save new inventory batch
export const addInventoryBatch = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/inventory/add`, payload);
  return response.data;
};
export const saveStock = addInventoryBatch;

// Delete a batch
export const deleteInventoryBatch = async (batchId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/inventory/batch/${batchId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting batch:", error);
    return { success: false };
  }
};

// Sell/Update batch unit
export const sellBatchUnit = async (batchId, quantity = 1) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/inventory/batch/${batchId}/sell?quantity=${quantity}`);
    return response.data;
  } catch (error) {
    console.error("Error updating batch quantity:", error);
    return { success: false };
  }
};



// Send a natural language query to the RAG AI assistant
export const askInventoryAssistant = async (message) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/chat`, { message });
    return response.data.reply;
  } catch (error) {
    console.error("Chat API Error:", error);
    return "Sorry, I am having trouble connecting to the database.";
  }
};