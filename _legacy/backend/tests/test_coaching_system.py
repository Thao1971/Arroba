"""
Test Seller Coaching System v1
Tests for exclusivity warnings, deal nudges, and seller cross-deal nudges.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from seed data
SELLER_SEO = {"email": "diego.martin@rankingdigital.es", "password": "demo2026"}  # has deal_hot_seo_01
SELLER_CREATIVE = {"email": "nuria.costa@brillocreativo.cat", "password": "demo2026"}  # has NC-02 + NC-04
SELLER_TECH = {"email": "elena.romero@techstudio.es", "password": "demo2026"}  # has NC-01 (dead deal)
SELLER_MEDIA = {"email": "aitor.etxebarria@mediapais.es", "password": "demo2026"}  # has NC-03
SELLER_CONTENT = {"email": "silvia.marco@contenidoszgz.es", "password": "demo2026"}  # premature exclusivity


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def get_auth_token(api_client, email, password):
    """Helper to get auth token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": email,
        "password": password
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    return None


# ============================================================
# EXCLUSIVITY CHECK TESTS
# ============================================================

class TestExclusivityCheck:
    """Tests for GET /api/coaching/exclusivity-check/{deal_id}/{buyer_id}"""

    def test_exclusivity_check_good_buyer(self, api_client):
        """
        Test: buyer_pe_madrid_01 on deal_hot_seo_01 should return ready=true
        This buyer has: LOI, high intent score, DR downloads, time invested
        """
        token = get_auth_token(api_client, SELLER_SEO["email"], SELLER_SEO["password"])
        assert token, "Failed to get auth token for seller SEO"
        
        api_client.headers.update({"Authorization": f"Bearer {token}"})
        response = api_client.get(f"{BASE_URL}/api/coaching/exclusivity-check/deal_hot_seo_01/buyer_pe_madrid_01")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify ready status
        assert data.get("ready") == True, f"Expected ready=true for good buyer, got {data}"
        
        # Verify criteria met
        criteria = data.get("criteria", {})
        assert criteria.get("criteria_met") >= 3, f"Expected at least 3/4 criteria met, got {criteria}"
        
        # Verify metrics present
        metrics = data.get("metrics", {})
        assert "intent_score" in metrics
        assert "has_loi" in metrics
        assert "dr_downloads" in metrics
        assert "total_minutes" in metrics
        
        print(f"✓ Good buyer check passed: ready={data['ready']}, criteria={criteria['criteria_met']}/4")

    def test_exclusivity_check_bad_buyer(self, api_client):
        """
        Test: buyer_vc_london_01 on deal_hot_seo_01 should return ready=false
        This buyer has: no LOI, low activity
        """
        token = get_auth_token(api_client, SELLER_SEO["email"], SELLER_SEO["password"])
        assert token, "Failed to get auth token"
        
        api_client.headers.update({"Authorization": f"Bearer {token}"})
        response = api_client.get(f"{BASE_URL}/api/coaching/exclusivity-check/deal_hot_seo_01/buyer_vc_london_01")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify not ready
        assert data.get("ready") == False, f"Expected ready=false for bad buyer, got {data}"
        
        # Verify warnings present
        warnings = data.get("warnings", [])
        assert len(warnings) > 0, f"Expected warnings for bad buyer, got none"
        
        # Verify criteria
        criteria = data.get("criteria", {})
        assert criteria.get("criteria_met", 0) < 3, f"Expected less than 3 criteria met, got {criteria}"
        
        print(f"✓ Bad buyer check passed: ready={data['ready']}, warnings={len(warnings)}, criteria={criteria.get('criteria_met', 0)}/4")

    def test_exclusivity_check_premature(self, api_client):
        """
        Test: buyer_pe_sevilla_02 on deal_excl_prematura_08 should return ready=false
        This is a premature exclusivity case
        """
        token = get_auth_token(api_client, SELLER_CONTENT["email"], SELLER_CONTENT["password"])
        assert token, "Failed to get auth token for seller content"
        
        api_client.headers.update({"Authorization": f"Bearer {token}"})
        response = api_client.get(f"{BASE_URL}/api/coaching/exclusivity-check/deal_excl_prematura_08/buyer_pe_sevilla_02")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify not ready (premature)
        assert data.get("ready") == False, f"Expected ready=false for premature exclusivity, got {data}"
        
        criteria = data.get("criteria", {})
        print(f"✓ Premature exclusivity check passed: ready={data['ready']}, criteria={criteria.get('criteria_met', 0)}/4")


