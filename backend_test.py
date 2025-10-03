#!/usr/bin/env python3
"""
Backend API Testing Script for TIM Planos Endpoint
Tests the POST /api/transactions/tim-planos endpoint with new personal information fields
"""

import requests
import json
import os
from datetime import datetime

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return None

BACKEND_URL = get_backend_url()
if not BACKEND_URL:
    print("ERROR: Could not get REACT_APP_BACKEND_URL from frontend/.env")
    exit(1)

API_BASE = f"{BACKEND_URL}/api"
print(f"Testing backend at: {API_BASE}")

# Test data
TEST_USER_DATA = {
    "name": "Maria Silva Santos",
    "email": "maria.silva.test@email.com",
    "password": "TestPassword123!",
    "phone": "11987654321",
    "account_number": "12345678"
}

VALID_TIM_PLANOS_DATA = {
    "phone_number": "11987654321",
    "tim_email": "maria.tim@email.com",
    "tim_password": "TimPassword123",
    "amount_paid": 50.0,
    "amount_received": 45.0,
    "cep": "01234-567",
    "full_name": "Maria Silva Santos",
    "mother_name": "Ana Silva Santos",
    "birth_date": "1990-05-15"
}

def test_user_registration_and_login():
    """Test user registration and login to get auth token"""
    print("\n=== Testing User Registration and Login ===")
    
    # Register user
    try:
        response = requests.post(f"{API_BASE}/auth/register", json=TEST_USER_DATA)
        print(f"Registration status: {response.status_code}")
        
        if response.status_code == 201 or response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print("✅ User registration successful")
            return token
        elif response.status_code == 400 and "já cadastrado" in response.text:
            print("User already exists, trying login...")
            # Try login instead
            login_data = {"email": TEST_USER_DATA["email"], "password": TEST_USER_DATA["password"]}
            response = requests.post(f"{API_BASE}/auth/login", json=login_data)
            print(f"Login status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                token = data.get("access_token")
                print("✅ User login successful")
                return token
            else:
                print(f"❌ Login failed: {response.text}")
                return None
        else:
            print(f"❌ Registration failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error during registration/login: {e}")
        return None

def test_tim_planos_endpoint_valid_data(token):
    """Test TIM Planos endpoint with valid data including all new fields"""
    print("\n=== Testing TIM Planos Endpoint - Valid Data ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.post(f"{API_BASE}/transactions/tim-planos", 
                               json=VALID_TIM_PLANOS_DATA, 
                               headers=headers)
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ TIM Planos transaction created successfully")
            print(f"Transaction ID: {data.get('id')}")
            print(f"Transaction data: {json.dumps(data, indent=2)}")
            
            # Verify all required fields are in response
            required_fields = ['id', 'user_id', 'phone_number', 'tim_email', 'amount_paid', 'amount_received']
            new_fields = ['cep', 'full_name', 'mother_name', 'birth_date']
            
            missing_fields = []
            for field in required_fields + new_fields:
                if field not in data:
                    missing_fields.append(field)
            
            if missing_fields:
                print(f"⚠️ Missing fields in response: {missing_fields}")
                return False, data.get('id')
            else:
                print("✅ All required fields present in response")
                return True, data.get('id')
                
        else:
            print(f"❌ TIM Planos transaction failed: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Error testing TIM Planos endpoint: {e}")
        return False, None

def test_tim_planos_validation(token):
    """Test TIM Planos endpoint validation - missing required fields"""
    print("\n=== Testing TIM Planos Endpoint - Field Validation ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test missing each required field
    required_fields = ['phone_number', 'tim_email', 'tim_password', 'amount_paid', 'amount_received', 
                      'cep', 'full_name', 'mother_name', 'birth_date']
    
    validation_passed = True
    
    for field in required_fields:
        test_data = VALID_TIM_PLANOS_DATA.copy()
        del test_data[field]
        
        try:
            response = requests.post(f"{API_BASE}/transactions/tim-planos", 
                                   json=test_data, 
                                   headers=headers)
            
            if response.status_code == 422:  # Validation error expected
                print(f"✅ Validation working for missing field: {field}")
            else:
                print(f"⚠️ Missing field '{field}' did not trigger validation error (status: {response.status_code})")
                validation_passed = False
                
        except Exception as e:
            print(f"❌ Error testing validation for field {field}: {e}")
            validation_passed = False
    
    return validation_passed

def test_unauthorized_access():
    """Test TIM Planos endpoint without authentication"""
    print("\n=== Testing TIM Planos Endpoint - Unauthorized Access ===")
    
    try:
        response = requests.post(f"{API_BASE}/transactions/tim-planos", 
                               json=VALID_TIM_PLANOS_DATA)
        
        if response.status_code == 401 or response.status_code == 403:
            print("✅ Unauthorized access properly blocked")
            return True
        else:
            print(f"⚠️ Unauthorized access not properly blocked (status: {response.status_code})")
            return False
            
    except Exception as e:
        print(f"❌ Error testing unauthorized access: {e}")
        return False

def test_data_persistence(token, transaction_id):
    """Test that transaction data is properly stored and retrievable"""
    print("\n=== Testing Data Persistence ===")
    
    if not transaction_id:
        print("❌ No transaction ID to test persistence")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        # Get user transactions to verify data was stored
        response = requests.get(f"{API_BASE}/user/transactions", headers=headers)
        
        if response.status_code == 200:
            transactions = response.json()
            
            # Find our transaction
            our_transaction = None
            for transaction in transactions:
                if transaction.get('id') == transaction_id:
                    our_transaction = transaction
                    break
            
            if our_transaction:
                print("✅ Transaction found in user transactions")
                
                # Verify all data fields are preserved
                expected_fields = {
                    'phone_number': VALID_TIM_PLANOS_DATA['phone_number'],
                    'tim_email': VALID_TIM_PLANOS_DATA['tim_email'],
                    'amount_paid': VALID_TIM_PLANOS_DATA['amount_paid'],
                    'amount_received': VALID_TIM_PLANOS_DATA['amount_received'],
                    'cep': VALID_TIM_PLANOS_DATA['cep'],
                    'full_name': VALID_TIM_PLANOS_DATA['full_name'],
                    'mother_name': VALID_TIM_PLANOS_DATA['mother_name'],
                    'birth_date': VALID_TIM_PLANOS_DATA['birth_date']
                }
                
                data_integrity_ok = True
                for field, expected_value in expected_fields.items():
                    actual_value = our_transaction.get(field)
                    if actual_value != expected_value:
                        print(f"⚠️ Data mismatch for {field}: expected {expected_value}, got {actual_value}")
                        data_integrity_ok = False
                
                if data_integrity_ok:
                    print("✅ All data fields properly stored and retrieved")
                    return True
                else:
                    print("❌ Data integrity issues found")
                    return False
            else:
                print("❌ Transaction not found in user transactions")
                return False
        else:
            print(f"❌ Failed to retrieve user transactions: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing data persistence: {e}")
        return False

def main():
    """Main test execution"""
    print("🚀 Starting TIM Planos API Testing")
    print(f"Backend URL: {API_BASE}")
    print(f"Test timestamp: {datetime.now()}")
    
    # Test results tracking
    test_results = {
        'auth': False,
        'valid_request': False,
        'validation': False,
        'unauthorized': False,
        'persistence': False
    }
    
    # Step 1: Authentication
    token = test_user_registration_and_login()
    if token:
        test_results['auth'] = True
        print(f"Auth token obtained: {token[:20]}...")
    else:
        print("❌ Cannot proceed without authentication token")
        return test_results
    
    # Step 2: Test valid TIM Planos request
    success, transaction_id = test_tim_planos_endpoint_valid_data(token)
    test_results['valid_request'] = success
    
    # Step 3: Test validation
    test_results['validation'] = test_tim_planos_validation(token)
    
    # Step 4: Test unauthorized access
    test_results['unauthorized'] = test_unauthorized_access()
    
    # Step 5: Test data persistence
    if transaction_id:
        test_results['persistence'] = test_data_persistence(token, transaction_id)
    
    # Summary
    print("\n" + "="*60)
    print("🏁 TEST SUMMARY")
    print("="*60)
    
    total_tests = len(test_results)
    passed_tests = sum(test_results.values())
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.upper()}: {status}")
    
    print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 All tests passed! TIM Planos API is working correctly.")
    else:
        print("⚠️ Some tests failed. Check the details above.")
    
    return test_results

if __name__ == "__main__":
    results = main()