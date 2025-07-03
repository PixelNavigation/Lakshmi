import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { getSession } from '@/lib/sessionStore'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

// This function is used by the voice-command API to directly call this endpoint
// with the stored token from the session store
export async function getWatchlist(userId, accessToken) {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }
    
    // Configure Supabase with the access token
    const client = supabase
    
    // Get user's watchlist
    const { data: watchlistItems, error } = await client
      .from('user_watchlist')
      .select('symbol, added_at')
      .eq('user_id', userId)
      .order('added_at', { ascending: false })
    
    if (error) {
      console.error('Watchlist fetch error:', error)
      return { success: false, error: 'Failed to fetch watchlist' }
    }
    
    const symbols = watchlistItems.map(item => item.symbol).join(',')
    
    if (!symbols) {
      return {
        success: true,
        watchlist: [],
        message: 'Your watchlist is empty'
      }
    }
    
    // Get current prices for watchlist items
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stock-prices?symbols=${symbols}`
      const response = await fetch(apiUrl)
      const priceData = await response.json()
      
      if (priceData.success && priceData.prices) {
        const watchlist = watchlistItems.map(item => {
          const price = priceData.prices.find(p => p.symbol === item.symbol)
          return {
            symbol: item.symbol,
            price: price?.price || 0,
            change: price?.change || 0,
            changePercent: price?.changePercent || 0,
            addedAt: item.added_at
          }
        })
        
        return {
          success: true,
          watchlist,
          totalItems: watchlist.length
        }
      }
      
      return {
        success: true,
        watchlist: watchlistItems,
        message: 'Price data not available'
      }
    } catch (error) {
      console.error('Price fetch error:', error)
      return {
        success: true,
        watchlist: watchlistItems,
        message: 'Price data not available'
      }
    }
  } catch (error) {
    console.error('API error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Check for call_sid for OmniDimension voice commands
    const callSid = searchParams.get('call_sid') || searchParams.get('callSid') || searchParams.get('session_id')
    let accessToken = null
    
    // If call_sid is provided, first try to use it directly as a token
    // This handles the case where OmniDimension sends the token directly
    if (callSid) {
      console.log('🔑 Authenticating with call_sid:', callSid.substring(0, 20) + '...')
      
      // First try using it as a direct token
      try {
        const { data, error } = await supabase.auth.getUser(callSid)
        if (!error && data && data.user) {
          console.log('✅ Using call_sid directly as access token')
          accessToken = callSid
          userId = data.user.id
        } else {
          // If not a valid token, try to get it from session store
          const session = await getSession(callSid)
          if (session && session.accessToken) {
            accessToken = session.accessToken
            userId = session.userId
            console.log('✅ Retrieved token from session store for call_sid')
          }
        }
      } catch (error) {
        console.log('❌ Error validating call_sid as token:', error.message)
      }
    }
    
    let userId = searchParams.get('userId')

    // Try to get user from Authorization header if available
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const { data: { user }, error } = await supabase.auth.getUser(token)
        if (user && !error) {
          userId = user.id
          console.log('✅ Using authenticated user from header:', userId)
        }
      } catch (error) {
        console.log('Token validation failed, using fallback')
      }
    }
    
    // If we have accessToken from call_sid, validate it and get the user
    if (!userId && accessToken) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser(accessToken)
        if (!error && user) {
          userId = user.id
          console.log('✅ Using user from call_sid session:', userId)
        }
      } catch (error) {
        console.log('Call SID token validation failed:', error)
      }
    }

    // Use provided userId parameter if no authenticated user
    if (!userId) {
      userId = 'user123' // Fallback for demo purposes
    }

    // Get user's watchlist from Supabase
    const { data: watchlistData, error } = await supabase
      .from('user_watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ success: false, error: error.message }, { headers: corsHeaders })
    }

    return NextResponse.json({ success: true, watchlist: watchlistData || [] }, { headers: corsHeaders })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { headers: corsHeaders })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    
    // Check for call_sid for OmniDimension voice commands
    const callSid = body.call_sid || body.callSid || body.session_id
    let accessToken = null
    
    // If call_sid is provided, first try to use it directly as a token
    // This handles the case where OmniDimension sends the token directly
    if (callSid) {
      console.log('🔑 Authenticating watchlist update with call_sid:', callSid.substring(0, 20) + '...')
      
      // First try using it as a direct token
      try {
        const { data, error } = await supabase.auth.getUser(callSid)
        if (!error && data && data.user) {
          console.log('✅ Using call_sid directly as access token')
          accessToken = callSid
          userId = data.user.id
        } else {
          // If not a valid token, try to get it from session store
          const session = await getSession(callSid)
          if (session && session.accessToken) {
            accessToken = session.accessToken
            userId = session.userId
            console.log('✅ Retrieved token from session store for call_sid')
          }
        }
      } catch (error) {
        console.log('❌ Error validating call_sid as token:', error.message)
      }
    }
    
    let { userId, symbol, name, action } = body

    // Try to get user from Authorization header if available
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const { data: { user }, error } = await supabase.auth.getUser(token)
        if (user && !error) {
          userId = user.id
          console.log('✅ Using authenticated user from header for watchlist update:', userId)
        }
      } catch (error) {
        console.log('Token validation failed, using fallback')
      }
    }
    
    // If we have accessToken from call_sid, validate it and get the user
    if (!userId && accessToken) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser(accessToken)
        if (!error && user) {
          userId = user.id
          console.log('✅ Using user from call_sid session for watchlist update:', userId)
        }
      } catch (error) {
        console.log('Call SID token validation failed:', error)
      }
    }

    if (!userId) {
      userId = 'user123' // Fallback for demo purposes
    }

    if (!symbol) {
      return NextResponse.json({ success: false, error: 'Symbol required' }, { headers: corsHeaders })
    }

    if (action === 'add') {
      // Check if stock already exists in watchlist
      const { data: existing } = await supabase
        .from('user_watchlist')
        .select('id')
        .eq('user_id', userId)
        .eq('symbol', symbol)
        .single()

      if (existing) {
        return NextResponse.json({ success: false, error: 'Stock already in watchlist' }, { headers: corsHeaders })
      }

      // Add stock to watchlist
      const { data, error } = await supabase
        .from('user_watchlist')
        .insert([
          {
            user_id: userId,
            symbol: symbol,
            name: name || symbol,
            created_at: new Date().toISOString()
          }
        ])
        .select()

      if (error) {
        console.error('Supabase insert error:', error)
        return NextResponse.json({ success: false, error: error.message }, { headers: corsHeaders })
      }

      return NextResponse.json({ success: true, data: data[0] }, { headers: corsHeaders })
    } else if (action === 'remove') {
      // Remove stock from watchlist
      const { error } = await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', userId)
        .eq('symbol', symbol)

      if (error) {
        console.error('Supabase delete error:', error)
        return NextResponse.json({ success: false, error: error.message }, { headers: corsHeaders })
      }

      return NextResponse.json({ success: true, message: 'Stock removed from watchlist' }, { headers: corsHeaders })
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { headers: corsHeaders })
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { headers: corsHeaders })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    let userId = searchParams.get('userId')
    const symbol = searchParams.get('symbol')

    // Try to get user from Authorization header if available
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const { data: { user }, error } = await supabase.auth.getUser(token)
        if (user && !error) {
          userId = user.id
        }
      } catch (error) {
        console.log('Token validation failed, using fallback')
      }
    }

    if (!userId) {
      userId = 'user123' // Fallback for demo purposes
    }

    if (!symbol) {
      return NextResponse.json({ success: false, error: 'Symbol required' }, { headers: corsHeaders })
    }

    const { error } = await supabase
      .from('user_watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('symbol', symbol)

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json({ success: false, error: error.message }, { headers: corsHeaders })
    }

    return NextResponse.json({ success: true, message: 'Stock removed from watchlist' }, { headers: corsHeaders })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { headers: corsHeaders })
  }
}
