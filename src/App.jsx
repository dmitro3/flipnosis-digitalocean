import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { ToastProvider } from './contexts/ToastContext'
import { WalletProvider } from './contexts/WalletContext'
import { ProfileProvider } from './contexts/ProfileContext'
import { router } from './Routes'

function App() {
  return (
    <ToastProvider>
      <WalletProvider>
        <ProfileProvider>
          <RouterProvider router={router} />
        </ProfileProvider>
      </WalletProvider>
    </ToastProvider>
  )
}

export default App 