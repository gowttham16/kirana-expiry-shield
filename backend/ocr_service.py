import requests
import re
from datetime import datetime

def format_to_iso(date_str):
    try:
        # Keep ONLY numbers. Turns "19l08/26" directly into "190826"
        clean = re.sub(r'[^\d]', '', date_str)
        if len(clean) == 6:  # DDMMYY
            return f"20{clean[4:6]}-{clean[2:4]}-{clean[0:2]}"
        elif len(clean) == 8: # DDMMYYYY
            return f"{clean[4:8]}-{clean[2:4]}-{clean[0:2]}"
    except:
        pass
    return ""

def extract_expiry_date(image_bytes: bytes) -> dict:
    try:
        response = requests.post(
            'https://api.ocr.space/parse/image',
            files={'file': ('image.jpg', image_bytes, 'image/jpeg')},
            data={'apikey': 'helloworld', 'language': 'eng', 'scale': 'true', 'isTable': 'true', 'OCREngine': '2'},
            timeout=15
        )
        res = response.json()
        text = res['ParsedResults'][0]['ParsedText'] if res.get('ParsedResults') else ""
        
        # Super-Greedy Regex: Finds 2 digits, 1-3 random characters/spaces, 2 digits, 1-3 random characters, 2-4 digits.
        pattern = r'(\d{2}[^\d]{1,3}\d{2}[^\d]{1,3}(?:20)?\d{2})'
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
        return {"text": "", "mfg_date": "", "exp_date": "", "remaining_days": 0}