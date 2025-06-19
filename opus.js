Now I understand the issue. The problem is that:
The CreateFlip component is trying to use a connectWallet function that doesn't exist in the WalletContext
The wallet connection is handled by RainbowKit's ConnectButton component, not a custom function
On mobile, there might be issues with the wallet connection state not being properly synchronized
Let me fix this by:
Removing the custom wallet connection logic from CreateFlip
Using RainbowKit's ConnectButton properly
Ensuring the wallet connection state is properly checked
CreateFlip.jsx
+17-29
import PaymentService from '../services/PaymentService'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import {
  Container,
  ContentWrapper,
const CreateFlip = () => {
  const navigate = useNavigate()
  const { isConnected, connectWallet, nfts, loading: nftsLoading, provider, address, chain } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [isNFTSelectorOpen, setIsNFTSelectorOpen] = useState(false)
  const [priceUSD, setPriceUSD] = useState('')
  const [gameType, setGameType] = useState('') // 'nft-vs-crypto' or 'nft-vs-nft'
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  // Handle wallet connection
  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true)
      setError('')
      const success = await connectWallet()
      if (success) {
        showSuccess('Wallet connected successfully')
      }
    } catch (error) {
      console.error('Connection error:', error)
      showError(`Failed to connect: ${error.message}`)
      setError(`Failed to connect: ${error.message}`)
    } finally {
      setIsConnecting(false)
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
              {error && <ErrorMessage>{error}</ErrorMessage>}
              <Button 
                onClick={handleConnectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            </ConnectWalletPrompt>
          </ContentWrapper>
        </Container>
}
export default CreateFlip 
  const { isConnected, connectWallet, nfts, loading: nftsLoading, provider, address, chain } = useWallet()
  const [isConnecting, setIsConnecting] = useState(false)
  // Handle wallet connection
  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true)
      setError('')
      const success = await connectWallet()
      if (success) {
        showSuccess('Wallet connected successfully')
      }
    } catch (error) {
      console.error('Connection error:', error)
      showError(`Failed to connect: ${error.message}`)
      setError(`Failed to connect: ${error.message}`)
    } finally {
      setIsConnecting(false)
    }
  }
  if (!isConnected) {
              {error && <ErrorMessage>{error}</ErrorMessage>}
              <Button 
                onClick={handleConnectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
import PaymentService from '../services/PaymentService'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  Container,
  ContentWrapper,
const CreateFlip = () => {
  const navigate = useNavigate()
  const { isConnected, nfts, loading: nftsLoading, provider, address, chain, walletClient } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [isNFTSelectorOpen, setIsNFTSelectorOpen] = useState(false)
  const [priceUSD, setPriceUSD] = useState('')
  const [gameType, setGameType] = useState('') // 'nft-vs-crypto' or 'nft-vs-nft'
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Debug logging for mobile
  useEffect(() => {
    console.log('🔍 CreateFlip - Wallet state:', {
      isConnected,
      address,
      hasProvider: !!provider,
      hasWalletClient: !!walletClient,
      chain: chain?.name
    })
  }, [isConnected, address, provider, walletClient, chain])
  if (!isConnected || !address) {
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
}
export default CreateFlip 
22 hidden lines
Create flip.jsx

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
import { ethers } from 'ethers'


const CreateFlip = () => {
  const navigate = useNavigate()
  const { isConnected, nfts, loading: nftsLoading, provider, address, chain, walletClient } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [isNFTSelectorOpen, setIsNFTSelectorOpen] = useState(false)
  const [priceUSD, setPriceUSD] = useState('')
  const [gameType, setGameType] = useState('') // 'nft-vs-crypto' or 'nft-vs-nft'
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)


  // Debug logging for mobile
  useEffect(() => {
    console.log('🔍 CreateFlip - Wallet state:', {
      isConnected,
      address,
      hasProvider: !!provider,
      hasWalletClient: !!walletClient,
      chain: chain?.name
    })
  }, [isConnected, address, provider, walletClient, chain])


  if (!isConnected || !address) {
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


Now let me check the FlipGame component and fix the wallet connection validation there as well:
Read FlipGame.jsx
Now I need to check how the wallet client is being used for transactions. Let me look at the PaymentService to understand the transaction handling:
Read PaymentService.js
I can see the issue now. The code is using the old ethers.js pattern with provider.getSigner() which doesn't work well with modern wallet connections, especially on mobile. We need to update the transaction handling to use the wagmi walletClient instead. Let me fix this:
CreateFlip.jsx
+30-12
        }
      }
      if (!provider || !address) {
        throw new Error('Wallet not connected')
      }
      showInfo('Processing listing fee payment...')
      const feeAmountETH = feeCalculation.ethAmount
      console.log(`Listing fee: $${listingFeeUSD} = ${feeAmountETH} ETH`)
      if (!provider || !address) {
        throw new Error('Wallet not connected')
        }
      }
      if (!walletClient || !address) {
        throw new Error('Wallet not connected properly. Please reconnect your wallet.')
      }
      showInfo('Processing listing fee payment...')
      const feeAmountETH = feeCalculation.ethAmount
      console.log(`Listing fee: $${listingFeeUSD} = ${feeAmountETH} ETH`)
13 hidden lines
17 hidden lines


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
      const receipt = await walletClient.request({
        method: 'eth_getTransactionReceipt',
        params: [txResult.hash],
      })
     
      // Poll for receipt if not immediately available
      let attempts = 0
      while (!receipt && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        const checkReceipt = await walletClient.request({
          method: 'eth_getTransactionReceipt',
          params: [txResult.hash],
        })
        if (checkReceipt) {
          showSuccess('Listing fee paid successfully!')
          break
        }
        attempts++
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




Now let me update the FlipGame component to use walletClient for transactions as well:

onst FlipGame = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { isConnected, address, provider, walletClient, publicClient } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()


  // API URL
 const handleJoinGame = async () => {
    console.log('🔍 Join game attempt:', {
      hasGameData: !!gameData,
      hasWalletClient: !!walletClient,
      hasAddress: !!address,
      isJoining: joiningGame,
      isConnected: isConnected
    })


    if (!gameData || !walletClient || !address || joiningGame || !isConnected) {
      console.log('❌ Cannot join game:', {
        hasGameData: !!gameData,
        hasWalletClient: !!walletClient,
        hasAddress: !!address,
        isJoining: joiningGame,
        isConnected: isConnected
      })
      showError('Please ensure your wallet is connected')
      return
    }


    try {
      setJoiningGame(true)
      showInfo('Processing payment...')
     
      const paymentResult = await PaymentService.calculateETHAmount(gameData.priceUSD)
     
      // Use walletClient for transaction
      const feeRecipient = PaymentService.getFeeRecipient()
     
      // Send transaction using walletClient
      const txResult = await PaymentService.sendTransaction(walletClient, feeRecipient, paymentResult.ethAmount.toString())
     
      if (!txResult.success) {
        throw new Error('Transaction failed: ' + txResult.error)
      }
     
      showInfo('Confirming payment...')
     
      // Wait for transaction confirmation
      let receipt = null
      let attempts = 0
      while (!receipt && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        try {
          receipt = await publicClient.getTransactionReceipt({ hash: txResult.hash })
          if (receipt) {
            console.log('✅ Payment confirmed:', receipt.transactionHash)
            break
          }
        } catch (e) {
          // Transaction might not be mined yet
        }
        attempts++
      }
     
      if (!receipt) {
        throw new Error('Transaction confirmation timeout')
      }
     
      // Update game in database first
      const joinResponse = await fetch(`${API_URL}/api/games/${gameData.id}/simple-join`, {
Now let me update the rest of the join game function to use the correct receipt hash:

  headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joinerAddress: address,
          paymentTxHash: receipt.transactionHash,
          paymentAmount: gameData.priceUSD
        })
      })


gameId,
          role: 'joiner',
          address,
          entryFeeHash: receipt.transactionHash
        }))
      }
     
