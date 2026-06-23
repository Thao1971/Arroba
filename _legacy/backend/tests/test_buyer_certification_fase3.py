"""
Test Buyer Certification & Plan Differentiation - Fase 3
Tests the /api/buyer/certification endpoint and certification logic.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
BUYER1_EMAIL = "carlos.ruiz@capitaliberica.es"
BUYER1_PASSWORD = "demo2026"
BUYER2_EMAIL = "james.harris@techventures.co.uk"
BUYER2_PASSWORD = "demo2026"


@pytest.fixture(scope="module")
def buyer1_token():
    """Get auth token for buyer 1 (Carlos)"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": BUYER1_EMAIL,
        "password": BUYER1_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Could not authenticate buyer1: {response.text}")


@pytest.fixture(scope="module")
def buyer2_token():
    """Get auth token for buyer 2 (James)"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": BUYER2_EMAIL,
        "password": BUYER2_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Could not authenticate buyer2: {response.text}")


class TestBuyerCertificationEndpoint:
    """Tests for GET /api/buyer/certification endpoint"""

    def test_certification_endpoint_returns_200(self, buyer1_token):
        """Certification endpoint should return 200 for authenticated buyer"""
        response = requests.get(
            f"{BASE_URL}/api/buyer/certification",
            headers={"Authorization": f"Bearer {buyer1_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    def test_certification_response_structure(self, buyer1_token):
        """Response should have certification and plan objects"""
        response = requests.get(
            f"{BASE_URL}/api/buyer/certification",
            headers={"Authorization": f"Bearer {buyer1_token}"}
        )
        data = response.json()
        
        # Top-level structure
        assert "certification" in data, "Missing 'certification' object"
        assert "plan" in data, "Missing 'plan' object"

    def test_certification_object_fields(self, buyer1_token):
        """Certification object should have all required fields"""
        response = requests.get(
            f"{BASE_URL}/api/buyer/certification",
            headers={"Authorization": f"Bearer {buyer1_token}"}
        )
        cert = response.json()["certification"]
        
        # Required fields
        assert "level" in cert, "Missing 'level' field"
        assert "level_label" in cert, "Missing 'level_label' field"
        assert "score" in cert, "Missing 'score' field"
        assert "criteria" in cert, "Missing 'criteria' array"
        assert "nda_count" in cert, "Missing 'nda_count' field"
        assert "completed_count" in cert, "Missing 'completed_count' field"
        assert "total_count" in cert, "Missing 'total_count' field"

    def test_certification_has_7_criteria(self, buyer1_token):
        """Certification should have exactly 7 criteria"""
        response = requests.get(
            f"{BASE_URL}/api/buyer/certification",
            headers={"Authorization": f"Bearer {buyer1_token}"}
        )
        criteria = response.json()["certification"]["criteria"]
        
        assert len(criteria) == 7, f"Expected 7 criteria, got {len(criteria)}"
        
        # Verify all expected criteria IDs
        expected_ids = [
            "email_verified", "profile_complete", "company_declared",
            "job_title_declared", "investment_thesis", "nda_signed", "corporate_email"
        ]
        actual_ids = [c["id"] for c in criteria]
        for expected_id in expected_ids:
            assert expected_id in actual_ids, f"Missing criterion: {expected_id}"

    def test_criteria_have_weight_and_completed(self, buyer1_token):
        """Each criterion should have weight (1 or 2) and completed boolean"""
        response = requests.get(
            f"{BASE_URL}/api/buyer/certification",
            headers={"Authorization": f"Bearer {buyer1_token}"}
        )
        criteria = response.json()["certification"]["criteria"]
        
        for c in criteria:
            assert "id" in c, f"Criterion missing 'id'"
            assert "label" in c, f"Criterion {c.get('id')} missing 'label'"
            assert "weight" in c, f"Criterion {c.get('id')} missing 'weight'"
            assert "completed" in c, f"Criterion {c.get('id')} missing 'completed'"
            assert c["weight"] in [1, 2], f"Criterion {c['id']} has invalid weight: {c['weight']}"
            assert isinstance(c["completed"], bool), f"Criterion {c['id']} 'completed' should be boolean"

    def test_criteria_weights_sum_to_10(self, buyer1_token):
        """Total weight of all criteria should be 10"""
        response = requests.get(
            f"{BASE_URL}/api/buyer/certification",
            headers={"Authorization": f"Bearer {buyer1_token}"}
        )
        criteria = response.json()["certification"]["criteria"]
        
        total_weight = sum(c["weight"] for c in criteria)
        assert total_weight == 10, f"Expected total weight 10, got {total_weight}"

    def test_certification_level_verified_at_50_percent(self, buyer1_token):
        """Carlos with 50% score should be 'verified' level"""
        response = requests.get(
            f"{BASE_URL}/api/buyer/certification",
            headers={"Authorization": f"Bearer {buyer1_token}"}
        )
        cert = response.json()["certification"]
        
        # Carlos has 4/7 criteria met = 5/10 weight = 50%
        assert cert["score"] == 50, f"Expected score 50, got {cert['score']}"
        assert cert["level"] == "verified", f"Expected level 'verified', got {cert['level']}"
        assert cert["level_label"] == "Comprador Verificado", f"Unexpected level_label: {cert['level_label']}"


class TestPlanObject:
    """Tests for plan object in certification response"""

    def test_plan_object_fields(self, buyer1_token):
        """Plan object should have all required fields"""
        response = requests.get(
            f"{BASE_URL}/api/buyer/certification",
            headers={"Authorization": f"Bearer {buyer1_token}"}
        )
        plan = response.json()["plan"]
        
        required_fields = [
            "tier", "label", "monthly_interaction_limit", "interactions_used",
            "can_view_full_detail", "can_manage_interactions", "can_access_dataroom",
            "priority_access", "features_summary", "upgrade_message"
        ]
        for field in required_fields:
            assert field in plan, f"Missing plan field: {field}"

    def test_free_plan_tier(self, buyer1_token):
        """Carlos should be on free plan"""
        response = requests.get(
            f"{BASE_URL}/api/buyer/certification",
            headers={"Authorization": f"Bearer {buyer1_token}"}
        )
        plan = response.json()["plan"]
        
        assert plan["tier"] == "free", f"Expected tier 'free', got {plan['tier']}"
        assert plan["label"] == "Free", f"Expected label 'Free', got {plan['label']}"

    def test_free_plan_features_disabled(self, buyer1_token):
        """Free plan should have all premium features disabled"""
        response = requests.get(
            f"{BASE_URL}/api/buyer/certification",
            headers={"Authorization": f"Bearer {buyer1_token}"}
        )
        plan = response.json()["plan"]
        
        assert plan["can_view_full_detail"] == False, "Free plan should not have can_view_full_detail"
        assert plan["can_manage_interactions"] == False, "Free plan should not have can_manage_interactions"
        assert plan["can_access_dataroom"] == False, "Free plan should not have can_access_dataroom"
        assert plan["priority_access"] == False, "Free plan should not have priority_access"

    def test_free_plan_interaction_limit_zero(self, buyer1_token):
        """Free plan should have 0 monthly interaction limit"""
        response = requests.get(
            f"{BASE_URL}/api/buyer/certification",
            headers={"Authorization": f"Bearer {buyer1_token}"}
        )
        plan = response.json()["plan"]
        
        assert plan["monthly_interaction_limit"] == 0, f"Expected 0 interactions, got {plan['monthly_interaction_limit']}"

    def test_free_plan_has_upgrade_message(self, buyer1_token):
        """Free plan should have upgrade message"""
        response = requests.get(
            f"{BASE_URL}/api/buyer/certification",
            headers={"Authorization": f"Bearer {buyer1_token}"}
        )
        plan = response.json()["plan"]
        
        assert plan["upgrade_message"] is not None, "Free plan should have upgrade_message"
        assert len(plan["upgrade_message"]) > 0, "upgrade_message should not be empty"
        assert "Pro" in plan["upgrade_message"], "upgrade_message should mention Pro"


class TestCorporateEmailCheck:
    """Tests for corporate email verification"""

    def test_corporate_email_detected_for_carlos(self, buyer1_token):
        """capitaliberica.es should be detected as corporate email"""
        response = requests.get(
            f"{BASE_URL}/api/buyer/certification",
            headers={"Authorization": f"Bearer {buyer1_token}"}
        )
        criteria = response.json()["certification"]["criteria"]
        
        corporate_email_criterion = next((c for c in criteria if c["id"] == "corporate_email"), None)
        assert corporate_email_criterion is not None, "Missing corporate_email criterion"
        assert corporate_email_criterion["completed"] == True, "capitaliberica.es should be corporate"

    def test_corporate_email_detected_for_james(self, buyer2_token):
        """techventures.co.uk should be detected as corporate email"""
        response = requests.get(
            f"{BASE_URL}/api/buyer/certification",
            headers={"Authorization": f"Bearer {buyer2_token}"}
        )
        criteria = response.json()["certification"]["criteria"]
        
        corporate_email_criterion = next((c for c in criteria if c["id"] == "corporate_email"), None)
        assert corporate_email_criterion is not None, "Missing corporate_email criterion"
        assert corporate_email_criterion["completed"] == True, "techventures.co.uk should be corporate"


class TestCertificationLevelThresholds:
    """Tests for certification level thresholds"""

    def test_level_labels_in_spanish(self, buyer1_token):
        """Level labels should be in Spanish"""
        response = requests.get(
            f"{BASE_URL}/api/buyer/certification",
            headers={"Authorization": f"Bearer {buyer1_token}"}
        )
        cert = response.json()["certification"]
        
        # Verified level should have Spanish label
        valid_labels = ["Comprador Certificado", "Comprador Verificado", "Comprador Básico"]
        assert cert["level_label"] in valid_labels, f"Unexpected level_label: {cert['level_label']}"

    def test_criteria_labels_in_spanish(self, buyer1_token):
        """All criteria labels should be in Spanish"""
        response = requests.get(
            f"{BASE_URL}/api/buyer/certification",
            headers={"Authorization": f"Bearer {buyer1_token}"}
        )
        criteria = response.json()["certification"]["criteria"]
        
        expected_labels = {
            "email_verified": "Email verificado",
            "profile_complete": "Perfil de comprador completo",
            "company_declared": "Empresa declarada",
            "job_title_declared": "Cargo declarado",
            "investment_thesis": "Tesis de inversión definida",
            "nda_signed": "Al menos un NDA firmado",
            "corporate_email": "Email corporativo",
        }
        
        for c in criteria:
            expected = expected_labels.get(c["id"])
            assert c["label"] == expected, f"Criterion {c['id']} has wrong label: {c['label']}, expected: {expected}"


class TestNonBuyerAccess:
    """Tests for non-buyer access to certification endpoint"""

    def test_seller_cannot_access_certification(self):
        """Seller should get error when accessing buyer certification"""
        # Login as seller
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "maria.garcia@techsolutions.es",
            "password": "demo2026"
        })
        if login_response.status_code != 200:
            pytest.skip("Could not authenticate seller")
        
        seller_token = login_response.json().get("access_token")
        
        response = requests.get(
            f"{BASE_URL}/api/buyer/certification",
            headers={"Authorization": f"Bearer {seller_token}"}
        )
        
        # Should return error for non-buyer
        data = response.json()
        assert "error" in data, "Should return error for seller"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
