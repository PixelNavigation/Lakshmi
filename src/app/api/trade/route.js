import { supabase } from '@/lib/supabase'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
}

export async function OPTIONS(request) {
  return new Response(null, { status: 200, headers: corsHeaders })
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Check if this is a trade execution request or just endpoint discovery
    const keyName = searchParams.get('keyName')
    
    // If keyName contains JSON data, parse it and execute the trade
    if (keyName && keyName.includes('userId')) {
      try {
        // Parse the JSON from keyName parameter
        const tradeData = JSON.parse(keyName)
        
        // Support both original and OmniDimension parameter names
        const userId = tradeData.userId || "user123"
        const symbol = tradeData.symbol
        const quantity = tradeData.quantity 
        const price = tradeData.price
        const transactionType = tradeData.transactionType

        if (!symbol || !quantity || !price || !transactionType) {
          return Response.json({ 
            success: false, 
            error: 'Missing required fields: symbol, quantity, price, transactionType' 
          }, { 
            status: 400,
            headers: corsHeaders 
          })
        }

        if (quantity <= 0 || price <= 0) {
          return Response.json({ success: false, error: 'Quantity and price must be positive' }, { 
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

        const totalAmount = quantity * price

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
                avg_buy_price: price.toFixed(2),
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
            price: price.toFixed(2),
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
            price,
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
        userId: "string (required) - User ID",
        symbol: "string (required) - Indian stock symbol (TCS, INFY, RELIANCE)",
        quantity: "number (required) - Number of shares (positive)",
        price: "number (required) - Price per share in INR (positive)",
        transactionType: "string (required) - BUY or SELL (uppercase)"
      },
      example_get: "?keyName={\"userId\":\"user123\",\"symbol\":\"TCS\",\"quantity\":5,\"price\":3500.50,\"transactionType\":\"BUY\"}",
      example_post: {
        userId: "user123",
        symbol: "TCS",
        quantity: 5,
        price: 3500.50,
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
    
    // Support both original and OmniDimension parameter names
    const userId = body.userId || body.keyName
    const symbol = body.symbol || body.keyName
    const quantity = body.quantity 
    const price = body.price
    const transactionType = body.transactionType

    if (!userId || !symbol || !quantity || !price || !transactionType) {
      return Response.json({ 
        success: false, 
        error: 'Missing required fields: userId, symbol, quantity, price, transactionType' 
      }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    if (quantity <= 0 || price <= 0) {
      return Response.json({ success: false, error: 'Quantity and price must be positive' }, { 
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

    const totalAmount = quantity * price

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
            avg_buy_price: price.toFixed(2),
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
        price: price.toFixed(2),
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
        price,
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
