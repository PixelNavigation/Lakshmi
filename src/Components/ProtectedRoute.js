'use client'

import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, fallback = null }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        color: 'var(--foreground)'
      }}>
        Loading...
      </div>
    )
  }

  if (!user) {
    return fallback || (
      <div style={{ 
        textAlign: 'center', 
        padding: '2rem',
        color: 'var(--foreground)'
      }}>
        <h2>Access Restricted</h2>
        <p>Please sign in to access this feature.</p>
      </div>
    )
  }

  return children
}
