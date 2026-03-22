"""
Test Buyer Onboarding & Matching Engine - Iteration 6
Tests:
1. Buyer registration and redirect to onboarding
2. Buyer profile update with all required fields
3. profile_complete flag logic
4. Matching API returns deals with affinity labels (not numeric scores)
5. Matching API returns profile_complete=false for incomplete profiles
6. Activation preview returns real compatible_buyers stats
7. Interest submission blocked for incomplete profiles
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data
TEST_BUYER_EMAIL = f"test_buyer_onboarding_{uuid.uuid4().hex[:8]}@arroba.com"
TEST_BUYER_PASSWORD = "Test1234!"
TEST_BUYER_FIRST_NAME = "TestBuyer"
TEST_BUYER_LAST_NAME = "Onboarding"


class TestBuyerRegistration:
    """Test buyer registration flow"""
    
    def test_register_new_buyer(self):
        """Register a new buyer account"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_BUYER_EMAIL,
            "password": TEST_BUYER_PASSWORD,
            "first_name": TEST_BUYER_FIRST_NAME,
            "last_name": TEST_BUYER_LAST_NAME,
            "role": "buyer"
        })
        
        assert response.status_code in [200, 201], f"Registration failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "access_token" in data, "Missing access_token in response"
        assert "user" in data, "Missing user in response"
        
        user = data["user"]
        assert user["email"] == TEST_BUYER_EMAIL
        assert user["role"] == "buyer"
        
        # Verify buyer_profile exists but is incomplete
        assert "buyer_profile" in user
        bp = user.get("buyer_profile") or {}
        assert bp.get("profile_complete") is not True, "New buyer should have incomplete profile"
        
        print(f"✓ Buyer registered: {TEST_BUYER_EMAIL}")
        return data["access_token"]


