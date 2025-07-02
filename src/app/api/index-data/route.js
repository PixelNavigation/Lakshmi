export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return Response.json({ success: false, error: 'Symbol is required' }, { status: 400 })
    }

    // Map indexKey to Yahoo Finance symbol (with aliases for TradingView/other formats)
    const symbolMap = {
      'NIFTY50': '^NSEI',
      'NSE:NIFTY': '^NSEI',
      'SENSEX': '^BSESN',
      'BSE:SENSEX': '^BSESN',
      'BANKNIFTY': '^NSEBANK',
      'NSE:BANKNIFTY': '^NSEBANK'
    }
    const yahooSymbol = symbolMap[symbol] || symbol

    // Fetch quote summary from Yahoo Finance via your proxy
    console.log('[IndexData] Fetching Yahoo symbol:', yahooSymbol)
    const yahooQuoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(yahooSymbol)}`
    const yahooRes = await fetch(yahooQuoteUrl)
    const yahooData = await yahooRes.json()
    console.log('[IndexData] Yahoo API response:', JSON.stringify(yahooData))
    const quote = yahooData.quoteResponse?.result?.[0]

    if (!quote) {
      return Response.json({ success: false, error: 'No data found for symbol' }, { status: 404 })
    }

    // Extract value, change, changePercent
    const value = quote.regularMarketPrice
    const change = quote.regularMarketChange
    const changePercent = quote.regularMarketChangePercent

    return Response.json({
      success: true,
      symbol: symbol,
      value,
      change,
      changePercent
    })
  } catch (error) {
    console.error('API error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
