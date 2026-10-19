import re
from datetime import datetime
import easyocr

def normalize_date_string(raw: str):
    """
    Fixes dot-matrix OCR misreads:
    1. '23/12126' -> '23/12/26' (slash read as 1)
    2. '23/12/2026' -> '23/12/2026'
    3. '24/07/26' -> '24/07/26'
    """
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

def extract_expiry_date(image_path: str):
    print("Running OCR on label...")
    # Initialize reader without heavy artificial preprocessing
    reader = easyocr.Reader(['en'], gpu=False)
    results = reader.readtext(image_path)
    
    raw_detections = [item[1] for item in results]
    full_text = " ".join(raw_detections)
    
    print(f"\nRaw OCR stream:\n{full_text}\n")
    
    # Normalize OCR text
    normalized_text = normalize_date_string(full_text)
    
    # Extract all possible dates (both standard DD/MM/YY and normalized variants)
    candidates = []
    
    # Pattern 1: Standard DD/MM/YY or DD/MM/YYYY
    pattern_standard = r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b'
    for match in re.findall(pattern_standard, normalized_text):
        dt = parse_date(match)
        if dt:
            candidates.append((dt, match))
            
    # Pattern 2: Also check individual word blocks
    for word in raw_detections:
        fixed_word = normalize_date_string(word)
        for match in re.findall(pattern_standard, fixed_word):
            dt = parse_date(match)
            if dt:
                candidates.append((dt, match))
                
    if not candidates:
        print("❌ No dates detected. Fallback to manual entry.")
        return None

    # Deduplicate and sort by date value (earliest to latest)
    unique_candidates = sorted(list({dt: raw for dt, raw in candidates}.items()), key=lambda x: x[0])
    
    print("--- Date Candidates Found ---")
    for dt, raw in unique_candidates:
        print(f"-> {raw} (Parsed: {dt.strftime('%d-%b-%Y')})")
        
    if len(unique_candidates) == 1:
        chosen = unique_candidates[0][1]
        print(f"\n✅ Single date found. Expiry Date: {chosen}")
        return chosen
    else:
        pkd = unique_candidates[0][1]
        exp = unique_candidates[-1][1]
        print(f"\n📦 Manufacturing Date (PKD): {pkd}")
        print(f"🎯 Target Expiry Date (USE BY): {exp}")
        return exp

if __name__ == "__main__":
    extract_expiry_date("sample_label.jpeg")