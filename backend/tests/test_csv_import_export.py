import io
from app.utils.csv_helper import sanitize_csv_cell, suggest_column_mapping

def test_sanitize_csv_cell_formula_injection():
    assert sanitize_csv_cell("=1+1") == "'=1+1"
    assert sanitize_csv_cell("+cmd|' /C calc'!A0") == "'+cmd|' /C calc'!A0"
    assert sanitize_csv_cell("-5+2") == "'-5+2"
    assert sanitize_csv_cell("@SUM(1,2)") == "'@SUM(1,2)"
    assert sanitize_csv_cell("Normal text") == "Normal text"

def test_suggest_column_mapping():
    headers = ["Full Name", "Work Email", "Mobile Number", "Organization", "Web URL", "Role"]
    mapping = suggest_column_mapping(headers)
    assert mapping["Full Name"] == "full_name"
    assert mapping["Work Email"] == "email"
    assert mapping["Mobile Number"] == "phone"
    assert mapping["Organization"] == "company_name"
    assert mapping["Web URL"] == "website"
    assert mapping["Role"] == "job_title"

def test_csv_preview_and_import_workflow(client):
    csv_data = (
        "contact_name,email_address,phone_number,company,url\n"
        "Alex Rivera,alex@cloudnative.dev,+14155550199,Cloud Native,https://cloudnative.dev\n"
        "Sarah Connor,sarah@skynet.ai,+14155550188,Cyberdyne,https://skynet.ai\n"
        ",,,,\n"  # Empty row
    )
    file_bytes = io.BytesIO(csv_data.encode("utf-8"))

    # 1. Preview
    preview_resp = client.post(
        "/api/imports/preview",
        files={"file": ("test_leads.csv", file_bytes, "text/csv")}
    )
    assert preview_resp.status_code == 200
    preview_data = preview_resp.json()
    assert preview_data["total_rows"] == 2
    assert "contact_name" in preview_data["headers"]

    # 2. Process import
    mapping = preview_data["suggested_mapping"]
    import_payload = {
        "filename": "test_leads.csv",
        "column_mapping": mapping,
        "skip_duplicates": True,
        "auto_validate": True,
        "auto_enrich": False,
        "rows": preview_data["preview_rows"]
    }
    process_resp = client.post("/api/imports/process", json=import_payload)
    assert process_resp.status_code == 200
    res_data = process_resp.json()
    assert res_data["total_records"] == 2
    assert res_data["successful_records"] == 2

    # Verify leads were inserted in DB
    list_resp = client.get("/api/leads")
    assert list_resp.json()["total"] == 2

    # 3. Test CSV export with formula sanitization
    export_resp = client.get("/api/leads/export")
    assert export_resp.status_code == 200
    assert "Alex Rivera" in export_resp.text
    assert "Content-Disposition" in export_resp.headers
