'use client'

import { useEffect, useRef, useState } from 'react'
import { TickerTape } from './TickerTape'
import styles from './TradingView.module.css'

export function EnhancedTickerTape({ showTrending = false }) {
  const [activeView, setActiveView] = useState(showTrending ? 'trending' : 'market')
  const [trendingData, setTrendingData] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch trending data if needed
  useEffect(() => {
    if (activeView === 'trending') {
      const fetchTrendingData = async () => {
        setLoading(true)
        try {
          const response = await fetch('/api/crypto-trending')
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.trending) {
              setTrendingData(data.trending)
            }
          }
        } catch (error) {
          console.error('Error fetching trending data:', error)
        } finally {
          setLoading(false)
        }
      }
      
      fetchTrendingData()
    }
  }, [activeView])

  return (
    <div className={styles.enhancedTickerContainer}>
      {/* Tabs for switching between views */}
      <div className={styles.tickerTabs}>
        <button 
          className={`${styles.tickerTab} ${activeView === 'market' ? styles.activeTab : ''}`}
          onClick={() => setActiveView('market')}
        >
          Market
        </button>
        <button 
          className={`${styles.tickerTab} ${activeView === 'trending' ? styles.activeTab : ''}`}
          onClick={() => setActiveView('trending')}
        >
          Trending
        </button>
      </div>

      {/* Content based on active view */}
      {activeView === 'market' ? (
        <TickerTape />
      ) : (
        <div className={styles.trendingContainer}>
          {loading ? (
            <div className={styles.loadingIndicator}>Loading trending data...</div>
          ) : trendingData.length > 0 ? (
            <div className={styles.trendingTape}>
              {trendingData.map((item, index) => (
                <div key={`trending-${index}`} className={styles.trendingItem}>
                  <span className={styles.trendingRank}>#{item.rank}</span>
                  <span className={styles.trendingSymbol}>{item.symbol}</span>
                  <span className={styles.trendingName}>{item.name}</span>
                  <span className={styles.trendingPrice}>${item.price?.toLocaleString(undefined, { 
                    maximumFractionDigits: 2, 
                    minimumFractionDigits: 2 
                  })}</span>
                  <span className={`${styles.trendingChange} ${item.change24h >= 0 ? styles.positive : styles.negative}`}>
                    {item.change24h >= 0 ? '+' : ''}{item.change24h?.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noData}>No trending data available</div>
          )}
        </div>
      )}
    </div>
  )
}
