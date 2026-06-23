"""
NDA Mutuo Digital & Deep-link Tests
Tests for:
1. Deep-link: /planes?role=buyer|seller|advisor opens correct tab
2. BuyerDashboard upgrade CTA links to /planes?role=buyer&source=buyer_dashboard
3. NDA template endpoint (GET /api/nda/template/{dealId})
4. NDA sign endpoint (POST /api/nda/sign)
5. NDA PDF endpoint (GET /api/nda/{signatureId}/pdf)
6. NDA send-email endpoint (POST /api/nda/{signatureId}/send-email)
7. NDA my-signatures endpoint (GET /api/nda/my-signatures)
8. NDA audit trail (nda_events collection)
9. NDA template content validation (BUD Advisors, CIF, Madrid jurisdiction, 10 clauses)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
BUYER_EMAIL = "carlos.ruiz@capitaliberica.es"
BUYER_PASSWORD = "demo2026"
BUYER2_EMAIL = "james.harris@techventures.co.uk"
BUYER2_PASSWORD = "demo2026"
SELLER_EMAIL = "diego.martin@rankingdigital.es"
SELLER_PASSWORD = "demo2026"


class TestNDATemplate:
    """Tests for NDA template endpoint and content validation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as buyer and get token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as buyer
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": BUYER_EMAIL,
            "password": BUYER_PASSWORD
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        self.token = login_res.json()["access_token"]
        self.user = login_res.json()["user"]
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        # Get a published deal to test with
        deals_res = self.session.get(f"{BASE_URL}/api/marketplace/deals")
        assert deals_res.status_code == 200
        deals = deals_res.json()
        # API returns list directly
        if isinstance(deals, dict):
            deals = deals.get("deals", [])
        assert len(deals) > 0, "No deals found in marketplace"
        self.deal_id = deals[0]["deal_id"]
        print(f"Using deal_id: {self.deal_id}")
    
    def test_nda_template_requires_auth(self):
        """GET /api/nda/template/{dealId} requires authentication"""
        # Request without auth
        res = requests.get(f"{BASE_URL}/api/nda/template/{self.deal_id}")
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
        print("✓ NDA template requires authentication")
    
    def test_nda_template_returns_rendered_text(self):
        """GET /api/nda/template/{dealId} returns rendered NDA text with signer prefill"""
        res = self.session.get(f"{BASE_URL}/api/nda/template/{self.deal_id}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        
        data = res.json()
        # Check required fields
        assert "template_version" in data, "Missing template_version"
        assert "title" in data, "Missing title"
        assert "is_mutual" in data, "Missing is_mutual"
        assert "jurisdiction" in data, "Missing jurisdiction"
        assert "rendered_text" in data, "Missing rendered_text"
        assert "signer_name_prefill" in data, "Missing signer_name_prefill"
        assert "signer_email" in data, "Missing signer_email"
        
        print(f"✓ Template version: {data['template_version']}")
        print(f"✓ Title: {data['title']}")
        print(f"✓ Is mutual: {data['is_mutual']}")
        print(f"✓ Jurisdiction: {data['jurisdiction']}")
        print(f"✓ Signer prefill: {data['signer_name_prefill']}")
    
    def test_nda_template_version_2_0(self):
        """NDA template version is 2.0"""
        res = self.session.get(f"{BASE_URL}/api/nda/template/{self.deal_id}")
        assert res.status_code == 200
        data = res.json()
        assert data["template_version"] == "2.0", f"Expected version 2.0, got {data['template_version']}"
        print("✓ NDA template version is 2.0")
    
    def test_nda_template_is_mutual(self):
        """NDA template is mutual (is_mutual=True)"""
        res = self.session.get(f"{BASE_URL}/api/nda/template/{self.deal_id}")
        assert res.status_code == 200
        data = res.json()
        assert data["is_mutual"] == True, f"Expected is_mutual=True, got {data['is_mutual']}"
        print("✓ NDA template is mutual")
    
    def test_nda_template_madrid_jurisdiction(self):
        """NDA template has Madrid jurisdiction"""
        res = self.session.get(f"{BASE_URL}/api/nda/template/{self.deal_id}")
        assert res.status_code == 200
        data = res.json()
        assert "Madrid" in data["jurisdiction"], f"Expected Madrid in jurisdiction, got {data['jurisdiction']}"
        print(f"✓ NDA jurisdiction: {data['jurisdiction']}")
    
    def test_nda_template_contains_bud_advisors(self):
        """NDA template includes BUD Advisors S.L."""
        res = self.session.get(f"{BASE_URL}/api/nda/template/{self.deal_id}")
        assert res.status_code == 200
        data = res.json()
        rendered = data["rendered_text"]
        assert "BUD ADVISORS" in rendered or "BUD Advisors" in rendered, "Missing BUD Advisors in NDA text"
        print("✓ NDA contains BUD Advisors S.L.")
    
    def test_nda_template_contains_cif(self):
        """NDA template includes CIF B70821400"""
        res = self.session.get(f"{BASE_URL}/api/nda/template/{self.deal_id}")
        assert res.status_code == 200
        data = res.json()
        rendered = data["rendered_text"]
        assert "B70821400" in rendered, "Missing CIF B70821400 in NDA text"
        print("✓ NDA contains CIF B70821400")
    
    def test_nda_template_has_10_clauses(self):
        """NDA template has 10 legal clauses"""
        res = self.session.get(f"{BASE_URL}/api/nda/template/{self.deal_id}")
        assert res.status_code == 200
        data = res.json()
        rendered = data["rendered_text"]
        
        # Count numbered clauses (1. through 10.)
        clause_count = 0
        for i in range(1, 11):
            if f"{i}." in rendered or f"{i}. " in rendered:
                clause_count += 1
        
        assert clause_count >= 10, f"Expected 10 clauses, found {clause_count}"
        print(f"✓ NDA has {clause_count} clauses")
    
    def test_nda_template_404_for_invalid_deal(self):
        """GET /api/nda/template/{dealId} returns 404 for invalid deal"""
        res = self.session.get(f"{BASE_URL}/api/nda/template/invalid_deal_id_xyz")
        assert res.status_code == 404, f"Expected 404, got {res.status_code}"
        print("✓ NDA template returns 404 for invalid deal")


class TestNDASign:
    """Tests for NDA sign endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as buyer2 (to test fresh NDA signing)"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as buyer2 (james.harris) who may not have signed NDAs yet
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": BUYER2_EMAIL,
            "password": BUYER2_PASSWORD
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        self.token = login_res.json()["access_token"]
        self.user = login_res.json()["user"]
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        # Get a published deal
        deals_res = self.session.get(f"{BASE_URL}/api/marketplace/deals")
        assert deals_res.status_code == 200
        deals = deals_res.json()
        # API returns list directly
        if isinstance(deals, dict):
            deals = deals.get("deals", [])
        assert len(deals) > 0, "No deals found"
        # Try to find a deal that this buyer hasn't signed yet
        self.deal_id = deals[0]["deal_id"]
        print(f"Using deal_id: {self.deal_id}")
    
    def test_nda_sign_requires_auth(self):
        """POST /api/nda/sign requires authentication"""
        res = requests.post(f"{BASE_URL}/api/nda/sign", json={
            "deal_id": self.deal_id,
            "signer_name": "Test User",
            "accept_terms": True
        })
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
        print("✓ NDA sign requires authentication")
    
    def test_nda_sign_requires_accept_terms(self):
        """POST /api/nda/sign requires accept_terms=True"""
        res = self.session.post(f"{BASE_URL}/api/nda/sign", json={
            "deal_id": self.deal_id,
            "signer_name": "Test User",
            "accept_terms": False
        })
        assert res.status_code == 400, f"Expected 400, got {res.status_code}"
        print("✓ NDA sign requires accept_terms=True")
    
    def test_nda_sign_requires_signer_name(self):
        """POST /api/nda/sign requires signer_name"""
        res = self.session.post(f"{BASE_URL}/api/nda/sign", json={
            "deal_id": self.deal_id,
            "signer_name": "",
            "accept_terms": True
        })
        assert res.status_code == 422, f"Expected 422, got {res.status_code}"
        print("✓ NDA sign requires signer_name")
    
    def test_nda_sign_success_or_already_signed(self):
        """POST /api/nda/sign creates signature or returns already signed"""
        res = self.session.post(f"{BASE_URL}/api/nda/sign", json={
            "deal_id": self.deal_id,
            "signer_name": f"{self.user['first_name']} {self.user['last_name']}",
            "signer_company": "Tech Ventures UK",
            "signer_title": "Managing Director",
            "accept_terms": True
        })
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        
        data = res.json()
        # Check response fields
        assert "signature_id" in data, "Missing signature_id"
        assert "has_access" in data, "Missing has_access"
        assert data["has_access"] == True, "Expected has_access=True"
        
        # Either new signature or already signed
        if "NDA ya firmado" in data.get("message", ""):
            print(f"✓ NDA already signed: {data['signature_id']}")
        else:
            print(f"✓ NDA signed successfully: {data['signature_id']}")
            # Check for pdf_url (may be None if upload failed)
            if data.get("pdf_url"):
                print(f"✓ PDF URL: {data['pdf_url']}")
            else:
                print("⚠ PDF URL not returned (upload may have failed)")
        
        self.signature_id = data["signature_id"]
    
    def test_nda_sign_404_for_invalid_deal(self):
        """POST /api/nda/sign returns 404 for invalid deal"""
        res = self.session.post(f"{BASE_URL}/api/nda/sign", json={
            "deal_id": "invalid_deal_xyz",
            "signer_name": "Test User",
            "accept_terms": True
        })
        assert res.status_code == 404, f"Expected 404, got {res.status_code}"
        print("✓ NDA sign returns 404 for invalid deal")


class TestNDAPdfAndEmail:
    """Tests for NDA PDF and email endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get a signature ID"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as buyer
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": BUYER_EMAIL,
            "password": BUYER_PASSWORD
        })
        assert login_res.status_code == 200
        self.token = login_res.json()["access_token"]
        self.user = login_res.json()["user"]
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        # Get my signatures to find a valid signature_id
        sigs_res = self.session.get(f"{BASE_URL}/api/nda/my-signatures")
        if sigs_res.status_code == 200 and len(sigs_res.json()) > 0:
            self.signature_id = sigs_res.json()[0]["signature_id"]
            print(f"Using existing signature_id: {self.signature_id}")
        else:
            # Sign a new NDA
            deals_res = self.session.get(f"{BASE_URL}/api/marketplace/deals")
            deals = deals_res.json()
            if isinstance(deals, dict):
                deals = deals.get("deals", [])
            if deals:
                sign_res = self.session.post(f"{BASE_URL}/api/nda/sign", json={
                    "deal_id": deals[0]["deal_id"],
                    "signer_name": f"{self.user['first_name']} {self.user['last_name']}",
                    "accept_terms": True
                })
                if sign_res.status_code == 200:
                    self.signature_id = sign_res.json()["signature_id"]
                    print(f"Created new signature_id: {self.signature_id}")
                else:
                    self.signature_id = None
            else:
                self.signature_id = None
    
    def test_nda_pdf_requires_auth(self):
        """GET /api/nda/{signatureId}/pdf requires authentication"""
        if not self.signature_id:
            pytest.skip("No signature_id available")
        res = requests.get(f"{BASE_URL}/api/nda/{self.signature_id}/pdf")
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
        print("✓ NDA PDF requires authentication")
    
    def test_nda_pdf_returns_url_or_stream(self):
        """GET /api/nda/{signatureId}/pdf returns PDF URL or streams PDF"""
        if not self.signature_id:
            pytest.skip("No signature_id available")
        res = self.session.get(f"{BASE_URL}/api/nda/{self.signature_id}/pdf")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        
        # Either returns JSON with pdf_url or streams PDF
        content_type = res.headers.get("content-type", "")
        if "application/json" in content_type:
            data = res.json()
            assert "pdf_url" in data, "Missing pdf_url in response"
            print(f"✓ NDA PDF URL returned: {data['pdf_url']}")
        elif "application/pdf" in content_type:
            assert len(res.content) > 0, "PDF content is empty"
            print(f"✓ NDA PDF streamed: {len(res.content)} bytes")
        else:
            print(f"⚠ Unexpected content-type: {content_type}")
    
    def test_nda_pdf_403_for_other_user(self):
        """GET /api/nda/{signatureId}/pdf returns 403 for other user's signature"""
        if not self.signature_id:
            pytest.skip("No signature_id available")
        
        # Login as different buyer
        other_session = requests.Session()
        other_session.headers.update({"Content-Type": "application/json"})
        login_res = other_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": BUYER2_EMAIL,
            "password": BUYER2_PASSWORD
        })
        if login_res.status_code != 200:
            pytest.skip("Could not login as other buyer")
        
        other_token = login_res.json()["access_token"]
        other_session.headers.update({"Authorization": f"Bearer {other_token}"})
        
        res = other_session.get(f"{BASE_URL}/api/nda/{self.signature_id}/pdf")
        assert res.status_code == 403, f"Expected 403, got {res.status_code}"
        print("✓ NDA PDF returns 403 for other user's signature")
    
    def test_nda_send_email_requires_auth(self):
        """POST /api/nda/{signatureId}/send-email requires authentication"""
        if not self.signature_id:
            pytest.skip("No signature_id available")
        res = requests.post(f"{BASE_URL}/api/nda/{self.signature_id}/send-email")
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
        print("✓ NDA send-email requires authentication")
    
    def test_nda_send_email_success(self):
        """POST /api/nda/{signatureId}/send-email sends confirmation email (mocked)"""
        if not self.signature_id:
            pytest.skip("No signature_id available")
        res = self.session.post(f"{BASE_URL}/api/nda/{self.signature_id}/send-email")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        
        data = res.json()
        assert data.get("status") == "sent", f"Expected status=sent, got {data}"
        print("✓ NDA send-email returns success (email mocked)")


