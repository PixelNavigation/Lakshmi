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

    // Try Yahoo Finance first for Indian stocks (.NS/.BO symbols)
    if (symbol.includes('.NS') || symbol.includes('.BO')) {
      try {
        const yahooResponse = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          }
        )
        
        if (yahooResponse.ok) {
          const yahooData = await yahooResponse.json()
          
          if (yahooData.chart && yahooData.chart.result && yahooData.chart.result[0]) {
            const result = yahooData.chart.result[0]
            const meta = result.meta
            const quote = result.indicators.quote[0]
            
            if (meta && quote) {
              stockData = {
                symbol: meta.symbol,
                name: meta.longName || meta.symbol,
                price: meta.regularMarketPrice || meta.previousClose,
                change: (meta.regularMarketPrice || meta.previousClose) - meta.previousClose,
                changePercent: ((meta.regularMarketPrice || meta.previousClose) - meta.previousClose) / meta.previousClose * 100,
                volume: meta.regularMarketVolume || 0,
                dayHigh: meta.regularMarketDayHigh || meta.previousClose,
                dayLow: meta.regularMarketDayLow || meta.previousClose,
                previousClose: meta.previousClose,
                currency: meta.currency || 'INR',
                exchange: meta.exchangeName || 'NSE',
                timestamp: Date.now(),
                isRealData: true
              }
            }
          }
        }
      } catch (error) {
        console.error('Yahoo Finance Indian stocks API error:', error)
      }
    }

    // Try Alpha Vantage for non-Indian stocks
    if (!stockData) {
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
            currency: symbol.includes('.NS') || symbol.includes('.BO') ? 'INR' : 'USD',
            exchange: symbol.includes('.NS') ? 'NSE' : symbol.includes('.BO') ? 'BSE' : 'NASDAQ',
            timestamp: Date.now(),
            isRealData: true
          }
        }
      } catch (error) {
        console.error('Alpha Vantage API error:', error)
      }
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

    // Generate fallback data if no real data was obtained
    if (!stockData) {
      const fallbackPrices = {
        'RELIANCE.NS': 3010, 'TCS.NS': 4095, 'INFY.NS': 1729, 'HDFCBANK.NS': 1609, 
        'SBIN.NS': 855, 'ICICIBANK.NS': 1205, 'ITC.NS': 462, 'BHARTIARTL.NS': 1685, 
        'LT.NS': 3845, 'WIPRO.NS': 569
      }
      
      const basePrice = fallbackPrices[symbol] || 100
      const randomChange = (Math.random() - 0.5) * basePrice * 0.02 // ±1% random change
      const currentPrice = basePrice + randomChange
      
      stockData = {
        symbol: symbol,
        name: getStockName(symbol),
        price: Number(currentPrice.toFixed(2)),
        change: Number(randomChange.toFixed(2)),
        changePercent: Number((randomChange / basePrice * 100).toFixed(2)),
        volume: Math.floor(Math.random() * 1000000) + 100000,
        dayHigh: Number((currentPrice * 1.02).toFixed(2)),
        dayLow: Number((currentPrice * 0.98).toFixed(2)),
        previousClose: Number(basePrice.toFixed(2)),
        currency: getCurrency(symbol),
        exchange: getExchange(symbol),
        timestamp: Date.now(),
        isRealData: false
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
    // Remove US stocks and add more Indian stocks
    'SBIN.NS': 'State Bank of India',
    'SBIN.BO': 'State Bank of India',
    'RELIANCE.NS': 'Reliance Industries Limited',
    'RELIANCE.BO': 'Reliance Industries Limited',
    'TCS.NS': 'Tata Consultancy Services',
    'TCS.BO': 'Tata Consultancy Services',
    'INFY.NS': 'Infosys Limited',
    'INFY.BO': 'Infosys Limited',
    'HDFCBANK.NS': 'HDFC Bank Limited',
    'HDFCBANK.BO': 'HDFC Bank Limited',
    'ICICIBANK.NS': 'ICICI Bank Limited',
    'ICICIBANK.BO': 'ICICI Bank Limited',
    'ITC.NS': 'ITC Limited',
    'ITC.BO': 'ITC Limited',
    'BHARTIARTL.NS': 'Bharti Airtel Limited',
    'BHARTIARTL.BO': 'Bharti Airtel Limited',
    'LT.NS': 'Larsen & Toubro',
    'LT.BO': 'Larsen & Toubro',
    'WIPRO.NS': 'Wipro Limited',
    'WIPRO.BO': 'Wipro Limited',
    'KOTAKBANK.NS': 'Kotak Mahindra Bank',
    'KOTAKBANK.BO': 'Kotak Mahindra Bank',
    'HINDUNILVR.NS': 'Hindustan Unilever',
    'HINDUNILVR.BO': 'Hindustan Unilever',
    'ASIANPAINT.NS': 'Asian Paints Limited',
    'ASIANPAINT.BO': 'Asian Paints Limited',
    'MARUTI.NS': 'Maruti Suzuki India Limited',
    'MARUTI.BO': 'Maruti Suzuki India Limited',
    'TITAN.NS': 'Titan Company Limited',
    'TITAN.BO': 'Titan Company Limited',
    'HCLTECH.NS': 'HCL Technologies',
    'HCLTECH.BO': 'HCL Technologies',
    'TECHM.NS': 'Tech Mahindra Limited',
    'TECHM.BO': 'Tech Mahindra Limited',
    'SUNPHARMA.NS': 'Sun Pharmaceutical Industries',
    'SUNPHARMA.BO': 'Sun Pharmaceutical Industries',
    // Crypto pairs in INR
    'BTC-INR': 'Bitcoin',
    'ETH-INR': 'Ethereum',
    'DOGE-INR': 'Dogecoin',
    'ADA-INR': 'Cardano',
    'SOL-INR': 'Solana'
  }
  
  return nameMap[symbol] || symbol.replace(/\.(NS|BO|-INR|\.L)$/, '') + ' Limited'
}

function getCurrency(symbol) {
  if (symbol.includes('.NS') || symbol.includes('.BO')) return 'INR'
  if (symbol.includes('-INR')) return 'INR'
  if (symbol.includes('.L')) return 'GBP'
  return 'INR' // Default to INR for Indian market focus
}

function getExchange(symbol) {
  if (symbol.includes('.NS')) return 'NSE'
  if (symbol.includes('.BO')) return 'BSE'
  if (symbol.includes('.L')) return 'LSE'
  return 'NASDAQ'
}
