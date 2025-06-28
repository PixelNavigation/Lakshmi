'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import styles from "./page.module.css"

// Import all page components
import Dashboard from '../Pages/Dashboard'
import StockScreener from '../Pages/stockScreener'
import WatchList from '../Pages/watchList'
import Portfolio from '../Pages/Portfolio'
import StockGraph from '../Pages/StockGraph'
import News from '../Pages/News'
import LakshmiAi from '../Pages/LakshmiAi'

export default function Home() {
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')

  // Listen for navigation events
  useEffect(() => {
    const handleNavigation = (event) => {
      if (event.detail && event.detail.page) {
        setCurrentPage(event.detail.page)
      }
    }

    window.addEventListener('navigate', handleNavigation)
    return () => window.removeEventListener('navigate', handleNavigation)
  }, [])

  // Function to render the current page component
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'stockScreener':
        return <StockScreener />
      case 'watchList':
        return <WatchList />
      case 'portfolio':
        return <Portfolio />
      case 'stockGraph':
        return <StockGraph />
      case 'news':
        return <News />
      case 'lakshmiAi':
        return <LakshmiAi />
      default:
        return <Dashboard />
    }
  }

  if (user) {
    // Show the selected page component for authenticated users
    return renderCurrentPage()
  }

  // Show landing page for unauthenticated users
  return (
    <div className={styles.homepage}>
      {/* Banner Section */}
      <section className={styles.bannerSection}>
        <div className={styles.bannerContainer}>
          <h1 className={styles.bannerTitle}>
            AI-Powered Stock Analysis
          </h1>
          <p className={styles.bannerSubtitle}>
            Discover hidden relationships, screen smart investments, and get real-time insights with our advanced AI technology
          </p>
          <div className={styles.bannerActions}>
            <button className={styles.primaryCta}>Get Started Free</button>
            <button className={styles.secondaryCta}>Watch Demo</button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.featuresContainer}>
          <h2 className={styles.sectionTitle}>Powerful Features</h2>
          <div className={styles.featuresGrid}>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔍</div>
              <h3 className={styles.featureTitle}>Smart Screener</h3>
              <p className={styles.featureDescription}>
                Advanced screening algorithms to identify potential investment opportunities based on your criteria and market trends.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📰</div>
              <h3 className={styles.featureTitle}>Latest News</h3>
              <p className={styles.featureDescription}>
                Stay updated with real-time market news and analysis that impacts your portfolio and investment decisions.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔗</div>
              <h3 className={styles.featureTitle}>Granger Causality Analysis</h3>
              <p className={styles.featureDescription}>
                Uncover hidden relationships between stocks in your portfolio using advanced statistical analysis techniques.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🤖</div>
              <h3 className={styles.featureTitle}>AI Stock Chatbot</h3>
              <p className={styles.featureDescription}>
                Get instant answers about stocks, market trends, and investment strategies from our intelligent AI assistant.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContainer}>
          <h2 className={styles.ctaTitle}>Ready to Transform Your Trading?</h2>
          <p className={styles.ctaDescription}>
            Join thousands of investors who trust Lakshmi.ai for smarter investment decisions
          </p>
          <button className={styles.ctaButton}>Start Your Free Trial</button>
        </div>
      </section>
    </div>
  )
}
