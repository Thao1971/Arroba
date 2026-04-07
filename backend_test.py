import requests
import sys
import json
from datetime import datetime

class ArrobaAPITester:
    def __init__(self, base_url="https://arroba-ma-platform.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

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
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

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

    def test_health_check(self):
        """Test health check endpoint"""
        return self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )

    def test_marketplace_sectors(self):
        """Test marketplace sectors endpoint"""
        return self.run_test(
            "Marketplace Sectors",
            "GET", 
            "api/marketplace/sectors",
            200
        )

    def test_marketplace_stats(self):
        """Test marketplace stats endpoint"""
        return self.run_test(
            "Marketplace Stats",
            "GET",
            "api/marketplace/stats", 
            200
        )

    def test_marketplace_deals(self):
        """Test marketplace deals listing"""
        return self.run_test(
            "Marketplace Deals",
            "GET",
            "api/marketplace/deals",
            200
        )

    def test_marketplace_featured_deals(self):
        """Test featured deals endpoint"""
        return self.run_test(
            "Featured Deals",
            "GET",
            "api/marketplace/featured",
            200
        )

    def test_user_registration(self):
        """Test user registration"""
        test_user_data = {
            "email": f"test_user_{datetime.now().strftime('%Y%m%d_%H%M%S')}@test.com",
            "password": "TestPass123!",
            "first_name": "Test",
            "last_name": "User",
            "role": "buyer"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "api/auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   ✅ Registration successful, token obtained")
            return True, response
        return success, response

    def test_user_login(self):
        """Test user login with invalid credentials (should fail)"""
        login_data = {
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        }
        
        return self.run_test(
            "User Login (Invalid)",
            "POST",
            "api/auth/login",
            401,  # Expecting 401 for invalid credentials
            data=login_data
        )

    def test_protected_endpoint(self):
        """Test a protected endpoint (requires authentication)"""
        return self.run_test(
            "Get Current User",
            "GET",
            "api/auth/me",
            200 if self.token else 401
        )

    def print_summary(self):
        """Print test summary"""
        print(f"\n{'='*50}")
        print(f"📊 TEST SUMMARY")
        print(f"{'='*50}")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_run - self.tests_passed > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    error_msg = result['error'] or f"Status {result.get('actual_status', 'unknown')} != {result['expected_status']}"
                    print(f"   - {result['test_name']}: {error_msg}")

def main():
    print("🚀 Starting Arroba API Tests...")
    print("=" * 50)
    
    tester = ArrobaAPITester()
    
    # Test public endpoints
    print("\n📋 Testing Public Endpoints...")
    tester.test_health_check()
    tester.test_marketplace_sectors()
    tester.test_marketplace_stats()
    tester.test_marketplace_deals()
    tester.test_marketplace_featured_deals()
    
    # Test authentication
    print("\n🔐 Testing Authentication...")
    tester.test_user_registration()
    tester.test_user_login()
    
    # Test protected endpoints
    print("\n🛡️ Testing Protected Endpoints...")
    tester.test_protected_endpoint()
    
    # Print summary
    tester.print_summary()
    
    # Save results to file
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "failed_tests": tester.tests_run - tester.tests_passed,
            "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0,
            "test_results": tester.test_results
        }, f, indent=2)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())