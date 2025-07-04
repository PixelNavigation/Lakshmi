import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(request) {
  return new Response(null, { status: 200, headers: corsHeaders })
}

// Helper function to get USD to INR conversion rate
async function getUSDToINRRate() {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    return data.rates.INR || 83.50; // Fallback to approximate rate
  } catch (error) {
    console.log('Exchange rate API error, using fallback rate:', error.message);
    return 83.50; // Fallback rate
  }
}

// Helper function to convert USD to INR
function convertUSDToINR(usdValue, rate) {
  if (!usdValue || isNaN(usdValue)) return 0;
  return usdValue * rate;
}

// Helper function to check if an asset is USD-based
function isUSDBasedAsset(symbol) {
  // Common crypto symbols (USD-based)
  const cryptoSymbols = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOGE', 'MATIC', 'LTC', 'BCH', 'LINK', 'UNI', 'AVAX', 'DOT', 'SHIB'];
  
  // US stock patterns
  const usStockPatterns = [
    /^[A-Z]{1,5}$/, // Typical US stock symbols (1-5 letters)
    /^[A-Z]+\.(US|NASDAQ|NYSE)$/i // Explicit US exchange suffixes
  ];
  
  // Check crypto symbols
  if (cryptoSymbols.includes(symbol.toUpperCase())) {
    return true;
  }
  
  // Check US stock patterns
  for (const pattern of usStockPatterns) {
    if (pattern.test(symbol) && !symbol.includes('.NS') && !symbol.includes('.BO')) {
      // Additional check: if it's a known Indian stock, don't treat as USD
      const indianStocks = Object.values(INDIAN_COMPANIES);
      if (!indianStocks.includes(symbol.toUpperCase())) {
        return true;
      }
    }
  }
  
  return false;
}

