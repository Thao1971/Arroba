"""
Plans & Pricing API Tests - Updated for V2 with interaction limits
Tests the /api/plans/public endpoint for the pricing page.
Features tested:
- Plans grouped by seller/buyer/advisor
- monthly_interaction_limit for each plan
- plan_tagline for each plan
- advisor_rules for advisor plan
- conditions array for advisor plan
- interaction_types in response
- Fee rules for each role
- 7 FAQ items (including new 'Qué cuenta como interacción')
- Annual prices with 10% discount
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
        """Test response has plans, fee_rules, faq, and interaction_types keys"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        
        assert "plans" in data, "Response missing 'plans' key"
        assert "fee_rules" in data, "Response missing 'fee_rules' key"
        assert "faq" in data, "Response missing 'faq' key"
        assert "interaction_types" in data, "Response missing 'interaction_types' key"
        print("✓ Response has correct structure (plans, fee_rules, faq, interaction_types)")
    
    def test_plans_grouped_by_role(self):
        """Test plans are grouped by seller, buyer, advisor"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        plans = data["plans"]
        
        assert "seller" in plans, "Missing 'seller' plans group"
        assert "buyer" in plans, "Missing 'buyer' plans group"
        assert "advisor" in plans, "Missing 'advisor' plans group"
        print("✓ Plans grouped by seller, buyer, advisor")


class TestSellerPlans:
    """Tests for seller plans with interaction limits"""
    
    def test_seller_plans_count_and_content(self):
        """Test seller has 3 plans: Free, Plus (149€), Premium (499€)"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        seller_plans = data["plans"]["seller"]
        
        assert len(seller_plans) == 3, f"Expected 3 seller plans, got {len(seller_plans)}"
        
        plan_names = [p["plan_name"] for p in seller_plans]
        assert "Seller Free" in plan_names, "Missing 'Seller Free' plan"
        assert "Seller Plus" in plan_names, "Missing 'Seller Plus' plan"
        assert "Seller Premium" in plan_names, "Missing 'Seller Premium' plan"
        
        for plan in seller_plans:
            if plan["plan_name"] == "Seller Free":
                assert plan["monthly_price"] == 0, "Seller Free should be 0€"
            elif plan["plan_name"] == "Seller Plus":
                assert plan["monthly_price"] == 149, "Seller Plus should be 149€"
            elif plan["plan_name"] == "Seller Premium":
                assert plan["monthly_price"] == 499, "Seller Premium should be 499€"
        
        print("✓ Seller plans: Free (0€), Plus (149€), Premium (499€)")
    
    def test_seller_interaction_limits(self):
        """Test seller plans have correct interaction limits: Free=0, Plus=5, Premium=-1(unlimited)"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        seller_plans = data["plans"]["seller"]
        
        for plan in seller_plans:
            assert "monthly_interaction_limit" in plan, f"Plan {plan['plan_name']} missing monthly_interaction_limit"
            
            if plan["plan_name"] == "Seller Free":
                assert plan["monthly_interaction_limit"] == 0, "Seller Free should have 0 interactions"
            elif plan["plan_name"] == "Seller Plus":
                assert plan["monthly_interaction_limit"] == 5, "Seller Plus should have 5 interactions"
            elif plan["plan_name"] == "Seller Premium":
                assert plan["monthly_interaction_limit"] == -1, "Seller Premium should have unlimited (-1) interactions"
        
        print("✓ Seller interaction limits: Free=0, Plus=5, Premium=unlimited(-1)")
    
    def test_seller_annual_prices(self):
        """Test seller annual prices with 10% discount"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        seller_plans = data["plans"]["seller"]
        
        for plan in seller_plans:
            if plan["plan_name"] == "Seller Plus":
                assert plan["annual_price"] == 1609, f"Seller Plus annual should be 1609€, got {plan['annual_price']}"
            elif plan["plan_name"] == "Seller Premium":
                assert plan["annual_price"] == 5389, f"Seller Premium annual should be 5389€, got {plan['annual_price']}"
        
        print("✓ Seller annual prices: Plus=1609€, Premium=5389€")
    
    def test_seller_plans_have_taglines(self):
        """Test all seller plans have plan_tagline"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        seller_plans = data["plans"]["seller"]
        
        for plan in seller_plans:
            assert "plan_tagline" in plan, f"Plan {plan['plan_name']} missing plan_tagline"
            assert len(plan["plan_tagline"]) > 0, f"Plan {plan['plan_name']} has empty tagline"
        
        print("✓ All seller plans have taglines")


class TestBuyerPlans:
    """Tests for buyer plans with interaction limits"""
    
    def test_buyer_plans_count_and_content(self):
        """Test buyer has 3 plans: Free, Pro (149€), Pro+ (349€)"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        buyer_plans = data["plans"]["buyer"]
        
        assert len(buyer_plans) == 3, f"Expected 3 buyer plans, got {len(buyer_plans)}"
        
        plan_names = [p["plan_name"] for p in buyer_plans]
        assert "Buyer Free" in plan_names, "Missing 'Buyer Free' plan"
        assert "Buyer Pro" in plan_names, "Missing 'Buyer Pro' plan"
        assert "Buyer Pro+" in plan_names, "Missing 'Buyer Pro+' plan"
        
        for plan in buyer_plans:
            if plan["plan_name"] == "Buyer Free":
                assert plan["monthly_price"] == 0, "Buyer Free should be 0€"
            elif plan["plan_name"] == "Buyer Pro":
                assert plan["monthly_price"] == 149, "Buyer Pro should be 149€"
            elif plan["plan_name"] == "Buyer Pro+":
                assert plan["monthly_price"] == 349, "Buyer Pro+ should be 349€"
        
        print("✓ Buyer plans: Free (0€), Pro (149€), Pro+ (349€)")
    
    def test_buyer_interaction_limits(self):
        """Test buyer plans have correct interaction limits: Free=0, Pro=5, Pro+=-1(unlimited)"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        buyer_plans = data["plans"]["buyer"]
        
        for plan in buyer_plans:
            assert "monthly_interaction_limit" in plan, f"Plan {plan['plan_name']} missing monthly_interaction_limit"
            
            if plan["plan_name"] == "Buyer Free":
                assert plan["monthly_interaction_limit"] == 0, "Buyer Free should have 0 interactions"
            elif plan["plan_name"] == "Buyer Pro":
                assert plan["monthly_interaction_limit"] == 5, "Buyer Pro should have 5 interactions"
            elif plan["plan_name"] == "Buyer Pro+":
                assert plan["monthly_interaction_limit"] == -1, "Buyer Pro+ should have unlimited (-1) interactions"
        
        print("✓ Buyer interaction limits: Free=0, Pro=5, Pro+=unlimited(-1)")
    
    def test_buyer_annual_prices(self):
        """Test buyer annual prices with 10% discount"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        buyer_plans = data["plans"]["buyer"]
        
        for plan in buyer_plans:
            if plan["plan_name"] == "Buyer Pro":
                assert plan["annual_price"] == 1609, f"Buyer Pro annual should be 1609€, got {plan['annual_price']}"
            elif plan["plan_name"] == "Buyer Pro+":
                assert plan["annual_price"] == 3769, f"Buyer Pro+ annual should be 3769€, got {plan['annual_price']}"
        
        print("✓ Buyer annual prices: Pro=1609€, Pro+=3769€")
    
    def test_buyer_plans_have_taglines(self):
        """Test all buyer plans have plan_tagline"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        buyer_plans = data["plans"]["buyer"]
        
        for plan in buyer_plans:
            assert "plan_tagline" in plan, f"Plan {plan['plan_name']} missing plan_tagline"
            assert len(plan["plan_tagline"]) > 0, f"Plan {plan['plan_name']} has empty tagline"
        
        print("✓ All buyer plans have taglines")


class TestAdvisorPlan:
    """Tests for advisor plan with advisor_rules and conditions"""
    
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
    
    def test_advisor_rules(self):
        """Test advisor plan has advisor_rules with free_mandates=1, paid_threshold=2, monthly_fee=250"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        advisor_plan = data["plans"]["advisor"][0]
        
        assert "advisor_rules" in advisor_plan, "Advisor plan missing advisor_rules"
        rules = advisor_plan["advisor_rules"]
        
        assert rules["free_mandates"] == 1, f"Expected free_mandates=1, got {rules['free_mandates']}"
        assert rules["paid_threshold"] == 2, f"Expected paid_threshold=2, got {rules['paid_threshold']}"
        assert rules["monthly_fee_from_threshold"] == 250, f"Expected monthly_fee=250, got {rules['monthly_fee_from_threshold']}"
        assert 6 in rules["allowed_commitment_months"], "Missing 6 in allowed_commitment_months"
        assert 12 in rules["allowed_commitment_months"], "Missing 12 in allowed_commitment_months"
        
        print("✓ Advisor rules: free_mandates=1, paid_threshold=2, monthly_fee=250, commitment=[6,12]")
    
    def test_advisor_conditions(self):
        """Test advisor plan has conditions array"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        advisor_plan = data["plans"]["advisor"][0]
        
        assert "conditions" in advisor_plan, "Advisor plan missing conditions"
        conditions = advisor_plan["conditions"]
        
        assert isinstance(conditions, list), "Conditions should be a list"
        assert len(conditions) == 3, f"Expected 3 conditions, got {len(conditions)}"
        
        # Check for expected conditions content
        conditions_text = " ".join(conditions).lower()
        assert "6" in conditions_text or "12" in conditions_text, "Missing commitment months in conditions"
        assert "mensual" in conditions_text, "Missing 'mensual' in conditions"
        assert "trazabilidad" in conditions_text, "Missing 'trazabilidad' in conditions"
        
        print("✓ Advisor conditions: 3 conditions (commitment, no monthly, traceability)")
    
    def test_advisor_plan_has_tagline(self):
        """Test advisor plan has plan_tagline"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        advisor_plan = data["plans"]["advisor"][0]
        
        assert "plan_tagline" in advisor_plan, "Advisor plan missing plan_tagline"
        assert len(advisor_plan["plan_tagline"]) > 0, "Advisor plan has empty tagline"
        
        print("✓ Advisor plan has tagline")


