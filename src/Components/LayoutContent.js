'use client'

import { useAuth } from '../contexts/AuthContext'
import Navbar from './Navbar'

export default function LayoutContent({ children }) {
  const { user } = useAuth()
  
  return (
    <div className={user ? 'layout-with-sidebar' : 'layout-default'}>
      <Navbar />
      <main className={user ? 'main-content-with-sidebar' : 'main-content-default'}>
        {children}
      </main>
    </div>
  )
}
