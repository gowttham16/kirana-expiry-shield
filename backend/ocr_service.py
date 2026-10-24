import requests
import re
from datetime import datetime

def format_to_iso(date_str):
    """Converts rough OCR dates (23/12/26 or 12-2026) to standard YYYY-MM-DD"""
    try:
        # Normalize separators
        clean_date = re.sub(r'[\.\-]', '/', date_str.strip())
        parts = clean_date.split('/')
        
        if len(parts) == 3:
            day, month, year = parts
            if len(year) == 2:
                year = f"20{year}"
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
            
        elif len(parts) == 2:
            month, year = parts
            if len(year) == 2:
                year = f"20{year}"
            # Default to the last day of the month for MM/YY formats
            if month in ['04', '06', '09', '11']:
                return f"{year}-{month.zfill(2)}-30"
            elif month == '02':
                return f"{year}-02-28"
            else:
                return f"{year}-{month.zfill(2)}-31"
    except:
        return None
    return date_str

def extract_expiry_date(image_bytes: bytes) -> dict:
    try:
        response = requests.post(
            'https://api.ocr.space/parse/image',
            files={'file': ('image.jpg', image_bytes, 'image/jpeg')},
            data={
                'apikey': 'helloworld', 
                'language': 'eng',
                'scale': 'true',
                'isTable': 'true' # Groups text blocks better for curved packets
            },
            timeout=15
        )
        result = response.json()
        
        full_text = ""
        if result.get('ParsedResults'):
            full_text = result['ParsedResults'][0].get('ParsedText', '')
            
        # Clean newlines to prevent broken regex matches
        clean_text = full_text.replace('\r', ' ').replace('\n', ' ')
        
        # STRICT REGEX: Day/Month must be valid. Year MUST be 24-39 or 2024-2039.
        # Format 1: DD/MM/YY or DD-MM-YYYY
        pattern_full = r'\b(?:0?[1-9]|[12]\d|3[01])[/\-\.](?:0?[1-9]|1[0-2])[/\-\.](?:20[2-3]\d|[2-3]\d)\b'
        
        # Format 2: MM/YY or MM-YYYY
        pattern_partial = r'\b(?:0?[1-9]|1[0-2])[/\-\.](?:20[2-3]\d|[2-3]\d)\b'
        
        all_found_dates = re.findall(pattern_full, clean_text)
        
        if not all_found_dates:
            all_found_dates = re.findall(pattern_partial, clean_text)
            
        # Grab the last valid date found on the package (Expiry usually follows PKD)
        raw_date = all_found_dates[-1] if all_found_dates else None
        
        # Format strictly for the React frontend
        standard_date = format_to_iso(raw_date) if raw_date else ""
            
        return {
            "text": full_text.strip(),
            "raw_date": raw_date,
            "date": standard_date # Frontend receives clean YYYY-MM-DD
        }
    except Exception as e:
        print(f"OCR Error: {e}")
        return {"text": "", "date": ""}