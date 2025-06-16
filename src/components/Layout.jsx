import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import MobileDebug from './MobileDebug'

const Layout = () => {
  // Only show MobileDebug in development
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      <main style={{
        paddingTop: window.innerWidth <= 768 ? '80px' : '0'
      }}>
        <Outlet />
      </main>
      {isDevelopment && <MobileDebug />}
    </div>
  )
}

export default Layout 