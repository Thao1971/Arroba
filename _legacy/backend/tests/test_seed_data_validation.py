"""
Seed Data Validation Tests - Arroba Platform
=============================================
Tests to validate the comprehensive seed script with 10 deals telling complete STORIES.
Validates: login, marketplace, intent scoring, suggestions, engagements, shortlist limits.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from seed data
BUYER_CREDENTIALS = {
    "email": "carlos.ruiz@capitaliberica.es",
    "password": "demo2026",
    "user_id": "buyer_pe_madrid_01"
}

SELLER_CREDENTIALS = {
    "email": "diego.martin@rankingdigital.es",
    "password": "demo2026",
    "user_id": "seller_seo_madrid_01"
}

SELLER_CREATIVE = {
    "email": "nuria.costa@brillocreativo.cat",
    "password": "demo2026",
    "user_id": "seller_creative_bcn_01"
}

SELLER_MEDIA = {
    "email": "aitor.etxebarria@mediapais.es",
    "password": "demo2026",
    "user_id": "seller_media_bil_01"
}

SELLER_PERF = {
    "email": "rosa.jimenez@clicksur.es",
    "password": "demo2026",
    "user_id": "seller_perf_mal_01"
}

SELLER_STRAT = {
    "email": "fernando.ruiz@stratconsulting.es",
    "password": "demo2026",
    "user_id": "seller_strat_mad_01"
}


@pytest.fixture(scope="module")
def buyer_token():
    """Get buyer authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": BUYER_CREDENTIALS["email"],
        "password": BUYER_CREDENTIALS["password"]
    })
    assert response.status_code == 200, f"Buyer login failed: {response.text}"
    return response.json()["access_token"]


@pytest.fixture(scope="module")
def seller_token():
    """Get seller authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": SELLER_CREDENTIALS["email"],
        "password": SELLER_CREDENTIALS["password"]
    })
    assert response.status_code == 200, f"Seller login failed: {response.text}"
    return response.json()["access_token"]


def get_seller_token(email, password):
    """Helper to get seller token for specific seller"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": email,
        "password": password
    })
    assert response.status_code == 200, f"Seller login failed: {response.text}"
    return response.json()["access_token"]


class TestLoginWithSeedData:
    """Test login with seed data credentials"""
    
    def test_buyer_login_success(self):
        """Buyer carlos.ruiz@capitaliberica.es can login with demo2026"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": BUYER_CREDENTIALS["email"],
            "password": BUYER_CREDENTIALS["password"]
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["user_id"] == BUYER_CREDENTIALS["user_id"]
        assert data["user"]["role"] == "buyer"
        assert data["user"]["buyer_profile"]["profile_complete"] == True
    
    def test_seller_login_success(self):
        """Seller diego.martin@rankingdigital.es can login with demo2026"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_CREDENTIALS["email"],
            "password": SELLER_CREDENTIALS["password"]
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["user_id"] == SELLER_CREDENTIALS["user_id"]
        assert data["user"]["role"] == "seller"
        assert data["user"]["seller_profile"]["company_id"] == "comp_ranking_digital"
    
    def test_other_sellers_login(self):
        """Other sellers can login with demo2026"""
        sellers = [SELLER_CREATIVE, SELLER_MEDIA, SELLER_PERF, SELLER_STRAT]
        for seller in sellers:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": seller["email"],
                "password": seller["password"]
            })
            assert response.status_code == 200, f"Login failed for {seller['email']}"


class TestMarketplaceDeals:
    """Test marketplace deals endpoint"""
    
    def test_marketplace_returns_7_published_deals(self):
        """GET /api/marketplace/deals returns 7 published deals (excludes draft and exclusivity)"""
        response = requests.get(f"{BASE_URL}/api/marketplace/deals")
        assert response.status_code == 200
        deals = response.json()
        assert len(deals) == 7, f"Expected 7 deals, got {len(deals)}"
        
        # Verify all are published status
        for deal in deals:
            assert deal["status"] == "published", f"Deal {deal['deal_id']} has status {deal['status']}"
    
    def test_marketplace_excludes_draft_deal(self):
        """Draft deal (deal_borrador_10) should not appear in marketplace"""
        response = requests.get(f"{BASE_URL}/api/marketplace/deals")
        deals = response.json()
        deal_ids = [d["deal_id"] for d in deals]
        assert "deal_borrador_10" not in deal_ids, "Draft deal should not appear in marketplace"
    
    def test_marketplace_excludes_exclusivity_deals(self):
        """Exclusivity deals should not appear in marketplace"""
        response = requests.get(f"{BASE_URL}/api/marketplace/deals")
        deals = response.json()
        deal_ids = [d["deal_id"] for d in deals]
        # deal_hot_seo_01 and deal_excl_prematura_08 are in exclusivity status
        assert "deal_hot_seo_01" not in deal_ids, "Exclusivity deal should not appear in marketplace"
        assert "deal_excl_prematura_08" not in deal_ids, "Exclusivity deal should not appear in marketplace"


