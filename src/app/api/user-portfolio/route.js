import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return Response.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    // Get user portfolio with current prices
    const { data: portfolioData, error: portfolioError } = await supabase
      .from('user_portfolio')
      .select('*')
      .eq('user_id', userId)

    if (portfolioError) {
      console.error('Portfolio fetch error:', portfolioError)
      return Response.json({ success: false, error: 'Failed to fetch portfolio' }, { status: 500 })
    }

    // For now, we'll use the avg_buy_price as current_price
    // In a real app, you'd fetch current prices from an API
    const portfolioWithPrices = portfolioData.map(holding => ({
      ...holding,
      current_price: parseFloat(holding.avg_buy_price) * (0.95 + Math.random() * 0.1), // Simulate price movement
      quantity: parseFloat(holding.quantity),
      avg_buy_price: parseFloat(holding.avg_buy_price),
      total_invested: parseFloat(holding.total_invested)
    }))

    return Response.json({
      success: true,
      portfolio: portfolioWithPrices
    })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
