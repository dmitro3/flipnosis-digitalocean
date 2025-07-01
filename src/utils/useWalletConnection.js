import { useEffect, useState } from 'react'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { useToast } from '../contexts/ToastContext'

export const useWalletConnection = () => {
  const { address, isConnected: wagmiConnected, connector } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { showError } = useToast()
  const [isFullyConnected, setIsFullyConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)

  useEffect(() => {
    // Check if we have all required connection components
    const checkConnection = async () => {
      try {
        // Reset error state
        setConnectionError(null)

        // For mobile wallets, we need to ensure we have:
        // 1. An address
        // 2. A wallet client
        // 3. A public client
        // 4. The wagmi connection state is true
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
          isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        })

        // On mobile, sometimes the wallet client takes a moment to initialize
        if (isWagmiConnected && hasAddress && (!hasWalletClient || !hasPublicClient)) {
          console.log('⏳ Waiting for clients to initialize...')
          // Give it a moment to initialize
          setTimeout(() => {
            checkConnection()
          }, 1000)
          return
        }

        const fullyConnected = hasAddress && hasWalletClient && hasPublicClient && isWagmiConnected
        setIsFullyConnected(fullyConnected)

        if (!fullyConnected && isWagmiConnected) {
          const error = 'Wallet connection incomplete. Please reconnect your wallet.'
          setConnectionError(error)
          console.error('❌ Incomplete wallet connection:', {
            hasAddress,
            hasWalletClient,
            hasPublicClient,
            isWagmiConnected
          })
        }
      } catch (error) {
        console.error('❌ Error checking wallet connection:', error)
        setConnectionError(error.message)
        setIsFullyConnected(false)
      }
    }

    checkConnection()
  }, [address, walletClient, publicClient, wagmiConnected, connector])

  return {
    isFullyConnected,
    connectionError,
    address,
    walletClient,
    publicClient,
    connector
  }
} 