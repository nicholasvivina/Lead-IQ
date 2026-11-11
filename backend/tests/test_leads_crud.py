def test_create_and_get_lead(client):
    payload = {
        "full_name": "Jane Doe",
        "email": "jane.doe@examplecorp.com",
        "phone": "+14155552671",
        "company_name": "Example Corp",
        "website": "https://examplecorp.com",
        "job_title": "VP of Engineering",
        "location": "San Francisco, CA"
    }
    # Create
    resp = client.post("/api/leads", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["id"] is not None
    assert data["full_name"] == "Jane Doe"
    assert data["email"] == "jane.doe@examplecorp.com"
    assert data["company_domain"] == "examplecorp.com"
    lead_id = data["id"]

    # Get by ID
    get_resp = client.get(f"/api/leads/{lead_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == lead_id

    # List
    list_resp = client.get("/api/leads?search=Jane")
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert list_data["total"] == 1
    assert list_data["items"][0]["full_name"] == "Jane Doe"

def test_update_lead(client):
    create_resp = client.post("/api/leads", json={
        "full_name": "John Smith",
        "email": "john.smith@techstartup.io",
        "company_name": "Tech Startup"
    })
    lead_id = create_resp.json()["id"]

    update_payload = {
        "job_title": "Chief Technology Officer",
        "industry": "Information Technology"
    }
    update_resp = client.put(f"/api/leads/{lead_id}", json=update_payload)
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["job_title"] == "Chief Technology Officer"
    assert updated_data["industry"] == "Information Technology"

def test_delete_lead(client):
    create_resp = client.post("/api/leads", json={
        "full_name": "Mark Spencer",
        "email": "mark@retailco.com"
    })
    lead_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/leads/{lead_id}")
    assert del_resp.status_code == 204

    get_resp = client.get(f"/api/leads/{lead_id}")
    assert get_resp.status_code == 404

def test_batch_delete_leads(client):
    l1 = client.post("/api/leads", json={"full_name": "User 1", "email": "u1@test.com"}).json()["id"]
    l2 = client.post("/api/leads", json={"full_name": "User 2", "email": "u2@test.com"}).json()["id"]

    batch_resp = client.post("/api/leads/batch-delete", json={"lead_ids": [l1, l2]})
    assert batch_resp.status_code == 200
    assert batch_resp.json()["successful"] == 2

    assert client.get(f"/api/leads/{l1}").status_code == 404
    assert client.get(f"/api/leads/{l2}").status_code == 404
