#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for Workshop Management System
Tests all endpoints including authentication, customer management, services, payments, and WhatsApp integration.
"""

import requests
import json
import sys
from datetime import datetime
import time

# Get backend URL from frontend .env
BACKEND_URL = "https://repo-improver-2.preview.emergentagent.com/api"

class WorkshopAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.auth_token = None
        self.test_user_data = {
            "username": "workshop_owner_test",
            "password": "SecurePass123!",
            "email": "owner@workshop.com",
            "workshop_name": "AutoFix Workshop",
            "role": "owner"
        }
        self.test_customer_id = None
        self.test_session_id = None
        self.test_service_id = None
        self.test_payment_id = None
        self.results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        
        # Add auth header if token exists
        if self.auth_token and headers is None:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
        elif self.auth_token and headers:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            return None, str(e)
    
    def test_api_health(self):
        """Test if API is accessible"""
        print("\n=== Testing API Health ===")
        response = self.make_request("GET", "/")
        
        if response is None:
            self.log_result("API Health Check", False, "Failed to connect to API", "Connection error")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "message" in data:
                    self.log_result("API Health Check", True, "API is accessible and responding")
                    return True
            except:
                pass
        
        self.log_result("API Health Check", False, f"API returned status {response.status_code}", response.text[:200])
        return False
    
    def test_user_registration(self):
        """Test user registration"""
        print("\n=== Testing User Registration ===")
        
        response = self.make_request("POST", "/auth/register", self.test_user_data)
        
        if response is None:
            self.log_result("User Registration", False, "Failed to make registration request")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.auth_token = data["access_token"]
                    self.log_result("User Registration", True, "User registered successfully with token")
                    return True
            except:
                pass
        
        # Check if user already exists
        if response.status_code == 400:
            try:
                error_data = response.json()
                if "already registered" in error_data.get("detail", "").lower():
                    self.log_result("User Registration", True, "User already exists (expected for repeated tests)")
                    # Try to login instead
                    return self.test_user_login()
            except:
                pass
        
        self.log_result("User Registration", False, f"Registration failed with status {response.status_code}", response.text[:200])
        return False
    
    def test_user_login(self):
        """Test user login"""
        print("\n=== Testing User Login ===")
        
        login_data = {
            "username": self.test_user_data["username"],
            "password": self.test_user_data["password"]
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response is None:
            self.log_result("User Login", False, "Failed to make login request")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.auth_token = data["access_token"]
                    self.log_result("User Login", True, "User logged in successfully")
                    return True
            except:
                pass
        
        self.log_result("User Login", False, f"Login failed with status {response.status_code}", response.text[:200])
        return False
    
    def test_auth_me(self):
        """Test getting current user info"""
        print("\n=== Testing Auth Me Endpoint ===")
        
        if not self.auth_token:
            self.log_result("Auth Me", False, "No auth token available")
            return False
        
        response = self.make_request("GET", "/auth/me")
        
        if response is None:
            self.log_result("Auth Me", False, "Failed to make auth/me request")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "username" in data and data["username"] == self.test_user_data["username"]:
                    self.log_result("Auth Me", True, "Successfully retrieved user info")
                    return True
            except:
                pass
        
        self.log_result("Auth Me", False, f"Auth me failed with status {response.status_code}", response.text[:200])
        return False
    
    def test_create_customer(self):
        """Test creating a customer"""
        print("\n=== Testing Customer Creation ===")
        
        if not self.auth_token:
            self.log_result("Create Customer", False, "No auth token available")
            return False
        
        customer_data = {
            "name": "John Doe",
            "phone": "081234567890"
        }
        
        response = self.make_request("POST", "/customers", customer_data)
        
        if response is None:
            self.log_result("Create Customer", False, "Failed to make create customer request")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "id" in data and "name" in data and data["name"] == customer_data["name"]:
                    self.test_customer_id = data["id"]
                    self.log_result("Create Customer", True, f"Customer created successfully with ID: {self.test_customer_id}")
                    return True
            except:
                pass
        
        self.log_result("Create Customer", False, f"Create customer failed with status {response.status_code}", response.text[:200])
        return False
    
    def test_list_customers(self):
        """Test listing customers"""
        print("\n=== Testing List Customers ===")
        
        if not self.auth_token:
            self.log_result("List Customers", False, "No auth token available")
            return False
        
        response = self.make_request("GET", "/customers")
        
        if response is None:
            self.log_result("List Customers", False, "Failed to make list customers request")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("List Customers", True, f"Successfully retrieved {len(data)} customers")
                    return True
            except:
                pass
        
        self.log_result("List Customers", False, f"List customers failed with status {response.status_code}", response.text[:200])
        return False
    
    def test_customer_summary(self):
        """Test getting customer summary"""
        print("\n=== Testing Customer Summary ===")
        
        if not self.auth_token or not self.test_customer_id:
            self.log_result("Customer Summary", False, "No auth token or customer ID available")
            return False
        
        response = self.make_request("GET", f"/customers/{self.test_customer_id}/summary")
        
        if response is None:
            self.log_result("Customer Summary", False, "Failed to make customer summary request")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "customer" in data and "service_sessions" in data:
                    self.log_result("Customer Summary", True, "Successfully retrieved customer summary")
                    return True
            except:
                pass
        
        self.log_result("Customer Summary", False, f"Customer summary failed with status {response.status_code}", response.text[:200])
        return False
    
    def test_create_service_session(self):
        """Test creating a service session"""
        print("\n=== Testing Service Session Creation ===")
        
        if not self.auth_token or not self.test_customer_id:
            self.log_result("Create Service Session", False, "No auth token or customer ID available")
            return False
        
        session_data = {
            "session_name": "Oil Change Service",
            "customer_id": self.test_customer_id
        }
        
        response = self.make_request("POST", "/service-sessions", session_data)
        
        if response is None:
            self.log_result("Create Service Session", False, "Failed to make create service session request")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "id" in data and "session_name" in data:
                    self.test_session_id = data["id"]
                    self.log_result("Create Service Session", True, f"Service session created successfully with ID: {self.test_session_id}")
                    return True
            except:
                pass
        
        self.log_result("Create Service Session", False, f"Create service session failed with status {response.status_code}", response.text[:200])
        return False
    
    def test_list_customer_sessions(self):
        """Test listing customer service sessions"""
        print("\n=== Testing List Customer Sessions ===")
        
        if not self.auth_token or not self.test_customer_id:
            self.log_result("List Customer Sessions", False, "No auth token or customer ID available")
            return False
        
        response = self.make_request("GET", f"/customers/{self.test_customer_id}/service-sessions")
        
        if response is None:
            self.log_result("List Customer Sessions", False, "Failed to make list sessions request")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("List Customer Sessions", True, f"Successfully retrieved {len(data)} sessions")
                    return True
            except:
                pass
        
        self.log_result("List Customer Sessions", False, f"List sessions failed with status {response.status_code}", response.text[:200])
        return False
    
    def test_create_service(self):
        """Test creating a service"""
        print("\n=== Testing Service Creation ===")
        
        if not self.auth_token or not self.test_customer_id or not self.test_session_id:
            self.log_result("Create Service", False, "Missing required IDs (auth token, customer ID, or session ID)")
            return False
        
        service_data = {
            "description": "Engine Oil Change",
            "price": 150000.0,
            "service_session_id": self.test_session_id,
            "customer_id": self.test_customer_id
        }
        
        response = self.make_request("POST", "/services", service_data)
        
        if response is None:
            self.log_result("Create Service", False, "Failed to make create service request")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "id" in data and "description" in data:
                    self.test_service_id = data["id"]
                    self.log_result("Create Service", True, f"Service created successfully with ID: {self.test_service_id}")
                    return True
            except:
                pass
        
        self.log_result("Create Service", False, f"Create service failed with status {response.status_code}", response.text[:200])
        return False
    
    def test_update_service(self):
        """Test updating a service"""
        print("\n=== Testing Service Update ===")
        
        if not self.auth_token or not self.test_service_id:
            self.log_result("Update Service", False, "No auth token or service ID available")
            return False
        
        update_data = {
            "description": "Premium Engine Oil Change",
            "price": 200000.0
        }
        
        response = self.make_request("PUT", f"/services/{self.test_service_id}", update_data)
        
        if response is None:
            self.log_result("Update Service", False, "Failed to make update service request")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "message" in data:
                    self.log_result("Update Service", True, "Service updated successfully")
                    return True
            except:
                pass
        
        self.log_result("Update Service", False, f"Update service failed with status {response.status_code}", response.text[:200])
        return False
    
    def test_create_payment(self):
        """Test creating a payment"""
        print("\n=== Testing Payment Creation ===")
        
        if not self.auth_token or not self.test_customer_id or not self.test_session_id:
            self.log_result("Create Payment", False, "Missing required IDs")
            return False
        
        payment_data = {
            "amount": 100000.0,
            "description": "Partial payment for oil change",
            "service_session_id": self.test_session_id,
            "customer_id": self.test_customer_id
        }
        
        response = self.make_request("POST", "/payments", payment_data)
        
        if response is None:
            self.log_result("Create Payment", False, "Failed to make create payment request")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "id" in data and "amount" in data:
                    self.test_payment_id = data["id"]
                    self.log_result("Create Payment", True, f"Payment created successfully with ID: {self.test_payment_id}")
                    return True
            except:
                pass
        
        self.log_result("Create Payment", False, f"Create payment failed with status {response.status_code}", response.text[:200])
        return False
    
    def test_dashboard(self):
        """Test dashboard endpoint"""
        print("\n=== Testing Dashboard ===")
        
        if not self.auth_token:
            self.log_result("Dashboard", False, "No auth token available")
            return False
        
        response = self.make_request("GET", "/dashboard")
        
        if response is None:
            self.log_result("Dashboard", False, "Failed to make dashboard request")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "customers" in data and isinstance(data["customers"], list):
                    self.log_result("Dashboard", True, f"Dashboard loaded successfully with {len(data['customers'])} customers")
                    return True
            except:
                pass
        
        self.log_result("Dashboard", False, f"Dashboard failed with status {response.status_code}", response.text[:200])
        return False
    
    def test_whatsapp_message(self):
        """Test WhatsApp message generation"""
        print("\n=== Testing WhatsApp Message Generation ===")
        
        if not self.auth_token or not self.test_customer_id:
            self.log_result("WhatsApp Message", False, "No auth token or customer ID available")
            return False
        
        # Test without session ID (all sessions)
        response = self.make_request("GET", f"/customers/{self.test_customer_id}/whatsapp-message")
        
        if response is None:
            self.log_result("WhatsApp Message", False, "Failed to make WhatsApp message request")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "message" in data and "whatsapp_url" in data:
                    self.log_result("WhatsApp Message", True, "WhatsApp message generated successfully")
                    
                    # Test with specific session ID
                    if self.test_session_id:
                        session_response = self.make_request("GET", f"/customers/{self.test_customer_id}/whatsapp-message?session_id={self.test_session_id}")
                        if session_response and session_response.status_code == 200:
                            self.log_result("WhatsApp Message (Session)", True, "Session-specific WhatsApp message generated")
                        else:
                            self.log_result("WhatsApp Message (Session)", False, "Failed to generate session-specific message")
                    
                    return True
            except:
                pass
        
        self.log_result("WhatsApp Message", False, f"WhatsApp message failed with status {response.status_code}", response.text[:200])
        return False
    
    def test_delete_service(self):
        """Test deleting a service"""
        print("\n=== Testing Service Deletion ===")
        
        if not self.auth_token or not self.test_service_id:
            self.log_result("Delete Service", False, "No auth token or service ID available")
            return False
        
        response = self.make_request("DELETE", f"/services/{self.test_service_id}")
        
        if response is None:
            self.log_result("Delete Service", False, "Failed to make delete service request")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "message" in data:
                    self.log_result("Delete Service", True, "Service deleted successfully")
                    return True
            except:
                pass
        
        self.log_result("Delete Service", False, f"Delete service failed with status {response.status_code}", response.text[:200])
        return False
    
    def test_delete_customer(self):
        """Test deleting a customer"""
        print("\n=== Testing Customer Deletion ===")
        
        if not self.auth_token or not self.test_customer_id:
            self.log_result("Delete Customer", False, "No auth token or customer ID available")
            return False
        
        response = self.make_request("DELETE", f"/customers/{self.test_customer_id}")
        
        if response is None:
            self.log_result("Delete Customer", False, "Failed to make delete customer request")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "message" in data:
                    self.log_result("Delete Customer", True, "Customer and related data deleted successfully")
                    return True
            except:
                pass
        
        self.log_result("Delete Customer", False, f"Delete customer failed with status {response.status_code}", response.text[:200])
        return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🚀 Starting Workshop Management System API Tests")
        print(f"🔗 Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Core API tests
        if not self.test_api_health():
            print("❌ API is not accessible. Stopping tests.")
            return False
        
        # Authentication tests
        auth_success = False
        if self.test_user_registration():
            auth_success = True
        elif self.test_user_login():
            auth_success = True
        
        if not auth_success:
            print("❌ Authentication failed. Stopping tests.")
            return False
        
        self.test_auth_me()
        
        # Customer management tests
        self.test_create_customer()
        self.test_list_customers()
        self.test_customer_summary()
        
        # Service session tests
        self.test_create_service_session()
        self.test_list_customer_sessions()
        
        # Service management tests
        self.test_create_service()
        self.test_update_service()
        
        # Payment tests
        self.test_create_payment()
        
        # Dashboard tests
        self.test_dashboard()
        
        # WhatsApp integration tests
        self.test_whatsapp_message()
        
        # Cleanup tests
        self.test_delete_service()
        self.test_delete_customer()
        
        # Print summary
        self.print_summary()
        
        return True
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.results if "✅ PASS" in r["status"])
        failed = sum(1 for r in self.results if "❌ FAIL" in r["status"])
        total = len(self.results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/total*100):.1f}%" if total > 0 else "0%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if "❌ FAIL" in result["status"]:
                    print(f"  • {result['test']}: {result['message']}")
        
        print("\n✅ PASSED TESTS:")
        for result in self.results:
            if "✅ PASS" in result["status"]:
                print(f"  • {result['test']}: {result['message']}")

def main():
    """Main function to run tests"""
    tester = WorkshopAPITester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests completed!")
    else:
        print("\n💥 Tests stopped due to critical failure!")
        sys.exit(1)

if __name__ == "__main__":
    main()