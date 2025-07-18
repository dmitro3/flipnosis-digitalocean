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
      if (!isFullyConnected || !chainId || !walletClient || !publicClient) {
        console.log('⚠️ Wallet not fully connected, skipping contract initialization')
        return
      }
      
      try {
        console.log('🔧 Initializing contract service...')
        await contractService.initializeClients(chainId, walletClient)
        console.log('✅ Contract service initialized successfully')
      } catch (error) {
        console.error('❌ Failed to initialize contract service:', error)
        showError('Failed to initialize smart contract. Please refresh and try again.')
      }
    }

    initializeService()
  }, [isFullyConnected, chainId, walletClient, publicClient, showError])

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
    
    if (!selectedNFT) {
      showError('Please select an NFT')
      return
    }
    
    if (!price || parseFloat(price) <= 0) {
      showError('Please enter a valid price')
      return
    }
    
    if (!isFullyConnected || !walletClient) {
      showError('Please connect your wallet')
      return
    }
    
    if (!contractService.isInitialized()) {
      showError('Smart contract not connected. Please refresh and try again.')
      return
    }
    
    setLoading(true)
    
    try {
      // Step 1: Create the listing in the database first
      showInfo('Creating listing...')
      
      const listingData = {
        creator: address,
        nft_contract: selectedNFT.contractAddress,
        nft_token_id: selectedNFT.tokenId,
        nft_name: selectedNFT.name,
        nft_image: selectedNFT.image,
        nft_collection: selectedNFT.collection,
        nft_chain: 'base',
        asking_price: parseFloat(price),
        accepts_offers: acceptsOffers,
        min_offer_price: acceptsOffers ? parseFloat(price) * 0.8 : parseFloat(price),
        coin: {
          type: selectedCoin?.type || 'default',
          headsImage: selectedCoin?.headsImage || '',
          tailsImage: selectedCoin?.tailsImage || '',
          isCustom: selectedCoin?.isCustom || false
        }
      }
      
      console.log('📤 CreateFlip: Creating listing with data:', listingData)
      
      const listingResponse = await fetch(`${getApiUrl()}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(listingData)
      })
      
      if (!listingResponse.ok) {
        let errorMessage = `HTTP ${listingResponse.status}: ${listingResponse.statusText}`
        try {
          const errorData = await listingResponse.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
        }
        throw new Error(`Failed to create listing: ${errorMessage}`)
      }
      
      const listingResult = await listingResponse.json()
      console.log('✅ CreateFlip: Listing created successfully:', listingResult)
      
      // Step 2: Check if NFT is approved for the contract
      showInfo('Checking NFT approval...')
      const isApproved = await contractService.isNFTApproved(
        selectedNFT.contractAddress,
        selectedNFT.tokenId,
        contractService.contractAddress,
        address
      )
      if (!isApproved) {
        showInfo('Requesting NFT approval in your wallet...')
        await contractService.approveNFT(
          selectedNFT.contractAddress,
          selectedNFT.tokenId,
          contractService.contractAddress
        )
        showInfo('Waiting for approval confirmation...')
        // Optionally, poll for approval confirmation
        let approved = false
        for (let i = 0; i < 10; i++) {
          await new Promise(res => setTimeout(res, 2000))
          approved = await contractService.isNFTApproved(
            selectedNFT.contractAddress,
            selectedNFT.tokenId,
            contractService.contractAddress,
            address
          )
          if (approved) break
        }
        if (!approved) {
          throw new Error('NFT approval not confirmed. Please try again.')
        }
        showSuccess('NFT approved!')
      }
      
      // Step 3: Create the blockchain game (this will be a separate transaction)
      showInfo('Creating game on blockchain...')
      showInfo('You will need to approve the game creation transaction in your wallet...')
      
      console.log('🎮 CreateFlip: Starting blockchain game creation with params:', {
        nftContract: selectedNFT.contractAddress,
        tokenId: selectedNFT.tokenId,
        priceUSD: parseFloat(price),
        acceptedToken: 0, // ETH
        gameType: 0, // NFT vs Crypto
        coinType: selectedCoin?.type || 'default',
        headsImage: selectedCoin?.headsImage || '',
        tailsImage: selectedCoin?.tailsImage || '',
        isCustom: selectedCoin?.isCustom || false
      })
      
      const blockchainResult = await contractService.createGame({
        nftContract: selectedNFT.contractAddress,
        tokenId: selectedNFT.tokenId,
        priceUSD: parseFloat(price),
        acceptedToken: 0, // ETH
        gameType: 0, // NFT vs Crypto
        coinType: selectedCoin?.type || 'default',
        headsImage: selectedCoin?.headsImage || '',
        tailsImage: selectedCoin?.tailsImage || '',
        isCustom: selectedCoin?.isCustom || false
      })
      
      console.log('🎮 CreateFlip: Blockchain game creation result:', blockchainResult)
      
      if (!blockchainResult.success) {
        throw new Error(blockchainResult.error || 'Failed to create game on blockchain')
      }
      
      showSuccess('Game created on blockchain!')
      const contractGameId = blockchainResult.gameId
      const transactionHash = blockchainResult.transactionHash
      
      console.log('🎮 CreateFlip: Contract game created successfully:', {
        contractGameId,
        transactionHash,
        listingFeeUSD: blockchainResult.listingFeeUSD
      })
      
      // Step 4: Update the listing with the contract game ID
      showInfo('Updating listing with blockchain game...')
      
      const updateResponse = await fetch(`${getApiUrl()}/api/listings/${listingResult.listingId}/create-blockchain-game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contract_game_id: contractGameId,
          transaction_hash: transactionHash
        })
      })
      
      if (!updateResponse.ok) {
        console.error('❌ Failed to update listing with contract game ID')
        const errorText = await updateResponse.text()
        console.error('Error response:', errorText)
        throw new Error('Failed to save blockchain game ID to database. Please contact support.')
      } else {
        console.log('✅ CreateFlip: Listing updated with contract game ID')
      }
      
      showSuccess('Flip created successfully!')
      
      // Navigate to the game page
      navigate(`/game/${listingResult.listingId}`)
      
    } catch (error) {
      console.error('Error creating flip:', error)
      showError(error.message || 'Failed to create flip')
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