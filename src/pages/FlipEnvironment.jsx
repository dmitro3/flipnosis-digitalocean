import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import { useWalletConnection } from '../utils/useWalletConnection'
import styled from '@emotion/styled'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import { API_CONFIG } from '../config/api'
import {
  Container,
  ContentWrapper,
  GlassCard,
  NeonText,
  Button,
  LoadingSpinner
} from '../styles/components'
import { ethers } from 'ethers'
import contractService from '../services/ContractService'

// Add pulse animation for reconnection indicator
const pulseKeyframes = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`

const EnvironmentContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 120px);
  background: rgba(0, 0, 20, 0.95);
  border-radius: 1.5rem;
  border: 2px solid ${props => props.theme.colors.neonPink};
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.3);
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${props => props.theme.colors.neonPink};
  text-align: center;
  
  h2 {
    color: ${props => props.theme.colors.neonBlue};
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
    text-shadow: 0 0 20px rgba(0, 191, 255, 0.5);
  }
  
  p {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 1rem;
  }
`

const ViewerCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 191, 255, 0.1);
  border: 1px solid ${props => props.theme.colors.neonBlue};
  border-radius: 0.5rem;
  color: ${props => props.theme.colors.neonBlue};
  font-weight: 600;
  font-size: 0.875rem;
  box-shadow: 0 0 20px rgba(0, 191, 255, 0.3);
`

const BackButton = styled(Button)`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`

const TopSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`

const BottomSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`

const NFTDetailsSection = styled(GlassCard)`
  padding: 2rem;
  margin-bottom: 2rem;
  background: rgba(0, 0, 20, 0.95);
  border: 2px solid ${props => props.theme.colors.neonPink};
  border-radius: 1.5rem;
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.3);
`

const NFTDisplay = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`

// 1. Make NFT image 25% smaller
const NFTImage = styled.img`
  width: 225px;
  height: 225px;
  object-fit: cover;
  border-radius: 1rem;
  border: 2px solid ${props => props.isLoaded ? props.theme.colors.neonGreen : props.theme.colors.neonBlue};
  box-shadow: 0 0 20px ${props => props.isLoaded ? 'rgba(0, 255, 65, 0.3)' : 'rgba(0, 191, 255, 0.3)'};
  transition: all 0.3s ease;
  
  @media (max-width: 768px) {
    width: 188px;
    height: 188px;
  }
`

const NFTInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const NFTTitle = styled.h1`
  color: ${props => props.theme.colors.textPrimary};
  margin: 0;
  font-size: 1.5rem;
`

const NFTCollection = styled.div`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 1.1rem;
`

const PriceSection = styled.div`
  background: rgba(0, 191, 255, 0.05);
  border: 1px solid ${props => props.theme.colors.neonBlue};
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 0 20px rgba(0, 191, 255, 0.3);
`

const AskingPrice = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: ${props => props.theme.colors.neonGreen};
  margin-bottom: 0.5rem;
  text-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
`

const MinOffer = styled.div`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 1rem;
`

const StatusBadge = styled.div`
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  background: ${props => {
    switch (props.status) {
      case 'active': return 'rgba(0, 255, 65, 0.2)'
      case 'pending': return 'rgba(255, 193, 7, 0.2)'
      case 'completed': return 'rgba(0, 123, 255, 0.2)'
      default: return 'rgba(255, 255, 255, 0.1)'
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'active': return props.theme.colors.neonGreen
      case 'pending': return '#FFC107'
      case 'completed': return '#007BFF'
      default: return props.theme.colors.textSecondary
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'active': return 'rgba(0, 255, 65, 0.3)'
      case 'pending': return 'rgba(255, 193, 7, 0.3)'
      case 'completed': return 'rgba(0, 123, 255, 0.3)'
      default: return 'rgba(255, 255, 255, 0.1)'
    }
  }};
`

const SidePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const ChatSection = styled(GlassCard)`
  height: 400px;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: rgba(255, 20, 147, 0.05);
  border: 2px solid ${props => props.theme.colors.neonPink};
  box-shadow: 0 0 20px rgba(255, 20, 147, 0.3);
`

const ChatHeader = styled.div`
  font-weight: bold;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
`

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 65, 0.3);
    border-radius: 3px;
  }
`

const Message = styled.div`
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: ${props => props.isOwn ? 'rgba(0, 255, 65, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 0.5rem;
  border: 1px solid ${props => props.isOwn ? 'rgba(0, 255, 65, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
`

const MessageAuthor = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 0.25rem;
`

const MessageText = styled.div`
  color: ${props => props.theme.colors.textPrimary};
`

const ChatInput = styled.div`
  display: flex;
  gap: 0.5rem;
`

const Input = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.5rem;
  border-radius: 0.5rem;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.neonGreen};
  }
`

const SendButton = styled(Button)`
  padding: 0.5rem 1rem;
  background: linear-gradient(45deg, #00FF41, #39FF14);
  color: #000;
`

const OffersSection = styled(GlassCard)`
  padding: 1rem;
  background: rgba(255, 255, 0, 0.05);
  border: 1px solid rgba(255, 255, 0, 0.2);
  box-shadow: 0 0 20px rgba(255, 255, 0, 0.1);
`

const OffersHeader = styled.div`
  font-weight: bold;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const OfferCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
`

const OfferHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`

const OfferPrice = styled.div`
  font-size: 1.25rem;
  font-weight: bold;
  color: ${props => props.theme.colors.neonGreen};
`

const OfferActions = styled.div`
  display: flex;
  gap: 0.5rem;
`

const ActionButton = styled(Button)`
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  
  &.accept {
    background: linear-gradient(45deg, #00FF41, #39FF14);
    color: #000;
  }
  
  &.reject {
    background: linear-gradient(45deg, #FF4444, #FF6666);
    color: white;
  }
`

const OfferMessage = styled.div`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem;
  margin-top: 0.5rem;
`

const MakeOfferSection = styled(GlassCard)`
  padding: 1rem;
  background: rgba(255, 255, 0, 0.05);
  border: 1px solid rgba(255, 255, 0, 0.2);
  box-shadow: 0 0 20px rgba(255, 255, 0, 0.1);
`

const AllOffersSection = styled(GlassCard)`
  padding: 1rem;
  background: rgba(255, 20, 147, 0.05);
  border: 2px solid ${props => props.theme.colors.neonPink};
  box-shadow: 0 0 20px rgba(255, 20, 147, 0.3);
  max-height: 400px;
  overflow-y: auto;
`

const AllOffersHeader = styled.div`
  font-weight: bold;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 255, 65, 0.3);
  color: ${props => props.theme.colors.neonGreen};
  text-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
`

const PublicOfferCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: rgba(255, 255, 0, 0.3);
    background: rgba(255, 255, 0, 0.05);
  }
`

const PublicOfferHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`

const PublicOfferPrice = styled.div`
  font-size: 1.25rem;
  font-weight: bold;
  color: ${props => props.theme?.colors?.neonGreen || '#00FF41'};
`

const PublicOfferInfo = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme?.colors?.textSecondary || 'rgba(255, 255, 255, 0.7)'};
  margin-bottom: 0.5rem;
`

const PublicOfferMessage = styled.div`
  color: ${props => props.theme?.colors?.textSecondary || 'rgba(255, 255, 255, 0.7)'};
  font-size: 0.875rem;
  font-style: italic;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.25rem;
`

const ShareSection = styled.div`
  background: rgba(255, 255, 0, 0.05);
  border: 1px solid rgba(255, 255, 0, 0.2);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1.5rem;
`

const ShareHeader = styled.div`
  color: #FFD700;
  fontSize: 0.875rem;
  marginBottom: 0.75rem;
  textAlign: center;
  font-weight: 600;
`

const ShareButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  justifyContent: center;
`

const ShareButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  fontSize: 0.8rem;
  display: flex;
  alignItems: center;
  gap: 0.3rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 0, 0.2);
    border-color: rgba(255, 255, 0, 0.4);
  }
`

const MakeOfferHeader = styled.div`
  font-weight: bold;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const OfferForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const Label = styled.label`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem;
`

const StyledInput = styled.input`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.75rem;
  border-radius: 0.5rem;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.neonGreen};
  }
