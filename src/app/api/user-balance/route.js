import { supabase } from '@/lib/supabase'
import { getSession, getSessionByUserId } from '@/lib/sessionStore'

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
    
    // Extract phone from parameters if available (but don't use numeric call_sid as phone)
    const phoneParam = searchParams.get('phone')
    if (phoneParam && /^\d{10,}$/.test(phoneParam)) {
      console.log('Using provided phone number:', phoneParam)
      
      // Search for users with this phone number
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, phone')
        .eq('phone', phoneParam)
      
      if (!userError && users && users.length > 0) {
        console.log(`✅ Found user with phone ${phoneParam}:`, users[0].id)
        userId = users[0].id
      }
    }
    
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
      // Only process call_sid if it looks like a UUID (OmniDimension sends user ID as call_sid)
      // or if it might be a JWT token (starts with 'ey')
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(callSid)) {
        // Use call_sid as userId directly if it's a UUID
        userId = callSid
        console.log('✅ Using call_sid as userId (UUID format):', userId)
      } else if (callSid.startsWith('ey')) {
        // Check if call_sid is a JWT token
        try {
          const { data, error } = await supabase.auth.getUser(callSid)
          if (!error && data && data.user) {
            accessToken = callSid // The call_sid is the access token
            userId = data.user.id
            console.log('✅ Using call_sid as access token:', callSid.substring(0, 20) + '...')
          }
        } catch (err) {
          console.log('❌ call_sid is not a valid token:', callSid.substring(0, 20) + '...')
        }
      } else {
        // Get the session from the session store
        
        // If the callSid is the PIN (701323), use Gautam's account specifically
        if (callSid === "701323") {
          // Use Gautam's hardcoded user ID
          userId = "c772896b-521e-43a2-90f4-d942294b893e"
          
          // Try to get a session for this user ID
          const userSession = await getSessionByUserId(userId)
          if (userSession && userSession.accessToken) {
            accessToken = userSession.accessToken
          }
        } else {
          // For other cases, try to get the session normally
          const session = await getSession(callSid)
          if (session && session.accessToken) {
            accessToken = session.accessToken
            userId = session.userId
          } else {
            // If PIN lookup failed, try searching for users with this PIN in their phone
            
            const { data: users, error: userError } = await supabase
              .from('users')
              .select('id, phone')
              .ilike('phone', `%${callSid}%`)
              
            if (!userError && users && users.length > 0) {
              userId = users[0].id
              
              // Try to get this user's session
              const userSession = await getSessionByUserId(userId)
              if (userSession && userSession.accessToken) {
                accessToken = userSession.accessToken
              }
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
    
    console.log('👤 Final userId used for balance query:', userId)

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
export async function getBalance(userId, accessToken, phone) {
  try {
    // If no userId but phone is provided, look up user by phone
    if (!userId && phone && /^\d{10,}$/.test(phone)) {
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, phone')
        .eq('phone', phone)
      
      if (!userError && users && users.length > 0) {
        userId = users[0].id
      }
    }

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
