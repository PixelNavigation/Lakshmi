// src/app/api/news/route.js
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'general'
  const limit = searchParams.get('limit') || '20'
  const country = searchParams.get('country') || 'us'
  const sortBy = searchParams.get('sortBy') || 'publishedAt'
  const refresh = searchParams.get('refresh') === 'true'
  
  try {
    let articles = []
    let errorMessage = null
    
    // NewsAPI.org - Primary news source
    const newsApiKey = process.env.NEWSAPI_KEY
    if (!newsApiKey || newsApiKey === 'your_newsapi_key_here') {
      return NextResponse.json({
        success: false,
        error: 'NewsAPI key not configured. Please add NEWSAPI_KEY to your .env.local file.',
        data: [],
        timestamp: new Date().toISOString(),
        hasLiveData: false
      }, { status: 400 })
    }

    try {
      const categoryMap = {
        'general': 'general',
        'finance': 'business',
        'economics': 'business',
        'technology': 'technology',
        'crypto': 'technology',
        'cryptocurrency': 'technology',
        'health': 'health',
        'healthcare': 'health',
        'science': 'science',
        'sports': 'sports',
        'entertainment': 'entertainment'
      }
      
      const newsApiCategory = categoryMap[category] || 'business'
      
      // Add cache-busting parameter for refresh
      const cacheParam = refresh ? `&t=${Date.now()}` : ''
      const newsApiUrl = `https://newsapi.org/v2/top-headlines?category=${newsApiCategory}&country=${country}&pageSize=${Math.min(limit, 100)}&sortBy=${sortBy}&apiKey=${newsApiKey}${cacheParam}`
      
      console.log('Fetching from NewsAPI for category:', newsApiCategory, refresh ? '(forced refresh)' : '(cached)')
      
      const newsApiResponse = await fetch(newsApiUrl, {
        headers: {
          'User-Agent': 'Lakshmi-Finance-App/1.0'
        },
        // Disable cache for refresh requests
        cache: refresh ? 'no-store' : 'default'
      })
      
      if (newsApiResponse.ok) {
        const newsApiData = await newsApiResponse.json()
        console.log('NewsAPI response status:', newsApiData.status, 'Total results:', newsApiData.totalResults)
        
        if (newsApiData.status === 'ok' && newsApiData.articles) {
          articles = newsApiData.articles
            .filter(article => 
              article.title !== '[Removed]' && 
              article.description && 
              article.title.trim() !== '' &&
              article.source?.name !== '[Removed]'
            )
            .map((article, index) => {
              const combinedText = (article.title + ' ' + (article.description || '')).toLowerCase()
              
              return {
                id: article.url || `newsapi-${index}-${Date.now()}`,
                title: article.title,
                summary: article.description || article.title,
                content: article.content || article.description,
                url: article.url,
                source: article.source?.name || 'NewsAPI',
                author: article.author,
                time: new Date(article.publishedAt).toLocaleString(),
                publishedAt: article.publishedAt,
                category: newsApiCategory,
                impact: determineSentimentFromText(article.title + ' ' + (article.description || '')),
                imageUrl: article.urlToImage,
                isRealTime: true,
                apiSource: 'NewsAPI',
                // Enhanced stock categorization
                affectedStocks: analyzeAffectedStocks(combinedText, newsApiCategory),
                stockSectors: analyzeSectors(combinedText, newsApiCategory),
                marketImpact: analyzeMarketImpact(combinedText, newsApiCategory)
              }
            })
          
          console.log(`Successfully fetched ${articles.length} articles from NewsAPI`)
        } else {
          errorMessage = `NewsAPI returned status: ${newsApiData.status}`
        }
      } else {
        const errorData = await newsApiResponse.json().catch(() => ({}))
        errorMessage = errorData.message || `NewsAPI HTTP ${newsApiResponse.status}: ${newsApiResponse.statusText}`
        console.error('NewsAPI error:', errorMessage)
      }
    } catch (apiError) {
      errorMessage = `NewsAPI request failed: ${apiError.message}`
      console.error('NewsAPI request failed:', apiError.message)
    }

    // Return error if no articles found (no mock data fallback)
    if (articles.length === 0) {
      return NextResponse.json({
        success: false,
        error: errorMessage || 'No news articles available at this time',
        data: [],
        timestamp: new Date().toISOString(),
        source: 'NewsAPI',
        hasLiveData: false,
        category: category,
        limit: parseInt(limit),
        refresh: refresh
      }, { status: 404 })
    }

    // Sort by publication time (newest first)
    articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

    return NextResponse.json({
      success: true,
      data: articles.slice(0, parseInt(limit)),
      timestamp: new Date().toISOString(),
      source: 'NewsAPI',
      totalArticles: articles.length,
      hasLiveData: true,
      category: category,
      limit: parseInt(limit),
      refresh: refresh,
      cacheTime: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching news:', error)
    
    return NextResponse.json({
      success: false,
      error: `Server error: ${error.message}`,
      data: [],
      timestamp: new Date().toISOString(),
      source: 'NewsAPI',
      hasLiveData: false
    }, { status: 500 })
  }
}

// Enhanced stock analysis function with Indian stocks and MNCs
function analyzeAffectedStocks(text, category) {
  const stocks = []
  
  // US Technology Giants
  const usTechStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', keywords: ['apple', 'iphone', 'ipad', 'mac', 'ios', 'tim cook', 'app store', 'airpods'], country: 'US' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', exchange: 'NASDAQ', keywords: ['microsoft', 'windows', 'azure', 'office', 'xbox', 'satya nadella', 'teams', 'linkedin'], country: 'US' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', keywords: ['google', 'alphabet', 'android', 'youtube', 'search', 'sundar pichai', 'chrome', 'pixel'], country: 'US' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', keywords: ['amazon', 'aws', 'prime', 'bezos', 'e-commerce', 'alexa', 'kindle'], country: 'US' },
    { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', keywords: ['tesla', 'elon musk', 'electric vehicle', 'ev', 'model', 'autopilot', 'supercharger'], country: 'US' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', exchange: 'NASDAQ', keywords: ['nvidia', 'gpu', 'ai chip', 'graphics', 'jensen huang', 'cuda', 'geforce'], country: 'US' },
    { symbol: 'META', name: 'Meta Platforms', exchange: 'NASDAQ', keywords: ['meta', 'facebook', 'instagram', 'whatsapp', 'mark zuckerberg', 'metaverse', 'oculus'], country: 'US' },
    { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ', keywords: ['netflix', 'streaming', 'subscription', 'content', 'series'], country: 'US' }
  ]
  
  // Indian Technology & IT Services
  const indianTechStocks = [
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services', exchange: 'NSE', keywords: ['tcs', 'tata consultancy', 'it services', 'rajesh gopinathan', 'digital transformation'], country: 'India' },
    { symbol: 'INFY.NS', name: 'Infosys Ltd.', exchange: 'NSE', keywords: ['infosys', 'salil parekh', 'it consulting', 'digital services', 'bangalore'], country: 'India' },
    { symbol: 'WIPRO.NS', name: 'Wipro Ltd.', exchange: 'NSE', keywords: ['wipro', 'thierry delaporte', 'it services', 'consulting'], country: 'India' },
    { symbol: 'HCLTECH.NS', name: 'HCL Technologies', exchange: 'NSE', keywords: ['hcl technologies', 'hcl tech', 'it services', 'engineering'], country: 'India' },
    { symbol: 'TECHM.NS', name: 'Tech Mahindra', exchange: 'NSE', keywords: ['tech mahindra', 'mahindra tech', 'telecom', 'it services'], country: 'India' }
  ]
  
  // Indian Banks & Financial Services
  const indianFinancialStocks = [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries', exchange: 'NSE', keywords: ['reliance', 'mukesh ambani', 'jio', 'petrochemicals', 'retail'], country: 'India' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', exchange: 'NSE', keywords: ['hdfc bank', 'banking', 'sashidhar jagdishan'], country: 'India' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', exchange: 'NSE', keywords: ['icici bank', 'sandeep bakhshi', 'private bank'], country: 'India' },
    { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', exchange: 'NSE', keywords: ['kotak', 'uday kotak', 'private banking'], country: 'India' },
    { symbol: 'AXISBANK.NS', name: 'Axis Bank', exchange: 'NSE', keywords: ['axis bank', 'amitabh chaudhry'], country: 'India' },
    { symbol: 'SBIN.NS', name: 'State Bank of India', exchange: 'NSE', keywords: ['sbi', 'state bank', 'public sector bank'], country: 'India' }
  ]
  
  // Global MNCs with significant operations
  const globalMNCStocks = [
    { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE', keywords: ['walmart', 'flipkart', 'retail', 'e-commerce', 'phonepe'], country: 'US/Global' },
    { symbol: 'KO', name: 'Coca-Cola Co.', exchange: 'NYSE', keywords: ['coca cola', 'coke', 'beverage', 'drinks'], country: 'US/Global' },
    { symbol: 'PEP', name: 'PepsiCo Inc.', exchange: 'NASDAQ', keywords: ['pepsi', 'pepsico', 'beverage', 'snacks', 'frito lay'], country: 'US/Global' },
    { symbol: 'MCD', name: 'McDonald\'s Corp.', exchange: 'NYSE', keywords: ['mcdonalds', 'fast food', 'restaurant'], country: 'US/Global' },
    { symbol: 'UL', name: 'Unilever PLC', exchange: 'NYSE', keywords: ['unilever', 'hindustan unilever', 'hul', 'consumer goods'], country: 'UK/Global' },
    { symbol: 'NKE', name: 'Nike Inc.', exchange: 'NYSE', keywords: ['nike', 'sportswear', 'athletic', 'footwear'], country: 'US/Global' }
  ]
  
  // Indian Pharma & Healthcare
  const indianPharmaStocks = [
    { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical', exchange: 'NSE', keywords: ['sun pharma', 'pharmaceutical', 'dilip shanghvi'], country: 'India' },
    { symbol: 'DRREDDY.NS', name: 'Dr. Reddy\'s Labs', exchange: 'NSE', keywords: ['dr reddy', 'pharmaceutical', 'generic drugs'], country: 'India' },
    { symbol: 'CIPLA.NS', name: 'Cipla Ltd.', exchange: 'NSE', keywords: ['cipla', 'pharmaceutical', 'respiratory'], country: 'India' },
    { symbol: 'BIOCON.NS', name: 'Biocon Ltd.', exchange: 'NSE', keywords: ['biocon', 'biotechnology', 'kiran mazumdar'], country: 'India' }
  ]
  
  // Indian Automotive
  const indianAutoStocks = [
    { symbol: 'MARUTI.NS', name: 'Maruti Suzuki', exchange: 'NSE', keywords: ['maruti suzuki', 'maruti', 'automobile', 'car manufacturer'], country: 'India' },
    { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', exchange: 'NSE', keywords: ['tata motors', 'jaguar land rover', 'commercial vehicles'], country: 'India' },
    { symbol: 'M&M.NS', name: 'Mahindra & Mahindra', exchange: 'NSE', keywords: ['mahindra', 'suv', 'tractor', 'automotive'], country: 'India' },
    { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto', exchange: 'NSE', keywords: ['bajaj auto', 'motorcycle', 'two wheeler'], country: 'India' }
  ]
  
  // European MNCs
  const europeanMNCStocks = [
    { symbol: 'ASML', name: 'ASML Holding', exchange: 'NASDAQ', keywords: ['asml', 'semiconductor', 'lithography', 'chip manufacturing'], country: 'Netherlands' },
    { symbol: 'SAP', name: 'SAP SE', exchange: 'NYSE', keywords: ['sap', 'enterprise software', 'erp', 'business software'], country: 'Germany' },
    { symbol: 'NESN.SW', name: 'Nestlé S.A.', exchange: 'SIX', keywords: ['nestle', 'food', 'beverage', 'nutrition', 'maggi'], country: 'Switzerland' }
  ]
  
  // Asian MNCs
  const asianMNCStocks = [
    { symbol: '005930.KS', name: 'Samsung Electronics', exchange: 'KRX', keywords: ['samsung', 'galaxy', 'semiconductor', 'memory', 'electronics'], country: 'South Korea' },
    { symbol: 'TSM', name: 'Taiwan Semiconductor', exchange: 'NYSE', keywords: ['tsmc', 'taiwan semiconductor', 'chip foundry', 'semiconductor'], country: 'Taiwan' },
    { symbol: '9988.HK', name: 'Alibaba Group', exchange: 'HKEX', keywords: ['alibaba', 'jack ma', 'e-commerce', 'cloud', 'taobao'], country: 'China' }
  ]
  
  let allStocks = []
  
  // Select relevant stock categories based on news category and content
  if (category === 'technology' || category === 'general') {
    allStocks = [...allStocks, ...usTechStocks, ...indianTechStocks, ...europeanMNCStocks]
  }
  if (category === 'business' || category === 'general') {
    allStocks = [...allStocks, ...indianFinancialStocks, ...globalMNCStocks]
  }
  if (category === 'health' || category === 'general') {
    allStocks = [...allStocks, ...indianPharmaStocks]
  }
  if (category === 'general') {
    allStocks = [...allStocks, ...indianAutoStocks, ...asianMNCStocks]
  }
  if (text.includes('crypto') || text.includes('bitcoin') || text.includes('ethereum')) {
    // Crypto-related stocks
    allStocks = [...allStocks, 
      { symbol: 'COIN', name: 'Coinbase', exchange: 'NASDAQ', keywords: ['coinbase', 'crypto exchange'], country: 'US' },
      { symbol: 'MSTR', name: 'MicroStrategy', exchange: 'NASDAQ', keywords: ['microstrategy', 'bitcoin'], country: 'US' }
    ]
  }
  
  // Enhanced relevance calculation for better quality filtering
  allStocks.forEach(stock => {
    const relevanceScore = calculateEnhancedRelevance(text, stock.keywords, stock.name)
    
    // Only include stocks with 50% or higher relevance (threshold for quality)
    if (relevanceScore >= 0.5) {
      stocks.push({
        symbol: stock.symbol,
        name: stock.name,
        exchange: stock.exchange,
        country: stock.country,
        relevance: relevanceScore,
        confidenceLevel: getConfidenceLevel(relevanceScore)
      })
    }
  })
  
  // Sort by relevance and return top matches
  return stocks.sort((a, b) => b.relevance - a.relevance).slice(0, 6)
}

// Analyze market sectors affected
function analyzeSectors(text, category) {
  const sectors = []
  
  const sectorKeywords = {
    'Technology': ['tech', 'software', 'ai', 'artificial intelligence', 'cloud', 'digital', 'app', 'platform'],
    'Healthcare': ['health', 'medical', 'pharma', 'drug', 'vaccine', 'hospital', 'treatment', 'biotech'],
    'Financial': ['bank', 'finance', 'credit', 'loan', 'investment', 'insurance', 'fed', 'interest rate'],
    'Energy': ['oil', 'gas', 'energy', 'renewable', 'solar', 'wind', 'electric', 'battery'],
    'Consumer': ['retail', 'consumer', 'shopping', 'brand', 'sales', 'market share'],
    'Automotive': ['car', 'auto', 'vehicle', 'electric vehicle', 'ev', 'autonomous'],
    'Real Estate': ['real estate', 'property', 'housing', 'construction', 'reit'],
    'Telecommunications': ['telecom', '5g', 'wireless', 'network', 'internet', 'broadband']
  }
  
  Object.entries(sectorKeywords).forEach(([sector, keywords]) => {
    const matches = keywords.filter(keyword => text.includes(keyword)).length
    if (matches > 0) {
      sectors.push({
        name: sector,
        relevance: matches,
        impact: matches > 2 ? 'high' : matches > 1 ? 'medium' : 'low'
      })
    }
  })
  
  return sectors.sort((a, b) => b.relevance - a.relevance).slice(0, 3)
}

// Analyze overall market impact
function analyzeMarketImpact(text, category) {
  const highImpactKeywords = ['fed', 'federal reserve', 'interest rate', 'recession', 'inflation', 'gdp', 'unemployment']
  const mediumImpactKeywords = ['earnings', 'quarterly', 'revenue', 'merger', 'acquisition', 'ipo']
  const lowImpactKeywords = ['product launch', 'partnership', 'hiring', 'expansion']
  
  const highMatches = highImpactKeywords.filter(keyword => text.includes(keyword)).length
  const mediumMatches = mediumImpactKeywords.filter(keyword => text.includes(keyword)).length
  const lowMatches = lowImpactKeywords.filter(keyword => text.includes(keyword)).length
  
  if (highMatches > 0) return 'high'
  if (mediumMatches > 0) return 'medium'
  if (lowMatches > 0) return 'low'
  return 'minimal'
}

// Enhanced relevance calculation with better quality filtering
function calculateEnhancedRelevance(text, keywords, stockName) {
  let score = 0
  const lowerText = text.toLowerCase()
  const lowerStockName = stockName.toLowerCase()
  
  // Direct stock name match gets highest score
  if (lowerText.includes(lowerStockName)) {
    score += 0.8
  }
  
  // Keyword matches with weighted scoring
  keywords.forEach(keyword => {
    const lowerKeyword = keyword.toLowerCase()
    if (lowerText.includes(lowerKeyword)) {
      // Longer, more specific keywords get higher scores
      const keywordScore = Math.min(keyword.length / 20, 0.3)
      score += keywordScore
      
      // Boost score if keyword appears multiple times
      const occurrences = (lowerText.match(new RegExp(lowerKeyword, 'g')) || []).length
      if (occurrences > 1) {
        score += 0.1 * (occurrences - 1)
      }
    }
  })
  
  // Normalize score to 0-1 range
  return Math.min(score, 1.0)
}

// Get confidence level based on relevance score
function getConfidenceLevel(relevance) {
  if (relevance >= 0.8) return 'high'
  if (relevance >= 0.65) return 'medium'
  return 'low'
}

// Calculate relevance score
function calculateRelevance(text, keywords) {
  let score = 0
  keywords.forEach(keyword => {
    if (text.includes(keyword)) {
      score += keyword.length // Longer, more specific keywords get higher scores
    }
  })
  return score
}

// Helper function for sentiment analysis
function determineSentimentFromText(text) {
  if (!text) return 'neutral'
  
  const lowerText = text.toLowerCase()
  
  // Positive indicators
  const positiveWords = [
    'surge', 'rally', 'gains', 'up', 'rise', 'growth', 'bullish', 'strong', 'positive', 
    'breakthrough', 'success', 'profits', 'beat', 'exceed', 'outperform', 'boost', 'soar',
    'advance', 'climb', 'jump', 'spike', 'increase', 'improve', 'win', 'achieve', 'record',
    'high', 'milestone', 'expansion', 'launch', 'partnership', 'acquisition', 'investment'
  ]
  
  // Negative indicators
  const negativeWords = [
    'fall', 'drop', 'down', 'decline', 'bearish', 'weak', 'negative', 'loss', 'concern', 
    'risk', 'crisis', 'crash', 'plunge', 'tumble', 'slide', 'slump', 'retreat', 'decrease',
    'fail', 'miss', 'disappoint', 'struggle', 'warning', 'caution', 'uncertainty', 'low',
    'cut', 'reduce', 'suspend', 'delay', 'cancel', 'bankruptcy', 'lawsuit', 'investigation'
  ]
  
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length
  
  if (positiveCount > negativeCount && positiveCount > 0) {
    return 'positive'
  }
  if (negativeCount > positiveCount && negativeCount > 0) {
    return 'negative'
  }
  
  return 'neutral'
}
