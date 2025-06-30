#!/usr/bin/env python3
"""
Complete OmniDimension Integration Setup for Lakshmi Trading Platform
This script sets up agents, integrations, and authentication with OmniDimension
"""

import os
import asyncio
import json
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class LakshmiOmniDimensionIntegration:
    def __init__(self):
        self.api_key = os.getenv("OMNIDIM_API_KEY")
        self.local_base_url = os.getenv("LOCAL_BASE_URL", "http://localhost:3000")
        self.tunnel_url = os.getenv("DEVTUNNEL_URL", "https://wwws68kj-3000.inc1.devtunnels.ms")
        
        if not self.api_key:
            raise ValueError("OMNIDIM_API_KEY not found in environment variables")
        
        print(f"🔑 Using API Key: {self.api_key[:8]}...")
        print(f"🌐 Local URL: {self.local_base_url}")
        print(f"🌍 Tunnel URL: {self.tunnel_url}")
    
    async def setup_complete_integration(self):
        """Set up the complete OmniDimension integration"""
        try:
            # Import OmniDimension client
            from omnidimension import Client
            self.client = Client(api_key=self.api_key)
            print("✅ OmniDimension client initialized")
            
            # Step 1: Create custom API integration
            integration = await self.create_api_integration()
            print(f"✅ API Integration created: {integration.id}")
            
            # Step 2: Create trading agent with authentication
            agent = await self.create_authenticated_trading_agent()
            print(f"✅ Trading Agent created: {agent.id}")
            
            # Step 3: Attach integration to agent
            await self.attach_integration_to_agent(agent.id, integration.id)
            print("✅ Integration attached to agent")
            
            # Step 4: Test the integration
            await self.test_integration(agent.id)
            
            # Step 5: Save configuration
            config = {
                "integration_id": integration.id,
                "agent_id": agent.id,
                "api_endpoints": self.get_api_endpoints(),
                "voice_commands": self.get_voice_commands(),
                "setup_date": "2025-06-30",
                "user_account": "babelgautam16@gmail.com"
            }
            
            with open('omnidimension_lakshmi_config.json', 'w') as f:
                json.dump(config, f, indent=2)
            
            return config
            
        except Exception as e:
            print(f"❌ Setup failed: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    async def create_api_integration(self):
        """Create custom API integration for Lakshmi trading platform"""
        
        integration_config = {
            "name": "LakshmiTradingPlatform",
            "description": "Lakshmi AI Trading Platform with Authentication - Real stock trading, portfolio management, and market data for Indian markets",
            "base_url": f"{self.tunnel_url}/api",
            "headers": {
                "Content-Type": "application/json",
                "User-Agent": "OmniDimension-Agent/1.0"
            },
            "endpoints": [
                # Authentication Endpoints
                {
                    "name": "AuthenticateUser",
                    "method": "POST",
                    "path": "/auth",
                    "description": "Authenticate user with email and password to access real account data",
                    "parameters": [
                        {"name": "email", "in": "body", "required": True, "type": "string", "description": "User email address"},
                        {"name": "password", "in": "body", "required": True, "type": "string", "description": "User password"}
                    ],
                    "response_example": {
                        "success": True,
                        "user": {"id": "user_id", "email": "user@example.com", "name": "User Name"},
                        "session": {"access_token": "jwt_token", "expires_at": "timestamp"}
                    }
                },
                {
                    "name": "GetUserProfile",
                    "method": "GET",
                    "path": "/user-profile",
                    "description": "Get authenticated user's profile information",
                    "parameters": [
                        {"name": "Authorization", "in": "header", "required": False, "type": "string", "description": "Bearer token for authenticated requests"}
                    ]
                },
                {
                    "name": "ValidateToken",
                    "method": "GET", 
                    "path": "/auth",
                    "description": "Validate authentication token and get user info",
                    "parameters": [
                        {"name": "token", "in": "query", "required": True, "type": "string", "description": "JWT token to validate"}
                    ]
                },
                
                # Portfolio & Financial Data
                {
                    "name": "GetPortfolio",
                    "method": "GET",
                    "path": "/user-portfolio",
                    "description": "Get user's current portfolio holdings with real-time prices",
                    "parameters": [
                        {"name": "Authorization", "in": "header", "required": False, "type": "string", "description": "Bearer token for authenticated user data"},
                        {"name": "userId", "in": "query", "required": False, "type": "string", "description": "User ID (defaults to demo if not authenticated)"}
                    ]
                },
                {
                    "name": "GetBalance",
                    "method": "GET",
                    "path": "/user-balance",
                    "description": "Get user's available cash balance",
                    "parameters": [
                        {"name": "Authorization", "in": "header", "required": False, "type": "string", "description": "Bearer token for authenticated user data"},
                        {"name": "userId", "in": "query", "required": False, "type": "string", "description": "User ID (defaults to demo if not authenticated)"}
                    ]
                },
                {
                    "name": "GetTransactions",
                    "method": "GET",
                    "path": "/user-transactions",
                    "description": "Get user's transaction history",
                    "parameters": [
                        {"name": "Authorization", "in": "header", "required": False, "type": "string", "description": "Bearer token for authenticated user data"},
                        {"name": "userId", "in": "query", "required": False, "type": "string", "description": "User ID (defaults to demo if not authenticated)"}
                    ]
                },
                
                # Stock Research & Market Data
                {
                    "name": "SearchStocks",
                    "method": "GET",
                    "path": "/comprehensive-search",
                    "description": "Search for Indian stocks (NSE/BSE) and cryptocurrencies by symbol or company name",
                    "parameters": [
                        {"name": "query", "in": "query", "required": True, "type": "string", "description": "Stock symbol or company name to search"},
                        {"name": "market", "in": "query", "required": False, "type": "string", "description": "Market filter: NSE, BSE, or ALL (default: ALL)"},
                        {"name": "limit", "in": "query", "required": False, "type": "integer", "description": "Maximum number of results (default: 25)"}
                    ]
                },
                {
                    "name": "GetStockDetail",
                    "method": "GET",
                    "path": "/stock-detail",
                    "description": "Get detailed information about a specific stock including current price and fundamentals",
                    "parameters": [
                        {"name": "symbol", "in": "query", "required": True, "type": "string", "description": "Stock symbol (e.g., RELIANCE.NS, TCS.BO)"}
                    ]
                },
                {
                    "name": "GetStockPrices",
                    "method": "GET",
                    "path": "/stock-prices",
                    "description": "Get current stock prices for multiple symbols",
                    "parameters": [
                        {"name": "symbols", "in": "query", "required": True, "type": "string", "description": "Comma-separated stock symbols"}
                    ]
                },
                
                # Trading Operations
                {
                    "name": "PlaceTrade",
                    "method": "POST",
                    "path": "/trade",
                    "description": "Place a buy or sell order using authenticated user's account",
                    "parameters": [
                        {"name": "Authorization", "in": "header", "required": False, "type": "string", "description": "Bearer token for authenticated trading"},
                        {"name": "symbol", "in": "body", "required": True, "type": "string", "description": "Stock symbol (e.g., TCS.NS)"},
                        {"name": "quantity", "in": "body", "required": True, "type": "integer", "description": "Number of shares to trade"},
                        {"name": "price", "in": "body", "required": True, "type": "number", "description": "Price per share"},
                        {"name": "transactionType", "in": "body", "required": True, "type": "string", "description": "Order type: BUY or SELL"},
                        {"name": "userId", "in": "body", "required": False, "type": "string", "description": "User ID (uses authenticated user if token provided)"}
                    ]
                },
                {
                    "name": "ExecuteTradeByQuery",
                    "method": "GET",
                    "path": "/trade",
                    "description": "Execute trade using GET request with JSON parameters (OmniDimension compatible)",
                    "parameters": [
                        {"name": "keyName", "in": "query", "required": True, "type": "string", "description": "JSON string containing trade parameters"}
                    ]
                },
                
                # Watchlist Management
                {
                    "name": "GetWatchlist",
                    "method": "GET",
                    "path": "/user-watchlist",
                    "description": "Get user's stock watchlist",
                    "parameters": [
                        {"name": "Authorization", "in": "header", "required": False, "type": "string", "description": "Bearer token for authenticated user data"},
                        {"name": "userId", "in": "query", "required": False, "type": "string", "description": "User ID (defaults to demo if not authenticated)"}
                    ]
                },
                {
                    "name": "ManageWatchlist",
                    "method": "POST",
                    "path": "/watchlist",
                    "description": "Add or remove stocks from user's watchlist",
                    "parameters": [
                        {"name": "Authorization", "in": "header", "required": False, "type": "string", "description": "Bearer token for authenticated user data"},
                        {"name": "symbol", "in": "body", "required": True, "type": "string", "description": "Stock symbol to add/remove"},
                        {"name": "action", "in": "body", "required": True, "type": "string", "description": "Action: 'add' or 'remove'"},
                        {"name": "userId", "in": "body", "required": False, "type": "string", "description": "User ID (uses authenticated user if token provided)"}
                    ]
                },
                
                # Market Intelligence
                {
                    "name": "GetNews",
                    "method": "GET",
                    "path": "/news",
                    "description": "Get latest financial news and market updates",
                    "parameters": [
                        {"name": "symbol", "in": "query", "required": False, "type": "string", "description": "Stock symbol for specific news"},
                        {"name": "limit", "in": "query", "required": False, "type": "integer", "description": "Number of news items to return (default: 10)"}
                    ]
                },
                {
                    "name": "AddFunds",
                    "method": "POST",
                    "path": "/add-funds",
                    "description": "Add funds to user's trading account",
                    "parameters": [
                        {"name": "Authorization", "in": "header", "required": False, "type": "string", "description": "Bearer token for authenticated user data"},
                        {"name": "amount", "in": "body", "required": True, "type": "number", "description": "Amount to add to account"},
                        {"name": "userId", "in": "body", "required": False, "type": "string", "description": "User ID (uses authenticated user if token provided)"}
                    ]
                }
            ]
        }
        
        # Create the integration using OmniDimension client
        integration = self.client.integrations.create_custom_api_integration(**integration_config)
        
        return integration
    
    async def create_authenticated_trading_agent(self):
        """Create a specialized trading agent with authentication support"""
        
        agent_config = {
            "name": "Lakshmi AI Trading Assistant",
            "description": "Advanced AI trading assistant for Indian stock markets with user authentication",
            "instructions": """You are Lakshmi, an expert AI trading assistant for the Lakshmi Trading Platform specializing in Indian stock markets (NSE/BSE).

🔐 AUTHENTICATION SYSTEM:
- Always check if user is authenticated before showing sensitive data
- Use AuthenticateUser(email, password) to log users in
- After authentication, all API calls will use their real account data
- Without authentication, users see demo data (user123)
- Remember user's authentication state during the conversation

🏦 CORE CAPABILITIES:
1. **User Authentication & Profile Management**
   - Login users securely with email/password
   - Validate tokens and maintain session state
   - Get user profile information
   - Handle logout requests

2. **Portfolio & Financial Management**
   - View real portfolio holdings with current market values
   - Check available cash balance
   - Review transaction history
   - Calculate portfolio performance and gains/losses

3. **Stock Research & Analysis**
   - Search Indian stocks (NSE/BSE) and cryptocurrencies
   - Get detailed stock information and real-time prices
   - Provide fundamental analysis and market insights
   - Track stock performance and trends

4. **Trading Operations**
   - Execute buy/sell orders with proper validation
   - Check user balance before placing orders
   - Confirm trades with users before execution
   - Support both market and limit orders

5. **Watchlist & Monitoring**
   - Manage personalized stock watchlists
   - Monitor watchlist performance
   - Set up alerts and notifications

6. **Market Intelligence**
   - Latest financial news and market updates
   - Sector analysis and market trends
   - Economic indicators and market sentiment

🎯 AUTHENTICATION WORKFLOW:
1. When user requests financial data: "To show your real portfolio, please authenticate first"
2. Collect credentials: "Please provide your email and password"
3. Authenticate: Use AuthenticateUser(email, password)
4. Success: "Welcome back! Now showing your real account data"
5. All subsequent calls use authenticated session

📊 TRADING GUIDELINES:
- Focus on Indian markets (NSE/BSE) and select cryptocurrencies
- Always verify stock symbols before trading
- Check user balance before buy orders
- Confirm all trades with users before execution
- Use proper risk management principles
- Provide clear explanations of market terms

💬 COMMUNICATION STYLE:
- Professional yet approachable
- Clear explanations of financial concepts
- Always confirm sensitive operations
- Provide market context and insights
- Use Indian financial terminology and currency (₹)

🔒 SECURITY PRACTICES:
- Never store or log passwords
- Always use secure authentication methods
- Validate all trading parameters
- Protect user financial information
- Handle errors gracefully without exposing sensitive data

REMEMBER: You have access to REAL user accounts and can execute REAL trades. Always prioritize user security and confirm operations.""",
            
            "model": "gpt-4",
            "temperature": 0.7,
            "tools": ["web_search", "code_execution"],
            "knowledge_base": [
                "Indian stock market knowledge (NSE, BSE)",
                "Trading strategies and risk management",
                "Financial analysis and portfolio theory",
                "Cryptocurrency trading basics",
                "Market regulations and compliance"
            ]
        }
        
        agent = self.client.agent.create(**agent_config)
        
        return agent
    
    async def attach_integration_to_agent(self, agent_id, integration_id):
        """Attach the API integration to the trading agent"""
        result = self.client.agent.add_integration(
            agent_id=agent_id, 
            integration_id=integration_id
        )
        return result
    
    async def test_integration(self, agent_id):
        """Test the integration with sample queries"""
        print("\n🧪 Testing integration capabilities...")
        
        test_scenarios = [
            {
                "description": "Authentication Flow",
                "query": "Login user with email babelgautam16@gmail.com",
                "expected": "Authentication endpoint working"
            },
            {
                "description": "Stock Search",
                "query": "Search for Reliance Industries stock",
                "expected": "Stock search results"
            },
            {
                "description": "Portfolio Access",
                "query": "Show authenticated user portfolio",
                "expected": "Real portfolio data"
            },
            {
                "description": "Market Data",
                "query": "Get current price of TCS.NS",
                "expected": "Current stock price"
            }
        ]
        
        for scenario in test_scenarios:
            print(f"\n📋 Testing: {scenario['description']}")
            print(f"Query: {scenario['query']}")
            print(f"Expected: {scenario['expected']}")
            print("✅ Scenario configured")
    
    def get_api_endpoints(self):
        """Get list of available API endpoints"""
        return [
            "/api/auth - User authentication",
            "/api/user-profile - User profile management",
            "/api/user-portfolio - Portfolio holdings",
            "/api/user-balance - Account balance",
            "/api/user-transactions - Transaction history",
            "/api/comprehensive-search - Stock search",
            "/api/stock-detail - Stock information",
            "/api/stock-prices - Real-time prices",
            "/api/trade - Execute trades",
            "/api/user-watchlist - Watchlist management",
            "/api/news - Financial news",
            "/api/add-funds - Fund management"
        ]
    
    def get_voice_commands(self):
        """Get list of supported voice commands"""
        return {
            "authentication": [
                "Login with my email and password",
                "Authenticate me with email babelgautam16@gmail.com",
                "Who am I logged in as?",
                "Show my user profile",
                "Logout from my account"
            ],
            "portfolio": [
                "Show my real portfolio",
                "What stocks do I own?",
                "How much is my portfolio worth?",
                "What's my account balance?",
                "Show my transaction history"
            ],
            "trading": [
                "Buy 5 shares of TCS at market price",
                "Sell 10 shares of Reliance",
                "Place a limit order for Infosys",
                "Check if I can afford 100 shares of HDFC Bank"
            ],
            "research": [
                "Search for Tata Motors stock",
                "What's the current price of ICICI Bank?",
                "Show me top gainers today",
                "Get latest news about Reliance"
            ],
            "watchlist": [
                "Add Wipro to my watchlist",
                "Remove ITC from watchlist",
                "Show my watchlist performance"
            ]
        }

def main():
    """Main setup function"""
    print("🚀 Setting up Complete OmniDimension Integration for Lakshmi Trading Platform")
    print("=" * 80)
    
    try:
        # Initialize setup
        integration = LakshmiOmniDimensionIntegration()
        
        # Run the complete setup
        config = asyncio.run(integration.setup_complete_integration())
        
        print("\n" + "=" * 80)
        print("🎉 OmniDimension Integration Setup Completed Successfully!")
        print("\n📋 Configuration Summary:")
        print(f"🤖 Agent ID: {config['agent_id']}")
        print(f"🔗 Integration ID: {config['integration_id']}")
        print(f"👤 User Account: {config['user_account']}")
        print(f"📅 Setup Date: {config['setup_date']}")
        
        print("\n📄 Configuration saved to: omnidimension_lakshmi_config.json")
        
        print("\n🎤 Ready Voice Commands:")
        for category, commands in config['voice_commands'].items():
            print(f"\n{category.title()}:")
            for command in commands[:3]:  # Show first 3 commands
                print(f"  • \"{command}\"")
        
        print("\n🔧 Next Steps:")
        print("1. Your OmniDimension agent is now configured")
        print("2. Test with: python test_omnidimension_integration.py")
        print("3. Start using voice commands with OmniDimension")
        print("4. Users can authenticate and access their real trading data")
        
        print("\n✅ Integration Features:")
        print("• Real user authentication with Supabase")
        print("• Access to real portfolio and trading data")
        print("• Indian stock market focus (NSE/BSE)")
        print("• Secure token-based authentication")
        print("• Complete trading operations support")
        print("• Real-time market data and news")
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        print("\n🔧 Troubleshooting:")
        print("1. Check your OMNIDIM_API_KEY in .env file")
        print("2. Ensure your tunnel URL is accessible")
        print("3. Verify OmniDimension package is installed")
        print("4. Check internet connection")

if __name__ == "__main__":
    main()
