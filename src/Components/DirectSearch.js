'use client'

import { useState, useEffect } from 'react'
import styles from './DirectSearch.module.css'
import StockDetail from './StockDetail'

export default function DirectSearch({ 
  selectedMarket, 
  setSelectedMarket, 
  markets, 
  watchlist, 
  addToWatchlist 
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedStock, setSelectedStock] = useState(null)
  const [liveResults, setLiveResults] = useState([])

  // Real-time search with live data
  const searchInstrumentsRealTime = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      setLiveResults([])
      return
    }

    setIsSearching(true)

    try {
      // First, get basic search results
      let enhancedQuery = query.toUpperCase()
      let searchType = 'stocks'
      
      // Auto-append market suffixes for Indian stocks or crypto
      if (selectedMarket === 'NSE' && !enhancedQuery.includes('.NS')) {
        enhancedQuery = enhancedQuery + '.NS'
        searchType = 'stocks'
      } else if (selectedMarket === 'BSE' && !enhancedQuery.includes('.BO')) {
        enhancedQuery = enhancedQuery + '.BO'
        searchType = 'stocks'
      } else if (selectedMarket === 'CRYPTO') {
        // For crypto, use INR instead of USD for Indian users
        if (!enhancedQuery.includes('-INR') && !enhancedQuery.includes('-USD') && !enhancedQuery.includes('-')) {
          enhancedQuery = enhancedQuery + '-INR'
        }
        searchType = 'crypto'
      }

      // Try multiple search methods for comprehensive results
      let initialSearchResults = []

      // Method 1: Use our comprehensive search API first
      try {
        const comprehensiveResponse = await fetch(`/api/comprehensive-search?query=${encodeURIComponent(enhancedQuery)}&market=${selectedMarket}&limit=20`)
        const comprehensiveResult = await comprehensiveResponse.json()
        if (comprehensiveResult.success && comprehensiveResult.data && comprehensiveResult.data.length > 0) {
          initialSearchResults = comprehensiveResult.data
          console.log(`Found ${initialSearchResults.length} results from comprehensive search`)
        }
      } catch (error) {
        console.log('Comprehensive search failed:', error)
      }

      // Method 2: Fallback to original watchlist API
      if (initialSearchResults.length === 0) {
        try {
          const response = await fetch('/api/watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: enhancedQuery, type: searchType })
          })
          
          const result = await response.json()
          if (result.success && result.stocks) {
            initialSearchResults = result.stocks
            console.log(`Found ${initialSearchResults.length} results from watchlist API`)
          }
        } catch (error) {
          console.log('Watchlist API failed:', error)
        }
      }

      // Method 3: Try external APIs if local search fails
      if (initialSearchResults.length === 0) {
        try {
          // Try Yahoo Finance API
          const yahooResponse = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`)
          const yahooData = await yahooResponse.json()
          
          if (yahooData.quotes && yahooData.quotes.length > 0) {
            initialSearchResults = yahooData.quotes.map(quote => ({
              symbol: quote.symbol,
              name: quote.longname || quote.shortname || quote.symbol,
              type: quote.typeDisp || 'stock',
              region: quote.exchDisp || 'Unknown',
              currency: quote.currency || 'USD'
            }))
            console.log(`Found ${initialSearchResults.length} results from Yahoo Finance`)
          }
        } catch (error) {
          console.log('Yahoo Finance search failed:', error)
        }
      }

      // Method 4: Final fallback - local comprehensive database
      if (initialSearchResults.length === 0) {
        initialSearchResults = getLocalStockDatabase(query)
        console.log(`Found ${initialSearchResults.length} results from local database`)
      }
      
      // Use the comprehensive search results
      let searchResults = initialSearchResults
      
      // Additional fallbacks for Indian stocks if no results and specific market selected
      if (searchResults.length === 0 && (selectedMarket === 'NSE' || selectedMarket === 'BSE')) {
        searchResults = searchIndianStocks(query, selectedMarket)
      }
      
      // If still no results and Indian market selected, try the other Indian market as fallback
      if (searchResults.length === 0 && selectedMarket === 'NSE') {
        // Try BSE as fallback
        const bseQuery = query.toUpperCase() + '.BO'
        try {
          const bseResponse = await fetch(`/api/comprehensive-search?query=${encodeURIComponent(bseQuery)}&market=BSE&limit=10`)
          const bseResult = await bseResponse.json()
          if (bseResult.success && bseResult.data && bseResult.data.length > 0) {
            searchResults = bseResult.data
            console.log(`Found ${searchResults.length} results from BSE fallback`)
          }
        } catch (error) {
          console.log('BSE fallback failed:', error)
        }
      } else if (searchResults.length === 0 && selectedMarket === 'BSE') {
        // Try NSE as fallback
        const nseQuery = query.toUpperCase() + '.NS'
        try {
          const nseResponse = await fetch(`/api/comprehensive-search?query=${encodeURIComponent(nseQuery)}&market=NSE&limit=10`)
          const nseResult = await nseResponse.json()
          if (nseResult.success && nseResult.data && nseResult.data.length > 0) {
            searchResults = nseResult.data
            console.log(`Found ${searchResults.length} results from NSE fallback`)
          }
        } catch (error) {
          console.log('NSE fallback failed:', error)
        }
      }
      
      // Crypto fallback: if INR pair not found, try USD pair and mark for conversion
      if (searchResults.length === 0 && selectedMarket === 'CRYPTO' && enhancedQuery.includes('-INR')) {
        const usdQuery = enhancedQuery.replace('-INR', '-USD')
        try {
          const usdResponse = await fetch(`/api/comprehensive-search?query=${encodeURIComponent(usdQuery)}&market=ALL&limit=10`)
          const usdResult = await usdResponse.json()
          if (usdResult.success && usdResult.data && usdResult.data.length > 0) {
            // Mark these results as needing conversion from USD to INR
            searchResults = usdResult.data.map(result => ({
              ...result,
              symbol: result.symbol.replace('-USD', '-INR'),
              currency: 'INR',
              needsConversion: true
            }))
            console.log(`Found ${searchResults.length} results from USD crypto fallback`)
          }
        } catch (error) {
          console.log('USD crypto fallback failed:', error)
        }
      }
      
      // Final fallback to known symbols
      if (searchResults.length === 0) {
        searchResults = searchFromKnownSymbols(query)
      }

      setSearchResults(searchResults)

      // Now fetch real-time data for each result
      const liveDataPromises = searchResults.slice(0, 5).map(async (stock) => {
        try {
          const liveResponse = await fetch(`/api/stock-detail?symbol=${stock.symbol}`)
          const liveResult = await liveResponse.json()
          
          if (liveResult.success) {
            return {
              ...stock,
              ...liveResult.data,
              isLiveData: true
            }
          }
        } catch (error) {
          console.error(`Error fetching live data for ${stock.symbol}:`, error)
        }
        return stock
      })

      const liveData = await Promise.all(liveDataPromises)
      setLiveResults(liveData)
      
    } catch (error) {
      console.error('Search error:', error)
      const fallbackResults = searchFromKnownSymbols(query)
      setSearchResults(fallbackResults)
      setLiveResults(fallbackResults)
    } finally {
      setIsSearching(false)
    }
  }

  // Search Indian stocks manually
  const searchIndianStocks = (query, market) => {
    const suffix = market === 'NSE' ? '.NS' : '.BO'
    const indianStocks = [
      { symbol: 'RELIANCE', name: 'Reliance Industries Limited' },
      { symbol: 'TCS', name: 'Tata Consultancy Services Limited' },
      { symbol: 'INFY', name: 'Infosys Limited' },
      { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Limited' },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Limited' },
      { symbol: 'SBIN', name: 'State Bank of India' },
      { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited' },
      { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Limited' },
      { symbol: 'ITC', name: 'ITC Limited' },
      { symbol: 'LT', name: 'Larsen & Toubro Limited' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Limited' },
      { symbol: 'WIPRO', name: 'Wipro Limited' },
      { symbol: 'MARUTI', name: 'Maruti Suzuki India Limited' },
      { symbol: 'ASIANPAINT', name: 'Asian Paints Limited' },
      { symbol: 'BAJFINANCE', name: 'Bajaj Finance Limited' },
      { symbol: 'HCLTECH', name: 'HCL Technologies Limited' },
      { symbol: 'AXISBANK', name: 'Axis Bank Limited' },
      { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Limited' },
      { symbol: 'TITAN', name: 'Titan Company Limited' },
      { symbol: 'NESTLEIND', name: 'Nestle India Limited' }
    ]
    
    const queryUpper = query.toUpperCase()
    return indianStocks
      .filter(stock => 
        stock.symbol.includes(queryUpper) || 
        stock.name.toUpperCase().includes(queryUpper)
      )
      .map(stock => ({
        symbol: stock.symbol + suffix,
        name: stock.name,
        type: 'stock',
        region: market === 'NSE' ? 'India (NSE)' : 'India (BSE)',
        currency: 'INR'
      }))
  }

  // Search from known symbols across all groups
  const searchFromKnownSymbols = (query) => {
    const queryUpper = query.toUpperCase()
    const allSymbols = []
    
    // Basic symbol matches
    const knownSymbols = [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', region: 'United States', currency: 'USD' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', region: 'United States', currency: 'USD' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', region: 'United States', currency: 'USD' },
      { symbol: 'TSLA', name: 'Tesla, Inc.', type: 'stock', region: 'United States', currency: 'USD' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock', region: 'United States', currency: 'USD' },
      { symbol: 'META', name: 'Meta Platforms, Inc.', type: 'stock', region: 'United States', currency: 'USD' },
      { symbol: 'AMZN', name: 'Amazon.com, Inc.', type: 'stock', region: 'United States', currency: 'USD' },
      { symbol: 'NFLX', name: 'Netflix, Inc.', type: 'stock', region: 'United States', currency: 'USD' },
      { symbol: 'BTC-USD', name: 'Bitcoin', type: 'crypto', region: 'Crypto', currency: 'USD' },
      { symbol: 'ETH-USD', name: 'Ethereum', type: 'crypto', region: 'Crypto', currency: 'USD' },
      { symbol: 'BTC-INR', name: 'Bitcoin', type: 'crypto', region: 'Crypto', currency: 'INR' },
      { symbol: 'ETH-INR', name: 'Ethereum', type: 'crypto', region: 'Crypto', currency: 'INR' },
      { symbol: 'DOGE-INR', name: 'Dogecoin', type: 'crypto', region: 'Crypto', currency: 'INR' },
      { symbol: 'ADA-INR', name: 'Cardano', type: 'crypto', region: 'Crypto', currency: 'INR' },
      { symbol: 'SOL-INR', name: 'Solana', type: 'crypto', region: 'Crypto', currency: 'INR' }
    ]
    
    knownSymbols.forEach(symbol => {
      const cleanSymbol = symbol.symbol.replace(/\.(NS|BO|-USD|\.L)$/, '')
      if (cleanSymbol.includes(queryUpper) || symbol.symbol.includes(queryUpper) || symbol.name.toUpperCase().includes(queryUpper)) {
        allSymbols.push(symbol)
      }
    })
    
    // Remove duplicates
    return allSymbols.filter((item, index, self) => 
      index === self.findIndex(i => i.symbol === item.symbol)
    )
  }

  // Comprehensive local stock database for fallback
  const getLocalStockDatabase = (query) => {
    const queryUpper = query.toUpperCase()
    const results = []
    
    // Major US stocks database (200+ stocks)
    const usStocks = [
      // Technology
      { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
      { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', sector: 'Technology' },
      { symbol: 'GOOG', name: 'Alphabet Inc. Class C', sector: 'Technology' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'E-commerce' },
      { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Electric Vehicles' },
      { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Social Media' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Semiconductors' },
      { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Streaming' },
      { symbol: 'ORCL', name: 'Oracle Corporation', sector: 'Software' },
      { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Cloud Software' },
      { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Software' },
      { symbol: 'NOW', name: 'ServiceNow Inc.', sector: 'Cloud Software' },
      { symbol: 'INTU', name: 'Intuit Inc.', sector: 'Financial Software' },
      { symbol: 'IBM', name: 'International Business Machines', sector: 'Enterprise Software' },
      { symbol: 'SNOW', name: 'Snowflake Inc.', sector: 'Data Cloud' },
      { symbol: 'PLTR', name: 'Palantir Technologies Inc.', sector: 'Data Analytics' },
      { symbol: 'ZM', name: 'Zoom Video Communications', sector: 'Communication Software' },
      { symbol: 'TEAM', name: 'Atlassian Corporation', sector: 'Collaboration Software' },
      { symbol: 'DDOG', name: 'Datadog Inc.', sector: 'Monitoring Software' },
      
      // Semiconductors
      { symbol: 'INTC', name: 'Intel Corporation', sector: 'Semiconductors' },
      { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Semiconductors' },
      { symbol: 'QCOM', name: 'QUALCOMM Incorporated', sector: 'Semiconductors' },
      { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Semiconductors' },
      { symbol: 'TXN', name: 'Texas Instruments', sector: 'Semiconductors' },
      { symbol: 'ADI', name: 'Analog Devices Inc.', sector: 'Semiconductors' },
      { symbol: 'MRVL', name: 'Marvell Technology', sector: 'Semiconductors' },
      { symbol: 'MU', name: 'Micron Technology', sector: 'Memory' },
      { symbol: 'LRCX', name: 'Lam Research Corporation', sector: 'Semiconductor Equipment' },
      { symbol: 'AMAT', name: 'Applied Materials', sector: 'Semiconductor Equipment' },
      
      // Financial Services
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Banking' },
      { symbol: 'BAC', name: 'Bank of America Corp', sector: 'Banking' },
      { symbol: 'WFC', name: 'Wells Fargo & Company', sector: 'Banking' },
      { symbol: 'GS', name: 'Goldman Sachs Group', sector: 'Investment Banking' },
      { symbol: 'MS', name: 'Morgan Stanley', sector: 'Investment Banking' },
      { symbol: 'C', name: 'Citigroup Inc.', sector: 'Banking' },
      { symbol: 'AXP', name: 'American Express Company', sector: 'Financial Services' },
      { symbol: 'V', name: 'Visa Inc.', sector: 'Financial Technology' },
      { symbol: 'MA', name: 'Mastercard Incorporated', sector: 'Financial Technology' },
      { symbol: 'PYPL', name: 'PayPal Holdings Inc.', sector: 'Fintech' },
      { symbol: 'SQ', name: 'Block Inc.', sector: 'Fintech' },
      { symbol: 'BRK-A', name: 'Berkshire Hathaway Class A', sector: 'Conglomerate' },
      { symbol: 'BRK-B', name: 'Berkshire Hathaway Class B', sector: 'Conglomerate' },
      
      // Healthcare
      { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
      { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Pharmaceuticals' },
      { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare' },
      { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Pharmaceuticals' },
      { symbol: 'TMO', name: 'Thermo Fisher Scientific', sector: 'Life Sciences' },
      { symbol: 'ABT', name: 'Abbott Laboratories', sector: 'Healthcare' },
      { symbol: 'LLY', name: 'Eli Lilly and Company', sector: 'Pharmaceuticals' },
      { symbol: 'BMY', name: 'Bristol-Myers Squibb', sector: 'Pharmaceuticals' },
      { symbol: 'MDT', name: 'Medtronic plc', sector: 'Medical Devices' },
      { symbol: 'AMGN', name: 'Amgen Inc.', sector: 'Biotechnology' },
      { symbol: 'GILD', name: 'Gilead Sciences', sector: 'Biotechnology' },
      { symbol: 'BIIB', name: 'Biogen Inc.', sector: 'Biotechnology' },
      { symbol: 'REGN', name: 'Regeneron Pharmaceuticals', sector: 'Biotechnology' },
      { symbol: 'VRTX', name: 'Vertex Pharmaceuticals', sector: 'Biotechnology' },
      { symbol: 'MRNA', name: 'Moderna Inc.', sector: 'Biotechnology' },
      { symbol: 'BNTX', name: 'BioNTech SE', sector: 'Biotechnology' },
      
      // Consumer & Retail
      { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Retail' },
      { symbol: 'HD', name: 'Home Depot Inc.', sector: 'Home Improvement' },
      { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer Goods' },
      { symbol: 'KO', name: 'Coca-Cola Company', sector: 'Beverages' },
      { symbol: 'PEP', name: 'PepsiCo Inc.', sector: 'Beverages' },
      { symbol: 'COST', name: 'Costco Wholesale Corp', sector: 'Retail' },
      { symbol: 'NKE', name: 'NIKE Inc.', sector: 'Apparel' },
      { symbol: 'MCD', name: 'McDonald\'s Corporation', sector: 'Restaurants' },
      { symbol: 'SBUX', name: 'Starbucks Corporation', sector: 'Restaurants' },
      { symbol: 'TGT', name: 'Target Corporation', sector: 'Retail' },
      
      // Industrial
      { symbol: 'BA', name: 'Boeing Company', sector: 'Aerospace' },
      { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Heavy Machinery' },
      { symbol: 'MMM', name: '3M Company', sector: 'Industrial Conglomerate' },
      { symbol: 'HON', name: 'Honeywell International', sector: 'Industrial Technology' },
      { symbol: 'GE', name: 'General Electric', sector: 'Industrial Conglomerate' },
      { symbol: 'LMT', name: 'Lockheed Martin Corp', sector: 'Defense' },
      { symbol: 'RTX', name: 'Raytheon Technologies', sector: 'Defense' },
      { symbol: 'UPS', name: 'United Parcel Service', sector: 'Logistics' },
      { symbol: 'FDX', name: 'FedEx Corporation', sector: 'Logistics' },
      { symbol: 'DE', name: 'Deere & Company', sector: 'Agricultural Equipment' },
      
      // Energy
      { symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Oil & Gas' },
      { symbol: 'CVX', name: 'Chevron Corporation', sector: 'Oil & Gas' },
      { symbol: 'COP', name: 'ConocoPhillips', sector: 'Oil & Gas' },
      { symbol: 'SLB', name: 'Schlumberger Limited', sector: 'Oilfield Services' },
      { symbol: 'NEE', name: 'NextEra Energy Inc.', sector: 'Utilities' },
      { symbol: 'DUK', name: 'Duke Energy Corporation', sector: 'Utilities' },
      
      // Electric Vehicles & Clean Energy
      { symbol: 'NIO', name: 'NIO Inc.', sector: 'Electric Vehicles' },
      { symbol: 'RIVN', name: 'Rivian Automotive', sector: 'Electric Vehicles' },
      { symbol: 'LCID', name: 'Lucid Group Inc.', sector: 'Electric Vehicles' },
      { symbol: 'F', name: 'Ford Motor Company', sector: 'Automotive' },
      { symbol: 'GM', name: 'General Motors Company', sector: 'Automotive' },
      { symbol: 'ENPH', name: 'Enphase Energy Inc.', sector: 'Solar Energy' },
      
      // E-commerce & Digital
      { symbol: 'BABA', name: 'Alibaba Group Holding', sector: 'E-commerce' },
      { symbol: 'SHOP', name: 'Shopify Inc.', sector: 'E-commerce Platform' },
      { symbol: 'EBAY', name: 'eBay Inc.', sector: 'E-commerce' },
      { symbol: 'ETSY', name: 'Etsy Inc.', sector: 'E-commerce' },
      { symbol: 'PINS', name: 'Pinterest Inc.', sector: 'Social Media' },
      { symbol: 'SNAP', name: 'Snap Inc.', sector: 'Social Media' },
      { symbol: 'UBER', name: 'Uber Technologies', sector: 'Ride Sharing' },
      { symbol: 'LYFT', name: 'Lyft Inc.', sector: 'Ride Sharing' },
      { symbol: 'DASH', name: 'DoorDash Inc.', sector: 'Food Delivery' },
      
      // Media & Entertainment
      { symbol: 'DIS', name: 'Walt Disney Company', sector: 'Entertainment' },
      { symbol: 'CMCSA', name: 'Comcast Corporation', sector: 'Media' },
      { symbol: 'VZ', name: 'Verizon Communications', sector: 'Telecommunications' },
      { symbol: 'T', name: 'AT&T Inc.', sector: 'Telecommunications' },
      { symbol: 'TMUS', name: 'T-Mobile US Inc.', sector: 'Telecommunications' },
      { symbol: 'ROKU', name: 'Roku Inc.', sector: 'Streaming' },
      { symbol: 'SPOT', name: 'Spotify Technology', sector: 'Music Streaming' }
    ]

    // Indian stocks
    const indianStocks = [
      { symbol: 'RELIANCE.NS', name: 'Reliance Industries Limited', sector: 'Energy' },
      { symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'IT' },
      { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', sector: 'Banking' },
      { symbol: 'INFY.NS', name: 'Infosys Limited', sector: 'IT' },
      { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever', sector: 'FMCG' },
      { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Limited', sector: 'Banking' },
      { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking' },
      { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Limited', sector: 'Telecom' },
      { symbol: 'ITC.NS', name: 'ITC Limited', sector: 'FMCG' },
      { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', sector: 'Banking' },
      { symbol: 'LT.NS', name: 'Larsen & Toubro', sector: 'Construction' },
      { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Limited', sector: 'Paints' },
      { symbol: 'HCLTECH.NS', name: 'HCL Technologies', sector: 'IT' },
      { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India', sector: 'Automotive' },
      { symbol: 'WIPRO.NS', name: 'Wipro Limited', sector: 'IT' },
      { symbol: 'AXISBANK.NS', name: 'Axis Bank Limited', sector: 'Banking' },
      { symbol: 'TITAN.NS', name: 'Titan Company Limited', sector: 'Jewellery' },
      { symbol: 'NESTLEIND.NS', name: 'Nestle India Limited', sector: 'FMCG' },
      { symbol: 'TECHM.NS', name: 'Tech Mahindra Limited', sector: 'IT' },
      { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical', sector: 'Pharmaceuticals' }
    ]

    // Cryptocurrencies (INR pairs for Indian users)
    const cryptos = [
      { symbol: 'BTC-INR', name: 'Bitcoin', sector: 'Cryptocurrency' },
      { symbol: 'ETH-INR', name: 'Ethereum', sector: 'Cryptocurrency' },
      { symbol: 'BNB-INR', name: 'BNB', sector: 'Cryptocurrency' },
      { symbol: 'SOL-INR', name: 'Solana', sector: 'Cryptocurrency' },
      { symbol: 'XRP-INR', name: 'XRP', sector: 'Cryptocurrency' },
      { symbol: 'DOGE-INR', name: 'Dogecoin', sector: 'Cryptocurrency' },
      { symbol: 'ADA-INR', name: 'Cardano', sector: 'Cryptocurrency' },
      { symbol: 'AVAX-INR', name: 'Avalanche', sector: 'Cryptocurrency' },
      { symbol: 'SHIB-INR', name: 'Shiba Inu', sector: 'Cryptocurrency' },
      { symbol: 'DOT-INR', name: 'Polkadot', sector: 'Cryptocurrency' },
      { symbol: 'LINK-INR', name: 'Chainlink', sector: 'Cryptocurrency' },
      { symbol: 'TRX-INR', name: 'TRON', sector: 'Cryptocurrency' },
      { symbol: 'MATIC-INR', name: 'Polygon', sector: 'Cryptocurrency' },
      { symbol: 'LTC-INR', name: 'Litecoin', sector: 'Cryptocurrency' },
      { symbol: 'UNI-INR', name: 'Uniswap', sector: 'Cryptocurrency' },
      { symbol: 'BCH-INR', name: 'Bitcoin Cash', sector: 'Cryptocurrency' },
      { symbol: 'ATOM-INR', name: 'Cosmos', sector: 'Cryptocurrency' },
      { symbol: 'FIL-INR', name: 'Filecoin', sector: 'Cryptocurrency' },
      { symbol: 'ICP-INR', name: 'Internet Computer', sector: 'Cryptocurrency' },
      { symbol: 'VET-INR', name: 'VeChain', sector: 'Cryptocurrency' }
    ]

    // Search all stocks
    const allStocks = [
      ...usStocks.map(stock => ({ ...stock, type: 'stock', region: 'United States', currency: 'USD' })),
      ...indianStocks.map(stock => ({ ...stock, type: 'stock', region: 'India', currency: 'INR' })),
      ...cryptos.map(stock => ({ ...stock, type: 'crypto', region: 'Global', currency: 'INR' }))
    ]

    // Filter results
    allStocks.forEach(stock => {
      const symbolClean = stock.symbol.replace(/\.(NS|BO|-USD)$/, '')
      const symbolMatch = symbolClean.includes(queryUpper) || stock.symbol.includes(queryUpper)
      const nameMatch = stock.name.toUpperCase().includes(queryUpper)
      const sectorMatch = stock.sector && stock.sector.toUpperCase().includes(queryUpper)
      
      if (symbolMatch || nameMatch || sectorMatch) {
        results.push(stock)
      }
    })

    return results
  }

  // Search debouncing with real-time updates
  useEffect(() => {
    if (searchQuery.length > 2) {
      const debounceTimer = setTimeout(() => {
        searchInstrumentsRealTime(searchQuery)
      }, 300) // Faster response for real-time feel
      return () => clearTimeout(debounceTimer)
    } else {
      setSearchResults([])
      setLiveResults([])
    }
  }, [searchQuery, selectedMarket])

  // Auto-refresh live data every 10 seconds
  useEffect(() => {
    if (liveResults.length > 0) {
      const refreshInterval = setInterval(() => {
        searchInstrumentsRealTime(searchQuery)
      }, 10000)
      return () => clearInterval(refreshInterval)
    }
  }, [liveResults, searchQuery])

  const handleStockClick = async (stock) => {
    try {
      // Fetch detailed real-time data for the selected stock
      const response = await fetch(`/api/stock-detail?symbol=${stock.symbol}`)
      const result = await response.json()
      
      if (result.success) {
        setSelectedStock({
          ...stock,
          ...result.data
        })
      } else {
        setSelectedStock(stock)
      }
    } catch (error) {
      console.error('Error fetching stock details:', error)
      setSelectedStock(stock)
    }
  }

  const formatCurrency = (value, currency = 'USD') => {
    if (value === null || value === undefined || isNaN(value)) {
      return `${currency === 'USD' ? '$' : currency === 'INR' ? '₹' : currency} --`
    }
    
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(Number(value))
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value))
  }

  const resultsToShow = liveResults.length > 0 ? liveResults : searchResults

  return (
    <div className={styles.searchTab}>
      <div className={styles.card}>
        <h3>🔍 Search Stocks & Markets</h3>
        <p className={styles.cardDescription}>
          {selectedMarket === 'NSE' || selectedMarket === 'BSE' 
            ? `Search for Indian stocks on ${selectedMarket}. Just enter the symbol (e.g., NCC, INFY) - market suffix will be added automatically.`
            : selectedMarket === 'CRYPTO'
            ? "Search for cryptocurrencies like Bitcoin, Ethereum, Dogecoin and more. Prices shown in INR (₹) for Indian users."
            : "Search for stocks, cryptocurrencies, commodities, or forex pairs and add them to your watchlist"}
        </p>
        
        <div className={styles.searchContainer}>
          <div className={styles.searchRow}>
            <select 
              value={selectedMarket} 
              onChange={(e) => setSelectedMarket(e.target.value)}
              className={styles.marketSelect}
            >
              {markets.map((market) => (
                <option key={market.value} value={market.value}>{market.label}</option>
              ))}
            </select>
            
            <input
              type="text"
              placeholder={selectedMarket === 'NSE' || selectedMarket === 'BSE' 
                ? "Enter symbol (e.g., NCC, INFY, TCS...)" 
                : selectedMarket === 'CRYPTO'
                ? "Enter crypto symbol (e.g., BTC, ETH, DOGE...)"
                : "Enter symbol (e.g., AAPL, BTC, TSLA...)"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            
            <button 
              className={styles.searchButton}
              disabled={searchQuery.length < 2}
            >
              🔍 Search
            </button>
          </div>
        </div>

        {resultsToShow.length > 0 && (
          <div className={styles.searchResults}>
            <h4 className={styles.resultsTitle}>
              Search Results: 
              {isSearching && <span className={styles.loadingDot}>●</span>}
              {liveResults.length > 0 && <span className={styles.liveIndicator}>🟢 LIVE</span>}
            </h4>
            <div className={styles.searchResultsList}>
              {resultsToShow.map((result, index) => (
                <div 
                  key={index} 
                  className={styles.searchResultItem}
                  onClick={() => handleStockClick(result)}
                >
                  <div className={styles.resultInfo}>
                    <div className={styles.resultHeader}>
                      <span className={styles.resultSymbol}>{result.symbol}</span>
                      <span className={styles.resultType}>{result.type}</span>
                    </div>
                    <span className={styles.resultName}>{result.name}</span>
                    
                    {result.price && (
                      <div className={styles.priceInfo}>
                        <span className={styles.price}>
                          {formatCurrency(result.price, result.currency)}
                        </span>
                        {result.changePercent !== undefined && result.changePercent !== null && (
                          <span className={`${styles.change} ${result.changePercent >= 0 ? styles.positive : styles.negative}`}>
                            {result.changePercent >= 0 ? '+' : ''}{Number(result.changePercent).toFixed(2)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={styles.resultActions}>
                    <button 
                      className={styles.addToWatchlistBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        addToWatchlist(result.symbol)
                      }}
                      disabled={watchlist.includes(result.symbol)}
                    >
                      {watchlist.includes(result.symbol) ? '✓ Added' : '+ Add to Watchlist'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchQuery.length > 0 && searchResults.length === 0 && searchQuery.length > 2 && (
          <div className={styles.noResults}>
            <p>No results found for "{searchQuery}"</p>
          </div>
        )}
      </div>

      {selectedStock && (
        <StockDetail 
          stock={selectedStock} 
          onClose={() => setSelectedStock(null)}
        />
      )}
    </div>
  )
}
