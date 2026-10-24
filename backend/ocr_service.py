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
                'OCREngine': '2',   
                'scale': 'true'     
            }
        )
        result = response.json()
        
        full_text = ""
        if result.get('ParsedResults'):
            full_text = result['ParsedResults'][0].get('ParsedText', '')
        
        # Added DD/MM/YY and DD.MM.YY patterns to match Indian kirana packaging
        date_patterns = [
            r'\b\d{2}/\d{2}/\d{4}\b',  # DD/MM/YYYY
            r'\b\d{2}-\d{2}-\d{4}\b',  # DD-MM-YYYY
            r'\b\d{2}\.\d{2}\.\d{4}\b',# DD.MM.YYYY
            r'\b\d{2}/\d{2}/\d{2}\b',  # DD/MM/YY (Matches 23/12/26)
            r'\b\d{2}-\d{2}-\d{2}\b',  # DD-MM-YY
            r'\b\d{2}\.\d{2}\.\d{2}\b',# DD.MM.YY
            r'\b\d{2}/\d{4}\b',        # MM/YYYY
            r'\b\d{2}/\d{2}\b',        # MM/YY
            r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\b' 
        ]
        
        all_found_dates = []
        for pattern in date_patterns:
            # Find all matches for the current pattern in the text
            matches = re.findall(pattern, full_text, re.IGNORECASE)
            all_found_dates.extend(matches)
                
        # Heuristic: If multiple dates are found (e.g., PKD and USE BY), 
        # the expiry date is typically the last one printed on the label.
        found_date = all_found_dates[-1] if all_found_dates else None
        
        return {
            "text": full_text,
            "date": found_date,
            "all_dates_found": all_found_dates 
        }
    except Exception as e:
        print(f"Error during OCR processing: {e}")
        return {"text": "", "date": None}