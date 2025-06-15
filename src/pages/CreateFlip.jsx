import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import NFTSelector from '../components/NFTSelector'
import PaymentService from '../services/PaymentService'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import {
  Container,
  ContentWrapper,
  FormContainer,
  FormTitle,
  FormSection,
  SectionTitle,
  NFTPreview,
  NFTImage,
  NFTInfo,
  NFTName,
  NFTCollection,
  SelectNFTButton,
  InputWrapper,
  Input,
  CurrencyLabel,
  SubmitButton,
  ConnectWalletPrompt,
  PromptTitle,
  PromptText,
  Button,
  ErrorMessage,
  LoadingSpinner
} from '../styles/components'
import { ethers } from 'ethers'
import { contractService, PaymentToken } from '../services/ContractService'

const CreateFlip = () => {
  const navigate = useNavigate()
  const { isConnected, nfts, loading: nftsLoading, provider, address, chain } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [isNFTSelectorOpen, setIsNFTSelectorOpen] = useState(false)
  const [price, setPrice] = useState('')
  const [authInfo, setAuthInfo] = useState('')
  const [gameType, setGameType] = useState('') // 'nft-vs-crypto' or 'nft-vs-nft'
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)

  // Debug logging
  useEffect(() => {
    console.log('🔍 CreateFlip Debug:', {
      isConnected,
      address,
      nftsLoading,
      nftsCount: nfts.length,
      chain
    })
  }, [isConnected, address, nftsLoading, nfts, chain])

  const createGameWithDatabase = async (gameData) => {
    try {
      // Generate game ID
      const gameId = Math.random().toString(36).substring(2, 15)
      
      // Add ID to game data
      const gameWithId = {
        ...gameData,
        id: gameId
      }
      
      console.log('🎮 Creating game with database:', gameWithId)
      
      // Use REST API
      const API_URL = 'https://cryptoflipz2-production.up.railway.app'
      
      const response = await fetch(`${API_URL}/api/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gameWithId)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create game')
      }
      
      const result = await response.json()
      console.log('✅ Game created successfully:', result)
      
      return { success: true, gameId }
      
    } catch (error) {
      console.error('❌ Error creating game:', error)
      return { success: false, error: error.message }
    }
  }

  const handleCreateFlip = async (e) => {
    e.preventDefault()
    
    if (!address) {
      throw new Error('Wallet not connected')
    }

    if (!selectedNFT) {
      throw new Error('Please select an NFT')
    }

    if (!price || price <= 0) {
      throw new Error('Please enter a valid price')
    }

    try {
      setLoading(true)
      showInfo('Creating flip game...')

      // Initialize contract service with Wagmi clients
      await contractService.init(publicClient, walletClient)

      // Create the game with fixed 5 rounds
      const result = await contractService.createGame(
        selectedNFT.contractAddress,
        selectedNFT.tokenId,
        parseFloat(price),
        5, // Fixed to 5 rounds
        PaymentToken.ETH,
        authInfo
      )

      if (!result.success) {
        throw new Error(result.error || 'Failed to create game')
      }

      showSuccess('Flip game created successfully!')
      navigate(`/flip/${result.gameId}`)
    } catch (error) {
      console.error('Error creating flip:', error)
      showError(error.message || 'Failed to create flip game')
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <ConnectWalletPrompt>
              <PromptTitle>Connect Your Wallet</PromptTitle>
              <PromptText>Please connect your wallet to create a new flip game.</PromptText>
              <ConnectButton />
            </ConnectWalletPrompt>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <ContentWrapper>
          <FormContainer>
            <FormTitle>Create New Flip</FormTitle>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            
            <form onSubmit={handleCreateFlip}>
              {/* NEW: Game Type Selection */}
              <FormSection>
                <SectionTitle>Choose Game Type</SectionTitle>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setGameType('nft-vs-crypto')}
                    style={{
                      flex: 1,
                      padding: '1.5rem',
                      background: gameType === 'nft-vs-crypto' ? 
                        'linear-gradient(45deg, #FF1493, #FF69B4)' : 
                        'rgba(255, 255, 255, 0.05)',
                      border: `2px solid ${gameType === 'nft-vs-crypto' ? '#FF1493' : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: '1rem',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💎 vs 💰</div>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>NFT vs Crypto</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                      Your NFT vs opponent's crypto bet
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#FFD700', marginTop: '0.5rem' }}>
                      Listing fee: $0.10
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setGameType('nft-vs-nft')}
                    style={{
                      flex: 1,
                      padding: '1.5rem',
                      background: gameType === 'nft-vs-nft' ? 
                        'linear-gradient(45deg, #00FF41, #39FF14)' : 
                        'rgba(255, 255, 255, 0.05)',
                      border: `2px solid ${gameType === 'nft-vs-nft' ? '#00FF41' : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: '1rem',
                      color: gameType === 'nft-vs-nft' ? '#000' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💎 vs 💎</div>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>NFT vs NFT</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                      Your NFT vs opponent's NFT - Winner takes both!
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#FFD700', marginTop: '0.5rem' }}>
                      Listing fee: $0.50
                    </div>
                  </button>
                </div>
              </FormSection>

              {/* NFT Selection */}
              <FormSection>
                <SectionTitle>Select Your NFT</SectionTitle>
                {selectedNFT ? (
                  <NFTPreview>
                    <NFTImage src={selectedNFT.image} alt={selectedNFT.name} />
                    <NFTInfo>
                      <NFTName>{selectedNFT.name}</NFTName>
                      <NFTCollection>{selectedNFT.collection}</NFTCollection>
                    </NFTInfo>
                    <Button type="button" onClick={() => setSelectedNFT(null)}>
                      Change
                    </Button>
                  </NFTPreview>
                ) : (
                  <SelectNFTButton type="button" onClick={() => setIsNFTSelectorOpen(true)}>
                    Select NFT to Flip
                  </SelectNFTButton>
                )}
              </FormSection>

              {/* Price Section - Only for NFT vs Crypto */}
              {gameType === 'nft-vs-crypto' && (
                <FormSection>
                  <SectionTitle>Set Price</SectionTitle>
                  <InputWrapper>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter price in USD"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                    <CurrencyLabel>USD</CurrencyLabel>
                  </InputWrapper>
                </FormSection>
              )}

              {/* NFT vs NFT Info */}
              {gameType === 'nft-vs-nft' && (
                <FormSection>
                  <SectionTitle>NFT vs NFT Battle</SectionTitle>
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(0, 255, 65, 0.1)',
                    border: '1px solid rgba(0, 255, 65, 0.3)',
                    borderRadius: '0.5rem'
                  }}>
                    <p style={{ margin: 0, color: 'white' }}>
                      🔥 <strong>Ultimate NFT Battle!</strong>
                    </p>
                    <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', opacity: 0.8 }}>
                      • Other players can offer their NFTs to challenge you<br/>
                      • You choose which NFT to battle against<br/>
                      • Winner takes both NFTs!<br/>
                      • Best of 5 rounds determines the victor
                    </p>
                  </div>
                </FormSection>
              )}

              {/* Auth Info Input */}
              <FormSection>
                <SectionTitle>Auth Info (Optional)</SectionTitle>
                <InputWrapper>
                  <Input
                    type="text"
                    value={authInfo}
                    onChange={(e) => setAuthInfo(e.target.value)}
                    placeholder="Enter any additional info"
                  />
                </InputWrapper>
              </FormSection>

              <SubmitButton type="submit" disabled={isSubmitting || !gameType}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner /> Creating {gameType === 'nft-vs-nft' ? 'NFT Battle' : 'Flip'}...
                  </>
                ) : (
                  `Create ${gameType === 'nft-vs-nft' ? 'NFT Battle' : 'Flip'}`
                )}
              </SubmitButton>
            </form>
          </FormContainer>
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