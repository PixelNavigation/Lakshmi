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
      
      if (selectedMarket === 'NSE' && !enhancedQuery.includes('.NS')) {
        enhancedQuery = query
        searchType = 'stocks'
      } else if (selectedMarket === 'BSE' && !enhancedQuery.includes('.BO')) {
        enhancedQuery = query
        searchType = 'stocks'
      } else if (selectedMarket === 'CRYPTO') {
        searchType = 'crypto'
      }

      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: enhancedQuery, type: searchType })
      })
      
      const result = await response.json()
      let searchResults = result.success ? result.data : []
      
      if (searchResults.length === 0 && (selectedMarket === 'NSE' || selectedMarket === 'BSE')) {
        searchResults = searchIndianStocks(query, selectedMarket)
      }
      
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
      { symbol: 'ETH-USD', name: 'Ethereum', type: 'crypto', region: 'Crypto', currency: 'USD' }
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
      return `${currency === 'USD' ? '$' : currency} --`
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
          Search for stocks, cryptocurrencies, commodities, or forex pairs and add them to your watchlist
        </p>
        
        <div className={styles.searchContainer}>
          <div className={styles.searchRow}>
            <select 
              value={selectedMarket} 
              onChange={(e) => setSelectedMarket(e.target.value)}
              className={styles.marketSelect}
            >
              {Object.entries(markets).map(([key, market]) => (
                <option key={key} value={key}>{market.name}</option>
              ))}
            </select>
            
            <input
              type="text"
              placeholder="Enter symbol (e.g., AAPL, BTC, TSLA...)"
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
            <button 
              className={styles.addDirectBtn}
              onClick={() => addToWatchlist(searchQuery.toUpperCase())}
            >
              Add "{searchQuery.toUpperCase()}" directly to watchlist
            </button>
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
