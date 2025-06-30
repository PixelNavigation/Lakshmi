import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    let userId = searchParams.get('userId')

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
    let { userId, symbol, name, action } = body

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
