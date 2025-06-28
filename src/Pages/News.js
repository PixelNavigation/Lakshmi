'use client'

import { useState, useEffect } from 'react'
import styles from './News.module.css'

export default function News() {
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [newsData, setNewsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isRealTimeData, setIsRealTimeData] = useState(false)

  // Fetch news data
  const fetchNews = async (category = 'general') => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/news?category=${category}&limit=20`)
      const result = await response.json()
      
      if (result.success) {
        setNewsData(result.data)
        setLastUpdated(new Date())
        setIsRealTimeData(!result.isMockData)
      } else {
        throw new Error('Failed to fetch news')
      }
    } catch (err) {
      console.error('Error fetching news:', err)
      setError('Failed to load news. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  // Initial load and category changes
  useEffect(() => {
    fetchNews(selectedCategory)
  }, [selectedCategory])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNews(selectedCategory)
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [selectedCategory])

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
  }

  const handleRefresh = () => {
    fetchNews(selectedCategory)
  }

  const filteredNews = newsData

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className={styles.pageTitle}>📰 Market News</h1>
            <p className={styles.pageSubtitle}>Stay updated with the latest market news and analysis</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {lastUpdated && (
              <span style={{ fontSize: '0.9rem', color: '#666' }}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={styles.refreshButton}
            >
              {loading ? '🔄 Loading...' : '🔄 Refresh'}
            </button>
          </div>
        </div>
        
        {/* Data source indicator */}
        <div className={styles.dataSourceIndicator} style={{ 
          backgroundColor: isRealTimeData ? '#d4edda' : '#fff3cd',
          color: isRealTimeData ? '#155724' : '#856404',
        }}>
          {isRealTimeData ? '🟢 Real-time data' : '🟡 Demo data'}
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.mainContent}>
          <div className={styles.card}>
            <h3>News Categories</h3>
            <div className={styles.categoryFilters} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {['general', 'technology', 'finance', 'economics', 'healthcare', 'energy', 'cryptocurrency'].map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  disabled={loading}
                  className={selectedCategory === category ? styles.activeFilter : styles.filterButton}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    backgroundColor: selectedCategory === category ? '#007bff' : '#f8f9fa',
                    color: selectedCategory === category ? 'white' : '#333',
                    textTransform: 'capitalize',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className={styles.card} style={{ backgroundColor: '#f8d7da', borderColor: '#f5c6cb', color: '#721c24' }}>
              <h3>⚠️ Error</h3>
              <p>{error}</p>
              <button
                onClick={handleRefresh}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className={styles.card} style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
              <p>Loading latest news...</p>
            </div>
          )}

          {/* News articles */}
          {!loading && !error && (
            <div className={styles.newsContainer}>
              {filteredNews.length === 0 ? (
                <div className={styles.card} style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📰</div>
                  <p>No news articles found for this category.</p>
                </div>
              ) : (
                filteredNews.map(article => (
                  <div key={article.id} className={styles.card} style={{ marginBottom: '1rem' }}>
                    <div className={styles.newsHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', flex: 1, marginRight: '1rem' }}>
                        {article.url ? (
                          <a 
                            href={article.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            {article.title}
                          </a>
                        ) : (
                          article.title
                        )}
                      </h3>
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
                                 article.impact === 'negative' ? '#721c24' : '#383d41',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {article.impact || 'neutral'}
                      </span>
                    </div>
                    
                    {article.imageUrl && (
                      <div style={{ marginBottom: '1rem' }}>
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className={styles.newsImage}
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                    
                    <p className={styles.newsSummary} style={{ color: '#666', lineHeight: '1.5', marginBottom: '1rem' }}>
                      {article.summary || article.content}
                    </p>
                    
                    <div className={styles.newsFooter} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: '#888' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{article.source}</span>
                        {article.isRealTime && (
                          <span className={styles.liveBadge}>
                            LIVE
                          </span>
                        )}
                      </div>
                      <span>{article.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className={styles.sidebar}>
          <div className={styles.card}>
            <h3>Market Sentiment</h3>
            <div className={styles.sentimentIndicator} style={{ textAlign: 'center', padding: '1rem' }}>
              {(() => {
                if (loading) {
                  return (
                    <>
                      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⏳</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#666' }}>Loading...</div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>Analyzing sentiment</div>
                    </>
                  )
                }
                
                const positiveCount = filteredNews.filter(article => article.impact === 'positive').length
                const negativeCount = filteredNews.filter(article => article.impact === 'negative').length
                const totalCount = filteredNews.length
                
                if (totalCount === 0) {
                  return (
                    <>
                      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📊</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#666' }}>No Data</div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>No news available</div>
                    </>
                  )
                }
                
                const positiveRatio = positiveCount / totalCount
                const negativeRatio = negativeCount / totalCount
                
                if (positiveRatio > 0.4) {
                  return (
                    <>
                      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📈</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}>Bullish</div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        {Math.round(positiveRatio * 100)}% positive sentiment
                      </div>
                    </>
                  )
                } else if (negativeRatio > 0.4) {
                  return (
                    <>
                      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📉</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#dc3545' }}>Bearish</div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        {Math.round(negativeRatio * 100)}% negative sentiment
                      </div>
                    </>
                  )
                } else {
                  return (
                    <>
                      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>➡️</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#007bff' }}>Neutral</div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        Mixed market sentiment
                      </div>
                    </>
                  )
                }
              })()}
            </div>
          </div>

          <div className={styles.card}>
            <h3>News Analytics</h3>
            <div className={styles.analyticsContainer}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Total Articles:</span>
                <span style={{ fontWeight: 'bold' }}>{filteredNews.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Positive:</span>
                <span style={{ fontWeight: 'bold', color: '#28a745' }}>
                  {filteredNews.filter(article => article.impact === 'positive').length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Negative:</span>
                <span style={{ fontWeight: 'bold', color: '#dc3545' }}>
                  {filteredNews.filter(article => article.impact === 'negative').length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Neutral:</span>
                <span style={{ fontWeight: 'bold', color: '#666' }}>
                  {filteredNews.filter(article => article.impact === 'neutral' || !article.impact).length}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Top Sources</h3>
            <div className={styles.sourcesList}>
              {(() => {
                const sourceCounts = {}
                filteredNews.forEach(article => {
                  const source = article.source || 'Unknown'
                  sourceCounts[source] = (sourceCounts[source] || 0) + 1
                })
                
                return Object.entries(sourceCounts)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([source, count]) => (
                    <div key={source} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                      <span style={{ fontSize: '0.9rem' }}>{source}</span>
                      <span style={{ fontWeight: 'bold', color: '#007bff' }}>{count}</span>
                    </div>
                  ))
              })()}
            </div>
          </div>

          <div className={styles.card}>
            <h3>Categories</h3>
            <div className={styles.categoriesList}>
              {(() => {
                const categoryCounts = {}
                filteredNews.forEach(article => {
                  const category = article.category || 'general'
                  categoryCounts[category] = (categoryCounts[category] || 0) + 1
                })
                
                return Object.entries(categoryCounts)
                  .sort(([,a], [,b]) => b - a)
                  .map(([category, count]) => (
                    <div key={category} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                      <span style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>{category}</span>
                      <span style={{ fontWeight: 'bold', color: '#28a745' }}>{count}</span>
                    </div>
                  ))
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
