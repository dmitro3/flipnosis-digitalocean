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
    id: 'poker-chip',
    name: 'Poker Chip',
    description: 'Balanced & Classic',
    edgeColor: '#228B22',
    physics: {
      weight: 'medium',
      speedMultiplier: 1.0,
      durationMultiplier: 1.0,
      wobbleIntensity: 1.0,
      predictability: 'medium'
    }
  })

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

  // Initialize contract service when wallet is ready
  useEffect(() => {
    const initializeContract = async () => {
      if (isFullyConnected && walletClient && address) {
        try {
          console.log('🔧 Initializing contract service...', {
            isFullyConnected,
            hasWalletClient: !!walletClient,
            address
          })
          
          const result = await contractService.initialize(walletClient, publicClient)
          if (!result.success) {
            console.error('Failed to initialize contract service:', result.error)
            showError('Failed to initialize contract service')
          } else {
            console.log('✅ Contract service initialized successfully')
          }
        } catch (error) {
          console.error('Error initializing contract service:', error)
          showError('Failed to initialize contract service')
        }
      }
    }
    
    // Add a small delay to ensure wallet is fully ready
    const timer = setTimeout(initializeContract, 1000)
    
    return () => clearTimeout(timer)
  }, [isFullyConnected, walletClient, address, publicClient, showError])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedNFT) {
      showError('Please select an NFT')
      return
    }
    if (!price || parseFloat(price) <= 0) {
      showError('Please enter a valid price')
      return
    }
    
    // Add minimum price validation (removed hardcoded $1 minimum)
    if (parseFloat(price) <= 0) {
      showError('Please enter a valid price greater than $0')
      return
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
      // Generate game ID upfront
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
          game_type: 'nft-vs-crypto' // Hardcoded since there's only one option
        })
      })
      
      if (!listingResponse.ok) {
        const error = await listingResponse.json()
        throw new Error(error.error || 'Failed to create listing')
      }
      
      const listingResult = await listingResponse.json()
      console.log('✅ Listing created:', listingResult)
      
      // Step 2: Check NFT approval first
      setCurrentStep(1)
      showInfo('Checking NFT approval...')
      const approvalResult = await contractService.approveNFT(
        selectedNFT.contractAddress,
        selectedNFT.tokenId
      )
      
      if (!approvalResult.success) {
        throw new Error(approvalResult.error || 'Failed to approve NFT')
      }
      
      // Mark step 1 as completed
      setStepStatus(prev => ({ ...prev, approve: true }))
      setCurrentStep(2)
      
      // Step 3: Pay fee and create game on blockchain
      showInfo('Paying listing fee and creating game on blockchain...')
      
      // Convert price to 6 decimal places (microdollars) for contract
      const priceInMicrodollars = Math.round(parseFloat(price) * 1000000)
      
      // Note: Listing fee is currently $0.00 in the contract, so no additional fee is added
      console.log(`💰 Game price: $${price} (${priceInMicrodollars} microdollars)`)
      console.log(`💸 Listing fee: $0.00 (free)`)
      
      const createResult = await contractService.payFeeAndCreateGame(
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
      
      // Mark step 2 as completed
      setStepStatus(prev => ({ ...prev, payFee: true }))
      setCurrentStep(3)
      
      // Step 4: Create game record in database
      showInfo('Registering game...')
      const gameResponse = await fetch(getApiUrl(`/games/${gameId}/create-from-listing`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listingResult.id,
          transactionHash: createResult.transactionHash
        })
      })
      
      if (!gameResponse.ok) {
        const errorData = await gameResponse.json().catch(() => ({}))
        console.error('Server error response:', errorData)
        throw new Error(errorData.error || 'Failed to register game')
      }
      
      // Add a small delay to ensure blockchain state is fully updated
      showInfo('Waiting for blockchain confirmation...')
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Step 5: Deposit NFT
      showInfo('Depositing NFT...')
      const depositResult = await contractService.depositNFT(
        gameId,
        selectedNFT.contractAddress,
        selectedNFT.tokenId
      )
      
      if (!depositResult.success) {
        throw new Error(depositResult.error || 'Failed to deposit NFT')
      }
      
      // Mark step 3 as completed
      setStepStatus(prev => ({ ...prev, depositNFT: true }))
      
      // Step 6: Confirm NFT deposit
      const confirmResponse = await fetch(getApiUrl(`/games/${gameId}/deposit-confirmed`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: address,
          assetType: 'nft',
          transactionHash: depositResult.transactionHash
        })
      })
      
      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm NFT deposit')
      }
      
      showSuccess('Game created successfully! Your NFT is deposited and waiting for a challenger.')
      navigate(`/game/${gameId}`)
      
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
            <NeonText style={{ textAlign: 'center', marginBottom: '2rem' }}>
              Create Your Flip
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
                  Approve NFT
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
                  Pay Fee & Create
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
                  Deposit NFT
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





              {/* Price */}
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
                  💡 You can enter decimal prices (e.g., 0.25 for 25 cents). This is what Player 2 will pay to join your game.
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



              {/* Coin Selection */}
              <FormGroup>
                <CoinSelector
                  selectedCoin={selectedCoin}
                  onCoinSelect={(coin) => {
                    console.log('🪙 Coin selected in CreateFlip:', coin)
                    setSelectedCoin(coin)
                  }}
                />
              </FormGroup>

              {/* Coin Material Selection */}
              <FormGroup>
                <CoinMaterialSelector
                  selectedMaterial={selectedMaterial}
                  onMaterialSelect={(material) => {
                    console.log('🪙 Material selected in CreateFlip:', material)
                    setSelectedMaterial(material)
                  }}
                />
              </FormGroup>

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
                      Approve NFT
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
                      Pay Fee & Create
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
                      Deposit NFT
                    </StepLabel>
                  </ProgressStep>
                </ProgressContainer>
              </div>

              {/* Submit Button */}
              <SubmitButton type="submit" disabled={loading || !isFullyConnected}>
                {loading ? (
                  <>
                    <LoadingSpinner /> Creating Game...
                  </>
                ) : (
                  'Pay Fee & Create Game'
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