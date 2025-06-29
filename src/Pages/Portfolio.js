'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import styles from './Portfolio.module.css'

export default function Portfolio() {
  const { user } = useAuth()
  const [portfolio, setPortfolio] = useState([])
  const [transactions, setTransactions] = useState([])
  const [balances, setBalances] = useState({ inr: 0, eth: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showTradeModal, setShowTradeModal] = useState(false)
  const [tradeData, setTradeData] = useState({
    symbol: '',
    type: 'BUY',
    quantity: '',
    price: ''
  })

  const userId = 'user123' // Replace with actual user ID

  useEffect(() => {
    fetchPortfolio()
    fetchTransactions()
    fetchBalances()
  }, [userId])

  const fetchPortfolio = async () => {
    try {
      const response = await fetch(`/api/user-portfolio?userId=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setPortfolio(data.portfolio)
      } else {
        setError('Failed to fetch portfolio')
      }
    } catch (err) {
      setError('Error fetching portfolio: ' + err.message)
    }
  }

  const fetchBalances = async () => {
    try {
      const response = await fetch(`/api/user-balance?userId=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setBalances(data.balances)
      }
    } catch (err) {
      console.error('Error fetching balances:', err)
    }
  }

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/user-transactions?userId=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setTransactions(data.transactions)
      }
      setLoading(false)
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setLoading(false)
    }
  }

  const handleTrade = async () => {
    if (!tradeData.symbol || !tradeData.quantity || !tradeData.price) {
      alert('Please fill all fields')
      return
    }

    if (parseFloat(tradeData.quantity) <= 0 || parseFloat(tradeData.price) <= 0) {
      alert('Quantity and price must be positive')
      return
    }

    try {
      const response = await fetch('/api/trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          symbol: tradeData.symbol,
          quantity: parseFloat(tradeData.quantity),
          price: parseFloat(tradeData.price),
          transactionType: tradeData.type
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert(`${tradeData.type} order executed successfully`)
        setShowTradeModal(false)
        setTradeData({ symbol: '', type: 'BUY', quantity: '', price: '' })
        // Refresh data
        fetchPortfolio()
        fetchTransactions()
        fetchBalances()
      } else {
        alert('Trade failed: ' + data.error)
      }
    } catch (err) {
      alert('Error executing trade: ' + err.message)
    }
  }

  const openTradeModal = (symbol = '', type = 'BUY') => {
    setTradeData({
      symbol: symbol,
      type: type,
      quantity: '',
      price: ''
    })
    setShowTradeModal(true)
  }

  // State for real-time stock prices
  const [stockPrices, setStockPrices] = useState({})
  const [fetchingPrices, setFetchingPrices] = useState(false)

  // Fetch current stock prices for portfolio holdings
  const fetchStockPrices = async () => {
    if (portfolio.length === 0) return

    setFetchingPrices(true)
    const prices = {}
    for (const holding of portfolio) {
      try {
        const response = await fetch(`/api/stock-detail?symbol=${holding.symbol}`)
        const data = await response.json()
        
        if (data.success && data.data) {
          prices[holding.symbol] = {
            currentPrice: data.data.price || holding.average_price,
            change: data.data.change || 0,
            changePercent: data.data.changePercent || 0
          }
        } else {
          // Fallback to average price if API fails
          prices[holding.symbol] = {
            currentPrice: holding.average_price,
            change: 0,
            changePercent: 0
          }
        }
      } catch (err) {
        console.error(`Error fetching price for ${holding.symbol}:`, err)
        // Fallback to average price
        prices[holding.symbol] = {
          currentPrice: holding.average_price,
          change: 0,
          changePercent: 0
        }
      }
    }
    setStockPrices(prices)
    setFetchingPrices(false)
  }

  // Fetch stock prices when portfolio changes
  useEffect(() => {
    if (portfolio.length > 0) {
      fetchStockPrices()
    }
  }, [portfolio])

  // Calculate portfolio statistics with real stock prices
  const totalInvested = portfolio.reduce((total, holding) => {
    const quantity = holding?.quantity || 0
    const avgPrice = holding?.average_price || 0
    return total + (quantity * avgPrice)
  }, 0)

  const currentMarketValue = portfolio.reduce((total, holding) => {
    const quantity = holding?.quantity || 0
    const currentPrice = stockPrices[holding.symbol]?.currentPrice || holding?.average_price || 0
    return total + (quantity * currentPrice)
  }, 0)

  const totalPnL = currentMarketValue - totalInvested
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingMessage}>Loading portfolio...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>{error}</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>📊 Portfolio</h1>
        <div className={styles.headerActions}>
          <button 
            className={styles.refreshButton}
            onClick={fetchStockPrices}
            disabled={portfolio.length === 0 || fetchingPrices}
          >
            {fetchingPrices ? '⏳ Updating...' : '🔄 Refresh Prices'}
          </button>
          <button 
            className={styles.tradeButton}
            onClick={() => openTradeModal()}
          >
            + New Trade
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <h3>💰 Total Invested</h3>
          </div>
          <div className={styles.summaryAmount}>
            ₹{totalInvested.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <h3>📈 Current Value</h3>
          </div>
          <div className={styles.summaryAmount}>
            ₹{currentMarketValue.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <h3>📊 Total P&L</h3>
          </div>
          <div className={`${styles.summaryAmount} ${totalPnL >= 0 ? styles.profit : styles.loss}`}>
            ₹{totalPnL.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
          <div className={`${styles.summaryPercent} ${totalPnL >= 0 ? styles.profit : styles.loss}`}>
            {totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Holdings */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>📈 Holdings</h2>
        {portfolio.length > 0 ? (
          <div className={styles.holdingsTable}>
            <div className={styles.tableHeader}>
              <div className={styles.symbolColumn}>Symbol</div>
              <div className={styles.quantityColumn}>Quantity</div>
              <div className={styles.avgPriceColumn}>Avg Price</div>
              <div className={styles.currentColumn}>Current Price</div>
              <div className={styles.valueColumn}>Value</div>
              <div className={styles.pnlColumn}>P&L</div>
              <div className={styles.actionsColumn}>Actions</div>
            </div>
            {portfolio.map((holding, index) => {
              const quantity = holding?.quantity || 0
              const avgPrice = holding?.average_price || 0
              const stockPrice = stockPrices[holding.symbol]
              const currentPrice = stockPrice?.currentPrice || avgPrice
              const currentValue = quantity * currentPrice
              const totalCost = quantity * avgPrice
              const pnl = currentValue - totalCost
              const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0

              return (
                <div key={index} className={styles.holdingRow}>
                  <div className={styles.symbolColumn} data-label="Symbol">
                    <div className={styles.symbol}>{holding?.symbol || 'N/A'}</div>
                  </div>
                  <div className={styles.quantityColumn} data-label="Quantity">{quantity}</div>
                  <div className={styles.avgPriceColumn} data-label="Avg Price">
                    ₹{avgPrice.toFixed(2)}
                  </div>
                  <div className={styles.currentColumn} data-label="Current Price">
                    <div>₹{currentPrice.toFixed(2)}</div>
                    {stockPrice && (
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: stockPrice.change >= 0 ? '#22c55e' : '#ef4444',
                        marginTop: '0.25rem'
                      }}>
                        {stockPrice.change >= 0 ? '+' : ''}{stockPrice.changePercent?.toFixed(2)}%
                      </div>
                    )}
                  </div>
                  <div className={styles.valueColumn} data-label="Value">
                    ₹{currentValue.toLocaleString('en-IN')}
                  </div>
                  <div className={`${styles.pnlColumn} ${pnl >= 0 ? styles.profit : styles.loss}`} data-label="P&L">
                    ₹{pnl.toLocaleString('en-IN')}
                    <div className={styles.pnlPercent}>
                      ({pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                    </div>
                  </div>
                  <div className={styles.actionsColumn} data-label="Actions">
                    <button 
                      className={styles.buyButton}
                      onClick={() => openTradeModal(holding?.symbol || '', 'BUY')}
                    >
                      Buy More
                    </button>
                    <button 
                      className={styles.sellButton}
                      onClick={() => openTradeModal(holding?.symbol || '', 'SELL')}
                    >
                      Sell
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📊</div>
            <h3>No Holdings Yet</h3>
            <p>Start investing by making your first trade!</p>
            <button 
              className={styles.startTradingButton}
              onClick={() => openTradeModal()}
            >
              Start Trading
            </button>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>📜 Recent Transactions</h2>
        {transactions.length > 0 ? (
          <div className={styles.transactionsList}>
            {transactions.slice(0, 10).map((transaction, index) => (
              <div key={index} className={styles.transactionItem}>
                <div className={styles.transactionIcon}>
                  {transaction?.transaction_type === 'BUY' ? '🟢' : '🔴'}
                </div>
                <div className={styles.transactionDetails}>
                  <div className={styles.transactionSymbol}>{transaction?.symbol || 'N/A'}</div>
                  <div className={styles.transactionInfo}>
                    {transaction?.transaction_type || 'N/A'} {transaction?.quantity || 0} @ ₹{transaction?.price || 0}
                  </div>
                </div>
                <div className={styles.transactionAmount}>
                  ₹{(transaction?.total_amount || 0).toLocaleString('en-IN')}
                </div>
                <div className={styles.transactionDate}>
                  {transaction?.created_at ? new Date(transaction.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No transactions yet.</p>
          </div>
        )}
      </div>

      {/* Trade Modal */}
      {showTradeModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{tradeData.type === 'BUY' ? '🟢' : '🔴'} {tradeData.type} Order</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowTradeModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.inputGroup}>
                <label>Symbol</label>
                <input
                  type="text"
                  value={tradeData.symbol}
                  onChange={(e) => setTradeData({...tradeData, symbol: e.target.value})}
                  placeholder="Enter symbol (e.g., AAPL, RELIANCE.NS)"
                  className={styles.amountInput}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Transaction Type</label>
                <select
                  value={tradeData.type}
                  onChange={(e) => setTradeData({...tradeData, type: e.target.value})}
                  className={styles.currencySelect}
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Quantity</label>
                <input
                  type="number"
                  value={tradeData.quantity}
                  onChange={(e) => setTradeData({...tradeData, quantity: e.target.value})}
                  placeholder="Enter quantity"
                  className={styles.amountInput}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Price per Share (₹)</label>
                <input
                  type="number"
                  value={tradeData.price}
                  onChange={(e) => setTradeData({...tradeData, price: e.target.value})}
                  placeholder="Enter price"
                  className={styles.amountInput}
                />
              </div>
              {tradeData.quantity && tradeData.price && (
                <div className={styles.tradeSummary}>
                  <div className={styles.summaryItem}>
                    <span>Total Amount:</span>
                    <span>₹{(parseFloat(tradeData.quantity) * parseFloat(tradeData.price)).toLocaleString('en-IN')}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span>Available Cash:</span>
                    <span>₹{balances.inr.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
              <div className={styles.modalActions}>
                <button 
                  className={styles.cancelButton}
                  onClick={() => setShowTradeModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className={tradeData.type === 'BUY' ? styles.buyButton : styles.sellButton}
                  onClick={handleTrade}
                >
                  {tradeData.type === 'BUY' ? 'Buy Shares' : 'Sell Shares'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
