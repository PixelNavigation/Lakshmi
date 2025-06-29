'use client'

import { useEffect, useRef } from 'react'

export function StockChart({ symbol, comparisonSymbols = [] }) {
  const container = useRef()

  useEffect(() => {
    if (container.current && symbol) {
      // Clear previous widget
      container.current.innerHTML = ''
      
      // Add a small d1elay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (container.current) {
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
            height: 400,
            hide_side_toolbar: false,
            hide_top_toolbar: false,
            hide_legend: false,
            save_image: false,
            container_id: `tradingview_${Math.random().toString(36).substr(2, 9)}`,
            disabled_features: [
              "use_localstorage_for_settings",
              "support_multicharts",
              "header_symbol_search",
              "symbol_search_hot_key"
            ],
            enabled_features: [],
            studies_overrides: {},
            overrides: {},
            loading_screen: { backgroundColor: "#ffffff" }
          })

          container.current.appendChild(script)
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [symbol, comparisonSymbols])

  return (
    <div className="w-full bg-white rounded-lg border" style={{ minHeight: '420px', height: '420px' }}>
      <div ref={container} className="w-full h-[400px]" />
    </div>
  )
}
