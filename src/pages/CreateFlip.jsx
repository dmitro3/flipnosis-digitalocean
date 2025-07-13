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
import { API_CONFIG } from '../config/api'
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
  const { isConnected, address, nfts, loadNFTs, chainId, walletClient, publicClient } = useWallet()
  const { isFullyConnected, connectionError } = useWalletConnection()
  
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [gameType, setGameType] = useState('nft-vs-crypto')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [isNFTSelectorOpen, setIsNFTSelectorOpen] = useState(false)
  const [nftsLoading, setNftsLoading] = useState(false)
  const [selectedCoin, setSelectedCoin] = useState({
    id: 'plain',
    type: 'default',
    name: 'Classic',
    headsImage: '/coins/plainh.png',
    tailsImage: '/coins/plaint.png'
  })
  const [acceptsOffers, setAcceptsOffers] = useState(true)

  // Initialize contract service when wallet is connected
  useEffect(() => {
    const initializeService = async () => {
      if (isFullyConnected && chainId && walletClient && publicClient) {
        try {
          console.log('Initializing contract service...')
          await contractService.initializeClients(chainId, walletClient)
          console.log('✅ Contract service initialized')
        } catch (error) {
          console.error('Failed to initialize contract service:', error)
          showError('Failed to initialize. Please refresh and try again.')
        }
      }
    }

    initializeService()
  }, [isFullyConnected, chainId, walletClient, publicClient])

  // Load NFTs when component mounts
  useEffect(() => {
    if (isConnected && (!nfts || nfts.length === 0)) {
      loadUserNFTs()
    }
  }, [isConnected])

  const loadUserNFTs = async () => {
    try {
      setNftsLoading(true)
      await loadNFTs()
    } catch (error) {
      console.error('Error loading NFTs:', error)
      showError('Failed to load NFTs')
    } finally {
      setNftsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    console.log('🔄 Submit triggered with data:', {
      isFullyConnected,
      address,
      selectedNFT,
      price,
      selectedCoin
    })
    
    if (!isFullyConnected) {
      showError('Please connect your wallet first')
      return
    }

    if (!address) {
      showError('Wallet address not found. Please reconnect your wallet.')
      return
    }

    if (!selectedNFT) {
      showError('Please select an NFT')
      return
    }

    if (!price || parseFloat(price) <= 0) {
      showError('Please enter a valid price')
      return
    }

    setLoading(true)

    try {
      // Create a listing instead of a game (no blockchain interaction yet)
      showInfo('Creating listing...')
      
      // Prepare coin data
      const coinData = {
        coinType: selectedCoin.type,
        headsImage: selectedCoin.headsImage,
        tailsImage: selectedCoin.tailsImage,
        isCustom: selectedCoin.type === 'custom'
      }
      
      // Create listing via API
      const baseUrl = API_CONFIG.BASE_URL
      
      const listingData = {
        creator: address,
        nft_contract: selectedNFT.contractAddress,
        nft_token_id: selectedNFT.tokenId,
        nft_name: selectedNFT.name,
        nft_image: selectedNFT.image,
        nft_collection: selectedNFT.collection,
        nft_chain: selectedNFT.chain || 'base',
        asking_price: parseFloat(price),
        accepts_offers: acceptsOffers,
        min_offer_price: acceptsOffers ? parseFloat(price) * 0.8 : parseFloat(price),
        coin: coinData
      }
      
      console.log('📤 Sending listing data:', listingData)
      console.log('🌐 API URL:', `${baseUrl}/api/listings`)
      
      const response = await fetch(`${baseUrl}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(listingData)
      })

      console.log('📥 Response status:', response.status)
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('✅ Listing created successfully:', result)
      
      showSuccess('Listing created successfully! You can manage it from your dashboard.')
      navigate('/dashboard')
      
    } catch (error) {
      console.error('❌ Failed to create listing:', error)
      showError(error.message)
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
                    <LoadingSpinner /> Creating Listing...
                  </>
                ) : (
                  'Create Listing'
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