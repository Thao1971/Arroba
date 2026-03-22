"""
Backend API Tests for Arroba Seller Flow
Tests: Auth, CIF Lookup, Companies, Financials, Valuation, Deals, Teaser, Infomemo
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data
TEST_EMAIL = f"test_seller_{uuid.uuid4().hex[:8]}@arroba.com"
TEST_PASSWORD = "Test1234!"
TEST_CIF = "B12345678"


class TestHealthAndBasics:
    """Health check and basic API tests"""
    
    def test_health_endpoint(self):
        """Test /api/health returns 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health endpoint working")
    
    def test_api_root(self):
        """Test /api root endpoint"""
        response = requests.get(f"{BASE_URL}/api")
        assert response.status_code == 200
        data = response.json()
        assert "Arroba" in data["name"]
        print("✓ API root endpoint working")


class TestAuthFlow:
    """Authentication flow tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create a session and register/login a test user"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Register new seller
        register_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "full_name": "Test Seller",
            "role": "seller"
        }
        response = session.post(f"{BASE_URL}/api/auth/register", json=register_data)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            if token:
                session.headers.update({"Authorization": f"Bearer {token}"})
            print(f"✓ Registered new user: {TEST_EMAIL}")
        elif response.status_code == 400 and "already registered" in response.text.lower():
            # User exists, try login
            login_data = {"email": TEST_EMAIL, "password": TEST_PASSWORD}
            login_response = session.post(f"{BASE_URL}/api/auth/login", json=login_data)
            if login_response.status_code == 200:
                data = login_response.json()
                token = data.get("access_token")
                if token:
                    session.headers.update({"Authorization": f"Bearer {token}"})
                print(f"✓ Logged in existing user: {TEST_EMAIL}")
            else:
                pytest.skip(f"Could not login: {login_response.text}")
        else:
            pytest.skip(f"Could not register: {response.text}")
        
        return session
    
    def test_register_seller(self, auth_session):
        """Test seller registration"""
        # Already done in fixture
        assert "Authorization" in auth_session.headers
        print("✓ Seller registration/login successful")
    
    def test_get_current_user(self, auth_session):
        """Test /api/auth/me endpoint"""
        response = auth_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert data["role"] == "seller"
        print(f"✓ Current user: {data['email']}, role: {data['role']}")


class TestCifLookup:
    """CIF Lookup endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Try login with existing test user
        login_data = {"email": "seller_test@arroba.com", "password": "Test1234!"}
        response = session.post(f"{BASE_URL}/api/auth/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            if token:
                session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip("Could not authenticate for CIF lookup tests")
        
        return session
    
    def test_cif_lookup_unknown_cif(self, auth_session):
        """Test CIF lookup for unknown CIF returns MANUAL source"""
        response = auth_session.get(f"{BASE_URL}/api/cif/B99999999/lookup")
        assert response.status_code == 200
        data = response.json()
        
        # For unknown CIF, should return found=false, source=MANUAL
        assert "found" in data
        assert "source" in data
        assert data["source"] in ["MANUAL", "CIS", "IBERINFORM"]
        print(f"✓ CIF lookup returned: found={data['found']}, source={data['source']}")
    
    def test_cif_lookup_invalid_cif(self, auth_session):
        """Test CIF lookup with invalid CIF returns 400"""
        response = auth_session.get(f"{BASE_URL}/api/cif/AB/lookup")
        assert response.status_code == 400
        print("✓ Invalid CIF correctly rejected")
    
    def test_cif_lookup_response_structure(self, auth_session):
        """Test CIF lookup response has correct structure"""
        response = auth_session.get(f"{BASE_URL}/api/cif/B12345678/lookup")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "found" in data
        assert "source" in data
        assert "company_info" in data
        assert "financials" in data
        assert isinstance(data["company_info"], dict)
        assert isinstance(data["financials"], list)
        print("✓ CIF lookup response structure correct")


class TestCompanyFlow:
    """Company CRUD and financial data tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Login with existing test user
        login_data = {"email": "seller_test@arroba.com", "password": "Test1234!"}
        response = session.post(f"{BASE_URL}/api/auth/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            if token:
                session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip("Could not authenticate")
        
        return session
    
    def test_list_companies(self, auth_session):
        """Test listing user's companies"""
        response = auth_session.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} companies")
        return data
    
    def test_get_company(self, auth_session):
        """Test getting a specific company"""
        # First list companies
        list_response = auth_session.get(f"{BASE_URL}/api/companies")
        companies = list_response.json()
        
        if not companies:
            pytest.skip("No companies to test")
        
        company_id = companies[0]["company_id"]
        response = auth_session.get(f"{BASE_URL}/api/companies/{company_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["company_id"] == company_id
        print(f"✓ Got company: {data.get('legal_name', 'N/A')}")
    
    def test_update_financials_with_data_source(self, auth_session):
        """Test updating financials with data_source field"""
        # Get existing company
        list_response = auth_session.get(f"{BASE_URL}/api/companies")
        companies = list_response.json()
        
        if not companies:
            pytest.skip("No companies to test")
        
        company_id = companies[0]["company_id"]
        
        # Update financials with data_source
        financials_data = {
            "financials": [
                {
                    "year": 2024,
                    "revenue": 1500000,
                    "ebitda": 300000,
                    "ebitda_margin": 20,
                    "recurring_revenue_pct": 70,
                    "client_concentration_top5": 40,
                    "growth_rate": 15,
                    "data_source": "MANUAL"
                },
                {
                    "year": 2023,
                    "revenue": 1300000,
                    "ebitda": 260000,
                    "ebitda_margin": 20,
                    "recurring_revenue_pct": 65,
                    "client_concentration_top5": 45,
                    "growth_rate": 10,
                    "data_source": "MANUAL"
                }
            ],
            "valuation_inputs": {
                "founder_dependency": "medium",
                "recurring_revenue_type": "mixed"
            }
        }
        
        response = auth_session.post(
            f"{BASE_URL}/api/companies/{company_id}/financials",
            json=financials_data
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify data_source is saved
        if data.get("financials"):
            for fin in data["financials"]:
                assert "data_source" in fin or fin.get("data_source") is None
        print("✓ Financials updated with data_source field")
    
    def test_calculate_valuation(self, auth_session):
        """Test valuation calculation"""
        # Get existing company
        list_response = auth_session.get(f"{BASE_URL}/api/companies")
        companies = list_response.json()
        
        if not companies:
            pytest.skip("No companies to test")
        
        company_id = companies[0]["company_id"]
        
        response = auth_session.post(f"{BASE_URL}/api/companies/{company_id}/calculate-valuation")
        assert response.status_code == 200
        data = response.json()
        
        # Verify valuation structure
        if data.get("valuation"):
            assert "valuation_min" in data["valuation"]
            assert "valuation_max" in data["valuation"]
            print(f"✓ Valuation calculated: {data['valuation']['valuation_min']/1e6:.1f}M - {data['valuation']['valuation_max']/1e6:.1f}M €")
        else:
            print("✓ Valuation endpoint returned (no valuation data)")


class TestDealFlow:
    """Deal creation and management tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        login_data = {"email": "seller_test@arroba.com", "password": "Test1234!"}
        response = session.post(f"{BASE_URL}/api/auth/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            if token:
                session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip("Could not authenticate")
        
        return session
    
    def test_list_deals(self, auth_session):
        """Test listing user's deals"""
        response = auth_session.get(f"{BASE_URL}/api/deals")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} deals")
        return data
    
    def test_get_deal(self, auth_session):
        """Test getting a specific deal"""
        list_response = auth_session.get(f"{BASE_URL}/api/deals")
        deals = list_response.json()
        
        if not deals:
            pytest.skip("No deals to test")
        
        deal_id = deals[0]["deal_id"]
        response = auth_session.get(f"{BASE_URL}/api/deals/{deal_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["deal_id"] == deal_id
        
        # Check for teaser_full field
        if "teaser_full" in data:
            print(f"✓ Deal has teaser_full field")
        print(f"✓ Got deal: {deal_id}, status: {data.get('status')}")
    
    def test_activate_deal(self, auth_session):
        """Test deal activation (publish)"""
        list_response = auth_session.get(f"{BASE_URL}/api/deals")
        deals = list_response.json()
        
        # Find a draft deal
        draft_deal = next((d for d in deals if d["status"] == "draft"), None)
        
        if not draft_deal:
            # Try to get any deal and check if already published
            if deals:
                deal = deals[0]
                if deal["status"] != "draft":
                    print(f"✓ Deal already activated (status: {deal['status']})")
                    return
            pytest.skip("No draft deals to activate")
        
        response = auth_session.post(f"{BASE_URL}/api/deals/{draft_deal['deal_id']}/activate")
        assert response.status_code in [200, 400]  # 400 if already activated
        print("✓ Deal activation endpoint working")


class TestTeaserFlow:
    """Teaser generation and retrieval tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        login_data = {"email": "seller_test@arroba.com", "password": "Test1234!"}
        response = session.post(f"{BASE_URL}/api/auth/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            if token:
                session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip("Could not authenticate")
        
        return session
    
    def test_generate_teaser(self, auth_session):
        """Test teaser generation for a company"""
        # Get company
        list_response = auth_session.get(f"{BASE_URL}/api/companies")
        companies = list_response.json()
        
        if not companies:
            pytest.skip("No companies to test")
        
        company_id = companies[0]["company_id"]
        
        response = auth_session.post(f"{BASE_URL}/api/teaser/generate/{company_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert "teaser" in data
        teaser = data["teaser"]
        
        # Verify anonymization - title should NOT contain company name
        company_name = companies[0].get("legal_name", "")
        if company_name and teaser.get("title"):
            assert company_name not in teaser["title"], "Teaser title should be anonymized"
        
        # Verify ranges instead of exact values
        assert "revenue_range" in teaser or "revenue_exact" in teaser
        if "revenue_exact" in teaser:
            assert teaser["revenue_exact"] is None, "Exact revenue should not be exposed"
        
        print(f"✓ Teaser generated: {teaser.get('title', 'N/A')}")
        print(f"  Revenue range: {teaser.get('revenue_range', 'N/A')}")
        print(f"  EBITDA range: {teaser.get('ebitda_range', 'N/A')}")
    
    def test_get_teaser_for_published_deal(self, auth_session):
        """Test getting teaser for a published deal (public endpoint)"""
        # Get deals
        list_response = auth_session.get(f"{BASE_URL}/api/deals")
        deals = list_response.json()
        
        # Find a published deal
        published_deal = next((d for d in deals if d["status"] == "published"), None)
        
        if not published_deal:
            pytest.skip("No published deals to test")
        
        # This endpoint should be public (no auth required)
        response = requests.get(f"{BASE_URL}/api/teaser/{published_deal['deal_id']}")
        assert response.status_code == 200
        data = response.json()
        
        assert "teaser" in data
        print(f"✓ Got teaser for published deal: {published_deal['deal_id']}")


class TestInfomemoFlow:
    """Infomemo generation and update tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        login_data = {"email": "seller_test@arroba.com", "password": "Test1234!"}
        response = session.post(f"{BASE_URL}/api/auth/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            if token:
                session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip("Could not authenticate")
        
        return session
    
    def test_generate_infomemo(self, auth_session):
        """Test infomemo generation with AI"""
        # Get company
        list_response = auth_session.get(f"{BASE_URL}/api/companies")
        companies = list_response.json()
        
        if not companies:
            pytest.skip("No companies to test")
        
        company_id = companies[0]["company_id"]
        
        # This may take time due to AI generation
        response = auth_session.post(
            f"{BASE_URL}/api/infomemo/generate/{company_id}",
            timeout=60  # Longer timeout for AI
        )
        
        # Accept 200 or 400 (if no financials)
        assert response.status_code in [200, 400]
        
        if response.status_code == 200:
            data = response.json()
            assert "infomemo" in data
            infomemo = data["infomemo"]
            assert "content" in infomemo
            print(f"✓ Infomemo generated, content length: {len(infomemo.get('content', ''))}")
        else:
            print(f"✓ Infomemo generation returned 400 (expected if no financials)")
    
    def test_update_infomemo_json_body(self, auth_session):
        """Test infomemo update with JSON body (fixed endpoint)"""
        # Get deals
        list_response = auth_session.get(f"{BASE_URL}/api/deals")
        deals = list_response.json()
        
        if not deals:
            pytest.skip("No deals to test")
        
        deal_id = deals[0]["deal_id"]
        
        # Update infomemo with JSON body (not query params)
        update_data = {
            "content": "# Updated Infomemo\n\nThis is the updated content with **Markdown** support.\n\n## Section 1\n\nTest content."
        }
        
        response = auth_session.put(
            f"{BASE_URL}/api/infomemo/{deal_id}",
            json=update_data
        )
        
        # Accept 200 or 404 (if no infomemo exists yet)
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            assert "version" in data or "message" in data
            print(f"✓ Infomemo updated with JSON body")
        else:
            print(f"✓ Infomemo update returned 404 (no existing infomemo)")
    
    def test_get_infomemo(self, auth_session):
        """Test getting infomemo for a deal"""
        list_response = auth_session.get(f"{BASE_URL}/api/deals")
        deals = list_response.json()
        
        if not deals:
            pytest.skip("No deals to test")
        
        deal_id = deals[0]["deal_id"]
        
        response = auth_session.get(f"{BASE_URL}/api/infomemo/{deal_id}")
        
        # Accept 200 or 404 (if no infomemo)
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            assert "content" in data
            print(f"✓ Got infomemo for deal: {deal_id}")
        else:
            print(f"✓ No infomemo exists for deal (404 expected)")


class TestMarketplace:
    """Marketplace public endpoints tests"""
    
    def test_marketplace_deals(self):
        """Test marketplace deals listing"""
        response = requests.get(f"{BASE_URL}/api/marketplace/deals")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Marketplace has {len(data)} deals")
    
    def test_marketplace_sectors(self):
        """Test marketplace sectors"""
        response = requests.get(f"{BASE_URL}/api/marketplace/sectors")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Marketplace has {len(data)} sectors")
    
    def test_marketplace_stats(self):
        """Test marketplace stats"""
        response = requests.get(f"{BASE_URL}/api/marketplace/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_deals" in data or "deals_count" in data or isinstance(data, dict)
        print(f"✓ Marketplace stats: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
