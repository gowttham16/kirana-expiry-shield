import os
from supabase import create_client, Client

# 1. Setup Connection
url: str = "https://iacjecgjlctlyxtvyhqb.supabase.co"
key: str = "dummy key"
supabase: Client = create_client(url, key)

def test_insert():
    print("Inserting a dummy product...")
    
    # 2. Insert a product into the catalog
    product_response = supabase.table("products").insert({
        "barcode": "1234567890123",
        "name": "Dolo 650",
        "category": "Medicine",
        "mrp": 35.00
    }).execute()
    
    # Get the new ID that Supabase just created for this product
    new_product_id = product_response.data[0]['id']
    print(f"Success! Product ID is: {new_product_id}")

    print("Inserting a batch for this product...")
    
    # 3. Insert a batch of this product that expires in a few months
    batch_response = supabase.table("inventory_batches").insert({
        "product_id": new_product_id,
        "batch_number": "BCH-999",
        "quantity_remaining": 50,
        "expiry_date": "2027-05-01"  # YYYY-MM-DD
    }).execute()

    print("Success! Dummy data added.")

if __name__ == "__main__":
    test_insert()