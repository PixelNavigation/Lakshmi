'use client'

import { useState, useEffect } from 'react'
import styles from './YahooComponents.module.css'

export default function YahooStockFinancials({ symbol }) {
  const [financials, setFinancials] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // This endpoint needs to be created to fetch financial data
        // You may need to create or use an existing API that can fetch financial data
        const response = await fetch(`/api/stock-detail?symbol=${symbol}&type=financials`)
        const data = await response.json()
        
        if (data.success && data.financials) {
          setFinancials(data.financials)
        } else {
          throw new Error(data.error || 'Failed to fetch financial data')
        }
      } catch (err) {
        console.error(`Error fetching financial data for ${symbol}:`, err)
        setError('Unable to load financial data')
        
        // Provide fallback/dummy data
        setFinancials({
          companyName: symbol,
          marketCap: "N/A",
          peRatio: "N/A",
          eps: "N/A",
          dividend: "N/A",
          dividendYield: "N/A",
          beta: "N/A",
          avgVolume: "N/A",
          revenueGrowthYoY: "N/A",
          quarterlyEarningsGrowthYoY: "N/A",
          profitMargin: "N/A",
          returnOnEquity: "N/A",
          debtToEquity: "N/A"
        })
      } finally {
        setLoading(false)
      }
    }
    
    if (symbol) {
      fetchFinancials()
    }
  }, [symbol])

  // Format large numbers with commas and appropriate suffixes
  const formatValue = (value) => {
    if (value === undefined || value === null || value === 'N/A') return 'N/A'
    
    // If it's already a string, return it
    if (typeof value === 'string') return value
    
    // Format as currency with crore/lakh notation for large numbers
    if (value >= 10000000) { // 1 crore = 10,000,000
      return `₹${(value / 10000000).toFixed(2)} Cr`
    } else if (value >= 100000) { // 1 lakh = 100,000
      return `₹${(value / 100000).toFixed(2)} L`
    } else {
      return value.toLocaleString('en-IN')
    }
  }

  // Format percentage values
  const formatPercent = (value) => {
    if (value === undefined || value === null || value === 'N/A') return 'N/A'
    
    // If it's already a string, return it
    if (typeof value === 'string') return value
    
    return `${value.toFixed(2)}%`
  }

  return (
    <div className={styles.financialsWidget}>
      <div className={styles.financialsHeader}>
        <h3>{symbol} Financial Summary</h3>
      </div>
      
      {loading ? (
        <div className={styles.loading}>Loading financial data...</div>
      ) : error ? (
        <div className={styles.errorContainer}>
          <div className={styles.error}>{error}</div>
          <p className={styles.errorHelp}>Please try again later.</p>
        </div>
      ) : financials ? (
        <div className={styles.financialsContent}>
          <div className={styles.financialsSection}>
            <h4>Key Metrics</h4>
            <table className={styles.financialsTable}>
              <tbody>
                <tr>
                  <td>Market Cap</td>
                  <td>{formatValue(financials.marketCap)}</td>
                </tr>
                <tr>
                  <td>P/E Ratio</td>
                  <td>{financials.peRatio}</td>
                </tr>
                <tr>
                  <td>EPS</td>
                  <td>{financials.eps}</td>
                </tr>
                <tr>
                  <td>Dividend</td>
                  <td>{financials.dividend}</td>
                </tr>
                <tr>
                  <td>Dividend Yield</td>
                  <td>{formatPercent(financials.dividendYield)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className={styles.financialsSection}>
            <h4>Growth & Profitability</h4>
            <table className={styles.financialsTable}>
              <tbody>
                <tr>
                  <td>Revenue Growth (YoY)</td>
                  <td>{formatPercent(financials.revenueGrowthYoY)}</td>
                </tr>
                <tr>
                  <td>Quarterly Earnings Growth (YoY)</td>
                  <td>{formatPercent(financials.quarterlyEarningsGrowthYoY)}</td>
                </tr>
                <tr>
                  <td>Profit Margin</td>
                  <td>{formatPercent(financials.profitMargin)}</td>
                </tr>
                <tr>
                  <td>Return on Equity</td>
                  <td>{formatPercent(financials.returnOnEquity)}</td>
                </tr>
                <tr>
                  <td>Debt to Equity</td>
                  <td>{financials.debtToEquity}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className={styles.disclaimerText}>
            <p>Data as per latest available financials. May not reflect most recent changes.</p>
          </div>
        </div>
      ) : (
        <div className={styles.noData}>No financial data available for {symbol}</div>
      )}
    </div>
  )
}
