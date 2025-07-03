import { useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './Auth.module.css'
import { set } from 'date-fns'

export default function SignUpForm({ onSuccess, onToggleMode }) {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    // Validate PIN format - must be exactly 6 digits
    if (!/^\d{6}$/.test(password)) {
      setError('PIN must be exactly 6 digits')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('PINs do not match')
      setLoading(false)
      return
    }

    try {
      // Create the sign up payload
      const signUpPayload = {
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            // Store phone as user metadata if provided
            ...(phone && { phone: phone })
          }
        }
      }

      // Log the payload for debugging (remove in production)
      console.log('Sign up payload:', JSON.stringify(signUpPayload, null, 2))

      const { data, error } = await supabase.auth.signUp(signUpPayload)

      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for the confirmation link!')
        // Clear form
        setEmail('')
        setPhone('')
        setPassword('')
        setConfirmPassword('')
        setFullName('')
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
          <h2 className={styles.authTitle}>Create Account</h2>
          <p className={styles.authSubtitle}>Join Lakshmi.ai for smarter investing</p>
        </div>

        <form onSubmit={handleSignUp} className={styles.authForm}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={styles.authInput}
              placeholder="Enter your full name"
              required
            />
          </div>

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
            <label className={styles.inputLabel}>Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={styles.authInput}
              placeholder="Enter your phone number (optional)"
              required={false}
            />
            <small className={styles.inputHelp}>Phone number will be stored in your profile but not used for login</small>
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
              placeholder="Enter 6-digit PIN"
              pattern="\d{6}"
              maxLength="6"
              inputMode="numeric"
              required
            />
            <small className={styles.inputHelp}>Your PIN must be exactly 6 digits</small>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Confirm PIN</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                // Only allow digits and limit to 6 characters
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setConfirmPassword(value);
              }}
              className={styles.authInput}
              placeholder="Confirm your 6-digit PIN"
              pattern="\d{6}"
              maxLength="6"
              inputMode="numeric"
              required
            />
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {message && (
            <div className={styles.successMessage}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={styles.authButton}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className={styles.authFooter}>
          <p>
            Already have an account?{' '}
            <button
              onClick={onToggleMode}
              className={styles.toggleButton}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
