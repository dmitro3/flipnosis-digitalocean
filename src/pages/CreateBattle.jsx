import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeProvider } from '@emotion/react'
import styled from '@emotion/styled'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import contractService from '../services/ContractService'
import NFTSelector from '../components/NFTSelector'
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
  LoadingSpinner
} from '../styles/components'

// Battle Royale specific styled components
const BattleContainer = styled.div`
  background: rgba(0, 0, 20, 0.95);
  border: 2px solid rgba(255, 20, 147, 0.5);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.3);
  min-height: 80vh;
  padding: 2rem;
`

// Styled components for progress steps (matching CreateFlip)
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
        background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
        border-color: #ff1493;
        color: white;
        box-shadow: 0 0 20px rgba(255, 20, 147, 0.5);
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
      return `color: #ff1493;`
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
  background: linear-gradient(90deg, 
    ${props => props.progress >= 50 ? '#00ff88' : 'rgba(255, 255, 255, 0.3)'} 0%, 
    ${props => props.progress >= 100 ? '#00ff88' : 'rgba(255, 255, 255, 0.3)'} 100%
  );
  border-radius: 2px;
  z-index: 1;
`

const BattleHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.2) 0%, rgba(138, 43, 226, 0.2) 100%);
  border-radius: 1rem;
  border: 2px solid rgba(255, 20, 147, 0.3);
`

const BattleTitle = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 1rem 0;
`

const BattleSubtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 1.2rem;
  margin: 0;
`

const NFTPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px dashed ${props => props.theme.colors.neonPink};
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 20, 147, 0.05);

  &:hover {
    border-color: ${props => props.theme.colors.neonBlue};
    background: rgba(0, 191, 255, 0.05);
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

const BattleSubmitButton = styled(Button)`
  margin-top: 2rem;
  width: 100%;
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
  font-size: 1.2rem;
  padding: 1.2rem;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(255, 20, 147, 0.1);
  border: 2px solid rgba(255, 20, 147, 0.3);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
`

const ToggleLabel = styled.div`
  color: ${props => props.theme.colors.textPrimary};
  font-weight: 600;
  font-size: 1rem;
`

const ToggleDescription = styled.div`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.9rem;
  margin-top: 0.25rem;
`

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.2);
    transition: .4s;
    border-radius: 34px;
    border: 2px solid rgba(255, 20, 147, 0.5);
  }
  
  .slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
  
  input:checked + .slider {
    background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
    border-color: #00ff88;
  }
  
  input:checked + .slider:before {
    transform: translateX(26px);
  }
