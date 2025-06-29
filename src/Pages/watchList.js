'use client'

import { useState, useEffect } from 'react'
import styles from './watchList.module.css'

// Import TradingView Chart component
import { StockChart } from '../Components/TradingView/StockChart'
import { PriceWidget } from '../Components/TradingView/PriceWidget'

export default function WatchList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [watchlistItems, setWatchlistItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [chartModal, setChartModal] = useState({ isOpen: false, symbol: '', displaySymbol: '', name: '' })
  const [priceAnimations, setPriceAnimations] = useState({})
  const [viewMode, setViewMode] = useState('tradingview') // Only TradingView mode

  const userId = 'user123' // Replace with actual user authentication

  const categories = ['all', 'technology', 'finance', 'fmcg', 'energy', 'automotive', 'healthcare', 'crypto', 'other']

  // Load user's watchlist from Supabase
  const loadWatchlist = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user-watchlist?userId=${userId}`)
      const result = await response.json()
      
      if (result.success) {
        const symbols = result.watchlist.map(item => item.symbol)
        if (symbols.length > 0) {
          await refreshStockData(result.watchlist)
        } else {
          setWatchlistItems([])
        }
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error('Error loading watchlist:', error)
      setError('Failed to load watchlist')
    } finally {
      setLoading(false)
    }
  }

  // Refresh stock data for watchlist items
  const refreshStockData = async (watchlistData = watchlistItems) => {
    try {
      setRefreshing(true)
      const symbols = watchlistData.map(item => item.symbol)
      
      if (symbols.length === 0) {
        setWatchlistItems([])
        return
      }

      const response = await fetch('/api/watchlist-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Merge watchlist data with stock data
        const enhancedItems = watchlistData.map(watchlistItem => {
          const stockData = result.data.find(stock => stock.symbol === watchlistItem.symbol)
          const currentItem = watchlistItems.find(item => item.symbol === watchlistItem.symbol)
          const newPrice = stockData?.price || 0
          
          // Detect price changes for animation
          if (currentItem && currentItem.price !== newPrice && newPrice > 0) {
            const isIncrease = newPrice > currentItem.price
            setPriceAnimations(prev => ({
              ...prev,
              [watchlistItem.symbol]: isIncrease ? 'increase' : 'decrease'
            }))
            
            // Clear animation after 2 seconds
            setTimeout(() => {
              setPriceAnimations(prev => {
                const updated = { ...prev }
                delete updated[watchlistItem.symbol]
                return updated
              })
            }, 2000)
          }
          
          return {
            ...watchlistItem,
            price: newPrice,
            change: stockData?.change || 0,
            changePercent: stockData?.changePercent || 0,
            volume: stockData?.volume || '0',
            currency: stockData?.currency || 'INR',
            category: categorizeStock(watchlistItem.symbol),
            alerts: [] // TODO: Implement alerts system
          }
        })
        setWatchlistItems(enhancedItems)
        setLastUpdated(new Date())
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error('Error refreshing stock data:', error)
      setError('Failed to refresh data')
    } finally {
      setRefreshing(false)
    }
  }

  // Categorize stocks based on symbol
  const categorizeStock = (symbol) => {
    // Remove exchange suffixes for categorization
    const baseSymbol = symbol.replace('.NS', '').replace('.BO', '').replace('INR', '')
    
    // Indian Technology stocks
    if (['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM', 'LTIM', 'COFORGE', 'PERSISTENT'].includes(baseSymbol)) {
      return 'technology'
    }
    // Indian Banking stocks
    else if (['HDFCBANK', 'ICICIBANK', 'SBIN', 'KOTAKBANK', 'AXISBANK', 'INDUSINDBK', 'BANKBARODA', 'PNB', 'IDFCFIRSTB', 'FEDERALBNK'].includes(baseSymbol)) {
      return 'finance'
    }
    // Indian FMCG stocks
    else if (['ITC', 'HINDUNILVR', 'NESTLEIND', 'BRITANNIA', 'DABUR', 'MARICO', 'COLPAL', 'GODREJCP', 'TATACONSUM', 'EMAMILTD', 'PATANJALI'].includes(baseSymbol)) {
      return 'fmcg'
    }
    // Indian Energy/Renewable stocks
    else if (['RELIANCE', 'ADANIGREEN', 'SUZLON', 'TATAPOWER', 'NTPC', 'POWERGRID', 'RPOWER', 'JSWENERGY', 'THERMAX'].includes(baseSymbol)) {
      return 'energy'
    }
    // Indian Automotive stocks
    else if (['MARUTI', 'TATAMOTORS', 'M&M', 'BAJAJ-AUTO', 'HEROMOTOCO', 'EICHERMOT'].includes(baseSymbol)) {
      return 'automotive'
    }
    // Indian Healthcare/Pharma stocks
    else if (['SUNPHARMA', 'DRREDDY', 'CIPLA', 'LUPIN', 'AUROPHARMA', 'BIOCON'].includes(baseSymbol)) {
      return 'healthcare'
    }
    // Cryptocurrencies
    else if (['BTC', 'ETH', 'ADA', 'DOGE', 'MATIC', 'SOL'].includes(baseSymbol) || symbol.includes('INR')) {
      return 'crypto'
    }
    // US Technology stocks (legacy support)
    else if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA'].includes(baseSymbol)) {
      return 'technology'
    }
    // US Finance stocks (legacy support)
    else if (['JPM', 'BAC', 'WFC', 'GS'].includes(baseSymbol)) {
      return 'finance'
    }
    else {
      return 'other'
    }
  }

  // Remove stock from watchlist
  const removeFromWatchlist = async (symbol) => {
    try {
      const response = await fetch(`/api/user-watchlist?userId=${userId}&symbol=${symbol}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Remove from local state
        setWatchlistItems(prev => prev.filter(item => item.symbol !== symbol))
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error)
      setError('Failed to remove stock')
    }
  }

  // Open chart modal
  const openChart = (symbol, name) => {
    const displaySymbol = symbol.replace('.NS', '').replace('.BO', '').replace('INR', '')
    setChartModal({ 
      isOpen: true, 
      symbol, 
      displaySymbol,
      name 
    })
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
  }

  // Close chart modal
  const closeChart = () => {
    setChartModal({ isOpen: false, symbol: '', displaySymbol: '', name: '' })
    // Restore body scroll
    document.body.style.overflow = 'unset'
  }

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && chartModal.isOpen) {
        closeChart()
      }
    }
    
    document.addEventListener('keydown', handleEscapeKey)
    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
      // Cleanup: restore body scroll if component unmounts with modal open
      document.body.style.overflow = 'unset'
    }
  }, [chartModal.isOpen])

  // Load watchlist on component mount
  useEffect(() => {
    loadWatchlist()
  }, [])

  // Auto-refresh every 10 seconds for more real-time feel (skip if pure TradingView mode)
  useEffect(() => {
    if (viewMode === 'tradingview') {
      return // No need to refresh API data in TradingView-only mode
    }
    
    const interval = setInterval(() => {
      if (watchlistItems.length > 0 && !refreshing) {
        refreshStockData()
      }
    }, 10000) // Reduced from 30 seconds to 10 seconds

    return () => clearInterval(interval)
  }, [watchlistItems, refreshing, viewMode])

  // Format currency based on type
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
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value))
  }

  // Render price cell with TradingView widget
  const renderPriceCell = (item) => {
    // Use display symbol for TradingView widget (clean symbol without .NS/.BO/INR)
    const displaySymbol = item.displaySymbol || item.symbol.replace('.NS', '').replace('.BO', '').replace('INR', '')
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <PriceWidget symbol={displaySymbol} width={200} height={80} />
      </div>
    )
  }

  const filteredWatchlist = watchlistItems.filter(item => {
    const displaySymbol = item.displaySymbol || item.symbol.replace('.NS', '').replace('.BO', '').replace('INR', '')
    const matchesSearch = displaySymbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const activeAlerts = watchlistItems.reduce((total, item) => 
    total + (item.alerts?.filter(alert => alert.active).length || 0), 0
  )

  const topGainers = [...watchlistItems]
    .filter(item => item.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 3)

  const topLosers = [...watchlistItems]
    .filter(item => item.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 3)

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>👁️ Watch List</h1>
          <p className={styles.pageSubtitle}>Loading your watchlist...</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div style={{ fontSize: '2rem' }}>⏳ Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>👁️ Watch List</h1>
        {error && (
          <div style={{ 
            background: '#f8d7da', 
            color: '#721c24', 
            padding: '0.75rem', 
            borderRadius: '4px', 
            margin: '1rem 0',
            border: '1px solid #f5c6cb'
          }}>
            ⚠️ {error}
            <button 
              onClick={() => setError(null)} 
              style={{ 
                float: 'right', 
                background: 'none', 
                border: 'none', 
                color: '#721c24', 
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.mainContent}>
          <div className={styles.card}>
            <div className={styles.watchlistControls} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div className={styles.searchContainer} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Search stocks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                  style={{ 
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    minWidth: '200px'
                  }}
                />
                <button className={styles.primaryButton} style={{ padding: '0.5rem 1rem' }}>
                  🔍 Search
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div className={styles.categoryFilters} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={selectedCategory === category ? styles.activeFilter : styles.filterButton}
                      style={{
                        padding: '0.5rem 1rem',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        backgroundColor: selectedCategory === category ? '#007bff' : '#f8f9fa',
                        color: selectedCategory === category ? 'white' : '#333',
                        textTransform: 'capitalize',
                        fontSize: '0.9rem'
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.watchlistTable} style={{ overflowX: 'auto' }}>
              {filteredWatchlist.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>📈</div>
                  <h3 className={styles.emptyStateTitle}>Your watchlist is empty</h3>
                  <p className={styles.emptyStateDescription}>Start by adding some stocks from the Dashboard search.</p>
                  <button 
                    className={styles.primaryButton}
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    ➕ Add Your First Stock
                  </button>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #eee' }}>
                      <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 'bold', width: '25%' }}>Symbol / Exchange</th>
                      <th style={{ textAlign: 'center', padding: '1rem', fontWeight: 'bold', width: '30%' }}>TradingView Price</th>
                      <th style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold', width: '15%' }}>Volume</th>
                      <th style={{ textAlign: 'center', padding: '1rem', fontWeight: 'bold', width: '10%' }}>Alerts</th>
                      <th style={{ textAlign: 'center', padding: '1rem', fontWeight: 'bold', width: '20%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWatchlist.map(item => (
                      <tr key={item.symbol} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '1rem' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {item.displaySymbol || item.symbol.replace('.NS', '').replace('.BO', '').replace('INR', '')}
                              <span style={{ 
                                fontSize: '0.7rem', 
                                backgroundColor: item.symbol.includes('.NS') ? '#e3f2fd' : 
                                                item.symbol.includes('.BO') ? '#fff3e0' : 
                                                item.symbol.includes('INR') ? '#f3e5f5' : '#f8f9fa',
                                color: item.symbol.includes('.NS') ? '#1976d2' : 
                                       item.symbol.includes('.BO') ? '#f57c00' : 
                                       item.symbol.includes('INR') ? '#7b1fa2' : '#666',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '10px',
                                fontWeight: 'bold'
                              }}>
                                {item.symbol.includes('.NS') ? 'NSE' : 
                                 item.symbol.includes('.BO') ? 'BSE' : 
                                 item.symbol.includes('INR') ? 'CRYPTO' : 'OTHER'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{item.name}</div>
                            <div style={{ 
                              fontSize: '0.7rem', 
                              backgroundColor: `var(--${item.category}-bg, #f8f9fa)`,
                              color: `var(--${item.category}-color, #666)`,
                              padding: '0.2rem 0.5rem',
                              borderRadius: '12px',
                              display: 'inline-block',
                              marginTop: '0.2rem'
                            }}>
                              {item.category}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {renderPriceCell(item)}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>{item.volume}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <span style={{ 
                              backgroundColor: (item.alerts?.filter(a => a.active).length || 0) > 0 ? '#ffc107' : '#e9ecef',
                              color: (item.alerts?.filter(a => a.active).length || 0) > 0 ? '#856404' : '#6c757d',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold'
                            }}>
                              {item.alerts?.filter(a => a.active).length || 0}
                            </span>
                            {(item.alerts?.filter(a => a.active).length || 0) > 0 && (
                              <span style={{ fontSize: '0.8rem', color: '#ffc107' }}>🔔</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button 
                              onClick={() => openChart(item.symbol, item.name)}
                              style={{ 
                                padding: '0.25rem 0.5rem', 
                                border: '1px solid #007bff', 
                                backgroundColor: 'white', 
                                color: '#007bff',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              📊 Chart
                            </button>
                            <button 
                              style={{ 
                                padding: '0.25rem 0.5rem', 
                                border: '1px solid #28a745', 
                                backgroundColor: 'white', 
                                color: '#28a745',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              🔔 Alert
                            </button>
                            <button 
                              onClick={() => removeFromWatchlist(item.symbol)}
                              style={{ 
                                padding: '0.25rem 0.5rem', 
                                border: '1px solid #dc3545', 
                                backgroundColor: 'white', 
                                color: '#dc3545',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              🗑️ Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.card}>
            <h3>Quick Stats</h3>
            <div className={styles.quickStats}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span>Total Watched</span>
                <span style={{ fontWeight: 'bold' }}>{watchlistItems.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span>Active Alerts</span>
                <span style={{ fontWeight: 'bold', color: activeAlerts > 0 ? '#ffc107' : '#6c757d' }}>
                  {activeAlerts}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span>Gainers Today</span>
                <span style={{ fontWeight: 'bold', color: '#28a745' }}>
                  {watchlistItems.filter(item => item.changePercent > 0).length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span>Losers Today</span>
                <span style={{ fontWeight: 'bold', color: '#dc3545' }}>
                  {watchlistItems.filter(item => item.changePercent < 0).length}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Top Gainers</h3>
            <div className={styles.topMovers}>
              {topGainers.map(stock => (
                <div key={stock.symbol} className={styles.moverItem}>
                  <div className={styles.moverInfo}>
                    <div className={styles.moverSymbol}>
                      {stock.displaySymbol || stock.symbol.replace('.NS', '').replace('.BO', '').replace('INR', '')}
                    </div>
                    <div className={styles.moverPrice}>
                      {formatCurrency(stock.price, stock.currency)}
                    </div>
                  </div>
                  <div className={`${styles.moverChange} ${styles.positive}`}>
                    +{stock.changePercent.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <h3>Top Losers</h3>
            <div className={styles.topMovers}>
              {topLosers.map(stock => (
                <div key={stock.symbol} className={styles.moverItem}>
                  <div className={styles.moverInfo}>
                    <div className={styles.moverSymbol}>
                      {stock.displaySymbol || stock.symbol.replace('.NS', '').replace('.BO', '').replace('INR', '')}
                    </div>
                    <div className={styles.moverPrice}>
                      {formatCurrency(stock.price, stock.currency)}
                    </div>
                  </div>
                  <div className={`${styles.moverChange} ${styles.negative}`}>
                    {stock.changePercent.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <h3>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                className={styles.primaryButton}
                onClick={() => window.location.href = '/dashboard'}
              >
                ➕ Add Stock
              </button>
              <button className={styles.secondaryButton}>📋 Import List</button>
              <button className={styles.secondaryButton}>📤 Export List</button>
              <button className={styles.secondaryButton}>⚙️ Alert Settings</button>
            </div>
          </div>
        </div>
      </div>

      {chartModal.isOpen && (
        <div 
          className={styles.chartModal}
          onClick={closeChart}
        >
          <div 
            className={styles.chartModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.chartModalHeader}>
              <h3 className={styles.chartModalTitle}>
                📊 {chartModal.displaySymbol || chartModal.symbol.replace('.NS', '').replace('.BO', '').replace('INR', '')} - {chartModal.name}
              </h3>
              <div style={{ 
                fontSize: '0.8rem', 
                backgroundColor: chartModal.symbol.includes('.NS') ? '#e3f2fd' : 
                                chartModal.symbol.includes('.BO') ? '#fff3e0' : 
                                chartModal.symbol.includes('INR') ? '#f3e5f5' : '#f8f9fa',
                color: chartModal.symbol.includes('.NS') ? '#1976d2' : 
                       chartModal.symbol.includes('.BO') ? '#f57c00' : 
                       chartModal.symbol.includes('INR') ? '#7b1fa2' : '#666',
                padding: '0.3rem 0.6rem',
                borderRadius: '12px',
                fontWeight: 'bold',
                marginRight: '1rem'
              }}>
                {chartModal.symbol.includes('.NS') ? 'NSE' : 
                 chartModal.symbol.includes('.BO') ? 'BSE' : 
                 chartModal.symbol.includes('INR') ? 'CRYPTO' : 'OTHER'}
              </div>
              <button 
                onClick={closeChart}
                className={styles.closeButton}
                title="Close Chart"
              >
                ✕
              </button>
            </div>
            <div className={styles.chartContainer}>
              <StockChart symbol={chartModal.displaySymbol || chartModal.symbol.replace('.NS', '').replace('.BO', '').replace('INR', '')} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
