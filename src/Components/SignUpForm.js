import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import styles from './Auth.module.css'
import { set } from 'date-fns'

export default function SignUpForm({ onSuccess, onToggleMode, onClose }) {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

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
    
    // Validate phone number format (basic validation, you may want to use a more sophisticated check)
    if (!phone || phone.trim() === '') {
      setError('Phone number is required')
      setLoading(false)
      return
    }

    try {
      // Create the sign up payload
      // Supabase free tier doesn't allow custom user metadata, so we'll
      // only include the full name here and handle phone separately
      const signUpPayload = {
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      }

      // Log the payload for debugging (remove in production)
      console.log('Sign up payload:', JSON.stringify(signUpPayload, null, 2))

      const { data, error } = await supabase.auth.signUp(signUpPayload)

      if (error) {
        setError(error.message)
      } else {
        // After successful signup, store the phone number and email in a separate profiles table
        // This works around the Supabase Pro plan requirement for custom user metadata
        if (data.user) {
          const { error: profileError } = await supabase
            .from('user_profiles')  // You need to create this table in your Supabase dashboard
            .insert([
              { 
                user_id: data.user.id, 
                phone: phone,
                email: email  // Store email in profiles table for easier lookup
              }
            ]);
            
          if (profileError) {
            console.error('Error storing phone number:', profileError);
            // We'll still consider the signup successful, but log the error
          }
        }
        
        setMessage('Check your email for the confirmation link!')
        // Clear form
        setEmail('')
        setPhone('')
        setPassword('')
        setConfirmPassword('')
        setFullName('')
        // Redirect to login after short delay
        setTimeout(() => {
          onToggleMode && onToggleMode();
        }, 1500);
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Close button handler
  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <div className={styles.authContainer}>
      <div className={`${styles.authModal} ${styles.wideModal}`}>
        {/* Close Button */}
        <button className={styles.closeButton} onClick={handleClose} aria-label="Close signup form">×</button>
        <div className={styles.authHeader}>
          <h2 className={styles.authFormTitle}>Create Account</h2>
          <p className={styles.authSubtitle}>Join Lakshmi.ai for smarter investing</p>
        </div>
        {/* Two-column layout for form fields on desktop */}
        <form onSubmit={handleSignUp} className={styles.authForm + ' ' + styles.signupFormGrid}>
          <div className={styles.inputGroup} style={{gridColumn: '1'}}>
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
          <div className={styles.inputGroup} style={{gridColumn: '2'}}>
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
          <div className={styles.inputGroup} style={{gridColumn: '1'}}>
            <label className={styles.inputLabel}>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={styles.authInput}
              placeholder="Enter your phone number"
              required={true}
            />
            <small className={styles.inputHelp}>Phone number will be stored in your profile</small>
          </div>
          <div className={styles.inputGroup} style={{gridColumn: '2'}}>
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
          <div className={styles.inputGroup} style={{gridColumn: '1 / span 2'}}>
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
            <div className={styles.errorMessage} style={{gridColumn: '1 / span 2'}}>
              {error}
            </div>
          )}
          {message && (
            <div className={styles.successMessage} style={{gridColumn: '1 / span 2'}}>
              {message}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className={styles.authButton}
            style={{gridColumn: '1 / span 2'}}
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