Now let me also update the handlePaymentForAcceptedOffer function to use walletClient:
FlipGame.jsx
+24-7
      }
      const feeAmountETH = feeCalculation.ethAmount
      const signer = await provider.getSigner()
      const feeRecipient = PaymentService.getFeeRecipient()
      const feeAmountWei = ethers.parseEther(feeAmountETH.toString())
      const txResult = await PaymentService.buildTransaction(feeRecipient, feeAmountWei, provider)
      if (!txResult.success) {
        throw new Error('Failed to build transaction: ' + txResult.error)
      const signer = await provider.getSigner()
      const feeAmountWei = ethers.parseEther(feeAmountETH.toString())
      const txResult = await PaymentService.buildTransaction(feeRecipient, feeAmountWei, provider)
        throw new Error('Failed to build transaction: ' + txResult.error)
      }
      const feeAmountETH = feeCalculation.ethAmount
      const feeRecipient = PaymentService.getFeeRecipient()
      // Send transaction using walletClient
      const txResult = await PaymentService.sendTransaction(walletClient, feeRecipient, feeAmountETH.toString())
      
      if (!txResult.success) {
        throw new Error('Transaction failed: ' + txResult.error)
FlipGame.jsx
+1-1
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengerAddress: address,
          paymentTxHash: feeReceipt.hash,
          paymentAmount: feeUSD,
          acceptedOffer: offer
        })
          paymentTxHash: feeReceipt.hash,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengerAddress: address,
          paymentTxHash: feeReceipt.transactionHash,
          paymentAmount: feeUSD,
          acceptedOffer: offer
        })
