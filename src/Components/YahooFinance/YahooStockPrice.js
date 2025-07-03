'use client'

import { useState, useEffect } from 'react'
import styles from './YahooComponents.module.css'

export default function YahooStockPrice({ symbol, showDetails = false }) {
  const [stockData, setStockData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Fetch stock data from Yahoo Finance API
  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/yahoo-finance?symbol=${symbol}&timeframe=live`)
        const result = await response.json()
        
        if (result.success) {
          setStockData(result.data)
          setLastUpdated(new Date())
          setError(null)
        } else {
          throw new Error(result.error || 'Failed to fetch stock data')
        }
      } catch (err) {
        console.error(`Error fetching data for ${symbol}:`, err)
        setError('Unable to load real-time data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchStockData()
    
    // Update data every minute
    const intervalId = setInterval(() => {
      fetchStockData()
    }, 60000) // 60 seconds
    
    return () => clearInterval(intervalId)
  }, [symbol])

  // Format price with commas and decimal places
  const formatPrice = (price) => {
    if (price === undefined || price === null) return '-'
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
    <div className={styles.priceWidget}>
      {loading ? (
        <div className={styles.loading}>Loading price data...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : stockData ? (
        <div className={styles.priceContainer}>
          <div className={styles.priceHeader}>
            <h3>{symbol}</h3>
            <span className={styles.timeStamp}>{stockData.time}</span>
          </div>
          
          <div className={styles.priceMain}>
            <div className={styles.currentPrice}>
              ₹{formatPrice(stockData.price)}
            </div>
            
            <div className={`${styles.priceChange} ${getChangeColor(stockData.change)}`}>
              <span>
                {stockData.change > 0 ? '+' : ''}{formatPrice(stockData.change)} 
                ({stockData.changePercent > 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
          
          {showDetails && (
            <div className={styles.priceDetails}>
              <div className={styles.detailRow}>
                <span>Open</span>
                <span>₹{formatPrice(stockData.open)}</span>
              </div>
              <div className={styles.detailRow}>
                <span>High</span>
                <span>₹{formatPrice(stockData.dayHigh)}</span>
              </div>
              <div className={styles.detailRow}>
                <span>Low</span>
                <span>₹{formatPrice(stockData.dayLow)}</span>
              </div>
              <div className={styles.detailRow}>
                <span>Prev Close</span>
                <span>₹{formatPrice(stockData.previousClose)}</span>
              </div>
              <div className={styles.detailRow}>
                <span>Volume</span>
                <span>{stockData.volume?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.noData}>No data available</div>
      )}
    </div>
  )
}
