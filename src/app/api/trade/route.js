import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { userId, symbol, quantity, price, transactionType } = await request.json()

    if (!userId || !symbol || !quantity || !price || !transactionType) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    if (quantity <= 0 || price <= 0) {
      return Response.json({ success: false, error: 'Quantity and price must be positive' }, { status: 400 })
    }

    if (!['BUY', 'SELL'].includes(transactionType)) {
      return Response.json({ success: false, error: 'Invalid transaction type' }, { status: 400 })
    }

    const totalAmount = quantity * price

    // Start a transaction
    const { data: currentBalance, error: balanceError } = await supabase
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (balanceError) {
      return Response.json({ success: false, error: 'Failed to fetch balance' }, { status: 500 })
    }

    if (transactionType === 'BUY') {
      // Check if user has sufficient INR balance
      if (parseFloat(currentBalance.inr_balance) < totalAmount) {
        return Response.json({ success: false, error: 'Insufficient balance' }, { status: 400 })
      }

      // Deduct INR balance
      const { error: balanceUpdateError } = await supabase
        .from('user_balances')
        .update({
          inr_balance: (parseFloat(currentBalance.inr_balance) - totalAmount).toFixed(2),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (balanceUpdateError) {
        return Response.json({ success: false, error: 'Failed to update balance' }, { status: 500 })
      }

      // Update or insert portfolio
      const { data: existingHolding, error: portfolioFetchError } = await supabase
        .from('user_portfolio')
        .select('*')
        .eq('user_id', userId)
        .eq('symbol', symbol)
        .single()

      if (portfolioFetchError && portfolioFetchError.code !== 'PGRST116') {
        return Response.json({ success: false, error: 'Failed to fetch portfolio' }, { status: 500 })
      }

      if (existingHolding) {
        // Update existing holding
        const newQuantity = parseFloat(existingHolding.quantity) + quantity
        const newTotalInvested = parseFloat(existingHolding.total_invested) + totalAmount
        const newAvgPrice = newTotalInvested / newQuantity

        const { error: portfolioUpdateError } = await supabase
          .from('user_portfolio')
          .update({
            quantity: newQuantity.toFixed(8),
            avg_buy_price: newAvgPrice.toFixed(2),
            total_invested: newTotalInvested.toFixed(2),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('symbol', symbol)

        if (portfolioUpdateError) {
          return Response.json({ success: false, error: 'Failed to update portfolio' }, { status: 500 })
        }
      } else {
        // Create new holding
        const { error: portfolioInsertError } = await supabase
          .from('user_portfolio')
          .insert({
            user_id: userId,
            symbol: symbol,
            quantity: quantity.toFixed(8),
            avg_buy_price: price.toFixed(2),
            total_invested: totalAmount.toFixed(2)
          })

        if (portfolioInsertError) {
          return Response.json({ success: false, error: 'Failed to create portfolio entry' }, { status: 500 })
        }
      }
    } else if (transactionType === 'SELL') {
      // Check if user has sufficient holdings
      const { data: existingHolding, error: portfolioFetchError } = await supabase
        .from('user_portfolio')
        .select('*')
        .eq('user_id', userId)
        .eq('symbol', symbol)
        .single()

      if (portfolioFetchError || !existingHolding) {
        return Response.json({ success: false, error: 'No holdings found for this symbol' }, { status: 400 })
      }

      if (parseFloat(existingHolding.quantity) < quantity) {
        return Response.json({ success: false, error: 'Insufficient holdings' }, { status: 400 })
      }

      // Add INR balance
      const { error: balanceUpdateError } = await supabase
        .from('user_balances')
        .update({
          inr_balance: (parseFloat(currentBalance.inr_balance) + totalAmount).toFixed(2),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (balanceUpdateError) {
        return Response.json({ success: false, error: 'Failed to update balance' }, { status: 500 })
      }

      // Update portfolio
      const newQuantity = parseFloat(existingHolding.quantity) - quantity
      const soldInvestment = (parseFloat(existingHolding.total_invested) / parseFloat(existingHolding.quantity)) * quantity
      const newTotalInvested = parseFloat(existingHolding.total_invested) - soldInvestment

      if (newQuantity <= 0) {
        // Remove holding if quantity becomes 0
        const { error: portfolioDeleteError } = await supabase
          .from('user_portfolio')
          .delete()
          .eq('user_id', userId)
          .eq('symbol', symbol)

        if (portfolioDeleteError) {
          return Response.json({ success: false, error: 'Failed to update portfolio' }, { status: 500 })
        }
      } else {
        // Update holding
        const { error: portfolioUpdateError } = await supabase
          .from('user_portfolio')
          .update({
            quantity: newQuantity.toFixed(8),
            total_invested: newTotalInvested.toFixed(2),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('symbol', symbol)

        if (portfolioUpdateError) {
          return Response.json({ success: false, error: 'Failed to update portfolio' }, { status: 500 })
        }
      }
    }

    // Record transaction
    const { error: transactionError } = await supabase
      .from('user_transactions')
      .insert({
        user_id: userId,
        symbol: symbol,
        transaction_type: transactionType,
        quantity: quantity.toFixed(8),
        price: price.toFixed(2),
        total_amount: totalAmount.toFixed(2)
      })

    if (transactionError) {
      console.error('Transaction record error:', transactionError)
      // Don't fail the whole transaction for logging error
    }

    return Response.json({
      success: true,
      message: `${transactionType} order executed successfully`,
      transaction: {
        symbol,
        quantity,
        price,
        total_amount: totalAmount,
        type: transactionType
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