FlipGame.jsx
+1-1
          type: 'nft_payment_complete',
          gameId,
          challengerAddress: address,
          paymentTxHash: feeReceipt.hash,
          acceptedOffer: offer
        }))
      }
          paymentTxHash: feeReceipt.hash,
          type: 'nft_payment_complete',
          gameId,
          challengerAddress: address,
          paymentTxHash: feeReceipt.transactionHash,
          acceptedOffer: offer
        }))
      }

 }


      const feeAmountETH = feeCalculation.ethAmount
      const feeRecipient = PaymentService.getFeeRecipient()


      // Send transaction using walletClient
      const txResult = await PaymentService.sendTransaction(walletClient, feeRecipient, feeAmountETH.toString())
     
      if (!txResult.success) {
        throw new Error('Transaction failed: ' + txResult.error)
      }


      showInfo('Confirming payment...')
     
      // Wait for transaction confirmation
      let feeReceipt = null
      let attempts = 0
      while (!feeReceipt && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        try {
          feeReceipt = await publicClient.getTransactionReceipt({ hash: txResult.hash })
          if (feeReceipt) {
            showSuccess('Payment confirmed! Starting battle...')
            break
          }
        } catch (e) {
          // Transaction might not be mined yet
        }
        attempts++
      }
     
      if (!feeReceipt) {
        throw new Error('Transaction confirmation timeout')
      }


      // Update database with payment
      const response = await fetch(`${API_URL}/api/games/${gameId}/nft-payment`, {

headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengerAddress: address,
          paymentTxHash: feeReceipt.transactionHash,
          paymentAmount: feeUSD,
          acceptedOffer: offer
        })
     type: 'nft_payment_complete',
          gameId,
          challengerAddress: address,
          paymentTxHash: feeReceipt.transactionHash,
          acceptedOffer: offer
        }))
      }


Now let me check if there are any other components that might be using the old wallet connection pattern:


I can see that NFTOfferComponent is using provider but not for transactions, so it should be fine. However, let me update the WalletContext to ensure the ethers provider is created correctly for mobile:

    if (!window.ethereum) return null
    
    try {
      // Use ethers directly since it's imported at the top
      return new ethers.BrowserProvider(window.ethereum)
    } catch (error) {
      console.error('Failed to create ethers provider:', error)
      return null

/ For mobile wallets, we should use the walletClient's transport
    if (walletClient && walletClient.transport) {
      try {
        // Create a custom provider that works with mobile wallets
        const provider = {
          // Minimal provider interface for compatibility
          getSigner: () => {
            console.warn('getSigner() is deprecated. Use walletClient directly for transactions.')
            return null
          },
          // Add other methods if needed for compatibility
        }
        return provider
      } catch (error) {
        console.error('Failed to create provider wrapper:', error)
      }
    }
   
    // Fallback to window.ethereum if available
    if (window.ethereum) {
      try {
        return new ethers.BrowserProvider(window.ethereum)
      } catch (error) {
        console.error('Failed to create ethers provider:', error)
      }
    }
   
    return null
  }


  const value = {
    // Connection state - Use Wagmi's state directly
    isConnected,
    isConnecting,
    loading,
    address,
   
    // Chain info
    chainId,
    chain: chains[chainId] || { name: 'Unknown', symbol: 'ETH' },
    chains,
   
    // Functions
    switchChain,
    switchToBase,
   
    // NFTs
    nfts,
    loadNFTs,
   
    // Mobile detection
    isMobile,
   
    // Clients for transactions
    walletClient,
    publicClient,
   
    // Legacy ethers provider for existing code
    provider: getEthersProvider(),
  }


  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}




