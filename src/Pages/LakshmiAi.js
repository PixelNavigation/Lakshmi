'use client'

import { useState, useRef, useEffect } from 'react'
import { nanoid } from '@/lib/utils'
import styles from './LakshmiAi.module.css'

// Import Yahoo Finance components
import {
  YahooStockChart,
  YahooStockPrice,
  YahooStockNews,
  YahooStockFinancials,
  YahooMarketOverview,
  YahooStockScreener,
  YahooTickerTape
} from '@/Components/YahooFinance'

// Message components
function UserMessage({ children }) {
  return (
    <div className={styles.userMessage}>
      {children}
    </div>
  )
}

function FormattedStockAnalysis({ content, symbol, analysisType = 'default' }) {
  // Determine if this is a company analysis that should show pros and cons
  const isCompanyAnalysis = analysisType === 'company_analysis' || 
                           content?.toLowerCase().includes('analyz') || 
                           content?.toLowerCase().includes('analysis') ||
                           content?.toLowerCase().includes('assess');
                           
  const isFinancialOnly = analysisType === 'financial_only';
  
  return (
    <div className={styles.stockAnalysis}>
      <div className={styles.analysisHeader}>
        <h3>
          📈 Indian Stock {isFinancialOnly ? 'Financials' : 'Analysis'} 
          {symbol ? ` for ${symbol}` : ''}
        </h3>
      </div>
      
      {/* Show pros and cons only for company analysis */}
      {isCompanyAnalysis && (
        <div className={styles.prosConsContainer}>
          <div className={styles.prosSection}>
            <h4>
              <span className={styles.prosIcon}>✅</span> Potential Pros
            </h4>
            <ul className={styles.prosList}>
              <li>Position in Indian market and brand recognition</li>
              <li>Growth potential in emerging Indian economy</li>
              <li>Diversified business model suited for Indian markets</li>
              <li>Technology adaptation for Indian consumers</li>
              <li>Performance history in context of Indian economy</li>
            </ul>
          </div>
          
          <div className={styles.consSection}>
            <h4>
              <span className={styles.consIcon}>⚠</span> Potential Risks
            </h4>
            <ul className={styles.consList}>
              <li>Indian market volatility and regulatory changes</li>
              <li>Competitive pressure in the Indian industry</li>
              <li>Sectoral challenges specific to Indian economy</li>
              <li>Valuation concerns in current Indian market</li>
              <li>Economic and policy risks in Indian context</li>
            </ul>
          </div>
        </div>
      )}
      
      {!isFinancialOnly && (
        <div className={styles.keyMetrics}>
          <h4>📊 Key Investment Considerations</h4>
          <div className={styles.metricsGrid}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Risk Level:</span>
              <span className={styles.metricValue}>Moderate to High (Indian markets)</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Time Horizon:</span>
              <span className={styles.metricValue}>Long-term investment in Indian equities</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Market Segment:</span>
              <span className={styles.metricValue}>Indian Stock Market (NSE/BSE)</span>
            </div>
          </div>
        </div>
      )}
      
      {!isFinancialOnly && (
        <div className={styles.disclaimer}>
          <p>
            <strong>💡 Investment Recommendation:</strong> Consider your risk tolerance and investment timeline in the Indian market. 
            Always conduct thorough research and consider consulting with a SEBI registered financial advisor.
          </p>
          <p>
            <strong>📈 Analysis Based On:</strong> Current Indian market conditions, company fundamentals, 
            and industry trends in the Indian economy as of the latest available data.
          </p>
        </div>
      )}
      
      {content && (
        <div className={styles.originalResponse}>
          <details>
            <summary>View AI Response Details</summary>
            <div className={styles.responseContent}>
              {content}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

function BotMessage({ content, children, isStreaming = false, analysisType }) {
  // Check if this is a stock-related response that should show enhanced formatting
  const isStockAnalysis = content && (
    content.toLowerCase().includes('stock') ||
    content.toLowerCase().includes('investment') ||
    content.toLowerCase().includes('analysis') ||
    content.toLowerCase().includes('price') ||
    content.toLowerCase().includes('company') ||
    content.toLowerCase().includes('financial') ||
    content.toLowerCase().includes('nse') ||
    content.toLowerCase().includes('bse') ||
    content.toLowerCase().includes('sensex') ||
    content.toLowerCase().includes('nifty') ||
    /\b[A-Z][A-Z0-9]{2,}\b/.test(content) // Contains potential Indian stock symbols
  )
  
  // Extract potential Indian stock symbol from content
  const stockSymbolMatch = content?.match(/\b[A-Z][A-Z0-9]{2,}\b/g)
  const symbol = stockSymbolMatch?.[0]

  return (
    <div className={styles.botMessageContainer}>
      <div className={styles.botAvatar}>
        🤖
      </div>
      <div className={styles.botMessage}>
        {content && (
          <>
            {isStockAnalysis ? (
              <FormattedStockAnalysis 
                content={content} 
                symbol={symbol}
                analysisType={
                  // Use passed analysis type if available, otherwise determine based on content
                  analysisType || (
                    content.toLowerCase().includes('analyz') || content.toLowerCase().includes('analysis') 
                      ? 'company_analysis'
                      : content.toLowerCase().includes('financial') 
                        ? 'financial_only'
                        : 'default'
                  )
                }
              />
            ) : (
              <div className={styles.enhancedTextResponse}>
                <div className={styles.responseHeader}>
                  <span className={styles.responseIcon}>💬</span>
                  <span className={styles.responseTitle}>AI Response</span>
                </div>
                <div className={styles.responseBody}>
                  {content}
                  {isStreaming && <span className={styles.streamingCursor}>|</span>}
                </div>
              </div>
            )}
          </>
        )}
        {children}
      </div>
    </div>
  )
}

function BotCard({ children }) {
  return (
    <div className={styles.botCardContainer}>
      <div className={styles.botAvatar}>
        🤖
      </div>
      <div className={styles.botCardHeader}>
        <div className={styles.botCardLabel}>
          Here's what I found:
        </div>
      </div>
      <div className={styles.botCard}>
        {children}
      </div>
    </div>
  )
}

function parseAIResponse(message, content) {
  // Check user's original message and AI response for widget requests
  const lowercaseMessage = message.toLowerCase()
  const lowercaseContent = content.toLowerCase()
  
  // Extract stock symbols - focusing on Indian stock symbols
  // Matches: RELIANCE, SBIN, INFY, etc.
  const stockSymbolMatch = (message + ' ' + content).match(/\b[A-Z][A-Z0-9]{2,}\b/g)
  
  // Common stocks list - Indian stocks without exchange suffixes
  const commonStocks = [
    'KOTAKBANK', 'BHARTIARTL', 'ITC', 'SBIN', 'LT', 'ASIANPAINT',
    'MARUTI', 'BAJFINANCE', 'HCLTECH', 'WIPRO', 'ULTRACEMCO',
    'TITAN', 'SUNPHARMA', 'POWERGRID', 'NTPC', 'ONGC', 'TATASTEEL',
    'TECHM', 'NESTLEIND', 'COALINDIA', 'HINDALCO', 'GRASIM',
    'BPCL', 'DRREDDY', 'EICHERMOT', 'CIPLA', 'HEROMOTOCO',
    'BAJAJFINSV', 'BRITANNIA', 'SHREECEM', 'DIVISLAB', 'TATACONSUM',
    'JSWSTEEL', 'APOLLOHOSP', 'INDUSINDBK', 'ADANIENT', 'TATAMOTORS',
    'NCC', 'RELIANCE', 'INFY', 'TCS', 'HDFCBANK', 'HDFC', 'ICICIBANK',
    'AXISBANK', 'ZOMATO', 'NYKAA', 'PAYTM', 'POLICYBZR', 'DMART'
  ]

  let mentionedStock = null
  
  if (stockSymbolMatch) {
    // First try to find a match in our known Indian stocks list
    mentionedStock = stockSymbolMatch.find(symbol => commonStocks.includes(symbol));
    
    // If not found in common list, try any symbol matching the pattern for Indian stocks
    if (!mentionedStock) {
      mentionedStock = stockSymbolMatch.find(symbol => 
        /^[A-Z]{2,10}$/.test(symbol) && !symbol.includes('.NS') && !symbol.includes('.BO')
      );
    }
  }

  // Check for advanced analysis prompts
  // 1. Fundamental Analysis
  if ((lowercaseMessage.includes('fundamental analysis') || 
       (lowercaseMessage.includes('perform') && lowercaseMessage.includes('fundamental analysis'))) && 
       mentionedStock) {
    return {
      type: 'financials',
      symbol: mentionedStock,
      content: content,
      hideText: false,
      mode: 'fundamental_analysis'
    }
  }

  // Warren Buffett-style analysis
  if ((lowercaseMessage.includes('warren buffett') || lowercaseMessage.includes('buffett')) && 
       mentionedStock) {
    return {
      type: 'financials',
      symbol: mentionedStock,
      content: content,
      hideText: false,
      mode: 'buffett_analysis'
    }
  }

  // 2. Technical Analysis
  if ((lowercaseMessage.includes('technical analysis') || 
       lowercaseMessage.includes('chart pattern') ||
       (lowercaseMessage.includes('perform') && lowercaseMessage.includes('technical analysis'))) && 
       mentionedStock) {
    return {
      type: 'chart',
      symbol: mentionedStock,
      content: content,
      hideText: false,
      mode: 'technical_analysis'
    }
  }

  // 3. Sentiment Analysis
  if ((lowercaseMessage.includes('sentiment') || 
       lowercaseMessage.includes('conduct sentiment analysis') ||
       lowercaseMessage.includes('sentiment classification')) && 
       mentionedStock) {
    return {
      type: 'news',
      symbol: mentionedStock,
      content: content,
      hideText: false,
      mode: 'sentiment_analysis'
    }
  }

  // 4. Stock News & Summaries
  if ((lowercaseMessage.includes('latest news') || 
       lowercaseMessage.includes('stock market news') ||
       lowercaseMessage.includes('executive summary') ||
       lowercaseMessage.includes('bullet points')) && 
       (lowercaseMessage.includes('market') || mentionedStock)) {
    return {
      type: 'news',
      symbol: mentionedStock || 'NIFTY50', // Default to market news if no stock specified
      content: content,
      hideText: false,
      mode: 'news_summary'
    }
  }

  // 5. Stock Screener for undervalued stocks
  if ((lowercaseMessage.includes('undervalued stocks') || 
       lowercaseMessage.includes('find top') || 
       lowercaseMessage.includes('stock screener'))) {
    return {
      type: 'screener',
      content: content,
      hideText: false,
      mode: 'value_screener'
    }
  }

  // Standard widget requests (original implementation)
  
  // CHART - highest priority when explicitly requested
  if ((lowercaseMessage.includes('chart') || 
       lowercaseMessage.includes('show chart') || 
       lowercaseMessage.includes('display chart') || 
       lowercaseMessage.includes('view chart')) && 
       mentionedStock) {
    console.log('Chart requested for stock:', mentionedStock);
    return {
      type: 'chart',
      symbol: mentionedStock,
      content: content,
      hideText: true  // Hide text when showing chart as requested
    }
  }
  
  // NEWS - high priority for news requests
  if (lowercaseMessage.includes('news') && mentionedStock) {
    return {
      type: 'news',
      symbol: mentionedStock,
      content: content,  // Show the full AI response
      hideText: false
    }
  }
  
  // FINANCIALS - check before price to avoid conflicts, but not if chart was requested
  if ((lowercaseMessage.includes('financial') || lowercaseMessage.includes('financials')) && 
      !lowercaseMessage.includes('chart') && mentionedStock) {
    return {
      type: 'financials',
      symbol: mentionedStock,
      content: content,  // Show the full AI response
      hideText: true,    // Hide text response, show only financial data
      mode: 'financial_only'
    }
  }
  
  // PRICE - but not if chart or financials are also mentioned
  if (lowercaseMessage.includes('price') && 
      !lowercaseMessage.includes('chart') && 
      !lowercaseMessage.includes('financial') && 
      mentionedStock) {
    return {
      type: 'price',
      symbol: mentionedStock,
      content: content,
      hideText: true // Hide text to show only price
    }
  }
  
  // Market-wide widgets (no stock symbol needed)
  if (lowercaseMessage.includes('screener') || lowercaseMessage.includes('screen')) {
    return {
      type: 'screener',
      content: content,  // Show the full AI response
      hideText: false
    }
  }
  
  if (lowercaseMessage.includes('market') && 
     (lowercaseMessage.includes('overview') || lowercaseMessage.includes('performance'))) {
    return {
      type: 'market',
      content: content,  // Show the full AI response
      hideText: false
    }
  }
  
  if (lowercaseMessage.includes('heatmap') || 
     (lowercaseMessage.includes('sector') && lowercaseMessage.includes('performance'))) {
    return {
      type: 'heatmap',
      content: content,  // Show the full AI response
      hideText: false
    }
  }
  
  if (lowercaseMessage.includes('trending') || lowercaseMessage.includes('movers')) {
    return {
      type: 'trending',
      content: content,  // Show the full AI response
      hideText: false
    }
  }
  
  // If there's a stock mentioned but no specific widget requested, default to price widget
  if (mentionedStock) {
    return {
      type: 'price',
      symbol: mentionedStock,
      content: content,
      hideText: false
    }
  }
  
  // Default: just show text response (no widget)
  return {
    type: 'text',
    content: content,  // Show the full AI response
    hideText: false
  }
}

export default function LakshmiAi() {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const [tickerLoaded, setTickerLoaded] = useState(false);
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  // More targeted error handling - only suppress very specific errors
  useEffect(() => {
    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn
    
    // Keep the original console methods during development
    // Only filter specific TradingView errors that are known to be harmless
    console.error = (...args) => {
      const message = args.join(' ')
      // Only suppress very specific TradingView-related errors
      if (
        (message.includes('Chart.DataProblemModel') && message.includes('tradingview')) ||
        (message.includes('support-portal-problems') && message.includes('tradingview'))
      ) {
        // Log a simplified message instead of suppressing entirely
        console.log('Suppressed TradingView error:', message.substring(0, 100) + '...');
        return;
      }
      originalConsoleError.apply(console, args)
    }

    // Keep most warnings visible
    console.warn = originalConsoleWarn;

    // Only suppress very specific window errors
    const originalWindowError = window.onerror
    window.onerror = (message, source, lineno, colno, error) => {
      // Only handle specific cases from TradingView
      if (typeof source === 'string' && 
          source.includes('tradingview') && 
          typeof message === 'string' && 
          message.includes('Chart.DataProblemModel')) {
        console.log('Suppressed window error from TradingView');
        return true;
      }
      if (originalWindowError) {
        return originalWindowError(message, source, lineno, colno, error)
      }
      return false
    }

    return () => {
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
      window.onerror = originalWindowError
    }
  }, [])

  // Set ticker loaded state and add logging
  useEffect(() => {
    // Automatically set ticker loaded to true after a delay
    const timer = setTimeout(() => {
      setTickerLoaded(true);
      console.log('Ticker loaded state set to true');
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Add logging to verify ticker component rendering
  useEffect(() => {
    console.log("Ticker tape component rendered, tickerLoaded:", tickerLoaded);
    
    // This ensures the main content is always visible regardless of ticker state
    const mainContent = document.querySelector(`.${styles.mainContent}`);
    if (mainContent) {
      mainContent.style.display = 'flex';
      mainContent.style.visibility = 'visible';
      mainContent.style.opacity = '1';
    }
  }, [tickerLoaded]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToTop = () => {
    messagesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      // Show scroll to top button when user has scrolled down even a little
      setShowScrollToTop(scrollTop > 100)
    }
  }

  const clearChat = () => {
    setMessages([])
    setInputValue('')
    // Scroll to top when clearing chat
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = 0
      }
    }, 100)
  }

  useEffect(() => {
    // Only scroll to bottom when a new message is added, not on initial render
    if (messages.length > 0) {
      // If it's the first message after welcome screen, start at top
      if (messages.length === 1) {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = 0
        }
        // Don't auto-scroll to bottom for first message - let user see it from the top
        return
      } else {
        // For subsequent messages, scroll to bottom
        scrollToBottom()
      }
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (inputValue.trim() && !isLoading) {
      setIsLoading(true)
      
      // Add user message
      const userMessage = {
        id: nanoid(),
        type: 'user',
        content: inputValue
      }
      
      setMessages(prev => [...prev, userMessage])
      
      const messageContent = inputValue
      setInputValue('')
      
      try {
        // Call the API
        const response = await fetch('/api/groq-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: messageContent }),
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }
        
        // Parse the response to determine if we should show widgets
        const parsedResponse = parseAIResponse(messageContent, data.response)
        
        const botMessage = {
          id: nanoid(),
          type: 'bot',
          content: parsedResponse.content,
          widget: parsedResponse.type !== 'text' ? {
            type: parsedResponse.type,
            symbol: parsedResponse.symbol,
            hideText: parsedResponse.hideText,
            mode: parsedResponse.mode
          } : null
        }
        
        setMessages(prev => [...prev, botMessage])
        
      } catch (error) {
        console.error('Error:', error)
        const errorMessage = {
          id: nanoid(),
          type: 'bot',
          content: `Sorry, I encountered an error: ${error.message}. Please make sure you have set your GROQ_API_KEY in the .env.local file.`,
          isError: true
        }
        setMessages(prev => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleExampleClick = (message) => {
    setInputValue(message)
    setTimeout(() => handleSendMessage(), 100)
  }

  const exampleQuestions = [
    {
      title: "Stock Analysis",
      message: "What is the price of RELIANCE?",
      icon: "📊"
    },
    {
      title: "Chart View", 
      message: "Show me a chart for SBIN",
      icon: "📈"
    },
    {
      title: "Fundamental Analysis",
      message: "Perform a detailed fundamental analysis of TATAMOTORS listed on NSE using the latest financial data",
      icon: "📋"
    },
    {
      title: "Technical Analysis",
      message: "Perform a Technical Analysis for RELIANCE and identify the chart pattern it has formed",
      icon: "📉"
    },
    {
      title: "Buffett Analysis",
      message: "If you were Warren Buffett, would you invest in HDFCBANK? Justify your decision.",
      icon: "💰"
    },
    {
      title: "Sentiment Analysis",
      message: "Conduct a Sentiment Analysis for SBIN based on the latest news",
      icon: "🧠"
    },
    {
      title: "Stock News",
      message: "Provide the latest news about ITC in bullet points",
      icon: "📰"
    },
    {
      title: "Undervalued Stocks",
      message: "Find the top undervalued stocks in the Indian stock market right now using fundamental analysis metrics",
      icon: "�"
    }
  ]

  const renderWidget = (widget) => {
    // Add console logging to debug widget rendering
    console.log('Rendering widget:', widget);
    
    // Use Yahoo Finance API-based components instead of TradingView
    switch (widget.type) {
      case 'chart':
        console.log('Rendering Yahoo chart with symbol:', widget.symbol);
        return <YahooStockChart symbol={widget.symbol} />;
      case 'price':
        return <YahooStockPrice symbol={widget.symbol} showDetails={true} />
      case 'financials':
        return <YahooStockFinancials symbol={widget.symbol} />
      case 'news':
        return <YahooStockNews symbol={widget.symbol} />
      case 'screener':
        return <YahooStockScreener />
      case 'market':
        return <YahooMarketOverview />
      case 'heatmap':
      case 'trending':
        // For heatmap and trending, we'll use the market overview as a fallback
        // until we implement specific components for these
        return <YahooMarketOverview />
      default:
        return null
    }
  }

  // Add logging to help debug rendering issues
  useEffect(() => {
    console.log('Render state:', { 
      tickerLoaded, 
      messagesCount: messages.length 
    });
  }, [tickerLoaded, messages.length]);

  return (
    <div className={styles.fullScreenContainer} style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      minHeight: '100vh',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Market Ticker at the top - Conditionally render with error fallback */}
      <div className={styles.tickerContainer} style={{ 
        height: '60px', 
        flexShrink: 0, 
        overflow: 'hidden', 
        position: 'relative', 
        zIndex: 10 
      }}>
        {/* Use an error boundary pattern with try-catch in render */}
        {(() => {
          try {
            return <YahooTickerTape />;
          } catch (error) {
            console.error('Failed to render ticker:', error);
            return (
              <div style={{ padding: '10px', textAlign: 'center', color: '#FFD700' }}>
                Market data ticker unavailable
              </div>
            );
          }
        })()}
      </div>

      {/* Main content area with absolute layout fallback */}
      <div className={styles.mainContent} style={{ 
        display: 'flex', 
        flex: '1 1 auto',
        minHeight: 'calc(100vh - 60px)',
        visibility: 'visible',
        opacity: 1,
        zIndex: 5
      }}>
        {messages.length === 0 ? (
          /* Welcome Screen - Ensuring it stays visible */
          <div className={styles.welcomeScreen} style={{ display: 'flex', visibility: 'visible' }}>
            <div className={styles.welcomeContent}>
              <div className={styles.welcomeHeader}>
                <h1 className={styles.welcomeTitle}>
                  <span className={styles.robotIcon}>🤖</span>
                  Lakshmi AI 
                </h1>
                <p className={styles.welcomeSubtitle}>
                  Your intelligent Indian stock market assistant powered by Groq AI
                </p>
                <p className={styles.welcomeNote}>
                  Simply use stock symbols without any suffix (like RELIANCE, SBIN, not RELIANCE.NS)
                </p>
              </div>

              {/* Example prompts grid */}
              <div className={styles.examplePromptsGrid}>
                {exampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(question.message)}
                    className={styles.examplePrompt}
                    disabled={isLoading}
                  >
                    <div className={styles.promptIcon}>{question.icon}</div>
                    <div className={styles.promptContent}>
                      <div className={styles.promptTitle}>{question.title}</div>
                      <div className={styles.promptMessage}>{question.message}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat input at bottom */}
            <div className={styles.chatInputContainer}>
              <div className={styles.chatInputWrapper}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about Indian stocks like RELIANCE, SBIN, or TATAMOTORS (no .NS/.BO suffix needed)..."
                  className={styles.chatInput}
                  disabled={isLoading}
                />
                <button 
                  onClick={handleSendMessage}
                  className={styles.sendButton}
                  disabled={isLoading || !inputValue.trim()}
                >
                  {isLoading ? (
                    <div className={styles.spinner}></div>
                  ) : (
                    <svg className={styles.sendIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="m22 2-7 20-4-9-9-4Z"/>
                      <path d="M22 2 11 13"/>
                    </svg>
                  )}
                </button>
              </div>
              <div className={styles.disclaimer}>
                Lakshmi AI may provide inaccurate information and does not provide investment advice.
              </div>
            </div>
          </div>
        ) : (
          /* Chat Screen - Ensuring it stays visible */
          <div className={styles.chatScreen} style={{ display: 'flex', visibility: 'visible' }}>
            {/* Chat Header with Clear Button */}
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderContent}>
                <h2 className={styles.chatTitle}>🤖 Lakshmi AI Indian Stock Chat</h2>
                <div className={styles.chatHeaderButtons}>
                  {messages.length > 0 && showScrollToTop && (
                    <button 
                      onClick={scrollToTop}
                      className={styles.goToStartButton}
                      title="Go to Start of Conversation"
                    >
                      <svg className={styles.goToStartIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M18 15l-6-6-6 6"/>
                      </svg>
                      Start
                    </button>
                  )}
                  <button 
                    onClick={clearChat}
                    className={styles.clearButton}
                    title="Clear Chat"
                  >
                    <svg className={styles.clearIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Messages area */}
            <div className={styles.messagesArea}>
              {/* Scroll to Top Button */}
              {showScrollToTop && (
                <button 
                  onClick={scrollToTop}
                  className={styles.scrollToTop}
                  title="Scroll to Top"
                >
                  <svg className={styles.scrollToTopIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 15l-6-6-6 6"/>
                  </svg>
                </button>
              )}
              
              <div 
                className={styles.messagesContainer}
                ref={messagesContainerRef}
                onScroll={handleScroll}
              >
                {/* Conversation start indicator */}
                {messages.length > 0 && (
                  <div className={styles.conversationStart}>
                    <div className={styles.conversationStartIcon}>🏁</div>
                    <div className={styles.conversationStartText}>
                      Start of conversation
                    </div>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div key={message.id}>
                    {message.type === 'user' ? (
                      <UserMessage>{message.content}</UserMessage>
                    ) : (
                      <>
                        {/* Show AI text response if not a chart, price, or financial-only request */}
                        {(!message.widget || 
                          (message.widget && 
                           !(message.widget.type === 'chart' && message.widget.hideText === true) &&
                           !(message.widget.type === 'financials' && message.widget.hideText === true) &&
                           !(message.widget.type === 'price' && message.widget.hideText === true)
                          )
                         ) && (
                          <BotMessage 
                            content={message.content} 
                            analysisType={message.widget?.mode}
                          />
                        )}
                        
                        {/* Show widget if available */}
                        {message.widget && (
                          <BotCard>
                            {renderWidget(message.widget)}
                          </BotCard>
                        )}
                      </>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <BotMessage>
                    <div className={styles.loadingDots}>
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                  </BotMessage>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Chat input at bottom */}
            <div className={styles.chatInputContainer}>
              <div className={styles.chatInputWrapper}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about Indian stocks like RELIANCE, SBIN, or TATAMOTORS (no .NS/.BO suffix needed)..."
                  className={styles.chatInput}
                  disabled={isLoading}
                />
                <button 
                  onClick={handleSendMessage}
                  className={styles.sendButton}
                  disabled={isLoading || !inputValue.trim()}
                >
                  {isLoading ? (
                    <div className={styles.spinner}></div>
                  ) : (
                    <svg className={styles.sendIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="m22 2-7 20-4-9-9-4Z"/>
                      <path d="M22 2 11 13"/>
                    </svg>
                  )}
                </button>
              </div>
              <div className={styles.disclaimer}>
                Lakshmi AI may provide inaccurate information and does not provide investment advice.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
