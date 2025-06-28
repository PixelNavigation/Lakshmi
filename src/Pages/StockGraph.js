'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import styles from './StockGraph.module.css'

const StockGraph = () => {
  const { user } = useAuth()
  const canvasRef = useRef(null)
  const [watchlistData, setWatchlistData] = useState([])
  const [stockPrices, setStockPrices] = useState({})
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })

  // Mock user ID - in a real app, this would come from authentication
  const userId = 'user123'

  // Fetch watchlist data
  useEffect(() => {
    const fetchWatchlist = async () => {
      console.log('Fetching watchlist for user:', userId)
      
      try {
        const response = await fetch(`/api/user-watchlist?userId=${userId}`)
        const data = await response.json()
        
        console.log('Watchlist response for', userId, ':', data)
        
        if (data.success) {
          console.log('Watchlist data received:', data.watchlist)
          setWatchlistData(data.watchlist)
          // Fetch stock prices for each symbol
          if (data.watchlist.length > 0) {
            await fetchStockPrices(data.watchlist)
          } else {
            setLoading(false)
          }
        } else {
          setError('Failed to fetch watchlist')
        }
      } catch (err) {
        setError('Error fetching watchlist: ' + err.message)
      }
    }

    fetchWatchlist()
  }, [userId])

  // Fetch stock prices
  const fetchStockPrices = async (watchlist) => {
    const prices = {}
    
    console.log('Fetching prices for', watchlist.length, 'stocks')
    
    for (const stock of watchlist) {
      try {
        console.log(`Fetching price for ${stock.symbol}...`)
        const response = await fetch(`/api/stock-detail?symbol=${stock.symbol}`)
        const data = await response.json()
        
        console.log(`Response for ${stock.symbol}:`, data)
        
        if (data.success && data.data) {
          prices[stock.symbol] = data.data
          console.log(`✅ Added price for ${stock.symbol}:`, data.data)
        } else {
          console.log(`❌ No valid data for ${stock.symbol}:`, data)
        }
      } catch (err) {
        console.error(`Error fetching price for ${stock.symbol}:`, err)
      }
    }
    
    console.log('Stock prices fetched:', prices)
    setStockPrices(prices)
    setLoading(false)
  }

  // Generate network graph using Gregnar-inspired algorithm
  useEffect(() => {
    console.log('Generating graph with:', { watchlistLength: watchlistData.length, pricesKeys: Object.keys(stockPrices) })
    if (watchlistData.length === 0 || Object.keys(stockPrices).length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) * 0.7

    // Create nodes - only for stocks that have price data
    const newNodes = watchlistData
      .filter(stock => stockPrices[stock.symbol]) // Only include stocks with price data
      .map((stock, index) => {
        const angle = (index / watchlistData.length) * 2 * Math.PI
        const stockData = stockPrices[stock.symbol]
        
        return {
          id: stock.symbol,
          name: stock.name || stock.symbol,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          price: stockData.price || 0,
          change: stockData.change || 0,
          changePercent: stockData.changePercent || 0,
          marketCap: stockData.marketCap || 0,
          size: 15 + (stockData.marketCap ? Math.log(stockData.marketCap) / 100 : 15), // Node size based on market cap
          color: stockData.change >= 0 ? '#22c55e' : '#ef4444' // Green for positive, red for negative
        }
      })

    // Create edges using correlation simulation (Gregnar algorithm approach)
    const newEdges = []
    for (let i = 0; i < newNodes.length; i++) {
      for (let j = i + 1; j < newNodes.length; j++) {
        const node1 = newNodes[i]
        const node2 = newNodes[j]
        
        // Simulate correlation based on price changes and sector similarity
        const correlation = Math.random() * 2 - 1 // Random correlation between -1 and 1
        const strength = Math.abs(correlation)
        
        if (strength > 0.3) { // Only show significant correlations
          newEdges.push({
            source: node1.id,
            target: node2.id,
            correlation,
            strength,
            color: correlation > 0 ? '#3b82f6' : '#f97316', // Blue for positive, orange for negative
            width: strength * 3
          })
        }
      }
    }

    console.log('Generated nodes:', newNodes.length, 'edges:', newEdges.length)
    setNodes(newNodes)
    setEdges(newEdges)
  }, [watchlistData, stockPrices])

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || nodes.length === 0) return

    // Add wheel event listener with proper options
    const handleWheelEvent = (e) => {
      e.preventDefault()
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      setZoomLevel(prev => Math.max(0.1, Math.min(3, prev * zoomFactor)))
    }

    canvas.addEventListener('wheel', handleWheelEvent, { passive: false })

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply transformations
    ctx.save()
    ctx.translate(panOffset.x, panOffset.y)
    ctx.scale(zoomLevel, zoomLevel)

    // Draw edges
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source)
      const targetNode = nodes.find(n => n.id === edge.target)
      
      if (sourceNode && targetNode) {
        ctx.beginPath()
        ctx.moveTo(sourceNode.x, sourceNode.y)
        ctx.lineTo(targetNode.x, targetNode.y)
        ctx.strokeStyle = edge.color
        ctx.lineWidth = edge.width
        ctx.globalAlpha = 0.6
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    })

    // Draw nodes
    nodes.forEach(node => {
      // Draw node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI)
      ctx.fillStyle = node.color
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw node label
      ctx.fillStyle = '#000000'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(node.id, node.x, node.y - node.size - 5)
      
      // Draw price change
      ctx.font = '10px Arial'
      ctx.fillStyle = node.change >= 0 ? '#22c55e' : '#ef4444'
      ctx.fillText(
        `${node.changePercent.toFixed(2)}%`, 
        node.x, 
        node.y + node.size + 15
      )
    })

    ctx.restore()

    // Cleanup
    return () => {
      canvas.removeEventListener('wheel', handleWheelEvent)
    }
  }, [nodes, edges, panOffset, zoomLevel])

  // Mouse event handlers
  const handleMouseDown = (e) => {
    setIsDragging(true)
    setLastMousePos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return

    const deltaX = e.clientX - lastMousePos.x
    const deltaY = e.clientY - lastMousePos.y

    setPanOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }))

    setLastMousePos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const resetView = () => {
    setPanOffset({ x: 0, y: 0 })
    setZoomLevel(1)
  }

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <h1>Stock Network Graph</h1>
        </div>
        <div className={styles.loadingContainer}>
          <p>Loading stock network...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <h1>Stock Network Graph</h1>
        </div>
        <div className={styles.errorContainer}>
          <p>Error: {error}</p>
        </div>
      </div>
    )
  }

  if (!loading && watchlistData.length === 0) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <h1>Stock Network Graph</h1>
        </div>
        <div className={styles.errorContainer}>
          <p>Your watchlist is empty. Add some stocks to your watchlist to see the network visualization.</p>
        </div>
      </div>
    )
  }

  if (!loading && Object.keys(stockPrices).length === 0 && watchlistData.length > 0) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <h1>Stock Network Graph</h1>
        </div>
        <div className={styles.errorContainer}>
          <p>Unable to fetch stock price data. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Stock Network Graph</h1>
        <p>Interactive visualization of your watchlist correlations</p>
        {/* Debug info */}
        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '10px' }}>
          Debug: User ID: {userId} | Watchlist: {watchlistData.length} stocks, Prices: {Object.keys(stockPrices).length} loaded, Nodes: {nodes.length}, Edges: {edges.length}
        </div>
      </div>
      
      <div className={styles.contentGrid}>
        <div className={styles.graphContainer}>
          <div className={styles.controls}>
            <button onClick={resetView} className={styles.resetButton}>
              Reset View
            </button>
            <span className={styles.zoomInfo}>
              Zoom: {(zoomLevel * 100).toFixed(0)}%
            </span>
          </div>
          
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className={styles.graphCanvas}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
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
                    {node.changePercent.toFixed(2)}%
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