`


const CreateBattle = () => {
  const navigate = useNavigate()
  const { showSuccess, showError, showInfo } = useToast()
  const { address, walletClient, publicClient, nfts, loading: nftsLoading, chainId, switchToBase, isConnected, isConnecting } = useWallet()
  
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [nftPrice, setNftPrice] = useState('80.00')
  const [serviceFee, setServiceFee] = useState('0.10')
  const [loading, setLoading] = useState(false)
  const [isNFTSelectorOpen, setIsNFTSelectorOpen] = useState(false)
  const [creatorParticipates, setCreatorParticipates] = useState(false)

  // Progress tracking
  const [currentStep, setCurrentStep] = useState(0)
  const [stepStatus, setStepStatus] = useState({
    create: false,
    approve: false,
    deposit: false
  })

  const isFullyConnected = address && walletClient

  // Calculate progress percentage for progress bar
  const getProgressPercentage = () => {
    let completed = 0
    if (stepStatus.create) completed++
    if (stepStatus.approve) completed++
    if (stepStatus.deposit) completed++
    return (completed / 3) * 100
  }

  useEffect(() => {
    console.log('🏆 Battle Royale creation page loaded')
    console.log('🔍 Wallet status:', { address, isConnected, chainId })
  }, [address, isConnected, chainId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedNFT) {
      showError('Please select an NFT')
      return
    }
    if (!nftPrice || parseFloat(nftPrice) <= 0) {
      showError('Please enter a valid NFT price greater than $0')
      return
    }
    if (!serviceFee || parseFloat(serviceFee) <= 0) {
      showError('Please enter a valid service fee greater than $0')
      return
    }
    
    if (chainId !== 8453) {
      showError('Please switch to Base network to create Battle Royale games')
      return
    }
    
    if (!contractService.isReady()) {
      showError('Wallet not connected or contract service not initialized. Please try connecting your wallet again.')
      return
    }
    
    setLoading(true)
    setCurrentStep(1)
    
    try {
      // Step 1: Create Battle Royale in database
      showInfo('Creating Battle Royale game...')
      setStepStatus({ create: true, approve: false, deposit: false })
      
      // Calculate pricing based on creator participation
      const totalPlayers = creatorParticipates ? 4 : 4 // 4 players total
      const entryFeePerPlayer = parseFloat(nftPrice) / totalPlayers
      
      // Compute fee tier and minimums
      const isUnder20 = parseFloat(nftPrice) < 20
      const isUnder50 = parseFloat(nftPrice) < 50
      const serviceFeeUsd = isUnder50 ? 0.50 : 1.00
      const minUnder20Usd = 1.00
      
      // Fetch ETH price in USD (client-side) for fee conversions
      let ethPriceUSD = 0
      try {
        const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
        const j = await r.json()
        ethPriceUSD = j?.ethereum?.usd || 0
      } catch {}
      
      if (!ethPriceUSD || ethPriceUSD <= 0) {
        throw new Error('Failed to fetch ETH price. Please try again.')
      }
      
      // Convert USD fees to wei (round to 6 decimals first to avoid precision drift)
      const serviceFeeEth = Math.round((serviceFeeUsd / ethPriceUSD) * 1e6) / 1e6
      const minUnder20Eth = Math.round((minUnder20Usd / ethPriceUSD) * 1e6) / 1e6
      
      const serviceFeeWei = window.ethers ? window.ethers.parseEther(serviceFeeEth.toString()) : ethers.parseEther(serviceFeeEth.toString())
      const minUnder20Wei = window.ethers ? window.ethers.parseEther(minUnder20Eth.toString()) : ethers.parseEther(minUnder20Eth.toString())
      
      // Validate and sanitize data before sending
      const requestData = {
        creator: address,
        nft_contract: selectedNFT.contractAddress,
        nft_token_id: selectedNFT.tokenId,
        nft_name: selectedNFT.name || '',
        nft_image: selectedNFT.image || '',
        nft_collection: selectedNFT.collection || '',
        nft_chain: 'base', // Battle royale games are on Base
        entry_fee: entryFeePerPlayer, // Calculate per-player entry fee
        service_fee: parseFloat(serviceFee),
        creator_participates: creatorParticipates // Add creator participation flag
      }
      
      // Validate required fields
      if (!requestData.creator || !requestData.nft_contract || !requestData.nft_token_id) {
        throw new Error('Missing required NFT information')
      }
      
      // Validate numeric values
      if (isNaN(requestData.entry_fee) || isNaN(requestData.service_fee)) {
        throw new Error('Invalid price values')
      }
      
      console.log('Sending Battle Royale request:', requestData)
      
      const battleRoyaleResponse = await fetch(getApiUrl('/battle-royale/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })
      
      if (!battleRoyaleResponse.ok) {
        let errorMessage = 'Failed to create Battle Royale game'
        try {
          const error = await battleRoyaleResponse.json()
          errorMessage = error.error || error.message || errorMessage
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          errorMessage = `Server error: ${battleRoyaleResponse.status} ${battleRoyaleResponse.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const battleRoyaleResult = await battleRoyaleResponse.json()
      console.log('✅ Battle Royale game created:', battleRoyaleResult)
      
      // Step 2: Approve and deposit NFT on blockchain
      setCurrentStep(2)
      showInfo('Approving and depositing NFT...')
      setStepStatus({ create: true, approve: true, deposit: false })
      
      const createResult = await contractService.createBattleRoyale(
        battleRoyaleResult.gameId,
        selectedNFT.contractAddress,
        selectedNFT.tokenId,
        Math.round(entryFeePerPlayer * 1000000), // Convert to microdollars
        Number(serviceFeeWei),
        isUnder20,
        Number(minUnder20Wei)
      )
      
      if (!createResult.success) {
        throw new Error(createResult.error || 'Failed to create Battle Royale on blockchain')
      }
      
      // Step 3: Complete
      setCurrentStep(3)
      setStepStatus({ create: true, approve: true, deposit: true })
      
      showSuccess('🏆 Battle Royale created successfully! Opening lobby...')
      // Keep lobby at /battle-royale/:gameId; gameplay will redirect when active
      navigate(`/battle-royale/${battleRoyaleResult.gameId}`)
      
    } catch (error) {
      console.error('Error creating Battle Royale:', error)
      showError(error.message || 'Failed to create Battle Royale')
      setCurrentStep(0)
      setStepStatus({ create: false, approve: false, deposit: false })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <ContentWrapper>
          <BattleContainer>
            <BattleHeader>
              <BattleTitle>🏆 Create Battle Royale</BattleTitle>
              <BattleSubtitle>6-player elimination tournament</BattleSubtitle>
            </BattleHeader>
            
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
                  ⚠️ Please switch to Base network to create Battle Royale games
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
                  completed={stepStatus.create}
                  active={currentStep === 1 && !stepStatus.create}
                >
                  {stepStatus.create ? '✓' : '1'}
                </StepCircle>
                <StepLabel 
                  completed={stepStatus.create}
                  active={currentStep === 1 && !stepStatus.create}
                >
                  Create Battle Royale Game
                </StepLabel>
              </ProgressStep>
              
              <ProgressStep>
                <StepCircle 
                  completed={stepStatus.approve}
                  active={currentStep === 2 && !stepStatus.approve}
                >
                  {stepStatus.approve ? '✓' : '2'}
                </StepCircle>
                <StepLabel 
                  completed={stepStatus.approve}
                  active={currentStep === 2 && !stepStatus.approve}
                >
                  Approve & Deposit NFT
                </StepLabel>
              </ProgressStep>
              
              <ProgressStep>
                <StepCircle 
                  completed={stepStatus.deposit}
                  active={currentStep === 3 && !stepStatus.deposit}
                >
                  {stepStatus.deposit ? '✓' : '3'}
                </StepCircle>
                <StepLabel 
                  completed={stepStatus.deposit}
                  active={currentStep === 3 && !stepStatus.deposit}
                >
                  Battle Royale Ready!
                </StepLabel>
              </ProgressStep>
            </ProgressContainer>

            <form onSubmit={handleSubmit}>
              {/* NFT Selection */}
              <FormGroup>
                <Label>Select Your NFT Prize</Label>
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

              {/* Creator Participation Toggle */}
              <FormGroup>
                <Label>Creator Participation</Label>
                <ToggleContainer>
                  <div>
                    <ToggleLabel>Join the Battle Royale</ToggleLabel>
                    <ToggleDescription>
                      {creatorParticipates 
                        ? "You will participate in the game and can win your NFT back"
                        : "You will not participate - all 6 seats are open for other players"
                      }
                    </ToggleDescription>
                  </div>
                  <ToggleSwitch>
                    <input
                      type="checkbox"
                      checked={creatorParticipates}
                      onChange={(e) => setCreatorParticipates(e.target.checked)}
                    />
                    <span className="slider"></span>
                  </ToggleSwitch>
                </ToggleContainer>
              </FormGroup>

              {/* Battle Royale Fees */}
              <FormGroup>
                <Label>Battle Royale Fees</Label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <Label style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      NFT Price (USD) 
                      <span style={{ color: '#00ff88', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                        (enter the price you want for your NFT)
                      </span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="80.00"
                      value={nftPrice}
                      onChange={(e) => setNftPrice(e.target.value)}
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
                  fontSize: '0.7rem',
                  marginTop: '0.25rem',
                  display: 'block',
                  fontStyle: 'italic'
                }}>
                  ⚠️ All fees are approximate and will fluctuate based on gas fees and network conditions.
                </small>
                {nftPrice && serviceFee && (
                  <div style={{ 
                    background: 'rgba(255, 20, 147, 0.1)',
                    border: '1px solid rgba(255, 20, 147, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    marginTop: '0.5rem',
                    fontSize: '0.9rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>Per Player Entry:</span>
                      <span>${(parseFloat(nftPrice) / 4).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>Total Entry Pool:</span>
                      <span>${parseFloat(nftPrice).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>Your Earnings (after 3.5% fee):</span>
                      <span>${(parseFloat(nftPrice) * 0.965).toFixed(2)}</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginTop: '0.5rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid rgba(255, 20, 147, 0.3)',
                      color: creatorParticipates ? '#00ff88' : '#ff1493'
                    }}>
                      <span>Creator Status:</span>
                      <span>{creatorParticipates ? 'Participating' : 'Not Participating'}</span>
                    </div>
                  </div>
                )}
              </FormGroup>

              {/* Battle Royale Info */}
              <FormGroup>
                <Label>Battle Royale Rules</Label>
                <div style={{ 
                  background: 'rgba(255, 20, 147, 0.1)',
                  border: '1px solid rgba(255, 20, 147, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  fontSize: '0.9rem'
                }}>
                  <ul style={{ margin: '0', paddingLeft: '1.5rem', color: theme.colors.textSecondary }}>
                    <li><strong>You receive NFT price minus platform fees and gas fees</strong></li>
                    <li>4 players compete in elimination rounds</li>
                    <li>Last player standing wins your NFT</li>
                    <li>{creatorParticipates ? 'You will participate and can win your NFT back' : 'You will not participate - all seats are open for other players'}</li>
                  </ul>
                </div>
              </FormGroup>

              {/* Progress Indicator at Bottom */}
              <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
                <ProgressContainer>
                  <ProgressLine progress={getProgressPercentage()} />
                  
                  <ProgressStep>
                    <StepCircle 
                      completed={stepStatus.create}
                      active={currentStep === 1 && !stepStatus.create}
                    >
                      {stepStatus.create ? '✓' : '1'}
                    </StepCircle>
                    <StepLabel 
                      completed={stepStatus.create}
                      active={currentStep === 1 && !stepStatus.create}
                    >
                      Create Battle Royale Game
                    </StepLabel>
                  </ProgressStep>
                  
                  <ProgressStep>
                    <StepCircle 
                      completed={stepStatus.approve}
                      active={currentStep === 2 && !stepStatus.approve}
                    >
                      {stepStatus.approve ? '✓' : '2'}
                    </StepCircle>
                    <StepLabel 
                      completed={stepStatus.approve}
                      active={currentStep === 2 && !stepStatus.approve}
                    >
                      Approve & Deposit NFT
                    </StepLabel>
                  </ProgressStep>
                  
                  <ProgressStep>
                    <StepCircle 
                      completed={stepStatus.deposit}
                      active={currentStep === 3 && !stepStatus.deposit}
                    >
                      {stepStatus.deposit ? '✓' : '3'}
                    </StepCircle>
                    <StepLabel 
                      completed={stepStatus.deposit}
                      active={currentStep === 3 && !stepStatus.deposit}
                    >
                      Battle Royale Ready!
                    </StepLabel>
                  </ProgressStep>
                </ProgressContainer>
              </div>

              {/* Submit Button */}
              <BattleSubmitButton type="submit" disabled={loading || !isFullyConnected}>
                {loading ? (
                  <>
                    <LoadingSpinner /> Creating Battle Royale...
                  </>
                ) : (
                  '🏆 Create Flip'
                )}
              </BattleSubmitButton>
            </form>
          </BattleContainer>
        </ContentWrapper>

        <NFTSelector
          isOpen={isNFTSelectorOpen}
          onClose={() => setIsNFTSelectorOpen(false)}
          onSelect={(nft) => {
            console.log('🎨 NFT selected for Battle Royale:', nft)
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

export default CreateBattle
