import { NextResponse } from 'next/server'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(request) {
  return new Response(null, { status: 200, headers: corsHeaders })
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    // Handle both 'symbol' and 'keyName' parameters for OmniDimension compatibility
    const symbol = searchParams.get('symbol') || searchParams.get('keyName')
    const timeframe = searchParams.get('timeframe') || '1D'
    // Check if this is a 'current price only' request
    const currentOnly = searchParams.has('current') || searchParams.get('current') === 'true'
    // Check if this is a financials data request
    const type = searchParams.get('type') || 'price'

    if (!symbol) {
      return NextResponse.json({ success: false, error: 'Symbol is required' }, {
        headers: corsHeaders
      })
    }

    // If requesting financials, return that data
    if (type === 'financials') {
      const financials = await getFinancialsData(symbol)
      
      if (financials) {
        return NextResponse.json({
          success: true,
          financials,
          symbol
        }, { headers: corsHeaders })
      } else {
        return NextResponse.json({
          success: false,
          error: `No financial data available for ${symbol}`,
          symbol
        }, { headers: corsHeaders })
      }
    }

    // Check if this is a cryptocurrency symbol
    if (symbol.includes('-INR') || symbol.includes('-USD') || isCryptoSymbol(symbol)) {
      console.log(`🪙 Cryptocurrency detected: ${symbol}`)
      
      // Handle crypto symbols directly with Yahoo Finance
      try {
        // Convert to Yahoo Finance format if needed
        let yahooSymbol = symbol
        if (symbol.includes('-INR')) {
          // For INR pairs, use USD pairs and convert
          yahooSymbol = symbol.replace('-INR', '-USD')
        }
        
        console.log(`🔍 Fetching crypto data for ${yahooSymbol}`)
        
        const yahooResponse = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`
        )
        const yahooData = await yahooResponse.json()
        
        if (yahooData.chart?.result?.[0]) {
          const result = yahooData.chart.result[0]
          const meta = result.meta
          
          if (meta && meta.regularMarketPrice) {
            let currentPrice = meta.regularMarketPrice
            const previousClose = meta.previousClose || meta.chartPreviousClose
            
            // Convert to INR if needed
            if (symbol.includes('-INR') && yahooSymbol.includes('-USD')) {
              const usdToInr = 83.45 // You can fetch real-time rate
              try {
                const forexResponse = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/USDINR=X')
                if (forexResponse.ok) {
                  const forexData = await forexResponse.json()
                  if (forexData?.chart?.result?.[0]?.meta?.regularMarketPrice) {
                    const realRate = forexData.chart.result[0].meta.regularMarketPrice
                    currentPrice = currentPrice * realRate
                    console.log(`💱 USD to INR conversion: ${meta.regularMarketPrice} * ${realRate} = ${currentPrice}`)
                  } else {
                    currentPrice = currentPrice * usdToInr
                    console.log(`💱 Using fallback USD to INR rate: ${usdToInr}`)
                  }
                } else {
                  currentPrice = currentPrice * usdToInr
                }
              } catch (forexError) {
                currentPrice = currentPrice * usdToInr
                console.log(`💱 Forex API failed, using fallback rate: ${usdToInr}`)
              }
            }
            
            const change = currentPrice - (previousClose * (symbol.includes('-INR') ? 83.45 : 1))
            const changePercent = (change / (previousClose * (symbol.includes('-INR') ? 83.45 : 1))) * 100

            const cryptoData = {
              symbol: symbol,
              name: getCryptoName(symbol),
              price: Number(currentPrice.toFixed(2)),
              change: Number(change.toFixed(2)),
              changePercent: Number(changePercent.toFixed(2)),
              volume: meta.regularMarketVolume || 0,
              dayHigh: meta.regularMarketDayHigh || currentPrice,
              dayLow: meta.regularMarketDayLow || currentPrice,
              previousClose: Number((previousClose * (symbol.includes('-INR') ? 83.45 : 1)).toFixed(2)),
              marketCap: meta.marketCap || 0,
              currency: symbol.includes('-INR') ? 'INR' : 'USD',
              exchange: 'Crypto',
              timestamp: Date.now(),
              isRealData: true,
              source: 'Yahoo Finance Crypto'
            }
            
            console.log(`✅ Crypto data found for ${symbol}:`, cryptoData)
            
            return NextResponse.json({
              success: true,
              data: cryptoData,
              symbol: symbol
            }, { headers: corsHeaders })
          }
        }
      } catch (error) {
        console.error(`Error fetching crypto data for ${symbol}:`, error)
      }
      
      // If crypto fetch fails, return error
      return NextResponse.json({
        success: false,
        error: `Unable to fetch real-time data for ${symbol}. Please try again later.`,
        symbol: symbol
      }, { headers: corsHeaders })
    }

    // Check if this is an Indian stock symbol or convert to Indian format
    const indianSymbol = convertToIndianSymbol(symbol)
    
    if (!indianSymbol) {
      return NextResponse.json({
        success: false,
        error: `${symbol} is not available in the Indian market. Please use Indian stock symbols (e.g., RELIANCE.NS, TCS.NS, INFY.NS) or cryptocurrency symbols (e.g., BTC-INR, ETH-INR)`,
        symbol: symbol
      }, { headers: corsHeaders })
    }

    // For Indian market, try NSE first, then BSE
    const symbolsToTry = [`${indianSymbol}.NS`, `${indianSymbol}.BO`]
    console.log(`Indian market lookup for ${symbol} -> trying:`, symbolsToTry)

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
              name: getStockName(currentSymbol),
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
        }, { headers: corsHeaders })
      }
    }

    // Fetch historical chart data (skip if currentOnly mode)
    if (stockData && !currentOnly) {
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

    // Return response based on mode
    if (currentOnly) {
      // Return only current price data for OmniDimension
      return NextResponse.json({
        success: true,
        data: stockData
      }, { headers: corsHeaders })
    } else {
      // Return full data with charts for regular requests
      return NextResponse.json({
        success: true,
        data: stockData,
        chartData: chartData,
        timeframe: timeframe
      }, { headers: corsHeaders })
    }

  } catch (error) {
    console.error('Stock detail API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch stock details'
    }, { headers: corsHeaders })
  }
}

function convertToIndianSymbol(symbol) {
  // List of valid Indian stock symbols (without exchange suffix)
  const indianStocks = {
    // Major Indian Stocks
    'RELIANCE': 'RELIANCE',
    'TCS': 'TCS', 
    'HDFCBANK': 'HDFCBANK',
    'INFY': 'INFY',
    'HINDUNILVR': 'HINDUNILVR',
    'ICICIBANK': 'ICICIBANK',
    'SBIN': 'SBIN',
    'ITC': 'ITC',
    'BHARTIARTL': 'BHARTIARTL',
    'KOTAKBANK': 'KOTAKBANK',
    'LT': 'LT',
    'HCLTECH': 'HCLTECH',
    'MARUTI': 'MARUTI',
    'BAJFINANCE': 'BAJFINANCE',
    'INDIGO': 'INDIGO',
    'ADANIPORTS': 'ADANIPORTS',
    'TATAMOTORS': 'TATAMOTORS',
    'TATASTEEL': 'TATASTEEL',
    'WIPRO': 'WIPRO',
    'COALINDIA': 'COALINDIA',
    'JSWSTEEL': 'JSWSTEEL',
    'ULTRACEMCO': 'ULTRACEMCO',
    'SUNPHARMA': 'SUNPHARMA',
    'ONGC': 'ONGC',
    'NTPC': 'NTPC',
    'POWERGRID': 'POWERGRID',
    'DRREDDY': 'DRREDDY',
    'CIPLA': 'CIPLA',
    'DIVISLAB': 'DIVISLAB',
    'ASIANPAINT': 'ASIANPAINT',
    'TITAN': 'TITAN',
    'TECHM': 'TECHM',
    'NESTLEIND': 'NESTLEIND',
    'HEROMOTOCO': 'HEROMOTOCO',
    'AXISBANK': 'AXISBANK',
    'BRITANNIA': 'BRITANNIA',
    'EICHERMOT': 'EICHERMOT',
    'SHREECEM': 'SHREECEM',
    'PIDILITIND': 'PIDILITIND',
    'GRASIM': 'GRASIM',
    // Additional popular stocks
    'BPCL': 'BPCL',
    'IOC': 'IOC',
    'HINDALCO': 'HINDALCO',
    'VEDL': 'VEDL',
    'SAIL': 'SAIL',
    'BHEL': 'BHEL',
    'PNB': 'PNB',
    'CANBK': 'CANBK',
    'BANKBARODA': 'BANKBARODA',
    'UNIONBANK': 'UNIONBANK',
    'NCC': 'NCC',
    'IRCTC': 'IRCTC',
    'ZOMATO': 'ZOMATO',
    'PAYTM': 'PAYTM',
    'NYKAA': 'NYKAA'
  }
  
  // Remove exchange suffix if present
  const cleanSymbol = symbol.replace(/\.(NS|BO)$/, '').toUpperCase()
  
  // Check if it's a known Indian stock
  if (indianStocks[cleanSymbol]) {
    return cleanSymbol
  }
  
  // Common mappings for user convenience
  const symbolMappings = {
    'APPLE': null,      // Block foreign stocks
    'AAPL': null,
    'TESLA': null,
    'TSLA': null,
    'GOOGLE': null,
    'GOOGL': null,
    'MICROSOFT': null,
    'MSFT': null,
    'AMAZON': null,
    'AMZN': null,
    'FACEBOOK': null,
    'META': null,
    'NETFLIX': null,
    'NFLX': null,
    // Common Indian stock aliases
    'RELIANCEIND': 'RELIANCE',
    'TATACONSULTANCY': 'TCS',
    'HDFCBANK': 'HDFCBANK',
    'INFOSYS': 'INFY',
    'STATEBANK': 'SBIN',
    'SBI': 'SBIN',
    'AIRTEL': 'BHARTIARTL',
    'BHARTI': 'BHARTIARTL'
  }
  
  if (symbolMappings.hasOwnProperty(cleanSymbol)) {
    return symbolMappings[cleanSymbol]
  }
  
  return null // Symbol not found in Indian market
}

function getStockName(symbol) {
  const nameMap = {
    // Indian Stocks
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
    'LT.NS': 'Larsen & Toubro Limited',
    'LT.BO': 'Larsen & Toubro Limited',
    'WIPRO.NS': 'Wipro Limited',
    'WIPRO.BO': 'Wipro Limited',
    'KOTAKBANK.NS': 'Kotak Mahindra Bank Limited',
    'KOTAKBANK.BO': 'Kotak Mahindra Bank Limited',
    'HINDUNILVR.NS': 'Hindustan Unilever Limited',
    'HINDUNILVR.BO': 'Hindustan Unilever Limited',
    'ASIANPAINT.NS': 'Asian Paints Limited',
    'ASIANPAINT.BO': 'Asian Paints Limited',
    'MARUTI.NS': 'Maruti Suzuki India Limited',
    'MARUTI.BO': 'Maruti Suzuki India Limited',
    'TITAN.NS': 'Titan Company Limited',
    'TITAN.BO': 'Titan Company Limited',
    'HCLTECH.NS': 'HCL Technologies Limited',
    'HCLTECH.BO': 'HCL Technologies Limited',
    'TECHM.NS': 'Tech Mahindra Limited',
    'TECHM.BO': 'Tech Mahindra Limited',
    'SUNPHARMA.NS': 'Sun Pharmaceutical Industries Limited',
    'SUNPHARMA.BO': 'Sun Pharmaceutical Industries Limited',
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
    'COALINDIA.NS': 'Coal India Limited',
    'COALINDIA.BO': 'Coal India Limited',
    'JSWSTEEL.NS': 'JSW Steel Limited',
    'JSWSTEEL.BO': 'JSW Steel Limited',
    'ULTRACEMCO.NS': 'UltraTech Cement Limited',
    'ULTRACEMCO.BO': 'UltraTech Cement Limited',
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
    'DIVISLAB.BO': 'Divi\'s Laboratories Limited',
    // Crypto pairs in INR
    'BTC-INR': 'Bitcoin',
    'ETH-INR': 'Ethereum',
    'DOGE-INR': 'Dogecoin',
    'ADA-INR': 'Cardano',
    'SOL-INR': 'Solana',
    'BTC-USD': 'Bitcoin',
    'ETH-USD': 'Ethereum'
  }
  
  return nameMap[symbol] || symbol.replace(/\.(NS|BO|-INR|-USD|\.L)$/, '') + ' Limited'
}

function getCurrency(symbol) {
  // All Indian stocks are in INR
  return 'INR'
}

function getExchange(symbol) {
  if (symbol.includes('.NS')) return 'NSE'
  if (symbol.includes('.BO')) return 'BSE'
  return 'NSE' // Default to NSE for Indian stocks
}

function getStaticRealisticPrice(symbol) {
  // Only provide realistic prices for well-known Indian stocks and crypto
  const staticPrices = {
    // Indian Stocks
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
    'COALINDIA.NS': 400.00,
    'COALINDIA.BO': 400.00,
    'JSWSTEEL.NS': 800.00,
    'JSWSTEEL.BO': 800.00,
    'ULTRACEMCO.NS': 8500.00,
    'ULTRACEMCO.BO': 8500.00,
    'SUNPHARMA.NS': 1200.00,
    'SUNPHARMA.BO': 1200.00,
    'ONGC.NS': 250.00,
    'ONGC.BO': 250.00,
    'NTPC.NS': 350.00,
    'NTPC.BO': 350.00,
    'POWERGRID.NS': 300.00,
    'POWERGRID.BO': 300.00,
    'DRREDDY.NS': 6200.00,
    'DRREDDY.BO': 6200.00,
    'CIPLA.NS': 1400.00,
    'CIPLA.BO': 1400.00,
    'DIVISLAB.NS': 5500.00,
    'DIVISLAB.BO': 5500.00,
    'ASIANPAINT.NS': 3200.00,
    'ASIANPAINT.BO': 3200.00,
    'TITAN.NS': 3000.00,
    'TITAN.BO': 3000.00,
    'TECHM.NS': 1600.00,
    'TECHM.BO': 1600.00,
    // Crypto in INR
    'BTC-INR': 3500000.00,
    'ETH-INR': 210000.00,
    'DOGE-INR': 30.00,
    'ADA-INR': 45.00,
    'SOL-INR': 14000.00,
    // Crypto in USD
    'BTC-USD': 43000.00,
    'ETH-USD': 2500.00
  }
  
  return staticPrices[symbol] || null
}

function getTypicalVolume(symbol) {
  // Provide realistic volume data for known Indian stocks and crypto
  const volumeMap = {
    // Indian Stocks
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
    'INDIGO.BO': 2000000,
    'LT.NS': 4000000,
    'LT.BO': 4000000,
    'WIPRO.NS': 8000000,
    'WIPRO.BO': 8000000,
    'KOTAKBANK.NS': 6000000,
    'KOTAKBANK.BO': 6000000,
    'HCLTECH.NS': 5000000,
    'HCLTECH.BO': 5000000,
    'MARUTI.NS': 2500000,
    'MARUTI.BO': 2500000,
    'BAJFINANCE.NS': 3000000,
    'BAJFINANCE.BO': 3000000,
    'TATAMOTORS.NS': 12000000,
    'TATAMOTORS.BO': 12000000,
    'TATASTEEL.NS': 10000000,
    'TATASTEEL.BO': 10000000,
    'ASIANPAINT.NS': 1500000,
    'ASIANPAINT.BO': 1500000,
    'TITAN.NS': 3000000,
    'TITAN.BO': 3000000,
    'TECHM.NS': 4000000,
    'TECHM.BO': 4000000,
    'SUNPHARMA.NS': 5000000,
    'SUNPHARMA.BO': 5000000,
    // Crypto typically has very high volume but we'll set to 0 for display
    'BTC-INR': 0,
    'ETH-INR': 0,
    'BTC-USD': 0,
    'ETH-USD': 0
  }
  
  return volumeMap[symbol] || 1000000
}

// src/app/api/yahoo-search/route.js
export async function yahooSearch(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const quotesCount = searchParams.get('quotesCount') || 10;
  const newsCount = searchParams.get('newsCount') || 0;

  if (!q) {
    return new Response(JSON.stringify({ error: 'Missing query' }), { status: 400 });
  }

  const yahooUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=${quotesCount}&newsCount=${newsCount}`;

  try {
    const yahooRes = await fetch(yahooUrl, {
      headers: {
        // Add any required headers here if needed
      }
    });
    const data = await yahooRes.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Yahoo proxy failed', details: err.message }), { status: 500 });
  }
}

// Get financial data for a stock
async function getFinancialsData(symbol) {
  // Format the symbol appropriately
  const formattedSymbol = formatYahooSymbol(symbol)
  
  try {
    // In a production environment, you would fetch actual financial data here
    // For now, we'll use realistic mock data based on the symbol
    
    // Try to fetch some basic info from Yahoo Finance if possible
    let realMarketCap = null
    let realPE = null
    
    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${formattedSymbol}?modules=summaryDetail,defaultKeyStatistics,financialData`
      )
      const data = await response.json()
      
      if (data?.quoteSummary?.result?.[0]) {
        const summary = data.quoteSummary.result[0]
        const summaryDetail = summary.summaryDetail
        const keyStats = summary.defaultKeyStatistics
        const financialData = summary.financialData
        
        if (summaryDetail) {
          realMarketCap = summaryDetail.marketCap?.raw
          realPE = summaryDetail.trailingPE?.raw
        }
        
        // If we got real data, return it
        if (summaryDetail && keyStats && financialData) {
          const extractValue = (obj) => obj?.raw !== undefined ? obj.raw : 'N/A'
          
          return {
            companyName: getStockName(symbol),
            marketCap: extractValue(summaryDetail.marketCap),
            peRatio: extractValue(summaryDetail.trailingPE),
            eps: extractValue(keyStats.trailingEps),
            dividend: extractValue(summaryDetail.dividendRate),
            dividendYield: extractValue(summaryDetail.dividendYield),
            beta: extractValue(summaryDetail.beta),
            avgVolume: extractValue(summaryDetail.averageVolume),
            revenueGrowthYoY: extractValue(financialData.revenueGrowth),
            quarterlyEarningsGrowthYoY: extractValue(keyStats.earningsQuarterlyGrowth),
            profitMargin: extractValue(financialData.profitMargins),
            returnOnEquity: extractValue(financialData.returnOnEquity),
            debtToEquity: extractValue(financialData.debtToEquity)
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching Yahoo financial data for ${formattedSymbol}:`, error)
    }
    
    // If we couldn't get real data, provide realistic mock data
    return getMockFinancialsData(symbol, realMarketCap, realPE)
  } catch (error) {
    console.error(`Error in getFinancialsData for ${symbol}:`, error)
    return getMockFinancialsData(symbol)
  }
}

