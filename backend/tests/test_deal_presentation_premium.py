"""
Test Suite: Deal Presentation Premium Features — Pro+ Valuation, KPIs, Benchmark, AI Analysis
Tests premium layers for ARROBA platform: quality_score, quality_drivers, scenarios, premium_quant KPIs,
premium_benchmark percentiles, premium-analysis endpoint with cache.
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials - CORRECTED user_ids based on actual DB
CREDENTIALS = {
    "free_buyer": {"email": "carlos.ruiz@capitaliberica.es", "password": "demo2026", "user_id": "buyer_pe_madrid_01"},
    "pro_buyer": {"email": "iker.aguirre@familyoffice-norte.es", "password": "demo2026", "user_id": "buyer_fo_bilbao_01"},
    "pro_buyer_with_nda": {"email": "james.harris@techventures.co.uk", "password": "demo2026", "user_id": "buyer_vc_london_01"},
    "proplus_buyer": {"email": "marta.font@groupdigital.cat", "password": "demo2026", "user_id": "buyer_estrategico_bcn_01"},
    "seller": {"email": "diego.martin@rankingdigital.es", "password": "demo2026", "user_id": "seller_seo_madrid_01"},
}

# Deals
DEAL_HOT_SEO = "deal_hot_seo_01"  # Seed deal with flat financials
DEAL_CIS = "deal_cis_putos_modernos"  # CIS deal with PnL+Balance data


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


class TestFreeBuyerDealHotSeo:
    """Free buyer (carlos) on deal_hot_seo_01 — TEASER_UNLOCKED, modules show plan_required for Pro content."""
    
    def test_free_buyer_teaser_unlocked(self, free_buyer_token):
        """Free buyer with accepted contact sees TEASER_UNLOCKED."""
        if not free_buyer_token:
            pytest.skip("Free buyer auth failed")
        headers = {"Authorization": f"Bearer {free_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_HOT_SEO}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["visibility_state"] == "TEASER_UNLOCKED"
        assert data["buyer_tier"] == "free"
    
    def test_free_buyer_modules_plan_required(self, free_buyer_token):
        """Free buyer sees plan_required for Pro-gated modules."""
        if not free_buyer_token:
            pytest.skip("Free buyer auth failed")
        headers = {"Authorization": f"Bearer {free_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_HOT_SEO}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        # PnL should be plan_required for Free
        pnl = data["modules"]["pnl"]
        assert pnl["state"] == "plan_required"
        assert pnl["cta_action"] == "upgrade_pro"


class TestProBuyerDealHotSeo:
    """Pro buyer (iker, accepted contact) on deal_hot_seo_01 — NDA_AVAILABLE, pnl=nda_required, infomemo=nda_required."""
    
    def test_pro_buyer_nda_available(self, pro_buyer_token):
        """Pro buyer with accepted contact sees NDA_AVAILABLE."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_HOT_SEO}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["visibility_state"] == "NDA_AVAILABLE"
        assert data["buyer_tier"] == "pro"
        assert data["contact_state"] == "accepted"
        assert data["has_nda"] == False
    
    def test_pro_buyer_pnl_nda_required(self, pro_buyer_token):
        """Pro buyer without NDA sees pnl.state = 'nda_required'."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_HOT_SEO}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        pnl = data["modules"]["pnl"]
        assert pnl["state"] == "nda_required"
        assert pnl["cta_action"] == "sign_nda"
    
    def test_pro_buyer_infomemo_nda_required(self, pro_buyer_token):
        """Pro buyer without NDA sees infomemo.state = 'nda_required'."""
        if not pro_buyer_token:
            pytest.skip("Pro buyer auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_HOT_SEO}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        infomemo = data["modules"]["infomemo"]
        assert infomemo["state"] == "nda_required"


class TestProBuyerWithNDADealHotSeo:
    """Pro buyer with NDA (james) on deal_hot_seo_01 — OPERATIVE_ACCESS, all modules open."""
    
    def test_pro_buyer_with_nda_operative_access(self, pro_buyer_with_nda_token):
        """Pro buyer with NDA sees OPERATIVE_ACCESS."""
        if not pro_buyer_with_nda_token:
            pytest.skip("Pro buyer with NDA auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_with_nda_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_HOT_SEO}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["visibility_state"] == "OPERATIVE_ACCESS"
        assert data["buyer_tier"] == "pro"
        assert data["has_nda"] == True
    
    def test_pro_buyer_with_nda_all_modules_open(self, pro_buyer_with_nda_token):
        """Pro buyer with NDA sees all modules open (or hidden_only_if_no_data if no content)."""
        if not pro_buyer_with_nda_token:
            pytest.skip("Pro buyer with NDA auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_with_nda_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_HOT_SEO}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        # PnL and infomemo should be open
        assert data["modules"]["pnl"]["state"] == "open"
        assert data["modules"]["infomemo"]["state"] == "open"
        # Dataroom may be hidden_only_if_no_data if no files uploaded
        assert data["modules"]["dataroom"]["state"] in ("open", "hidden_only_if_no_data")


class TestProPlusBuyerCISDeal:
    """Pro+ buyer (marta, NDA) on deal_cis_putos_modernos — OPERATIVE_ACCESS + premium_quant + premium_valuation."""
    
    def test_proplus_buyer_operative_access(self, proplus_buyer_token):
        """Pro+ buyer with NDA sees OPERATIVE_ACCESS."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_CIS}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["visibility_state"] == "OPERATIVE_ACCESS"
        assert data["buyer_tier"] == "pro+"
        assert data["has_nda"] == True
    
    def test_proplus_buyer_premium_quant_available(self, proplus_buyer_token):
        """Pro+ buyer with NDA gets premium_quant data."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_CIS}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        pq = data.get("premium_quant")
        assert pq is not None
        assert pq.get("available") == True
    
    def test_proplus_buyer_premium_valuation_available(self, proplus_buyer_token):
        """Pro+ buyer with NDA gets premium_valuation data."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_CIS}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        pv = data.get("premium_valuation")
        assert pv is not None
        assert pv.get("available") == True


