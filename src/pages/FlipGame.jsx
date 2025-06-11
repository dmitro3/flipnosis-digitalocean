import WalletConnectionModal from '../components/WalletConnectionModal'

const [showWalletModal, setShowWalletModal] = useState(false)

if (!isConnected) {
  return (
    <ThemeProvider theme={theme}>
      <Container>
        <ContentWrapper>
          <GlassCard style={{ textAlign: 'center', padding: '3rem' }}>
            <NeonText>Connect Your Wallet</NeonText>
            <Button onClick={() => setShowWalletModal(true)}>Connect Wallet</Button>
          </GlassCard>
        </ContentWrapper>
      </Container>
      
      <WalletConnectionModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSuccess={() => {
          setShowWalletModal(false)
          // Wallet is now connected, component will re-render
        }}
      />
    </ThemeProvider>
  )
} 