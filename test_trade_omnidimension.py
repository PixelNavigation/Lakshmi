#!/usr/bin/env python3
"""
Test Trade Order endpoint specifically for OmniDimension compatibility
Tests various parameter formats and edge cases for the trading functionality
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE_URL = os.getenv("DEVTUNNEL_URL", "https://wwws68kj-3000.inc1.devtunnels.ms")
USER_ID = "user123"

def test_trade_endpoint(test_name, data, expected_success=True):
    """Test the trade endpoint with specific data"""
    print(f"\n🧪 Testing {test_name}...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/trade",
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"   Status: {response.status_code}")
        result = response.json()
        print(f"   Response: {json.dumps(result, indent=2)}")
        
        if expected_success and result.get("success"):
            print("   ✅ Success as expected")
            return True
        elif not expected_success and not result.get("success"):
            print("   ✅ Failed as expected")
            return True
        else:
            print("   ❌ Unexpected result")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def main():
    """Run comprehensive trade endpoint tests"""
    print("🚀 Lakshmi Trade Order - OmniDimension Compatibility Tests")
    print("=" * 60)
    
    tests = [
        # Test 1: Standard BUY order with Indian stock
        {
            "name": "BUY Indian Stock (TCS)",
            "data": {
                "userId": USER_ID,
                "symbol": "TCS",
                "quantity": 1,
                "price": 3500.50,
                "transactionType": "BUY"
            },
            "expected": True
        },
        
        # Test 2: Standard SELL order  
        {
            "name": "SELL Indian Stock (TCS)",
            "data": {
                "userId": USER_ID,
                "symbol": "TCS",
                "quantity": 1,
                "price": 3600.25,
                "transactionType": "SELL"
            },
            "expected": True
        },
        
        # Test 3: Test with already NSE format symbol
        {
            "name": "BUY with NSE format (INFY.NS)",
            "data": {
                "userId": USER_ID,
                "symbol": "INFY.NS",
                "quantity": 2,
                "price": 1500.00,
                "transactionType": "BUY"
            },
            "expected": True
        },
        
        # Test 4: Test with different Indian stock
        {
            "name": "BUY Reliance Industries",
            "data": {
                "userId": USER_ID,
                "symbol": "RELIANCE",
                "quantity": 5,
                "price": 2500.75,
                "transactionType": "BUY"
            },
            "expected": True
        },
        
        # Test 5: Test foreign stock rejection (should fail)
        {
            "name": "Foreign Stock Rejection (AAPL)",
            "data": {
                "userId": USER_ID,
                "symbol": "AAPL",
                "quantity": 1,
                "price": 150.00,
                "transactionType": "BUY"
            },
            "expected": False
        },
        
        # Test 6: Test foreign stock rejection (should fail)
        {
            "name": "Foreign Stock Rejection (TSLA)",
            "data": {
                "userId": USER_ID,
                "symbol": "TSLA",
                "quantity": 1,
                "price": 200.00,
                "transactionType": "BUY"
            },
            "expected": False
        },
        
        # Test 7: Test invalid transaction type (should fail)
        {
            "name": "Invalid Transaction Type",
            "data": {
                "userId": USER_ID,
                "symbol": "TCS",
                "quantity": 1,
                "price": 3500.00,
                "transactionType": "INVALID"
            },
            "expected": False
        },
        
        # Test 8: Test negative quantity (should fail)
        {
            "name": "Negative Quantity",
            "data": {
                "userId": USER_ID,
                "symbol": "TCS",
                "quantity": -1,
                "price": 3500.00,
                "transactionType": "BUY"
            },
            "expected": False
        },
        
        # Test 9: Test negative price (should fail)
        {
            "name": "Negative Price",
            "data": {
                "userId": USER_ID,
                "symbol": "TCS",
                "quantity": 1,
                "price": -3500.00,
                "transactionType": "BUY"
            },
            "expected": False
        },
        
        # Test 10: Test missing parameters (should fail)
        {
            "name": "Missing Parameters",
            "data": {
                "userId": USER_ID,
                "symbol": "TCS",
                "quantity": 1
                # Missing price and transactionType
            },
            "expected": False
        }
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        success = test_trade_endpoint(
            test["name"],
            test["data"],
            test["expected"]
        )
        if success:
            passed += 1
    
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All trade endpoint tests passed! Ready for OmniDimension integration.")
        print("\n📋 Integration Summary:")
        print("✅ Indian stock support confirmed")
        print("✅ Foreign stock blocking working")
        print("✅ Parameter validation working")
        print("✅ BUY/SELL operations working")
        print("✅ Error handling working")
        
        print("\n🔗 OmniDimension Commands to Test:")
        print("• 'Buy 5 shares of TCS at 3500 rupees'")
        print("• 'Sell 2 shares of Reliance at market price'")
        print("• 'Purchase 10 shares of Infosys'")
        print("• 'What happens if I try to buy Apple stock?'")
        
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
        
if __name__ == "__main__":
    main()
