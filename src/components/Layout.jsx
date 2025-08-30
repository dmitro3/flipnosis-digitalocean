import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import { NotificationProvider } from '../contexts/NotificationContext'

const Layout = () => {
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-bg-primary">
        <Header />
        <main style={{
          paddingTop: window.innerWidth <= 768 ? '80px' : '0'
        }}>
          <Outlet />
        </main>
      </div>
    </NotificationProvider>
  )
}

export default Layout 