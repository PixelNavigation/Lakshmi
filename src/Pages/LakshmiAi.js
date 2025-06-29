'use client'

import { useState, useRef, useEffect } from 'react'
import { nanoid } from '@/lib/utils'
import styles from './LakshmiAi.module.css'

// Import TradingView components
import { StockChart } from '@/Components/TradingView/StockChart'
import { StockPrice } from '@/Components/TradingView/StockPrice'
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

function FormattedStockAnalysis({ content, symbol }) {
  return (
    <div className={styles.stockAnalysis}>
      <div className={styles.analysisHeader}>
        <h3>📈 Stock Analysis {symbol && `for ${symbol}`}</h3>
      </div>
      
      <div className={styles.prosConsContainer}>
        <div className={styles.prosSection}>
          <h4>
            <span className={styles.prosIcon}>✅</span> Potential Pros
          </h4>
          <ul className={styles.prosList}>
            <li>Strong market position and brand recognition</li>
            <li>Consistent revenue growth potential</li>
            <li>Diversified business model</li>
            <li>Innovation and technology leadership</li>
            <li>Strong financial performance history</li>
          </ul>
        </div>
        
        <div className={styles.consSection}>
          <h4>
            <span className={styles.consIcon}>⚠️</span> Potential Risks
          </h4>
          <ul className={styles.consList}>
            <li>Market volatility and economic uncertainty</li>
            <li>Competitive pressure in the industry</li>
            <li>Regulatory and compliance challenges</li>
            <li>Valuation concerns in current market</li>
            <li>Economic and geopolitical risks</li>
          </ul>
        </div>
      </div>
      
      <div className={styles.keyMetrics}>
        <h4>📊 Key Investment Considerations</h4>
        <div className={styles.metricsGrid}>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Risk Level:</span>
            <span className={styles.metricValue}>Moderate to High</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Time Horizon:</span>
            <span className={styles.metricValue}>Long-term recommended</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Diversification:</span>
            <span className={styles.metricValue}>Important for risk management</span>
          </div>
        </div>
      </div>
      
      <div className={styles.disclaimer}>
        <p>
          <strong>💡 Investment Recommendation:</strong> Consider your risk tolerance and investment timeline. 
          Always conduct thorough research and consider consulting with a financial advisor.
        </p>
        <p>
          <strong>📈 Analysis Based On:</strong> Current market conditions, company fundamentals, 
          and industry trends as of the latest available data.
        </p>
      </div>
      
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

function BotMessage({ content, children, isStreaming = false }) {
  // Check if this is a stock-related response that should show enhanced formatting
  const isStockAnalysis = content && (
    content.toLowerCase().includes('stock') ||
    content.toLowerCase().includes('investment') ||
    content.toLowerCase().includes('analysis') ||
    content.toLowerCase().includes('price') ||
    content.toLowerCase().includes('company') ||
    content.toLowerCase().includes('financial') ||
    /\b[A-Z]{2,5}\b/.test(content) // Contains potential stock symbols
  )
  
  // Extract potential stock symbol from content
  const stockSymbolMatch = content?.match(/\b[A-Z]{2,5}\b/g)
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
              <FormattedStockAnalysis content={content} symbol={symbol} />
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
      // Convert TradingView format to standard format
      // NSE-SBIN -> SBIN.NS, NASDAQ-AAPL -> AAPL
      let symbol = urlMatch[1]
      if (symbol.includes('-')) {
        const [exchange, ticker] = symbol.split('-')
        if (exchange === 'NSE') {
          tvSymbol = `${ticker}.NS`
        } else if (exchange === 'BSE') {
          tvSymbol = `${ticker}.BO`
        } else if (exchange === 'NASDAQ' || exchange === 'NYSE') {
          tvSymbol = ticker
        } else {
          tvSymbol = ticker // Default fallback
        }
      } else {
        tvSymbol = symbol
      }
    }
  }
  
  // Extract stock symbols - improved pattern to handle various formats
  // Matches: AAPL, NCC.NS, RELIANCE.BSE, etc.
  const stockSymbolMatch = (message + ' ' + content).match(/\b[A-Z][A-Z0-9]*(?:\.[A-Z]{2,4})?\b/g)
  
  // Common stocks list - expanded to include Indian exchanges
  const commonStocks = [
    'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'JPM', 'V', 'JNJ',
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'HDFC.NS', 'ICICIBANK.NS',
    'KOTAKBANK.NS', 'BHARTIARTL.NS', 'ITC.NS', 'SBIN.NS', 'LT.NS', 'ASIANPAINT.NS',
    'MARUTI.NS', 'BAJFINANCE.NS', 'HCLTECH.NS', 'WIPRO.NS', 'ULTRACEMCO.NS',
    'TITAN.NS', 'SUNPHARMA.NS', 'POWERGRID.NS', 'NTPC.NS', 'ONGC.NS', 'TATASTEEL.NS',
    'TECHM.NS', 'NESTLEIND.NS', 'COALINDIA.NS', 'HINDALCO.NS', 'GRASIM.NS',
    'BPCL.NS', 'DRREDDY.NS', 'EICHERMOT.NS', 'CIPLA.NS', 'HEROMOTOCO.NS',
    'BAJAJFINSV.NS', 'BRITANNIA.NS', 'SHREECEM.NS', 'DIVISLAB.NS', 'TATACONSUM.NS',
    'JSWSTEEL.NS', 'APOLLOHOSP.NS', 'INDUSINDBK.NS', 'ADANIENT.NS', 'TATAMOTORS.NS',
    'NCC.NS'
  ]

  let mentionedStock = tvSymbol
  
  if (!mentionedStock && stockSymbolMatch) {
    mentionedStock = stockSymbolMatch.find(symbol => {
      // Check if it's in common stocks or looks like a valid symbol
      return commonStocks.includes(symbol) || 
             /^[A-Z]{2,5}(\.[A-Z]{2,4})?$/.test(symbol)
    })
  }
  
  // If no symbol found in common list, take the first plausible one
  if (!mentionedStock && stockSymbolMatch) {
    mentionedStock = stockSymbolMatch.find(symbol => 
      /^[A-Z]{2,10}(\.[A-Z]{2,4})?$/.test(symbol)
    )
  }

  // Special handling for TradingView URLs - automatically show chart
  if (tvUrlMatches && mentionedStock) {
    return {
      type: 'chart',
      symbol: mentionedStock,
      content: content,
      hideText: false,
      source: 'tradingview'
    }
  }

  // Priority check: Look for specific widget requests in user message first
  // CHART - highest priority when explicitly requested
  if ((lowercaseMessage.includes('chart') || lowercaseMessage.includes('show chart')) && mentionedStock) {
    return {
      type: 'chart',
      symbol: mentionedStock,
      content: content,  // Show the full AI response
      hideText: false
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
      hideText: false
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
      content: content,  // Show the full AI response
      hideText: false
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
            symbol: parsedResponse.symbol
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
      message: "What is the price of AAPL?",
      icon: "📊"
    },
    {
      title: "Chart View", 
      message: "Show me a chart for SBIN.NS",
      icon: "📈"
    },
    {
      title: "Company Financials",
      message: "MSFT financials",
      icon: "📋"
    },
    {
      title: "Market Overview",
      message: "Show market overview",
      icon: "🌐"
    },
    {
      title: "Stock Screener",
      message: "Stock screener",
      icon: "🔍"
    },
    {
      title: "Market Heatmap",
      message: "Market heatmap",
      icon: "🗺️"
    }
  ]

  const renderWidget = (widget) => {
    switch (widget.type) {
      case 'chart':
        return <StockChart symbol={widget.symbol} />
      case 'price':
        return <StockPrice symbol={widget.symbol} />
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
                  Lakshmi AI StockBot
                </h1>
                <p className={styles.welcomeSubtitle}>
                  Your intelligent investment assistant powered by Groq AI
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
                  placeholder="Ask me about stocks, show charts, or get market data..."
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
                <h2 className={styles.chatTitle}>🤖 Lakshmi AI Chat</h2>
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
                        {/* Always show the AI text response */}
                        <BotMessage content={message.content} />
                        
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
                  placeholder="Ask me about stocks, show charts, or get market data..."
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
