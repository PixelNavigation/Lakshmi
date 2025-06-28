'use client'

import { useState, useEffect } from 'react'
import styles from './watchList.module.css'

export default function WatchList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [watchlistItems, setWatchlistItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Mock user ID - in a real app, this would come from authentication
  const userId = 'user123' // Replace with actual user authentication

  const categories = ['all', 'technology', 'finance', 'healthcare', 'automotive', 'energy', 'crypto']

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
          return {
            ...watchlistItem,
            price: stockData?.price || 0,
            change: stockData?.change || 0,
            changePercent: stockData?.changePercent || 0,
            volume: stockData?.volume || '0',
            currency: stockData?.currency || 'USD',
            category: categorizeStock(watchlistItem.symbol),
            alerts: [] // TODO: Implement alerts system
          }
        })
        setWatchlistItems(enhancedItems)
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
    if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('DOGE') || symbol.includes('-INR') || symbol.includes('-USD')) {
      return 'crypto'
    } else if (symbol.includes('.NS') || symbol.includes('.BO')) {
      return 'indian'
    } else if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA'].includes(symbol)) {
      return 'technology'
    } else if (['JPM', 'BAC', 'WFC', 'GS'].includes(symbol)) {
      return 'finance'
    } else if (['JNJ', 'PFE', 'MRK', 'ABT'].includes(symbol)) {
      return 'healthcare'
    } else if (['XOM', 'CVX', 'COP'].includes(symbol)) {
      return 'energy'
    } else {
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

  // Load watchlist on component mount
  useEffect(() => {
    loadWatchlist()
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (watchlistItems.length > 0) {
        refreshStockData()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [watchlistItems])

  // Format currency based on type
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

  const categories = ['all', 'technology', 'finance', 'healthcare', 'automotive', 'energy', 'crypto']

  const filteredWatchlist = watchlistItems.filter(item => {
    const matchesSearch = item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
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
        <p className={styles.pageSubtitle}>
          Monitor your favorite stocks and set up custom alerts
          {refreshing && <span style={{ color: '#007bff', marginLeft: '1rem' }}>🔄 Refreshing...</span>}
        </p>
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
                <button 
                  className={styles.secondaryButton} 
                  onClick={() => refreshStockData()}
                  disabled={refreshing}
                  style={{ 
                    padding: '0.5rem 1rem',
                    opacity: refreshing ? 0.6 : 1,
                    cursor: refreshing ? 'not-allowed' : 'pointer'
                  }}
                >
                  {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
                </button>
              </div>
              
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

            <div className={styles.watchlistTable} style={{ overflowX: 'auto' }}>
              {filteredWatchlist.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem 1rem',
                  color: '#666'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
                  <h3>Your watchlist is empty</h3>
                  <p>Start by adding some stocks from the Dashboard search.</p>
                  <button 
                    className={styles.primaryButton}
                    onClick={() => window.location.href = '/dashboard'}
                    style={{ marginTop: '1rem' }}
                  >
                    ➕ Add Your First Stock
                  </button>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #eee' }}>
                      <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 'bold' }}>Symbol</th>
                      <th style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold' }}>Price</th>
                      <th style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold' }}>Change</th>
                      <th style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold' }}>Volume</th>
                      <th style={{ textAlign: 'center', padding: '1rem', fontWeight: 'bold' }}>Alerts</th>
                      <th style={{ textAlign: 'center', padding: '1rem', fontWeight: 'bold' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWatchlist.map(item => (
                      <tr key={item.symbol} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '1rem' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.symbol}</div>
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
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {formatCurrency(item.price, item.currency)}
                        </td>
                        <td style={{ 
                          padding: '1rem', 
                          textAlign: 'right',
                          color: item.change >= 0 ? '#28a745' : '#dc3545',
                          fontWeight: 'bold'
                        }}>
                          <div>
                            {item.currency === 'INR' ? '₹' : '$'}
                            {item.change >= 0 ? '+' : ''}
                            {Math.abs(item.change).toFixed(2)}
                          </div>
                          <div style={{ fontSize: '0.9rem' }}>
                            ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                          </div>
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
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee' }}>
                    <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 'bold' }}>Symbol</th>
                    <th style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold' }}>Price</th>
                    <th style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold' }}>Change</th>
                    <th style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold' }}>Volume</th>
                    <th style={{ textAlign: 'center', padding: '1rem', fontWeight: 'bold' }}>Alerts</th>
                    <th style={{ textAlign: 'center', padding: '1rem', fontWeight: 'bold' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWatchlist.map(item => (
                    <tr key={item.symbol} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.symbol}</div>
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
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {formatCurrency(item.price, item.currency)}
                      </td>
                      <td style={{ 
                        padding: '1rem', 
                        textAlign: 'right',
                        color: item.change >= 0 ? '#28a745' : '#dc3545',
                        fontWeight: 'bold'
                      }}>
                        <div>
                          {item.currency === 'INR' ? '₹' : '$'}
                          {item.change >= 0 ? '+' : ''}
                          {Math.abs(item.change).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.9rem' }}>
                          ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                        </div>
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
                <div key={stock.symbol} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #eee'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{stock.symbol}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {formatCurrency(stock.price, stock.currency)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', color: '#28a745', fontWeight: 'bold' }}>
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
                <div key={stock.symbol} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #eee'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{stock.symbol}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {formatCurrency(stock.price, stock.currency)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', color: '#dc3545', fontWeight: 'bold' }}>
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
    </div>
  )
}
