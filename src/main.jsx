import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ToastProvider } from './contexts/ToastContext.jsx'
import { WalletProvider } from './contexts/WalletContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <WalletProvider>
        <App />
      </WalletProvider>
    </ToastProvider>
  </React.StrictMode>,
) 