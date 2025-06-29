import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { userId, amount, currency } = await request.json()

    if (!userId || !amount || !currency) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    if (amount <= 0) {
      return Response.json({ success: false, error: 'Amount must be positive' }, { status: 400 })
    }

    if (!['inr', 'eth'].includes(currency)) {
      return Response.json({ success: false, error: 'Invalid currency' }, { status: 400 })
    }

    // Get current balances
    const { data: currentBalance, error: fetchError } = await supabase
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Balance fetch error:', fetchError)
      return Response.json({ success: false, error: 'Failed to fetch current balance' }, { status: 500 })
    }

    let updateData = {}
    if (currency === 'inr') {
      updateData.inr_balance = (parseFloat(currentBalance?.inr_balance || 0) + amount).toFixed(2)
    } else if (currency === 'eth') {
      updateData.eth_balance = (parseFloat(currentBalance?.eth_balance || 0) + amount).toFixed(8)
    }

    // Update or insert balance
    const { data: updatedBalance, error: updateError } = await supabase
      .from('user_balances')
      .upsert({
        user_id: userId,
        ...updateData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (updateError) {
      console.error('Balance update error:', updateError)
      return Response.json({ success: false, error: 'Failed to update balance' }, { status: 500 })
    }

    return Response.json({
      success: true,
      balances: {
        inr: parseFloat(updatedBalance.inr_balance),
        eth: parseFloat(updatedBalance.eth_balance)
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
