'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import LoginForm from './LoginForm'
import SignUpForm from './SignUpForm'
import './navbar.css'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [currentPage, setCurrentPage] = useState('dashboard')
  const router = useRouter()
  const pathname = usePathname()

  const handleAuthSuccess = () => {
    setShowAuth(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const openLogin = () => {
    setAuthMode('login')
    setShowAuth(true)
  }

  const openSignUp = () => {
    setAuthMode('signup')
    setShowAuth(true)
  }

  const toggleAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login')
  }

  const closeAuth = () => {
    setShowAuth(false)
  }

  const handleNavigation = (page) => {
    // Update the local state immediately for instant UI feedback
    setCurrentPage(page)
    
    // Use the global navigation function or dispatch custom event
    if (window.navigateApp) {
      window.navigateApp(page)
    } else {
      // Fallback to custom event
      const event = new CustomEvent('navigate', { 
        detail: { page } 
      })
      window.dispatchEvent(event)
    }
  }

  // Get current page from URL parameters for active state
  const updateCurrentPage = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const page = params.get('page') || 'dashboard'
      setCurrentPage(page)
    }
  }

  // Update current page on mount and URL changes
  useEffect(() => {
    updateCurrentPage()
    
    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', updateCurrentPage)
    
    // Listen for custom navigation events to keep navbar in sync
    const handleNavigationEvent = (event) => {
      if (event.detail && event.detail.page) {
        setCurrentPage(event.detail.page)
      }
    }
    window.addEventListener('navigate', handleNavigationEvent)
    
    // Listen for page change events from main app
    const handlePageChangeEvent = (event) => {
      if (event.detail && event.detail.page) {
        setCurrentPage(event.detail.page)
      }
    }
    window.addEventListener('pageChanged', handlePageChangeEvent)
    
    return () => {
      window.removeEventListener('popstate', updateCurrentPage)
      window.removeEventListener('navigate', handleNavigationEvent)
      window.removeEventListener('pageChanged', handlePageChangeEvent)
    }
  }, [])

  return (
    <>
      {/* Top Navbar for unauthenticated users */}
      {!user && (
        <nav className="navigation-header">
          <div className="navigation-container">
            <a href="/" className="brand-logo">
              Lakshmi.ai
            </a>
            <ul className="authentication-links">
              <li><button onClick={openSignUp} className="signup-button">Sign Up</button></li>
              <li><button onClick={openLogin} className="login-button">Log In</button></li>
            </ul>
          </div>
        </nav>
      )}

      {/* Left Sidebar for authenticated users */}
      {user && (
        <aside className="left-sidebar">
          <div className="sidebar-header">
            <a href="/" className="sidebar-logo">
              Lakshmi.ai
            </a>
          </div>
          
          <nav className="sidebar-navigation">
            <ul className='sidebar-links'>
              <li><button onClick={() => handleNavigation('dashboard')} className={`nav-button ${currentPage === 'dashboard' ? 'active' : ''}`}>📊 Dashboard</button></li>
              <li><button onClick={() => handleNavigation('stockScreener')} className={`nav-button ${currentPage === 'stockScreener' ? 'active' : ''}`}>🔍 Stock Screener</button></li>
              <li><button onClick={() => handleNavigation('watchList')} className={`nav-button ${currentPage === 'watchList' ? 'active' : ''}`}>👁️ Watch List</button></li>
              <li><button onClick={() => handleNavigation('portfolio')} className={`nav-button ${currentPage === 'portfolio' ? 'active' : ''}`}>💼 Portfolio</button></li>
              <li><button onClick={() => handleNavigation('stockGraph')} className={`nav-button ${currentPage === 'stockGraph' ? 'active' : ''}`}>📈 Stock Graph</button></li>
              <li><button onClick={() => handleNavigation('news')} className={`nav-button ${currentPage === 'news' ? 'active' : ''}`}>📰 News</button></li>
              <li><button onClick={() => handleNavigation('lakshmiAi')} className={`nav-button ${currentPage === 'lakshmiAi' ? 'active' : ''}`}>🤖 Lakshmi AI</button></li>
            </ul>
          </nav>

          <div className="sidebar-footer">
            <div className="user-profile">
              <span className="user-name">
                {user.user_metadata?.full_name || user.email}
              </span>
              <button onClick={handleSignOut} className="sidebar-logout">
                🚪 Sign Out
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Authentication Modal */}
      {showAuth && (
        <div onClick={closeAuth} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1999 }}>
          <div onClick={(e) => e.stopPropagation()}>
            {authMode === 'login' ? (
              <LoginForm 
                onSuccess={handleAuthSuccess}
                onToggleMode={toggleAuthMode}
              />
            ) : (
              <SignUpForm 
                onSuccess={handleAuthSuccess}
                onToggleMode={toggleAuthMode}
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}