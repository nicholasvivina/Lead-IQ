import io
import csv
import re
from typing import Dict, List, Any, Tuple

# Formula injection protection characters
FORMULA_PREFIXES = ('=', '+', '-', '@', '\t', '\r')

COLUMN_ALIASES = {
    "full_name": ["name", "full_name", "fullname", "contact_name", "contact", "person_name", "prospect_name", "lead_name"],
    "email": ["email", "email_address", "emailaddress", "mail", "contact_email", "work_email"],
    "phone": ["phone", "mobile", "phone_number", "phonenumber", "telephone", "cell", "mobile_number", "contact_number", "work_phone"],
    "company_name": ["company", "company_name", "companyname", "organization", "org", "business_name", "account_name", "firm"],
    "website": ["website", "company_website", "companywebsite", "url", "web", "site", "web_url", "domain"],
    "job_title": ["job_title", "jobtitle", "designation", "title", "role", "position", "job", "headline"],
    "industry": ["industry", "sector", "vertical", "business_sector", "category"],
    "location": ["location", "city", "country", "state", "address", "headquarters", "hq", "geo"],
    "lead_source": ["lead_source", "leadsource", "source", "channel", "campaign"],
    "company_description": ["company_description", "companydescription", "description", "about", "bio", "overview"]
}

def sanitize_csv_cell(value: Any) -> str:
    """
    Prevents CSV formula injection by prepending a single quote
    if value starts with dangerous characters.
    """
    if value is None:
        return ""
    str_val = str(value).strip()
    if str_val.startswith(FORMULA_PREFIXES):
        return f"'{str_val}"
    return str_val

def normalize_header(header: str) -> str:
    """Normalize a header string for matching."""
    cleaned = re.sub(r'[^a-zA-Z0-9]', '_', header.strip().lower())
    return re.sub(r'_+', '_', cleaned).strip('_')

def suggest_column_mapping(headers: List[str]) -> Dict[str, str]:
    """
    Suggests mapping from CSV header to standard Lead model field.
    Returns: {csv_header: target_field_name}
    """
    mapping = {}
    used_targets = set()

    for header in headers:
        norm = normalize_header(header)
        matched = None
        for target, aliases in COLUMN_ALIASES.items():
            if target in used_targets:
                continue
            if norm == target or norm in aliases:
                matched = target
                break
        
        # Second pass: check if any alias is contained inside header
        if not matched:
            for target, aliases in COLUMN_ALIASES.items():
                if target in used_targets:
                    continue
                for alias in aliases:
                    if alias in norm or norm in alias:
                        matched = target
                        break
                if matched:
                    break

        if matched:
            mapping[header] = matched
            used_targets.add(matched)
        else:
            mapping[header] = ""

    return mapping

def read_csv_bytes(file_bytes: bytes) -> Tuple[List[str], List[Dict[str, Any]]]:
    """
    Safely reads CSV content with multiple encoding attempts.
    Returns (headers, list of row dicts).
    """
    encodings = ["utf-8-sig", "utf-8", "latin-1", "cp1252"]
    decoded_text = None
    for enc in encodings:
        try:
            decoded_text = file_bytes.decode(enc)
            break
        except UnicodeDecodeError:
            continue

    if decoded_text is None:
        raise ValueError("Unable to decode CSV file with supported encodings (UTF-8, Latin-1, CP1252).")

    if not decoded_text.strip():
        raise ValueError("The uploaded CSV file is empty.")

    f = io.StringIO(decoded_text)
    # Detect dialect (delimiter: comma, semicolon, tab)
    sample = decoded_text[:2048]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=',;\t')
    except Exception:
        dialect = csv.excel

    f.seek(0)
    reader = csv.DictReader(f, dialect=dialect)
    if not reader.fieldnames:
        raise ValueError("No column headers found in CSV file.")

    headers = [h.strip() for h in reader.fieldnames if h]
    rows = []
    for row in reader:
        # filter out completely empty rows
        clean_row = {k.strip(): (v.strip() if v else "") for k, v in row.items() if k}
        if any(clean_row.values()):
            rows.append(clean_row)

    return headers, rows
