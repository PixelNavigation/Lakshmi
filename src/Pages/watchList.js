'use client'

import { useState, useEffect } from 'react'
import styles from './watchList.module.css'

export default function WatchList() {
  const [watchlistItems, setWatchlistItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isRealTimeData, setIsRealTimeData] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newItemQuery, setNewItemQuery] = useState('')
  const [newItemType, setNewItemType] = useState('stocks')
  const [userWatchlist, setUserWatchlist] = useState(['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'BTC', 'ETH', 'GLD'])

  // Categories for filtering
  const categories = ['all', 'stocks', 'crypto', 'commodities', 'forex']

  // Fetch watchlist data
  const fetchWatchlistData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const symbols = userWatchlist.join(',')
      const response = await fetch(`/api/watchlist?symbols=${symbols}&type=all`)
      const result = await response.json()
      
      if (result.success) {
        setWatchlistItems(result.data.map(item => ({
          ...item,
          alerts: item.alerts || [] // Ensure alerts is always an array
        })))
        setLastUpdated(new Date())
        setIsRealTimeData(!result.isMockData)
      } else {
        throw new Error('Failed to fetch watchlist data')
      }
    } catch (err) {
      console.error('Error fetching watchlist:', err)
      setError('Failed to load watchlist data. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  // Search for new instruments to add
  const searchInstruments = async (query, type) => {
    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, type })
      })
      
      const result = await response.json()
      if (result.success) {
        setSearchResults(result.data)
      }
    } catch (err) {
      console.error('Error searching instruments:', err)
      setSearchResults([])
    }
  }

  // Add instrument to watchlist
  const addToWatchlist = (instrument) => {
    if (!userWatchlist.includes(instrument.symbol)) {
      const newWatchlist = [...userWatchlist, instrument.symbol]
      setUserWatchlist(newWatchlist)
      localStorage.setItem('lakshmi_watchlist', JSON.stringify(newWatchlist))
      setShowAddModal(false)
      setNewItemQuery('')
      setSearchResults([])
      fetchWatchlistData() // Refresh data
    }
  }

  // Remove instrument from watchlist
  const removeFromWatchlist = (symbol) => {
    const newWatchlist = userWatchlist.filter(s => s !== symbol)
    setUserWatchlist(newWatchlist)
    localStorage.setItem('lakshmi_watchlist', JSON.stringify(newWatchlist))
    setWatchlistItems(prev => prev.filter(item => item.symbol !== symbol))
  }

  // Load saved watchlist from localStorage
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('lakshmi_watchlist')
    if (savedWatchlist) {
      setUserWatchlist(JSON.parse(savedWatchlist))
    }
  }, [])

  // Initial load and when watchlist changes
  useEffect(() => {
    if (userWatchlist.length > 0) {
      fetchWatchlistData()
    }
  }, [userWatchlist])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (userWatchlist.length > 0) {
        fetchWatchlistData()
      }
    }, 30 * 1000) // 30 seconds

    return () => clearInterval(interval)
  }, [userWatchlist])

  // Search for instruments when query changes
  useEffect(() => {
    if (newItemQuery.length > 2) {
      const debounceTimer = setTimeout(() => {
        searchInstruments(newItemQuery, newItemType)
      }, 500)
      
      return () => clearTimeout(debounceTimer)
    } else {
      setSearchResults([])
    }
  }, [newItemQuery, newItemType])

  const handleRefresh = () => {
    fetchWatchlistData()
  }

  // Filter watchlist items
  const filteredWatchlist = watchlistItems.filter(item => {
    const matchesSearch = item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || item.type === selectedType
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesType && matchesCategory
  })

  // Calculate statistics
  const totalValue = filteredWatchlist.reduce((sum, item) => sum + item.price, 0)
  const gainers = filteredWatchlist.filter(item => item.changePercent > 0)
  const losers = filteredWatchlist.filter(item => item.changePercent < 0)
  const topGainer = filteredWatchlist.reduce((max, item) => 
    item.changePercent > (max?.changePercent || -Infinity) ? item : max, null)
  const topLoser = filteredWatchlist.reduce((min, item) => 
    item.changePercent < (min?.changePercent || Infinity) ? item : min, null)

  // Top movers for sidebar
  const topGainers = filteredWatchlist
    .filter(item => item.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 5)
  
  const topLosers = filteredWatchlist
    .filter(item => item.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 5)

  // Calculate active alerts (mock for now)
  const activeAlerts = watchlistItems.reduce((sum, item) => {
    const alerts = item.alerts || []
    return sum + alerts.filter(alert => alert && alert.active).length
  }, 0)

  // Format currency
  const formatCurrency = (value, currency = 'USD') => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value)
    }
    return value.toFixed(4) // For forex pairs
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
        <h1 className={styles.pageTitle}>👁️ Watch List</h1>
        <p className={styles.pageSubtitle}>Monitor your favorite stocks and set up custom alerts</p>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.mainContent}>
          {/* Status bar */}
          <div className={styles.statusBar}>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Last Updated:</span>
              <span className={styles.statusValue}>
                {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
              </span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Data Source:</span>
              <span className={`${styles.statusValue} ${isRealTimeData ? styles.realTime : styles.mockData}`}>
                {isRealTimeData ? '🟢 Real-time' : '🟡 Mock Data'}
              </span>
            </div>
            <button onClick={handleRefresh} className={styles.refreshButton} disabled={loading}>
              {loading ? '⏳ Loading...' : '� Refresh'}
            </button>
          </div>

          <div className={styles.card}>
            <div className={styles.watchlistControls}>
              <div className={styles.controlsRow}>
                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    placeholder="Search watchlist..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                  />
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className={styles.addButton}
                  >
                    ➕ Add Instrument
                  </button>
                </div>
                
                <div className={styles.typeFilters}>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={selectedCategory === category ? styles.activeFilter : styles.filterButton}
                    >
                      {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading watchlist data...</p>
              </div>
            ) : error ? (
              <div className={styles.errorContainer}>
                <p>{error}</p>
                <button onClick={handleRefresh} className={styles.retryButton}>
                  Try Again
                </button>
              </div>
            ) : filteredWatchlist.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No instruments found matching your criteria.</p>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className={styles.primaryButton}
                >
                  Add Your First Instrument
                </button>
              </div>
            ) : (
              <div className={styles.watchlistTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Instrument</th>
                      <th>Price</th>
                      <th>Change</th>
                      <th>Volume</th>
                      <th>Market Cap</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWatchlist.map(item => (
                      <tr key={item.symbol}>
                        <td>
                          <div className={styles.instrumentInfo}>
                            <div className={styles.symbolName}>
                              <span className={styles.symbol}>{item.symbol}</span>
                              <span className={styles.name}>{item.name}</span>
                            </div>
                            <div className={styles.badges}>
                              <span className={`${styles.badge} ${styles[item.type]}`}>
                                {item.type}
                              </span>
                              <span className={styles.exchange}>{item.exchange}</span>
                            </div>
                          </div>
                        </td>
                        <td className={styles.price}>
                          {formatCurrency(item.price, item.currency)}
                        </td>
                        <td className={`${styles.change} ${item.changePercent >= 0 ? styles.positive : styles.negative}`}>
                          <div className={styles.changeValue}>
                            {item.changePercent >= 0 ? '+' : ''}{formatCurrency(item.change, item.currency)}
                          </div>
                          <div className={styles.changePercent}>
                            ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                          </div>
                        </td>
                        <td className={styles.volume}>
                          {formatNumber(item.volume)}
                        </td>
                        <td className={styles.marketCap}>
                          {item.marketCap ? formatCurrency(item.marketCap) : 'N/A'}
                        </td>
                        <td className={styles.actions}>
                          <button 
                            className={styles.actionButton}
                            onClick={() => removeFromWatchlist(item.symbol)}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>${stock.price}</div>
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
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>${stock.price}</div>
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
                onClick={() => setShowAddModal(true)}
              >
                ➕ Add Instrument
              </button>
              <button className={styles.secondaryButton}>📋 Import List</button>
              <button className={styles.secondaryButton}>📤 Export List</button>
              <button className={styles.secondaryButton}>⚙️ Alert Settings</button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Instrument Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Instrument to Watchlist</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.searchSection}>
                <div className={styles.searchRow}>
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value)}
                    className={styles.typeSelect}
                  >
                    <option value="stocks">Stocks</option>
                    <option value="crypto">Cryptocurrency</option>
                    <option value="commodities">Commodities</option>
                    <option value="forex">Forex</option>
                  </select>
                  
                  <input
                    type="text"
                    placeholder="Enter symbol (e.g., AAPL, BTC, GLD)"
                    value={newItemQuery}
                    onChange={(e) => setNewItemQuery(e.target.value)}
                    className={styles.symbolInput}
                  />
                  
                  <button 
                    className={styles.searchButton}
                    disabled={newItemQuery.length < 2}
                  >
                    🔍 Search
                  </button>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className={styles.searchResults}>
                  <h4>Search Results:</h4>
                  {searchResults.map((result, index) => (
                    <div key={index} className={styles.searchResult}>
                      <div className={styles.resultInfo}>
                        <span className={styles.resultSymbol}>{result.symbol}</span>
                        <span className={styles.resultName}>{result.name}</span>
                        <span className={styles.resultType}>{result.type}</span>
                      </div>
                      <button 
                        className={styles.addResultButton}
                        onClick={() => addToWatchlist(result)}
                        disabled={userWatchlist.includes(result.symbol)}
                      >
                        {userWatchlist.includes(result.symbol) ? '✓ Added' : '+ Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {newItemQuery.length > 0 && searchResults.length === 0 && (
                <div className={styles.quickAdd}>
                  <p>Can't find what you're looking for?</p>
                  <button 
                    className={styles.quickAddButton}
                    onClick={() => addToWatchlist({ 
                      symbol: newItemQuery.toUpperCase(), 
                      name: newItemQuery.toUpperCase(),
                      type: newItemType 
                    })}
                  >
                    Add "{newItemQuery.toUpperCase()}" directly
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
