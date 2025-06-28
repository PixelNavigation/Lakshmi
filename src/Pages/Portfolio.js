'use client'

import { useState } from 'react'
import styles from './Portfolio.module.css'

export default function Portfolio() {
  const [selectedTab, setSelectedTab] = useState('overview')

  const portfolioData = {
    totalValue: 45230.75,
    dayChange: 1240.30,
    dayChangePercent: 2.82,
    totalGainLoss: 8750.25,
    totalGainLossPercent: 24.01
  }

  const holdings = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      shares: 25,
      avgPrice: 180.50,
      currentPrice: 185.20,
      value: 4630.00,
      gainLoss: 117.50,
      gainLossPercent: 2.60,
      allocation: 10.2
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      shares: 15,
      avgPrice: 335.00,
      currentPrice: 348.75,
      value: 5231.25,
      gainLoss: 206.25,
      gainLossPercent: 4.11,
      allocation: 11.6
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      shares: 12,
      avgPrice: 125.30,
      currentPrice: 132.45,
      value: 1589.40,
      gainLoss: 85.80,
      gainLossPercent: 5.71,
      allocation: 3.5
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      shares: 8,
      avgPrice: 245.00,
      currentPrice: 238.90,
      value: 1911.20,
      gainLoss: -48.80,
      gainLossPercent: -2.49,
      allocation: 4.2
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      shares: 18,
      avgPrice: 420.75,
      currentPrice: 485.30,
      value: 8735.40,
      gainLoss: 1161.90,
      gainLossPercent: 15.34,
      allocation: 19.3
    }
  ]

  const recentTransactions = [
    {
      id: 1,
      type: 'buy',
      symbol: 'NVDA',
      shares: 5,
      price: 485.30,
      date: '2024-01-15',
      total: 2426.50
    },
    {
      id: 2,
      type: 'sell',
      symbol: 'AAPL',
      shares: 10,
      price: 185.20,
      date: '2024-01-14',
      total: 1852.00
    },
    {
      id: 3,
      type: 'buy',
      symbol: 'MSFT',
      shares: 3,
      price: 348.75,
      date: '2024-01-12',
      total: 1046.25
    }
  ]

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>💼 Portfolio</h1>
        <p className={styles.pageSubtitle}>Track and manage your investment portfolio</p>
      </div>

      <div className={styles.portfolioTabs} style={{ marginBottom: '2rem' }}>
        {['overview', 'holdings', 'transactions', 'performance'].map(tab => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={selectedTab === tab ? styles.activeTab : styles.tab}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              backgroundColor: selectedTab === tab ? '#007bff' : 'transparent',
              color: selectedTab === tab ? 'white' : '#666',
              cursor: 'pointer',
              borderRadius: '4px',
              marginRight: '0.5rem',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {selectedTab === 'overview' && (
        <div className={styles.contentGrid}>
          <div className={styles.mainContent}>
            <div className={styles.card}>
              <h3>Portfolio Summary</h3>
              <div className={styles.summaryGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div className={styles.summaryItem}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
                    ${portfolioData.totalValue.toLocaleString()}
                  </div>
                  <div style={{ color: '#666' }}>Total Portfolio Value</div>
                </div>
                <div className={styles.summaryItem}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: portfolioData.dayChange >= 0 ? '#28a745' : '#dc3545' }}>
                    ${portfolioData.dayChange >= 0 ? '+' : ''}${portfolioData.dayChange.toLocaleString()} ({portfolioData.dayChangePercent >= 0 ? '+' : ''}{portfolioData.dayChangePercent}%)
                  </div>
                  <div style={{ color: '#666' }}>Today's Change</div>
                </div>
                <div className={styles.summaryItem}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: portfolioData.totalGainLoss >= 0 ? '#28a745' : '#dc3545' }}>
                    ${portfolioData.totalGainLoss >= 0 ? '+' : ''}${portfolioData.totalGainLoss.toLocaleString()} ({portfolioData.totalGainLossPercent >= 0 ? '+' : ''}{portfolioData.totalGainLossPercent}%)
                  </div>
                  <div style={{ color: '#666' }}>Total Gain/Loss</div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3>Top Holdings</h3>
              <div className={styles.holdingsPreview}>
                {holdings.slice(0, 3).map(holding => (
                  <div key={holding.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #eee' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{holding.symbol}</div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>{holding.name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold' }}>${holding.value.toLocaleString()}</div>
                      <div style={{ fontSize: '0.9rem', color: holding.gainLoss >= 0 ? '#28a745' : '#dc3545' }}>
                        {holding.gainLoss >= 0 ? '+' : ''}${holding.gainLoss.toFixed(2)} ({holding.gainLossPercent >= 0 ? '+' : ''}{holding.gainLossPercent}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.card}>
              <h3>Portfolio Allocation</h3>
              <div className={styles.allocationChart}>
                {holdings.map(holding => (
                  <div key={holding.symbol} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                    <span>{holding.symbol}</span>
                    <span>{holding.allocation}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <h3>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button className={styles.primaryButton}>Add Funds</button>
                <button className={styles.secondaryButton}>Rebalance Portfolio</button>
                <button className={styles.secondaryButton}>Download Report</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'holdings' && (
        <div className={styles.card}>
          <h3>All Holdings</h3>
          <div className={styles.holdingsTable} style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 'bold' }}>Symbol</th>
                  <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 'bold' }}>Shares</th>
                  <th style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold' }}>Avg Price</th>
                  <th style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold' }}>Current Price</th>
                  <th style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold' }}>Market Value</th>
                  <th style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold' }}>Gain/Loss</th>
                  <th style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold' }}>Allocation</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map(holding => (
                  <tr key={holding.symbol} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{holding.symbol}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{holding.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>{holding.shares}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>${holding.avgPrice.toFixed(2)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>${holding.currentPrice.toFixed(2)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>${holding.value.toLocaleString()}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: holding.gainLoss >= 0 ? '#28a745' : '#dc3545' }}>
                      {holding.gainLoss >= 0 ? '+' : ''}${holding.gainLoss.toFixed(2)} ({holding.gainLossPercent >= 0 ? '+' : ''}{holding.gainLossPercent}%)
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>{holding.allocation}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'transactions' && (
        <div className={styles.card}>
          <h3>Recent Transactions</h3>
          <div className={styles.transactionsTable}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 'bold' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 'bold' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 'bold' }}>Symbol</th>
                  <th style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold' }}>Shares</th>
                  <th style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map(transaction => (
                  <tr key={transaction.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '1rem' }}>{transaction.date}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '12px', 
                        fontSize: '0.8rem',
                        backgroundColor: transaction.type === 'buy' ? '#d4edda' : '#f8d7da',
                        color: transaction.type === 'buy' ? '#155724' : '#721c24'
                      }}>
                        {transaction.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{transaction.symbol}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>{transaction.shares}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>${transaction.price.toFixed(2)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>${transaction.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'performance' && (
        <div className={styles.card}>
          <h3>Performance Metrics</h3>
          <div className={styles.performanceGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
            <div className={styles.performanceCard}>
              <h4>Returns</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>1 Day</span>
                  <span style={{ color: '#28a745' }}>+2.82%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>1 Week</span>
                  <span style={{ color: '#28a745' }}>+5.67%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>1 Month</span>
                  <span style={{ color: '#28a745' }}>+12.45%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>YTD</span>
                  <span style={{ color: '#28a745' }}>+24.01%</span>
                </div>
              </div>
            </div>
            
            <div className={styles.performanceCard}>
              <h4>Risk Metrics</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Beta</span>
                  <span>1.15</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Volatility</span>
                  <span>18.5%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Sharpe Ratio</span>
                  <span>1.32</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Max Drawdown</span>
                  <span>-8.2%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
