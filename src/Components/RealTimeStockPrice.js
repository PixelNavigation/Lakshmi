'use client'

import { useState, useEffect } from 'react'
import styles from './RealTimeStockPrice.module.css'

export default function RealTimeStockPrice({ symbol, displayName, compact = false }) {
  const [stockData, setStockData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Fetch stock data with time information
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

  // Initial fetch and setup interval for real-time updates
  useEffect(() => {
    fetchStockData()
    
    // Update data every minute
    const intervalId = setInterval(() => {
      fetchStockData()
    }, 60000) // 60 seconds
    
    return () => clearInterval(intervalId)
  }, [symbol])

  // Format price with commas and decimal places
  const formatPrice = (price) => {
    return price?.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }) || '0.00'
  }

  // Format percent change
  const formatChange = (change) => {
    if (change === undefined || change === null) return '0.00%'
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)}%`
  }

  if (loading && !stockData) {
    return (
      <div className={compact ? styles.compactCard : styles.stockPriceCard}>
        <div className={compact ? styles.compactName : styles.stockName}>
          {displayName || symbol}
        </div>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  if (error && !stockData) {
    return (
      <div className={compact ? styles.compactCard : styles.stockPriceCard}>
        <div className={compact ? styles.compactName : styles.stockName}>
          {displayName || symbol}
        </div>
        <div className={styles.error}>{error}</div>
      </div>
    )
  }

  const isPositive = stockData?.change >= 0

  // Compact mode for watchlist
  if (compact) {
    return (
      <div className={styles.compactCard}>
        <div className={styles.compactPrice}>
          ₹{formatPrice(stockData?.price)}
        </div>
        <div className={`${styles.compactChange} ${isPositive ? styles.positive : styles.negative}`}>
          {stockData?.change ? formatChange(stockData?.changePercent) : '0.00%'}
        </div>
        <div className={styles.compactTime}>
          <div className={styles.liveIndicator}>●</div>
          <span>{stockData?.time || 'Live'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.stockPriceCard}>
      <div className={styles.stockHeader}>
        <div className={styles.stockName}>{displayName || symbol}</div>
        <div className={styles.timeInfo}>
          <div className={styles.liveIndicator}>●</div>
          <div className={styles.updateTime}>
            {stockData?.time || 'Unknown'}
          </div>
        </div>
      </div>
      
      <div className={styles.priceContainer}>
        <div className={styles.currentPrice}>
          ₹{formatPrice(stockData?.price)}
        </div>
        <div className={`${styles.priceChange} ${isPositive ? styles.positive : styles.negative}`}>
          {stockData?.change ? formatChange(stockData?.changePercent) : '0.00%'}
        </div>
      </div>
      
      <div className={styles.additionalInfo}>
        <div className={styles.infoRow}>
          <span>Open:</span>
          <span>₹{formatPrice(stockData?.open)}</span>
        </div>
        <div className={styles.infoRow}>
          <span>High:</span>
          <span>₹{formatPrice(stockData?.dayHigh)}</span>
        </div>
        <div className={styles.infoRow}>
          <span>Low:</span>
          <span>₹{formatPrice(stockData?.dayLow)}</span>
        </div>
        <div className={styles.infoRow}>
          <span>Prev Close:</span>
          <span>₹{formatPrice(stockData?.previousClose)}</span>
        </div>
      </div>
      
      {lastUpdated && (
        <div className={styles.lastUpdated}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
