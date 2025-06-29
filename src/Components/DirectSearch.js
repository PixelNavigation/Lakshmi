'use client'

import { useState, useEffect } from 'react'
import styles from './DirectSearch.module.css'
import StockDetail from './StockDetail'
import { convertToTradingViewSymbol } from './TradingView/TradingViewHelper'

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
        // For crypto, use INR for Indian users only
        if (!enhancedQuery.includes('-INR') && !enhancedQuery.includes('-')) {
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
              currency: quote.currency || 'INR'
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
      } else if (searchResults.length === 0 && selectedMarket === 'ALL') {
        // For "ALL" market, try both NSE and BSE, plus crypto
        const fallbackQueries = [
          { query: query.toUpperCase() + '.NS', market: 'NSE' },
          { query: query.toUpperCase() + '.BO', market: 'BSE' },
          { query: query.toUpperCase() + '-INR', market: 'CRYPTO' }
        ]
        
        for (const fallback of fallbackQueries) {
          if (searchResults.length > 0) break
          try {
            const response = await fetch(`/api/comprehensive-search?query=${encodeURIComponent(fallback.query)}&market=${fallback.market}&limit=10`)
            const result = await response.json()
            if (result.success && result.data && result.data.length > 0) {
              searchResults = result.data
              console.log(`Found ${searchResults.length} results from ${fallback.market} fallback`)
              break
            }
          } catch (error) {
            console.log(`${fallback.market} fallback failed:`, error)
          }
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
    
    // Basic symbol matches - Indian stocks and INR crypto only
    const knownSymbols = [
      // Indian Stocks
      { symbol: 'RELIANCE.NS', name: 'Reliance Industries Limited', type: 'stock', region: 'India', currency: 'INR' },
      { symbol: 'TCS.NS', name: 'Tata Consultancy Services', type: 'stock', region: 'India', currency: 'INR' },
      { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', type: 'stock', region: 'India', currency: 'INR' },
      { symbol: 'INFY.NS', name: 'Infosys Limited', type: 'stock', region: 'India', currency: 'INR' },
      { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Limited', type: 'stock', region: 'India', currency: 'INR' },
      { symbol: 'SBIN.NS', name: 'State Bank of India', type: 'stock', region: 'India', currency: 'INR' },
      { symbol: 'ITC.NS', name: 'ITC Limited', type: 'stock', region: 'India', currency: 'INR' },
      { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Limited', type: 'stock', region: 'India', currency: 'INR' },
      
      // Cryptocurrencies in INR
      { symbol: 'BTC-INR', name: 'Bitcoin', type: 'crypto', region: 'Crypto', currency: 'INR' },
      { symbol: 'ETH-INR', name: 'Ethereum', type: 'crypto', region: 'Crypto', currency: 'INR' },
      { symbol: 'DOGE-INR', name: 'Dogecoin', type: 'crypto', region: 'Crypto', currency: 'INR' },
      { symbol: 'ADA-INR', name: 'Cardano', type: 'crypto', region: 'Crypto', currency: 'INR' },
      { symbol: 'SOL-INR', name: 'Solana', type: 'crypto', region: 'Crypto', currency: 'INR' },
      { symbol: 'XRP-INR', name: 'XRP', type: 'crypto', region: 'Crypto', currency: 'INR' },
      { symbol: 'BNB-INR', name: 'BNB', type: 'crypto', region: 'Crypto', currency: 'INR' }
    ]
    
    knownSymbols.forEach(symbol => {
      const cleanSymbol = symbol.symbol.replace(/\.(NS|BO|-INR|\.L)$/, '')
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
    
    // Indian stocks database (expanded)
    const indianStocks = [
      // NSE Stocks
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
      { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical', sector: 'Pharmaceuticals' },
      { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement', sector: 'Cement' },
      { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', sector: 'Financial Services' },
      { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv', sector: 'Financial Services' },
      { symbol: 'ADANIPORTS.NS', name: 'Adani Ports', sector: 'Infrastructure' },
      { symbol: 'POWERGRID.NS', name: 'Power Grid Corporation', sector: 'Utilities' },
      { symbol: 'NTPC.NS', name: 'NTPC Limited', sector: 'Power' },
      { symbol: 'ONGC.NS', name: 'Oil & Natural Gas Corporation', sector: 'Oil & Gas' },
      { symbol: 'COALINDIA.NS', name: 'Coal India Limited', sector: 'Mining' },
      { symbol: 'DRREDDY.NS', name: 'Dr. Reddy\'s Laboratories', sector: 'Pharmaceuticals' },
      { symbol: 'CIPLA.NS', name: 'Cipla Limited', sector: 'Pharmaceuticals' },
      { symbol: 'DIVISLAB.NS', name: 'Divi\'s Laboratories', sector: 'Pharmaceuticals' },
      { symbol: 'BRITANNIA.NS', name: 'Britannia Industries', sector: 'FMCG' },
      { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp', sector: 'Automotive' },
      { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto', sector: 'Automotive' },
      { symbol: 'M&M.NS', name: 'Mahindra & Mahindra', sector: 'Automotive' },
      { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', sector: 'Automotive' },
      { symbol: 'TATASTEEL.NS', name: 'Tata Steel', sector: 'Steel' },
      { symbol: 'JSWSTEEL.NS', name: 'JSW Steel', sector: 'Steel' },
      { symbol: 'HINDALCO.NS', name: 'Hindalco Industries', sector: 'Metals' },
      { symbol: 'VEDL.NS', name: 'Vedanta Limited', sector: 'Metals' },
      { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank', sector: 'Banking' },
      { symbol: 'BANDHANBNK.NS', name: 'Bandhan Bank', sector: 'Banking' },
      { symbol: 'FEDERALBNK.NS', name: 'Federal Bank', sector: 'Banking' },
      { symbol: 'YESBANK.NS', name: 'Yes Bank', sector: 'Banking' },
      { symbol: 'PNB.NS', name: 'Punjab National Bank', sector: 'Banking' },
      { symbol: 'BANKBARODA.NS', name: 'Bank of Baroda', sector: 'Banking' },
      
      // BSE Stocks (alternative symbols)
      { symbol: 'RELIANCE.BO', name: 'Reliance Industries Limited', sector: 'Energy' },
      { symbol: 'TCS.BO', name: 'Tata Consultancy Services', sector: 'IT' },
      { symbol: 'HDFCBANK.BO', name: 'HDFC Bank Limited', sector: 'Banking' },
      { symbol: 'INFY.BO', name: 'Infosys Limited', sector: 'IT' },
      { symbol: 'ITC.BO', name: 'ITC Limited', sector: 'FMCG' }
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
      ...indianStocks.map(stock => ({ ...stock, type: 'stock', region: 'India', currency: 'INR' })),
      ...cryptos.map(stock => ({ ...stock, type: 'crypto', region: 'Global', currency: 'INR' }))
    ]

    // Filter results
    allStocks.forEach(stock => {
      const symbolClean = stock.symbol.replace(/\.(NS|BO|-INR)$/, '')
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

  const formatCurrency = (value, currency = 'INR') => {
    if (value === null || value === undefined || isNaN(value)) {
      return `${currency === 'INR' ? '₹' : currency} --`
    }
    
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(Number(value))
    }
    
    return new Intl.NumberFormat('en-IN', {
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
            : "Search for Indian stocks (NSE/BSE) and cryptocurrencies. Enter stock symbols (e.g., RELIANCE, TCS) or crypto names (e.g., BTC, ETH) to find and add them to your watchlist."}
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
                : "Enter symbol (e.g., RELIANCE, BTC, TCS...)"}
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
                      disabled={watchlist.includes(convertToTradingViewSymbol(result.symbol))}
                    >
                      {watchlist.includes(convertToTradingViewSymbol(result.symbol)) ? '✓ Added' : '+ Add to Watchlist'}
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
