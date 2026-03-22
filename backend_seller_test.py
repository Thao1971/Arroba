import requests
import sys
import json
from datetime import datetime
import time

class SellerFlowTester:
    def __init__(self, base_url="https://match-affinity-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.company_id = None
        self.deal_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=15)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=15)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=15)

            success = response.status_code == expected_status
            
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_data": None,
                "error": None
            }

            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    result["response_data"] = response.json()
                except:
                    result["response_data"] = response.text[:200]
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    result["error"] = error_data
                    print(f"   Error: {error_data}")
                except:
                    result["error"] = response.text[:200]
                    print(f"   Error: {response.text[:200]}")

            self.test_results.append(result)
            return success, response.json() if success and response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": None,
                "success": False,
                "response_data": None,
                "error": str(e)
            }
            self.test_results.append(result)
            return False, {}

    def test_seller_registration(self):
        """Test seller user registration"""
        test_user_data = {
            "email": "seller@test.com",
            "password": "testpass123",
            "first_name": "Test",
            "last_name": "Seller",
            "role": "seller"
        }
        
        success, response = self.run_test(
            "Seller Registration",
            "POST",
            "api/auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   ✅ Seller registration successful, token obtained")
            return True, response
        return success, response

    def test_seller_login(self):
        """Test seller login"""
        login_data = {
            "email": "seller@test.com",
            "password": "testpass123"
        }
        
        success, response = self.run_test(
            "Seller Login",
            "POST",
            "api/auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   ✅ Seller login successful, token obtained")
            return True, response
        return success, response

    def test_create_company(self):
        """Test company creation (Step 1 of wizard)"""
        company_data = {
            "legal_name": "Test Digital Agency SL",
            "trade_name": "Test Agency",
            "cif": "B12345678",
            "country": "España",
            "region": "Madrid",
            "city": "Madrid",
            "company_type": "digital_agency",
            "sectors": ["seo", "sem", "social"],
            "specializations": ["performance", "ecommerce"],
            "founded_year": 2018,
            "employees_count": 25,
            "description": "Agencia digital especializada en performance marketing y ecommerce",
            "highlights": [
                "Cartera de 50+ clientes recurrentes",
                "Crecimiento del 30% anual",
                "Equipo especializado en ecommerce"
            ],
            "website": "https://testagency.com",
            "linkedin": "https://linkedin.com/company/testagency"
        }
        
        success, response = self.run_test(
            "Create Company",
            "POST",
            "api/companies",
            200,
            data=company_data
        )
        
        if success and 'company_id' in response:
            self.company_id = response['company_id']
            print(f"   ✅ Company created with ID: {self.company_id}")
            return True, response
        return success, response

    def test_update_financials(self):
        """Test financial data update (Step 2 of wizard)"""
        if not self.company_id:
            print("❌ Cannot test financials - no company_id")
            return False, {}
            
        financials_data = {
            "financials": [
                {
                    "year": 2023,
                    "revenue": 1500000,
                    "ebitda": 300000,
                    "ebitda_margin": 20.0,
                    "recurring_revenue_pct": 70,
                    "client_concentration_top5": 40,
                    "growth_rate": 25
                },
                {
                    "year": 2022,
                    "revenue": 1200000,
                    "ebitda": 240000,
                    "ebitda_margin": 20.0,
                    "recurring_revenue_pct": 65,
                    "client_concentration_top5": 45,
                    "growth_rate": 20
                }
            ],
            "valuation_inputs": {
                "founder_dependency": "medium",
                "recurring_revenue_type": "retainer",
                "main_clients": 15,
                "client_retention_rate": 85,
                "tech_assets": True,
                "proprietary_ip": False
            }
        }
        
        success, response = self.run_test(
            "Update Company Financials",
            "POST",
            f"api/companies/{self.company_id}/financials",
            200,
            data=financials_data
        )
        
        return success, response

    def test_calculate_valuation(self):
        """Test valuation calculation (Step 3 of wizard)"""
        if not self.company_id:
            print("❌ Cannot test valuation - no company_id")
            return False, {}
            
        success, response = self.run_test(
            "Calculate Company Valuation",
            "POST",
            f"api/companies/{self.company_id}/calculate-valuation",
            200
        )
        
        if success and 'valuation' in response:
            valuation = response['valuation']
            print(f"   ✅ Valuation calculated: {valuation.get('valuation_min', 0):,.0f}€ - {valuation.get('valuation_max', 0):,.0f}€")
        
        return success, response

    def test_create_deal(self):
        """Test deal creation (Step 4 of wizard)"""
        if not self.company_id:
            print("❌ Cannot test deal creation - no company_id")
            return False, {}
            
        deal_data = {
            "company_id": self.company_id,
            "operation_types_allowed": ["full_sale"],
            "asking_price": 4500000,
            "price_negotiable": True
        }
        
        success, response = self.run_test(
            "Create Deal",
            "POST",
            "api/deals",
            200,
            data=deal_data
        )
        
        if success and 'deal_id' in response:
            self.deal_id = response['deal_id']
            print(f"   ✅ Deal created with ID: {self.deal_id}")
            return True, response
        return success, response

    def test_generate_infomemo(self):
        """Test infomemo generation (Step 5 of wizard)"""
        if not self.company_id:
            print("❌ Cannot test infomemo generation - no company_id")
            return False, {}
            
        print("   ⏳ Generating infomemo with AI (this may take 10-15 seconds)...")
        
        success, response = self.run_test(
            "Generate Infomemo",
            "POST",
            f"api/infomemo/generate/{self.company_id}",
            200
        )
        
        if success and 'infomemo' in response:
            infomemo = response['infomemo']
            content_length = len(infomemo.get('content', ''))
            print(f"   ✅ Infomemo generated with {content_length} characters")
        
        return success, response

    def test_activate_deal(self):
        """Test deal activation (publish)"""
        if not self.deal_id:
            print("❌ Cannot test deal activation - no deal_id")
            return False, {}
            
        success, response = self.run_test(
            "Activate Deal",
            "POST",
            f"api/deals/{self.deal_id}/activate",
            200
        )
        
        if success and response.get('status') == 'published':
            print(f"   ✅ Deal activated and published")
        
        return success, response

    def test_get_deal(self):
        """Test getting deal details"""
        if not self.deal_id:
            print("❌ Cannot test get deal - no deal_id")
            return False, {}
            
        success, response = self.run_test(
            "Get Deal Details",
            "GET",
            f"api/deals/{self.deal_id}",
            200
        )
        
        return success, response

    def test_list_companies(self):
        """Test listing user's companies"""
        success, response = self.run_test(
            "List My Companies",
            "GET",
            "api/companies",
            200
        )
        
        return success, response

    def test_list_deals(self):
        """Test listing user's deals"""
        success, response = self.run_test(
            "List My Deals",
            "GET",
            "api/deals",
            200
        )
        
        return success, response

    def print_summary(self):
        """Print test summary"""
        print(f"\n{'='*60}")
        print(f"📊 SELLER FLOW TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.company_id:
            print(f"Company ID: {self.company_id}")
        if self.deal_id:
            print(f"Deal ID: {self.deal_id}")
        
        if self.tests_run - self.tests_passed > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    error_msg = result['error'] or f"Status {result.get('actual_status', 'unknown')} != {result['expected_status']}"
                    print(f"   - {result['test_name']}: {error_msg}")

def main():
    print("🚀 Starting Arroba Seller Flow Tests...")
    print("=" * 60)
    
    tester = SellerFlowTester()
    
    # Test seller authentication
    print("\n🔐 Testing Seller Authentication...")
    auth_success, _ = tester.test_seller_login()
    
    if not auth_success:
        print("   ⚠️ Login failed, trying registration...")
        auth_success, _ = tester.test_seller_registration()
    
    if not auth_success:
        print("❌ Authentication failed, cannot continue with seller flow tests")
        tester.print_summary()
        return 1
    
    # Test seller wizard flow
    print("\n📋 Testing Seller Wizard Flow...")
    
    # Step 1: Create company
    company_success, _ = tester.test_create_company()
    
    if company_success:
        # Step 2: Add financials
        tester.test_update_financials()
        
        # Step 3: Calculate valuation
        tester.test_calculate_valuation()
        
        # Step 4: Create deal
        deal_success, _ = tester.test_create_deal()
        
        if deal_success:
            # Step 5: Generate infomemo
            tester.test_generate_infomemo()
            
            # Test deal activation
            tester.test_activate_deal()
            
            # Test deal retrieval
            tester.test_get_deal()
    
    # Test listing endpoints
    print("\n📋 Testing List Endpoints...")
    tester.test_list_companies()
    tester.test_list_deals()
    
    # Print summary
    tester.print_summary()
    
    # Save results to file
    with open('/app/test_reports/seller_flow_test_results.json', 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "failed_tests": tester.tests_run - tester.tests_passed,
            "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0,
            "company_id": tester.company_id,
            "deal_id": tester.deal_id,
            "test_results": tester.test_results
        }, f, indent=2)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())