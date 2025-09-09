import { supabase } from '../../../lib/supabase'
import { getSession, getSessionByUserId, getUserIdFromCallSid } from '../../../lib/sessionStore'

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
    
    let userId = null
    let accessToken = null
    
    // 1. First priority: Authorization header (standard web app auth)
    const authUser = await getAuthenticatedUser(request)
    if (authUser) {
      userId = authUser.id
      console.log('✅ Using authenticated user from header:', userId)
    }
    
    // 2. Second priority: Direct parameters (for API calls with tokens)
    if (!userId) {
      const directUserId = searchParams.get('userId') || searchParams.get('keyName')
      const directAccessToken = searchParams.get('access_token') || searchParams.get('accessToken')
      
      if (directAccessToken) {
        try {
          const { data, error } = await supabase.auth.getUser(directAccessToken)
          if (!error && data && data.user) {
            userId = data.user.id
            accessToken = directAccessToken
            console.log('✅ Using direct access token, userId:', userId)
          }
        } catch (err) {
          console.log('Direct access token validation failed')
        }
      } else if (directUserId) {
        // Direct userId without token (less secure, for testing)
        userId = directUserId
        console.log('✅ Using direct userId parameter:', userId)
      }
    }
    
    // 3. Third priority: Phone number lookup
    if (!userId) {
      const phoneParam = searchParams.get('phone')
      if (phoneParam && /^\d{10,}$/.test(phoneParam)) {
        console.log('Looking up user by phone number:', phoneParam)
        
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id, phone')
          .eq('phone', phoneParam)
        
        if (!userError && users && users.length > 0) {
          userId = users[0].id
          console.log('✅ Found user with phone:', phoneParam, 'userId:', userId)
        }
      }
    }
    
    // 4. Fourth priority: Call SID lookup (OmniDimension voice calls)
    if (!userId) {
      const callSid = searchParams.get('call_sid') || searchParams.get('callSid') || searchParams.get('session_id')
      
      if (callSid) {
        console.log('Processing call_sid:', callSid)
        
        // Check if call_sid is actually a UUID (user ID)
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(callSid)) {
          userId = callSid
          console.log('✅ call_sid is a UUID, using as userId:', userId)
        }
        // Check if call_sid is a JWT token
        else if (callSid.startsWith('ey')) {
          try {
            const { data, error } = await supabase.auth.getUser(callSid)
            if (!error && data && data.user) {
              accessToken = callSid
              userId = data.user.id
              console.log('✅ call_sid is a JWT token, userId:', userId)
            }
          } catch (err) {
            console.log('call_sid JWT validation failed')
          }
        }
        // Special hardcoded case for testing
        else if (callSid === "701323") {
          userId = "c772896b-521e-43a2-90f4-d942294b893e"
          console.log('✅ Using special case for call_sid 701323, userId:', userId)
          
          // Try to get stored session for this user
          const userSession = await getSessionByUserId(userId)
          if (userSession && userSession.accessToken) {
            accessToken = userSession.accessToken
            console.log('✅ Found stored session with access token')
          }
        }
        // Try simplified mapping first (call_sid -> user.id)
        else {
          const directUserId = await getUserIdFromCallSid(callSid)
          if (directUserId) {
            userId = directUserId
            console.log('✅ Found direct mapping: call_sid -> userId:', userId)
            
            // Try to get the full session data for access token
            const session = await getSession(callSid)
            if (session && session.accessToken) {
              accessToken = session.accessToken
              console.log('✅ Found access token from session data')
            }
          } else {
            // Fallback: Try session store lookup (old approach)
            const session = await getSession(callSid)
            if (session && session.userId) {
              userId = session.userId
              accessToken = session.accessToken
              console.log('✅ Found session in store (fallback), userId:', userId)
            } else {
              console.log('❌ No session found for call_sid:', callSid)
            }
          }
        }
      }
    }
    
    // Final validation
    if (!userId) {
      return Response.json({ 
        success: false, 
        error: 'Authentication required. Please provide valid Authorization header, access_token, userId, phone, or call_sid.' 
      }, { 
        status: 401,
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
    // Priority 1: If userId is provided, use it
    if (!userId) {
      // Priority 2: Look up user by phone if provided
      if (phone && /^\d{10,}$/.test(phone)) {
        console.log('Looking up user by phone number:', phone)
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id, phone')
          .eq('phone', phone)
        
        if (!userError && users && users.length > 0) {
          userId = users[0].id
          console.log('✅ Found user with phone:', phone, 'userId:', userId)
        }
      }
    }

    if (!userId) {
      return { 
        success: false, 
        error: 'User identification required (userId or phone)' 
      }
    }

    console.log('👤 getBalance called with userId:', userId)

    // Configure Supabase with the access token if provided
    let client = supabase
    if (accessToken) {
      try {
        const { data, error } = await supabase.auth.getUser(accessToken)
        if (!error && data && data.user) {
          // Token is valid, use it
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: '' })
          client = supabase
          console.log('✅ Using provided access token for balance query')
        } else {
          console.log('❌ Provided access token is invalid, using default client')
        }
      } catch (err) {
        console.log('❌ Error validating access token, using default client')
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
