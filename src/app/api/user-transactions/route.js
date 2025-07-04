import { supabase } from '@/lib/supabase'
import { getSession, getSessionByUserId } from '@/lib/sessionStore'

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

export async function OPTIONS(request) {
  return new Response(null, { status: 200, headers: corsHeaders })
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // First, try to get authenticated user
    const authUser = await getAuthenticatedUser(request)
    
    // Then check for userId parameter or call_sid (for OmniDimension compatibility)
    let userId = searchParams.get('userId') || searchParams.get('keyName')
    const callSid = searchParams.get('call_sid') || searchParams.get('callSid') || searchParams.get('session_id')
    let accessToken = searchParams.get('access_token') || searchParams.get('accessToken') || null
    
    // If access_token not provided directly, try call_sid
    if (!accessToken && callSid) {
      // First check if call_sid is a user ID (OmniDimension sends user ID as call_sid)
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(callSid)) {
        // Use call_sid as userId directly
        userId = callSid
      } else {
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
    
    // Use authenticated user ID if available, otherwise fall back to parameter
    if (authUser) {
      userId = authUser.id
    } else if (!userId) {
      // If no auth and no userId parameter, return auth error
      return Response.json({ 
        success: false, 
        error: 'Authentication required. Please provide valid Authorization header with Bearer token or call_sid/userId parameter.' 
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

    // Get user transactions
    const { data: transactionData, error: transactionError } = await client
      .from('user_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (transactionError) {
      console.error('Transaction fetch error:', transactionError)
      return Response.json({ success: false, error: 'Failed to fetch transactions' }, { 
        status: 500,
        headers: corsHeaders
      })
    }

    const formattedTransactions = transactionData.map(transaction => ({
      ...transaction,
      quantity: parseFloat(transaction.quantity),
      price: parseFloat(transaction.price),
      total_amount: parseFloat(transaction.total_amount)
    }))

    return Response.json({
      success: true,
      transactions: formattedTransactions
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}