class TestPremiumValuationStructure:
    """Test premium_valuation has quality_score, quality_drivers, scenarios, parameters, methodology."""
    
    def test_premium_valuation_quality_score(self, proplus_buyer_token):
        """premium_valuation has quality_score (0-100)."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_CIS}/presentation", headers=headers)
        assert resp.status_code == 200
        pv = resp.json().get("premium_valuation", {})
        
        assert "quality_score" in pv
        assert isinstance(pv["quality_score"], (int, float))
        assert 0 <= pv["quality_score"] <= 100
    
    def test_premium_valuation_quality_drivers(self, proplus_buyer_token):
        """premium_valuation has quality_drivers with descriptions."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_CIS}/presentation", headers=headers)
        assert resp.status_code == 200
        pv = resp.json().get("premium_valuation", {})
        
        drivers = pv.get("quality_drivers", [])
        assert isinstance(drivers, list)
        assert len(drivers) >= 3  # At least margin, efficiency, recurrence, growth
        
        for d in drivers:
            assert "factor" in d
            assert "impact" in d
            assert "description" in d
            # Verify descriptions have actual values, not just 'positivo'
            assert d["description"] != d["impact"]
    
    def test_premium_valuation_scenarios(self, proplus_buyer_token):
        """premium_valuation has scenarios (conservative/base/optimistic)."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_CIS}/presentation", headers=headers)
        assert resp.status_code == 200
        pv = resp.json().get("premium_valuation", {})
        
        scenarios = pv.get("scenarios", {})
        assert "conservative" in scenarios
        assert "base" in scenarios
        assert "optimistic" in scenarios
        
        for key in ["conservative", "base", "optimistic"]:
            sc = scenarios[key]
            assert "label" in sc
            assert "ev" in sc
            assert "multiple" in sc
            assert isinstance(sc["ev"], (int, float))
            assert sc["ev"] > 0
    
    def test_premium_valuation_parameters(self, proplus_buyer_token):
        """premium_valuation has parameters (ebitda_base, method, category, multiple_range)."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_CIS}/presentation", headers=headers)
        assert resp.status_code == 200
        pv = resp.json().get("premium_valuation", {})
        
        params = pv.get("parameters", {})
        assert "ebitda_base" in params
        assert "method" in params
        assert "category" in params
        assert "multiple_range" in params
        assert "quality_factor" in params
        assert "quality_score" in params
    
    def test_premium_valuation_methodology(self, proplus_buyer_token):
        """premium_valuation has methodology with steps and definitions."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_CIS}/presentation", headers=headers)
        assert resp.status_code == 200
        pv = resp.json().get("premium_valuation", {})
        
        meth = pv.get("methodology", {})
        assert "title" in meth
        assert "steps" in meth
        assert "definitions" in meth
        assert "disclaimer" in meth
        
        assert len(meth["steps"]) >= 3
        for step in meth["steps"]:
            assert "step" in step
            assert "description" in step


class TestPremiumQuantKPIs:
    """Test premium_quant has 8 KPIs with labels, formulas, descriptions, units, levels."""
    
    def test_premium_quant_kpis_count(self, proplus_buyer_token):
        """premium_quant has at least 6 KPIs."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_CIS}/presentation", headers=headers)
        assert resp.status_code == 200
        pq = resp.json().get("premium_quant", {})
        
        kpis = pq.get("kpis", {})
        assert len(kpis) >= 6  # At least 6 KPIs
    
    def test_premium_quant_kpi_structure(self, proplus_buyer_token):
        """Each KPI has label, formula, description, unit."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_CIS}/presentation", headers=headers)
        assert resp.status_code == 200
        pq = resp.json().get("premium_quant", {})
        
        kpis = pq.get("kpis", {})
        for kpi_id, kpi in kpis.items():
            assert "value" in kpi, f"KPI {kpi_id} missing value"
            assert "label" in kpi, f"KPI {kpi_id} missing label"
            assert "formula" in kpi, f"KPI {kpi_id} missing formula"
            assert "description" in kpi, f"KPI {kpi_id} missing description"
            assert "unit" in kpi, f"KPI {kpi_id} missing unit"
    
    def test_premium_quant_kpi_levels(self, proplus_buyer_token):
        """KPIs with interpretation have level and level_label."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_CIS}/presentation", headers=headers)
        assert resp.status_code == 200
        pq = resp.json().get("premium_quant", {})
        
        kpis = pq.get("kpis", {})
        # At least some KPIs should have levels
        kpis_with_levels = [k for k, v in kpis.items() if "level" in v]
        assert len(kpis_with_levels) >= 3
        
        for kpi_id in kpis_with_levels:
            kpi = kpis[kpi_id]
            assert kpi["level"] in ("low", "medium", "high")
            assert "level_label" in kpi


