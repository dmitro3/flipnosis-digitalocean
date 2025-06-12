import { WalletProvider } from './contexts/WalletContext'
import { ToastProvider } from './contexts/ToastContext'
import { ProfileProvider } from './contexts/ProfileContext'
import { router } from './Routes'
import UserProfileHeader from './components/UserProfileHeader'
import { ThemeProvider } from '@emotion/react'
import { theme } from './styles/theme'
import { RouterProvider } from 'react-router-dom'

function App() {
  return (
    <WalletProvider>
      <ProfileProvider>
        <ToastProvider>
          <ThemeProvider theme={theme}>
            <UserProfileHeader />
            <RouterProvider router={router} />
          </ThemeProvider>
        </ToastProvider>
      </ProfileProvider>
    </WalletProvider>
  )
}

export default App 