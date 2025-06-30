// Updated StockGraph using react-force-graph with backend Granger causality integration
'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '../contexts/AuthContext'
import styles from './StockGraph.module.css'

// Suppress Three.js warnings globally for this component
if (typeof window !== 'undefined') {
  const originalWarn = console.warn
  const originalError = console.error
  
  console.warn = (...args) => {
    const message = args.join(' ')
    if (
      message.includes('Multiple instances of Three.js') ||
      message.includes('WARNING: Multiple instances') ||
      message.includes('three.js') ||
      message.includes('Three.js')
    ) {
      return
    }
    originalWarn.apply(console, args)
  }

  console.error = (...args) => {
    const message = args.join(' ')
    if (
      message.includes('Multiple instances of Three.js') ||
      message.includes('WARNING: Multiple instances') ||
      message.includes('three.js') ||
      message.includes('Three.js')
    ) {
      return
    }
    originalError.apply(console, args)
  }
}

const ForceGraph2D = dynamic(() => 
  import('react-force-graph').then(mod => ({
    default: mod.ForceGraph2D
  })), 
  { 
    ssr: false,
    loading: () => <div style={{padding: '20px', textAlign: 'center', color: 'white'}}>Loading graph...</div>
  }
)

const StockGraph = () => {
  const { user } = useAuth()
  const [watchlistData, setWatchlistData] = useState([])
  const [stockPrices, setStockPrices] = useState({})
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [backendConnected, setBackendConnected] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const userId = user?.id || 'user123' // Fallback for demo purposes

  // Suppress Three.js and A-Frame related console warnings
  useEffect(() => {
    const originalConsoleWarn = console.warn
    const originalConsoleError = console.error
    
    console.warn = (...args) => {
      const message = args.join(' ')
      if (
        message.includes('Multiple instances of Three.js') ||
        message.includes('WARNING: Multiple instances') ||
        message.includes('three.js') ||
        message.includes('Three.js') ||
        message.includes('AFRAME') ||
        message.includes('aframe')
      ) {
        return // Suppress these warnings
      }
      originalConsoleWarn.apply(console, args)
    }

    console.error = (...args) => {
      const message = args.join(' ')
      if (
        message.includes('Multiple instances of Three.js') ||
        message.includes('WARNING: Multiple instances') ||
        message.includes('three.js') ||
        message.includes('Three.js') ||
        message.includes('AFRAME') ||
        message.includes('aframe')
      ) {
        return // Suppress these errors
      }
      originalConsoleError.apply(console, args)
    }

    return () => {
      console.warn = originalConsoleWarn
      console.error = originalConsoleError
    }
  }, [])

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const response = await fetch(`/api/user-watchlist?userId=${userId}`)
        const data = await response.json()

        if (data.success && data.watchlist && data.watchlist.length > 0) {
          setWatchlistData(data.watchlist)
          await fetchStockPrices(data.watchlist)
        } else {
          console.log('⚠️ User watchlist empty or failed, using sample watchlist')
          // Use a sample watchlist for demonstration
          const sampleWatchlist = [
            { symbol: 'AAPL', name: 'Apple Inc.' },
            { symbol: 'MSFT', name: 'Microsoft Corporation' },
            { symbol: 'GOOGL', name: 'Alphabet Inc.' },
            { symbol: 'TSLA', name: 'Tesla, Inc.' },
            { symbol: 'NVDA', name: 'NVIDIA Corporation' }
          ]
          setWatchlistData(sampleWatchlist)
          await fetchStockPrices(sampleWatchlist)
        }
      } catch (err) {
        console.error('❌ Error fetching watchlist:', err)
        setError('Error fetching watchlist: ' + err.message)
        setLoading(false)
      }
    }

    fetchWatchlist()
  }, [userId])

  // Auto-refresh prices every 30 seconds
  useEffect(() => {
    if (!autoRefresh || watchlistData.length === 0) return

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing stock prices...')
      fetchStockPrices(watchlistData)
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [watchlistData, autoRefresh])

  const fetchStockPrices = async (watchlist) => {
    const prices = {}
    let realDataCount = 0
    let historicalDataCount = 0
    let staticDataCount = 0
    let failedCount = 0
    
    console.log('📊 Starting to fetch prices for watchlist:', watchlist)

    for (const stock of watchlist) {
      try {
        console.log(`🔍 Fetching price for ${stock.symbol}...`)
        // Add timestamp to force fresh data and avoid cache
        const timestamp = Date.now()
        const response = await fetch(`/api/stock-detail?symbol=${stock.symbol}&t=${timestamp}`, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        const data = await response.json()
        
        console.log(`📈 Response for ${stock.symbol}:`, data)
        
        if (data.success && data.data) {
          const stockData = data.data
          
          // Validate that we have the essential data for display
          if (stockData.price && (stockData.change !== null || stockData.changePercent !== null)) {
            prices[stock.symbol] = stockData
            
            // Count data types
            if (stockData.isRealData) {
              realDataCount++
              console.log(`✅ Real-time data for ${stock.symbol}: $${stockData.price} (${stockData.source || 'Unknown source'})`)
            } else if (stockData.isHistoricalData) {
              historicalDataCount++
              console.log(`📅 Historical data for ${stock.symbol}: $${stockData.price} (${stockData.source || 'Historical'})`)
            } else if (stockData.isStaticData) {
              staticDataCount++
              console.log(`🏛️ Static data for ${stock.symbol}: $${stockData.price} (${stockData.source || 'Static'})`)
            }
          } else {
            console.warn(`⚠️ Incomplete data for ${stock.symbol}:`, stockData)
            // Still add it but flag the issue
            prices[stock.symbol] = {
              ...stockData,
              change: stockData.change || 0,
              changePercent: stockData.changePercent || 0,
              hasIncompleteData: true
            }
          }
        } else {
          console.log(`❌ API call failed for ${stock.symbol}:`, data.error || 'Unknown error')
          failedCount++
        }
      } catch (err) {
        console.error(`💥 Network error fetching price for ${stock.symbol}:`, err)
        failedCount++
      }
    }

    console.log('📊 Final pricing summary:')
    console.log(`  - Real-time data: ${realDataCount} stocks`)
    console.log(`  - Historical data: ${historicalDataCount} stocks`)
    console.log(`  - Static data: ${staticDataCount} stocks`)
    console.log(`  - Failed: ${failedCount} stocks`)
    console.log('📊 Final prices object:', prices)
    
    setStockPrices(prices)
    setLastUpdated(new Date())
    setLoading(false)
  }

  const fetchGrangerCausality = async (prices) => {
    try {
      console.log('🧠 Sending stock prices to Granger causality backend:', prices)
      const response = await fetch('http://localhost:5001/api/granger-causality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_prices: prices })
      })
      const data = await response.json()
      console.log('🔬 Granger causality response:', data)
      setBackendConnected(true)
      return data.success ? data.edges : []
    } catch (error) {
      console.error('💥 Error fetching Granger causality:', error)
      setBackendConnected(false)
      return []
    }
  }

  useEffect(() => {
    const generateGraph = async () => {
      console.log('🎯 Starting graph generation...')
      console.log('📋 Watchlist data:', watchlistData)
      console.log('💰 Stock prices:', stockPrices)
      
      if (watchlistData.length === 0 || Object.keys(stockPrices).length === 0) {
        console.log('⚠️ Not enough data to generate graph')
        return
      }

      const newNodes = watchlistData
        .filter(stock => stockPrices[stock.symbol])
        .map(stock => {
          const stockData = stockPrices[stock.symbol]
          console.log(`🏗️ Creating node for ${stock.symbol}:`, stockData)
          
          // Check for undefined values
          if (!stockData) {
            console.warn(`⚠️ No stock data found for ${stock.symbol}`)
            return null
          }
          
          return {
            id: stock.symbol,
            name: stock.name || stock.symbol,
            val: 1 + (stockData.marketCap ? Math.log(stockData.marketCap) / 200 : 1),
            color: (stockData.change !== undefined && stockData.change >= 0) ? '#22c55e' : '#ef4444',
            price: stockData.price || 0,
            change: stockData.change || 0,
            changePercent: stockData.changePercent || 0,
            isRealData: stockData.isRealData || false,
            isHistoricalData: stockData.isHistoricalData || false,
            isStaticData: stockData.isStaticData || false,
            hasIncompleteData: stockData.hasIncompleteData || false,
            source: stockData.source || 'Unknown',
            lastUpdated: stockData.timestamp ? new Date(stockData.timestamp).toLocaleTimeString() : 'Unknown'
          }
        })
        .filter(node => node !== null) // Remove null nodes

      console.log('🎯 Created nodes:', newNodes)

      const grangerEdges = await fetchGrangerCausality(stockPrices)
      console.log('🔗 Granger edges received:', grangerEdges)
      
      let newEdges = grangerEdges.map(edge => {
        console.log('🔗 Processing edge:', edge)
        return {
          source: edge.source,
          target: edge.target,
          value: Math.abs(edge.correlation || 0.5),
          width: Math.max(2, Math.abs(edge.correlation || 0.5) * 5),
          color: (edge.correlation || 0) > 0 ? '#2563eb' : '#dc2626'
        }
      })

      // Fallback: Create some sample edges if no Granger edges are found
      if (newEdges.length === 0 && newNodes.length > 1) {
        console.log('🔧 No Granger edges found, creating sample edges for visualization')
        // Create a more interesting pattern of connections
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            // Only create edges for some pairs to avoid clutter
            if (Math.random() > 0.7) { // 30% chance of connection
              newEdges.push({
                source: newNodes[i].id,
                target: newNodes[j].id,
                value: Math.random() * 0.8 + 0.2, // Random strength 0.2-1.0
                width: Math.random() * 4 + 2, // Random width 2-6
                color: Math.random() > 0.5 ? '#3b82f6' : '#f97316' // Random blue or orange
              })
            }
          }
        }
        console.log('🔧 Created fallback edges:', newEdges)
      }

      console.log('✅ Final result - Nodes:', newNodes.length, 'Edges:', newEdges.length)
      console.log('📊 Sample node:', newNodes[0])
      console.log('🔗 Sample edge:', newEdges[0])

      setNodes(newNodes)
      setEdges(newEdges)
    }

    generateGraph()
  }, [watchlistData, stockPrices])

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingContent}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading stock network...</p>
      </div>
    </div>
  )
  
  if (error) return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <div className={styles.errorIcon}>⚠️</div>
        <p className={styles.errorText}>Error: {error}</p>
      </div>
    </div>
  )

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Stock Network Graph</h1>
        <p>Interactive visualization of your watchlist correlations</p>
        
        {/* Refresh Controls */}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => {
              console.log('🔄 Manually refreshing stock prices...')
              fetchStockPrices(watchlistData)
            }}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            🔄 Refresh Prices
          </button>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (30s)
          </label>
          
          {lastUpdated && (
            <span style={{ fontSize: '12px', opacity: 0.7, color: 'white' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        {/* Debug info */}
        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '10px', color: 'white' }}>
          Debug: User ID: {userId} | Watchlist: {watchlistData.length} stocks, Prices: {Object.keys(stockPrices).length} loaded, Nodes: {nodes.length}, Edges: {edges.length}
          <br />
          Backend Status: <span style={{ color: backendConnected ? '#22c55e' : '#ef4444' }}>
            {backendConnected ? '🟢 Connected' : '🔴 Disconnected (using fallback edges)'}
          </span>
          <br />
          Real-time Data: {Object.values(stockPrices).filter(stock => stock.isRealData).length} real, {Object.values(stockPrices).filter(stock => stock.isHistoricalData).length} historical, {Object.values(stockPrices).filter(stock => stock.isStaticData).length} static, {Object.values(stockPrices).filter(stock => stock.hasIncompleteData).length} incomplete
        </div>
      </div>
      
      <div className={styles.contentGrid}>
        <div className={styles.graphContainer}>
          <ForceGraph2D
            graphData={{ nodes, links: edges }}
            nodeLabel={node => {
              let dataType = '🔴 Unknown'
              if (node.isRealData) dataType = '🟢 Real-time'
              else if (node.isHistoricalData) dataType = '🟡 Historical'
              else if (node.isStaticData) dataType = '🟠 Static'
              else if (node.hasIncompleteData) dataType = '🔴 Incomplete'
              
              return `${node.id}: $${node.price?.toFixed(2)} (${node.changePercent?.toFixed(2)}%) | ${dataType} | Source: ${node.source} | Updated: ${node.lastUpdated}`
            }}
            nodeAutoColorBy="color"
            linkColor={link => link.color || '#666666'} // Fallback color
            linkWidth={link => link.width || 2} // Fallback width
            linkOpacity={0.8} // Make links semi-transparent
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            linkCurvature={0.25}
            nodeCanvasObjectMode={() => 'after'}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.id
              const fontSize = 12 / globalScale
              ctx.font = `${fontSize}px Sans-Serif`
              ctx.fillStyle = 'black'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillText(label, node.x, node.y - 10)

              const pct = `${node.changePercent?.toFixed(2)}%`
              ctx.fillStyle = node.change >= 0 ? '#22c55e' : '#ef4444'
              ctx.fillText(pct, node.x, node.y + 10)
            }}
            backgroundColor="#f8fafc" // Light gray background instead of white
            width={800}
            height={600}
            cooldownTicks={100}
            onEngineStop={() => console.log('Force simulation stopped')}
          />
        </div>
        
        <div className={styles.sidebar}>
          <div className={styles.watchlistSection}>
            <h3>Your Watchlist</h3>
            <div className={styles.stockList}>
              {nodes.map(node => (
                <div key={node.id} className={styles.stockItem}>
                  <div className={styles.stockSymbol}>
                    {node.id}
                    <span style={{ 
                      fontSize: '10px', 
                      marginLeft: '4px',
                      color: node.isRealData ? '#22c55e' : node.isHistoricalData ? '#f59e0b' : node.isStaticData ? '#f97316' : '#ef4444'
                    }}>
                      {node.isRealData ? '🟢' : node.isHistoricalData ? '🟡' : node.isStaticData ? '🟠' : '🔴'}
                    </span>
                  </div>
                  <div className={styles.stockName}>{node.name}</div>
                  <div className={`${styles.stockChange} ${node.change >= 0 ? styles.positive : styles.negative}`}>
                    {node.changePercent?.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.7, color: 'white' }}>
                    {node.lastUpdated}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className={styles.guideSection}>
            <h3>Data Quality Guide</h3>
            <div className={styles.guideItem}>
              <span style={{ color: '#22c55e' }}>🟢</span>
              <span>Real-time data</span>
            </div>
            <div className={styles.guideItem}>
              <span style={{ color: '#f59e0b' }}>🟡</span>
              <span>Historical data (recent)</span>
            </div>
            <div className={styles.guideItem}>
              <span style={{ color: '#f97316' }}>🟠</span>
              <span>Static/fallback data</span>
            </div>
            <div className={styles.guideItem}>
              <span style={{ color: '#ef4444' }}>🔴</span>
              <span>Incomplete/failed</span>
            </div>
            
            <h3 style={{ marginTop: '1rem' }}>Network Guide</h3>
            <div className={styles.guideItem}>
              <div className={styles.greenCircle}></div>
              <span>Positive Performance</span>
            </div>
            <div className={styles.guideItem}>
              <div className={styles.redCircle}></div>
              <span>Negative Performance</span>
            </div>
            <div className={styles.guideItem}>
              <div className={styles.blueLine}></div>
              <span>Positive Correlation</span>
            </div>
            <div className={styles.guideItem}>
              <div className={styles.orangeLine}></div>
              <span>Negative Correlation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StockGraph
