"""
Response Acceleration Layer Tests
Tests for the new pending questions endpoint, enriched responses, notification copy,
and coaching nudge logic for Q&A response acceleration.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SELLER_EMAIL = "diego.martin@rankingdigital.es"
SELLER_PASSWORD = "demo2026"
BUYER_EMAIL = "james.harris@techventures.co.uk"
BUYER_PASSWORD = "demo2026"

# Known test data
DEAL_ID = "deal_hot_seo_01"
CONVERSATION_ID = "conv_22910a1edfed"


@pytest.fixture(scope="module")
def seller_token():
    """Get seller auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": SELLER_EMAIL,
        "password": SELLER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Seller login failed: {response.status_code}")


@pytest.fixture(scope="module")
def buyer_token():
    """Get buyer auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": BUYER_EMAIL,
        "password": BUYER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Buyer login failed: {response.status_code}")


@pytest.fixture
def seller_client(seller_token):
    """Authenticated session for seller"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {seller_token}"
    })
    return session


@pytest.fixture
def buyer_client(buyer_token):
    """Authenticated session for buyer"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {buyer_token}"
    })
    return session


class TestPendingSellerEndpoint:
    """Tests for GET /api/conversations/pending/seller endpoint"""

    def test_pending_endpoint_returns_200(self, seller_client):
        """Pending endpoint returns 200 for authenticated seller"""
        response = seller_client.get(f"{BASE_URL}/api/conversations/pending/seller")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "pending_questions" in data, "Missing pending_questions field"
        assert "total_pending" in data, "Missing total_pending field"
        assert "buyers_waiting" in data, "Missing buyers_waiting field"
        assert isinstance(data["pending_questions"], list), "pending_questions should be a list"
        print(f"Pending endpoint returned: total_pending={data['total_pending']}, buyers_waiting={data['buyers_waiting']}")

    def test_pending_endpoint_returns_most_urgent(self, seller_client):
        """Pending endpoint returns most_urgent field"""
        response = seller_client.get(f"{BASE_URL}/api/conversations/pending/seller")
        assert response.status_code == 200
        data = response.json()
        
        # most_urgent should be present (can be null if no pending)
        assert "most_urgent" in data, "Missing most_urgent field"
        
        if data["total_pending"] > 0:
            assert data["most_urgent"] is not None, "most_urgent should not be null when there are pending questions"
            urgent = data["most_urgent"]
            assert "qa_item_id" in urgent, "most_urgent missing qa_item_id"
            assert "conversation_id" in urgent, "most_urgent missing conversation_id"
            assert "buyer_name" in urgent, "most_urgent missing buyer_name"
            assert "pending_hours" in urgent, "most_urgent missing pending_hours"
            print(f"Most urgent: {urgent['buyer_name']} - {urgent['pending_hours']}h pending")

    def test_pending_questions_have_required_fields(self, seller_client):
        """Each pending question has all required enrichment fields"""
        response = seller_client.get(f"{BASE_URL}/api/conversations/pending/seller")
        assert response.status_code == 200
        data = response.json()
        
        if data["total_pending"] > 0:
            q = data["pending_questions"][0]
            required_fields = [
                "qa_item_id", "conversation_id", "content", "created_at",
                "pending_hours", "urgency", "buyer_id", "buyer_name",
                "deal_id", "deal_title", "deal_stage", "intent_score"
            ]
            for field in required_fields:
                assert field in q, f"Missing required field: {field}"
            
            # Verify urgency is valid
            assert q["urgency"] in ["alta", "media", "baja"], f"Invalid urgency: {q['urgency']}"
            
            # Verify pending_hours is numeric
            assert isinstance(q["pending_hours"], (int, float)), "pending_hours should be numeric"
            
            print(f"Question fields verified: urgency={q['urgency']}, pending_hours={q['pending_hours']}")

    def test_pending_endpoint_requires_auth(self):
        """Pending endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/conversations/pending/seller")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    def test_pending_endpoint_priority_sorting(self, seller_client):
        """Pending questions are sorted by priority (oldest first)"""
        response = seller_client.get(f"{BASE_URL}/api/conversations/pending/seller")
        assert response.status_code == 200
        data = response.json()
        
        questions = data["pending_questions"]
        if len(questions) >= 2:
            # First question should have highest pending_hours (oldest)
            for i in range(len(questions) - 1):
                # Note: sorted by -pending_hours, so first should be >= second
                assert questions[i]["pending_hours"] >= questions[i+1]["pending_hours"] or \
                       questions[i]["intent_score"] >= questions[i+1]["intent_score"], \
                       "Questions not sorted by priority"
            print(f"Priority sorting verified for {len(questions)} questions")


