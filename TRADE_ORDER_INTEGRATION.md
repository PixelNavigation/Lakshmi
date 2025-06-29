# Lakshmi Trading Platform - Place Trade Order Integration

## Overview

The **Place Trade Order** endpoint enables OmniDimension to execute buy and sell orders for Indian stocks on the Lakshmi Trading Platform. This endpoint is specifically designed for Indian stock markets (NSE/BSE) and includes comprehensive validation, portfolio management, and transaction recording.

## Endpoint Details

**URL:** `POST /api/trade`  
**Content-Type:** `application/json`  
**CORS:** Fully enabled for cross-origin requests

## Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | ✅ | User identifier (default: "user123") |
| `symbol` | string | ✅ | Indian stock symbol (e.g., "TCS", "INFY", "RELIANCE") |
| `quantity` | number | ✅ | Number of shares to buy/sell (must be positive) |
| `price` | number | ✅ | Price per share in INR (must be positive) |
| `transactionType` | string | ✅ | Must be "BUY" or "SELL" (uppercase only) |

## Indian Stock Symbol Conversion

The endpoint automatically converts Indian stock symbols to NSE format:

- **Input:** `TCS` → **Output:** `TCS.NS`
- **Input:** `RELIANCE` → **Output:** `RELIANCE.NS`
- **Input:** `HDFCBANK` → **Output:** `HDFCBANK.NS`

### Supported Indian Stocks
- TCS (Tata Consultancy Services)
- INFY (Infosys)
- RELIANCE (Reliance Industries)
- HDFCBANK (HDFC Bank)
- ITC (ITC Limited)
- SBIN (State Bank of India)
- ICICIBANK (ICICI Bank)
- BHARTIARTL (Bharti Airtel)
- HINDUNILVR (Hindustan Unilever)
- KOTAKBANK (Kotak Mahindra Bank)

### Blocked Foreign Stocks
Foreign stocks are explicitly blocked and will return an error:
- AAPL, GOOGL, MSFT, TSLA, AMZN, META, NFLX, NVDA

## Request Example

```json
{
  "userId": "user123",
  "symbol": "TCS",
  "quantity": 5,
  "price": 3500.50,
  "transactionType": "BUY"
}
```

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "message": "BUY order executed successfully",
  "transaction": {
    "symbol": "TCS.NS",
    "original_symbol": "TCS",
    "quantity": 5,
    "price": 3500.50,
    "total_amount": 17502.50,
    "type": "BUY"
  }
}
```

### Error Responses

#### Missing Parameters (400)
```json
{
  "success": false,
  "error": "Missing required fields: userId, symbol, quantity, price, transactionType"
}
```

#### Invalid Values (400)
```json
{
  "success": false,
  "error": "Quantity and price must be positive"
}
```

#### Foreign Stock Blocked (400)
```json
{
  "success": false,
  "error": "Foreign stock AAPL not supported. Please use Indian stocks (NSE/BSE) only."
}
```

#### Insufficient Balance (400)
```json
{
  "success": false,
  "error": "Insufficient balance"
}
```

#### Insufficient Holdings (400)
```json
{
  "success": false,
  "error": "Insufficient holdings"
}
```

## Business Logic

### BUY Orders
1. **Validation:** Check user balance, validate parameters
2. **Balance Check:** Ensure sufficient INR balance for purchase
3. **Balance Update:** Deduct total amount from user's INR balance
4. **Portfolio Update:** 
   - If stock already owned: Update quantity, average price, total invested
   - If new stock: Create new portfolio entry
5. **Transaction Record:** Log the transaction for audit purposes

### SELL Orders
1. **Validation:** Check user holdings, validate parameters
2. **Holdings Check:** Ensure sufficient shares to sell
3. **Balance Update:** Add sale proceeds to user's INR balance
4. **Portfolio Update:**
   - If remaining quantity > 0: Update quantity and total invested
   - If remaining quantity = 0: Remove portfolio entry
5. **Transaction Record:** Log the transaction for audit purposes

## OmniDimension Integration

### Parameter Mapping
OmniDimension can use its standard parameter names, which will be automatically mapped:
- `keyName` → `userId` (fallback parameter name)

### Example OmniDimension Request
```javascript
// OmniDimension API call
{
  "userId": "user123",           // or use "keyName": "user123"
  "symbol": "RELIANCE",         // Will auto-convert to RELIANCE.NS
  "quantity": 10,
  "price": 2500.75,
  "transactionType": "BUY"
}
```

### Integration Steps for OmniDimension

1. **API Configuration:**
   ```json
   {
     "method": "POST",
     "url": "https://your-tunnel-url.devtunnels.ms/api/trade",
     "headers": {
       "Content-Type": "application/json"
     }
   }
   ```

2. **Agent Prompt Configuration:**
   ```
   When users want to trade Indian stocks:
   - Use PlaceTradeOrder API for buy/sell orders
   - Only suggest Indian stocks (TCS, INFY, RELIANCE, etc.)
   - Confirm trade details before execution
   - All prices are in Indian Rupees (INR)
   ```

3. **Error Handling:**
   - Handle foreign stock rejections gracefully
   - Provide alternative Indian stock suggestions
   - Explain balance/holdings insufficiency clearly

## Testing

### Test with curl
```bash
# Buy Order Test
curl -X POST "https://your-tunnel-url.devtunnels.ms/api/trade" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "symbol": "TCS",
    "quantity": 1,
    "price": 3500,
    "transactionType": "BUY"
  }'

# Sell Order Test
curl -X POST "https://your-tunnel-url.devtunnels.ms/api/trade" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "symbol": "TCS",
    "quantity": 1,
    "price": 3600,
    "transactionType": "SELL"
  }'
```

### Test with Python
```python
import requests

# Test Buy Order
response = requests.post(
    "https://your-tunnel-url.devtunnels.ms/api/trade",
    json={
        "userId": "user123",
        "symbol": "INFY",
        "quantity": 2,
        "price": 1500.25,
        "transactionType": "BUY"
    }
)
print(response.json())
```

## Security Features

- **CORS Enabled:** Full cross-origin support for OmniDimension
- **Input Validation:** Comprehensive parameter validation
- **Stock Filtering:** Automatic blocking of foreign stocks
- **Balance Protection:** Prevents overdraft or overselling
- **Transaction Atomicity:** Database operations are transactional
- **Error Handling:** Graceful error responses with clear messages

## Performance Considerations

- **Fast Validation:** Quick parameter and balance checks
- **Optimized Queries:** Efficient database operations
- **Error Early:** Fast-fail on invalid inputs
- **Transaction Logging:** Async transaction recording where possible

## Support

For integration support or issues:
1. Check the comprehensive test suite in `test_integration.py`
2. Review error messages for specific validation failures
3. Verify Indian stock symbols are being used
4. Ensure all required parameters are provided with correct types

---

**Last Updated:** June 30, 2025  
**API Version:** 1.0  
**Compatible with:** OmniDimension AI Platform
