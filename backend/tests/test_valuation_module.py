"""
Test suite for the Valuation Module
Tests: taxonomy endpoints, config, estimate, premium request, email, my-valuations, lead retrieval
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SELLER_EMAIL = "diego.martin@rankingdigital.es"
SELLER_PASSWORD = "demo2026"
BUYER_EMAIL = "carlos.ruiz@capitaliberica.es"
BUYER_PASSWORD = "demo2026"


class TestValuationPublicEndpoints:
    """Test public valuation endpoints (no auth required)"""
    
    def test_taxonomy_categories_returns_10_categories(self):
        """GET /api/valuation/taxonomy/categories returns 10 categories with subcategories"""
        response = requests.get(f"{BASE_URL}/api/valuation/taxonomy/categories")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) == 10, f"Expected 10 categories, got {len(data)}"
        
        # Verify structure of each category
        for cat in data:
            assert "id" in cat, "Category should have 'id'"
            assert "name" in cat, "Category should have 'name'"
            assert "subcategories" in cat, "Category should have 'subcategories'"
            assert isinstance(cat["subcategories"], list), "Subcategories should be a list"
        
        # Verify expected category IDs
        expected_ids = [
            "estrategia_marca_diseno", "creatividad_produccion", "comunicacion_pr_reputacion",
            "experiencias_activacion", "influencer_creator", "medios_performance_programmatic",
            "digital_growth_commerce", "data_adtech_martech", "consultoria_transformacion",
            "soportes_media_owners"
        ]
        actual_ids = [cat["id"] for cat in data]
        for expected_id in expected_ids:
            assert expected_id in actual_ids, f"Missing category: {expected_id}"
        
        print(f"✓ Taxonomy categories: {len(data)} categories returned with subcategories")
    
    def test_taxonomy_subcategories_valid_category(self):
        """GET /api/valuation/taxonomy/subcategories/{category_id} returns correct subcategories"""
        category_id = "digital_growth_commerce"
        response = requests.get(f"{BASE_URL}/api/valuation/taxonomy/subcategories/{category_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have at least one subcategory"
        
        # Verify structure
        for sub in data:
            assert "id" in sub, "Subcategory should have 'id'"
            assert "name" in sub, "Subcategory should have 'name'"
        
        # Verify expected subcategories for digital_growth_commerce
        expected_subs = ["seo", "desarrollo_web", "ecommerce_marketplaces"]
        actual_ids = [sub["id"] for sub in data]
        for expected_sub in expected_subs:
            assert expected_sub in actual_ids, f"Missing subcategory: {expected_sub}"
        
        print(f"✓ Subcategories for {category_id}: {len(data)} subcategories returned")
    
    def test_taxonomy_subcategories_invalid_category(self):
        """GET /api/valuation/taxonomy/subcategories/{invalid_id} returns 404"""
        response = requests.get(f"{BASE_URL}/api/valuation/taxonomy/subcategories/invalid_category")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data, "Should have error detail"
        print("✓ Invalid category returns 404 with error detail")
    
    def test_public_config_returns_disclaimer_and_premium_info(self):
        """GET /api/valuation/config/public returns disclaimer, premium price, premium description"""
        response = requests.get(f"{BASE_URL}/api/valuation/config/public")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "disclaimer_short" in data, "Should have disclaimer_short"
        assert "disclaimer_full" in data, "Should have disclaimer_full"
        assert "premium_price" in data, "Should have premium_price"
        assert "premium_description" in data, "Should have premium_description"
        
        # Verify content
        assert len(data["disclaimer_short"]) > 10, "Disclaimer short should have content"
        assert len(data["disclaimer_full"]) > 50, "Disclaimer full should have content"
        assert data["premium_price"] == "1.950", f"Expected premium price '1.950', got {data['premium_price']}"
        
        print(f"✓ Public config: disclaimer_short, disclaimer_full, premium_price={data['premium_price']}, premium_description")


class TestValuationAuthenticatedEndpoints:
    """Test authenticated valuation endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        data = login_response.json()
        self.token = data.get("access_token")
        assert self.token, "No access_token in login response"
        
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.user_name = data.get("user", {}).get("name", "Test User")
        self.user_email = data.get("user", {}).get("email", SELLER_EMAIL)
    
    def test_estimate_requires_auth(self):
        """POST /api/valuation/estimate requires authentication"""
        response = requests.post(f"{BASE_URL}/api/valuation/estimate", json={
            "name": "Test",
            "job_title": "CEO",
            "company_name": "Test Co",
            "revenue": 1000000,
            "ebitda": 200000,
            "category_id": "digital_growth_commerce",
            "sale_intent": "si_12_meses",
            "legal_confirm_accuracy": True
        })
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Estimate endpoint requires authentication")
    
    def test_estimate_requires_legal_confirm(self):
        """POST /api/valuation/estimate requires legal_confirm_accuracy=True"""
        response = requests.post(
            f"{BASE_URL}/api/valuation/estimate",
            headers=self.headers,
            json={
                "name": "Test User",
                "job_title": "CEO",
                "company_name": "Test Agency",
                "revenue": 1000000,
                "ebitda": 200000,
                "category_id": "digital_growth_commerce",
                "sale_intent": "si_12_meses",
                "legal_confirm_accuracy": False  # Should fail
            }
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data, "Should have error detail"
        print("✓ Estimate requires legal_confirm_accuracy=True")
    
    def test_estimate_creates_valuation_lead(self):
        """POST /api/valuation/estimate creates valuation lead with full result"""
        payload = {
            "name": "TEST_Diego Martin",
            "job_title": "CEO",
            "company_name": "TEST_Agencia Digital",
            "revenue": 3000000,
            "ebitda": 600000,
            "growth_12m_pct": 15,
            "employee_count": 25,
            "recurring_revenue_pct": 60,
            "category_id": "digital_growth_commerce",
            "subcategory_id": "seo",
            "sale_intent": "si_12_meses",
            "legal_confirm_accuracy": True,
            "legal_accept_communications": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/valuation/estimate",
            headers=self.headers,
            json=payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify lead_id
        assert "lead_id" in data, "Should have lead_id"
        assert data["lead_id"].startswith("vlead_"), f"lead_id should start with 'vlead_', got {data['lead_id']}"
        
        # Verify valuation range
        assert "valuation_low" in data, "Should have valuation_low"
        assert "valuation_mid" in data, "Should have valuation_mid"
        assert "valuation_high" in data, "Should have valuation_high"
        assert data["valuation_low"] < data["valuation_mid"] < data["valuation_high"], "Valuation range should be ordered"
        
        # Verify confidence level
        assert "confidence_level" in data, "Should have confidence_level"
        assert data["confidence_level"] in ["alta", "media", "baja"], f"Invalid confidence: {data['confidence_level']}"
        
        # Verify quality score and factor
        assert "quality_score" in data, "Should have quality_score"
        assert "quality_factor" in data, "Should have quality_factor"
        assert 0 <= data["quality_score"] <= 100, f"Quality score should be 0-100, got {data['quality_score']}"
        assert 0.7 <= data["quality_factor"] <= 1.3, f"Quality factor should be 0.7-1.3, got {data['quality_factor']}"
        
        # Verify drivers
        assert "drivers" in data, "Should have drivers"
        assert isinstance(data["drivers"], list), "Drivers should be a list"
        assert len(data["drivers"]) >= 3, f"Should have at least 3 drivers, got {len(data['drivers'])}"
        for driver in data["drivers"]:
            assert "factor" in driver, "Driver should have 'factor'"
            assert "impact" in driver, "Driver should have 'impact'"
            assert "description" in driver, "Driver should have 'description'"
            assert driver["impact"] in ["positivo", "neutral", "negativo"], f"Invalid impact: {driver['impact']}"
        
        # Verify multiples
        assert "multiple_min" in data, "Should have multiple_min"
        assert "multiple_mid" in data, "Should have multiple_mid"
        assert "multiple_max" in data, "Should have multiple_max"
        assert "multiple_source" in data, "Should have multiple_source"
        
        # Verify category info
        assert "category_name" in data, "Should have category_name"
        
        # Verify disclaimer
        assert "disclaimer" in data, "Should have disclaimer"
        
        # Store lead_id for subsequent tests
        self.__class__.created_lead_id = data["lead_id"]
        
        print(f"✓ Estimate created: lead_id={data['lead_id']}, range={data['valuation_low']/1e6:.1f}M-{data['valuation_high']/1e6:.1f}M, confidence={data['confidence_level']}")
        return data["lead_id"]
    
    def test_my_valuations_returns_user_valuations(self):
        """GET /api/valuation/my-valuations returns user's valuations"""
        response = requests.get(
            f"{BASE_URL}/api/valuation/my-valuations",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Should have at least one valuation (from previous test)
        if len(data) > 0:
            lead = data[0]
            assert "lead_id" in lead, "Lead should have lead_id"
            assert "company_name" in lead, "Lead should have company_name"
            assert "valuation_mid" in lead, "Lead should have valuation_mid"
            assert "created_at" in lead, "Lead should have created_at"
        
        print(f"✓ My valuations: {len(data)} valuations returned")
    
    def test_get_lead_by_id(self):
        """GET /api/valuation/lead/{lead_id} returns specific lead"""
        # First create a lead
        payload = {
            "name": "TEST_Lead Retrieval",
            "job_title": "Director",
            "company_name": "TEST_Retrieval Agency",
            "revenue": 2000000,
            "ebitda": 400000,
            "category_id": "creatividad_produccion",
            "sale_intent": "no_corto_plazo",
            "legal_confirm_accuracy": True
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/valuation/estimate",
            headers=self.headers,
            json=payload
        )
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        lead_id = create_response.json()["lead_id"]
        
        # Now retrieve it
        response = requests.get(
            f"{BASE_URL}/api/valuation/lead/{lead_id}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["lead_id"] == lead_id, "Lead ID should match"
        assert data["company_name"] == "TEST_Retrieval Agency", "Company name should match"
        
        print(f"✓ Get lead by ID: {lead_id} retrieved successfully")
    
    def test_get_lead_not_found(self):
        """GET /api/valuation/lead/{invalid_id} returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/valuation/lead/vlead_invalid123",
            headers=self.headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid lead ID returns 404")
    
    def test_premium_request_creates_request(self):
        """POST /api/valuation/premium-request creates premium request"""
        # First create a lead
        payload = {
            "name": "TEST_Premium Request",
            "job_title": "Founder",
            "company_name": "TEST_Premium Agency",
            "revenue": 5000000,
            "ebitda": 1000000,
            "category_id": "data_adtech_martech",
            "sale_intent": "si_12_24_meses",
            "legal_confirm_accuracy": True
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/valuation/estimate",
            headers=self.headers,
            json=payload
        )
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        lead_id = create_response.json()["lead_id"]
        
        # Request premium valuation
        response = requests.post(
            f"{BASE_URL}/api/valuation/premium-request",
            headers=self.headers,
            json={
                "lead_id": lead_id,
                "contact_phone": "+34 612 345 678",
                "additional_notes": "Interested in detailed valuation"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "request_id" in data, "Should have request_id"
        assert data["request_id"].startswith("vprem_"), f"request_id should start with 'vprem_', got {data['request_id']}"
        assert data["status"] == "pending", f"Status should be 'pending', got {data['status']}"
        assert "message" in data, "Should have message"
        
        print(f"✓ Premium request created: {data['request_id']}")
    
    def test_premium_request_invalid_lead(self):
        """POST /api/valuation/premium-request with invalid lead returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/valuation/premium-request",
            headers=self.headers,
            json={
                "lead_id": "vlead_invalid123"
            }
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Premium request with invalid lead returns 404")
    
    def test_send_result_email(self):
        """POST /api/valuation/send-result-email marks email as sent"""
        # First create a lead
        payload = {
            "name": "TEST_Email Send",
            "job_title": "Manager",
            "company_name": "TEST_Email Agency",
            "revenue": 1500000,
            "ebitda": 300000,
            "category_id": "comunicacion_pr_reputacion",
            "sale_intent": "solo_orientacion",
            "legal_confirm_accuracy": True
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/valuation/estimate",
            headers=self.headers,
            json=payload
        )
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        lead_id = create_response.json()["lead_id"]
        
        # Send result email
        response = requests.post(
            f"{BASE_URL}/api/valuation/send-result-email",
            headers=self.headers,
            json={"lead_id": lead_id}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["status"] == "sent", f"Status should be 'sent', got {data['status']}"
        assert "message" in data, "Should have message"
        
        print(f"✓ Send result email: status={data['status']} (MOCKED - SendGrid not configured)")
    
    def test_send_result_email_invalid_lead(self):
        """POST /api/valuation/send-result-email with invalid lead returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/valuation/send-result-email",
            headers=self.headers,
            json={"lead_id": "vlead_invalid123"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Send email with invalid lead returns 404")


class TestValuationEngineCalculations:
    """Test valuation engine calculations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        data = login_response.json()
        self.token = data.get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_positive_ebitda_uses_ebitda_multiples(self):
        """Positive EBITDA uses EBITDA-based multiples"""
        payload = {
            "name": "TEST_Positive EBITDA",
            "job_title": "CEO",
            "company_name": "TEST_Positive EBITDA Agency",
            "revenue": 2000000,
            "ebitda": 400000,  # 20% margin
            "category_id": "digital_growth_commerce",
            "sale_intent": "si_12_meses",
            "legal_confirm_accuracy": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/valuation/estimate",
            headers=self.headers,
            json=payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # With positive EBITDA, valuation should be based on EBITDA * multiple
        # digital_growth_commerce has multiples (4.0, 5.5, 7.0)
        # Valuation should be roughly EBITDA * multiple * quality_factor
        assert data["valuation_mid"] > 1000000, "Valuation should be significant"
        assert "revenue-based fallback" not in data["multiple_source"], "Should not use revenue fallback"
        
        print(f"✓ Positive EBITDA: valuation={data['valuation_mid']/1e6:.2f}M, source={data['multiple_source']}")
    
    def test_negative_ebitda_uses_revenue_fallback(self):
        """Negative EBITDA uses revenue-based fallback"""
        payload = {
            "name": "TEST_Negative EBITDA",
            "job_title": "CEO",
            "company_name": "TEST_Negative EBITDA Agency",
            "revenue": 2000000,
            "ebitda": -100000,  # Negative EBITDA
            "category_id": "digital_growth_commerce",
            "sale_intent": "si_12_meses",
            "legal_confirm_accuracy": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/valuation/estimate",
            headers=self.headers,
            json=payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # With negative EBITDA, should use revenue-based fallback
        assert "revenue-based fallback" in data["multiple_source"], f"Should use revenue fallback, got: {data['multiple_source']}"
        
        # Confidence should be lower due to negative EBITDA
        assert data["confidence_level"] in ["media", "baja"], f"Confidence should be lower, got: {data['confidence_level']}"
        
        print(f"✓ Negative EBITDA: valuation={data['valuation_mid']/1e6:.2f}M, source={data['multiple_source']}, confidence={data['confidence_level']}")
    
    def test_quality_score_affects_valuation(self):
        """Quality score affects valuation through quality_factor"""
        # High quality company
        high_quality_payload = {
            "name": "TEST_High Quality",
            "job_title": "CEO",
            "company_name": "TEST_High Quality Agency",
            "revenue": 2000000,
            "ebitda": 500000,  # 25% margin (excellent)
            "growth_12m_pct": 25,  # High growth
            "employee_count": 15,  # Good efficiency
            "recurring_revenue_pct": 75,  # High recurrence
            "category_id": "digital_growth_commerce",
            "sale_intent": "si_12_meses",
            "legal_confirm_accuracy": True
        }
        
        high_response = requests.post(
            f"{BASE_URL}/api/valuation/estimate",
            headers=self.headers,
            json=high_quality_payload
        )
        assert high_response.status_code == 200
        high_data = high_response.json()
        
        # Low quality company (same EBITDA but worse metrics)
        low_quality_payload = {
            "name": "TEST_Low Quality",
            "job_title": "CEO",
            "company_name": "TEST_Low Quality Agency",
            "revenue": 2000000,
            "ebitda": 500000,  # Same EBITDA
            "growth_12m_pct": -5,  # Negative growth
            "employee_count": 50,  # Low efficiency
            "recurring_revenue_pct": 10,  # Low recurrence
            "category_id": "digital_growth_commerce",
            "sale_intent": "si_12_meses",
            "legal_confirm_accuracy": True
        }
        
        low_response = requests.post(
            f"{BASE_URL}/api/valuation/estimate",
            headers=self.headers,
            json=low_quality_payload
        )
        assert low_response.status_code == 200
        low_data = low_response.json()
        
        # High quality should have higher quality_factor and valuation
        assert high_data["quality_factor"] > low_data["quality_factor"], \
            f"High quality factor ({high_data['quality_factor']}) should be > low ({low_data['quality_factor']})"
        assert high_data["valuation_mid"] > low_data["valuation_mid"], \
            f"High valuation ({high_data['valuation_mid']}) should be > low ({low_data['valuation_mid']})"
        
        print(f"✓ Quality affects valuation: high={high_data['valuation_mid']/1e6:.2f}M (factor={high_data['quality_factor']}), low={low_data['valuation_mid']/1e6:.2f}M (factor={low_data['quality_factor']})")
    
    def test_confidence_levels(self):
        """Confidence level varies based on data completeness"""
        # Complete data - should be alta
        complete_payload = {
            "name": "TEST_Complete Data",
            "job_title": "CEO",
            "company_name": "TEST_Complete Agency",
            "revenue": 2000000,
            "ebitda": 400000,
            "growth_12m_pct": 15,
            "employee_count": 20,
            "recurring_revenue_pct": 60,
            "category_id": "digital_growth_commerce",
            "subcategory_id": "seo",
            "sale_intent": "si_12_meses",
            "legal_confirm_accuracy": True
        }
        
        complete_response = requests.post(
            f"{BASE_URL}/api/valuation/estimate",
            headers=self.headers,
            json=complete_payload
        )
        assert complete_response.status_code == 200
        complete_data = complete_response.json()
        
        # Minimal data - should be lower confidence
        minimal_payload = {
            "name": "TEST_Minimal Data",
            "job_title": "CEO",
            "company_name": "TEST_Minimal Agency",
            "revenue": 2000000,
            "ebitda": 0,  # No EBITDA
            "category_id": "digital_growth_commerce",
            "sale_intent": "si_12_meses",
            "legal_confirm_accuracy": True
        }
        
        minimal_response = requests.post(
            f"{BASE_URL}/api/valuation/estimate",
            headers=self.headers,
            json=minimal_payload
        )
        assert minimal_response.status_code == 200
        minimal_data = minimal_response.json()
        
        # Complete data should have higher or equal confidence
        confidence_order = {"alta": 3, "media": 2, "baja": 1}
        assert confidence_order[complete_data["confidence_level"]] >= confidence_order[minimal_data["confidence_level"]], \
            f"Complete data confidence ({complete_data['confidence_level']}) should be >= minimal ({minimal_data['confidence_level']})"
        
        print(f"✓ Confidence levels: complete={complete_data['confidence_level']}, minimal={minimal_data['confidence_level']}")
    
    def test_category_multiples_from_cis(self):
        """Different categories have different CIS-sourced multiples"""
        categories_to_test = [
            ("digital_growth_commerce", (4.0, 5.5, 7.0)),  # Higher multiples
            ("experiencias_activacion", (2.5, 3.5, 4.5)),  # Lower multiples
            ("data_adtech_martech", (5.0, 6.5, 8.0)),  # Highest multiples
        ]
        
        for category_id, expected_range in categories_to_test:
            payload = {
                "name": f"TEST_Category {category_id}",
                "job_title": "CEO",
                "company_name": f"TEST_{category_id} Agency",
                "revenue": 2000000,
                "ebitda": 400000,
                "category_id": category_id,
                "sale_intent": "si_12_meses",
                "legal_confirm_accuracy": True
            }
            
            response = requests.post(
                f"{BASE_URL}/api/valuation/estimate",
                headers=self.headers,
                json=payload
            )
            assert response.status_code == 200
            data = response.json()
            
            # Verify multiples are from CIS
            assert "CIS" in data["multiple_source"], f"Source should be CIS for {category_id}, got: {data['multiple_source']}"
            
            # Verify multiples are in expected range (with some tolerance for quality factor)
            assert data["multiple_min"] >= expected_range[0] * 0.9, f"Min multiple for {category_id} too low"
            assert data["multiple_max"] <= expected_range[2] * 1.1, f"Max multiple for {category_id} too high"
            
            print(f"✓ Category {category_id}: multiples={data['multiple_min']}-{data['multiple_max']}, source={data['multiple_source']}")


class TestValuationAccessControl:
    """Test access control for valuation endpoints"""
    
    def test_buyer_can_create_valuation(self):
        """Buyer account can also create valuations"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": BUYER_EMAIL,
            "password": BUYER_PASSWORD
        })
        assert login_response.status_code == 200, f"Buyer login failed: {login_response.text}"
        
        token = login_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        payload = {
            "name": "TEST_Buyer Valuation",
            "job_title": "Investment Director",
            "company_name": "TEST_Target Agency",
            "revenue": 3000000,
            "ebitda": 600000,
            "category_id": "medios_performance_programmatic",
            "sale_intent": "solo_orientacion",
            "legal_confirm_accuracy": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/valuation/estimate",
            headers=headers,
            json=payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "lead_id" in data, "Should have lead_id"
        
        print(f"✓ Buyer can create valuation: {data['lead_id']}")
    
    def test_user_cannot_access_other_users_lead(self):
        """User cannot access another user's valuation lead"""
        # Login as seller and create a lead
        seller_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        seller_token = seller_login.json().get("access_token")
        seller_headers = {"Authorization": f"Bearer {seller_token}"}
        
        create_response = requests.post(
            f"{BASE_URL}/api/valuation/estimate",
            headers=seller_headers,
            json={
                "name": "TEST_Seller Only",
                "job_title": "CEO",
                "company_name": "TEST_Seller Agency",
                "revenue": 1000000,
                "ebitda": 200000,
                "category_id": "estrategia_marca_diseno",
                "sale_intent": "si_12_meses",
                "legal_confirm_accuracy": True
            }
        )
        lead_id = create_response.json()["lead_id"]
        
        # Login as buyer and try to access seller's lead
        buyer_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": BUYER_EMAIL,
            "password": BUYER_PASSWORD
        })
        buyer_token = buyer_login.json().get("access_token")
        buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/valuation/lead/{lead_id}",
            headers=buyer_headers
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        
        print("✓ User cannot access other user's lead (403 Forbidden)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