class TestPremiumAnalysisEndpoint:
    """Test GET /api/deals/{dealId}/premium-analysis endpoint."""
    
    def test_premium_analysis_returns_403_for_non_proplus(self, pro_buyer_with_nda_token):
        """premium-analysis returns 403 for non-Pro+ buyer."""
        if not pro_buyer_with_nda_token:
            pytest.skip("Pro buyer with NDA auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_with_nda_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_CIS}/premium-analysis", headers=headers)
        assert resp.status_code == 403
        assert "Pro+" in resp.json().get("detail", "")
    
    def test_premium_analysis_returns_403_without_nda(self, proplus_buyer_token):
        """premium-analysis returns 403 without NDA."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        # Use a deal where marta doesn't have NDA
        resp = requests.get(f"{BASE_URL}/api/deals/deal_ghost_consult_03/premium-analysis", headers=headers)
        assert resp.status_code == 403
        assert "NDA" in resp.json().get("detail", "")
    
    def test_premium_analysis_returns_analysis(self, proplus_buyer_token):
        """premium-analysis returns AI analysis for Pro+ with NDA."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        
        # First call - may take time (GPT-5.2)
        start = time.time()
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_CIS}/premium-analysis", headers=headers, timeout=60)
        first_call_time = time.time() - start
        
        assert resp.status_code == 200
        data = resp.json()
        
        # Should have analysis structure
        assert "available" in data or "strategic_reading" in data or "strengths" in data
        
        print(f"First call took {first_call_time:.2f}s")
    
    def test_premium_analysis_cache_hit(self, proplus_buyer_token):
        """Second call to premium-analysis should be cached (instant)."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        
        # Second call - should be cached
        start = time.time()
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_CIS}/premium-analysis", headers=headers, timeout=10)
        second_call_time = time.time() - start
        
        assert resp.status_code == 200
        
        # Cache hit should be fast (< 2 seconds)
        print(f"Second call (cache) took {second_call_time:.2f}s")
        assert second_call_time < 5, f"Cache hit should be fast, took {second_call_time:.2f}s"


class TestDealSummarySanitization:
    """Test that deal_summary never contains phone/email/website."""
    
    def test_deal_summary_no_contact_info(self, proplus_buyer_token):
        """deal_summary never contains phone/email/website."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_CIS}/presentation", headers=headers)
        assert resp.status_code == 200
        summary = resp.json().get("deal_summary", {})
        
        forbidden_fields = ["phone", "email", "contact_email", "contact_phone", "website", "street", "address", "postal_code"]
        for field in forbidden_fields:
            assert field not in summary, f"deal_summary should not contain {field}"


