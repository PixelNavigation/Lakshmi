import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { symbols } = body

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json({ success: false, error: 'Symbols array required' })
    }

    // Get real-time data for all symbols
    const stockData = await Promise.allSettled(
      symbols.map(async (symbol) => {
        try {
          // Try Alpha Vantage first
          const avApiKey = process.env.ALPHA_VANTAGE_API_KEY
          if (avApiKey) {
            const avResponse = await fetch(
              `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${avApiKey}`,
              { timeout: 8000 }
            )
            const avData = await avResponse.json()
            
            if (avData['Global Quote'] && Object.keys(avData['Global Quote']).length > 0) {
              const quote = avData['Global Quote']
              return {
                symbol: symbol,
                price: parseFloat(quote['05. price']) || 0,
                change: parseFloat(quote['09. change']) || 0,
                changePercent: parseFloat(quote['10. change percent']?.replace('%', '')) || 0,
                volume: quote['06. volume'] || '0',
                name: symbol,
                currency: symbol.includes('.NS') || symbol.includes('.BO') ? 'INR' : 
                         symbol.includes('-INR') ? 'INR' : 'USD',
                source: 'alphavantage'
              }
            }
          }

          // Fallback to Yahoo Finance
          const yahooResponse = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${symbol}`,
            {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              },
              timeout: 8000
            }
          )
          
          if (yahooResponse.ok) {
            const yahooData = await yahooResponse.json()
            if (yahooData.quoteResponse?.result?.[0]) {
              const quote = yahooData.quoteResponse.result[0]
              return {
                symbol: symbol,
                price: quote.regularMarketPrice || 0,
                change: quote.regularMarketChange || 0,
                changePercent: quote.regularMarketChangePercent || 0,
                volume: quote.regularMarketVolume?.toLocaleString() || '0',
                name: quote.longName || quote.shortName || symbol,
                currency: quote.currency || 'USD',
                source: 'yahoo'
              }
            }
          }

          // Final fallback - mock data
          return {
            symbol: symbol,
            price: Math.random() * 100 + 50,
            change: (Math.random() - 0.5) * 10,
            changePercent: (Math.random() - 0.5) * 5,
            volume: Math.floor(Math.random() * 1000000).toLocaleString(),
            name: symbol,
            currency: symbol.includes('.NS') || symbol.includes('.BO') ? 'INR' : 
                     symbol.includes('-INR') ? 'INR' : 'USD',
            source: 'mock'
          }
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error)
          return {
            symbol: symbol,
            price: 0,
            change: 0,
            changePercent: 0,
            volume: '0',
            name: symbol,
            currency: 'USD',
            source: 'error'
          }
        }
      })
    )

    // Process results
    const results = stockData.map(result => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          symbol: 'UNKNOWN',
          price: 0,
          change: 0,
          changePercent: 0,
          volume: '0',
          name: 'Error',
          currency: 'USD',
          source: 'error'
        }
      }
    })

    return NextResponse.json({ success: true, data: results })
  } catch (error) {
    console.error('Stock data API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' })
  }
}