class TestFeeRulesAndFAQ:
    """Tests for fee rules and FAQ items"""
    
    def test_fee_rules_for_each_role(self):
        """Test fee rules exist for seller, buyer, advisor"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        fee_rules = data["fee_rules"]
        
        assert "seller" in fee_rules, "Missing seller fee rule"
        assert "buyer" in fee_rules, "Missing buyer fee rule"
        assert "advisor" in fee_rules, "Missing advisor fee rule"
        
        assert fee_rules["seller"]["percentage"] == 2.9, "Seller success fee should be 2.9%"
        assert fee_rules["seller"]["fee_type"] == "success_fee"
        
        assert fee_rules["buyer"]["percentage"] == 1.0, "Buyer success fee should be 1%"
        assert fee_rules["buyer"]["fee_type"] == "success_fee"
        
        assert fee_rules["advisor"]["percentage"] == 15, "Advisor revenue share should be 15%"
        assert fee_rules["advisor"]["fee_type"] == "revenue_share"
        
        print("✓ Fee rules: Seller 2.9%, Buyer 1%, Advisor 15%")
    
    def test_faq_items_count(self):
        """Test FAQ has 7 items (including new 'Qué cuenta como interacción')"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        faq = data["faq"]
        
        assert len(faq) == 7, f"Expected 7 FAQ items, got {len(faq)}"
        print("✓ FAQ has 7 items")
    
    def test_faq_has_interaction_question(self):
        """Test FAQ includes 'Qué cuenta como interacción' question"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        faq = data["faq"]
        
        questions = [item["question"] for item in faq]
        interaction_question = next((q for q in questions if "interacción" in q.lower()), None)
        
        assert interaction_question is not None, "Missing FAQ question about interactions"
        print("✓ FAQ includes 'Qué cuenta como interacción' question")
    
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


class TestInteractionTypes:
    """Tests for interaction_types in API response"""
    
    def test_interaction_types_returned(self):
        """Test interaction_types is returned in API response"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        
        assert "interaction_types" in data, "Response missing interaction_types"
        interaction_types = data["interaction_types"]
        
        assert isinstance(interaction_types, list), "interaction_types should be a list"
        assert len(interaction_types) == 3, f"Expected 3 interaction types, got {len(interaction_types)}"
        
        print("✓ interaction_types returned with 3 items")
    
    def test_interaction_types_structure(self):
        """Test each interaction type has type, label, weight"""
        response = requests.get(f"{BASE_URL}/api/plans/public")
        data = response.json()
        interaction_types = data["interaction_types"]
        
        expected_types = ["interest", "contact_unlock", "meeting_scheduled"]
        
        for it in interaction_types:
            assert "type" in it, "Interaction type missing 'type' field"
            assert "label" in it, "Interaction type missing 'label' field"
            assert "weight" in it, "Interaction type missing 'weight' field"
            assert it["type"] in expected_types, f"Unexpected interaction type: {it['type']}"
        
        print("✓ Interaction types have correct structure (type, label, weight)")


class TestPlanFeatures:
    """Tests for plan features and badges"""
    
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
        
        seller_premium = next((p for p in data["plans"]["seller"] if p["plan_name"] == "Seller Premium"), None)
        assert seller_premium is not None
        assert seller_premium["badge"] == "RECOMENDADO", "Seller Premium should have RECOMENDADO badge"
        
        buyer_proplus = next((p for p in data["plans"]["buyer"] if p["plan_name"] == "Buyer Pro+"), None)
        assert buyer_proplus is not None
        assert buyer_proplus["badge"] == "RECOMENDADO", "Buyer Pro+ should have RECOMENDADO badge"
        
        advisor_partner = data["plans"]["advisor"][0]
        assert advisor_partner["badge"] == "PARTNER", "Advisor Partner should have PARTNER badge"
        
        print("✓ Badges: Seller Premium (RECOMENDADO), Buyer Pro+ (RECOMENDADO), Advisor (PARTNER)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
