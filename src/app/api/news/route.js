// src/app/api/news/route.js
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'general'
  const limit = searchParams.get('limit') || '20'
  
  try {
    // Multiple news sources for comprehensive coverage
    const newsSources = []
    
    // Try Alpha Vantage News API (free tier available)
    try {
      const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo'
      const alphaVantageUrl = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=${category}&limit=${limit}&apikey=${alphaVantageKey}`
      
      const alphaResponse = await fetch(alphaVantageUrl)
      if (alphaResponse.ok) {
        const alphaData = await alphaResponse.json()
        if (alphaData.feed) {
          newsSources.push(...alphaData.feed.map(article => ({
            id: article.url,
            title: article.title,
            summary: article.summary,
            content: article.summary,
            url: article.url,
            source: article.source,
            time: new Date(article.time_published).toLocaleString(),
            category: mapAlphaVantageCategory(article.topics),
            impact: determineSentiment(article.overall_sentiment_label),
            imageUrl: article.banner_image || null,
            isRealTime: true
          })))
        }
      }
    } catch (error) {
      console.log('Alpha Vantage news failed:', error.message)
    }

    // Try Financial Modeling Prep API (multiple endpoints for comprehensive coverage)
    try {
      const fmpKey = process.env.FMP_API_KEY || 'demo'
      
      if (fmpKey !== 'demo') {
        // Select appropriate FMP endpoint based on category
        let fmpUrls = []
        
        switch (category) {
          case 'cryptocurrency':
          case 'crypto':
            fmpUrls.push(`https://financialmodelingprep.com/api/v4/crypto_news?page=0&apikey=${fmpKey}`)
            break
          case 'finance':
          case 'economics':
            fmpUrls.push(`https://financialmodelingprep.com/api/v3/fmp/articles?page=0&size=${limit}&apikey=${fmpKey}`)
            fmpUrls.push(`https://financialmodelingprep.com/api/v4/general_news?page=0&apikey=${fmpKey}`)
            break
          case 'technology':
            fmpUrls.push(`https://financialmodelingprep.com/api/v3/stock_news?tickers=AAPL,MSFT,GOOGL,TSLA&page=0&apikey=${fmpKey}`)
            fmpUrls.push(`https://financialmodelingprep.com/api/v3/fmp/articles?page=0&size=${limit}&apikey=${fmpKey}`)
            break
          default:
            fmpUrls.push(`https://financialmodelingprep.com/api/v4/general_news?page=0&apikey=${fmpKey}`)
            fmpUrls.push(`https://financialmodelingprep.com/api/v3/fmp/articles?page=0&size=${limit}&apikey=${fmpKey}`)
            break
        }
        
        // Fetch from multiple FMP endpoints
        for (const fmpUrl of fmpUrls) {
          try {
            const fmpResponse = await fetch(fmpUrl)
            if (fmpResponse.ok) {
              const fmpData = await fmpResponse.json()
              
              if (Array.isArray(fmpData) && fmpData.length > 0) {
                const mappedArticles = fmpData.slice(0, Math.ceil(parseInt(limit) / fmpUrls.length)).map((article, index) => {
                  // Handle different FMP API response formats
                  const title = article.title || article.headline || 'Financial News Update'
                  const content = article.content || article.text || article.summary || title
                  const publishedDate = article.date || article.publishedDate || article.datetime || new Date().toISOString()
                  const imageUrl = article.image || article.imageUrl || null
                  const articleUrl = article.url || article.link || '#'
                  
                  return {
                    id: articleUrl !== '#' ? articleUrl : `fmp-${Date.now()}-${index}`,
                    title: title,
                    summary: content.length > 200 ? content.substring(0, 200) + '...' : content,
                    content: content,
                    url: articleUrl,
                    source: article.source || 'Financial Modeling Prep',
                    time: new Date(publishedDate).toLocaleString(),
                    category: mapFMPCategory(category, article),
                    impact: determineFMPSentiment(article),
                    imageUrl: imageUrl,
                    isRealTime: true
                  }
                })
                
                newsSources.push(...mappedArticles)
                break // Successfully got data, no need to try more endpoints
              }
            }
          } catch (endpointError) {
            console.log(`FMP endpoint ${fmpUrl} failed:`, endpointError.message)
            continue // Try next endpoint
          }
        }
      }
    } catch (error) {
      console.log('FMP news failed:', error.message)
    }

    // Try NewsAPI (requires API key)
    try {
      const newsApiKey = process.env.NEWSAPI_KEY
      if (newsApiKey) {
        const newsApiUrl = `https://newsapi.org/v2/top-headlines?category=business&country=us&pageSize=${limit}&apiKey=${newsApiKey}`
        
        const newsApiResponse = await fetch(newsApiUrl)
        if (newsApiResponse.ok) {
          const newsApiData = await newsApiResponse.json()
          if (newsApiData.articles) {
            newsSources.push(...newsApiData.articles.map((article, index) => ({
              id: article.url || `newsapi-${index}`,
              title: article.title,
              summary: article.description || article.title,
              content: article.content || article.description,
              url: article.url,
              source: article.source.name,
              time: new Date(article.publishedAt).toLocaleString(),
              category: 'business',
              impact: 'neutral',
              imageUrl: article.urlToImage,
              isRealTime: true
            })))
          }
        }
      }
    } catch (error) {
      console.log('NewsAPI failed:', error.message)
    }

    // If no real news available, provide comprehensive mock data
    if (newsSources.length === 0) {
      const mockNews = generateMockNews(category, parseInt(limit))
      newsSources.push(...mockNews)
    }

    // Remove duplicates and sort by time
    const uniqueNews = newsSources.filter((article, index, self) => 
      index === self.findIndex(a => a.title === article.title)
    ).sort((a, b) => new Date(b.time) - new Date(a.time))

    return NextResponse.json({
      success: true,
      data: uniqueNews.slice(0, parseInt(limit)),
      timestamp: new Date().toISOString(),
      sources: ['Alpha Vantage', 'Financial Modeling Prep', 'NewsAPI'],
      totalArticles: uniqueNews.length
    })

  } catch (error) {
    console.error('Error fetching news:', error)
    
    // Fallback to mock data
    const mockNews = generateMockNews(category, parseInt(limit))
    return NextResponse.json({
      success: true,
      data: mockNews,
      timestamp: new Date().toISOString(),
      sources: ['Mock Data'],
      totalArticles: mockNews.length,
      isMockData: true
    })
  }
}