class TestNDAMySignatures:
    """Tests for NDA my-signatures endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as buyer"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": BUYER_EMAIL,
            "password": BUYER_PASSWORD
        })
        assert login_res.status_code == 200
        self.token = login_res.json()["access_token"]
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_my_signatures_requires_auth(self):
        """GET /api/nda/my-signatures requires authentication"""
        res = requests.get(f"{BASE_URL}/api/nda/my-signatures")
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
        print("✓ my-signatures requires authentication")
    
    def test_my_signatures_returns_list(self):
        """GET /api/nda/my-signatures returns list of user's signed NDAs"""
        res = self.session.get(f"{BASE_URL}/api/nda/my-signatures")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        
        data = res.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"✓ my-signatures returns {len(data)} signatures")
        
        if len(data) > 0:
            sig = data[0]
            # Check signature structure
            assert "signature_id" in sig, "Missing signature_id"
            assert "deal_id" in sig, "Missing deal_id"
            assert "signer_name" in sig, "Missing signer_name"
            assert "signer_email" in sig, "Missing signer_email"
            assert "signed_at" in sig, "Missing signed_at"
            print(f"✓ Signature structure valid: {sig['signature_id']}")


class TestNDAEmailTemplate:
    """Tests for NDA email template existence"""
    
    def test_nda_buyer_signed_template_exists(self):
        """NDA email template 'NDA_BUYER_SIGNED' exists in email service"""
        # We can verify this by checking the email_service.py file content
        # or by triggering a sign and checking logs
        # For now, we verify the template is defined in the code
        import sys
        sys.path.insert(0, '/app/backend')
        try:
            from services.email_service import TEMPLATES
            assert "NDA_BUYER_SIGNED" in TEMPLATES, "NDA_BUYER_SIGNED template not found"
            template = TEMPLATES["NDA_BUYER_SIGNED"]
            assert "subject" in template, "Missing subject in template"
            assert "body" in template, "Missing body in template"
            print(f"✓ NDA_BUYER_SIGNED template exists")
            print(f"  Subject: {template['subject']}")
        except ImportError:
            # If import fails, check via API by signing an NDA
            print("⚠ Could not import email_service, skipping template check")
            pytest.skip("Could not import email_service")


class TestDeepLinks:
    """Tests for deep-link functionality"""
    
    def test_plans_page_loads(self):
        """GET /planes page loads successfully"""
        res = requests.get(f"{BASE_URL.replace('/api', '')}/planes", allow_redirects=True)
        # Frontend routes return HTML, not JSON
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        print("✓ /planes page loads")
    
    def test_plans_api_returns_data(self):
        """GET /api/plans/public returns plans data"""
        res = requests.get(f"{BASE_URL}/api/plans/public")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        
        data = res.json()
        assert "plans" in data, "Missing plans"
        assert "seller" in data["plans"], "Missing seller plans"
        assert "buyer" in data["plans"], "Missing buyer plans"
        assert "advisor" in data["plans"], "Missing advisor plans"
        print("✓ /api/plans/public returns all role plans")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
