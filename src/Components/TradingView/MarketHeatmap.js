'use client'

import { useEffect, useRef } from 'react'

export function MarketHeatmap() {
  const container = useRef()

  useEffect(() => {
    if (container.current) {
      container.current.innerHTML = ''
      
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js'
      script.type = 'text/javascript'
      script.async = true
      
      script.innerHTML = JSON.stringify({
        exchanges: [],
        dataSource: 'SPX500',
        grouping: 'sector',
        blockSize: 'market_cap_basic',
        blockColor: 'change',
        locale: 'en',
        symbolUrl: '',
        colorTheme: 'light',
        hasTopBar: false,
        isDataSetEnabled: false,
        isZoomEnabled: true,
        hasSymbolTooltip: true,
        width: '100%',
        height: 400
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
