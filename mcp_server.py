#!/usr/bin/env python3
"""
Model Context Protocol (MCP) Server for OmniDimension Integration with Authentication
This runs the MCP server that allows Claude Desktop or other MCP clients to interact with OmniDimension
"""

import os
import asyncio
import json
import requests
from dotenv import load_dotenv
from omnidimension.mcp_server import MCPServer

# Load environment variables
load_dotenv()

class LakshmiMCPServer:
    def __init__(self):
        self.api_key = os.getenv("OMNIDIM_API_KEY")
        self.base_url = os.getenv("LOCAL_BASE_URL", "http://localhost:3000")
        self.server = None
        self.authenticated_users = {}  # Store authenticated user sessions
        
        if not self.api_key:
            raise ValueError("OMNIDIM_API_KEY not found in environment variables")
    
    async def start_server(self, port=8080):
        """Start the MCP server"""
        try:
            print(f"🚀 Starting Lakshmi MCP Server on port {port}...")
            print(f"🔑 Using API Key: {self.api_key[:8]}...")
            
            # Initialize MCP Server with OmniDimension
            self.server = MCPServer(api_key=self.api_key)
            
            # Add custom tools for Lakshmi Trading Platform
            await self.register_trading_tools()
            
            # Start the server
            await self.server.start(port=port)
            
        except Exception as e:
            print(f"❌ Failed to start MCP server: {e}")
            raise
    
    async def register_trading_tools(self):
        """Register custom trading tools with the MCP server"""
        
        # Authentication Tools
        await self.server.add_tool(
            name="authenticate_user",
            description="Authenticate a user with email and password",
            parameters={
                "type": "object",
                "properties": {
                    "email": {"type": "string", "description": "User email address"},
                    "password": {"type": "string", "description": "User password"}
                },
                "required": ["email", "password"]
            }
        )
        
        await self.server.add_tool(
            name="get_user_profile",
            description="Get authenticated user's profile information",
            parameters={
                "type": "object",
                "properties": {
                    "userId": {"type": "string", "description": "User ID (optional if authenticated)"}
                }
            }
        )
        
        await self.server.add_tool(
            name="logout_user",
            description="Logout the current authenticated user",
            parameters={
                "type": "object",
                "properties": {
                    "userId": {"type": "string", "description": "User ID to logout"}
                }
            }
        )
        
        # Portfolio Management Tools
        await self.server.add_tool(
            name="get_portfolio",
            description="Get user's current portfolio holdings (requires authentication for real data)",
            parameters={
                "type": "object",
                "properties": {
                    "userId": {"type": "string", "description": "User ID (default: user123 for demo)"}
                }
            }
        )
        
        await self.server.add_tool(
            name="get_balance",
            description="Get user's available cash balance (requires authentication for real data)",
            parameters={
                "type": "object", 
                "properties": {
                    "userId": {"type": "string", "description": "User ID (default: user123 for demo)"}
                }
            }
        )
        
        # Trading Tools
        await self.server.add_tool(
            name="place_trade",
            description="Place a buy or sell order",
            parameters={
                "type": "object",
                "properties": {
                    "symbol": {"type": "string", "description": "Stock symbol"},
                    "quantity": {"type": "number", "description": "Number of shares"},
                    "price": {"type": "number", "description": "Price per share"},
                    "transactionType": {"type": "string", "enum": ["BUY", "SELL"], "description": "Order type"},
                    "userId": {"type": "string", "description": "User ID (default: user123)"}
                },
                "required": ["symbol", "quantity", "price", "transactionType"]
            }
        )
        
        # Stock Research Tools
        await self.server.add_tool(
            name="get_stock_info",
            description="Get detailed stock information including current price",
            parameters={
                "type": "object",
                "properties": {
                    "symbol": {"type": "string", "description": "Stock symbol"}
                },
                "required": ["symbol"]
            }
        )
        
        await self.server.add_tool(
            name="search_stocks",
            description="Search for stocks by company name or symbol",
            parameters={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"}
                },
                "required": ["query"]
            }
        )
        
        # Watchlist Tools
        await self.server.add_tool(
            name="get_watchlist",
            description="Get user's stock watchlist",
            parameters={
                "type": "object",
                "properties": {
                    "userId": {"type": "string", "description": "User ID (default: user123)"}
                }
            }
        )
        
        await self.server.add_tool(
            name="manage_watchlist",
            description="Add or remove stocks from watchlist",
            parameters={
                "type": "object",
                "properties": {
                    "symbol": {"type": "string", "description": "Stock symbol"},
                    "action": {"type": "string", "enum": ["add", "remove"], "description": "Action to perform"},
                    "userId": {"type": "string", "description": "User ID (default: user123)"}
                },
                "required": ["symbol", "action"]
            }
        )
        
        print("✅ Trading tools registered successfully!")

    # Authentication Methods
    async def authenticate_user(self, email: str, password: str):
        """Authenticate user with email and password"""
        try:
            response = requests.post(
                f"{self.base_url}/api/auth",
                json={"email": email, "password": password},
                timeout=10
            )
            
            if response.status_code == 200:
                auth_data = response.json()
                if auth_data.get("success"):
                    # Store authenticated user session
                    user_id = auth_data["user"]["id"]
                    self.authenticated_users[user_id] = {
                        "user": auth_data["user"],
                        "token": auth_data["session"]["access_token"],
                        "expires_at": auth_data["session"]["expires_at"]
                    }
                    
                    return {
                        "success": True,
                        "message": f"Welcome back, {auth_data['user']['name']}!",
                        "user": auth_data["user"],
                        "authenticated": True
                    }
                else:
                    return {"success": False, "error": auth_data.get("error", "Authentication failed")}
            else:
                return {"success": False, "error": f"Authentication failed with status {response.status_code}"}
                
        except Exception as e:
            return {"success": False, "error": f"Authentication error: {str(e)}"}
    
    async def get_user_profile(self, userId: str = None):
        """Get user profile information"""
        try:
            # If userId is provided and we have their auth token, use it
            headers = {}
            if userId and userId in self.authenticated_users:
                headers["Authorization"] = f"Bearer {self.authenticated_users[userId]['token']}"
            
            params = {}
            if userId:
                params["userId"] = userId
            
            response = requests.get(
                f"{self.base_url}/api/user-profile",
                params=params,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"success": False, "error": f"Failed to get profile: {response.status_code}"}
                
        except Exception as e:
            return {"success": False, "error": f"Profile error: {str(e)}"}
    
    async def logout_user(self, userId: str):
        """Logout user and clear their session"""
        try:
            if userId in self.authenticated_users:
                user_name = self.authenticated_users[userId]["user"]["name"]
                del self.authenticated_users[userId]
                return {
                    "success": True,
                    "message": f"Goodbye, {user_name}! You have been logged out successfully."
                }
            else:
                return {"success": False, "error": "User not found or already logged out"}
                
        except Exception as e:
            return {"success": False, "error": f"Logout error: {str(e)}"}
    
    def get_auth_headers(self, userId: str = None):
        """Get authentication headers for API calls"""
        if userId and userId in self.authenticated_users:
            return {"Authorization": f"Bearer {self.authenticated_users[userId]['token']}"}
        return {}

    # Enhanced API Methods with Authentication Support
    async def get_portfolio_with_auth(self, userId: str = None):
        """Get portfolio with authentication support"""
        try:
            headers = self.get_auth_headers(userId)
            params = {}
            if userId:
                params["userId"] = userId
            
            response = requests.get(
                f"{self.base_url}/api/user-portfolio",
                params=params,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                # Add authentication status to response
                result["authenticated"] = userId in self.authenticated_users if userId else False
                return result
            else:
                return {"success": False, "error": f"Failed to get portfolio: {response.status_code}"}
                
        except Exception as e:
            return {"success": False, "error": f"Portfolio error: {str(e)}"}
    
    async def get_balance_with_auth(self, userId: str = None):
        """Get balance with authentication support"""
        try:
            headers = self.get_auth_headers(userId)
            params = {}
            if userId:
                params["userId"] = userId
            
            response = requests.get(
                f"{self.base_url}/api/user-balance",
                params=params,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                # Add authentication status to response
                result["authenticated"] = userId in self.authenticated_users if userId else False
                return result
            else:
                return {"success": False, "error": f"Failed to get balance: {response.status_code}"}
                
        except Exception as e:
            return {"success": False, "error": f"Balance error: {str(e)}"}

        print("✅ Trading tools with authentication registered successfully!")
        
def main():
    """Main function to start the MCP server"""
    try:
        server = LakshmiMCPServer()
        
        # Start the server
        asyncio.run(server.start_server())
        
    except KeyboardInterrupt:
        print("\n👋 MCP Server stopped by user")
    except Exception as e:
        print(f"❌ MCP Server error: {e}")

if __name__ == "__main__":
    main()
