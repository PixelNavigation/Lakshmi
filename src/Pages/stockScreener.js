'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import CandlestickChart from '../Components/CandlestickChart'
import styles from './stockScreener.module.css'

export default function StockScreener() {
  const { user } = useAuth()
  const [filters, setFilters] = useState({
    marketCap: 'all',
    sector: 'all',
    type: 'all', // all, stock, crypto
    peRatio: [0, 50],
    dividendYield: [0, 10],
    priceRange: [0, 15000] // Adjusted for INR prices
  })
  
  const [screenResults, setScreenResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('preset')
  // Add state for chart modal with exchange info
  const [chartModal, setChartModal] = useState({ isOpen: false, symbol: '', displaySymbol: '', name: '', exchange: '' })
  const [chartData, setChartData] = useState([])
  const [chartLoading, setChartLoading] = useState(false)
  const [chartError, setChartError] = useState(null)
  const [chartTimeframe, setChartTimeframe] = useState('1m')
  const [addingToWatchlist, setAddingToWatchlist] = useState({})
  const [lastUpdated, setLastUpdated] = useState(null)
  const [realTimeEnabled, setRealTimeEnabled] = useState(false)
  const [userWatchlist, setUserWatchlist] = useState([])
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const userId = user?.id || 'user123' // Fallback for demo purposes
  const [savedScreens, setSavedScreens] = useState([
    'Tech Giants India',
    'High Dividend Indian Stocks', 
    'Banking Sector',
    'Crypto Leaders',
    'Green Energy India',
    'FMCG Champions'
  ])

  // Technology Sector - Expanded (NSE)
  const [stockData, setStockData] = useState([
    // Technology Sector - Expanded (NSE)
    { symbol: 'TCS.NS', displaySymbol: 'TCS', name: 'Tata Consultancy Services Ltd', price: 3420.30, change: 2.3, marketCap: 12500000000000, sector: 'Technology', pe: 28.2, dividend: 1.2, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'INFY.NS', displaySymbol: 'INFY', name: 'Infosys Ltd', price: 1450.60, change: -0.8, marketCap: 6020000000000, sector: 'Technology', pe: 26.8, dividend: 1.8, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'WIPRO.NS', displaySymbol: 'WIPRO', name: 'Wipro Ltd', price: 420.70, change: -1.2, marketCap: 2310000000000, sector: 'Technology', pe: 21.5, dividend: 2.1, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'HCLTECH.NS', displaySymbol: 'HCLTECH', name: 'HCL Technologies Ltd', price: 1285.50, change: 1.8, marketCap: 3480000000000, sector: 'Technology', pe: 23.4, dividend: 2.5, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'TECHM.NS', displaySymbol: 'TECHM', name: 'Tech Mahindra Ltd', price: 1675.25, change: 0.9, marketCap: 1630000000000, sector: 'Technology', pe: 19.8, dividend: 1.6, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'LTIM.NS', displaySymbol: 'LTIM', name: 'LTIMindtree Ltd', price: 5240.80, change: 2.1, marketCap: 1560000000000, sector: 'Technology', pe: 31.2, dividend: 1.3, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'COFORGE.NS', displaySymbol: 'COFORGE', name: 'Coforge Ltd', price: 4850.75, change: 1.5, marketCap: 800000000000, sector: 'Technology', pe: 24.8, dividend: 0.8, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'PERSISTENT.NS', displaySymbol: 'PERSISTENT', name: 'Persistent Systems Ltd', price: 5680.90, change: 3.2, marketCap: 900000000000, sector: 'Technology', pe: 42.1, dividend: 0.6, type: 'stock', currency: 'INR', exchange: 'NSE' },
    
    // Banking Sector - Expanded (NSE)
    { symbol: 'HDFCBANK.NS', displaySymbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: 1650.40, change: 1.2, marketCap: 9180000000000, sector: 'Banking', pe: 18.5, dividend: 1.1, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'ICICIBANK.NS', displaySymbol: 'ICICIBANK', name: 'ICICI Bank Ltd', price: 1120.25, change: 0.9, marketCap: 7890000000000, sector: 'Banking', pe: 16.8, dividend: 1.4, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'SBIN.NS', displaySymbol: 'SBIN', name: 'State Bank of India', price: 785.60, change: 2.8, marketCap: 7020000000000, sector: 'Banking', pe: 12.4, dividend: 3.2, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'KOTAKBANK.NS', displaySymbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', price: 1740.80, change: 1.6, marketCap: 3460000000000, sector: 'Banking', pe: 15.9, dividend: 0.7, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'AXISBANK.NS', displaySymbol: 'AXISBANK', name: 'Axis Bank Ltd', price: 1095.45, change: 0.8, marketCap: 3350000000000, sector: 'Banking', pe: 14.2, dividend: 0.9, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'INDUSINDBK.NS', displaySymbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd', price: 985.70, change: -0.5, marketCap: 770000000000, sector: 'Banking', pe: 13.8, dividend: 1.8, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'BANKBARODA.NS', displaySymbol: 'BANKBARODA', name: 'Bank of Baroda', price: 185.30, change: 1.9, marketCap: 960000000000, sector: 'Banking', pe: 6.8, dividend: 4.1, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'PNB.NS', displaySymbol: 'PNB', name: 'Punjab National Bank', price: 98.75, change: 2.4, marketCap: 1050000000000, sector: 'Banking', pe: 7.2, dividend: 3.8, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'IDFCFIRSTB.NS', displaySymbol: 'IDFCFIRSTB', name: 'IDFC First Bank Ltd', price: 78.90, change: 1.1, marketCap: 540000000000, sector: 'Banking', pe: 18.5, dividend: 0, type: 'stock', currency: 'INR', exchange: 'NSE' },
    
    // BSE Banking Stocks
    { symbol: 'HDFCBANK.BO', displaySymbol: 'HDFCBANK', name: 'HDFC Bank Ltd (BSE)', price: 1649.85, change: 1.1, marketCap: 9180000000000, sector: 'Banking', pe: 18.5, dividend: 1.1, type: 'stock', currency: 'INR', exchange: 'BSE' },
    { symbol: 'FEDERALBNK.BO', displaySymbol: 'FEDERALBNK', name: 'Federal Bank Ltd (BSE)', price: 145.20, change: 1.8, marketCap: 315000000000, sector: 'Banking', pe: 8.9, dividend: 2.1, type: 'stock', currency: 'INR', exchange: 'BSE' },
    
    // Green Energy/Renewable Energy - Expanded (NSE)
    { symbol: 'ADANIGREEN.NS', displaySymbol: 'ADANIGREEN', name: 'Adani Green Energy Ltd', price: 920.80, change: 3.5, marketCap: 1450000000000, sector: 'Renewable Energy', pe: 35.2, dividend: 0, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'SUZLON.NS', displaySymbol: 'SUZLON', name: 'Suzlon Energy Ltd', price: 48.75, change: 5.8, marketCap: 650000000000, sector: 'Renewable Energy', pe: 45.8, dividend: 0, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'TATAPOWER.NS', displaySymbol: 'TATAPOWER', name: 'Tata Power Company Ltd', price: 385.40, change: 2.9, marketCap: 1230000000000, sector: 'Renewable Energy', pe: 28.4, dividend: 1.2, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'NTPC.NS', displaySymbol: 'NTPC', name: 'NTPC Ltd', price: 355.60, change: 1.4, marketCap: 3450000000000, sector: 'Renewable Energy', pe: 16.8, dividend: 2.8, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'POWERGRID.NS', displaySymbol: 'POWERGRID', name: 'Power Grid Corporation', price: 295.80, change: 0.8, marketCap: 2750000000000, sector: 'Renewable Energy', pe: 14.2, dividend: 3.5, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'RPOWER.NS', displaySymbol: 'RPOWER', name: 'Reliance Power Ltd', price: 28.45, change: 4.2, marketCap: 180000000000, sector: 'Renewable Energy', pe: 42.1, dividend: 0, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'JSWENERGY.NS', displaySymbol: 'JSWENERGY', name: 'JSW Energy Ltd', price: 485.90, change: 3.1, marketCap: 780000000000, sector: 'Renewable Energy', pe: 22.6, dividend: 0.8, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'THERMAX.NS', displaySymbol: 'THERMAX', name: 'Thermax Ltd', price: 3250.75, change: 2.2, marketCap: 390000000000, sector: 'Renewable Energy', pe: 24.8, dividend: 1.1, type: 'stock', currency: 'INR', exchange: 'NSE' },
    
    // FMCG Sector - Expanded (NSE)
    { symbol: 'ITC.NS', displaySymbol: 'ITC', name: 'ITC Ltd', price: 420.15, change: -0.3, marketCap: 5230000000000, sector: 'FMCG', pe: 22.4, dividend: 5.2, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'HINDUNILVR.NS', displaySymbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', price: 2650.80, change: 1.1, marketCap: 6200000000000, sector: 'FMCG', pe: 58.2, dividend: 1.8, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'NESTLEIND.NS', displaySymbol: 'NESTLEIND', name: 'Nestle India Ltd', price: 2380.45, change: 0.9, marketCap: 2290000000000, sector: 'FMCG', pe: 75.4, dividend: 1.2, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'BRITANNIA.NS', displaySymbol: 'BRITANNIA', name: 'Britannia Industries Ltd', price: 4850.90, change: 1.8, marketCap: 1170000000000, sector: 'FMCG', pe: 42.1, dividend: 1.5, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'DABUR.NS', displaySymbol: 'DABUR', name: 'Dabur India Ltd', price: 495.60, change: 0.7, marketCap: 880000000000, sector: 'FMCG', pe: 48.2, dividend: 2.1, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'MARICO.NS', displaySymbol: 'MARICO', name: 'Marico Ltd', price: 580.25, change: 1.4, marketCap: 760000000000, sector: 'FMCG', pe: 52.8, dividend: 1.8, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'COLPAL.NS', displaySymbol: 'COLPAL', name: 'Colgate Palmolive India Ltd', price: 2285.75, change: 0.6, marketCap: 580000000000, sector: 'FMCG', pe: 38.9, dividend: 2.4, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'GODREJCP.NS', displaySymbol: 'GODREJCP', name: 'Godrej Consumer Products Ltd', price: 1180.40, change: 2.1, marketCap: 1200000000000, sector: 'FMCG', pe: 45.6, dividend: 1.6, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'TATACONSUM.NS', displaySymbol: 'TATACONSUM', name: 'Tata Consumer Products Ltd', price: 890.80, change: 1.9, marketCap: 820000000000, sector: 'FMCG', pe: 52.4, dividend: 1.3, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'EMAMILTD.NS', displaySymbol: 'EMAMILTD', name: 'Emami Ltd', price: 485.65, change: 0.8, marketCap: 440000000000, sector: 'FMCG', pe: 28.4, dividend: 2.8, type: 'stock', currency: 'INR', exchange: 'NSE' },
    
    // BSE FMCG Stocks
    { symbol: 'ITC.BO', displaySymbol: 'ITC', name: 'ITC Ltd (BSE)', price: 419.90, change: -0.4, marketCap: 5230000000000, sector: 'FMCG', pe: 22.4, dividend: 5.2, type: 'stock', currency: 'INR', exchange: 'BSE' },
    { symbol: 'PATANJALI.BO', displaySymbol: 'PATANJALI', name: 'Patanjali Foods Ltd (BSE)', price: 1675.45, change: 2.1, marketCap: 280000000000, sector: 'FMCG', pe: 35.8, dividend: 1.2, type: 'stock', currency: 'INR', exchange: 'BSE' },
    
    // Other Sectors (NSE)
    { symbol: 'RELIANCE.NS', displaySymbol: 'RELIANCE', name: 'Reliance Industries Ltd', price: 2650.75, change: 1.8, marketCap: 17900000000000, sector: 'Energy', pe: 24.5, dividend: 0.5, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'BHARTIARTL.NS', displaySymbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', price: 1580.90, change: 1.7, marketCap: 9250000000000, sector: 'Telecom', pe: 19.8, dividend: 0.8, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'MARUTI.NS', displaySymbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', price: 10850.45, change: 2.1, marketCap: 3280000000000, sector: 'Automotive', pe: 24.6, dividend: 1.9, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'LT.NS', displaySymbol: 'LT', name: 'Larsen & Toubro Ltd', price: 3450.80, change: 1.9, marketCap: 4830000000000, sector: 'Infrastructure', pe: 28.2, dividend: 1.4, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'ASIANPAINT.NS', displaySymbol: 'ASIANPAINT', name: 'Asian Paints Ltd', price: 2985.60, change: 0.8, marketCap: 2860000000000, sector: 'Paints', pe: 45.8, dividend: 1.1, type: 'stock', currency: 'INR', exchange: 'NSE' },
    { symbol: 'TATASTEEL.NS', displaySymbol: 'TATASTEEL', name: 'Tata Steel Ltd', price: 135.40, change: 2.4, marketCap: 1650000000000, sector: 'Steel', pe: 48.2, dividend: 2.8, type: 'stock', currency: 'INR', exchange: 'NSE' },
    
    // BSE Other Sectors
    { symbol: 'RELIANCE.BO', displaySymbol: 'RELIANCE', name: 'Reliance Industries Ltd (BSE)', price: 2649.20, change: 1.7, marketCap: 17900000000000, sector: 'Energy', pe: 24.5, dividend: 0.5, type: 'stock', currency: 'INR', exchange: 'BSE' },
    { symbol: 'JSWSTEEL.BO', displaySymbol: 'JSWSTEEL', name: 'JSW Steel Ltd (BSE)', price: 915.80, change: 1.9, marketCap: 2280000000000, sector: 'Steel', pe: 32.1, dividend: 1.8, type: 'stock', currency: 'INR', exchange: 'BSE' },
    
    // Cryptocurrencies
    { symbol: 'BTCINR', displaySymbol: 'BTC', name: 'Bitcoin', price: 5125000, change: 4.2, marketCap: 102500000000000, sector: 'Cryptocurrency', pe: 0, dividend: 0, type: 'crypto', currency: 'INR', exchange: 'CRYPTO' },
    { symbol: 'ETHINR', displaySymbol: 'ETH', name: 'Ethereum', price: 310000, change: 2.8, marketCap: 37250000000000, sector: 'Cryptocurrency', pe: 0, dividend: 0, type: 'crypto', currency: 'INR', exchange: 'CRYPTO' },
    { symbol: 'ADAINR', displaySymbol: 'ADA', name: 'Cardano', price: 45.50, change: -1.5, marketCap: 1550000000000, sector: 'Cryptocurrency', pe: 0, dividend: 0, type: 'crypto', currency: 'INR', exchange: 'CRYPTO' },
    { symbol: 'DOGEINR', displaySymbol: 'DOGE', name: 'Dogecoin', price: 28.75, change: 5.8, marketCap: 4120000000000, sector: 'Cryptocurrency', pe: 0, dividend: 0, type: 'crypto', currency: 'INR', exchange: 'CRYPTO' },
    { symbol: 'MATICINR', displaySymbol: 'MATIC', name: 'Polygon', price: 72.30, change: 3.2, marketCap: 6750000000000, sector: 'Cryptocurrency', pe: 0, dividend: 0, type: 'crypto', currency: 'INR', exchange: 'CRYPTO' },
    { symbol: 'SOLINR', displaySymbol: 'SOL', name: 'Solana', price: 12650.80, change: 6.5, marketCap: 5640000000000, sector: 'Cryptocurrency', pe: 0, dividend: 0, type: 'crypto', currency: 'INR', exchange: 'CRYPTO' }
  ])

  // Open chart modal with symbol info
  const openChart = async (stock) => {
    setChartModal({
      isOpen: true,
      symbol: stock.symbol,
      displaySymbol: stock.displaySymbol,
      name: stock.name,
      exchange: stock.exchange
    })
    
    // Fetch chart data when opening the modal
    setChartLoading(true)
    setChartError(null)
    
    try {
      console.log(`Opening chart for ${stock.symbol} with timeframe ${chartTimeframe}`)
      
      // Use the Yahoo Finance API endpoint to fetch data
      const response = await fetch(`/api/yahoo-finance?symbol=${encodeURIComponent(stock.symbol)}&timeframe=${chartTimeframe}&interval=1d`)
      
      console.log(`Response status: ${response.status}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API Error Response: ${errorText}`)
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`API Response:`, data)
      
      if (data.success && data.data && data.data.length > 0) {
        console.log(`Successfully loaded ${data.data.length} data points`)
        setChartData(data.data)
      } else {
        throw new Error(data.error || data.errorDetails || `No data available for ${stock.symbol}`)
      }
    } catch (error) {
      console.error(`Error fetching chart data for ${stock.symbol}:`, error)
      setChartError(`Failed to load chart data for ${stock.symbol}`)
      setChartData([])
    } finally {
      setChartLoading(false)
    }
  }

  // Close chart modal
  const closeChart = () => {
    setChartModal({ isOpen: false, symbol: '', displaySymbol: '', name: '', exchange: '' })
    setChartData([])
  }
  
  // Change chart timeframe
  const changeChartTimeframe = async (timeframe) => {
    setChartTimeframe(timeframe)
    
    if (chartModal.isOpen && chartModal.symbol) {
      setChartLoading(true)
      setChartError(null)
      
      try {
        // Determine the appropriate interval based on timeframe
        let interval = '1d'
        if (timeframe === '1d') interval = '15m'
        if (timeframe === '5d') interval = '1h'
        if (timeframe === '1m') interval = '1d'
        
        console.log(`Fetching data for ${chartModal.symbol} with timeframe ${timeframe} and interval ${interval}`)
        
        // Fetch data with new timeframe
        const response = await fetch(`/api/yahoo-finance?symbol=${encodeURIComponent(chartModal.symbol)}&timeframe=${timeframe}&interval=${interval}`)
        
        console.log(`Response status: ${response.status}`)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`API Error Response: ${errorText}`)
          throw new Error(`API error: ${response.status}`)
        }
        
        const data = await response.json()
        console.log(`API Response:`, data)
        
        if (data.success && data.data && data.data.length > 0) {
          console.log(`Successfully loaded ${data.data.length} data points`)
          setChartData(data.data)
        } else {
          throw new Error(data.error || data.errorDetails || `No data available for ${chartModal.symbol}`)
        }
      } catch (error) {
        console.error(`Error fetching chart data for ${chartModal.symbol}:`, error)
        setChartError(`Failed to fetch data for ${chartModal.symbol}`)
        setChartData([])
      } finally {
        setChartLoading(false)
      }
    }
  }

  // Fetch real-time data for the displayed stocks
  const fetchRealTimeData = useCallback(async () => {
    setLoading(true)
    try {
      // In a real app, we'd fetch data from an API
      // For this demo, we'll simulate updates
      const updatedData = stockData.map(stock => {
        // Simulate price changes
        const priceChange = (Math.random() - 0.5) * 0.02 // ±1% random change
        const newPrice = stock.price * (1 + priceChange)
        const newChange = stock.change + priceChange * 100
        
        return {
          ...stock,
          price: newPrice,
          change: newChange
        }
      })
      
      setStockData(updatedData)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Error fetching real-time data:', error)
    } finally {
      setLoading(false)
    }
  }, [stockData])

  // Filter stocks based on user criteria
  const filterStocks = useCallback(() => {
    let results = [...stockData]
    
    // Apply filters
    if (filters.marketCap !== 'all') {
      const ranges = {
        'large': [5000000000000, Infinity],
        'mid': [500000000000, 5000000000000],
        'small': [0, 500000000000]
      }
      
      const [min, max] = ranges[filters.marketCap] || [0, Infinity]
      results = results.filter(stock => stock.marketCap >= min && stock.marketCap <= max)
    }
    
    if (filters.sector !== 'all') {
      results = results.filter(stock => stock.sector === filters.sector)
    }
    
    if (filters.type !== 'all') {
      results = results.filter(stock => stock.type === filters.type)
    }
    
    // Filter by PE ratio
    results = results.filter(stock => 
      stock.pe >= filters.peRatio[0] && 
      stock.pe <= filters.peRatio[1]
    )
    
    // Filter by dividend yield
    results = results.filter(stock => 
      stock.dividend >= filters.dividendYield[0] && 
      stock.dividend <= filters.dividendYield[1]
    )
    
    // Filter by price range
    results = results.filter(stock => 
      stock.price >= filters.priceRange[0] && 
      stock.price <= filters.priceRange[1]
    )
    
    setScreenResults(results)
  }, [filters, stockData])

  // Run preset screens
  const runPresetScreen = (presetName) => {
    let newFilters = { ...filters }
    
    switch(presetName) {
      case 'Tech Giants India':
        newFilters = {
          marketCap: 'large',
          sector: 'Technology',
          type: 'stock',
          peRatio: [0, 50],
          dividendYield: [0, 10],
          priceRange: [0, 15000]
        }
        break
      case 'High Dividend Indian Stocks':
        newFilters = {
          marketCap: 'all',
          sector: 'all',
          type: 'stock',
          peRatio: [0, 30],
          dividendYield: [2, 10],
          priceRange: [0, 15000]
        }
        break
      case 'Banking Sector':
        newFilters = {
          marketCap: 'all',
          sector: 'Banking',
          type: 'stock',
          peRatio: [0, 50],
          dividendYield: [0, 10],
          priceRange: [0, 15000]
        }
        break
      // Additional presets as needed
      default:
        break
    }
    
    setFilters(newFilters)
  }

  // Add to watchlist function
  const addToWatchlist = async (stock) => {
    if (addingToWatchlist[stock.symbol]) return
    
    setAddingToWatchlist(prev => ({ ...prev, [stock.symbol]: true }))
    
    try {
      // Call the API to add the stock to user's watchlist
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          symbol: stock.symbol,
          displaySymbol: stock.displaySymbol,
          name: stock.name,
          exchange: stock.exchange || 'NSE'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Refresh the watchlist to include the new stock
        await fetchUserWatchlist()
        alert(`${stock.name} (${stock.displaySymbol}) added to your watchlist`)
      } else {
        throw new Error(data.error || 'Failed to add to watchlist')
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      alert('Failed to add to watchlist')
    } finally {
      setAddingToWatchlist(prev => ({ ...prev, [stock.symbol]: false }))
    }
  }

  // Fetch user's watchlist
  const fetchUserWatchlist = async () => {
    setWatchlistLoading(true)
    try {
      const response = await fetch(`/api/user-watchlist?userId=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setUserWatchlist(data.watchlist || [])
      } else {
        console.error('Error fetching watchlist:', data.error)
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error)
    } finally {
      setWatchlistLoading(false)
    }
  }

  // Check if a stock is in the watchlist
  const isStockInWatchlist = (symbol) => {
    return userWatchlist.some(item => item.symbol === symbol)
  }

  // Run screen when filters change
  useEffect(() => {
    filterStocks()
  }, [filters, filterStocks])

  // Fetch user's watchlist on component mount
  useEffect(() => {
    if (userId) {
      fetchUserWatchlist()
    }
  }, [userId])

  // Real-time updates
  useEffect(() => {
    let intervalId
    
    if (realTimeEnabled) {
      // Initial fetch
      fetchRealTimeData()
      
      // Set up interval
      intervalId = setInterval(fetchRealTimeData, 10000) // Every 10 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [realTimeEnabled, fetchRealTimeData])

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>🔍 <span className={styles.pageTitle}>Stock Screener</span></h1>
        <div className={styles.realTimeControls}>
          <button 
            className={`${styles.realTimeBtn} ${realTimeEnabled ? styles.active : ''}`}
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
          >
            {realTimeEnabled ? '🔴 Live Data ON' : '⚪ Live Data OFF'}
          </button>
          <button 
            className={styles.refreshBtn}
            onClick={fetchRealTimeData}
            disabled={loading}
          >
            {loading ? '⏳ Updating...' : '🔄 Refresh Now'}
          </button>
          {lastUpdated && (
            <div className={styles.lastUpdated}>
              Last updated: {lastUpdated}
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.tabContainer}>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'preset' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('preset')}
          >
            Preset Screens
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'custom' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('custom')}
          >
            Custom Screen
          </button>
        </div>
        
        <div className={styles.tabContent}>
          {activeTab === 'preset' ? (
            <div className={styles.presetScreens}>
              <h3>Select a Preset Screen</h3>
              <div className={styles.presetGrid}>
                {savedScreens.map((screen, index) => (
                  <button 
                    key={index}
                    className={styles.presetBtn}
                    onClick={() => runPresetScreen(screen)}
                  >
                    {screen}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.customScreen}>
              <h3>Create Custom Screen</h3>
              <div className={styles.filterGroup}>
                <div className={styles.filterRow}>
                  <div className={styles.filterItem}>
                    <label>Market Cap</label>
                    <select 
                      value={filters.marketCap}
                      onChange={(e) => setFilters({...filters, marketCap: e.target.value})}
                    >
                      <option value="all">All</option>
                      <option value="large">Large Cap ({'>'}₹5T)</option>
                      <option value="mid">Mid Cap (₹500B-₹5T)</option>
                      <option value="small">Small Cap ({'<'}₹500B)</option>
                    </select>
                  </div>
                  
                  <div className={styles.filterItem}>
                    <label>Sector</label>
                    <select 
                      value={filters.sector}
                      onChange={(e) => setFilters({...filters, sector: e.target.value})}
                    >
                      <option value="all">All Sectors</option>
                      <option value="Technology">Technology</option>
                      <option value="Banking">Banking</option>
                      <option value="FMCG">FMCG</option>
                      <option value="Renewable Energy">Renewable Energy</option>
                      <option value="Energy">Energy</option>
                      <option value="Telecom">Telecom</option>
                      <option value="Automotive">Automotive</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Paints">Paints</option>
                      <option value="Steel">Steel</option>
                    </select>
                  </div>
                </div>
                
                {/* Add more filter options as needed */}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.resultsContainer}>
        <h3>Results ({screenResults.length} stocks)</h3>
        <div className={styles.resultsHeader}>
          <div className={styles.symbol}>Symbol</div>
          <div className={styles.name}>Name</div>
          <div className={styles.price}>Price</div>
          <div className={styles.change}>Change</div>
          <div className={styles.marketCap}>Market Cap</div>
          <div className={styles.pe}>P/E</div>
          <div className={styles.dividend}>Div %</div>
          <div className={styles.actions}>Actions</div>
        </div>
        
        {loading ? (
          <div className={styles.loading}>Loading results...</div>
        ) : screenResults.length === 0 ? (
          <div className={styles.noResults}>No stocks match your criteria</div>
        ) : (
          <div className={styles.resultsList}>
            {screenResults.map(stock => (
              <div key={stock.symbol} className={styles.resultRow}>
                <div className={styles.symbol}>{stock.displaySymbol}</div>
                <div className={styles.name}>{stock.name}</div>
                <div className={styles.price}>₹{stock.price.toFixed(2)}</div>
                <div className={`${styles.change} ${stock.change >= 0 ? styles.positive : styles.negative}`}>
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                </div>
                <div className={styles.marketCap}>
                  ₹{(stock.marketCap / 1000000000000).toFixed(2)}T
                </div>
                <div className={styles.pe}>{stock.pe.toFixed(1)}</div>
                <div className={styles.dividend}>{stock.dividend.toFixed(1)}%</div>
                <div className={styles.actions}>
                  <button 
                    className={styles.viewChartBtn}
                    onClick={() => openChart(stock)}
                  >
                    📈 Chart
                  </button>
                  {isStockInWatchlist(stock.symbol) ? (
                    <button 
                      className={`${styles.addToWatchlistBtn} ${styles.alreadyAdded}`}
                      disabled={true}
                    >
                      ✓ Already Added
                    </button>
                  ) : (
                    <button 
                      className={styles.addToWatchlistBtn}
                      onClick={() => addToWatchlist(stock)}
                      disabled={addingToWatchlist[stock.symbol]}
                    >
                      {addingToWatchlist[stock.symbol] ? '⏳ Adding...' : '+ Add to Watchlist'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chart Modal */}
      {chartModal.isOpen && (
        <div className={styles.chartModalOverlay} onClick={closeChart}>
          <div className={styles.chartModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.chartModalHeader}>
              <h3>{chartModal.name} ({chartModal.displaySymbol})</h3>
              <div className={styles.exchangeBadge}>{chartModal.exchange}</div>
              <button className={styles.closeBtn} onClick={closeChart}>×</button>
            </div>
            <div className={styles.chartContainer}>
              {chartLoading ? (
                <div className={styles.chartLoading}>Loading chart data...</div>
              ) : chartError ? (
                <div className={styles.chartError}>{chartError}</div>
              ) : chartData && chartData.length > 0 ? (
                <CandlestickChart 
                  symbol={chartModal.displaySymbol}
                  data={chartData}
                  timeframe={chartTimeframe}
                />
              ) : (
                <div className={styles.chartError}>No chart data available</div>
              )}
              
              <div className={styles.timeframeSelector}>
                <button 
                  className={chartTimeframe === '1d' ? styles.activeTimeframe : ''}
                  onClick={() => changeChartTimeframe('1d')}
                >
                  1D
                </button>
                <button 
                  className={chartTimeframe === '5d' ? styles.activeTimeframe : ''}
                  onClick={() => changeChartTimeframe('5d')}
                >
                  1W
                </button>
                <button 
                  className={chartTimeframe === '1m' ? styles.activeTimeframe : ''}
                  onClick={() => changeChartTimeframe('1m')}
                >
                  1M
                </button>
              </div>
              
              <div className={styles.chartInfo}>
                <p><strong>Symbol:</strong> {chartModal.displaySymbol}</p>
                <p><strong>Company:</strong> {chartModal.name}</p>
                <p><strong>Exchange:</strong> {chartModal.exchange}</p>
                <p><strong>Data Source:</strong> Yahoo Finance</p>
                {realTimeEnabled && (
                  <p className={styles.liveLabel}>🔴 LIVE DATA</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
