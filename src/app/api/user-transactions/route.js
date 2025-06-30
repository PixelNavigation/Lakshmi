import { supabase } from '@/lib/supabase'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Helper function to get authenticated user
async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return null
  
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  return error ? null : user
}

export async function OPTIONS(request) {
  return new Response(null, { status: 200, headers: corsHeaders })
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // First, try to get authenticated user
    const authUser = await getAuthenticatedUser(request)
    
    // Then check for userId parameter (for OmniDimension compatibility)
    let userId = searchParams.get('userId') || searchParams.get('keyName')
    
    // Use authenticated user ID if available, otherwise fall back to parameter
    if (authUser) {
      userId = authUser.id
    } else if (!userId) {
      // If no auth and no userId parameter, use default for demo purposes
      userId = 'user123'
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
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}
