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
  const { isConnected, nfts, loadNFTs, chainId, walletClient, publicClient } = useWallet()
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
    
    console.log('🔍 Submit attempt - Wallet state:', {
      isFullyConnected,
      hasWalletClient: !!walletClient,
      hasPublicClient: !!publicClient,
      chainId,
      address: walletClient?.account?.address
    })
    
    if (!isFullyConnected) {
      showError('Please connect your wallet first')
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
      // Ensure contract service is initialized with current wallet
      if (!contractService.walletClient || contractService.chainId !== chainId) {
        console.log('Re-initializing contract service...')
        await contractService.initializeClients(chainId, walletClient)
        // Add small delay for MetaMask
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      const createParams = {
        nftContract: selectedNFT.contractAddress,
        tokenId: selectedNFT.tokenId,
        priceUSD: parseFloat(price),
        acceptedToken: 0, // ETH
        gameType: gameType === 'nft-vs-nft' ? 1 : 0,
        authInfo: '',
        coin: selectedCoin // Include the selected coin data
      }

      console.log('🎮 Creating game with params:', createParams)
      console.log('🪙 Coin data being sent:', selectedCoin)
      
      const result = await contractService.createGame(createParams)

      if (result.success) {
        showSuccess('Game created successfully!')
        navigate(`/game/${result.gameId}`)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error creating game:', error)
      
      let errorMessage = error.message
      if (errorMessage.includes('User denied') || errorMessage.includes('user rejected')) {
        errorMessage = 'Transaction cancelled'
      }
      
      showError(errorMessage)
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
                    <LoadingSpinner /> Creating...
                  </>
                ) : (
                  `Create ${gameType === 'nft-vs-nft' ? 'NFT Battle' : 'Flip'}`
                )}
              </SubmitButton>
            </form>
          </GlassCard>
        </ContentWrapper>

        <NFTSelector
          isOpen={isNFTSelectorOpen}
          onClose={() => setIsNFTSelectorOpen(false)}
          onSelect={setSelectedNFT}
          nfts={nfts || []}
          loading={nftsLoading}
          selectedNFT={selectedNFT}
        />
      </Container>
    </ThemeProvider>
  )
}

export default CreateFlip 