import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import { useWalletConnection } from '../utils/useWalletConnection'
import NFTSelector from '../components/NFTSelector'
import CoinSelector from '../components/CoinSelector'
import PaymentService from '../services/PaymentService'
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
  const { nfts, loading: nftsLoading, publicClient, chain } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  const { isFullyConnected, connectionError, address, walletClient } = useWalletConnection()
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
      if (gameType === 'nft-vs-crypto') {
        if (!priceUSD || isNaN(priceUSD) || parseFloat(priceUSD) <= 0) {
          throw new Error('Please enter a valid price in USD')
        }
      }

      if (!walletClient || !address) {
        throw new Error('Wallet not connected properly. Please reconnect your wallet.')
      }

      showInfo('Processing listing fee payment...')

      // Calculate listing fee (50¢ for NFT vs NFT, $0.10 for NFT vs Crypto)
      const listingFeeUSD = gameType === 'nft-vs-nft' ? 0.50 : 0.10
      console.log('Listing fee USD:', listingFeeUSD)

      const feeCalculation = await PaymentService.calculateETHFee(listingFeeUSD)
      console.log('Fee calculation result:', feeCalculation)

      if (!feeCalculation.success) {
        console.error('Fee calculation failed:', feeCalculation.error)
        throw new Error('Failed to calculate listing fee: ' + feeCalculation.error)
      }

      const feeAmountETH = feeCalculation.ethAmount
      console.log(`Listing fee: $${listingFeeUSD} = ${feeAmountETH} ETH`)

      // Send listing fee payment using walletClient
      const feeRecipient = PaymentService.getFeeRecipient()
      
      // Use the PaymentService.sendTransaction method which handles walletClient
      const txResult = await PaymentService.sendTransaction(walletClient, feeRecipient, feeAmountETH.toString())
      
      if (!txResult.success) {
        throw new Error('Transaction failed: ' + txResult.error)
      }

      showInfo('Confirming transaction...')
      
      // Wait for transaction confirmation
      let receipt = null
      let attempts = 0
      const maxAttempts = 60 // 2 minutes max wait
      
      while (!receipt && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        try {
          receipt = await publicClient.getTransactionReceipt({ hash: txResult.hash })
          if (receipt && receipt.status === 'success') {
            showSuccess('Listing fee paid successfully!')
            break
          } else if (receipt && receipt.status === 'reverted') {
            throw new Error('Transaction reverted')
          }
        } catch (e) {
          // Transaction might not be mined yet, continue waiting
          console.log(`⏳ Waiting for confirmation... (${attempts + 1}/${maxAttempts})`)
        }
        attempts++
      }
      
      if (!receipt) {
        throw new Error('Transaction confirmation timeout. Please check your wallet.')
      }

      // Create game data
      const gameData = {
        creator: address,
        joiner: null,
        gameType: gameType, // NEW: Add game type
        nft: {
          contractAddress: selectedNFT.contractAddress,
          tokenId: selectedNFT.tokenId,
          name: selectedNFT.name,
          image: selectedNFT.image,
          collection: selectedNFT.collection,
          chain: selectedNFT.chain
        },
        coin: selectedCoin, // NEW: Add selected coin data
        price: gameType === 'nft-vs-crypto' ? parseFloat(priceUSD) : 0, // No price for NFT vs NFT
        priceUSD: gameType === 'nft-vs-crypto' ? parseFloat(priceUSD) : 0,
        currency: gameType === 'nft-vs-crypto' ? 'USD' : 'NFT',
        rounds: 5, // Default to 5 rounds
        status: 'waiting',
        offeredNFTs: [], // NEW: Array to store NFT offers for NFT vs NFT games
        listingFee: {
          amountUSD: listingFeeUSD,
          amountETH: feeAmountETH,
          transactionHash: txResult.hash,
          paidAt: new Date().toISOString()
        }
      }

      // Create game (with database)
      const result = await createGameWithDatabase(gameData)

      if (!result.success) {
        throw new Error('Failed to create game')
      }

      showSuccess(`${gameType === 'nft-vs-nft' ? 'NFT vs NFT' : 'NFT vs Crypto'} game created! Game ID: ${result.gameId}`)
      
      // Navigate to the game
      navigate(`/game/${result.gameId}`)

    } catch (err) {
      console.error('Failed to create flip:', err)
      setError(err.message)
      showError(err.message)
    } finally {
      setIsSubmitting(false)
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