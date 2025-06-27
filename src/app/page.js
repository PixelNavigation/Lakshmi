'use client'

import { useAuth } from '../contexts/AuthContext'
import styles from "./page.module.css"

export default function Home() {
  const { user } = useAuth()

  return (
    <div className={styles.homepage}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContainer}>
          <h1 className={styles.heroTitle}>
            AI-Powered Stock Analysis
          </h1>
          <p className={styles.heroSubtitle}>
            Discover hidden relationships, screen smart investments, and get real-time insights with our advanced AI technology
          </p>
          <div className={styles.heroActions}>
            {user ? (
              <button className={styles.primaryCta}>Go to Dashboard</button>
            ) : (
              <>
                <button className={styles.primaryCta}>Get Started Free</button>
                <button className={styles.secondaryCta}>Watch Demo</button>
              </>
            )}
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
      {!user && (
        <section className={styles.ctaSection}>
          <div className={styles.ctaContainer}>
            <h2 className={styles.ctaTitle}>Ready to Transform Your Trading?</h2>
            <p className={styles.ctaDescription}>
              Join thousands of investors who trust Lakshmi.ai for smarter investment decisions
            </p>
            <button className={styles.ctaButton}>Start Your Free Trial</button>
          </div>
        </section>
      )}

      {/* User Dashboard Preview */}
      {user && (
        <section className={styles.ctaSection}>
          <div className={styles.ctaContainer}>
            <h2 className={styles.ctaTitle}>Welcome back, {user.user_metadata?.full_name || 'Investor'}!</h2>
            <p className={styles.ctaDescription}>
              Your personalized stock analysis dashboard is ready
            </p>
            <button className={styles.ctaButton}>Access Dashboard</button>
          </div>
        </section>
      )}
    </div>
  )
}
