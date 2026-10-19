from pydantic import BaseModel
from typing import Optional

class AddStockRequest(BaseModel):
    barcode: str
    name: str
    category: Optional[str] = "General"
    mrp: float
    batch_number: Optional[str] = "DEFAULT"
    quantity: int
    expiry_date: str  # Format: "YYYY-MM-DD"