'use client'

import { useState } from 'react'
import styles from './StockGraph.module.css'

export default function StockGraph() {
  const [selectedStock, setSelectedStock] = useState('AAPL')
  const [timeframe, setTimeframe] = useState('1D')

  const stockData = {
    'AAPL': {
      name: 'Apple Inc.',
      price: 185.20,
      change: 2.75,
      changePercent: 1.51,
      volume: '52.3M',
      marketCap: '2.89T',
      pe: 29.8,
      dayRange: '182.50 - 186.00'
    },
    'MSFT': {
      name: 'Microsoft Corporation',
      price: 348.75,
      change: 5.20,
      changePercent: 1.51,
      volume: '28.1M',
      marketCap: '2.59T',
      pe: 32.1,
      dayRange: '345.20 - 350.00'
    },
    'GOOGL': {
      name: 'Alphabet Inc.',
      price: 132.45,
      change: -1.25,
      changePercent: -0.93,
      volume: '31.8M',
      marketCap: '1.67T',
      pe: 26.4,
      dayRange: '131.80 - 134.20'
    },
    'TSLA': {
      name: 'Tesla Inc.',
      price: 238.90,
      change: -6.10,
      changePercent: -2.49,
      volume: '89.2M',
      marketCap: '758.3B',
      pe: 45.2,
      dayRange: '235.50 - 242.30'
    },
    'NVDA': {
      name: 'NVIDIA Corporation',
      price: 485.30,
      change: 12.80,
      changePercent: 2.71,
      volume: '45.7M',
      marketCap: '1.19T',
      pe: 62.8,
      dayRange: '478.20 - 487.90'
    }
  }

  const watchlist = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA']

  const currentStock = stockData[selectedStock]

  // Mock chart data points for visualization
  const generateChartData = (timeframe) => {
    const points = timeframe === '1D' ? 50 : timeframe === '1W' ? 35 : timeframe === '1M' ? 30 : 12
    const basePrice = currentStock.price
    const volatility = 0.02
    
    return Array.from({ length: points }, (_, i) => ({
      x: i,
      y: basePrice + (Math.random() - 0.5) * basePrice * volatility
    }))
  }

  const chartData = generateChartData(timeframe)

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>📈 Stock Graph</h1>
        <p className={styles.pageSubtitle}>Interactive stock charts and technical analysis</p>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.mainContent}>
          <div className={styles.card}>
            <div className={styles.stockHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{selectedStock} - {currentStock.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>${currentStock.price}</span>
                  <span style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold',
                    color: currentStock.change >= 0 ? '#28a745' : '#dc3545'
                  }}>
                    {currentStock.change >= 0 ? '+' : ''}{currentStock.change} ({currentStock.changePercent >= 0 ? '+' : ''}{currentStock.changePercent}%)
                  </span>
                </div>
              </div>
              
              <div className={styles.timeframeButtons} style={{ display: 'flex', gap: '0.5rem' }}>
                {['1D', '1W', '1M', '3M', '1Y'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #ddd',
                      backgroundColor: timeframe === tf ? '#007bff' : 'white',
                      color: timeframe === tf ? 'white' : '#333',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.chartContainer} style={{ 
              height: '400px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Simple SVG chart representation */}
              <svg width="100%" height="100%" viewBox="0 0 800 400" style={{ position: 'absolute', top: 0, left: 0 }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: currentStock.change >= 0 ? '#28a745' : '#dc3545', stopOpacity: 0.3 }} />
                    <stop offset="100%" style={{ stopColor: currentStock.change >= 0 ? '#28a745' : '#dc3545', stopOpacity: 0.1 }} />
                  </linearGradient>
                </defs>
                
                {/* Grid lines */}
                {Array.from({ length: 5 }, (_, i) => (
                  <line
                    key={`h-${i}`}
                    x1="50"
                    y1={80 + i * 60}
                    x2="750"
                    y2={80 + i * 60}
                    stroke="#e0e0e0"
                    strokeWidth="1"
                  />
                ))}
                
                {/* Chart line */}
                <polyline
                  fill="none"
                  stroke={currentStock.change >= 0 ? '#28a745' : '#dc3545'}
                  strokeWidth="3"
                  points={chartData.map((point, i) => 
                    `${50 + (i * (700 / (chartData.length - 1)))},${350 - (point.y / currentStock.price * 200)}`
                  ).join(' ')}
                />
                
                {/* Area fill */}
                <polygon
                  fill="url(#chartGradient)"
                  points={[
                    `50,350`,
                    ...chartData.map((point, i) => 
                      `${50 + (i * (700 / (chartData.length - 1)))},${350 - (point.y / currentStock.price * 200)}`
                    ),
                    `750,350`
                  ].join(' ')}
                />
              </svg>
              
              <div style={{ 
                position: 'absolute', 
                bottom: '10px', 
                right: '10px', 
                fontSize: '0.8rem', 
                color: '#666' 
              }}>
                {timeframe} Chart
              </div>
            </div>

            <div className={styles.stockMetrics} style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: '1rem', 
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <div className={styles.metric}>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Volume</div>
                <div style={{ fontWeight: 'bold' }}>{currentStock.volume}</div>
              </div>
              <div className={styles.metric}>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Market Cap</div>
                <div style={{ fontWeight: 'bold' }}>{currentStock.marketCap}</div>
              </div>
              <div className={styles.metric}>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>P/E Ratio</div>
                <div style={{ fontWeight: 'bold' }}>{currentStock.pe}</div>
              </div>
              <div className={styles.metric}>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Day Range</div>
                <div style={{ fontWeight: 'bold' }}>{currentStock.dayRange}</div>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Technical Indicators</h3>
            <div className={styles.indicatorGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div className={styles.indicator}>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>RSI (14)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#007bff' }}>65.8</div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Neutral</div>
              </div>
              <div className={styles.indicator}>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>MACD</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}>+2.15</div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Bullish</div>
              </div>
              <div className={styles.indicator}>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Moving Avg (50)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>${(currentStock.price * 0.98).toFixed(2)}</div>
                <div style={{ fontSize: '0.8rem', color: '#28a745' }}>Above</div>
              </div>
              <div className={styles.indicator}>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Bollinger Bands</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ffc107' }}>Middle</div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Neutral</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.card}>
            <h3>Watchlist</h3>
            <div className={styles.watchlistContainer}>
              {watchlist.map(symbol => (
                <div 
                  key={symbol} 
                  onClick={() => setSelectedStock(symbol)}
                  className={styles.watchlistItem}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    backgroundColor: symbol === selectedStock ? '#e7f3ff' : 'transparent',
                    borderRadius: '4px',
                    marginBottom: '0.5rem',
                    border: symbol === selectedStock ? '1px solid #007bff' : '1px solid transparent'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{symbol}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{stockData[symbol].name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold' }}>${stockData[symbol].price}</div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: stockData[symbol].change >= 0 ? '#28a745' : '#dc3545'
                    }}>
                      {stockData[symbol].change >= 0 ? '+' : ''}{stockData[symbol].changePercent}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <h3>Market Summary</h3>
            <div className={styles.marketSummary}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span>S&P 500</span>
                <span style={{ color: '#28a745' }}>+0.85%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span>NASDAQ</span>
                <span style={{ color: '#28a745' }}>+1.24%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span>Dow Jones</span>
                <span style={{ color: '#28a745' }}>+0.67%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span>VIX</span>
                <span style={{ color: '#dc3545' }}>+2.15%</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className={styles.primaryButton}>Buy {selectedStock}</button>
              <button className={styles.secondaryButton}>Sell {selectedStock}</button>
              <button className={styles.secondaryButton}>Add to Watchlist</button>
              <button className={styles.secondaryButton}>Set Alert</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
