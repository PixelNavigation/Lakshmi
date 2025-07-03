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

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return Response.json({ 
        success: false, 
        error: 'Email and password are required' 
      }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Authenticate user with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return Response.json({ 
        success: false, 
        error: error.message 
      }, { 
        status: 401,
        headers: corsHeaders 
      })
    }

    // Return user info and access token
    return Response.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email.split('@')[0]
      },
      session: {
        access_token: data.session.access_token,
        token_type: data.session.token_type,
        expires_at: data.session.expires_at
      },
      message: 'Authentication successful'
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Authentication error:', error)
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return Response.json({ 
        success: false, 
        error: 'Token is required' 
      }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Validate token and get user info
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return Response.json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, { 
        status: 401,
        headers: corsHeaders 
      })
    }

    return Response.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email.split('@')[0]
      },
      authenticated: true
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Token validation error:', error)
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}
