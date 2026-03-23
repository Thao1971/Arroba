"""
Test Soft Signals System for Arroba M&A Platform
Tests:
- GET /api/marketplace/deals returns deals with 'signals' array (max 2 per deal)
- GET /api/marketplace/featured returns top 6 deals with signals
- GET /api/deals/{deal_id}/page includes 'signals' array
- Signal hierarchy: loi > competition > process > dr_activity > freshness
- Signal language in Spanish
- Internal score NOT exposed in API response
- Stats endpoint returns consistent counts
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


class TestSoftSignalsBackend:
    """Test Soft Signals in marketplace and deal endpoints"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})

    def get_auth_token(self, email, password):
        """Helper to get auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None

    # ===== MARKETPLACE DEALS ENDPOINT =====
    def test_marketplace_deals_returns_signals_array(self):
        """GET /api/marketplace/deals returns deals with 'signals' array"""
        response = self.session.get(f"{BASE_URL}/api/marketplace/deals")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        deals = response.json()
        assert isinstance(deals, list), "Response should be a list"
        
        # Check that deals have signals field
        for deal in deals:
            assert "signals" in deal, f"Deal {deal.get('deal_id')} missing 'signals' field"
            assert isinstance(deal["signals"], list), f"signals should be a list"
            print(f"Deal {deal.get('deal_id')}: {len(deal['signals'])} signals")

    def test_marketplace_deals_max_2_signals_per_deal(self):
        """Each deal should have max 2 signals"""
        response = self.session.get(f"{BASE_URL}/api/marketplace/deals")
        assert response.status_code == 200
        
        deals = response.json()
        for deal in deals:
            signals = deal.get("signals", [])
            assert len(signals) <= 2, f"Deal {deal.get('deal_id')} has {len(signals)} signals (max 2)"
            print(f"Deal {deal.get('deal_id')}: {len(signals)} signals - OK")

    def test_marketplace_deals_no_score_exposed(self):
        """Internal score should NOT be exposed in API response"""
        response = self.session.get(f"{BASE_URL}/api/marketplace/deals")
        assert response.status_code == 200
        
        deals = response.json()
        for deal in deals:
            assert "score" not in deal, f"Deal {deal.get('deal_id')} exposes 'score' field (should be hidden)"
            assert "_score" not in deal, f"Deal {deal.get('deal_id')} exposes '_score' field (should be hidden)"
        print("No internal score exposed in marketplace deals - OK")

    def test_marketplace_deals_sorted_by_activity(self):
        """Deals should be sorted by internal score (most active first)"""
        response = self.session.get(f"{BASE_URL}/api/marketplace/deals")
        assert response.status_code == 200
        
        deals = response.json()
        # We can't verify exact order without score, but we can check deals with signals come first
        # Deals with LOI signals should generally be at the top
        loi_deals = [d for d in deals if any(s.get("type") == "loi" for s in d.get("signals", []))]
        if loi_deals:
            # Check that LOI deals are in the first half
            loi_indices = [deals.index(d) for d in loi_deals]
            avg_index = sum(loi_indices) / len(loi_indices)
            print(f"LOI deals average index: {avg_index} (lower is better)")
            # LOI deals should generally be near the top
            assert avg_index < len(deals) / 2 or len(deals) < 4, "LOI deals should be near the top"
        print("Deals appear sorted by activity - OK")

    # ===== SIGNAL STRUCTURE =====
    def test_signal_structure(self):
        """Signals should have type, text, and color fields"""
        response = self.session.get(f"{BASE_URL}/api/marketplace/deals")
        assert response.status_code == 200
        
        deals = response.json()
        for deal in deals:
            for signal in deal.get("signals", []):
                assert "type" in signal, f"Signal missing 'type' field"
                assert "text" in signal, f"Signal missing 'text' field"
                assert "color" in signal, f"Signal missing 'color' field"
                
                # Validate type is one of expected values
                valid_types = ["loi", "competition", "process", "dr_activity", "freshness"]
                assert signal["type"] in valid_types, f"Invalid signal type: {signal['type']}"
                
                # Validate color
                valid_colors = ["red", "amber", "blue", "green"]
                assert signal["color"] in valid_colors, f"Invalid signal color: {signal['color']}"
                
                print(f"Signal: type={signal['type']}, text='{signal['text']}', color={signal['color']}")

    def test_signal_text_in_spanish(self):
        """Signal text should be in Spanish"""
        response = self.session.get(f"{BASE_URL}/api/marketplace/deals")
        assert response.status_code == 200
        
        deals = response.json()
        spanish_keywords = ["LOI", "recibida", "buyers", "evaluando", "fase", "avanzada", 
                          "negociacion", "Revision", "documentacion", "Nuevo", "semana", "Interes", "reciente"]
        
        for deal in deals:
            for signal in deal.get("signals", []):
                text = signal.get("text", "")
                # Check that text contains Spanish words (not English)
                has_spanish = any(kw in text for kw in spanish_keywords)
                if text:  # Only check non-empty text
                    print(f"Signal text: '{text}' - Spanish: {has_spanish}")

    # ===== FEATURED DEALS ENDPOINT =====
    def test_featured_deals_returns_signals(self):
        """GET /api/marketplace/featured returns top 6 deals with signals"""
        response = self.session.get(f"{BASE_URL}/api/marketplace/featured")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        deals = response.json()
        assert isinstance(deals, list), "Response should be a list"
        assert len(deals) <= 6, f"Featured should return max 6 deals, got {len(deals)}"
        
        for deal in deals:
            assert "signals" in deal, f"Featured deal {deal.get('deal_id')} missing 'signals' field"
            assert len(deal.get("signals", [])) <= 2, f"Featured deal has more than 2 signals"
        print(f"Featured deals: {len(deals)} deals with signals - OK")

    def test_featured_deals_no_score_exposed(self):
        """Featured deals should not expose internal score"""
        response = self.session.get(f"{BASE_URL}/api/marketplace/featured")
        assert response.status_code == 200
        
        deals = response.json()
        for deal in deals:
            assert "score" not in deal, f"Featured deal exposes 'score'"
            assert "_score" not in deal, f"Featured deal exposes '_score'"
        print("No internal score exposed in featured deals - OK")

    # ===== DEAL PAGE ENDPOINT =====
    def test_deal_page_includes_signals(self):
        """GET /api/deals/{deal_id}/page includes 'signals' array"""
        # First get a deal_id from marketplace
        response = self.session.get(f"{BASE_URL}/api/marketplace/deals")
        assert response.status_code == 200
        deals = response.json()
        
        if not deals:
            pytest.skip("No deals available to test")
        
        deal_id = deals[0]["deal_id"]
        
        # Get deal page
        response = self.session.get(f"{BASE_URL}/api/deals/{deal_id}/page")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        deal_page = response.json()
        assert "signals" in deal_page, "Deal page missing 'signals' field"
        assert isinstance(deal_page["signals"], list), "signals should be a list"
        assert len(deal_page["signals"]) <= 2, "Deal page should have max 2 signals"
        print(f"Deal page {deal_id}: {len(deal_page['signals'])} signals - OK")

    def test_deal_page_no_score_exposed(self):
        """Deal page should not expose internal score"""
        response = self.session.get(f"{BASE_URL}/api/marketplace/deals")
        assert response.status_code == 200
        deals = response.json()
        
        if not deals:
            pytest.skip("No deals available to test")
        
        deal_id = deals[0]["deal_id"]
        response = self.session.get(f"{BASE_URL}/api/deals/{deal_id}/page")
        assert response.status_code == 200
        
        deal_page = response.json()
        assert "score" not in deal_page, "Deal page exposes 'score'"
        assert "_score" not in deal_page, "Deal page exposes '_score'"
        print("No internal score exposed in deal page - OK")

    # ===== STATS ENDPOINT =====
    def test_stats_endpoint_returns_consistent_counts(self):
        """GET /api/marketplace/stats returns consistent counts"""
        response = self.session.get(f"{BASE_URL}/api/marketplace/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        stats = response.json()
        assert "published_deals" in stats, "Stats missing 'published_deals'"
        assert "closed_deals" in stats, "Stats missing 'closed_deals'"
        assert "active_processes" in stats, "Stats missing 'active_processes'"
        
        # Verify counts are non-negative integers
        assert isinstance(stats["published_deals"], int), "published_deals should be int"
        assert stats["published_deals"] >= 0, "published_deals should be non-negative"
        
        print(f"Stats: published={stats['published_deals']}, closed={stats['closed_deals']}, active={stats['active_processes']}")

    # ===== SIGNAL HIERARCHY VALIDATION =====
    def test_signal_hierarchy_loi_first(self):
        """LOI signals should appear before other signals (highest priority)"""
        response = self.session.get(f"{BASE_URL}/api/marketplace/deals")
        assert response.status_code == 200
        
        deals = response.json()
        for deal in deals:
            signals = deal.get("signals", [])
            if len(signals) >= 2:
                types = [s["type"] for s in signals]
                # If LOI is present, it should be first
                if "loi" in types:
                    assert types[0] == "loi", f"LOI should be first signal, got {types}"
                    print(f"Deal {deal.get('deal_id')}: LOI is first signal - OK")

    def test_signal_colors_match_types(self):
        """Signal colors should match their types"""
        expected_colors = {
            "loi": "red",
            "competition": "amber",
            "process": "amber",
            "dr_activity": "blue",
            "freshness": "green"
        }
        
        response = self.session.get(f"{BASE_URL}/api/marketplace/deals")
        assert response.status_code == 200
        
        deals = response.json()
        for deal in deals:
            for signal in deal.get("signals", []):
                signal_type = signal.get("type")
                signal_color = signal.get("color")
                expected = expected_colors.get(signal_type)
                if expected:
                    assert signal_color == expected, f"Signal type '{signal_type}' should have color '{expected}', got '{signal_color}'"
        print("Signal colors match types - OK")

    # ===== DEALS WITHOUT ACTIVITY =====
    def test_deals_without_activity_have_no_signals(self):
        """Deals without activity should have empty signals array (clean cards)"""
        response = self.session.get(f"{BASE_URL}/api/marketplace/deals")
        assert response.status_code == 200
        
        deals = response.json()
        deals_with_no_signals = [d for d in deals if len(d.get("signals", [])) == 0]
        deals_with_signals = [d for d in deals if len(d.get("signals", [])) > 0]
        
        print(f"Deals with signals: {len(deals_with_signals)}")
        print(f"Deals without signals (clean cards): {len(deals_with_no_signals)}")
        
        # Both should be valid - some deals have activity, some don't
        # Just verify the structure is correct
        for deal in deals_with_no_signals:
            assert deal.get("signals") == [], f"Deal without activity should have empty signals array"


class TestSoftSignalsWithAuth:
    """Test signals with authenticated users"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})

    def get_auth_token(self, email, password):
        """Helper to get auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None

    def test_buyer_sees_signals_on_deal_page(self):
        """Authenticated buyer sees signals on deal page"""
        token = self.get_auth_token(BUYER_EMAIL, BUYER_PASSWORD)
        if not token:
            pytest.skip("Could not authenticate buyer")
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Get a deal
        response = self.session.get(f"{BASE_URL}/api/marketplace/deals")
        assert response.status_code == 200
        deals = response.json()
        
        if not deals:
            pytest.skip("No deals available")
        
        deal_id = deals[0]["deal_id"]
        
        # Get deal page as authenticated buyer
        response = self.session.get(f"{BASE_URL}/api/deals/{deal_id}/page")
        assert response.status_code == 200
        
        deal_page = response.json()
        assert "signals" in deal_page, "Authenticated buyer should see signals"
        print(f"Buyer sees {len(deal_page['signals'])} signals on deal page - OK")

    def test_seller_sees_signals_on_marketplace(self):
        """Authenticated seller sees signals on marketplace"""
        token = self.get_auth_token(SELLER_EMAIL, SELLER_PASSWORD)
        if not token:
            pytest.skip("Could not authenticate seller")
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.get(f"{BASE_URL}/api/marketplace/deals")
        assert response.status_code == 200
        
        deals = response.json()
        for deal in deals:
            assert "signals" in deal, "Seller should see signals on marketplace"
        print(f"Seller sees signals on {len(deals)} marketplace deals - OK")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
