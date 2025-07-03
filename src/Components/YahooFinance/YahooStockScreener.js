'use client'

import { useState, useEffect } from 'react'
import styles from './YahooComponents.module.css'

export default function YahooStockScreener() {
  const [screenedStocks, setScreenedStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('topGainers')

  useEffect(() => {
    const fetchScreenedStocks = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // You'll need to create this endpoint that returns pre-screened stock lists
        // For now, we'll simulate the API response with placeholder data
        // const response = await fetch(`/api/stock-screener?type=${activeTab}`)
        // const data = await response.json()
        
        // Simulate API response with placeholder data
        const mockData = {
          success: true,
          data: {
            topGainers: generateMockStocks('gainer', 10),
            topLosers: generateMockStocks('loser', 10),
            highVolume: generateMockStocks('volume', 10),
            undervalued: generateMockStocks('undervalued', 10)
          }
        }
        
        // if (data.success && data.data) {
        //   setScreenedStocks(data.data[activeTab] || [])
        // } else {
        //   throw new Error(data.error || 'Failed to fetch screened stocks')
        // }
        
        // Use mock data until API is implemented
        setScreenedStocks(mockData.data[activeTab] || [])
      } catch (err) {
        console.error(`Error fetching screened stocks for ${activeTab}:`, err)
        setError('Unable to load screener data')
        setScreenedStocks([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchScreenedStocks()
  }, [activeTab])

  // Generate mock data for demonstration
  const generateMockStocks = (type, count) => {
    const stocks = [
      { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.' },
      { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.' },
      { symbol: 'INFY', name: 'Infosys Ltd.' },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.' },
      { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.' },
      { symbol: 'SBIN', name: 'State Bank of India' },
      { symbol: 'HDFC', name: 'Housing Dev Finance Corp.' },
      { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.' },
      { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd.' }
    ]
    
    return stocks.map((stock, index) => {
      let price, change, changePercent, peRatio, marketCap, volume
      
      switch(type) {
        case 'gainer':
          change = (Math.random() * 5 + 1).toFixed(2)
          changePercent = (Math.random() * 8 + 2).toFixed(2)
          break
        case 'loser':
          change = -(Math.random() * 5 + 1).toFixed(2)
          changePercent = -(Math.random() * 8 + 2).toFixed(2)
          break
        case 'volume':
          volume = Math.floor(Math.random() * 10000000) + 5000000
          change = (Math.random() * 10 - 5).toFixed(2)
          changePercent = (Math.random() * 10 - 5).toFixed(2)
          break
        case 'undervalued':
          peRatio = (Math.random() * 10 + 5).toFixed(2)
          change = (Math.random() * 2 - 1).toFixed(2)
          changePercent = (Math.random() * 2 - 1).toFixed(2)
          break
      }
      
      price = Math.floor(Math.random() * 5000) + 100
      peRatio = peRatio || (Math.random() * 30 + 10).toFixed(2)
      marketCap = Math.floor(Math.random() * 500000) + 10000
      volume = volume || Math.floor(Math.random() * 1000000) + 100000
      
      return {
        ...stock,
        price,
        change,
        changePercent,
        peRatio,
        marketCap,
        volume
      }
    })
  }

  // Format price with commas and decimal places
  const formatPrice = (price) => {
    if (price === null || price === undefined) return '-'
    return price.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    })
  }

  // Format large numbers with appropriate suffixes
  const formatValue = (value) => {
    if (value === undefined || value === null) return '-'
    
    // Format as currency with crore/lakh notation for large numbers
    if (value >= 10000000) { // 1 crore = 10,000,000
      return `₹${(value / 10000000).toFixed(2)} Cr`
    } else if (value >= 100000) { // 1 lakh = 100,000
      return `₹${(value / 100000).toFixed(2)} L`
    } else {
      return value.toLocaleString('en-IN')
    }
  }

  // Determine color based on change
  const getChangeColor = (change) => {
    if (change > 0) return styles.positive
    if (change < 0) return styles.negative
    return styles.neutral
  }

  const tabs = [
    { id: 'topGainers', label: 'Top Gainers' },
    { id: 'topLosers', label: 'Top Losers' },
    { id: 'highVolume', label: 'High Volume' },
    { id: 'undervalued', label: 'Undervalued' }
  ]

  return (
    <div className={styles.screenerWidget}>
      <div className={styles.screenerHeader}>
        <h3>Indian Stock Screener</h3>
      </div>
      
      <div className={styles.screenerTabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {loading ? (
        <div className={styles.loading}>Loading screened stocks...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <div className={styles.screenerResults}>
          <table className={styles.screenerTable}>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Company</th>
                <th>Price</th>
                <th>Change</th>
                <th>P/E Ratio</th>
                <th>Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {screenedStocks.length > 0 ? (
                screenedStocks.map((stock) => (
                  <tr key={stock.symbol}>
                    <td>{stock.symbol}</td>
                    <td>{stock.name}</td>
                    <td>₹{formatPrice(stock.price)}</td>
                    <td className={getChangeColor(stock.change)}>
                      {stock.change > 0 ? '+' : ''}{formatPrice(stock.change)} 
                      ({stock.changePercent > 0 ? '+' : ''}{stock.changePercent}%)
                    </td>
                    <td>{stock.peRatio}</td>
                    <td>{formatValue(stock.marketCap)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className={styles.noResultsCell}>
                    No stocks found matching the criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      <div className={styles.screenerFooter}>
        <p className={styles.disclaimerText}>
          Data is simulated and for demonstration purposes only.
          In production, connect to a real stock screening API.
        </p>
      </div>
    </div>
  )
}
