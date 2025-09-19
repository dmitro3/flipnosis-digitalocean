// 1. React imports first
import React, { useState, useEffect } from 'react'

// 2. Third-party imports
import { useNavigate } from 'react-router-dom'
import { ThemeProvider } from '@emotion/react'
import styled from '@emotion/styled'

// 3. Context imports
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'

// 4. Service imports
import contractService from '../services/ContractService'

// 5. Component imports
import NFTSelector from '../components/NFTSelector'
import CoinSelector from '../components/CoinSelector'
import CoinMaterialSelector from '../components/CoinMaterialSelector'

// 6. Style imports
import { theme } from '../styles/theme'
import { API_CONFIG, getApiUrl } from '../config/api'
import {
  Container,
  ContentWrapper,
  GlassCard,
  NeonText,
  Button,
  FormGroup,
  Label,
  Input,
  Select,
  LoadingSpinner
} from '../styles/components'

// Styled components for NFT preview
const NFTPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px dashed ${props => props.theme.colors.neonBlue};
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(0, 191, 255, 0.05);

  &:hover {
    border-color: ${props => props.theme.colors.neonPink};
    background: rgba(255, 20, 147, 0.05);
  }

  img {
    width: 60px;
    height: 60px;
    border-radius: 0.5rem;
    object-fit: cover;
  }

  div {
    flex: 1;
    
    h4 {
      color: ${props => props.theme.colors.textPrimary};
      margin: 0 0 0.25rem 0;
      font-size: 1rem;
    }
    
    p {
      color: ${props => props.theme.colors.textSecondary};
      margin: 0;
      font-size: 0.9rem;
    }
  }
`

const PlaceholderText = styled.div`
  color: ${props => props.theme.colors.textSecondary};
  font-style: italic;
  text-align: center;
  width: 100%;
`

const GameModeSelector = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
`

const ModeCard = styled.div`
  padding: 1.5rem;
  border: 2px solid ${props => props.selected ? props.theme.colors.neonBlue : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 1rem;
  background: ${props => props.selected ? 'rgba(0, 191, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  
  &:hover {
    border-color: ${props => props.theme.colors.neonPink};
    background: rgba(255, 20, 147, 0.05);
  }
  
  .mode-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  
  .mode-title {
    color: ${props => props.theme.colors.textPrimary};
    font-size: 1.1rem;
    font-weight: bold;
    margin: 0 0 0.5rem 0;
  }
  
  .mode-description {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 0.9rem;
    margin: 0;
  }
  
  .mode-details {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    
    .detail-item {
      display: flex;
      justify-content: space-between;
      margin: 0.25rem 0;
      font-size: 0.8rem;
      
      .label {
        color: ${props => props.theme.colors.textSecondary};
      }
      
      .value {
        color: ${props => props.theme.colors.textPrimary};
        font-weight: bold;
      }
    }
  }
`

const SubmitButton = styled(Button)`
  margin-top: 2rem;
  width: 100%;
  background: linear-gradient(135deg, ${props => props.theme.colors.neonBlue} 0%, ${props => props.theme.colors.neonPurple} 100%);
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

// Styled components for progress steps
const ProgressContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  position: relative;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`

const ProgressStep = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
  flex: 1;
`

const StepCircle = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
  border: 3px solid;
  
  ${props => {
    if (props.completed) {
      return `
        background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
        border-color: #00ff88;
        color: white;
        box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
      `
    } else if (props.active) {
      return `
        background: linear-gradient(135deg, ${props.theme.colors.neonBlue} 0%, ${props.theme.colors.neonPurple} 100%);
        border-color: ${props.theme.colors.neonBlue};
        color: white;
        box-shadow: 0 0 20px rgba(0, 191, 255, 0.5);
      `
    } else {
      return `
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
        color: ${props.theme.colors.textSecondary};
      `
    }
  }}
`

