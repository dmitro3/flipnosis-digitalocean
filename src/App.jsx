import '@rainbow-me/rainbowkit/styles.css'
import './styles/global.css'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WalletProvider } from './contexts/WalletContext'
import { ToastProvider } from './contexts/ToastContext'
import { ProfileProvider } from './contexts/ProfileContext'
import { router } from './Routes'
import { ThemeProvider } from '@emotion/react'
import { theme } from './styles/theme'
import { RouterProvider } from 'react-router-dom'
import { config } from './config/rainbowkit'
import React, { useEffect } from 'react'
import ErrorBoundary from './components/ErrorBoundary'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Initialize Rainbow Kit
const { chains } = config

// Debug config
console.log('Rainbow Kit Config:', {
  chains: chains.map(c => c.name),
  projectId: config.projectId,
})



function App() {
  // Add debug logging
  console.log('🔍 App.jsx - Starting render:', { 
    config, 
    hasChains: !!config?.chains,
    chainsLength: config?.chains?.length,
    timestamp: new Date().toISOString()
  })

  // Add global error handler
  useEffect(() => {
    const handleGlobalError = (event) => {
      console.error('🚨 Global error caught:', event.error)
      // Prevent the error from showing in console
      event.preventDefault()
    }

    const handleUnhandledRejection = (event) => {
      console.error('🚨 Unhandled promise rejection:', event.reason)
      // Prevent the error from showing in console
      event.preventDefault()
    }

    window.addEventListener('error', handleGlobalError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // Add global WebSocket listener for TRANSPORT_TO_GAME messages and offer acceptance
  useEffect(() => {
    const handleGlobalWebSocketMessage = (event) => {
      const data = event.detail
      
      // Add null check to prevent the error
      if (!data || !data.type) {
        console.warn('⚠️ Received invalid WebSocket message:', data)
        return
      }
      
      // Handle TRANSPORT_TO_GAME message globally
      if (data.type === 'TRANSPORT_TO_GAME' && data.forceTransport) {
        console.log('🚀 GLOBAL: Received TRANSPORT_TO_GAME message:', data)
        
        const gameId = data.gameId || data.contract_game_id
        if (gameId) {
          console.log('🎮 GLOBAL: Force transporting to game:', gameId)
          
          // Close any open modals
          window.dispatchEvent(new CustomEvent('closeAllModals'))
          
          // Navigate to game
          setTimeout(() => {
            window.location.href = `/game/${gameId}`
          }, 100)
        }
      }
      
      // Handle offer_accepted_with_timer message globally for Player 2
      if (data.type === 'offer_accepted_with_timer') {
        console.log('⏰ GLOBAL: Received offer_accepted_with_timer message:', data)
        
        // Dispatch a global event to show the crypto loader
        // The wallet address check will be handled in the component that listens to this event
        window.dispatchEvent(new CustomEvent('showCryptoLoader', {
          detail: {
            offerId: data.offerId,
            listingId: data.listingId,
            gameId: data.gameId,
            contract_game_id: data.gameId,
            offererAddress: data.offererAddress,
            offerPrice: data.offerPrice,
            originalPrice: data.originalPrice,
            nftContract: data.nftContract,
            nftTokenId: data.nftTokenId,
            nftName: data.nftName,
            nftImage: data.nftImage,
            coin: data.coin,
            startTime: data.startTime,
            duration: data.duration
          }
        }))
      }
    }
    
    window.addEventListener('websocketMessage', handleGlobalWebSocketMessage)
    
    return () => {
      window.removeEventListener('websocketMessage', handleGlobalWebSocketMessage)
    }
  }, [])

  return (
    <ErrorBoundary>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: '#00FF41',
              accentColorForeground: 'black',
              borderRadius: 'large',
              fontStack: 'system',
              overlayBlur: 'small',
            })}
            modalSize="compact"
            initialChain={chains[0]}
            chains={chains}
          >
            <ToastProvider>
              <WalletProvider>
                <ProfileProvider>
                  <ThemeProvider theme={theme}>
                    <RouterProvider router={router} />
                  </ThemeProvider>
                </ProfileProvider>
              </WalletProvider>
            </ToastProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  )
}

export default App 