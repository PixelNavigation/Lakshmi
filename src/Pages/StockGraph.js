// Updated StockGraph using Cytoscape.js with backend Granger causality integration
'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import styles from './StockGraph.module.css'

// Cytoscape imports
let cytoscape = null

// Cytoscape initialization with async imports
const initCytoscape = async () => {
  if (typeof window !== 'undefined') {
    try {
      // Import cytoscape only (circle and grid are built-in layouts)
      cytoscape = (await import('cytoscape')).default
      return true
    } catch (error) {
      console.error('Error initializing Cytoscape:', error)
      return false
    }
  }
  return false
}

// Initialize Cytoscape on the client-side
if (typeof window !== 'undefined') {
  initCytoscape()
}

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
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [currentZoom, setCurrentZoom] = useState(1)
  const [selectedLayout, setSelectedLayout] = useState('grid')
  
  // Add refs to track if we should regenerate the graph
  const graphGeneratedRef = useRef(false)
  const watchlistLengthRef = useRef(0)
  const cytoscapeRef = useRef(null) // Ref for the Cytoscape container
  const cyRef = useRef(null) // Ref for the Cytoscape instance

  const userId = user?.id || 'user123' // Fallback for demo purposes

  // Initialize Cytoscape and register layouts
  useEffect(() => {
    const ensureCytoscapeReady = async () => {
      // Wait for Cytoscape to be fully initialized
      if (!cytoscape) {
        const success = await initCytoscape()
        if (!success) {
          setError('Failed to initialize Cytoscape visualization library')
          return false
        }
      }
      return true
    }
    
    ensureCytoscapeReady()
  }, [])

  // Initialize and update Cytoscape graph
  const initializeCytoscapeGraph = useCallback(async () => {
    if (!cytoscapeRef.current || nodes.length === 0) return
    
    // Ensure Cytoscape is loaded
    if (!cytoscape) {
      await initCytoscape()
      if (!cytoscape) {
        console.error('Failed to initialize Cytoscape')
        return
      }
    }

    try {
      // Destroy existing instance
      if (cyRef.current) {
        cyRef.current.destroy()
      }

      console.log('🎯 Initializing Cytoscape graph with', nodes.length, 'nodes and', edges.length, 'edges')

      // Convert data to Cytoscape format
      const cytoscapeNodes = nodes.map(node => ({
        data: {
          id: node.id,
          label: node.id,
          name: node.name,
          price: node.price,
          change: node.change,
          changePercent: node.changePercent,
          isRealData: node.isRealData,
          isHistoricalData: node.isHistoricalData,
          isStaticData: node.isStaticData,
          hasIncompleteData: node.hasIncompleteData,
          source: node.source,
          lastUpdated: node.lastUpdated,
          // Store color and other visual properties in data to be referenced by style
          nodeColor: node.color,
          nodeSize: Math.max(30, Math.min(80, 30 + (node.val * 10))),
          borderColor: node.change >= 0 ? '#16a34a' : '#dc2626'
        }
      }))

      const cytoscapeEdges = edges.map((edge, index) => ({
        data: {
          id: `edge-${index}`,
          source: edge.source,
          target: edge.target,
          weight: edge.value,
          correlation: edge.correlation,
          // Move style properties to data for stylesheet reference
          edgeColor: edge.color,
          edgeWidth: Math.max(1, edge.width || 2)
        }
      }))

      // Initialize Cytoscape
      cyRef.current = cytoscape({
        container: cytoscapeRef.current,
        elements: [...cytoscapeNodes, ...cytoscapeEdges],
        style: [
          {
            selector: 'node',
            style: {
              'background-color': 'data(nodeColor)',
              'border-width': 2,
              'border-color': 'data(borderColor)',
              'width': 'data(nodeSize)',
              'height': 'data(nodeSize)',
              'label': 'data(label)',
              'color': '#1f2937',
              'text-valign': 'center',
              'text-halign': 'center',
              'font-size': '10px',
              'font-weight': 'bold',
              'text-outline-width': 1,
              'text-outline-color': '#fff'
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 'data(edgeWidth)',
              'line-color': 'data(edgeColor)',
              'target-arrow-color': 'data(edgeColor)',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'opacity': 0.8
            }
          },
          {
            selector: 'node:selected',
            style: {
              'border-width': 4,
              'border-color': '#3b82f6'
            }
          }
        ],
        layout: getLayoutConfig(selectedLayout),
        zoomingEnabled: true,
        userZoomingEnabled: true,
        panningEnabled: true,
        userPanningEnabled: true,
        boxSelectionEnabled: false,
        selectionType: 'single',
        touchTapThreshold: 8,
        desktopTapThreshold: 4,
        autolock: false,
        autoungrabify: false,
        autounselectify: false,
        minZoom: 0.5,
        maxZoom: 3
      })

      // Add event listeners
      cyRef.current.on('zoom', () => {
        const zoom = cyRef.current.zoom()
        setCurrentZoom(zoom)
      })

      cyRef.current.on('tap', 'node', (evt) => {
        const node = evt.target
        const data = node.data()
        console.log('Node clicked:', data)
        
        // Show node info in tooltip or sidebar
        // You can expand this to show detailed stock information
      })

      // Fit to view initially
      setTimeout(() => {
        if (cyRef.current) {
          cyRef.current.fit(null, 50)
        }
      }, 100)

      console.log('✅ Cytoscape graph initialized successfully')
    } catch (error) {
      console.error('❌ Error initializing Cytoscape graph:', error)
    }
  }, [nodes, edges, selectedLayout])

  // Get layout configuration
  const getLayoutConfig = (layoutName) => {
    const configs = {
      'circle': {
        name: 'circle',
        fit: true,
        padding: 30,
        boundingBox: undefined,
        avoidOverlap: true,
        nodeDimensionsIncludeLabels: false,
        spacingFactor: undefined,
        radius: undefined,
        startAngle: 3 / 2 * Math.PI,
        sweep: undefined,
        clockwise: true,
        sort: undefined,
        animate: false,
        animationDuration: 500,
        animationEasing: undefined,
        transform: function(node, position) { return position; }
      },
      'grid': {
        name: 'grid',
        fit: true,
        padding: 30,
        boundingBox: undefined,
        avoidOverlap: true,
        avoidOverlapPadding: 10,
        nodeDimensionsIncludeLabels: false,
        spacingFactor: undefined,
        condense: false,
        rows: undefined,
        cols: undefined,
        position: function(node) {},
        sort: undefined,
        animate: false,
        animationDuration: 500,
        animationEasing: undefined,
        transform: function(node, position) { return position; }
      }
    }
    return configs[layoutName] || configs['grid']
  }

  // Cytoscape control functions
  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.5)
      cyRef.current.center()
    }
  }

  const handleZoomOut = () => {
    if (cyRef.current) {
      const minZoom = 0.5;
      const newZoom = Math.max(cyRef.current.zoom() * 0.9, minZoom);
      cyRef.current.zoom(newZoom);
      cyRef.current.center();
    }
  }

  const handleResetZoom = () => {
    if (cyRef.current) {
      cyRef.current.fit(null, 50)
    }
  }

  const handleLayoutChange = (newLayout) => {
    setSelectedLayout(newLayout)
    if (cyRef.current) {
      const layout = cyRef.current.layout(getLayoutConfig(newLayout))
      layout.run()
    }
  }

  const fetchStockPrices = useCallback(async (watchlist, isManualRefresh = false) => {
    if (!watchlist || watchlist.length === 0) return
    
    // Only show loading for manual refresh or initial load
    if (isManualRefresh || !graphGeneratedRef.current) {
      setLoading(true)
    }
    
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
              console.log(`✅ Real-time data for ${stock.symbol}: ₹${stockData.price} (${stockData.source || 'Unknown source'})`)
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
    
    // Only regenerate graph if watchlist changed or this is manual refresh
    if (isManualRefresh || watchlist.length !== watchlistLengthRef.current) {
      watchlistLengthRef.current = watchlist.length
      graphGeneratedRef.current = false // Force regeneration
    }
  }, [])

  // Initial watchlist fetch - only once
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const response = await fetch(`/api/user-watchlist?userId=${userId}`)
        const data = await response.json()

        if (data.success && data.watchlist && data.watchlist.length > 0) {
          setWatchlistData(data.watchlist)
          await fetchStockPrices(data.watchlist, false)
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
          await fetchStockPrices(sampleWatchlist, false)
        }
      } catch (err) {
        console.error('❌ Error fetching watchlist:', err)
        setError('Error fetching watchlist: ' + err.message)
        setLoading(false)
      }
    }

    fetchWatchlist()
  }, [userId]) // Removed fetchStockPrices from dependencies

  // Auto-refresh prices only (NOT the graph) - only when enabled
  useEffect(() => {
    if (!autoRefresh || watchlistData.length === 0) return

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing stock prices only...')
      fetchStockPrices(watchlistData, false) // false = not manual, don't regenerate graph
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [watchlistData, autoRefresh]) // Removed fetchStockPrices from dependencies

  // Generate graph data only when needed
  const generateGraph = useCallback(async () => {
    if (graphGeneratedRef.current || watchlistData.length === 0 || Object.keys(stockPrices).length === 0) {
      return
    }

    console.log('🎯 Starting graph data generation...')
    
    const newNodes = watchlistData
      .filter(stock => stockPrices[stock.symbol])
      .map(stock => {
        const stockData = stockPrices[stock.symbol]
        
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
        color: (edge.correlation || 0) > 0 ? '#2563eb' : '#dc2626',
        correlation: edge.correlation || 0
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
            const correlation = (Math.random() * 2 - 1) * 0.8; // Random correlation between -0.8 and 0.8
            newEdges.push({
              source: newNodes[i].id,
              target: newNodes[j].id,
              value: Math.abs(correlation),
              width: Math.random() * 4 + 2, // Random width 2-6
              color: correlation > 0 ? '#3b82f6' : '#f97316', // Blue for positive, orange for negative
              correlation: correlation
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
    graphGeneratedRef.current = true
    
    // The graph will be initialized in the useEffect that watches nodes and edges
  }, [watchlistData, stockPrices])

  // Only generate graph when watchlist or prices change significantly
  useEffect(() => {
    generateGraph()
  }, [watchlistData, stockPrices, generateGraph])

  // Initialize the Cytoscape graph when nodes and edges change
  useEffect(() => {
    const initGraph = async () => {
      if (nodes.length > 0 && edges.length > 0) {
        // Make sure Cytoscape is ready first
        if (!cytoscape) {
          await initCytoscape()
        }
        
        // Small timeout to ensure the DOM is ready
        setTimeout(() => {
          initializeCytoscapeGraph()
        }, 200)
      }
    }
    
    initGraph()
  }, [nodes, edges, initializeCytoscapeGraph])

  const fetchGrangerCausality = async (prices) => {
    try {
      const response = await fetch('http://localhost:5001/api/granger-causality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_prices: prices })
      });
      const data = await response.json();
      setBackendConnected(true);
      // Filter weak edges and ensure single direction
      const filteredEdges = data.edges
        .filter(edge => edge.value > 0.2) // Only significant influences
        .filter(edge => edge.source !== edge.target); // Remove self-loops
      return filteredEdges;
    } catch (error) {
      console.error('💥 Error fetching Granger causality:', error)
      setBackendConnected(false)
      return []
    }
  };

  // Manual refresh function
  const handleManualRefresh = () => {
    console.log('🔄 Manual refresh triggered - will regenerate graph')
    graphGeneratedRef.current = false // Force graph regeneration
    fetchStockPrices(watchlistData, true) // true = manual refresh
  }

  // Update node data when prices change (but don't regenerate entire graph)
  useEffect(() => {
    if (graphGeneratedRef.current && nodes.length > 0 && Object.keys(stockPrices).length > 0) {
      const updatedNodes = nodes.map(node => {
        const stockData = stockPrices[node.id]
        if (stockData) {
          const updatedNode = {
            ...node,
            price: stockData.price || 0,
            change: stockData.change || 0,
            changePercent: stockData.changePercent || 0,
            color: (stockData.change !== undefined && stockData.change >= 0) ? '#22c55e' : '#ef4444',
            lastUpdated: stockData.timestamp ? new Date(stockData.timestamp).toLocaleTimeString() : 'Unknown'
          }
          
          // Also update the node in Cytoscape if it exists
          if (cyRef.current) {
            const cyNode = cyRef.current.getElementById(node.id)
            if (cyNode && cyNode.length > 0) {
              // Update data properties
              cyNode.data('price', updatedNode.price)
              cyNode.data('change', updatedNode.change)
              cyNode.data('changePercent', updatedNode.changePercent)
              cyNode.data('lastUpdated', updatedNode.lastUpdated)
              
              // Update the properties used by style mappings
              cyNode.data('nodeColor', updatedNode.color)
              cyNode.data('borderColor', updatedNode.change >= 0 ? '#16a34a' : '#dc2626')
            }
          }
          
          return updatedNode
        }
        return node
      })

      setNodes(updatedNodes)
    }
  }, [stockPrices]) // Only depend on stockPrices, not nodes

  // Additional styles for the Cytoscape container
  const cytoscapeStyles = {
    width: '100%',
    height: '600px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  };
  
  // Layout options for the dropdown
  const layoutOptions = [
    { value: 'grid', label: 'Grid Layout' },
    { value: 'circle', label: 'Circle Layout' }
  ];

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
            onClick={handleManualRefresh}
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
            🔄 Refresh Graph & Prices
          </button>
          
          <button 
            onClick={handleResetZoom}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🎯 Reset Zoom
          </button>
          
          <button 
            onClick={handleZoomIn}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔍 Zoom In
          </button>
          
          <button 
            onClick={handleZoomOut}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔍 Zoom Out
          </button>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh prices only (30s)
          </label>
          
          {lastUpdated && (
            <span style={{ fontSize: '12px', opacity: 0.7, color: 'white' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          
          <span style={{ fontSize: '12px', opacity: 0.7, color: 'white' }}>
            Zoom: {(currentZoom * 100).toFixed(0)}%
          </span>
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
          {/* Layout controls */}
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label htmlFor="layout-select" style={{ color: 'white' }}>Graph Layout:</label>
            <select
              id="layout-select"
              value={selectedLayout}
              onChange={(e) => handleLayoutChange(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #ccc',
                backgroundColor: '#f8fafc',
                color: '#1f2937'
              }}
            >
              {layoutOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Cytoscape container */}
          <div 
            ref={cytoscapeRef} 
            style={cytoscapeStyles}
            data-testid="cytoscape-container"
          />
          
          {/* Tooltip for node details (future enhancement) */}
          <div id="node-tooltip" style={{ 
            position: 'absolute', 
            display: 'none', 
            backgroundColor: 'white', 
            padding: '10px', 
            borderRadius: '4px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 10
          }}></div>
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
