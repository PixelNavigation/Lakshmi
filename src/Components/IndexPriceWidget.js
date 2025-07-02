'use client'

import { useState, useEffect } from 'react'
import styles from './IndexPriceWidget.module.css'

export default function IndexPriceWidget() {
  const [indices, setIndices] = useState([
    { 
      name: 'NIFTY 50', 
      symbol: 'NIFTY50',
      value: null, 
      change: null, 
      changePercent: null,
      time: null,
      isLoading: true 
    },
    { 
      name: 'SENSEX', 
      symbol: 'SENSEX',
      value: null, 
      change: null, 
      changePercent: null,
      time: null,
      isLoading: true 
    },
    { 
      name: 'NIFTY BANK', 
      symbol: 'BANKNIFTY',
      value: null, 
      change: null, 
      changePercent: null,
      time: null,
      isLoading: true 
    }
  ])
  const [lastUpdated, setLastUpdated] = useState(null)

  // Function to fetch index data
  const fetchIndicesData = async () => {
    let updatedIndices = [...indices]
    
    for (let i = 0; i < updatedIndices.length; i++) {
      try {
        const response = await fetch(`/api/yahoo-finance?symbol=${updatedIndices[i].symbol}&timeframe=live`)
        const result = await response.json()
        
        if (result.success) {
          updatedIndices[i] = {
            ...updatedIndices[i],
            value: result.data.price,
            change: result.data.change,
            changePercent: result.data.changePercent,
            time: result.data.time,
            isLoading: false
          }
        }
      } catch (error) {
        console.error(`Error fetching data for ${updatedIndices[i].symbol}:`, error)
      }
    }
    
    setIndices(updatedIndices)
    setLastUpdated(new Date())
  }

  // Fetch data on mount and set interval
  useEffect(() => {
    fetchIndicesData()
    
    // Update every minute
    const interval = setInterval(() => {
      fetchIndicesData()
    }, 60000) // 60 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Format functions
  const formatPrice = (price) => {
    if (price === null) return '---'
    return price.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    })
  }
  
  const formatChange = (change) => {
    if (change === null) return '---'
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)}`
  }
  
  const formatPercent = (percent) => {
    if (percent === null) return '---'
    const sign = percent >= 0 ? '+' : ''
    return `${sign}${percent.toFixed(2)}%`
  }

  return (
    <div className={styles.indexPriceWidgetContainer}>
      <div className={styles.indexPriceWidgetHeader}>
        <h3>Market Indices</h3>
        <div className={styles.liveIndicator}>
          <span className={styles.liveDot}>●</span> LIVE
        </div>
      </div>
      
      <div className={styles.indicesGrid}>
        {indices.map((index, i) => (
          <div key={i} className={styles.indexCard}>
            <div className={styles.indexName}>{index.name}</div>
            
            {index.isLoading ? (
              <div className={styles.indexLoading}>Loading...</div>
            ) : (
              <>
                <div className={styles.indexValue}>{formatPrice(index.value)}</div>
                <div className={`${styles.indexChange} ${index.change >= 0 ? styles.positive : styles.negative}`}>
                  {formatChange(index.change)} ({formatPercent(index.changePercent)})
                </div>
                <div className={styles.indexTime}>
                  {index.time || 'Updating...'}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      
      {lastUpdated && (
        <div className={styles.lastUpdated}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
