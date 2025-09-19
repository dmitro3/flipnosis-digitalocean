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

const ProgressStep = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 20, 147, 0.1);
  border: 1px solid rgba(255, 20, 147, 0.3);
  border-radius: 0.5rem;
  margin: 0.5rem 0;
  
  .step-number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: ${props => props.completed ? '#00ff88' : props.active ? '#ff1493' : '#666'};
    color: ${props => props.completed || props.active ? '#fff' : '#ccc'};
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }
  
  .step-text {
    flex: 1;
    color: ${props => props.completed ? '#00ff88' : props.active ? '#ff1493' : props.theme.colors.textSecondary};
    font-weight: ${props => props.active ? 'bold' : 'normal'};
  }
`

const CreateBattle = () => {
  const navigate = useNavigate()
  const { showSuccess, showError, showInfo } = useToast()
  const { address, walletClient, publicClient, nfts, loading: nftsLoading, chainId, switchToBase, isConnected, isConnecting } = useWallet()
  
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [entryFee, setEntryFee] = useState('5.00')
  const [serviceFee, setServiceFee] = useState('0.10')
  const [loading, setLoading] = useState(false)
  const [isNFTSelectorOpen, setIsNFTSelectorOpen] = useState(false)

  // Progress tracking
  const [currentStep, setCurrentStep] = useState(0)
  const [stepStatus, setStepStatus] = useState({
    create: false,
    approve: false,
    deposit: false
  })

  const isFullyConnected = address && walletClient

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
    if (!entryFee || parseFloat(entryFee) <= 0) {
      showError('Please enter a valid entry fee greater than $0')
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
      
      // Step 2: Approve and deposit NFT on blockchain
      setCurrentStep(2)
      showInfo('Approving and depositing NFT...')
      setStepStatus({ create: true, approve: true, deposit: false })
      
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
      
      // Step 3: Complete
      setCurrentStep(3)
      setStepStatus({ create: true, approve: true, deposit: true })
      
      showSuccess('🏆 Battle Royale created successfully! Waiting for 8 players to join.')
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
              <BattleSubtitle>8-player elimination tournament - Winner takes your NFT!</BattleSubtitle>
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
            
            {/* Progress Steps */}
            <div style={{ marginBottom: '2rem' }}>
              <ProgressStep completed={stepStatus.create} active={currentStep === 1}>
                <div className="step-number">{stepStatus.create ? '✓' : '1'}</div>
                <div className="step-text">Create Battle Royale Game</div>
              </ProgressStep>
              
              <ProgressStep completed={stepStatus.approve} active={currentStep === 2}>
                <div className="step-number">{stepStatus.approve ? '✓' : '2'}</div>
                <div className="step-text">Approve & Deposit NFT</div>
              </ProgressStep>
              
              <ProgressStep completed={stepStatus.deposit} active={currentStep === 3}>
                <div className="step-number">{stepStatus.deposit ? '✓' : '3'}</div>
                <div className="step-text">Battle Royale Ready!</div>
              </ProgressStep>
            </div>

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

              {/* Battle Royale Fees */}
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
                    <li>8 players compete in elimination rounds</li>
                    <li>Each round has a target result (heads or tails)</li>
                    <li>Players who don't match the target are eliminated</li>
                    <li>Last player standing wins your NFT</li>
                    <li>You receive all entry fees minus platform fee</li>
                    <li><strong>Players bring their own custom coins</strong></li>
                  </ul>
                </div>
              </FormGroup>

              {/* Submit Button */}
              <BattleSubmitButton type="submit" disabled={loading || !isFullyConnected}>
                {loading ? (
                  <>
                    <LoadingSpinner /> Creating Battle Royale...
                  </>
                ) : (
                  '🏆 Create Battle Royale'
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
