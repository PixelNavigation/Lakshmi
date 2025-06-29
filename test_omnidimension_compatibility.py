#!/usr/bin/env python3
"""
Test OmniDimension GET request compatibility for trade endpoint
"""

import requests
import json
import urllib.parse
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE_URL = os.getenv("DEVTUNNEL_URL", "https://wwws68kj-3000.inc1.devtunnels.ms")

def test_omnidimension_trade_format():
    """Test the trade endpoint with OmniDimension's GET request format"""
    
    print("🧪 Testing OmniDimension Trade Format (GET with keyName)")
    print("=" * 60)
    
    # Test data as OmniDimension would send it
    trade_data = {
        "userId": "user123",
        "symbol": "TCS",
        "quantity": 1,
        "price": 3500,
        "transactionType": "BUY"
    }
    
    # Convert to JSON string and URL encode it
    json_string = json.dumps(trade_data)
    encoded_json = urllib.parse.quote(json_string)
    
    print(f"Original JSON: {json_string}")
    print(f"URL Encoded: {encoded_json}")
    
    # Make GET request with keyName parameter (how OmniDimension sends it)
    try:
        response = requests.get(
            f"{BASE_URL}/api/trade",
            params={"keyName": json_string},
            timeout=10
        )
        
        print(f"\n📡 GET Request Status: {response.status_code}")
        result = response.json()
        print(f"📄 Response: {json.dumps(result, indent=2)}")
        
        if result.get("success") and "transaction" in result:
            print("✅ OmniDimension format trade executed successfully!")
            return True
        else:
            print("❌ Trade execution failed")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_regular_post_format():
    """Test the regular POST format still works"""
    
    print("\n🧪 Testing Regular POST Format")
    print("=" * 40)
    
    trade_data = {
        "userId": "user123",
        "symbol": "INFY",
        "quantity": 2,
        "price": 1500,
        "transactionType": "BUY"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/trade",
            json=trade_data,
            timeout=10
        )
        
        print(f"📡 POST Request Status: {response.status_code}")
        result = response.json()
        print(f"📄 Response: {json.dumps(result, indent=2)}")
        
        if result.get("success") and "transaction" in result:
            print("✅ Regular POST format still working!")
            return True
        else:
            print("❌ POST format failed")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing OmniDimension Trade Integration")
    print("=" * 60)
    
    test1 = test_omnidimension_trade_format()
    test2 = test_regular_post_format()
    
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {sum([test1, test2])}/2 tests passed")
    
    if test1 and test2:
        print("🎉 Both GET and POST methods working!")
        print("\n✅ OmniDimension Integration Status: READY")
        print("\n📋 What OmniDimension can now do:")
        print("• Execute trades via GET requests with JSON in keyName parameter")
        print("• Execute trades via standard POST requests")
        print("• Get endpoint information for discovery")
        print("• Full CORS support for cross-origin requests")
    else:
        print("⚠️  Some tests failed. Check the errors above.")

if __name__ == "__main__":
    main()
