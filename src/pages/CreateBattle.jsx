import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
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
  min-height: 70vh;
  max-height: 85vh;
  padding: 1.5rem;
`

// New 4-box layout components
const FourBoxGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 1.5rem;
  margin-top: 1.5rem;
  max-height: 50vh;
`

const Box = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 20, 147, 0.3);
  border-radius: 1rem;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  min-height: 200px;
  max-height: 250px;
  
  &:hover {
    border-color: rgba(255, 20, 147, 0.6);
    box-shadow: 0 0 20px rgba(255, 20, 147, 0.2);
  }
`

const BoxTitle = styled.h3`
  color: ${props => props.theme.colors.textPrimary};
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0 0 0.8rem 0;
  text-align: center;
`

// NFT Upload Box
const NFTUploadArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
`

const SquareUploadZone = styled.div`
  width: 100px;
  height: 100px;
  border: 2px dashed ${props => props.theme.colors.neonPink};
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 20, 147, 0.05);
  margin-bottom: 0.8rem;
  
  &:hover {
    border-color: ${props => props.theme.colors.neonBlue};
    background: rgba(0, 191, 255, 0.05);
  }
`

const NFTPreviewSquare = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 0.5rem;
  object-fit: cover;
  border: 2px solid ${props => props.theme.colors.neonPink};
`

// Pricing Box
const PricingContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`

const PriceInput = styled(Input)`
  margin-bottom: 0.8rem;
  text-align: center;
  font-size: 1.2rem;
`

const JoinButton = styled(Button)`
  background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
  margin-top: 0.8rem;
  width: 100%;
  font-size: 1.1rem;
  padding: 0.8rem;
  
  &:hover {
    background: linear-gradient(135deg, #00cc6a 0%, #00aa55 100%);
  }
`

// Room Selection Box
const RoomGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
  flex: 1;
`

const RoomOption = styled.div`
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 60px;
  
  &:hover {
    border-color: ${props => props.theme.colors.neonPink};
    background: rgba(255, 20, 147, 0.1);
  }
`

// Progress Box
const ProgressBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
`

const CompactProgressContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  position: relative;
  width: 100%;
  max-width: 280px;
