'use client'

import { useEffect, useRef } from 'react'

export function MarketOverview() {
  const container = useRef()

  useEffect(() => {
    if (container.current) {
      container.current.innerHTML = ''
      
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js'
      script.type = 'text/javascript'
      script.async = true
      
      script.innerHTML = JSON.stringify({
        colorTheme: 'light',
        dateRange: '12M',
        showChart: true,
        locale: 'en',
        width: '100%',
        height: 400,
        largeChartUrl: '',
        isTransparent: false,
        showSymbolLogo: true,
        showFloatingTooltip: false,
        plotLineColorGrowing: 'rgba(41, 98, 255, 1)',
        plotLineColorFalling: 'rgba(41, 98, 255, 1)',
        gridLineColor: 'rgba(240, 243, 250, 0)',
        scaleFontColor: 'rgba(120, 123, 134, 1)',
        belowLineFillColorGrowing: 'rgba(41, 98, 255, 0.12)',
        belowLineFillColorFalling: 'rgba(41, 98, 255, 0.12)',
        belowLineFillColorGrowingBottom: 'rgba(41, 98, 255, 0)',
        belowLineFillColorFallingBottom: 'rgba(41, 98, 255, 0)',
        symbolActiveColor: 'rgba(41, 98, 255, 0.12)',
        tabs: [
          {
            title: 'Indian Indices',
            symbols: [
              { s: 'NSE:NIFTY', d: 'NIFTY 50' },
              { s: 'BSE:SENSEX', d: 'SENSEX' },
              { s: 'NSE:BANKNIFTY', d: 'Bank NIFTY' },
              { s: 'NSE:NIFTYIT', d: 'NIFTY IT' },
              { s: 'NSE:NIFTYPHARMA', d: 'NIFTY Pharma' },
              { s: 'NSE:NIFTYAUTO', d: 'NIFTY Auto' }
            ],
            originalTitle: 'Indian Indices'
          },
          {
            title: 'Futures',
            symbols: [
              { s: 'CME_MINI:ES1!', d: 'S&P 500' },
              { s: 'CME:6E1!', d: 'Euro' },
              { s: 'COMEX:GC1!', d: 'Gold' },
              { s: 'NYMEX:CL1!', d: 'Crude Oil' },
              { s: 'NYMEX:NG1!', d: 'Natural Gas' },
              { s: 'CBOT:ZC1!', d: 'Corn' }
            ],
            originalTitle: 'Futures'
          },
          {
            title: 'Indian Stocks',
            symbols: [
              { s: 'NSE:RELIANCE', d: 'Reliance Industries' },
              { s: 'NSE:TCS', d: 'TCS' },
              { s: 'NSE:HDFCBANK', d: 'HDFC Bank' },
              { s: 'NSE:INFY', d: 'Infosys' },
              { s: 'NSE:ICICIBANK', d: 'ICICI Bank' },
              { s: 'NSE:SBIN', d: 'SBI' }
            ],
            originalTitle: 'Indian Stocks'
          },
          {
            title: 'Cryptocurrency',
            symbols: [
              { s: 'BINANCE:BTCINR', d: 'Bitcoin INR' },
              { s: 'BINANCE:ETHINR', d: 'Ethereum INR' },
              { s: 'BINANCE:ADAINR', d: 'Cardano INR' },
              { s: 'BINANCE:SOLINR', d: 'Solana INR' },
              { s: 'BINANCE:DOTINR', d: 'Polkadot INR' },
              { s: 'BINANCE:XRPINR', d: 'XRP INR' }
            ],
            originalTitle: 'Cryptocurrency'
          }
        ]
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