// Generate realistic mock financial data for demo purposes
function getMockFinancialsData(symbol, marketCap = null, peRatio = null) {
  // Map of common Indian stocks to realistic financial data
  const financialsMap = {
    'RELIANCE': {
      companyName: 'Reliance Industries Ltd.',
      marketCap: marketCap || 2452000000000, // 2.45 trillion INR
      peRatio: peRatio || 19.8,
      eps: 113.5,
      dividend: 8.0,
      dividendYield: 0.32,
      beta: 0.98,
      avgVolume: 7500000,
      revenueGrowthYoY: 14.5,
      quarterlyEarningsGrowthYoY: 9.2,
      profitMargin: 8.7,
      returnOnEquity: 9.5,
      debtToEquity: 0.41
    },
    'TCS': {
      companyName: 'Tata Consultancy Services Ltd.',
      marketCap: marketCap || 1280000000000,
      peRatio: peRatio || 29.7,
      eps: 138.6,
      dividend: 115,
      dividendYield: 1.45,
      beta: 0.72,
      avgVolume: 2300000,
      revenueGrowthYoY: 7.1,
      quarterlyEarningsGrowthYoY: 3.4,
      profitMargin: 18.5,
      returnOnEquity: 44.8,
      debtToEquity: 0.08
    },
    'HDFCBANK': {
      companyName: 'HDFC Bank Ltd.',
      marketCap: marketCap || 1125000000000,
      peRatio: peRatio || 21.8,
      eps: 73.82,
      dividend: 22.5,
      dividendYield: 1.39,
      beta: 0.85,
      avgVolume: 6800000,
      revenueGrowthYoY: 18.2,
      quarterlyEarningsGrowthYoY: 16.5,
      profitMargin: 21.2,
      returnOnEquity: 16.5,
      debtToEquity: 0.77
    },
    'INFY': {
      companyName: 'Infosys Ltd.',
      marketCap: marketCap || 725000000000,
      peRatio: peRatio || 24.3,
      eps: 71.25,
      dividend: 32.5,
      dividendYield: 1.88,
      beta: 0.68,
      avgVolume: 5200000,
      revenueGrowthYoY: 6.4,
      quarterlyEarningsGrowthYoY: 3.1,
      profitMargin: 16.8,
      returnOnEquity: 25.4,
      debtToEquity: 0.05
    },
    'SBIN': {
      companyName: 'State Bank of India',
      marketCap: marketCap || 875000000000,
      peRatio: peRatio || 9.2,
      eps: 92.85,
      dividend: 12.0,
      dividendYield: 1.38,
      beta: 1.25,
      avgVolume: 12000000,
      revenueGrowthYoY: 9.8,
      quarterlyEarningsGrowthYoY: 14.2,
      profitMargin: 15.3,
      returnOnEquity: 14.2,
      debtToEquity: 0.96
    }
  }
  
  // Try to match the symbol to our known stocks, removing any exchange suffix
  const baseSymbol = symbol.split('.')[0]
  const stockData = financialsMap[baseSymbol]
  
  // If we have pre-defined data for this stock, return it
  if (stockData) {
    return {
      ...stockData,
      marketCap: marketCap || stockData.marketCap,
      peRatio: peRatio || stockData.peRatio
    }
  }
  
  // Generate realistic random data for unknown stocks
  return {
    companyName: getStockName(symbol),
    marketCap: marketCap || Math.floor(Math.random() * 500000000000) + 50000000000,
    peRatio: peRatio || Math.floor(Math.random() * 30) + 10,
    eps: Math.floor(Math.random() * 100) + 20,
    dividend: Math.floor(Math.random() * 40) + 5,
    dividendYield: (Math.random() * 2.5) + 0.5,
    beta: (Math.random() * 1.5) + 0.5,
    avgVolume: Math.floor(Math.random() * 10000000) + 1000000,
    revenueGrowthYoY: (Math.random() * 20) - 5,
    quarterlyEarningsGrowthYoY: (Math.random() * 20) - 5,
    profitMargin: (Math.random() * 20) + 5,
    returnOnEquity: (Math.random() * 25) + 8,
    debtToEquity: (Math.random() * 1.5) + 0.2
  }
}

