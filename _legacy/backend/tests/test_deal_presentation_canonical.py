"""
Test Suite: Deal Presentation Canonical — Ficha Canonica Orquestada
Tests the new orchestrator endpoint with per-module states for ARROBA platform.
Covers: Module states (open/preview/nda_required/plan_required/contact_required/hidden_only_if_no_data),
        financial_data with multi-year + CAGR, deal_summary sanitization, process_timeline, actions_panel.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from seed data
CREDENTIALS = {
    "free_buyer": {"email": "carlos.ruiz@capitaliberica.es", "password": "demo2026", "user_id": "buyer_pe_madrid_01"},
    "pro_buyer": {"email": "iker.aguirre@familyoffice-norte.es", "password": "demo2026", "user_id": "buyer_fo_bilbao_01"},
    "pro_buyer_with_nda": {"email": "james.harris@techventures.co.uk", "password": "demo2026", "user_id": "buyer_vc_london_01"},
    "proplus_buyer": {"email": "marta.font@groupdigital.cat", "password": "demo2026", "user_id": "buyer_dh_bcn_01"},
    "seller": {"email": "diego.martin@rankingdigital.es", "password": "demo2026", "user_id": "seller_seo_madrid_01"},
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
def pro_buyer_with_nda_token():
    return get_auth_token(CREDENTIALS["pro_buyer_with_nda"]["email"], CREDENTIALS["pro_buyer_with_nda"]["password"])


@pytest.fixture(scope="module")
def proplus_buyer_token():
    return get_auth_token(CREDENTIALS["proplus_buyer"]["email"], CREDENTIALS["proplus_buyer"]["password"])


@pytest.fixture(scope="module")
def seller_token():
    return get_auth_token(CREDENTIALS["seller"]["email"], CREDENTIALS["seller"]["password"])


class TestHealthCheck:
    """Basic health check."""
    
    def test_api_health(self):
        resp = requests.get(f"{BASE_URL}/api/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"


class TestModuleStatesProBuyerWithoutNDA:
    """Test module states for Pro buyer without NDA (iker.aguirre - has accepted contact)."""
    
    def test_pnl_state_nda_required(self, pro_buyer_token):
        """Pro buyer without NDA sees pnl.state = 'nda_required'."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        # Verify visibility state
        assert data["visibility_state"] == "NDA_AVAILABLE"
        assert data["buyer_tier"] == "pro"
        assert data["has_nda"] == False
        
        # PnL should be nda_required
        pnl = data["modules"]["pnl"]
        assert pnl["state"] == "nda_required"
        assert pnl["unlock_condition"] == "signed_nda"
        assert pnl["cta_action"] == "sign_nda"
        assert "NDA" in pnl["cta_label"]
    
    def test_infomemo_state_nda_required(self, pro_buyer_token):
        """Pro buyer without NDA sees infomemo.state = 'nda_required'."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        infomemo = data["modules"]["infomemo"]
        assert infomemo["state"] == "nda_required"
        assert infomemo["cta_action"] == "sign_nda"
    
    def test_business_snapshot_state_open(self, pro_buyer_token):
        """Pro buyer with accepted contact sees business_snapshot.state = 'open'."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["contact_state"] == "accepted"
        snapshot = data["modules"]["business_snapshot"]
        assert snapshot["state"] == "open"
    
    def test_financial_evolution_state_open(self, pro_buyer_token):
        """Pro buyer with accepted contact sees financial_evolution.state = 'open'."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        fin_evo = data["modules"]["financial_evolution"]
        assert fin_evo["state"] == "open"


class TestModuleStatesProBuyerWithNDA:
    """Test module states for Pro buyer with NDA (james.harris)."""
    
    def test_pnl_state_open(self, pro_buyer_with_nda_token):
        """Pro buyer with NDA sees pnl.state = 'open'."""
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
        
        # PnL should be open
        pnl = data["modules"]["pnl"]
        assert pnl["state"] == "open"
        assert "unlock_condition" not in pnl  # No unlock needed
    
    def test_premium_analysis_state_plan_required(self, pro_buyer_with_nda_token):
        """Pro buyer sees premium_analysis.state = 'plan_required' (Pro+ feature)."""
        if not pro_buyer_with_nda_token:
            pytest.skip("Pro buyer with NDA auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_with_nda_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        premium = data["modules"]["premium_analysis"]
        assert premium["state"] == "plan_required"
        assert premium["unlock_condition"] == "pro+"
        assert premium["cta_action"] == "upgrade_pro+"
        assert "Pro+" in premium["cta_label"]
    
    def test_infomemo_state_open(self, pro_buyer_with_nda_token):
        """Pro buyer with NDA sees infomemo.state = 'open'."""
        if not pro_buyer_with_nda_token:
            pytest.skip("Pro buyer with NDA auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_with_nda_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        infomemo = data["modules"]["infomemo"]
        assert infomemo["state"] == "open"
    
    def test_pnl_data_included_post_nda(self, pro_buyer_with_nda_token):
        """Pro buyer with NDA gets PnL detail in financial_data.years."""
        if not pro_buyer_with_nda_token:
            pytest.skip("Pro buyer with NDA auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_with_nda_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        fd = data["financial_data"]
        assert fd is not None
        assert len(fd["years"]) >= 1
        
        # Post-NDA should have pnl detail
        year_data = fd["years"][0]
        assert "pnl" in year_data
        assert year_data["pnl"]["revenue"] is not None


class TestModuleStatesFreeBuyer:
    """Test module states for Free buyer (carlos.ruiz - has accepted contact + legacy NDA)."""
    
    def test_free_buyer_visibility_state(self, free_buyer_token):
        """Free buyer with contact sees TEASER_UNLOCKED (capped by tier)."""
        if not free_buyer_token:
            pytest.skip("Free buyer auth failed")
        headers = {"Authorization": f"Bearer {free_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        # Free tier caps at TEASER_UNLOCKED even with NDA
        assert data["visibility_state"] == "TEASER_UNLOCKED"
        assert data["buyer_tier"] == "free"
    
    def test_free_buyer_modules_plan_required(self, free_buyer_token):
        """Free buyer sees plan_required for Pro-gated modules."""
        if not free_buyer_token:
            pytest.skip("Free buyer auth failed")
        headers = {"Authorization": f"Bearer {free_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        # Executive summary should be plan_required for Free
        exec_summary = data["modules"]["executive_summary"]
        assert exec_summary["state"] == "plan_required"
        assert exec_summary["cta_action"] == "upgrade_pro"
        
        # PnL should be plan_required for Free
        pnl = data["modules"]["pnl"]
        assert pnl["state"] == "plan_required"


class TestModuleStatesProPlusBuyer:
    """Test module states for Pro+ buyer (marta.font - has pending contact)."""
    
    def test_proplus_buyer_contact_required(self, proplus_buyer_token):
        """Pro+ buyer with pending contact sees contact_required modules."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        # Verify state
        assert data["buyer_tier"] == "pro+"
        assert data["contact_state"] == "pending"
        assert data["visibility_state"] == "CONTACT_REQUESTED"
        
        # Executive summary should be contact_required
        exec_summary = data["modules"]["executive_summary"]
        assert exec_summary["state"] == "contact_required"
        assert exec_summary["cta_action"] == "contact_request"
    
    def test_proplus_buyer_premium_modules_null_without_nda(self, proplus_buyer_token):
        """Pro+ buyer without NDA has premium_modules = null."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["premium_modules"] is None


class TestFinancialDataMultiYear:
    """Test financial_data with multi-year data and CAGR computation."""
    
    def test_financial_data_years_multi_year(self, pro_buyer_token):
        """financial_data.years contains multi-year data."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        fd = data["financial_data"]
        assert fd is not None
        assert "years" in fd
        assert len(fd["years"]) >= 2  # At least 2 years
        
        # Verify year structure
        for year_data in fd["years"]:
            assert "year" in year_data
            assert "revenue" in year_data
            assert "ebitda" in year_data
    
    def test_financial_data_cagr_computed(self, pro_buyer_token):
        """financial_data.cagr is computed correctly."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        fd = data["financial_data"]
        assert "cagr" in fd
        cagr = fd["cagr"]
        
        # CAGR should have revenue and/or ebitda
        assert "revenue" in cagr or "ebitda" in cagr
        
        # Verify CAGR values are reasonable percentages
        if "revenue" in cagr:
            assert isinstance(cagr["revenue"], (int, float))
            assert -100 <= cagr["revenue"] <= 500  # Reasonable range
        if "ebitda" in cagr:
            assert isinstance(cagr["ebitda"], (int, float))
            assert -100 <= cagr["ebitda"] <= 500
    
    def test_financial_data_source(self, pro_buyer_token):
        """financial_data.source indicates data origin."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        fd = data["financial_data"]
        assert "source" in fd
        assert fd["source"] in ("CIS", "ARROBA")