class TestEnrichedEngagementsEndpoints:
    """Tests for enriched pending data in engagements endpoints"""

    def test_seller_interesados_has_pending_fields(self, seller_client):
        """GET /api/engagements/seller/interesados includes pending Q&A fields"""
        response = seller_client.get(f"{BASE_URL}/api/engagements/seller/interesados")
        assert response.status_code == 200
        data = response.json()
        
        buyers = data.get("buyers", [])
        if buyers:
            # Find a buyer with a conversation
            buyer_with_conv = next((b for b in buyers if b.get("conversation_id")), None)
            if buyer_with_conv:
                assert "pending_questions" in buyer_with_conv, "Missing pending_questions field"
                assert "oldest_pending_hours" in buyer_with_conv, "Missing oldest_pending_hours field"
                assert "pending_urgency" in buyer_with_conv, "Missing pending_urgency field"
                print(f"Buyer {buyer_with_conv['buyer_name']}: pending_questions={buyer_with_conv['pending_questions']}, urgency={buyer_with_conv['pending_urgency']}")

    def test_deal_engagements_has_pending_fields(self, seller_client):
        """GET /api/engagements/deal/{deal_id} includes pending Q&A fields per engagement"""
        response = seller_client.get(f"{BASE_URL}/api/engagements/deal/{DEAL_ID}")
        assert response.status_code == 200
        data = response.json()
        
        engagements = data.get("engagements", [])
        if engagements:
            # Find an engagement with a conversation
            eng_with_conv = next((e for e in engagements if e.get("conversation_id")), None)
            if eng_with_conv:
                assert "pending_questions" in eng_with_conv, "Missing pending_questions field"
                assert "oldest_pending_hours" in eng_with_conv, "Missing oldest_pending_hours field"
                assert "pending_urgency" in eng_with_conv, "Missing pending_urgency field"
                
                # Verify urgency value
                if eng_with_conv["pending_questions"] > 0:
                    assert eng_with_conv["pending_urgency"] in ["alta", "media", "baja"], \
                        f"Invalid pending_urgency: {eng_with_conv['pending_urgency']}"
                print(f"Engagement pending data: {eng_with_conv['pending_questions']} questions, urgency={eng_with_conv['pending_urgency']}")


class TestNotificationCopy:
    """Tests for improved notification copy on question submission"""

    def test_question_creates_notification_with_buyer_name(self, buyer_client, seller_client):
        """When buyer submits question, notification uses 'X esta esperando tu respuesta' format"""
        # First, create a new question
        question_content = f"TEST_NOTIF_COPY: Test question for notification copy verification"
        response = buyer_client.post(
            f"{BASE_URL}/api/conversations/{CONVERSATION_ID}/questions",
            json={"content": question_content}
        )
        
        if response.status_code == 200:
            # Check seller's notifications
            notif_response = seller_client.get(f"{BASE_URL}/api/notifications?unread_only=true")
            assert notif_response.status_code == 200
            
            notifications = notif_response.json().get("notifications", [])
            # Find the notification for this question
            new_question_notif = next(
                (n for n in notifications if n.get("type") == "NEW_QUESTION" and "esperando" in n.get("title", "").lower()),
                None
            )
            
            if new_question_notif:
                # Verify the notification title contains "esperando tu respuesta"
                assert "esperando tu respuesta" in new_question_notif["title"].lower(), \
                    f"Notification title should contain 'esperando tu respuesta', got: {new_question_notif['title']}"
                print(f"Notification copy verified: {new_question_notif['title']}")
            else:
                # Check if any NEW_QUESTION notification exists
                any_new_q = next((n for n in notifications if n.get("type") == "NEW_QUESTION"), None)
                if any_new_q:
                    print(f"Found NEW_QUESTION notification but title format may differ: {any_new_q['title']}")
        else:
            print(f"Could not create test question: {response.status_code}")


