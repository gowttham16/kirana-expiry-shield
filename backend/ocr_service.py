import requests
import re

def extract_expiry_date(image_bytes: bytes) -> dict:
    try:
        # 1. Send the image to the free OCR.space API
        response = requests.post(
            'https://api.ocr.space/parse/image',
            files={'file': ('image.jpg', image_bytes, 'image/jpeg')},
            data={'apikey': 'helloworld', 'language': 'eng'}
        )
        result = response.json()
        
        # 2. Extract text from the API response
        full_text = ""
        if result.get('ParsedResults'):
            full_text = result['ParsedResults'][0].get('ParsedText', '')
        
        # 3. Search the extracted text for common expiry date patterns
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
                
        return {
            "text": full_text,
            "date": found_date
        }
    except Exception as e:
        print(f"Error during OCR processing: {e}")
        return {"text": "", "date": None}