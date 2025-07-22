// Updated StockGraph using Cytoscape.js with backend Granger causality integration
'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { AlertCircle, RefreshCw, Play, Pause, Settings, Info, ZoomIn, ZoomOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { backendFetch } from '../lib/utils'
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
  const [currentZoom, setCurrentZoom] = useState(1)
  const [selectedLayout, setSelectedLayout] = useState('circle')
  const [analysisStats, setAnalysisStats] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedEdge, setSelectedEdge] = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [loadingAiAnalysis, setLoadingAiAnalysis] = useState(false)
  const [showAiAnalysis, setShowAiAnalysis] = useState(false)
  
  // Add refs to track if we should regenerate the graph
  const graphGeneratedRef = useRef(false)
  const cytoscapeRef = useRef(null) // Ref for the Cytoscape container
  const cyRef = useRef(null) // Ref for the Cytoscape instance
  const refreshInProgressRef = useRef(false)

  const userId = user?.id || 'demo-user'

  // Fetch watchlist from frontend API
  const fetchWatchlist = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user-watchlist?userId=${userId}`)
      const data = await response.json()
      if (data.success && data.watchlist && data.watchlist.length > 0) {
        setWatchlistData(data.watchlist)
        return data.watchlist
      } else {
        setError('No stocks in your watchlist.')
        setLoading(false)
        return []
      }
    } catch (err) {
      setError('Failed to fetch watchlist')
      setLoading(false)
      return []
    }
  }, [userId])

  // Fetch prices for each stock in the watchlist
  const fetchStockPrices = useCallback(async (watchlist) => {
    if (!watchlist || watchlist.length === 0) return {}
    const prices = {}
    for (const stock of watchlist) {
      try {
        const timestamp = Date.now()
        const response = await fetch(`/api/stock-detail?symbol=${stock.symbol}&t=${timestamp}`, {
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        })
        const data = await response.json()
        if (data.success && data.data) {
          prices[stock.symbol] = data.data
        }
      } catch (err) {
        // skip failed
      }
    }
    setStockPrices(prices)
    setLastUpdated(new Date())
    return prices
  }, [])

  // Send prices to backend for correlation analysis
  const fetchCorrelations = useCallback(async (prices) => {
    try {
      setLoading(true)
      
      const response = await backendFetch('/api/granger-causality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_prices: prices })
      })
      
      const data = await response.json()
      if (data.edges && Array.isArray(data.edges)) {
        setEdges(data.edges)
        setAnalysisStats(data.analysis_summary || null)
        setBackendConnected(true)
        
        // Log data sources information
        if (data.data_sources) {
          console.log('📊 Data Sources for Historical Analysis:', data.data_sources)
          const realDataCount = Object.values(data.data_sources).filter(source => source.includes('Yahoo')).length
          const totalCount = Object.values(data.data_sources).length
          console.log(`📊 Real data usage: ${realDataCount}/${totalCount} stocks (${((realDataCount/totalCount)*100).toFixed(1)}%)`)
        }
      } else {
        setEdges([])
        setBackendConnected(false)
      }
    } catch (err) {
      console.error('Backend connection error:', err)
      setEdges([])
      setBackendConnected(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // Generate nodes from stockPrices and watchlistData
  useEffect(() => {
    if (!watchlistData.length || !Object.keys(stockPrices).length) return
    const stockNodes = watchlistData.map(stock => {
      const data = stockPrices[stock.symbol] || {}
      return {
        id: stock.symbol,
        name: stock.name || stock.symbol,
        price: data.price || 0,
        change: data.change || 0,
        changePercent: data.changePercent || 0,
        volume: data.volume || 0,
        color: (data.change !== undefined && data.change >= 0) ? '#22c55e' : '#ef4444',
        isRealData: data.isRealData || false,
        source: data.source || 'API'
      }
    })
    setNodes(stockNodes)
  }, [watchlistData, stockPrices])

  // Initial load: fetch watchlist, then prices, then correlations
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      const wl = await fetchWatchlist()
      if (wl.length > 0) {
        const prices = await fetchStockPrices(wl)
        await fetchCorrelations(prices)
      }
      setLoading(false)
    }
    loadAll()
  }, [fetchWatchlist, fetchStockPrices, fetchCorrelations])

  // Cytoscape integration
  useEffect(() => {
    if (nodes.length > 0 && cytoscape) {
      initializeCytoscapeGraph()
    }
  }, [nodes, edges, selectedLayout])

  const getLayoutConfig = (layoutName) => {
    const layouts = {
      circle: {
        name: 'circle',
        radius: 200,
        padding: 80,
        animate: true,
        animationDuration: 1000
      },
      grid: {
        name: 'grid',
        rows: Math.ceil(Math.sqrt(nodes.length)),
        cols: Math.ceil(Math.sqrt(nodes.length)),
        padding: 80,
        animate: true,
        animationDuration: 1000
      },
      cose: {
        name: 'cose',
        padding: 80,
        animate: true,
        animationDuration: 1000,
        idealEdgeLength: 100,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: 400000,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
      },
      concentric: {
        name: 'concentric',
        padding: 80,
        animate: true,
        animationDuration: 1000,
        concentric: (node) => node.data('changePercent') || 0,
        levelWidth: () => 2,
        minNodeSpacing: 50
      }
    }
    return layouts[layoutName] || layouts.circle
  }

  const determineEdgeColor = (correlation, method) => {
    if (method === 'granger') {
      return correlation > 0 ? '#3b82f6' : '#ef4444'
    } else {
      return correlation > 0 ? '#10b981' : '#f59e0b'
    }
  }

  const showNodeDetails = (nodeData) => {
    setSelectedNode(nodeData)
    setSelectedEdge(null)
    setShowDetails(true)
  }

  const showEdgeDetails = (edgeData) => {
    setSelectedEdge(edgeData)
    setSelectedNode(null)
    setShowDetails(true)
    setShowAiAnalysis(false)
    setAiAnalysis(null)
  }

  const initializeCytoscapeGraph = useCallback(async () => {
    if (!cytoscapeRef.current || nodes.length === 0) return
    if (!cytoscape) {
      await initCytoscape()
      if (!cytoscape) {
        console.error('Failed to initialize Cytoscape')
        return
      }
    }
    try {
      if (cyRef.current) {
        cyRef.current.destroy()
      }
      const cytoscapeNodes = nodes.map(node => ({
        data: {
          id: node.id,
          label: node.id,
          name: node.name || node.id,
          price: node.price || 0,
          change: node.change || 0,
          changePercent: node.changePercent || 0,
          volume: node.volume || 0,
          nodeColor: node.color || (node.change >= 0 ? '#22c55e' : '#ef4444'),
          nodeSize: Math.max(40, Math.min(100, 50 + (Math.abs(node.changePercent || 0) * 2))),
          borderColor: node.change >= 0 ? '#16a34a' : '#dc2626',
          borderWidth: 3,
          isRealData: node.isRealData || false,
          dataSource: node.source || 'API'
        }
      }))
      const cytoscapeEdges = edges.map((edge, index) => {
        const correlationValue = edge.correlation || edge.value || 0
        const isStrongCorrelation = Math.abs(correlationValue) > 0.4
        return {
        data: {
          id: `edge-${index}`,
          source: edge.source,
          target: edge.target,
            weight: Math.abs(correlationValue),
            correlation: Number(correlationValue).toFixed(3),
            method: edge.method || 'unknown',
            edgeColor: determineEdgeColor(correlationValue, edge.method),
            edgeWidth: Math.max(2, Math.abs(correlationValue) * 10),
            opacity: Math.max(0.9, Math.abs(correlationValue)),
            pValue: edge.p_value || null,
            importance: edge.importance || null,
            hasAiAnalysis: isStrongCorrelation,
            lineStyle: isStrongCorrelation ? 'solid' : 'solid'
          }
        }
      })
      cyRef.current = cytoscape({
        container: cytoscapeRef.current,
        elements: [...cytoscapeNodes, ...cytoscapeEdges],
        style: [
          {
            selector: 'node',
            style: {
              'background-color': 'data(nodeColor)',
              'border-width': 'data(borderWidth)',
              'border-color': 'data(borderColor)',
              'width': 'data(nodeSize)',
              'height': 'data(nodeSize)',
              'label': 'data(label)',
              'color': '#1f2937',
              'text-valign': 'center',
              'text-halign': 'center',
              'font-size': '12px',
              'font-weight': 'bold',
              'text-outline-width': 2,
              'text-outline-color': '#ffffff',
              'text-outline-opacity': 0.7
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
              'opacity': 'data(opacity)',
              'label': 'data(correlation)',
              'font-size': '10px',
              'color': '#1f2937',
              'text-background-color': '#ffffff',
              'text-background-opacity': 0.95,
              'text-background-padding': '2px',
              'text-background-shape': 'roundrectangle'
            }
          },
          {
            selector: 'edge[hasAiAnalysis = true]',
            style: {
              'line-style': 'solid',
              'source-arrow-shape': 'circle',
              'source-arrow-color': '#8b5cf6',
              'source-arrow-fill': 'filled'
            }
          }
        ],
        layout: getLayoutConfig(selectedLayout),
        zoomingEnabled: true,
        userZoomingEnabled: true,
        panningEnabled: true,
        userPanningEnabled: true,
        minZoom: 0.3,
        maxZoom: 4,
        // Set viewport bounds to avoid UI overlays
        fit: true,
        padding: 30
      })
      cyRef.current?.on('zoom', () => {
        setCurrentZoom(cyRef.current?.zoom() || 1)
      })
      cyRef.current?.on('tap', 'node', (evt) => {
        const node = evt.target
        const data = node.data()
        showNodeDetails(data)
      })
      cyRef.current?.on('tap', 'edge', (evt) => {
        const edge = evt.target
        const data = edge.data()
        showEdgeDetails(data)
      })
      
      // Add hover events for AI analysis hint
      cyRef.current?.on('mouseover', 'edge[hasAiAnalysis = true]', (evt) => {
        const edge = evt.target
        const position = evt.renderedPosition || evt.position
        const tooltip = document.getElementById('edge-tooltip')
        if (tooltip) {
          tooltip.style.display = 'block'
          tooltip.style.left = `${position.x + 10}px`
          tooltip.style.top = `${position.y - 10}px`
          tooltip.innerHTML = `🤖 Click for AI Analysis<br><small>Strong correlation detected</small>`
        }
      })
      
      cyRef.current?.on('mouseout', 'edge[hasAiAnalysis = true]', () => {
        const tooltip = document.getElementById('edge-tooltip')
        if (tooltip) {
          tooltip.style.display = 'none'
        }
      })
      
      cyRef.current?.on('tap', 'node', (evt) => {
        const node = evt.target
        const data = node.data()
        showNodeDetails(data)
      })
      cyRef.current?.on('tap', 'edge', (evt) => {
        const edge = evt.target
        const data = edge.data()
        showEdgeDetails(data)
      })
      graphGeneratedRef.current = true
    } catch (error) {
      setError('Failed to initialize graph visualization')
    }
  }, [nodes, edges, selectedLayout])

  const handleRefresh = () => {
    if (watchlistData.length > 0) {
      fetchStockPrices(watchlistData).then(prices => fetchCorrelations(prices))
    }
  }

  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2)
    }
  }

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8)
    }
  }

  const handleFitGraph = () => {
    if (cyRef.current) {
      cyRef.current.fit(null, 80) // Add padding to fit function
    }
  }

  const handleLayoutChange = (layout) => {
    setSelectedLayout(layout)
    if (cyRef.current) {
      cyRef.current.layout(getLayoutConfig(layout)).run()
    }
  }

  const layoutOptions = [
    { value: 'circle', label: 'Circle' },
    { value: 'grid', label: 'Grid' },
    { value: 'cose', label: 'Force-directed' },
    { value: 'concentric', label: 'Concentric' }
  ];

  const cytoscapeStyles = {
    width: '100%',
    height: '100%',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    overflow: 'hidden'
  }

  // AI Analysis function for strong correlations
  const performAiAnalysis = async (edgeData) => {
    try {
      setLoadingAiAnalysis(true)
      setShowAiAnalysis(true)
      
      // Prepare data for AI analysis
      const analysisData = {
        source: edgeData.source,
        target: edgeData.target,
        correlation: edgeData.correlation,
        method: edgeData.method,
        strength: Math.abs(edgeData.correlation) > 0.7 ? 'Strong' : 
                 Math.abs(edgeData.correlation) > 0.4 ? 'Moderate' : 'Weak',
        type: edgeData.correlation > 0 ? 'Positive' : 'Negative'
      }
      
      // Enhanced AI analysis using the new API
      const response = await fetch('/api/stock-ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stocks: [
            { symbol: analysisData.source, name: analysisData.source },
            { symbol: analysisData.target, name: analysisData.target }
          ],
          analysisType: 'ai_dependency',
          correlationData: analysisData
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to get AI analysis')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setAiAnalysis({
          analysis: data.analysis,
          edgeData: analysisData,
          timestamp: new Date(),
          metadata: data.metadata
        })
      } else {
        throw new Error(data.error || 'AI analysis failed')
      }
    } catch (error) {
      console.error('AI Analysis error:', error)
      setAiAnalysis({
        analysis: `Sorry, I couldn't perform the analysis at this time. Error: ${error.message}
        