Now let me add some additional debugging and mobile-specific handling to the wallet context:

 showSuccess(`Connected to ${address.slice(0, 6)}...${address.slice(-4)}`)
    }
  }, [isConnected, address])


  // Debug logging for mobile
  useEffect(() => {
    console.log('🔍 WalletContext state:', {
      isConnected,
      address,
      chainId,
      hasWalletClient: !!walletClient,
      hasPublicClient: !!publicClient,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    })
  }, [isConnected, address, chainId, walletClient, publicClient])


  // Create ethers-compatible provider for legacy code
  const getEthersProvider = () => {
    // For mobile wallets, we should use the walletClient's transport
    if (walletClient && walletClient.transport) {
      try {
        // Create a custom provider that works with mobile wallets
        const provider = {
          // Minimal provider interface for compatibility
          getSigner: () => {
            console.warn('getSigner() is deprecated. Use walletClient directly for transactions.')
            return null
          },
          // Add other methods if needed for compatibility
        }
        return provider
      } catch (error) {
        console.error('Failed to create provider wrapper:', error)
      }
    }
   
    // Fallback to window.ethereum if available
    if (window.ethereum) {
      try {
        return new ethers.BrowserProvider(window.ethereum)
      } catch (error) {
        console.error('Failed to create ethers provider:', error)
      }
    }
   
    return null
  }


  const value = {
    // Connection state - Use Wagmi's state directly
    isConnected,
    isConnecting,
    loading,
    address,
   
    // Chain info
    chainId,
    chain: chains[chainId] || { name: 'Unknown', symbol: 'ETH' },
    chains,
   
    // Functions
    switchChain,
    switchToBase,
   
    // NFTs
    nfts,
    loadNFTs,
   
    // Mobile detection
    isMobile,
   
    // Clients for transactions
    walletClient,
    publicClient,
   
    // Legacy ethers provider for existing code
    provider: getEthersProvider(),
  }


  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}



Now let me update the PaymentService to better handle transaction confirmations:

}


    try {
      console.log('📤 Sending transaction:', {
        to,
        value: value.toString(),
        valueInWei: parseEther(value.toString()).toString()
      })


      // Prepare the transaction
      const request = await walletClient.prepareTransactionRequest({
        to,
        value: parseEther(value.toString()),
        chain: walletClient.chain,
        account: walletClient.account
      })


      // Send the transaction
      const hash = await walletClient.sendTransaction(request)
     
      console.log('✅ Transaction sent:', hash)
     
      return { success: true, hash }
    } catch (error) {
      console.error('Transaction failed:', error)
      return { success: false, error: error.message }
    }
  }
}


export default PaymentService



Now let me add a mobile-specific component to help debug wallet connection issues:

mport React from 'react'
import { useWallet } from '../contexts/WalletContext'
import { useAccount, useWalletClient } from 'wagmi'


const MobileDebug = () => {
  const { isMobile, walletClient: contextWalletClient } = useWallet()
  const { isConnected, address, connector } = useAccount()
  const { data: wagmiWalletClient } = useWalletClient()
 
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div>📱 Mobile: {isMobile ? 'YES' : 'NO'}</div>
      <div>🔗 Wagmi Connected: {isConnected ? 'YES' : 'NO'}</div>
      <div>👤 Address: {address ? `${address.slice(0, 6)}...` : 'None'}</div>
      <div>🌐 Window.ethereum: {window.ethereum ? 'YES' : 'NO'}</div>
      <div>🎯 UserAgent: {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}</div>
      <div>🔌 Connector: {connector?.name || 'None'}</div>
      <div>💼 Context WalletClient: {contextWalletClient ? 'YES' : 'NO'}</div>
      <div>💼 Wagmi WalletClient: {wagmiWalletClient ? 'YES' : 'NO'}</div>
    </div>
  )
}