class TestIntentScoring:
    """Test intent scoring endpoint"""
    
    def test_intent_score_hot_deal_buyer(self, buyer_token):
        """GET /api/tracking/intent/deal_hot_seo_01/buyer_pe_madrid_01 returns score ~95 (alta intención)"""
        response = requests.get(
            f"{BASE_URL}/api/tracking/intent/deal_hot_seo_01/buyer_pe_madrid_01",
            headers={"Authorization": f"Bearer {buyer_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify score is high (around 95)
        assert data["score"] >= 90, f"Expected score >= 90, got {data['score']}"
        assert data["level"] == "alta"
        assert data["label"] == "Alta intención"
        
        # Verify factors include LOI and Data Room activity
        factor_names = [f["factor"] for f in data["factors"]]
        assert any("LOI" in f for f in factor_names), "Should have LOI factor"
        assert any("descargas" in f for f in factor_names), "Should have downloads factor"
    
    def test_intent_score_requires_auth(self):
        """Intent score endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/tracking/intent/deal_hot_seo_01/buyer_pe_madrid_01")
        assert response.status_code == 401


class TestSuggestionsEngine:
    """Test auto-shortlist suggestions endpoint"""
    
    def test_suggestions_deal_hot_seo_01(self, seller_token):
        """GET /api/tracking/suggestions/deal_hot_seo_01 returns correct classifications"""
        response = requests.get(
            f"{BASE_URL}/api/tracking/suggestions/deal_hot_seo_01",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify shortlist status
        assert data["shortlist_status"]["current_count"] == 2
        assert data["shortlist_status"]["max"] == 3
        assert data["shortlist_status"]["available_slots"] == 1
        
        # Verify buyer classifications
        buyers = {b["buyer_id"]: b for b in data["buyers"]}
        
        # buyer_pe_madrid_01 should be EXCLUSIVITY
        assert buyers["buyer_pe_madrid_01"]["classification"] == "EXCLUSIVITY"
        assert buyers["buyer_pe_madrid_01"]["stage"] == "EXCLUSIVITY"
        
        # buyer_estrategico_bcn_01 should be ALREADY_SHORTLISTED
        assert buyers["buyer_estrategico_bcn_01"]["classification"] == "ALREADY_SHORTLISTED"
        assert buyers["buyer_estrategico_bcn_01"]["stage"] == "SHORTLISTED"
        
        # buyer_vc_london_01 should be LOW_PRIORITY
        assert buyers["buyer_vc_london_01"]["classification"] == "LOW_PRIORITY"
    
    def test_suggestions_deal_loi_sin_act_05(self):
        """GET /api/tracking/suggestions/deal_loi_sin_act_05 returns CONSIDER for buyer with LOI but 0 DR activity"""
        token = get_seller_token(SELLER_MEDIA["email"], SELLER_MEDIA["password"])
        response = requests.get(
            f"{BASE_URL}/api/tracking/suggestions/deal_loi_sin_act_05",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # buyer_pe_madrid_01 has LOI but 0 DR downloads - should be CONSIDER
        buyers = {b["buyer_id"]: b for b in data["buyers"]}
        buyer = buyers.get("buyer_pe_madrid_01")
        assert buyer is not None, "buyer_pe_madrid_01 should be in suggestions"
        assert buyer["classification"] == "CONSIDER", f"Expected CONSIDER, got {buyer['classification']}"
        assert buyer["signals"]["has_loi"] == True
        assert buyer["signals"]["dr_downloads"] == 0
    
    def test_suggestions_deal_alta_act_06(self):
        """GET /api/tracking/suggestions/deal_alta_act_06 returns CONSIDER for buyer with high activity but no LOI"""
        token = get_seller_token(SELLER_PERF["email"], SELLER_PERF["password"])
        response = requests.get(
            f"{BASE_URL}/api/tracking/suggestions/deal_alta_act_06",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # buyer_fo_bilbao_01 has high activity but no LOI - should be CONSIDER
        buyers = {b["buyer_id"]: b for b in data["buyers"]}
        buyer = buyers.get("buyer_fo_bilbao_01")
        assert buyer is not None, "buyer_fo_bilbao_01 should be in suggestions"
        assert buyer["classification"] == "CONSIDER", f"Expected CONSIDER, got {buyer['classification']}"
        assert buyer["signals"]["has_loi"] == False
        assert buyer["signals"]["dr_downloads"] >= 10, "Should have high DR downloads"
    
    def test_suggestions_deal_shortlist_full_07(self):
        """GET /api/tracking/suggestions/deal_shortlist_full_07 shows 3 ALREADY_SHORTLISTED + 0 available slots"""
        token = get_seller_token(SELLER_STRAT["email"], SELLER_STRAT["password"])
        response = requests.get(
            f"{BASE_URL}/api/tracking/suggestions/deal_shortlist_full_07",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify shortlist is full
        assert data["shortlist_status"]["current_count"] == 3
        assert data["shortlist_status"]["available_slots"] == 0
        
        # Count ALREADY_SHORTLISTED buyers
        shortlisted = [b for b in data["buyers"] if b["classification"] == "ALREADY_SHORTLISTED"]
        assert len(shortlisted) == 3, f"Expected 3 ALREADY_SHORTLISTED, got {len(shortlisted)}"


class TestEngagements:
    """Test engagements endpoints"""
    
    def test_my_processes_returns_2_active(self, buyer_token):
        """GET /api/engagements/my-processes for buyer_pe_madrid_01 returns 2 active processes"""
        response = requests.get(
            f"{BASE_URL}/api/engagements/my-processes",
            headers={"Authorization": f"Bearer {buyer_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["total"] == 2, f"Expected 2 processes, got {data['total']}"
        
        # Verify the two deals
        deal_ids = [p["deal_id"] for p in data["processes"]]
        assert "deal_hot_seo_01" in deal_ids
        assert "deal_loi_sin_act_05" in deal_ids
    
    def test_shortlist_full_returns_400(self):
        """POST /api/engagements/deal/deal_shortlist_full_07/shortlist/buyer_vc_bcn_02 returns 400 (shortlist full)"""
        token = get_seller_token(SELLER_STRAT["email"], SELLER_STRAT["password"])
        response = requests.post(
            f"{BASE_URL}/api/engagements/deal/deal_shortlist_full_07/shortlist/buyer_vc_bcn_02",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 400
        assert "Shortlist llena" in response.json()["detail"]
    
    def test_deal_engagements_creative_02(self):
        """GET /api/engagements/deal/deal_interest_creative_02 returns 5 engagements with 0 LOIs"""
        token = get_seller_token(SELLER_CREATIVE["email"], SELLER_CREATIVE["password"])
        response = requests.get(
            f"{BASE_URL}/api/engagements/deal/deal_interest_creative_02",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_interests"] == 5, f"Expected 5 interests, got {data['total_interests']}"
        assert data["total_lois"] == 0, f"Expected 0 LOIs, got {data['total_lois']}"
        assert len(data["engagements"]) == 5


class TestEdgeCases:
    """Test edge cases from seed data stories"""
    
    def test_ghost_buyer_deal_03(self):
        """Deal 3 (ghost buyer) - buyer viewed infomemo briefly then disappeared"""
        token = get_seller_token("rafael.torres@consultdigital.es", "demo2026")
        response = requests.get(
            f"{BASE_URL}/api/tracking/suggestions/deal_ghost_consult_03",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should have 1 buyer with low activity
        assert len(data["buyers"]) == 1
        buyer = data["buyers"][0]
        assert buyer["buyer_id"] == "buyer_holding_val_01"
        assert buyer["classification"] == "LOW_PRIORITY"
    
    def test_dead_deal_04(self):
        """Deal 4 (dead deal) - published but 0 activity"""
        token = get_seller_token("elena.romero@techstudio.es", "demo2026")
        response = requests.get(
            f"{BASE_URL}/api/tracking/suggestions/deal_dead_tech_04",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should have 0 buyers (no engagements)
        assert len(data["buyers"]) == 0
        # shortlist_status may not be present when no engagements exist
        if "shortlist_status" in data:
            assert data["shortlist_status"]["current_count"] == 0
    
    def test_exclusivity_premature_deal_08(self):
        """Deal 8 (premature exclusivity) - exclusivity granted to buyer with low activity"""
        token = get_seller_token("silvia.marco@contenidoszgz.es", "demo2026")
        response = requests.get(
            f"{BASE_URL}/api/tracking/suggestions/deal_excl_prematura_08",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # buyer_pe_sevilla_02 should be in EXCLUSIVITY
        buyers = {b["buyer_id"]: b for b in data["buyers"]}
        assert "buyer_pe_sevilla_02" in buyers
        assert buyers["buyer_pe_sevilla_02"]["classification"] == "EXCLUSIVITY"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
