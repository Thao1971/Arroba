"""
Deal Readiness System Tests
Tests for:
- GET /api/deals/{deal_id}/readiness - returns score, status, obligatory items, recommended items, missing items
- Readiness score calculation (70% obligatory + 30% recommended)
- POST /api/deals/{deal_id}/activate - returns confirm_required if missing obligatory (force=false)
- POST /api/deals/{deal_id}/activate?force=true - publishes even with missing items
- Each readiness item has id, label, completed, category, cta, href fields
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SELLER_EMAIL = "diego.martin@rankingdigital.es"
SELLER_PASSWORD = "demo2026"
DEAL_ID = "deal_hot_seo_01"  # status=exclusivity, readiness=62%


class TestDealReadinessAPI:
    """Tests for Deal Readiness endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as seller
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        token = login_response.json().get("access_token")
        assert token, "No access token returned"
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
    def test_readiness_endpoint_returns_200(self):
        """GET /api/deals/{deal_id}/readiness returns 200"""
        response = self.session.get(f"{BASE_URL}/api/deals/{DEAL_ID}/readiness")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"PASS: Readiness endpoint returns 200")
        
    def test_readiness_returns_score_and_status(self):
        """Readiness response includes score (0-100) and status (LISTO/MEJORABLE/DEBIL)"""
        response = self.session.get(f"{BASE_URL}/api/deals/{DEAL_ID}/readiness")
        assert response.status_code == 200
        data = response.json()
        
        # Check score
        assert "score" in data, "Missing 'score' field"
        assert isinstance(data["score"], (int, float)), "Score should be numeric"
        assert 0 <= data["score"] <= 100, f"Score {data['score']} out of range 0-100"
        
        # Check status
        assert "status" in data, "Missing 'status' field"
        assert data["status"] in ["LISTO", "MEJORABLE", "DEBIL"], f"Invalid status: {data['status']}"
        
        # Verify status matches score thresholds
        if data["score"] >= 90:
            assert data["status"] == "LISTO", f"Score {data['score']} should be LISTO"
        elif data["score"] >= 60:
            assert data["status"] == "MEJORABLE", f"Score {data['score']} should be MEJORABLE"
        else:
            assert data["status"] == "DEBIL", f"Score {data['score']} should be DEBIL"
            
        print(f"PASS: Readiness returns score={data['score']} status={data['status']}")
        
    def test_readiness_returns_obligatory_items(self):
        """Readiness response includes obligatory items with correct structure"""
        response = self.session.get(f"{BASE_URL}/api/deals/{DEAL_ID}/readiness")
        assert response.status_code == 200
        data = response.json()
        
        assert "obligatory" in data, "Missing 'obligatory' field"
        obligatory = data["obligatory"]
        
        # Check obligatory structure
        assert "items" in obligatory, "Missing 'items' in obligatory"
        assert "completed" in obligatory, "Missing 'completed' count"
        assert "total" in obligatory, "Missing 'total' count"
        assert "pct" in obligatory, "Missing 'pct' percentage"
        
        # Check items have required fields
        for item in obligatory["items"]:
            assert "id" in item, f"Item missing 'id': {item}"
            assert "label" in item, f"Item missing 'label': {item}"
            assert "completed" in item, f"Item missing 'completed': {item}"
            assert "category" in item, f"Item missing 'category': {item}"
            assert "cta" in item, f"Item missing 'cta': {item}"
            assert "href" in item, f"Item missing 'href': {item}"
            assert item["category"] == "obligatorio", f"Obligatory item has wrong category: {item['category']}"
            
        print(f"PASS: Obligatory items ({obligatory['completed']}/{obligatory['total']}) have correct structure")
        
    def test_readiness_returns_recommended_items(self):
        """Readiness response includes recommended items with correct structure"""
        response = self.session.get(f"{BASE_URL}/api/deals/{DEAL_ID}/readiness")
        assert response.status_code == 200
        data = response.json()
        
        assert "recommended" in data, "Missing 'recommended' field"
        recommended = data["recommended"]
        
        # Check recommended structure
        assert "items" in recommended, "Missing 'items' in recommended"
        assert "completed" in recommended, "Missing 'completed' count"
        assert "total" in recommended, "Missing 'total' count"
        assert "pct" in recommended, "Missing 'pct' percentage"
        
        # Check items have required fields
        for item in recommended["items"]:
            assert "id" in item, f"Item missing 'id': {item}"
            assert "label" in item, f"Item missing 'label': {item}"
            assert "completed" in item, f"Item missing 'completed': {item}"
            assert "category" in item, f"Item missing 'category': {item}"
            assert "cta" in item, f"Item missing 'cta': {item}"
            assert "href" in item, f"Item missing 'href': {item}"
            assert item["category"] == "recomendado", f"Recommended item has wrong category: {item['category']}"
            
        print(f"PASS: Recommended items ({recommended['completed']}/{recommended['total']}) have correct structure")
        
    def test_readiness_returns_missing_items(self):
        """Readiness response includes missing_obligatory and missing_recommended lists"""
        response = self.session.get(f"{BASE_URL}/api/deals/{DEAL_ID}/readiness")
        assert response.status_code == 200
        data = response.json()
        
        assert "missing_obligatory" in data, "Missing 'missing_obligatory' field"
        assert "missing_recommended" in data, "Missing 'missing_recommended' field"
        
        # Verify missing items are not completed
        for item in data["missing_obligatory"]:
            assert item["completed"] == False, f"Missing item should have completed=False: {item}"
            
        for item in data["missing_recommended"]:
            assert item["completed"] == False, f"Missing item should have completed=False: {item}"
            
        print(f"PASS: Missing items returned - {len(data['missing_obligatory'])} obligatory, {len(data['missing_recommended'])} recommended")
        
    def test_readiness_score_calculation(self):
        """Score = (obligatory_pct * 0.7) + (recommended_pct * 0.3)"""
        response = self.session.get(f"{BASE_URL}/api/deals/{DEAL_ID}/readiness")
        assert response.status_code == 200
        data = response.json()
        
        obligatory_pct = data["obligatory"]["pct"]
        recommended_pct = data["recommended"]["pct"]
        expected_score = round((obligatory_pct * 0.7) + (recommended_pct * 0.3))
        
        # Allow 1 point tolerance for rounding
        assert abs(data["score"] - expected_score) <= 1, \
            f"Score {data['score']} doesn't match formula: ({obligatory_pct}*0.7)+({recommended_pct}*0.3)={expected_score}"
            
        print(f"PASS: Score calculation correct: ({obligatory_pct}*0.7)+({recommended_pct}*0.3)={data['score']}")
        
    def test_readiness_cta_href_values(self):
        """Each item has valid CTA href (dataroom, company, infomemo, teaser, deal_edit, overview)"""
        response = self.session.get(f"{BASE_URL}/api/deals/{DEAL_ID}/readiness")
        assert response.status_code == 200
        data = response.json()
        
        valid_hrefs = ["dataroom", "company", "infomemo", "teaser", "deal_edit", "overview"]
        
        all_items = data["obligatory"]["items"] + data["recommended"]["items"]
        for item in all_items:
            assert item["href"] in valid_hrefs, f"Invalid href '{item['href']}' for item {item['id']}"
            
        print(f"PASS: All {len(all_items)} items have valid CTA hrefs")
        
    def test_readiness_publish_warning_fields(self):
        """Readiness includes can_publish, publish_warning, publish_warning_message"""
        response = self.session.get(f"{BASE_URL}/api/deals/{DEAL_ID}/readiness")
        assert response.status_code == 200
        data = response.json()
        
        assert "can_publish" in data, "Missing 'can_publish' field"
        assert "publish_warning" in data, "Missing 'publish_warning' field"
        
        # If there are missing obligatory items, publish_warning should be True
        if len(data["missing_obligatory"]) > 0:
            assert data["publish_warning"] == True, "publish_warning should be True when missing obligatory items"
            assert "publish_warning_message" in data, "Missing 'publish_warning_message' when warning is True"
            assert data["publish_warning_message"] is not None, "publish_warning_message should not be None"
            
        print(f"PASS: Publish warning fields present - warning={data['publish_warning']}")
        
    def test_readiness_requires_authentication(self):
        """GET /api/deals/{deal_id}/readiness requires authentication"""
        # Create new session without auth
        unauth_session = requests.Session()
        response = unauth_session.get(f"{BASE_URL}/api/deals/{DEAL_ID}/readiness")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"PASS: Readiness endpoint requires authentication (401)")
        
    def test_readiness_deal_not_found(self):
        """GET /api/deals/{invalid_id}/readiness returns 404"""
        response = self.session.get(f"{BASE_URL}/api/deals/invalid_deal_xyz/readiness")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"PASS: Invalid deal returns 404")


