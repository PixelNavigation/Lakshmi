'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import styles from './StockDetail.module.css'

export default function StockDetail({ stock, onClose, onTradeComplete }) {
  const { user } = useAuth()
  const [liveData, setLiveData] = useState(stock)
  const [isLoading, setIsLoading] = useState(false)
  const [isChartLoading, setIsChartLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('1D')
  const [showTradeModal, setShowTradeModal] = useState(false)
  const [tradeType, setTradeType] = useState('BUY')
  const [quantity, setQuantity] = useState('')
  const [isTrading, setIsTrading] = useState(false)
  const [userBalance, setUserBalance] = useState(null)
  const [userHolding, setUserHolding] = useState(null)
  const chartContainerRef = useRef()
  const chart = useRef()
  const candlestickSeries = useRef()

  // Mock user ID - in a real app, this would come from authentication
  const userId = user?.id || 'user123' // Fallback for demo purposes

  // Fetch user balance and portfolio data
  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const headers = {
        'Content-Type': 'application/json'
      }
      
      // Add authorization header if user is authenticated
      if (user?.access_token) {
        headers['Authorization'] = `Bearer ${user.access_token}`
      }

      // Fetch user balance
      const balanceResponse = await fetch(`/api/user-balance?userId=${userId}`, {
        headers
      })
      const balanceResult = await balanceResponse.json()
      if (balanceResult.success) {
        setUserBalance(balanceResult.balance)
      }

      // Fetch user portfolio for this symbol
      const portfolioResponse = await fetch(`/api/user-portfolio?userId=${userId}`, {
        headers
      })
      const portfolioResult = await portfolioResponse.json()
      if (portfolioResult.success) {
        const holding = portfolioResult.portfolio.find(item => item.symbol === stock.symbol)
        setUserHolding(holding)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const handleTrade = async () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      alert('Please enter a valid quantity')
      return
    }

    const tradeQuantity = parseFloat(quantity)
    const tradePrice = liveData.price || stock.price

    if (tradeType === 'BUY' && userBalance && tradeQuantity * tradePrice > parseFloat(userBalance.inr_balance)) {
      alert('Insufficient balance')
      return
    }

    if (tradeType === 'SELL' && (!userHolding || tradeQuantity > parseFloat(userHolding.quantity))) {
      alert('Insufficient holdings')
      return
    }

    setIsTrading(true)
    try {
      const response = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          symbol: stock.symbol,
          quantity: tradeQuantity,
          price: tradePrice,
          transactionType: tradeType
        })
      })

      const result = await response.json()
      if (result.success) {
        alert(`${tradeType} order executed successfully!`)
        setShowTradeModal(false)
        setQuantity('')
        // Refresh user data locally
        fetchUserData()
        // Notify parent component to refresh Portfolio and Balance data
        if (onTradeComplete) {
          onTradeComplete({
            success: true,
            action: tradeType.toLowerCase(),
            symbol: stock.symbol,
            quantity: tradeQuantity,
            price: tradePrice
          })
        }
      } else {
        alert(`Trade failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Trade error:', error)
      alert('Network error while processing trade')
    } finally {
      setIsTrading(false)
    }
  }

  // Initialize chart
  useEffect(() => {
    const initChart = async () => {
      if (chartContainerRef.current) {
        try {
          setIsChartLoading(true)
          
          // Clear any existing chart first
          if (chart.current) {
            chart.current.remove()
            chart.current = null
            candlestickSeries.current = null
          }
          
          // Clear the container completely
          if (chartContainerRef.current) {
            chartContainerRef.current.innerHTML = ''
          }
          
          // Import lightweight-charts v4.2.0
          const { createChart, ColorType } = await import('lightweight-charts')
          
          console.log('Lightweight charts imported successfully')
          
          chart.current = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
            layout: {
              backgroundColor: '#1a202c',
              textColor: '#d1d5db',
            },
            grid: {
              vertLines: { 
                color: '#374151',
                style: 0,
                visible: true,
              },
              horzLines: { 
                color: '#374151',
                style: 0,
                visible: true,
              },
            },
            crosshair: {
              mode: 1,
              vertLine: {
                color: '#758694',
                width: 1,
                style: 2,
                visible: true,
                labelVisible: true,
              },
              horzLine: {
                color: '#758694',
                width: 1,
                style: 2,
                visible: true,
                labelVisible: true,
              },
            },
            rightPriceScale: {
              borderColor: '#485563',
              borderVisible: true,
              entireTextOnly: false,
            },
            timeScale: {
              borderColor: '#485563',
              borderVisible: true,
              timeVisible: true,
              secondsVisible: false,
              rightOffset: 5,
              fixLeftEdge: false,
              lockVisibleTimeRangeOnResize: true,
            },
            watermark: {
              visible: false,
            },
            handleScroll: {
              mouseWheel: true,
              pressedMouseMove: true,
              horzTouchDrag: true,
              vertTouchDrag: true,
            },
            handleScale: {
              axisPressedMouseMove: true,
              mouseWheel: true,
              pinch: true,
            },
          })

          console.log('Chart created successfully:', !!chart.current)

          candlestickSeries.current = chart.current.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderDownColor: '#ef5350',
            borderUpColor: '#26a69a',
            wickDownColor: '#ef5350',
            wickUpColor: '#26a69a',
            borderVisible: true,
            wickVisible: true,
            priceFormat: {
              type: 'price',
              precision: 2,
              minMove: 0.01,
            },
          })

          // Fetch real chart data
          fetchChartData()

          // Handle resize
          const handleResize = () => {
            if (chart.current) {
              chart.current.applyOptions({
                width: chartContainerRef.current.clientWidth,
                height: 400,
              })
            }
          }

          window.addEventListener('resize', handleResize)
          handleResize()

          setIsChartLoading(false)

        } catch (error) {
          console.error('Error initializing chart:', error)
          setIsChartLoading(false)
        }
      }
    }

    initChart()

    // Cleanup function
    return () => {
      if (chart.current) {
        chart.current.remove()
        chart.current = null
        candlestickSeries.current = null
      }
    }
  }, [])

  // Generate realistic chart data
  const fetchChartData = async () => {
    try {
      const response = await fetch(`/api/stock-detail?symbol=${stock.symbol}&timeframe=${timeframe}`)
      const result = await response.json()
      
      if (result.success && result.chartData && result.chartData.length > 0) {
        // Use real chart data from API
        const realChartData = result.chartData.map(candle => ({
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close
        }))
        
        if (candlestickSeries.current) {
          candlestickSeries.current.setData(realChartData)
        }
        return
      }
    } catch (error) {
      console.error('Error fetching real chart data:', error)
    }
    
    // Fallback to mock data if API fails
    generateMockChartData()
  }

  const generateMockChartData = () => {
    const data = []
    const basePrice = liveData.price || stock.price || 100
    let currentPrice = basePrice
    const now = new Date()
    
    // Generate data for the selected timeframe
    let intervals, timeStep
    switch (timeframe) {
      case '1D':
        intervals = 390 // 6.5 hours * 60 minutes
        timeStep = 60 * 1000 // 1 minute
        break
      case '5D':
        intervals = 390 * 5
        timeStep = 60 * 1000
        break
      case '1M':
        intervals = 30
        timeStep = 24 * 60 * 60 * 1000 // 1 day
        break
      case '3M':
        intervals = 90
        timeStep = 24 * 60 * 60 * 1000
        break
      case '1Y':
        intervals = 365
        timeStep = 24 * 60 * 60 * 1000
        break
      default:
        intervals = 390
        timeStep = 60 * 1000
    }

    for (let i = intervals; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * timeStep))
      const variation = (Math.random() - 0.5) * (basePrice * 0.02)
      currentPrice += variation
      
      const high = currentPrice + Math.random() * (basePrice * 0.01)
      const low = currentPrice - Math.random() * (basePrice * 0.01)
      const open = i === intervals ? basePrice : data[data.length - 1]?.close || currentPrice
      const close = currentPrice

      data.push({
        time: Math.floor(time.getTime() / 1000),
        open: Number(open.toFixed(2)),
        high: Number(Math.max(open, close, high).toFixed(2)),
        low: Number(Math.min(open, close, low).toFixed(2)),
        close: Number(close.toFixed(2)),
      })
    }

    if (candlestickSeries.current) {
      candlestickSeries.current.setData(data)
    }
  }

  // Update chart when timeframe changes
  useEffect(() => {
    if (candlestickSeries.current) {
      fetchChartData()
    }
  }, [timeframe])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/stock-detail?symbol=${stock.symbol}`)
        const result = await response.json()
        if (result.success) {
          setLiveData(result.data)
          
          // Update chart with new data point only for intraday timeframes
          if (candlestickSeries.current && (timeframe === '1D' || timeframe === '5D')) {
            const lastData = {
              time: Math.floor(Date.now() / 1000),
              open: result.data.previousClose || result.data.price,
              high: result.data.dayHigh || result.data.price,
              low: result.data.dayLow || result.data.price,
              close: result.data.price,
            }
            // Only update if we have valid price data
            if (lastData.close > 0) {
              candlestickSeries.current.update(lastData)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching live data:', error)
      }
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [stock.symbol, timeframe])

  const formatCurrency = (value, currency = 'USD') => {
    if (value === null || value === undefined || isNaN(value)) {
      return `${currency === 'USD' ? '$' : currency} --`
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value))
  }

  const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '--'
    const numValue = Number(value)
    if (numValue >= 1e9) return (numValue / 1e9).toFixed(2) + 'B'
    if (numValue >= 1e6) return (numValue / 1e6).toFixed(2) + 'M'
    if (numValue >= 1e3) return (numValue / 1e3).toFixed(2) + 'K'
    return numValue.toString()
  }

  if (!stock) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.stockInfo}>
            <h2 className={styles.stockName}>{liveData.name || stock.name}</h2>
            <span className={styles.stockSymbol}>{liveData.symbol} • {liveData.exchange || 'NSE'}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          <div className={styles.mainSection}>
            <div className={styles.priceSection}>
              <div className={styles.currentPrice}>
                {formatCurrency(liveData.price || stock.price, liveData.currency || stock.currency)}
              </div>
              <div className={`${styles.priceChange} ${(liveData.changePercent || stock.changePercent) >= 0 ? styles.positive : styles.negative}`}>
                <span className={styles.change}>
                  {(liveData.changePercent || stock.changePercent) >= 0 ? '+' : ''}
                  {formatCurrency(liveData.change || stock.change, liveData.currency || stock.currency)}
                </span>
                <span className={styles.changePercent}>
                  ({(liveData.changePercent || stock.changePercent) >= 0 ? '+' : ''}
                  {Number(liveData.changePercent || stock.changePercent || 0).toFixed(2)}%)
                </span>
              </div>
              <div className={styles.volume}>
                Vol {formatNumber(liveData.volume || stock.volume)}
              </div>
            </div>

            <div className={styles.chartPlaceholder}>
              <div className={styles.chartContainer}>
                <div className={styles.chartHeader}>
                  <span>Price Chart</span>
                  <div className={styles.timeframes}>
                    {['1D', '5D', '1M', '3M', '1Y'].map((tf) => (
                      <button
                        key={tf}
                        className={`${styles.timeframe} ${timeframe === tf ? styles.active : ''}`}
                        onClick={() => setTimeframe(tf)}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.chartArea}>
                  <div 
                    ref={chartContainerRef} 
                    className={styles.tradingViewChart}
                    style={{ width: '100%', height: '400px' }}
                  />
                  {isChartLoading && (
                    <div className={styles.chartLoading}>
                      <span>Loading TradingView chart...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button 
                className={styles.buyBtn}
                onClick={() => {
                  setTradeType('BUY')
                  setShowTradeModal(true)
                }}
              >
                BUY {formatCurrency(liveData.price || stock.price, liveData.currency || stock.currency)}
              </button>
              <button 
                className={styles.sellBtn}
                onClick={() => {
                  setTradeType('SELL')
                  setShowTradeModal(true)
                }}
                disabled={!userHolding || parseFloat(userHolding?.quantity || 0) <= 0}
              >
                SELL {formatCurrency(liveData.price || stock.price, liveData.currency || stock.currency)}
              </button>
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.detailsCard}>
              <h3>Holdings details</h3>
              <div className={styles.holdingInfo}>
                <div className={styles.holdingRow}>
                  <span>Net Quantity</span>
                  <span>{userHolding ? parseFloat(userHolding.quantity).toFixed(4) : '-'}</span>
                </div>
                <div className={styles.holdingRow}>
                  <span>Average Price</span>
                  <span>{userHolding ? formatCurrency(userHolding.avg_buy_price, liveData.currency || stock.currency) : '-'}</span>
                </div>
                <div className={styles.holdingRow}>
                  <span>Total Invested</span>
                  <span>{userHolding ? formatCurrency(userHolding.total_invested, liveData.currency || stock.currency) : '-'}</span>
                </div>
                <div className={styles.holdingRow}>
                  <span>Current Value</span>
                  <span>{userHolding && (liveData.price || stock.price) ? formatCurrency(parseFloat(userHolding.quantity) * (liveData.price || stock.price), liveData.currency || stock.currency) : '-'}</span>
                </div>
              </div>

              <h4>Profit and loss</h4>
              <div className={styles.pnlInfo}>
                <div className={styles.holdingRow}>
                  <span>Day P&L</span>
                  <span className={userHolding && (liveData.change || stock.change) ? 
                    (parseFloat(userHolding.quantity) * (liveData.change || stock.change) >= 0 ? styles.positive : styles.negative) : ''}>
                    {userHolding && (liveData.change || stock.change) ? 
                      formatCurrency(parseFloat(userHolding.quantity) * (liveData.change || stock.change), liveData.currency || stock.currency) : '-'}
                  </span>
                </div>
                <div className={styles.holdingRow}>
                  <span>Day return %</span>
                  <span className={(liveData.changePercent || stock.changePercent) >= 0 ? styles.positive : styles.negative}>
                    {Number(liveData.changePercent || stock.changePercent || 0).toFixed(2)}%
                  </span>
                </div>
                <div className={styles.holdingRow}>
                  <span>Overall P&L</span>
                  <span className={userHolding && (liveData.price || stock.price) ? 
                    (parseFloat(userHolding.quantity) * (liveData.price || stock.price) - parseFloat(userHolding.total_invested) >= 0 ? styles.positive : styles.negative) : ''}>
                    {userHolding && (liveData.price || stock.price) ? 
                      formatCurrency(parseFloat(userHolding.quantity) * (liveData.price || stock.price) - parseFloat(userHolding.total_invested), liveData.currency || stock.currency) : '-'}
                  </span>
                </div>
                <div className={styles.holdingRow}>
                  <span>Overall return %</span>
                  <span className={userHolding && (liveData.price || stock.price) ? 
                    (((parseFloat(userHolding.quantity) * (liveData.price || stock.price) - parseFloat(userHolding.total_invested)) / parseFloat(userHolding.total_invested)) * 100 >= 0 ? styles.positive : styles.negative) : ''}>
                    {userHolding && (liveData.price || stock.price) ? 
                      (((parseFloat(userHolding.quantity) * (liveData.price || stock.price) - parseFloat(userHolding.total_invested)) / parseFloat(userHolding.total_invested)) * 100).toFixed(2) + '%' : '-'}
                  </span>
                </div>
              </div>

              <h4>Values</h4>
              <div className={styles.valuesInfo}>
                <div className={styles.holdingRow}>
                  <span>Market Cap</span>
                  <span>{formatNumber(liveData.marketCap || stock.marketCap)}</span>
                </div>
                <div className={styles.holdingRow}>
                  <span>P/E Ratio</span>
                  <span>{liveData.peRatio || stock.peRatio}</span>
                </div>
                <div className={styles.holdingRow}>
                  <span>Day High</span>
                  <span>{formatCurrency(liveData.dayHigh || stock.dayHigh, liveData.currency || stock.currency)}</span>
                </div>
                <div className={styles.holdingRow}>
                  <span>Day Low</span>
                  <span>{formatCurrency(liveData.dayLow || stock.dayLow, liveData.currency || stock.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Modal */}
        {showTradeModal && (
          <div className={styles.tradeModalOverlay}>
            <div className={styles.tradeModal}>
              <div className={styles.tradeModalHeader}>
                <h3>{tradeType} {liveData.symbol || stock.symbol}</h3>
                <button className={styles.closeTradeModal} onClick={() => setShowTradeModal(false)}>×</button>
              </div>
              <div className={styles.tradeModalContent}>
                <div className={styles.tradeInfo}>
                  <div className={styles.tradeRow}>
                    <span>Current Price:</span>
                    <span>{formatCurrency(liveData.price || stock.price, liveData.currency || stock.currency)}</span>
                  </div>
                  {userBalance && (
                    <div className={styles.tradeRow}>
                      <span>Available Balance:</span>
                      <span>{formatCurrency(userBalance.inr_balance, 'INR')}</span>
                    </div>
                  )}
                  {userHolding && tradeType === 'SELL' && (
                    <div className={styles.tradeRow}>
                      <span>Holdings:</span>
                      <span>{parseFloat(userHolding.quantity).toFixed(4)} shares</span>
                    </div>
                  )}
                </div>
                <div className={styles.tradeInputs}>
                  <label>
                    Quantity:
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Enter quantity"
                      min="0"
                      step="0.0001"
                    />
                  </label>
                  {quantity && (
                    <div className={styles.tradeSummary}>
                      <div className={styles.tradeRow}>
                        <span>Total Amount:</span>
                        <span>{formatCurrency((parseFloat(quantity) || 0) * (liveData.price || stock.price), liveData.currency || stock.currency)}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles.tradeActions}>
                  <button 
                    className={styles.cancelBtn}
                    onClick={() => setShowTradeModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className={`${styles.confirmBtn} ${tradeType === 'BUY' ? styles.buyConfirm : styles.sellConfirm}`}
                    onClick={handleTrade}
                    disabled={isTrading || !quantity || parseFloat(quantity) <= 0}
                  >
                    {isTrading ? 'Processing...' : `Confirm ${tradeType}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
