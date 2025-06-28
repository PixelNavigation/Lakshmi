'use client'

import { useEffect, useRef } from 'react'

export function StockNews({ symbol }) {
  const container = useRef()

  useEffect(() => {
    if (container.current && symbol) {
      container.current.innerHTML = ''
      
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js'
      script.type = 'text/javascript'
      script.async = true
      
      script.innerHTML = JSON.stringify({
        feedMode: 'symbol',
        symbol: symbol.toUpperCase(),
        colorTheme: 'light',
        isTransparent: false,
        displayMode: 'regular',
        width: '100%',
        height: 400,
        locale: 'en'
      })

      container.current.appendChild(script)
    }
  }, [symbol])

  return (
    <div className="w-full bg-white rounded-lg border" style={{ minHeight: '420px' }}>
      <div ref={container} className="w-full h-[400px]" />
    </div>
  )
}
