def test_dashboard_stats_and_charts(client):
    # Verify initial empty state
    initial_resp = client.get("/api/dashboard/stats")
    assert initial_resp.status_code == 200
    initial_data = initial_resp.json()
    assert initial_data["stats"]["total_leads"] == 0

    # Add a valid lead
    client.post("/api/leads", json={
        "full_name": "Dr. Emily Watson",
        "email": "emily@google.com",
        "industry": "Healthcare & Life Sciences"
    })

    # Add an invalid lead
    client.post("/api/leads", json={
        "full_name": "Unknown User",
        "email": "not-an-email",
        "industry": "Technology & Software"
    })

    stats_resp = client.get("/api/dashboard/stats")
    assert stats_resp.status_code == 200
    data = stats_resp.json()
    assert data["stats"]["total_leads"] == 2
    assert data["stats"]["invalid_leads"] == 1
    assert len(data["charts"]["validation_status"]) > 0
    assert len(data["recent_leads"]) == 2
