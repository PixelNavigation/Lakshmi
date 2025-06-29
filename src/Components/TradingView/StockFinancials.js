'use client'

import { useEffect, useRef } from 'react'

export function StockFinancials({ symbol }) {
  const container = useRef()

  useEffect(() => {
    if (container.current && symbol) {
      container.current.innerHTML = ''
      
      // Add a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (container.current) {
          const script = document.createElement('script')
          script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-financials.js'
          script.type = 'text/javascript'
          script.async = true
          
          script.innerHTML = JSON.stringify({
            colorTheme: 'light',
            isTransparent: false,
            largeChartUrl: '',
            displayMode: 'regular',
            width: '100%',
            height: 400,
            symbol: symbol.toUpperCase(),
            locale: 'en',
            container_id: `financials_${Math.random().toString(36).substr(2, 9)}`
          })

          container.current.appendChild(script)
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [symbol])

  return (
    <div className="w-full bg-white rounded-lg border" style={{ minHeight: '420px' }}>
      <div ref={container} className="w-full h-[400px]" />
    </div>
  )
}
