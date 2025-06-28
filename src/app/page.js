'use client'

import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState, useCallback, useMemo } from 'react'
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
  const { user, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [isInitialized, setIsInitialized] = useState(false)

  // Define all application routes/paths in this file
  const APP_ROUTES = useMemo(() => ({
    dashboard: {
      path: 'dashboard',
      component: Dashboard,
      label: 'Dashboard',
      icon: '📊'
    },
    stockScreener: {
      path: 'stockScreener',
      component: StockScreener,
      label: 'Stock Screener',
      icon: '🔍'
    },
    watchList: {
      path: 'watchList',
      component: WatchList,
      label: 'Watch List',
      icon: '👁️'
    },
    portfolio: {
      path: 'portfolio',
      component: Portfolio,
      label: 'Portfolio',
      icon: '💼'
    },
    stockGraph: {
      path: 'stockGraph',
      component: StockGraph,
      label: 'Stock Graph',
      icon: '📈'
    },
    news: {
      path: 'news',
      component: News,
      label: 'News',
      icon: '📰'
    },
    lakshmiAi: {
      path: 'lakshmiAi',
      component: LakshmiAi,
      label: 'Lakshmi AI',
      icon: '🤖'
    }
  }), [])

  // Custom hook for route validation
  const useRouteValidator = useCallback((route) => {
    return Object.keys(APP_ROUTES).includes(route)
  }, [APP_ROUTES])

  // Custom hook for getting initial route
  const useInitialRoute = useCallback(() => {
    if (!user) return 'dashboard'
    
    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search)
    const pageParam = urlParams.get('page')
    
    if (pageParam && useRouteValidator(pageParam)) {
      return pageParam
    }
    
    // Check localStorage for last visited page
    const lastVisited = localStorage.getItem('lastVisitedPage')
    if (lastVisited && useRouteValidator(lastVisited)) {
      return lastVisited
    }
    
    // Default to dashboard
    return 'dashboard'
  }, [user, useRouteValidator])

  // Custom hook for navigation
  const useNavigation = useCallback(() => {
    const navigate = (route) => {
      if (!useRouteValidator(route)) {
        console.warn(`Invalid route: ${route}`)
        return
      }
      
      setCurrentPage(route)
      
      if (user) {
        // Store in localStorage
        localStorage.setItem('lastVisitedPage', route)
        
        // Update URL without page reload
        const url = new URL(window.location)
        url.searchParams.set('page', route)
        window.history.pushState({ page: route }, '', url)
        
        // Dispatch event to notify navbar and other components
        const event = new CustomEvent('pageChanged', { 
          detail: { page: route } 
        })
        window.dispatchEvent(event)
      }
    }
    
    return navigate
  }, [useRouteValidator, user])

  // Custom hook for handling browser navigation (back/forward)
  const useBrowserNavigation = useCallback(() => {
    const handlePopState = (event) => {
      const route = event.state?.page || 'dashboard'
      if (useRouteValidator(route)) {
        setCurrentPage(route)
      }
    }
    
    return handlePopState
  }, [useRouteValidator])

  // Custom hook for handling external navigation events
  const useExternalNavigation = useCallback(() => {
    const navigate = useNavigation()
    
    const handleNavigationEvent = (event) => {
      const { page } = event.detail
      navigate(page)
    }
    
    return handleNavigationEvent
  }, [useNavigation])

  // Initialize the application route
  useEffect(() => {
    if (user && !isInitialized) {
      const initialRoute = useInitialRoute()
      setCurrentPage(initialRoute)
      setIsInitialized(true)
      
      // Set initial URL
      const url = new URL(window.location)
      url.searchParams.set('page', initialRoute)
      window.history.replaceState({ page: initialRoute }, '', url)
      
      // Notify navbar of initial page
      const event = new CustomEvent('pageChanged', { 
        detail: { page: initialRoute } 
      })
      window.dispatchEvent(event)
    }
  }, [user, isInitialized, useInitialRoute])

  // Set up browser navigation listener
  useEffect(() => {
    const handlePopState = useBrowserNavigation()
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [useBrowserNavigation])

  // Set up external navigation event listener (for navbar)
  useEffect(() => {
    const handleNavigationEvent = useExternalNavigation()
    window.addEventListener('navigate', handleNavigationEvent)
    
    return () => {
      window.removeEventListener('navigate', handleNavigationEvent)
    }
  }, [useExternalNavigation])

  // Custom hook for rendering current page component
  const usePageRenderer = useCallback(() => {
    const route = APP_ROUTES[currentPage]
    if (route && route.component) {
      const PageComponent = route.component
      return <PageComponent />
    }
    
    // Fallback to dashboard
    const DashboardComponent = APP_ROUTES.dashboard.component
    return <DashboardComponent />
  }, [currentPage, APP_ROUTES])

  // Expose navigation function globally for navbar
  useEffect(() => {
    const navigate = useNavigation()
    window.navigateApp = navigate
    
    return () => {
      delete window.navigateApp
    }
  }, [useNavigation])

  // Loading state while auth is being determined
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  // Render current page for authenticated users
  if (user) {
    return usePageRenderer()
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
