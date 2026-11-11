def test_duplicate_exact_email(client):
    # Insert first lead
    client.post("/api/leads", json={
        "full_name": "Alice Smith",
        "email": "alice@venturecapital.com",
        "company_name": "Venture Capital Partners"
    })

    # Check duplicate with same email in uppercase
    check_resp = client.post("/api/leads/check-duplicates", json={
        "email": "ALICE@VENTURECAPITAL.COM"
    })
    assert check_resp.status_code == 200
    data = check_resp.json()
    assert data["status"] == "confirmed_duplicate"
    assert "Exact email match" in data["reason"]

def test_duplicate_exact_phone(client):
    client.post("/api/leads", json={
        "full_name": "Carlos Gomez",
        "email": "carlos@fintechlatam.com",
        "phone": "+14155552671"
    })

    check_resp = client.post("/api/leads/check-duplicates", json={
        "phone": "+1 415-555-2671"
    })
    assert check_resp.status_code == 200
    data = check_resp.json()
    assert data["status"] == "confirmed_duplicate"
    assert "phone number match" in data["reason"]

def test_possible_duplicate_name_and_company(client):
    client.post("/api/leads", json={
        "full_name": "Diana Ross",
        "email": "diana.ross@musicrecords.com",
        "company_name": "Motown Sound"
    })

    # Same name and company, different email
    check_resp = client.post("/api/leads/check-duplicates", json={
        "full_name": "diana ross",
        "company_name": "motown sound",
        "email": "diana.personal@gmail.com"
    })
    assert check_resp.status_code == 200
    data = check_resp.json()
    assert data["status"] == "possible_duplicate"
    assert "Same contact name" in data["reason"]

def test_unique_lead_detection(client):
    check_resp = client.post("/api/leads/check-duplicates", json={
        "full_name": "Totally New Contact",
        "email": "new.contact@brandnewdomain12345.com",
        "phone": "+15559876543"
    })
    assert check_resp.status_code == 200
    data = check_resp.json()
    assert data["status"] == "unique"