// Enhanced Indian company mappings
const INDIAN_COMPANIES = {
  // Technology
  'tcs': 'TCS', 'tata consultancy services': 'TCS', 'tata consultancy': 'TCS',
  'infosys': 'INFY', 'infy': 'INFY',
  'wipro': 'WIPRO',
  'hcl technologies': 'HCLTECH', 'hcl tech': 'HCLTECH', 'hcltech': 'HCLTECH',
  'tech mahindra': 'TECHM', 'techm': 'TECHM',
  
  // Banking & Financial Services
  'state bank of india': 'SBIN', 'sbi': 'SBIN', 'state bank': 'SBIN',
  'hdfc bank': 'HDFCBANK', 'hdfcbank': 'HDFCBANK',
  'icici bank': 'ICICIBANK', 'icicibank': 'ICICIBANK',
  'axis bank': 'AXISBANK', 'axisbank': 'AXISBANK',
  'kotak mahindra bank': 'KOTAKBANK', 'kotak bank': 'KOTAKBANK', 'kotakbank': 'KOTAKBANK',
  'indusind bank': 'INDUSINDBK', 'indusindbk': 'INDUSINDBK',
  'bajaj finance': 'BAJFINANCE', 'bajfinance': 'BAJFINANCE',
  'bajaj finserv': 'BAJAJFINSV', 'bajajfinsv': 'BAJAJFINSV',
  
  // Oil & Gas
  'reliance industries': 'RELIANCE', 'reliance': 'RELIANCE', 'ril': 'RELIANCE',
  'oil and natural gas corporation': 'ONGC', 'ongc': 'ONGC',
  'bharat petroleum': 'BPCL', 'bpcl': 'BPCL',
  'indian oil corporation': 'IOC', 'ioc': 'IOC',
  
  // Automotive
  'tata motors': 'TATAMOTORS', 'tatamotors': 'TATAMOTORS',
  'maruti suzuki': 'MARUTI', 'maruti': 'MARUTI',
  'mahindra & mahindra': 'M&M', 'mahindra': 'M&M', 'm&m': 'M&M',
  'bajaj auto': 'BAJAJ-AUTO', 'bajaj-auto': 'BAJAJ-AUTO',
  'hero motocorp': 'HEROMOTOCO', 'heromotoco': 'HEROMOTOCO', 'hero': 'HEROMOTOCO',
  'eicher motors': 'EICHERMOT', 'eichermot': 'EICHERMOT',
  
  // Telecom
  'bharti airtel': 'BHARTIARTL', 'airtel': 'BHARTIARTL', 'bhartiartl': 'BHARTIARTL',
  
  // FMCG
  'hindustan unilever': 'HINDUNILVR', 'hul': 'HINDUNILVR', 'hindunilvr': 'HINDUNILVR',
  'itc': 'ITC', 'itc limited': 'ITC',
  'nestle india': 'NESTLEIND', 'nestle': 'NESTLEIND', 'nestleind': 'NESTLEIND',
  'britannia': 'BRITANNIA', 'britannia industries': 'BRITANNIA',
  'godrej consumer products': 'GODREJCP', 'godrej': 'GODREJCP',
  'tata consumer products': 'TATACONSUM', 'tataconsum': 'TATACONSUM',
  
  // Metals & Mining
  'tata steel': 'TATASTEEL', 'tatasteel': 'TATASTEEL',
  'jsw steel': 'JSWSTEEL', 'jswsteel': 'JSWSTEEL',
  'hindalco': 'HINDALCO', 'hindalco industries': 'HINDALCO',
  'coal india': 'COALINDIA', 'coalindia': 'COALINDIA',
  'vedanta': 'VEDL', 'vedanta limited': 'VEDL',
  
  // Cement
  'ultratech cement': 'ULTRACEMCO', 'ultratech': 'ULTRACEMCO', 'ultracemco': 'ULTRACEMCO',
  'shree cement': 'SHREECEM', 'shreecem': 'SHREECEM',
  'acc': 'ACC', 'acc cement': 'ACC',
  'ambuja cements': 'AMBUJACEM', 'ambuja': 'AMBUJACEM',
  
  // Power & Utilities
  'power grid': 'POWERGRID', 'powergrid': 'POWERGRID',
  'ntpc': 'NTPC', 'ntpc limited': 'NTPC',
  'adani power': 'ADANIPOWER', 'adanipower': 'ADANIPOWER',
  
  // Paints
  'asian paints': 'ASIANPAINT', 'asianpaint': 'ASIANPAINT', 'asian paint': 'ASIANPAINT',
  'berger paints': 'BERGEPAINT', 'berger': 'BERGEPAINT',
  
  // Construction
  'larsen and toubro': 'LT', 'l&t': 'LT', 'lt': 'LT',
  'ncc': 'NCC', 'ncc limited': 'NCC',
  
  // New Age Companies
  'zomato': 'ZOMATO',
  'nykaa': 'NYKAA', 'fsg consumer brands': 'NYKAA',
  'paytm': 'PAYTM', 'one97 communications': 'PAYTM',
  'policy bazaar': 'POLICYBZR', 'policybazaar': 'POLICYBZR',
  'dmart': 'DMART', 'avenue supermarts': 'DMART',
  
  // Retail & Others
  'titan': 'TITAN', 'titan company': 'TITAN',
  'apollo hospitals': 'APOLLOHOSP', 'apollo': 'APOLLOHOSP', 'apollohosp': 'APOLLOHOSP',
  'grasim industries': 'GRASIM', 'grasim': 'GRASIM',
  'aditya birla': 'GRASIM',
  
  // Adani Group
  'adani enterprises': 'ADANIENT', 'adanient': 'ADANIENT',
  'adani ports': 'ADANIPORTS', 'adaniports': 'ADANIPORTS',
  'adani green energy': 'ADANIGREEN', 'adanigreen': 'ADANIGREEN',
  'adani transmission': 'ADANITRANS', 'adanitrans': 'ADANITRANS'
}

function extractStockSymbols(text) {
  const symbols = new Set()
  const lowerText = text.toLowerCase()
  
  // Check for direct company name matches
  for (const [companyName, symbol] of Object.entries(INDIAN_COMPANIES)) {
    if (lowerText.includes(companyName)) {
      symbols.add(symbol)
    }
  }
  
  // Also check for direct stock symbol patterns (3-10 uppercase letters)
  const symbolMatches = text.match(/\b[A-Z]{3,10}\b/g) || []
  symbolMatches.forEach(symbol => {
    // Only add if it's likely a valid Indian stock symbol
    if (Object.values(INDIAN_COMPANIES).includes(symbol) || 
        /^[A-Z]{3,10}$/.test(symbol)) {
      symbols.add(symbol)
    }
  })
  
  // Check for market indices
  if (lowerText.includes('nifty') || lowerText.includes('sensex') || 
      lowerText.includes('market overview') || lowerText.includes('indian market')) {
    symbols.add('NIFTY50')
    symbols.add('SENSEX')
  }
  
  // Add popular stocks for general market queries
  if (lowerText.includes('market') || lowerText.includes('top stocks') || 
      lowerText.includes('popular stocks') || symbols.size === 0) {
    // Add top 5 most liquid Indian stocks for market context
    const topStocks = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK']
    topStocks.forEach(stock => symbols.add(stock))
  }
  
  return Array.from(symbols)
}

