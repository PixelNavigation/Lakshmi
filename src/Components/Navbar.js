'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoginForm from './LoginForm'
import SignUpForm from './SignUpForm'
import './navbar.css'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState('login')

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
    // Dispatch custom navigation event
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page } }))
  }

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
              <li><button onClick={() => handleNavigation('dashboard')} className="nav-button">📊 Dashboard</button></li>
              <li><button onClick={() => handleNavigation('stockScreener')} className="nav-button">🔍 Stock Screener</button></li>
              <li><button onClick={() => handleNavigation('watchList')} className="nav-button">👁️ Watch List</button></li>
              <li><button onClick={() => handleNavigation('portfolio')} className="nav-button">💼 Portfolio</button></li>
              <li><button onClick={() => handleNavigation('stockGraph')} className="nav-button">📈 Stock Graph</button></li>
              <li><button onClick={() => handleNavigation('news')} className="nav-button">📰 News</button></li>
              <li><button onClick={() => handleNavigation('lakshmiAi')} className="nav-button">🤖 Lakshmi AI</button></li>
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