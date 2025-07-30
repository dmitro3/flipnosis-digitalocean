// Polyfill for use-sync-external-store compatibility
import { useSyncExternalStore } from 'use-sync-external-store/shim'

// Export the function with the expected name
export const useSyncExternalStoreWithSelector = useSyncExternalStore

// Also export the base function
export { useSyncExternalStore }

// Global error handler for better debugging
window.addEventListener('error', (event) => {
  console.error('🚨 Global error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  })
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', {
    reason: event.reason,
    promise: event.promise
  })
}) 