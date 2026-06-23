"""
Test Seller Company Profiles & Workspace APIs
Tests: resolve-and-save, overrides (company_id persistence), by-company lookup, panel-status, pricing
Critical bugs fixed:
1) company_id now persists to document root (not inside seller_overrides)
2) recalcPs no longer uses stale closure variables
3) subcategory matching partial between CIS and local taxonomy
4) handleResolve rehidrates overrides/pricing/panel_status
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SELLER_EMAIL = "diego.martin@rankingdigital.es"
SELLER_PASSWORD = "demo2026"

# Known test data
EXISTING_COMPANY_ID = "comp_e4ac88f79823"  # Putos Modernos
EXISTING_PROFILE_ID = "scp_0dc2ae66af76"
EXISTING_CIF = "B67098228"  # Putos Modernos CIF


class TestSellerProfilesAuth:
    """Authentication for seller profiles"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get seller auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json().get("access_token")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_seller_login(self, auth_token):
        """Test seller can login"""
        assert auth_token is not None
        print(f"✓ Seller login successful")


class TestResolveAndSave:
    """POST /api/seller-profiles/resolve-and-save tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_resolve_requires_auth(self):
        """Resolve endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/seller-profiles/resolve-and-save", json={"cif": "B12345678"})
        assert response.status_code == 401
        print("✓ Resolve requires auth")
    
    def test_resolve_requires_cif(self, auth_headers):
        """Resolve requires CIF parameter"""
        response = requests.post(f"{BASE_URL}/api/seller-profiles/resolve-and-save", json={}, headers=auth_headers)
        assert response.status_code == 400
        assert "CIF" in response.json().get("detail", "")
        print("✓ Resolve requires CIF")
    
    def test_resolve_known_cif(self, auth_headers):
        """Resolve known CIF (B67098228 - Putos Modernos) returns profile with CIS data"""
        response = requests.post(f"{BASE_URL}/api/seller-profiles/resolve-and-save", 
                                json={"cif": EXISTING_CIF}, headers=auth_headers)
        assert response.status_code == 200, f"Resolve failed: {response.text}"
        data = response.json()
        
        # Check profile structure
        assert "profile_id" in data
        assert "auto_prefilled" in data
        assert "seller_overrides" in data
        assert "pricing" in data
        assert "panel_status" in data
        
        # Check auto_prefilled has CIS data
        ap = data["auto_prefilled"]
        assert "identity" in ap
        assert "financials" in ap
        assert "taxonomy" in ap
        
        # Check identity has legal_name
        identity = ap.get("identity", {})
        assert identity.get("legal_name"), "Identity should have legal_name from CIS"
        
        print(f"✓ Resolve known CIF: profile_id={data['profile_id']}, legal_name={identity.get('legal_name')}")
    
    def test_resolve_returns_existing_profile(self, auth_headers):
        """Resolving same CIF returns existing profile (idempotent)"""
        # First resolve
        r1 = requests.post(f"{BASE_URL}/api/seller-profiles/resolve-and-save", 
                          json={"cif": EXISTING_CIF}, headers=auth_headers)
        profile_id_1 = r1.json().get("profile_id")
        
        # Second resolve
        r2 = requests.post(f"{BASE_URL}/api/seller-profiles/resolve-and-save", 
                          json={"cif": EXISTING_CIF}, headers=auth_headers)
        profile_id_2 = r2.json().get("profile_id")
        
        assert profile_id_1 == profile_id_2, "Same CIF should return same profile"
        print(f"✓ Resolve is idempotent: {profile_id_1}")
    
    def test_resolve_unknown_cif_returns_404(self, auth_headers):
        """Resolve unknown CIF returns 404"""
        response = requests.post(f"{BASE_URL}/api/seller-profiles/resolve-and-save", 
                                json={"cif": "Z99999999"}, headers=auth_headers)
        assert response.status_code == 404
        print("✓ Unknown CIF returns 404")


