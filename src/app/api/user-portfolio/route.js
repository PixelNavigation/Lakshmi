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

    // Configure Supabase with the access token if provided
    let client = supabase
    if (accessToken) {
      try {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: '' })
        client = supabase
      } catch (err) {
        // Fallback to default client
      }
    }

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
    let accessToken = searchParams.get('access_token') || searchParams.get('accessToken') || null
    let userId = searchParams.get('userId') || searchParams.get('keyName')
    
    // If we have a direct access_token parameter, use it
    if (accessToken) {
      try {
        const { data, error } = await supabase.auth.getUser(accessToken)
        if (!error && data && data.user) {
          userId = data.user.id
        }
      } catch (err) {
        accessToken = null // Reset if error
      }
    }
    
    // If access_token not provided directly or invalid, try call_sid
    if (!accessToken && callSid) {
      // First check if call_sid is a user ID (OmniDimension sends user ID as call_sid)
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(callSid)) {
        // Use call_sid as userId directly
        userId = callSid
      } else {
        // Try other methods
        // Get the session from the session store
        const session = await getSession(callSid)
        if (session && session.accessToken) {
          accessToken = session.accessToken
          userId = session.userId
        } else {
          // Check if call_sid is actually a JWT token
          try {
            const { data, error } = await supabase.auth.getUser(callSid)
            if (!error && data && data.user) {
              accessToken = callSid // The call_sid is the access token
              userId = data.user.id
            }
          } catch (err) {
            // Not a valid token, ignore
          }
        }
      }
    }
    
    // First, try to get authenticated user from header
    const authUser = await getAuthenticatedUser(request)
    
    // Use authenticated user ID if available, otherwise fall back to parameter
    if (authUser) {
      userId = authUser.id
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

    // Configure Supabase with the access token if provided
    let client = supabase
    if (accessToken) {
      try {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: '' })
        client = supabase
      } catch (err) {
        // Fallback to default client
      }
    }
    
    // Get user portfolio with current prices
    const { data: portfolioData, error: portfolioError } = await client
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
