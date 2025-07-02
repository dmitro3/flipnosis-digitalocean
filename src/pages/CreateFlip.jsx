import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import { useWalletConnection } from '../utils/useWalletConnection'
import NFTSelector from '../components/NFTSelector'
import CoinSelector from '../components/CoinSelector'
import contractService from '../services/ContractService'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import { ConnectButton } from '@rainbow-me/rainbowkit'
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

const CreateFlip = () => {
  const navigate = useNavigate()
  const { nfts, loading: nftsLoading, chain } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  const { isFullyConnected, connectionError, address, walletClient, publicClient } = useWalletConnection()
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [isNFTSelectorOpen, setIsNFTSelectorOpen] = useState(false)
  const [priceUSD, setPriceUSD] = useState('')
  const [gameType, setGameType] = useState('') // 'nft-vs-crypto' or 'nft-vs-nft'
  const [selectedCoin, setSelectedCoin] = useState(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  


  // Debug logging for mobile
  useEffect(() => {
    console.log('🔍 CreateFlip - Wallet state:', {
      isFullyConnected,
      connectionError,
      address,
      hasWalletClient: !!walletClient,
      chain: chain?.name
    })
  }, [isFullyConnected, connectionError, address, walletClient, chain])

  // Show connection error if any
  useEffect(() => {
    if (connectionError) {
      setError(connectionError)
    }
  }, [connectionError])

  // Initialize contract service when wallet is connected
  useEffect(() => {
    if (isFullyConnected && walletClient && publicClient && chain) {
      const chainName = chain.name.toLowerCase()
      contractService.init(chainName, walletClient, publicClient)
        .then(() => {
          console.log('✅ Contract service initialized for chain:', chainName)
        })
        .catch(error => {
          console.error('❌ Failed to initialize contract service:', error)
          setError('Failed to connect to smart contract')
        })
    }
  }, [isFullyConnected, walletClient, publicClient, chain])

  if (!isFullyConnected || !address) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <ConnectWalletPrompt>
              <PromptTitle>Connect Your Wallet</PromptTitle>
              <PromptText>
                {connectionError || 'Please connect your wallet to create a new flip game.'}
              </PromptText>
              <ConnectButton />
              {connectionError && (
                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#FF6B6B' }}>
                  {connectionError}
                </div>
              )}
            </ConnectWalletPrompt>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }

  const handleCreateFlip = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (!selectedNFT) {
        throw new Error('Please select an NFT')
      }

      if (!gameType) {
        throw new Error('Please select a game type')
      }

      if (!selectedCoin) {
        throw new Error('Please select a coin design')
      }

      // Validate price for NFT vs Crypto
      let validatedPriceUSD = 0
      if (gameType === 'nft-vs-crypto') {
        const priceValue = parseFloat(priceUSD)
        if (!priceUSD || isNaN(priceValue) || priceValue <= 0) {
          throw new Error('Please enter a valid price in USD')
        }
        validatedPriceUSD = priceValue
      }

      if (!walletClient || !address) {
        throw new Error('Wallet not connected properly. Please reconnect your wallet.')
      }

      showInfo('Preparing game creation...')

      // Prepare game parameters for smart contract
      const gameParams = {
        nftContract: selectedNFT.contractAddress,
        tokenId: selectedNFT.tokenId,
        priceUSD: validatedPriceUSD,
        acceptedToken: 0, // 0 = ETH, 1 = USDC
        maxRounds: 5,
        gameType: gameType === 'nft-vs-nft' ? 1 : 0, // 0 = NFTvsCrypto, 1 = NFTvsNFT
        authInfo: JSON.stringify({
          coinDesign: selectedCoin,
          gameType: gameType,
          creator: address
        })
      }

      console.log('🎮 Creating game with smart contract:', gameParams)
      console.log('🔍 Selected NFT object:', selectedNFT)

      // Create game using smart contract
      const result = await contractService.createGame(gameParams)
      
      if (!result.success) {
        throw new Error('Failed to create game: ' + result.error)
      }

      showSuccess('Game created successfully!')
      console.log('✅ Game created on blockchain:', result)

      // Save game to database for UI purposes (with contract game ID, NFT metadata, and coin data)
      const databaseResult = await createGameInDatabase({
        id: result.gameId.toString(),
        creator: address,
        nft_contract: selectedNFT.contractAddress,
        nft_token_id: selectedNFT.tokenId,
        nft_name: selectedNFT.name,
        nft_image: selectedNFT.image,
        nft_collection: selectedNFT.collection,
        nft_chain: chain?.name?.toLowerCase() || 'base',
        price_usd: validatedPriceUSD,
        game_type: gameType,
        coin: selectedCoin, // Save the coin design
        status: 'created',
        contract_game_id: result.gameId.toString(),
        transaction_hash: result.transactionHash
      })

      if (databaseResult.success) {
        // Navigate to the game
        navigate(`/game/${result.gameId}`)
      } else {
        console.warn('⚠️ Game created on blockchain but failed to save to database:', databaseResult.error)
        // Still navigate to game since it exists on blockchain
        navigate(`/game/${result.gameId}`)
      }

    } catch (error) {
      console.error('❌ Error creating game:', error)
      setError(error.message)
      showError('Failed to create game: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const createGameInDatabase = async (gameData) => {
    try {
      console.log('💾 Saving game to database:', gameData)
      
      // Use REST API
      const API_URL = 'https://cryptoflipz2-production.up.railway.app'
      
      const response = await fetch(`${API_URL}/api/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gameData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save game to database')
      }
      
      const result = await response.json()
      console.log('✅ Game saved to database:', result)
      
      return { success: true, gameId: result.id }
      
    } catch (error) {
      console.error('❌ Error saving game to database:', error)
      return { success: false, error: error.message }
    }
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setGameType('nft-vs-crypto')}
                    style={{
                      width: '100%',
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
                      width: '100%',
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
                      value={priceUSD}
                      onChange={(e) => setPriceUSD(e.target.value)}
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

              {/* Coin Selection */}
              <FormSection>
                <SectionTitle>Choose Coin Design</SectionTitle>
                <CoinSelector
                  onCoinSelect={setSelectedCoin}
                  selectedCoin={selectedCoin}
                  showCustomOption={true}
                />
                {selectedCoin && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(0, 255, 65, 0.1)',
                    border: '1px solid rgba(0, 255, 65, 0.3)',
                    borderRadius: '0.5rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#00FF41', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      ✅ Selected: {selectedCoin.name}
                    </div>
                    <div style={{ color: '#fff', fontSize: '0.9rem', opacity: 0.8 }}>
                      This coin design will be used for both players in the game
                    </div>
                  </div>
                )}
              </FormSection>

              <SubmitButton 
                type="submit" 
                disabled={isSubmitting || !gameType || !selectedCoin} 
                style={{ 
                  color: '#000',
                  background: 'linear-gradient(45deg, #00FF41, #39FF14)',
                  border: 'none',
                  fontWeight: 'bold'
                }}
              >
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