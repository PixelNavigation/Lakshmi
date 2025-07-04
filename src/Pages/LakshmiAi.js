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
  YahooTickerTape,
  MoneyControlHeatmap
} from '@/Components/YahooFinance'

function UserMessage({ children }) {
  return (
    <div className={styles.userMessage}>
      <div className={styles.userAvatar}>👤</div>
      <div className={styles.userContent}>
        {children}
      </div>
    </div>
  )
}

function BotMessage({ content, isStreaming = false }) {
  return (
    <div className={styles.botMessageContainer}>
      <div className={styles.botAvatar}>🤖</div>
      <div className={styles.botMessage}>
        <div className={styles.responseContent}>
          {content}
          {isStreaming && <span className={styles.streamingCursor}>|</span>}
        </div>
      </div>
    </div>
  )
}

function BotCard({ children, title }) {
  return (
    <div className={styles.botCardContainer}>
      <div className={styles.botAvatar}>🤖</div>
      <div className={styles.botCard}>
        {title && <div className={styles.cardTitle}>{title}</div>}
        {children}
      </div>
    </div>
  )
}

function parseUserMessage(message) {
  const lowercaseMessage = message.toLowerCase()
  
  // Enhanced company name to stock symbol mapping
  const companyMappings = {
    'tcs': 'TCS', 'tata consultancy': 'TCS', 'infosys': 'INFY', 'wipro': 'WIPRO',
    'hcl tech': 'HCLTECH', 'tech mahindra': 'TECHM', 'sbi': 'SBIN', 'state bank': 'SBIN',
    'hdfc bank': 'HDFCBANK', 'icici bank': 'ICICIBANK', 'axis bank': 'AXISBANK',
    'kotak bank': 'KOTAKBANK', 'reliance': 'RELIANCE', 'ril': 'RELIANCE',
    'tata motors': 'TATAMOTORS', 'maruti': 'MARUTI', 'bajaj finance': 'BAJFINANCE',
    'asian paints': 'ASIANPAINT', 'sun pharma': 'SUNPHARMA', 'titan': 'TITAN',
    'bharti airtel': 'BHARTIARTL', 'airtel': 'BHARTIARTL', 'itc': 'ITC',
    'larsen toubro': 'LT', 'l&t': 'LT', 'ongc': 'ONGC', 'ntpc': 'NTPC',
    'coal india': 'COALINDIA', 'power grid': 'POWERGRID', 'tata steel': 'TATASTEEL',
    'jsw steel': 'JSWSTEEL', 'ultratech': 'ULTRACEMCO', 'shree cement': 'SHREECEM',
    'nestle': 'NESTLEIND', 'hindustan unilever': 'HINDUNILVR', 'hul': 'HINDUNILVR',
    'britannia': 'BRITANNIA', 'dr reddy': 'DRREDDY', 'cipla': 'CIPLA',
    'apollo hospital': 'APOLLOHOSP', 'apollo': 'APOLLOHOSP', 'hindalco': 'HINDALCO',
    'grasim': 'GRASIM', 'bajaj auto': 'BAJAJ-AUTO', 'hero motocorp': 'HEROMOTOCO',
    'eicher motors': 'EICHERMOT', 'mahindra': 'M&M', 'bpcl': 'BPCL', 'ioc': 'IOC',
    'zomato': 'ZOMATO', 'nykaa': 'NYKAA', 'paytm': 'PAYTM', 'dmart': 'DMART',
    'adani enterprises': 'ADANIENT', 'adani ports': 'ADANIPORTS'
  }
  
  // Extract stock symbols from direct patterns and company names
  const stockSymbolMatch = message.match(/\b[A-Z][A-Z0-9]{2,}\b/g)
  let mentionedStock = null
  
  // First check for company name mappings
  for (const [companyName, symbol] of Object.entries(companyMappings)) {
    if (lowercaseMessage.includes(companyName)) {
      mentionedStock = symbol
      break
    }
  }
  
  // If no company name found, check for direct stock symbols
  if (!mentionedStock && stockSymbolMatch) {
    const commonStocks = [
      'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'BHARTIARTL',
      'ITC', 'LT', 'KOTAKBANK', 'ASIANPAINT', 'MARUTI', 'BAJFINANCE', 'HCLTECH',
      'WIPRO', 'ULTRACEMCO', 'TITAN', 'SUNPHARMA', 'POWERGRID', 'NTPC', 'ONGC',
      'TATASTEEL', 'TECHM', 'NESTLEIND', 'COALINDIA', 'HINDALCO', 'GRASIM',
      'BPCL', 'DRREDDY', 'EICHERMOT', 'CIPLA', 'HEROMOTOCO', 'BAJAJFINSV',
      'BRITANNIA', 'SHREECEM', 'DIVISLAB', 'TATACONSUM', 'JSWSTEEL', 'APOLLOHOSP',
      'INDUSINDBK', 'ADANIENT', 'TATAMOTORS', 'AXISBANK', 'HDFC', 'ZOMATO', 'NYKAA',
      'PAYTM', 'DMART', 'HINDUNILVR', 'ADANIPORTS', 'VEDL', 'GODREJCP'
    ]
    
    mentionedStock = stockSymbolMatch.find(symbol => commonStocks.includes(symbol))
    
    if (!mentionedStock) {
      mentionedStock = stockSymbolMatch.find(symbol => 
        /^[A-Z]{2,10}$/.test(symbol) && !symbol.includes('.NS') && !symbol.includes('.BO')
      )
    }
  }

  // Check for specific widget requests
  if ((lowercaseMessage.includes('chart') || lowercaseMessage.includes('show chart') || 
       lowercaseMessage.includes('display chart')) && mentionedStock) {
    return { type: 'chart', symbol: mentionedStock }
  }
  
  if ((lowercaseMessage.includes('price') || lowercaseMessage.includes('current price') || 
       lowercaseMessage.includes('stock price')) && mentionedStock) {
    return { type: 'price', symbol: mentionedStock }
  }
  
  if ((lowercaseMessage.includes('financial') || lowercaseMessage.includes('financials') ||
       lowercaseMessage.includes('balance sheet') || lowercaseMessage.includes('income statement')) && mentionedStock) {
    return { type: 'financials', symbol: mentionedStock }
  }
  
  if ((lowercaseMessage.includes('news') || lowercaseMessage.includes('latest news')) && mentionedStock) {
    return { type: 'news', symbol: mentionedStock }
  }
  
  if (lowercaseMessage.includes('screener') || lowercaseMessage.includes('screen stocks') ||
      lowercaseMessage.includes('stock screener')) {
    return { type: 'screener' }
  }
  
  if ((lowercaseMessage.includes('market overview') || lowercaseMessage.includes('market performance') ||
       lowercaseMessage.includes('indian market') || lowercaseMessage.includes('sensex') ||
       lowercaseMessage.includes('nifty')) && !mentionedStock) {
    return { type: 'market' }
  }
  
  if (lowercaseMessage.includes('heatmap') || lowercaseMessage.includes('heat map') ||
      lowercaseMessage.includes('moneycontrol heatmap') || lowercaseMessage.includes('money control heatmap') ||
      lowercaseMessage.includes('market heatmap') || lowercaseMessage.includes('stock heatmap')) {
    return { type: 'heatmap' }
  }
  
  // Default: just show text response
  return { type: 'text', symbol: mentionedStock }
}

