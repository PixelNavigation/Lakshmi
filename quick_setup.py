#!/usr/bin/env python3
"""
Quick Setup Script for OmniDimension Integration
This is a simplified version that works without requiring the full omnidimension package
"""

import os
import json
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

def check_prerequisites():
    """Check if all prerequisites are met"""
    print("🔍 Checking prerequisites...")
    
    api_key = os.getenv("OMNIDIM_API_KEY")
    ngrok_url = os.getenv("NGROK_URL")
    
    issues = []
    
    if not api_key or api_key == "your_omnidimension_api_key_here":
        issues.append("❌ OMNIDIM_API_KEY not set in .env.local")
    
    if not ngrok_url or ngrok_url == "https://your-ngrok-url.ngrok.io":
        issues.append("❌ NGROK_URL not set in .env.local")
    
    if issues:
        print("\n".join(issues))
        print("\n📋 Setup Steps:")
        print("1. Get your API key from https://omnidimension.ai")
        print("2. Run 'ngrok http 3000' to expose your local server")
        print("3. Update .env.local with your actual values")
        return False
    
    print("✅ Prerequisites check passed!")
    return True

def test_local_api():
    """Test if local API is accessible"""
    ngrok_url = os.getenv("NGROK_URL")
    
    print(f"🧪 Testing API connectivity at {ngrok_url}...")
    
    try:
        # Test a simple endpoint
        response = requests.get(f"{ngrok_url}/api/user-balance?userId=user123", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API test successful! Balance: ₹{data.get('balances', {}).get('inr', 'N/A')}")
            return True
        else:
            print(f"❌ API test failed: HTTP {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ API test failed: {e}")
        return False

def create_integration_config():
    """Create integration configuration"""
    
    api_key = os.getenv("OMNIDIM_API_KEY")
    ngrok_url = os.getenv("NGROK_URL")
    
    config = {
        "integration": {
            "name": "LakshmiTradingAPI",
            "description": "Lakshmi stock trading platform with portfolio management",
            "base_url": ngrok_url,
            "endpoints": [
                {
                    "name": "GetStockDetail",
                    "method": "GET",
                    "path": "/api/stock-detail",
                    "description": "Get detailed information about a specific stock",
                    "parameters": [
                        {"name": "symbol", "in": "query", "required": True, "type": "string"}
                    ]
                },
                {
                    "name": "GetUserPortfolio", 
                    "method": "GET",
                    "path": "/api/user-portfolio",
                    "description": "Get user's current portfolio holdings",
                    "parameters": [
                        {"name": "userId", "in": "query", "required": True, "type": "string"}
                    ]
                },
                {
                    "name": "PlaceTradeOrder",
                    "method": "POST", 
                    "path": "/api/trade",
                    "description": "Place a buy or sell order for stocks",
                    "parameters": [
                        {"name": "userId", "in": "body", "type": "string", "required": True},
                        {"name": "symbol", "in": "body", "type": "string", "required": True},
                        {"name": "quantity", "in": "body", "type": "number", "required": True},
                        {"name": "price", "in": "body", "type": "number", "required": True},
                        {"name": "transactionType", "in": "body", "type": "string", "required": True}
                    ]
                }
            ]
        },
        "agent": {
            "name": "LakshmiTradingAgent",
            "description": "Intelligent stock trading assistant",
            "system_prompt": """You are a professional stock trading assistant for the Lakshmi Trading Platform. 

You can help users with:
- Portfolio management and analysis
- Stock research and price checking  
- Trade execution (buy/sell orders)
- Transaction history review
- Watchlist management

Always validate trades and consider risk management. Default user ID is 'user123'."""
        },
        "api_key": api_key,
        "setup_timestamp": "2025-06-29T00:00:00Z"
    }
    
    # Save configuration
    with open("lakshmi_omnidimension_config.json", "w") as f:
        json.dump(config, f, indent=2)
    
    print("✅ Configuration saved to lakshmi_omnidimension_config.json")
    return config

def print_manual_setup_instructions(config):
    """Print manual setup instructions for OmniDimension"""
    
    print("\n" + "="*70)
    print("📋 MANUAL SETUP INSTRUCTIONS")
    print("="*70)
    
    print("\n1. 🌐 Go to your OmniDimension dashboard")
    print("   https://app.omnidimension.ai")
    
    print("\n2. 🔧 Create Custom API Integration:")
    print("   - Click 'Integrations' → 'Create Custom API'")
    print(f"   - Name: {config['integration']['name']}")
    print(f"   - Base URL: {config['integration']['base_url']}")
    print("   - Add these endpoints:")
    
    for endpoint in config['integration']['endpoints']:
        print(f"     • {endpoint['method']} {endpoint['path']} - {endpoint['description']}")
    
    print("\n3. 🤖 Create Trading Agent:")
    print("   - Click 'Agents' → 'Create Agent'")
    print(f"   - Name: {config['agent']['name']}")
    print("   - Model: GPT-4")
    print("   - System Prompt:")
    print(f"     {config['agent']['system_prompt']}")
    
    print("\n4. 🔗 Connect Integration to Agent:")
    print("   - Go to your agent settings")
    print("   - Add the LakshmiTradingAPI integration")
    print("   - Enable all endpoints")
    
    print("\n5. 🧪 Test the Integration:")
    print("   - Use the OmniDimension chat interface")
    print("   - Try commands like:")
    print("     • 'What's my portfolio balance?'")
    print("     • 'What's the current price of Apple?'")
    print("     • 'Buy 5 shares of Tesla'")
    
    print("\n" + "="*70)
    print("🎉 Setup Complete! Your trading AI is ready to use.")
    print("="*70)

def main():
    """Main setup function"""
    print("🚀 Lakshmi-OmniDimension Quick Setup")
    print("="*50)
    
    # Check prerequisites
    if not check_prerequisites():
        return False
    
    # Test API connectivity
    if not test_local_api():
        print("\n⚠️  API test failed. Please check your ngrok setup and try again.")
        return False
    
    # Create configuration
    print("\n📝 Creating integration configuration...")
    config = create_integration_config()
    
    # Print setup instructions
    print_manual_setup_instructions(config)
    
    print(f"\n💾 Configuration saved to: lakshmi_omnidimension_config.json")
    print("📚 For detailed instructions, see: OMNIDIMENSION_SETUP.md")
    
    return True

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n👋 Setup cancelled by user")
    except Exception as e:
        print(f"\n❌ Setup failed: {e}")
        print("\n🔧 For troubleshooting, see OMNIDIMENSION_SETUP.md")