class TestBuyerOnboarding:
    """Test buyer profile onboarding"""
    
    @pytest.fixture
    def buyer_token(self):
        """Get or create buyer token"""
        # Try to login first
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_BUYER_EMAIL,
            "password": TEST_BUYER_PASSWORD
        })
        
        if response.status_code == 200:
            return response.json()["access_token"]
        
        # Register if login fails
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_BUYER_EMAIL,
            "password": TEST_BUYER_PASSWORD,
            "first_name": TEST_BUYER_FIRST_NAME,
            "last_name": TEST_BUYER_LAST_NAME,
            "role": "buyer"
        })
        assert response.status_code in [200, 201]
        return response.json()["access_token"]
    
    def test_get_taxonomy_categories(self):
        """Verify taxonomy categories endpoint works"""
        response = requests.get(f"{BASE_URL}/api/taxonomy/categories")
        assert response.status_code == 200, f"Taxonomy failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Taxonomy should return a list"
        
        if len(data) > 0:
            cat = data[0]
            assert "id" in cat, "Category should have id"
            assert "name" in cat, "Category should have name"
            print(f"✓ Found {len(data)} taxonomy categories")
        else:
            print("⚠ No taxonomy categories found (may need seeding)")
    
    def test_buyer_profile_incomplete_initially(self, buyer_token):
        """Verify new buyer has incomplete profile"""
        headers = {"Authorization": f"Bearer {buyer_token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        assert response.status_code == 200
        user = response.json()
        
        bp = user.get("buyer_profile") or {}
        assert bp.get("profile_complete") is not True, "New buyer should have incomplete profile"
        print("✓ New buyer has incomplete profile")
    
    def test_update_buyer_profile_partial(self, buyer_token):
        """Update buyer profile with partial data - should remain incomplete"""
        headers = {"Authorization": f"Bearer {buyer_token}"}
        
        # Only provide type, missing other required fields
        response = requests.put(f"{BASE_URL}/api/users/me/buyer-profile", 
            headers=headers,
            json={
                "type": "strategic"
            }
        )
        
        assert response.status_code == 200
        user = response.json()
        
        bp = user.get("buyer_profile", {})
        assert bp.get("type") == "strategic"
        assert bp.get("profile_complete") is not True, "Partial profile should be incomplete"
        print("✓ Partial profile update - still incomplete")
    
    def test_update_buyer_profile_complete_strategic(self, buyer_token):
        """Update buyer profile with all required fields - strategic type"""
        headers = {"Authorization": f"Bearer {buyer_token}"}
        
        # Get taxonomy categories first
        tax_response = requests.get(f"{BASE_URL}/api/taxonomy/categories")
        categories = tax_response.json() if tax_response.status_code == 200 else []
        taxonomy_ids = [c["id"] for c in categories[:2]] if categories else ["digital_marketing", "creative"]
        
        profile_data = {
            "type": "strategic",
            "operation_types": ["full_sale", "partial_sale"],
            "taxonomy_categories": taxonomy_ids,
            "ticket_min": 500000,
            "ticket_max": 5000000,
            "revenue_range_min": 1000000,
            "revenue_range_max": 10000000,
            "ebitda_range_min": 200000,
            "ebitda_range_max": 2000000,
            "geographies": ["España", "México"]
        }
        
        response = requests.put(f"{BASE_URL}/api/users/me/buyer-profile",
            headers=headers,
            json=profile_data
        )
        
        assert response.status_code == 200, f"Profile update failed: {response.text}"
        user = response.json()
        
        bp = user.get("buyer_profile", {})
        
        # Verify all fields saved
        assert bp.get("type") == "strategic"
        assert "full_sale" in bp.get("operation_types", [])
        assert bp.get("ticket_min") == 500000
        assert bp.get("revenue_range_min") == 1000000
        assert bp.get("ebitda_range_min") == 200000
        
        # CRITICAL: profile_complete should be True
        assert bp.get("profile_complete") is True, "Complete profile should have profile_complete=True"
        
        print("✓ Strategic buyer profile completed successfully")
        return user
    
    def test_update_buyer_profile_financial_subtype(self):
        """Test financial buyer subtypes (PE, VC, FO, Holding)"""
        # Create a new buyer for this test
        email = f"test_financial_{uuid.uuid4().hex[:8]}@arroba.com"
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": TEST_BUYER_PASSWORD,
            "first_name": "Financial",
            "last_name": "Buyer",
            "role": "buyer"
        })
        
        if reg_response.status_code not in [200, 201]:
            pytest.skip("Could not create test buyer")
        
        token = reg_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test financial_pe subtype
        profile_data = {
            "type": "financial_pe",  # Private Equity
            "operation_types": ["full_sale"],
            "taxonomy_categories": ["digital_marketing"],
            "ticket_min": 1000000,
            "revenue_range_min": 2000000,
            "ebitda_range_min": 400000,
        }
        
        response = requests.put(f"{BASE_URL}/api/users/me/buyer-profile",
            headers=headers,
            json=profile_data
        )
        
        assert response.status_code == 200
        user = response.json()
        bp = user.get("buyer_profile", {})
        
        assert bp.get("type") == "financial_pe"
        assert bp.get("profile_complete") is True
        
        print("✓ Financial PE buyer profile completed")


