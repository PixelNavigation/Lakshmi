'use client'

import { useEffect, useRef } from 'react'

export function StockScreener() {
  const container = useRef()

  useEffect(() => {
    if (container.current) {
      container.current.innerHTML = ''
      
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js'
      script.type = 'text/javascript'
      script.async = true
      
      script.innerHTML = JSON.stringify({
        width: '100%',
        height: 400,
        defaultColumn: 'overview',
        screener_type: 'stock_market',
        displayCurrency: 'USD',
        colorTheme: 'light',
        locale: 'en'
      })

      container.current.appendChild(script)
    }
  }, [])

  return (
    <div className="w-full bg-white rounded-lg border" style={{ minHeight: '420px' }}>
      <div ref={container} className="w-full h-[400px]" />
    </div>
  )
}
