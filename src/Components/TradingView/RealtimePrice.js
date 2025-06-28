'use client'

import { useEffect, useRef, useState } from 'react'

// Helper function to convert symbols to TradingView format
const getTradingViewSymbol = (symbol) => {
  // Handle Indian stocks
  if (symbol.includes('.NS')) {
    const baseSymbol = symbol.replace('.NS', '')
    return `NSE:${baseSymbol}`
  } else if (symbol.includes('.BO')) {
    const baseSymbol = symbol.replace('.BO', '')
    return `BSE:${baseSymbol}`
  }
  
  // Handle crypto
  if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('DOGE') || symbol.includes('ADA') || symbol.includes('SOL')) {
    if (symbol.includes('-USD')) {
      const baseSymbol = symbol.replace('-USD', '')
      return `BINANCE:${baseSymbol}USDT`
    } else if (symbol.includes('-INR')) {
      const baseSymbol = symbol.replace('-INR', '')
      return `WAZIRX:${baseSymbol}INR`
    }
    return `BINANCE:${symbol}USDT`
  }
  
  // Handle US stocks - try multiple exchanges
  const commonNasdaqStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'NFLX']
  const commonNYSEStocks = ['JPM', 'JNJ', 'PG', 'V', 'MA', 'HD', 'DIS', 'KO']
  
  if (commonNasdaqStocks.includes(symbol)) {
    return `NASDAQ:${symbol}`
  } else if (commonNYSEStocks.includes(symbol)) {
    return `NYSE:${symbol}`
  }
  
  // Default to NASDAQ for other US stocks
  return `NASDAQ:${symbol}`
}

export function RealtimePrice({ symbol, width = 200, height = 60 }) {
  const container = useRef()
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (container.current && symbol) {
      setIsLoading(true)
      setHasError(false)
      
      container.current.innerHTML = ''
      
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js'
      script.type = 'text/javascript'
      script.async = true
      
      const tvSymbol = getTradingViewSymbol(symbol)
      
      script.innerHTML = JSON.stringify({
        symbol: tvSymbol,
        width: width,
        height: height,
        locale: 'en',
        dateRange: '12M',
        colorTheme: 'light',
        trendLineColor: 'rgba(41, 98, 255, 1)',
        underLineColor: 'rgba(41, 98, 255, 0.3)',
        underLineBottomColor: 'rgba(41, 98, 255, 0)',
        isTransparent: false,
        autosize: false,
        largeChartUrl: ''
      })

      script.onload = () => {
        setTimeout(() => setIsLoading(false), 1000) // Give widget time to load
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
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        color: '#6c757d',
        fontSize: '0.8rem'
      }}>
        {symbol} - Price unavailable
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
          🔄 Loading...
        </div>
      )}
      <div ref={container} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
