'use client'

import { useState } from 'react'
import styles from './News.module.css'

export default function News() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const newsArticles = [
    {
      id: 1,
      title: "Tech Stocks Rally as AI Adoption Accelerates",
      summary: "Major technology companies see significant gains as artificial intelligence adoption continues to drive market sentiment.",
      category: "technology",
      time: "2 hours ago",
      source: "Market Watch",
      impact: "positive"
    },
    {
      id: 2,
      title: "Federal Reserve Hints at Interest Rate Stability",
      summary: "Recent Fed communications suggest interest rates may remain stable through the next quarter, boosting investor confidence.",
      category: "economics",
      time: "4 hours ago",
      source: "Financial Times",
      impact: "positive"
    },
    {
      id: 3,
      title: "Healthcare Sector Shows Strong Q3 Earnings",
      summary: "Healthcare companies report better-than-expected earnings, driven by strong demand and cost management initiatives.",
      category: "healthcare",
      time: "6 hours ago",
      source: "Reuters",
      impact: "positive"
    },
    {
      id: 4,
      title: "Energy Stocks Face Volatility Amid Supply Concerns",
      summary: "Oil and gas companies experience increased volatility as global supply chain disruptions continue to affect markets.",
      category: "energy",
      time: "8 hours ago",
      source: "Bloomberg",
      impact: "negative"
    },
    {
      id: 5,
      title: "Banking Sector Prepares for Regulatory Changes",
      summary: "Major banks adjust strategies in anticipation of upcoming regulatory changes affecting lending practices.",
      category: "finance",
      time: "1 day ago",
      source: "Wall Street Journal",
      impact: "neutral"
    }
  ]

  const filteredNews = selectedCategory === 'all' 
    ? newsArticles 
    : newsArticles.filter(article => article.category === selectedCategory)

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>📰 Market News</h1>
        <p className={styles.pageSubtitle}>Stay updated with the latest market news and analysis</p>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.mainContent}>
          <div className={styles.card}>
            <h3>News Categories</h3>
            <div className={styles.categoryFilters} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {['all', 'technology', 'economics', 'healthcare', 'energy', 'finance'].map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? styles.activeFilter : styles.filterButton}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    backgroundColor: selectedCategory === category ? '#007bff' : '#f8f9fa',
                    color: selectedCategory === category ? 'white' : '#333',
                    textTransform: 'capitalize'
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.newsContainer}>
            {filteredNews.map(article => (
              <div key={article.id} className={styles.card} style={{ marginBottom: '1rem' }}>
                <div className={styles.newsHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{article.title}</h3>
                  <span 
                    className={styles.impactBadge}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      backgroundColor: article.impact === 'positive' ? '#d4edda' : 
                                     article.impact === 'negative' ? '#f8d7da' : '#e2e3e5',
                      color: article.impact === 'positive' ? '#155724' : 
                             article.impact === 'negative' ? '#721c24' : '#383d41'
                    }}
                  >
                    {article.impact}
                  </span>
                </div>
                
                <p className={styles.newsSummary} style={{ color: '#666', lineHeight: '1.5', marginBottom: '1rem' }}>
                  {article.summary}
                </p>
                
                <div className={styles.newsFooter} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: '#888' }}>
                  <span>{article.source}</span>
                  <span>{article.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.card}>
            <h3>Market Sentiment</h3>
            <div className={styles.sentimentIndicator} style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📈</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}>Bullish</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Market sentiment is positive</div>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Top Trending</h3>
            <div className={styles.trendingList}>
              <div className={styles.trendingItem} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span>#AI</span>
                <span style={{ color: '#28a745' }}>+15%</span>
              </div>
              <div className={styles.trendingItem} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span>#FederalReserve</span>
                <span style={{ color: '#007bff' }}>+8%</span>
              </div>
              <div className={styles.trendingItem} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span>#Healthcare</span>
                <span style={{ color: '#28a745' }}>+12%</span>
              </div>
              <div className={styles.trendingItem} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span>#Energy</span>
                <span style={{ color: '#dc3545' }}>-5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
