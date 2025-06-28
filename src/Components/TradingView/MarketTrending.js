'use client'

import { useEffect, useRef } from 'react'

export function MarketTrending() {
  const container = useRef()

  useEffect(() => {
    if (container.current) {
      container.current.innerHTML = ''
      
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-hotlists.js'
      script.type = 'text/javascript'
      script.async = true
      
      script.innerHTML = JSON.stringify({
        colorTheme: 'light',
        dateRange: '12M',
        exchange: 'US',
        showChart: true,
        locale: 'en',
        largeChartUrl: '',
        isTransparent: false,
        showSymbolLogo: false,
        showFloatingTooltip: false,
        width: '100%',
        height: 400,
        plotLineColorGrowing: 'rgba(41, 98, 255, 1)',
        plotLineColorFalling: 'rgba(41, 98, 255, 1)',
        gridLineColor: 'rgba(240, 243, 250, 0)',
        scaleFontColor: 'rgba(120, 123, 134, 1)',
        belowLineFillColorGrowing: 'rgba(41, 98, 255, 0.12)',
        belowLineFillColorFalling: 'rgba(41, 98, 255, 0.12)',
        belowLineFillColorGrowingBottom: 'rgba(41, 98, 255, 0)',
        belowLineFillColorFallingBottom: 'rgba(41, 98, 255, 0)',
        symbolActiveColor: 'rgba(41, 98, 255, 0.12)'
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
