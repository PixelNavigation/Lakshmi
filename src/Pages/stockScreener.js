'use client'

import { useState, useEffect } from 'react'
import styles from './stockScreener.module.css'

export default function StockScreener() {
  const [stocks, setStocks] = useState([])
  const [filteredStocks, setFilteredStocks] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedMarket, setSelectedMarket] = useState('NASDAQ')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [dataQuality, setDataQuality] = useState({ real: 0, mock: 0 })
  const [filters, setFilters] = useState({
    marketCap: 'all',
    sector: 'all',
    peRatio: [0, 50],
    dividendYield: [0, 10],
    priceRange: [0, 1000]
  })

  // Market configurations
  const markets = {
    'NASDAQ': {
      name: 'NASDAQ',
      symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'ADBE', 'CRM', 'ORCL', 'AVGO'],
      currency: 'USD',
      description: 'US Technology Stocks'
    },
    'SP500': {
      name: 'S&P 500',
      symbols: ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'TSLA', 'BRK-B', 'UNH', 'JNJ', 'JPM', 'V', 'PG', 'HD'],
      currency: 'USD',
      description: 'US Large Cap Stocks'
    },
    'NSE': {
      name: 'NSE (India)',
      symbols: ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HINDUNILVR.NS', 'ICICIBANK.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS', 'ITC.NS', 'LT.NS', 'HDFCBANK.NS', 'WIPRO.NS'],
      currency: 'INR',
      description: 'National Stock Exchange of India'
    },
    'BSE': {
      name: 'BSE (India)', 
      symbols: ['RELIANCE.BO', 'TCS.BO', 'INFY.BO', 'HINDUNILVR.BO', 'ICICIBANK.BO', 'SBIN.BO', 'BHARTIARTL.BO', 'KOTAKBANK.BO', 'ITC.BO', 'LT.BO', 'HDFCBANK.BO', 'WIPRO.BO'],
      currency: 'INR',
      description: 'Bombay Stock Exchange'
    },
    'CRYPTO': {
      name: 'Cryptocurrency',
      symbols: ['BTC-USD', 'ETH-USD', 'BNB-USD', 'ADA-USD', 'SOL-USD', 'XRP-USD', 'DOT-USD', 'DOGE-USD', 'AVAX-USD', 'MATIC-USD', 'LINK-USD', 'UNI-USD'],
      currency: 'USD',
      description: 'Major Cryptocurrencies'
    },
    'FTSE': {
      name: 'FTSE 100 (UK)',
      symbols: ['AZN.L', 'SHEL.L', 'LSEG.L', 'ULVR.L', 'RIO.L', 'BP.L', 'VOD.L', 'BT-A.L', 'GLEN.L', 'BARC.L'],
      currency: 'GBP',
      description: 'UK Large Cap Stocks'
    }
  }

  // Fetch real-time stock data
  const fetchStockData = async (symbols) => {
    setLoading(true)
    try {
      const symbolsString = symbols.join(',')
      const response = await fetch(`/api/stocks?symbols=${symbolsString}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        setStocks(result.data)
        setFilteredStocks(result.data)
        setLastUpdated(new Date())
        
        // Calculate data quality
        const realData = result.data.filter(stock => stock.isRealData).length
        const mockData = result.data.filter(stock => stock.isMockData).length
        setDataQuality({ real: realData, mock: mockData })
      } else {
        throw new Error(result.error || 'Failed to fetch data')
      }
    } catch (error) {
      console.error('Error fetching stock data:', error)
      
      // Fallback to mock data
      const mockData = symbols.map(symbol => {
        const basePrice = Math.random() * 500 + 50
        const changePercent = (Math.random() - 0.5) * 10
        const change = basePrice * (changePercent / 100)
        
        return {
          symbol: symbol,
          name: symbol.replace(/\.(NS|BO|-USD)$/, '') + ' Corp.',
          price: Number(basePrice.toFixed(2)),
          change: Number(change.toFixed(2)),
          changePercent: Number(changePercent.toFixed(2)),
          volume: Math.floor(Math.random() * 10000000) + 1000000,
          marketCap: Math.floor(Math.random() * 1000000000000) + 1000000000,
          peRatio: Number((Math.random() * 40 + 10).toFixed(1)),
          dividendYield: Number((Math.random() * 6 + 1).toFixed(2)),
          sector: ['Technology', 'Healthcare', 'Financial', 'Energy', 'Consumer'][Math.floor(Math.random() * 5)],
          currency: markets[selectedMarket].currency,
          timestamp: Date.now(),
          dayHigh: Number((basePrice * 1.05).toFixed(2)),
          dayLow: Number((basePrice * 0.95).toFixed(2)),
          isMockData: true
        }
      })
      setStocks(mockData)
      setFilteredStocks(mockData)
      setLastUpdated(new Date())
      setDataQuality({ real: 0, mock: mockData.length })
    }
    setLoading(false)
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
    
    // Dividend Yield filter
    filtered = filtered.filter(stock => 
      stock.dividendYield >= filters.dividendYield[0] && stock.dividendYield <= filters.dividendYield[1]
    )
    
    // Price range filter
    filtered = filtered.filter(stock => 
      stock.price >= filters.priceRange[0] && stock.price <= filters.priceRange[1]
    )
    
    setFilteredStocks(filtered)
  }

  // Format currency based on market
  const formatCurrency = (value, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  // Format market cap
  const formatMarketCap = (value) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
    return `$${value.toFixed(0)}`
  }

  // Load data when market changes
  useEffect(() => {
    if (markets[selectedMarket]) {
      fetchStockData(markets[selectedMarket].symbols)
    }
  }, [selectedMarket])

  // Apply filters when they change
  useEffect(() => {
    applyFilters()
  }, [filters, stocks])
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>🔍 Stock Screener</h1>
        <p className={styles.pageSubtitle}>Find investment opportunities with real-time data from global markets</p>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.mainContent}>
          {/* Market Selection */}
          <div className={styles.card}>
            <h3>Select Market Exchange</h3>
            <div className={styles.marketSelector}>
              {Object.keys(markets).map(marketKey => (
                <button
                  key={marketKey}
                  onClick={() => setSelectedMarket(marketKey)}
                  className={`${styles.marketButton} ${selectedMarket === marketKey ? styles.activeMarket : ''}`}
                  title={markets[marketKey].description}
                >
                  <div className={styles.marketButtonContent}>
                    <span className={styles.marketName}>{markets[marketKey].name}</span>
                    <span className={styles.marketCurrency}>{markets[marketKey].currency}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className={styles.marketInfo}>
              <div className={styles.marketInfoItem}>
                <span>📊 Selected Exchange:</span>
                <strong>{markets[selectedMarket].name}</strong>
              </div>
              <div className={styles.marketInfoItem}>
                <span>💱 Currency:</span>
                <strong>{markets[selectedMarket].currency}</strong>
              </div>
              <div className={styles.marketInfoItem}>
                <span>📈 Stocks Available:</span>
                <strong>{markets[selectedMarket].symbols.length}</strong>
              </div>
              <div className={styles.marketInfoItem}>
                <span>📋 Results Loaded:</span>
                <strong>{stocks.length}</strong>
              </div>
              {loading && (
                <div className={styles.marketInfoItem}>
                  <span className={styles.loadingIndicator}>🔄 Fetching real-time data...</span>
                </div>
              )}
            </div>
            <div className={styles.marketDescription}>
              <p><strong>Market Description:</strong> {markets[selectedMarket].description}</p>
            </div>
          </div>

          {/* Screening Criteria */}
          <div className={styles.card}>
            <h3>Screening Criteria</h3>
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
                <label>Dividend Yield: {filters.dividendYield[0]}% - {filters.dividendYield[1]}%</label>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  value={filters.dividendYield[1]}
                  className={styles.rangeInput}
                  onChange={(e) => setFilters({...filters, dividendYield: [0, parseInt(e.target.value)]})}
                />
              </div>
              
              <div className={styles.filterGroup}>
                <label>Price Range: {formatCurrency(filters.priceRange[0], markets[selectedMarket].currency)} - {formatCurrency(filters.priceRange[1], markets[selectedMarket].currency)}</label>
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
            
            <div className={styles.filterActions}>
              <button 
                className={styles.primaryButton}
                onClick={() => fetchStockData(markets[selectedMarket].symbols)}
                disabled={loading}
              >
                {loading ? '🔄 Loading...' : '🔄 Refresh Data'}
              </button>
              <button 
                className={styles.secondaryButton}
                onClick={() => setFilters({
                  marketCap: 'all',
                  sector: 'all',
                  peRatio: [0, 50],
                  dividendYield: [0, 10],
                  priceRange: [0, 1000]
                })}
              >
                🗑️ Clear Filters
              </button>
            </div>
          </div>

          {/* Screening Results */}
          <div className={styles.card}>
            <h3>Screening Results ({filteredStocks.length} stocks found)</h3>
            {filteredStocks.length > 0 ? (
              <div className={styles.resultsTable}>
                <div className={styles.tableHeader}>
                  <span>Symbol</span>
                  <span>Company</span>
                  <span>Price</span>
                  <span>Change</span>
                  <span>Volume</span>
                  <span>Market Cap</span>
                  <span>P/E</span>
                  <span>Div Yield</span>
                </div>
                
                {filteredStocks.map((stock, index) => (
                  <div key={stock.symbol} className={styles.tableRow}>
                    <span className={styles.symbol}>
                      {stock.symbol}
                      {stock.isMockData && <span className={styles.mockBadge}>DEMO</span>}
                    </span>
                    <span className={styles.companyName}>{stock.name}</span>
                    <span className={styles.price}>
                      {formatCurrency(stock.price, stock.currency)}
                    </span>
                    <span className={stock.changePercent >= 0 ? styles.positive : styles.negative}>
                      {formatCurrency(stock.change, stock.currency)} ({stock.changePercent.toFixed(2)}%)
                    </span>
                    <span>{stock.volume.toLocaleString()}</span>
                    <span>{formatMarketCap(stock.marketCap)}</span>
                    <span>{stock.peRatio.toFixed(1)}</span>
                    <span>{stock.dividendYield.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noResults}>
                <p>No stocks match your current criteria. Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.card}>
            <h3>Market Summary</h3>
            <div className={styles.marketStats}>
              <div className={styles.stat}>
                <span>Total Stocks</span>
                <span>{stocks.length}</span>
              </div>
              <div className={styles.stat}>
                <span>Filtered Results</span>
                <span>{filteredStocks.length}</span>
              </div>
              <div className={styles.stat}>
                <span>Gainers</span>
                <span className={styles.positive}>
                  {filteredStocks.filter(s => s.changePercent > 0).length}
                </span>
              </div>
              <div className={styles.stat}>
                <span>Losers</span>
                <span className={styles.negative}>
                  {filteredStocks.filter(s => s.changePercent < 0).length}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Top Performers</h3>
            <div className={styles.topPerformers}>
              {filteredStocks
                .sort((a, b) => b.changePercent - a.changePercent)
                .slice(0, 5)
                .map(stock => (
                  <div key={stock.symbol} className={styles.performerItem}>
                    <div>
                      <div className={styles.performerSymbol}>{stock.symbol}</div>
                      <div className={styles.performerPrice}>
                        {formatCurrency(stock.price, stock.currency)}
                      </div>
                    </div>
                    <div className={stock.changePercent >= 0 ? styles.positive : styles.negative}>
                      {stock.changePercent.toFixed(2)}%
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          <div className={styles.card}>
            <h3>Saved Screens</h3>
            <div className={styles.savedScreens}>
              <button className={styles.savedScreen}>📈 High Growth Tech</button>
              <button className={styles.savedScreen}>💰 High Dividend Yield</button>
              <button className={styles.savedScreen}>📊 Value Opportunities</button>
              <button className={styles.savedScreen}>🚀 Small Cap Growth</button>
              <button className={styles.savedScreen}>🏦 Banking Sector</button>
            </div>
            <button className={styles.saveCurrentScreen}>💾 Save Current Screen</button>
          </div>

          <div className={styles.card}>
            <h3>Data Sources & Quality</h3>
            <div className={styles.dataSources}>
              <div className={styles.source}>
                <span>📊 Yahoo Finance API</span>
                <span className={styles.status}>✅ Active</span>
              </div>
              <div className={styles.source}>
                <span>🌐 Real-time Data</span>
                <span className={styles.status}>{dataQuality.real > 0 ? '✅ Live' : '⚠️ Limited'}</span>
              </div>
              <div className={styles.source}>
                <span>📈 Data Quality</span>
                <span className={styles.dataQuality}>
                  {dataQuality.real}/{dataQuality.real + dataQuality.mock} Real
                </span>
              </div>
              <div className={styles.source}>
                <span>🔄 Last Updated</span>
                <span className={styles.timestamp}>
                  {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Not loaded'}
                </span>
              </div>
            </div>
            
            {dataQuality.mock > 0 && (
              <div className={styles.dataWarning}>
                <p>⚠️ Some data is simulated due to API limitations. In production, all data would be real-time.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
