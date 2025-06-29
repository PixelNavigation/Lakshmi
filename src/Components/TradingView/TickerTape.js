'use client'

import { useEffect, useRef } from 'react'

export function TickerTape() {
  const container = useRef()

  useEffect(() => {
    if (container.current) {
      container.current.innerHTML = ''
      
      // Add a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (container.current) {
          const script = document.createElement('script')
          script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js'
          script.type = 'text/javascript'
          script.async = true
          
          script.innerHTML = JSON.stringify({
            symbols: [
              {
                proName: "FOREXCOM:SPXUSD",
                title: "S&P 500"
              },
              {
                proName: "FOREXCOM:NSXUSD", 
                title: "US 100"
              },
              {
                proName: "FX:EURUSD",
                title: "EUR to USD"
              },
              {
                proName: "BITSTAMP:BTCUSD",
                title: "Bitcoin"
              },
              {
                proName: "NASDAQ:AAPL",
                title: "Apple Inc"
              }
            ],
            showSymbolLogo: true,
            colorTheme: "light",
            isTransparent: false,
            displayMode: "adaptive",
            locale: "en",
            container_id: `tickertape_${Math.random().toString(36).substr(2, 9)}`
          })

          container.current.appendChild(script)
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <div className="w-full h-12 bg-white border-b border-gray-200">
      <div ref={container} className="w-full h-full" />
    </div>
  )
}