export default MobileDebug



Now let me check if MobileDebug is being used anywhere:

import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import MobileDebug from './MobileDebug'


const Layout = () => {
  // Only show MobileDebug in development
  const isDevelopment = process.env.NODE_ENV === 'development'
 
  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      <main>
        <Outlet />
      </main>
      {isDevelopment && <MobileDebug />}
    </div>
  )
}


export default Layout


Now let me check the RainbowKit configuration to ensure it's properly set up for mobile wallets:

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import {
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
  coinbaseWallet,
  trustWallet,
  injectedWallet
} from '@rainbow-me/rainbowkit/wallets'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import { base, mainnet, polygon, arbitrum, optimism, bsc, avalanche } from 'wagmi/chains'
import { http } from 'wagmi'


console.log('Initializing Rainbow Kit with:', {
  projectId: 'fd95ed98ecab7ef051bdcaa27f9d0547',
  chains: [base, mainnet, polygon, arbitrum, optimism, bsc, avalanche]
})


// Define your supported chains - make sure they're properly imported
export const chains = [
  base,
  mainnet,
  polygon,
  arbitrum,
  optimism,
  bsc,
  avalanche
]


// Validate chains array
if (!chains || !Array.isArray(chains) || chains.length === 0) {
  console.error('❌ Chains array is invalid:', chains)
  throw new Error('Chains configuration is invalid')
}


// Validate each chain has required properties
chains.forEach((chain, index) => {
  if (!chain || !chain.id || !chain.name) {
    console.error(`❌ Invalid chain at index ${index}:`, chain)
    throw new Error(`Chain at index ${index} is invalid`)
  }
})


console.log('✅ Chains validated successfully:', chains.map(c => ({ id: c.id, name: c.name })))


// Get WalletConnect Project ID
const projectId = 'fd95ed98ecab7ef051bdcaa27f9d0547'


if (!projectId) {
  throw new Error('WalletConnect Project ID is required')
}


// Configure wallets with mobile-first approach
const wallets = [
  {
    groupName: 'Popular',
    wallets: [
      injectedWallet({ chains }),
      metaMaskWallet({ projectId, chains }),
      coinbaseWallet({ appName: 'FLIPNOSIS', chains }),
      walletConnectWallet({ projectId, chains }),
      rainbowWallet({ projectId, chains }),
      trustWallet({ projectId, chains })
    ],
  },
]


const connectors = connectorsForWallets(wallets, {
  appName: 'FLIPNOSIS',
  projectId,
})


// Create the config with mobile-friendly settings
const config = getDefaultConfig({
  appName: 'FLIPNOSIS',
  projectId,
  chains,
  ssr: false,
  connectors,
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [bsc.id]: http(),
    [avalanche.id]: http(),
  },
})


console.log('✅ Rainbow Kit configuration created successfully')


export { config }

Now let me create a hook to ensure wallet connection is properly handled:

import { useEffect, useState } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { useToast } from '../contexts/ToastContext'


export const useWalletConnection = () => {
  const { address, isConnected: wagmiConnected, connector } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { showError } = useToast()
  const [isFullyConnected, setIsFullyConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)


  useEffect(() => {
    // Check if we have all required connection components
    const checkConnection = async () => {
      try {
        // Reset error state
        setConnectionError(null)


        // For mobile wallets, we need to ensure we have:
        // 1. An address
        // 2. A wallet client
        // 3. The wagmi connection state is true
        const hasAddress = !!address
        const hasWalletClient = !!walletClient
        const isWagmiConnected = wagmiConnected


        console.log('🔍 Wallet connection check:', {
          hasAddress,
          hasWalletClient,
          isWagmiConnected,
          connector: connector?.name,
          isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        })


        // On mobile, sometimes the wallet client takes a moment to initialize
        if (isWagmiConnected && hasAddress && !hasWalletClient) {
          console.log('⏳ Waiting for wallet client to initialize...')
          // Give it a moment to initialize
          setTimeout(() => {
            checkConnection()
          }, 1000)
          return
        }


        const fullyConnected = hasAddress && hasWalletClient && isWagmiConnected
        setIsFullyConnected(fullyConnected)


        if (!fullyConnected && isWagmiConnected) {
          const error = 'Wallet connection incomplete. Please reconnect your wallet.'
          setConnectionError(error)
          console.error('❌ Incomplete wallet connection:', {
            hasAddress,
            hasWalletClient,
            isWagmiConnected
          })
        }
      } catch (error) {
        console.error('❌ Error checking wallet connection:', error)
        setConnectionError(error.message)
        setIsFullyConnected(false)
      }
    }


    checkConnection()
  }, [address, walletClient, wagmiConnected, connector])


  return {
    isFullyConnected,
    connectionError,
    address,
    walletClient,
    connector
  }
}

