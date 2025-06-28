'use client'

import { useState } from 'react'
import styles from './StockGroups.module.css'

export default function StockGroups({ 
  markets, 
  loading, 
  selectedGroup, 
  loadStockGroup 
}) {
  // Stock Groups (like in the image)
  const stockGroups = [
    {
      id: 'tech-innovators',
      title: 'Technology Innovators',
      description: 'Best-in-class tech companies leading Technology & IT innovation in India',
      symbols: ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'TSLA', 'CRM', 'ORCL', 'ADBE', 'NFLX'],
      market: 'NASDAQ',
      category: 'Technology'
    },
    {
      id: 'coffee-can',
      title: 'Coffee Can Investing',
      description: 'Investment strategy that involves selecting high-quality stocks and holding them for a long time',
      symbols: ['BRK-B', 'JNJ', 'PG', 'KO', 'PEP', 'WMT', 'V', 'MA', 'HD', 'UNH'],
      market: 'SP500',
      category: 'Value'
    },
    {
      id: 'near-52w-lows',
      title: 'Near 52W Lows',
      description: 'Fundamentally strong stocks near their 52W low',
      symbols: ['PYPL', 'SHOP', 'SQ', 'ROKU', 'ZM', 'PELOTON', 'SNAP', 'PINS', 'TWTR', 'UBER'],
      market: 'NASDAQ',
      category: 'Value'
    },
    {
      id: 'cash-rich-smallcaps',
      title: 'Cash Rich Smallcaps',
      description: 'Profitable Smallcap companies with growing business and strong balance sheet',
      symbols: ['CRWD', 'NET', 'DDOG', 'SNOW', 'ZS', 'OKTA', 'TWLO', 'ESTC', 'MDB', 'FSLY'],
      market: 'NASDAQ',
      category: 'Small Cap'
    },
    {
      id: 'indian-bluechips',
      title: 'Indian Blue Chips',
      description: 'Top performing large cap companies from Indian markets',
      symbols: ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HINDUNILVR.NS', 'ICICIBANK.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS'],
      market: 'NSE',
      category: 'Large Cap'
    },
    {
      id: 'crypto-leaders',
      title: 'Cryptocurrency Leaders',
      description: 'Top performing cryptocurrencies with strong market cap and adoption',
      symbols: ['BTC-USD', 'ETH-USD', 'BNB-USD', 'ADA-USD', 'SOL-USD', 'DOT-USD'],
      market: 'CRYPTO',
      category: 'Cryptocurrency'
    },
    {
      id: 'dividend-aristocrats',
      title: 'Dividend Aristocrats',
      description: 'Companies with consistent dividend growth over 25+ years',
      symbols: ['KO', 'PEP', 'JNJ', 'PG', 'MMM', 'CAT', 'MCD', 'WMT', 'CL', 'KMB'],
      market: 'SP500',
      category: 'Dividend'
    },
    {
      id: 'growth-momentum',
      title: 'Growth Momentum',
      description: 'High growth companies with strong momentum and revenue growth',
      symbols: ['AMZN', 'GOOGL', 'MSFT', 'AAPL', 'TSLA', 'NVDA', 'AMD', 'CRM', 'NOW', 'SNOW'],
      market: 'NASDAQ',
      category: 'Growth'
    }
  ]

  return (
    <div className={styles.groupsTab}>
      <div className={styles.stockGroupsGrid}>
        {stockGroups.map(group => (
          <div key={group.id} className={styles.stockGroupCard}>
            <div className={styles.groupHeader}>
              <h3 className={styles.groupTitle}>{group.title}</h3>
              <span className={styles.groupCategory}>{group.category}</span>
            </div>
            
            <p className={styles.groupDescription}>{group.description}</p>
            
            <div className={styles.groupMeta}>
              <span className={styles.groupMarket}>{markets[group.market]?.name}</span>
              <span className={styles.groupCount}>{group.symbols.length} stocks</span>
            </div>
            
            <div className={styles.groupActions}>
              <button 
                className={styles.moreInfoBtn}
                onClick={() => {
                  alert(`Symbols: ${group.symbols.slice(0, 10).join(', ')}${group.symbols.length > 10 ? '...' : ''}`)
                }}
              >
                More Info
              </button>
              <button 
                className={`${styles.loadBtn} ${selectedGroup?.id === group.id ? styles.loadedBtn : ''}`}
                onClick={() => loadStockGroup(group)}
                disabled={loading && selectedGroup?.id === group.id}
              >
                {loading && selectedGroup?.id === group.id ? '⏳ Loading...' : 'Load'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
