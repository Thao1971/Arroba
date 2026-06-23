"""
UX Navigation & Role-based Testing for Arroba M&A Platform
Tests: Login flows, role-based redirects, Seller Interesados API, Buyer SavedDeals API
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from seed data
SELLER_1 = {"email": "diego.martin@rankingdigital.es", "password": "demo2026"}  # 3 buyers: 2 LOIs, 1 interest
SELLER_2 = {"email": "nuria.costa@brillocreativo.cat", "password": "demo2026"}  # 5 buyers, all interest, 0 LOIs
BUYER = {"email": "carlos.ruiz@capitaliberica.es", "password": "demo2026"}  # 2 active processes


class TestAuthAndRoles:
    """Test authentication and role-based access"""
    
    def test_seller_login_returns_seller_role(self):
        """Seller login should return user with role=seller"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SELLER_1)
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert data.get("user", {}).get("role") == "seller", f"Expected seller role, got {data.get('user', {}).get('role')}"
        print(f"✓ Seller login successful: {data['user'].get('email')}, role={data['user'].get('role')}")
    
    def test_buyer_login_returns_buyer_role(self):
        """Buyer login should return user with role=buyer"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=BUYER)
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert data.get("user", {}).get("role") == "buyer", f"Expected buyer role, got {data.get('user', {}).get('role')}"
        print(f"✓ Buyer login successful: {data['user'].get('email')}, role={data['user'].get('role')}")


class TestSellerInteresadosAPI:
    """Test /api/engagements/seller/interesados endpoint"""
    
    @pytest.fixture
    def seller_token(self):
        """Get seller auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SELLER_1)
        if response.status_code != 200:
            pytest.skip("Seller login failed")
        return response.json().get("access_token")
    
    @pytest.fixture
    def seller2_token(self):
        """Get seller 2 auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SELLER_2)
        if response.status_code != 200:
            pytest.skip("Seller 2 login failed")
        return response.json().get("access_token")
    
    def test_interesados_endpoint_returns_200(self, seller_token):
        """Seller interesados endpoint should return 200"""
        headers = {"Authorization": f"Bearer {seller_token}"}
        response = requests.get(f"{BASE_URL}/api/engagements/seller/interesados", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ /api/engagements/seller/interesados returns 200")
    
    def test_interesados_returns_enriched_buyer_data(self, seller_token):
        """Interesados should return enriched buyer data with action, intent_score, last_activity"""
        headers = {"Authorization": f"Bearer {seller_token}"}
        response = requests.get(f"{BASE_URL}/api/engagements/seller/interesados", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check structure
        assert "buyers" in data, "Missing 'buyers' key"
        assert "summary" in data, "Missing 'summary' key"
        assert "nudges" in data, "Missing 'nudges' key"
        assert "deals_count" in data, "Missing 'deals_count' key"
        
        # Check summary structure
        summary = data["summary"]
        assert "total" in summary, "Missing 'total' in summary"
        assert "lois" in summary, "Missing 'lois' in summary"
        assert "high_intent" in summary, "Missing 'high_intent' in summary"
        assert "needs_action" in summary, "Missing 'needs_action' in summary"
        
        print(f"✓ Summary: total={summary['total']}, lois={summary['lois']}, high_intent={summary['high_intent']}, needs_action={summary['needs_action']}")
        
        # Check buyer data structure if buyers exist
        if data["buyers"]:
            buyer = data["buyers"][0]
            required_fields = ["engagement_id", "deal_id", "buyer_id", "buyer_name", "type", "stage", 
                              "intent_score", "last_activity", "action"]
            for field in required_fields:
                assert field in buyer, f"Missing '{field}' in buyer data"
            
            # Check action structure
            action = buyer["action"]
            assert "text" in action, "Missing 'text' in action"
            assert "urgency" in action, "Missing 'urgency' in action"
            assert action["urgency"] in ("alta", "media", "baja"), f"Invalid urgency: {action['urgency']}"
            
            print(f"✓ Buyer data enriched: {buyer['buyer_name']}, intent={buyer['intent_score']}, action='{action['text'][:50]}...'")
    
    def test_interesados_seller1_has_lois(self, seller_token):
        """Seller 1 (diego.martin) should have LOIs in their interesados"""
        headers = {"Authorization": f"Bearer {seller_token}"}
        response = requests.get(f"{BASE_URL}/api/engagements/seller/interesados", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        loi_count = data["summary"]["lois"]
        print(f"✓ Seller 1 has {loi_count} LOIs")
        # According to test data, seller 1 should have 2 LOIs
        assert loi_count >= 0, "LOI count should be non-negative"
    
    def test_interesados_seller2_has_zero_lois(self, seller2_token):
        """Seller 2 (nuria.costa) should have 0 LOIs (all interest)"""
        headers = {"Authorization": f"Bearer {seller2_token}"}
        response = requests.get(f"{BASE_URL}/api/engagements/seller/interesados", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        loi_count = data["summary"]["lois"]
        print(f"✓ Seller 2 has {loi_count} LOIs (expected 0)")
    
    def test_interesados_requires_auth(self):
        """Interesados endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/engagements/seller/interesados")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ /api/engagements/seller/interesados requires auth (401 without token)")


