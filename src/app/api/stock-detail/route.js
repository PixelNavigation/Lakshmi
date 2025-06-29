import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const timeframe = searchParams.get('timeframe') || '1D'

    if (!symbol) {
      return NextResponse.json({ success: false, error: 'Symbol is required' })
    }

    // Normalize symbol for Indian stocks - try both NSE and BSE if no suffix
    const symbolsToTry = getSymbolVariants(symbol)
    console.log(`Trying symbol variants for ${symbol}:`, symbolsToTry)

    // Try multiple APIs for real-time data
    let stockData = null
    let chartData = null

    // Try each symbol variant until we find data
    for (const currentSymbol of symbolsToTry) {
      console.log(`🔍 Trying symbol: ${currentSymbol}`)
      
      // Try Alpha Vantage first
      if (!stockData) {
        try {
          const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo'
          const alphaResponse = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${currentSymbol}&apikey=${alphaVantageKey}`
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
              currency: getCurrency(currentSymbol),
              exchange: getExchange(currentSymbol),
              timestamp: Date.now(),
              isRealData: true,
              source: 'Alpha Vantage'
            }
            console.log(`✅ Alpha Vantage data found for ${currentSymbol}`)
            break
          }
        } catch (error) {
          console.error(`Alpha Vantage API error for ${currentSymbol}:`, error)
        }
      }

      // Try Yahoo Finance Alternative API if Alpha Vantage fails
      if (!stockData) {
        try {
          const yahooResponse = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${currentSymbol}?interval=1d&range=1d`
          )
          const yahooData = await yahooResponse.json()
          console.log(`Yahoo Finance response for ${currentSymbol}:`, yahooData.chart?.result?.[0]?.meta ? 'Found data' : 'No data')

          if (yahooData.chart?.result?.[0]) {
            const result = yahooData.chart.result[0]
            const meta = result.meta
            const quote = result.indicators?.quote?.[0]
            
            console.log(`Yahoo meta for ${currentSymbol}:`, meta ? 'Found' : 'Not found')

            if (meta) {
              // Try multiple price sources
              const currentPrice = meta.regularMarketPrice || meta.previousClose || meta.chartPreviousClose
              const previousClose = meta.previousClose || meta.chartPreviousClose
              
              if (currentPrice && previousClose) {
                const change = currentPrice - previousClose
                const changePercent = (change / previousClose) * 100

                stockData = {
                  symbol: meta.symbol || currentSymbol,
                  name: getStockName(currentSymbol),
                  price: Number(currentPrice.toFixed(2)),
                  change: Number(change.toFixed(2)),
                  changePercent: Number(changePercent.toFixed(2)),
                  volume: meta.regularMarketVolume || 0,
                  dayHigh: meta.regularMarketDayHigh || currentPrice,
                  dayLow: meta.regularMarketDayLow || currentPrice,
                  previousClose: Number(previousClose.toFixed(2)),
                  marketCap: meta.marketCap || 0,
                  currency: meta.currency || getCurrency(currentSymbol),
                  exchange: meta.exchangeName || getExchange(currentSymbol),
                  timestamp: Date.now(),
                  isRealData: true,
                  source: 'Yahoo Finance Real-time'
                }
                console.log(`✅ Yahoo Finance real-time data found for ${currentSymbol}:`, stockData)
                break
              }
            }
          }
        } catch (error) {
          console.error(`Yahoo Finance API error for ${currentSymbol}:`, error)
        }
      }

      // Try Finnhub API if previous sources fail
      if (!stockData) {
        try {
          const finnhubKey = process.env.FINNHUB_API_KEY || 'demo'
          const finnhubResponse = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${currentSymbol}&token=${finnhubKey}`
          )
          const finnhubData = await finnhubResponse.json()

          if (finnhubData.c && finnhubData.c > 0) {
            const currentPrice = finnhubData.c
            const change = finnhubData.d || 0
            const changePercent = finnhubData.dp || 0

            stockData = {
              symbol: currentSymbol,
              name: getStockName(currentSymbol),
              price: currentPrice,
              change: change,
              changePercent: changePercent,
              volume: 0,
              dayHigh: finnhubData.h || currentPrice,
              dayLow: finnhubData.l || currentPrice,
              previousClose: finnhubData.pc || (currentPrice - change),
              currency: getCurrency(currentSymbol),
              exchange: getExchange(currentSymbol),
              timestamp: Date.now(),
              isRealData: true,
              source: 'Finnhub'
            }
            console.log(`✅ Finnhub data found for ${currentSymbol}`)
            break
          }
        } catch (error) {
          console.error(`Finnhub API error for ${currentSymbol}:`, error)
        }
      }

      // Try to fetch last available historical data if real-time fails
      if (!stockData) {
        try {
          console.log(`Attempting to fetch historical data for ${currentSymbol}...`)
          const historicalResponse = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${currentSymbol}?interval=1d&range=5d`
          )
          const historicalData = await historicalResponse.json()

          if (historicalData.chart?.result?.[0]) {
            const result = historicalData.chart.result[0]
            const meta = result.meta
            const timestamps = result.timestamp || []
            const quotes = result.indicators?.quote?.[0]

            if (meta && timestamps.length > 0 && quotes) {
              // Get the most recent valid data point
              let lastValidIndex = -1
              for (let i = timestamps.length - 1; i >= 0; i--) {
                if (quotes.close?.[i] && quotes.close[i] > 0) {
                  lastValidIndex = i
                  break
                }
              }

              if (lastValidIndex >= 0) {
                const lastPrice = quotes.close[lastValidIndex]
                const previousPrice = lastValidIndex > 0 ? quotes.close[lastValidIndex - 1] : lastPrice
                const change = lastPrice - previousPrice
                const changePercent = (change / previousPrice) * 100

                stockData = {
                  symbol: meta.symbol || currentSymbol,
                  name: getStockName(currentSymbol),
                  price: Number(lastPrice.toFixed(2)),
                  change: Number(change.toFixed(2)),
                  changePercent: Number(changePercent.toFixed(2)),
                  volume: quotes.volume?.[lastValidIndex] || 0,
                  dayHigh: quotes.high?.[lastValidIndex] || lastPrice,
                  dayLow: quotes.low?.[lastValidIndex] || lastPrice,
                  previousClose: Number(previousPrice.toFixed(2)),
                  currency: meta.currency || getCurrency(currentSymbol),
                  exchange: meta.exchangeName || getExchange(currentSymbol),
                  timestamp: timestamps[lastValidIndex] * 1000,
                  isHistoricalData: true,
                  source: 'Yahoo Historical'
                }
                console.log(`✅ Historical data found for ${currentSymbol}:`, stockData)
                break
              }
            }
          }
        } catch (error) {
          console.error(`Historical data fetch error for ${currentSymbol}:`, error)
        }
      }

      // If we found data, break out of the loop
      if (stockData) break
    }

    // Only use realistic static data for well-known stocks as last resort
    if (!stockData) {
      const staticPrice = getStaticRealisticPrice(symbol)
      if (staticPrice) {
        console.log(`Using static realistic price for ${symbol}: $${staticPrice}`)
        const changePercent = (Math.random() - 0.5) * 2 // Small realistic change
        const change = staticPrice * (changePercent / 100)

        stockData = {
          symbol: symbol,
          name: getStockName(symbol),
          price: Number(staticPrice.toFixed(2)),
          change: Number(change.toFixed(2)),
          changePercent: Number(changePercent.toFixed(2)),
          volume: getTypicalVolume(symbol),
          dayHigh: Number((staticPrice * (1 + Math.random() * 0.02)).toFixed(2)),
          dayLow: Number((staticPrice * (1 - Math.random() * 0.02)).toFixed(2)),
          previousClose: Number((staticPrice - change).toFixed(2)),
          currency: getCurrency(symbol),
          exchange: getExchange(symbol),
          timestamp: Date.now(),
          isStaticData: true,
          source: 'Static Fallback'
        }
      } else {
        // No data available for unknown stock
        return NextResponse.json({
          success: false,
          error: `No price data available for ${symbol}. Please check the symbol or try again later.`,
          symbol: symbol
        })
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
    'INFY.BO': 'Infosys Limited',
    'ICICIBANK.NS': 'ICICI Bank Limited',
    'ICICIBANK.BO': 'ICICI Bank Limited',
    'HDFCBANK.NS': 'HDFC Bank Limited',
    'HDFCBANK.BO': 'HDFC Bank Limited',
    'ITC.NS': 'ITC Limited',
    'ITC.BO': 'ITC Limited',
    'HINDUNILVR.NS': 'Hindustan Unilever Limited',
    'HINDUNILVR.BO': 'Hindustan Unilever Limited',
    'BHARTIARTL.NS': 'Bharti Airtel Limited',
    'BHARTIARTL.BO': 'Bharti Airtel Limited',
    'KOTAKBANK.NS': 'Kotak Mahindra Bank Limited',
    'KOTAKBANK.BO': 'Kotak Mahindra Bank Limited',
    'LT.NS': 'Larsen & Toubro Limited',
    'LT.BO': 'Larsen & Toubro Limited',
    'HCLTECH.NS': 'HCL Technologies Limited',
    'HCLTECH.BO': 'HCL Technologies Limited',
    'MARUTI.NS': 'Maruti Suzuki India Limited',
    'MARUTI.BO': 'Maruti Suzuki India Limited',
    'BAJFINANCE.NS': 'Bajaj Finance Limited',
    'BAJFINANCE.BO': 'Bajaj Finance Limited',
    'INDIGO.NS': 'InterGlobe Aviation Limited',
    'INDIGO.BO': 'InterGlobe Aviation Limited',
    'ADANIPORTS.NS': 'Adani Ports and Special Economic Zone Limited',
    'ADANIPORTS.BO': 'Adani Ports and Special Economic Zone Limited',
    'TATAMOTORS.NS': 'Tata Motors Limited',
    'TATAMOTORS.BO': 'Tata Motors Limited',
    'TATASTEEL.NS': 'Tata Steel Limited',
    'TATASTEEL.BO': 'Tata Steel Limited',
    'WIPRO.NS': 'Wipro Limited',
    'WIPRO.BO': 'Wipro Limited',
    'COALINDIA.NS': 'Coal India Limited',
    'COALINDIA.BO': 'Coal India Limited',
    'JSWSTEEL.NS': 'JSW Steel Limited',
    'JSWSTEEL.BO': 'JSW Steel Limited',
    'ULTRACEMCO.NS': 'UltraTech Cement Limited',
    'ULTRACEMCO.BO': 'UltraTech Cement Limited',
    'SUNPHARMA.NS': 'Sun Pharmaceutical Industries Limited',
    'SUNPHARMA.BO': 'Sun Pharmaceutical Industries Limited',
    'ONGC.NS': 'Oil and Natural Gas Corporation Limited',
    'ONGC.BO': 'Oil and Natural Gas Corporation Limited',
    'NTPC.NS': 'NTPC Limited',
    'NTPC.BO': 'NTPC Limited',
    'POWERGRID.NS': 'Power Grid Corporation of India Limited',
    'POWERGRID.BO': 'Power Grid Corporation of India Limited',
    'DRREDDY.NS': 'Dr. Reddy\'s Laboratories Limited',
    'DRREDDY.BO': 'Dr. Reddy\'s Laboratories Limited',
    'CIPLA.NS': 'Cipla Limited',
    'CIPLA.BO': 'Cipla Limited',
    'DIVISLAB.NS': 'Divi\'s Laboratories Limited',
    'DIVISLAB.BO': 'Divi\'s Laboratories Limited'
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

function getStaticRealisticPrice(symbol) {
  // Only provide realistic prices for well-known stocks
  const staticPrices = {
    'AAPL': 175.50,
    'MSFT': 345.00,
    'GOOGL': 135.00,
    'TSLA': 245.00,
    'NVDA': 450.00,
    'META': 315.00,
    'AMZN': 140.00,
    'NFLX': 400.00,
    'BTC-USD': 43000.00,
    'ETH-USD': 2500.00,
    'SBIN.NS': 550.00,
    'SBIN.BO': 550.00,
    'RELIANCE.NS': 2450.00,
    'RELIANCE.BO': 2450.00,
    'TCS.NS': 3200.00,
    'TCS.BO': 3200.00,
    'INFY.NS': 1450.00,
    'INFY.BO': 1450.00,
    'ICICIBANK.NS': 950.00,
    'ICICIBANK.BO': 950.00,
    'HDFCBANK.NS': 1650.00,
    'HDFCBANK.BO': 1650.00,
    'ITC.NS': 450.00,
    'ITC.BO': 450.00,
    'HINDUNILVR.NS': 2350.00,
    'HINDUNILVR.BO': 2350.00,
    'BHARTIARTL.NS': 1150.00,
    'BHARTIARTL.BO': 1150.00,
    'KOTAKBANK.NS': 1750.00,
    'KOTAKBANK.BO': 1750.00,
    'LT.NS': 3200.00,
    'LT.BO': 3200.00,
    'HCLTECH.NS': 1350.00,
    'HCLTECH.BO': 1350.00,
    'MARUTI.NS': 10500.00,
    'MARUTI.BO': 10500.00,
    'BAJFINANCE.NS': 6500.00,
    'BAJFINANCE.BO': 6500.00,
    'INDIGO.NS': 3800.00,
    'INDIGO.BO': 3800.00,
    'ADANIPORTS.NS': 750.00,
    'ADANIPORTS.BO': 750.00,
    'TATAMOTORS.NS': 950.00,
    'TATAMOTORS.BO': 950.00,
    'TATASTEEL.NS': 145.00,
    'TATASTEEL.BO': 145.00,
    'WIPRO.NS': 550.00,
    'WIPRO.BO': 550.00,
    'SPY': 450.00,
    'QQQ': 375.00,
    'IWM': 195.00,
    'JPM': 155.00,
    'BAC': 32.00,
    'WMT': 160.00,
    'JNJ': 165.00,
    'V': 250.00,
    'MA': 390.00,
    'UNH': 520.00
  }
  
  return staticPrices[symbol] || null
}

function getTypicalVolume(symbol) {
  // Provide realistic volume data for known stocks
  const volumeMap = {
    'AAPL': 65000000,
    'MSFT': 35000000,
    'GOOGL': 25000000,
    'TSLA': 85000000,
    'NVDA': 55000000,
    'META': 30000000,
    'AMZN': 45000000,
    'NFLX': 8000000,
    'BTC-USD': 0,
    'ETH-USD': 0,
    'SBIN.NS': 15000000,
    'SBIN.BO': 15000000,
    'RELIANCE.NS': 8000000,
    'RELIANCE.BO': 8000000,
    'TCS.NS': 3000000,
    'TCS.BO': 3000000,
    'INFY.NS': 12000000,
    'INFY.BO': 12000000,
    'ICICIBANK.NS': 25000000,
    'ICICIBANK.BO': 25000000,
    'HDFCBANK.NS': 20000000,
    'HDFCBANK.BO': 20000000,
    'ITC.NS': 35000000,
    'ITC.BO': 35000000,
    'HINDUNILVR.NS': 5000000,
    'HINDUNILVR.BO': 5000000,
    'BHARTIARTL.NS': 15000000,
    'BHARTIARTL.BO': 15000000,
    'INDIGO.NS': 2000000,
    'INDIGO.BO': 2000000
  }
  
  return volumeMap[symbol] || 1000000
}

function getSymbolVariants(symbol) {
  // If symbol already has exchange suffix, use as-is and also try the base symbol
  if (symbol.includes('.NS') || symbol.includes('.BO')) {
    return [symbol]
  }
  
  // For symbols without suffix, try to determine if it's likely an Indian stock
  const commonIndianStocks = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK', 'SBIN', 'ITC',
    'BHARTIARTL', 'KOTAKBANK', 'LT', 'HCLTECH', 'MARUTI', 'BAJFINANCE', 'INDIGO',
    'ADANIPORTS', 'TATAMOTORS', 'TATASTEEL', 'WIPRO', 'COALINDIA', 'JSWSTEEL',
    'ULTRACEMCO', 'SUNPHARMA', 'ONGC', 'NTPC', 'POWERGRID', 'DRREDDY', 'CIPLA',
    'DIVISLAB', 'ADSL', 'ICICI'
  ]
  
  const upperSymbol = symbol.toUpperCase()
  
  // Check if it's a likely Indian stock
  const isLikelyIndianStock = commonIndianStocks.some(stock => 
    upperSymbol.includes(stock) || stock.includes(upperSymbol)
  )
  
  if (isLikelyIndianStock) {
    // For Indian stocks, try NSE first (more liquid), then BSE, then original symbol
    return [
      `${upperSymbol}.NS`,
      `${upperSymbol}.BO`,
      upperSymbol
    ]
  } else {
    // For other stocks, try original symbol first, then with common suffixes
    return [
      upperSymbol,
      `${upperSymbol}.NS`,  // Still try Indian exchanges in case
      `${upperSymbol}.BO`
    ]
  }
}