class TestDealSummarySanitization:
    """Test that deal_summary never exposes contact information."""
    
    def test_deal_summary_no_phone(self, pro_buyer_token):
        """deal_summary never contains phone."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        summary = resp.json().get("deal_summary", {})
        
        assert "phone" not in summary
        assert "contact_phone" not in summary
    
    def test_deal_summary_no_email(self, pro_buyer_token):
        """deal_summary never contains email."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        summary = resp.json().get("deal_summary", {})
        
        assert "email" not in summary
        assert "contact_email" not in summary
    
    def test_deal_summary_no_website(self, pro_buyer_token):
        """deal_summary never contains website."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        summary = resp.json().get("deal_summary", {})
        
        assert "website" not in summary
    
    def test_deal_summary_no_address(self, pro_buyer_token):
        """deal_summary never contains street/address."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        summary = resp.json().get("deal_summary", {})
        
        assert "street" not in summary
        assert "address" not in summary
        assert "postal_code" not in summary
    
    def test_deal_summary_has_required_fields(self, pro_buyer_token):
        """deal_summary has required display fields."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        summary = resp.json().get("deal_summary", {})
        
        # Required fields for display
        assert "title" in summary
        assert "sector" in summary
        assert "city" in summary
        assert "employees" in summary
        assert "operation_types" in summary


class TestProcessTimeline:
    """Test process_timeline shows correct step statuses."""
    
    def test_timeline_structure(self, pro_buyer_token):
        """process_timeline has correct structure."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        tl = data["process_timeline"]
        assert isinstance(tl, list)
        assert len(tl) >= 4  # contact, nda, interest, loi
        
        for step in tl:
            assert "step" in step
            assert "label" in step
            assert "status" in step
            assert step["status"] in ("completed", "pending", "available", "locked")
    
    def test_timeline_contact_completed_for_accepted(self, pro_buyer_token):
        """Contact step is completed when contact_state = accepted."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["contact_state"] == "accepted"
        
        tl = data["process_timeline"]
        contact_step = next((s for s in tl if s["step"] == "contact"), None)
        assert contact_step is not None
        assert contact_step["status"] == "completed"
    
    def test_timeline_nda_available_after_contact(self, pro_buyer_token):
        """NDA step is available when contact accepted but no NDA."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["contact_state"] == "accepted"
        assert data["has_nda"] == False
        
        tl = data["process_timeline"]
        nda_step = next((s for s in tl if s["step"] == "nda"), None)
        assert nda_step is not None
        assert nda_step["status"] == "available"
    
    def test_timeline_nda_completed_with_nda(self, pro_buyer_with_nda_token):
        """NDA step is completed when has_nda = true."""
        if not pro_buyer_with_nda_token:
            pytest.skip("Pro buyer with NDA auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_with_nda_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["has_nda"] == True
        
        tl = data["process_timeline"]
        nda_step = next((s for s in tl if s["step"] == "nda"), None)
        assert nda_step is not None
        assert nda_step["status"] == "completed"


class TestActionsPanel:
    """Test actions_panel has recommended/available/blocked with reasons."""
    
    def test_actions_panel_structure(self, pro_buyer_token):
        """actions_panel has correct structure."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        ap = data["actions_panel"]
        assert "recommended" in ap
        assert "available" in ap
        assert "blocked" in ap
        
        assert isinstance(ap["recommended"], list)
        assert isinstance(ap["available"], list)
        assert isinstance(ap["blocked"], list)
    
    def test_actions_panel_blocked_has_reasons(self, pro_buyer_token):
        """Blocked actions have reason field."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        ap = data["actions_panel"]
        for blocked in ap["blocked"]:
            assert "key" in blocked
            assert "reason" in blocked
            assert "label" in blocked
    
    def test_actions_panel_nda_recommended_for_nda_available(self, pro_buyer_token):
        """NDA_AVAILABLE state has sign_nda in recommended."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["visibility_state"] == "NDA_AVAILABLE"
        
        ap = data["actions_panel"]
        recommended_keys = [a["key"] for a in ap["recommended"]]
        assert "sign_nda" in recommended_keys
    
    def test_actions_panel_operative_access_has_full_actions(self, pro_buyer_with_nda_token):
        """OPERATIVE_ACCESS has infomemo and dataroom in available."""
        if not pro_buyer_with_nda_token:
            pytest.skip("Pro buyer with NDA auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_with_nda_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["visibility_state"] == "OPERATIVE_ACCESS"
        
        ap = data["actions_panel"]
        available_keys = [a["key"] for a in ap["available"]]
        assert "view_infomemo" in available_keys
        assert "dataroom" in available_keys
    
    def test_actions_panel_premium_blocked_for_pro(self, pro_buyer_with_nda_token):
        """Pro buyer has premium_analysis blocked with upgrade hint."""
        if not pro_buyer_with_nda_token:
            pytest.skip("Pro buyer with NDA auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_with_nda_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        ap = data["actions_panel"]
        premium_blocked = next((b for b in ap["blocked"] if b["key"] == "premium_analysis"), None)
        assert premium_blocked is not None
        assert premium_blocked["reason"] == "plan_required"
        assert premium_blocked["upgrade"] == "pro+"


class TestPrimaryCTA:
    """Test primary_cta structure and values."""
    
    def test_primary_cta_structure(self, pro_buyer_token):
        """primary_cta has action/label/style/description."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        cta = data["primary_cta"]
        assert "action" in cta
        assert "label" in cta
        assert "style" in cta
        assert "description" in cta
    
    def test_primary_cta_sign_nda_for_nda_available(self, pro_buyer_token):
        """NDA_AVAILABLE state has sign_nda as primary CTA."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["visibility_state"] == "NDA_AVAILABLE"
        assert data["primary_cta"]["action"] == "sign_nda"
        assert "NDA" in data["primary_cta"]["label"]
    
    def test_primary_cta_view_process_for_operative(self, pro_buyer_with_nda_token):
        """OPERATIVE_ACCESS state has view_process as primary CTA."""
        if not pro_buyer_with_nda_token:
            pytest.skip("Pro buyer with NDA auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_with_nda_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["visibility_state"] == "OPERATIVE_ACCESS"
        assert data["primary_cta"]["action"] == "view_process"


class TestSecondaryCTA:
    """Test secondary_cta for different states."""
    
    def test_secondary_cta_save_deal_for_locked(self, proplus_buyer_token):
        """Locked state has save_deal as secondary CTA."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        secondary = data.get("secondary_cta")
        assert secondary is not None
        assert secondary["action"] == "save_deal"
    
    def test_secondary_cta_questions_for_operative(self, pro_buyer_with_nda_token):
        """OPERATIVE_ACCESS has submit_questions as secondary CTA."""
        if not pro_buyer_with_nda_token:
            pytest.skip("Pro buyer with NDA auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_with_nda_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["visibility_state"] == "OPERATIVE_ACCESS"
        secondary = data.get("secondary_cta")
        assert secondary is not None
        assert secondary["action"] == "submit_questions"


class TestContentRichnessAndVisualMode:
    """Test content_richness_score and visual_mode computation."""
    
    def test_content_richness_score_range(self, pro_buyer_token):
        """content_richness_score is 0-100."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        score = data["content_richness_score"]
        assert isinstance(score, int)
        assert 0 <= score <= 100
    
    def test_visual_mode_values(self, pro_buyer_token):
        """visual_mode is lean/standard/rich."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["visual_mode"] in ("lean", "standard", "rich")
    
    def test_visual_mode_consistency(self, pro_buyer_token):
        """visual_mode is consistent with content_richness_score."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        score = data["content_richness_score"]
        mode = data["visual_mode"]
        
        if score >= 65:
            assert mode == "rich"
        elif score >= 35:
            assert mode == "standard"
        else:
            assert mode == "lean"


class TestAuthAndErrors:
    """Test authentication and error handling."""
    
    def test_presentation_requires_auth(self):
        """Presentation endpoint requires authentication."""
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation")
        assert resp.status_code == 401
    
    def test_presentation_deal_not_found(self, pro_buyer_token):
        """Non-existent deal returns 404."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/nonexistent_deal_xyz/presentation", headers=headers)
        assert resp.status_code == 404
    
    def test_seller_cannot_access_presentation(self, seller_token):
        """Seller cannot access buyer presentation endpoint."""
        if not seller_token:
            pytest.skip("Seller auth failed")
        headers = {"Authorization": f"Bearer {seller_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_ID}/presentation", headers=headers)
        assert resp.status_code == 403


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
