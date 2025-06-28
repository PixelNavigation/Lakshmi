'use client'

import { useEffect, useRef, useState } from 'react'

// Helper function to convert symbols to TradingView format
const getTradingViewSymbol = (symbol) => {
  // Handle Indian stocks
  if (symbol.includes('.NS')) {
    // NSE (National Stock Exchange of India)
    const baseSymbol = symbol.replace('.NS', '')
    return `NSE:${baseSymbol}`
  } else if (symbol.includes('.BO')) {
    // BSE (Bombay Stock Exchange)
    const baseSymbol = symbol.replace('.BO', '')
    return `BSE:${baseSymbol}`
  }
  
  // Handle crypto
  if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('DOGE')) {
    if (symbol.includes('-USD')) {
      const baseSymbol = symbol.replace('-USD', '')
      return `BITSTAMP:${baseSymbol}USD`
    } else if (symbol.includes('-INR')) {
      const baseSymbol = symbol.replace('-INR', '')
      return `WAZIRX:${baseSymbol}INR`
    }
    return `BITSTAMP:${symbol}USD`
  }
  
  // Handle regular US stocks - try NASDAQ first, then NYSE
  const majorNasdaqStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA']
  if (majorNasdaqStocks.includes(symbol)) {
    return `NASDAQ:${symbol}`
  }
  
  // For other stocks, try NASDAQ as default
  return `NASDAQ:${symbol}`
}

export function MiniPrice({ symbol, width = 300, height = 130 }) {
  const container = useRef()
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (container.current && symbol) {
      // Reset states
      setIsLoading(true)
      setHasError(false)
      
      // Clear previous widget
      container.current.innerHTML = ''
      
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js'
      script.type = 'text/javascript'
      script.async = true
      
      // Get the correct TradingView symbol format
      const tvSymbol = getTradingViewSymbol(symbol)
      
      script.innerHTML = JSON.stringify({
        symbol: tvSymbol,
        width: width,
        height: height,
        locale: 'en',
        dateRange: '1D',
        colorTheme: 'light',
        trendLineColor: 'rgba(41, 98, 255, 1)',
        underLineColor: 'rgba(41, 98, 255, 0.3)',
        underLineBottomColor: 'rgba(41, 98, 255, 0)',
        isTransparent: false,
        autosize: false,
        largeChartUrl: '',
        noTimeScale: false,
        valuesTracking: '1',
        changeMode: 'price-and-percent'
      })

      // Handle script loading
      script.onload = () => {
        setIsLoading(false)
        // Give TradingView widget some time to load
        setTimeout(() => {
          // Check if widget loaded successfully by looking for TradingView content
          const iframe = container.current?.querySelector('iframe')
          if (!iframe) {
            setHasError(true)
          }
        }, 2000)
      }

      script.onerror = () => {
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
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        color: '#6c757d',
        textAlign: 'center',
        padding: '0.5rem'
      }}>
        <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📊</div>
        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
          {symbol}
        </div>
        <div style={{ fontSize: '0.7rem' }}>
          Chart unavailable
        </div>
      </div>
    )
  }

  return (
    <div 
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        margin: '0 auto',
        position: 'relative',
        backgroundColor: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
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
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f8f9fa',
          zIndex: 1
        }}>
          <div style={{ 
            animation: 'spin 1s linear infinite', 
            fontSize: '1.2rem',
            marginBottom: '0.5rem'
          }}>
            🔄
          </div>
          <div style={{ color: '#6c757d', fontSize: '0.8rem' }}>
            Loading {symbol}...
          </div>
        </div>
      )}
      <div ref={container} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}