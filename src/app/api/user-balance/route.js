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

    // Get user balances
    const { data: balanceData, error: balanceError } = await supabase
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('Balance fetch error:', balanceError)
      return Response.json({ success: false, error: 'Failed to fetch balances' }, { status: 500 })
    }

    // If no balance record exists, create one with default values
    if (!balanceData) {
      const { data: newBalance, error: createError } = await supabase
        .from('user_balances')
        .insert({
          user_id: userId,
          inr_balance: 0.00, // Starting with zero balance
          eth_balance: 0.00000000
        })
        .select()
        .single()

      if (createError) {
        console.error('Balance creation error:', createError)
        return Response.json({ success: false, error: 'Failed to create balance record' }, { status: 500 })
      }

      return Response.json({
        success: true,
        data: {
          inr_balance: parseFloat(newBalance.inr_balance),
          eth_balance: parseFloat(newBalance.eth_balance)
        },
        balances: {
          inr: parseFloat(newBalance.inr_balance),
          eth: parseFloat(newBalance.eth_balance)
        }
      })
    }

    return Response.json({
      success: true,
      data: {
        inr_balance: parseFloat(balanceData.inr_balance),
        eth_balance: parseFloat(balanceData.eth_balance)
      },
      balances: {
        inr: parseFloat(balanceData.inr_balance),
        eth: parseFloat(balanceData.eth_balance)
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
