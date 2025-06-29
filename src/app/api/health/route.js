// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(request) {
  return new Response(null, { status: 200, headers: corsHeaders })
}

export async function GET() {
  return Response.json({ 
    success: true, 
    message: 'Lakshmi Trading API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }, { headers: corsHeaders })
}
