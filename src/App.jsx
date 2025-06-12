import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { ToastProvider } from './contexts/ToastContext'
import { WalletProvider } from './contexts/WalletContext'
import { ProfileProvider } from './contexts/ProfileContext'
import { router } from './Routes'
import UserProfileHeader from './components/UserProfileHeader'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from './theme'
import { Routes, Router } from 'react-router-dom'

function App() {
  return (
    <WalletProvider>
      <ProfileProvider>
        <ToastProvider>
          <ThemeProvider theme={theme}>
            <UserProfileHeader />
            <Router>
              <Routes>
                <RouterProvider router={router} />
              </Routes>
            </Router>
          </ThemeProvider>
        </ToastProvider>
      </ProfileProvider>
    </WalletProvider>
  )
}

export default App 