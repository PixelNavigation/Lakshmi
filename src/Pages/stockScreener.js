'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { StockChart } from '../Components/TradingView/StockChart'
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
  const [addingToWatchlist, setAddingToWatchlist] = useState({})
  const [lastUpdated, setLastUpdated] = useState(null)
  const [realTimeEnabled, setRealTimeEnabled] = useState(false)
  const userId = user?.id || 'user123' // Fallback for demo purposes
  const [savedScreens, setSavedScreens] = useState([
    'Tech Giants India',
    'High Dividend Indian Stocks', 
    'Banking Sector',
    'Crypto Leaders',
    'Green Energy India',
    'FMCG Champions'
  ])

  // Enhanced Indian stocks and crypto data with real-time integration
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

  // Fetch real-time data from Yahoo Finance API
  const fetchRealTimeData = useCallback(async () => {
    try {
      setLoading(true)
      const symbols = stockData.map(stock => stock.symbol).join(',')
      
      // Using Yahoo Finance API alternative or proxy
      const response = await fetch(`/api/stock-prices?symbols=${symbols}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setStockData(prevData => 
          prevData.map(stock => {
            const liveData = result.data.find(item => item.symbol === stock.symbol)
            if (liveData) {
              return {
                ...stock,
                price: liveData.price || stock.price,
                change: liveData.change || stock.change,
                marketCap: liveData.marketCap || stock.marketCap
              }
            }
            return stock
          })
        )
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Error fetching real-time data:', error)
      // Fallback to mock data updates
      setStockData(prevData => 
        prevData.map(stock => {
          const priceChange = (Math.random() - 0.5) * 0.02 // ±1% random change
          const newPrice = stock.price * (1 + priceChange)
          const newChange = ((newPrice - stock.price) / stock.price) * 100
          
          return {
            ...stock,
            price: Math.max(0.01, newPrice),
            change: newChange
          }
        })
      )
      setLastUpdated(new Date())
    } finally {
      setLoading(false)
    }
  }, [stockData])

  // Filter stocks based on criteria
  const filterStocks = useCallback(() => {
    return stockData.filter(stock => {
      // Type filter (stock or crypto)
      if (filters.type !== 'all' && stock.type !== filters.type) return false
      
      // Market cap filter
      if (filters.marketCap !== 'all') {
        if (filters.marketCap === 'large' && stock.marketCap < 1000000000000) return false // 1T INR
        if (filters.marketCap === 'mid' && (stock.marketCap < 200000000000 || stock.marketCap > 1000000000000)) return false // 200B-1T INR
        if (filters.marketCap === 'small' && stock.marketCap > 200000000000) return false // <200B INR
      }
      
      // Sector filter
      if (filters.sector !== 'all' && stock.sector.toLowerCase() !== filters.sector.toLowerCase()) return false
      
      // P/E Ratio filter (skip for crypto)
      if (stock.type !== 'crypto' && (stock.pe < filters.peRatio[0] || stock.pe > filters.peRatio[1])) return false
      
      // Dividend yield filter (skip for crypto)
      if (stock.type !== 'crypto' && (stock.dividend < filters.dividendYield[0] || stock.dividend > filters.dividendYield[1])) return false
      
      // Price range filter
      if (stock.price < filters.priceRange[0] || stock.price > filters.priceRange[1]) return false
      
      return true
    })
  }, [filters, stockData])

  // Run screening
  const runScreen = async () => {
    setLoading(true)
    // Simulate API call delay
    setTimeout(() => {
      const results = filterStocks()
      setScreenResults(results)
      setLoading(false)
    }, 500)
  }

  // Add stock to watchlist
  const addToWatchlist = async (stock) => {
    try {
      setAddingToWatchlist(prev => ({ ...prev, [stock.symbol]: true }))
      
      const response = await fetch('/api/user-watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          symbol: stock.symbol,
          name: stock.name,
          action: 'add'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Show success message or update UI
        alert(`${stock.name} added to watchlist successfully!`)
      } else {
        alert(result.error || 'Failed to add to watchlist')
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      alert('Failed to add to watchlist')
    } finally {
      setAddingToWatchlist(prev => ({ ...prev, [stock.symbol]: false }))
    }
  }

  // Open chart modal
  const openChart = (stock) => {
    setChartModal({
      isOpen: true,
      symbol: stock.symbol,
      displaySymbol: stock.displaySymbol,
      name: stock.name,
      exchange: stock.exchange
    })
  }

  // Close chart modal
  const closeChart = () => {
    setChartModal({ isOpen: false, symbol: '', displaySymbol: '', name: '', exchange: '' })
  }

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }

  // Load a saved screen
  const loadSavedScreen = (screenName) => {
    let newFilters = { ...filters }
    
    switch(screenName) {
      case 'Tech Giants India':
        newFilters = {
          ...filters,
          sector: 'Technology',
          marketCap: 'large',
          type: 'stock',
          peRatio: [15, 50]
        }
        break
      case 'High Dividend Indian Stocks':
        newFilters = {
          ...filters,
          dividendYield: [3, 10],
          type: 'stock',
          peRatio: [0, 25],
          sector: 'all'
        }
        break
      case 'Banking Sector':
        newFilters = {
          ...filters,
          sector: 'Banking',
          type: 'stock',
          marketCap: 'large',
          peRatio: [10, 25]
        }
        break
      case 'Crypto Leaders':
        newFilters = {
          ...filters,
          type: 'crypto',
          marketCap: 'large',
          sector: 'Cryptocurrency'
        }
        break
      case 'Green Energy India':
        newFilters = {
          ...filters,
          sector: 'Renewable Energy',
          type: 'stock',
          marketCap: 'all',
          peRatio: [20, 50]
        }
        break
      case 'FMCG Champions':
        newFilters = {
          ...filters,
          sector: 'FMCG',
          type: 'stock',
          dividendYield: [3, 10],
          peRatio: [15, 30]
        }
        break
    }
    
    setFilters(newFilters)
    setActiveTab('results')
  }

  // Auto-run screen when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      runScreen()
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [filters])

  // Real-time data polling effect
  useEffect(() => {
    let interval
    if (realTimeEnabled) {
      // Initial fetch
      fetchRealTimeData()
      // Set up interval for every 10 seconds
      interval = setInterval(fetchRealTimeData, 10000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [realTimeEnabled, fetchRealTimeData])

  // Format market cap for INR
  const formatMarketCap = (value) => {
    if (value >= 100000000000000) return `₹${(value / 100000000000000).toFixed(1)} Lakh Cr` // 1 Lakh Crore
    if (value >= 1000000000000) return `₹${(value / 1000000000000).toFixed(1)} T` // Trillion
    if (value >= 100000000000) return `₹${(value / 100000000000).toFixed(1)} Thousand Cr` // Thousand Crore
    if (value >= 10000000000) return `₹${(value / 10000000000).toFixed(1)} Hundred Cr` // Hundred Crore
    if (value >= 1000000000) return `₹${(value / 1000000000).toFixed(1)} B` // Billion
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr` // Crore
    return `₹${value}`
  }

  // Format price in normal format (not abbreviated)
  const formatPrice = (price, currency = 'INR') => {
    if (currency === 'INR') {
      return `₹${price.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    }
    return `$${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  // Format percentage
  const formatPercentage = (value) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>🔍 Stock Screener</h1>
        <p className={styles.pageSubtitle}>Choose from preset screens or create your own</p>
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
            <span className={styles.lastUpdated}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
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
        <button 
          className={`${styles.tab} ${activeTab === 'results' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('results')}
        >
          Results ({screenResults.length})
        </button>
      </div>

      {/* Preset Screens Tab */}
      {activeTab === 'preset' && (
        <div className={styles.presetScreensGrid}>
          <div className={styles.strategyCard} onClick={() => loadSavedScreen('Tech Giants India')}>
            <div className={styles.strategyIcon}>💻</div>
            <h3 className={styles.strategyTitle}>Tech Giants India</h3>
            <p className={styles.strategyDescription}>
              Leading Indian technology companies like TCS, Infosys, and Wipro
            </p>
            <div className={styles.strategyActions}>
              <button className={styles.moreInfoBtn}>More Info</button>
              <button className={styles.loadBtn}>Load</button>
            </div>
          </div>

          <div className={styles.strategyCard} onClick={() => loadSavedScreen('High Dividend Indian Stocks')}>
            <div className={styles.strategyIcon}>�</div>
            <h3 className={styles.strategyTitle}>High Dividend Indian Stocks</h3>
            <p className={styles.strategyDescription}>
              Indian companies with consistent dividend payments and high yield
            </p>
            <div className={styles.strategyActions}>
              <button className={styles.moreInfoBtn}>More Info</button>
              <button className={styles.loadBtn}>Load</button>
            </div>
          </div>

          <div className={styles.strategyCard} onClick={() => loadSavedScreen('Banking Sector')}>
            <div className={styles.strategyIcon}>🏦</div>
            <h3 className={styles.strategyTitle}>Banking Sector</h3>
            <p className={styles.strategyDescription}>
              Top Indian banks including HDFC Bank, ICICI Bank, and others
            </p>
            <div className={styles.strategyActions}>
              <button className={styles.moreInfoBtn}>More Info</button>
              <button className={styles.loadBtn}>Load</button>
            </div>
          </div>

          <div className={styles.strategyCard} onClick={() => loadSavedScreen('Crypto Leaders')}>
            <div className={styles.strategyIcon}>₿</div>
            <h3 className={styles.strategyTitle}>Crypto Leaders</h3>
            <p className={styles.strategyDescription}>
              Top cryptocurrencies including Bitcoin, Ethereum, and other major coins
            </p>
            <div className={styles.strategyActions}>
              <button className={styles.moreInfoBtn}>More Info</button>
              <button className={styles.loadBtn}>Load</button>
            </div>
          </div>

          <div className={styles.strategyCard} onClick={() => loadSavedScreen('Green Energy India')}>
            <div className={styles.strategyIcon}>🌱</div>
            <h3 className={styles.strategyTitle}>Green Energy India</h3>
            <p className={styles.strategyDescription}>
              Indian renewable energy companies leading the green transition
            </p>
            <div className={styles.strategyActions}>
              <button className={styles.moreInfoBtn}>More Info</button>
              <button className={styles.loadBtn}>Load</button>
            </div>
          </div>

          <div className={styles.strategyCard} onClick={() => loadSavedScreen('FMCG Champions')}>
            <div className={styles.strategyIcon}>🛒</div>
            <h3 className={styles.strategyTitle}>FMCG Champions</h3>
            <p className={styles.strategyDescription}>
              Fast-moving consumer goods companies with strong market presence
            </p>
            <div className={styles.strategyActions}>
              <button className={styles.moreInfoBtn}>More Info</button>
              <button className={styles.loadBtn}>Load</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Screen Tab */}
      {activeTab === 'custom' && (
        <div className={styles.customScreenContainer}>
          <div className={styles.filterCard}>
            <h3 className={styles.filterTitle}>Build Your Custom Screen</h3>
            
            <div className={styles.filterGrid}>
              <div className={styles.filterGroup}>
                <label>Asset Type</label>
                <select 
                  className={styles.selectInput}
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="all">All Assets</option>
                  <option value="stock">Indian Stocks</option>
                  <option value="crypto">Cryptocurrencies</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label>Market Cap</label>
                <select 
                  className={styles.selectInput}
                  value={filters.marketCap}
                  onChange={(e) => handleFilterChange('marketCap', e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="large">Large Cap (&gt; ₹1T)</option>
                  <option value="mid">Mid Cap (₹200B - ₹1T)</option>
                  <option value="small">Small Cap (&lt; ₹200B)</option>
                </select>
              </div>
              
              <div className={styles.filterGroup}>
                <label>Sector</label>
                <select 
                  className={styles.selectInput}
                  value={filters.sector}
                  onChange={(e) => handleFilterChange('sector', e.target.value)}
                >
                  <option value="all">All Sectors</option>
                  <option value="Technology">Technology</option>
                  <option value="Banking">Banking</option>
                  <option value="Energy">Energy</option>
                  <option value="Renewable Energy">Renewable Energy</option>
                  <option value="FMCG">FMCG</option>
                  <option value="Telecom">Telecom</option>
                  <option value="Automotive">Automotive</option>
                  <option value="Cryptocurrency">Cryptocurrency</option>
                </select>
              </div>
              
              {filters.type !== 'crypto' && (
                <>
                  <div className={styles.filterGroup}>
                    <label>P/E Ratio: {filters.peRatio[0]} - {filters.peRatio[1]}</label>
                    <div className={styles.rangeContainer}>
                      <input 
                        type="range" 
                        min="0" 
                        max="50" 
                        value={filters.peRatio[1]}
                        onChange={(e) => handleFilterChange('peRatio', [filters.peRatio[0], parseInt(e.target.value)])}
                        className={styles.rangeInput} 
                      />
                    </div>
                  </div>
                  
                  <div className={styles.filterGroup}>
                    <label>Dividend Yield: {filters.dividendYield[0]}% - {filters.dividendYield[1]}%</label>
                    <div className={styles.rangeContainer}>
                      <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        value={filters.dividendYield[1]}
                        onChange={(e) => handleFilterChange('dividendYield', [filters.dividendYield[0], parseInt(e.target.value)])}
                        className={styles.rangeInput} 
                      />
                    </div>
                  </div>
                </>
              )}

              <div className={styles.filterGroup}>
                <label>Price Range: ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}</label>
                <div className={styles.rangeContainer}>
                  <input 
                    type="range" 
                    min="0" 
                    max="15000" 
                    value={filters.priceRange[1]}
                    onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                    className={styles.rangeInput} 
                  />
                </div>
              </div>
            </div>

            <div className={styles.quickActions}>
              <button className={styles.runScreenBtn} onClick={runScreen}>
                🔍 Run Screen
              </button>
              <button className={styles.saveScreenBtn}>
                💾 Save Screen
              </button>
              <button className={styles.resetBtn} onClick={() => setFilters({
                marketCap: 'all',
                sector: 'all',
                type: 'all',
                peRatio: [0, 50],
                dividendYield: [0, 10],
                priceRange: [0, 15000]
              })}>
                🔄 Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className={styles.resultsContainer}>
          <div className={styles.resultsHeader}>
            <h3>Screening Results</h3>
            <div className={styles.resultsStats}>
              <div className={styles.resultsCount}>
                {screenResults.length} {screenResults.length === 1 ? 'asset' : 'assets'} found
              </div>
              {realTimeEnabled && (
                <div className={styles.liveIndicator}>
                  🔴 LIVE
                </div>
              )}
            </div>
            {loading && <div className={styles.loadingIndicator}>🔄 Screening...</div>}
          </div>
          
          <div className={styles.resultsList}>
            {screenResults.length === 0 && !loading ? (
              <div className={styles.noResults}>
                <div className={styles.noResultsIcon}>📊</div>
                <h3>No Results Found</h3>
                <p>Try adjusting your criteria or selecting a preset screen</p>
              </div>
            ) : (
              <div className={styles.stockGrid}>
                {screenResults.map((stock, index) => (
                  <div key={index} className={`${styles.stockCard} ${realTimeEnabled ? styles.liveUpdate : ''}`}>
                    <div className={styles.stockHeader}>
                      <div className={styles.stockSymbol}>
                        {stock.type === 'crypto' ? '₿' : '📈'} {stock.displaySymbol}
                      </div>
                      <div className={stock.change >= 0 ? styles.positive : styles.negative}>
                        {formatPercentage(stock.change)}
                      </div>
                    </div>
                    <div className={styles.stockName}>{stock.name}</div>
                    <div className={styles.stockPrice}>
                      {formatPrice(stock.price, stock.currency)}
                    </div>
                    <div className={styles.sectorInfo}>
                      {stock.sector}
                    </div>
                    <div className={styles.stockDetails}>
                      <div className={styles.stockMetric}>
                        <span>Market Cap</span>
                        <span>{formatMarketCap(stock.marketCap)}</span>
                      </div>
                      {stock.type !== 'crypto' && (
                        <>
                          <div className={styles.stockMetric}>
                            <span>P/E Ratio</span>
                            <span>{stock.pe.toFixed(1)}</span>
                          </div>
                          <div className={styles.stockMetric}>
                            <span>Dividend</span>
                            <span>{stock.dividend.toFixed(1)}%</span>
                          </div>
                        </>
                      )}
                      <div className={styles.stockMetric}>
                        <span>Type</span>
                        <span className={styles.stockType}>
                          {stock.type === 'crypto' ? 'Crypto' : 'Stock'}
                        </span>
                      </div>
                    </div>
                    <div className={styles.stockActions}>
                      <button 
                        className={styles.chartBtn}
                        onClick={() => openChart(stock)}
                      >
                        📊 Chart
                      </button>
                      <button 
                        className={styles.addToWatchlistBtn}
                        onClick={() => addToWatchlist(stock)}
                        disabled={addingToWatchlist[stock.symbol]}
                      >
                        {addingToWatchlist[stock.symbol] ? '⏳ Adding...' : '+ Add to Watchlist'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
              <StockChart 
                symbol={
                  chartModal.exchange === 'NSE' ? `NSE:${chartModal.displaySymbol}` :
                  chartModal.exchange === 'BSE' ? `BSE:${chartModal.displaySymbol}` :
                  chartModal.exchange === 'CRYPTO' ? `BINANCE:${chartModal.displaySymbol}INR` :
                  chartModal.displaySymbol
                }
              />
              <div className={styles.chartInfo}>
                <p><strong>Symbol:</strong> {chartModal.displaySymbol}</p>
                <p><strong>Company:</strong> {chartModal.name}</p>
                <p><strong>Exchange:</strong> {chartModal.exchange}</p>
                <p><strong>Data Source:</strong> TradingView Real-time</p>
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