// Function to fetch comprehensive real-time stock data from Yahoo Finance
async function fetchStockData(symbol, retries = 3) {
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'
      : 'http://localhost:3000'
    
    // Check if this is a USD-based asset
    const isUSDAsset = isUSDBasedAsset(symbol);
    let usdToInrRate = 1;
    
    if (isUSDAsset) {
      usdToInrRate = await getUSDToINRRate();
    }
    
    // Fetch live quote data with retry mechanism
    let data = null;
    let lastError = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Fetching data for ${symbol} (attempt ${attempt}/${retries})`)
        const response = await fetch(`${baseUrl}/api/yahoo-finance?symbol=${symbol}&timeframe=live`, {
          timeout: 10000, // 10 second timeout
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        
        const responseData = await response.json()
        
        if (responseData.success && responseData.data) {
          data = responseData;
          break; // Success, exit retry loop
        } else {
          lastError = responseData.error || responseData.errorDetails || 'No data available';
          console.log(`Attempt ${attempt} failed for ${symbol}: ${lastError}`)
          
          if (attempt < retries) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      } catch (fetchError) {
        lastError = fetchError.message;
        console.log(`Network error on attempt ${attempt} for ${symbol}: ${lastError}`)
        
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    if (!data || !data.success || !data.data) {
      console.log(`Failed to fetch data for ${symbol} after ${retries} attempts: ${lastError}`)
      return null
    }
    
    // Try to fetch additional fundamental data
    let fundamentalData = {}
    try {
      const fundamentalResponse = await fetch(`${baseUrl}/api/stock-detail?symbol=${symbol}`, {
        timeout: 8000,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (fundamentalResponse.ok) {
        const fundamentalJson = await fundamentalResponse.json()
        if (fundamentalJson.success && fundamentalJson.data) {
          fundamentalData = {
            marketCap: isUSDAsset ? convertUSDToINR(fundamentalJson.data.marketCap, usdToInrRate) : fundamentalJson.data.marketCap,
            peRatio: fundamentalJson.data.peRatio,
            eps: isUSDAsset ? convertUSDToINR(fundamentalJson.data.eps, usdToInrRate) : fundamentalJson.data.eps,
            dividendYield: fundamentalJson.data.dividendYield,
            beta: fundamentalJson.data.beta,
            fiftyTwoWeekHigh: isUSDAsset ? convertUSDToINR(fundamentalJson.data.fiftyTwoWeekHigh, usdToInrRate) : fundamentalJson.data.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: isUSDAsset ? convertUSDToINR(fundamentalJson.data.fiftyTwoWeekLow, usdToInrRate) : fundamentalJson.data.fiftyTwoWeekLow,
            avgVolume: fundamentalJson.data.avgVolume,
            shares: fundamentalJson.data.shares,
            bookValue: isUSDAsset ? convertUSDToINR(fundamentalJson.data.bookValue, usdToInrRate) : fundamentalJson.data.bookValue,
            priceToBook: fundamentalJson.data.priceToBook,
            sector: fundamentalJson.data.sector,
            industry: fundamentalJson.data.industry,
            country: fundamentalJson.data.country || 'India'
          }
        }
      }
    } catch (fundamentalError) {
      console.log(`Could not fetch fundamental data for ${symbol}:`, fundamentalError.message)
    }
    
    // Calculate additional metrics
    const stockInfo = {
      symbol: symbol.toUpperCase(),
      price: isUSDAsset ? convertUSDToINR(data.data.price, usdToInrRate) : data.data.price,
      change: isUSDAsset ? convertUSDToINR(data.data.change, usdToInrRate) : data.data.change,
      changePercent: data.data.changePercent,
      previousClose: isUSDAsset ? convertUSDToINR(data.data.previousClose, usdToInrRate) : data.data.previousClose,
      open: isUSDAsset ? convertUSDToINR(data.data.open, usdToInrRate) : data.data.open,
      dayHigh: isUSDAsset ? convertUSDToINR(data.data.dayHigh, usdToInrRate) : data.data.dayHigh,
      dayLow: isUSDAsset ? convertUSDToINR(data.data.dayLow, usdToInrRate) : data.data.dayLow,
      volume: data.data.volume,
      time: data.data.time || new Date().toISOString(),
      currency: isUSDAsset ? 'INR (converted from USD)' : 'INR',
      exchangeRate: isUSDAsset ? usdToInrRate : null,
      fetchTime: new Date().toISOString(),
      ...fundamentalData
    }
    
    // Add calculated metrics
    if (stockInfo.price && stockInfo.previousClose) {
      stockInfo.dayChangeRatio = ((stockInfo.price - stockInfo.previousClose) / stockInfo.previousClose * 100).toFixed(2);
    }
    
    if (stockInfo.dayHigh && stockInfo.dayLow && stockInfo.price) {
      stockInfo.dayRangePercent = (((stockInfo.price - stockInfo.dayLow) / (stockInfo.dayHigh - stockInfo.dayLow)) * 100).toFixed(2);
    }
    
    console.log(`Successfully fetched comprehensive data for ${symbol}`)
    return stockInfo
    
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error)
    return null
  }
}

export async function POST(request) {
  try {
    const { message, requestChart = false, isAutoAnalysis = false } = await request.json()
    
    if (!message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Message is required' 
      })
    }

    // Check if GEMINI_API_KEY is available
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables')
      return NextResponse.json({ 
        success: false, 
        error: 'GEMINI_API_KEY is not configured. Please add it to your .env.local file.' 
      })
    }

    console.log('Processing message:', message.substring(0, 100) + '...')
    console.log('Request chart:', requestChart)
    console.log('Is auto analysis:', isAutoAnalysis)

    // Extract stock symbols from the message
    const stockSymbols = extractStockSymbols(message)
    let stockData = []
    
    // Always fetch real-time market data for context - increase limit for better analysis
    console.log('Found stock symbols:', stockSymbols)
    
    if (stockSymbols.length > 0) {
      // Fetch data for all mentioned stocks (up to 10 for comprehensive analysis)
      const symbolsToFetch = stockSymbols.slice(0, 10)
      
      // Fetch all stocks in parallel for faster response
      const dataPromises = symbolsToFetch.map(symbol => 
        fetchStockData(symbol).catch(error => {
          console.log(`Failed to fetch ${symbol}:`, error.message)
          return null
        })
      )
      
      const results = await Promise.all(dataPromises)
      stockData = results.filter(data => data !== null)
      
      console.log(`Successfully fetched data for ${stockData.length}/${symbolsToFetch.length} stocks`)
      
      // If we couldn't fetch any specific stocks, try to fetch market indices for context
      if (stockData.length === 0) {
        console.log('No specific stock data found, fetching market indices for context')
        const indexPromises = ['NIFTY50', 'SENSEX', 'BANKNIFTY'].map(index => 
          fetchStockData(index).catch(() => null)
        )
        const indexResults = await Promise.all(indexPromises)
        stockData = indexResults.filter(data => data !== null)
      }
    } else {
      // For general market queries, always provide market context
      console.log('No specific stocks mentioned, fetching market overview')
      const marketSymbols = ['NIFTY50', 'SENSEX', 'RELIANCE', 'TCS', 'HDFCBANK']
      const marketPromises = marketSymbols.map(symbol => 
        fetchStockData(symbol).catch(() => null)
      )
      const marketResults = await Promise.all(marketPromises)
      stockData = marketResults.filter(data => data !== null)
    }

    // Check if user is asking for charts
    const isChartRequest = message.toLowerCase().includes('chart') || 
                          message.toLowerCase().includes('show chart') ||
                          message.toLowerCase().includes('display chart') ||
                          requestChart

    // If it's a chart request, return minimal response for chart display
    if (isChartRequest && stockSymbols.length > 0) {
      return NextResponse.json({
        success: true,
        response: `Displaying chart for ${stockSymbols[0]} with real-time data analysis.`,
        stockData: stockData,
        symbols: stockSymbols,
        showChart: true,
        chartSymbol: stockSymbols[0]
      })
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Create comprehensive analysis prompt for non-chart requests
    const currentDate = new Date().toLocaleDateString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'long', 
      year: 'numeric'
    })
    
    let enhancedPrompt = `You are Lakshmi AI, an expert Indian stock market analyst with deep knowledge of fundamental, technical, and sentiment analysis.

Current Date: ${currentDate}
User question: "${message}"`

    if (stockData.length > 0) {
      const currentTime = new Date().toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
      
      enhancedPrompt += `\n\n🔴 LIVE MARKET DATA (Updated: ${currentTime} IST):\n`
      
      // Separate indices and stocks for better organization
      const indices = stockData.filter(stock => ['NIFTY50', 'SENSEX', 'BANKNIFTY'].includes(stock.symbol))
      const stocks = stockData.filter(stock => !['NIFTY50', 'SENSEX', 'BANKNIFTY'].includes(stock.symbol))
      
      // Show market indices first
      if (indices.length > 0) {
        enhancedPrompt += `\n📊 MARKET INDICES:\n`
        indices.forEach(stock => {
          const changeDirection = stock.change >= 0 ? '📈' : '📉'
          enhancedPrompt += `• ${stock.symbol}: ₹${stock.price?.toFixed(2)} ${changeDirection} ${stock.change?.toFixed(2)} (${stock.changePercent?.toFixed(2)}%)\n`
        })
      }
      
      // Show individual stocks
      if (stocks.length > 0) {
        enhancedPrompt += `\n📈 INDIVIDUAL STOCKS:\n`
        stocks.forEach(stock => {
          const changeDirection = stock.change >= 0 ? '📈' : '📉'
          const currencySymbol = stock.currency && stock.currency.includes('converted') ? '₹' : '₹'
          enhancedPrompt += `\n• ${stock.symbol}: ${currencySymbol}${stock.price?.toFixed(2)} ${changeDirection} ${stock.change?.toFixed(2)} (${stock.changePercent?.toFixed(2)}%)\n`
          
          // Add currency conversion note if applicable
          if (stock.currency && stock.currency.includes('converted')) {
            enhancedPrompt += `  💱 Currency: ${stock.currency} (Rate: 1 USD = ₹${stock.exchangeRate?.toFixed(2)})\n`
          }
          
          // Add comprehensive real-time metrics
          if (stock.previousClose) enhancedPrompt += `  Previous Close: ${currencySymbol}${stock.previousClose?.toFixed(2)}\n`
          if (stock.open) enhancedPrompt += `  Open: ${currencySymbol}${stock.open?.toFixed(2)}\n`
          if (stock.dayHigh && stock.dayLow) {
            enhancedPrompt += `  Day Range: ${currencySymbol}${stock.dayLow?.toFixed(2)} - ${currencySymbol}${stock.dayHigh?.toFixed(2)}\n`
            if (stock.dayRangePercent) {
              enhancedPrompt += `  Position in Range: ${stock.dayRangePercent}%\n`
            }
          }
          if (stock.volume) enhancedPrompt += `  Volume: ${(stock.volume/1e6).toFixed(2)}M shares\n`
          
          // Add fundamental data if available
          if (stock.marketCap) enhancedPrompt += `  Market Cap: ${currencySymbol}${(stock.marketCap/1e9).toFixed(2)}B\n`
          if (stock.peRatio) enhancedPrompt += `  P/E Ratio: ${stock.peRatio?.toFixed(2)}\n`
          if (stock.eps) enhancedPrompt += `  EPS: ${currencySymbol}${stock.eps?.toFixed(2)}\n`
          if (stock.dividendYield) enhancedPrompt += `  Dividend Yield: ${stock.dividendYield?.toFixed(2)}%\n`
          if (stock.beta) enhancedPrompt += `  Beta: ${stock.beta?.toFixed(2)}\n`
          if (stock.fiftyTwoWeekHigh && stock.fiftyTwoWeekLow) {
            enhancedPrompt += `  52-Week Range: ${currencySymbol}${stock.fiftyTwoWeekLow?.toFixed(2)} - ${currencySymbol}${stock.fiftyTwoWeekHigh?.toFixed(2)}\n`
          }
          if (stock.bookValue) enhancedPrompt += `  Book Value: ${currencySymbol}${stock.bookValue?.toFixed(2)}\n`
          if (stock.priceToBook) enhancedPrompt += `  Price to Book: ${stock.priceToBook?.toFixed(2)}\n`
          if (stock.sector) enhancedPrompt += `  Sector: ${stock.sector}\n`
          if (stock.industry) enhancedPrompt += `  Industry: ${stock.industry}\n`
          
          enhancedPrompt += `  🕐 Data Fetched: ${stock.fetchTime ? new Date(stock.fetchTime).toLocaleTimeString('en-IN', {timeZone: 'Asia/Kolkata', hour12: true}) : 'Now'}\n`
        })
      }
      
      enhancedPrompt += `\n💡 All prices are in INR. USD-based assets are converted using real-time exchange rates.\n`
      
      // If some symbols were requested but not found, mention this
      if (stockSymbols.length > stockData.length) {
        const missingSymbols = stockSymbols.filter(symbol => 
          !stockData.some(stock => stock.symbol === symbol)
        )
        enhancedPrompt += `\nNote: Real-time data could not be retrieved for: ${missingSymbols.join(', ')}\n`
      }

      // For specific stock analysis, provide comprehensive scoring
      if (stockData.length === 1) {
        const stock = stockData[0]
        enhancedPrompt += `\n\n🎯 COMPREHENSIVE ANALYSIS REQUEST:
Please provide a detailed analysis of ${stock.symbol} using the real-time data above. 

**FORMAT YOUR RESPONSE WITH CLEAR SECTIONS AND EMOJIS:**

## 📊 FUNDAMENTAL ANALYSIS (25 points)
- Business model and competitive position in Indian market
- Revenue growth trends and profitability metrics  
- Market leadership and sector performance
- Management quality and corporate governance
- Analysis using real P/E ratio (${stock.peRatio || 'N/A'}), EPS (₹${stock.eps || 'N/A'}), Book Value
**Score: X/25**

## 📈 TECHNICAL ANALYSIS (25 points)
- Current price (₹${stock.price}) position analysis
- 52-week range assessment: (₹${stock.fiftyTwoWeekLow || 'N/A'} - ₹${stock.fiftyTwoWeekHigh || 'N/A'})
- Today's performance: Open ₹${stock.open || 'N/A'}, Range ₹${stock.dayLow || 'N/A'}-₹${stock.dayHigh || 'N/A'}
- Volume analysis: Current ${(stock.volume/1e6)?.toFixed(2) || 'N/A'}M shares
- Price momentum and trend indicators
**Score: X/25**

## 📰 SENTIMENT ANALYSIS (25 points)  
- Market sentiment and investor confidence assessment
- News flow and sector outlook analysis
- Institutional vs retail participation trends
- FII/DII buying patterns and market dynamics
**Score: X/25**

## 💰 VALUATION ANALYSIS (25 points)
- P/E ratio (${stock.peRatio || 'N/A'}) vs sector average comparison
- Price-to-book (${stock.priceToBook || 'N/A'}) and other key metrics
- Current price vs intrinsic value assessment  
- Dividend yield (${stock.dividendYield || 'N/A'}%) analysis
**Score: X/25**

---

## 🎯 OVERALL INVESTMENT SCORE: **X/100**

## 📋 RECOMMENDATION: **[BUY/HOLD/SELL]**
*Provide clear reasoning for your recommendation*

## ⚠️ KEY RISK FACTORS:
1. **Risk Factor 1** - Brief explanation
2. **Risk Factor 2** - Brief explanation  
3. **Risk Factor 3** - Brief explanation

---
**📊 REAL-TIME DATA SUMMARY:**
- Current Price: ₹${stock.price}
- Day Change: ${stock.change >= 0 ? '+' : ''}₹${stock.change?.toFixed(2)} (${stock.changePercent?.toFixed(2)}%)
- Volume: ${(stock.volume/1e6)?.toFixed(2)}M shares
- Data Updated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

Use all the real-time data provided above for your analysis. Focus on Indian market context (NSE/BSE, SENSEX, NIFTY correlation). Make your response structured and easy to read.`
      }
    }

    if (stockData.length === 0) {
      enhancedPrompt += `\n\nPlease provide a helpful, accurate response about Indian stocks and markets. Guidelines:
- Use ₹ symbol for Indian stock prices
- Focus on Indian market context (NSE, BSE, SENSEX, NIFTY)
- Use Indian stock symbols without .NS or .BO suffixes
- Be conversational but professional
- Include investment disclaimers for financial advice
- Keep responses concise and informative`
    }

    enhancedPrompt += `\n\nRemember: This is for educational purposes only and not financial advice. Always consult SEBI registered advisors.`

    // Generate response using Gemini
    const result = await model.generateContent(enhancedPrompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({
      success: true,
      response: text,
      stockData: stockData,
      symbols: stockSymbols,
      analysisType: stockData.length === 1 ? 'comprehensive' : 'general'
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Error in Gemini chat API:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    // Provide more specific error messages
    let errorMessage = 'Failed to generate response'
    if (error.message.includes('API key')) {
      errorMessage = 'Invalid or missing Gemini API key. Please check your .env.local file.'
    } else if (error.message.includes('quota')) {
      errorMessage = 'Gemini API quota exceeded. Please try again later.'
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = 'Network error while connecting to Gemini API. Please check your internet connection.'
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { 
      status: 500,
      headers: corsHeaders
    })
  }
}
