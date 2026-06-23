"""
Buyer Dashboard Fase 2 Backend Tests
Tests for: matching API with match_reason, notifications, saved deals, buyer profile
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
BUYER_EMAIL = "carlos.ruiz@capitaliberica.es"
BUYER_PASSWORD = "demo2026"

class TestBuyerDashboardFase2:
    """Backend tests for Buyer Dashboard Fase 2 features"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create a requests session"""
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_token(self, session):
        """Login and get auth token"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": BUYER_EMAIL,
            "password": BUYER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        # API returns access_token, not token
        token = data.get("access_token") or data.get("token")
        assert token, f"No token in login response: {data.keys()}"
        return token
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    # ========== MATCHING API TESTS ==========
    
    def test_matching_deals_returns_match_reason(self, session, auth_headers):
        """Test /api/matching/deals returns match_reason field"""
        response = session.get(f"{BASE_URL}/api/matching/deals", headers=auth_headers)
        assert response.status_code == 200, f"Matching deals failed: {response.text}"
        
        data = response.json()
        assert "deals" in data, "No deals key in response"
        assert "profile_complete" in data, "No profile_complete key in response"
        
        # If profile is complete and deals exist, check match_reason
        if data["profile_complete"] and len(data["deals"]) > 0:
            deal = data["deals"][0]
            assert "match_reason" in deal, f"No match_reason in deal: {deal.keys()}"
            assert isinstance(deal["match_reason"], str), "match_reason should be string"
            assert len(deal["match_reason"]) > 0, "match_reason should not be empty"
            print(f"✓ match_reason found: '{deal['match_reason']}'")
            
            # Check affinity fields
            assert "affinity" in deal, "No affinity in deal"
            assert "affinity_label" in deal, "No affinity_label in deal"
            assert deal["affinity"] in ["high", "medium", "low"], f"Invalid affinity: {deal['affinity']}"
            print(f"✓ affinity: {deal['affinity']}, label: {deal['affinity_label']}")
    
    def test_matching_deals_structure(self, session, auth_headers):
        """Test matching deals response structure"""
        response = session.get(f"{BASE_URL}/api/matching/deals", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        if data["profile_complete"] and len(data["deals"]) > 0:
            deal = data["deals"][0]
            # Check required fields
            required_fields = ["deal_id", "match_score", "affinity", "affinity_label", "match_reason", "teaser"]
            for field in required_fields:
                assert field in deal, f"Missing field: {field}"
            
            # Check teaser structure
            teaser = deal.get("teaser", {})
            assert isinstance(teaser, dict), "teaser should be dict"
            print(f"✓ Deal structure valid with {len(data['deals'])} deals")
    
    # ========== NOTIFICATIONS API TESTS ==========
    
    def test_notifications_list(self, session, auth_headers):
        """Test /api/notifications returns notifications object"""
        response = session.get(f"{BASE_URL}/api/notifications", headers=auth_headers)
        assert response.status_code == 200, f"Notifications list failed: {response.text}"
        
        data = response.json()
        assert "notifications" in data, "No notifications key in response"
        assert "unread_count" in data, "No unread_count key in response"
        assert isinstance(data["notifications"], list), "notifications should be a list"
        print(f"✓ Notifications count: {len(data['notifications'])}, unread: {data['unread_count']}")
        
        if len(data["notifications"]) > 0:
            notif = data["notifications"][0]
            assert "notification_id" in notif or "id" in notif, "No notification_id"
            assert "title" in notif, "No title in notification"
            assert "message" in notif, "No message in notification"
            assert "read" in notif, "No read status in notification"
    
    def test_notifications_unread_count(self, session, auth_headers):
        """Test /api/notifications/unread-count"""
        response = session.get(f"{BASE_URL}/api/notifications/unread-count", headers=auth_headers)
        assert response.status_code == 200, f"Unread count failed: {response.text}"
        
        data = response.json()
        assert "unread_count" in data, "No unread_count in response"
        assert isinstance(data["unread_count"], int), "unread_count should be int"
        print(f"✓ Unread count: {data['unread_count']}")
    
    def test_notifications_mark_all_read(self, session, auth_headers):
        """Test /api/notifications/read-all"""
        response = session.post(f"{BASE_URL}/api/notifications/read-all", headers=auth_headers)
        # Should succeed even if no notifications
        assert response.status_code in [200, 204], f"Mark all read failed: {response.text}"
        data = response.json()
        assert "marked_count" in data, "No marked_count in response"
        print(f"✓ Mark all read endpoint works, marked: {data['marked_count']}")
    
    # ========== SAVED DEALS (SEGUIMIENTO) TESTS ==========
    
    def test_saved_deals_list(self, session, auth_headers):
        """Test /api/engagements/saved returns saved deals"""
        response = session.get(f"{BASE_URL}/api/engagements/saved", headers=auth_headers)
        assert response.status_code == 200, f"Saved deals failed: {response.text}"
        
        data = response.json()
        assert "deals" in data, "No deals key in response"
        assert isinstance(data["deals"], list), "deals should be list"
        print(f"✓ Saved deals count: {len(data['deals'])}")
        
        if len(data["deals"]) > 0:
            deal = data["deals"][0]
            assert "deal_id" in deal, "No deal_id in saved deal"
            assert "saved_at" in deal, "No saved_at in saved deal"
    
    # ========== BUYER PROFILE TESTS ==========
    
    def test_buyer_profile_in_auth_me(self, session, auth_headers):
        """Test /api/auth/me returns buyer_profile"""
        response = session.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200, f"Auth me failed: {response.text}"
        
        data = response.json()
        assert "buyer_profile" in data, "No buyer_profile in user data"
        
        profile = data["buyer_profile"]
        # Check profile fields for Perfil tab
        profile_fields = ["company_name", "job_title", "buyer_type", "profile_complete"]
        for field in profile_fields:
            if field in profile:
                print(f"✓ buyer_profile.{field}: {profile[field]}")
    
    # ========== MARKETPLACE STATS TESTS ==========
    
    def test_marketplace_stats(self, session, auth_headers):
        """Test /api/marketplace/stats for KPIs"""
        response = session.get(f"{BASE_URL}/api/marketplace/stats", headers=auth_headers)
        assert response.status_code == 200, f"Marketplace stats failed: {response.text}"
        
        data = response.json()
        assert "published_deals" in data, "No published_deals in stats"
        print(f"✓ Published deals (DEALS DISPONIBLES): {data['published_deals']}")
    
    # ========== PROCESSES TESTS ==========
    
    def test_my_processes(self, session, auth_headers):
        """Test /api/engagements/my-processes"""
        response = session.get(f"{BASE_URL}/api/engagements/my-processes", headers=auth_headers)
        assert response.status_code == 200, f"My processes failed: {response.text}"
        
        data = response.json()
        assert "processes" in data, "No processes key in response"
        print(f"✓ Processes count: {len(data['processes'])}")
    
    # ========== NDA TESTS ==========
    
    def test_nda_signatures(self, session, auth_headers):
        """Test /api/nda/my-signatures"""
        response = session.get(f"{BASE_URL}/api/nda/my-signatures", headers=auth_headers)
        assert response.status_code == 200, f"NDA signatures failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "NDA signatures should be list"
        print(f"✓ NDA signatures count: {len(data)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
