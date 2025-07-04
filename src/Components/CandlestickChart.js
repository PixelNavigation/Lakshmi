'use client'

import { useEffect, useRef, useState } from 'react'
import styles from '../Pages/Dashboard.module.css'

export default function CandlestickChart({ symbol, data, timeframe = '1m', height = 300 }) {
  const chartContainer = useRef(null)
  const chartInstance = useRef(null)

  // Fetch Yahoo Finance data if not provided
  const [chartData, setChartData] = useState(data)
  const [loading, setLoading] = useState(!data)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!data && symbol) {
      fetchChartData()
    } else {
      setChartData(data)
    }
  }, [symbol, timeframe, data])

  const fetchChartData = async () => {
    try {
      setLoading(true)
      
      // Determine appropriate interval based on timeframe to get 20-30 candles
      let interval = '1d'
      let period = timeframe
      
      switch (timeframe) {
        case '1d':
          interval = '30m' // 30-minute intervals for 1 day = ~13 candles (market hours)
          period = '1d'
          break
        case '1m':
          interval = '1d' // Daily intervals for 1 month = ~22 candles
          period = '1mo'
          break
        case '6m':
          interval = '1wk' // Weekly intervals for 6 months = ~26 candles
          period = '6mo'
          break
        case '1y':
          interval = '1wk' // Weekly intervals for 1 year = ~52 candles
          period = '1y'
          break
        default:
          interval = '1d'
          period = timeframe
      }
      
      const response = await fetch(`/api/yahoo-finance?symbol=${symbol}&timeframe=${period}&interval=${interval}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setChartData(result.data)
        setError(null)
      } else {
        throw new Error(result.error || 'Failed to fetch chart data')
      }
    } catch (err) {
      console.error(`Error fetching chart data for ${symbol}:`, err)
      setError('Unable to load chart data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!chartData || chartData.length === 0 || !chartContainer.current) return

    // Clean up function to ensure proper disposal of resources
    const cleanupChart = () => {
      if (chartInstance.current) {
        try {
          // In lightweight-charts v4+, the method might be different
          if (typeof chartInstance.current.remove === 'function') {
            chartInstance.current.remove()
          } else if (typeof chartInstance.current.dispose === 'function') {
            chartInstance.current.dispose()
          } else {
            // Fallback: clear the container manually
            if (chartContainer.current) {
              chartContainer.current.innerHTML = ''
            }
            console.warn('Chart disposal method not found, cleared container manually')
          }
        } catch (error) {
          console.warn('Error disposing chart:', error)
          // Fallback: clear the container manually
          if (chartContainer.current) {
            try {
              chartContainer.current.innerHTML = ''
            } catch (clearError) {
              console.warn('Error clearing container:', clearError)
            }
          }
        } finally {
          chartInstance.current = null
        }
      }
    }

    // Dynamic import of LightweightCharts to ensure client-side only
    const importCharts = async () => {
      try {
        const { createChart } = await import('lightweight-charts')
        
        // Clean up any existing chart
        cleanupChart()
        
        // Ensure container still exists
        if (!chartContainer.current) return
        
        // Create the chart
        const chart = createChart(chartContainer.current, {
          width: chartContainer.current.clientWidth,
          height: height,
          layout: {
            background: { color: '#171717' },
            textColor: '#DDD',
          },
          grid: {
            vertLines: { color: '#232323' },
            horzLines: { color: '#232323' },
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            borderColor: '#333',
          },
          rightPriceScale: {
            borderColor: '#333',
          },
          crosshair: {
            vertLine: {
              color: '#555',
              labelBackgroundColor: '#FFD700',
            },
            horzLine: {
              color: '#555',
              labelBackgroundColor: '#FFD700',
            },
            mode: 1,
          },
        })
        
        // Create the candlestick series
        const candlestickSeries = chart.addCandlestickSeries({
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderDownColor: '#ef4444',
          borderUpColor: '#22c55e',
          wickDownColor: '#ef4444',
          wickUpColor: '#22c55e',
        })
          // Format data for the candlestick chart
        const formattedData = chartData.map(item => {
          try {
            return {
              time: new Date(item.date || item.timestamp || item.x).getTime() / 1000,
              open: item.open || item.o,
              high: item.high || item.h,
              low: item.low || item.l,
              close: item.close || item.c
            }
          } catch (error) {
            console.warn('Error formatting data item:', item, error)
            return null
          }
        }).filter(Boolean) // Remove any null items
        
        if (formattedData.length === 0) {
          console.warn('No valid data after formatting')
          return
        }

        candlestickSeries.setData(formattedData)

        // Add Simple Moving Averages (SMA)
        if (formattedData.length >= 20) {
          // 20-period SMA
          const sma20Series = chart.addLineSeries({
            color: '#ffd700',
            lineWidth: 2,
            title: 'SMA 20'
          })

          const sma20Data = calculateSMA(formattedData, 20)
          sma20Series.setData(sma20Data)

          // 50-period SMA (if enough data)
          if (formattedData.length >= 50) {
            const sma50Series = chart.addLineSeries({
              color: '#ff6b6b',
              lineWidth: 2,
              title: 'SMA 50'
            })

            const sma50Data = calculateSMA(formattedData, 50)
            sma50Series.setData(sma50Data)
          }
        }
        
        // Add volume histogram
        if (chartData[0]?.volume || chartData[0]?.v) {
          const volumeSeries = chart.addHistogramSeries({
            color: '#26a69a',
            priceFormat: {
              type: 'volume',
            },
            priceScaleId: '',
            scaleMargins: {
              top: 0.8,
              bottom: 0,
            },
          })
          
          const volumeData = chartData.map(item => {
            const vol = item.volume || item.v
            const isUp = (item.close || item.c) > (item.open || item.o)
            
            return {
              time: new Date(item.date || item.timestamp || item.x).getTime() / 1000,
              value: vol,
              color: isUp ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 82, 82, 0.3)',
            }
          })
          
          volumeSeries.setData(volumeData)
        }
        
        // Fit the content
        chart.timeScale().fitContent()
        
        // Store the chart instance for cleanup
        chartInstance.current = chart
        
        // Handle window resize
        const handleResize = () => {
          try {
            if (chartInstance.current && chartContainer.current) {
              chartInstance.current.resize(
                chartContainer.current.clientWidth,
                chartContainer.current.clientHeight
              )
            }
          } catch (error) {
            console.warn('Error during chart resize:', error)
          }
        }
        
        window.addEventListener('resize', handleResize)
        
        // Return cleanup function
        return () => {
          window.removeEventListener('resize', handleResize)
          try {
            cleanupChart()
          } catch (error) {
            console.warn('Error during chart cleanup:', error)
          }
        }
      } catch (err) {
        console.error('Failed to load or initialize chart:', err)
      }
    }
    
    importCharts()
    
    return () => {
      try {
        cleanupChart()
      } catch (error) {
        console.warn('Error during useEffect cleanup:', error)
      }
    }
  }, [chartData])

  // Helper function to calculate Simple Moving Average
  const calculateSMA = (data, period) => {
    const smaData = []
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close
      }
      smaData.push({
        time: data[i].time,
        value: sum / period
      })
    }
    return smaData
  }

  if (loading) {
    return (
      <div className={styles.candlestickChartContainer}>
        <div className={styles.chartHeader}>
          <h4>{symbol} - {getTimeframeLabel(timeframe)}</h4>
        </div>
        <div className={styles.loading} style={{ height: height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>Loading chart data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.candlestickChartContainer}>
        <div className={styles.chartHeader}>
          <h4>{symbol} - {getTimeframeLabel(timeframe)}</h4>
        </div>
        <div className={styles.error} style={{ height: height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.candlestickChartContainer}>
      <div className={styles.chartHeader}>
        <h4>{symbol} - {getTimeframeLabel(timeframe)}</h4>
        <div className={styles.chartLegend}>
          <span className={styles.legendItem}>
            <span className={styles.bullishDot}></span> Bullish
          </span>
          <span className={styles.legendItem}>
            <span className={styles.bearishDot}></span> Bearish
          </span>
          <span className={styles.legendItem}>
            <span style={{ color: '#ffd700' }}>━</span> SMA 20
          </span>
          <span className={styles.legendItem}>
            <span style={{ color: '#ff6b6b' }}>━</span> SMA 50
          </span>
        </div>
      </div>
      <div ref={chartContainer} className={styles.candlestickChart} style={{ height: height }}></div>
    </div>
  )
}

// Helper function to get readable timeframe labels
function getTimeframeLabel(timeframe) {
  switch(timeframe) {
    case '1d': return '1 Day'
    case '5d': return '5 Days'
    case '1m': return '1 Month'
    case '3m': return '3 Months'
    case '6m': return '6 Months'
    case '1y': return '1 Year'
    default: return timeframe
  }
}
