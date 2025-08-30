import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'

const Layout = () => {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      <main style={{
        paddingTop: window.innerWidth <= 768 ? '80px' : '0'
      }}>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout 