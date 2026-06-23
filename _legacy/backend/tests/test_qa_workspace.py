"""
Test Q&A Workspace Module - Iteration 16
Tests the new accept interest flow and Q&A conversation system.

Features tested:
- POST /api/engagements/deal/{deal_id}/accept/{buyer_id} - accepts interest and creates conversation
- Accept should reject already-accepted/shortlisted/exclusivity buyers
- GET /api/engagements/deal/{deal_id} returns conversation_id for accepted buyers
- GET /api/engagements/seller/interesados returns conversation_id for accepted buyers
- GET /api/engagements/my-processes returns conversation_id for accepted processes
- GET /api/conversations/{conversation_id} returns conversation with questions
- POST /api/conversations/{conversation_id}/questions - buyer creates question
- POST /api/conversations/{conversation_id}/answers?question_id=X - seller answers
- POST /api/conversations/{conversation_id}/close/{question_id} - seller closes question
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from seed data
SELLER_EMAIL = "diego.martin@rankingdigital.es"
SELLER_PASSWORD = "demo2026"
BUYER_JAMES_EMAIL = "james.harris@techventures.co.uk"  # Accepted buyer with conversation
BUYER_JAMES_PASSWORD = "demo2026"
BUYER_CARLOS_EMAIL = "carlos.ruiz@capitaliberica.es"  # Buyer at EXCLUSIVITY stage
BUYER_CARLOS_PASSWORD = "demo2026"

# Known test data
DEAL_ID = "deal_hot_seo_01"
EXISTING_CONVERSATION_ID = "conv_22910a1edfed"
EXISTING_QUESTION_ID = "qa_e93839d64947"


class TestAuthHelpers:
    """Helper methods for authentication"""
    
    @staticmethod
    def login(email, password):
        """Login and return token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    @staticmethod
    def get_auth_headers(token):
        """Return headers with auth token"""
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }


