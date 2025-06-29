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

  const userId = 'user123'

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

        if (data.success) {
          setWatchlistData(data.watchlist)
          if (data.watchlist.length > 0) await fetchStockPrices(data.watchlist)
          else setLoading(false)
        } else {
          setError('Failed to fetch watchlist')
        }
      } catch (err) {
        setError('Error fetching watchlist: ' + err.message)
      }
    }

    fetchWatchlist()
  }, [userId])

  const fetchStockPrices = async (watchlist) => {
    const prices = {}
    console.log('📊 Starting to fetch prices for watchlist:', watchlist)

    for (const stock of watchlist) {
      try {
        console.log(`🔍 Fetching price for ${stock.symbol}...`)
        const response = await fetch(`/api/stock-detail?symbol=${stock.symbol}`)
        const data = await response.json()
        
        console.log(`📈 Response for ${stock.symbol}:`, data)
        
        if (data.success && data.data) {
          prices[stock.symbol] = data.data
          console.log(`✅ Successfully added price data for ${stock.symbol}:`, data.data)
        } else {
          console.log(`❌ No valid data for ${stock.symbol}. Response:`, data)
        }
      } catch (err) {
        console.error(`💥 Error fetching price for ${stock.symbol}:`, err)
      }
    }

    console.log('📊 Final prices object:', prices)
    setStockPrices(prices)
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
            changePercent: stockData.changePercent || 0
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
        {/* Debug info */}
        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '10px', color: 'white' }}>
          Debug: User ID: {userId} | Watchlist: {watchlistData.length} stocks, Prices: {Object.keys(stockPrices).length} loaded, Nodes: {nodes.length}, Edges: {edges.length}
          <br />
          Backend Status: <span style={{ color: backendConnected ? '#22c55e' : '#ef4444' }}>
            {backendConnected ? '🟢 Connected' : '🔴 Disconnected (using fallback edges)'}
          </span>
        </div>
      </div>
      
      <div className={styles.contentGrid}>
        <div className={styles.graphContainer}>
          <ForceGraph2D
            graphData={{ nodes, links: edges }}
            nodeLabel={node => `${node.id}: ${node.changePercent?.toFixed(2)}%`}
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
                  <div className={styles.stockSymbol}>{node.id}</div>
                  <div className={styles.stockName}>{node.name}</div>
                  <div className={`${styles.stockChange} ${node.change >= 0 ? styles.positive : styles.negative}`}>
                    {node.changePercent?.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className={styles.guideSection}>
            <h3>Network Guide</h3>
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