export default function LakshmiAi() {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const chatInputRef = useRef(null)

  // Suppress TradingView console errors and network errors
  useEffect(() => {
    // Handle viewport changes and zoom
    const handleResize = () => {
      // Force a repaint to handle zoom changes
      if (messagesContainerRef.current) {
        messagesContainerRef.current.style.height = 'auto'
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.style.height = '100%'
          }
        }, 10)
      }
    }

    const handleOrientationChange = () => {
      // Handle mobile orientation changes
      setTimeout(handleResize, 100)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)
    
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
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
      window.onerror = originalWindowError
    }
  }, [])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      })
    }
  }

  const scrollToTop = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
      })
    }
  }

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      // Show scroll to top button when user has scrolled down
      setShowScrollToTop(scrollTop > 50)
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
    // Improved scrolling behavior for new messages
    if (messages.length > 0) {
      // Small delay to ensure the DOM is updated
      setTimeout(() => {
        if (messages.length === 1) {
          // For first message, scroll to top first, then smoothly to content
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = 0
          }
        } else {
          // For subsequent messages, scroll to bottom
          scrollToBottom()
        }
      }, 100)
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
        // Check if user is asking for charts
        const lowercaseMessage = messageContent.toLowerCase()
        const isChartRequest = lowercaseMessage.includes('chart') || 
                              lowercaseMessage.includes('show chart') ||
                              lowercaseMessage.includes('display chart')
        
        // Call the Gemini API with chart request flag if needed
        const response = await fetch('/api/gemini-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: messageContent,
            requestChart: isChartRequest
          }),
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to get response')
        }
        
        // Handle chart requests - show chart widget directly
        if (data.showChart && data.chartSymbol) {
          const botMessage = {
            id: nanoid(),
            type: 'bot',
            content: data.response,
            widget: {
              type: 'chart',
              symbol: data.chartSymbol
            }
          }
          setMessages(prev => [...prev, botMessage])
        } else {
          // For all other requests, show comprehensive analysis
          // Parse the response to determine if we should show additional widgets
          const parsedResponse = parseUserMessage(messageContent)
          
          let widget = null
          if (parsedResponse.type !== 'text' && parsedResponse.type !== 'chart') {
            widget = {
              type: parsedResponse.type,
              symbol: parsedResponse.symbol
            }
          }
          
          const botMessage = {
            id: nanoid(),
            type: 'bot',
            content: data.response,
            widget: widget,
            analysisType: data.analysisType,
            stockData: data.stockData,
            symbols: data.symbols
          }
          
          setMessages(prev => [...prev, botMessage])
        }
        
      } catch (error) {
        console.error('Error:', error)
        const errorMessage = {
          id: nanoid(),
          type: 'bot',
          content: `Sorry, I encountered an error: ${error.message}. Please make sure you have set your GEMINI_API_KEY in the .env.local file.`,
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
    // Focus the input after setting the value
    if (chatInputRef.current) {
      chatInputRef.current.focus()
    }
    // Auto-send after a short delay
    setTimeout(() => handleSendMessage(), 150)
  }

  const exampleQuestions = [
    {
      title: "Company Analysis",
      message: "Analyze Reliance Industries with real-time data",
      icon: "📊"
    },
    {
      title: "Chart View", 
      message: "Show me TCS chart for technical analysis",
      icon: "📈"
    },
    {
      title: "Bank Analysis",
      message: "Compare of HDFC Bank and IDFC Bank",
      icon: "🏦"
    },
    {
      title: "Chart Request",
      message: "Display chart for Infosys",
      icon: "📉"
    },
    {
      title: "Auto Sector",
      message: "Maruti Suzuki share overview and score",
      icon: "🚗"
    },
    {
      title: "Market Overview",
      message: "Show Indian market overview and performance",
      icon: "🇮�"
    }
  ]

  const renderWidget = (widget) => {
    if (!widget) return null;
    
    switch (widget.type) {
      case 'chart':
        return <YahooStockChart symbol={widget.symbol} />;
      case 'price':
        return <YahooStockPrice symbol={widget.symbol} />;
      case 'financials':
        return <YahooStockFinancials symbol={widget.symbol} />;
      case 'news':
        return <YahooStockNews symbol={widget.symbol} />;
      case 'screener':
        return <YahooStockScreener />;
      case 'market':
        return <YahooMarketOverview />;
      case 'heatmap':
        return <MoneyControlHeatmap />;
      default:
        return null;
    }
  }

  return (
    <div className={styles.fullScreenContainer}>
      {/* Main content area */}
      <div className={styles.mainContent}>
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className={styles.welcomeScreen}>
            <div className={styles.welcomeContent}>
              {/* Market Ticker integrated within welcome screen */}
              <div className={styles.tickerSection}>
                <YahooTickerTape />
              </div>
              <div className={styles.welcomeHeader}>
                <h1 className={styles.welcomeTitle}>
                  <span className={styles.robotIcon}>🤖</span>
                  Lakshmi AI 
                </h1>
                <p className={styles.welcomeSubtitle}>
                  Your intelligent Indian stock market assistant powered by Gemini AI
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
                  ref={chatInputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about any Indian company: 'Show Reliance chart', 'Analyze TCS', 'Market overview'"
                  className={styles.chatInput}
                  disabled={isLoading}
                  autoComplete="off"
                  spellCheck="false"
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
                <h2 className={styles.chatTitle}>🤖 Lakshmi AI</h2>
                <div className={styles.chatHeaderButtons}>
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
                
                {messages.map((message) => (
                  <div key={message.id}>
                    {message.type === 'user' ? (
                      <UserMessage>{message.content}</UserMessage>
                    ) : (
                      <>
                        <BotMessage content={message.content} />
                        {message.widget && (
                          <BotCard title="Live Data">
                            {renderWidget(message.widget)}
                          </BotCard>
                        )}
                      </>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <BotMessage content="">
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
                  ref={chatInputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about any Indian company: 'Show Reliance chart', 'Analyze TCS', 'Market overview'"
                  className={styles.chatInput}
                  disabled={isLoading}
                  autoComplete="off"
                  spellCheck="false"
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