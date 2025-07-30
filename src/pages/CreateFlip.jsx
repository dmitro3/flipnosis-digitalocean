import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import { useWalletConnection } from '../utils/useWalletConnection'
import contractService from '../services/ContractService'
import NFTSelector from '../components/NFTSelector'
import CoinSelector from '../components/CoinSelector'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import styled from '@emotion/styled'
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
  const { address, walletClient, nfts, loading: nftsLoading } = useWallet()
  
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

  // Initialize contract service when wallet is ready
  useEffect(() => {
    const initializeContract = async () => {
      if (isFullyConnected && walletClient) {
        try {
          const result = await contractService.initialize(walletClient)
          if (!result.success) {
            console.error('Failed to initialize contract service:', result.error)
            showError('Failed to initialize contract service')
          }
        } catch (error) {
          console.error('Error initializing contract service:', error)
          showError('Failed to initialize contract service')
        }
      }
    }
    
    initializeContract()
  }, [isFullyConnected, walletClient, showError])

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
    
    if (!contractService.isReady()) {
      showError('Wallet not connected or contract service not initialized.')
      return
    }
    
    setLoading(true)
    try {
      // Generate game ID upfront
      const gameId = `game_${Date.now()}_${Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('')}`
      
      // Step 1: Pay listing fee
      showInfo('Paying listing fee...')
      const feeResult = await contractService.payListingFee()
      if (!feeResult.success) throw new Error(feeResult.error)
      
      // Step 2: Create listing ONLY (not game)
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
          }
        })
      })
      
      if (!response.ok) throw new Error('Failed to create listing')
      const result = await response.json()
      
      // Step 3: Initialize game on blockchain
      showInfo('Initializing game on blockchain...')
      const initResponse = await fetch(getApiUrl(`/listings/${result.listingId}/initialize-blockchain`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId })
      })
      
      if (!initResponse.ok) throw new Error('Failed to initialize on blockchain')
      
      // Step 4: Deposit NFT
      showInfo('Depositing NFT...')
      const depositResult = await contractService.depositNFT(
        gameId,
        selectedNFT.contractAddress, 
        selectedNFT.tokenId
      )
      
      if (!depositResult.success) throw new Error(depositResult.error)
      
      // Step 5: Confirm NFT deposit
      const confirmResponse = await fetch(getApiUrl(`/games/${gameId}/deposit-confirmed`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: address,
          assetType: 'nft'
        })
      })
      
      if (!confirmResponse.ok) throw new Error('Failed to confirm NFT deposit')
      
      showSuccess('Listing created with NFT deposited! Ready for offers.')
      // Navigate to the listing, not the game
      navigate(`/game/${result.listingId}`)
    } catch (error) {
      console.error('Error creating listing:', error)
      showError(error.message || 'Failed to create listing')
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
              Create Your Flip
            </NeonText>

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
                    <LoadingSpinner /> Creating Flip...
                  </>
                ) : (
                  'Create Flip'
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