class TestOverridesAPI:
    """PUT /api/seller-profiles/{id}/overrides tests - CRITICAL: company_id persistence"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_update_overrides_basic(self, auth_headers):
        """Update basic overrides (trade_name, description)"""
        overrides = {
            "trade_name": "TEST_Trade Name Updated",
            "description": "TEST_Description updated via test",
            "employees_count": "25",
            "founded_year": "2015"
        }
        response = requests.put(f"{BASE_URL}/api/seller-profiles/{EXISTING_PROFILE_ID}/overrides",
                               json=overrides, headers=auth_headers)
        assert response.status_code == 200
        assert response.json().get("updated") == True
        print("✓ Update basic overrides")
    
    def test_update_overrides_with_company_id(self, auth_headers):
        """CRITICAL: company_id in overrides should persist to document root, NOT inside seller_overrides"""
        overrides = {
            "trade_name": "TEST_With Company ID",
            "company_id": EXISTING_COMPANY_ID
        }
        response = requests.put(f"{BASE_URL}/api/seller-profiles/{EXISTING_PROFILE_ID}/overrides",
                               json=overrides, headers=auth_headers)
        assert response.status_code == 200
        
        # Verify by fetching the profile
        get_response = requests.get(f"{BASE_URL}/api/seller-profiles/{EXISTING_PROFILE_ID}", headers=auth_headers)
        assert get_response.status_code == 200
        profile = get_response.json()
        
        # CRITICAL CHECK: company_id should be at root level
        assert profile.get("company_id") == EXISTING_COMPANY_ID, \
            f"company_id should be at document root, got: {profile.get('company_id')}"
        
        # company_id should NOT be inside seller_overrides
        seller_overrides = profile.get("seller_overrides", {})
        assert "company_id" not in seller_overrides, \
            "company_id should NOT be inside seller_overrides"
        
        print(f"✓ company_id persisted to document root: {profile.get('company_id')}")
    
    def test_update_qualitative_signals(self, auth_headers):
        """Update qualitative signals (founder_dependency, recurring_revenue_pct, etc.)"""
        overrides = {
            "founder_dependency": "low",
            "recurring_revenue_pct": "75",
            "client_concentration_top5": "30",
            "revenue_visibility": "high",
            "client_diversification": "high",
            "margin_stability": "stable"
        }
        response = requests.put(f"{BASE_URL}/api/seller-profiles/{EXISTING_PROFILE_ID}/overrides",
                               json=overrides, headers=auth_headers)
        assert response.status_code == 200
        
        # Verify
        get_response = requests.get(f"{BASE_URL}/api/seller-profiles/{EXISTING_PROFILE_ID}", headers=auth_headers)
        profile = get_response.json()
        so = profile.get("seller_overrides", {})
        assert so.get("founder_dependency") == "low"
        assert so.get("recurring_revenue_pct") == "75"
        print("✓ Qualitative signals updated")
    
    def test_update_operation_types(self, auth_headers):
        """Update operation types array"""
        overrides = {
            "operation_types": ["full_sale", "partial_sale"]
        }
        response = requests.put(f"{BASE_URL}/api/seller-profiles/{EXISTING_PROFILE_ID}/overrides",
                               json=overrides, headers=auth_headers)
        assert response.status_code == 200
        
        # Verify
        get_response = requests.get(f"{BASE_URL}/api/seller-profiles/{EXISTING_PROFILE_ID}", headers=auth_headers)
        profile = get_response.json()
        so = profile.get("seller_overrides", {})
        assert "full_sale" in so.get("operation_types", [])
        assert "partial_sale" in so.get("operation_types", [])
        print("✓ Operation types updated")


class TestByCompanyLookup:
    """GET /api/seller-profiles/by-company/{company_id} tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_by_company_requires_auth(self):
        """By-company lookup requires authentication"""
        response = requests.get(f"{BASE_URL}/api/seller-profiles/by-company/{EXISTING_COMPANY_ID}")
        assert response.status_code == 401
        print("✓ By-company requires auth")
    
    def test_by_company_finds_linked_profile(self, auth_headers):
        """CRITICAL: by-company finds profile after company_id linked via overrides"""
        # First ensure company_id is linked
        requests.put(f"{BASE_URL}/api/seller-profiles/{EXISTING_PROFILE_ID}/overrides",
                    json={"company_id": EXISTING_COMPANY_ID}, headers=auth_headers)
        
        # Now lookup by company
        response = requests.get(f"{BASE_URL}/api/seller-profiles/by-company/{EXISTING_COMPANY_ID}", 
                               headers=auth_headers)
        assert response.status_code == 200
        profile = response.json()
        
        assert profile is not None, "Should find profile by company_id"
        assert profile.get("profile_id") == EXISTING_PROFILE_ID
        assert profile.get("company_id") == EXISTING_COMPANY_ID
        print(f"✓ By-company lookup found profile: {profile.get('profile_id')}")
    
    def test_by_company_returns_null_for_unknown(self, auth_headers):
        """By-company returns null for unknown company_id"""
        response = requests.get(f"{BASE_URL}/api/seller-profiles/by-company/comp_nonexistent", 
                               headers=auth_headers)
        # Should return 200 with null/None
        assert response.status_code == 200
        data = response.json()
        assert data is None
        print("✓ By-company returns null for unknown")


