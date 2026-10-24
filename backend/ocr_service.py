import requests
import re
from datetime import datetime

def format_to_iso(date_str):
    """Cleans spaced-out OCR dates (24 / 07 / 26) into YYYY-MM-DD"""
    try:
        clean = re.sub(r'[\s\.\-]', '/', date_str.strip())
        parts = [p for p in clean.split('/') if p]
        
        if len(parts) == 3:
            d, m, y = parts
            if len(y) == 2: y = f"20{y}"
            return f"{y}-{m.zfill(2)}-{d.zfill(2)}"
        elif len(parts) == 2:
            m, y = parts
            if len(y) == 2: y = f"20{y}"
            return f"{y}-{m.zfill(2)}-28"
    except:
        pass
    return ""

def extract_expiry_date(image_bytes: bytes) -> dict:
    try:
        # Engine 2 is strictly for numbers, receipts, and tables
        response = requests.post(
            'https://api.ocr.space/parse/image',
            files={'file': ('image.jpg', image_bytes, 'image/jpeg')},
            data={'apikey': 'helloworld', 'language': 'eng', 'scale': 'true', 'OCREngine': '2'},
            timeout=15
        )
        res = response.json()
        text = res['ParsedResults'][0]['ParsedText'] if res.get('ParsedResults') else ""
        
        # Forgiving Regex: Catches numbers even if OCR adds spaces (e.g. 24 / 07 / 2026)
        pattern = r'\b\d{2}\s*[/\-\.]\s*\d{2}\s*[/\-\.]\s*(?:20)?\d{2}\b'
        matches = re.findall(pattern, text)
        
        mfg_date, exp_date = "", ""
        if len(matches) >= 2:
            mfg_date = format_to_iso(matches[0])
            exp_date = format_to_iso(matches[-1])
        elif len(matches) == 1:
            exp_date = format_to_iso(matches[0])
            
        remaining_days = 0
        if exp_date:
            remaining_days = (datetime.strptime(exp_date, "%Y-%m-%d") - datetime.now()).days

        return {
            "text": text.strip(),
            "mfg_date": mfg_date,
            "exp_date": exp_date,
            "remaining_days": remaining_days
        }
    except Exception as e:
        print(f"OCR Error: {e}")
        return {"text": "", "mfg_date": "", "exp_date": "", "remaining_days": 0}