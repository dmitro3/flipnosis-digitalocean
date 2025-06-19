import { useEffect } from 'react'
import { useAccount } from 'wagmi'

export function useMetaMaskMobileFix() {
  const { isConnected } = useAccount()

  useEffect(() => {
    // Only run on mobile
    if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) return
    
    // Fix for MetaMask mobile deeplink issues
    const originalOpen = window.open
    
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
    
    // Also intercept location.href changes
    const descriptor = Object.getOwnPropertyDescriptor(window.location, 'href')
    Object.defineProperty(window.location, 'href', {
      get: descriptor.get,
      set: function(url) {
        if (url && typeof url === 'string' && url.includes('metamask://')) {
          url = url.replace(/channelid/gi, 'channelId')
          console.log('MetaMask location.href intercepted:', url)
        }
        descriptor.set.call(this, url)
      }
    })
    
    // Cleanup on unmount
    return () => {
      window.open = originalOpen
      if (descriptor) {
        Object.defineProperty(window.location, 'href', descriptor)
      }
    }
  }, [])
  
  return null
} 