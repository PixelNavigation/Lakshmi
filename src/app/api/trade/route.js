import { supabase } from '@/lib/supabase'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
}

// Helper function to get authenticated user
async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return null
  
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  return error ? null : user
}

// Function to get current stock price (shared for both GET and POST)
const getCurrentStockPrice = async (symbol) => {
  try {
    // Call your own stock-detail API for real-time price
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stock-detail?symbol=${encodeURIComponent(symbol)}&current=true`
    );
    const result = await response.json();
    if (result.success && result.data && typeof result.data.price === 'number') {
      return result.data.price;
    } else {
      throw new Error(result.error || 'No price data');
    }
  } catch (error) {
    console.error('Error fetching real-time stock price:', error);
    return 100; // Fallback price
  }
}

export async function OPTIONS(request) {
  return new Response(null, { status: 200, headers: corsHeaders })
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Check if this is a trade execution request or just endpoint discovery
    const keyName = searchParams.get('keyName')
    
    // If keyName contains JSON data with trade fields, parse it and execute the trade
    if (keyName && (keyName.includes('symbol') || keyName.includes('quantity') || keyName.includes('transactionType'))) {
      try {
        // Parse the JSON from keyName parameter
        const tradeData = JSON.parse(keyName)
        
        // First, try to get authenticated user
        const authUser = await getAuthenticatedUser(request)
        
        // Support both original and OmniDimension parameter names
        let userId = tradeData.userId
        
        // Use authenticated user ID if available, otherwise fall back to parameter
        if (authUser) {
          userId = authUser.id
          console.log('✅ Using authenticated user for trade:', userId)
        } else if (!userId) {
          // REQUIRE authentication for trades - no more default demo user
          return Response.json({ 
            success: false, 
            error: 'Authentication required for trading. Please provide valid Authorization header with Bearer token.' 
          }, { 
            status: 401,
            headers: corsHeaders 
          })
        }
        const symbol = tradeData.symbol
        const quantity = tradeData.quantity 
        // Remove price requirement - we'll fetch current price
        const transactionType = tradeData.transactionType

        if (!symbol || !quantity || !transactionType) {
          return Response.json({ 
            success: false, 
            error: 'Missing required fields: symbol, quantity, transactionType' 
          }, { 
            status: 400,
            headers: corsHeaders 
          })
        }

        if (quantity <= 0) {
          return Response.json({ success: false, error: 'Quantity must be positive' }, { 
            status: 400,
            headers: corsHeaders 
          })
        }

        if (!['BUY', 'SELL'].includes(transactionType)) {
          return Response.json({ success: false, error: 'Invalid transaction type' }, { 
            status: 400,
            headers: corsHeaders 
          })
        }

        // Convert to Indian stock symbol and validate
        const convertToIndianSymbol = (symbol) => {
          const upperSymbol = symbol.toUpperCase()
          
          // Check if it's already an Indian stock symbol
          if (upperSymbol.endsWith('.NS') || upperSymbol.endsWith('.BO')) {
            return upperSymbol
          }
          
          // Common Indian stock mappings
          const indianStocks = {
            'TCS': 'TCS.NS',
            'INFY': 'INFY.NS', 
            'RELIANCE': 'RELIANCE.NS',
            'HDFCBANK': 'HDFCBANK.NS',
            'ITC': 'ITC.NS',
            'SBIN': 'SBIN.NS',
            'ICICIBANK': 'ICICIBANK.NS',
            'BHARTIARTL': 'BHARTIARTL.NS',
            'HINDUNILVR': 'HINDUNILVR.NS',
            'KOTAKBANK': 'KOTAKBANK.NS'
          }
          
          if (indianStocks[upperSymbol]) {
            return indianStocks[upperSymbol]
          }
          
          // Block known foreign stocks
          const foreignStocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NFLX', 'NVDA']
          if (foreignStocks.includes(upperSymbol)) {
            throw new Error(`Foreign stock ${upperSymbol} not supported. Please use Indian stocks (NSE/BSE) only.`)
          }
          
          // Default to NSE for other symbols
          return `${upperSymbol}.NS`
        }

        let indianSymbol
        try {
          indianSymbol = convertToIndianSymbol(symbol)
        } catch (error) {
          return Response.json({ 
            success: false, 
            error: error.message 
          }, { 
            status: 400,
            headers: corsHeaders 
          })
        }

        // Get current price for the stock
        const currentPrice = await getCurrentStockPrice(indianSymbol)
        console.log(`📈 Current price for ${indianSymbol}: ₹${currentPrice}`)

        const totalAmount = quantity * currentPrice

        // Execute the trade logic (same as POST method)
        const { data: currentBalance, error: balanceError } = await supabase
          .from('user_balances')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (balanceError) {
          return Response.json({ success: false, error: 'Failed to fetch balance' }, { 
            status: 500,
            headers: corsHeaders 
          })
        }

        if (transactionType === 'BUY') {
          // Check if user has sufficient INR balance
          if (parseFloat(currentBalance.inr_balance) < totalAmount) {
            return Response.json({ success: false, error: 'Insufficient balance' }, { 
              status: 400,
              headers: corsHeaders 
            })
          }

          // Deduct INR balance
          const { error: balanceUpdateError } = await supabase
            .from('user_balances')
            .update({
              inr_balance: (parseFloat(currentBalance.inr_balance) - totalAmount).toFixed(2),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)

          if (balanceUpdateError) {
            return Response.json({ success: false, error: 'Failed to update balance' }, { 
              status: 500,
              headers: corsHeaders 
            })
          }

          // Update or insert portfolio
          const { data: existingHolding, error: portfolioFetchError } = await supabase
            .from('user_portfolio')
            .select('*')
            .eq('user_id', userId)
            .eq('symbol', indianSymbol)
            .single()

          if (portfolioFetchError && portfolioFetchError.code !== 'PGRST116') {
            return Response.json({ success: false, error: 'Failed to fetch portfolio' }, { 
              status: 500,
              headers: corsHeaders 
            })
          }

          if (existingHolding) {
            // Update existing holding
            const newQuantity = parseFloat(existingHolding.quantity) + quantity
            const newTotalInvested = parseFloat(existingHolding.total_invested) + totalAmount
            const newAvgPrice = newTotalInvested / newQuantity

            const { error: portfolioUpdateError } = await supabase
              .from('user_portfolio')
              .update({
                quantity: newQuantity.toFixed(8),
                avg_buy_price: newAvgPrice.toFixed(2),
                total_invested: newTotalInvested.toFixed(2),
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userId)
              .eq('symbol', indianSymbol)

            if (portfolioUpdateError) {
              return Response.json({ success: false, error: 'Failed to update portfolio' }, { 
                status: 500,
                headers: corsHeaders 
              })
            }
          } else {
            // Create new holding
            const { error: portfolioInsertError } = await supabase
              .from('user_portfolio')
              .insert({
                user_id: userId,
                symbol: indianSymbol,
                quantity: quantity.toFixed(8),
                avg_buy_price: currentPrice.toFixed(2),
                total_invested: totalAmount.toFixed(2)
              })

            if (portfolioInsertError) {
              return Response.json({ success: false, error: 'Failed to create portfolio entry' }, { 
                status: 500,
                headers: corsHeaders 
              })
            }
          }
        } else if (transactionType === 'SELL') {
          // Check if user has sufficient holdings
          const { data: existingHolding, error: portfolioFetchError } = await supabase
            .from('user_portfolio')
            .select('*')
            .eq('user_id', userId)
            .eq('symbol', indianSymbol)
            .single()

          if (portfolioFetchError || !existingHolding) {
            return Response.json({ success: false, error: 'No holdings found for this symbol' }, { 
              status: 400,
              headers: corsHeaders 
            })
          }

          if (parseFloat(existingHolding.quantity) < quantity) {
            return Response.json({ success: false, error: 'Insufficient holdings' }, { 
              status: 400,
              headers: corsHeaders 
            })
          }

          // Add INR balance
          const { error: balanceUpdateError } = await supabase
            .from('user_balances')
            .update({
              inr_balance: (parseFloat(currentBalance.inr_balance) + totalAmount).toFixed(2),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)

          if (balanceUpdateError) {
            return Response.json({ success: false, error: 'Failed to update balance' }, { 
              status: 500,
              headers: corsHeaders 
            })
          }

          // Update portfolio
          const newQuantity = parseFloat(existingHolding.quantity) - quantity
          const soldInvestment = (parseFloat(existingHolding.total_invested) / parseFloat(existingHolding.quantity)) * quantity
          const newTotalInvested = parseFloat(existingHolding.total_invested) - soldInvestment

          if (newQuantity <= 0) {
            // Remove holding if quantity becomes 0
            const { error: portfolioDeleteError } = await supabase
              .from('user_portfolio')
              .delete()
              .eq('user_id', userId)
              .eq('symbol', indianSymbol)

            if (portfolioDeleteError) {
              return Response.json({ success: false, error: 'Failed to update portfolio' }, { 
                status: 500,
                headers: corsHeaders 
              })
            }
          } else {
            // Update holding
            const { error: portfolioUpdateError } = await supabase
              .from('user_portfolio')
              .update({
                quantity: newQuantity.toFixed(8),
                total_invested: newTotalInvested.toFixed(2),
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userId)
              .eq('symbol', indianSymbol)

            if (portfolioUpdateError) {
              return Response.json({ success: false, error: 'Failed to update portfolio' }, { 
                status: 500,
                headers: corsHeaders 
              })
            }
          }
        }

        // Record transaction
        const { error: transactionError } = await supabase
          .from('user_transactions')
          .insert({
            user_id: userId,
            symbol: indianSymbol,
            transaction_type: transactionType,
            quantity: quantity.toFixed(8),
            price: currentPrice.toFixed(2),
            total_amount: totalAmount.toFixed(2)
          })

        if (transactionError) {
          console.error('Transaction record error:', transactionError)
          // Don't fail the whole transaction for logging error
        }

        return Response.json({
          success: true,
          message: `${transactionType} order executed successfully`,
          transaction: {
            symbol: indianSymbol,
            original_symbol: symbol,
            quantity,
            price: currentPrice,
            total_amount: totalAmount,
            type: transactionType
          }
        }, { headers: corsHeaders })

      } catch (parseError) {
        // If JSON parsing fails, treat as endpoint discovery
        console.log('JSON parse error, treating as endpoint discovery:', parseError)
      }
    }
    
    // Default response for endpoint discovery
    return Response.json({
      success: true,
      message: "Lakshmi Trading API - Place Trade Order Endpoint",
      description: "Supports both GET and POST methods for OmniDimension compatibility",
      methods: ["GET", "POST"],
      parameters: {
        userId: "string (optional) - User ID (auto-detected from auth)",
        symbol: "string (required) - Indian stock symbol (TCS, INFY, RELIANCE)",
        quantity: "number (required) - Number of shares (positive)",
        transactionType: "string (required) - BUY or SELL (uppercase)"
      },
      example_get: "?keyName={\"symbol\":\"TCS\",\"quantity\":5,\"transactionType\":\"BUY\"}",
      example_post: {
        symbol: "TCS",
        quantity: 5,
        transactionType: "BUY"
      },
      supported_stocks: ["TCS", "INFY", "RELIANCE", "HDFCBANK", "ITC", "SBIN", "ICICIBANK"],
      blocked_stocks: ["AAPL", "TSLA", "GOOGL", "MSFT", "AMZN", "META"]
    }, { headers: corsHeaders })
    
  } catch (error) {
    console.error('GET API error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    
    // First, try to get authenticated user
    const authUser = await getAuthenticatedUser(request)
    
    // Support both original and OmniDimension parameter names
    let userId = body.userId || body.keyName
    
    // Use authenticated user ID if available, otherwise fall back to parameter
    if (authUser) {
      userId = authUser.id
      console.log('✅ Using authenticated user for POST trade:', userId)
    } else if (!userId) {
      // REQUIRE authentication for trades - no more default demo user
      return Response.json({ 
        success: false, 
        error: 'Authentication required for trading. Please provide valid Authorization header with Bearer token.' 
      }, { 
        status: 401,
        headers: corsHeaders 
      })
    }
    
    const symbol = body.symbol || body.keyName
    const quantity = body.quantity 
    // Remove price requirement - we'll fetch current price
    const transactionType = body.transactionType

    if (!symbol || !quantity || !transactionType) {
      return Response.json({ 
        success: false, 
        error: 'Missing required fields: symbol, quantity, transactionType' 
      }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    if (quantity <= 0) {
      return Response.json({ success: false, error: 'Quantity must be positive' }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    if (!['BUY', 'SELL'].includes(transactionType)) {
      return Response.json({ success: false, error: 'Invalid transaction type' }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Convert to Indian stock symbol and validate
    const convertToIndianSymbol = (symbol) => {
      const upperSymbol = symbol.toUpperCase()
      
      // Check if it's already an Indian stock symbol
      if (upperSymbol.endsWith('.NS') || upperSymbol.endsWith('.BO')) {
        return upperSymbol
      }
      
      // Common Indian stock mappings
      const indianStocks = {
        'TCS': 'TCS.NS',
        'INFY': 'INFY.NS', 
        'RELIANCE': 'RELIANCE.NS',
        'HDFCBANK': 'HDFCBANK.NS',
        'ITC': 'ITC.NS',
        'SBIN': 'SBIN.NS',
        'ICICIBANK': 'ICICIBANK.NS',
        'BHARTIARTL': 'BHARTIARTL.NS',
        'HINDUNILVR': 'HINDUNILVR.NS',
        'KOTAKBANK': 'KOTAKBANK.NS'
      }
      
      if (indianStocks[upperSymbol]) {
        return indianStocks[upperSymbol]
      }
      
      // Block known foreign stocks
      const foreignStocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NFLX', 'NVDA']
      if (foreignStocks.includes(upperSymbol)) {
        throw new Error(`Foreign stock ${upperSymbol} not supported. Please use Indian stocks (NSE/BSE) only.`)
      }
      
      // Default to NSE for other symbols
      return `${upperSymbol}.NS`
    }

    let indianSymbol
    try {
      indianSymbol = convertToIndianSymbol(symbol)
    } catch (error) {
      return Response.json({ 
        success: false, 
        error: error.message 
      }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Get current price for the stock
    const currentPrice = await getCurrentStockPrice(indianSymbol)
    console.log(`📈 Current price for ${indianSymbol}: ₹${currentPrice}`)

    const totalAmount = quantity * currentPrice

    // Start a transaction
    const { data: currentBalance, error: balanceError } = await supabase
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (balanceError) {
      return Response.json({ success: false, error: 'Failed to fetch balance' }, { 
        status: 500,
        headers: corsHeaders 
      })
    }

    if (transactionType === 'BUY') {
      // Check if user has sufficient INR balance
      if (parseFloat(currentBalance.inr_balance) < totalAmount) {
        return Response.json({ success: false, error: 'Insufficient balance' }, { 
          status: 400,
          headers: corsHeaders 
        })
      }

      // Deduct INR balance
      const { error: balanceUpdateError } = await supabase
        .from('user_balances')
        .update({
          inr_balance: (parseFloat(currentBalance.inr_balance) - totalAmount).toFixed(2),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (balanceUpdateError) {
        return Response.json({ success: false, error: 'Failed to update balance' }, { status: 500 })
      }

      // Update or insert portfolio
      const { data: existingHolding, error: portfolioFetchError } = await supabase
        .from('user_portfolio')
        .select('*')
        .eq('user_id', userId)
        .eq('symbol', indianSymbol)
        .single()

      if (portfolioFetchError && portfolioFetchError.code !== 'PGRST116') {
        return Response.json({ success: false, error: 'Failed to fetch portfolio' }, { status: 500 })
      }

      if (existingHolding) {
        // Update existing holding
        const newQuantity = parseFloat(existingHolding.quantity) + quantity
        const newTotalInvested = parseFloat(existingHolding.total_invested) + totalAmount
        const newAvgPrice = newTotalInvested / newQuantity

        const { error: portfolioUpdateError } = await supabase
          .from('user_portfolio')
          .update({
            quantity: newQuantity.toFixed(8),
            avg_buy_price: newAvgPrice.toFixed(2),
            total_invested: newTotalInvested.toFixed(2),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('symbol', indianSymbol)

        if (portfolioUpdateError) {
          return Response.json({ success: false, error: 'Failed to update portfolio' }, { status: 500 })
        }
      } else {
        // Create new holding
        const { error: portfolioInsertError } = await supabase
          .from('user_portfolio')
          .insert({
            user_id: userId,
            symbol: indianSymbol,
            quantity: quantity.toFixed(8),
            avg_buy_price: currentPrice.toFixed(2),
            total_invested: totalAmount.toFixed(2)
          })

        if (portfolioInsertError) {
          return Response.json({ success: false, error: 'Failed to create portfolio entry' }, { status: 500 })
        }
      }
    } else if (transactionType === 'SELL') {
      // Check if user has sufficient holdings
      const { data: existingHolding, error: portfolioFetchError } = await supabase
        .from('user_portfolio')
        .select('*')
        .eq('user_id', userId)
        .eq('symbol', indianSymbol)
        .single()

      if (portfolioFetchError || !existingHolding) {
        return Response.json({ success: false, error: 'No holdings found for this symbol' }, { status: 400 })
      }

      if (parseFloat(existingHolding.quantity) < quantity) {
        return Response.json({ success: false, error: 'Insufficient holdings' }, { status: 400 })
      }

      // Add INR balance
      const { error: balanceUpdateError } = await supabase
        .from('user_balances')
        .update({
          inr_balance: (parseFloat(currentBalance.inr_balance) + totalAmount).toFixed(2),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (balanceUpdateError) {
        return Response.json({ success: false, error: 'Failed to update balance' }, { status: 500 })
      }

      // Update portfolio
      const newQuantity = parseFloat(existingHolding.quantity) - quantity
      const soldInvestment = (parseFloat(existingHolding.total_invested) / parseFloat(existingHolding.quantity)) * quantity
      const newTotalInvested = parseFloat(existingHolding.total_invested) - soldInvestment

      if (newQuantity <= 0) {
        // Remove holding if quantity becomes 0
        const { error: portfolioDeleteError } = await supabase
          .from('user_portfolio')
          .delete()
          .eq('user_id', userId)
          .eq('symbol', indianSymbol)

        if (portfolioDeleteError) {
          return Response.json({ success: false, error: 'Failed to update portfolio' }, { status: 500 })
        }
      } else {
        // Update holding
        const { error: portfolioUpdateError } = await supabase
          .from('user_portfolio')
          .update({
            quantity: newQuantity.toFixed(8),
            total_invested: newTotalInvested.toFixed(2),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('symbol', indianSymbol)

        if (portfolioUpdateError) {
          return Response.json({ success: false, error: 'Failed to update portfolio' }, { status: 500 })
        }
      }
    }

    // Record transaction
    const { error: transactionError } = await supabase
      .from('user_transactions')
      .insert({
        user_id: userId,
        symbol: indianSymbol,
        transaction_type: transactionType,
        quantity: quantity.toFixed(8),
        price: currentPrice.toFixed(2),
        total_amount: totalAmount.toFixed(2)
      })

    if (transactionError) {
      console.error('Transaction record error:', transactionError)
      // Don't fail the whole transaction for logging error
    }

    return Response.json({
      success: true,
      message: `${transactionType} order executed successfully`,
      transaction: {
        symbol: indianSymbol,
        original_symbol: symbol,
        quantity,
        price: currentPrice,
        total_amount: totalAmount,
        type: transactionType
      }
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}
