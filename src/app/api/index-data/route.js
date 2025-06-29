export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return Response.json({ success: false, error: 'Symbol is required' }, { status: 400 })
    }

    // For now, return mock data
    // In a real implementation, you would fetch from a reliable data source
    const mockData = generateMockIndexData(symbol)

    return Response.json({
      success: true,
      symbol: symbol,
      value: mockData.value,
      change: mockData.change,
      changePercent: mockData.changePercent
    })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

function generateMockIndexData(symbol) {
  const baseValues = {
    'NIFTY50': 22000,
    'SENSEX': 72000,
    'BANKNIFTY': 48000
  }
  
  const baseValue = baseValues[symbol] || 20000
  // Use a deterministic random based on current time to simulate real market movement
  const timeBasedRandom = Math.sin(Date.now() / 100000) * 0.5 + (Math.random() - 0.5) * 0.5
  const randomChange = timeBasedRandom * 200 // Change between -100 to +100
  const currentValue = baseValue + randomChange
  const changePercent = (randomChange / baseValue) * 100
  
  return {
    value: currentValue,
    change: randomChange,
    changePercent: changePercent
  }
}
