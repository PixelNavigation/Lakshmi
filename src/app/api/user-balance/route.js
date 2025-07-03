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
    
    // Get user balances using the authenticated client
    const { data: balanceData, error: balanceError } = await client
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
      const { data: newBalance, error: createError } = await client
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

// This function is used by the voice-command API to directly call this endpoint
// with the stored token from the session store
export async function getBalance(userId, accessToken) {
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

    // Get user balances using the provided token
    const { data: balanceData, error: balanceError } = await client
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('Balance fetch error:', balanceError)
      return { success: false, error: 'Failed to fetch balances' }
    }

    // If no balance record exists, create one with default values
    if (!balanceData) {
      const { data: newBalance, error: createError } = await client
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
        return { success: false, error: 'Failed to create balance record' }
      }

      return {
        success: true,
        data: {
          inr_balance: parseFloat(newBalance.inr_balance),
          eth_balance: parseFloat(newBalance.eth_balance)
        },
        balances: {
          inr: parseFloat(newBalance.inr_balance),
          eth: parseFloat(newBalance.eth_balance)
        }
      }
    }

    return {
      success: true,
      data: {
        inr_balance: parseFloat(balanceData.inr_balance),
        eth_balance: parseFloat(balanceData.eth_balance)
      },
      balances: {
        inr: parseFloat(balanceData.inr_balance),
        eth: parseFloat(balanceData.eth_balance)
      }
    }
  } catch (error) {
    console.error('API error:', error)
    return { success: false, error: 'Internal server error' }
  }
}
