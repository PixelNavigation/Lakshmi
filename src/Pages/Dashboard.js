'use client'

import { useState, useEffect } from 'react'
import styles from './Dashboard.module.css'
import DirectSearch from '../Components/DirectSearch'

export default function Dashboard() {
  const [selectedMarket, setSelectedMarket] = useState('NASDAQ')
  const [watchlist, setWatchlist] = useState([])

  // Market configurations
  const markets = {
    'NASDAQ': { name: 'NASDAQ', currency: 'USD', description: 'US Technology Stocks' },
    'SP500': { name: 'S&P 500', currency: 'USD', description: 'US Large Cap Stocks' },
    'NSE': { name: 'NSE (India)', currency: 'INR', description: 'National Stock Exchange of India' },
    'BSE': { name: 'BSE (India)', currency: 'INR', description: 'Bombay Stock Exchange' },
    'CRYPTO': { name: 'Cryptocurrency', currency: 'USD', description: 'Major Cryptocurrencies' },
    'FTSE': { name: 'FTSE 100 (UK)', currency: 'GBP', description: 'UK Large Cap Stocks' }
  }

  // Load watchlist from localStorage
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('lakshmi_watchlist')
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist))
    }
  }, [])

  // Add to watchlist
  const addToWatchlist = (symbol) => {
    if (!watchlist.includes(symbol)) {
      const newWatchlist = [...watchlist, symbol]
      setWatchlist(newWatchlist)
      localStorage.setItem('lakshmi_watchlist', JSON.stringify(newWatchlist))
    }
  }
  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentGrid}>
        <div className={styles.mainContent}>
          <DirectSearch
            selectedMarket={selectedMarket}
            setSelectedMarket={setSelectedMarket}
            markets={markets}
            watchlist={watchlist}
            addToWatchlist={addToWatchlist}
          />

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
            <h3>📋 Your Watchlist</h3>
            <p>Total items: {watchlist.length}</p>
            {watchlist.length > 0 && (
              <div className={styles.watchlistPreview}>
                {watchlist.slice(0, 5).map(symbol => (
                  <span key={symbol} className={styles.watchlistItem}>{symbol}</span>
                ))}
                {watchlist.length > 5 && <span>+{watchlist.length - 5} more</span>}
              </div>
            )}
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
