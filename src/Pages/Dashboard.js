'use client'

import { useState, useEffect } from 'react'
import styles from './Dashboard.module.css'
import DirectSearch from '../Components/DirectSearch'

export default function Dashboard() {
  const [selectedMarket, setSelectedMarket] = useState('ALL')
  const [watchlist, setWatchlist] = useState([])

  const markets = [
    { value: 'ALL', label: 'All Markets' },
    { value: 'NSE', label: 'NSE (India)' },
    { value: 'BSE', label: 'BSE (India)' },
    { value: 'NASDAQ', label: 'NASDAQ' },
    { value: 'NYSE', label: 'NYSE' }
  ]

  // Load watchlist from localStorage
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('stockWatchlist')
    if (savedWatchlist) {
      try {
        setWatchlist(JSON.parse(savedWatchlist))
      } catch (error) {
        console.error('Error loading watchlist:', error)
      }
    }
  }, [])

  const addToWatchlist = (stock) => {
    const updatedWatchlist = [...watchlist, { ...stock, addedAt: new Date().toISOString() }]
    setWatchlist(updatedWatchlist)
    localStorage.setItem('stockWatchlist', JSON.stringify(updatedWatchlist))
  }
  return (
    <div className={styles.pageContainer}>
      {/* Direct Search at the top */}
      <div className={styles.searchSection}>
        <DirectSearch
          selectedMarket={selectedMarket}
          setSelectedMarket={setSelectedMarket}
          markets={markets}
          watchlist={watchlist}
          addToWatchlist={addToWatchlist}
        />
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.mainContent}>
          <div className={styles.card}>
            <h3>Portfolio Performance</h3>
            <div className={styles.performanceGrid}>
              <div className={styles.metric}>
                <span className={styles.metricValue}>$15,420.50</span>
                <span className={styles.metricLabel}>Total Portfolio Value</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricValue}>+$1,240.30</span>
                <span className={styles.metricLabel}>Total Gain/Loss</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricValue}>+8.75%</span>
                <span className={styles.metricLabel}>Total Return</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricValue}>+2.4%</span>
                <span className={styles.metricLabel}>Today's Change</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Recent Transactions</h3>
            <div className={styles.transactionList}>
              <div className={styles.transaction}>
                <span>Bought 10 shares of AAPL</span>
                <span>$1,850.00</span>
              </div>
              <div className={styles.transaction}>
                <span>Sold 5 shares of TSLA</span>
                <span>$1,250.00</span>
              </div>
              <div className={styles.transaction}>
                <span>Bought 20 shares of MSFT</span>
                <span>$6,800.00</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.card}>
            <h3>Quick Actions</h3>
            <div className={styles.actionButtons}>
              <button className={styles.actionBtn}>Add Investment</button>
              <button className={styles.actionBtn}>Run Screen</button>
              <button className={styles.actionBtn}>View Reports</button>
              <button className={styles.actionBtn}>Export Data</button>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Market Summary</h3>
            <div className={styles.marketData}>
              <div className={styles.marketItem}>
                <span>S&P 500</span>
                <span className={styles.positive}>+0.8%</span>
              </div>
              <div className={styles.marketItem}>
                <span>NASDAQ</span>
                <span className={styles.positive}>+1.2%</span>
              </div>
              <div className={styles.marketItem}>
                <span>DOW</span>
                <span className={styles.negative}>-0.3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
