import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' })
    }

    // Get user's watchlist from Supabase
    const { data: watchlistData, error } = await supabase
      .from('user_watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ success: false, error: error.message })
    }

    return NextResponse.json({ success: true, watchlist: watchlistData || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { userId, symbol, name, action } = body

    if (!userId || !symbol) {
      return NextResponse.json({ success: false, error: 'User ID and symbol required' })
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
        return NextResponse.json({ success: false, error: 'Stock already in watchlist' })
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
        return NextResponse.json({ success: false, error: error.message })
      }

      return NextResponse.json({ success: true, data: data[0] })
    } else if (action === 'remove') {
      // Remove stock from watchlist
      const { error } = await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', userId)
        .eq('symbol', symbol)

      if (error) {
        console.error('Supabase delete error:', error)
        return NextResponse.json({ success: false, error: error.message })
      }

      return NextResponse.json({ success: true, message: 'Stock removed from watchlist' })
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' })
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const symbol = searchParams.get('symbol')

    if (!userId || !symbol) {
      return NextResponse.json({ success: false, error: 'User ID and symbol required' })
    }

    const { error } = await supabase
      .from('user_watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('symbol', symbol)

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json({ success: false, error: error.message })
    }

    return NextResponse.json({ success: true, message: 'Stock removed from watchlist' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' })
  }
}
