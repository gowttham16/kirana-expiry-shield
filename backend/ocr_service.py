import os
import re
from datetime import datetime
import easyocr

# Initialize the EasyOCR reader once when the server boots
reader = easyocr.Reader(['en'], gpu=False)

def normalize_date_string(raw: str) -> str:
    # Fix DD/MM1YY -> DD/MM/YY
    fixed = re.sub(r'(\d{2})[/-](\d{2})1(\d{2})\b', r'\1/\2/\3', raw)
    # Fix DD1MM1YY -> DD/MM/YY
    fixed = re.sub(r'(\d{2})1(\d{2})1(\d{2})\b', r'\1/\2/\3', fixed)
    return fixed

def parse_date(date_str: str):
    for fmt in ("%d/%m/%y", "%d/%m/%Y", "%m/%y", "%m/%Y", "%d-%m-%y"):
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    return None

def extract_expiry_from_image(image_bytes: bytes) -> dict:
    # EasyOCR can read raw image bytes directly without saving to disk
    results = reader.readtext(image_bytes)
    raw_detections = [item[1] for item in results]
    full_text = " ".join(raw_detections)
    
    normalized_text = normalize_date_string(full_text)
    pattern_standard = r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b'
    
    candidates = []
    for match in re.findall(pattern_standard, normalized_text):
        dt = parse_date(match)
        if dt:
            candidates.append((dt, match))
            
    for word in raw_detections:
        fixed_word = normalize_date_string(word)
        for match in re.findall(pattern_standard, fixed_word):
            dt = parse_date(match)
            if dt:
                candidates.append((dt, match))
                
    if not candidates:
        return {"success": False, "expiry_date": None, "message": "No date detected"}

    # Sort chronological: earlier = PKD, later = EXP
    unique_candidates = sorted(list({dt: raw for dt, raw in candidates}.items()), key=lambda x: x[0])
    
    exp_dt, exp_raw = unique_candidates[-1]
    
    # Format to standard ISO format YYYY-MM-DD for PostgreSQL / Supabase
    iso_date = exp_dt.strftime("%Y-%m-%d")
    
    return {
        "success": True,
        "expiry_date": iso_date,
        "raw_matched": exp_raw,
        "all_detected_dates": [raw for _, raw in unique_candidates]
    }