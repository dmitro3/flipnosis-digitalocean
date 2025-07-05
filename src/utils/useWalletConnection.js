import { useEffect, useState, useRef } from 'react'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { useToast } from '../contexts/ToastContext'

export const useWalletConnection = () => {
  const { address, isConnected: wagmiConnected, connector } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { showError } = useToast()
  const [isFullyConnected, setIsFullyConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const initializationTimeout = useRef(null)
  const retryCount = useRef(0)
  const maxRetries = 5

  useEffect(() => {
    // Check if we have all required connection components
    const checkConnection = async () => {
      try {
        // Reset error state
        setConnectionError(null)

        // Check basic requirements
        const hasAddress = !!address
        const hasWalletClient = !!walletClient
        const hasPublicClient = !!publicClient
        const isWagmiConnected = wagmiConnected

        console.log('🔍 Wallet connection check:', {
          hasAddress,
          hasWalletClient,
          hasPublicClient,
          isWagmiConnected,
          connector: connector?.name,
          retryCount: retryCount.current,
          isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        })

        // If wagmi says we're connected but we don't have clients yet
        if (isWagmiConnected && hasAddress && (!hasWalletClient || !hasPublicClient)) {
          setIsInitializing(true)
          
          // Clear any existing timeout
          if (initializationTimeout.current) {
            clearTimeout(initializationTimeout.current)
          }
          
          // Retry with exponential backoff
          if (retryCount.current < maxRetries) {
            const delay = Math.min(1000 * Math.pow(1.5, retryCount.current), 5000)
            console.log(`⏳ Waiting ${delay}ms for clients to initialize (attempt ${retryCount.current + 1}/${maxRetries})...`)
            
            initializationTimeout.current = setTimeout(() => {
              retryCount.current++
              checkConnection()
            }, delay)
            
            return
          } else {
            // Max retries reached
            const error = 'Wallet initialization timeout. Please reconnect your wallet.'
            setConnectionError(error)
            setIsInitializing(false)
            console.error('❌ Max retries reached for wallet initialization')
            return
          }
        }

        // All components are ready
        if (hasAddress && hasWalletClient && hasPublicClient && isWagmiConnected) {
          setIsFullyConnected(true)
          setIsInitializing(false)
          retryCount.current = 0 // Reset retry count on success
          
          // Clear any pending timeout
          if (initializationTimeout.current) {
            clearTimeout(initializationTimeout.current)
            initializationTimeout.current = null
          }
          
          console.log('✅ Wallet fully connected')
        } else if (!isWagmiConnected) {
          // Not connected at all
          setIsFullyConnected(false)
          setIsInitializing(false)
          retryCount.current = 0
          
          // Clear any pending timeout
          if (initializationTimeout.current) {
            clearTimeout(initializationTimeout.current)
            initializationTimeout.current = null
          }
        }
      } catch (error) {
        console.error('❌ Error checking wallet connection:', error)
        setConnectionError(error.message)
        setIsFullyConnected(false)
        setIsInitializing(false)
      }
    }

    checkConnection()

    // Cleanup on unmount
    return () => {
      if (initializationTimeout.current) {
        clearTimeout(initializationTimeout.current)
      }
    }
  }, [address, walletClient, publicClient, wagmiConnected, connector])

  // Reset retry count when disconnected
  useEffect(() => {
    if (!wagmiConnected) {
      retryCount.current = 0
    }
  }, [wagmiConnected])

  return {
    isFullyConnected,
    connectionError,
    isInitializing,
    address,
    walletClient,
    publicClient,
    connector,
    isConnected: wagmiConnected,
    // Helper to check if ready for transactions
    isReady: isFullyConnected && !connectionError && !isInitializing
  }
} 