// Format Yahoo Finance symbol
function formatYahooSymbol(symbol) {
  // For Indian indices
  if (symbol === 'NIFTY50' || symbol === 'NIFTY') {
    return '^NSEI'
  }
  if (symbol === 'SENSEX') {
    return '^BSESN'
  }
  if (symbol === 'BANKNIFTY') {
    return '^NSEBANK'
  }
  
  // For Indian stocks
  if (symbol.includes('NSE:')) {
    return symbol.replace('NSE:', '') + '.NS'
  }
  if (symbol.includes('BSE:')) {
    return symbol.replace('BSE:', '') + '.BO'
  }
  
  // Handle standard stock symbols with exchange suffixes
  if (symbol.includes('.NS') || symbol.includes('.BO')) {
    return symbol // Already formatted for Yahoo
  }
  
  // Default case - assume NSE
  return symbol + '.NS'
}

// Helper function to check if symbol is a cryptocurrency
function isCryptoSymbol(symbol) {
  const cryptoPatterns = [
    /^[A-Z]+-INR$/,  // Crypto-INR pairs
    /^[A-Z]+-USD$/,  // Crypto-USD pairs  
    /^BTC/i, /^ETH/i, /^XRP/i, /^ADA/i, /^SOL/i, /^DOGE/i, /^DOT/i, /^MATIC/i, /^LINK/i, /^UNI/i
  ]
  
  return cryptoPatterns.some(pattern => pattern.test(symbol))
}

