// API route for batch fetching Yahoo Finance data for multiple stocks
export async function POST(req) {
  try {
    const { symbols } = await req.json()
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return Response.json({
        success: false,
        error: 'Invalid symbols array provided'
      }, { status: 400 })
    }

    console.log(`📊 Fetching Yahoo Finance data for ${symbols.length} symbols:`, symbols)

    // Fetch data for all symbols in parallel
    const results = await Promise.allSettled(
      symbols.map(async (symbol) => {
        try {
          // Use the existing yahoo-finance API endpoint
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/yahoo-finance?symbol=${symbol}&timeframe=1d&interval=1d`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })
          
          const data = await response.json()
          
          if (data.success && data.data && data.data.length > 0) {
            const latestData = data.data[data.data.length - 1] // Get most recent data point
            
            return {
              symbol: symbol,
              regularMarketPrice: latestData.close,
              regularMarketChange: latestData.close - latestData.open,
              regularMarketChangePercent: ((latestData.close - latestData.open) / latestData.open) * 100,
              regularMarketVolume: latestData.volume,
              currency: symbol.includes('INR') ? 'INR' : 'INR', // Most symbols are INR
              marketCap: latestData.close * (latestData.volume || 1000000), // Estimated market cap
              lastUpdate: new Date().toISOString()
            }
          } else {
            // Return minimal data structure for failed symbols
            return {
              symbol: symbol,
              regularMarketPrice: 0,
              regularMarketChange: 0,
              regularMarketChangePercent: 0,
              regularMarketVolume: 0,
              currency: 'INR',
              marketCap: 0,
              lastUpdate: new Date().toISOString(),
              error: data.error || 'No data available'
            }
          }
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error.message)
          return {
            symbol: symbol,
            regularMarketPrice: 0,
            regularMarketChange: 0,
            regularMarketChangePercent: 0,
            regularMarketVolume: 0,
            currency: 'INR',
            marketCap: 0,
            lastUpdate: new Date().toISOString(),
            error: error.message
          }
        }
      })
    )

    // Process results and separate successful vs failed
    const successfulResults = []
    const failedResults = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulResults.push(result.value)
      } else {
        failedResults.push({
          symbol: symbols[index],
          error: result.reason?.message || 'Unknown error'
        })
      }
    })

    console.log(`✅ Successfully fetched data for ${successfulResults.length}/${symbols.length} symbols`)
    
    if (failedResults.length > 0) {
      console.warn(`⚠️ Failed to fetch data for ${failedResults.length} symbols:`, failedResults.map(f => f.symbol))
    }

    return Response.json({
      success: true,
      data: successfulResults,
      failed: failedResults,
      summary: {
        total: symbols.length,
        successful: successfulResults.length,
        failed: failedResults.length
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error in batch Yahoo Finance API:', error)
    return Response.json({
      success: false,
      error: 'Failed to fetch batch stock data',
      details: error.message
    }, { status: 500 })
  }
}
