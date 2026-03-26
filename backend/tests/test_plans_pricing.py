"""
Plans & Pricing API Tests
Tests the /api/plans/public endpoint for the pricing page.
Features tested:
- Plans grouped by seller/buyer/advisor
- Fee rules for each role
- FAQ items
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPlansPublicAPI:
    """Tests for GET /api/plans/public endpoint"""
    
    def test_plans_public_endpoint_returns_200(self):
        """Test that /api/plans/public returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/plans/public returns 200")
    
    def test_plans_public_returns_correct_structure(self):
        """Test response has plans, fee_rules, and faq keys"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        
        assert "plans" in data, "Response missing 'plans' key"
        assert "fee_rules" in data, "Response missing 'fee_rules' key"
        assert "faq" in data, "Response missing 'faq' key"
        print("✓ Response has correct structure (plans, fee_rules, faq)")
    
    def test_plans_grouped_by_role(self):
        """Test plans are grouped by seller, buyer, advisor"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        plans = data["plans"]
        
        assert "seller" in plans, "Missing 'seller' plans group"
        assert "buyer" in plans, "Missing 'buyer' plans group"
        assert "advisor" in plans, "Missing 'advisor' plans group"
        print("✓ Plans grouped by seller, buyer, advisor")
    
    def test_seller_plans_count_and_content(self):
        """Test seller has 3 plans: Free, Plus (149€), Premium (499€)"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        seller_plans = data["plans"]["seller"]
        
        assert len(seller_plans) == 3, f"Expected 3 seller plans, got {len(seller_plans)}"
        
        # Check plan names and prices
        plan_names = [p["plan_name"] for p in seller_plans]
        assert "Seller Free" in plan_names, "Missing 'Seller Free' plan"
        assert "Seller Plus" in plan_names, "Missing 'Seller Plus' plan"
        assert "Seller Premium" in plan_names, "Missing 'Seller Premium' plan"
        
        # Check prices
        for plan in seller_plans:
            if plan["plan_name"] == "Seller Free":
                assert plan["monthly_price"] == 0, "Seller Free should be 0€"
            elif plan["plan_name"] == "Seller Plus":
                assert plan["monthly_price"] == 149, "Seller Plus should be 149€"
            elif plan["plan_name"] == "Seller Premium":
                assert plan["monthly_price"] == 499, "Seller Premium should be 499€"
        
        print("✓ Seller plans: Free (0€), Plus (149€), Premium (499€)")
    
    def test_buyer_plans_count_and_content(self):
        """Test buyer has 3 plans: Free, Pro (149€), Pro+ (349€)"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        buyer_plans = data["plans"]["buyer"]
        
        assert len(buyer_plans) == 3, f"Expected 3 buyer plans, got {len(buyer_plans)}"
        
        # Check plan names and prices
        plan_names = [p["plan_name"] for p in buyer_plans]
        assert "Buyer Free" in plan_names, "Missing 'Buyer Free' plan"
        assert "Buyer Pro" in plan_names, "Missing 'Buyer Pro' plan"
        assert "Buyer Pro+" in plan_names, "Missing 'Buyer Pro+' plan"
        
        # Check prices
        for plan in buyer_plans:
            if plan["plan_name"] == "Buyer Free":
                assert plan["monthly_price"] == 0, "Buyer Free should be 0€"
            elif plan["plan_name"] == "Buyer Pro":
                assert plan["monthly_price"] == 149, "Buyer Pro should be 149€"
            elif plan["plan_name"] == "Buyer Pro+":
                assert plan["monthly_price"] == 349, "Buyer Pro+ should be 349€"
        
        print("✓ Buyer plans: Free (0€), Pro (149€), Pro+ (349€)")
    
    def test_advisor_plan_content(self):
        """Test advisor has single plan: Advisor Partner (15% revenue share)"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        advisor_plans = data["plans"]["advisor"]
        
        assert len(advisor_plans) == 1, f"Expected 1 advisor plan, got {len(advisor_plans)}"
        
        plan = advisor_plans[0]
        assert plan["plan_name"] == "Advisor Partner", f"Expected 'Advisor Partner', got {plan['plan_name']}"
        assert plan["revenue_share_pct"] == 15, f"Expected 15% revenue share, got {plan['revenue_share_pct']}"
        assert plan["billing_type"] == "revenue_share", f"Expected 'revenue_share' billing type"
        
        print("✓ Advisor plan: Advisor Partner (15% revenue share)")
    
    def test_fee_rules_for_each_role(self):
        """Test fee rules exist for seller, buyer, advisor"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        fee_rules = data["fee_rules"]
        
        assert "seller" in fee_rules, "Missing seller fee rule"
        assert "buyer" in fee_rules, "Missing buyer fee rule"
        assert "advisor" in fee_rules, "Missing advisor fee rule"
        
        # Check seller fee
        assert fee_rules["seller"]["percentage"] == 2.9, "Seller success fee should be 2.9%"
        assert fee_rules["seller"]["fee_type"] == "success_fee"
        
        # Check buyer fee
        assert fee_rules["buyer"]["percentage"] == 1.0, "Buyer success fee should be 1%"
        assert fee_rules["buyer"]["fee_type"] == "success_fee"
        
        # Check advisor fee
        assert fee_rules["advisor"]["percentage"] == 15, "Advisor revenue share should be 15%"
        assert fee_rules["advisor"]["fee_type"] == "revenue_share"
        
        print("✓ Fee rules: Seller 2.9%, Buyer 1%, Advisor 15%")
    
    def test_faq_items_count(self):
        """Test FAQ has 6 items"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        faq = data["faq"]
        
        assert len(faq) == 6, f"Expected 6 FAQ items, got {len(faq)}"
        print("✓ FAQ has 6 items")
    
    def test_faq_items_structure(self):
        """Test each FAQ item has question and answer"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        faq = data["faq"]
        
        for i, item in enumerate(faq):
            assert "question" in item, f"FAQ item {i} missing 'question'"
            assert "answer" in item, f"FAQ item {i} missing 'answer'"
            assert len(item["question"]) > 0, f"FAQ item {i} has empty question"
            assert len(item["answer"]) > 0, f"FAQ item {i} has empty answer"
        
        print("✓ All FAQ items have question and answer")
    
    def test_plan_features_exist(self):
        """Test each plan has features list"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        
        for role in ["seller", "buyer", "advisor"]:
            for plan in data["plans"][role]:
                assert "features" in plan, f"Plan {plan['plan_name']} missing features"
                assert isinstance(plan["features"], list), f"Plan {plan['plan_name']} features should be list"
                assert len(plan["features"]) > 0, f"Plan {plan['plan_name']} has no features"
        
        print("✓ All plans have features list")
    
    def test_plan_badges(self):
        """Test highlighted plans have correct badges"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        
        # Seller Premium should have RECOMENDADO badge
        seller_premium = next((p for p in data["plans"]["seller"] if p["plan_name"] == "Seller Premium"), None)
        assert seller_premium is not None
        assert seller_premium["badge"] == "RECOMENDADO", "Seller Premium should have RECOMENDADO badge"
        
        # Buyer Pro+ should have RECOMENDADO badge
        buyer_proplus = next((p for p in data["plans"]["buyer"] if p["plan_name"] == "Buyer Pro+"), None)
        assert buyer_proplus is not None
        assert buyer_proplus["badge"] == "RECOMENDADO", "Buyer Pro+ should have RECOMENDADO badge"
        
        # Advisor Partner should have PARTNER badge
        advisor_partner = data["plans"]["advisor"][0]
        assert advisor_partner["badge"] == "PARTNER", "Advisor Partner should have PARTNER badge"
        
        print("✓ Badges: Seller Premium (RECOMENDADO), Buyer Pro+ (RECOMENDADO), Advisor (PARTNER)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
