'use client'

import { useState, useEffect } from 'react'
import styles from './News.module.css'

export default function News() {
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [newsArticles, setNewsArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Fetch news function
  const fetchNews = async (category = selectedCategory, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const url = `/api/news?category=${category}&limit=20&refresh=${isRefresh}`
      console.log('Fetching news from:', url)
      
      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setNewsArticles(data.data)
        setLastUpdated(new Date().toLocaleString())
        console.log(`Loaded ${data.data.length} articles`)
      } else {
        setError(data.error || 'Failed to fetch news')
        setNewsArticles([])
      }
    } catch (err) {
      console.error('Error fetching news:', err)
      setError('Network error: Failed to fetch news')
      setNewsArticles([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Load news on component mount
  useEffect(() => {
    fetchNews()
  }, [])

  // Handle category change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    fetchNews(category)
  }

  // Handle refresh
  const handleRefresh = () => {
    fetchNews(selectedCategory, true)
  }

  const categories = [
    { id: 'general', label: 'General' },
    { id: 'finance', label: 'Finance' },
    { id: 'technology', label: 'Technology' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'health', label: 'Health' },
    { id: 'science', label: 'Science' }
  ]

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className={styles.pageTitle}>📰 Market News</h1>
            <p className={styles.pageSubtitle}>Stay updated with the latest market news and analysis</p>
            {lastUpdated && (
              <p style={{ fontSize: '0.8rem', color: '#666', margin: '0.5rem 0' }}>
                Last updated: {lastUpdated}
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: refreshing || loading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              opacity: refreshing || loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {refreshing ? '🔄' : '🔄'} {refreshing ? 'Refreshing...' : 'Refresh News'}
          </button>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.mainContent}>
          <div className={styles.card}>
            <h3>News Categories</h3>
            <div className={styles.categoryFilters} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  disabled={loading}
                  className={selectedCategory === category.id ? styles.activeFilter : styles.filterButton}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    backgroundColor: selectedCategory === category.id ? '#007bff' : '#f8f9fa',
                    color: selectedCategory === category.id ? 'white' : '#333',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className={styles.card} style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📰</div>
              <p>Loading latest news...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className={styles.card} style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f8d7da', color: '#721c24' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
              <h3>Unable to load news</h3>
              <p>{error}</p>
              <button
                onClick={() => fetchNews()}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#721c24',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '1rem'
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* News Articles */}
          {!loading && !error && (
            <div className={styles.newsContainer}>
              {newsArticles.length === 0 ? (
                <div className={styles.card} style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📭</div>
                  <h3>No news articles found</h3>
                  <p>Try selecting a different category or refresh the page.</p>
                </div>
              ) : (
                newsArticles.map(article => (
                  <div key={article.id} className={styles.card} style={{ marginBottom: '1rem' }}>
                    <div className={styles.newsHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', lineHeight: '1.4' }}>
                        {article.url && article.url !== '#' ? (
                          <a 
                            href={article.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: 'inherit', textDecoration: 'none' }}
                            onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseOut={(e) => e.target.style.textDecoration = 'none'}
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
                          whiteSpace: 'nowrap',
                          marginLeft: '1rem'
                        }}
                      >
                        {article.impact}
                      </span>
                    </div>
                    
                    <p className={styles.newsSummary} style={{ color: '#666', lineHeight: '1.5', marginBottom: '1rem' }}>
                      {article.summary}
                    </p>
                    
                    {/* Article Metadata */}
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '1rem', 
                      alignItems: 'center', 
                      marginBottom: '1rem',
                      padding: '0.75rem',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef'
                    }}>
                      {article.source && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#6c757d', fontWeight: 'bold' }}>Source:</span>
                          <span style={{ fontSize: '0.8rem', color: '#495057' }}>{article.source}</span>
                        </div>
                      )}
                      {article.author && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#6c757d', fontWeight: 'bold' }}>By:</span>
                          <span style={{ fontSize: '0.8rem', color: '#495057' }}>{article.author}</span>
                        </div>
                      )}
                      {article.time && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#6c757d', fontWeight: 'bold' }}>📅</span>
                          <span style={{ fontSize: '0.8rem', color: '#495057' }}>{article.time}</span>
                        </div>
                      )}
                      {article.isRealTime && (
                        <div style={{ 
                          backgroundColor: '#28a745', 
                          color: 'white', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '12px', 
                          fontSize: '0.7rem', 
                          fontWeight: 'bold',
                          marginLeft: 'auto'
                        }}>
                          🔴 LIVE
                        </div>
                      )}
                    </div>
                    
                    {article.imageUrl && (
                      <img 
                        src={article.imageUrl} 
                        alt={article.title}
                        style={{ 
                          width: '100%', 
                          maxHeight: '200px', 
                          objectFit: 'cover', 
                          borderRadius: '4px', 
                          marginBottom: '1rem' 
                        }}
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    )}
                    
                    {/* Stock Impact Analysis */}
                    {(article.affectedStocks?.length > 0 || article.stockSectors?.length > 0) && (
                      <div style={{ 
                        backgroundColor: '#f8f9fa', 
                        padding: '1rem', 
                        borderRadius: '6px', 
                        marginBottom: '1rem',
                        border: '1px solid #e9ecef'
                      }}>
                        <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#495057' }}>
                          📊 Stock Market Impact
                        </h4>
                        
                        {/* Affected Stocks */}
                        {article.affectedStocks?.length > 0 && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#6c757d' }}>
                              Potentially Affected Stocks (≥50% confidence):
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {article.affectedStocks.slice(0, 4).map((stock, idx) => (
                                <span key={idx} style={{
                                  backgroundColor: stock.confidenceLevel === 'high' ? '#007bff' : 
                                                 stock.confidenceLevel === 'medium' ? '#28a745' : '#6c757d',
                                  color: 'white',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '12px',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  {stock.symbol}
                                  <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                                    ({stock.country})
                                  </span>
                                  {stock.confidenceLevel === 'high' && <span style={{ fontSize: '0.6rem' }}>⭐</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Market Sectors */}
                        {article.stockSectors?.length > 0 && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#6c757d' }}>
                              Market Sectors:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {article.stockSectors.map((sector, idx) => (
                                <span key={idx} style={{
                                  backgroundColor: sector.impact === 'high' ? '#dc3545' : 
                                                 sector.impact === 'medium' ? '#ffc107' : '#28a745',
                                  color: sector.impact === 'medium' ? '#000' : 'white',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '12px',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold'
                                }}>
                                  {sector.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Market Impact Level */}
                        {article.marketImpact && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>Market Impact:</span>
                            <span style={{
                              backgroundColor: article.marketImpact === 'high' ? '#dc3545' : 
                                             article.marketImpact === 'medium' ? '#ffc107' : 
                                             article.marketImpact === 'low' ? '#28a745' : '#6c757d',
                              color: article.marketImpact === 'medium' ? '#000' : 'white',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              textTransform: 'capitalize'
                            }}>
                              {article.marketImpact}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className={styles.sidebar}>
          <div className={styles.card}>
            <h3>Live News Status</h3>
            <div className={styles.statusIndicator} style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                {loading ? '⏳' : error ? '❌' : '✅'}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: error ? '#dc3545' : '#28a745' }}>
                {loading ? 'Loading...' : error ? 'Offline' : 'Live'}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                {loading ? 'Fetching latest news' : error ? 'Check your connection' : 'Real-time news feed'}
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Stock Impact Summary</h3>
            <div className={styles.stockSummary}>
              {(() => {
                // Aggregate all affected stocks
                const allStocks = {}
                const allSectors = {}
                let highImpactCount = 0
                
                newsArticles.forEach(article => {
                  // Count stock mentions
                  article.affectedStocks?.forEach(stock => {
                    if (allStocks[stock.symbol]) {
                      allStocks[stock.symbol].count += 1
                    } else {
                      allStocks[stock.symbol] = { ...stock, count: 1 }
                    }
                  })
                  
                  // Count sector mentions
                  article.stockSectors?.forEach(sector => {
                    if (allSectors[sector.name]) {
                      allSectors[sector.name].count += 1
                    } else {
                      allSectors[sector.name] = { ...sector, count: 1 }
                    }
                  })
                  
                  // Count high impact news
                  if (article.marketImpact === 'high') {
                    highImpactCount += 1
                  }
                })
                
                const topStocks = Object.values(allStocks)
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                
                const topSectors = Object.values(allSectors)
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 3)
                
                return (
                  <>
                    {topStocks.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#6c757d' }}>
                          Most Mentioned Stocks:
                        </div>
                        {topStocks.map((stock, idx) => (
                          <div key={idx} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            padding: '0.5rem 0',
                            borderBottom: idx < topStocks.length - 1 ? '1px solid #eee' : 'none'
                          }}>
                            <span style={{ fontWeight: 'bold' }}>{stock.symbol}</span>
                            <span style={{ 
                              backgroundColor: '#007bff', 
                              color: 'white', 
                              padding: '0.2rem 0.4rem', 
                              borderRadius: '8px', 
                              fontSize: '0.8rem' 
                            }}>
                              {stock.count} {stock.count === 1 ? 'mention' : 'mentions'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {topSectors.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#6c757d' }}>
                          Active Sectors:
                        </div>
                        {topSectors.map((sector, idx) => (
                          <div key={idx} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            padding: '0.5rem 0',
                            borderBottom: idx < topSectors.length - 1 ? '1px solid #eee' : 'none'
                          }}>
                            <span>{sector.name}</span>
                            <span style={{ 
                              backgroundColor: sector.impact === 'high' ? '#dc3545' : 
                                             sector.impact === 'medium' ? '#ffc107' : '#28a745',
                              color: sector.impact === 'medium' ? '#000' : 'white',
                              padding: '0.2rem 0.4rem', 
                              borderRadius: '8px', 
                              fontSize: '0.8rem' 
                            }}>
                              {sector.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '1rem', 
                      backgroundColor: highImpactCount > 0 ? '#fff3cd' : '#d4edda',
                      borderRadius: '6px',
                      border: `1px solid ${highImpactCount > 0 ? '#ffeaa7' : '#c3e6cb'}`
                    }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                        {highImpactCount > 0 ? '⚠️' : '📈'}
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                        {highImpactCount} High Impact {highImpactCount === 1 ? 'Story' : 'Stories'}
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>

          <div className={styles.card}>
            <h3>News Stats</h3>
            <div className={styles.statsList}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span>Total Articles</span>
                <span style={{ fontWeight: 'bold' }}>{newsArticles.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span>Category</span>
                <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{selectedCategory}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span>Positive News</span>
                <span style={{ fontWeight: 'bold', color: '#28a745' }}>
                  {newsArticles.filter(a => a.impact === 'positive').length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span>Negative News</span>
                <span style={{ fontWeight: 'bold', color: '#dc3545' }}>
                  {newsArticles.filter(a => a.impact === 'negative').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
