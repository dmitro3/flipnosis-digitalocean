import { WalletProvider } from './contexts/WalletContext'
import { ToastProvider } from './contexts/ToastContext'
import { ProfileProvider } from './contexts/ProfileContext'
import { router } from './Routes'
import { ThemeProvider } from '@emotion/react'
import { theme } from './styles/theme'
import { RouterProvider } from 'react-router-dom'
import { useWallet } from './contexts/WalletContext'
import MobileWalletConnector from './components/MobileWalletConnector'
import DebugPanel from './components/DebugPanel'

const AppContent = () => {
  const { isConnected, isMobile, isMetaMaskBrowser } = useWallet()

  return (
    <>
      <RouterProvider router={router} />
      {/* Show debug panel in development */}
      {process.env.NODE_ENV === 'development' && <DebugPanel />}
      {/* Show mobile connector as a modal when needed */}
      {isMobile && !isConnected && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          width: '90%',
          maxWidth: 400
        }}>
          <MobileWalletConnector />
        </div>
      )}
    </>
  )
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