`

const CompactStepCircle = styled.div`
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  border: 2px solid;
  
  ${props => {
    if (props.completed) {
      return `
        background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
        border-color: #00ff88;
        color: white;
        box-shadow: 0 0 15px rgba(0, 255, 136, 0.5);
      `
    } else if (props.active) {
      return `
        background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
        border-color: #ff1493;
        color: white;
        box-shadow: 0 0 15px rgba(255, 20, 147, 0.5);
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

const CompactProgressLine = styled.div`
  position: absolute;
  top: 17px;
  left: 17px;
  right: 17px;
  height: 2px;
  background: linear-gradient(90deg, 
    ${props => props.progress >= 50 ? '#00ff88' : 'rgba(255, 255, 255, 0.3)'} 0%, 
    ${props => props.progress >= 100 ? '#00ff88' : 'rgba(255, 255, 255, 0.3)'} 100%
  );
  border-radius: 1px;
  z-index: 1;
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
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.2) 0%, rgba(138, 43, 226, 0.2) 100%);
  border-radius: 1rem;
  border: 2px solid rgba(255, 20, 147, 0.3);
`

const BattleTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 0.8rem 0;
`

const BattleSubtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 1.3rem;
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
  margin-top: 1.5rem;
  width: 100%;
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
  font-size: 1.3rem;
  padding: 1rem;
  
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
  const [totalEth, setTotalEth] = useState('0.10')
  const [loading, setLoading] = useState(false)
  const [isNFTSelectorOpen, setIsNFTSelectorOpen] = useState(false)
  const [creatorParticipates, setCreatorParticipates] = useState(false)
  const [ethPriceUSD, setEthPriceUSD] = useState(0)
  const [selectedRoom, setSelectedRoom] = useState(null)

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

  // Fetch ETH price for USD display
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const price = await contractService.getETHPriceUSD()
        setEthPriceUSD(price)
      } catch (error) {
        console.warn('Failed to fetch ETH price for display:', error)
      }
    }
    fetchPrice()
    const interval = setInterval(fetchPrice, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedNFT) {
      showError('Please select an NFT')
      return
    }
    if (!totalEth || parseFloat(totalEth) <= 0) {
      showError('Please enter a valid total price in ETH (> 0)')
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
      
      // Calculate pricing in ETH
      const totalEthNum = Math.round(parseFloat(totalEth) * 1e6) / 1e6
      // If creator participates, they take 1 seat, so only 3 other players pay
      const payingPlayers = creatorParticipates ? 3 : 4
      const perPlayerEth = Math.round((totalEthNum / 4) * 1e6) / 1e6
      const entryFeeWei = ethers.parseEther(perPlayerEth.toString())

      // Percent fee: 5% of per-player entry (in wei)
      const percentFeeWei = (entryFeeWei * 5n) / 100n

      // Flat tier: $0.50 if total < $50, else $1.00 — converted once to ETH
      let ethPriceUSD = 0
      try {
        ethPriceUSD = await contractService.getETHPriceUSD()
      } catch {
        ethPriceUSD = 0
      }
      if (!ethPriceUSD || ethPriceUSD <= 0) {
        throw new Error('Failed to fetch price for fee calculation. Please try again.')
      }
      const totalUsd = totalEthNum * ethPriceUSD
      const flatUsd = totalUsd < 50 ? 0.50 : 1.00
      const flatEth = Math.round((flatUsd / ethPriceUSD) * 1e6) / 1e6
      const flatFeeWei = ethers.parseEther(flatEth.toString())

      const serviceFeeWei = percentFeeWei + flatFeeWei

      // For the withdraw-minimum path we are not using under-$20 anymore
      const isUnder20 = false
      const minUnder20Wei = 0n
      
      // Validate and sanitize data before sending
      const requestData = {
        creator: address,
        nft_contract: selectedNFT.contractAddress,
        nft_token_id: selectedNFT.tokenId,
        nft_name: selectedNFT.name || '',
        nft_image: selectedNFT.image || '',
        nft_collection: selectedNFT.collection || '',
        nft_chain: 'base', // Battle royale games are on Base
        entry_fee: perPlayerEth, // store for display if server desires
        service_fee: ethers.formatEther(serviceFeeWei),
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
        entryFeeWei.toString(),
        serviceFeeWei.toString(),
        isUnder20,
        minUnder20Wei.toString()
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
              <BattleTitle>Create Flip</BattleTitle>
              <BattleSubtitle>4-player elimination tournament</BattleSubtitle>
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
            
            <form onSubmit={handleSubmit}>
              <FourBoxGrid>
                {/* Top Left: Load Your NFT */}
                <Box>
                  <BoxTitle>Load Your NFT</BoxTitle>
                  <NFTUploadArea>
                    {selectedNFT ? (
                      <NFTPreviewSquare 
                        src={selectedNFT.image} 
                        alt={selectedNFT.name}
                        onClick={() => setIsNFTSelectorOpen(true)}
                      />
                    ) : (
                      <SquareUploadZone onClick={() => setIsNFTSelectorOpen(true)}>
                        <div style={{ textAlign: 'center', color: theme.colors.textSecondary }}>
                          <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>📷</div>
                          <div style={{ fontSize: '1.1rem' }}>Click to upload NFT</div>
                        </div>
                      </SquareUploadZone>
                    )}
                    {selectedNFT && (
                      <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                        <div style={{ color: theme.colors.textPrimary, fontWeight: '600', fontSize: '1.1rem' }}>
                          {selectedNFT.name}
                        </div>
                        <div style={{ color: theme.colors.textSecondary, fontSize: '1rem' }}>
                          {selectedNFT.collection}
                        </div>
                      </div>
                    )}
                  </NFTUploadArea>
                </Box>

                {/* Top Right: Choose Your Room */}
                <Box>
                  <BoxTitle>Choose Your Room</BoxTitle>
                  <RoomGrid>
                    {[1, 2, 3, 4].map((roomNum) => (
                      <RoomOption 
                        key={roomNum}
                        onClick={() => setSelectedRoom(roomNum)}
                        style={{
                          borderColor: selectedRoom === roomNum ? theme.colors.neonPink : 'rgba(255, 255, 255, 0.3)',
                          background: selectedRoom === roomNum ? 'rgba(255, 20, 147, 0.1)' : 'rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <div style={{ 
                          color: theme.colors.textSecondary, 
                          fontSize: '1.8rem',
                          textAlign: 'center'
                        }}>
                          🏠
                        </div>
                      </RoomOption>
                    ))}
                  </RoomGrid>
                </Box>

                {/* Bottom Left: Flip Price */}
                <Box>
                  <BoxTitle>Flip Price</BoxTitle>
                  <PricingContainer>
                    <div style={{ marginBottom: '1rem' }}>
                      <Label style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                        Total Price (ETH)
                      </Label>
                      <PriceInput
                        type="text"
                        placeholder="1.00"
                        value={totalEth}
                        onChange={(e) => setTotalEth(e.target.value)}
                      />
                      {ethPriceUSD > 0 && (
                        <div style={{ 
                          color: theme.colors.textSecondary, 
                          fontSize: '1rem', 
                          marginTop: '0.25rem',
                          textAlign: 'center'
                        }}>
                          ≈ ${(parseFloat(totalEth || '0') * ethPriceUSD).toFixed(2)} USD
                        </div>
                      )}
                    </div>

                    {totalEth && (
                      <div style={{ 
                        background: 'rgba(255, 20, 147, 0.1)',
                        border: '1px solid rgba(255, 20, 147, 0.3)',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        fontSize: '0.9rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span>Per Player Entry:</span>
                          <span>{(() => {
                            const n = parseFloat(totalEth || '0')
                            if (!n || n <= 0) return '0.000000'
                            return (n / 4).toFixed(6)
                          })()} ETH</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span>Total Pool:</span>
                          <span>{parseFloat(totalEth || '0').toFixed(6)} ETH</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00ff88' }}>
                          <span>Your Earnings:</span>
                          <span>{(() => {
                            const n = parseFloat(totalEth || '0')
                            if (!n) return '0.000000 ETH'
                            return `${(n * 0.95).toFixed(6)} ETH`
                          })()}</span>
                        </div>
                      </div>
                    )}

                    <JoinButton type="button" disabled={!selectedNFT || !totalEth}>
                      Join (4 Players)
                    </JoinButton>
                  </PricingContainer>
                </Box>

                {/* Bottom Right: Progress & Create Button */}
                <Box>
                  <BoxTitle>Progress</BoxTitle>
                  <ProgressBox>
                    <CompactProgressContainer>
                      <CompactProgressLine progress={getProgressPercentage()} />
                      
                      <CompactStepCircle 
                        completed={stepStatus.create}
                        active={currentStep === 1 && !stepStatus.create}
                      >
                        {stepStatus.create ? '✓' : '1'}
                      </CompactStepCircle>
                      
                      <CompactStepCircle 
                        completed={stepStatus.approve}
                        active={currentStep === 2 && !stepStatus.approve}
                      >
                        {stepStatus.approve ? '✓' : '2'}
                      </CompactStepCircle>
                      
                      <CompactStepCircle 
                        completed={stepStatus.deposit}
                        active={currentStep === 3 && !stepStatus.deposit}
                      >
                        {stepStatus.deposit ? '✓' : '3'}
                      </CompactStepCircle>
                    </CompactProgressContainer>

                    <BattleSubmitButton type="submit" disabled={loading || !isFullyConnected}>
                      {loading ? (
                        <>
                          <LoadingSpinner /> Creating Flip...
                        </>
                      ) : (
                        'Create Flip'
                      )}
                    </BattleSubmitButton>
                  </ProgressBox>
                </Box>
              </FourBoxGrid>
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