// Helper functions
function mapAlphaVantageCategory(topics) {
  if (!topics || !Array.isArray(topics)) return 'general'
  
  const topicMap = {
    'technology': 'technology',
    'earnings': 'finance',
    'mergers_and_acquisitions': 'finance',
    'financial_markets': 'finance',
    'economy_fiscal': 'economics',
    'economy_monetary': 'economics',
    'energy_transportation': 'energy',
    'finance': 'finance',
    'life_sciences': 'healthcare',
    'manufacturing': 'manufacturing',
    'real_estate': 'real_estate',
    'retail_wholesale': 'retail'
  }
  
  for (const topic of topics) {
    if (topicMap[topic.topic]) {
      return topicMap[topic.topic]
    }
  }
  
  return 'general'
}

function determineSentiment(sentimentLabel) {
  if (!sentimentLabel) return 'neutral'
  
  const sentiment = sentimentLabel.toLowerCase()
  if (sentiment.includes('positive') || sentiment.includes('bullish')) return 'positive'
  if (sentiment.includes('negative') || sentiment.includes('bearish')) return 'negative'
  return 'neutral'
}

function generateMockNews(category, limit) {
  const mockArticles = [
    {
      id: 'mock-1',
      title: 'NVIDIA Reaches New All-Time High as AI Demand Surges',
      summary: 'NVIDIA Corporation shares hit a record high today as demand for AI chips continues to outpace supply, with major cloud providers expanding their data center investments.',
      content: 'NVIDIA Corporation (NVDA) shares reached a new all-time high in today\'s trading session...',
      url: '#',
      source: 'TechCrunch',
      time: new Date(Date.now() - 1000 * 60 * 30).toLocaleString(), // 30 minutes ago
      category: 'technology',
      impact: 'positive',
      imageUrl: null,
      isMockData: true
    },
    {
      id: 'mock-2',
      title: 'Federal Reserve Signals Pause in Interest Rate Hikes',
      summary: 'Fed Chair Jerome Powell indicated that the central bank may pause its aggressive rate hiking cycle, citing recent improvements in inflation data.',
      content: 'The Federal Reserve is considering a pause in its interest rate hiking cycle...',
      url: '#',
      source: 'Reuters',
      time: new Date(Date.now() - 1000 * 60 * 60).toLocaleString(), // 1 hour ago
      category: 'economics',
      impact: 'positive',
      imageUrl: null,
      isMockData: true
    },
    {
      id: 'mock-3',
      title: 'Bitcoin Surges Past $45,000 as Institutional Adoption Grows',
      summary: 'Bitcoin broke through the $45,000 resistance level as more institutional investors add cryptocurrency to their portfolios.',
      content: 'Bitcoin (BTC) surged past the $45,000 mark in early trading...',
      url: '#',
      source: 'CoinDesk',
      time: new Date(Date.now() - 1000 * 60 * 90).toLocaleString(), // 1.5 hours ago
      category: 'crypto',
      impact: 'positive',
      imageUrl: null,
      isMockData: true
    },
    {
      id: 'mock-4',
      title: 'Tesla Reports Strong Q4 Delivery Numbers Despite Challenges',
      summary: 'Tesla exceeded analyst expectations for Q4 vehicle deliveries, demonstrating resilience in a challenging automotive market.',
      content: 'Tesla Inc. (TSLA) reported stronger than expected delivery numbers...',
      url: '#',
      source: 'Bloomberg',
      time: new Date(Date.now() - 1000 * 60 * 120).toLocaleString(), // 2 hours ago
      category: 'automotive',
      impact: 'positive',
      imageUrl: null,
      isMockData: true
    },
    {
      id: 'mock-5',
      title: 'Indian Markets Rally on Strong GDP Growth Data',
      summary: 'NSE and BSE indices surge as India reports robust GDP growth, outpacing major global economies.',
      content: 'Indian equity markets rallied strongly today following the release of GDP data...',
      url: '#',
      source: 'Economic Times',
      time: new Date(Date.now() - 1000 * 60 * 180).toLocaleString(), // 3 hours ago
      category: 'emerging_markets',
      impact: 'positive',
      imageUrl: null,
      isMockData: true
    },
    {
      id: 'mock-6',
      title: 'Energy Sector Faces Headwinds Amid Supply Chain Disruptions',
      summary: 'Oil and gas companies report challenges as global supply chain disruptions continue to impact operations and pricing.',
      content: 'The energy sector is grappling with ongoing supply chain challenges...',
      url: '#',
      source: 'Wall Street Journal',
      time: new Date(Date.now() - 1000 * 60 * 240).toLocaleString(), // 4 hours ago
      category: 'energy',
      impact: 'negative',
      imageUrl: null,
      isMockData: true
    },
    {
      id: 'mock-7',
      title: 'Healthcare Stocks Rise on Breakthrough Drug Approvals',
      summary: 'Pharmaceutical companies see significant gains following FDA approvals for innovative treatments.',
      content: 'Healthcare stocks posted strong gains today after the FDA approved several breakthrough drugs...',
      url: '#',
      source: 'Medical News Today',
      time: new Date(Date.now() - 1000 * 60 * 300).toLocaleString(), // 5 hours ago
      category: 'healthcare',
      impact: 'positive',
      imageUrl: null,
      isMockData: true
    },
    {
      id: 'mock-8',
      title: 'Ethereum Network Upgrade Shows Promise for DeFi Growth',
      summary: 'The latest Ethereum network upgrade demonstrates improved scalability, boosting confidence in decentralized finance applications.',
      content: 'Ethereum\'s latest network upgrade has shown significant improvements in transaction throughput...',
      url: '#',
      source: 'DeFi Pulse',
      time: new Date(Date.now() - 1000 * 60 * 360).toLocaleString(), // 6 hours ago
      category: 'crypto',
      impact: 'positive',
      imageUrl: null,
      isMockData: true
    }
  ]

  // Filter by category if specified
  let filtered = mockArticles
  if (category && category !== 'all' && category !== 'general') {
    filtered = mockArticles.filter(article => 
      article.category === category || 
      (category === 'finance' && ['economics', 'automotive'].includes(article.category)) ||
      (category === 'cryptocurrency' && article.category === 'crypto')
    )
  }

  return filtered.slice(0, limit)
}

