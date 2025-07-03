'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import styles from './Dashboard.module.css'
import DirectSearch from '../Components/DirectSearch'
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

// Helper function to format market cap values
function formatMarketCap(marketCap) {
  if (marketCap >= 1e15) {
    return `${(marketCap / 1e15).toFixed(2)}Q` // Quadrillion
  } else if (marketCap >= 1e12) {
    return `${(marketCap / 1e12).toFixed(2)}T` // Trillion
  } else if (marketCap >= 1e9) {
    return `${(marketCap / 1e9).toFixed(2)}B` // Billion
  } else if (marketCap >= 1e6) {
    return `${(marketCap / 1e6).toFixed(2)}M` // Million
  } else if (marketCap >= 1e3) {
    return `${(marketCap / 1e3).toFixed(2)}K` // Thousand
  } else {
    return marketCap.toFixed(2)
  }
}

// Real-time Crypto Trending Widget
function CryptoTrendingWidget() {
  const [trendingCoins, setTrendingCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [usdToInr, setUsdToInr] = useState(83.45)

  const fetchTrendingCrypto = async () => {
    try {
      setLoading(true)
      // Fetch trending cryptocurrencies with real INR prices
      const response = await fetch('/api/crypto-trending')
      const data = await response.json()
      
      if (data.success) {
        setTrendingCoins(data.coins)
        setUsdToInr(data.usdToInr || 83.45)
        setError(null)
      } else {
        throw new Error(data.error || 'Failed to fetch trending crypto')
      }
    } catch (err) {
      console.error('Error fetching trending crypto:', err)
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrendingCrypto()
    // Update every 30 seconds
    const interval = setInterval(fetchTrendingCrypto, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && trendingCoins.length === 0) {
    return (
      <div className={styles.cryptoTrendingContainer}>
        <div className={styles.cryptoHeader}>
          <h3>🚀 Trending Coins</h3>
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot}>●</span> Loading...
          </div>
        </div>
        <div className={styles.cryptoLoadingGrid}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className={styles.cryptoLoadingCard}>
              <div className={styles.loadingShimmer}></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.cryptoTrendingContainer}>
      <div className={styles.cryptoHeader}>
        <h3>🚀 Trending Coins</h3>
        <div className={styles.liveIndicator}>
          <span className={styles.liveDot}>●</span> LIVE • USD/INR: ₹{usdToInr.toFixed(2)}
        </div>
      </div>
      
      <div className={styles.cryptoTrendingGrid}>
        {trendingCoins.slice(0, 6).map((coin) => (
          <div key={coin.id} className={styles.cryptoTrendingCard}>
            <div className={styles.cryptoInfo}>
              <div className={styles.cryptoIcon}>
                {coin.symbol.charAt(0)}
              </div>
              <div className={styles.cryptoDetails}>
                <div className={styles.cryptoSymbol}>{coin.symbol}</div>
                <div className={styles.cryptoName}>{coin.name}</div>
              </div>
            </div>
            
            <div className={styles.cryptoPriceSection}>
              <div className={styles.cryptoPrice}>
                ₹{coin.price_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
            </div>
            
            <div className={styles.cryptoMetrics}>
              <div className={styles.cryptoHighLow}>
                <div className={styles.highLowItem}>
                  <span className={styles.highLowLabel}>24h High:</span>
                  <span className={styles.highValue}>₹{(coin.day_high_inr || coin.high_24h)?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 'N/A'}</span>
                </div>
                <div className={styles.highLowItem}>
                  <span className={styles.highLowLabel}>24h Low:</span>
                  <span className={styles.lowValue}>₹{(coin.day_low_inr || coin.low_24h)?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {error && (
        <div className={styles.cryptoError}>
          Failed to load live data. Showing cached prices.
        </div>
      )}
    </div>
  )
}

function CryptoIndicesWidget() {
  return (
    <div className={styles.cryptoIndicesContainer}>
      <CryptoTrendingWidget />
    </div>
  )
}

// New: Crypto Market Overview (TradingView widget for crypto)
function CryptoMarketOverview() {
  // Example static data for the metrics
  const metrics = [
    {
      title: 'Market Cap',
      value: '$3.29T',
      change: '+0.34%',
      chart: true,
      chartColor: '#4caf50',
    },
    {
      title: 'CMC100',
      value: '$202.58',
      change: '+0.49%',
      chart: true,
      chartColor: '#4caf50',
    },
    {
      title: 'Fear & Greed',
      value: '49',
      sub: 'Neutral',
      gauge: true,
    },
    {
      title: 'Altcoin Season',
      value: '20',
      sub: '/100',
      bar: true,
    },
  ]
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1.5rem',
      marginTop: '1rem',
      background: '#181c20',
      borderRadius: '16px',
      padding: '2rem 1.5rem',
      justifyContent: 'flex-start',
    }}>
      {metrics.map((m, i) => (
        <div key={i} style={{
          background: '#23272f',
          borderRadius: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          padding: '1.2rem 1.5rem',
          minWidth: '200px',
          maxWidth: '240px',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          flex: '1 1 220px',
        }}>
          <div style={{fontWeight:'bold', fontSize:'1.1rem', marginBottom:'0.2rem'}}>{m.title}</div>
          <div style={{fontSize:'1.5rem', fontWeight:'bold', marginBottom:'0.2rem'}}>{m.value}{m.sub && <span style={{fontSize:'1rem', color:'#aaa'}}> {m.sub}</span>}</div>
          {m.change && <div style={{fontSize:'1rem', marginBottom:'0.2rem', color: '#4caf50'}}>{m.change}</div>}
          {/* Simple chart/gauge/bar visuals */}
          {m.chart && (
            <div style={{width:'100%', height:'40px', marginTop:'0.5rem'}}>
              <svg width="100%" height="40" viewBox="0 0 120 40">
                <polyline fill="none" stroke={m.chartColor} strokeWidth="3" points="0,30 20,25 40,28 60,18 80,22 100,10 120,18" />
              </svg>
            </div>
          )}
          {m.gauge && (
            <div style={{width:'100%', marginTop:'0.5rem', display:'flex', flexDirection:'column', alignItems:'center'}}>
              <svg width="90" height="50" viewBox="0 0 90 50">
                <path d="M10,40 Q45,0 80,40" fill="none" stroke="#aaa" strokeWidth="6" />
                <path d="M10,40 Q45,0 80,40" fill="none" stroke="#4caf50" strokeWidth="6" strokeDasharray="0,60,60,0" />
                <circle cx="45" cy="40" r="6" fill="#fff" stroke="#aaa" strokeWidth="2" />
                <circle cx="45" cy="40" r="4" fill="#4caf50" />
                <text x="45" y="47" textAnchor="middle" fontSize="12" fill="#fff">{m.value}</text>
              </svg>
              <div style={{fontSize:'1rem', color:'#fff'}}>{m.sub}</div>
            </div>
          )}
          {m.bar && (
            <div style={{width:'100%', marginTop:'0.5rem'}}>
              <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                <span style={{fontSize:'0.9rem', color:'#ffa726'}}>Bitcoin</span>
                <div style={{flex:'1', height:'8px', background:'#333', borderRadius:'4px', overflow:'hidden'}}>
                  <div style={{width:'20%', height:'100%', background:'#ffa726'}}></div>
                  <div style={{width:'80%', height:'100%', background:'#42a5f5', float:'right'}}></div>
                </div>
                <span style={{fontSize:'0.9rem', color:'#42a5f5'}}>Altcoin</span>
              </div>
            </div>
          )}
        </div>
      ))}
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

  // Debug: Make helper functions available in console (development only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Make functions available globally for debugging
      window.dashboardDebug = {
        displayWatchlist,
        isStockInWatchlist,
        addToWatchlist,
        watchlist,
        refreshWatchlist: loadWatchlistSymbols
      }
      console.log('🛠️ Dashboard Debug Tools Available:')
      console.log('   - window.dashboardDebug.displayWatchlist() - Show current watchlist')
      console.log('   - window.dashboardDebug.isStockInWatchlist(symbol) - Check if stock exists')
      console.log('   - window.dashboardDebug.addToWatchlist(symbol) - Add stock to watchlist')
      console.log('   - window.dashboardDebug.refreshWatchlist() - Reload watchlist from server')
      console.log('   - window.dashboardDebug.watchlist - Current watchlist array')
    }
  }, [watchlist])

  const loadWatchlistSymbols = async () => {
    console.log('📥 Loading user watchlist from database...')
    
    try {
      const headers = {
        'Content-Type': 'application/json'
      }
      
      // Add authorization header if user is authenticated
      if (user?.access_token) {
        headers['Authorization'] = `Bearer ${user.access_token}`
        console.log('🔐 User authenticated, adding authorization header')
      }
      
      const response = await fetch(`/api/user-watchlist?userId=${userId}`, {
        headers
      })
      const result = await response.json()
      
      if (result.success) {
        // Extract just the symbols for the DirectSearch component
        const symbols = result.watchlist.map(item => item.symbol)
        setWatchlist(symbols)
        console.log(`✅ Successfully loaded watchlist with ${symbols.length} stocks`)
        if (symbols.length > 0) {
          console.log('📋 Your watchlist contains:', symbols)
          console.log('💡 Use window.dashboardDebug.displayWatchlist() to see formatted list')
        } else {
          console.log('📭 Your watchlist is currently empty')
          console.log('💡 Search for stocks and add them to your watchlist!')
        }
      } else {
        console.warn('⚠️ Failed to load watchlist:', result.error || 'Unknown error')
      }
    } catch (error) {
      console.error('🚨 Error loading watchlist:', error)
    }
  }

  // Function to refresh data after trades (simplified since we only need to maintain the callback interface)
  const refreshData = () => {
    // The Portfolio and Balance tabs will refresh their own data when navigated to
    console.log('🔄 Trade completed - Portfolio and Balance tabs will show updated data when visited')
  }

  // Helper function to check if a stock is already in watchlist
  const isStockInWatchlist = (symbol) => {
    const exists = watchlist.includes(symbol)
    console.log(`🔍 Checking if "${symbol}" is in watchlist: ${exists ? 'YES' : 'NO'}`)
    return exists
  }

  // Function to display current watchlist
  const displayWatchlist = () => {
    console.log('📋 Current Watchlist:')
    if (watchlist.length === 0) {
      console.log('   📭 Watchlist is empty')
    } else {
      watchlist.forEach((stock, index) => {
        console.log(`   ${index + 1}. ${stock}`)
      })
    }
    return watchlist
  }

  const addToWatchlist = async (symbol) => {
    console.log(`🔍 Attempting to add "${symbol}" to watchlist...`)
    
    // Display current watchlist status
    displayWatchlist()
    
    // Use symbol as-is since we're not using TradingView anymore
    const yahooCompatibleSymbol = symbol
    
    // Check if already adding to prevent duplicate requests
    if (isAddingToWatchlist) {
      console.log('⏳ Already adding a stock to watchlist, please wait...')
      alert('Please wait, already processing a watchlist request...')
      return
    }
    
    // Check if stock is already in watchlist using helper function
    if (isStockInWatchlist(yahooCompatibleSymbol)) {
      console.log(`⚠️ Stock "${symbol}" is already in your watchlist!`)
      alert(`"${symbol}" is already in your watchlist`)
      return
    }
    
    setIsAddingToWatchlist(true)
    console.log(`📡 Sending request to add "${symbol}" to watchlist...`)
    console.log(`👤 User ID: ${userId}`)
    
    try {
      const requestBody = { 
        userId: userId,
        symbol: yahooCompatibleSymbol, // Store Yahoo-compatible symbol
        name: symbol, // Keep original symbol for display name if needed
        action: 'add'
      }
      console.log('📤 Request payload:', requestBody)
      
      const response = await fetch('/api/user-watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      const result = await response.json()
      console.log('📥 Server response:', result)
      
      if (result.success) {
        // Add to local state for immediate UI update
        setWatchlist(prev => {
          const newWatchlist = [...prev, yahooCompatibleSymbol]
          console.log(`Successfully added "${symbol}" to watchlist!`)
          return newWatchlist
        })
        
        // Success alert with console log
        console.log(`🎉 "${symbol}" has been added to your watchlist successfully!`)
        alert(`✅ "${symbol}" has been added to your watchlist.`)
      } else {
        console.error(`❌ Failed to add "${symbol}" to watchlist:`, result.error)
        console.log('🔍 Server response details:', result)
        alert(`❌ Failed to add "${symbol}" to watchlist:\n\n${result.error}`)
      }
    } catch (error) {
      console.error(`🚨 Network error while adding "${symbol}" to watchlist:`, error)
      console.log('🌐 Check your internet connection and try again')
      alert(`🚨 Network error while adding "${symbol}" to watchlist.\n\nPlease check your connection and try again.`)
    } finally {
      setIsAddingToWatchlist(false)
      console.log('🔓 Watchlist operation completed, ready for next request')
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
          onTradeComplete={refreshData}
        />
      </div>

      {/* Show Indian or Crypto Indices based on selection */}
      {selectedMarket === 'INDIAN' && <IndexPriceWidget />}
      {selectedMarket === 'CRYPTO' && (
        <div className={styles.fullWidthCryptoSection}>
          <CryptoIndicesWidget />
        </div>
      )}

      <div className={styles.contentGrid}>
        <div className={styles.mainContent}>
          {/* Show Indian or Crypto Market Overview based on selection */}
          <div className={styles.card}>
            <h3>Market Overview</h3>
            {selectedMarket === 'INDIAN' && (
              <div className={styles.marketIndices}>
                <MarketIndexCard name="NIFTY 50" symbol="NIFTY50" indexKey="NIFTY50" />
                <MarketIndexCard name="SENSEX" symbol="SENSEX" indexKey="SENSEX" />
                <MarketIndexCard name="NIFTY BANK" symbol="BANKNIFTY" indexKey="BANKNIFTY" />
              </div>
            )}
            {selectedMarket === 'CRYPTO' && <CryptoMarketOverview />}
          </div>
        </div>
        <div className={styles.sidebar}>{/* Watchlist or other sidebar content */}</div>
      </div>
    </div>
  )
}
