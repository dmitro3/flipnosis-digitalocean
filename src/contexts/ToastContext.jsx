import React, { createContext, useContext, useState, useRef } from 'react'

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const toastIdRef = useRef(0) // Use useRef for persistent counter

  const showToast = (message, type = 'info', duration = 3000) => {
    // Generate unique ID using ref + random + timestamp
    const id = `toast-${++toastIdRef.current}-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`
    
    setToasts(prev => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, duration)
  }

  const showSuccess = (message) => showToast(message, 'success')
  const showError = (message) => showToast(message, 'error')
  const showInfo = (message) => showToast(message, 'info')

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`status-message status-${toast.type} animate-slide-in`}
            role="alert"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
} 