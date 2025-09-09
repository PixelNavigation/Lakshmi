'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import styles from './Auth.module.css'

export default function LoginForm({ onSuccess, onToggleMode, onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        onSuccess()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Close button handler
  const handleClose = () => {
    if (onClose) onClose();
  };

  // Modern, minimal login UI
  return (
    <div className={styles.authContainer}>
      <div className={`${styles.authModal} ${styles.narrowModal}`} style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.35)', border: '1px solid rgba(255,215,0,0.08)', background: 'rgba(18,18,18,0.98)', minHeight: 'auto', maxHeight: 'none', overflow: 'hidden', padding: '2.5rem 2.5rem 2rem 2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Close Button */}
        <button className={styles.closeButton} onClick={handleClose} aria-label="Close login form">×</button>
        <div className={styles.authHeader} style={{ textAlign: 'center', width: '100%', marginBottom: '2rem' }}>
          <h2 className={styles.authFormTitle} style={{ fontSize: '2.3rem', marginBottom: '0.5rem', color: '#ffd700', fontWeight: 800, letterSpacing: '-1px' }}>Welcome Back</h2>
          <p className={styles.authSubtitle} style={{ color: '#ffd700', opacity: 0.85, fontSize: '1.1rem', fontWeight: 500 }}>Sign in to your Lakshmi.ai account</p>
        </div>
        <form onSubmit={handleLogin} className={styles.authForm + ' ' + styles.centeredForm} style={{ alignItems: 'center', width: '100%', gap: '1.5rem' }}>
          <div className={styles.inputGroup} style={{ width: '100%', maxWidth: 350 }}>
            <label className={styles.inputLabel} style={{ color: '#ffd700', fontWeight: 600 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.authInput}
              placeholder="Enter your email"
              required
              style={{ background: 'rgba(255,255,255,0.04)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.15)' }}
            />
          </div>
          <div className={styles.inputGroup} style={{ width: '100%', maxWidth: 350 }}>
            <label className={styles.inputLabel} style={{ color: '#ffd700', fontWeight: 600 }}>6-Digit PIN</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                // Only allow digits and limit to 6 characters
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setPassword(value);
              }}
              className={styles.authInput}
              placeholder="Enter your 6-digit PIN"
              pattern="\d{6}"
              maxLength="6"
              inputMode="numeric"
              required
              style={{ background: 'rgba(255,255,255,0.04)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.15)' }}
            />
            <small className={styles.inputHelp} style={{ color: '#ffd700', opacity: 0.6 }}>Enter your 6-digit PIN</small>
          </div>
          {error && (
            <div className={styles.errorMessage} style={{ width: '100%', maxWidth: 350, textAlign: 'center' }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className={styles.authButton}
            style={{ width: '100%', maxWidth: 350, fontWeight: 700, fontSize: '1.15rem', marginTop: '0.5rem', background: 'linear-gradient(90deg, #ffd700 0%, #daa520 100%)', color: '#181818', border: 'none', boxShadow: '0 2px 8px rgba(255,215,0,0.08)' }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <div className={styles.authFooter} style={{ textAlign: 'center', width: '100%', marginTop: '2rem' }}>
          <p style={{ color: '#ffd700', opacity: 0.8, fontWeight: 500 }}>
            Don&apos;t have an account?{' '}
            <button
              onClick={onToggleMode}
              className={styles.toggleButton}
              style={{ color: '#ffd700', fontWeight: 700, textDecoration: 'underline' }}
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
