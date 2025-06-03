import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
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
  RoundsContainer,
  RoundButton,
  SubmitButton,
  ConnectWalletPrompt,
  PromptTitle,
  PromptText,
  Button,
  ErrorMessage,
  LoadingSpinner
} from '../styles/components'
import { ethers } from 'ethers'

const CreateFlip = () => {
  const navigate = useNavigate()
  const { isConnected, connectWallet, nfts, loading: nftsLoading, provider, address, chain } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [isNFTSelectorOpen, setIsNFTSelectorOpen] = useState(false)
  const [priceUSD, setPriceUSD] = useState('')
  const [rounds, setRounds] = useState(3)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debug logging
  useEffect(() => {
    console.log('🔍 CreateFlip Debug:', {
      isConnected,
      address,
      nftsLoading,
      nftsCount: nfts?.length || 0,
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
      
      // Send to WebSocket server for database storage
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://your-railway-app.railway.app' 
        : 'ws://localhost:3001'
      
      return new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          console.log('📡 Sending game data to database...')
          ws.send(JSON.stringify({
            type: 'create_game',
            gameId: gameId,
            gameData: gameWithId
          }))
          
          setTimeout(() => {
            ws.close()
            resolve({ success: true, gameId })
          }, 1000)
        }
        
        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error)
          reject(new Error('Failed to connect to game server'))
        }
        
        ws.onclose = () => {
          console.log('📡 Game data sent to database')
        }
      })
      
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

      if (!priceUSD || isNaN(priceUSD) || parseFloat(priceUSD) <= 0) {
        throw new Error('Please enter a valid price in USD')
      }

      if (!provider || !address) {
        throw new Error('Wallet not connected')
      }

      showInfo('Processing listing fee payment...')

      // Calculate and pay listing fee
      console.log('Debug: Calculating listing fee...')
      const listingFeeUSD = PaymentService.getListingFeeUSD()
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
        nft: {
          contractAddress: selectedNFT.contractAddress,
          tokenId: selectedNFT.tokenId,
          name: selectedNFT.name,
          image: selectedNFT.image,
          collection: selectedNFT.collection,
          chain: selectedNFT.chain
        },
        price: parseFloat(priceUSD),
        priceUSD: parseFloat(priceUSD),
        currency: 'USD',
        rounds: rounds,
        status: 'waiting',
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

      showSuccess(`Game created successfully! Game ID: ${result.gameId}`)
      
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
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <ConnectWalletPrompt>
              <PromptTitle>Connect Your Wallet</PromptTitle>
              <PromptText>Please connect your wallet to create a new flip game.</PromptText>
              <Button onClick={connectWallet}>Connect Wallet</Button>
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
              <FormSection>
                <SectionTitle>Select NFT</SectionTitle>
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

              <FormSection>
                <SectionTitle>Number of Rounds</SectionTitle>
                <RoundsContainer>
                  <RoundButton
                    type="button"
                    active={rounds === 3}
                    onClick={() => setRounds(3)}
                  >
                    3 Rounds
                  </RoundButton>
                  <RoundButton
                    type="button"
                    active={rounds === 5}
                    onClick={() => setRounds(5)}
                  >
                    5 Rounds
                  </RoundButton>
                </RoundsContainer>
              </FormSection>

              <SubmitButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner /> Creating Flip...
                  </>
                ) : (
                  'Create Flip'
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