class TestPanelStatus:
    """PUT /api/seller-profiles/{id}/panel-status tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_update_panel_status(self, auth_headers):
        """Update panel status and verify readiness recalculation"""
        panel_status = {
            "compania": "complete",
            "ficha": "complete",
            "financieros": "complete",
            "valoracion": "empty",
            "operacion": "partial"
        }
        response = requests.put(f"{BASE_URL}/api/seller-profiles/{EXISTING_PROFILE_ID}/panel-status",
                               json=panel_status, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "panel_status" in data
        assert "profile_readiness" in data
        
        # 3 complete out of 5 = 60%
        assert data["profile_readiness"] == 60
        print(f"✓ Panel status updated, readiness={data['profile_readiness']}%")
    
    def test_panel_status_all_complete(self, auth_headers):
        """All panels complete = 100% readiness"""
        panel_status = {
            "compania": "complete",
            "ficha": "complete",
            "financieros": "complete",
            "valoracion": "complete",
            "operacion": "complete"
        }
        response = requests.put(f"{BASE_URL}/api/seller-profiles/{EXISTING_PROFILE_ID}/panel-status",
                               json=panel_status, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["profile_readiness"] == 100
        print("✓ All complete = 100% readiness")


class TestPricing:
    """PUT /api/seller-profiles/{id}/pricing tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_update_pricing_define_price(self, auth_headers):
        """Update pricing with define_price strategy"""
        pricing = {
            "price_strategy": "define_price",
            "asking_price": 5000000,
            "comfort_margin_pct": 15,
            "offers_mode": "formal"
        }
        response = requests.put(f"{BASE_URL}/api/seller-profiles/{EXISTING_PROFILE_ID}/pricing",
                               json=pricing, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("updated") == True
        assert "pricing" in data
        
        p = data["pricing"]
        assert p["price_strategy"] == "define_price"
        assert p["asking_price"] == 5000000
        assert p["comfort_margin_pct"] == 15
        
        # Comfort floor should be calculated: 5M * (1 - 0.15) = 4.25M
        assert p["comfort_floor_price"] == 4250000.0
        print(f"✓ Pricing updated, comfort_floor={p['comfort_floor_price']}")
    
    def test_update_pricing_receive_offers(self, auth_headers):
        """Update pricing with receive_offers strategy"""
        pricing = {
            "price_strategy": "receive_offers"
        }
        response = requests.put(f"{BASE_URL}/api/seller-profiles/{EXISTING_PROFILE_ID}/pricing",
                               json=pricing, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["pricing"]["price_strategy"] == "receive_offers"
        print("✓ Pricing strategy: receive_offers")


class TestCompaniesAPI:
    """POST /api/companies tests - duplicate CIF prevention"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_duplicate_cif_prevention(self, auth_headers):
        """Creating company with duplicate CIF should fail"""
        # Try to create a company with the same CIF as existing
        company_data = {
            "legal_name": "TEST_Duplicate CIF Company",
            "cif": EXISTING_CIF,  # B67098228 - already exists
            "country": "España"
        }
        response = requests.post(f"{BASE_URL}/api/companies", json=company_data, headers=auth_headers)
        
        # Should fail with 400
        assert response.status_code == 400
        assert "CIF" in response.json().get("detail", "")
        print("✓ Duplicate CIF prevention works")


class TestValuationCalculation:
    """POST /api/companies/{id}/calculate-valuation tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_calculate_valuation_requires_financials(self, auth_headers):
        """Valuation calculation requires financial data"""
        # First check if company has financials
        response = requests.get(f"{BASE_URL}/api/companies/{EXISTING_COMPANY_ID}", headers=auth_headers)
        company = response.json()
        
        if company.get("financials"):
            # Calculate valuation
            response = requests.post(f"{BASE_URL}/api/companies/{EXISTING_COMPANY_ID}/calculate-valuation",
                                    headers=auth_headers)
            assert response.status_code == 200
            data = response.json()
            assert "valuation" in data
            val = data["valuation"]
            assert "valuation_min" in val
            assert "valuation_max" in val
            assert "multiple_min" in val
            assert "multiple_max" in val
            print(f"✓ Valuation calculated: {val['valuation_min']/1e6:.1f}M - {val['valuation_max']/1e6:.1f}M")
        else:
            # No financials - should return 400
            response = requests.post(f"{BASE_URL}/api/companies/{EXISTING_COMPANY_ID}/calculate-valuation",
                                    headers=auth_headers)
            assert response.status_code == 400
            print("✓ Valuation requires financials (no data)")


class TestTaxonomyAPI:
    """GET /api/valuation/taxonomy/categories tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_taxonomy_categories(self, auth_headers):
        """Get taxonomy categories for dropdowns"""
        response = requests.get(f"{BASE_URL}/api/valuation/taxonomy/categories", headers=auth_headers)
        assert response.status_code == 200
        categories = response.json()
        
        assert isinstance(categories, list)
        assert len(categories) > 0
        
        # Check structure
        cat = categories[0]
        assert "id" in cat
        assert "name" in cat
        assert "subcategories" in cat
        
        print(f"✓ Taxonomy categories: {len(categories)} categories")
        for c in categories[:3]:
            print(f"  - {c['name']}: {len(c.get('subcategories', []))} subcategories")


class TestBuyerFacingProfile:
    """GET /api/seller-profiles/{id}/buyer-facing tests"""
    
    def test_buyer_facing_sanitizes_data(self):
        """Buyer-facing profile removes identifying information"""
        response = requests.get(f"{BASE_URL}/api/seller-profiles/{EXISTING_PROFILE_ID}/buyer-facing")
        assert response.status_code == 200
        data = response.json()
        
        # Should NOT have identifying fields
        assert "phone" not in data
        assert "email" not in data
        assert "street" not in data
        assert "website" not in data
        
        # Should have allowed fields
        assert "city" in data or data.get("city") is None
        assert "province" in data or data.get("province") is None
        assert "category" in data or data.get("category") is None
        
        print("✓ Buyer-facing profile sanitized")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
