from app.services.email_validator_service import email_validator_service
from app.services.phone_validator_service import phone_validator_service

def test_email_validation_valid_syntax():
    res = email_validator_service.validate("Test.User@AcmeCorp.com", check_dns=False)
    assert res["status"] == "syntax_valid"
    assert res["normalized_email"] == "test.user@acmecorp.com"
    assert res["domain"] == "acmecorp.com"

def test_email_validation_invalid_syntax():
    res = email_validator_service.validate("not-an-email", check_dns=False)
    assert res["status"] == "invalid"
    assert "Invalid email syntax" in res["reason"]

def test_email_validation_empty():
    res = email_validator_service.validate("", check_dns=False)
    assert res["status"] == "invalid"
    assert "cannot be blank" in res["reason"]

def test_phone_validation_valid_e164():
    # Valid US number
    res = phone_validator_service.validate("+14155552671")
    assert res["status"] == "valid"
    assert res["normalized_phone"] == "+14155552671"
    assert res["country_code"] == 1

def test_phone_validation_valid_uk():
    # Valid UK mobile
    res = phone_validator_service.validate("+447911123456")
    assert res["status"] == "valid"
    assert res["normalized_phone"] == "+447911123456"
    assert res["country_code"] == 44

def test_phone_validation_missing_country_code():
    # Local number without + code
    res = phone_validator_service.validate("4155552671")
    assert res["status"] == "invalid"
    assert "Missing international country code" in res["reason"]

def test_phone_validation_invalid_digits():
    res = phone_validator_service.validate("+1000000000000")
    assert res["status"] == "invalid"

def test_lead_validation_endpoint(client):
    # Create lead with invalid phone format and test validate endpoint
    lead_resp = client.post("/api/leads", json={
        "full_name": "Bob Taylor",
        "email": "bob.taylor@validcorp.com",
        "phone": "9876543210"  # Missing country code
    })
    lead_id = lead_resp.json()["id"]

    val_resp = client.post(f"/api/leads/{lead_id}/validate")
    assert val_resp.status_code == 200
    val_data = val_resp.json()
    assert val_data["phone_status"] == "invalid"
    assert "Missing international country code" in val_data["phone_reason"]
