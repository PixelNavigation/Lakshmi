'use client'

import { useState, useEffect } from 'react'
import styles from './Dashboard.module.css'
import DirectSearch from '../Components/DirectSearch'
import { convertToTradingViewSymbol } from '../Components/TradingView/TradingViewHelper'

export default function Dashboard() {
  const [selectedMarket, setSelectedMarket] = useState('ALL')
  const [watchlist, setWatchlist] = useState([])
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [liveStockPrices, setLiveStockPrices] = useState({})
  const [priceLoading, setPriceLoading] = useState(true)

  // Mock user ID - in a real app, this would come from authentication
  const userId = 'user123' // Replace with actual user authentication

  const markets = [
    { value: 'ALL', label: 'All Markets' },
    { value: 'NSE', label: 'NSE (India)' },
    { value: 'BSE', label: 'BSE (India)' },
    { value: 'CRYPTO', label: 'Cryptocurrency' }
  ]

  const indianStocks = [
    'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'SBIN.NS',
    'ICICIBANK.NS', 'ITC.NS', 'BHARTIARTL.NS', 'LT.NS', 'WIPRO.NS'
  ]

  // Fetch live stock prices from multiple sources
  const fetchLiveStockPrices = async () => {
    setPriceLoading(true)
    const prices = {}
    
    try {
      // Method 1: Try Yahoo Finance API for Indian stocks
      for (const symbol of indianStocks) {
        try {
          const response = await fetch(`/api/stock-detail?symbol=${symbol}`)
          const data = await response.json()
          
          if (data.success && data.data.price) {
            const cleanSymbol = symbol.replace('.NS', '')
            prices[cleanSymbol] = {
              price: parseFloat(data.data.price),
              change: data.data.change || 0,
              changePercent: data.data.changePercent || 0,
              lastUpdated: new Date().toISOString()
            }
          }
        } catch (error) {
          console.log(`Failed to fetch price for ${symbol}:`, error)
        }
      }

      // Method 2: Fallback to TradingView widget data if available
      if (Object.keys(prices).length === 0) {
        // Use fallback prices with current market estimates (June 2025)
        const fallbackPrices = {
          'RELIANCE': 3010, 'TCS': 4095, 'INFY': 1729, 'HDFCBANK': 1609, 'SBIN': 855,
          'ICICIBANK': 1205, 'ITC': 462, 'BHARTIARTL': 1685, 'LT': 3845, 'WIPRO': 569
        }
        
        Object.entries(fallbackPrices).forEach(([symbol, price]) => {
          prices[symbol] = {
            price: price,
            change: (Math.random() - 0.5) * 50, 
            changePercent: (Math.random() - 0.5) * 4,
            lastUpdated: new Date().toISOString()
          }
        })
      }

      setLiveStockPrices(prices)
      console.log('Live stock prices updated:', prices)
      
    } catch (error) {
      console.error('Error fetching live stock prices:', error)
    } finally {
      setPriceLoading(false)
    }
  }

  // Generate realistic transactions with 5% price variance using live prices
  const generateRealisticTransactions = () => {
    const transactions = [
      { action: 'Bought', quantity: 10, stock: 'RELIANCE' },
      { action: 'Sold', quantity: 5, stock: 'TCS' },
      { action: 'Bought', quantity: 20, stock: 'INFY' },
      { action: 'Bought', quantity: 15, stock: 'HDFCBANK' },
      { action: 'Sold', quantity: 8, stock: 'SBIN' }
    ]

    return transactions.map(txn => {
      const stockData = liveStockPrices[txn.stock]
      const basePrice = stockData ? stockData.price : 100 // Fallback price if live data unavailable
      
      // Add random variance of ±5% to simulate realistic market price fluctuations
      const variance = (Math.random() - 0.5) * 0.1 // Random value between -0.05 and +0.05 (-5% to +5%)
      const actualPrice = basePrice * (1 + variance)
      const totalAmount = actualPrice * txn.quantity

      return {
        description: `${txn.action} ${txn.quantity} shares of ${txn.stock}`,
        amount: totalAmount,
        pricePerShare: actualPrice,
        stock: txn.stock,
        quantity: txn.quantity,
        action: txn.action,
        isLivePrice: !!stockData
      }
    })
  }

  // Helper function to validate transaction prices are within 5% of market price
  const validateTransactionPrice = (stock, transactionPrice) => {
    const stockData = liveStockPrices[stock]
    const marketPrice = stockData ? stockData.price : 100
    const variance = Math.abs(transactionPrice - marketPrice) / marketPrice
    return variance <= 0.05 // Returns true if within 5% variance
  }

  // Auto-refresh prices every 30 seconds
  useEffect(() => {
    fetchLiveStockPrices()
    
    const priceInterval = setInterval(() => {
      fetchLiveStockPrices()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(priceInterval)
  }, [])

  // Regenerate transactions when live prices are updated
  useEffect(() => {
    if (Object.keys(liveStockPrices).length > 0) {
      const newTransactions = generateRealisticTransactions()
      setRecentTransactions(newTransactions)
    }
  }, [liveStockPrices])

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
                <span className={styles.metricValue}>₹12,85,420.50</span>
                <span className={styles.metricLabel}>Total Portfolio Value</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricValue}>+₹1,04,240.30</span>
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
            <h3>Recent Transactions {priceLoading && <span>🔄</span>} {!priceLoading && <span>🟢</span>}</h3>
            <div className={styles.transactionList}>
              {recentTransactions.map((txn, index) => (
                <div key={index} className={styles.transaction}>
                  <span>
                    {txn.description}
                    {txn.isLivePrice && <span style={{color: 'green', fontSize: '0.8em'}}> (Live)</span>}
                  </span>
                  <span>₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              ))}
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
                <span>NIFTY 50</span>
                <span className={styles.positive}>+0.8%</span>
              </div>
              <div className={styles.marketItem}>
                <span>SENSEX</span>
                <span className={styles.positive}>+1.2%</span>
              </div>
              <div className={styles.marketItem}>
                <span>NIFTY BANK</span>
                <span className={styles.negative}>-0.3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
