'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './YahooComponents.module.css'

export default function YahooStockChart({ symbol, timeframe = '1m', interval = '1d' }) {
  const chartContainer = useRef(null)
  const chartInstance = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chartData, setChartData] = useState([])

  // Fetch data from Yahoo Finance API
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Format the symbol for Yahoo Finance if needed (add .NS for Indian stocks)
        let formattedSymbol = symbol;
        if (!/\.(NS|BO)$/.test(symbol) && !/^\^/.test(symbol)) {
          // Common Indian stocks on NSE - this is just a backup in case the API doesn't handle it
          formattedSymbol = symbol + '.NS';
        }
        
        console.log(`Fetching chart data for ${formattedSymbol} with timeframe=${timeframe}, interval=${interval}`);
        
        // Fetch data from our Yahoo Finance API endpoint
        const response = await fetch(`/api/yahoo-finance?symbol=${formattedSymbol}&timeframe=${timeframe}&interval=${interval}`)
        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch chart data')
        }
        
        if (!result.data || result.data.length === 0) {
          throw new Error('No chart data available')
        }
        
        setChartData(result.data)
      } catch (err) {
        console.error(`Error fetching chart data for ${symbol}:`, err)
        setError(err.message || 'Failed to load chart data')
      } finally {
        setLoading(false)
      }
    }
    
    if (symbol) {
      fetchChartData()
    }
  }, [symbol, timeframe, interval])

  // Render chart with lightweight-charts
  useEffect(() => {
    if (!chartData || chartData.length === 0 || !chartContainer.current) return

    // Clean up function to dispose chart
    const cleanupChart = () => {
      if (chartInstance.current) {
        try {
          if (typeof chartInstance.current.remove === 'function') {
            chartInstance.current.remove()
          } else if (typeof chartInstance.current.dispose === 'function') {
            chartInstance.current.dispose()
          } else {
            if (chartContainer.current) {
              chartContainer.current.innerHTML = ''
            }
          }
        } catch (error) {
          console.warn('Error disposing chart:', error)
          if (chartContainer.current) {
            chartContainer.current.innerHTML = ''
          }
        } finally {
          chartInstance.current = null
        }
      }
    }

    // Import and create the chart
    const importCharts = async () => {
      try {
        const { createChart } = await import('lightweight-charts')
        
        // Clean up any existing chart
        cleanupChart()
        
        // Create the chart
        const chart = createChart(chartContainer.current, {
          width: chartContainer.current.clientWidth,
          height: 400,
          layout: {
            background: { color: '#ffffff' },
            textColor: '#333',
          },
          grid: {
            vertLines: { color: '#f0f0f0' },
            horzLines: { color: '#f0f0f0' },
          },
          crosshair: {
            mode: 1,
            vertLine: { width: 1, color: '#2962FF', style: 0 },
            horzLine: { width: 1, color: '#2962FF', style: 0 },
          },
          rightPriceScale: {
            borderColor: '#dfdfdf',
          },
          timeScale: {
            borderColor: '#dfdfdf',
          },
        })
        
        // Store the chart instance
        chartInstance.current = chart
        
        // Create the series
        const candlestickSeries = chart.addCandlestickSeries({
          upColor: '#26a69a', 
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350'
        })
        
        // Format the data for lightweight-charts
        const formattedData = chartData.map(item => ({
          time: new Date(item.timestamp).toISOString().split('T')[0],
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        }))
        
        // Set the data
        candlestickSeries.setData(formattedData)
        
        // Fit the content
        chart.timeScale().fitContent()
        
        // Handle window resizing
        const resizeObserver = new ResizeObserver(entries => {
          if (entries[0].contentRect && chart) {
            chart.applyOptions({
              width: entries[0].contentRect.width,
            })
            chart.timeScale().fitContent()
          }
        })
        
        if (chartContainer.current) {
          resizeObserver.observe(chartContainer.current)
        }
        
        return () => {
          if (chartContainer.current) {
            resizeObserver.unobserve(chartContainer.current)
          }
          resizeObserver.disconnect()
          cleanupChart()
        }
      } catch (error) {
        console.error('Error creating chart:', error)
        setError('Failed to create chart. Please try again later.')
      }
    }
    
    importCharts()
    
    // Cleanup on unmount
    return () => {
      cleanupChart()
    }
  }, [chartData])

  // Timeframe selector
  const handleTimeframeChange = (newTimeframe) => {
    // This doesn't trigger a re-render directly, but the component is set up to re-fetch 
    // when timeframe prop changes, so parent should update this prop
  }

  // Function to retry chart data fetch
  const handleRetry = () => {
    if (symbol) {
      setLoading(true);
      setError(null);
      // Re-fetch data with a slight delay
      setTimeout(() => {
        // This will trigger the useEffect to run again
        const fetchChartData = async () => {
          try {
            // Format the symbol for Yahoo Finance if needed (add .NS for Indian stocks)
            let formattedSymbol = symbol;
            if (!/\.(NS|BO)$/.test(symbol) && !/^\^/.test(symbol)) {
              // Try BSE if NSE failed previously
              const useBSE = error && error.includes('Failed');
              formattedSymbol = symbol + (useBSE ? '.BO' : '.NS');
            }
            
            console.log(`Retrying chart data for ${formattedSymbol}`);
            
            // Fetch data from our Yahoo Finance API endpoint
            const response = await fetch(`/api/yahoo-finance?symbol=${formattedSymbol}&timeframe=${timeframe}&interval=${interval}`)
            const result = await response.json()
            
            if (!result.success) {
              throw new Error(result.error || 'Failed to fetch chart data')
            }
            
            if (!result.data || result.data.length === 0) {
              throw new Error('No chart data available')
            }
            
            setChartData(result.data)
            setError(null)
          } catch (err) {
            console.error(`Error fetching chart data for ${symbol}:`, err)
            setError(err.message || 'Failed to load chart data')
          } finally {
            setLoading(false)
          }
        };
        
        fetchChartData();
      }, 500);
    }
  };

  return (
    <div className={styles.chartWrapper}>
      <div className={styles.chartHeader}>
        <h3>{symbol} Stock Chart</h3>
      </div>
      
      {error && (
        <div className={styles.errorContainer}>
          <div className={styles.error}>
            {error.includes('Failed to fetch') ? 
              `Unable to load chart for ${symbol}. The stock symbol may be incorrect.` : 
              error}
          </div>
          <button 
            className={styles.retryButton} 
            onClick={handleRetry} 
            disabled={loading}
          >
            {loading ? 'Retrying...' : 'Try Again'}
          </button>
          <div className={styles.errorHelp}>
            Note: For Indian stocks, we'll try both NSE (.NS) and BSE (.BO) exchanges.
          </div>
        </div>
      )}
      
      {loading && !error ? (
        <div className={styles.loading}>Loading chart data for {symbol}...</div>
      ) : (
        <>
          <div ref={chartContainer} className={styles.chartContainer} />
          {!error && chartData.length === 0 && (
            <div className={styles.noData}>No chart data available for {symbol}</div>
          )}
        </>
      )}
    </div>
  )
}
