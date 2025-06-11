import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import NFTSelector from '../components/NFTSelector'
import PaymentService from '../services/PaymentService'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import MobileWalletConnector from '../components/MobileWalletConnector'
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
import WalletConnectionModal from '../components/WalletConnectionModal'

const CreateFlip = () => {
  const navigate = useNavigate()
  const { isConnected, connectWallet, nfts, loading: nftsLoading, provider, address, chain, isMobile } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [isNFTSelectorOpen, setIsNFTSelectorOpen] = useState(false)
  const [priceUSD, setPriceUSD] = useState('')
  const [gameType, setGameType] = useState('') // 'nft-vs-crypto' or 'nft-vs-nft'
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)

  // Debug logging
  useEffect(() => {
    console.log('🔍 CreateFlip Debug:', {
      isConnected,
      address,
      nftsLoading,
      nftsCount: nfts?.length || 0,
      chain,
      isMobile
    })
  }, [isConnected, address, nftsLoading, nfts, chain, isMobile])

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

      // Validate price for NFT vs Crypto
      if (gameType === 'nft-vs-crypto') {
        if (!priceUSD || isNaN(priceUSD) || parseFloat(priceUSD) <= 0) {
          throw new Error('Please enter a valid price in USD')
        }
      }

      if (!provider || !address) {
        throw new Error('Wallet not connected')
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

      // Send listing fee payment
      const signer = await provider.getSigner()
      const feeRecipient = PaymentService.getFeeRecipient()
      const feeAmountWei = ethers.parseEther(feeAmountETH.toString())

      const txResult = await PaymentService.buildTransaction(feeRecipient, feeAmountWei, provider)
      if (!txResult.success) {
        throw new Error('Failed to build transaction: ' + txResult.error)
      }

      const feeTx = await signer.sendTransaction(txResult.txConfig)
      showInfo('Confirming transaction...')
      
      const feeReceipt = await feeTx.wait()
      showSuccess('Listing fee paid successfully!')

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
        price: gameType === 'nft-vs-crypto' ? parseFloat(priceUSD) : 0, // No price for NFT vs NFT
        priceUSD: gameType === 'nft-vs-crypto' ? parseFloat(priceUSD) : 0,
        currency: gameType === 'nft-vs-crypto' ? 'USD' : 'NFT',
        rounds: 5, // Default to 5 rounds
        status: 'waiting',
        offeredNFTs: [], // NEW: Array to store NFT offers for NFT vs NFT games
        listingFee: {
          amountUSD: listingFeeUSD,
          amountETH: feeAmountETH,
          transactionHash: feeReceipt.hash,
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

  if (!isConnected) {
    // Show mobile connector on mobile devices
    if (isMobile) {
      return <MobileWalletConnector />
    }

    // Show desktop wallet modal for desktop
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <ConnectWalletPrompt>
              <PromptTitle>Connect Your Wallet</PromptTitle>
              <PromptText>Please connect your wallet to create a new flip game.</PromptText>
              <Button onClick={() => setShowWalletModal(true)}>Connect Wallet</Button>
            </ConnectWalletPrompt>
          </ContentWrapper>
        </Container>
        
        <WalletConnectionModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          onSuccess={() => {
            setShowWalletModal(false)
            // Wallet is now connected, component will re-render
          }}
        />
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