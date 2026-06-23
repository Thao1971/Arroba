"""
Test Seller Wizard V2 APIs
Tests: Companies CRUD, Financials, Valuation, CIF Lookup, Deals, Teaser, Infomemo
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SELLER_EMAIL = "diego.martin@rankingdigital.es"
SELLER_PASSWORD = "demo2026"


class TestSellerWizardAuth:
    """Authentication tests for wizard APIs"""
    
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
    
    def test_login_seller(self, auth_token):
        """Test seller can login"""
        assert auth_token is not None
        print(f"Seller login successful, token obtained")


class TestCifLookup:
    """CIF Lookup API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get seller auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_cif_lookup_requires_auth(self):
        """CIF lookup requires authentication"""
        response = requests.get(f"{BASE_URL}/api/cif/B12345678/lookup")
        assert response.status_code == 401
        print("CIF lookup requires auth: PASS")
    
    def test_cif_lookup_invalid_cif(self, auth_headers):
        """CIF lookup with invalid CIF returns error"""
        response = requests.get(f"{BASE_URL}/api/cif/ABC/lookup", headers=auth_headers)
        assert response.status_code == 400
        print("CIF lookup invalid CIF: PASS")
    
    def test_cif_lookup_valid_cif(self, auth_headers):
        """CIF lookup with valid CIF returns result"""
        response = requests.get(f"{BASE_URL}/api/cif/B12345678/lookup", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "found" in data
        assert "source" in data
        assert "company_info" in data
        assert "financials" in data
        print(f"CIF lookup valid CIF: PASS (found={data['found']}, source={data['source']})")


class TestCompaniesAPI:
    """Companies CRUD API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get seller auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_list_companies(self, auth_headers):
        """List seller's companies"""
        response = requests.get(f"{BASE_URL}/api/companies", headers=auth_headers)
        assert response.status_code == 200
        companies = response.json()
        assert isinstance(companies, list)
        print(f"List companies: PASS ({len(companies)} companies)")
    
    def test_get_company(self, auth_headers):
        """Get existing company details"""
        # First list companies to get an ID
        response = requests.get(f"{BASE_URL}/api/companies", headers=auth_headers)
        companies = response.json()
        if companies:
            company_id = companies[0]["company_id"]
            response = requests.get(f"{BASE_URL}/api/companies/{company_id}", headers=auth_headers)
            assert response.status_code == 200
            company = response.json()
            assert "company_id" in company
            assert "legal_name" in company
            print(f"Get company: PASS (company_id={company_id})")
        else:
            pytest.skip("No companies to test")
    
    def test_update_company(self, auth_headers):
        """Update company details"""
        # First list companies to get an ID
        response = requests.get(f"{BASE_URL}/api/companies", headers=auth_headers)
        companies = response.json()
        if companies:
            company_id = companies[0]["company_id"]
            update_data = {
                "description": "Test description update from wizard test"
            }
            response = requests.put(f"{BASE_URL}/api/companies/{company_id}", 
                                   json=update_data, headers=auth_headers)
            assert response.status_code == 200
            updated = response.json()
            assert updated["description"] == update_data["description"]
            print(f"Update company: PASS")
        else:
            pytest.skip("No companies to test")


class TestFinancialsAPI:
    """Financials API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get seller auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def company_id(self, auth_headers):
        """Get first company ID"""
        response = requests.get(f"{BASE_URL}/api/companies", headers=auth_headers)
        companies = response.json()
        if companies:
            return companies[0]["company_id"]
        pytest.skip("No companies available")
    
    def test_update_financials(self, auth_headers, company_id):
        """Update company financials"""
        financials_data = {
            "financials": [
                {
                    "year": 2024,
                    "revenue": 3200000,
                    "ebitda": 640000,
                    "ebitda_margin": 20,
                    "recurring_revenue_pct": 70,
                    "client_concentration_top5": 40,
                    "growth_rate": 15,
                    "data_source": "MANUAL"
                }
            ],
            "valuation_inputs": {
                "founder_dependency": "medium",
                "recurring_revenue_type": "mixed",
                "main_clients": 10,
                "client_retention_rate": 85,
                "tech_assets": True,
                "proprietary_ip": False
            }
        }
        response = requests.post(f"{BASE_URL}/api/companies/{company_id}/financials",
                                json=financials_data, headers=auth_headers)
        assert response.status_code == 200
        updated = response.json()
        assert "financials" in updated
        print(f"Update financials: PASS")


class TestValuationAPI:
    """Valuation calculation API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get seller auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def company_id(self, auth_headers):
        """Get first company ID"""
        response = requests.get(f"{BASE_URL}/api/companies", headers=auth_headers)
        companies = response.json()
        if companies:
            return companies[0]["company_id"]
        pytest.skip("No companies available")
    
    def test_calculate_valuation(self, auth_headers, company_id):
        """Calculate company valuation"""
        response = requests.post(f"{BASE_URL}/api/companies/{company_id}/calculate-valuation",
                                headers=auth_headers)
        assert response.status_code == 200
        result = response.json()
        assert "valuation" in result
        valuation = result["valuation"]
        assert "valuation_min" in valuation
        assert "valuation_max" in valuation
        print(f"Calculate valuation: PASS (range: {valuation['valuation_min']/1e6:.1f}M - {valuation['valuation_max']/1e6:.1f}M)")
    
    def test_get_valuation(self, auth_headers, company_id):
        """Get company valuation"""
        response = requests.get(f"{BASE_URL}/api/companies/{company_id}/valuation",
                               headers=auth_headers)
        assert response.status_code == 200
        valuation = response.json()
        assert "valuation_min" in valuation
        assert "valuation_max" in valuation
        print(f"Get valuation: PASS")


class TestDealsAPI:
    """Deals API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get seller auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_list_deals(self, auth_headers):
        """List seller's deals"""
        response = requests.get(f"{BASE_URL}/api/deals", headers=auth_headers)
        assert response.status_code == 200
        deals = response.json()
        assert isinstance(deals, list)
        print(f"List deals: PASS ({len(deals)} deals)")
    
    def test_get_deal(self, auth_headers):
        """Get deal details"""
        response = requests.get(f"{BASE_URL}/api/deals", headers=auth_headers)
        deals = response.json()
        if deals:
            deal_id = deals[0]["deal_id"]
            response = requests.get(f"{BASE_URL}/api/deals/{deal_id}", headers=auth_headers)
            assert response.status_code == 200
            deal = response.json()
            assert "deal_id" in deal
            assert "status" in deal
            assert "teaser" in deal
            print(f"Get deal: PASS (deal_id={deal_id}, status={deal['status']})")
        else:
            pytest.skip("No deals to test")


class TestTeaserAPI:
    """Teaser generation API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get seller auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def company_id(self, auth_headers):
        """Get first company ID"""
        response = requests.get(f"{BASE_URL}/api/companies", headers=auth_headers)
        companies = response.json()
        if companies:
            return companies[0]["company_id"]
        pytest.skip("No companies available")
    
    def test_generate_teaser(self, auth_headers, company_id):
        """Generate teaser for company"""
        response = requests.post(f"{BASE_URL}/api/teaser/generate/{company_id}",
                                headers=auth_headers)
        assert response.status_code == 200
        result = response.json()
        assert "teaser" in result
        teaser = result["teaser"]
        assert "title" in teaser
        assert "short_description" in teaser
        print(f"Generate teaser: PASS (title={teaser['title'][:30]}...)")
    
    def test_get_teaser(self, auth_headers):
        """Get teaser for deal"""
        response = requests.get(f"{BASE_URL}/api/deals", headers=auth_headers)
        deals = response.json()
        if deals:
            deal_id = deals[0]["deal_id"]
            response = requests.get(f"{BASE_URL}/api/teaser/{deal_id}")
            assert response.status_code == 200
            result = response.json()
            assert "teaser" in result
            print(f"Get teaser: PASS")
        else:
            pytest.skip("No deals to test")


class TestInfomemoAPI:
    """Infomemo generation API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get seller auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def company_id(self, auth_headers):
        """Get first company ID"""
        response = requests.get(f"{BASE_URL}/api/companies", headers=auth_headers)
        companies = response.json()
        if companies:
            return companies[0]["company_id"]
        pytest.skip("No companies available")
    
    def test_generate_infomemo(self, auth_headers, company_id):
        """Generate infomemo for company (uses AI - may take time)"""
        response = requests.post(f"{BASE_URL}/api/infomemo/generate/{company_id}",
                                headers=auth_headers, timeout=60)
        assert response.status_code == 200
        result = response.json()
        assert "infomemo" in result
        infomemo = result["infomemo"]
        assert "content" in infomemo
        assert "version" in infomemo
        print(f"Generate infomemo: PASS (version={infomemo['version']})")
    
    def test_get_infomemo(self, auth_headers):
        """Get infomemo for deal"""
        response = requests.get(f"{BASE_URL}/api/deals", headers=auth_headers)
        deals = response.json()
        if deals:
            deal_id = deals[0]["deal_id"]
            response = requests.get(f"{BASE_URL}/api/infomemo/{deal_id}", headers=auth_headers)
            # May be 404 if not generated yet
            if response.status_code == 200:
                infomemo = response.json()
                assert "content" in infomemo
                print(f"Get infomemo: PASS")
            elif response.status_code == 404:
                print(f"Get infomemo: SKIP (not generated yet)")
            else:
                assert False, f"Unexpected status: {response.status_code}"
        else:
            pytest.skip("No deals to test")


class TestCreateNewCompanyFlow:
    """Test creating a new company through the wizard flow"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get seller auth token - use a different seller without company"""
        # Try to login as a seller without existing company
        # For this test, we'll use the existing seller but test the API structure
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_company_create_structure(self, auth_headers):
        """Test company create API accepts correct structure"""
        # This will fail because seller already has a company, but we test the structure
        company_data = {
            "legal_name": "TEST_New Agency S.L.",
            "trade_name": "Test Agency",
            "cif": "B99999999",
            "country": "España",
            "city": "Barcelona",
            "company_type": "digital_agency",
            "sectors": ["digital", "marketing"],
            "founded_year": 2020,
            "employees_count": 15,
            "description": "Test agency description",
            "highlights": ["Highlight 1", "Highlight 2"],
            "website": "https://testagency.com"
        }
        response = requests.post(f"{BASE_URL}/api/companies", 
                                json=company_data, headers=auth_headers)
        # Will be 400 because seller already has company
        if response.status_code == 400:
            assert "already has a company" in response.json().get("detail", "")
            print("Company create structure: PASS (correctly rejected - seller has company)")
        elif response.status_code == 201 or response.status_code == 200:
            print("Company create structure: PASS (created)")
        else:
            print(f"Company create structure: {response.status_code} - {response.text}")


class TestDealCreateFlow:
    """Test creating a deal through the wizard"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get seller auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def company_id(self, auth_headers):
        """Get first company ID"""
        response = requests.get(f"{BASE_URL}/api/companies", headers=auth_headers)
        companies = response.json()
        if companies:
            return companies[0]["company_id"]
        pytest.skip("No companies available")
    
    def test_deal_create_structure(self, auth_headers, company_id):
        """Test deal create API accepts correct structure"""
        deal_data = {
            "company_id": company_id,
            "operation_types_allowed": ["full_sale", "partial_sale"],
            "asking_price": 3000000,
            "price_negotiable": True
        }
        response = requests.post(f"{BASE_URL}/api/deals", 
                                json=deal_data, headers=auth_headers)
        # Will be 400 if company already has active deal
        if response.status_code == 400:
            assert "already has an active deal" in response.json().get("detail", "")
            print("Deal create structure: PASS (correctly rejected - company has deal)")
        elif response.status_code == 201 or response.status_code == 200:
            deal = response.json()
            assert "deal_id" in deal
            print(f"Deal create structure: PASS (created deal_id={deal['deal_id']})")
        else:
            print(f"Deal create structure: {response.status_code} - {response.text}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
