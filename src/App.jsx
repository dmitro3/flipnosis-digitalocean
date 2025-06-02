import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { ToastProvider } from './contexts/ToastContext'
import { WalletProvider } from './contexts/WalletContext'
import { router } from './Routes'

function App() {
  return (
    <ToastProvider>
      <WalletProvider>
        <RouterProvider router={router} />
      </WalletProvider>
    </ToastProvider>
  )
}

export default App 