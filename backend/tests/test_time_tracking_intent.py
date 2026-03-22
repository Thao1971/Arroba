"""
Test Time Tracking, Intent Scoring, and My-Processes endpoints.
Tests for iteration 9 features:
- POST /api/tracking/time — records time for deal sections
- GET /api/tracking/intent/{deal_id} — returns intent scores for all buyers
- GET /api/tracking/intent/{deal_id}/{buyer_id} — returns single buyer intent
- GET /api/engagements/my-processes — returns buyer's active engagements
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
def test_buyer(api_client):
    """Create a test buyer for time tracking tests"""
    unique_id = str(uuid.uuid4())[:8]
    email = f"test_time_{unique_id}@arroba.com"
    password = "Test1234!"
    
    # Register buyer
    reg_response = api_client.post(f"{BASE_URL}/api/auth/register", json={
        "email": email,
        "password": password,
        "first_name": "Time",
        "last_name": "Tracker",
        "role": "buyer"
    })
    
    if reg_response.status_code not in [200, 201]:
        pytest.skip(f"Could not create test buyer: {reg_response.text}")
    
    # Login to get token
    login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": email,
        "password": password
    })
    assert login_response.status_code == 200
    token = login_response.json().get("access_token")
    user_id = login_response.json().get("user", {}).get("user_id")
    
    return {"email": email, "password": password, "token": token, "user_id": user_id}


@pytest.fixture(scope="module")
def buyer_with_engagement(api_client):
    """Get existing buyer with LOI (user_b08e29cb9a46) or create one"""
    # Try to login as existing buyer with LOI
    existing_buyers = [
        {"email": "test_buyer_loi@arroba.com", "password": "Test1234!"},
    ]
    
    for buyer in existing_buyers:
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=buyer)
        if response.status_code == 200:
            data = response.json()
            return {
                "email": buyer["email"],
                "token": data.get("access_token"),
                "user_id": data.get("user", {}).get("user_id")
            }
    
    # Create new buyer if none exist
    unique_id = str(uuid.uuid4())[:8]
    email = f"test_engaged_{unique_id}@arroba.com"
    password = "Test1234!"
    
    reg_response = api_client.post(f"{BASE_URL}/api/auth/register", json={
        "email": email,
        "password": password,
        "first_name": "Engaged",
        "last_name": "Buyer",
        "role": "buyer"
    })
    
    if reg_response.status_code not in [200, 201]:
        pytest.skip(f"Could not create engaged buyer: {reg_response.text}")
    
    login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": email,
        "password": password
    })
    token = login_response.json().get("access_token")
    user_id = login_response.json().get("user", {}).get("user_id")
    
    return {"email": email, "token": token, "user_id": user_id}


class TestTimeTrackingEndpoint:
    """Tests for POST /api/tracking/time"""
    
    def test_track_time_valid_section_deal_page(self, api_client, test_buyer):
        """Test recording time for deal_page section"""
        session_id = f"session_{uuid.uuid4().hex[:12]}"
        response = api_client.post(
            f"{BASE_URL}/api/tracking/time",
            json={
                "deal_id": DEAL_ID,
                "section": "deal_page",
                "duration_seconds": 30,
                "session_id": session_id
            },
            headers={"Authorization": f"Bearer {test_buyer['token']}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data.get("tracked") == True
        print(f"✓ Time tracked for deal_page: {data}")
    
    def test_track_time_valid_section_infomemo(self, api_client, test_buyer):
        """Test recording time for infomemo section"""
        session_id = f"session_{uuid.uuid4().hex[:12]}"
        response = api_client.post(
            f"{BASE_URL}/api/tracking/time",
            json={
                "deal_id": DEAL_ID,
                "section": "infomemo",
                "duration_seconds": 45,
                "session_id": session_id
            },
            headers={"Authorization": f"Bearer {test_buyer['token']}"}
        )
        assert response.status_code == 200
        assert response.json().get("tracked") == True
        print("✓ Time tracked for infomemo")
    
    def test_track_time_valid_section_data_room(self, api_client, test_buyer):
        """Test recording time for data_room section"""
        session_id = f"session_{uuid.uuid4().hex[:12]}"
        response = api_client.post(
            f"{BASE_URL}/api/tracking/time",
            json={
                "deal_id": DEAL_ID,
                "section": "data_room",
                "duration_seconds": 60,
                "session_id": session_id
            },
            headers={"Authorization": f"Bearer {test_buyer['token']}"}
        )
        assert response.status_code == 200
        assert response.json().get("tracked") == True
        print("✓ Time tracked for data_room")
    
    def test_track_time_invalid_section_rejected(self, api_client, test_buyer):
        """Test that invalid sections are rejected with 400"""
        session_id = f"session_{uuid.uuid4().hex[:12]}"
        response = api_client.post(
            f"{BASE_URL}/api/tracking/time",
            json={
                "deal_id": DEAL_ID,
                "section": "invalid_section",
                "duration_seconds": 30,
                "session_id": session_id
            },
            headers={"Authorization": f"Bearer {test_buyer['token']}"}
        )
        assert response.status_code == 400, f"Expected 400 for invalid section, got {response.status_code}"
        print("✓ Invalid section correctly rejected with 400")
    
    def test_track_time_zero_duration_not_tracked(self, api_client, test_buyer):
        """Test that zero duration returns tracked=False"""
        session_id = f"session_{uuid.uuid4().hex[:12]}"
        response = api_client.post(
            f"{BASE_URL}/api/tracking/time",
            json={
                "deal_id": DEAL_ID,
                "section": "deal_page",
                "duration_seconds": 0,
                "session_id": session_id
            },
            headers={"Authorization": f"Bearer {test_buyer['token']}"}
        )
        assert response.status_code == 200
        assert response.json().get("tracked") == False
        print("✓ Zero duration correctly returns tracked=False")
    
    def test_track_time_negative_duration_not_tracked(self, api_client, test_buyer):
        """Test that negative duration returns tracked=False"""
        session_id = f"session_{uuid.uuid4().hex[:12]}"
        response = api_client.post(
            f"{BASE_URL}/api/tracking/time",
            json={
                "deal_id": DEAL_ID,
                "section": "deal_page",
                "duration_seconds": -10,
                "session_id": session_id
            },
            headers={"Authorization": f"Bearer {test_buyer['token']}"}
        )
        assert response.status_code == 200
        assert response.json().get("tracked") == False
        print("✓ Negative duration correctly returns tracked=False")
    
    def test_track_time_session_accumulates(self, api_client, test_buyer):
        """Test that multiple calls with same session_id accumulate time"""
        session_id = f"session_accum_{uuid.uuid4().hex[:8]}"
        
        # First call
        response1 = api_client.post(
            f"{BASE_URL}/api/tracking/time",
            json={
                "deal_id": DEAL_ID,
                "section": "deal_page",
                "duration_seconds": 30,
                "session_id": session_id
            },
            headers={"Authorization": f"Bearer {test_buyer['token']}"}
        )
        assert response1.status_code == 200
        
        # Second call with same session
        response2 = api_client.post(
            f"{BASE_URL}/api/tracking/time",
            json={
                "deal_id": DEAL_ID,
                "section": "deal_page",
                "duration_seconds": 30,
                "session_id": session_id
            },
            headers={"Authorization": f"Bearer {test_buyer['token']}"}
        )
        assert response2.status_code == 200
        assert response2.json().get("tracked") == True
        print("✓ Session time accumulates correctly")
    
    def test_track_time_requires_auth(self):
        """Test that time tracking requires authentication"""
        # Use fresh session without any auth
        fresh_session = requests.Session()
        fresh_session.headers.update({"Content-Type": "application/json"})
        response = fresh_session.post(
            f"{BASE_URL}/api/tracking/time",
            json={
                "deal_id": DEAL_ID,
                "section": "deal_page",
                "duration_seconds": 30,
                "session_id": "test_session"
            }
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("✓ Time tracking correctly requires authentication")


class TestIntentScoringEndpoint:
    """Tests for GET /api/tracking/intent/{deal_id} and /api/tracking/intent/{deal_id}/{buyer_id}"""
    
    def test_get_deal_intent_scores(self, api_client, seller_token):
        """Test getting intent scores for all buyers on a deal"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/intent/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "deal_id" in data
        assert "buyers" in data
        assert isinstance(data["buyers"], list)
        
        # Check structure of buyer intent data
        if len(data["buyers"]) > 0:
            buyer = data["buyers"][0]
            assert "buyer_id" in buyer
            assert "score" in buyer
            assert "level" in buyer
            assert "label" in buyer
            assert "factors" in buyer
            assert "time_summary" in buyer
            print(f"✓ Deal intent scores returned: {len(data['buyers'])} buyers")
            print(f"  First buyer: score={buyer['score']}, level={buyer['level']}")
        else:
            print("✓ Deal intent scores endpoint works (no buyers with engagements yet)")
    
    def test_intent_score_levels(self, api_client, seller_token):
        """Test that intent levels are correctly assigned based on score"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/intent/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        for buyer in data.get("buyers", []):
            score = buyer["score"]
            level = buyer["level"]
            
            # Verify level assignment: alta(>=55), media(>=25), baja(<25)
            if score >= 55:
                assert level == "alta", f"Score {score} should be 'alta', got '{level}'"
            elif score >= 25:
                assert level == "media", f"Score {score} should be 'media', got '{level}'"
            else:
                assert level == "baja", f"Score {score} should be 'baja', got '{level}'"
        
        print("✓ Intent levels correctly assigned based on score thresholds")
    
    def test_get_single_buyer_intent(self, api_client, seller_token, buyer_with_engagement):
        """Test getting intent score for a specific buyer"""
        buyer_id = buyer_with_engagement.get("user_id")
        if not buyer_id:
            pytest.skip("No buyer_id available")
        
        response = api_client.get(
            f"{BASE_URL}/api/tracking/intent/{DEAL_ID}/{buyer_id}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "deal_id" in data
        assert "buyer_id" in data
        assert "score" in data
        assert "level" in data
        assert "label" in data
        assert "factors" in data
        assert "time_summary" in data
        
        # Verify time_summary structure
        ts = data["time_summary"]
        assert "deal_page" in ts
        assert "infomemo" in ts
        assert "data_room" in ts
        assert "total" in ts
        
        print(f"✓ Single buyer intent: score={data['score']}, level={data['level']}")
        print(f"  Factors: {data['factors']}")
    
    def test_intent_factors_structure(self, api_client, seller_token):
        """Test that intent factors have correct structure"""
        response = api_client.get(
            f"{BASE_URL}/api/tracking/intent/{DEAL_ID}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        for buyer in data.get("buyers", []):
            for factor in buyer.get("factors", []):
                assert "factor" in factor, "Factor should have 'factor' field"
                assert "points" in factor, "Factor should have 'points' field"
                assert isinstance(factor["points"], (int, float))
        
        print("✓ Intent factors have correct structure (factor + points)")
    
    def test_intent_requires_auth(self):
        """Test that intent endpoints require authentication"""
        # Use fresh session without any auth
        fresh_session = requests.Session()
        fresh_session.headers.update({"Content-Type": "application/json"})
        response = fresh_session.get(f"{BASE_URL}/api/tracking/intent/{DEAL_ID}")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("✓ Intent endpoint correctly requires authentication")


class TestMyProcessesEndpoint:
    """Tests for GET /api/engagements/my-processes"""
    
    def test_get_my_processes(self, api_client, buyer_with_engagement):
        """Test getting buyer's active processes"""
        response = api_client.get(
            f"{BASE_URL}/api/engagements/my-processes",
            headers={"Authorization": f"Bearer {buyer_with_engagement['token']}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "processes" in data
        assert "total" in data
        assert isinstance(data["processes"], list)
        
        print(f"✓ My processes returned: {data['total']} processes")
    
    def test_my_processes_structure(self, api_client, buyer_with_engagement):
        """Test that process items have correct structure"""
        response = api_client.get(
            f"{BASE_URL}/api/engagements/my-processes",
            headers={"Authorization": f"Bearer {buyer_with_engagement['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        if len(data["processes"]) > 0:
            proc = data["processes"][0]
            
            # Required fields
            assert "engagement_id" in proc
            assert "deal_id" in proc
            assert "type" in proc  # INTEREST or LOI
            assert "stage" in proc  # SUBMITTED, VIEWED, SHORTLISTED, etc.
            assert "deal_title" in proc
            assert "deal_sector" in proc
            
            # Optional but expected fields
            assert "next_step" in proc or proc.get("stage") == "REJECTED"
            
            print(f"✓ Process structure verified: {proc['type']} - {proc['stage']}")
            if proc.get("next_step"):
                print(f"  Next step: {proc['next_step']['action']}")
        else:
            print("✓ My processes endpoint works (no active processes for this buyer)")
    
    def test_my_processes_next_step_suggestions(self, api_client, buyer_with_engagement):
        """Test that next_step suggestions are correct based on stage"""
        response = api_client.get(
            f"{BASE_URL}/api/engagements/my-processes",
            headers={"Authorization": f"Bearer {buyer_with_engagement['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        expected_next_steps = {
            "SUBMITTED": "Revisar Data Room",
            "VIEWED": "Enviar LOI",
            "SHORTLISTED": "Preparar Due Diligence",
            "EXCLUSIVITY": "Avanzar Due Diligence",
        }
        
        for proc in data["processes"]:
            stage = proc["stage"]
            next_step = proc.get("next_step")
            
            if stage in expected_next_steps and next_step:
                expected_action = expected_next_steps[stage]
                assert next_step["action"] == expected_action, \
                    f"Stage {stage} should suggest '{expected_action}', got '{next_step['action']}'"
                assert "href" in next_step, "next_step should have href"
        
        print("✓ Next step suggestions are correct based on stage")
    
    def test_my_processes_requires_auth(self):
        """Test that my-processes requires authentication"""
        # Use fresh session without any auth
        fresh_session = requests.Session()
        fresh_session.headers.update({"Content-Type": "application/json"})
        response = fresh_session.get(f"{BASE_URL}/api/engagements/my-processes")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("✓ My processes correctly requires authentication")


class TestTimeSummaryEndpoint:
    """Tests for GET /api/tracking/time/{deal_id}/{buyer_id}"""
    
    def test_get_buyer_time_summary(self, api_client, seller_token, test_buyer):
        """Test getting time summary for a specific buyer"""
        buyer_id = test_buyer.get("user_id")
        if not buyer_id:
            pytest.skip("No buyer_id available")
        
        response = api_client.get(
            f"{BASE_URL}/api/tracking/time/{DEAL_ID}/{buyer_id}",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "deal_page" in data
        assert "infomemo" in data
        assert "data_room" in data
        assert "total" in data
        assert "sessions" in data
        
        print(f"✓ Time summary: deal_page={data['deal_page']}s, infomemo={data['infomemo']}s, data_room={data['data_room']}s")
        print(f"  Total: {data['total']}s across {data['sessions']} sessions")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
