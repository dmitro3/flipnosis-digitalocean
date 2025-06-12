import { WalletProvider } from './contexts/WalletContext'
import { ToastProvider } from './contexts/ToastContext'
import { ProfileProvider } from './contexts/ProfileContext'
import { router } from './Routes'
import { ThemeProvider } from '@emotion/react'
import { theme } from './styles/theme'
import { RouterProvider } from 'react-router-dom'
import { useWallet } from './contexts/WalletContext'
import MobileWalletConnector from './components/MobileWalletConnector'

const AppContent = () => {
  const { isConnected, isMobile, isMetaMaskBrowser } = useWallet()

  // Show mobile connector if on mobile and not connected
  if (isMobile && !isConnected) {
    return <MobileWalletConnector />
  }

  return <RouterProvider router={router} />
}

function App() {
  return (
    <WalletProvider>
      <ProfileProvider>
        <ToastProvider>
          <ThemeProvider theme={theme}>
            <AppContent />
          </ThemeProvider>
        </ToastProvider>
      </ProfileProvider>
    </WalletProvider>
  )
}

export default App 