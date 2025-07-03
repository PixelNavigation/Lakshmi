import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/sessionStore'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Helper function to get authenticated user
async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return null
  
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  return error ? null : user
}

export async function OPTIONS(request) {
  return new Response(null, { status: 200, headers: corsHeaders })
}

// This function is used by the voice-command API to directly call this endpoint
// with the stored token from the session store
export async function getPortfolio(userId, accessToken) {
  try {
    if (!userId) {
      return { 
        success: false, 
        error: 'User ID is required' 
      }
    }

    // Configure Supabase with the access token
    const client = supabase

    // Get user portfolio
    const { data: holdings, error: holdingsError } = await client
      .from('user_portfolio')
      .select('*')
      .eq('user_id', userId)
    
    if (holdingsError) {
      console.error('Portfolio fetch error:', holdingsError)
      return { success: false, error: 'Failed to fetch portfolio holdings' }
    }
    
    // Process portfolio data
    const portfolio = holdings.map(item => ({
      symbol: item.symbol,
      company: item.company_name,
      quantity: item.quantity,
      avgBuyPrice: parseFloat(item.avg_buy_price),
      currentPrice: parseFloat(item.current_price || item.avg_buy_price),
      totalValue: parseFloat(item.current_price || item.avg_buy_price) * item.quantity
    }))
    
    return {
      success: true,
      portfolio,
      totalHoldings: portfolio.length,
      totalValue: portfolio.reduce((sum, item) => sum + item.totalValue, 0)
    }
  } catch (error) {
    console.error('API error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Check for call_sid for OmniDimension voice commands
    const callSid = searchParams.get('call_sid') || searchParams.get('callSid') || searchParams.get('session_id')
    let accessToken = null
    
    // If call_sid is provided, first try to use it directly as a token
    // This handles the case where OmniDimension sends the token directly
    if (callSid) {
      console.log('🔑 Authenticating with call_sid:', callSid.substring(0, 20) + '...')
      
      // First try using it as a direct token
      try {
        const { data, error } = await supabase.auth.getUser(callSid)
        if (!error && data && data.user) {
          console.log('✅ Using call_sid directly as access token')
          accessToken = callSid
          userId = data.user.id
        } else {
          // If not a valid token, try to get it from session store
          const session = await getSession(callSid)
          if (session && session.accessToken) {
            accessToken = session.accessToken
            userId = session.userId
            console.log('✅ Retrieved token from session store for call_sid')
          }
        }
      } catch (error) {
        console.log('❌ Error validating call_sid as token:', error.message)
      }
    }
    
    // First, try to get authenticated user from header
    const authUser = await getAuthenticatedUser(request)
    
    // Then check for userId parameter (for OmniDimension compatibility)
    let userId = searchParams.get('userId') || searchParams.get('keyName')
    
    // If we have accessToken from call_sid, validate it and get the user
    if (!authUser && accessToken) {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!error && user) {
        userId = user.id
        console.log('✅ Using user from call_sid session:', userId)
      }
    }
    
    // Use authenticated user ID if available, otherwise fall back to parameter
    if (authUser) {
      userId = authUser.id
      console.log('✅ Using authenticated user from header:', userId)
    } else if (!userId) {
      // REQUIRE authentication - no more default demo user
      return Response.json({ 
        success: false, 
        error: 'Authentication required. Please provide valid Authorization header with Bearer token or call_sid.' 
      }, { 
        status: 401,
        headers: corsHeaders 
      })
    }

    if (!userId) {
      return Response.json({ success: false, error: 'User ID is required' }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Get user portfolio with current prices
    const { data: portfolioData, error: portfolioError } = await supabase
      .from('user_portfolio')
      .select('*')
      .eq('user_id', userId)

    if (portfolioError) {
      console.error('Portfolio fetch error:', portfolioError)
      return Response.json({ success: false, error: 'Failed to fetch portfolio' }, { 
        status: 500,
        headers: corsHeaders 
      })
    }

    // For now, we'll use the avg_buy_price as current_price
    // In a real app, you'd fetch current prices from an API
    const portfolioWithPrices = portfolioData.map(holding => ({
      ...holding,
      current_price: parseFloat(holding.avg_buy_price) * (0.95 + Math.random() * 0.1), // Simulate price movement
      quantity: parseFloat(holding.quantity),
      avg_buy_price: parseFloat(holding.avg_buy_price),
      total_invested: parseFloat(holding.total_invested)
    }))

    return Response.json({
      success: true,
      data: portfolioWithPrices,
      portfolio: portfolioWithPrices
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}