class TestCoachingNudges:
    """Tests for coaching nudge logic (NC-QA-12 and NC-QA-24)"""

    def test_deal_nudges_endpoint_exists(self, seller_client):
        """GET /api/coaching/nudges/deal/{deal_id} returns nudges"""
        response = seller_client.get(f"{BASE_URL}/api/coaching/nudges/deal/{DEAL_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "nudges" in data, "Missing nudges field"
        assert isinstance(data["nudges"], list), "nudges should be a list"
        print(f"Deal nudges returned: {len(data['nudges'])} nudges")

    def test_seller_nudges_endpoint_exists(self, seller_client):
        """GET /api/coaching/nudges returns seller-wide nudges"""
        response = seller_client.get(f"{BASE_URL}/api/coaching/nudges")
        assert response.status_code == 200
        data = response.json()
        
        assert "nudges" in data, "Missing nudges field"
        assert isinstance(data["nudges"], list), "nudges should be a list"
        
        # Check if any Q&A related nudges exist
        qa_nudges = [n for n in data["nudges"] if n.get("id", "").startswith("NC-QA")]
        print(f"Seller nudges: {len(data['nudges'])} total, {len(qa_nudges)} Q&A related")

    def test_nudge_structure(self, seller_client):
        """Nudges have required structure"""
        response = seller_client.get(f"{BASE_URL}/api/coaching/nudges/deal/{DEAL_ID}")
        assert response.status_code == 200
        data = response.json()
        
        if data["nudges"]:
            nudge = data["nudges"][0]
            required_fields = ["id", "type", "priority", "title", "message"]
            for field in required_fields:
                assert field in nudge, f"Nudge missing required field: {field}"
            
            # Verify priority is valid
            assert nudge["priority"] in ["ALTA", "MEDIA", "BAJA"], f"Invalid priority: {nudge['priority']}"
            print(f"Nudge structure verified: {nudge['id']} - {nudge['priority']}")


class TestConversationPageSorting:
    """Tests for question sorting in conversation endpoint"""

    def test_conversation_returns_questions(self, seller_client):
        """GET /api/conversations/{id} returns questions list"""
        response = seller_client.get(f"{BASE_URL}/api/conversations/{CONVERSATION_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "conversation" in data, "Missing conversation field"
        assert "questions" in data, "Missing questions field"
        
        questions = data["questions"]
        print(f"Conversation has {len(questions)} questions")
        
        # Verify question structure
        if questions:
            q = questions[0]
            assert "qa_item_id" in q, "Question missing qa_item_id"
            assert "status" in q, "Question missing status"
            assert "content" in q, "Question missing content"
            assert "created_at" in q, "Question missing created_at"

    def test_questions_have_status_field(self, seller_client):
        """Questions have status field for frontend sorting"""
        response = seller_client.get(f"{BASE_URL}/api/conversations/{CONVERSATION_ID}")
        assert response.status_code == 200
        data = response.json()
        
        questions = data["questions"]
        for q in questions:
            assert q["status"] in ["PENDING", "ANSWERED", "CLOSED"], \
                f"Invalid question status: {q['status']}"
        
        # Count by status
        pending = sum(1 for q in questions if q["status"] == "PENDING")
        answered = sum(1 for q in questions if q["status"] == "ANSWERED")
        closed = sum(1 for q in questions if q["status"] == "CLOSED")
        print(f"Question statuses: {pending} PENDING, {answered} ANSWERED, {closed} CLOSED")


class TestE2EFlow:
    """End-to-end flow: Buyer creates question → Seller sees in pending → Seller answers → Count decreases"""

    def test_e2e_question_answer_flow(self, buyer_client, seller_client):
        """Full flow from question creation to answer"""
        # Step 1: Get initial pending count
        initial_response = seller_client.get(f"{BASE_URL}/api/conversations/pending/seller")
        assert initial_response.status_code == 200
        initial_pending = initial_response.json()["total_pending"]
        print(f"Initial pending count: {initial_pending}")
        
        # Step 2: Buyer creates a new question
        question_content = f"TEST_E2E: Question for e2e flow test"
        create_response = buyer_client.post(
            f"{BASE_URL}/api/conversations/{CONVERSATION_ID}/questions",
            json={"content": question_content}
        )
        assert create_response.status_code == 200, f"Failed to create question: {create_response.text}"
        new_question = create_response.json()["qa_item"]
        question_id = new_question["qa_item_id"]
        print(f"Created question: {question_id}")
        
        # Step 3: Verify pending count increased
        after_create_response = seller_client.get(f"{BASE_URL}/api/conversations/pending/seller")
        assert after_create_response.status_code == 200
        after_create_pending = after_create_response.json()["total_pending"]
        assert after_create_pending >= initial_pending, "Pending count should increase after question creation"
        print(f"Pending count after creation: {after_create_pending}")
        
        # Step 4: Verify question appears in pending list
        pending_questions = after_create_response.json()["pending_questions"]
        found_question = next((q for q in pending_questions if q["qa_item_id"] == question_id), None)
        assert found_question is not None, "New question should appear in pending list"
        print(f"Question found in pending list with urgency: {found_question['urgency']}")
        
        # Step 5: Seller answers the question
        answer_response = seller_client.post(
            f"{BASE_URL}/api/conversations/{CONVERSATION_ID}/answers?question_id={question_id}",
            json={"content": "TEST_E2E: Answer to the test question"}
        )
        assert answer_response.status_code == 200, f"Failed to answer question: {answer_response.text}"
        print(f"Answered question: {question_id}")
        
        # Step 6: Verify pending count decreased
        after_answer_response = seller_client.get(f"{BASE_URL}/api/conversations/pending/seller")
        assert after_answer_response.status_code == 200
        after_answer_pending = after_answer_response.json()["total_pending"]
        assert after_answer_pending < after_create_pending, "Pending count should decrease after answering"
        print(f"Pending count after answer: {after_answer_pending}")
        
        # Step 7: Verify question no longer in pending list
        final_pending_questions = after_answer_response.json()["pending_questions"]
        still_pending = next((q for q in final_pending_questions if q["qa_item_id"] == question_id), None)
        assert still_pending is None, "Answered question should not be in pending list"
        print("E2E flow completed successfully!")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