Please try again later. If the issue persists, the AI service might be temporarily unavailable.`,
        edgeData: analysisData,
        timestamp: new Date(),
        error: true
      })
    } finally {
      setLoadingAiAnalysis(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-gray-600">Loading stock correlations...</span>
      </div>
    </div>
  )
  }

  if (error) {
    // For warnings about no correlation data but backend is connected,
    // show the warning as an overlay but still render the graph
    if (backendConnected && error.includes("correlation")) {
      // Continue rendering the graph with the warning overlay
    } else {
      // For other errors, show full error screen
      return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <div className={styles.errorIcon}>⚠️</div>
        <p className={styles.errorText}>Error: {error}</p>
            {error && error.includes("correlation") && (
              <div style={{ marginTop: '1rem' }}>
                <p>To fix this issue:</p>
                <ol style={{ textAlign: 'left', marginTop: '0.5rem' }}>
                  <li>Make sure the backend server is running on https://wwws68kj-5001.inc1.devtunnels.ms or http://localhost:5001</li>
                  <li>Check that the API endpoint /api/granger-causality is available</li>
                  <li>Ensure network connectivity between this app and the backend</li>
                  <li>Try refreshing the page after the backend is running</li>
                </ol>
                <button
                  onClick={() => setError(null)}
                  style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  View Graph Without Correlations
                </button>
      </div>
            )}
    </div>
        </div>
      );
    }
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Stock Network Graph</h1>
        <p>Interactive visualization of your watchlist correlations</p>
        
        {/* Error overlay for correlation warning but backend connected */}
        {error && backendConnected && error.includes("correlation") && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.5rem 1rem', 
            backgroundColor: '#fef3c7', 
            color: '#92400e', 
            borderRadius: '4px',
            border: '1px solid #f59e0b'
          }}>
            <strong>⚠️ Notice:</strong> {error}
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: '1rem',
                padding: '0.25rem 0.75rem',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Dismiss
            </button>
          </div>
        )}
        
        {/* Backend connection warning */}
        {!backendConnected && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.5rem 1rem', 
            backgroundColor: '#fed7aa', 
            color: '#7c2d12', 
            borderRadius: '4px',
            border: '1px solid #f97316'
          }}>
            <strong>⚠️ Notice:</strong> The correlation analysis service is not connected. 
            Stock nodes are displayed but without correlation edges.
            <div style={{ marginTop: '0.5rem' }}>
              <strong>To see stock correlations:</strong>
              <ol style={{ marginTop: '0.25rem', paddingLeft: '1.5rem', textAlign: 'left' }}>
                <li>Ensure backend server is running at https://wwws68kj-5001.inc1.devtunnels.ms or http://localhost:5001</li>
                <li>Check that the API endpoint /api/granger-causality is available</li>
                <li>Click "Refresh Graph & Prices" after the backend is running</li>
              </ol>
            </div>
          </div>
        )}
        
        {/* Status info */}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {lastUpdated && (
            <span style={{ fontSize: '12px', opacity: 0.7, color: 'white' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      
      <div className={styles.contentGrid}>
        <div className={styles.graphContainer}>
          {/* Graph controls */}
          <div style={{ 
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            zIndex: 100,
            display: 'flex', 
            gap: '1rem', 
            alignItems: 'center', 
            flexWrap: 'wrap',
            backgroundColor: 'rgba(31, 41, 55, 0.9)',
            padding: '0.75rem',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)'
          }}>
          <button 
              onClick={handleRefresh}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Graph & Prices
          </button>
          
          <button 
              onClick={handleFitGraph}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ZoomIn className="w-4 h-4" />
              Fit Graph
          </button>
          
          <button 
            onClick={handleZoomIn}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ZoomIn className="w-4 h-4" />
              Zoom In
          </button>
          
          <button 
            onClick={handleZoomOut}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ZoomOut className="w-4 h-4" />
              Zoom Out
          </button>
          
            {/* Layout selector inline with zoom controls */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '0.5rem',
              marginLeft: '1rem',
              paddingLeft: '1rem',
              borderLeft: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <label htmlFor="layout-select" style={{ color: 'white', fontSize: '14px' }}>Layout:</label>
            <select
              id="layout-select"
              value={selectedLayout}
              onChange={(e) => handleLayoutChange(e.target.value)}
              style={{
                  padding: '0.4rem',
                borderRadius: '4px',
                border: '1px solid #ccc',
                backgroundColor: '#f8fafc',
                  color: '#1f2937',
                  fontSize: '14px'
              }}
            >
              {layoutOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            </div>
          </div>
          
          {/* Cytoscape container */}
          <div 
            ref={cytoscapeRef} 
            style={cytoscapeStyles}
            data-testid="cytoscape-container"
          />
          
          {/* Status bar at bottom */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            zIndex: 100,
            backgroundColor: 'rgba(31, 41, 55, 0.9)',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            backdropFilter: 'blur(10px)',
            color: 'white',
            fontSize: '12px',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <span>Zoom: {(currentZoom * 100).toFixed(0)}%</span>
            <span>Nodes: {nodes.length}</span>
            <span>Edges: {edges.length}</span>
            <span style={{ color: backendConnected ? '#22c55e' : '#ef4444' }}>
              Backend: {backendConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {/* Internal Legend - Always visible at top right */}
          <div className={styles.internalLegend}>
            <h4>Legend</h4>
            <div className={styles.legendItems}>
              <div className={styles.legendItem}>
                <div className={`${styles.legendDot} ${styles.positiveDot}`}></div>
                <span>Positive correlation</span>
              </div>
              <div className={styles.legendItem}>
                <div className={`${styles.legendDot} ${styles.negativeDot}`}></div>
                <span>Negative correlation</span>
              </div>
            </div>
          </div>
          
          {/* Enhanced Tooltip for edges and nodes */}
          <div id="edge-tooltip" style={{ 
            position: 'absolute', 
            display: 'none', 
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            color: 'white',
            padding: '8px 12px', 
            borderRadius: '6px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 150,
            fontSize: '12px',
            border: '1px solid rgba(139, 92, 246, 0.5)',
            backdropFilter: 'blur(10px)',
            pointerEvents: 'none'
          }}></div>
          
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
        
        {/* Edge Details Modal with AI Analysis */}
        {showDetails && selectedEdge && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(31, 41, 55, 0.98)',
            color: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 200,
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: '#3b82f6', margin: 0 }}>Edge Analysis</h3>
              <button
                onClick={() => {
                  setShowDetails(false)
                  setShowAiAnalysis(false)
                  setAiAnalysis(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Between:</span>
                <span style={{ fontWeight: 'bold' }}>{selectedEdge.source} ↔ {selectedEdge.target}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Correlation:</span>
                    <span style={{ 
                  fontWeight: 'bold',
                  color: selectedEdge.correlation >= 0 ? '#22c55e' : '#ef4444'
                    }}>
                  {selectedEdge.correlation}
                    </span>
                  </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Method:</span>
                <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{selectedEdge.method}</span>
                  </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Strength:</span>
                <span style={{ fontWeight: 'bold' }}>
                  {Math.abs(selectedEdge.correlation) > 0.7 ? 'Strong' : 
                   Math.abs(selectedEdge.correlation) > 0.4 ? 'Moderate' : 'Weak'}
                </span>
                  </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Type:</span>
                <span style={{ 
                  fontWeight: 'bold',
                  color: selectedEdge.correlation > 0 ? '#22c55e' : '#ef4444'
                }}>
                  {selectedEdge.correlation > 0 ? 'Positive' : 'Negative'}
                </span>
                </div>
            </div>

            {/* AI Analysis Button for Strong Correlations */}
            {Math.abs(selectedEdge.correlation) > 0.4 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <button
                  onClick={() => performAiAnalysis(selectedEdge)}
                  disabled={loadingAiAnalysis}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: loadingAiAnalysis ? '#6b7280' : '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loadingAiAnalysis ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🤖 {loadingAiAnalysis ? 'Analyzing...' : 'Get AI Analysis'}
                </button>
          </div>
            )}

            {/* AI Analysis Results */}
            {showAiAnalysis && aiAnalysis && (
              <div style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <h4 style={{ 
                  color: '#60a5fa', 
                  marginBottom: '0.75rem',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🤖 AI Analysis Results
                </h4>
                <div style={{ 
                  fontSize: '13px', 
                  lineHeight: '1.6',
                  color: aiAnalysis.error ? '#fca5a5' : '#e5e7eb',
                  whiteSpace: 'pre-line'
                }}>
                  {aiAnalysis.analysis}
            </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: '#9ca3af', 
                  marginTop: '0.75rem',
                  textAlign: 'right'
                }}>
                  Generated: {aiAnalysis.timestamp.toLocaleString()}
            </div>
            </div>
            )}
            </div>
        )}
      </div>
    </div>
  )
}

export default StockGraph
