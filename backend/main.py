from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ocr_service import extract_expiry_date
from db import supabase
from schemas import AddStockRequest

app = FastAPI(title="Kirana Expiry Shield API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "online", "message": "Expiry Shield API is running"}

# 1. OCR Image Scanner Endpoint
@app.post("/api/scan-expiry")
async def scan_expiry(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
    contents = await file.read()
    result = extract_expiry_from_image(contents)
    return result

# 2. Check Barcode Lookup
@app.get("/api/products/{barcode}")
def get_product_by_barcode(barcode: str):
    response = supabase.table("products").select("*").eq("barcode", barcode).execute()
    if not response.data:
        return {"exists": False, "product": None}
    return {"exists": True, "product": response.data[0]}

# 3. Add Stock & Expiry Batch
@app.post("/api/inventory/add")
def add_inventory_batch(stock: dict):
    try:
        # 1. Add/Update the Master Product Catalog
        supabase.table("products").upsert({
            "barcode": stock["barcode"],
            "name": stock["name"],
            "category": stock.get("category", "General"),
            "mrp": stock["mrp"]
        }).execute()

        # 2. Add the physical inventory batch
        supabase.table("inventory_batches").insert({
            "barcode": stock["barcode"],
            "batch_number": stock.get("batch_number", ""),
            "quantity": stock["quantity"],
            "expiry_date": stock["expiry_date"]
        }).execute()
        
        return {"success": True, "message": "Stock added"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




@app.get("/api/inventory/all")
def get_all_inventory():
    try:
        response = supabase.table("inventory_batches").select(
            "id, batch_number, quantity, expiry_date, barcode, products(name, category, mrp)"
        ).order("expiry_date", desc=False).execute()
        
        items = []
        today = datetime.now().date()
        for b in response.data:
            exp_date = datetime.strptime(b["expiry_date"], "%Y-%m-%d").date()
            days_left = (exp_date - today).days
            prod = b["products"] or {}
            items.append({
                "batch_id": b["id"],
                "barcode": b["barcode"],
                "name": prod.get("name", "Unknown"),
                "category": prod.get("category", "General"),
                "mrp": prod.get("mrp", 0),
                "quantity": b["quantity"],
                "expiry_date": b["expiry_date"],
                "days_left": days_left,
                "total_value": b["quantity"] * prod.get("mrp", 0)
            })
        return {"data": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



from datetime import date
from fastapi import APIRouter, HTTPException

from datetime import datetime
from fastapi import HTTPException

@app.get("/api/inventory/expiring")
def get_expiring_inventory():
    try:
        # Fetch batches AND join with the master products table
        response = supabase.table("inventory_batches").select(
            "id, batch_number, quantity, expiry_date, barcode, products(name, mrp)"
        ).execute()
        
        alerts = []
        today = datetime.now().date()
        
        for item in response.data:
            # Calculate days left
            exp_date = datetime.strptime(item["expiry_date"], "%Y-%m-%d").date()
            days_left = (exp_date - today).days
            
            # Risk Logic
            status = "SAFE"
            action = "None"
            if days_left < 0:
                status = "EXPIRED"
                action = "Throw Away"
            elif days_left <= 30:
                status = "CRITICAL"
                action = "50% Discount"
            elif days_left <= 90:
                status = "WARNING"
                action = "20% Discount"

            # Safely extract joined product data
            mrp = item["products"]["mrp"] if item["products"] else 0
            name = item["products"]["name"] if item["products"] else "Unknown Product"
            loss = item["quantity"] * mrp
            
            alerts.append({
                "batch_id": item["id"],
                "barcode": item["barcode"],
                "product_name": name,
                "quantity": item["quantity"],
                "days_left": days_left,
                "status": status,
                "action": action,
                "potential_loss_rupees": loss
            })
            
        # Sort by lowest days left
        alerts.sort(key=lambda x: x["days_left"])
        return {"data": alerts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




@app.patch("/api/inventory/batch/{batch_id}/sell")
def sell_unit(batch_id: str, quantity: int = 1):
    try:
        # 1. Fetch current stock
        batch = supabase.table("inventory_batches").select("quantity").eq("id", batch_id).single().execute()
        if not batch.data:
            raise HTTPException(status_code=404, detail="Batch not found")

        current_qty = batch.data["quantity"]
        new_qty = current_qty - quantity

        if new_qty <= 0:
            # Batch depleted -> delete it
            supabase.table("inventory_batches").delete().eq("id", batch_id).execute()
            return {"success": True, "message": "Batch fully sold and cleared", "remaining": 0}
        else:
            # Update remaining quantity
            supabase.table("inventory_batches").update({"quantity": new_qty}).eq("id", batch_id).execute()
            return {"success": True, "message": f"Sold {quantity} unit(s)", "remaining": new_qty}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.delete("/api/inventory/batch/{batch_id}")
def delete_inventory_batch(batch_id: str):
    try:
        supabase.table("inventory_batches").delete().eq("id", batch_id).execute()
        return {"success": True, "message": "Batch cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




        from fastapi import FastAPI, File, UploadFile, HTTPException
# Make sure your existing imports (like CORS, pydantic models, etc.) stay here
from ocr_service import extract_expiry_date # Adjust this import based on your exact function name

app = FastAPI()

# ... (your existing setup and routes) ...

@app.post("/api/scan")
async def scan_product_label(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read the image file into memory
        image_bytes = await file.read()
        
        # Pass the bytes to your EasyOCR logic
        # (Assuming extract_expiry_date is your function in ocr_service.py)
        ocr_result = extract_expiry_date(image_bytes)
        
        return {
            "success": True,
            "filename": file.filename,
            "extracted_text": ocr_result.get("text", ""),
            "expiry_date": ocr_result.get("date", None)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR Processing failed: {str(e)}")