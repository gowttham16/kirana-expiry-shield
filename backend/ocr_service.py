import easyocr
import re
import numpy as np
from PIL import Image
import io

# Initialize the EasyOCR reader (this loads the AI model into memory)
# Note: If your laptop has an NVIDIA GPU, you can change gpu=False to gpu=True for faster scanning.
reader = easyocr.Reader(['en'], gpu=False) 

def extract_expiry_date(image_bytes: bytes) -> dict:
    try:
        # 1. Convert the raw image bytes into a NumPy array for EasyOCR
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        image_np = np.array(image)

        # 2. Extract text from the image
        # detail=0 tells EasyOCR to just return a simple list of detected text strings
        text_lines = reader.readtext(image_np, detail=0)
        full_text = " ".join(text_lines)
        
        # 3. Search the extracted text for common expiry date patterns
        date_patterns = [
            r'\b\d{2}/\d{2}/\d{4}\b',  # Matches DD/MM/YYYY
            r'\b\d{2}-\d{2}-\d{4}\b',  # Matches DD-MM-YYYY
            r'\b\d{2}/\d{4}\b',        # Matches MM/YYYY
            r'\b\d{2}/\d{2}\b',        # Matches MM/YY
            r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\b' # Matches Jan 2025
        ]
        
        found_date = None
        for pattern in date_patterns:
            matches = re.findall(pattern, full_text, re.IGNORECASE)
            if matches:
                # Grab the first matching date we find
                found_date = matches[0]
                break
                
        return {
            "text": full_text,
            "date": found_date
        }
    except Exception as e:
        print(f"Error during OCR processing: {e}")
        return {"text": "", "date": None}