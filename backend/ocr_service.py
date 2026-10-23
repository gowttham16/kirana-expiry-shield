import requests
import re

def extract_expiry_date(image_bytes: bytes) -> dict:
    try:
        response = requests.post(
            'https://api.ocr.space/parse/image',
            files={'file': ('image.jpg', image_bytes, 'image/jpeg')},
            data={
                'apikey': 'helloworld', 
                'language': 'eng',
                'OCREngine': '2',   # Optimized for numbers and receipts
                'scale': 'true'     # Upscales the image for better accuracy
            }
        )
        result = response.json()
        
        full_text = ""
        if result.get('ParsedResults'):
            full_text = result['ParsedResults'][0].get('ParsedText', '')
        
        date_patterns = [
            r'\b\d{2}/\d{2}/\d{4}\b',  
            r'\b\d{2}-\d{2}-\d{4}\b',  
            r'\b\d{2}/\d{4}\b',        
            r'\b\d{2}/\d{2}\b',        
            r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\b' 
        ]
        
        found_date = None
        for pattern in date_patterns:
            matches = re.findall(pattern, full_text, re.IGNORECASE)
            if matches:
                found_date = matches[0]
                break
                
        return {"text": full_text, "date": found_date}
    except Exception as e:
        print(f"Error during OCR processing: {e}")
        return {"text": "", "date": None}