'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './Auth.module.css'

export default function LoginForm({ onSuccess, onToggleMode }) {
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

  return (
    <div className={styles.authContainer}>
      <div className={styles.authModal}>
        <div className={styles.authHeader}>
          <h2 className={styles.authTitle}>Welcome Back</h2>
          <p className={styles.authSubtitle}>Sign in to your Lakshmi.ai account</p>
        </div>

        <form onSubmit={handleLogin} className={styles.authForm}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.authInput}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>6-Digit PIN</label>
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
            />
            <small className={styles.inputHelp}>Enter your 6-digit PIN</small>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={styles.authButton}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.authFooter}>
          <p>
            Don't have an account?{' '}
            <button
              onClick={onToggleMode}
              className={styles.toggleButton}
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