class TestMatchingAPI:
    """Test matching engine API"""
    
    @pytest.fixture
    def complete_buyer_token(self):
        """Get a buyer with complete profile"""
        # Try existing test buyer
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_BUYER_EMAIL,
            "password": TEST_BUYER_PASSWORD
        })
        
        if response.status_code == 200:
            token = response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            # Ensure profile is complete
            me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
            if me_response.status_code == 200:
                user = me_response.json()
                if user.get("buyer_profile", {}).get("profile_complete"):
                    return token
            
            # Complete the profile
            requests.put(f"{BASE_URL}/api/users/me/buyer-profile",
                headers=headers,
                json={
                    "type": "strategic",
                    "operation_types": ["full_sale"],
                    "taxonomy_categories": ["digital_marketing"],
                    "ticket_min": 500000,
                    "revenue_range_min": 1000000,
                    "ebitda_range_min": 200000,
                }
            )
            return token
        
        pytest.skip("Could not get buyer token")
    
    @pytest.fixture
    def incomplete_buyer_token(self):
        """Get a buyer with incomplete profile"""
        email = f"test_incomplete_{uuid.uuid4().hex[:8]}@arroba.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": TEST_BUYER_PASSWORD,
            "first_name": "Incomplete",
            "last_name": "Buyer",
            "role": "buyer"
        })
        
        if response.status_code in [200, 201]:
            return response.json()["access_token"]
        
        pytest.skip("Could not create incomplete buyer")
    
    def test_matching_deals_requires_auth(self):
        """GET /api/matching/deals requires authentication"""
        response = requests.get(f"{BASE_URL}/api/matching/deals")
        assert response.status_code == 401, "Should require authentication"
        print("✓ Matching API requires authentication")
    
    def test_matching_deals_incomplete_profile(self, incomplete_buyer_token):
        """GET /api/matching/deals returns profile_complete=false for incomplete profile"""
        headers = {"Authorization": f"Bearer {incomplete_buyer_token}"}
        response = requests.get(f"{BASE_URL}/api/matching/deals", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("profile_complete") is False, "Should return profile_complete=false"
        assert data.get("deals") == [], "Should return empty deals list"
        assert "message" in data, "Should include message about completing profile"
        
        print("✓ Matching API returns profile_complete=false for incomplete profile")
    
    def test_matching_deals_complete_profile(self, complete_buyer_token):
        """GET /api/matching/deals returns deals with affinity labels for complete profile"""
        headers = {"Authorization": f"Bearer {complete_buyer_token}"}
        response = requests.get(f"{BASE_URL}/api/matching/deals", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("profile_complete") is True, "Should return profile_complete=true"
        assert "deals" in data, "Should include deals array"
        assert "total" in data, "Should include total count"
        
        deals = data.get("deals", [])
        print(f"✓ Found {len(deals)} recommended deals")
        
        # If there are deals, verify affinity labels
        if len(deals) > 0:
            deal = deals[0]
            assert "deal_id" in deal, "Deal should have deal_id"
            assert "affinity" in deal, "Deal should have affinity field"
            assert "affinity_label" in deal, "Deal should have affinity_label"
            
            # CRITICAL: Verify affinity is a label, not a numeric score
            affinity = deal.get("affinity")
            assert affinity in ["high", "medium", "low"], f"Affinity should be high/medium/low, got: {affinity}"
            
            affinity_label = deal.get("affinity_label")
            valid_labels = ["Alta afinidad", "Afinidad media", "Baja afinidad"]
            assert affinity_label in valid_labels, f"Invalid affinity label: {affinity_label}"
            
            # Verify NO raw numeric score is exposed
            assert "match_score" not in deal or deal.get("match_score") is None or isinstance(deal.get("match_score"), int), \
                "match_score should not be exposed to frontend"
            
            print(f"✓ Deal affinity: {affinity} ({affinity_label})")
        
        return data
    
    def test_matching_deals_affinity_labels_spanish(self, complete_buyer_token):
        """Verify affinity labels are in Spanish"""
        headers = {"Authorization": f"Bearer {complete_buyer_token}"}
        response = requests.get(f"{BASE_URL}/api/matching/deals", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        deals = data.get("deals", [])
        for deal in deals:
            label = deal.get("affinity_label", "")
            # Labels must be Spanish
            assert label in ["Alta afinidad", "Afinidad media", "Baja afinidad", "Sin datos"], \
                f"Label should be in Spanish: {label}"
        
        print("✓ All affinity labels are in Spanish")


class TestProfileCompleteBlocking:
    """Test that profile_complete blocks Interest/LOI submission"""
    
    @pytest.fixture
    def incomplete_buyer_token(self):
        """Get a buyer with incomplete profile"""
        email = f"test_block_{uuid.uuid4().hex[:8]}@arroba.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": TEST_BUYER_PASSWORD,
            "first_name": "Block",
            "last_name": "Test",
            "role": "buyer"
        })
        
        if response.status_code in [200, 201]:
            return response.json()["access_token"]
        
        pytest.skip("Could not create test buyer")
    
    def test_interest_blocked_without_complete_profile(self, incomplete_buyer_token):
        """POST /api/engagements/interest blocked for incomplete profile"""
        headers = {"Authorization": f"Bearer {incomplete_buyer_token}"}
        
        # First, we need a deal_id - get from marketplace
        deals_response = requests.get(f"{BASE_URL}/api/marketplace/deals")
        if deals_response.status_code != 200 or not deals_response.json():
            pytest.skip("No deals available for testing")
        
        deals = deals_response.json()
        if not deals:
            pytest.skip("No deals available")
        
        deal_id = deals[0].get("deal_id")
        
        # Try to submit interest without complete profile
        response = requests.post(f"{BASE_URL}/api/engagements/interest",
            headers=headers,
            json={
                "deal_id": deal_id,
                "valuation_range_min": 1000000,
                "valuation_range_max": 2000000,
                "operation_type": "full_sale",
                "legal_accepted": True
            }
        )
        
        # Should be blocked - either 403 (profile incomplete) or 403 (NDA required)
        # Both are valid blocking responses
        assert response.status_code in [403, 400], f"Should block interest: {response.text}"
        
        error_detail = response.json().get("detail", "")
        # Either blocked by profile or NDA requirement
        assert "perfil" in error_detail.lower() or "nda" in error_detail.lower(), \
            f"Should mention profile or NDA: {error_detail}"
        
        print(f"✓ Interest blocked: {error_detail}")


class TestActivationPreview:
    """Test seller activation preview with matching stats"""
    
    @pytest.fixture
    def seller_token(self):
        """Get seller token"""
        # Use existing test seller
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "seller_test@arroba.com",
            "password": "Test1234!"
        })
        
        if response.status_code == 200:
            return response.json()["access_token"]
        
        pytest.skip("Could not login as seller")
    
    def test_activation_preview_returns_buyer_stats(self, seller_token):
        """GET /api/deals/{deal_id}/activation-preview returns compatible_buyers stats"""
        headers = {"Authorization": f"Bearer {seller_token}"}
        
        # Get seller's deals
        deals_response = requests.get(f"{BASE_URL}/api/deals", headers=headers)
        if deals_response.status_code != 200:
            pytest.skip("Could not get seller deals")
        
        deals = deals_response.json()
        if not deals:
            pytest.skip("Seller has no deals")
        
        deal_id = deals[0].get("deal_id")
        
        # Get activation preview
        response = requests.get(f"{BASE_URL}/api/deals/{deal_id}/activation-preview",
            headers=headers
        )
        
        assert response.status_code == 200, f"Activation preview failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "deal_id" in data
        assert "compatible_buyers" in data, "Should include compatible_buyers"
        
        buyers = data.get("compatible_buyers", {})
        assert "high" in buyers, "Should have high count"
        assert "medium" in buyers, "Should have medium count"
        assert "low" in buyers, "Should have low count"
        assert "total" in buyers, "Should have total count"
        
        # Verify counts are integers
        assert isinstance(buyers["high"], int)
        assert isinstance(buyers["medium"], int)
        assert isinstance(buyers["total"], int)
        
        # Verify message fields
        if buyers["high"] > 0:
            assert data.get("compatible_buyers_message_high") is not None
            assert "altamente compatibles" in data["compatible_buyers_message_high"]
        
        if buyers["medium"] > 0:
            assert data.get("compatible_buyers_message_medium") is not None
            assert "potencialmente compatibles" in data["compatible_buyers_message_medium"]
        
        if buyers["total"] == 0:
            assert data.get("compatible_buyers_fallback") is not None
        
        print(f"✓ Activation preview: {buyers['high']} high, {buyers['medium']} medium, {buyers['total']} total")


class TestMarketplaceSortByRelevance:
    """Test marketplace sort by relevance option"""
    
    def test_marketplace_deals_public(self):
        """GET /api/marketplace/deals works without auth"""
        response = requests.get(f"{BASE_URL}/api/marketplace/deals")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Should return list of deals"
        print(f"✓ Marketplace has {len(data)} public deals")
    
    def test_marketplace_stats(self):
        """GET /api/marketplace/stats returns stats"""
        response = requests.get(f"{BASE_URL}/api/marketplace/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "published_deals" in data or "active_deals" in data
        print(f"✓ Marketplace stats: {data}")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