`

const TextArea = styled.textarea`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.neonGreen};
  }
`

const SubmitOfferButton = styled(Button)`
  background: linear-gradient(45deg, #00FF41, #39FF14);
  color: #000;
  font-weight: bold;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const GameCreationSection = styled(GlassCard)`
  padding: 1.5rem;
  margin-top: 2rem;
  text-align: center;
  background: rgba(255, 255, 0, 0.05);
  border: 1px solid rgba(255, 255, 0, 0.2);
  box-shadow: 0 0 20px rgba(255, 255, 0, 0.1);
`

const CreateGameButton = styled(Button)`
  background: linear-gradient(45deg, #FF6B6B, #FF8E8E);
  color: white;
  font-size: 1.1rem;
  padding: 1rem 2rem;
  font-weight: bold;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const FlipEnvironment = () => {
  const { listingId, id } = useParams()
  const navigate = useNavigate()
  const { address, walletClient, publicClient } = useWallet()
  const { isFullyConnected, isContractInitialized } = useWalletConnection()
  const { showSuccess, showError } = useToast()
  
  // Determine if this is a listing or a game based on the URL
  const isGame = !!id
  const currentId = id || listingId
  
  console.log('🎯 FlipEnvironment params:', { listingId, id, isGame, currentId })
  
  // Helper functions for chain URLs
  const getExplorerUrl = (chain, contractAddress, tokenId) => {
    if (!chain || !contractAddress || !tokenId) return null
    
    const explorers = {
      ethereum: `https://etherscan.io/token/${contractAddress}?a=${tokenId}`,
      polygon: `https://polygonscan.com/token/${contractAddress}?a=${tokenId}`,
      base: `https://basescan.org/token/${contractAddress}?a=${tokenId}`,
      arbitrum: `https://arbiscan.io/token/${contractAddress}?a=${tokenId}`,
      optimism: `https://optimistic.etherscan.io/token/${contractAddress}?a=${tokenId}`,
      bsc: `https://bscscan.com/token/${contractAddress}?a=${tokenId}`,
      avalanche: `https://snowtrace.io/token/${contractAddress}?a=${tokenId}`
    }
    return explorers[chain.toLowerCase()] || null
  }

  const getMarketplaceUrl = (chain, contractAddress, tokenId) => {
    if (!chain || !contractAddress || !tokenId) return null
    
    const marketplaces = {
      ethereum: `https://opensea.io/assets/ethereum/${contractAddress}/${tokenId}`,
      polygon: `https://opensea.io/assets/matic/${contractAddress}/${tokenId}`,
      base: `https://opensea.io/assets/base/${contractAddress}/${tokenId}`,
      arbitrum: `https://opensea.io/assets/arbitrum/${contractAddress}/${tokenId}`,
      optimism: `https://opensea.io/assets/optimism/${contractAddress}/${tokenId}`,
      bsc: `https://opensea.io/assets/bsc/${contractAddress}/${tokenId}`,
      avalanche: `https://opensea.io/assets/avalanche/${contractAddress}/${tokenId}`
    }
    return marketplaces[chain.toLowerCase()] || null
  }
  
  const [listing, setListing] = useState(null)
  const [offers, setOffers] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [offerMessage, setOfferMessage] = useState('')
  const [submittingOffer, setSubmittingOffer] = useState(false)
  // Removed creatingGame state since game creation is now automatic
  const [activeViewers, setActiveViewers] = useState([])
  const [viewerCount, setViewerCount] = useState(0)
  const [wsConnected, setWsConnected] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [maxReconnectAttempts] = useState(5)
  // AssetLoadingModal state removed for integrated solution
  const [activeOffer, setActiveOffer] = useState(null)
  const [offerTimer, setOfferTimer] = useState(null)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [showCryptoLoader, setShowCryptoLoader] = useState(false)
  const [cryptoLoading, setCryptoLoading] = useState(false)
  const [cryptoLoaded, setCryptoLoaded] = useState(false)
  
  const messagesEndRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  
  // Determine if we should show offers (for listings OR games that are still waiting for players)
  const shouldShowOffers = !isGame || (isGame && listing?.status === 'waiting')
  
  console.log('🎯 Offer logic:', { isGame, listingStatus: listing?.status, shouldShowOffers })
  console.log('🔗 NFT Links:', { 
    nft_chain: listing?.nft_chain, 
    nft_contract: listing?.nft_contract, 
    nft_token_id: listing?.nft_token_id,
    explorerUrl: getExplorerUrl(listing?.nft_chain, listing?.nft_contract, listing?.nft_token_id),
    marketplaceUrl: getMarketplaceUrl(listing?.nft_chain, listing?.nft_contract, listing?.nft_token_id)
  })
  
  // Initialize contract service when wallet is connected
  useEffect(() => {
    if (!isFullyConnected || !walletClient) {
      console.log('⚠️ Wallet not fully connected, skipping contract initialization')
      return
    }
    
    const initContract = async () => {
      try {
        console.log('🔧 Initializing contract service in FlipEnvironment...')
        const chainId = 8453 // Base network
        await contractService.initializeClients(chainId, walletClient)
        console.log('✅ Contract service initialized successfully in FlipEnvironment')
      } catch (error) {
        console.error('❌ Contract initialization failed in FlipEnvironment:', error)
        showError('Failed to connect to smart contract. Please refresh and try again.')
      }
    }
    
    initContract()
  }, [isFullyConnected, walletClient, showError])

  useEffect(() => {
    fetchListingData()
    setupWebSocket()
    
    // Inject pulse animation CSS
    const style = document.createElement('style')
    style.textContent = pulseKeyframes
    document.head.appendChild(style)
    
    return () => {
      // Clean up CSS
      document.head.removeChild(style)
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (socket) {
        // Leave the room (listing or game)
        if (isGame) {
          socket.send(JSON.stringify({
            type: 'leave_game',
            gameId: currentId,
            address: address || 'anonymous'
          }))
        } else {
          socket.send(JSON.stringify({
            type: 'leave_listing',
            listingId: currentId,
            address: address || 'anonymous'
          }))
        }
        socket.close()
      }
    }
  }, [currentId])
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // AssetLoadingModal useEffect removed for integrated solution
  
  const fetchListingData = async () => {
    try {
      const baseUrl = API_CONFIG.BASE_URL
      
      console.log('🌐 Environment detection:', { 
        hostname: window.location.hostname, 
        baseUrl,
        nodeEnv: process.env.NODE_ENV 
      })
      
      if (isGame) {
        // Fetch game data instead of listing
        console.log('🎮 Fetching game with ID:', currentId)
        console.log('🎮 Full URL:', `${baseUrl}/api/games/${currentId}`)
        const gameResponse = await fetch(`${baseUrl}/api/games/${currentId}`)
        
        if (!gameResponse.ok) {
          if (gameResponse.status === 404) {
            throw new Error(`Game not found. The game may have been removed or the ID is incorrect.`)
          } else {
            throw new Error(`Failed to fetch game (${gameResponse.status}: ${gameResponse.statusText})`)
          }
        }
        
        const gameData = await gameResponse.json()
        console.log('📦 Game data received:', gameData)
        
        // Convert game data to listing format for compatibility
        const listingData = {
          id: gameData.id,
          creator: gameData.creator,
          nft_name: gameData.nft_name,
          nft_image: gameData.nft_image,
          nft_collection: gameData.nft_collection,
          nft_contract: gameData.nft_contract,
          nft_token_id: gameData.nft_token_id,
          asking_price: gameData.price_usd,
          status: gameData.status,
          created_at: gameData.created_at,
          coin: gameData.coin,
          // Game-specific fields
          game_type: gameData.game_type,
          joiner: gameData.joiner,
          winner: gameData.winner,
          contract_game_id: gameData.contract_game_id
        }
        
        setListing(listingData)
        
        // For games, we need to fetch offers if the game is still waiting for players
        if (gameData.status === 'waiting') {
          console.log('🎮 Game is waiting, fetching offers...')
          try {
            const offersResponse = await fetch(`${baseUrl}/api/games/${currentId}/offers`)
            if (offersResponse.ok) {
              const offersData = await offersResponse.json()
              console.log('📦 Game offers from separate fetch:', offersData)
              setOffers(offersData)
            } else {
              console.log('⚠️ Game offers fetch failed:', offersResponse.status)
              setOffers([])
            }
          } catch (error) {
            console.log('⚠️ Game offers endpoint not available, using empty array')
            setOffers([])
          }
        } else {
          setOffers([]) // Games that are not waiting don't have offers
        }
      } else {
        // Fetch listing details
        console.log('🔍 Fetching listing with ID:', currentId)
        const listingResponse = await fetch(`${baseUrl}/api/listings/${currentId}`)
        
        if (!listingResponse.ok) {
          if (listingResponse.status === 404) {
            throw new Error(`Listing not found. The listing may have been removed or the ID is incorrect.`)
          } else {
            throw new Error(`Failed to fetch listing (${listingResponse.status}: ${listingResponse.statusText})`)
          }
        }
        
        const responseData = await listingResponse.json()
        console.log('📦 Listing data received:', responseData)
        
        // Handle nested data structure
        const listingData = responseData.listing || responseData
        console.log('🎯 Processed listing data:', listingData)
        setListing(listingData)
        
        // Handle offers data (might be included in the response or need separate fetch)
        if (responseData.offers) {
          console.log('📦 Offers included in response:', responseData.offers)
          setOffers(responseData.offers)
        } else {
          console.log('⚠️ No offers in response, trying separate fetch')
          // Try to fetch offers separately
          try {
            const offersResponse = await fetch(`${baseUrl}/api/listings/${currentId}/offers`)
            if (offersResponse.ok) {
              const offersData = await offersResponse.json()
              console.log('📦 Offers from separate fetch:', offersData)
              setOffers(offersData)
            } else {
              console.log('⚠️ Separate offers fetch failed:', offersResponse.status)
              setOffers([])
            }
          } catch (error) {
            console.log('⚠️ Offers endpoint not available, using empty array')
            setOffers([])
          }
        }
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      showError(error.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }
  
  const setupWebSocket = () => {
    const ws = new WebSocket(API_CONFIG.WS_URL)
    
    ws.onopen = () => {
      console.log('WebSocket connected')
      setWsConnected(true)
      setReconnectAttempts(0)
      
      if (isGame) {
        // Join the game room for viewer tracking and chat
        ws.send(JSON.stringify({
          type: 'join_game',
          gameId: currentId,
          address: address || 'anonymous'
        }))
        
        // Subscribe to game chat
        ws.send(JSON.stringify({
          type: 'subscribe_game_chat',
          gameId: currentId,
          address: address || 'anonymous'
        }))
      } else {
        // Join the listing room for viewer tracking and chat
        ws.send(JSON.stringify({
          type: 'join_listing',
          listingId: currentId,
          address: address || 'anonymous'
        }))
        
        // Subscribe to listing chat
        ws.send(JSON.stringify({
          type: 'subscribe_listing_chat',
          listingId: currentId,
          address: address || 'anonymous'
        }))
      }
    }
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📡 WebSocket message received:', data)
        
        // ALWAYS dispatch WebSocket messages as window events
        // This ensures they can be caught globally
        window.dispatchEvent(new CustomEvent('websocketMessage', { 
          detail: data,
          bubbles: true // Make sure it bubbles up
        }))
        
        // Make socket available globally for components
        window.socket = ws
        
        console.log('📡 Message type:', data.type)
        console.log('📡 Current ID:', currentId)
        console.log('📡 Is game:', isGame)
        
        // Chat messages (both listing and game)
        if (data.type === 'listing_chat_message' || data.type === 'game_chat_message') {
          setMessages(prev => [...prev, {
            id: Date.now(),
            address: data.address,
            message: data.message,
            timestamp: data.timestamp
          }])
        }
        // Viewer joined
        if (data.type === 'viewer_joined') {
          console.log('👥 Viewer joined, new count:', data.viewerCount)
          setViewerCount(data.viewerCount || 0)
        }
        // Viewer left
        if (data.type === 'viewer_left') {
          console.log('👥 Viewer left, new count:', data.viewerCount)
          setViewerCount(data.viewerCount || 0)
        }
        // Handle real-time offer updates
        if (data.type === 'new_offer' && (data.listingId === currentId || data.gameId === currentId)) {
          console.log('🆕 New offer received:', data.offer)
          showSuccess('New offer received!')
          fetchListingData() // Refresh offers
        }
        if (data.type === 'offer_accepted' && (data.listingId === currentId || data.gameId === currentId)) {
          console.log('✅ Offer accepted:', data.offer)
          showSuccess('Offer accepted! Game created.')
          fetchListingData() // Refresh offers
        }
        if (data.type === 'offer_rejected' && (data.listingId === currentId || data.gameId === currentId)) {
          console.log('❌ Offer rejected:', data.offer)
          showError('Offer was rejected.')
          fetchListingData() // Refresh offers
        }
        // Handle game creation notifications (legacy - should be replaced by enter_lobby)
        if (data.type === 'game_created_pending_deposit') {
          console.log('🎮 WebSocket: Legacy game_created_pending_deposit received:', data)
          // This is legacy - the new flow uses enter_lobby
          // Don't process this message to avoid conflicts
          return
        }
        
        // Handle crypto loaded messages (for Player 1 to be notified)
        if (data.type === 'crypto_loaded') {
          console.log('💰 Crypto loaded message in FlipEnvironment:', data)
          
          // Check if this message is for the current game
          if (data.gameId === currentId || data.contract_game_id === assetModalData?.contract_game_id) {
            console.log('✅ Player 2 has deposited crypto for this game!')
            setPlayer2HasPaid(true)
            setGameReadyToStart(true)
            showSuccess('Player 2 has deposited crypto! Click "Enter Game" to start.')
          }
        }
        
        // Handle game ready messages (for both players to exit lobby)
        if (data.type === 'game_ready' || data.type === 'player_joined') {
          console.log('🎮 Game ready message received:', data)
          console.log('👤 Current user address:', address)
          console.log('🎯 Current ID:', currentId)
          console.log('📡 Target address:', data.targetAddress)
          console.log('🎮 Game ID:', data.gameId)
          console.log('📢 Is broadcast:', data.isBroadcast)
          
          // Check if this message is for the current user (either direct or broadcast)
          const isForCurrentUser = data.targetAddress === address || 
                                  data.gameId === currentId ||
                                  data.isBroadcast // Accept broadcast messages
          
          console.log('✅ Is for current user:', isForCurrentUser)
          
          if (!isForCurrentUser) {
            console.log('⚠️ Game ready message not for current user, ignoring')
            return
          }
          
          console.log('🎯 Dispatching game ready event to window')
          // Dispatch a custom event to the window so AssetLoadingModal can listen for it
          window.dispatchEvent(new CustomEvent('gameReady', {
            detail: {
              type: data.type,
              gameId: data.gameId,
              message: data.message
            }
          }))
        }
        // Handle viewer updates (legacy)
        if (data.type === 'viewers_update' && data.listingId === listingId) {
          setActiveViewers(data.viewers || [])
          setViewerCount(data.viewerCount || 0)
        }
        // REMOVE or comment out the enter_lobby handler - Player 1 doesn't need it

        // Handle offer acceptance with timer
        if (data.type === 'offer_accepted_with_timer') {
          console.log('⏰ Offer accepted with timer:', data)
          
          // Only process if this is for the current listing
          if (data.listingId !== currentId) {
            console.log('⚠️ Offer accepted message not for current listing, ignoring')
            return
          }
          
          // Set the active offer and timer for everyone
          setActiveOffer({
            offerId: data.offerId,
            offererAddress: data.offererAddress,
            offerPrice: data.offerPrice,
            gameId: data.gameId,
            nftContract: data.nftContract,
            nftTokenId: data.nftTokenId,
            nftName: data.nftName,
            nftImage: data.nftImage,
            coin: data.coin
          })
          
          setOfferTimer({
            startTime: data.startTime,
            duration: data.duration
          })
          
          // Show crypto loader ONLY for Player 2 (the offerer)
          if (address === data.offererAddress) {
            setShowCryptoLoader(true)
            showSuccess('Your offer was accepted! Load crypto to join the game.')
          } else if (address === data.acceptedBy) {
            showSuccess('Offer accepted! Waiting for Player 2 to load crypto...')
          }
          
          // Refresh offers to update UI
          fetchListingData()
        }

        // Handle crypto loaded
        if (data.type === 'crypto_loaded') {
          console.log('💰 Crypto loaded message received:', data)
          console.log('🎯 Current active offer:', activeOffer)
          console.log('🎯 Current user address:', address)
          
          // Only process if this is for the current active offer
          if (!activeOffer || activeOffer.gameId !== data.gameId) {
            console.log('⚠️ Crypto loaded message not for current active offer, ignoring')
            console.log('🎯 Active offer gameId:', activeOffer?.gameId)
            console.log('🎯 Message gameId:', data.gameId)
            return
          }
          
          console.log('✅ Processing crypto loaded message for current offer')
          setCryptoLoaded(true)
          setOfferTimer(null)
          showSuccess('Crypto loaded! Preparing to enter game...')
          
          // Auto-navigate to game after a short delay
          setTimeout(() => {
            console.log('🎮 Auto-navigating to game after crypto loaded:', data.gameId)
            navigate(`/flip/${data.gameId}`)
          }, 2000) // 2 second delay to show the success message
        }

        // Handle game ready - transport both players
        if (data.type === 'game_ready' && activeOffer?.gameId === data.gameId) {
          console.log('🎮 Game ready, navigating...')
          setTimeout(() => {
            navigate(`/flip/${data.gameId}`)
          }, 500)
        }

        // Handle transport to game message
        if (data.type === 'TRANSPORT_TO_GAME') {
          console.log('🚀 Transport to game message received:', data)
          setTimeout(() => {
            navigate(`/flip/${data.gameId}`)
          }, 500)
        }

        // Handle game started message
        if (data.type === 'game_started') {
          console.log('🎮 Game started message received:', data)
          // This can be used to show additional UI feedback if needed
        }

        // Handle timer expiration
        if (data.type === 'timer_expired') {
          // Only process if this is for the current active offer
          if (!activeOffer || activeOffer.gameId !== data.gameId) {
            console.log('⚠️ Timer expired message not for current active offer, ignoring')
            return
          }
          
          setOfferTimer(null)
          setActiveOffer(null)
          setShowCryptoLoader(false)
          showError(data.message)
          fetchListingData()
        }
      } catch (error) {
        console.error('❌ Error handling WebSocket message:', error)
      }
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setWsConnected(false)
    }
    
    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason)
      setWsConnected(false)
      
      // Attempt reconnection if not manually closed and under max attempts
      if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000) // Exponential backoff, max 30s
        console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`)
        
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempts(prev => prev + 1)
          setupWebSocket()
        }, delay)
      } else if (reconnectAttempts >= maxReconnectAttempts) {
        showError('Connection lost. Please refresh the page to reconnect.')
      }
    }
    
    setSocket(ws)
  }

  // Timer effect for offer countdown
  useEffect(() => {
    if (offerTimer) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - offerTimer.startTime
        const remaining = Math.max(0, offerTimer.duration - elapsed)
        setTimerSeconds(Math.ceil(remaining / 1000))
        
        if (remaining === 0) {
          setOfferTimer(null)
          setActiveOffer(null)
          setShowCryptoLoader(false)
          showError('Timer expired - Player 2 did not load crypto in time')
        }
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [offerTimer])

  // Auto-navigate effect when crypto is loaded
  useEffect(() => {
    if (cryptoLoaded && activeOffer?.gameId) {
      console.log('🎮 Crypto loaded, auto-navigating to game:', activeOffer.gameId)
      const timer = setTimeout(() => {
        navigate(`/flip/${activeOffer.gameId}`)
      }, 3000) // 3 second delay to ensure all messages are processed
      
      return () => clearTimeout(timer)
    }
  }, [cryptoLoaded, activeOffer?.gameId, navigate])

  // Update sendMessage to use listing_chat or game_chat
  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return
    if (!wsConnected) {
      showError('Not connected. Please wait for reconnection or refresh the page.')
      return
    }
    
    console.log('💬 Sending chat message:', newMessage)
    if (isGame) {
      socket.send(JSON.stringify({
        type: 'game_chat',
        message: newMessage,
        address: address || 'anonymous',
        gameId: currentId
      }))
    } else {
      socket.send(JSON.stringify({
        type: 'listing_chat',
        message: newMessage,
        address: address || 'anonymous',
        listingId: currentId
      }))
    }
    setNewMessage('')
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  const handleSubmitOffer = async (e) => {
    e.preventDefault()
    
    if (!address) {
      showError('Please connect your wallet first')
      return
    }
    
    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      showError('Please enter a valid offer price')
      return
    }
    
    // For games, there's no minimum offer requirement
    if (!isGame && parseFloat(offerPrice) < (listing?.min_offer_price || 0)) {
      showError(`Minimum offer is $${listing?.min_offer_price || 0}`)
      return
    }
    
    setSubmittingOffer(true)
    
    try {
      const baseUrl = API_CONFIG.BASE_URL
      
      const response = await fetch(`${baseUrl}/api/${isGame ? 'games' : 'listings'}/${currentId}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          offerer_address: address,
          offerer_name: address ? address.slice(0, 6) + '...' + address.slice(-4) : 'Unknown',
          offer_price: parseFloat(offerPrice),
          message: offerMessage.trim() || null
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create offer')
      }
      
      showSuccess('Offer submitted successfully!')
      setOfferPrice('')
      setOfferMessage('')
      fetchListingData() // Refresh offers
      
    } catch (error) {
      console.error('Error creating offer:', error)
      showError(error.message)
    } finally {
      setSubmittingOffer(false)
    }
  }
  
  const [acceptingOfferId, setAcceptingOfferId] = useState(null)
  const [rejectingOfferId, setRejectingOfferId] = useState(null)
  
  const handleAcceptOffer = async (offer) => {
    console.log('🚨 handleAcceptOffer FUNCTION CALLED!', offer)
    try {
      console.log('🎯 Attempting to accept offer:', offer)
      console.log('👤 Current user address:', address)
      console.log('📋 Listing creator:', listing?.creator || 'Unknown')
      
      // Check if there's already an active timer
      if (offerTimer) {
        showError('Please wait for the current offer to complete or expire')
        return
      }
      
      // SECURITY CHECK: Verify listing has contract_game_id before allowing offer acceptance
      if (!listing?.contract_game_id) {
        showError('❌ GAME CREATION FAILED: This game was not properly created on the blockchain. Please contact support.')
        return
      }
      
      // Prevent multiple clicks
      setAcceptingOfferId(offer.id)
      
      // Refresh data first to ensure we have the latest offer status
      await fetchListingData()
      
      // Check if the offer is still pending
      const currentOffers = offers.filter(o => o.id === offer.id)
      console.log('🔍 Current offers after refresh:', currentOffers)
      console.log('🎯 Looking for offer ID:', offer.id)
      
      if (currentOffers.length === 0) {
        throw new Error('Offer no longer exists')
      }
      
      const currentOffer = currentOffers[0]
      console.log('📋 Current offer status:', currentOffer.status)
      
      if (currentOffer.status !== 'pending') {
        throw new Error(`Offer is no longer pending (status: ${currentOffer.status})`)
      }
      
      // Check if listing/game is still active
      if (isGame && listing?.status !== 'waiting') {
        throw new Error(`Game is no longer accepting offers (status: ${listing?.status || 'unknown'})`)
      } else if (!isGame && listing?.status !== 'active') {
        throw new Error(`Listing is no longer active (status: ${listing?.status || 'unknown'})`)
      }
      
      const baseUrl = API_CONFIG.BASE_URL
      
      const response = await fetch(`${baseUrl}/api/offers/${offer.id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          acceptor_address: address
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle specific game creation failure
        if (errorData.error === 'GAME_CREATION_FAILED') {
          showError('❌ GAME CREATION FAILED: This game was not properly created on the blockchain. Please contact support.')
          return
        }
        
        throw new Error(errorData.error || 'Failed to accept offer')
      }
      
      const result = await response.json()
      console.log('✅ Offer acceptance API response:', result)
      showSuccess('Offer accepted! Waiting for Player 2 to load crypto...')

      // DO NOT set asset modal data or open it for Player 1
      // Just refresh the listing data
      await fetchListingData()
      
    } catch (error) {
      console.error('Error accepting offer:', error)
      showError(error.message)
    } finally {
      setAcceptingOfferId(null)
    }
  }
  
  const handleRejectOffer = async (offerId) => {
    try {
      // Prevent multiple clicks
      setRejectingOfferId(offerId)
      
      const baseUrl = API_CONFIG.BASE_URL
      
      const response = await fetch(`${baseUrl}/api/offers/${offerId}/reject`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject offer')
      }
      
      showSuccess('Offer rejected')
      await fetchListingData() // Refresh offers
      
    } catch (error) {
      console.error('Error rejecting offer:', error)
      showError(error.message)
    } finally {
      setRejectingOfferId(null)
    }
  }
  
  // Game creation is now handled automatically when offer is accepted
  
  // Contract deposit handlers
  const handleDepositNFT = async (gameId, nftContract, tokenId) => {
    try {
      // Check if wallet is connected
      if (!walletClient || !publicClient) {
        showError('Please connect your wallet to deposit NFT')
        return
      }

      // Approve NFT transfer using the new walletClient
      const approveHash = await walletClient.writeContract({
        address: nftContract,
        abi: ['function approve(address to, uint256 tokenId)'],
        functionName: 'approve',
        args: [contractService.contractAddress, BigInt(tokenId)]
      })
      
      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ 
        hash: approveHash,
        confirmations: 1 
      })
      
      // Call contract to deposit NFT
      const result = await contractService.depositNFTForGame(gameId, nftContract, tokenId)
      if (result.success) {
        showSuccess('NFT deposited successfully!')
      }
    } catch (error) {
      showError('Failed to deposit NFT: ' + error.message)
    }
  }

  const handleDepositCrypto = async (gameId, amount) => {
    try {
      const result = await contractService.depositCrypto(gameId, { value: amount })
      if (result.success) {
        showSuccess('Payment deposited successfully!')
        navigate(`/game/${gameId}`)
      }
    } catch (error) {
      showError('Failed to deposit payment: ' + error.message)
    }
  }

  // Add this function after handleAcceptOffer (around line 1600)
  const handleLoadCrypto = async () => {
    try {
      setCryptoLoading(true)
      console.log('💰 Loading crypto for game:', activeOffer.gameId)
      
      // Check if wallet is connected
      if (!isFullyConnected) {
        throw new Error('Please connect your wallet first')
      }
      
      // Check if contract service is initialized
      if (!contractService.isInitialized()) {
        console.log('⚠️ Contract service not initialized, attempting to initialize...')
        try {
          const chainId = 8453 // Base network
          await contractService.initializeClients(chainId, walletClient)
          console.log('✅ Contract service initialized successfully')
        } catch (initError) {
          console.error('❌ Failed to initialize contract service:', initError)
          throw new Error('Failed to connect to smart contract. Please refresh and try again.')
        }
      }
      
      const priceInWei = ethers.parseEther(activeOffer.offerPrice.toString())
      
      const result = await contractService.joinExistingGameWithPrice(activeOffer.gameId, activeOffer.offerPrice)
      
      if (result.success) {
        showSuccess('Crypto deposited successfully!')
        setCryptoLoaded(true)
        
        // Notify server that crypto is loaded
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'crypto_loaded',
            gameId: activeOffer.gameId,
            contract_game_id: activeOffer.gameId,
            joiner: address,
            transactionHash: result.transactionHash
          }))
        }
      } else {
        throw new Error(result.error || 'Failed to deposit crypto')
      }
    } catch (error) {
      console.error('Error loading crypto:', error)
      showError(error.message || 'Failed to load crypto')
    } finally {
      setCryptoLoading(false)
    }
  }
  
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <LoadingSpinner />
            </div>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }
  
  if (!listing) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <NeonText>Listing not found</NeonText>
            </div>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }
  
  const isOwner = address?.toLowerCase() === listing.creator?.toLowerCase()
  const hasAcceptedOffer = offers.some(offer => offer.status === 'accepted')
  
  // Debug logging for owner check
  console.log('🔍 Owner check debug:', {
    address: address,
    listingCreator: listing?.creator,
    addressLower: address?.toLowerCase(),
    creatorLower: listing?.creator?.toLowerCase(),
    isOwner: isOwner,
    hasOffers: offers.length > 0,
    pendingOffers: offers.filter(o => o.status === 'pending').length
  })
  
  // CLAUDE OPUS PATCH: Normalize NFT contract and token id for Explorer/OpenSea buttons
  const nftContract = listing?.nft_contract || listing?.nftContract;
  const nftTokenId = listing?.nft_token_id || listing?.tokenId;
  const nftChain = listing?.nft_chain || 'base';
  
  // Add this function around line 600
  const handleGameReady = (gameId) => {
    console.log('🎮 Game ready, navigating to game:', gameId)
    navigate(`/game/${gameId}`)
  }
  
  // Integrated Crypto Loader Component
  const CryptoLoaderOverlay = () => {
    if (!showCryptoLoader || !activeOffer) return null
    
    const minutes = Math.floor(timerSeconds / 60)
    const seconds = timerSeconds % 60
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(10, 10, 10, 0.9))',
          border: '2px solid #00FF41',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 255, 65, 0.3)'
        }}>
          <h2 style={{
            color: '#00FF41',
            fontSize: '2rem',
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            Load Crypto to Join Game
          </h2>
          
          {/* Timer */}
          <div style={{
            background: timerSeconds < 30 ? 'rgba(255, 68, 68, 0.1)' : 'rgba(0, 255, 65, 0.1)',
            border: `2px solid ${timerSeconds < 30 ? '#FF4444' : '#00FF41'}`,
            borderRadius: '10px',
            padding: '20px',
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold',
              color: timerSeconds < 30 ? '#FF4444' : '#00FF41',
              fontFamily: 'monospace'
            }}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              fontSize: '1rem',
              marginTop: '10px'
            }}>
              Time remaining to load crypto
            </div>
          </div>
          
          {/* NFT Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '30px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '10px'
          }}>
            <img 
              src={activeOffer.nftImage || '/placeholder-nft.svg'}
              alt={activeOffer.nftName}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '10px',
                objectFit: 'cover'
              }}
            />
            <div>
              <div style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                {activeOffer.nftName}
              </div>
              <div style={{ color: '#00FF41', fontSize: '1.5rem', marginTop: '5px' }}>
                ${activeOffer.offerPrice} ETH
              </div>
            </div>
          </div>
          
          {/* Load Button */}
          {!cryptoLoaded ? (
            <button
              onClick={handleLoadCrypto}
              disabled={cryptoLoading}
              style={{
                width: '100%',
                padding: '20px',
                fontSize: '1.3rem',
                fontWeight: 'bold',
                background: cryptoLoading ? '#333' : 'linear-gradient(45deg, #00FF41, #39FF14)',
                color: cryptoLoading ? '#666' : '#000',
                border: 'none',
                borderRadius: '10px',
                cursor: cryptoLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                animation: !cryptoLoading ? 'pulse 2s infinite' : 'none'
              }}
            >
              {cryptoLoading ? 'Loading...' : 'Load Crypto Now'}
            </button>
          ) : (
            <div style={{
              textAlign: 'center',
              color: '#00FF41',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              ✅ Crypto Loaded! Entering game...
            </div>
          )}
        </div>
      </div>
    )
  }

  // Timer Display Component
  const TimerDisplay = () => {
    if (!offerTimer || timerSeconds === 0 || showCryptoLoader) return null
    
    const minutes = Math.floor(timerSeconds / 60)
    const seconds = timerSeconds % 60
    const isPlayer1 = address === listing?.creator
    const isPlayer2 = address === activeOffer?.offererAddress
    
    // Only show timer to Player 1 and Player 2, not spectators
    if (!isPlayer1 && !isPlayer2) return null
    
    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.9)',
        border: '2px solid #00FF41',
        borderRadius: '10px',
        padding: '15px 25px',
        zIndex: 1000,
        boxShadow: '0 4px 20px rgba(0, 255, 65, 0.3)'
      }}>
        <div style={{ 
          color: '#00FF41', 
          fontSize: '1.2rem', 
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          {isPlayer1 ? 'Waiting for Player 2' : 'Time to Load Crypto'}
        </div>
        <div style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: timerSeconds < 30 ? '#FF4444' : '#FFFFFF',
          textAlign: 'center',
          marginTop: '10px',
          fontFamily: 'monospace'
        }}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        {isPlayer1 && (
          <div style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.9rem',
            textAlign: 'center',
            marginTop: '10px'
          }}>
            No new offers can be accepted
          </div>
        )}
      </div>
    )
  }
  
  return (
    <ThemeProvider theme={theme}>
      <TimerDisplay />
      <CryptoLoaderOverlay />
      <Container>
        <ContentWrapper>
          <EnvironmentContainer>
            <Header>
              <BackButton onClick={() => navigate(-1)}>
                ← Back
              </BackButton>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <ViewerCount>
                  👥 {viewerCount} watching
                </ViewerCount>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: wsConnected ? 'rgba(0, 255, 65, 0.1)' : reconnectAttempts > 0 ? 'rgba(255, 193, 7, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                  border: `1px solid ${wsConnected ? 'rgba(0, 255, 65, 0.3)' : reconnectAttempts > 0 ? 'rgba(255, 193, 7, 0.3)' : 'rgba(255, 0, 0, 0.3)'}`,
                  borderRadius: '0.5rem',
                  color: wsConnected ? '#00FF41' : reconnectAttempts > 0 ? '#FFC107' : '#FF4444',
                  fontWeight: '600',
                  fontSize: '0.875rem'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: wsConnected ? '#00FF41' : reconnectAttempts > 0 ? '#FFC107' : '#FF4444',
                    animation: reconnectAttempts > 0 ? 'pulse 1.5s infinite' : 'none'
                  }} />
                  {wsConnected ? 'Connected' : reconnectAttempts > 0 ? `Reconnecting (${reconnectAttempts}/${maxReconnectAttempts})` : 'Disconnected'}
                </div>
                {!wsConnected && reconnectAttempts >= maxReconnectAttempts && (
                  <button
                    onClick={() => {
                      setReconnectAttempts(0)
                      setupWebSocket()
                    }}
                    style={{
                      padding: '0.25rem 0.5rem',
                      background: 'rgba(0, 123, 255, 0.1)',
                      border: '1px solid rgba(0, 123, 255, 0.3)',
                      borderRadius: '0.25rem',
                      color: '#007BFF',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 123, 255, 0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 123, 255, 0.1)'
                    }}
                  >
                    Reconnect
                  </button>
                )}
                <StatusBadge status={listing.status}>
                  {isGame ? (
                    listing.status === 'waiting' ? 'Waiting for Player' :
                    listing.status === 'joined' ? 'Game Ready' :
                    listing.status === 'active' ? 'In Progress' :
                    listing.status === 'completed' ? 'Completed' : 'Unknown'
                  ) : (
                    listing.status === 'active' ? 'Active' : 
                    listing.status === 'pending' ? 'Pending' : 'Completed'
                  )}
                </StatusBadge>
              </div>
            </Header>
            
            {/* Main Content Area */}
            <div style={{ display: 'flex', gap: '2rem' }}>
              {/* Left Column - Main Content */}
              <div style={{ flex: '1' }}>
                <div style={{ maxWidth: 600, margin: '0 auto' }}>
                  
                  {/* SECURITY WARNING: Show if listing doesn't have contract_game_id */}
                  {!listing?.contract_game_id && (
                    <div style={{
                      background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                      color: '#fff',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      marginBottom: '1rem',
                      border: '2px solid #ff6666',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '1.1rem'
                    }}>
                      ⚠️ GAME CREATION FAILED ⚠️
                      <br />
                      This game was not properly created on the blockchain.
                      <br />
                      Please contact support.
                    </div>
                  )}
                  <NFTDetailsSection>
                    <NFTDisplay>
                      <NFTImage src={listing.nft_image} alt={listing.nft_name} />
                      <NFTInfo>
                        <NFTTitle>{listing.nft_name}</NFTTitle>
                        <NFTCollection>{listing.nft_collection}</NFTCollection>
                        <PriceSection>
                          <AskingPrice>${parseFloat(listing.asking_price).toFixed(2)}</AskingPrice>
                          <MinOffer>{isGame ? 'Entry Fee' : 'Asking Price'}</MinOffer>
                          {!isGame && (
                            <MinOffer>Minimum offer: ${parseFloat(listing.min_offer_price || 0).toFixed(2)}</MinOffer>
                          )}
                        </PriceSection>
                        {/* Explorer and Marketplace Links */}
                        {(nftContract && nftTokenId) && (
                          <div style={{ 
                            display: 'flex', 
                            gap: '0.5rem', 
                            marginTop: '1rem'
                          }}>
                            <a
                              href={`${getExplorerUrl(nftChain, nftContract, nftTokenId)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.8rem',
                                textDecoration: 'none',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              🔍 Explorer
                            </a>
                            <a
                              href={`${getMarketplaceUrl(nftChain, nftContract, nftTokenId)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.8rem',
                                textDecoration: 'none',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <img 
                                src="/images/opensea.png" 
                                alt="OpenSea" 
                                style={{ 
                                  width: '16px', 
                                  height: '16px',
                                  objectFit: 'contain'
                                }} 
                              />
                              OpenSea
                            </a>
                          </div>
                        )}
                      </NFTInfo>
                    </NFTDisplay>
                  </NFTDetailsSection>
                  {/* Show offer form for both games and listings */}
                  {!isOwner && shouldShowOffers && listing?.contract_game_id && (
                    <MakeOfferSection>
                      <MakeOfferHeader>{isGame && listing?.status !== 'waiting' ? 'Join Game' : 'Make an Offer'}</MakeOfferHeader>
                      {isGame && listing?.status !== 'waiting' ? (
                        // Game join section (only for games that are not waiting)
                        <div style={{
                          padding: '1.5rem',
                          background: 'rgba(0, 255, 65, 0.05)',
                          border: '1px solid rgba(0, 255, 65, 0.2)',
                          borderRadius: '1rem',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#00FF41',
                            marginBottom: '1rem'
                          }}>
                            ${parseFloat(listing.asking_price).toFixed(2)} USD
                          </div>
                          <div style={{
                            color: '#fff',
                            marginBottom: '1.5rem'
                          }}>
                            Join this game by paying the entry fee. The NFT is already loaded in the contract.
                          </div>
                          <Button
                            onClick={() => {
                              // Show the Game Lobby modal
                              setAssetModalData({
                                gameId: listing.contract_game_id,
                                creator: listing.creator,
                                joiner: address,
                                nftContract: listing.nft_contract,
                                tokenId: listing.nft_token_id,
                                nftName: listing.nft_name,
                                nftImage: listing.nft_image,
                                priceUSD: listing.asking_price,
                                coin: listing.coin
                              })
                              setShowAssetModal(true)
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #00FF41, #39FF14)',
                              color: '#000',
                              border: 'none',
                              padding: '1rem 2rem',
                              borderRadius: '0.75rem',
                              fontSize: '1.2rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05)'
                              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 65, 0.4)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)'
                              e.currentTarget.style.boxShadow = 'none'
                            }}
                          >
                            🎮 Join Game
                          </Button>
                        </div>
                      ) : (
                        // Offer section for listings and waiting games
                        <OfferForm onSubmit={handleSubmitOffer}>
                          <FormGroup>
                            <Label>Your Offer (USD)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min={isGame ? 0 : (listing.min_offer_price || 0)}
                              value={offerPrice}
                              onChange={(e) => setOfferPrice(e.target.value)}
                              placeholder={isGame ? "Enter your offer (any amount)" : `Min: $${listing.min_offer_price || 0}`}
                              required
                            />
                          </FormGroup>
                          <FormGroup>
                            <Label>Message (Optional)</Label>
                            <TextArea
                              value={offerMessage}
                              onChange={(e) => setOfferMessage(e.target.value)}
                              placeholder={isGame ? "Add a message to your offer..." : "Add a message to your offer..."}
                              rows="3"
                            />
                          </FormGroup>
                          <SubmitOfferButton 
                            type="submit" 
                            disabled={submittingOffer}
                          >
                            {submittingOffer ? 'Submitting...' : (isGame ? 'Submit Offer' : 'Submit Offer')}
                          </SubmitOfferButton>
                        </OfferForm>
                      )}
                    </MakeOfferSection>
                  )}
                  {/* Share Section - Same width as main content */}
                  <ShareSection style={{
                    marginTop: '2rem',
                    padding: '1.5rem',
                    background: 'rgba(0, 191, 255, 0.05)',
                    border: '1px solid rgba(0, 191, 255, 0.2)',
                    borderRadius: '1rem',
                    boxShadow: '0 0 20px rgba(0, 191, 255, 0.1)'
                  }}>
                    <ShareHeader style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: '#00BFFF',
                      marginBottom: '1rem',
                      textAlign: 'left'
                    }}>
                      Share this {isGame ? 'game' : 'listing'}
                    </ShareHeader>
                    <ShareButtons style={{
                      display: 'flex',
                      gap: '1rem',
                      justifyContent: 'flex-start',
                      flexWrap: 'wrap'
                    }}>
                      <ShareButton
                        onClick={() => {
                          const url = window.location.href
                          window.open(`https://twitter.com/intent/tweet?text=Check out this NFT ${isGame ? 'game' : 'listing'} on Crypto Flipz! ${url}`, '_blank')
                        }}
                        style={{
                          padding: '0.75rem 1.5rem',
                          fontSize: '1rem',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '0.75rem',
                          color: '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 191, 255, 0.2)'
                          e.currentTarget.style.borderColor = 'rgba(0, 191, 255, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>𝕏</span>
                        Twitter
                      </ShareButton>
                      <ShareButton
                        onClick={() => {
                          const url = window.location.href
                          window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=Check out this NFT ${isGame ? 'game' : 'listing'} on Crypto Flipz!`, '_blank')
                        }}
                        style={{
                          padding: '0.75rem 1.5rem',
                          fontSize: '1rem',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '0.75rem',
                          color: '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 191, 255, 0.2)'
                          e.currentTarget.style.borderColor = 'rgba(0, 191, 255, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>✈️</span>
                        Telegram
                      </ShareButton>
                      <ShareButton
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href)
                          showSuccess(`${isGame ? 'Game' : 'Listing'} link copied to clipboard!`)
                        }}
                        style={{
                          padding: '0.75rem 1.5rem',
                          fontSize: '1rem',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '0.75rem',
                          color: '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 191, 255, 0.2)'
                          e.currentTarget.style.borderColor = 'rgba(0, 191, 255, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>📋</span>
                        Copy Link
                      </ShareButton>
                    </ShareButtons>
                  </ShareSection>
                  {/* Coin Section - Same width as main content */}
                  {listing.coin && (
                    <div style={{
                      marginTop: '2rem',
                      padding: '1.5rem',
                      background: 'rgba(0, 191, 255, 0.05)',
                      border: '1px solid rgba(0, 191, 255, 0.2)',
                      borderRadius: '1rem',
                      boxShadow: '0 0 20px rgba(0, 191, 255, 0.1)',
                      textAlign: 'left'
                    }}>
                      <div style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: 'bold',
                        color: '#00BFFF',
                        marginBottom: '1rem',
                        textAlign: 'left'
                      }}>
                        Coin
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '1.5rem',
                        justifyContent: 'flex-start',
                        alignItems: 'center'
                      }}>
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '0.75rem',
                          overflow: 'hidden',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          boxShadow: '0 0 15px rgba(0, 191, 255, 0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.5)'
                          e.currentTarget.style.zIndex = '10'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.zIndex = '1'
                        }}
                        title="Hover to zoom">
                          <img 
                            src={listing.coin.headsImage} 
                            alt="Heads" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{
                          fontSize: '1.5rem',
                          color: '#00BFFF',
                          fontWeight: 'bold'
                        }}>
                          vs
                        </div>
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '0.75rem',
                          overflow: 'hidden',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          boxShadow: '0 0 15px rgba(0, 191, 255, 0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.5)'
                          e.currentTarget.style.zIndex = '10'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.zIndex = '1'
                        }}
                        title="Hover to zoom">
                          <img 
                            src={listing.coin.tailsImage} 
                            alt="Tails" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right Column - Chat and Offers */}
              <div style={{ width: '400px' }}>
                <ChatSection>
                  <ChatHeader>
                    <span>Live Chat</span>
                    <span>{viewerCount} watching</span>
                  </ChatHeader>
                  
                  <MessagesContainer>
                    {messages.map((message, index) => (
                      <div key={index} style={{
                        marginBottom: '0.5rem',
                        padding: '0.5rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '0.5rem'
                      }}>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#666',
                          marginBottom: '0.25rem'
                        }}>
                          {message.address?.slice(0, 6)}...{message.address?.slice(-4)}
                        </div>
                        <MessageText>{message.message}</MessageText>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </MessagesContainer>
                  
                  <ChatInput>
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      disabled={!wsConnected}
                    />
                    <SendButton onClick={sendMessage} disabled={!wsConnected}>Send</SendButton>
                  </ChatInput>
                </ChatSection>
                
                <AllOffersSection style={{ marginTop: '1.5rem' }}>
                  <AllOffersHeader>
                    {isGame && listing?.status !== 'waiting' ? 'Game Status' : `All Offers (${offers.length})`}
                  </AllOffersHeader>
                  {isGame && listing?.status !== 'waiting' ? (
                    // Game status section
                    <div style={{
                      padding: '1rem',
                      background: 'rgba(0, 255, 65, 0.05)',
                      border: '1px solid rgba(0, 255, 65, 0.2)',
                      borderRadius: '0.5rem',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: '#00FF41',
                        marginBottom: '0.5rem'
                      }}>
                        {listing.status === 'waiting' ? 'Waiting for Player' :
                         listing.status === 'pending' ? 'Waiting for Assets' :
                         listing.status === 'joined' ? 'Game Ready' :
                         listing.status === 'active' ? 'In Progress' :
                         listing.status === 'completed' ? 'Completed' : 'Unknown Status'}
                      </div>
                      <div style={{
                        color: '#fff',
                        fontSize: '0.9rem'
                      }}>
                        {listing.status === 'waiting' ? 'Click "Join Game" to participate' :
                         listing.status === 'pending' ? 'Both players need to deposit their assets' :
                         listing.status === 'joined' ? 'Both players are ready. Game will start soon.' :
                         listing.status === 'active' ? 'Game is currently being played' :
                         listing.status === 'completed' ? 'Game has finished' : 'Unknown'}
                      </div>
                    </div>
                  ) : (
                    // Offers section for listings and waiting games
                    offers.length > 0 ? (
                      offers.map(offer => (
                        <PublicOfferCard key={offer.id}>
                          <PublicOfferHeader>
                            <PublicOfferPrice>${parseFloat(offer.offer_price).toFixed(2)}</PublicOfferPrice>
                            {console.log('🎯 Rendering offer buttons for offer:', offer.id, {
                              isOwner,
                              offerStatus: offer.status,
                              shouldShowButtons: isOwner && offer.status === 'pending'
                            })}
                            {address === listing?.creator && offer.status === 'pending' && !activeOffer && (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <ActionButton 
                                  className="accept"
                                  onClick={() => {
                                    console.log('🎯 Accept button clicked for offer:', offer.id)
                                    handleAcceptOffer(offer)
                                  }}
                                  disabled={acceptingOfferId === offer.id || activeOffer !== null}
                                  style={{
                                    opacity: (acceptingOfferId === offer.id || activeOffer) ? 0.5 : 1,
                                    cursor: (acceptingOfferId === offer.id || activeOffer) ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  {acceptingOfferId === offer.id ? 'Accepting...' : 'Accept'}
                                </ActionButton>
                                <ActionButton 
                                  className="reject"
                                  onClick={() => handleRejectOffer(offer.id)}
                                  disabled={acceptingOfferId === offer.id || rejectingOfferId === offer.id}
                                  style={{
                                    opacity: (acceptingOfferId === offer.id || rejectingOfferId === offer.id) ? 0.5 : 1,
                                    cursor: (acceptingOfferId === offer.id || rejectingOfferId === offer.id) ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  {rejectingOfferId === offer.id ? 'Rejecting...' : 'Reject'}
                                </ActionButton>
                              </div>
                            )}

                            {/* Show timer status for the active offer */}
                            {activeOffer?.offerId === offer.id && offerTimer && (
                              <div style={{
                                color: '#00FF41',
                                fontSize: '0.9rem',
                                marginTop: '0.5rem',
                                animation: 'pulse 2s infinite'
                              }}>
                                ⏳ Waiting for crypto deposit...
                              </div>
                            )}
                          </PublicOfferHeader>
                          <PublicOfferInfo>
                            From: {offer.offerer_name || `${offer.offerer_address?.slice(0, 6)}...${offer.offerer_address?.slice(-4)}`}
                          </PublicOfferInfo>
                          {offer.message && (
                            <PublicOfferMessage>"{offer.message}"</PublicOfferMessage>
                          )}
                          {offer.status !== 'pending' && (
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: offer.status === 'accepted' ? '#00FF41' : '#FF4444',
                              fontWeight: 'bold'
                            }}>
                              {offer.status === 'accepted' ? '✅ Accepted' : '❌ Rejected'}
                            </div>
                          )}
                        </PublicOfferCard>
                      ))
                    ) : (
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', padding: '1rem' }}>
                        No offers yet
                      </div>
                    )
                  )}
                </AllOffersSection>
              </div>
            </div>
            
            {/* Game Creation Section - Removed since game is created automatically when offer is accepted */}
          </EnvironmentContainer>
        </ContentWrapper>
      </Container>
      
      {/* Asset Loading Modal - Removed for integrated solution */}
    </ThemeProvider>
  )
}

export default FlipEnvironment 