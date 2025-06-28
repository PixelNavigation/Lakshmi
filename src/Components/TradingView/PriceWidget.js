'use client'

import { useEffect, useRef, useState } from 'react'

export function PriceWidget({ symbol, width = 200, height = 62 }) {
  const container = useRef()
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (container.current && symbol) {
      setIsLoading(true)
      setHasError(false)
      
      // Clear previous widget
      container.current.innerHTML = ''
      
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js'
      script.type = 'text/javascript'
      script.async = true
      
      // Use the symbol directly like the working StockChart component
      const displaySymbol = symbol.toUpperCase()
      console.log(`Loading TradingView price widget for: ${displaySymbol}`)
      
      script.innerHTML = JSON.stringify({
        symbol: displaySymbol,
        width: width,
        height: height,
        locale: 'en',
        colorTheme: 'light',
        isTransparent: false,
        largeChartUrl: ''
      })

      script.onload = () => {
        setTimeout(() => {
          setIsLoading(false)
        }, 1000)
      }

      script.onerror = () => {
        console.error(`Failed to load TradingView widget for symbol: ${displaySymbol}`)
        setHasError(true)
        setIsLoading(false)
      }

      container.current.appendChild(script)
    }
  }, [symbol, width, height])

  if (hasError) {
    return (
      <div style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        color: '#6c757d',
        fontSize: '0.8rem',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontWeight: 'bold' }}>{symbol}</div>
          <div style={{ fontSize: '0.7rem' }}>Price unavailable</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        position: 'relative',
        backgroundColor: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        overflow: 'hidden'
      }}
    >
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f8f9fa',
          zIndex: 1,
          fontSize: '0.8rem',
          color: '#6c757d'
        }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>{symbol}</div>
            <div style={{ fontSize: '0.7rem' }}>🔄 Loading price...</div>
          </div>
        </div>
      )}
      <div ref={container} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
