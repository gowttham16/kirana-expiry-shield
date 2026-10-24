import requests
import re
from datetime import datetime

def format_to_iso(date_str):
    try:
        clean_date = re.sub(r'[\.\-]', '/', date_str.strip())
        parts = clean_date.split('/')
        
        if len(parts) == 3:
            day, month, year = parts
            if len(year) == 2: year = f"20{year}"
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
            
        elif len(parts) == 2:
            month, year = parts
            if len(year) == 2: year = f"20{year}"
            if month in ['04', '06', '09', '11']: return f"{year}-{month.zfill(2)}-30"
            elif month == '02': return f"{year}-02-28"
            else: return f"{year}-{month.zfill(2)}-31"
    except:
        return None
    return date_str

def extract_expiry_date(image_bytes: bytes) -> dict:
    try:
        # Reverted to Engine 1 (best for natural photos) and added auto-orientation
        response = requests.post(
            'https://api.ocr.space/parse/image',
            files={'file': ('image.jpg', image_bytes, 'image/jpeg')},
            data={
                'apikey': 'helloworld', 
                'language': 'eng', 
                'scale': 'true', 
                'OCREngine': '1',
                'detectOrientation': 'true'
            },
            timeout=15
        )
        result = response.json()
        
        full_text = result['ParsedResults'][0].get('ParsedText', '') if result.get('ParsedResults') else ""
        clean_text = full_text.replace('\r', ' ').replace('\n', ' ')
        
        pattern_full = r'\b(?:0?[1-9]|[12]\d|3[01])[/\-\.](?:0?[1-9]|1[0-2])[/\-\.](?:20[2-3]\d|[2-3]\d)\b'
        pattern_partial = r'\b(?:0?[1-9]|1[0-2])[/\-\.](?:20[2-3]\d|[2-3]\d)\b'
        
        dates = re.findall(pattern_full, clean_text)
        if not dates:
            dates = re.findall(pattern_partial, clean_text)
            
        mfg_date = ""
        exp_date = ""
        remaining_days = 0
        
        if len(dates) >= 2:
            mfg_date = format_to_iso(dates[0])
            exp_date = format_to_iso(dates[-1])
        elif len(dates) == 1:
            exp_date = format_to_iso(dates[0])

        if exp_date:
            exp_dt = datetime.strptime(exp_date, "%Y-%m-%d")
            remaining_days = (exp_dt - datetime.now()).days

        return {
            "text": full_text.strip(),
            "mfg_date": mfg_date,
            "exp_date": exp_date,
            "remaining_days": remaining_days
        }
    except Exception as e:
        print(f"OCR Error: {e}")
        return {"text": "", "mfg_date": "", "exp_date": "", "remaining_days": 0}