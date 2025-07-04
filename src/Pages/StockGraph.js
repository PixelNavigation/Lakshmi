// Updated StockGraph using Cytoscape.js with backend Granger causality integration
'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { AlertCircle, RefreshCw, Play, Pause, Settings, Info, ZoomIn, ZoomOut } from 'lucide-react'
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
  const [currentZoom, setCurrentZoom] = useState(1)
  const [selectedLayout, setSelectedLayout] = useState('circle')
  const [analysisStats, setAnalysisStats] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedEdge, setSelectedEdge] = useState(null)

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
      const response = await fetch('http://localhost:5001/api/granger-causality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_prices: prices })
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
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
        padding: 50,
        animate: true,
        animationDuration: 1000
      },
      grid: {
        name: 'grid',
        rows: Math.ceil(Math.sqrt(nodes.length)),
        cols: Math.ceil(Math.sqrt(nodes.length)),
        padding: 50,
        animate: true,
        animationDuration: 1000
      },
      cose: {
        name: 'cose',
        padding: 50,
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
        padding: 50,
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
      const cytoscapeEdges = edges.map((edge, index) => ({
        data: {
          id: `edge-${index}`,
          source: edge.source,
          target: edge.target,
          weight: Math.abs(edge.correlation || edge.value || 0),
          correlation: Number(edge.correlation || edge.value || 0).toFixed(3),
          method: edge.method || 'unknown',
          edgeColor: determineEdgeColor(edge.correlation || edge.value || 0, edge.method),
          edgeWidth: Math.max(2, Math.abs(edge.correlation || edge.value || 0) * 10),
          opacity: Math.max(0.9, Math.abs(edge.correlation || edge.value || 0)), // Increased from 0.7 to 0.9 for better visibility
          pValue: edge.p_value || null,
          importance: edge.importance || null
        }
      }))
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
          }
        ],
        layout: getLayoutConfig(selectedLayout),
        zoomingEnabled: true,
        userZoomingEnabled: true,
        panningEnabled: true,
        userPanningEnabled: true,
        minZoom: 0.3,
        maxZoom: 4
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
      cyRef.current.fit()
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
    height: '600px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    overflow: 'hidden'
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
                  <li>Make sure the backend server is running on http://localhost:5001</li>
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
                <li>Ensure backend server is running at http://localhost:5001</li>
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
          
          <span style={{ fontSize: '12px', opacity: 0.7, color: 'white' }}>
            Zoom: {(currentZoom * 100).toFixed(0)}%
          </span>
        </div>          {/* Debug info */}
        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '10px', color: 'white' }}>
          Debug: User ID: {userId} | Watchlist: {watchlistData.length} stocks, Prices: {Object.keys(stockPrices).length} loaded, Nodes: {nodes.length}, Edges: {edges.length}
          <br />
          Backend Status: <span style={{ color: backendConnected ? '#22c55e' : '#ef4444' }}>
            {backendConnected ? '🟢 Connected' : '🔴 Disconnected (no correlation data available)'}
          </span>
          <br />
          {analysisStats && (
            <>
              Analysis: {analysisStats.granger_edges || 0} Granger + {analysisStats.naive_bayes_edges || 0} Naive Bayes = {analysisStats.total_edges || 0} total edges
              <br />
              Data Sources: {analysisStats.real_data_stocks || 0} real / {analysisStats.total_stocks || 0} total stocks ({analysisStats.real_data_percentage || 0}% real data)
            </>
          )}
          <br />
          Real-time Data: {Object.values(stockPrices).filter(stock => stock.isRealData).length} real, {Object.values(stockPrices).filter(stock => stock.isHistoricalData).length} historical, {Object.values(stockPrices).filter(stock => stock.isStaticData).length} static, {Object.values(stockPrices).filter(stock => stock.hasIncompleteData).length} incomplete
        </div>
      </div>
      
      <div className={styles.contentGrid}>
        <div className={styles.graphContainer}>
          {/* Graph controls */}
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
          </div>
          
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
        
        {/* Details panel */}
        {showDetails && (
          <div className={styles.sidebar}>
            <div style={{ padding: '1rem', backgroundColor: '#1f2937', borderRadius: '8px', margin: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: 'white', margin: 0 }}>Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
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

              {/* Node details */}
              {selectedNode && (
                <div style={{ color: 'white' }}>
                  <h4 style={{ color: '#22c55e', marginBottom: '0.5rem' }}>Stock: {selectedNode.name}</h4>
                  <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>Price:</span>
                      <span style={{ fontWeight: 'bold' }}>₹{selectedNode.price}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>Change:</span>
                      <span style={{ 
                        fontWeight: 'bold',
                        color: selectedNode.change >= 0 ? '#22c55e' : '#ef4444'
                      }}>
                        {selectedNode.change >= 0 ? '+' : ''}₹{selectedNode.change} ({selectedNode.changePercent}%)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>Volume:</span>
                      <span style={{ fontWeight: 'bold' }}>{selectedNode.volume?.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>Data Source:</span>
                      <span style={{ fontWeight: 'bold' }}>{selectedNode.dataSource}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Real Data:</span>
                      <span style={{ 
                        fontWeight: 'bold',
                        color: selectedNode.isRealData ? '#22c55e' : '#f59e0b'
                      }}>
                        {selectedNode.isRealData ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Edge details */}
              {selectedEdge && (
                <div style={{ color: 'white' }}>
                  <h4 style={{ color: '#3b82f6', marginBottom: '0.5rem' }}>Correlation</h4>
                  <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
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
                    {selectedEdge.pValue && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>P-value:</span>
                        <span style={{ fontWeight: 'bold' }}>{selectedEdge.pValue}</span>
                      </div>
                    )}
                    {selectedEdge.importance && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Importance:</span>
                        <span style={{ fontWeight: 'bold' }}>{selectedEdge.importance}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Analysis stats */}
              {analysisStats && !selectedNode && !selectedEdge && (
                <div style={{ color: 'white' }}>
                  <h4 style={{ color: '#8b5cf6', marginBottom: '0.5rem' }}>Analysis Summary</h4>
                  <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>Total Edges:</span>
                      <span style={{ fontWeight: 'bold' }}>{analysisStats.total_edges}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>Granger Causality:</span>
                      <span style={{ fontWeight: 'bold' }}>{analysisStats.granger_edges}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Naive Bayes:</span>
                      <span style={{ fontWeight: 'bold' }}>{analysisStats.naive_bayes_edges}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Legend */}
              <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #374151' }}>
                <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Legend</h4>
                <div style={{ fontSize: '12px', color: '#d1d5db' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#22c55e', borderRadius: '50%' }}></div>
                    <span>Positive correlation</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%' }}></div>
                    <span>Negative correlation</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '12px', height: '3px', backgroundColor: '#3b82f6' }}></div>
                    <span>Granger causality</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '3px', backgroundColor: '#10b981' }}></div>
                    <span>Naive Bayes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StockGraph
