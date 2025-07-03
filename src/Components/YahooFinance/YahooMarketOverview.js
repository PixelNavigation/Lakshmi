'use client'

import { useState, useEffect } from 'react'
import styles from './YahooComponents.module.css'

export default function YahooMarketOverview() {
  const [marketData, setMarketData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMarketOverview = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Define key Indian market indices to track
        const indices = [
          { symbol: '^NSEI', name: 'NIFTY 50' },
          { symbol: '^BSESN', name: 'SENSEX' },
          { symbol: '^NSEBANK', name: 'BANK NIFTY' },
          { symbol: '^CNXIT', name: 'NIFTY IT' },
          { symbol: '^CNXPHARMA', name: 'NIFTY PHARMA' },
          { symbol: '^CNXAUTO', name: 'NIFTY AUTO' },
          { symbol: '^CNXFMCG', name: 'NIFTY FMCG' },
          { symbol: '^CNXMETAL', name: 'NIFTY METAL' }
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
        <span className={styles.lastUpdated}>
          Last updated: {new Date().toLocaleTimeString('en-IN')}
        </span>
      </div>
      
      {loading ? (
        <div className={styles.loading}>Loading market data...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
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
      )}
    </div>
  )
}
