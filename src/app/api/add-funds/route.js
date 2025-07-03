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

export async function POST(request) {
  try {
    const body = await request.json()
    
    // First, try to get authenticated user
    const authUser = await getAuthenticatedUser(request)
    
    // Use authenticated user ID if available, otherwise fall back to parameter
    let userId = body.userId
    if (authUser) {
      userId = authUser.id
    } else if (!userId) {
      userId = 'user123' // Fallback for demo purposes
    }
    
    const { amount, currency } = body

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
