'use client'

import { useEffect, useRef } from 'react'

export function StockPrice({ symbol }) {
  const container = useRef()

  useEffect(() => {
    if (container.current && symbol) {
      container.current.innerHTML = ''
      
      // Add a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (container.current) {
          const script = document.createElement('script')
          script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js'
          script.type = 'text/javascript'
          script.async = true
          
          script.innerHTML = JSON.stringify({
            symbol: symbol.toUpperCase(),
            width: "100%",
            height: 220,
            locale: 'en',
            dateRange: '12M',
            colorTheme: 'light',
            trendLineColor: 'rgba(41, 98, 255, 1)',
            underLineColor: 'rgba(41, 98, 255, 0.3)',
            underLineBottomColor: 'rgba(41, 98, 255, 0)',
            isTransparent: false,
            autosize: true,
            largeChartUrl: '',
            container_id: `stockprice_${Math.random().toString(36).substr(2, 9)}`
          })

          container.current.appendChild(script)
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [symbol])

  return (
    <div className="w-full bg-white rounded-lg border p-4" style={{ minHeight: '240px' }}>
      <div ref={container} className="w-full h-[220px]" />
    </div>
  )
}
