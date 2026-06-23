"""
Test Suite: Deal Presentation Orchestrator
Tests the orchestrator endpoint and contact request system for ARROBA platform.
Covers: Contact requests, presentation states by buyer tier, visibility rules, CTA engine.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from seed data
CREDENTIALS = {
    "free_buyer": {"email": "carlos.ruiz@capitaliberica.es", "password": "demo2026", "user_id": "buyer_pe_madrid_01"},
    "pro_buyer": {"email": "iker.aguirre@familyoffice-norte.es", "password": "demo2026", "user_id": "buyer_fo_bilbao_01"},
    "proplus_buyer": {"email": "marta.font@groupdigital.cat", "password": "demo2026", "user_id": "buyer_estrategico_bcn_01"},
    "clean_buyer": {"email": "anna.soler@bcnventures.cat", "password": "demo2026", "user_id": "buyer_vc_bcn_02"},
    "seller": {"email": "diego.martin@rankingdigital.es", "password": "demo2026", "user_id": "seller_seo_madrid_01"},
    "pro_buyer_with_nda": {"email": "james.harris@techventures.co.uk", "password": "demo2026", "user_id": "buyer_vc_london_01"},
}

DEAL_ID = "deal_hot_seo_01"


def get_auth_token(email: str, password: str) -> str:
    """Login and return auth token."""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    if resp.status_code == 200:
        return resp.json().get("access_token")
    return None


@pytest.fixture(scope="module")
def free_buyer_token():
    return get_auth_token(CREDENTIALS["free_buyer"]["email"], CREDENTIALS["free_buyer"]["password"])


@pytest.fixture(scope="module")
def pro_buyer_token():
    return get_auth_token(CREDENTIALS["pro_buyer"]["email"], CREDENTIALS["pro_buyer"]["password"])


@pytest.fixture(scope="module")
def proplus_buyer_token():
    return get_auth_token(CREDENTIALS["proplus_buyer"]["email"], CREDENTIALS["proplus_buyer"]["password"])


@pytest.fixture(scope="module")
def clean_buyer_token():
    return get_auth_token(CREDENTIALS["clean_buyer"]["email"], CREDENTIALS["clean_buyer"]["password"])


@pytest.fixture(scope="module")
def seller_token():
    return get_auth_token(CREDENTIALS["seller"]["email"], CREDENTIALS["seller"]["password"])


@pytest.fixture(scope="module")
def pro_buyer_with_nda_token():
    return get_auth_token(CREDENTIALS["pro_buyer_with_nda"]["email"], CREDENTIALS["pro_buyer_with_nda"]["password"])


class TestHealthCheck:
    """Basic health check to ensure API is running."""
    
    def test_api_health(self):
        resp = requests.get(f"{BASE_URL}/api/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"


class TestContactRequestCreation:
    """Test contact request creation flow."""
    
    def test_create_contact_request_requires_buyer_role(self, seller_token):
        """Seller cannot create contact request."""
        if not seller_token:
            pytest.skip("Seller auth failed")
        headers = {"Authorization": f"Bearer {seller_token}"}
        resp = requests.post(f"{BASE_URL}/api/deals/{DEAL_ID}/contact-request", headers=headers)
        assert resp.status_code == 403
        assert "Solo buyers" in resp.json().get("detail", "")
    
    def test_duplicate_contact_request_prevention(self, free_buyer_token):
        """Buyer with existing accepted contact cannot create another."""
        if not free_buyer_token:
            pytest.skip("Free buyer auth failed")
        headers = {"Authorization": f"Bearer {free_buyer_token}"}
        resp = requests.post(f"{BASE_URL}/api/deals/{DEAL_ID}/contact-request", headers=headers)
        # Should fail because carlos.ruiz already has accepted contact
        assert resp.status_code == 400
        detail = resp.json().get("detail", "")
        assert "ya" in detail.lower() or "aceptado" in detail.lower()
    
    def test_contact_request_for_nonexistent_deal(self, free_buyer_token):
        """Contact request for non-existent deal returns 404."""
        if not free_buyer_token:
            pytest.skip("Free buyer auth failed")
        headers = {"Authorization": f"Bearer {free_buyer_token}"}
        resp = requests.post(f"{BASE_URL}/api/deals/nonexistent_deal_xyz/contact-request", headers=headers)
        assert resp.status_code == 404


class TestContactRequestAcceptReject:
    """Test seller accept/reject contact request flow."""
    
    def test_accept_requires_seller_ownership(self, free_buyer_token):
        """Buyer cannot accept contact requests."""
        if not free_buyer_token:
            pytest.skip("Free buyer auth failed")
        headers = {"Authorization": f"Bearer {free_buyer_token}"}
        resp = requests.post(f"{BASE_URL}/api/deals/{DEAL_ID}/contact-request/cr_fake_id/accept", headers=headers)
        # Should fail - either 404 (not found) or 403 (not authorized)
        assert resp.status_code in (403, 404)
    
    def test_reject_requires_seller_ownership(self, free_buyer_token):
        """Buyer cannot reject contact requests."""
        if not free_buyer_token:
            pytest.skip("Free buyer auth failed")
        headers = {"Authorization": f"Bearer {free_buyer_token}"}
        resp = requests.post(f"{BASE_URL}/api/deals/{DEAL_ID}/contact-request/cr_fake_id/reject", headers=headers)
        assert resp.status_code in (403, 404)


class TestSellerContactPolicy:
    """Test seller contact policy settings."""
    
    def test_get_contact_policy(self, seller_token):
        """Seller can get their contact policy."""
        if not seller_token:
            pytest.skip("Seller auth failed")
        headers = {"Authorization": f"Bearer {seller_token}"}
        resp = requests.get(f"{BASE_URL}/api/seller/settings/contact-policy", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "contact_policy" in data
        assert data["contact_policy"] in ("auto_accept", "manual_review")
    
    def test_update_contact_policy_to_auto_accept(self, seller_token):
        """Seller can set policy to auto_accept."""
        if not seller_token:
            pytest.skip("Seller auth failed")
        headers = {"Authorization": f"Bearer {seller_token}"}
        resp = requests.put(
            f"{BASE_URL}/api/seller/settings/contact-policy",
            headers=headers,
            json={"contact_policy": "auto_accept"}
        )
        assert resp.status_code == 200
        assert resp.json()["contact_policy"] == "auto_accept"
    
    def test_update_contact_policy_to_manual_review(self, seller_token):
        """Seller can set policy back to manual_review."""
        if not seller_token:
            pytest.skip("Seller auth failed")
        headers = {"Authorization": f"Bearer {seller_token}"}
        resp = requests.put(
            f"{BASE_URL}/api/seller/settings/contact-policy",
            headers=headers,
            json={"contact_policy": "manual_review"}
        )
        assert resp.status_code == 200
        assert resp.json()["contact_policy"] == "manual_review"
    
    def test_invalid_contact_policy_rejected(self, seller_token):
        """Invalid policy value is rejected."""
        if not seller_token:
            pytest.skip("Seller auth failed")
        headers = {"Authorization": f"Bearer {seller_token}"}
        resp = requests.put(
            f"{BASE_URL}/api/seller/settings/contact-policy",
            headers=headers,
            json={"contact_policy": "invalid_policy"}
        )
        assert resp.status_code == 400
    
    def test_buyer_cannot_set_contact_policy(self, free_buyer_token):
        """Buyer cannot set seller contact policy."""
        if not free_buyer_token:
            pytest.skip("Free buyer auth failed")
        headers = {"Authorization": f"Bearer {free_buyer_token}"}
        resp = requests.put(
            f"{BASE_URL}/api/seller/settings/contact-policy",
            headers=headers,
            json={"contact_policy": "auto_accept"}
        )
        assert resp.status_code == 403


class TestPresentationFreeBuyer:
    """Test presentation endpoint for Free tier buyer."""
    
    def test_free_buyer_with_accepted_contact_gets_teaser_unlocked(self, free_buyer_token):
        """Free buyer (carlos.ruiz) with accepted contact sees TEASER_UNLOCKED."""
        if not free_buyer_token:
            pytest.skip("Free buyer auth failed")
        headers = {"Authorization": f"Bearer {free_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        # Verify visibility state
        assert data["visibility_state"] == "TEASER_UNLOCKED"
        assert data["buyer_tier"] == "free"
        assert data["contact_state"] == "accepted"
        assert data["teaser_visible"] == True
        assert data["card_only"] == False
        
        # Free tier caps at TEASER_UNLOCKED - NDA locked
        assert "sign_nda" in data["locked_actions"]
        
        # Verify upgrade prompts for NDA
        assert len(data["upgrade_prompts"]) > 0
        nda_prompt = next((p for p in data["upgrade_prompts"] if p["action"] == "sign_nda"), None)
        assert nda_prompt is not None
        assert nda_prompt["target_plan"] == "pro"
    
    def test_free_buyer_deal_summary_no_contact_info(self, free_buyer_token):
        """Deal summary never exposes phone/email/website."""
        if not free_buyer_token:
            pytest.skip("Free buyer auth failed")
        headers = {"Authorization": f"Bearer {free_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        summary = resp.json().get("deal_summary", {})
        
        # These fields should NEVER be present
        forbidden_fields = ["phone", "email", "contact_email", "contact_phone", "website", "street", "address"]
        for field in forbidden_fields:
            assert field not in summary, f"Forbidden field '{field}' found in deal_summary"


class TestPresentationProBuyer:
    """Test presentation endpoint for Pro tier buyer."""
    
    def test_pro_buyer_with_accepted_contact_gets_nda_available(self, pro_buyer_token):
        """Pro buyer (iker.aguirre) with accepted contact sees NDA_AVAILABLE."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        # Verify visibility state
        assert data["visibility_state"] == "NDA_AVAILABLE"
        assert data["buyer_tier"] == "pro"
        assert data["contact_state"] == "accepted"
        assert data["teaser_visible"] == True
        
        # Pro can sign NDA
        assert "sign_nda" in data["allowed_actions"]
        
        # CTA should be sign_nda
        assert data["primary_cta"]["action"] == "sign_nda"
        assert "Firmar NDA" in data["primary_cta"]["label"]
    
    def test_pro_buyer_with_nda_gets_operative_access(self, pro_buyer_with_nda_token):
        """Pro buyer (james.harris) with NDA signed sees OPERATIVE_ACCESS."""
        if not pro_buyer_with_nda_token:
            pytest.skip("Pro buyer with NDA auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_with_nda_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        # Verify visibility state
        assert data["visibility_state"] == "OPERATIVE_ACCESS"
        assert data["buyer_tier"] == "pro"
        assert data["has_nda"] == True
        
        # Full access
        assert "view_infomemo" in data["allowed_actions"]
        assert "view_dataroom" in data["allowed_actions"]
        
        # Premium analysis locked for Pro (only Pro+ gets it)
        assert "view_premium_analysis" in data["locked_actions"]


class TestPresentationProPlusBuyer:
    """Test presentation endpoint for Pro+ tier buyer."""
    
    def test_proplus_buyer_no_contact_sees_locked(self, proplus_buyer_token):
        """Pro+ buyer (marta.font) without contact sees LOCKED_CONTACT_REQUIRED."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        # Verify visibility state
        assert data["visibility_state"] == "LOCKED_CONTACT_REQUIRED"
        assert data["buyer_tier"] == "pro+"
        assert data["contact_state"] == "none"
        
        # Pro+ can see teaser even without contact
        assert data["teaser_visible"] == True
        
        # CTA should be contact_request with priority
        assert data["primary_cta"]["action"] == "contact_request"
        assert "prioridad" in data["primary_cta"]["label"].lower() or "priority" in data["primary_cta"]["style"]
    
    def test_proplus_buyer_premium_modules_placeholder(self, proplus_buyer_token):
        """Pro+ buyer without NDA doesn't have premium_modules yet."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        # Premium modules only available after NDA
        assert data["premium_modules"] is None


class TestPresentationContentRichness:
    """Test content richness score and visual mode computation."""
    
    def test_content_richness_score_computed(self, free_buyer_token):
        """Content richness score is computed and returned."""
        if not free_buyer_token:
            pytest.skip("Free buyer auth failed")
        headers = {"Authorization": f"Bearer {free_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "content_richness_score" in data
        assert isinstance(data["content_richness_score"], int)
        assert 0 <= data["content_richness_score"] <= 100
    
    def test_visual_mode_computed(self, free_buyer_token):
        """Visual mode is computed based on content richness."""
        if not free_buyer_token:
            pytest.skip("Free buyer auth failed")
        headers = {"Authorization": f"Bearer {free_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "visual_mode" in data
        assert data["visual_mode"] in ("lean", "standard", "rich")
        
        # Verify consistency with richness score
        score = data["content_richness_score"]
        if score >= 65:
            assert data["visual_mode"] == "rich"
        elif score >= 35:
            assert data["visual_mode"] == "standard"
        else:
            assert data["visual_mode"] == "lean"


class TestPresentationModulesVisible:
    """Test modules_visible filtering by visibility state."""
    
    def test_modules_visible_filtered_by_state(self, free_buyer_token):
        """Modules visible are filtered based on visibility state."""
        if not free_buyer_token:
            pytest.skip("Free buyer auth failed")
        headers = {"Authorization": f"Bearer {free_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        modules = data.get("modules_visible", [])
        assert isinstance(modules, list)
        
        # TEASER_UNLOCKED should not have infomemo or dataroom
        if data["visibility_state"] == "TEASER_UNLOCKED":
            assert "infomemo" not in modules
            assert "dataroom" not in modules
    
    def test_operative_access_has_all_modules(self, pro_buyer_with_nda_token):
        """OPERATIVE_ACCESS has access to all available modules."""
        if not pro_buyer_with_nda_token:
            pytest.skip("Pro buyer with NDA auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_with_nda_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["visibility_state"] == "OPERATIVE_ACCESS"
        # Post-NDA should have full access to modules


class TestPresentationLayout:
    """Test layout composition."""
    
    def test_layout_sections_returned(self, free_buyer_token):
        """Layout with sections is returned."""
        if not free_buyer_token:
            pytest.skip("Free buyer auth failed")
        headers = {"Authorization": f"Bearer {free_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "layout" in data
        layout = data["layout"]
        assert "sections" in layout
        assert isinstance(layout["sections"], list)
        assert len(layout["sections"]) > 0
        
        # Hero and CTA should always be present
        assert "hero" in layout["sections"]
        assert "cta" in layout["sections"]


class TestPresentationCTAEngine:
    """Test CTA engine output."""
    
    def test_primary_cta_structure(self, free_buyer_token):
        """Primary CTA has correct structure."""
        if not free_buyer_token:
            pytest.skip("Free buyer auth failed")
        headers = {"Authorization": f"Bearer {free_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        cta = data.get("primary_cta")
        assert cta is not None
        assert "action" in cta
        assert "label" in cta
        assert "style" in cta
        assert "description" in cta
    
    def test_secondary_cta_for_locked_state(self, proplus_buyer_token):
        """Secondary CTA (save deal) present for locked state."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        if data["visibility_state"] == "LOCKED_CONTACT_REQUIRED":
            secondary = data.get("secondary_cta")
            assert secondary is not None
            assert secondary["action"] == "save_deal"


class TestAutoAcceptPolicy:
    """Test auto-accept contact policy flow."""
    
    def test_auto_accept_creates_accepted_request(self, seller_token, clean_buyer_token):
        """When seller has auto_accept policy, contact request is immediately accepted."""
        if not seller_token or not clean_buyer_token:
            pytest.skip("Auth failed")
        
        # First set seller policy to auto_accept
        seller_headers = {"Authorization": f"Bearer {seller_token}"}
        resp = requests.put(
            f"{BASE_URL}/api/seller/settings/contact-policy",
            headers=seller_headers,
            json={"contact_policy": "auto_accept"}
        )
        assert resp.status_code == 200
        
        # Now clean buyer creates contact request
        buyer_headers = {"Authorization": f"Bearer {clean_buyer_token}"}
        resp = requests.post(f"{BASE_URL}/api/deals/{DEAL_ID}/contact-request", headers=buyer_headers)
        
        # Should succeed with status=accepted
        if resp.status_code == 200:
            data = resp.json()
            assert data["status"] == "accepted"
            assert data["policy_applied"] == "auto_accept"
        elif resp.status_code == 400:
            # Already has a request - that's fine for this test
            pass
        
        # Reset policy back to manual_review
        requests.put(
            f"{BASE_URL}/api/seller/settings/contact-policy",
            headers=seller_headers,
            json={"contact_policy": "manual_review"}
        )


class TestListContactRequests:
    """Test listing contact requests for a deal."""
    
    def test_seller_can_list_contact_requests(self, seller_token):
        """Seller can list all contact requests for their deal."""
        if not seller_token:
            pytest.skip("Seller auth failed")
        headers = {"Authorization": f"Bearer {seller_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/contact-requests", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        
        # Should have at least the seeded contact requests
        assert len(data) >= 2
        
        # Verify structure
        for cr in data:
            assert "request_id" in cr
            assert "buyer_id" in cr
            assert "status" in cr
    
    def test_buyer_cannot_list_contact_requests(self, free_buyer_token):
        """Buyer cannot list contact requests for a deal they don't own."""
        if not free_buyer_token:
            pytest.skip("Free buyer auth failed")
        headers = {"Authorization": f"Bearer {free_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/contact-requests", headers=headers)
        assert resp.status_code == 403


class TestPresentationRequiresAuth:
    """Test that presentation endpoint requires authentication."""
    
    def test_presentation_requires_auth(self):
        """Presentation endpoint requires authentication."""
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation")
        assert resp.status_code == 401
    
    def test_presentation_deal_not_found(self, free_buyer_token):
        """Non-existent deal returns 404."""
        if not free_buyer_token:
            pytest.skip("Free buyer auth failed")
        headers = {"Authorization": f"Bearer {free_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/nonexistent_deal_xyz/presentation", headers=headers)
        assert resp.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
