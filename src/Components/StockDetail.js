'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './StockDetail.module.css'

export default function StockDetail({ stock, onClose }) {
  const [liveData, setLiveData] = useState(stock)
  const [isLoading, setIsLoading] = useState(false)
  const [isChartLoading, setIsChartLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('1D')
  const chartContainerRef = useRef()
  const chart = useRef()
  const candlestickSeries = useRef()

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
              <button className={styles.buyBtn}>
                BUY {formatCurrency(liveData.price || stock.price, liveData.currency || stock.currency)}
              </button>
              <button className={styles.sellBtn}>
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
                  <span>-</span>
                </div>
                <div className={styles.holdingRow}>
                  <span>Used quantity</span>
                  <span>0</span>
                </div>
                <div className={styles.holdingRow}>
                  <span>Total quantity</span>
                  <span>-</span>
                </div>
              </div>

              <h4>Profit and loss</h4>
              <div className={styles.pnlInfo}>
                <div className={styles.holdingRow}>
                  <span>Day</span>
                  <span className={styles.negative}>-</span>
                </div>
                <div className={styles.holdingRow}>
                  <span>Day return %</span>
                  <span className={styles.negative}>
                    {Number(liveData.changePercent || stock.changePercent || 0).toFixed(2)}%
                  </span>
                </div>
                <div className={styles.holdingRow}>
                  <span>Overall</span>
                  <span className={styles.negative}>-</span>
                </div>
                <div className={styles.holdingRow}>
                  <span>Overall return %</span>
                  <span className={styles.negative}>-</span>
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
      </div>
    </div>
  )
}
