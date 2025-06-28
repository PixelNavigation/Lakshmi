'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './stockScreener.module.css'

export default function StockScreener() {
  const [filters, setFilters] = useState({
    marketCap: 'all',
    sector: 'all',
    peRatio: [0, 50],
    dividendYield: [0, 10],
    priceRange: [0, 1000]
  })
  
  const [screenResults, setScreenResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('preset')
  const [savedScreens, setSavedScreens] = useState([
    'High Dividend Yield',
    'Growth Stocks', 
    'Value Opportunities',
    'Tech Leaders',
    'Energy Sector'
  ])

  // Mock stock data - in production this would come from your API
  const mockStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 185.50, change: 2.1, marketCap: 2900000000000, sector: 'Technology', pe: 28.5, dividend: 0.5 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 340.20, change: 1.8, marketCap: 2500000000000, sector: 'Technology', pe: 32.1, dividend: 0.7 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.80, change: -0.5, marketCap: 1800000000000, sector: 'Technology', pe: 24.2, dividend: 0 },
    { symbol: 'JPM', name: 'JPMorgan Chase', price: 158.40, change: 0.8, marketCap: 460000000000, sector: 'Financial', pe: 12.8, dividend: 2.8 },
    { symbol: 'JNJ', name: 'Johnson & Johnson', price: 172.30, change: -0.3, marketCap: 450000000000, sector: 'Healthcare', pe: 15.6, dividend: 2.9 },
    { symbol: 'XOM', name: 'Exxon Mobil', price: 108.20, change: 2.4, marketCap: 440000000000, sector: 'Energy', pe: 14.2, dividend: 5.8 },
    { symbol: 'KO', name: 'Coca-Cola', price: 61.80, change: 0.5, marketCap: 265000000000, sector: 'Consumer', pe: 25.4, dividend: 3.1 },
    { symbol: 'PFE', name: 'Pfizer Inc.', price: 35.90, change: 1.2, marketCap: 200000000000, sector: 'Healthcare', pe: 13.8, dividend: 4.2 }
  ]

  // Filter stocks based on criteria
  const filterStocks = useCallback(() => {
    return mockStocks.filter(stock => {
      // Market cap filter
      if (filters.marketCap !== 'all') {
        if (filters.marketCap === 'large' && stock.marketCap < 10000000000) return false
        if (filters.marketCap === 'mid' && (stock.marketCap < 2000000000 || stock.marketCap > 10000000000)) return false
        if (filters.marketCap === 'small' && stock.marketCap > 2000000000) return false
      }
      
      // Sector filter
      if (filters.sector !== 'all' && stock.sector.toLowerCase() !== filters.sector.toLowerCase()) return false
      
      // P/E Ratio filter
      if (stock.pe < filters.peRatio[0] || stock.pe > filters.peRatio[1]) return false
      
      // Dividend yield filter
      if (stock.dividend < filters.dividendYield[0] || stock.dividend > filters.dividendYield[1]) return false
      
      // Price range filter
      if (stock.price < filters.priceRange[0] || stock.price > filters.priceRange[1]) return false
      
      return true
    })
  }, [filters])

  // Run screening
  const runScreen = async () => {
    setLoading(true)
    // Simulate API call delay
    setTimeout(() => {
      const results = filterStocks()
      setScreenResults(results)
      setLoading(false)
    }, 500)
  }

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }

  // Load a saved screen
  const loadSavedScreen = (screenName) => {
    let newFilters = { ...filters }
    
    switch(screenName) {
      case 'Technology Innovators':
        newFilters = {
          ...filters,
          sector: 'Technology',
          marketCap: 'large',
          peRatio: [15, 50]
        }
        break
      case 'Quality Growth':
        newFilters = {
          ...filters,
          peRatio: [20, 40],
          marketCap: 'large',
          sector: 'all'
        }
        break
      case 'Dividend Champions':
        newFilters = {
          ...filters,
          dividendYield: [3, 10],
          peRatio: [0, 25],
          sector: 'all'
        }
        break
      case 'Value Opportunities':
        newFilters = {
          ...filters,
          peRatio: [0, 15],
          dividendYield: [1, 10],
          marketCap: 'all'
        }
        break
      case 'Near 52W Lows':
        newFilters = {
          ...filters,
          peRatio: [0, 20],
          sector: 'all',
          marketCap: 'all'
        }
        break
      case 'ESG Leaders':
        newFilters = {
          ...filters,
          marketCap: 'large',
          sector: 'all',
          peRatio: [0, 30]
        }
        break
      case 'High Dividend Yield':
        newFilters = {
          ...filters,
          dividendYield: [3, 10],
          sector: 'all'
        }
        break
      case 'Growth Stocks':
        newFilters = {
          ...filters,
          peRatio: [20, 50],
          sector: 'Technology'
        }
        break
      case 'Tech Leaders':
        newFilters = {
          ...filters,
          sector: 'Technology',
          marketCap: 'large'
        }
        break
      case 'Energy Sector':
        newFilters = {
          ...filters,
          sector: 'Energy',
          dividendYield: [3, 10]
        }
        break
    }
    
    setFilters(newFilters)
    setActiveTab('results')
  }

  // Auto-run screen when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      runScreen()
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [filters])

  // Format market cap
  const formatMarketCap = (value) => {
    if (value >= 1000000000000) return `$${(value / 1000000000000).toFixed(1)}T`
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    return `$${value}`
  }

  // Format percentage
  const formatPercentage = (value) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>🔍 Stock Screener</h1>
        <p className={styles.pageSubtitle}>Choose from preset screens or create your own</p>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        <button 
          className={`${styles.tab} ${activeTab === 'preset' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('preset')}
        >
          Preset Screens
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'custom' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          Custom Screen
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'results' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('results')}
        >
          Results ({screenResults.length})
        </button>
      </div>

      {/* Preset Screens Tab */}
      {activeTab === 'preset' && (
        <div className={styles.presetScreensGrid}>
          <div className={styles.strategyCard} onClick={() => loadSavedScreen('Technology Innovators')}>
            <div className={styles.strategyIcon}>💻</div>
            <h3 className={styles.strategyTitle}>Technology Innovators</h3>
            <p className={styles.strategyDescription}>
              Best-in-class tech companies leading Technology & IT innovation globally
            </p>
            <div className={styles.strategyActions}>
              <button className={styles.moreInfoBtn}>More Info</button>
              <button className={styles.loadBtn}>Load</button>
            </div>
          </div>

          <div className={styles.strategyCard} onClick={() => loadSavedScreen('Quality Growth')}>
            <div className={styles.strategyIcon}>📈</div>
            <h3 className={styles.strategyTitle}>Quality Growth</h3>
            <p className={styles.strategyDescription}>
              High-quality companies with consistent earnings growth and strong fundamentals
            </p>
            <div className={styles.strategyActions}>
              <button className={styles.moreInfoBtn}>More Info</button>
              <button className={styles.loadBtn}>Load</button>
            </div>
          </div>

          <div className={styles.strategyCard} onClick={() => loadSavedScreen('Dividend Champions')}>
            <div className={styles.strategyIcon}>💰</div>
            <h3 className={styles.strategyTitle}>Dividend Champions</h3>
            <p className={styles.strategyDescription}>
              Companies with consistent dividend payments and strong dividend yield history
            </p>
            <div className={styles.strategyActions}>
              <button className={styles.moreInfoBtn}>More Info</button>
              <button className={styles.loadBtn}>Load</button>
            </div>
          </div>

          <div className={styles.strategyCard} onClick={() => loadSavedScreen('Value Opportunities')}>
            <div className={styles.strategyIcon}>💎</div>
            <h3 className={styles.strategyTitle}>Value Opportunities</h3>
            <p className={styles.strategyDescription}>
              Undervalued stocks trading below their intrinsic value with strong fundamentals
            </p>
            <div className={styles.strategyActions}>
              <button className={styles.moreInfoBtn}>More Info</button>
              <button className={styles.loadBtn}>Load</button>
            </div>
          </div>

          <div className={styles.strategyCard} onClick={() => loadSavedScreen('Near 52W Lows')}>
            <div className={styles.strategyIcon}>📉</div>
            <h3 className={styles.strategyTitle}>Near 52W Lows</h3>
            <p className={styles.strategyDescription}>
              Fundamentally strong stocks near their 52-week lows presenting buying opportunities
            </p>
            <div className={styles.strategyActions}>
              <button className={styles.moreInfoBtn}>More Info</button>
              <button className={styles.loadBtn}>Load</button>
            </div>
          </div>

          <div className={styles.strategyCard} onClick={() => loadSavedScreen('ESG Leaders')}>
            <div className={styles.strategyIcon}>🌱</div>
            <h3 className={styles.strategyTitle}>ESG Leaders</h3>
            <p className={styles.strategyDescription}>
              Companies with strong Environmental, Social, and Governance practices
            </p>
            <div className={styles.strategyActions}>
              <button className={styles.moreInfoBtn}>More Info</button>
              <button className={styles.loadBtn}>Load</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Screen Tab */}
      {activeTab === 'custom' && (
        <div className={styles.customScreenContainer}>
          <div className={styles.filterCard}>
            <h3 className={styles.filterTitle}>Build Your Custom Screen</h3>
            
            <div className={styles.filterGrid}>
              <div className={styles.filterGroup}>
                <label>Market Cap</label>
                <select 
                  className={styles.selectInput}
                  value={filters.marketCap}
                  onChange={(e) => handleFilterChange('marketCap', e.target.value)}
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
                  onChange={(e) => handleFilterChange('sector', e.target.value)}
                >
                  <option value="all">All Sectors</option>
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Financial">Financial</option>
                  <option value="Energy">Energy</option>
                  <option value="Consumer">Consumer</option>
                </select>
              </div>
              
              <div className={styles.filterGroup}>
                <label>P/E Ratio: {filters.peRatio[0]} - {filters.peRatio[1]}</label>
                <div className={styles.rangeContainer}>
                  <input 
                    type="range" 
                    min="0" 
                    max="50" 
                    value={filters.peRatio[1]}
                    onChange={(e) => handleFilterChange('peRatio', [filters.peRatio[0], parseInt(e.target.value)])}
                    className={styles.rangeInput} 
                  />
                </div>
              </div>
              
              <div className={styles.filterGroup}>
                <label>Dividend Yield: {filters.dividendYield[0]}% - {filters.dividendYield[1]}%</label>
                <div className={styles.rangeContainer}>
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    value={filters.dividendYield[1]}
                    onChange={(e) => handleFilterChange('dividendYield', [filters.dividendYield[0], parseInt(e.target.value)])}
                    className={styles.rangeInput} 
                  />
                </div>
              </div>
            </div>

            <div className={styles.quickActions}>
              <button className={styles.runScreenBtn} onClick={runScreen}>
                🔍 Run Screen
              </button>
              <button className={styles.saveScreenBtn}>
                💾 Save Screen
              </button>
              <button className={styles.resetBtn} onClick={() => setFilters({
                marketCap: 'all',
                sector: 'all',
                peRatio: [0, 50],
                dividendYield: [0, 10],
                priceRange: [0, 1000]
              })}>
                🔄 Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className={styles.resultsContainer}>
          <div className={styles.resultsHeader}>
            <h3>Screening Results</h3>
            <div className={styles.resultsCount}>
              {screenResults.length} stocks found
            </div>
            {loading && <div className={styles.loadingIndicator}>🔄 Screening...</div>}
          </div>
          
          <div className={styles.resultsList}>
            {screenResults.length === 0 && !loading ? (
              <div className={styles.noResults}>
                <div className={styles.noResultsIcon}>📊</div>
                <h3>No Results Found</h3>
                <p>Try adjusting your criteria or selecting a preset screen</p>
              </div>
            ) : (
              <div className={styles.stockGrid}>
                {screenResults.map((stock, index) => (
                  <div key={index} className={styles.stockCard}>
                    <div className={styles.stockHeader}>
                      <div className={styles.stockSymbol}>{stock.symbol}</div>
                      <div className={stock.change >= 0 ? styles.positive : styles.negative}>
                        {formatPercentage(stock.change)}
                      </div>
                    </div>
                    <div className={styles.stockName}>{stock.name}</div>
                    <div className={styles.stockPrice}>${stock.price.toFixed(2)}</div>
                    <div className={styles.stockDetails}>
                      <div className={styles.stockMetric}>
                        <span>Market Cap</span>
                        <span>{formatMarketCap(stock.marketCap)}</span>
                      </div>
                      <div className={styles.stockMetric}>
                        <span>P/E Ratio</span>
                        <span>{stock.pe.toFixed(1)}</span>
                      </div>
                      <div className={styles.stockMetric}>
                        <span>Dividend</span>
                        <span>{stock.dividend.toFixed(1)}%</span>
                      </div>
                    </div>
                    <button className={styles.addToWatchlistBtn}>
                      + Add to Watchlist
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
