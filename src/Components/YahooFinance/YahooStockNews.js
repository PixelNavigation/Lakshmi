'use client'

import { useState, useEffect } from 'react'
import styles from './YahooComponents.module.css'

export default function YahooStockNews({ symbol }) {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Call news API endpoint
        // You may need to create this endpoint or use an existing one
        const response = await fetch(`/api/news?symbol=${symbol}`)
        const data = await response.json()
        
        if (data.success && data.news) {
          setNews(data.news)
        } else {
          throw new Error(data.error || 'Failed to fetch news')
        }
      } catch (err) {
        console.error(`Error fetching news for ${symbol}:`, err)
        setError('Unable to load news')
        
        // Fallback - display some general placeholder news items
        setNews([
          {
            id: 'placeholder1',
            title: `Latest market updates for ${symbol}`,
            description: 'Check back later for the latest news and updates about this stock.',
            url: '#',
            source: 'Market Update',
            publishedAt: new Date().toISOString()
          },
          {
            id: 'placeholder2',
            title: 'Market analysis and trends',
            description: 'Stay informed about the latest market trends and analysis.',
            url: '#',
            source: 'Financial Express',
            publishedAt: new Date().toISOString()
          }
        ])
      } finally {
        setLoading(false)
      }
    }
    
    if (symbol) {
      fetchNews()
    }
  }, [symbol])

  // Format published date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  return (
    <div className={styles.newsWidget}>
      <div className={styles.newsHeader}>
        <h3>Latest News for {symbol}</h3>
      </div>
      
      {loading ? (
        <div className={styles.loading}>Loading news...</div>
      ) : error ? (
        <div className={styles.errorContainer}>
          <div className={styles.error}>{error}</div>
          <p className={styles.errorHelp}>Please check back later for updates.</p>
        </div>
      ) : (
        <div className={styles.newsList}>
          {news.length > 0 ? (
            news.map((item) => (
              <div key={item.id || item.url} className={styles.newsItem}>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.newsLink}>
                  <h4 className={styles.newsTitle}>{item.title}</h4>
                  <p className={styles.newsDescription}>{item.description}</p>
                  <div className={styles.newsFooter}>
                    <span className={styles.newsSource}>{item.source}</span>
                    <span className={styles.newsDate}>{formatDate(item.publishedAt)}</span>
                  </div>
                </a>
              </div>
            ))
          ) : (
            <div className={styles.noNews}>No recent news found for {symbol}</div>
          )}
        </div>
      )}
    </div>
  )
}