const StepLabel = styled.div`
  text-align: center;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.3s ease;
  
  ${props => {
    if (props.completed) {
      return `color: #00ff88;`
    } else if (props.active) {
      return `color: ${props.theme.colors.neonBlue};`
    } else {
      return `color: ${props.theme.colors.textSecondary};`
    }
  }}
`

const ProgressLine = styled.div`
  position: absolute;
  top: 25px;
  left: 25px;
  right: 25px;
  height: 3px;
  background: rgba(255, 255, 255, 0.2);
  z-index: 1;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: linear-gradient(90deg, #00ff88 0%, #00cc6a 100%);
    transition: width 0.5s ease;
    width: ${props => props.progress}%;
  }
`

const CreateFlip = () => {
  const navigate = useNavigate()
  const { showSuccess, showError, showInfo } = useToast()
  const { address, walletClient, publicClient, nfts, loading: nftsLoading, chainId, switchToBase, isConnected, isConnecting } = useWallet()
  
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)

  const [preloadNFT, setPreloadNFT] = useState(false)
  const [isNFTSelectorOpen, setIsNFTSelectorOpen] = useState(false)
  const [selectedCoin, setSelectedCoin] = useState({
    type: 'default',
    headsImage: '/coins/plainh.png',
    tailsImage: '/coins/plaint.png',
    isCustom: false
  })
  const [selectedMaterial, setSelectedMaterial] = useState({
    id: 'graphite',
    name: 'Graphite',
    description: 'Ultra-Light & Swift',
    edgeColor: '#1a1a1a',
    physics: {
      weight: 'ultra-light',
      speedMultiplier: 2.0,
      durationMultiplier: 0.5,
      wobbleIntensity: 1.5,
      predictability: 'very-low'
    }
  })

  // Battle Royale mode state
  const [gameMode, setGameMode] = useState('nft-vs-crypto') // 'nft-vs-crypto' or 'battle-royale'
  const [entryFee, setEntryFee] = useState('5.00')
  const [serviceFee, setServiceFee] = useState('0.10') // Changed to 10 cents

  // Debug game mode changes
  useEffect(() => {
    console.log('🎮 Game mode changed to:', gameMode)
  }, [gameMode])

  // Progress tracking state
  const [currentStep, setCurrentStep] = useState(0) // 0: not started, 1: approve, 2: pay fee, 3: deposit NFT
  const [stepStatus, setStepStatus] = useState({
    approve: false,
    payFee: false,
    depositNFT: false
  })

  // Check if wallet is fully connected and ready
  const isFullyConnected = address && walletClient
  
  // Debug wallet connection status (only in development)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 Wallet connection status:', {
        address,
        hasWalletClient: !!walletClient,
        isFullyConnected,
        isConnected,
        isConnecting,
        chainId
      })
    }
    
    // Check if wallet is on Base network
    if (isConnected && chainId !== 8453) {
      console.warn('⚠️ Wallet not on Base network. Current chainId:', chainId)
      showInfo('Please switch to Base network to create games')
    }
  }, [address, walletClient, isFullyConnected, isConnected, isConnecting, chainId, showInfo])

  // Contract service is initialized by useWalletConnection - no need to duplicate here

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedNFT) {
      showError('Please select an NFT')
      return
    }

    // Validate based on game mode
    if (gameMode === 'nft-vs-crypto') {
      if (!price || parseFloat(price) <= 0) {
        showError('Please enter a valid price greater than $0')
        return
      }
    } else if (gameMode === 'battle-royale') {
      if (!entryFee || parseFloat(entryFee) <= 0) {
        showError('Please enter a valid entry fee greater than $0')
        return
      }
      if (!serviceFee || parseFloat(serviceFee) <= 0) {
        showError('Please enter a valid service fee greater than $0')
        return
      }
    }
    
    // Check if wallet is on Base network
    if (chainId !== 8453) {
      showError('Please switch to Base network to create games')
      return
    }
    
    if (!contractService.isReady()) {
      console.error('❌ Contract service not ready:', {
        hasProvider: !!contractService.provider,
        hasSigner: !!contractService.signer,
        hasContract: !!contractService.contract,
        hasAccount: !!contractService.account
      })
      showError('Wallet not connected or contract service not initialized. Please try connecting your wallet again.')
      return
    }
    
    setLoading(true)
    setCurrentStep(1) // Start with step 1
    
    try {
      if (gameMode === 'battle-royale') {
        // Battle Royale creation flow
        showInfo('Creating Battle Royale game...')
        
        const battleRoyaleResponse = await fetch(getApiUrl('/battle-royale/create'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creator: address,
            nft_contract: selectedNFT.contractAddress,
            nft_token_id: selectedNFT.tokenId,
            nft_name: selectedNFT.name,
            nft_image: selectedNFT.image,
            nft_collection: selectedNFT.collection,
            entry_fee: parseFloat(entryFee),
            service_fee: parseFloat(serviceFee)
          })
        })
        
        if (!battleRoyaleResponse.ok) {
          const error = await battleRoyaleResponse.json()
          throw new Error(error.error || 'Failed to create Battle Royale game')
        }
        
        const battleRoyaleResult = await battleRoyaleResponse.json()
        console.log('✅ Battle Royale game created:', battleRoyaleResult)
        
        // Create on blockchain
        setCurrentStep(2)
        showInfo('Creating Battle Royale on blockchain...')
        
        const createResult = await contractService.createBattleRoyale(
          battleRoyaleResult.gameId,
          selectedNFT.contractAddress,
          selectedNFT.tokenId,
          Math.round(parseFloat(entryFee) * 1000000), // Convert to microdollars
          Math.round(parseFloat(serviceFee) * 1000000) // Convert to microdollars
        )
        
        if (!createResult.success) {
          throw new Error(createResult.error || 'Failed to create Battle Royale on blockchain')
        }
        
        setStepStatus({ approve: true, payFee: true, depositNFT: true })
        setCurrentStep(3)
        
        showSuccess('Battle Royale created successfully! Waiting for 8 players to join.')
        navigate(`/battle-royale/${battleRoyaleResult.gameId}`)
        
      } else {
        // Regular 1v1 game creation flow
        const gameId = `game_${Date.now()}_${Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('')}`
        
        // Step 1: Create listing in database first (no blockchain yet)
        showInfo('Creating listing...')
        const listingResponse = await fetch(getApiUrl('/listings'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creator: address,
            game_id: gameId,
            nft_contract: selectedNFT.contractAddress,
            nft_token_id: selectedNFT.tokenId,
            nft_name: selectedNFT.name,
            nft_image: selectedNFT.image,
            nft_collection: selectedNFT.collection,
            nft_chain: 'base',
            asking_price: parseFloat(price),
            coin_data: JSON.stringify({
              id: selectedCoin.id,
              type: selectedCoin.type,
              name: selectedCoin.name,
              headsImage: selectedCoin.headsImage,
              tailsImage: selectedCoin.tailsImage,
              isCustom: selectedCoin.isCustom,
              material: selectedMaterial
            }),
            game_type: gameMode
          })
        })
      
      if (!listingResponse.ok) {
        const error = await listingResponse.json()
        throw new Error(error.error || 'Failed to create listing')
      }
      
      const listingResult = await listingResponse.json()
      console.log('✅ Listing created:', listingResult)
      
      // Step 2: Create game on blockchain (approve + deposit NFT)
      setCurrentStep(1)
      showInfo('Approving and depositing NFT...')
      
      // Convert price to 6 decimal places (microdollars) for contract
      const priceInMicrodollars = Math.round(parseFloat(price) * 1000000)
      
      console.log(`💰 Game price: $${price} (${priceInMicrodollars} microdollars)`)
      console.log(`💸 Listing fee: $0.00 (free)`)
      
      const createResult = await contractService.createGame(
        gameId,
        selectedNFT.contractAddress,
        selectedNFT.tokenId,
        priceInMicrodollars, // Just the game price, no listing fee added
        0 // ETH payment
      )
      
      if (!createResult.success) {
        // If blockchain fails, we should probably delete the listing
        // For now, just throw error
        throw new Error(createResult.error || 'Failed to create game on blockchain')
      }
      
      // Mark all steps as completed since createGame now handles everything
      setStepStatus({ approve: true, payFee: true, depositNFT: true })
      setCurrentStep(3)
      
      // Step 4: Create game record in database with NFT deposit tracking
      showInfo('Registering game...')
      const gameResponse = await fetch(getApiUrl(`/games/${gameId}/create-from-listing`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listingResult.id,
          transactionHash: createResult.transactionHash,
          nftDeposited: true,
          nftDepositTime: new Date().toISOString(),
          nftDepositHash: createResult.transactionHash,
          nftDepositVerified: false,
          lastNftCheckTime: new Date().toISOString()
        })
      })
      
      if (!gameResponse.ok) {
        const errorData = await gameResponse.json().catch(() => ({}))
        console.error('Server error response:', errorData)
        throw new Error(errorData.error || 'Failed to register game')
      }
      
      // NFT deposit is already handled by createGame() - no need for separate confirmation
      
        showSuccess('Game created successfully! Your NFT is deposited and waiting for a challenger.')
        navigate(`/game/${gameId}`)
      }
      
    } catch (error) {
      console.error('Error creating game:', error)
      showError(error.message || 'Failed to create game')
      // Reset progress on error
      setCurrentStep(0)
      setStepStatus({ approve: false, payFee: false, depositNFT: false })
    } finally {
      setLoading(false)
    }
  }

  // Calculate progress percentage for the progress line
  const getProgressPercentage = () => {
    if (stepStatus.depositNFT) return 100
    if (stepStatus.payFee) return 66
    if (stepStatus.approve) return 33
    return 0
  }

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <ContentWrapper>
          <GlassCard>
            {/* GAME MODE SELECTOR - VERY FIRST THING */}
            <div style={{
              background: 'red',
              border: '5px solid yellow',
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <h2 style={{ color: 'yellow', fontSize: '2rem', margin: '0 0 1rem 0' }}>
                🎮 GAME MODE SELECTOR
              </h2>
              <select 
                value={gameMode} 
                onChange={(e) => {
                  setGameMode(e.target.value)
                  alert('GAME MODE CHANGED TO: ' + e.target.value)
                }}
                style={{ 
                  width: '100%', 
                  padding: '1.5rem',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  background: 'black',
                  border: '3px solid yellow',
                  borderRadius: '0.5rem',
                  color: 'yellow'
                }}
              >
                <option value="nft-vs-crypto">⚔️ 1v1 DUEL</option>
                <option value="battle-royale">🏆 BATTLE ROYALE</option>
              </select>
              
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'yellow',
                color: 'black',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                borderRadius: '0.5rem'
              }}>
                CURRENT MODE: {gameMode === 'battle-royale' ? '🏆 BATTLE ROYALE' : '⚔️ 1v1 DUEL'}
              </div>
            </div>

            <NeonText style={{ textAlign: 'center', marginBottom: '1rem' }}>
              {gameMode === 'battle-royale' ? 'Create Battle Royale' : 'Create Your Flip'}
            </NeonText>
            
            {/* Network Check */}
            {isConnected && chainId !== 8453 && (
              <div style={{
                background: 'rgba(255, 165, 0, 0.1)',
                border: '2px solid orange',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '2rem',
                textAlign: 'center'
              }}>
                <p style={{ color: 'orange', margin: '0 0 1rem 0' }}>
                  ⚠️ Please switch to Base network to create games
                </p>
                <Button onClick={switchToBase} style={{ background: 'orange' }}>
                  Switch to Base Network
                </Button>
              </div>
            )}
            
            {/* Enhanced Progress Indicator */}
            <ProgressContainer>
              <ProgressLine progress={getProgressPercentage()} />
              
              <ProgressStep>
                <StepCircle 
                  completed={stepStatus.approve}
                  active={currentStep === 1 && !stepStatus.approve}
                >
                  {stepStatus.approve ? '✓' : '1'}
                </StepCircle>
                                  <StepLabel 
                    completed={stepStatus.approve}
                    active={currentStep === 1 && !stepStatus.approve}
                  >
                    Approve & Deposit
                  </StepLabel>
              </ProgressStep>
              
              <ProgressStep>
                <StepCircle 
                  completed={stepStatus.payFee}
                  active={currentStep === 2 && !stepStatus.payFee}
                >
                  {stepStatus.payFee ? '✓' : '2'}
                </StepCircle>
                                  <StepLabel 
                    completed={stepStatus.payFee}
                    active={currentStep === 2 && !stepStatus.payFee}
                  >
                    Register Game
                  </StepLabel>
              </ProgressStep>
              
              <ProgressStep>
                <StepCircle 
                  completed={stepStatus.depositNFT}
                  active={currentStep === 3 && !stepStatus.depositNFT}
                >
                  {stepStatus.depositNFT ? '✓' : '3'}
                </StepCircle>
                                  <StepLabel 
                    completed={stepStatus.depositNFT}
                    active={currentStep === 3 && !stepStatus.depositNFT}
                  >
                    Complete Setup
                  </StepLabel>
              </ProgressStep>
            </ProgressContainer>

            <form onSubmit={handleSubmit}>
              {/* NFT Selection */}
              <FormGroup>
                <Label>Select Your NFT</Label>
                <NFTPreview onClick={() => setIsNFTSelectorOpen(true)}>
                  {selectedNFT ? (
                    <>
                      <img src={selectedNFT.image} alt={selectedNFT.name} />
                      <div>
                        <h4>{selectedNFT.name}</h4>
                        <p>{selectedNFT.collection}</p>
                      </div>
                    </>
                  ) : (
                    <PlaceholderText>Click to select an NFT</PlaceholderText>
                  )}
                </NFTPreview>
              </FormGroup>

              {/* GAME MODE SELECTION - VERY OBVIOUS */}
              <FormGroup style={{
                background: 'rgba(255, 20, 147, 0.15)',
                border: '3px solid #ff1493',
                borderRadius: '1rem',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <Label style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: 'bold', 
                  color: '#ff1493',
                  textAlign: 'center',
                  display: 'block',
                  marginBottom: '1rem',
                  textTransform: 'uppercase'
                }}>
                  🎮 CHOOSE GAME TYPE
                </Label>
                
                <Select 
                  value={gameMode} 
                  onChange={(e) => {
                    setGameMode(e.target.value)
                    console.log('🎮 GAME MODE SELECTED:', e.target.value)
                    alert('Game mode changed to: ' + e.target.value) // Temporary debug
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '1.2rem',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    background: '#000',
                    border: '3px solid #ff1493',
                    borderRadius: '0.8rem',
                    color: '#fff',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <option value="nft-vs-crypto" style={{ background: '#000', color: '#fff' }}>
                    ⚔️ 1v1 DUEL - Classic NFT vs Crypto Battle
                  </option>
                  <option value="battle-royale" style={{ background: '#000', color: '#fff' }}>
                    🏆 BATTLE ROYALE - 8-Player Tournament (NEW!)
                  </option>
                </Select>
                
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: gameMode === 'battle-royale' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(0, 191, 255, 0.1)',
                  border: `2px solid ${gameMode === 'battle-royale' ? '#00ff88' : '#00bfff'}`,
                  borderRadius: '0.5rem',
                  color: gameMode === 'battle-royale' ? '#00ff88' : '#00bfff',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  {gameMode === 'battle-royale' ? 
                    '🏆 BATTLE ROYALE SELECTED - 8 players will compete for your NFT!' :
                    '⚔️ 1V1 DUEL SELECTED - One challenger will face you!'
                  }
                </div>
              </FormGroup>





              {/* Price/Entry Fee based on game mode */}
              {gameMode === 'nft-vs-crypto' ? (
                <FormGroup>
                  <Label>Price (USD)</Label>
                  <Input
                    type="number"
                    placeholder="Enter price in USD (e.g., 0.50 for 50 cents)"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <small style={{ 
                    color: theme.colors.textSecondary, 
                    fontSize: '0.8rem',
                    marginTop: '0.5rem',
                    display: 'block'
                  }}>
                    💡 You can enter decimal prices (e.g., 0.30 for 50 cents). This is what Player 2 will pay to join your game.
                  </small>
                  {price && parseFloat(price) > 0 && (
                    <div style={{ 
                      background: 'rgba(0, 191, 255, 0.1)',
                      border: '1px solid rgba(0, 191, 255, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      marginTop: '0.5rem',
                      fontSize: '0.9rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span>Game Price (Player 2 pays):</span>
                        <span>${parseFloat(price).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </FormGroup>
              ) : (
                <FormGroup>
                  <Label>Battle Royale Fees</Label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <Label style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Entry Fee (USD)</Label>
                      <Input
                        type="number"
                        placeholder="5.00"
                        value={entryFee}
                        onChange={(e) => setEntryFee(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Service Fee (USD)</Label>
                      <Input
                        type="number"
                        placeholder="0.10"
                        value={serviceFee}
                        onChange={(e) => setServiceFee(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <small style={{ 
                    color: theme.colors.textSecondary, 
                    fontSize: '0.8rem',
                    marginTop: '0.5rem',
                    display: 'block'
                  }}>
                    💡 Each player pays Entry Fee + Service Fee to join. You get all entry fees (${(parseFloat(entryFee) * 8).toFixed(2)}) minus 3.5% platform fee. Service fee is just 10¢ per player!
                  </small>
                  {entryFee && serviceFee && (
                    <div style={{ 
                      background: 'rgba(255, 20, 147, 0.1)',
                      border: '1px solid rgba(255, 20, 147, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      marginTop: '0.5rem',
                      fontSize: '0.9rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span>Total per Player:</span>
                        <span>${(parseFloat(entryFee) + parseFloat(serviceFee)).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span>Total Entry Pool:</span>
                        <span>${(parseFloat(entryFee) * 8).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span>Your Earnings (after 3.5% fee):</span>
                        <span>${((parseFloat(entryFee) * 8) * 0.965).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </FormGroup>
              )}



              {/* Coin Selection - Only for 1v1 games */}
              {gameMode === 'nft-vs-crypto' && (
                <>
                  <FormGroup>
                    <CoinSelector
                      selectedCoin={selectedCoin}
                      onCoinSelect={(coin) => {
                        console.log('🪙 Coin selected in CreateFlip:', coin)
                        setSelectedCoin(coin)
                      }}
                    />
                  </FormGroup>

                  <FormGroup>
                    <CoinMaterialSelector
                      selectedMaterial={selectedMaterial}
                      onMaterialSelect={(material) => {
                        console.log('🪙 Material selected in CreateFlip:', material)
                        setSelectedMaterial(material)
                      }}
                    />
                  </FormGroup>
                </>
              )}

              {gameMode === 'battle-royale' && (
                <FormGroup>
                  <Label>Battle Royale Info</Label>
                  <div style={{ 
                    background: 'rgba(255, 20, 147, 0.1)',
                    border: '1px solid rgba(255, 20, 147, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    fontSize: '0.9rem'
                  }}>
                    <p style={{ margin: '0 0 1rem 0', color: theme.colors.textPrimary }}>
                      🏆 <strong>Battle Royale Rules:</strong>
                    </p>
                    <ul style={{ margin: '0', paddingLeft: '1.5rem', color: theme.colors.textSecondary }}>
                      <li>8 players compete in elimination rounds</li>
                      <li>Each round has a target result (heads or tails)</li>
                      <li>Players who don't match the target are eliminated</li>
                      <li>Last player standing wins your NFT</li>
                      <li>You receive all entry fees minus platform fee</li>
                      <li><strong>Players bring their own custom coins</strong> - no coin selection needed</li>
                    </ul>
                    <div style={{ 
                      marginTop: '1rem', 
                      padding: '0.75rem',
                      background: 'rgba(0, 255, 136, 0.1)',
                      border: '1px solid rgba(0, 255, 136, 0.3)',
                      borderRadius: '0.5rem'
                    }}>
                      <p style={{ margin: '0', color: theme.colors.textPrimary, fontWeight: 'bold' }}>
                        💎 <strong>Coin Customization:</strong>
                      </p>
                      <p style={{ margin: '0.5rem 0 0 0', color: theme.colors.textSecondary, fontSize: '0.8rem' }}>
                        Players can upload their own coin designs when they join the Battle Royale, 
                        making each game unique and personalized!
                      </p>
                    </div>
                  </div>
                </FormGroup>
              )}

              {/* Progress Indicator at Bottom */}
              <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
                <ProgressContainer>
                  <ProgressLine progress={getProgressPercentage()} />
                  
                  <ProgressStep>
                    <StepCircle 
                      completed={stepStatus.approve}
                      active={currentStep === 1 && !stepStatus.approve}
                    >
                      {stepStatus.approve ? '✓' : '1'}
                    </StepCircle>
                                      <StepLabel 
                    completed={stepStatus.approve}
                    active={currentStep === 1 && !stepStatus.approve}
                  >
                    Approve & Deposit
                  </StepLabel>
                  </ProgressStep>
                  
                  <ProgressStep>
                    <StepCircle 
                      completed={stepStatus.payFee}
                      active={currentStep === 2 && !stepStatus.payFee}
                    >
                      {stepStatus.payFee ? '✓' : '2'}
                    </StepCircle>
                                      <StepLabel 
                    completed={stepStatus.payFee}
                    active={currentStep === 2 && !stepStatus.payFee}
                  >
                    Register Game
                  </StepLabel>
                  </ProgressStep>
                  
                  <ProgressStep>
                    <StepCircle 
                      completed={stepStatus.depositNFT}
                      active={currentStep === 3 && !stepStatus.depositNFT}
                    >
                      {stepStatus.depositNFT ? '✓' : '3'}
                    </StepCircle>
                                      <StepLabel 
                    completed={stepStatus.depositNFT}
                    active={currentStep === 3 && !stepStatus.depositNFT}
                  >
                    Complete Setup
                  </StepLabel>
                  </ProgressStep>
                </ProgressContainer>
              </div>

              {/* Submit Button */}
              <SubmitButton type="submit" disabled={loading || !isFullyConnected}>
                {loading ? (
                  <>
                    <LoadingSpinner /> Creating {gameMode === 'battle-royale' ? 'Battle Royale' : 'Game'}...
                  </>
                ) : (
                  gameMode === 'battle-royale' ? 'Create Battle Royale' : 'Create Game'
                )}
              </SubmitButton>
            </form>
          </GlassCard>
        </ContentWrapper>

        <NFTSelector
          isOpen={isNFTSelectorOpen}
          onClose={() => setIsNFTSelectorOpen(false)}
          onSelect={(nft) => {
            console.log('🎨 NFT selected:', nft)
            setSelectedNFT(nft)
          }}
          nfts={nfts || []}
          loading={nftsLoading}
          selectedNFT={selectedNFT}
        />
      </Container>
    </ThemeProvider>
  )
}

export default CreateFlip 