#!/usr/bin/env python3
"""
Model Context Protocol (MCP) Server for OmniDimension Integration
This runs the MCP server that allows Claude Desktop or other MCP clients to interact with OmniDimension
"""

import os
import asyncio
import json
from dotenv import load_dotenv
from omnidimension.mcp_server import MCPServer

# Load environment variables
load_dotenv()

class LakshmiMCPServer:
    def __init__(self):
        self.api_key = os.getenv("OMNIDIM_API_KEY")
        self.server = None
        
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
        
        # Portfolio Management Tools
        await self.server.add_tool(
            name="get_portfolio",
            description="Get user's current portfolio holdings",
            parameters={
                "type": "object",
                "properties": {
                    "userId": {"type": "string", "description": "User ID (default: user123)"}
                }
            }
        )
        
        await self.server.add_tool(
            name="get_balance",
            description="Get user's available cash balance",
            parameters={
                "type": "object", 
                "properties": {
                    "userId": {"type": "string", "description": "User ID (default: user123)"}
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
