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
                proName: "NSE:NIFTY",
                title: "NIFTY 50"
              },
              {
                proName: "BSE:SENSEX", 
                title: "SENSEX"
              },
              {
                proName: "NSE:RELIANCE",
                title: "Reliance Industries"
              },
              {
                proName: "NSE:TCS",
                title: "TCS"
              },
              {
                proName: "NSE:HDFCBANK",
                title: "HDFC Bank"
              },
              {
                proName: "BITSTAMP:BTCINR",
                title: "Bitcoin INR"
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
