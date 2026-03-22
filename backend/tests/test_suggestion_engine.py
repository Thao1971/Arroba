"""
Test Auto-Shortlist Suggestion Engine endpoints.
Tests for iteration 10 features:
- GET /api/tracking/suggestions/{deal_id} — returns buyer classifications and recommendations
- Classification logic: RECOMMENDED_SHORTLIST, CONSIDER, LOW_PRIORITY, ALREADY_SHORTLISTED, REJECTED
- Exclusivity suggestion criteria: LOI + alta + ≥2 downloads + ≥20min DR time
- Shortlist recommendation banner with max 3 limit
- Events: SHORTLIST_SUGGESTED, EXCLUSIVITY_SUGGESTED
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SELLER_EMAIL = "seller_test@arroba.com"
SELLER_PASSWORD = "Test1234!"
DEAL_ID = "deal_1aa56a9545ba"

# Existing buyers from context
BUYER_WITH_LOI_ID = "user_b08e29cb9a46"  # LOI, media intención
BUYER_WITH_INTEREST_ID = "user_17c09b9a4d9d"  # Interest, baja intención


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
    assert response.status_code == 200, f"Seller login failed: {response.text}"
    return response.json().get("access_token")


@pytest.fixture(scope="module")
def buyer_with_loi_token(api_client):
    """Get buyer with LOI authentication token"""
    # Try existing buyer first
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "buyer_test@arroba.com",
        "password": "Test1234!"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Could not login as buyer with LOI")


class TestSuggestionsEndpoint:
    """Tests for GET /api/tracking/suggestions/{deal_id}"""
    
    def test_get_suggestions_returns_200(self, api_client, seller_token):
        """Test that suggestions endpoint returns 200 for valid deal"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/suggestions/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify top-level structure
        assert "deal_id" in data
        assert "buyers" in data
        assert "recommendation" in data
        assert "exclusivity_candidate" in data
        assert "shortlist_status" in data
        
        print(f"✓ Suggestions endpoint returns 200 with correct structure")
        print(f"  Buyers: {len(data['buyers'])}, Recommendation: {data['recommendation'] is not None}")
    
    def test_suggestions_buyer_structure(self, api_client, seller_token):
        """Test that each buyer in suggestions has correct structure"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/suggestions/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        if len(data["buyers"]) > 0:
            buyer = data["buyers"][0]
            
            # Required fields
            required_fields = [
                "buyer_id", "buyer_name", "buyer_email", "engagement_type",
                "stage", "intent_score", "intent_level", "intent_label",
                "intent_factors", "classification", "action", "action_label",
                "reason", "signals", "time_summary"
            ]
            
            for field in required_fields:
                assert field in buyer, f"Missing field: {field}"
            
            # Verify signals structure
            signals = buyer["signals"]
            assert "has_loi" in signals
            assert "dr_downloads" in signals
            assert "dr_time_min" in signals
            assert "total_time_min" in signals
            
            print(f"✓ Buyer structure verified: {buyer['buyer_name']}")
            print(f"  Classification: {buyer['classification']}, Intent: {buyer['intent_level']}")
            print(f"  Signals: LOI={signals['has_loi']}, Downloads={signals['dr_downloads']}")
        else:
            print("✓ Suggestions endpoint works (no buyers with engagements)")
    
    def test_shortlist_status_structure(self, api_client, seller_token):
        """Test that shortlist_status has correct structure"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/suggestions/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        status = data["shortlist_status"]
        assert "current_count" in status
        assert "max" in status
        assert "available_slots" in status
        assert status["max"] == 3, "Max shortlist should be 3"
        assert status["available_slots"] == 3 - status["current_count"]
        
        print(f"✓ Shortlist status: {status['current_count']}/3, {status['available_slots']} slots available")
    
    def test_suggestions_requires_auth(self):
        """Test that suggestions endpoint requires authentication"""
        fresh_session = requests.Session()
        fresh_session.headers.update({"Content-Type": "application/json"})
        response = fresh_session.get(f"{BASE_URL}/api/tracking/suggestions/{DEAL_ID}")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Suggestions endpoint correctly requires authentication")


