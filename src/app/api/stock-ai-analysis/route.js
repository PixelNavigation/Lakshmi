// src/app/api/stock-ai-analysis/route.js
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { stocks, analysisType = 'comprehensive' } = await request.json()
    
    if (!stocks || stocks.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'At least two stocks are required for analysis'
      }, { status: 400 })
    }

    // Generate comprehensive AI analysis prompt
    const prompt = generateAnalysisPrompt(stocks, analysisType)
    
    // Call Gemini AI for analysis
    const geminiResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/gemini-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        conversationId: `stock_analysis_${Date.now()}`
      })
    })

    if (!geminiResponse.ok) {
      throw new Error('Failed to get AI analysis')
    }

    const geminiData = await geminiResponse.json()
    
    if (!geminiData.success) {
      throw new Error(geminiData.error || 'AI analysis failed')
    }

    return NextResponse.json({
      success: true,
      analysis: geminiData.response,
      stocks: stocks,
      analysisType: analysisType,
      timestamp: new Date().toISOString(),
      metadata: {
        stockCount: stocks.length,
        analysisMethod: 'AI-powered comprehensive analysis',
        aiModel: 'Gemini Pro'
      }
    })

  } catch (error) {
    console.error('Stock AI analysis error:', error)
    
    return NextResponse.json({
      success: false,
      error: `Analysis failed: ${error.message}`,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

function generateAnalysisPrompt(stocks, analysisType) {
  const stockSymbols = stocks.map(s => s.symbol || s).join(', ')
  const stockNames = stocks.map(s => s.name || s.symbol || s).join(', ')
  
  if (analysisType === 'ai_dependency') {
    return `🤖 **COMPREHENSIVE AI DEPENDENCY & RELATIONSHIP ANALYSIS**

**Stocks for Analysis:** ${stockSymbols}
**Companies:** ${stockNames}

Please provide a detailed analysis covering:

**1. AI TECHNOLOGY DEPENDENCY MATRIX**
For each stock, analyze:
- Core AI dependencies (high/medium/low)
- AI revenue streams and business models
- AI infrastructure requirements (cloud, chips, software)
- AI talent and R&D investments
- Competitive positioning in AI space

**2. INTERDEPENDENCE ANALYSIS**
- Are these companies independent or dependent on each other?
- Supply chain relationships and partnerships
- Competitive dynamics and market overlap
- Cross-investments and strategic alliances
- Complementary vs substitutable business models

**3. AI MARKET CORRELATION PATTERNS**
- How do AI trends affect each stock?
- Response to AI regulation and policy changes
- Impact of AI breakthroughs (ChatGPT, autonomous driving, etc.)
- Correlation with AI chip demand and cloud adoption
- Sensitivity to AI investment cycles

**4. BUSINESS ECOSYSTEM MAPPING**
- Direct competitors vs ecosystem partners
- Value chain positioning (suppliers, customers, competitors)
- Technology licensing and IP sharing
- Joint ventures and strategic partnerships
- Market expansion strategies in AI

**5. FUTURE AI-DRIVEN OUTLOOK**
- Expected evolution of AI dependencies
- Potential for increased/decreased correlation
- Emerging AI technologies impact
- Investment recommendations for AI-focused portfolios
- Risk factors and opportunity assessments

**6. QUANTITATIVE INSIGHTS**
- Historical correlation patterns
- AI investment levels comparison
- Market cap and valuation multiples
- Growth rates in AI-related segments

Provide actionable insights for investors building AI-focused portfolios with specific buy/hold/sell recommendations.`
  }
  
  // Default comprehensive analysis
  return `📊 **COMPREHENSIVE STOCK RELATIONSHIP ANALYSIS**

**Stocks:** ${stockSymbols}
**Companies:** ${stockNames}

Provide a comprehensive analysis including:

**1. BUSINESS RELATIONSHIP MATRIX**
- How are these companies related?
- Competitive dynamics and market positioning
- Supply chain dependencies
- Partnership opportunities and threats

**2. AI & TECHNOLOGY DEPENDENCY**
- Each company's AI strategy and investments
- Technology infrastructure dependencies
- Innovation cycles and R&D focus
- Digital transformation maturity

**3. MARKET CORRELATION ANALYSIS**
- Historical price correlation patterns
- Shared market drivers and economic factors
- Sector-specific trends affecting all stocks
- Geographic and regulatory exposure

**4. FINANCIAL INTERDEPENDENCE**
- Revenue dependencies between companies
- Customer-supplier relationships
- Cross-investments and shareholdings
- Financial performance correlation

**5. FUTURE OUTLOOK & RECOMMENDATIONS**
- Expected relationship evolution
- Investment strategy recommendations
- Portfolio diversification insights
- Risk assessment and mitigation

**6. AI-SPECIFIC CONSIDERATIONS**
- How AI trends will impact relationships
- Competitive advantages in AI adoption
- Potential for AI-driven disruption
- Investment thesis for AI exposure

Please provide specific, actionable insights for investment decisions.`
}

export async function GET(request) {
  return NextResponse.json({
    success: true,
    message: 'Stock AI Analysis API is ready',
    endpoints: {
      POST: 'Submit stocks for AI analysis',
      supportedAnalysisTypes: ['comprehensive', 'ai_dependency', 'correlation', 'competitive']
    },
    usage: {
      method: 'POST',
      body: {
        stocks: ['Array of stock symbols or objects'],
        analysisType: 'Type of analysis (optional, defaults to comprehensive)'
      }
    }
  })
}
