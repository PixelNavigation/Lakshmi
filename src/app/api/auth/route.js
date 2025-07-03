import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { setSession, getSession } from '@/lib/sessionStore'

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
    
    // Extract parameters from body
    
    // Accept either 'pin' or 'password' parameter to support both naming conventions
    const { phone, pin, password, email, call_sid } = body
    
    // Use password if pin is not provided
    const userPin = pin || password

    // Support both phone+pin login and email+pin login
    if ((!phone && !email) || !userPin) {
      return Response.json({ 
        success: false, 
        error: 'Either phone or email, and PIN are required' 
      }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    let userEmail = email;

    // If phone is provided but no email, look up the email from user_profiles
    if (phone && !email) {
      console.log(`Looking up user by phone: ${phone}`);
      
      // Use the standard client to query user_profiles
      console.log(`Searching for phone number "${phone}" in user_profiles table...`);
      
      // First, check if the table exists and has records
      const { data: tableCheck, error: tableError } = await supabase
        .from('user_profiles')
        .select('count()')
        .limit(1);
        
      console.log('Table check result:', { tableCheck, tableError });
      
      // Then search for the specific phone number
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, email')
        .eq('phone', phone)
        .single();
      
      console.log('Profile lookup result:', { profileData, profileError });
        
      if (profileError || !profileData) {
        return Response.json({ 
          success: false, 
          error: 'Phone number not found' 
        }, { 
          status: 401,
          headers: corsHeaders 
        });
      }
      
      // If the email is stored in user_profiles table, use it directly
      if (profileData.email) {
        console.log(`Found email in profiles: ${profileData.email}`);
        userEmail = profileData.email;
      } else {
        // Use the admin client to get the user's email directly from auth.users
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
          profileData.user_id
        );
        
        console.log('User lookup result:', { userData, userError });
          
        if (userError || !userData || !userData.user) {
          return Response.json({ 
            success: false, 
            error: 'User account not found' 
          }, { 
            status: 401,
            headers: corsHeaders 
          });
        }
        
        userEmail = userData.user.email;
      }
      
      console.log(`Using email for authentication: ${userEmail}`);
    }
    
    // Validate PIN format - must be exactly 6 digits
    if (!/^\d{6}$/.test(userPin)) {
      return Response.json({ 
        success: false, 
        error: 'PIN must be exactly 6 digits' 
      }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    console.log(`Attempting authentication for email: ${userEmail} with PIN: ${userPin.replace(/./g, '*')}`);
    
    // Authenticate user with Supabase using email and pin as password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: userPin,
    })
    
    console.log('Authentication result:', { success: !!data && !error, errorMessage: error?.message });

    if (error) {
      return Response.json({ 
        success: false, 
        error: error.message 
      }, { 
        status: 401,
        headers: corsHeaders 
      })
    }

    // Log authentication success
    console.log('🎯 Authentication successful for user:', data.user.id);

    // Fetch user's phone number from user_profiles
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('phone')
      .eq('user_id', data.user.id)
      .single();
      
    // If this is a call from OmniDimension with a call_sid, store the session
    if (call_sid) {
      console.log(`📱 Storing session for call_sid: ${call_sid}`);
      
      // Store the session with the call_sid as the key
      try {
        // Prepare session data with required fields
        const sessionData = {
          userId: data.user.id,
          accessToken: data.session.access_token,
          expiresAt: data.session.expires_at
        };
        
        // Store the session
        await setSession(call_sid, sessionData);
        console.log(`✅ Session stored for call_sid: ${call_sid}`);
      } catch (err) {
        console.error(`❌ Error storing session for call_sid: ${call_sid}`, err);
      }
    }

    // Return user info and access token
    return Response.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        phone: profileData?.phone || null,
        name: data.user.user_metadata?.full_name || data.user.email.split('@')[0]
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

    // Fetch user's phone number from user_profiles
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('phone')
      .eq('user_id', user.id)
      .single();
      
    console.log('Retrieved profile data:', profileData);
      
    return Response.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: profileData?.phone || null,
        name: user.user_metadata?.full_name || user.email.split('@')[0]
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
