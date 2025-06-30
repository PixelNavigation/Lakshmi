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
    
    // Check for userId parameter (for OmniDimension compatibility)
    let userId = searchParams.get('userId') || searchParams.get('keyName')
    
    // Use authenticated user ID if available, otherwise fall back to parameter
    if (authUser) {
      userId = authUser.id
    } else if (!userId) {
      // If no auth and no userId parameter, use default for demo purposes
      userId = 'user123'
    }

    if (!userId) {
      return Response.json({ success: false, error: 'User ID is required' }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Get user profile information
    let userProfile = null
    
    if (authUser) {
      // For authenticated users, get profile from auth
      userProfile = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email.split('@')[0],
        authenticated: true,
        created_at: authUser.created_at
      }
    } else {
      // For demo user or unauthenticated access
      userProfile = {
        id: userId,
        email: userId === 'user123' ? 'demo@lakshmi.ai' : `${userId}@demo.com`,
        name: userId === 'user123' ? 'Demo User' : `User ${userId}`,
        authenticated: false,
        created_at: new Date().toISOString()
      }
    }

    return Response.json({
      success: true,
      user: userProfile
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('User profile error:', error)
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}
