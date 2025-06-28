'use client'

import { useEffect, useRef } from 'react'

export default function TestChart() {
  const chartRef = useRef()

  useEffect(() => {
    const initChart = async () => {
      try {
        const { createChart } = await import('lightweight-charts')
        
        if (chartRef.current) {
          const chart = createChart(chartRef.current, {
            width: 400,
            height: 300,
            layout: {
              background: { type: 'solid', color: '#1a202c' },
              textColor: '#d1d5db',
            },
          })

          const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#48bb78',
            downColor: '#fc8181',
            borderDownColor: '#fc8181',
            borderUpColor: '#48bb78',
            wickDownColor: '#fc8181',
            wickUpColor: '#48bb78',
          })

          // Sample data
          const data = [
            { time: '2023-01-01', open: 100, high: 110, low: 95, close: 105 },
            { time: '2023-01-02', open: 105, high: 115, low: 100, close: 108 },
            { time: '2023-01-03', open: 108, high: 112, low: 102, close: 110 },
          ]

          candlestickSeries.setData(data)
          console.log('Test chart created successfully!')
        }
      } catch (error) {
        console.error('Test chart error:', error)
      }
    }

    initChart()
  }, [])

  return (
    <div style={{ padding: '20px', background: '#1a202c' }}>
      <h2 style={{ color: 'white' }}>TradingView Test Chart</h2>
      <div ref={chartRef} style={{ width: '400px', height: '300px', background: '#2d3748' }} />
    </div>
  )
}
