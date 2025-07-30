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

const CreateFlip = () => {
  const navigate = useNavigate()
  const { showSuccess, showError, showInfo } = useToast()
  const { address, walletClient, nfts, loading: nftsLoading, chainId, switchToBase } = useWallet()
  
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [gameType, setGameType] = useState('nft-vs-crypto')
  const [acceptsOffers, setAcceptsOffers] = useState(true)
  const [preloadNFT, setPreloadNFT] = useState(false)
  const [isNFTSelectorOpen, setIsNFTSelectorOpen] = useState(false)
  const [selectedCoin, setSelectedCoin] = useState({
    type: 'default',
    headsImage: '/coins/plainh.png',
    tailsImage: '/coins/plaint.png',
    isCustom: false
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
          
          const result = await contractService.initialize(walletClient)
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
  }, [isFullyConnected, walletClient, address, showError])

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
    try {
      // Generate game ID upfront
      const gameId = `game_${Date.now()}_${Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('')}`
      
      // Step 1: Pay fee to create game (combines listing fee + game creation)
      showInfo('Paying fee and creating game...')
      
      console.log('🎮 Creating game with params:', {
        gameId,
        nftContract: selectedNFT.contractAddress,
        tokenId: selectedNFT.tokenId,
        price: parseFloat(price),
        paymentToken: 0
      })
      
      const createResult = await contractService.payFeeAndCreateGame(
        gameId,
        selectedNFT.contractAddress,
        selectedNFT.tokenId,
        parseFloat(price),
        0 // PaymentToken.ETH
      )
      
      console.log('📝 Create result:', createResult)
      
      if (!createResult.success) {
        console.error('❌ Failed to create game:', createResult.error)
        throw new Error(`Failed to create game: ${createResult.error}`)
      }
      
      // Step 2: Create listing in database
      showInfo('Creating listing...')
      const response = await fetch(getApiUrl('/listings'), {
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
          coin_data: {
            type: selectedCoin.type,
            headsImage: selectedCoin.headsImage,
            tailsImage: selectedCoin.tailsImage,
            isCustom: selectedCoin.isCustom
          },
          contract_game_id: gameId, // Already created on blockchain
          transaction_hash: createResult.transactionHash
        })
      })
      
      if (!response.ok) throw new Error('Failed to create listing')
      const result = await response.json()
      
      // Step 3: Load NFT (deposit NFT)
      showInfo('Loading NFT...')
      const depositResult = await contractService.depositNFT(
        gameId,
        selectedNFT.contractAddress, 
        selectedNFT.tokenId
      )
      
      if (!depositResult.success) throw new Error(depositResult.error)
      
      // Step 4: Confirm NFT deposit
      const confirmResponse = await fetch(getApiUrl(`/games/${gameId}/deposit-confirmed`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: address,
          assetType: 'nft'
        })
      })
      
      if (!confirmResponse.ok) throw new Error('Failed to confirm NFT deposit')
      
      showSuccess('Game created and NFT loaded! Ready for offers.')
      // Navigate to the listing
      navigate(`/game/${result.listingId}`)
    } catch (error) {
      console.error('Error creating game:', error)
      showError(error.message || 'Failed to create game')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <ContentWrapper>
          <GlassCard>
            <NeonText style={{ textAlign: 'center', marginBottom: '2rem' }}>
              Create Your Flip (2-Step Process)
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
            
            {/* Step Indicator */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: '2rem',
              gap: '1rem'
            }}>
              <div style={{
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #00bfff 0%, #ff1493 100%)',
                borderRadius: '0.5rem',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                Step 1: Pay Fee & Create Game
              </div>
              <div style={{
                padding: '0.5rem 1rem',
                background: 'rgba(0, 191, 255, 0.2)',
                borderRadius: '0.5rem',
                color: theme.colors.textSecondary,
                fontSize: '0.9rem'
              }}>
                Step 2: Load NFT
              </div>
            </div>

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



              {/* Game Type */}
              <FormGroup>
                <Label>Game Type</Label>
                <Select value={gameType} onChange={(e) => setGameType(e.target.value)}>
                  <option value="nft-vs-crypto">NFT vs Crypto</option>
                  <option value="nft-vs-nft">NFT vs NFT</option>
                </Select>
              </FormGroup>

              {/* Price */}
              <FormGroup>
                <Label>Price (USD)</Label>
                <Input
                  type="number"
                  placeholder="Enter price in USD"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </FormGroup>

              {/* Accepts Offers Toggle */}
              <FormGroup>
                <Label>Accept Offers</Label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input
                    type="checkbox"
                    id="acceptsOffers"
                    checked={acceptsOffers}
                    onChange={(e) => setAcceptsOffers(e.target.checked)}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer'
                    }}
                  />
                  <label 
                    htmlFor="acceptsOffers" 
                    style={{ 
                      cursor: 'pointer',
                      color: theme.colors.textSecondary,
                      fontSize: '0.9rem'
                    }}
                  >
                    Allow players to make offers below asking price
                  </label>
                </div>
              </FormGroup>

              {/* Coin Selection */}
              <FormGroup>
                <Label>Select Your Coin</Label>
                <CoinSelector
                  selectedCoin={selectedCoin}
                  onCoinSelect={(coin) => {
                    console.log('🪙 Coin selected in CreateFlip:', coin)
                    setSelectedCoin(coin)
                  }}
                />
              </FormGroup>

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