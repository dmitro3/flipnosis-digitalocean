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

// Bright theme styled components
const BrightContainer = styled(Container)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 2rem 1rem;
`

const BrightGlassCard = styled(GlassCard)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  color: #2d3748;
  
  h1 {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 2.5rem;
    font-weight: bold;
    text-align: center;
    margin-bottom: 2rem;
    text-shadow: none;
  }
`

const BrightLabel = styled(Label)`
  color: #4a5568;
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
`

const BrightInput = styled(Input)`
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #e2e8f0;
  color: #2d3748;
  
  &:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &::placeholder {
    color: #a0aec0;
  }
`

const BrightButton = styled(Button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  font-weight: 600;
  font-size: 1.1rem;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    transform: none;
    cursor: not-allowed;
  }
`

// Styled components for NFT preview
const NFTPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border: 2px dashed #667eea;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(102, 126, 234, 0.05);

  &:hover {
    border-color: #764ba2;
    background: rgba(118, 75, 162, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
  }

  img {
    width: 70px;
    height: 70px;
    border-radius: 0.75rem;
    object-fit: cover;
    border: 2px solid #e2e8f0;
  }

  div {
    flex: 1;
    
    h4 {
      color: #2d3748;
      margin: 0 0 0.25rem 0;
      font-size: 1.1rem;
      font-weight: 600;
    }
    
    p {
      color: #4a5568;
      margin: 0;
      font-size: 0.95rem;
    }
  }
`

const PlaceholderText = styled.div`
  color: #a0aec0;
  font-style: italic;
  text-align: center;
  width: 100%;
  font-size: 1rem;
`

const SubmitButton = styled(BrightButton)`
  margin-top: 2rem;
  width: 100%;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
  
  &:hover {
    box-shadow: 0 8px 25px rgba(72, 187, 120, 0.4);
  }
  
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
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.3rem;
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
  border: 3px solid;
  
  ${props => {
    if (props.completed) {
      return `
        background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
        border-color: #48bb78;
        color: white;
        box-shadow: 0 0 20px rgba(72, 187, 120, 0.5);
      `
    } else if (props.active) {
      return `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-color: #667eea;
        color: white;
        box-shadow: 0 0 20px rgba(102, 126, 234, 0.5);
      `
    } else {
      return `
        background: rgba(255, 255, 255, 0.8);
        border-color: #e2e8f0;
        color: #a0aec0;
      `
    }
  }}
`

const StepLabel = styled.div`
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  
  ${props => {
    if (props.completed) {
      return `color: #48bb78;`
    } else if (props.active) {
      return `color: #667eea;`
    } else {
      return `color: #a0aec0;`
    }
  }}
`

const ProgressLine = styled.div`
  position: absolute;
  top: 30px;
  left: 30px;
  right: 30px;
  height: 4px;
  background: rgba(226, 232, 240, 0.8);
  z-index: 1;
  border-radius: 2px;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: linear-gradient(90deg, #48bb78 0%, #38a169 100%);
    transition: width 0.5s ease;
    width: ${props => props.progress}%;
    border-radius: 2px;
  }
`

const InfoBox = styled.div`
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-top: 0.75rem;
  font-size: 0.9rem;
  color: #4a5568;
`

const PriceDisplay = styled.div`
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-top: 0.75rem;
  font-size: 0.95rem;
  color: #2d3748;
  
  div {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.25rem;
    font-weight: 500;
    
    &:last-child {
      margin-bottom: 0;
    }
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
  
  // Debug wallet connection status
  useEffect(() => {
    console.log('🔍 Wallet connection status:', {
      address,
      hasWalletClient: !!walletClient,
      isFullyConnected,
      isConnected,
      isConnecting,
      chainId
    })
    
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
          listingId: listingResult.listingId,
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
      
      // Award XP for creating a game
      try {
        const xpResponse = await fetch(`/api/users/${address}/award-xp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: 500,
            reason: 'Game Creation'
          })
        });
        
        if (xpResponse.ok) {
          const xpResult = await xpResponse.json();
          showSuccess(`Game created successfully! Your NFT is deposited and waiting for a challenger. +${xpResult.xpGained} XP earned!`);
        } else {
          showSuccess('Game created successfully! Your NFT is deposited and waiting for a challenger.');
        }
      } catch (xpError) {
        console.error('Failed to award XP:', xpError);
        showSuccess('Game created successfully! Your NFT is deposited and waiting for a challenger.');
      }
      
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
      <BrightContainer>
        <ContentWrapper>
          <BrightGlassCard>
                          <h1>Create Your Flip</h1>
            
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
                <BrightButton onClick={switchToBase} style={{ background: 'linear-gradient(135deg, #f6ad55 0%, #ed8936 100%)' }}>
                  Switch to Base Network
                </BrightButton>
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
                <BrightLabel>Select Your NFT</BrightLabel>
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
                <BrightLabel>Price (USD)</BrightLabel>
                <BrightInput
                  type="number"
                  placeholder="Enter price in USD (e.g., 0.50 for 50 cents)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <InfoBox>
                  💡 You can enter decimal prices (e.g., 0.25 for 25 cents). This is what Player 2 will pay to join your game.
                </InfoBox>
                {price && parseFloat(price) > 0 && (
                  <PriceDisplay>
                    <div>
                      <span>Game Price (Player 2 pays):</span>
                      <span>${parseFloat(price).toFixed(2)}</span>
                    </div>
                  </PriceDisplay>
                )}
              </FormGroup>



              {/* Coin Selection */}
              <FormGroup>
                <BrightLabel>Select Your Coin Design</BrightLabel>
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
                <BrightLabel>Select Your Coin Material</BrightLabel>
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
          </BrightGlassCard>
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
      </BrightContainer>
    </ThemeProvider>
  )
}

export default CreateFlip 