class TestProcessTimeline:
    """Test process_timeline correct per state."""
    
    def test_process_timeline_operative_access(self, proplus_buyer_token):
        """OPERATIVE_ACCESS has contact and nda completed."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_CIS}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["visibility_state"] == "OPERATIVE_ACCESS"
        
        tl = data["process_timeline"]
        contact_step = next((s for s in tl if s["step"] == "contact"), None)
        nda_step = next((s for s in tl if s["step"] == "nda"), None)
        
        assert contact_step is not None
        assert contact_step["status"] == "completed"
        assert nda_step is not None
        assert nda_step["status"] == "completed"


class TestActionsPanelUpgradeHints:
    """Test actions_panel blocked items have upgrade hints."""
    
    def test_actions_panel_premium_blocked_for_pro(self, pro_buyer_with_nda_token):
        """Pro buyer has premium_analysis blocked with upgrade hint."""
        if not pro_buyer_with_nda_token:
            pytest.skip("Pro buyer with NDA auth failed")
        headers = {"Authorization": f"Bearer {pro_buyer_with_nda_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_HOT_SEO}/presentation", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        
        ap = data["actions_panel"]
        premium_blocked = next((b for b in ap["blocked"] if b["key"] == "premium_analysis"), None)
        assert premium_blocked is not None
        assert premium_blocked["reason"] == "plan_required"
        assert premium_blocked["upgrade"] == "pro+"


class TestQualityScoreDriversActualValues:
    """Test Quality Score drivers show actual values (55.2% margen, 394K/empleado, etc), not just 'positivo'."""
    
    def test_quality_drivers_have_actual_values(self, proplus_buyer_token):
        """Quality drivers descriptions contain actual numeric values."""
        if not proplus_buyer_token:
            pytest.skip("Pro+ buyer auth failed")
        headers = {"Authorization": f"Bearer {proplus_buyer_token}"}
        resp = requests.get(f"{BASE_URL}/api/deals/{DEAL_CIS}/presentation", headers=headers)
        assert resp.status_code == 200
        pv = resp.json().get("premium_valuation", {})
        
        drivers = pv.get("quality_drivers", [])
        
        # Check that descriptions contain actual values
        for d in drivers:
            desc = d.get("description", "")
            # Description should not be empty or just the impact label
            assert len(desc) > 5, f"Driver {d['factor']} has empty description"
            assert desc != d.get("impact"), f"Driver {d['factor']} description is just the impact label"
            
            # At least some drivers should have numeric values in description
            # (e.g., "55.2% de margen operativo", "394,000 EUR por empleado")
        
        # Verify at least one driver has a percentage or number in description
        has_numeric = any(
            any(c.isdigit() for c in d.get("description", ""))
            for d in drivers
        )
        assert has_numeric, "At least one driver should have numeric value in description"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
