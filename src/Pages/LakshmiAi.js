'use client'

import { useState, useRef, useEffect } from 'react'
import { nanoid } from '@/lib/utils'
import styles from './LakshmiAi.module.css'

// Import TradingView components
import { StockChart } from '@/Components/TradingView/StockChart'
import { PriceWidget } from '@/Components/TradingView/PriceWidget'
import { StockFinancials } from '@/Components/TradingView/StockFinancials'
import { StockNews } from '@/Components/TradingView/StockNews'
import { StockScreener } from '@/Components/TradingView/StockScreener'
import { MarketOverview } from '@/Components/TradingView/MarketOverview'
import { MarketHeatmap } from '@/Components/TradingView/MarketHeatmap'
import { MarketTrending } from '@/Components/TradingView/MarketTrending'
import { TickerTape } from '@/Components/TradingView/TickerTape'

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
  
  // Extract TradingView URLs and parse symbols from them
  const tradingViewUrlPattern = /https?:\/\/(?:www\.)?tradingview\.com\/symbols\/([^\/\?]+)/gi
  const tvUrlMatches = (message + ' ' + content).match(tradingViewUrlPattern)
  let tvSymbol = null
  
  if (tvUrlMatches) {
    // Parse the first TradingView URL found
    const urlMatch = tvUrlMatches[0].match(/\/symbols\/([^\/\?]+)/)
    if (urlMatch) {
      let symbol = urlMatch[1]
      if (symbol.includes('-')) {
        const [exchange, ticker] = symbol.split('-')
        // For all exchanges including NSE and BSE, just use the ticker without suffix
        tvSymbol = ticker
      } else {
        // Remove any .NS or .BO suffixes if present
        tvSymbol = symbol.replace('.NS', '').replace('.BO', '')
      }
    }
  }
  
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

  let mentionedStock = tvSymbol
  
  if (!mentionedStock && stockSymbolMatch) {
    // First try to find a match in our known Indian stocks list
    mentionedStock = stockSymbolMatch.find(symbol => commonStocks.includes(symbol));
    
    // If not found in common list, try any symbol matching the pattern for Indian stocks
    if (!mentionedStock) {
      mentionedStock = stockSymbolMatch.find(symbol => 
        /^[A-Z]{2,10}$/.test(symbol) && !symbol.includes('.NS') && !symbol.includes('.BO')
      );
    }
  }

  // Special handling for TradingView URLs - automatically show chart
  if (tvUrlMatches && mentionedStock) {
    return {
      type: 'chart',
      symbol: mentionedStock,
      content: content,
      hideText: true,  // Hide text when showing chart
      source: 'tradingview'
    }
  }

  // Priority check: Look for specific widget requests in user message first
  // CHART - highest priority when explicitly requested
  if ((lowercaseMessage.includes('chart') || lowercaseMessage.includes('show chart') || 
       lowercaseMessage.includes('display chart') || lowercaseMessage.includes('view chart')) && mentionedStock) {
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
  // When price is requested, use the TradingView StockPrice component
  if (lowercaseMessage.includes('price') && 
      !lowercaseMessage.includes('chart') && 
      !lowercaseMessage.includes('financial') && 
      mentionedStock) {
    return {
      type: 'price', // Use the standard TradingView price widget
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
  
  if (lowercaseMessage.includes('market') && (lowercaseMessage.includes('overview') || lowercaseMessage.includes('performance'))) {
    return {
      type: 'market',
      content: content,  // Show the full AI response
      hideText: false
    }
  }
  
  if (lowercaseMessage.includes('heatmap') || (lowercaseMessage.includes('sector') && lowercaseMessage.includes('performance'))) {
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
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  // Suppress TradingView console errors and network errors
  useEffect(() => {
    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn
    
    console.error = (...args) => {
      const message = args.join(' ')
      // Suppress TradingView-related errors
      if (
        message.includes('Chart.DataProblemModel') ||
        message.includes('support-portal-problems') ||
        message.includes('tradingview') ||
        message.includes('Property:The state with a data type: unknown') ||
        message.includes('Fetch:/support/support-portal-problems') ||
        message.includes('tradingview-widget.com') ||
        message.includes('Cannot read properties of null')
      ) {
        return // Suppress these errors
      }
      originalConsoleError.apply(console, args)
    }

    console.warn = (...args) => {
      const message = args.join(' ')
      // Suppress TradingView-related warnings
      if (
        message.includes('tradingview') ||
        message.includes('support-portal-problems') ||
        message.includes('widget')
      ) {
        return // Suppress these warnings
      }
      originalConsoleWarn.apply(console, args)
    }

    // Also suppress window errors related to TradingView
    const originalWindowError = window.onerror
    window.onerror = (message, source, lineno, colno, error) => {
      if (typeof message === 'string' && (
        message.includes('tradingview') ||
        message.includes('support-portal-problems') ||
        message.includes('Chart.DataProblemModel')
      )) {
        return true // Suppress the error
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
      title: "Company Financials",
      message: "HDFCBANK financials",
      icon: "📋"
    },
    {
      title: "Market Overview",
      message: "Show Indian market overview",
      icon: "🌐"
    },
    {
      title: "Company Analysis",
      message: "Analyze TATAMOTORS company",
      icon: "🔍"
    },
    {
      title: "Market Heatmap",
      message: "NSE market heatmap",
      icon: "🗺"
    }
  ]

  const renderWidget = (widget) => {
    // Add console logging to debug widget rendering
    console.log('Rendering widget:', widget);
    
    // Use stock symbols as-is without appending exchange suffixes
    // TradingView components will handle the symbol formatting internally
    
    switch (widget.type) {
      case 'chart':
        console.log('Rendering chart with symbol:', widget.symbol);
        return <StockChart symbol={widget.symbol} />;
      case 'price':
        // Use TradingView's PriceWidget component for all price requests
        return <PriceWidget symbol={widget.symbol} width={200} height={80} />
      case 'financials':
        return <StockFinancials symbol={widget.symbol} />
      case 'news':
        return <StockNews symbol={widget.symbol} />
      case 'screener':
        return <StockScreener />
      case 'market':
        return <MarketOverview />
      case 'heatmap':
        return <MarketHeatmap />
      case 'trending':
        return <MarketTrending />
      default:
        return null
    }
  }

  return (
    <div className={styles.fullScreenContainer}>
      {/* Market Ticker at the top */}
      <div className={styles.tickerContainer}>
        <TickerTape />
      </div>

      {/* Main content area */}
      <div className={styles.mainContent}>
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className={styles.welcomeScreen}>
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
          /* Chat Screen */
          <div className={styles.chatScreen}>
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