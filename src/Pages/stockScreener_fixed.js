'use client'

import { useState, useEffect } from 'react'
import styles from './stockScreener.module.css'
import StockGroups from '../Components/StockGroups'

export default function StockScreener() {
  const [stocks, setStocks] = useState([])
  const [filteredStocks, setFilteredStocks] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedMarket, setSelectedMarket] = useState('NASDAQ')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [dataQuality, setDataQuality] = useState({ real: 0, mock: 0 })
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [watchlist, setWatchlist] = useState([])
  const [filters, setFilters] = useState({
    marketCap: 'all',
    sector: 'all',
    peRatio: [0, 50],
    priceRange: [0, 1000]
  })

  // Market configurations
  const markets = {
    'NASDAQ': { name: 'NASDAQ', currency: 'USD', description: 'US Technology Stocks' },
    'SP500': { name: 'S&P 500', currency: 'USD', description: 'US Large Cap Stocks' },
    'NSE': { name: 'NSE (India)', currency: 'INR', description: 'National Stock Exchange of India' },
    'BSE': { name: 'BSE (India)', currency: 'INR', description: 'Bombay Stock Exchange' },
    'CRYPTO': { name: 'Cryptocurrency', currency: 'USD', description: 'Major Cryptocurrencies' },
    'FTSE': { name: 'FTSE 100 (UK)', currency: 'GBP', description: 'UK Large Cap Stocks' }
  }

  // Load watchlist from localStorage
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('lakshmi_watchlist')
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist))
    }
  }, [])

  // Add to watchlist
  const addToWatchlist = (symbol) => {
    if (!watchlist.includes(symbol)) {
      const newWatchlist = [...watchlist, symbol]
      setWatchlist(newWatchlist)
      localStorage.setItem('lakshmi_watchlist', JSON.stringify(newWatchlist))
    }
  }

  // Load stock group
  const loadStockGroup = async (group) => {
    setSelectedGroup(group)
    setLoading(true)
    
    try {
      const response = await fetch(`/api/stocks?symbols=${group.symbols.join(',')}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setStocks(result.data)
        setFilteredStocks(result.data)
        setLastUpdated(new Date())
        
        const realData = result.data.filter(stock => stock.isRealData).length
        const mockData = result.data.filter(stock => stock.isMockData).length
        setDataQuality({ real: realData, mock: mockData })
      } else {
        throw new Error('Failed to load group data')
      }
    } catch (error) {
      console.error('Error loading group:', error)
      // Fallback to mock data
      const mockData = group.symbols.map(symbol => generateMockStock(symbol, group.market))
      setStocks(mockData)
      setFilteredStocks(mockData)
      setLastUpdated(new Date())
      setDataQuality({ real: 0, mock: mockData.length })
    }
    
    setLoading(false)
  }

  // Generate mock stock data
  const generateMockStock = (symbol, market) => {
    const basePrice = Math.random() * 500 + 50
    const changePercent = (Math.random() - 0.5) * 10
    const change = basePrice * (changePercent / 100)
    
    return {
      symbol: symbol,
      name: symbol.replace(/\.(NS|BO|-USD|\.L)$/, '') + ' Corp.',
      price: Number(basePrice.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      marketCap: Math.floor(Math.random() * 1000000000000) + 1000000000,
      peRatio: Number((Math.random() * 40 + 10).toFixed(1)),
      dividendYield: Number((Math.random() * 6 + 1).toFixed(2)),
      sector: ['Technology', 'Healthcare', 'Financial', 'Energy', 'Consumer'][Math.floor(Math.random() * 5)],
      currency: markets[market]?.currency || 'USD',
      timestamp: Date.now(),
      dayHigh: Number((basePrice * 1.05).toFixed(2)),
      dayLow: Number((basePrice * 0.95).toFixed(2)),
      isMockData: true
    }
  }

  // Apply filters to stocks
  const applyFilters = () => {
    let filtered = [...stocks]
    
    // Market cap filter
    if (filters.marketCap !== 'all') {
      filtered = filtered.filter(stock => {
        const marketCap = stock.marketCap
        switch (filters.marketCap) {
          case 'large': return marketCap > 10000000000 // > $10B
          case 'mid': return marketCap >= 2000000000 && marketCap <= 10000000000 // $2B - $10B
          case 'small': return marketCap < 2000000000 // < $2B
          default: return true
        }
      })
    }
    
    // Sector filter
    if (filters.sector !== 'all') {
      filtered = filtered.filter(stock => 
        stock.sector.toLowerCase().includes(filters.sector.toLowerCase())
      )
    }
    
    // P/E Ratio filter
    filtered = filtered.filter(stock => 
      stock.peRatio >= filters.peRatio[0] && stock.peRatio <= filters.peRatio[1]
    )
    
    // Price range filter
    filtered = filtered.filter(stock => 
      stock.price >= filters.priceRange[0] && stock.price <= filters.priceRange[1]
    )
    
    setFilteredStocks(filtered)
  }

  // Apply filters when they change
  useEffect(() => {
    applyFilters()
  }, [filters, stocks])

  // Helper functions
  const formatCurrency = (value, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatMarketCap = (value) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
    return `$${value.toFixed(0)}`
  }

  const formatNumber = (value) => {
    if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B'
    if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M'
    if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K'
    return value.toString()
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>🔍 Stock Screener</h1>
        <p className={styles.pageSubtitle}>Find investment opportunities with real-time data from global markets</p>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.mainContent}>
          
          {/* Stock Groups - Direct Search moved to Dashboard */}
          <StockGroups
            markets={markets}
            loading={loading}
            selectedGroup={selectedGroup}
            loadStockGroup={loadStockGroup}
          />

          {/* Results Section - Show when stocks are loaded */}
          {stocks.length > 0 && (
            <div className={styles.card}>
              <div className={styles.resultsHeader}>
                <h3>
                  {selectedGroup ? `${selectedGroup.title} Stocks` : 'Stock Results'} 
                  <span className={styles.resultCount}>({filteredStocks.length} of {stocks.length})</span>
                </h3>
                
                <div className={styles.dataQuality}>
                  <span className={`${styles.dataIndicator} ${dataQuality.real > 0 ? styles.realData : styles.mockData}`}>
                    {dataQuality.real > 0 ? '🟢 Real-time' : '🟡 Mock Data'}
                  </span>
                  {lastUpdated && (
                    <span className={styles.lastUpdated}>
                      Updated: {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Stock Results Table */}
              {loading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.spinner}></div>
                  <p>Loading stock data...</p>
                </div>
              ) : (
                <div className={styles.stockTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Price</th>
                        <th>Change</th>
                        <th>Volume</th>
                        <th>Market Cap</th>
                        <th>P/E</th>
                        <th>Dividend</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStocks.map(stock => (
                        <tr key={stock.symbol}>
                          <td>
                            <div className={styles.stockInfo}>
                              <span className={styles.symbol}>{stock.symbol}</span>
                              <span className={styles.name}>{stock.name}</span>
                              <span className={styles.sector}>{stock.sector}</span>
                            </div>
                          </td>
                          <td className={styles.price}>
                            {formatCurrency(stock.price, stock.currency)}
                          </td>
                          <td className={`${styles.change} ${stock.changePercent >= 0 ? styles.positive : styles.negative}`}>
                            <div>
                              {stock.changePercent >= 0 ? '+' : ''}{formatCurrency(stock.change, stock.currency)}
                            </div>
                            <div className={styles.changePercent}>
                              ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                            </div>
                          </td>
                          <td>{formatNumber(stock.volume)}</td>
                          <td>{formatMarketCap(stock.marketCap)}</td>
                          <td>{stock.peRatio}</td>
                          <td>{stock.dividendYield}%</td>
                          <td>
                            <button 
                              className={styles.addBtn}
                              onClick={() => addToWatchlist(stock.symbol)}
                              disabled={watchlist.includes(stock.symbol)}
                            >
                              {watchlist.includes(stock.symbol) ? '✓' : '+'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.sidebar}>
          {/* Filters Sidebar - Only show when viewing results */}
          {stocks.length > 0 && (
            <div className={styles.card}>
              <h3>Filters</h3>
              <div className={styles.filterGrid}>
                <div className={styles.filterGroup}>
                  <label>Market Cap</label>
                  <select 
                    className={styles.selectInput}
                    value={filters.marketCap}
                    onChange={(e) => setFilters({...filters, marketCap: e.target.value})}
                  >
                    <option value="all">All</option>
                    <option value="large">Large Cap (&gt; $10B)</option>
                    <option value="mid">Mid Cap ($2B - $10B)</option>
                    <option value="small">Small Cap (&lt; $2B)</option>
                  </select>
                </div>
                
                <div className={styles.filterGroup}>
                  <label>Sector</label>
                  <select 
                    className={styles.selectInput}
                    value={filters.sector}
                    onChange={(e) => setFilters({...filters, sector: e.target.value})}
                  >
                    <option value="all">All Sectors</option>
                    <option value="technology">Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="financial">Financial</option>
                    <option value="energy">Energy</option>
                    <option value="consumer">Consumer</option>
                  </select>
                </div>
                
                <div className={styles.filterGroup}>
                  <label>P/E Ratio: {filters.peRatio[0]} - {filters.peRatio[1]}</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="50" 
                    value={filters.peRatio[1]}
                    className={styles.rangeInput}
                    onChange={(e) => setFilters({...filters, peRatio: [0, parseInt(e.target.value)]})}
                  />
                </div>
                
                <div className={styles.filterGroup}>
                  <label>Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="1000" 
                    value={filters.priceRange[1]}
                    className={styles.rangeInput}
                    onChange={(e) => setFilters({...filters, priceRange: [0, parseInt(e.target.value)]})}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Watchlist Summary */}
          <div className={styles.card}>
            <h3>📋 Your Watchlist</h3>
            <p>Total items: {watchlist.length}</p>
            {watchlist.length > 0 && (
              <div className={styles.watchlistPreview}>
                {watchlist.slice(0, 5).map(symbol => (
                  <span key={symbol} className={styles.watchlistItem}>{symbol}</span>
                ))}
                {watchlist.length > 5 && <span>+{watchlist.length - 5} more</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
