'use client'

import { useEffect, useRef } from 'react'

export function StockChart({ symbol, comparisonSymbols = [] }) {
  const container = useRef()

  useEffect(() => {
    if (container.current && symbol) {
      // Clear previous widget
      container.current.innerHTML = ''
      
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
      script.type = 'text/javascript'
      script.async = true
      
      script.innerHTML = JSON.stringify({
        autosize: true,
        symbol: symbol.toUpperCase(),
        interval: 'D',
        timezone: 'Etc/UTC',
        theme: 'light',
        style: '1',
        locale: 'en',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        allow_symbol_change: true,
        width: "100%",
        height: 400
      })

      container.current.appendChild(script)
    }
  }, [symbol, comparisonSymbols])

  return (
    <div className="w-full bg-white rounded-lg border" style={{ minHeight: '420px', height: '420px' }}>
      <div ref={container} className="w-full h-[400px]" />
    </div>
  )
}
