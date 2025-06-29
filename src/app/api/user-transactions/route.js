import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return Response.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    // Get user transactions
    const { data: transactionData, error: transactionError } = await supabase
      .from('user_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (transactionError) {
      console.error('Transaction fetch error:', transactionError)
      return Response.json({ success: false, error: 'Failed to fetch transactions' }, { status: 500 })
    }

    const formattedTransactions = transactionData.map(transaction => ({
      ...transaction,
      quantity: parseFloat(transaction.quantity),
      price: parseFloat(transaction.price),
      total_amount: parseFloat(transaction.total_amount)
    }))

    return Response.json({
      success: true,
      transactions: formattedTransactions
    })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
