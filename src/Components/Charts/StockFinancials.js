'use client'

import { useState, useEffect } from 'react'

export function StockFinancials({ symbol = 'AAPL' }) {
  const [financials, setFinancials] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        setLoading(true)
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1200))
        
        // Generate sample financial data
        const sampleData = {
          symbol,
          companyName: symbol === 'AAPL' ? 'Apple Inc.' :
                      symbol === 'GOOGL' ? 'Alphabet Inc.' :
                      symbol === 'MSFT' ? 'Microsoft Corporation' :
                      symbol === 'TSLA' ? 'Tesla Inc.' : `${symbol} Corporation`,
          marketCap: (Math.random() * 2000 + 500).toFixed(0) + 'B',
          pe: (Math.random() * 30 + 10).toFixed(2),
          eps: (Math.random() * 10 + 1).toFixed(2),
          dividend: (Math.random() * 5).toFixed(2) + '%',
          beta: (Math.random() * 2 + 0.5).toFixed(2),
          revenue: (Math.random() * 100 + 50).toFixed(0) + 'B',
          profitMargin: (Math.random() * 30 + 5).toFixed(2) + '%',
          debtToEquity: (Math.random() * 1 + 0.2).toFixed(2),
          roe: (Math.random() * 25 + 5).toFixed(2) + '%',
          currentRatio: (Math.random() * 3 + 1).toFixed(2),
          quickRatio: (Math.random() * 2 + 0.5).toFixed(2),
        }
        
        setFinancials(sampleData)
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    fetchFinancials()
  }, [symbol])

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading financial data for {symbol}...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        Error loading financial data: {error}
      </div>
    )
  }

  const financialItems = [
    { label: 'Market Cap', value: financials.marketCap },
    { label: 'P/E Ratio', value: financials.pe },
    { label: 'EPS', value: '$' + financials.eps },
    { label: 'Dividend Yield', value: financials.dividend },
    { label: 'Beta', value: financials.beta },
    { label: 'Revenue (TTM)', value: '$' + financials.revenue },
    { label: 'Profit Margin', value: financials.profitMargin },
    { label: 'Debt/Equity', value: financials.debtToEquity },
    { label: 'ROE', value: financials.roe },
    { label: 'Current Ratio', value: financials.currentRatio },
    { label: 'Quick Ratio', value: financials.quickRatio },
  ]

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #e0e0e0', 
      borderRadius: '8px',
      backgroundColor: 'white',
      maxWidth: '600px'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold' }}>
          {financials.companyName}
        </h3>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Financial Overview ({financials.symbol})
        </div>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '15px' 
      }}>
        {financialItems.map((item, index) => (
          <div key={index} style={{ 
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginBottom: '5px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {item.label}
            </div>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold',
              color: '#333'
            }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ 
        marginTop: '20px', 
        padding: '15px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '6px'
      }}>
        <div style={{ fontSize: '12px', color: '#856404', fontWeight: 'bold' }}>
          📊 Note: This is sample financial data for demonstration purposes.
        </div>
      </div>
    </div>
  )
}
