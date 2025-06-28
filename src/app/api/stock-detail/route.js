import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const timeframe = searchParams.get('timeframe') || '1D'

    if (!symbol) {
      return NextResponse.json({ success: false, error: 'Symbol is required' })
    }

    // Try multiple APIs for real-time data
    let stockData = null
    let chartData = null

    // Try Alpha Vantage first
    try {
      const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo'
      const alphaResponse = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaVantageKey}`
      )
      const alphaData = await alphaResponse.json()

      if (alphaData['Global Quote'] && Object.keys(alphaData['Global Quote']).length > 0) {
        const quote = alphaData['Global Quote']
        stockData = {
          symbol: quote['01. symbol'],
          name: quote['01. symbol'],
          price: parseFloat(quote['05. price']),
          change: parseFloat(quote['09. change']),
          changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
          volume: parseInt(quote['06. volume']),
          dayHigh: parseFloat(quote['03. high']),
          dayLow: parseFloat(quote['04. low']),
          previousClose: parseFloat(quote['08. previous close']),
          currency: 'USD',
          exchange: 'NASDAQ',
          timestamp: Date.now(),
          isRealData: true
        }
      }
    } catch (error) {
      console.error('Alpha Vantage API error:', error)
    }

    // Try Yahoo Finance Alternative API if Alpha Vantage fails
    if (!stockData) {
      try {
        const yahooResponse = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
        )
        const yahooData = await yahooResponse.json()

        if (yahooData.chart?.result?.[0]) {
          const result = yahooData.chart.result[0]
          const meta = result.meta
          const quote = result.indicators?.quote?.[0]

          if (meta) {
            const currentPrice = meta.regularMarketPrice || meta.previousClose
            const previousClose = meta.previousClose
            const change = currentPrice - previousClose
            const changePercent = (change / previousClose) * 100

            stockData = {
              symbol: meta.symbol,
              name: meta.symbol,
              price: currentPrice,
              change: change,
              changePercent: changePercent,
              volume: meta.regularMarketVolume || 0,
              dayHigh: meta.regularMarketDayHigh || currentPrice,
              dayLow: meta.regularMarketDayLow || currentPrice,
              previousClose: previousClose,
              marketCap: meta.marketCap || 0,
              currency: meta.currency || 'USD',
              exchange: meta.exchangeName || 'NASDAQ',
              timestamp: Date.now(),
              isRealData: true
            }
          }
        }
      } catch (error) {
        console.error('Yahoo Finance API error:', error)
      }
    }

    // If no real data, generate enhanced mock data
    if (!stockData) {
      const basePrice = Math.random() * 500 + 50
      const changePercent = (Math.random() - 0.5) * 10
      const change = basePrice * (changePercent / 100)

      stockData = {
        symbol: symbol,
        name: getStockName(symbol),
        price: Number(basePrice.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        volume: Math.floor(Math.random() * 10000000) + 1000000,
        dayHigh: Number((basePrice * (1 + Math.random() * 0.05)).toFixed(2)),
        dayLow: Number((basePrice * (1 - Math.random() * 0.05)).toFixed(2)),
        previousClose: Number((basePrice - change).toFixed(2)),
        marketCap: Math.floor(Math.random() * 1000000000000) + 1000000000,
        peRatio: Number((Math.random() * 40 + 10).toFixed(1)),
        currency: getCurrency(symbol),
        exchange: getExchange(symbol),
        timestamp: Date.now(),
        isMockData: true
      }
    }

    // Fetch historical chart data
    if (stockData) {
      try {
        // Determine the range and interval based on timeframe
        let range, interval
        switch (timeframe) {
          case '1D':
            range = '1d'
            interval = '5m'
            break
          case '5D':
            range = '5d'
            interval = '15m'
            break
          case '1M':
            range = '1mo'
            interval = '1d'
            break
          case '3M':
            range = '3mo'
            interval = '1d'
            break
          case '1Y':
            range = '1y'
            interval = '1wk'
            break
          default:
            range = '1d'
            interval = '5m'
        }

        const chartResponse = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`
        )
        const chartResult = await chartResponse.json()

        if (chartResult.chart?.result?.[0]) {
          const result = chartResult.chart.result[0]
          const timestamps = result.timestamp || []
          const quotes = result.indicators?.quote?.[0]

          if (quotes && timestamps.length > 0) {
            chartData = timestamps.map((timestamp, index) => ({
              time: timestamp,
              open: Number((quotes.open?.[index] || 0).toFixed(2)),
              high: Number((quotes.high?.[index] || 0).toFixed(2)),
              low: Number((quotes.low?.[index] || 0).toFixed(2)),
              close: Number((quotes.close?.[index] || 0).toFixed(2)),
              volume: quotes.volume?.[index] || 0
            })).filter(candle => candle.open > 0 && candle.high > 0 && candle.low > 0 && candle.close > 0)
          }
        }
      } catch (error) {
        console.error('Chart data fetch error:', error)
        chartData = null
      }
    }

    return NextResponse.json({
      success: true,
      data: stockData,
      chartData: chartData,
      timeframe: timeframe
    })

  } catch (error) {
    console.error('Stock detail API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch stock details'
    })
  }
}

function getStockName(symbol) {
  const nameMap = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc.',
    'TSLA': 'Tesla, Inc.',
    'NVDA': 'NVIDIA Corporation',
    'META': 'Meta Platforms, Inc.',
    'AMZN': 'Amazon.com, Inc.',
    'NFLX': 'Netflix, Inc.',
    'BTC-USD': 'Bitcoin',
    'ETH-USD': 'Ethereum',
    'SBIN.NS': 'State Bank of India',
    'SBIN.BO': 'State Bank of India',
    'RELIANCE.NS': 'Reliance Industries Limited',
    'RELIANCE.BO': 'Reliance Industries Limited',
    'TCS.NS': 'Tata Consultancy Services',
    'TCS.BO': 'Tata Consultancy Services',
    'INFY.NS': 'Infosys Limited',
    'INFY.BO': 'Infosys Limited'
  }
  
  return nameMap[symbol] || symbol.replace(/\.(NS|BO|-USD|\.L)$/, '') + ' Corp.'
}

function getCurrency(symbol) {
  if (symbol.includes('.NS') || symbol.includes('.BO')) return 'INR'
  if (symbol.includes('-USD')) return 'USD'
  if (symbol.includes('.L')) return 'GBP'
  return 'USD'
}

function getExchange(symbol) {
  if (symbol.includes('.NS')) return 'NSE'
  if (symbol.includes('.BO')) return 'BSE'
  if (symbol.includes('.L')) return 'LSE'
  return 'NASDAQ'
}
