import React, { createContext, useContext, useState, useRef } from 'react'

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const notificationIdRef = useRef(0)

  const showNotification = (message, type = 'info', duration = 3000) => {
    const id = `notification-${++notificationIdRef.current}-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`
    
    setNotifications(prev => [...prev, { id, message, type }])

    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id))
    }, duration)
  }

  const showSuccess = (message) => showNotification(message, 'success')
  const showError = (message) => showNotification(message, 'error')
  const showInfo = (message) => showNotification(message, 'info')

  return (
    <NotificationContext.Provider value={{ showNotification, showSuccess, showError, showInfo }}>
      {children}
      {/* Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`status-message status-${notification.type} animate-slide-in`}
            role="alert"
          >
            {notification.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}
