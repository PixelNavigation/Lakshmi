'use client'

import { useState, useEffect } from 'react'
import styles from './Dashboard.module.css'
import DirectSearch from '../Components/DirectSearch'
import { convertToTradingViewSymbol } from '../Components/TradingView/TradingViewHelper'

export default function Dashboard() {
  const [selectedMarket, setSelectedMarket] = useState('ALL')
  const [watchlist, setWatchlist] = useState([])
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false)

  // Mock user ID - in a real app, this would come from authentication
  const userId = 'user123' // Replace with actual user authentication

  const markets = [
    { value: 'ALL', label: 'All Markets' },
    { value: 'NSE', label: 'NSE (India)' },
    { value: 'BSE', label: 'BSE (India)' },
    { value: 'NASDAQ', label: 'NASDAQ' },
    { value: 'NYSE', label: 'NYSE' },
    { value: 'CRYPTO', label: 'Cryptocurrency' }
  ]

  // Load watchlist symbols from Supabase on mount
  useEffect(() => {
    loadWatchlistSymbols()
  }, [])

  const loadWatchlistSymbols = async () => {
    try {
      const response = await fetch(`/api/user-watchlist?userId=${userId}`)
      const result = await response.json()
      
      if (result.success) {
        // Extract just the symbols for the DirectSearch component
        const symbols = result.watchlist.map(item => item.symbol)
        setWatchlist(symbols)
      }
    } catch (error) {
      console.error('Error loading watchlist:', error)
    }
  }

  const addToWatchlist = async (symbol) => {
    // Convert to TradingView-compatible symbol before storing
    const tradingViewSymbol = convertToTradingViewSymbol(symbol)
    
    if (isAddingToWatchlist || watchlist.includes(tradingViewSymbol)) return
    
    setIsAddingToWatchlist(true)
    try {
      const response = await fetch('/api/user-watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId,
          symbol: tradingViewSymbol, // Store TradingView-compatible symbol
          name: symbol, // Keep original symbol for display name if needed
          action: 'add'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Add to local state for immediate UI update
        setWatchlist(prev => [...prev, tradingViewSymbol])
      } else {
        console.error('Failed to add to watchlist:', result.error)
        // Show error to user if needed
        alert(`Failed to add ${symbol} to watchlist: ${result.error}`)
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      alert('Network error while adding to watchlist')
    } finally {
      setIsAddingToWatchlist(false)
    }
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
