"""
Test suite for Arroba Buyer Flow - Iteration 4
Tests: Taxonomy, Deal Page (pre/post NDA), NDA signing, Marketplace, Activation Preview, Funnel
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SELLER_EMAIL = "seller_test@arroba.com"
SELLER_PASSWORD = "Test1234!"
BUYER_EMAIL = "buyer_test@arroba.com"
BUYER_PASSWORD = "Test1234!"
EXISTING_DEAL_ID = "deal_1aa56a9545ba"
EXISTING_COMPANY_ID = "comp_47fa37c66ac3"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def seller_token(api_client):
    """Get seller authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": SELLER_EMAIL,
        "password": SELLER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Seller authentication failed")


@pytest.fixture(scope="module")
def buyer_token(api_client):
    """Get buyer authentication token (existing buyer with NDA)"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": BUYER_EMAIL,
        "password": BUYER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Buyer authentication failed")


@pytest.fixture(scope="module")
def new_buyer_token(api_client):
    """Register a new buyer for NDA testing"""
    unique_email = f"test_buyer_{uuid.uuid4().hex[:8]}@arroba.com"
    response = api_client.post(f"{BASE_URL}/api/auth/register", json={
        "email": unique_email,
        "password": "Test1234!",
        "full_name": "Test Buyer NDA",
        "role": "buyer"
    })
    if response.status_code in [200, 201]:
        return response.json().get("access_token")
    # Try login if already exists
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": unique_email,
        "password": "Test1234!"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("New buyer registration/login failed")


class TestTaxonomyEndpoints:
    """Test taxonomy API endpoints - 10 hierarchical categories"""
    
    def test_get_taxonomy_categories(self, api_client):
        """GET /api/taxonomy/categories - Returns 10 taxonomy categories"""
        response = api_client.get(f"{BASE_URL}/api/taxonomy/categories")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) == 10, f"Expected 10 categories, got {len(data)}"
        
        # Verify structure
        for cat in data:
            assert "id" in cat, "Category should have id"
            assert "name" in cat, "Category should have name"
            assert "subcategories" in cat, "Category should have subcategories"
            assert isinstance(cat["subcategories"], list), "Subcategories should be a list"
        
        # Verify some expected categories
        category_ids = [c["id"] for c in data]
        assert "estrategia_marca_diseno" in category_ids
        assert "creatividad_produccion" in category_ids
        assert "digital_growth_commerce" in category_ids
        print(f"✓ Taxonomy has {len(data)} categories with proper structure")
    
    def test_get_taxonomy_subcategories(self, api_client):
        """GET /api/taxonomy/subcategories - Returns flat list with parent info"""
        response = api_client.get(f"{BASE_URL}/api/taxonomy/subcategories")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have subcategories"
        
        # Verify structure
        for sub in data[:5]:  # Check first 5
            assert "id" in sub
            assert "name" in sub
            assert "category_id" in sub, "Should have parent category_id"
            assert "category_name" in sub, "Should have parent category_name"
        
        print(f"✓ Taxonomy has {len(data)} subcategories with parent info")


class TestMarketplaceEndpoints:
    """Test marketplace API - only published deals, taxonomy sectors"""
    
    def test_marketplace_deals_only_published(self, api_client):
        """GET /api/marketplace/deals - Only published deals shown"""
        response = api_client.get(f"{BASE_URL}/api/marketplace/deals")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # All deals should be published
        for deal in data:
            assert deal.get("status") == "published", f"Deal {deal.get('deal_id')} should be published, got {deal.get('status')}"
            # Infomemo should NOT be in marketplace listing
            assert "infomemo" not in deal or deal.get("infomemo") is None, "Infomemo should not be exposed in marketplace"
        
        print(f"✓ Marketplace returns {len(data)} published deals (no draft)")
    
    def test_marketplace_sectors_uses_taxonomy(self, api_client):
        """GET /api/marketplace/sectors - Returns taxonomy categories"""
        response = api_client.get(f"{BASE_URL}/api/marketplace/sectors")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Should have taxonomy structure
        for sector in data:
            assert "id" in sector
            assert "name" in sector
            assert "subcategories" in sector, "Should have subcategories from taxonomy"
        
        print(f"✓ Marketplace sectors uses taxonomy ({len(data)} categories)")
    
    def test_marketplace_stats(self, api_client):
        """GET /api/marketplace/stats - Returns marketplace statistics"""
        response = api_client.get(f"{BASE_URL}/api/marketplace/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "published_deals" in data
        assert "active_processes" in data
        print(f"✓ Marketplace stats: {data.get('published_deals')} published, {data.get('active_processes')} active")


class TestDealPagePreNDA:
    """Test deal page endpoint - pre-NDA state (teaser only)"""
    
    def test_deal_page_public_unauthenticated(self, api_client):
        """GET /api/deals/{deal_id}/page - Public access shows teaser only"""
        response = api_client.get(f"{BASE_URL}/api/deals/{EXISTING_DEAL_ID}/page")
        assert response.status_code == 200
        
        data = response.json()
        assert data["deal_id"] == EXISTING_DEAL_ID
        assert "teaser" in data, "Should have teaser"
        assert data["has_nda"] == False, "Unauthenticated should not have NDA"
        assert data["is_authenticated"] == False, "Should not be authenticated"
        
        # Pre-NDA: NO infomemo, NO company identity
        assert data.get("infomemo") is None, "Pre-NDA should not have infomemo"
        assert data.get("company") is None, "Pre-NDA should not have company identity"
        
        print("✓ Deal page (unauthenticated): teaser only, no infomemo/company")
    
    def test_deal_page_authenticated_no_nda(self, api_client, new_buyer_token):
        """GET /api/deals/{deal_id}/page - Authenticated buyer without NDA"""
        headers = {"Authorization": f"Bearer {new_buyer_token}"}
        response = api_client.get(f"{BASE_URL}/api/deals/{EXISTING_DEAL_ID}/page", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_authenticated"] == True, "Should be authenticated"
        assert data["has_nda"] == False, "New buyer should not have NDA"
        
        # Pre-NDA: NO infomemo, NO company identity
        assert data.get("infomemo") is None, "Pre-NDA should not have infomemo"
        assert data.get("company") is None, "Pre-NDA should not have company identity"
        
        print("✓ Deal page (authenticated, no NDA): teaser only, no infomemo/company")


class TestNDASigning:
    """Test NDA signing flow with legal tracking"""
    
    def test_sign_nda_requires_auth(self):
        """POST /api/deals/{deal_id}/sign-nda - Requires authentication"""
        # Use fresh session without any auth
        response = requests.post(f"{BASE_URL}/api/deals/{EXISTING_DEAL_ID}/sign-nda")
        assert response.status_code == 401 or response.status_code == 403, f"Expected 401/403, got {response.status_code}"
        print("✓ NDA signing requires authentication")
    
    def test_sign_nda_success(self, api_client, new_buyer_token):
        """POST /api/deals/{deal_id}/sign-nda - Successful NDA signing"""
        headers = {"Authorization": f"Bearer {new_buyer_token}"}
        response = api_client.post(f"{BASE_URL}/api/deals/{EXISTING_DEAL_ID}/sign-nda", headers=headers)
        
        # Could be 200 (success) or already signed
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "has_access" in data, "Response should have has_access"
        assert data["has_access"] == True, "Should have access after signing"
        
        # Check for nda_id or message
        if "nda_id" in data:
            print(f"✓ NDA signed successfully, nda_id: {data['nda_id']}")
        else:
            print(f"✓ NDA already signed or success: {data.get('message')}")
    
    def test_sign_nda_idempotent(self, api_client, buyer_token):
        """POST /api/deals/{deal_id}/sign-nda - Already signed returns success"""
        headers = {"Authorization": f"Bearer {buyer_token}"}
        response = api_client.post(f"{BASE_URL}/api/deals/{EXISTING_DEAL_ID}/sign-nda", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["has_access"] == True
        print("✓ NDA signing is idempotent (already signed returns success)")


class TestDealPagePostNDA:
    """Test deal page endpoint - post-NDA state (full info)"""
    
    def test_deal_page_post_nda_shows_infomemo(self, api_client, buyer_token):
        """GET /api/deals/{deal_id}/page - Post-NDA shows infomemo"""
        headers = {"Authorization": f"Bearer {buyer_token}"}
        response = api_client.get(f"{BASE_URL}/api/deals/{EXISTING_DEAL_ID}/page", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["has_nda"] == True, "Buyer should have NDA"
        assert data["is_authenticated"] == True
        
        # Post-NDA: HAS infomemo
        assert "infomemo" in data, "Post-NDA should have infomemo"
        if data["infomemo"]:
            assert "content" in data["infomemo"], "Infomemo should have content"
        
        print("✓ Deal page (post-NDA): infomemo visible")
    
    def test_deal_page_post_nda_shows_company_identity(self, api_client, buyer_token):
        """GET /api/deals/{deal_id}/page - Post-NDA shows company identity"""
        headers = {"Authorization": f"Bearer {buyer_token}"}
        response = api_client.get(f"{BASE_URL}/api/deals/{EXISTING_DEAL_ID}/page", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        
        # Post-NDA: HAS company identity
        assert "company" in data, "Post-NDA should have company"
        if data["company"]:
            assert "legal_name" in data["company"], "Company should have legal_name"
        
        print(f"✓ Deal page (post-NDA): company identity visible - {data.get('company', {}).get('legal_name', 'N/A')}")
    
    def test_deal_page_post_nda_has_activity_log(self, api_client, buyer_token):
        """GET /api/deals/{deal_id}/page - Post-NDA has activity log"""
        headers = {"Authorization": f"Bearer {buyer_token}"}
        response = api_client.get(f"{BASE_URL}/api/deals/{EXISTING_DEAL_ID}/page", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        
        # Post-NDA: HAS activity log
        assert "activity_log" in data, "Post-NDA should have activity_log"
        assert isinstance(data["activity_log"], list), "Activity log should be a list"
        
        if data["activity_log"]:
            for item in data["activity_log"]:
                assert "type" in item
                assert "label" in item
        
        print(f"✓ Deal page (post-NDA): activity log with {len(data.get('activity_log', []))} items")


class TestActivationPreview:
    """Test seller activation preview with buyer matching"""
    
    def test_activation_preview_requires_auth(self, api_client):
        """GET /api/deals/{deal_id}/activation-preview - Requires auth"""
        response = api_client.get(f"{BASE_URL}/api/deals/{EXISTING_DEAL_ID}/activation-preview")
        assert response.status_code in [401, 403]
        print("✓ Activation preview requires authentication")
    
    def test_activation_preview_seller_only(self, api_client, buyer_token):
        """GET /api/deals/{deal_id}/activation-preview - Seller only"""
        headers = {"Authorization": f"Bearer {buyer_token}"}
        response = api_client.get(f"{BASE_URL}/api/deals/{EXISTING_DEAL_ID}/activation-preview", headers=headers)
        assert response.status_code == 403, "Buyer should not access activation preview"
        print("✓ Activation preview is seller-only")
    
    def test_activation_preview_success(self, api_client, seller_token):
        """GET /api/deals/{deal_id}/activation-preview - Returns preview data"""
        headers = {"Authorization": f"Bearer {seller_token}"}
        response = api_client.get(f"{BASE_URL}/api/deals/{EXISTING_DEAL_ID}/activation-preview", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["deal_id"] == EXISTING_DEAL_ID
        assert "teaser" in data
        assert "has_teaser" in data
        assert "has_infomemo" in data
        assert "compatible_buyers_count" in data, "Should have buyer matching count"
        assert "compatible_buyers_message" in data, "Should have buyer matching message"
        
        print(f"✓ Activation preview: {data.get('compatible_buyers_count')} compatible buyers")


class TestDealFunnel:
    """Test event funnel metrics"""
    
    def test_funnel_requires_auth(self):
        """GET /api/deals/{deal_id}/funnel - Requires auth"""
        # Use fresh session without any auth
        response = requests.get(f"{BASE_URL}/api/deals/{EXISTING_DEAL_ID}/funnel")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Funnel requires authentication")
    
    def test_funnel_seller_access(self, api_client, seller_token):
        """GET /api/deals/{deal_id}/funnel - Seller can access"""
        headers = {"Authorization": f"Bearer {seller_token}"}
        response = api_client.get(f"{BASE_URL}/api/deals/{EXISTING_DEAL_ID}/funnel", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["deal_id"] == EXISTING_DEAL_ID
        assert "funnel" in data
        
        funnel = data["funnel"]
        assert "views" in funnel
        assert "ndas_signed" in funnel
        assert "infomemo_views" in funnel
        
        print(f"✓ Funnel metrics: {funnel.get('views')} views, {funnel.get('ndas_signed')} NDAs")


class TestDraftDealsNotVisible:
    """Test that draft deals are not visible in marketplace or deal page"""
    
    def test_draft_deal_not_in_marketplace(self, api_client):
        """Marketplace should not contain draft deals"""
        response = api_client.get(f"{BASE_URL}/api/marketplace/deals")
        assert response.status_code == 200
        
        data = response.json()
        for deal in data:
            assert deal.get("status") != "draft", f"Draft deal found in marketplace: {deal.get('deal_id')}"
        
        print("✓ No draft deals in marketplace")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
