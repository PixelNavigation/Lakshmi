import { supabase } from '../../../lib/supabase'
import { getSession, getSessionByUserId } from '../../../lib/sessionStore'

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

export async function POST(request) {
  try {
    const body = await request.json()
    
    // Check for call_sid for OmniDimension voice commands
    const callSid = body.call_sid || body.callSid || body.session_id
    let accessToken = body.access_token || body.accessToken || null
    let userId = body.userId || body.keyName
    
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
        // If the callSid is the PIN (701323), handle Gautam's account
        if (callSid === "701323") {
          // Use Gautam's hardcoded user ID
          userId = "c772896b-521e-43a2-90f4-d942294b893e"
          // Try to get the session for this user ID
          const userSession = await getSessionByUserId(userId)
          if (userSession && userSession.accessToken) {
            accessToken = userSession.accessToken
          }
        } else {
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
    
    const { amount, currency } = body

    if (!userId || !amount || !currency) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    if (amount <= 0) {
      return Response.json({ success: false, error: 'Amount must be positive' }, { status: 400 })
    }

    if (!['inr', 'eth'].includes(currency)) {
      return Response.json({ success: false, error: 'Invalid currency' }, { status: 400 })
    }

    // Get current balances
    const { data: currentBalance, error: fetchError } = await supabase
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Balance fetch error:', fetchError)
      return Response.json({ success: false, error: 'Failed to fetch current balance' }, { status: 500 })
    }

    let updateData = {}
    if (currency === 'inr') {
      updateData.inr_balance = (parseFloat(currentBalance?.inr_balance || 0) + amount).toFixed(2)
    } else if (currency === 'eth') {
      updateData.eth_balance = (parseFloat(currentBalance?.eth_balance || 0) + amount).toFixed(8)
    }

    // Update or insert balance
    const { data: updatedBalance, error: updateError } = await supabase
      .from('user_balances')
      .upsert({
        user_id: userId,
        ...updateData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (updateError) {
      console.error('Balance update error:', updateError)
      return Response.json({ success: false, error: 'Failed to update balance' }, { status: 500 })
    }

    return Response.json({
      success: true,
      balances: {
        inr: parseFloat(updatedBalance.inr_balance),
        eth: parseFloat(updatedBalance.eth_balance)
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
