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
                marketImpact: analyzeMarketImpact(combinedText, newsApiCategory),
                aiDependency: analyzeAIDependency(combinedText, newsApiCategory),
                stockRelationships: analyzeStockRelationships(combinedText, newsApiCategory)
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

// Enhanced stock analysis function focused on Indian stock market
function analyzeAffectedStocks(text, category) {
  const stocks = []
  
  // Indian Blue Chip Stocks (NIFTY 50 Major Components)
  const indianBlueChipStocks = [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd', exchange: 'NSE', keywords: ['reliance', 'mukesh ambani', 'jio', 'petrochemicals', 'retail', 'oil', 'gas', 'digital'], country: 'India', sector: 'Energy' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services', exchange: 'NSE', keywords: ['tcs', 'tata consultancy', 'it services', 'software', 'digital transformation', 'consulting'], country: 'India', sector: 'Technology' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', exchange: 'NSE', keywords: ['hdfc bank', 'banking', 'private bank', 'sashidhar jagdishan', 'credit', 'loans'], country: 'India', sector: 'Financial' },
    { symbol: 'INFY.NS', name: 'Infosys Ltd', exchange: 'NSE', keywords: ['infosys', 'salil parekh', 'it consulting', 'digital services', 'ai', 'automation'], country: 'India', sector: 'Technology' },
    { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Ltd', exchange: 'NSE', keywords: ['hindustan unilever', 'hul', 'fmcg', 'consumer goods', 'dove', 'lifebuoy'], country: 'India', sector: 'Consumer' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', exchange: 'NSE', keywords: ['icici bank', 'sandeep bakhshi', 'private bank', 'digital banking'], country: 'India', sector: 'Financial' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd', exchange: 'NSE', keywords: ['bharti airtel', 'airtel', 'telecom', '5g', 'mobile', 'sunil mittal'], country: 'India', sector: 'Telecommunications' },
    { symbol: 'ITC.NS', name: 'ITC Ltd', exchange: 'NSE', keywords: ['itc', 'cigarettes', 'fmcg', 'hotels', 'paperboards', 'agri business'], country: 'India', sector: 'Consumer' },
    { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', exchange: 'NSE', keywords: ['kotak', 'uday kotak', 'private banking', 'wealth management'], country: 'India', sector: 'Financial' },
    { symbol: 'LT.NS', name: 'Larsen & Toubro Ltd', exchange: 'NSE', keywords: ['larsen toubro', 'l&t', 'construction', 'infrastructure', 'engineering'], country: 'India', sector: 'Infrastructure' }
  ]
  
  // Indian Technology & IT Services
  const indianTechStocks = [
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services', exchange: 'NSE', keywords: ['tcs', 'tata consultancy', 'it services', 'rajesh gopinathan', 'digital transformation'], country: 'India', sector: 'Technology' },
    { symbol: 'INFY.NS', name: 'Infosys Ltd.', exchange: 'NSE', keywords: ['infosys', 'salil parekh', 'it consulting', 'digital services', 'bangalore'], country: 'India', sector: 'Technology' },
    { symbol: 'WIPRO.NS', name: 'Wipro Ltd.', exchange: 'NSE', keywords: ['wipro', 'thierry delaporte', 'it services', 'consulting'], country: 'India', sector: 'Technology' },
    { symbol: 'HCLTECH.NS', name: 'HCL Technologies', exchange: 'NSE', keywords: ['hcl technologies', 'hcl tech', 'it services', 'engineering'], country: 'India', sector: 'Technology' },
    { symbol: 'TECHM.NS', name: 'Tech Mahindra', exchange: 'NSE', keywords: ['tech mahindra', 'mahindra tech', 'telecom', 'it services'], country: 'India', sector: 'Technology' },
    { symbol: 'LTIM.NS', name: 'LTIMindtree', exchange: 'NSE', keywords: ['ltimindtree', 'mindtree', 'it consulting', 'digital solutions'], country: 'India', sector: 'Technology' },
    { symbol: 'MPHASIS.NS', name: 'Mphasis Ltd', exchange: 'NSE', keywords: ['mphasis', 'it services', 'digital transformation'], country: 'India', sector: 'Technology' }
  ]
  
  // Indian Banks & Financial Services
  const indianFinancialStocks = [
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', exchange: 'NSE', keywords: ['hdfc bank', 'banking', 'sashidhar jagdishan'], country: 'India', sector: 'Financial' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', exchange: 'NSE', keywords: ['icici bank', 'sandeep bakhshi', 'private bank'], country: 'India', sector: 'Financial' },
    { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', exchange: 'NSE', keywords: ['kotak', 'uday kotak', 'private banking'], country: 'India', sector: 'Financial' },
    { symbol: 'AXISBANK.NS', name: 'Axis Bank', exchange: 'NSE', keywords: ['axis bank', 'amitabh chaudhry'], country: 'India', sector: 'Financial' },
    { symbol: 'SBIN.NS', name: 'State Bank of India', exchange: 'NSE', keywords: ['sbi', 'state bank', 'public sector bank'], country: 'India', sector: 'Financial' },
    { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank', exchange: 'NSE', keywords: ['indusind bank', 'private bank'], country: 'India', sector: 'Financial' },
    { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', exchange: 'NSE', keywords: ['bajaj finance', 'nbfc', 'consumer finance'], country: 'India', sector: 'Financial' },
    { symbol: 'HDFCLIFE.NS', name: 'HDFC Life Insurance', exchange: 'NSE', keywords: ['hdfc life', 'insurance', 'life insurance'], country: 'India', sector: 'Financial' }
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
    { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical', exchange: 'NSE', keywords: ['sun pharma', 'pharmaceutical', 'dilip shanghvi'], country: 'India', sector: 'Healthcare' },
    { symbol: 'DRREDDY.NS', name: 'Dr. Reddy\'s Labs', exchange: 'NSE', keywords: ['dr reddy', 'pharmaceutical', 'generic drugs'], country: 'India', sector: 'Healthcare' },
    { symbol: 'CIPLA.NS', name: 'Cipla Ltd.', exchange: 'NSE', keywords: ['cipla', 'pharmaceutical', 'respiratory'], country: 'India', sector: 'Healthcare' },
    { symbol: 'BIOCON.NS', name: 'Biocon Ltd.', exchange: 'NSE', keywords: ['biocon', 'biotechnology', 'kiran mazumdar'], country: 'India', sector: 'Healthcare' },
    { symbol: 'APOLLOHOSP.NS', name: 'Apollo Hospitals', exchange: 'NSE', keywords: ['apollo hospitals', 'healthcare', 'prathap reddy'], country: 'India', sector: 'Healthcare' },
    { symbol: 'DIVISLAB.NS', name: 'Divi\'s Laboratories', exchange: 'NSE', keywords: ['divis lab', 'pharmaceutical', 'api'], country: 'India', sector: 'Healthcare' }
  ]
  
  // Indian Automotive
  const indianAutoStocks = [
    { symbol: 'MARUTI.NS', name: 'Maruti Suzuki', exchange: 'NSE', keywords: ['maruti suzuki', 'maruti', 'automobile', 'car manufacturer'], country: 'India', sector: 'Automotive' },
    { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', exchange: 'NSE', keywords: ['tata motors', 'jaguar land rover', 'commercial vehicles'], country: 'India', sector: 'Automotive' },
    { symbol: 'M&M.NS', name: 'Mahindra & Mahindra', exchange: 'NSE', keywords: ['mahindra', 'suv', 'tractor', 'automotive'], country: 'India', sector: 'Automotive' },
    { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto', exchange: 'NSE', keywords: ['bajaj auto', 'motorcycle', 'two wheeler'], country: 'India', sector: 'Automotive' },
    { symbol: 'EICHERMOT.NS', name: 'Eicher Motors', exchange: 'NSE', keywords: ['eicher motors', 'royal enfield', 'motorcycles'], country: 'India', sector: 'Automotive' },
    { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp', exchange: 'NSE', keywords: ['hero motocorp', 'motorcycles', 'two wheeler'], country: 'India', sector: 'Automotive' }
  ]
  
  // Indian FMCG & Consumer
  const indianConsumerStocks = [
    { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever', exchange: 'NSE', keywords: ['hindustan unilever', 'hul', 'fmcg', 'consumer goods'], country: 'India', sector: 'Consumer' },
    { symbol: 'ITC.NS', name: 'ITC Ltd', exchange: 'NSE', keywords: ['itc', 'cigarettes', 'fmcg', 'hotels'], country: 'India', sector: 'Consumer' },
    { symbol: 'NESTLEIND.NS', name: 'Nestle India', exchange: 'NSE', keywords: ['nestle india', 'fmcg', 'maggi', 'nescafe'], country: 'India', sector: 'Consumer' },
    { symbol: 'BRITANNIA.NS', name: 'Britannia Industries', exchange: 'NSE', keywords: ['britannia', 'biscuits', 'bakery'], country: 'India', sector: 'Consumer' },
    { symbol: 'GODREJCP.NS', name: 'Godrej Consumer Products', exchange: 'NSE', keywords: ['godrej', 'consumer products', 'personal care'], country: 'India', sector: 'Consumer' }
  ]
  
  // Indian Energy & Oil
  const indianEnergyStocks = [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries', exchange: 'NSE', keywords: ['reliance', 'mukesh ambani', 'petrochemicals', 'oil', 'gas'], country: 'India', sector: 'Energy' },
    { symbol: 'ONGC.NS', name: 'Oil & Natural Gas Corp', exchange: 'NSE', keywords: ['ongc', 'oil natural gas', 'exploration'], country: 'India', sector: 'Energy' },
    { symbol: 'IOC.NS', name: 'Indian Oil Corporation', exchange: 'NSE', keywords: ['indian oil', 'ioc', 'refinery'], country: 'India', sector: 'Energy' },
    { symbol: 'BPCL.NS', name: 'Bharat Petroleum', exchange: 'NSE', keywords: ['bharat petroleum', 'bpcl', 'refinery'], country: 'India', sector: 'Energy' },
    { symbol: 'HPCL.NS', name: 'Hindustan Petroleum', exchange: 'NSE', keywords: ['hindustan petroleum', 'hpcl', 'refinery'], country: 'India', sector: 'Energy' }
  ]
  
  // Indian Telecom & Digital
  const indianTelecomStocks = [
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', exchange: 'NSE', keywords: ['bharti airtel', 'airtel', 'telecom', '5g', 'mobile'], country: 'India', sector: 'Telecommunications' },
    { symbol: 'JIOQ.NS', name: 'Jio Platforms', exchange: 'NSE', keywords: ['jio', 'reliance jio', 'telecom', 'digital'], country: 'India', sector: 'Telecommunications' },
    { symbol: 'IDEA.NS', name: 'Vodafone Idea', exchange: 'NSE', keywords: ['vodafone idea', 'vi', 'telecom'], country: 'India', sector: 'Telecommunications' }
  ]
  
  // US Tech Giants (for global impact reference)
  const usTechGiants = [
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', keywords: ['apple', 'iphone', 'ipad', 'mac', 'ios'], country: 'US', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', exchange: 'NASDAQ', keywords: ['microsoft', 'windows', 'azure', 'office', 'satya nadella'], country: 'US', sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', keywords: ['google', 'alphabet', 'android', 'youtube', 'sundar pichai'], country: 'US', sector: 'Technology' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', exchange: 'NASDAQ', keywords: ['nvidia', 'gpu', 'ai chip', 'graphics', 'jensen huang'], country: 'US', sector: 'Technology' }
  ]
  
  let allStocks = []
  
  // Prioritize Indian stocks first
  if (category === 'technology' || category === 'general') {
    allStocks = [...allStocks, ...indianBlueChipStocks, ...indianTechStocks, ...indianTelecomStocks]
    // Add US tech only if specifically mentioned
    if (text.includes('apple') || text.includes('microsoft') || text.includes('google') || text.includes('nvidia')) {
      allStocks = [...allStocks, ...usTechGiants]
    }
  }
  if (category === 'business' || category === 'general') {
    allStocks = [...allStocks, ...indianFinancialStocks, ...indianConsumerStocks, ...indianEnergyStocks]
  }
  if (category === 'health' || category === 'general') {
    allStocks = [...allStocks, ...indianPharmaStocks]
  }
  if (category === 'general') {
    allStocks = [...allStocks, ...indianAutoStocks]
  }
  
  // Add global MNCs only if specifically relevant
  if (text.includes('walmart') || text.includes('coca cola') || text.includes('unilever')) {
    allStocks = [...allStocks, ...globalMNCStocks]
  }
  if (text.includes('crypto') || text.includes('bitcoin') || text.includes('ethereum')) {
    // Crypto-related stocks (Indian crypto exposure)
    allStocks = [...allStocks, 
      { symbol: 'ZOMATO.NS', name: 'Zomato Ltd', exchange: 'NSE', keywords: ['zomato', 'food delivery', 'crypto payment'], country: 'India', sector: 'Technology' },
      { symbol: 'PAYTM.NS', name: 'Paytm', exchange: 'NSE', keywords: ['paytm', 'digital payments', 'crypto'], country: 'India', sector: 'Financial' }
    ]
  }
  
  // Enhanced relevance calculation for better quality filtering
  allStocks.forEach(stock => {
    const relevanceScore = calculateEnhancedRelevanceWithAI(text, stock)
    
    // Only include stocks with 40% or higher relevance (lower threshold for Indian stocks)
    if (relevanceScore >= 0.4) {
      stocks.push({
        symbol: stock.symbol,
        name: stock.name,
        exchange: stock.exchange,
        country: stock.country,
        sector: stock.sector || 'Other',
        relevance: relevanceScore,
        confidenceLevel: getConfidenceLevel(relevanceScore),
        aiDependency: calculateAIDependencyForStock(text, stock)
      })
    }
  })
  
  // Sort by relevance and prioritize Indian stocks
  return stocks
    .sort((a, b) => {
      // Prioritize Indian stocks
      if (a.country === 'India' && b.country !== 'India') return -1
      if (a.country !== 'India' && b.country === 'India') return 1
      // Then by relevance
      return b.relevance - a.relevance
    })
    .slice(0, 8) // Increased to 8 for better coverage
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

// Analyze AI dependency for affected stocks
function analyzeAIDependency(text, category) {
  const aiKeywords = [
    'artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning',
    'neural network', 'automation', 'robotics', 'nlp', 'computer vision',
    'chatgpt', 'openai', 'google ai', 'microsoft ai', 'nvidia ai',
    'ai chip', 'gpu computing', 'cloud ai', 'edge ai', 'ai infrastructure'
  ]
  
  const aiMatches = aiKeywords.filter(keyword => text.toLowerCase().includes(keyword)).length
  
  if (aiMatches === 0) return { level: 'none', score: 0, keywords: [] }
  
  const matchedKeywords = aiKeywords.filter(keyword => text.toLowerCase().includes(keyword))
  
  let level = 'low'
  if (aiMatches >= 5) level = 'high'
  else if (aiMatches >= 3) level = 'medium'
  
  return {
    level: level,
    score: aiMatches,
    keywords: matchedKeywords,
    description: getAIDependencyDescription(level, matchedKeywords)
  }
}

function getAIDependencyDescription(level, keywords) {
  switch (level) {
    case 'high':
      return 'Strong AI dependency detected. This news likely impacts AI-focused companies significantly.'
    case 'medium':
      return 'Moderate AI relevance. Companies with AI initiatives may be affected.'
    case 'low':
      return 'Limited AI connection. Minor impact on AI-dependent stocks expected.'
    default:
      return 'No significant AI dependency identified.'
  }
}

// Analyze relationships between affected stocks
function analyzeStockRelationships(text, category) {
  const relationships = []
  
  // Competition indicators
  const competitionKeywords = ['vs', 'versus', 'compete', 'rival', 'battle', 'market share', 'outperform']
  const hasCompetition = competitionKeywords.some(keyword => text.toLowerCase().includes(keyword))
  
  // Partnership indicators
  const partnershipKeywords = ['partnership', 'collaboration', 'joint venture', 'alliance', 'merger', 'acquisition']
  const hasPartnership = partnershipKeywords.some(keyword => text.toLowerCase().includes(keyword))
  
  // Supply chain indicators
  const supplyChainKeywords = ['supplier', 'customer', 'supply chain', 'component', 'manufacturing', 'chips']
  const hasSupplyChain = supplyChainKeywords.some(keyword => text.toLowerCase().includes(keyword))
  
  if (hasCompetition) {
    relationships.push({
      type: 'competition',
      description: 'Competitive relationship detected - stocks may move inversely',
      impact: 'inverse'
    })
  }
  
  if (hasPartnership) {
    relationships.push({
      type: 'partnership',
      description: 'Partnership or alliance detected - stocks may move together',
      impact: 'positive'
    })
  }
  
  if (hasSupplyChain) {
    relationships.push({
      type: 'supply_chain',
      description: 'Supply chain relationship - dependent movement patterns possible',
      impact: 'dependent'
    })
  }
  
  // AI ecosystem relationships
  if (text.toLowerCase().includes('ai') || text.toLowerCase().includes('artificial intelligence')) {
    relationships.push({
      type: 'ai_ecosystem',
      description: 'AI ecosystem relationship - shared exposure to AI market trends',
      impact: 'correlated'
    })
  }
  
  return relationships
}

// Enhanced stock analysis function with AI focus
function calculateEnhancedRelevanceWithAI(text, stock) {
  let baseRelevance = calculateEnhancedRelevance(text, stock.keywords, stock.name)
  
  // AI boost for tech stocks
  if (stock.sector === 'Technology' || stock.country === 'India') {
    const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'gpu', 'chip', 'cloud computing', 'automation', 'digital transformation']
    const aiMatches = aiKeywords.filter(keyword => text.toLowerCase().includes(keyword)).length
    
    if (aiMatches > 0) {
      baseRelevance += 0.15 * aiMatches // Boost AI-related stocks
    }
  }
  
  // Additional boost for Indian stocks to prioritize local market
  if (stock.country === 'India') {
    baseRelevance += 0.1
  }
  
  return Math.min(baseRelevance, 1.0)
}

// Calculate AI dependency for individual stocks
function calculateAIDependencyForStock(text, stock) {
  const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'automation', 'digital transformation']
  const techSectors = ['Technology', 'Telecommunications']
  
  let aiScore = 0
  
  // Check for AI keywords in text
  aiKeywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword)) {
      aiScore += 1
    }
  })
  
  // Sector-based AI dependency
  if (techSectors.includes(stock.sector)) {
    aiScore += 2
  }
  
  // Company-specific AI indicators
  const aiCompanies = ['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM', 'BHARTIARTL']
  if (aiCompanies.some(company => stock.symbol.includes(company))) {
    aiScore += 1
  }
  
  if (aiScore === 0) return { level: 'none', score: 0 }
  if (aiScore <= 2) return { level: 'low', score: aiScore }
  if (aiScore <= 4) return { level: 'medium', score: aiScore }
  return { level: 'high', score: aiScore }
}

// Get stock AI dependency level
function getStockAIDependency(stockName, symbol) {
  const highAIStocks = [
    'NVIDIA', 'Microsoft', 'Google', 'Alphabet', 'Tesla', 'Meta', 'Amazon', 'Apple',
    'TCS', 'Infosys', 'Wipro', 'HCL Technologies', 'Tech Mahindra'
  ]
  
  const mediumAIStocks = [
    'TSMC', 'Samsung', 'Intel', 'AMD', 'Oracle', 'Salesforce', 'Adobe',
    'Reliance', 'HDFC Bank', 'ICICI Bank'
  ]
  
  const stockNameLower = stockName.toLowerCase()
  
  if (highAIStocks.some(name => stockNameLower.includes(name.toLowerCase()))) {
    return 'high'
  } else if (mediumAIStocks.some(name => stockNameLower.includes(name.toLowerCase()))) {
    return 'medium'
  } else {
    return 'low'
  }
}

// Get stock sector categorization
function getStockSector(stockName, symbol) {
  const stockNameLower = stockName.toLowerCase()
  
  if (stockNameLower.includes('bank') || stockNameLower.includes('financial')) return 'Financial Services'
  if (stockNameLower.includes('tech') || stockNameLower.includes('software') || stockNameLower.includes('microsoft') || stockNameLower.includes('google')) return 'Technology'
  if (stockNameLower.includes('pharma') || stockNameLower.includes('healthcare') || stockNameLower.includes('medical')) return 'Healthcare'
  if (stockNameLower.includes('energy') || stockNameLower.includes('oil') || stockNameLower.includes('gas')) return 'Energy'
  if (stockNameLower.includes('auto') || stockNameLower.includes('vehicle') || stockNameLower.includes('tesla') || stockNameLower.includes('maruti')) return 'Automotive'
  if (stockNameLower.includes('retail') || stockNameLower.includes('consumer') || stockNameLower.includes('fmcg')) return 'Consumer'
  
  return 'Other'
}
