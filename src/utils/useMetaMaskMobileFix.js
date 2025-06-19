import { useEffect } from 'react'

export function useMetaMaskMobileFix() {
  useEffect(() => {
    // Only run on mobile
    if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) return
    
    // Fix for MetaMask mobile deeplink issues
    const originalOpen = window.open
    
    // Override window.open - this usually works on all browsers
    try {
      window.open = function(url, ...args) {
        // Intercept MetaMask deeplinks that cause issues
        if (url && typeof url === 'string' && url.includes('metamask://')) {
          // Clean up malformed deeplinks - fix the channelid parameter
          const cleanUrl = url.replace(/channelid/gi, 'channelId')
          
          // Log for debugging
          console.log('MetaMask deeplink intercepted:', { original: url, cleaned: cleanUrl })
          
          // If the URL is still malformed, block it
          if (cleanUrl.includes('metamask://connect?') && !cleanUrl.includes('channelId=')) {
            console.warn('Blocking malformed MetaMask deeplink')
            return null
          }
          
          return originalOpen.call(window, cleanUrl, ...args)
        }
        
        return originalOpen.call(window, url, ...args)
      }
    } catch (e) {
      console.log('Could not override window.open:', e.message)
    }
    
    // Store references for cleanup
    let cleanupFunctions = []
    
    // Try to intercept location methods if possible
    try {
      const originalAssign = window.location.assign.bind(window.location)
      window.location.assign = function(url) {
        if (url && typeof url === 'string' && url.includes('metamask://')) {
          url = url.replace(/channelid/gi, 'channelId')
          console.log('MetaMask location.assign intercepted:', url)
        }
        return originalAssign(url)
      }
      cleanupFunctions.push(() => {
        try { window.location.assign = originalAssign } catch (e) {}
      })
    } catch (e) {
      // Can't override assign, that's okay
    }
    
    try {
      const originalReplace = window.location.replace.bind(window.location)
      window.location.replace = function(url) {
        if (url && typeof url === 'string' && url.includes('metamask://')) {
          url = url.replace(/channelid/gi, 'channelId')
          console.log('MetaMask location.replace intercepted:', url)
        }
        return originalReplace(url)
      }
      cleanupFunctions.push(() => {
        try { window.location.replace = originalReplace } catch (e) {}
      })
    } catch (e) {
      // Can't override replace, that's okay
    }
    
    // The window.open override should be sufficient for most cases
    console.log('MetaMask mobile fix applied')
    
    // Cleanup on unmount
    return () => {
      try {
        window.open = originalOpen
      } catch (e) {}
      
      // Run all cleanup functions
      cleanupFunctions.forEach(fn => fn())
    }
  }, [])
  
  return null
} 