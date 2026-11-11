from app.services.enrichment_service import enrichment_service
from app.services.ai_service import ai_service

def test_domain_normalization():
    assert enrichment_service.normalize_domain("https://www.stripe.com/pricing") == "stripe.com"
    assert enrichment_service.normalize_domain("http://github.com:443") == "github.com"
    assert enrichment_service.normalize_domain("subdomain.cloud.google.com") == "subdomain.cloud.google.com"

def test_company_extraction_from_domain():
    assert enrichment_service.extract_company_from_domain("datadoghq.com") == "Datadoghq"
    assert enrichment_service.extract_company_from_domain("gmail.com") is None  # Generic provider ignored

def test_rule_based_classification_fallback():
    # Test software classification
    res = ai_service.classify_company(
        company_name="CloudScale AI",
        company_domain="cloudscale.ai",
        job_title="DevOps Lead",
        company_description="Enterprise cloud optimization platform"
    )
    assert res["method"] == "rule_based"
    assert "Technology & Software" in res["industry"]
    assert "B2B SaaS" in res["business_category"]
    assert res["confidence"] in ["high", "medium", "low"]
    assert len(res["company_summary"]) > 0

    # Test health classification
    res_health = ai_service.classify_company(
        company_name="BioCare Clinic",
        company_domain="biocare.health",
        job_title="Medical Director"
    )
    assert res_health["method"] == "rule_based"
    assert "Healthcare" in res_health["industry"]

def test_lead_enrich_endpoint(client):
    lead_resp = client.post("/api/leads", json={
        "full_name": "Devin Chen",
        "email": "devin@saasmatrix.io",
        "company_name": "SaaS Matrix",
        "website": "https://saasmatrix.io"
    })
    lead_id = lead_resp.json()["id"]

    enrich_resp = client.post(f"/api/leads/{lead_id}/enrich")
    assert enrich_resp.status_code == 200
    enriched = enrich_resp.json()
    assert enriched["enrichment_status"] == "completed"
    assert enriched["industry"] is not None
    assert enriched["business_category"] is not None
    assert enriched["ai_summary"] is not None
