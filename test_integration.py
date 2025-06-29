#!/usr/bin/env python3
"""
Test script for Lakshmi-OmniDimension Integration
This script tests all API endpoints to ensure they're working correctly
"""

import requests
import json
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv('.env.local')

BASE_URL = os.getenv("NGROK_URL", "https://wwws68kj-3000.inc1.devtunnels.ms")
USER_ID = "user123"

def test_endpoint(name, method, url, data=None):
    """Test a single API endpoint"""
    print(f"\n🧪 Testing {name}...")
    print(f"   {method} {url}")
    
    try:
        if method == "GET":
            response = requests.get(url, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Success: {response.status_code}")
            print(f"   📄 Response: {json.dumps(result, indent=2)[:200]}...")
            return True
        else:
            print(f"   ❌ Failed: HTTP {response.status_code}")
            print(f"   📄 Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def main():
    """Run all API tests"""
    print("🚀 Lakshmi API Integration Tests")
    print("=" * 50)
    print(f"Base URL: {BASE_URL}")
    print(f"User ID: {USER_ID}")
    
    tests = [
        {
            "name": "Health Check",
            "method": "GET",
            "url": f"{BASE_URL}/api/health"
        },
        {
            "name": "User Balance",
            "method": "GET", 
            "url": f"{BASE_URL}/api/user-balance?userId={USER_ID}"
        },
        {
            "name": "User Portfolio",
            "method": "GET",
            "url": f"{BASE_URL}/api/user-portfolio?userId={USER_ID}"
        },
        {
            "name": "Stock Detail (AAPL)",
            "method": "GET",
            "url": f"{BASE_URL}/api/stock-detail?symbol=AAPL"
        },
        {
            "name": "Stock Detail (TSLA)",
            "method": "GET", 
            "url": f"{BASE_URL}/api/stock-detail?symbol=TSLA"
        },
        {
            "name": "Place Trade Order",
            "method": "POST",
            "url": f"{BASE_URL}/api/trade",
            "data": {
                "userId": USER_ID,
                "symbol": "AAPL",
                "quantity": 1,
                "price": 200,
                "transactionType": "BUY"
            }
        }
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        success = test_endpoint(
            test["name"], 
            test["method"], 
            test["url"],
            test.get("data")
        )
        if success:
            passed += 1
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your API is ready for OmniDimension integration.")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
    
    print("\n🔗 OmniDimension Setup:")
    print("1. Go to https://app.omnidimension.ai")
    print("2. Create Custom API Integration with these endpoints")
    print("3. Create an Agent and connect the integration")
    print("4. Test with commands like:")
    print("   • 'What's my portfolio balance?'")
    print("   • 'What's the current price of Apple?'") 
    print("   • 'Buy 1 share of Tesla at market price'")

if __name__ == "__main__":
    main()
