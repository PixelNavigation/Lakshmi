import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbols = searchParams.get('symbols')

    if (!symbols) {
      return NextResponse.json({ success: false, error: 'Symbols parameter required' })
    }

    const symbolList = symbols.split(',')
    const stockData = []

    // Yahoo Finance API alternative using free service
    try {
      for (const symbol of symbolList) {
        try {
          // For Indian stocks, Yahoo Finance uses .NS/.BO suffix
          let yahooSymbol = symbol
          if (symbol.includes('.NS') || symbol.includes('.BO')) {
            yahooSymbol = symbol // Keep as is for NSE/BSE
          } else if (symbol.includes('INR')) {
            // For crypto INR pairs, convert to USD for Yahoo Finance
            yahooSymbol = symbol.replace('INR', '-USD')
          } else if (symbol.includes('-USD')) {
            yahooSymbol = symbol // Keep as is for crypto USD pairs
          }

          // Using Yahoo Finance alternative API (free tier)
          const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`,
            {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            }
          )

          if (response.ok) {
            const data = await response.json()
            const result = data?.chart?.result?.[0]
            
            if (result && result.meta) {
              const meta = result.meta
              const currentPrice = meta.regularMarketPrice || meta.previousClose
              const previousClose = meta.previousClose
              const change = ((currentPrice - previousClose) / previousClose) * 100

              stockData.push({
                symbol: symbol,
                price: currentPrice,
                change: change,
                marketCap: meta.marketCap || null,
                currency: meta.currency || 'INR'
              })
            }
          }
        } catch (symbolError) {
          console.error(`Error fetching data for ${symbol}:`, symbolError)
          // Continue with next symbol
        }
      }

      // If no data was fetched from Yahoo Finance, return mock data with variations
      if (stockData.length === 0) {
        return NextResponse.json({
          success: true,
          data: symbolList.map(symbol => ({
            symbol,
            price: Math.random() * 1000 + 100, // Random price between 100-1100
            change: (Math.random() - 0.5) * 10, // Random change between -5% to +5%
            marketCap: Math.random() * 1000000000000,
            currency: 'INR',
            source: 'mock'
          }))
        })
      }

      return NextResponse.json({
        success: true,
        data: stockData,
        source: 'yahoo-finance'
      })

    } catch (apiError) {
      console.error('Yahoo Finance API error:', apiError)
      
      // Fallback to mock data with realistic variations
      const mockData = symbolList.map(symbol => {
        // Base prices for different stocks (more realistic)
        const basePrices = {
          'TCS.NS': 3420,
          'INFY.NS': 1450,
          'HDFCBANK.NS': 1650,
          'ICICIBANK.NS': 1120,
          'RELIANCE.NS': 2650,
          'ITC.NS': 420,
          'BTCINR': 5125000,
          'ETHINR': 310000
        }
        
        const basePrice = basePrices[symbol] || 1000
        const variation = (Math.random() - 0.5) * 0.05 // ±2.5% variation
        const newPrice = basePrice * (1 + variation)
        const change = variation * 100

        return {
          symbol,
          price: newPrice,
          change: change,
          marketCap: Math.random() * 10000000000000,
          currency: 'INR',
          source: 'mock-realistic'
        }
      })

      return NextResponse.json({
        success: true,
        data: mockData
      })
    }

  } catch (error) {
    console.error('Stock prices API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch stock prices' 
    })
  }
}