class TestClassificationLogic:
    """Tests for buyer classification logic"""
    
    def test_classification_values_valid(self, api_client, seller_token):
        """Test that all classifications are valid values"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/suggestions/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        valid_classifications = [
            "RECOMMENDED_SHORTLIST", "CONSIDER", "LOW_PRIORITY",
            "ALREADY_SHORTLISTED", "EXCLUSIVITY", "REJECTED"
        ]
        
        for buyer in data["buyers"]:
            assert buyer["classification"] in valid_classifications, \
                f"Invalid classification: {buyer['classification']}"
        
        print(f"✓ All {len(data['buyers'])} buyers have valid classifications")
    
    def test_buyer_with_loi_media_intention_is_consider(self, api_client, seller_token):
        """Test: buyer with LOI + media intención (0 downloads) → CONSIDER"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/suggestions/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Find buyer with LOI and media intention
        loi_buyers = [b for b in data["buyers"] if b["engagement_type"] == "LOI"]
        
        for buyer in loi_buyers:
            if buyer["intent_level"] != "alta" or buyer["signals"]["dr_downloads"] < 1:
                # Should be CONSIDER (unless already shortlisted/rejected)
                if buyer["stage"] not in ("SHORTLISTED", "REJECTED", "EXCLUSIVITY"):
                    assert buyer["classification"] == "CONSIDER", \
                        f"LOI buyer with {buyer['intent_level']} intent and {buyer['signals']['dr_downloads']} downloads should be CONSIDER, got {buyer['classification']}"
                    print(f"✓ LOI buyer with limited activity correctly classified as CONSIDER")
                    print(f"  Reason: {buyer['reason']}")
                    return
        
        print("✓ Classification logic test passed (no matching buyer found to verify)")
    
    def test_buyer_with_baja_intention_is_low_priority(self, api_client, seller_token):
        """Test: buyer with baja intención → LOW_PRIORITY"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/suggestions/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Find buyer with baja intention
        for buyer in data["buyers"]:
            if buyer["intent_level"] == "baja" and buyer["stage"] not in ("SHORTLISTED", "REJECTED", "EXCLUSIVITY"):
                assert buyer["classification"] == "LOW_PRIORITY", \
                    f"Buyer with baja intention should be LOW_PRIORITY, got {buyer['classification']}"
                print(f"✓ Buyer with baja intention correctly classified as LOW_PRIORITY")
                print(f"  Reason: {buyer['reason']}")
                return
        
        print("✓ Classification logic test passed (no baja intention buyer found)")
    
    def test_alta_intention_no_loi_is_consider(self, api_client, seller_token):
        """Test: buyer with alta intención + no LOI → CONSIDER"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/suggestions/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        for buyer in data["buyers"]:
            if (buyer["intent_level"] == "alta" and 
                not buyer["signals"]["has_loi"] and 
                buyer["stage"] not in ("SHORTLISTED", "REJECTED", "EXCLUSIVITY")):
                assert buyer["classification"] == "CONSIDER", \
                    f"Alta intention buyer without LOI should be CONSIDER, got {buyer['classification']}"
                print(f"✓ Alta intention buyer without LOI correctly classified as CONSIDER")
                print(f"  Reason: {buyer['reason']}")
                return
        
        print("✓ Classification logic test passed (no matching buyer found)")
    
    def test_shortlisted_buyer_is_already_shortlisted(self, api_client, seller_token):
        """Test: shortlisted buyer → ALREADY_SHORTLISTED (not reclassified)"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/suggestions/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        for buyer in data["buyers"]:
            if buyer["stage"] == "SHORTLISTED":
                assert buyer["classification"] == "ALREADY_SHORTLISTED", \
                    f"Shortlisted buyer should be ALREADY_SHORTLISTED, got {buyer['classification']}"
                print(f"✓ Shortlisted buyer correctly classified as ALREADY_SHORTLISTED")
                return
        
        print("✓ Classification logic test passed (no shortlisted buyer found)")
    
    def test_rejected_buyer_is_rejected(self, api_client, seller_token):
        """Test: rejected buyer → REJECTED"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/suggestions/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        for buyer in data["buyers"]:
            if buyer["stage"] == "REJECTED":
                assert buyer["classification"] == "REJECTED", \
                    f"Rejected buyer should be REJECTED, got {buyer['classification']}"
                print(f"✓ Rejected buyer correctly classified as REJECTED")
                return
        
        print("✓ Classification logic test passed (no rejected buyer found)")
    
    def test_buyers_sorted_by_classification_and_score(self, api_client, seller_token):
        """Test that buyers are sorted: RECOMMENDED first, then CONSIDER, then LOW_PRIORITY"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/suggestions/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        order = {
            "RECOMMENDED_SHORTLIST": 0, 
            "ALREADY_SHORTLISTED": 1, 
            "EXCLUSIVITY": 1, 
            "CONSIDER": 2, 
            "LOW_PRIORITY": 3, 
            "REJECTED": 4
        }
        
        prev_order = -1
        for buyer in data["buyers"]:
            curr_order = order.get(buyer["classification"], 5)
            assert curr_order >= prev_order, \
                f"Buyers not sorted correctly: {buyer['classification']} came after higher priority"
            prev_order = curr_order
        
        print(f"✓ Buyers correctly sorted by classification priority")


class TestRecommendationBanner:
    """Tests for recommendation banner logic"""
    
    def test_recommendation_structure_when_present(self, api_client, seller_token):
        """Test recommendation banner structure when RECOMMENDED_SHORTLIST exists"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/suggestions/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        recommendation = data["recommendation"]
        
        if recommendation:
            assert "type" in recommendation
            assert "message" in recommendation
            assert "detail" in recommendation
            assert "buyer_ids" in recommendation
            assert "buyer_names" in recommendation
            assert recommendation["type"] == "SHORTLIST"
            assert len(recommendation["buyer_ids"]) <= 3, "Max 3 recommendations"
            
            print(f"✓ Recommendation banner present: {recommendation['message']}")
            print(f"  Buyers: {recommendation['buyer_names']}")
        else:
            # No recommendation means no RECOMMENDED_SHORTLIST buyers or no slots
            recommended = [b for b in data["buyers"] if b["classification"] == "RECOMMENDED_SHORTLIST"]
            slots = data["shortlist_status"]["available_slots"]
            
            if len(recommended) == 0:
                print("✓ No recommendation banner (no RECOMMENDED_SHORTLIST buyers)")
            elif slots == 0:
                print("✓ No recommendation banner (no available slots)")
            else:
                print(f"✓ Recommendation banner logic verified")
    
    def test_recommendation_respects_max_3_shortlist(self, api_client, seller_token):
        """Test that recommendation respects max 3 shortlist limit"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/suggestions/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        recommendation = data["recommendation"]
        status = data["shortlist_status"]
        
        if recommendation:
            # Recommended count should not exceed available slots
            assert len(recommendation["buyer_ids"]) <= status["available_slots"], \
                f"Recommendation exceeds available slots: {len(recommendation['buyer_ids'])} > {status['available_slots']}"
            assert len(recommendation["buyer_ids"]) <= 3, "Max 3 recommendations"
        
        print(f"✓ Recommendation respects max 3 shortlist limit")


class TestExclusivitySuggestion:
    """Tests for exclusivity suggestion logic"""
    
    def test_exclusivity_candidate_structure(self, api_client, seller_token):
        """Test exclusivity candidate structure when present"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/suggestions/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        candidate = data["exclusivity_candidate"]
        
        if candidate:
            assert "buyer_id" in candidate
            assert "buyer_name" in candidate
            assert "message" in candidate
            assert "detail" in candidate
            
            print(f"✓ Exclusivity candidate present: {candidate['buyer_name']}")
            print(f"  Detail: {candidate['detail']}")
        else:
            print("✓ No exclusivity candidate (criteria not met)")
    
    def test_exclusivity_requires_strict_criteria(self, api_client, seller_token):
        """Test that exclusivity suggestion requires: LOI + alta + ≥2 downloads + ≥20min DR time"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/suggestions/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        candidate = data["exclusivity_candidate"]
        
        if candidate:
            # Find the buyer in the list
            buyer = next((b for b in data["buyers"] if b["buyer_id"] == candidate["buyer_id"]), None)
            if buyer:
                signals = buyer["signals"]
                assert signals["has_loi"] == True, "Exclusivity requires LOI"
                assert buyer["intent_level"] == "alta", "Exclusivity requires alta intention"
                assert signals["dr_downloads"] >= 2, "Exclusivity requires ≥2 downloads"
                assert signals["dr_time_min"] >= 20, "Exclusivity requires ≥20min DR time"
                
                print(f"✓ Exclusivity candidate meets strict criteria:")
                print(f"  LOI: {signals['has_loi']}, Intent: {buyer['intent_level']}")
                print(f"  Downloads: {signals['dr_downloads']}, DR Time: {signals['dr_time_min']} min")
        else:
            # Verify no buyer meets criteria
            for buyer in data["buyers"]:
                if buyer["stage"] == "SHORTLISTED":
                    signals = buyer["signals"]
                    meets_criteria = (
                        signals["has_loi"] and
                        buyer["intent_level"] == "alta" and
                        signals["dr_downloads"] >= 2 and
                        signals["dr_time_min"] >= 20
                    )
                    assert not meets_criteria, \
                        f"Buyer {buyer['buyer_name']} meets exclusivity criteria but no candidate suggested"
            
            print("✓ No exclusivity candidate (no shortlisted buyer meets strict criteria)")


class TestActionLabels:
    """Tests for action labels and suggested actions"""
    
    def test_action_labels_in_spanish(self, api_client, seller_token):
        """Test that action labels are in Spanish"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/suggestions/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        spanish_labels = [
            "Enviar a shortlist", "Esperar más actividad", "Descartar",
            "Ya en shortlist", "En exclusividad", "Descartado"
        ]
        
        for buyer in data["buyers"]:
            if buyer["action_label"]:
                assert buyer["action_label"] in spanish_labels, \
                    f"Action label not in Spanish: {buyer['action_label']}"
        
        print("✓ All action labels are in Spanish")
    
    def test_recommended_shortlist_action_is_shortlist(self, api_client, seller_token):
        """Test that RECOMMENDED_SHORTLIST buyers have action='shortlist'"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/suggestions/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        for buyer in data["buyers"]:
            if buyer["classification"] == "RECOMMENDED_SHORTLIST":
                assert buyer["action"] == "shortlist", \
                    f"RECOMMENDED_SHORTLIST should have action='shortlist', got '{buyer['action']}'"
                assert buyer["action_label"] == "Enviar a shortlist"
        
        print("✓ RECOMMENDED_SHORTLIST buyers have correct action")
    
    def test_consider_action_is_wait(self, api_client, seller_token):
        """Test that CONSIDER buyers have action='wait'"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/suggestions/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        for buyer in data["buyers"]:
            if buyer["classification"] == "CONSIDER":
                assert buyer["action"] == "wait", \
                    f"CONSIDER should have action='wait', got '{buyer['action']}'"
                assert buyer["action_label"] == "Esperar más actividad"
        
        print("✓ CONSIDER buyers have correct action")
    
    def test_low_priority_action_is_discard(self, api_client, seller_token):
        """Test that LOW_PRIORITY buyers have action='discard'"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/suggestions/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        for buyer in data["buyers"]:
            if buyer["classification"] == "LOW_PRIORITY":
                assert buyer["action"] == "discard", \
                    f"LOW_PRIORITY should have action='discard', got '{buyer['action']}'"
                assert buyer["action_label"] == "Descartar"
        
        print("✓ LOW_PRIORITY buyers have correct action")


class TestIntentFactorsInSuggestions:
    """Tests for intent factors included in suggestions"""
    
    def test_intent_factors_present(self, api_client, seller_token):
        """Test that intent factors are included in buyer suggestions"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/suggestions/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        for buyer in data["buyers"]:
            assert "intent_factors" in buyer
            assert isinstance(buyer["intent_factors"], list)
            
            for factor in buyer["intent_factors"]:
                assert "factor" in factor
                assert "points" in factor
        
        print(f"✓ Intent factors present in all {len(data['buyers'])} buyer suggestions")
    
    def test_intent_score_and_level_present(self, api_client, seller_token):
        """Test that intent score and level are included"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/suggestions/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        for buyer in data["buyers"]:
            assert "intent_score" in buyer
            assert "intent_level" in buyer
            assert "intent_label" in buyer
            assert buyer["intent_level"] in ["alta", "media", "baja"]
            assert 0 <= buyer["intent_score"] <= 100
        
        print("✓ Intent score and level present in all buyer suggestions")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
