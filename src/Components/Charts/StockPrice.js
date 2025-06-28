'use client'

import { useState, useEffect } from 'react'

export function StockPrice({ symbol = 'AAPL' }) {
  const [priceData, setPriceData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Simulate API call with sample data
    const fetchPrice = async () => {
      try {
        setLoading(true)
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Generate sample price data
        const basePrice = symbol === 'AAPL' ? 175.50 : 
                         symbol === 'GOOGL' ? 138.25 :
                         symbol === 'MSFT' ? 378.85 :
                         symbol === 'TSLA' ? 248.42 : 150.00
        
        const change = (Math.random() - 0.5) * 10
        const currentPrice = basePrice + change
        const changePercent = (change / basePrice) * 100
        
        setPriceData({
          symbol,
          price: currentPrice.toFixed(2),
          change: change.toFixed(2),
          changePercent: changePercent.toFixed(2),
          high: (currentPrice + Math.random() * 5).toFixed(2),
          low: (currentPrice - Math.random() * 5).toFixed(2),
          volume: Math.floor(Math.random() * 10000000).toLocaleString(),
          marketCap: (currentPrice * Math.random() * 1000000000).toLocaleString(),
        })
        
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    fetchPrice()
  }, [symbol])

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading price data for {symbol}...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        Error loading price data: {error}
      </div>
    )
  }

  const isPositive = parseFloat(priceData.change) >= 0

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #e0e0e0', 
      borderRadius: '8px',
      backgroundColor: 'white',
      maxWidth: '400px'
    }}>
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold' }}>
          {priceData.symbol}
        </h3>
        <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0' }}>
          ${priceData.price}
        </div>
        <div style={{ 
          color: isPositive ? '#26a69a' : '#ef5350',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          {isPositive ? '+' : ''}{priceData.change} ({isPositive ? '+' : ''}{priceData.changePercent}%)
        </div>
      </div>
      
      <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '15px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
              Day High
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              ${priceData.high}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
              Day Low
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              ${priceData.low}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
              Volume
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              {priceData.volume}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
              Market Cap
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              ${priceData.marketCap}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
