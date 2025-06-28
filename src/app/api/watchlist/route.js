// src/app/api/watchlist/route.js
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const symbols = searchParams.get('symbols') || 'AAPL,MSFT,GOOGL,TSLA,NVDA'
  const type = searchParams.get('type') || 'stocks' // stocks, crypto, commodities, forex
  
  try {
    const watchlistData = []
    
    // Multiple data sources for comprehensive coverage
    if (type === 'stocks' || type === 'all') {
      await fetchStockData(symbols, watchlistData)
    }
    
    if (type === 'crypto' || type === 'all') {
      await fetchCryptoData(symbols, watchlistData)
    }
    
    if (type === 'commodities' || type === 'all') {
      await fetchCommoditiesData(symbols, watchlistData)
    }
    
    if (type === 'forex' || type === 'all') {
      await fetchForexData(symbols, watchlistData)
    }
    
    // If no real data available, provide mock data
    if (watchlistData.length === 0) {
      const mockData = generateMockWatchlistData(symbols, type)
      watchlistData.push(...mockData)
    }
    
    // Remove duplicates and sort by market cap or relevance
    const uniqueData = watchlistData.filter((item, index, self) => 
      index === self.findIndex(i => i.symbol === item.symbol)
    )
    
    return NextResponse.json({
      success: true,
      data: uniqueData,
      timestamp: new Date().toISOString(),
      sources: ['Alpha Vantage', 'Financial Modeling Prep', 'Yahoo Finance'],
      totalItems: uniqueData.length
    })
    
  } catch (error) {
    console.error('Error fetching watchlist data:', error)
    
    // Fallback to mock data
    const mockData = generateMockWatchlistData(symbols, type)
    return NextResponse.json({
      success: true,
      data: mockData,
      timestamp: new Date().toISOString(),
      sources: ['Mock Data'],
      totalItems: mockData.length,
      isMockData: true
    })
  }
}

// Fetch stock data from multiple sources
async function fetchStockData(symbols, watchlistData) {
  const symbolArray = symbols.split(',').map(s => s.trim().toUpperCase())
  
  // Try Alpha Vantage for stock data
  try {
    const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo'
    
    for (const symbol of symbolArray) {
      try {
        // Get quote data
        const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaVantageKey}`
        const quoteResponse = await fetch(quoteUrl)
        
        if (quoteResponse.ok) {
          const quoteData = await quoteResponse.json()
          const quote = quoteData['Global Quote']
          
          if (quote && quote['01. symbol']) {
            watchlistData.push({
              symbol: quote['01. symbol'],
              name: getCompanyName(quote['01. symbol']),
              price: parseFloat(quote['05. price']),
              change: parseFloat(quote['09. change']),
              changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
              volume: quote['06. volume'],
              marketCap: calculateMarketCap(quote['01. symbol'], parseFloat(quote['05. price'])),
              category: getStockCategory(quote['01. symbol']),
              type: 'stock',
              currency: 'USD',
              exchange: getStockExchange(quote['01. symbol']),
              lastUpdated: quote['07. latest trading day'],
              high: parseFloat(quote['03. high']),
              low: parseFloat(quote['04. low']),
              open: parseFloat(quote['02. open']),
              previousClose: parseFloat(quote['08. previous close']),
              isRealTime: true
            })
          }
        }
        
        // Small delay to respect API limits
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.log(`Failed to fetch data for ${symbol}:`, error.message)
      }
    }
  } catch (error) {
    console.log('Alpha Vantage stock data failed:', error.message)
  }
  
  // Try Financial Modeling Prep as backup
  try {
    const fmpKey = process.env.FMP_API_KEY || 'demo'
    if (fmpKey !== 'demo') {
      const symbolsString = symbolArray.join(',')
      const fmpUrl = `https://financialmodelingprep.com/api/v3/quote/${symbolsString}?apikey=${fmpKey}`
      
      const fmpResponse = await fetch(fmpUrl)
      if (fmpResponse.ok) {
        const fmpData = await fmpResponse.json()
        
        if (Array.isArray(fmpData)) {
          fmpData.forEach(quote => {
            // Only add if not already added from Alpha Vantage
            if (!watchlistData.find(item => item.symbol === quote.symbol)) {
              watchlistData.push({
                symbol: quote.symbol,
                name: quote.name || getCompanyName(quote.symbol),
                price: quote.price,
                change: quote.change,
                changePercent: quote.changesPercentage,
                volume: quote.volume,
                marketCap: quote.marketCap,
                category: getStockCategory(quote.symbol),
                type: 'stock',
                currency: 'USD',
                exchange: quote.exchange || getStockExchange(quote.symbol),
                lastUpdated: new Date().toISOString().split('T')[0],
                high: quote.dayHigh,
                low: quote.dayLow,
                open: quote.open,
                previousClose: quote.previousClose,
                isRealTime: true
              })
            }
          })
        }
      }
    }
  } catch (error) {
    console.log('FMP stock data failed:', error.message)
  }
}

