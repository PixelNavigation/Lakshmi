'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import styles from './Balance.module.css'

export default function Balance() {
  const { user } = useAuth()
  const [balances, setBalances] = useState({
    inr: 0,
    eth: 0
  })
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [addAmount, setAddAmount] = useState('')
  const [addCurrency, setAddCurrency] = useState('inr')

  // Get the actual authenticated user ID
  const userId = user?.id || 'user123' // Fallback for demo purposes

  useEffect(() => {
    if (user) {
      fetchBalances()
      fetchTransactions()
    }
  }, [user])

  const fetchBalances = async () => {
    try {
      const headers = {}
      
      // Add authentication header if user is logged in
      if (user) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`
        }
      }
      
      const response = await fetch(`/api/user-balance?userId=${userId}`, { headers })
      const data = await response.json()
      
      if (data.success) {
        setBalances(data.balances)
      } else {
        setError('Failed to fetch balances')
      }
    } catch (err) {
      setError('Error fetching balances: ' + err.message)
    }
  }

  const fetchTransactions = async () => {
    try {
      const headers = {}
      
      // Add authentication header if user is logged in
      if (user) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`
        }
      }
      
      const response = await fetch(`/api/user-transactions?userId=${userId}`, { headers })
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

  const handleAddFunds = async () => {
    if (!addAmount || parseFloat(addAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    try {
      const response = await fetch('/api/add-funds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          amount: parseFloat(addAmount),
          currency: addCurrency
        }),
      })

      const data = await response.json()

      if (data.success) {
        setBalances(data.balances)
        setAddAmount('')
        setShowAddFunds(false)
        alert(`Successfully added ${addAmount} ${addCurrency.toUpperCase()}`)
      } else {
        alert('Failed to add funds: ' + data.error)
      }
    } catch (err) {
      alert('Error adding funds: ' + err.message)
    }
  }

  const totalWealth = balances.inr + (balances.eth * 250000) // Assuming 1 ETH = 250,000 INR

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingMessage}>Loading balance information...</div>
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
        <h1 className={styles.title}>💰 Balance</h1>
        <button 
          className={styles.addFundsButton}
          onClick={() => setShowAddFunds(true)}
        >
          + Add Funds
        </button>
      </div>

      {/* Balance Cards */}
      <div className={styles.balanceGrid}>
        <div className={styles.balanceCard}>
          <div className={styles.balanceHeader}>
            <h3>💵 INR Balance</h3>
            <span className={styles.currency}>₹</span>
          </div>
          <div className={styles.balanceAmount}>
            {balances.inr.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
          <div className={styles.balanceLabel}>Indian Rupees</div>
        </div>

        <div className={styles.balanceCard}>
          <div className={styles.balanceHeader}>
            <h3>⚡ ETH Balance</h3>
            <span className={styles.currency}>Ξ</span>
          </div>
          <div className={styles.balanceAmount}>
            {balances.eth.toFixed(8)}
          </div>
          <div className={styles.balanceLabel}>Ethereum</div>
        </div>

        <div className={styles.balanceCard}>
          <div className={styles.balanceHeader}>
            <h3>💎 Total Wealth</h3>
            <span className={styles.currency}>₹</span>
          </div>
          <div className={styles.balanceAmount}>
            {totalWealth.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
          <div className={styles.balanceLabel}>Cash + Crypto</div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>📜 Recent Transactions</h2>
        {transactions.length > 0 ? (
          <div className={styles.transactionsList}>
            {transactions.slice(0, 10).map((transaction, index) => (
              <div key={index} className={styles.transactionItem}>
                <div className={styles.transactionIcon}>
                  {transaction.transaction_type === 'BUY' ? '🟢' : '🔴'}
                </div>
                <div className={styles.transactionDetails}>
                  <div className={styles.transactionSymbol}>{transaction.symbol}</div>
                  <div className={styles.transactionInfo}>
                    {transaction.transaction_type} {transaction.quantity} @ ₹{transaction.price}
                  </div>
                </div>
                <div className={styles.transactionAmount}>
                  ₹{transaction.total_amount.toLocaleString('en-IN')}
                </div>
                <div className={styles.transactionDate}>
                  {new Date(transaction.created_at).toLocaleDateString()}
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

      {/* Add Funds Modal */}
      {showAddFunds && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>💰 Add Funds</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowAddFunds(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.inputGroup}>
                <label>Amount</label>
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="Enter amount"
                  className={styles.amountInput}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Currency</label>
                <select
                  value={addCurrency}
                  onChange={(e) => setAddCurrency(e.target.value)}
                  className={styles.currencySelect}
                >
                  <option value="inr">INR (₹)</option>
                  <option value="eth">ETH (Ξ)</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button 
                  className={styles.cancelButton}
                  onClick={() => setShowAddFunds(false)}
                >
                  Cancel
                </button>
                <button 
                  className={styles.confirmButton}
                  onClick={handleAddFunds}
                >
                  Add Funds
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
