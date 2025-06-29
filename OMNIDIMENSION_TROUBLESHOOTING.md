# OmniDimension Integration Troubleshooting Guide

## Problem: AI Agent Acting Like Generic Customer Service

### Symptoms:
- Agent responds as general customer service representative
- Asks for name, email, registration status
- Doesn't use trading-specific knowledge or APIs
- Doesn't recognize itself as a trading assistant

### Root Causes & Solutions:

## 1. **Incorrect System Prompt**
**Problem**: Generic or missing system prompt
**Solution**: Use the improved system prompt from `lakshmi_omnidimension_config_improved.json`:

```
You are Lakshmi, an intelligent stock trading assistant for the Lakshmi Trading Platform.

Your Identity:
- You are a professional AI trading assistant, NOT a customer service representative
- You help users manage their stock portfolio and execute trades
- You have access to real-time stock data and portfolio information
- You work exclusively with the Lakshmi Trading Platform
...
```

## 2. **API Integration Not Connected**
**Problem**: Agent created but API integration not linked
**Solution**: 
1. Go to your agent settings in OmniDimension
2. Click "Integrations" or "Connected APIs"
3. Add the LakshmiTradingAPI integration
4. Enable all 4 endpoints:
   - GetStockDetail
   - GetUserPortfolio  
   - GetUserBalance
   - PlaceTradeOrder

## 3. **Wrong Agent Model/Settings**
**Problem**: Agent using wrong model or configuration
**Solution**:
- Use GPT-4 or GPT-4-turbo (not GPT-3.5)
- Set temperature to 0.3-0.7 for balanced responses
- Ensure "Use External APIs" is enabled

## 4. **API Integration Configuration Issues**
**Problem**: Endpoints not properly configured
**Solution**: Verify each endpoint in OmniDimension:

### GetUserBalance
- Method: GET
- URL: `/api/user-balance`
- Parameters: userId (query, required)

### GetUserPortfolio  
- Method: GET
- URL: `/api/user-portfolio`
- Parameters: userId (query, required)

### GetStockDetail
- Method: GET  
- URL: `/api/stock-detail`
- Parameters: symbol (query, required)

### PlaceTradeOrder
- Method: POST
- URL: `/api/trade`
- Body Parameters: userId, symbol, quantity, price, transactionType

## 5. **Testing Commands**

### ✅ Good Test Commands:
```
"What's my portfolio balance?"
"Show me my current stock holdings"  
"What's the current price of Apple stock?"
"Buy 5 shares of Tesla at current market price"
"What's my total portfolio value?"
```

### ❌ Avoid These Commands:
```
"Hi, I need help with my account" (too generic)
"What services do you offer?" (sounds like customer service)
"Can you help me register?" (not trading-specific)
```

## 6. **Debug Steps**

### Step 1: Test API Endpoints
Run: `python test_integration.py`
All 6 tests should pass.

### Step 2: Check Agent System Prompt
- Copy the exact system prompt from `lakshmi_omnidimension_config_improved.json`
- Make sure it's properly saved in OmniDimension

### Step 3: Verify API Connection
- In OmniDimension agent settings, confirm LakshmiTradingAPI is connected
- Test each endpoint individually

### Step 4: Test with Specific Commands
Start with: "What's my portfolio balance?"
The agent should:
1. Call GetUserBalance API
2. Return actual balance (₹13,929,666,636.5)
3. Respond as a trading assistant, not customer service

## 7. **Expected Correct Response**

**Your Command**: "What's my portfolio balance?"

**Expected Response**: 
```
"I'll check your current portfolio balance for you.

Your account balance is:
- INR: ₹13,929,666,636.5
- ETH: 11,000,000

You also have current holdings in your portfolio. Would you like me to show you your stock positions as well?"
```

**Wrong Response** (what you're getting):
```
"Hi, I'm calling to assist you with the setup and management of your portfolio project. Could you confirm your name and if you are already registered in our system?"
```

## 8. **Quick Fix Checklist**

- [ ] System prompt copied exactly from improved config
- [ ] Agent model set to GPT-4
- [ ] LakshmiTradingAPI integration connected
- [ ] All 4 endpoints properly configured
- [ ] Base URL set to: `https://wwws68kj-3000.inc1.devtunnels.ms`
- [ ] Test command: "What's my portfolio balance?"

## 9. **Contact Support**

If issues persist:
1. Share your agent configuration with OmniDimension support
2. Mention you're integrating a custom trading API
3. Reference this troubleshooting guide