// Fetch cryptocurrency data
async function fetchCryptoData(symbols, watchlistData) {
  const cryptoSymbols = symbols.includes('BTC') ? symbols : 'BTC,ETH,ADA,SOL,DOT'
  const symbolArray = cryptoSymbols.split(',').map(s => s.trim().toUpperCase())
  
  try {
    const fmpKey = process.env.FMP_API_KEY || 'demo'
    if (fmpKey !== 'demo') {
      for (const symbol of symbolArray) {
        try {
          const cryptoUrl = `https://financialmodelingprep.com/api/v3/quote/${symbol}USD?apikey=${fmpKey}`
          const cryptoResponse = await fetch(cryptoUrl)
          
          if (cryptoResponse.ok) {
            const cryptoData = await cryptoResponse.json()
            
            if (Array.isArray(cryptoData) && cryptoData.length > 0) {
              const crypto = cryptoData[0]
              watchlistData.push({
                symbol: symbol,
                name: getCryptoName(symbol),
                price: crypto.price,
                change: crypto.change,
                changePercent: crypto.changesPercentage,
                volume: crypto.volume,
                marketCap: crypto.marketCap || null,
                category: 'cryptocurrency',
                type: 'crypto',
                currency: 'USD',
                exchange: 'Crypto',
                lastUpdated: new Date().toISOString().split('T')[0],
                high: crypto.dayHigh,
                low: crypto.dayLow,
                open: crypto.open,
                previousClose: crypto.previousClose,
                isRealTime: true
              })
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (error) {
          console.log(`Failed to fetch crypto data for ${symbol}:`, error.message)
        }
      }
    }
  } catch (error) {
    console.log('Crypto data fetch failed:', error.message)
  }
}

// Fetch commodities data
async function fetchCommoditiesData(symbols, watchlistData) {
  const commoditySymbols = symbols.includes('GLD') ? symbols : 'GLD,SLV,USO,UNG,DBA'
  const symbolArray = commoditySymbols.split(',').map(s => s.trim().toUpperCase())
  
  try {
    const fmpKey = process.env.FMP_API_KEY || 'demo'
    if (fmpKey !== 'demo') {
      const symbolsString = symbolArray.join(',')
      const commodityUrl = `https://financialmodelingprep.com/api/v3/quote/${symbolsString}?apikey=${fmpKey}`
      
      const commodityResponse = await fetch(commodityUrl)
      if (commodityResponse.ok) {
        const commodityData = await commodityResponse.json()
        
        if (Array.isArray(commodityData)) {
          commodityData.forEach(commodity => {
            watchlistData.push({
              symbol: commodity.symbol,
              name: getCommodityName(commodity.symbol),
              price: commodity.price,
              change: commodity.change,
              changePercent: commodity.changesPercentage,
              volume: commodity.volume,
              marketCap: commodity.marketCap,
              category: 'commodity',
              type: 'commodity',
              currency: 'USD',
              exchange: commodity.exchange || 'COMMODITY',
              lastUpdated: new Date().toISOString().split('T')[0],
              high: commodity.dayHigh,
              low: commodity.dayLow,
              open: commodity.open,
              previousClose: commodity.previousClose,
              isRealTime: true
            })
          })
        }
      }
    }
  } catch (error) {
    console.log('Commodities data fetch failed:', error.message)
  }
}

// Fetch forex data
async function fetchForexData(symbols, watchlistData) {
  const forexPairs = symbols.includes('EURUSD') ? symbols : 'EURUSD,GBPUSD,USDJPY,USDCAD'
  const pairArray = forexPairs.split(',').map(s => s.trim().toUpperCase())
  
  try {
    const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo'
    
    for (const pair of pairArray) {
      try {
        const forexUrl = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${pair.slice(0,3)}&to_currency=${pair.slice(3,6)}&apikey=${alphaVantageKey}`
        const forexResponse = await fetch(forexUrl)
        
        if (forexResponse.ok) {
          const forexData = await forexResponse.json()
          const rate = forexData['Realtime Currency Exchange Rate']
          
          if (rate) {
            const currentRate = parseFloat(rate['5. Exchange Rate'])
            const previousRate = parseFloat(rate['8. Bid Price']) // Using bid as approximate previous
            const change = currentRate - previousRate
            const changePercent = ((change / previousRate) * 100)
            
            watchlistData.push({
              symbol: pair,
              name: `${pair.slice(0,3)}/${pair.slice(3,6)}`,
              price: currentRate,
              change: change,
              changePercent: changePercent,
              volume: 'N/A',
              marketCap: null,
              category: 'forex',
              type: 'forex',
              currency: pair.slice(3,6),
              exchange: 'FOREX',
              lastUpdated: rate['6. Last Refreshed'],
              high: parseFloat(rate['7. Ask Price']),
              low: parseFloat(rate['8. Bid Price']),
              open: currentRate,
              previousClose: previousRate,
              isRealTime: true
            })
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.log(`Failed to fetch forex data for ${pair}:`, error.message)
      }
    }
  } catch (error) {
    console.log('Forex data fetch failed:', error.message)
  }
}

// Helper functions
function getCompanyName(symbol) {
  const companies = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc.',
    'TSLA': 'Tesla Inc.',
    'NVDA': 'NVIDIA Corporation',
    'AMZN': 'Amazon.com Inc.',
    'META': 'Meta Platforms Inc.',
    'JPM': 'JPMorgan Chase & Co.',
    'JNJ': 'Johnson & Johnson',
    'XOM': 'Exxon Mobil Corporation',
    'BAC': 'Bank of America Corp',
    'WMT': 'Walmart Inc.',
    'V': 'Visa Inc.',
    'PG': 'Procter & Gamble Co',
    'HD': 'Home Depot Inc.',
    'MA': 'Mastercard Inc.'
  }
  return companies[symbol] || symbol
}

function getCryptoName(symbol) {
  const cryptos = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'ADA': 'Cardano',
    'SOL': 'Solana',
    'DOT': 'Polkadot',
    'MATIC': 'Polygon',
    'LINK': 'Chainlink',
    'UNI': 'Uniswap',
    'AVAX': 'Avalanche',
    'ATOM': 'Cosmos'
  }
  return cryptos[symbol] || symbol
}

function getCommodityName(symbol) {
  const commodities = {
    'GLD': 'SPDR Gold Trust',
    'SLV': 'iShares Silver Trust',
    'USO': 'United States Oil Fund',
    'UNG': 'United States Natural Gas Fund',
    'DBA': 'Invesco DB Agriculture Fund',
    'DBC': 'Invesco DB Commodity Index',
    'PDBC': 'Invesco Optimum Yield Diversified Commodity'
  }
  return commodities[symbol] || symbol
}

function getStockCategory(symbol) {
  const categories = {
    'AAPL': 'technology',
    'MSFT': 'technology',
    'GOOGL': 'technology',
    'NVDA': 'technology',
    'META': 'technology',
    'TSLA': 'automotive',
    'JPM': 'finance',
    'BAC': 'finance',
    'V': 'finance',
    'MA': 'finance',
    'JNJ': 'healthcare',
    'PG': 'consumer',
    'WMT': 'retail',
    'HD': 'retail',
    'XOM': 'energy',
    'AMZN': 'technology'
  }
  return categories[symbol] || 'other'
}

function getStockExchange(symbol) {
  // Most symbols we're tracking are on NASDAQ or NYSE
  const nasdaqStocks = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'AMZN', 'META']
  return nasdaqStocks.includes(symbol) ? 'NASDAQ' : 'NYSE'
}

function calculateMarketCap(symbol, price) {
  // Approximate shares outstanding (in billions) for market cap calculation
  const sharesOutstanding = {
    'AAPL': 15.7,
    'MSFT': 7.4,
    'GOOGL': 12.3,
    'TSLA': 3.16,
    'NVDA': 2.47,
    'AMZN': 10.4,
    'META': 2.54
  }
  
  const shares = sharesOutstanding[symbol]
  return shares ? (shares * price * 1000000000) : null // Convert to actual market cap
}

function generateMockWatchlistData(symbols, type) {
  const symbolArray = symbols.split(',').map(s => s.trim().toUpperCase())
  
  const mockStocks = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 185.20,
      change: 2.75,
      changePercent: 1.51,
      volume: '52.3M',
      marketCap: 2900000000000,
      category: 'technology',
      type: 'stock',
      currency: 'USD',
      exchange: 'NASDAQ',
      lastUpdated: new Date().toISOString().split('T')[0],
      high: 187.50,
      low: 182.10,
      open: 183.00,
      previousClose: 182.45,
      isMockData: true
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 45230.50,
      change: 1250.30,
      changePercent: 2.84,
      volume: '28.5B',
      marketCap: 890000000000,
      category: 'cryptocurrency',
      type: 'crypto',
      currency: 'USD',
      exchange: 'Crypto',
      lastUpdated: new Date().toISOString().split('T')[0],
      high: 46100.00,
      low: 43800.00,
      open: 44000.00,
      previousClose: 43980.20,
      isMockData: true
    },
    {
      symbol: 'GLD',
      name: 'SPDR Gold Trust',
      price: 185.75,
      change: -1.25,
      changePercent: -0.67,
      volume: '8.2M',
      marketCap: 65000000000,
      category: 'commodity',
      type: 'commodity',
      currency: 'USD',
      exchange: 'NYSE',
      lastUpdated: new Date().toISOString().split('T')[0],
      high: 187.20,
      low: 184.90,
      open: 186.50,
      previousClose: 187.00,
      isMockData: true
    },
    {
      symbol: 'EURUSD',
      name: 'EUR/USD',
      price: 1.0856,
      change: 0.0023,
      changePercent: 0.21,
      volume: 'N/A',
      marketCap: null,
      category: 'forex',
      type: 'forex',
      currency: 'USD',
      exchange: 'FOREX',
      lastUpdated: new Date().toISOString(),
      high: 1.0875,
      low: 1.0840,
      open: 1.0851,
      previousClose: 1.0833,
      isMockData: true
    }
  ]
  
  // Filter based on requested symbols and type
  return mockStocks.filter(item => {
    const matchesSymbol = symbolArray.length === 0 || symbolArray.includes(item.symbol)
    const matchesType = type === 'all' || item.type === type
    return matchesSymbol && matchesType
  })
}

// POST route for searching instruments
export async function POST(request) {
  try {
    const body = await request.json()
    const { query, type = 'stocks', comprehensive = false } = body

    if (!query || query.length < 2) {
      return NextResponse.json({ success: false, error: 'Query too short' })
    }

    let searchResults = []

    // If comprehensive search is requested, use multiple data sources
    if (comprehensive) {
      // Method 1: Alpha Vantage Symbol Search
      try {
        const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo'
        const alphaResponse = await fetch(
          `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${alphaVantageKey}`
        )
        const alphaData = await alphaResponse.json()

        if (alphaData.bestMatches && alphaData.bestMatches.length > 0) {
          const alphaResults = alphaData.bestMatches.map(match => ({
            symbol: match['1. symbol'],
            name: match['2. name'],
            type: match['3. type'] || 'stock',
            region: match['4. region'],
            currency: match['8. currency'] || 'USD',
            source: 'Alpha Vantage'
          }))
          searchResults = [...searchResults, ...alphaResults]
        }
      } catch (error) {
        console.log('Alpha Vantage comprehensive search failed:', error)
      }

      // Method 2: Financial Modeling Prep Search
      try {
        const fmpKey = process.env.FMP_API_KEY
        if (fmpKey) {
          const fmpResponse = await fetch(
            `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(query)}&limit=20&apikey=${fmpKey}`
          )
          const fmpData = await fmpResponse.json()

          if (Array.isArray(fmpData) && fmpData.length > 0) {
            const fmpResults = fmpData.map(company => ({
              symbol: company.symbol,
              name: company.name,
              type: 'stock',
              region: company.exchangeShortName || 'Unknown',
              currency: company.currency || 'USD',
              source: 'Financial Modeling Prep'
            }))
            searchResults = [...searchResults, ...fmpResults]
          }
        }
      } catch (error) {
        console.log('Financial Modeling Prep search failed:', error)
      }
    }

    // Fallback to existing search logic
    if (searchResults.length === 0) {
      // Use existing basic search...
      const basicResults = await performBasicSearch(query, type)
      searchResults = basicResults
    }

    // Remove duplicates
    const uniqueResults = searchResults.filter((stock, index, self) => 
      index === self.findIndex(s => s.symbol === stock.symbol)
    )

    return NextResponse.json({ 
      success: true, 
      data: uniqueResults.slice(0, 20),
      query: query,
      comprehensive: comprehensive
    })

  } catch (error) {
    console.error('POST search error:', error)
    return NextResponse.json({ success: false, error: 'Search failed' })
  }
}

async function performBasicSearch(query, type) {
  try {
    const { query, type } = await request.json()
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Query must be at least 2 characters long'
      }, { status: 400 })
    }

    const searchResults = []
    
    // Search based on type
    if (type === 'stocks' || type === 'all') {
      await searchStocks(query, searchResults)
    }
    
    if (type === 'crypto' || type === 'all') {
      await searchCrypto(query, searchResults)
    }
    
    if (type === 'commodities' || type === 'all') {
      await searchCommodities(query, searchResults)
    }
    
    if (type === 'forex' || type === 'all') {
      await searchForex(query, searchResults)
    }
    
    // Remove duplicates
    const uniqueResults = searchResults.filter((item, index, self) => 
      index === self.findIndex(i => i.symbol === item.symbol)
    )
    
    return NextResponse.json({
      success: true,
      data: uniqueResults.slice(0, 10), // Limit to 10 results
      query,
      type,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error searching instruments:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to search instruments'
    }, { status: 500 })
  }
}

async function searchForex(query, results) {
  const forexPairs = [
    { symbol: 'EURUSD', name: 'Euro/US Dollar', type: 'forex' },
    { symbol: 'GBPUSD', name: 'British Pound/US Dollar', type: 'forex' },
    { symbol: 'USDJPY', name: 'US Dollar/Japanese Yen', type: 'forex' },
    { symbol: 'USDCHF', name: 'US Dollar/Swiss Franc', type: 'forex' },
    { symbol: 'AUDUSD', name: 'Australian Dollar/US Dollar', type: 'forex' }
  ]
  
  forexPairs.forEach(pair => {
    if (pair.symbol.toLowerCase().includes(query.toLowerCase()) || 
        pair.name.toLowerCase().includes(query.toLowerCase())) {
      results.push(pair)
    }
  })
}

// Enhanced search functions
async function searchStocks(query, results) {
  const queryUpper = query.toUpperCase()
  
  // First, check if this looks like an Indian stock search
  const indianStocks = [
    { symbol: 'RELIANCE', name: 'Reliance Industries Limited', region: 'India', currency: 'INR' },
    { symbol: 'TCS', name: 'Tata Consultancy Services Limited', region: 'India', currency: 'INR' },
    { symbol: 'INFY', name: 'Infosys Limited', region: 'India', currency: 'INR' },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Limited', region: 'India', currency: 'INR' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', region: 'India', currency: 'INR' },
    { symbol: 'SBIN', name: 'State Bank of India', region: 'India', currency: 'INR' },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited', region: 'India', currency: 'INR' },
    { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Limited', region: 'India', currency: 'INR' },
    { symbol: 'ITC', name: 'ITC Limited', region: 'India', currency: 'INR' },
    { symbol: 'LT', name: 'Larsen & Toubro Limited', region: 'India', currency: 'INR' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', region: 'India', currency: 'INR' },
    { symbol: 'WIPRO', name: 'Wipro Limited', region: 'India', currency: 'INR' },
    { symbol: 'MARUTI', name: 'Maruti Suzuki India Limited', region: 'India', currency: 'INR' },
    { symbol: 'ASIANPAINT', name: 'Asian Paints Limited', region: 'India', currency: 'INR' },
    { symbol: 'BAJFINANCE', name: 'Bajaj Finance Limited', region: 'India', currency: 'INR' },
    { symbol: 'HCLTECH', name: 'HCL Technologies Limited', region: 'India', currency: 'INR' },
    { symbol: 'AXISBANK', name: 'Axis Bank Limited', region: 'India', currency: 'INR' },
    { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Limited', region: 'India', currency: 'INR' },
    { symbol: 'TITAN', name: 'Titan Company Limited', region: 'India', currency: 'INR' },
    { symbol: 'NESTLEIND', name: 'Nestle India Limited', region: 'India', currency: 'INR' },
    { symbol: 'ADANIPORTS', name: 'Adani Ports and Special Economic Zone Limited', region: 'India', currency: 'INR' },
    { symbol: 'TECHM', name: 'Tech Mahindra Limited', region: 'India', currency: 'INR' },
    { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Limited', region: 'India', currency: 'INR' },
    { symbol: 'JSWSTEEL', name: 'JSW Steel Limited', region: 'India', currency: 'INR' },
    { symbol: 'TATASTEEL', name: 'Tata Steel Limited', region: 'India', currency: 'INR' }
  ]
  
  // Search Indian stocks first
  const matchingIndianStocks = indianStocks.filter(stock => 
    stock.symbol.includes(queryUpper) || 
    stock.name.toUpperCase().includes(queryUpper)
  )
  
  // Add both NSE and BSE versions for Indian stocks
  matchingIndianStocks.forEach(stock => {
    results.push({
      symbol: stock.symbol + '.NS',
      name: stock.name,
      type: 'stock',
      region: 'India (NSE)',
      currency: 'INR'
    })
    results.push({
      symbol: stock.symbol + '.BO',
      name: stock.name,
      type: 'stock',
      region: 'India (BSE)',
      currency: 'INR'
    })
  })
  
  // Try to search using Alpha Vantage API for other stocks
  try {
    const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo'
    
    if (alphaVantageKey !== 'demo') {
      const searchUrl = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${alphaVantageKey}`
      const response = await fetch(searchUrl)
      
      if (response.ok) {
        const data = await response.json()
        const matches = data.bestMatches || []
        
        matches.slice(0, 5).forEach(match => {
          results.push({
            symbol: match['1. symbol'],
            name: match['2. name'],
            type: 'stock',
            region: match['4. region'],
            currency: match['8. currency']
          })
        })
      }
    }
  } catch (error) {
    console.log('Alpha Vantage search failed:', error.message)
  }

  // Fallback to mock data for US stocks if no results yet
  if (results.length === 0) {
    const mockStocks = [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', region: 'United States', currency: 'USD' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', region: 'United States', currency: 'USD' },
      { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', type: 'stock', region: 'United States', currency: 'USD' },
      { symbol: 'TSLA', name: 'Tesla, Inc.', type: 'stock', region: 'United States', currency: 'USD' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock', region: 'United States', currency: 'USD' }
    ]
    
    mockStocks.forEach(stock => {
      if (stock.symbol.toLowerCase().includes(query.toLowerCase()) || 
          stock.name.toLowerCase().includes(query.toLowerCase())) {
        results.push(stock)
      }
    })
  }
}

async function searchCrypto(query, results) {
  // Mock crypto search - in production you'd use a crypto API
  const cryptos = [
    { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
    { symbol: 'ETH', name: 'Ethereum', type: 'crypto' },
    { symbol: 'ADA', name: 'Cardano', type: 'crypto' },
    { symbol: 'SOL', name: 'Solana', type: 'crypto' },
    { symbol: 'DOT', name: 'Polkadot', type: 'crypto' }
  ]
  
  cryptos.forEach(crypto => {
    if (crypto.symbol.toLowerCase().includes(query.toLowerCase()) || 
        crypto.name.toLowerCase().includes(query.toLowerCase())) {
      results.push(crypto)
    }
  })
}

async function searchCommodities(query, results) {
  const commodities = [
    { symbol: 'GLD', name: 'SPDR Gold Trust', type: 'commodity' },
    { symbol: 'SLV', name: 'iShares Silver Trust', type: 'commodity' },
    { symbol: 'USO', name: 'United States Oil Fund', type: 'commodity' },
    { symbol: 'UNG', name: 'United States Natural Gas Fund', type: 'commodity' }
  ]
  
  commodities.forEach(commodity => {
    if (commodity.symbol.toLowerCase().includes(query.toLowerCase()) || 
        commodity.name.toLowerCase().includes(query.toLowerCase())) {
      results.push(commodity)
    }
  })
}

function getMockSearchResults(query, type) {
  // Return relevant mock results based on query and type
  const mockResults = {
    stocks: [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', region: 'United States', currency: 'USD' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', region: 'United States', currency: 'USD' }
    ],
    crypto: [
      { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
      { symbol: 'ETH', name: 'Ethereum', type: 'crypto' }
    ],
    commodities: [
      { symbol: 'GLD', name: 'SPDR Gold Trust', type: 'commodity' },
      { symbol: 'SLV', name: 'iShares Silver Trust', type: 'commodity' }
    ]
  }
  
  return mockResults[type] || []
}
