'use client'

import { useState } from 'react'
import styles from './LakshmiAi.module.css'

export default function LakshmiAi() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m Lakshmi, your AI investment assistant. How can I help you today?'
    }
  ])
  const [inputValue, setInputValue] = useState('')

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const userMessage = {
        id: messages.length + 1,
        type: 'user',
        content: inputValue
      }
      
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        content: 'Thank you for your question! This is a demo response. In the full version, I would provide detailed stock analysis and investment insights based on real-time data.'
      }

      setMessages([...messages, userMessage, botResponse])
      setInputValue('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>🤖 Lakshmi AI</h1>
        <p className={styles.pageSubtitle}>Your intelligent investment assistant powered by advanced AI</p>
      </div>

      <div className={styles.chatContainer}>
        <div className={styles.card} style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
          <div className={styles.chatMessages} style={{ flex: 1, overflowY: 'auto', padding: '1rem', marginBottom: '1rem' }}>
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`${styles.chatMessage} ${message.type === 'user' ? styles.userMessage : styles.botMessage}`}
                style={{
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: message.type === 'user' ? '#007bff' : '#f8f9fa',
                  color: message.type === 'user' ? 'white' : '#333',
                  alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%'
                }}
              >
                {message.content}
              </div>
            ))}
          </div>
          
          <div className={styles.chatInput} style={{ display: 'flex', gap: '0.5rem', padding: '0 1rem 1rem' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about stocks, market trends, or investment strategies..."
              className={styles.textInput}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
            />
            <button 
              onClick={handleSendMessage}
              className={styles.primaryButton}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              Send
            </button>
          </div>
        </div>

        <div className={styles.aiFeatures} style={{ marginTop: '2rem' }}>
          <div className={styles.card}>
            <h3>What I Can Help With</h3>
            <div className={styles.featureGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div className={styles.feature}>
                <h4>📊 Stock Analysis</h4>
                <p>Get detailed analysis of individual stocks including financials, technicals, and market sentiment.</p>
              </div>
              <div className={styles.feature}>
                <h4>📈 Market Trends</h4>
                <p>Understand current market trends and how they might affect your portfolio.</p>
              </div>
              <div className={styles.feature}>
                <h4>💡 Investment Ideas</h4>
                <p>Discover new investment opportunities based on your risk profile and preferences.</p>
              </div>
              <div className={styles.feature}>
                <h4>⚠️ Risk Assessment</h4>
                <p>Evaluate the risk factors of your current holdings and potential investments.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
