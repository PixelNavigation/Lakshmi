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
    <div className="flex items-start mb-4">
      <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0 text-sm">
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
                  {isStreaming && <span className="animate-pulse">|</span>}
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
    <div className="mb-4">
      <div className="flex items-start mb-2">
        <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0 text-sm">
          🤖
        </div>
        <div className="text-sm text-gray-600">
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
  // Check if the AI wants to show a chart or widget based on the content
  const lowercaseContent = content.toLowerCase()
  const uppercaseContent = content.toUpperCase()
  
  // Extract stock symbols (basic pattern matching)
  const stockSymbolMatch = content.match(/\b[A-Z]{1,5}\b/g)
  const commonStocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'JPM', 'V', 'JNJ']
  const mentionedStock = stockSymbolMatch?.find(symbol => commonStocks.includes(symbol))
  
  // Check for specific requests
  if (lowercaseContent.includes('chart') && mentionedStock) {
    return {
      type: 'chart',
      symbol: mentionedStock,
      content: `Here's the chart for ${mentionedStock}:`,
      hideText: false // Show brief intro text
    }
  }
  
  if (lowercaseContent.includes('price') && mentionedStock) {
    return {
      type: 'price',
      symbol: mentionedStock,
      content: `Here's the current price for ${mentionedStock}:`,
      hideText: false // Show brief intro text
    }
  }
  
  if (lowercaseContent.includes('financial') && mentionedStock) {
    return {
      type: 'financials',
      symbol: mentionedStock,
      content: `Here are the financials for ${mentionedStock}:`,
      hideText: false // Show brief intro text
    }
  }
  
  if (lowercaseContent.includes('news') && mentionedStock) {
    return {
      type: 'news',
      symbol: mentionedStock,
      content: `Here's the latest news for ${mentionedStock}:`,
      hideText: false // Show brief intro text
    }
  }
  
  if (lowercaseContent.includes('screener') || lowercaseContent.includes('screen')) {
    return {
      type: 'screener',
      content: `Here's the stock screener:`,
      hideText: false // Show brief intro text
    }
  }
  
  if (lowercaseContent.includes('market') && (lowercaseContent.includes('overview') || lowercaseContent.includes('performance'))) {
    return {
      type: 'market',
      content: `Here's the market overview:`,
      hideText: false // Show brief intro text
    }
  }
  
  if (lowercaseContent.includes('heatmap') || (lowercaseContent.includes('sector') && lowercaseContent.includes('performance'))) {
    return {
      type: 'heatmap',
      content: `Here's the market heatmap:`,
      hideText: false // Show brief intro text
    }
  }
  
  if (lowercaseContent.includes('trending') || lowercaseContent.includes('movers')) {
    return {
      type: 'trending',
      content: `Here are the trending stocks:`,
      hideText: false // Show brief intro text
    }
  }
  
  return {
    type: 'text',
    content: message,
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToTop = () => {
    messagesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      // Show scroll to top button when user has scrolled down
      setShowScrollToTop(scrollTop > 300)
    }
  }

  const clearChat = () => {
    setMessages([])
    setInputValue('')
  }

  useEffect(() => {
    scrollToBottom()
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
        const parsedResponse = parseAIResponse(data.response, messageContent)
        
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
      message: "Show me a chart for GOOGL",
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
            
            {/* Messages area */}
            <div className={styles.messagesArea}>
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
                        {/* Only show bot message if there's no widget or if we specifically want to show text */}
                        {!message.widget && (
                          <BotMessage content={message.content} />
                        )}
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
