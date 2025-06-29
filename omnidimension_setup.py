#!/usr/bin/env python3
"""
OmniDimension Integration Setup for Lakshmi Trading Platform
This script sets up the integration between OmniDimension and your local trading API
"""

import os
import sys
from dotenv import load_dotenv
from omnidimension import Client

# Load environment variables
load_dotenv()

class LakshmiOmniDimensionIntegration:
    def __init__(self):
        self.api_key = os.getenv("OMNIDIM_API_KEY")
        self.ngrok_url = os.getenv("NGROK_URL")
        self.local_port = os.getenv("LOCAL_API_PORT", "3000")
        
        if not self.api_key:
            raise ValueError("OMNIDIM_API_KEY not found in environment variables")
        
        self.client = Client(api_key=self.api_key)
        self.integration_id = None
        self.agent_id = None
    
    def create_integration(self):
        """Create custom API integration for Lakshmi Trading Platform"""
        
        if not self.ngrok_url:
            print("⚠️  NGROK_URL not set. Please run ngrok first:")
            print(f"   ngrok http {self.local_port}")
            print("   Then update NGROK_URL in .env.local")
            return None
        
        try:
            integration = self.client.integrations.create_custom_api_integration(
                name="LakshmiTradingAPI",
                description="Lakshmi stock trading platform with portfolio management",
                base_url=self.ngrok_url,
                endpoints=[
                    {
                        "name": "GetStockDetail",
                        "method": "GET",
                        "path": "/api/stock-detail",
                        "description": "Get detailed information about a specific stock including current price, change, and market data",
                        "parameters": [
                            {"name": "symbol", "in": "query", "required": True, "type": "string", "description": "Stock symbol (e.g., AAPL, TSLA)"}
                        ]
                    },
                    {
                        "name": "GetUserPortfolio",
                        "method": "GET", 
                        "path": "/api/user-portfolio",
                        "description": "Get user's current portfolio holdings with average prices and quantities",
                        "parameters": [
                            {"name": "userId", "in": "query", "required": True, "type": "string", "description": "User ID"}
                        ]
                    },
                    {
                        "name": "GetUserBalance",
                        "method": "GET",
                        "path": "/api/user-balance", 
                        "description": "Get user's available cash balance for trading",
                        "parameters": [
                            {"name": "userId", "in": "query", "required": True, "type": "string", "description": "User ID"}
                        ]
                    },
                    {
                        "name": "PlaceTradeOrder",
                        "method": "POST",
                        "path": "/api/trade",
                        "description": "Place a buy or sell order for Indian stocks only. Automatically converts symbols to Indian market format (NSE/BSE).",
                        "parameters": [
                            {"name": "userId", "in": "body", "type": "string", "required": True, "description": "User ID"},
                            {"name": "symbol", "in": "body", "type": "string", "required": True, "description": "Indian stock symbol (e.g., TCS, INFY, RELIANCE)"},
                            {"name": "quantity", "in": "body", "type": "number", "required": True, "description": "Number of shares (positive)"},
                            {"name": "price", "in": "body", "type": "number", "required": True, "description": "Price per share in INR (positive)"},
                            {"name": "transactionType", "in": "body", "type": "string", "required": True, "description": "BUY or SELL (uppercase)"}
                        ]
                    },
                    {
                        "name": "GetUserTransactions",
                        "method": "GET",
                        "path": "/api/user-transactions",
                        "description": "Get user's transaction history",
                        "parameters": [
                            {"name": "userId", "in": "query", "required": True, "type": "string", "description": "User ID"}
                        ]
                    },
                    {
                        "name": "GetUserWatchlist",
                        "method": "GET",
                        "path": "/api/user-watchlist",
                        "description": "Get user's watchlist of stocks they're monitoring",
                        "parameters": [
                            {"name": "userId", "in": "query", "required": True, "type": "string", "description": "User ID"}
                        ]
                    },
                    {
                        "name": "AddToWatchlist",
                        "method": "POST",
                        "path": "/api/user-watchlist",
                        "description": "Add a stock to user's watchlist",
                        "parameters": [
                            {"name": "userId", "in": "body", "type": "string", "required": True, "description": "User ID"},
                            {"name": "symbol", "in": "body", "type": "string", "required": True, "description": "Stock symbol"},
                            {"name": "action", "in": "body", "type": "string", "required": True, "description": "add or remove"}
                        ]
                    },
                    {
                        "name": "GetStockNews",
                        "method": "GET",
                        "path": "/api/news",
                        "description": "Get latest news for stocks or market in general",
                        "parameters": [
                            {"name": "symbol", "in": "query", "required": False, "type": "string", "description": "Optional stock symbol for specific news"}
                        ]
                    },
                    {
                        "name": "GetComprehensiveSearch",
                        "method": "GET",
                        "path": "/api/comprehensive-search",
                        "description": "Search for stocks with detailed information",
                        "parameters": [
                            {"name": "query", "in": "query", "required": True, "type": "string", "description": "Search query (company name or symbol)"}
                        ]
                    }
                ],
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            )
            
            self.integration_id = integration.id
            print(f"✅ Integration created successfully! ID: {self.integration_id}")
            return integration
            
        except Exception as e:
            print(f"❌ Error creating integration: {e}")
            return None
    
    def create_trading_agent(self):
        """Create an intelligent trading agent"""
        
        if not self.integration_id:
            print("❌ Integration must be created first")
            return None
        
        try:
            agent = self.client.agent.create(
            name="LakshmiTradingAgent",
            description="Intelligent Indian stock trading assistant for the Lakshmi platform",
            system_prompt="""You are a professional Indian stock trading assistant for the Lakshmi Trading Platform. You can:

1. **Portfolio Management**: Check user holdings, balances, and calculate performance
2. **Stock Research**: Get real-time Indian stock prices, company information, and market news
3. **Trade Execution**: Place buy/sell orders for Indian stocks only with proper validation
4. **Watchlist Management**: Add/remove Indian stocks from user watchlists
5. **Transaction History**: Review past trades and analyze performance

**Trading Rules & Guidelines:**
- ONLY trade Indian stocks (TCS, INFY, RELIANCE, HDFCBANK, ITC, SBIN, etc.)
- BLOCK foreign stocks (AAPL, TSLA, GOOGL) - they are not supported
- Always check user's available balance before buy orders
- Verify user has enough shares before sell orders  
- Validate stock prices are within reasonable market range
- Provide clear explanations for trade recommendations
- Ask for confirmation before executing trades
- Consider risk management and diversification

**User Context:**
- Default user ID is 'user123' unless specified otherwise
- All prices are in Indian Rupees (₹)
- Support only Indian (NSE/BSE) stocks
- Be conversational and helpful while maintaining professionalism

**Supported Indian Stocks Examples:**
- TCS (Tata Consultancy Services)
- INFY (Infosys)
- RELIANCE (Reliance Industries)
- HDFCBANK (HDFC Bank)
- ITC (ITC Limited)
- SBIN (State Bank of India)

**Response Format:**
- Always provide clear, actionable information
- Include relevant numbers (prices, quantities, percentages)
- Explain the reasoning behind recommendations
- Ask clarifying questions when needed
- If user asks for foreign stocks, explain we only support Indian markets""",
                model="gpt-4",
                tools_enabled=True
            )
            
            self.agent_id = agent.id
            print(f"✅ Trading agent created successfully! ID: {self.agent_id}")
            return agent
            
        except Exception as e:
            print(f"❌ Error creating agent: {e}")
            return None
    
    def attach_integration_to_agent(self):
        """Attach the trading API integration to the agent"""
        
        if not self.agent_id or not self.integration_id:
            print("❌ Both agent and integration must be created first")
            return False
        
        try:
            self.client.agent.add_integration(
                agent_id=self.agent_id,
                integration_id=self.integration_id
            )
            print(f"✅ Integration attached to agent successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Error attaching integration: {e}")
            return False
    
    def setup_complete_integration(self):
        """Complete setup process"""
        print("🚀 Starting Lakshmi-OmniDimension Integration Setup...")
        print("=" * 60)
        
        # Step 1: Create Integration
        print("\n📡 Step 1: Creating API Integration...")
        integration = self.create_integration()
        if not integration:
            return False
        
        # Step 2: Create Agent
        print("\n🤖 Step 2: Creating Trading Agent...")
        agent = self.create_trading_agent()
        if not agent:
            return False
        
        # Step 3: Attach Integration
        print("\n🔗 Step 3: Connecting Integration to Agent...")
        if not self.attach_integration_to_agent():
            return False
        
        print("\n" + "=" * 60)
        print("🎉 SETUP COMPLETE!")
        print(f"🆔 Integration ID: {self.integration_id}")
        print(f"🤖 Agent ID: {self.agent_id}")
        print("\n📋 Next Steps:")
        print("1. Start your Next.js app: npm run dev")
        print("2. Keep ngrok running to maintain the public URL")
        print("3. Test the integration using OmniDimension chat/voice interface")
        print("\n💬 Example Commands:")
        print('   "What\'s my portfolio balance?"')
        print('   "Buy 10 shares of Apple"')
        print('   "What\'s the current price of Tesla?"')
        print('   "Show me my recent transactions"')
        
        return True
    
    def get_agent_info(self):
        """Get information about the created agent"""
        if self.agent_id:
            return {
                "agent_id": self.agent_id,
                "integration_id": self.integration_id,
                "ngrok_url": self.ngrok_url
            }
        return None

def main():
    """Main setup function"""
    try:
        integration = LakshmiOmniDimensionIntegration()
        success = integration.setup_complete_integration()
        
        if success:
            # Save configuration for future reference
            config = integration.get_agent_info()
            if config:
                with open("omnidimension_config.json", "w") as f:
                    import json
                    json.dump(config, f, indent=2)
                print(f"\n💾 Configuration saved to omnidimension_config.json")
        
        return success
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        print("\n🔧 Troubleshooting:")
        print("1. Check your OMNIDIM_API_KEY in .env.local")
        print("2. Ensure ngrok is running and NGROK_URL is set")
        print("3. Verify your Next.js app is running on the specified port")
        return False

if __name__ == "__main__":
    main()
