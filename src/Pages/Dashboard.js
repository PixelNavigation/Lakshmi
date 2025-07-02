'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import styles from './Dashboard.module.css'
import DirectSearch from '../Components/DirectSearch'
import { convertToTradingViewSymbol } from '../Components/TradingView/TradingViewHelper'
import RealTimeStockPrice from '../Components/RealTimeStockPrice'
import IndexPriceWidget from '../Components/IndexPriceWidget'
import CandlestickChart from '../Components/CandlestickChart'

// Yahoo Finance Chart Component (replaces TradingView component)
function YahooFinanceChart({ symbol }) {
  const [chartData, setChartData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeframe, setTimeframe] = useState('1m')
  const [interval, setInterval] = useState('1d')
  
  useEffect(() => {
    async function fetchChartData() {
      if (!symbol) return
      
      try {
        setLoading(true)
        const response = await fetch(`/api/yahoo-finance?symbol=${symbol}&timeframe=${timeframe}&interval=${interval}`)
        const data = await response.json()
        
        if (data.success) {
          setChartData(data.data)
          setError(null)
        } else {
          throw new Error(data.error || 'Failed to fetch chart data')
        }
      } catch (err) {
        console.error(`Error fetching chart for ${symbol}:`, err)
        setError('Unable to load chart data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchChartData()
  }, [symbol, timeframe, interval])
  
  if (loading) {
    return <div className={styles.chartLoading}>Loading chart data...</div>
  }
  
  if (error) {
    return <div className={styles.chartError}>{error}</div>
  }
  
  if (!chartData || chartData.length === 0) {
    return <div className={styles.chartError}>No data available</div>
  }
  
  // Use the CandlestickChart component instead of the simple chart
  return (
    <div className={styles.yahooChartContainer}>
      <CandlestickChart 
        symbol={symbol} 
        data={chartData} 
        timeframe={timeframe} 
      />
      <div className={styles.timeframeSelector}>
        <button 
          className={timeframe === '1d' ? styles.activeTimeframe : ''}
          onClick={() => { setTimeframe('1d'); setInterval('15m'); }}
        >
          1D
        </button>
        <button 
          className={timeframe === '5d' ? styles.activeTimeframe : ''}
          onClick={() => { setTimeframe('5d'); setInterval('1h'); }}
        >
          1W
        </button>
        <button 
          className={timeframe === '1m' ? styles.activeTimeframe : ''}
          onClick={() => { setTimeframe('1m'); setInterval('1d'); }}
        >
          1M
        </button>
        <button 
          className={timeframe === '6m' ? styles.activeTimeframe : ''}
          onClick={() => { setTimeframe('6m'); setInterval('1d'); }}
        >
          6M
        </button>
        <button 
          className={timeframe === '1y' ? styles.activeTimeframe : ''}
          onClick={() => { setTimeframe('1y'); setInterval('1d'); }}
        >
          1Y
        </button>
      </div>
    </div>
  )
}

// Market Index Card with Dynamic Data
function MarketIndexCard({ name, symbol, indexKey }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [indexData, setIndexData] = useState(null)

  // Fetch index data on mount
  useEffect(() => {
    fetchIndexData()
  }, [indexKey])

  // Fetch members when expanding for the first time
  useEffect(() => {
    if (isExpanded && members.length === 0 && !loading) {
      fetchIndexMembers()
    }
  }, [isExpanded])

  const fetchIndexData = async () => {
    try {
      // Try to fetch from our backend API first (if available)
      const response = await fetch(`/api/index-data?symbol=${indexKey}`)
      const data = await response.json()
      
      if (data.success) {
        setIndexData({
          name: name,
          value: data.value?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          change: data.change >= 0 ? `+${data.change.toFixed(2)}` : data.change.toFixed(2),
          changePercent: data.change >= 0 ? `+${data.changePercent.toFixed(2)}%` : `${data.changePercent.toFixed(2)}%`,
          isPositive: data.change >= 0
        })
      } else {
        throw new Error('API not available')
      }
    } catch (error) {
      console.log(`Using mock data for ${symbol}`)
      // Generate realistic mock data based on index
      const mockData = generateMockIndexData(indexKey)
      setIndexData({
        name: name,
        value: mockData.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        change: mockData.change >= 0 ? `+${mockData.change.toFixed(2)}` : mockData.change.toFixed(2),
        changePercent: mockData.change >= 0 ? `+${mockData.changePercent.toFixed(2)}%` : `${mockData.changePercent.toFixed(2)}%`,
        isPositive: mockData.change >= 0
      })
    }
  }

  // Generate realistic mock data for demonstration
  const generateMockIndexData = (indexKey) => {
    const baseValues = {
      'NIFTY50': 22000,
      'SENSEX': 72000,
      'BANKNIFTY': 48000
    }
    
    const baseValue = baseValues[indexKey] || 20000
    const randomChange = (Math.random() - 0.5) * 200 // Random change between -100 to +100
    const currentValue = baseValue + randomChange
    const changePercent = (randomChange / baseValue) * 100
    
    return {
      value: currentValue,
      change: randomChange,
      changePercent: changePercent
    }
  }

  const fetchIndexMembers = async () => {
    // Check cache first (localStorage with 24-hour expiry)
    const cacheKey = `index_members_${indexKey}`
    const cached = localStorage.getItem(cacheKey)
    
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000 // 24 hours
      
      if (!isExpired) {
        setMembers(data)
        return
      }
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/index-members?index=${indexKey}`)
      const result = await response.json()
      
      if (result.success) {
        setMembers(result.members)
        // Cache the data
        localStorage.setItem(cacheKey, JSON.stringify({
          data: result.members,
          timestamp: Date.now()
        }))
      }
    } catch (error) {
      console.error('Error fetching index members:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!indexData) {
    return (
      <div className={styles.marketIndexCard}>
        <div className={styles.indexHeader}>
          <div className={styles.indexInfo}>
            <h4 className={styles.indexName}>{name}</h4>
            <div className={styles.indexValue}>Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.marketIndexCard} ${isExpanded ? styles.expanded : ''}`}>
      <div className={styles.indexHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.indexInfo}>
          <h4 className={styles.indexName}>{indexData.name}</h4>
          <div className={styles.indexValue}>{indexData.value}</div>
          <div className={`${styles.indexChange} ${indexData.isPositive ? styles.positive : styles.negative}`}>
            {indexData.change} ({indexData.changePercent})
          </div>
        </div>
        <div className={styles.expandIcon}>
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>
      
      {isExpanded && (
        <div className={styles.indexDetails}>
          <div className={styles.realTimeContainer}>
            <RealTimeStockPrice symbol={indexKey} displayName={name} />
            <YahooFinanceChart symbol={indexKey} />
          </div>
          
          <div className={styles.indexActions}>
            <button 
              className={styles.viewMembersBtn}
              onClick={() => setShowMembers(!showMembers)}
              disabled={loading}
            >
              {loading ? 'Loading...' : showMembers ? 'Hide Members' : 'View Members'}
            </button>
          </div>
          
          {showMembers && (
            <div className={styles.membersContainer}>
              <h5>Top Holdings</h5>
              {loading ? (
                <div className={styles.loadingMembers}>Fetching latest data...</div>
              ) : (
                <div className={styles.membersList}>
                  {members.slice(0, 15).map((member, index) => (
                    <div key={member.symbol} className={styles.memberItem}>
                      <div className={styles.memberRank}>{index + 1}</div>
                      <div className={styles.memberInfo}>
                        <div className={styles.memberName}>{member.name}</div>
                        <div className={styles.memberSymbol}>{member.symbol}</div>
                      </div>
                      <div className={styles.memberWeight}>{member.weight}</div>
                      <div className={styles.memberPrice}>₹{member.price}</div>
                      <div className={`${styles.memberChange} ${member.changePercent.startsWith('+') ? styles.positive : styles.negative}`}>
                        {member.changePercent}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [selectedMarket, setSelectedMarket] = useState('INDIAN')
  const [watchlist, setWatchlist] = useState([])
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false)

  // Mock user ID - in a real app, this would come from authentication
  const userId = user?.id || 'user123' // Fallback for demo purposes

  const markets = [
    { value: 'INDIAN', label: 'Indian Markets (NSE/BSE)' },
    { value: 'CRYPTO', label: 'Cryptocurrency (INR Pairs)' }
  ]

  // Load watchlist symbols from Supabase on mount
  useEffect(() => {
    loadWatchlistSymbols()
  }, [])

  const loadWatchlistSymbols = async () => {
    try {
      const headers = {
        'Content-Type': 'application/json'
      }
      
      // Add authorization header if user is authenticated
      if (user?.access_token) {
        headers['Authorization'] = `Bearer ${user.access_token}`
      }
      
      const response = await fetch(`/api/user-watchlist?userId=${userId}`, {
        headers
      })
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

  // Function to refresh data after trades (simplified since we only need to maintain the callback interface)
  const refreshData = () => {
    // The Portfolio and Balance tabs will refresh their own data when navigated to
    console.log('Trade completed - Portfolio and Balance tabs will show updated data when visited')
  }

  const addToWatchlist = async (symbol) => {
    // Use symbol as-is since we're not using TradingView anymore
    const yahooCompatibleSymbol = symbol
    
    if (isAddingToWatchlist || watchlist.includes(yahooCompatibleSymbol)) return
    
    setIsAddingToWatchlist(true)
    try {
      const response = await fetch('/api/user-watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId,
          symbol: yahooCompatibleSymbol, // Store Yahoo-compatible symbol
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
          onTradeComplete={refreshData} // Pass refresh function
        />
      </div>
      
      {/* Real-time index price widget */}
      <IndexPriceWidget />

      <div className={styles.contentGrid}>
        <div className={styles.mainContent}>
          {/* Market Overview with Yahoo Finance Charts */}
          <div className={styles.card}>
            <h3>Market Overview</h3>
            <div className={styles.marketIndices}>
              <MarketIndexCard 
                name="NIFTY 50"
                symbol="NIFTY50"
                indexKey="NIFTY50"
              />
              <MarketIndexCard 
                name="SENSEX"
                symbol="SENSEX"
                indexKey="SENSEX"
              />
              <MarketIndexCard 
                name="NIFTY BANK"
                symbol="BANKNIFTY"
                indexKey="BANKNIFTY"
              />
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          {/* Watchlist or other sidebar content can go here */}
        </div>
      </div>
    </div>
  )
}
