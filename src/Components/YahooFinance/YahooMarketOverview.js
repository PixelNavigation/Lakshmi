'use client'

import { useState, useEffect } from 'react'
import styles from './YahooComponents.module.css'

export default function YahooMarketOverview({ viewType = 'overview' }) {
  const [marketData, setMarketData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState(viewType)

  useEffect(() => {
    const fetchMarketOverview = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Define key Indian market indices to track with approximate weights
        const indices = [
          { symbol: '^NSEI', name: 'NIFTY 50', weight: 1.0 },
          { symbol: '^BSESN', name: 'SENSEX', weight: 1.0 },
          { symbol: '^NSEBANK', name: 'BANK NIFTY', weight: 0.8 },
          { symbol: '^CNXIT', name: 'NIFTY IT', weight: 0.7 },
          { symbol: '^CNXPHARMA', name: 'NIFTY PHARMA', weight: 0.6 },
          { symbol: '^CNXAUTO', name: 'NIFTY AUTO', weight: 0.6 },
          { symbol: '^CNXFMCG', name: 'NIFTY FMCG', weight: 0.5 },
          { symbol: '^CNXMETAL', name: 'NIFTY METAL', weight: 0.5 },
          { symbol: '^CNXREALTY', name: 'NIFTY REALTY', weight: 0.4 },
          { symbol: '^CNXENERGY', name: 'NIFTY ENERGY', weight: 0.6 },
          { symbol: '^CNXINFRA', name: 'NIFTY INFRA', weight: 0.5 },
          { symbol: '^CNXMEDIA', name: 'NIFTY MEDIA', weight: 0.3 }
        ]
        
        // Fetch data for each index
        const fetchPromises = indices.map(async (index) => {
          try {
            const response = await fetch(`/api/yahoo-finance?symbol=${index.symbol}&timeframe=live`)
            const result = await response.json()
            
            if (result.success) {
              return {
                ...index,
                ...result.data
              }
            } else {
              console.warn(`Failed to fetch data for ${index.name}:`, result.error)
              return {
                ...index,
                price: null,
                change: null,
                changePercent: null,
                error: result.error
              }
            }
          } catch (err) {
            console.error(`Error fetching data for ${index.name}:`, err)
            return {
              ...index,
              price: null,
              change: null,
              changePercent: null,
              error: err.message
            }
          }
        })
        
        const results = await Promise.all(fetchPromises)
        setMarketData(results)
      } catch (err) {
        console.error('Error fetching market overview data:', err)
        setError('Unable to load market data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchMarketOverview()
    
    // Refresh data every 5 minutes
    const intervalId = setInterval(fetchMarketOverview, 300000)
    
    return () => clearInterval(intervalId)
  }, [])

  // Format price with commas and decimal places
  const formatPrice = (price) => {
    if (price === null || price === undefined) return '-'
    return price.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    })
  }

  // Determine color based on change
  const getChangeColor = (change) => {
    if (change > 0) return styles.positive
    if (change < 0) return styles.negative
    return styles.neutral
  }

  return (
    <div className={styles.marketOverviewWidget}>
      <div className={styles.marketHeader}>
        <h3>Indian Market Overview</h3>
        <div className={styles.viewTabs}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'overview' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'heatmap' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('heatmap')}
          >
            Heatmap
          </button>
        </div>
        <span className={styles.lastUpdated}>
          Last updated: {new Date().toLocaleTimeString('en-IN')}
        </span>
      </div>
      
      {loading ? (
        <div className={styles.loading}>Loading market data...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : activeTab === 'overview' ? (
        <div className={styles.indicesGrid}>
          {marketData.map((index) => (
            <div key={index.symbol} className={styles.indexCard}>
              <div className={styles.indexName}>{index.name}</div>
              
              {index.error ? (
                <div className={styles.indexError}>Data unavailable</div>
              ) : (
                <>
                  <div className={styles.indexPrice}>₹{formatPrice(index.price)}</div>
                  <div className={`${styles.indexChange} ${getChangeColor(index.change)}`}>
                    {index.change > 0 ? '+' : ''}{formatPrice(index.change)} 
                    ({index.changePercent > 0 ? '+' : ''}{index.changePercent?.toFixed(2)}%)
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.heatmapContainer}>
          <div className={styles.heatmapGrid}>
            {marketData.map((index) => {
              // Calculate intensity based on change percent (for color gradient)
              const intensity = Math.min(Math.abs(index.changePercent || 0) / 5, 1);
              const isPositive = (index.changePercent || 0) >= 0;
              
              // Generate color style based on change direction and intensity
              const colorStyle = {
                backgroundColor: isPositive
                  ? `rgba(0, 128, 0, ${0.2 + intensity * 0.8})` // Green with intensity
                  : `rgba(220, 0, 0, ${0.2 + intensity * 0.8})`, // Red with intensity
                // Size proportional to market cap or trading volume (using index weight as proxy)
                width: `${80 + (index.weight || 0) * 20}px`,
                height: `${80 + (index.weight || 0) * 20}px`,
              };
              
              return (
                <div key={index.symbol} className={styles.heatmapTile} style={colorStyle}>
                  <div className={styles.tileContent}>
                    <div className={styles.tileName}>{index.name}</div>
                    <div className={styles.tileValue}>
                      {index.changePercent?.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )
}