# ============================================================
# DEAL NUDGES TESTS
# ============================================================

class TestDealNudges:
    """Tests for GET /api/coaching/nudges/deal/{deal_id}"""

    def test_nudge_nc02_interest_no_loi(self, api_client):
        """
        Test: deal_interest_creative_02 should return NC-02 (5 interests, 0 LOIs)
        """
        token = get_auth_token(api_client, SELLER_CREATIVE["email"], SELLER_CREATIVE["password"])
        assert token, "Failed to get auth token"
        
        api_client.headers.update({"Authorization": f"Bearer {token}"})
        response = api_client.get(f"{BASE_URL}/api/coaching/nudges/deal/deal_interest_creative_02")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        nudges = data.get("nudges", [])
        nc02_nudges = [n for n in nudges if n.get("id") == "NC-02"]
        
        assert len(nc02_nudges) > 0, f"Expected NC-02 nudge for deal with interests but no LOIs, got {nudges}"
        
        nc02 = nc02_nudges[0]
        assert nc02.get("priority") == "ALTA", f"Expected ALTA priority for NC-02, got {nc02.get('priority')}"
        assert "interes" in nc02.get("title", "").lower() or "conversion" in nc02.get("title", "").lower()
        
        print(f"✓ NC-02 nudge found: {nc02['title']} - priority={nc02['priority']}")

    def test_nudge_nc01_dead_deal(self, api_client):
        """
        Test: deal_dead_tech_04 should return NC-01 (deal sin traccion >7 days, 0 NDAs)
        """
        token = get_auth_token(api_client, SELLER_TECH["email"], SELLER_TECH["password"])
        assert token, "Failed to get auth token"
        
        api_client.headers.update({"Authorization": f"Bearer {token}"})
        response = api_client.get(f"{BASE_URL}/api/coaching/nudges/deal/deal_dead_tech_04")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        nudges = data.get("nudges", [])
        nc01_nudges = [n for n in nudges if n.get("id") == "NC-01"]
        
        assert len(nc01_nudges) > 0, f"Expected NC-01 nudge for dead deal, got {nudges}"
        
        nc01 = nc01_nudges[0]
        assert nc01.get("priority") == "ALTA", f"Expected ALTA priority for NC-01, got {nc01.get('priority')}"
        assert "traccion" in nc01.get("title", "").lower() or "sin traccion" in nc01.get("message", "").lower()
        
        print(f"✓ NC-01 nudge found: {nc01['title']} - priority={nc01['priority']}")

    def test_nudge_nc03_loi_no_dd(self, api_client):
        """
        Test: deal_loi_sin_act_05 should return NC-03 (LOI sin DR downloads)
        """
        token = get_auth_token(api_client, SELLER_MEDIA["email"], SELLER_MEDIA["password"])
        assert token, "Failed to get auth token"
        
        api_client.headers.update({"Authorization": f"Bearer {token}"})
        response = api_client.get(f"{BASE_URL}/api/coaching/nudges/deal/deal_loi_sin_act_05")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        nudges = data.get("nudges", [])
        nc03_nudges = [n for n in nudges if n.get("id") == "NC-03"]
        
        assert len(nc03_nudges) > 0, f"Expected NC-03 nudge for LOI without DD, got {nudges}"
        
        nc03 = nc03_nudges[0]
        assert nc03.get("priority") == "MEDIA", f"Expected MEDIA priority for NC-03, got {nc03.get('priority')}"
        
        print(f"✓ NC-03 nudge found: {nc03['title']} - priority={nc03['priority']}")


# ============================================================
# SELLER NUDGES (CROSS-DEAL) TESTS
# ============================================================

