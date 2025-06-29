import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return Response.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    // Get user balances
    const { data: balanceData, error: balanceError } = await supabase
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
      const { data: newBalance, error: createError } = await supabase
        .from('user_balances')
        .insert({
          user_id: userId,
          inr_balance: 100000.00, // Starting with 1 lakh INR
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
        balances: {
          inr: parseFloat(newBalance.inr_balance),
          eth: parseFloat(newBalance.eth_balance)
        }
      })
    }

    return Response.json({
      success: true,
      balances: {
        inr: parseFloat(balanceData.inr_balance),
        eth: parseFloat(balanceData.eth_balance)
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