// Helper function to get cryptocurrency name
function getCryptoName(symbol) {
  const cryptoNames = {
    'BTC-INR': 'Bitcoin',
    'BTC-USD': 'Bitcoin', 
    'ETH-INR': 'Ethereum',
    'ETH-USD': 'Ethereum',
    'XRP-INR': 'XRP',
    'XRP-USD': 'XRP',
    'ADA-INR': 'Cardano',
    'ADA-USD': 'Cardano',
    'SOL-INR': 'Solana',
    'SOL-USD': 'Solana',
    'DOGE-INR': 'Dogecoin',
    'DOGE-USD': 'Dogecoin',
    'DOT-INR': 'Polkadot',
    'DOT-USD': 'Polkadot',
    'MATIC-INR': 'Polygon',
    'MATIC-USD': 'Polygon',
    'LINK-INR': 'Chainlink',
    'LINK-USD': 'Chainlink',
    'UNI-INR': 'Uniswap',
    'UNI-USD': 'Uniswap',
    'AVAX-INR': 'Avalanche',
    'AVAX-USD': 'Avalanche',
    'LTC-INR': 'Litecoin',
    'LTC-USD': 'Litecoin',
    'BCH-INR': 'Bitcoin Cash',
    'BCH-USD': 'Bitcoin Cash',
    'ATOM-INR': 'Cosmos',
    'ATOM-USD': 'Cosmos',
    'NEAR-INR': 'NEAR Protocol',
    'NEAR-USD': 'NEAR Protocol'
  }
  
  return cryptoNames[symbol] || symbol.replace('-INR', '').replace('-USD', '')
}


