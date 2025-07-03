import { supabase } from '@/lib/supabase'

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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // First, try to get authenticated user
    const authUser = await getAuthenticatedUser(request)
    
    // Then check for userId parameter (for OmniDimension compatibility)
    let userId = searchParams.get('userId') || searchParams.get('keyName')
    
    // Use authenticated user ID if available, otherwise fall back to parameter
    if (authUser) {
      userId = authUser.id
      console.log('✅ Using authenticated user:', userId)
    } else if (!userId) {
      // REQUIRE authentication - no more default demo user
      return Response.json({ 
        success: false, 
        error: 'Authentication required. Please provide valid Authorization header with Bearer token.' 
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
