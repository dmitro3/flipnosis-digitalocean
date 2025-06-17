import { isMobileDevice, getDevicePerformanceTier } from '../utils/deviceDetection'

const FlipGame = () => {
  // ... your existing state ...
  
  // Mobile optimization state
  const [isMobile] = useState(isMobileDevice())
  const [deviceTier] = useState(getDevicePerformanceTier())
  
  // ... rest of your existing code ...

  // Update your mobile coin container styling
  const mobileRenderCoin = () => {
    return (
      <div 
        className={`mobile-coin-container ${deviceTier}-performance-mode`}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          width: '100%',
          // Reduce size on low-end devices
          maxWidth: deviceTier === 'low' ? '150px' : '200px',
          aspectRatio: '1',
          margin: '0 auto'
        }}
      >
        <ReliableGoldCoin
          isFlipping={flipAnimation?.isFlipping}
          flipResult={flipAnimation?.result}
          flipDuration={flipAnimation?.duration}
          creatorPower={gameState?.creatorPower || 0}
          joinerPower={gameState?.joinerPower || 0}
          isPlayerTurn={isMyTurn}
          chargingPlayer={gameState?.chargingPlayer}
          isCreator={isCreator}
          creatorChoice={gameState?.creatorChoice}
          joinerChoice={gameState?.joinerChoice}
          onMouseDown={isMyTurn ? handleMouseDown : undefined}
          onMouseUp={isMyTurn ? handleMouseUp : undefined}
          size={deviceTier === 'low' ? 150 : 200} // Smaller on low-end devices
        />
      </div>
    )
  }

  // Update your mobile layout section to use the new render function
  // Replace your existing mobile coin container with:
  
  return (
    <ThemeProvider theme={theme}>
      <Container>
        <ContentWrapper>
          {/* Desktop layout */}
          <DesktopOnlyLayout>
            {/* Your existing desktop layout */}
          </DesktopOnlyLayout>

          {/* Mobile layout with optimizations */}
          <div style={{
            display: window.innerWidth <= 768 ? 'flex' : 'none',
            flexDirection: 'column',
            gap: '1rem',
            width: '100%',
            marginBottom: '2rem'
          }}>
            {/* Mobile: Player 1 Container */}
            <div style={{
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              width: '100%'
            }}>
              {/* Your existing Player 1 content */}
            </div>

            {/* Mobile: Optimized Coin Container */}
            {mobileRenderCoin()}

            {/* Mobile: Player 2 Container */}
            <div style={{
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              width: '100%'
            }}>
              {/* Your existing Player 2 content */}
            </div>

            {/* Rest of your mobile layout */}
          </div>
        </ContentWrapper>
      </Container>
    </ThemeProvider>
  )
} 