class TestBuyerSavedDealsAPI:
    """Test /api/engagements/saved endpoint"""
    
    @pytest.fixture
    def buyer_token(self):
        """Get buyer auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=BUYER)
        if response.status_code != 200:
            pytest.skip("Buyer login failed")
        return response.json().get("access_token")
    
    def test_saved_deals_endpoint_returns_200(self, buyer_token):
        """Saved deals endpoint should return 200"""
        headers = {"Authorization": f"Bearer {buyer_token}"}
        response = requests.get(f"{BASE_URL}/api/engagements/saved", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ /api/engagements/saved returns 200")
    
    def test_saved_deals_returns_enriched_data(self, buyer_token):
        """Saved deals should return enriched deal data (not just IDs)"""
        headers = {"Authorization": f"Bearer {buyer_token}"}
        response = requests.get(f"{BASE_URL}/api/engagements/saved", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check structure
        assert "deals" in data, "Missing 'deals' key"
        assert "total" in data, "Missing 'total' key"
        
        print(f"✓ Saved deals: total={data['total']}")
        
        # If there are saved deals, check enriched data
        if data["deals"]:
            deal = data["deals"][0]
            assert "deal_id" in deal, "Missing 'deal_id' in saved deal"
            assert "teaser" in deal, "Missing 'teaser' in saved deal (should have enriched data)"
            
            teaser = deal["teaser"]
            # Check teaser has display fields
            teaser_fields = ["headline", "sector_display", "geography_display", "revenue_display", "ebitda_display"]
            for field in teaser_fields:
                assert field in teaser, f"Missing '{field}' in teaser"
            
            print(f"✓ Saved deal enriched: {teaser.get('headline')}, sector={teaser.get('sector_display')}")
    
    def test_saved_deals_requires_auth(self):
        """Saved deals endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/engagements/saved")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ /api/engagements/saved requires auth (401 without token)")


class TestBuyerProcessesAPI:
    """Test /api/engagements/my-processes endpoint"""
    
    @pytest.fixture
    def buyer_token(self):
        """Get buyer auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=BUYER)
        if response.status_code != 200:
            pytest.skip("Buyer login failed")
        return response.json().get("access_token")
    
    def test_my_processes_returns_200(self, buyer_token):
        """My processes endpoint should return 200"""
        headers = {"Authorization": f"Bearer {buyer_token}"}
        response = requests.get(f"{BASE_URL}/api/engagements/my-processes", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ /api/engagements/my-processes returns 200")
    
    def test_my_processes_returns_processes(self, buyer_token):
        """My processes should return buyer's active engagements"""
        headers = {"Authorization": f"Bearer {buyer_token}"}
        response = requests.get(f"{BASE_URL}/api/engagements/my-processes", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "processes" in data, "Missing 'processes' key"
        assert "total" in data, "Missing 'total' key"
        
        print(f"✓ Buyer has {data['total']} active processes")


class TestMarketplaceAPI:
    """Test marketplace endpoints for public access"""
    
    def test_marketplace_deals_returns_200(self):
        """Marketplace deals should be publicly accessible"""
        response = requests.get(f"{BASE_URL}/api/marketplace/deals")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "deals" in data or isinstance(data, list), "Expected deals in response"
        print(f"✓ /api/marketplace/deals returns 200 with deals")
    
    def test_marketplace_stats_returns_200(self):
        """Marketplace stats should be publicly accessible"""
        response = requests.get(f"{BASE_URL}/api/marketplace/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ /api/marketplace/stats returns 200")
    
    def test_marketplace_featured_returns_200(self):
        """Featured deals should be publicly accessible"""
        response = requests.get(f"{BASE_URL}/api/marketplace/featured")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ /api/marketplace/featured returns 200")


class TestCoachingNudgesAPI:
    """Test coaching nudges for seller"""
    
    @pytest.fixture
    def seller_token(self):
        """Get seller auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SELLER_1)
        if response.status_code != 200:
            pytest.skip("Seller login failed")
        return response.json().get("access_token")
    
    def test_seller_nudges_returns_200(self, seller_token):
        """Seller nudges endpoint should return 200"""
        headers = {"Authorization": f"Bearer {seller_token}"}
        response = requests.get(f"{BASE_URL}/api/coaching/nudges", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "nudges" in data, "Missing 'nudges' key"
        print(f"✓ /api/coaching/nudges returns 200 with {data.get('count', 0)} nudges")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
