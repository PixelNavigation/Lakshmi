'use client'

import { useState } from 'react'
import styles from './watchList.module.css'

export default function WatchList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const watchlistItems = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 185.20,
      change: 2.75,
      changePercent: 1.51,
      volume: '52.3M',
      category: 'technology',
      alerts: [
        { type: 'price', condition: 'above', value: 190, active: true },
        { type: 'volume', condition: 'above', value: '60M', active: false }
      ]
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      price: 348.75,
      change: 5.20,
      changePercent: 1.51,
      volume: '28.1M',
      category: 'technology',
      alerts: [
        { type: 'price', condition: 'below', value: 340, active: true }
      ]
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 132.45,
      change: -1.25,
      changePercent: -0.93,
      volume: '31.8M',
      category: 'technology',
      alerts: []
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      price: 238.90,
      change: -6.10,
      changePercent: -2.49,
      volume: '89.2M',
      category: 'automotive',
      alerts: [
        { type: 'price', condition: 'below', value: 230, active: true },
        { type: 'changePercent', condition: 'above', value: 5, active: true }
      ]
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      price: 485.30,
      change: 12.80,
      changePercent: 2.71,
      volume: '45.7M',
      category: 'technology',
      alerts: [
        { type: 'price', condition: 'above', value: 500, active: true }
      ]
    },
    {
      symbol: 'JPM',
      name: 'JPMorgan Chase & Co.',
      price: 156.80,
      change: 1.20,
      changePercent: 0.77,
      volume: '12.4M',
      category: 'finance',
      alerts: []
    },
    {
      symbol: 'JNJ',
      name: 'Johnson & Johnson',
      price: 168.45,
      change: -0.85,
      changePercent: -0.50,
      volume: '8.7M',
      category: 'healthcare',
      alerts: [
        { type: 'price', condition: 'below', value: 165, active: true }
      ]
    },
    {
      symbol: 'XOM',
      name: 'Exxon Mobil Corporation',
      price: 105.60,
      change: 2.40,
      changePercent: 2.33,
      volume: '18.9M',
      category: 'energy',
      alerts: []
    }
  ]

  const categories = ['all', 'technology', 'finance', 'healthcare', 'automotive', 'energy']

  const filteredWatchlist = watchlistItems.filter(item => {
    const matchesSearch = item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const activeAlerts = watchlistItems.reduce((total, item) => 
    total + item.alerts.filter(alert => alert.active).length, 0
  )

  const topGainers = [...watchlistItems]
    .filter(item => item.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 3)

  const topLosers = [...watchlistItems]
    .filter(item => item.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 3)

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>👁️ Watch List</h1>
        <p className={styles.pageSubtitle}>Monitor your favorite stocks and set up custom alerts</p>
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
                        ${item.price.toFixed(2)}
                      </td>
                      <td style={{ 
                        padding: '1rem', 
                        textAlign: 'right',
                        color: item.change >= 0 ? '#28a745' : '#dc3545',
                        fontWeight: 'bold'
                      }}>
                        <div>${item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}</div>
                        <div style={{ fontSize: '0.9rem' }}>
                          ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>{item.volume}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <span style={{ 
                            backgroundColor: item.alerts.filter(a => a.active).length > 0 ? '#ffc107' : '#e9ecef',
                            color: item.alerts.filter(a => a.active).length > 0 ? '#856404' : '#6c757d',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}>
                            {item.alerts.filter(a => a.active).length}
                          </span>
                          {item.alerts.filter(a => a.active).length > 0 && (
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
                            ❌
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
              <button className={styles.primaryButton}>➕ Add Stock</button>
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