class TestSellerNudges:
    """Tests for GET /api/coaching/nudges (seller cross-deal nudges)"""

    def test_seller_nudges_tech_nc01(self, api_client):
        """
        Test: elena.romero@techstudio.es should see NC-01 for dead deal
        """
        token = get_auth_token(api_client, SELLER_TECH["email"], SELLER_TECH["password"])
        assert token, "Failed to get auth token"
        
        api_client.headers.update({"Authorization": f"Bearer {token}"})
        response = api_client.get(f"{BASE_URL}/api/coaching/nudges")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        nudges = data.get("nudges", [])
        nc01_nudges = [n for n in nudges if n.get("id") == "NC-01"]
        
        assert len(nc01_nudges) > 0, f"Expected NC-01 nudge for seller with dead deal, got {nudges}"
        
        # Verify deal_id is included
        nc01 = nc01_nudges[0]
        assert "deal_id" in nc01, "Expected deal_id in cross-deal nudge"
        
        print(f"✓ Seller nudges for tech seller: found {len(nudges)} nudges, including NC-01")

    def test_seller_nudges_creative(self, api_client):
        """
        Test: nuria.costa@brillocreativo.cat should see nudges (NC-02 + NC-04)
        """
        token = get_auth_token(api_client, SELLER_CREATIVE["email"], SELLER_CREATIVE["password"])
        assert token, "Failed to get auth token"
        
        api_client.headers.update({"Authorization": f"Bearer {token}"})
        response = api_client.get(f"{BASE_URL}/api/coaching/nudges")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        nudges = data.get("nudges", [])
        nudge_ids = [n.get("id") for n in nudges]
        
        # Should have NC-02 (interest without conversion)
        assert "NC-02" in nudge_ids, f"Expected NC-02 for creative seller, got {nudge_ids}"
        
        print(f"✓ Seller nudges for creative seller: found {len(nudges)} nudges, IDs: {nudge_ids}")

    def test_seller_nudges_sorted_by_priority(self, api_client):
        """
        Test: Nudges should be sorted by priority (ALTA first, then MEDIA, then BAJA)
        """
        token = get_auth_token(api_client, SELLER_CREATIVE["email"], SELLER_CREATIVE["password"])
        assert token, "Failed to get auth token"
        
        api_client.headers.update({"Authorization": f"Bearer {token}"})
        response = api_client.get(f"{BASE_URL}/api/coaching/nudges")
        
        assert response.status_code == 200
        data = response.json()
        
        nudges = data.get("nudges", [])
        if len(nudges) > 1:
            priorities = [n.get("priority") for n in nudges]
            priority_order = {"ALTA": 0, "MEDIA": 1, "BAJA": 2}
            
            # Check if sorted
            is_sorted = all(
                priority_order.get(priorities[i], 3) <= priority_order.get(priorities[i+1], 3)
                for i in range(len(priorities) - 1)
            )
            assert is_sorted, f"Nudges not sorted by priority: {priorities}"
            
            print(f"✓ Nudges sorted correctly by priority: {priorities}")


# ============================================================
# EXPORTS ENDPOINT TEST
# ============================================================

class TestExports:
    """Tests for GET /api/exports/documentacion"""

    def test_exports_zip_download(self, api_client):
        """
        Test: GET /api/exports/documentacion should return 200 and a ZIP file
        """
        response = api_client.get(f"{BASE_URL}/api/exports/documentacion")
        
        # Could be 200 (file exists) or 404 (file not created yet)
        if response.status_code == 200:
            assert response.headers.get("content-type") == "application/zip" or \
                   "application/octet-stream" in response.headers.get("content-type", ""), \
                   f"Expected ZIP content type, got {response.headers.get('content-type')}"
            print(f"✓ Exports ZIP download working: {len(response.content)} bytes")
        elif response.status_code == 404:
            print(f"⚠ Exports ZIP not found (seed script may not have created it)")
            pytest.skip("ZIP file not created by seed script")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")


# ============================================================
# AUTHENTICATION TESTS
# ============================================================

class TestCoachingAuth:
    """Tests for authentication on coaching endpoints"""

    def test_exclusivity_check_requires_auth(self):
        """Test that exclusivity check requires authentication"""
        # Use a fresh session without any auth
        fresh_session = requests.Session()
        fresh_session.headers.update({"Content-Type": "application/json"})
        
        response = fresh_session.get(f"{BASE_URL}/api/coaching/exclusivity-check/deal_hot_seo_01/buyer_pe_madrid_01")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Exclusivity check requires authentication")

    def test_deal_nudges_requires_auth(self):
        """Test that deal nudges requires authentication"""
        fresh_session = requests.Session()
        fresh_session.headers.update({"Content-Type": "application/json"})
        
        response = fresh_session.get(f"{BASE_URL}/api/coaching/nudges/deal/deal_hot_seo_01")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Deal nudges requires authentication")

    def test_seller_nudges_requires_auth(self):
        """Test that seller nudges requires authentication"""
        fresh_session = requests.Session()
        fresh_session.headers.update({"Content-Type": "application/json"})
        
        response = fresh_session.get(f"{BASE_URL}/api/coaching/nudges")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Seller nudges requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