Now let me update the CreateFlip component to use this new hook:

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import { useWalletConnection } from '../utils/useWalletConnection'
import NFTSelector from '../components/NFTSelector'
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
      const receipt = await walletClient.request({
        method: 'eth_getTransactionReceipt',
        params: [txResult.hash],
      })
     
      // Poll for receipt if not immediately available
      let attempts = 0
      while (!receipt && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        const checkReceipt = await walletClient.request({
          method: 'eth_getTransactionReceipt',
          params: [txResult.hash],
        })
        if (checkReceipt) {
          showSuccess('Listing fee paid successfully!')
          break
        }
        attempts++
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



Now let me update the FlipGame component to use the new hook as well:

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import { useWalletConnection } from '../utils/useWalletConnection'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import {
  Container,
  ContentWrapper,
  GlassCard,
  NeonText,
  Button,
  LoadingSpinner
} from '../styles/components'
import ReliableGoldCoin from './ReliableGoldCoin'
import PowerDisplay from '../components/PowerDisplay'
import PaymentService from '../services/PaymentService'
import ProfilePicture from './ProfilePicture'
import baseEthLogo from '../../Images/baseeth.webp'
import hazeVideo from '../../Images/Video/haze.webm'
import GoldGameInstructions from './GoldGameInstructions'
import ShareButton from './ShareButton'
import styled from '@emotion/styled'
import GameResultPopup from './GameResultPopup'
import GameChatBox from './GameChatBox'
import NFTVerificationDisplay from './NFTVerificationDisplay'
import NFTOfferComponent from './NFTOfferComponent'

Flipgame.jsx
const FlipGame = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { publicClient } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  const { isFullyConnected, connectionError, address, walletClient } = useWalletConnection()


  // API URL
  const API_URL = 'https://cryptoflipz2-production.up.railway.app'


 hasWalletClient: !!walletClient,
      hasAddress: !!address,
      isJoining: joiningGame,
      isFullyConnected: isFullyConnected,
      connectionError
    })


    if (!gameData || !walletClient || !address || joiningGame || !isFullyConnected) {
      console.log('❌ Cannot join game:', {
        hasGameData: !!gameData,
        hasWalletClient: !!walletClient,
        hasAddress: !!address,
        isJoining: joiningGame,
        isFullyConnected: isFullyConnected
      })
      showError(connectionError || 'Please ensure your wallet is connected properly')
      return
    }



   )
  }


  if (!isFullyConnected) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <GlassCard style={{ textAlign: 'center', padding: '3rem' }}>
              <NeonText>Connect Your Wallet</NeonText>
              {connectionError && (
                <p style={{ color: '#FF6B6B', marginTop: '1rem' }}>{connectionError}</p>
              )}
              <Button onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>Go Home</Button>
            </GlassCard>
          </ContentWrapper>
        </Container>


Good! The file was created. Now let me add one more important fix - ensuring that the wallet connection state is properly persisted and restored on mobile:

App.jsx
    <RainbowKitProvider
              theme={darkTheme({
                accentColor: '#00FF41',
                accentColorForeground: 'black',
                borderRadius: 'large',
                fontStack: 'system',
                overlayBlur: 'small',
              })}
              modalSize="compact"
              initialChain={chains[0]}
              chains={chains}
              showRecentTransactions={true}
            >


Now let me add one final important fix - updating the transaction confirmation logic to be more robust:

create lip.jsx
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