// Helper function to map FMP categories
function mapFMPCategory(requestedCategory, article) {
  // Use the requested category as primary, with fallbacks based on article content
  if (requestedCategory === 'cryptocurrency' || requestedCategory === 'crypto') {
    return 'cryptocurrency'
  }
  
  // Check article content for category hints
  const title = (article.title || '').toLowerCase()
  const content = (article.content || article.text || '').toLowerCase()
  const combinedText = title + ' ' + content
  
  if (combinedText.includes('crypto') || combinedText.includes('bitcoin') || combinedText.includes('ethereum')) {
    return 'cryptocurrency'
  }
  if (combinedText.includes('tech') || combinedText.includes('ai') || combinedText.includes('software')) {
    return 'technology'
  }
  if (combinedText.includes('energy') || combinedText.includes('oil') || combinedText.includes('gas')) {
    return 'energy'
  }
  if (combinedText.includes('healthcare') || combinedText.includes('pharma') || combinedText.includes('medical')) {
    return 'healthcare'
  }
  if (combinedText.includes('fed') || combinedText.includes('interest rate') || combinedText.includes('economy')) {
    return 'economics'
  }
  
  return requestedCategory || 'finance'
}

// Helper function to determine sentiment from FMP articles
function determineFMPSentiment(article) {
  const title = (article.title || '').toLowerCase()
  const content = (article.content || article.text || '').toLowerCase()
  const combinedText = title + ' ' + content
  
  // Positive indicators
  const positiveWords = ['surge', 'rally', 'gains', 'up', 'rise', 'growth', 'bullish', 'strong', 'positive', 'breakthrough', 'success', 'profits', 'beat']
  const negativeWords = ['fall', 'drop', 'down', 'decline', 'bearish', 'weak', 'negative', 'loss', 'concern', 'risk', 'crisis', 'crash']
  
  const positiveCount = positiveWords.filter(word => combinedText.includes(word)).length
  const negativeCount = negativeWords.filter(word => combinedText.includes(word)).length
  
  if (positiveCount > negativeCount && positiveCount > 0) {
    return 'positive'
  }
  if (negativeCount > positiveCount && negativeCount > 0) {
    return 'negative'
  }
  
  return 'neutral'
}