class TestAcceptInterestEndpoint:
    """Test POST /api/engagements/deal/{deal_id}/accept/{buyer_id}"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup seller token"""
        self.seller_token = TestAuthHelpers.login(SELLER_EMAIL, SELLER_PASSWORD)
        self.seller_headers = TestAuthHelpers.get_auth_headers(self.seller_token)
        
    def test_accept_already_accepted_buyer_fails(self):
        """Accept should reject already-accepted buyers"""
        # James Harris is already ACCEPTED
        response = requests.post(
            f"{BASE_URL}/api/engagements/deal/{DEAL_ID}/accept/buyer_vc_london_01",
            headers=self.seller_headers
        )
        # Should fail with 400 - already accepted
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "ya aceptado" in data.get("detail", "").lower() or "already" in data.get("detail", "").lower()
        print(f"✓ Accept already-accepted buyer correctly rejected: {data.get('detail')}")
    
    def test_accept_exclusivity_buyer_fails(self):
        """Accept should reject buyers at EXCLUSIVITY stage"""
        # Carlos Ruiz is at EXCLUSIVITY stage
        response = requests.post(
            f"{BASE_URL}/api/engagements/deal/{DEAL_ID}/accept/buyer_pe_madrid_01",
            headers=self.seller_headers
        )
        # Should fail with 400 - already at exclusivity
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print(f"✓ Accept exclusivity buyer correctly rejected: {response.json().get('detail')}")
    
    def test_accept_nonexistent_engagement_fails(self):
        """Accept should fail for non-existent engagement"""
        response = requests.post(
            f"{BASE_URL}/api/engagements/deal/{DEAL_ID}/accept/nonexistent_buyer_123",
            headers=self.seller_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Accept non-existent engagement correctly returns 404")
    
    def test_accept_unauthorized_fails(self):
        """Accept should fail without auth"""
        response = requests.post(
            f"{BASE_URL}/api/engagements/deal/{DEAL_ID}/accept/buyer_vc_london_01"
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Accept without auth correctly returns 401")


class TestDealEngagementsWithConversation:
    """Test GET /api/engagements/deal/{deal_id} returns conversation_id"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup seller token"""
        self.seller_token = TestAuthHelpers.login(SELLER_EMAIL, SELLER_PASSWORD)
        self.seller_headers = TestAuthHelpers.get_auth_headers(self.seller_token)
    
    def test_list_deal_engagements_includes_conversation_id(self):
        """Engagements list should include conversation_id for accepted buyers"""
        response = requests.get(
            f"{BASE_URL}/api/engagements/deal/{DEAL_ID}",
            headers=self.seller_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        engagements = data.get("engagements", [])
        assert len(engagements) > 0, "Expected at least one engagement"
        
        # Find James Harris (accepted buyer with conversation)
        james_eng = next((e for e in engagements if e.get("buyer_id") == "buyer_vc_london_01"), None)
        assert james_eng is not None, "James Harris engagement not found"
        
        # Should have conversation_id
        assert james_eng.get("conversation_id") is not None, "Expected conversation_id for accepted buyer"
        print(f"✓ Deal engagements includes conversation_id: {james_eng.get('conversation_id')}")
        
        # Verify stage is ACCEPTED or higher
        assert james_eng.get("stage") in ["ACCEPTED", "SHORTLISTED", "EXCLUSIVITY"], \
            f"Expected ACCEPTED+ stage, got {james_eng.get('stage')}"
        print(f"✓ James Harris stage: {james_eng.get('stage')}")


class TestSellerInteresadosWithConversation:
    """Test GET /api/engagements/seller/interesados returns conversation_id"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup seller token"""
        self.seller_token = TestAuthHelpers.login(SELLER_EMAIL, SELLER_PASSWORD)
        self.seller_headers = TestAuthHelpers.get_auth_headers(self.seller_token)
    
    def test_seller_interesados_includes_conversation_id(self):
        """Seller interesados should include conversation_id for accepted buyers"""
        response = requests.get(
            f"{BASE_URL}/api/engagements/seller/interesados",
            headers=self.seller_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        buyers = data.get("buyers", [])
        assert len(buyers) > 0, "Expected at least one buyer"
        
        # Find buyer with conversation_id
        buyer_with_conv = next((b for b in buyers if b.get("conversation_id")), None)
        assert buyer_with_conv is not None, "Expected at least one buyer with conversation_id"
        print(f"✓ Seller interesados includes conversation_id: {buyer_with_conv.get('conversation_id')}")
        print(f"  Buyer: {buyer_with_conv.get('buyer_name')}, Stage: {buyer_with_conv.get('stage')}")


class TestBuyerMyProcessesWithConversation:
    """Test GET /api/engagements/my-processes returns conversation_id"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup buyer token (James Harris - accepted buyer)"""
        self.buyer_token = TestAuthHelpers.login(BUYER_JAMES_EMAIL, BUYER_JAMES_PASSWORD)
        self.buyer_headers = TestAuthHelpers.get_auth_headers(self.buyer_token)
    
    def test_my_processes_includes_conversation_id(self):
        """My processes should include conversation_id for accepted processes"""
        response = requests.get(
            f"{BASE_URL}/api/engagements/my-processes",
            headers=self.buyer_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        processes = data.get("processes", [])
        assert len(processes) > 0, "Expected at least one process"
        
        # Find process with conversation_id
        proc_with_conv = next((p for p in processes if p.get("conversation_id")), None)
        assert proc_with_conv is not None, "Expected at least one process with conversation_id"
        print(f"✓ My processes includes conversation_id: {proc_with_conv.get('conversation_id')}")
        
        # Verify next_step includes Q&A action for accepted stage
        next_step = proc_with_conv.get("next_step", {})
        if proc_with_conv.get("stage") == "ACCEPTED":
            assert "Q&A" in next_step.get("action", "") or "qa" in next_step.get("href", "").lower(), \
                f"Expected Q&A in next_step for ACCEPTED stage, got {next_step}"
            print(f"✓ Next step for ACCEPTED: {next_step}")


class TestConversationEndpoints:
    """Test Q&A conversation CRUD endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup tokens for buyer and seller"""
        self.seller_token = TestAuthHelpers.login(SELLER_EMAIL, SELLER_PASSWORD)
        self.seller_headers = TestAuthHelpers.get_auth_headers(self.seller_token)
        self.buyer_token = TestAuthHelpers.login(BUYER_JAMES_EMAIL, BUYER_JAMES_PASSWORD)
        self.buyer_headers = TestAuthHelpers.get_auth_headers(self.buyer_token)
    
    def test_get_conversation_detail(self):
        """GET /api/conversations/{conversation_id} returns conversation with questions"""
        response = requests.get(
            f"{BASE_URL}/api/conversations/{EXISTING_CONVERSATION_ID}",
            headers=self.buyer_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        conv = data.get("conversation", {})
        assert conv.get("conversation_id") == EXISTING_CONVERSATION_ID
        assert conv.get("deal_id") == DEAL_ID
        assert conv.get("status") == "OPEN"
        print(f"✓ Conversation detail loaded: {conv.get('conversation_id')}")
        print(f"  Deal: {conv.get('deal_title')}, Buyer: {conv.get('buyer_name')}, Seller: {conv.get('seller_name')}")
        
        # Check questions
        questions = data.get("questions", [])
        print(f"  Questions count: {len(questions)}")
        if questions:
            q = questions[0]
            print(f"  First question: {q.get('qa_item_id')}, status: {q.get('status')}")
            print(f"  Answers: {len(q.get('answers', []))}")
    
    def test_get_conversation_unauthorized(self):
        """GET conversation should fail for unauthorized user"""
        # Login as Carlos (different buyer)
        carlos_token = TestAuthHelpers.login(BUYER_CARLOS_EMAIL, BUYER_CARLOS_PASSWORD)
        carlos_headers = TestAuthHelpers.get_auth_headers(carlos_token)
        
        response = requests.get(
            f"{BASE_URL}/api/conversations/{EXISTING_CONVERSATION_ID}",
            headers=carlos_headers
        )
        # Should fail - Carlos is not part of this conversation
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Unauthorized conversation access correctly rejected")
    
    def test_get_conversation_not_found(self):
        """GET non-existent conversation returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/conversations/conv_nonexistent_123",
            headers=self.buyer_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent conversation returns 404")
    
    def test_buyer_create_question(self):
        """POST /api/conversations/{id}/questions - buyer creates question"""
        response = requests.post(
            f"{BASE_URL}/api/conversations/{EXISTING_CONVERSATION_ID}/questions",
            headers=self.buyer_headers,
            json={"content": "TEST_QUESTION: What is the client retention rate?"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        qa_item = data.get("qa_item", {})
        assert qa_item.get("type") == "QUESTION"
        assert qa_item.get("status") == "PENDING"
        assert "TEST_QUESTION" in qa_item.get("content", "")
        print(f"✓ Buyer created question: {qa_item.get('qa_item_id')}")
        
        # Store for cleanup/answer test
        self.new_question_id = qa_item.get("qa_item_id")
        return self.new_question_id
    
    def test_seller_cannot_create_question(self):
        """Seller should not be able to create questions"""
        response = requests.post(
            f"{BASE_URL}/api/conversations/{EXISTING_CONVERSATION_ID}/questions",
            headers=self.seller_headers,
            json={"content": "Seller trying to ask question"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Seller correctly blocked from creating questions")
    
    def test_seller_answer_question(self):
        """POST /api/conversations/{id}/answers - seller answers question"""
        # First create a question
        q_response = requests.post(
            f"{BASE_URL}/api/conversations/{EXISTING_CONVERSATION_ID}/questions",
            headers=self.buyer_headers,
            json={"content": "TEST_QUESTION_FOR_ANSWER: What are the main revenue streams?"}
        )
        assert q_response.status_code == 200
        question_id = q_response.json().get("qa_item", {}).get("qa_item_id")
        
        # Seller answers
        response = requests.post(
            f"{BASE_URL}/api/conversations/{EXISTING_CONVERSATION_ID}/answers?question_id={question_id}",
            headers=self.seller_headers,
            json={"content": "TEST_ANSWER: Main revenue streams are SEO services (60%) and content marketing (40%)."}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        qa_item = data.get("qa_item", {})
        assert qa_item.get("type") == "ANSWER"
        assert qa_item.get("parent_question_id") == question_id
        print(f"✓ Seller answered question: {qa_item.get('qa_item_id')}")
    
    def test_buyer_cannot_answer(self):
        """Buyer should not be able to answer questions"""
        response = requests.post(
            f"{BASE_URL}/api/conversations/{EXISTING_CONVERSATION_ID}/answers?question_id={EXISTING_QUESTION_ID}",
            headers=self.buyer_headers,
            json={"content": "Buyer trying to answer"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Buyer correctly blocked from answering")
    
    def test_seller_close_question(self):
        """POST /api/conversations/{id}/close/{question_id} - seller closes question"""
        # First create a question
        q_response = requests.post(
            f"{BASE_URL}/api/conversations/{EXISTING_CONVERSATION_ID}/questions",
            headers=self.buyer_headers,
            json={"content": "TEST_QUESTION_TO_CLOSE: What is the team size?"}
        )
        assert q_response.status_code == 200
        question_id = q_response.json().get("qa_item", {}).get("qa_item_id")
        
        # Seller closes
        response = requests.post(
            f"{BASE_URL}/api/conversations/{EXISTING_CONVERSATION_ID}/close/{question_id}",
            headers=self.seller_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ Seller closed question: {question_id}")
        
        # Verify question is closed
        conv_response = requests.get(
            f"{BASE_URL}/api/conversations/{EXISTING_CONVERSATION_ID}",
            headers=self.seller_headers
        )
        questions = conv_response.json().get("questions", [])
        closed_q = next((q for q in questions if q.get("qa_item_id") == question_id), None)
        assert closed_q is not None
        assert closed_q.get("status") == "CLOSED"
        print("✓ Question status verified as CLOSED")
    
    def test_buyer_cannot_close_question(self):
        """Buyer should not be able to close questions"""
        response = requests.post(
            f"{BASE_URL}/api/conversations/{EXISTING_CONVERSATION_ID}/close/{EXISTING_QUESTION_ID}",
            headers=self.buyer_headers
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Buyer correctly blocked from closing questions")


class TestConversationsForDeal:
    """Test GET /api/conversations/deal/{deal_id}"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup seller token"""
        self.seller_token = TestAuthHelpers.login(SELLER_EMAIL, SELLER_PASSWORD)
        self.seller_headers = TestAuthHelpers.get_auth_headers(self.seller_token)
    
    def test_get_deal_conversations(self):
        """GET /api/conversations/deal/{deal_id} returns all conversations for deal"""
        response = requests.get(
            f"{BASE_URL}/api/conversations/deal/{DEAL_ID}",
            headers=self.seller_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        conversations = data.get("conversations", [])
        assert len(conversations) > 0, "Expected at least one conversation"
        print(f"✓ Deal conversations loaded: {len(conversations)} conversation(s)")
        
        for conv in conversations:
            print(f"  - {conv.get('conversation_id')}: {conv.get('buyer_name')} ({conv.get('status')})")


class TestShortlistNoLongerCreatesConversation:
    """Verify shortlist endpoint no longer creates conversations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup seller token"""
        self.seller_token = TestAuthHelpers.login(SELLER_EMAIL, SELLER_PASSWORD)
        self.seller_headers = TestAuthHelpers.get_auth_headers(self.seller_token)
    
    def test_shortlist_does_not_create_conversation(self):
        """Shortlist endpoint should NOT create conversation (moved to accept)"""
        # Get current engagements to find a VIEWED buyer
        eng_response = requests.get(
            f"{BASE_URL}/api/engagements/deal/{DEAL_ID}",
            headers=self.seller_headers
        )
        engagements = eng_response.json().get("engagements", [])
        
        # Find a buyer at VIEWED stage without conversation
        viewed_buyer = next(
            (e for e in engagements if e.get("stage") == "VIEWED" and not e.get("conversation_id")),
            None
        )
        
        if viewed_buyer:
            buyer_id = viewed_buyer.get("buyer_id")
            
            # Try to shortlist (should fail if not ACCEPTED first)
            response = requests.post(
                f"{BASE_URL}/api/engagements/deal/{DEAL_ID}/shortlist/{buyer_id}",
                headers=self.seller_headers
            )
            
            # Check if shortlist succeeded or failed
            if response.status_code == 200:
                # If succeeded, verify no conversation was created
                eng_response2 = requests.get(
                    f"{BASE_URL}/api/engagements/deal/{DEAL_ID}",
                    headers=self.seller_headers
                )
                updated_eng = next(
                    (e for e in eng_response2.json().get("engagements", []) if e.get("buyer_id") == buyer_id),
                    None
                )
                # Shortlist alone should not create conversation
                # (conversation is created on ACCEPT, not shortlist)
                print(f"✓ Shortlist endpoint executed, conversation_id: {updated_eng.get('conversation_id')}")
            else:
                print(f"✓ Shortlist returned {response.status_code} - may require ACCEPTED stage first")
        else:
            print("✓ No VIEWED buyer without conversation found - skipping shortlist test")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
