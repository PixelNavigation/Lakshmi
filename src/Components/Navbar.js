'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoginForm from './LoginForm'
import SignUpForm from './SignUpForm'
import './navbar.css'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState('login') // 'login' or 'signup'

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

  return (
    <>
      <nav className="navigation-header">
        <div className="navigation-container">
          <a href="/" className="brand-logo">
            Lakshmi.ai
          </a>
          
          {user ? (
            <div className="user-menu">
              <span className="user-welcome">
                Welcome, {user.user_metadata?.full_name || user.email}
              </span>
              <button onClick={handleSignOut} className="logout-button">
                Sign Out
              </button>
            </div>
          ) : (
            <ul className="authentication-links">
              <li><button onClick={openSignUp} className="signup-button">Sign Up</button></li>
              <li><button onClick={openLogin} className="login-button">Log In</button></li>
            </ul>
          )}
        </div>
      </nav>

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