import requests
import re
from datetime import datetime

def format_to_iso(date_str):
    """Aggressively strips noise and formats to YYYY-MM-DD"""
    try:
        # Strip all letters/noise that might have been captured
        clean = re.sub(r'[^\d/\-\.]', '', date_str)
        clean = re.sub(r'[\.\-]', '/', clean)
        parts = [p for p in clean.split('/') if p]
        
        if len(parts) == 3:
            d, m, y = parts
            if len(y) == 2: y = f"20{y}"
            return f"{y}-{m.zfill(2)}-{d.zfill(2)}"
    except:
        pass
    return ""

def extract_expiry_date(image_bytes: bytes) -> dict:
    try:
        response = requests.post(
            'https://api.ocr.space/parse/image',
            files={'file': ('image.jpg', image_bytes, 'image/jpeg')},
            data={
                'apikey': 'helloworld', 
                'language': 'eng', 
                'scale': 'true', 
                'isTable': 'true', # Forces horizontal reading alignment
                'OCREngine': '1'
            },
            timeout=15
        )
        res = response.json()
        text = res['ParsedResults'][0]['ParsedText'] if res.get('ParsedResults') else ""
        
        # Bulletproof Regex: No word boundaries (\b). 
        # It will extract 19/08/26 even if the OCR reads it as "XYZ19/08/26ABC"
        pattern = r'(\d{2}[\s/\-\.]+\d{2}[\s/\-\.]+(?:20)?\d{2})'
        matches = re.findall(pattern, text)
        
        mfg_date, exp_date = "", ""
        if len(matches) >= 2:
            mfg_date = format_to_iso(matches[0])
            exp_date = format_to_iso(matches[-1])
        elif len(matches) == 1:
            exp_date = format_to_iso(matches[0])
            
        remaining_days = 0
        if exp_date:
            try:
                remaining_days = (datetime.strptime(exp_date, "%Y-%m-%d") - datetime.now()).days
            except:
                pass

        return {
            "text": text.strip(),
            "mfg_date": mfg_date,
            "exp_date": exp_date,
            "remaining_days": remaining_days
        }
    except Exception as e:
        print(f"OCR Error: {e}")
        return {"text": "", "mfg_date": "", "exp_date": "", "remaining_days": 0}