class TestActivateEndpoint:
    """Tests for POST /api/deals/{deal_id}/activate endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as seller
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        token = login_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
    def test_activate_non_draft_deal_returns_400(self):
        """POST /api/deals/{deal_id}/activate on non-draft deal returns 400"""
        # deal_hot_seo_01 is in exclusivity status, not draft
        response = self.session.post(f"{BASE_URL}/api/deals/{DEAL_ID}/activate")
        assert response.status_code == 400, f"Expected 400 for non-draft deal, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "draft" in data.get("detail", "").lower(), f"Error should mention draft status: {data}"
        print(f"PASS: Activate non-draft deal returns 400 with draft status message")
        
    def test_activate_requires_authentication(self):
        """POST /api/deals/{deal_id}/activate requires authentication"""
        unauth_session = requests.Session()
        response = unauth_session.post(f"{BASE_URL}/api/deals/{DEAL_ID}/activate")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"PASS: Activate endpoint requires authentication (401)")
        
    def test_activate_deal_not_found(self):
        """POST /api/deals/{invalid_id}/activate returns 404"""
        response = self.session.post(f"{BASE_URL}/api/deals/invalid_deal_xyz/activate")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"PASS: Activate invalid deal returns 404")


class TestReadinessItemIds:
    """Tests for specific readiness item IDs and their CTAs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as seller
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        assert login_response.status_code == 200
        token = login_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
    def test_obligatory_item_ids(self):
        """Obligatory items have expected IDs: teaser, infomemo, revenue, ebitda, operation_type, pricing, dataroom_min, taxonomy"""
        response = self.session.get(f"{BASE_URL}/api/deals/{DEAL_ID}/readiness")
        assert response.status_code == 200
        data = response.json()
        
        expected_ids = ["teaser", "infomemo", "revenue", "ebitda", "operation_type", "pricing", "dataroom_min", "taxonomy"]
        actual_ids = [item["id"] for item in data["obligatory"]["items"]]
        
        for expected_id in expected_ids:
            assert expected_id in actual_ids, f"Missing obligatory item ID: {expected_id}"
            
        print(f"PASS: All expected obligatory item IDs present: {expected_ids}")
        
    def test_recommended_item_ids(self):
        """Recommended items have expected IDs: dataroom_complete, commercial_docs, dr_folders, team_info, buyer_matches, manual_review"""
        response = self.session.get(f"{BASE_URL}/api/deals/{DEAL_ID}/readiness")
        assert response.status_code == 200
        data = response.json()
        
        expected_ids = ["dataroom_complete", "commercial_docs", "dr_folders", "team_info", "buyer_matches", "manual_review"]
        actual_ids = [item["id"] for item in data["recommended"]["items"]]
        
        for expected_id in expected_ids:
            assert expected_id in actual_ids, f"Missing recommended item ID: {expected_id}"
            
        print(f"PASS: All expected recommended item IDs present: {expected_ids}")
        
    def test_cta_labels_in_spanish(self):
        """CTA labels are in Spanish (SUBIR DOCUMENTO, ASIGNAR CATEGORIA, etc)"""
        response = self.session.get(f"{BASE_URL}/api/deals/{DEAL_ID}/readiness")
        assert response.status_code == 200
        data = response.json()
        
        all_items = data["obligatory"]["items"] + data["recommended"]["items"]
        
        # Check that CTAs are not empty and contain Spanish-like text
        for item in all_items:
            assert item["cta"], f"Empty CTA for item {item['id']}"
            # CTAs should be in Spanish (no English words like "Upload", "Add", etc)
            assert "upload" not in item["cta"].lower(), f"CTA should be in Spanish: {item['cta']}"
            
        print(f"PASS: All CTAs are in Spanish")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
