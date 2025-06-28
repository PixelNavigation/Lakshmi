'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType } from 'lightweight-charts'

export function StockChart({ symbol = 'AAPL', height = 400 }) {
  const chartContainerRef = useRef()
  const chartRef = useRef()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'white' },
        textColor: 'black',
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      grid: {
        vertLines: { color: '#e0e0e0' },
        horzLines: { color: '#e0e0e0' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#cccccc',
      },
      timeScale: {
        borderColor: '#cccccc',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    chartRef.current = chart

    // Create candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })

    // Generate sample data (replace with real API call)
    const generateSampleData = () => {
      const data = []
      const basePrice = 150
      let currentPrice = basePrice
      
      for (let i = 0; i < 100; i++) {
        const date = new Date()
        date.setDate(date.getDate() - (100 - i))
        
        const change = (Math.random() - 0.5) * 10
        currentPrice += change
        
        const open = currentPrice
        const high = open + Math.random() * 5
        const low = open - Math.random() * 5
        const close = low + Math.random() * (high - low)
        
        data.push({
          time: date.getTime() / 1000,
          open: open,
          high: high,
          low: low,
          close: close,
        })
      }
      return data
    }

    const sampleData = generateSampleData()
    candlestickSeries.setData(sampleData)

    // Add volume series
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

    const volumeData = sampleData.map(item => ({
      time: item.time,
      value: Math.random() * 1000000,
    }))

    volumeSeries.setData(volumeData)

    // Handle resize
    const handleResize = () => {
      chart.applyOptions({ 
        width: chartContainerRef.current.clientWidth 
      })
    }

    window.addEventListener('resize', handleResize)
    setLoading(false)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [symbol, height])

  if (loading) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading chart for {symbol}...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Error loading chart: {error}</div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>
        {symbol} Stock Chart
      </h3>
      <div ref={chartContainerRef} style={{ width: '100%', height }} />
    </div>
  )
}
