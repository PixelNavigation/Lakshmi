# OmniDimension Integration Setup Guide

This guide will help you integrate OmniDimension AI agents with your Lakshmi Trading Platform.

## Prerequisites

1. **OmniDimension Account**: Sign up at [OmniDimension](https://omnidimension.ai) and get your API key
2. **Python 3.8+**: Required for running the integration scripts
3. **ngrok or localtunnel**: To expose your local server to the internet

## Step 1: Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install ngrok (choose one method)
# Method 1: Download from https://ngrok.com/download
# Method 2: Using npm
npm install -g ngrok

# Method 3: Using chocolatey (Windows)
choco install ngrok
```

## Step 2: Configure Environment Variables

1. Copy your OmniDimension API key
2. Update `.env.local`:

```bash
# Add these lines to your .env.local file
OMNIDIM_API_KEY=your_actual_api_key_here
NGROK_URL=https://your-ngrok-url.ngrok.io
LOCAL_API_PORT=3000
```

## Step 3: Expose Your Local Server

1. **Start your Next.js application**:
```bash
npm run dev
# Your app should be running on http://localhost:3000
```

2. **In a new terminal, start ngrok**:
```bash
ngrok http 3000
```

3. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`) and update your `.env.local`:
```bash
NGROK_URL=https://abc123.ngrok.io
```

## Step 4: Run the Integration Setup

```bash
python omnidimension_setup.py
```

This script will:
- ✅ Create a custom API integration for your trading platform
- ✅ Set up an intelligent trading agent
- ✅ Connect the integration to the agent
- ✅ Save configuration for future use

## Step 5: Start the MCP Server (Optional)

For Claude Desktop integration:

```bash
python mcp_server.py
```

## Step 6: Test the Integration

Once setup is complete, you can interact with your trading agent using:

### Voice Commands (via OmniDimension app):
- "What's my current portfolio balance?"
- "Buy 10 shares of Apple at market price"
- "What's the current price of Tesla?"
- "Show me my recent transactions"
- "Add Microsoft to my watchlist"

### Text Commands (via OmniDimension chat):
- Portfolio analysis and recommendations
- Real-time stock research
- Trade execution with risk management
- News and market updates

## Available API Endpoints

Your integration exposes these endpoints to the AI agent:

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/stock-detail` | GET | Get stock price and details |
| `/api/user-portfolio` | GET | Get user's portfolio holdings |
| `/api/user-balance` | GET | Get available cash balance |
| `/api/trade` | POST | Place buy/sell orders |
| `/api/user-transactions` | GET | Get transaction history |
| `/api/user-watchlist` | GET/POST | Manage stock watchlist |
| `/api/news` | GET | Get market news |
| `/api/comprehensive-search` | GET | Search for stocks |

## Security Best Practices

1. **Keep ngrok URL secure**: Don't share your ngrok URL publicly
2. **Rotate API keys**: Regularly update your OmniDimension API key
3. **Monitor usage**: Check your API usage in the OmniDimension dashboard
4. **Test in development**: Always test trades with small amounts first

## Troubleshooting

### Common Issues:

1. **"Integration creation failed"**
   - Check your API key is correct
   - Ensure ngrok is running and URL is accessible
   - Verify your Next.js app is running

2. **"Cannot access local API"**
   - Confirm ngrok URL in `.env.local` matches the actual ngrok URL
   - Check your Next.js app is running on the correct port
   - Test API endpoints directly using curl or Postman

3. **"Agent not responding"**
   - Wait a few minutes for the integration to propagate
   - Check the OmniDimension dashboard for any errors
   - Restart the MCP server if using Claude Desktop

### Testing API Connectivity:

```bash
# Test your ngrok connection
curl https://your-ngrok-url.ngrok.io/api/user-balance?userId=user123

# Should return something like:
# {"success": true, "balances": {"inr": 10000, "eth": 0}}
```

## Example Conversations

### Portfolio Management:
**User**: "How's my portfolio performing today?"
**Agent**: "Let me check your current holdings... You have 3 stocks in your portfolio with a total value of ₹45,230. Your top performer is AAPL with a 5.2% gain today."

### Trade Execution:
**User**: "I want to buy some Tesla stock"
**Agent**: "Tesla (TSLA) is currently trading at $245.30. How many shares would you like to buy? Your available balance is ₹50,000."
**User**: "Buy 5 shares"
**Agent**: "I'll place a buy order for 5 shares of TSLA at $245.30. Total cost will be $1,226.50. Shall I proceed?"

### Research & Analysis:
**User**: "What do you think about Apple stock?"
**Agent**: "Apple (AAPL) is currently at $185.20, up 2.1% today. Based on recent news and technical indicators, it's showing strong momentum. Would you like me to add it to your watchlist or place an order?"

## Next Steps

1. **Customize the agent**: Modify the system prompt in `omnidimension_setup.py` to match your trading style
2. **Add more endpoints**: Extend the integration with additional API endpoints
3. **Set up alerts**: Configure price alerts and portfolio notifications
4. **Deploy to production**: When ready, deploy your app and use a permanent URL instead of ngrok

---

For support, check the [OmniDimension documentation](https://docs.omnidimension.ai) or reach out to their support team.
