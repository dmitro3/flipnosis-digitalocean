import { useState, useEffect } from 'react'

export const detectMobileEnvironment = () => {
  const userAgent = navigator.userAgent
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  const isIOS = /iPad|iPhone|iPod/.test(userAgent)
  const isAndroid = /Android/i.test(userAgent)
  
  // Check if we're in MetaMask's in-app browser
  const isMetaMaskBrowser = window.ethereum && 
                           window.ethereum.isMetaMask && 
                           isMobile &&
                           (userAgent.includes('MetaMaskMobile') || 
                            window.ethereum._metamask?.isUnlocked !== undefined)
  
  // Check if we're in any wallet browser
  const isWalletBrowser = isMetaMaskBrowser || 
                         userAgent.includes('TrustWallet') ||
                         userAgent.includes('CoinbaseWallet') ||
                         userAgent.includes('Rainbow')

  return {
    isMobile,
    isIOS,
    isAndroid,
    isMetaMaskBrowser,
    isWalletBrowser,
    userAgent
  }
}

export const getWalletConnectionStrategy = () => {
  const env = detectMobileEnvironment()
  
  if (!env.isMobile) {
    return {
      strategy: 'desktop',
      canConnectDirectly: !!window.ethereum,
      recommendedAction: window.ethereum ? 'connect' : 'install'
    }
  }
  
  if (env.isMetaMaskBrowser) {
    return {
      strategy: 'mobile-metamask-browser',
      canConnectDirectly: true,
      recommendedAction: 'connect'
    }
  }
  
  if (window.ethereum) {
    return {
      strategy: 'mobile-external-browser',
      canConnectDirectly: true,
      recommendedAction: 'connect-or-redirect',
      redirectUrl: generateMetaMaskDeepLink()
    }
  }
  
  return {
    strategy: 'mobile-no-wallet',
    canConnectDirectly: false,
    recommendedAction: 'install',
    downloadUrl: getWalletDownloadUrl(env)
  }
}

export const generateMetaMaskDeepLink = () => {
  const currentUrl = window.location.href
  const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`
  
  // MetaMask deep link format
  return `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}${window.location.search}`
}

export const getWalletDownloadUrl = (env) => {
  if (env.isIOS) {
    return 'https://apps.apple.com/us/app/metamask/id1438144202'
  } else if (env.isAndroid) {
    return 'https://play.google.com/store/apps/details?id=io.metamask'
  } else {
    return 'https://metamask.io/download/'
  }
}

export const handleMobileWalletConnection = async () => {
  const strategy = getWalletConnectionStrategy()
  
  console.log('🔧 Mobile wallet connection strategy:', strategy)
  
  switch (strategy.strategy) {
    case 'desktop':
      return await connectDesktopWallet()
      
    case 'mobile-metamask-browser':
      return await connectInMetaMaskBrowser()
      
    case 'mobile-external-browser':
      return await connectInExternalMobileBrowser(strategy.redirectUrl)
      
    case 'mobile-no-wallet':
      throw new Error('MetaMask not installed. Please install MetaMask mobile app.')
      
    default:
      throw new Error('Unknown connection strategy')
  }
}

const connectDesktopWallet = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask not found. Please install MetaMask extension.')
  }
  
  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    })
    
    if (accounts.length === 0) {
      throw new Error('No accounts found')
    }
    
    return {
      success: true,
      address: accounts[0],
      method: 'desktop'
    }
  } catch (error) {
    console.error('❌ Desktop wallet connection failed:', error)
    throw error
  }
}

const connectInMetaMaskBrowser = async () => {
  if (!window.ethereum || !window.ethereum.isMetaMask) {
    throw new Error('Not in MetaMask browser')
  }
  
  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    })
    
    if (accounts.length === 0) {
      throw new Error('No accounts found')
    }
    
    return {
      success: true,
      address: accounts[0],
      method: 'metamask-browser'
    }
  } catch (error) {
    console.error('❌ MetaMask browser connection failed:', error)
    throw error
  }
}

const connectInExternalMobileBrowser = async (redirectUrl) => {
  // Try direct connection first
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
      
      if (accounts.length > 0) {
        return {
          success: true,
          address: accounts[0],
          method: 'external-mobile'
        }
      }
    } catch (error) {
      console.log('🔄 Direct connection failed, redirecting to MetaMask...')
    }
  }
  
  // If direct connection fails, redirect to MetaMask
  window.location.href = redirectUrl
  
  return {
    success: false,
    redirected: true,
    method: 'redirect'
  }
}

export const checkWalletConnection = async () => {
  if (!window.ethereum) {
    return { connected: false, reason: 'no-wallet' }
  }
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    
    if (accounts.length > 0) {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      
      return {
        connected: true,
        address: accounts[0],
        chainId: parseInt(chainId, 16)
      }
    } else {
      return { connected: false, reason: 'no-accounts' }
    }
  } catch (error) {
    console.error('❌ Error checking wallet connection:', error)
    return { connected: false, reason: 'error', error }
  }
}

export const addWalletEventListeners = (onAccountChange, onChainChange, onConnect, onDisconnect) => {
  if (!window.ethereum) return () => {}
  
  const handleAccountsChanged = (accounts) => {
    console.log('📝 Accounts changed:', accounts)
    if (accounts.length === 0) {
      onDisconnect?.()
    } else {
      onAccountChange?.(accounts[0])
    }
  }
  
  const handleChainChanged = (chainId) => {
    console.log('⛓️ Chain changed:', chainId)
    onChainChange?.(parseInt(chainId, 16))
  }
  
  const handleConnect = (connectInfo) => {
    console.log('🔗 Wallet connected:', connectInfo)
    onConnect?.(connectInfo)
  }
  
  const handleDisconnect = (error) => {
    console.log('🔌 Wallet disconnected:', error)
    onDisconnect?.(error)
  }
  
  // Add event listeners
  window.ethereum.on('accountsChanged', handleAccountsChanged)
  window.ethereum.on('chainChanged', handleChainChanged)
  window.ethereum.on('connect', handleConnect)
  window.ethereum.on('disconnect', handleDisconnect)
  
  // Return cleanup function
  return () => {
    window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
    window.ethereum.removeListener('chainChanged', handleChainChanged)
    window.ethereum.removeListener('connect', handleConnect)
    window.ethereum.removeListener('disconnect', handleDisconnect)
  }
}

// Hook for mobile wallet functionality
export const useMobileWallet = () => {
  const [environment, setEnvironment] = useState(null)
  const [strategy, setStrategy] = useState(null)
  
  useEffect(() => {
    const env = detectMobileEnvironment()
    const strat = getWalletConnectionStrategy()
    
    setEnvironment(env)
    setStrategy(strat)
    
    console.log('📱 Mobile wallet environment:', env)
    console.log('🔧 Connection strategy:', strat)
  }, [])
  
  return {
    environment,
    strategy,
    connectWallet: handleMobileWalletConnection,
    generateDeepLink: generateMetaMaskDeepLink,
    getDownloadUrl: () => getWalletDownloadUrl(environment),
    checkConnection: checkWalletConnection
  }
} 