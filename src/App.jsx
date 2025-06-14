import '@rainbow-me/rainbowkit/styles.css'
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

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#FF1493', // Your neon pink
            accentColorForeground: 'white',
            borderRadius: 'large',
            fontStack: 'system'
          })}
          modalSize="compact"
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
  )
}

export default App 