import { NextResponse } from 'next/server'

// Temporary fallback API that simulates Supabase behavior using mock data
// This will work until the real Supabase table is created

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' })
    }

    // Mock data for testing
    const mockWatchlist = [
      {
        id: 1,
        user_id: 'user123',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        user_id: 'user123', 
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        user_id: 'user123',
        symbol: 'GOOGL', 
        name: 'Alphabet Inc.',
        created_at: new Date().toISOString()
      }
    ]

    return NextResponse.json({ 
      success: true, 
      watchlist: mockWatchlist.filter(item => item.user_id === userId)
    })
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

    // Simulate successful add operation
    if (action === 'add') {
      return NextResponse.json({ 
        success: true, 
        data: {
          id: Date.now(),
          user_id: userId,
          symbol: symbol,
          name: name || symbol,
          created_at: new Date().toISOString()
        }
      })
    } else if (action === 'remove') {
      return NextResponse.json({ success: true, message: 'Stock removed from watchlist' })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' })
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

    // Simulate successful delete operation
    return NextResponse.json({ success: true, message: 'Stock removed from watchlist' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' })
  }
}
