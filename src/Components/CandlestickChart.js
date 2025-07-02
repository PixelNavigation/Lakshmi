'use client'

import { useEffect, useRef } from 'react'
import styles from '../Pages/Dashboard.module.css'

export default function CandlestickChart({ symbol, data, timeframe = '1m' }) {
  const chartContainer = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    if (!data || data.length === 0 || !chartContainer.current) return

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
          height: 300,
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
        const formattedData = data.map(item => {
          try {
            return {
              time: new Date(item.x || item.timestamp || item.date).getTime() / 1000,
              open: item.o || item.open,
              high: item.h || item.high,
              low: item.l || item.low,
              close: item.c || item.close
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
        
        // Add volume histogram
        if (data[0]?.v || data[0]?.volume) {
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
          
          const volumeData = data.map(item => {
            const vol = item.v || item.volume
            const isUp = item.c > item.o || item.close > item.open
            
            return {
              time: new Date(item.x || item.timestamp || item.date).getTime() / 1000,
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
  }, [data])

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
        </div>
      </div>
      <div ref={chartContainer} className={styles.candlestickChart}></div>
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
