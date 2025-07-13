import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
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
import AssetLoadingModal from '../components/AssetLoadingModal'

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
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 0, 0.3);
`

const ViewerCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 0, 0.1);
  border: 1px solid rgba(255, 255, 0, 0.3);
  border-radius: 0.5rem;
  color: #FFD700;
  font-weight: 600;
  font-size: 0.875rem;
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
  background: rgba(255, 255, 0, 0.05);
  border: 1px solid rgba(255, 255, 0, 0.2);
  box-shadow: 0 0 20px rgba(255, 255, 0, 0.1);
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
  border: 2px solid rgba(0, 255, 65, 0.3);
  box-shadow: 0 0 20px rgba(0, 255, 65, 0.2);
  
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
  background: rgba(0, 255, 65, 0.1);
  border: 1px solid rgba(0, 255, 65, 0.3);
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
`

const AskingPrice = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: ${props => props.theme.colors.neonGreen};
  margin-bottom: 0.5rem;
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
  background: rgba(255, 255, 0, 0.05);
  border: 1px solid rgba(255, 255, 0, 0.2);
  box-shadow: 0 0 20px rgba(255, 255, 0, 0.1);
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
  background: rgba(255, 255, 0, 0.05);
  border: 1px solid rgba(255, 255, 0, 0.2);
  box-shadow: 0 0 20px rgba(255, 255, 0, 0.1);
  max-height: 400px;
  overflow-y: auto;
`

const AllOffersHeader = styled.div`
  font-weight: bold;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 0, 0.3);
  color: #FFD700;
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
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { address, signer } = useWallet()
  const { showSuccess, showError } = useToast()
  
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
  const [showAssetModal, setShowAssetModal] = useState(false)
  const [assetModalData, setAssetModalData] = useState(null)
  
  const messagesEndRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  
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
        // Leave the listing room
        socket.send(JSON.stringify({
          type: 'leave_listing',
          listingId,
          address: address
        }))
        socket.close()
      }
    }
  }, [listingId])
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const fetchListingData = async () => {
    try {
      const baseUrl = API_CONFIG.BASE_URL
      
      console.log('🌐 Environment detection:', { 
        hostname: window.location.hostname, 
        baseUrl,
        nodeEnv: process.env.NODE_ENV 
      })
      
      // Fetch listing details
      console.log('🔍 Fetching listing with ID:', listingId)
      const listingResponse = await fetch(`${baseUrl}/api/listings/${listingId}`)
      if (!listingResponse.ok) throw new Error('Failed to fetch listing')
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
          const offersResponse = await fetch(`${baseUrl}/api/listings/${listingId}/offers`)
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
      
    } catch (error) {
      console.error('Error fetching listing data:', error)
      showError('Failed to load listing data')
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
      ws.send(JSON.stringify({
        type: 'subscribe_listing_chat',
        listingId
      }))
      // Join the listing room for viewer tracking
      ws.send(JSON.stringify({
        type: 'join_listing',
        listingId,
        address: address || 'anonymous'
      }))
    }
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      // Listing chat message
      if (data.type === 'listing_chat_message') {
        setMessages(prev => [...prev, {
          id: Date.now(),
          address: data.address,
          message: data.message,
          timestamp: data.timestamp
        }])
      }
      // Viewer joined
      if (data.type === 'viewer_joined') {
        setViewerCount(prev => prev + 1)
      }
      // Viewer left
      if (data.type === 'viewer_left') {
        setViewerCount(prev => Math.max(0, prev - 1))
      }
      // Handle real-time offer updates
      if (data.type === 'new_offer' && data.listingId === listingId) {
        console.log('🆕 New offer received:', data.offer)
        showSuccess('New offer received!')
        fetchListingData() // Refresh offers
      }
      if (data.type === 'offer_accepted' && data.listingId === listingId) {
        console.log('✅ Offer accepted:', data.offer)
        showSuccess('Offer accepted! Game created.')
        fetchListingData() // Refresh offers
      }
      if (data.type === 'offer_rejected' && data.listingId === listingId) {
        console.log('❌ Offer rejected:', data.offer)
        showError('Offer was rejected.')
        fetchListingData() // Refresh offers
      }
      // Handle game creation notifications
      if (data.type === 'game_created_pending_deposit') {
        console.log('🎮 Game created, pending deposits:', data)
        showSuccess(`Game created! Please deposit your ${data.requiredAction === 'deposit_nft' ? 'NFT' : 'payment'}.`)
        
        // Show asset loading modal for both players
        setAssetModalData({
          gameId: data.gameId,
          creator: data.role === 'creator' ? address : listing.creator,
          joiner: data.role === 'joiner' ? address : listing.creator,
          nftContract: data.nft_contract || listing.nft_contract,
          tokenId: data.nft_token_id || listing.nft_token_id,
          nftName: data.nft_name || listing.nft_name,
          nftImage: data.nft_image || listing.nft_image,
          priceUSD: data.amount || listing.asking_price,
          coin: data.coin || listing.coin
        })
        setShowAssetModal(true)
      }
      // Handle viewer updates (legacy)
      if (data.type === 'viewers_update' && data.listingId === listingId) {
        setActiveViewers(data.viewers || [])
        setViewerCount(data.viewerCount || 0)
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

  // Update sendMessage to use listing_chat
  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return
    if (!wsConnected) {
      showError('Not connected. Please wait for reconnection or refresh the page.')
      return
    }
    socket.send(JSON.stringify({
      type: 'listing_chat',
      message: newMessage,
      address: address || 'anonymous',
      listingId
    }))
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
    
    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      showError('Please enter a valid offer price')
      return
    }
    
    if (parseFloat(offerPrice) < listing.min_offer_price) {
      showError(`Minimum offer is $${listing.min_offer_price}`)
      return
    }
    
    setSubmittingOffer(true)
    
    try {
      const baseUrl = API_CONFIG.BASE_URL
      
      const response = await fetch(`${baseUrl}/api/listings/${listingId}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          offerer_address: address,
          offerer_name: address.slice(0, 6) + '...' + address.slice(-4),
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
  
  const handleAcceptOffer = async (offer) => {
    try {
      console.log('🎯 Attempting to accept offer:', offer)
      console.log('👤 Current user address:', address)
      console.log('📋 Listing creator:', listing.creator)
      
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
      
      // Check if listing is still active
      if (listing.status !== 'active') {
        throw new Error(`Listing is no longer active (status: ${listing.status})`)
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
        throw new Error(errorData.error || 'Failed to accept offer')
      }
      
      const result = await response.json()
      showSuccess('Offer accepted! Preparing game...')
      
      // The modal will be shown via WebSocket broadcast to both players
      
    } catch (error) {
      console.error('Error accepting offer:', error)
      showError(error.message)
    }
  }
  
  const handleRejectOffer = async (offerId) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL
      
      const response = await fetch(`${baseUrl}/api/offers/${offerId}/reject`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject offer')
      }
      
      showSuccess('Offer rejected')
      fetchListingData() // Refresh offers
      
    } catch (error) {
      console.error('Error rejecting offer:', error)
      showError(error.message)
    }
  }
  
  // Game creation is now handled automatically when offer is accepted
  
  // Contract deposit handlers
  const handleDepositNFT = async (gameId, nftContract, tokenId) => {
    try {
      // Approve NFT transfer
      // (Assume ethers and signer are available in scope)
      const nftContractInstance = new ethers.Contract(nftContract, ['function approve(address,uint256)'], signer)
      await nftContractInstance.approve(contractService.gameContractAddress, tokenId)
      // Call contract to deposit NFT
      const result = await contractService.depositNFT(gameId, nftContract, tokenId)
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
  
  return (
    <ThemeProvider theme={theme}>
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
                  {listing.status === 'active' ? 'Active' : 
                   listing.status === 'pending' ? 'Pending' : 'Completed'}
                </StatusBadge>
              </div>
            </Header>
            
            {/* Main Content Area */}
            <div style={{ display: 'flex', gap: '2rem' }}>
              {/* Left Column - Main Content */}
              <div style={{ flex: '1' }}>
                <div style={{ maxWidth: 600, margin: '0 auto' }}>
                  <NFTDetailsSection>
                    <NFTDisplay>
                      <NFTImage src={listing.nft_image} alt={listing.nft_name} />
                      <NFTInfo>
                        <NFTTitle>{listing.nft_name}</NFTTitle>
                        <NFTCollection>{listing.nft_collection}</NFTCollection>
                        <PriceSection>
                          <AskingPrice>${parseFloat(listing.asking_price).toFixed(2)}</AskingPrice>
                          <MinOffer>Asking Price</MinOffer>
                          <MinOffer>Minimum offer: ${parseFloat(listing.min_offer_price).toFixed(2)}</MinOffer>
                        </PriceSection>
                        {/* Explorer and Marketplace Links */}
                        <div style={{ 
                          display: 'flex', 
                          gap: '1rem', 
                          marginTop: '1rem',
                          flexWrap: 'wrap'
                        }}>
                          {getExplorerUrl(listing.nft_chain, listing.nft_contract, listing.nft_token_id) && (
                            <a 
                              href={getExplorerUrl(listing.nft_chain, listing.nft_contract, listing.nft_token_id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                background: 'rgba(128, 128, 128, 0.1)',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.8rem',
                                textDecoration: 'none',
                                color: '#808080', // Light grey
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                border: '1px solid rgba(128, 128, 128, 0.2)',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              Explorer
                            </a>
                          )}
                          {getMarketplaceUrl(listing.nft_chain, listing.nft_contract, listing.nft_token_id) && (
                            <a 
                              href={getMarketplaceUrl(listing.nft_chain, listing.nft_contract, listing.nft_token_id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                background: 'rgba(0, 123, 255, 0.1)',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.8rem',
                                textDecoration: 'none',
                                color: '#007BFF', // Light blue
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                border: '1px solid rgba(0, 123, 255, 0.2)',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              OpenSea
                            </a>
                          )}
                        </div>
                      </NFTInfo>
                    </NFTDisplay>
                  </NFTDetailsSection>
                  {/* Move Make an Offer below NFT details, not in grid with chat */}
                  {!isOwner && (
                    <MakeOfferSection>
                      <MakeOfferHeader>Make an Offer</MakeOfferHeader>
                      <OfferForm onSubmit={handleSubmitOffer}>
                        <FormGroup>
                          <Label>Your Offer (USD)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min={listing.min_offer_price}
                            value={offerPrice}
                            onChange={(e) => setOfferPrice(e.target.value)}
                            placeholder={`Min: $${listing.min_offer_price}`}
                            required
                          />
                        </FormGroup>
                        <FormGroup>
                          <Label>Message (Optional)</Label>
                          <TextArea
                            value={offerMessage}
                            onChange={(e) => setOfferMessage(e.target.value)}
                            placeholder="Add a message to your offer..."
                            rows="3"
                          />
                        </FormGroup>
                        <SubmitOfferButton 
                          type="submit" 
                          disabled={submittingOffer}
                        >
                          {submittingOffer ? 'Submitting...' : 'Submit Offer'}
                        </SubmitOfferButton>
                      </OfferForm>
                    </MakeOfferSection>
                  )}
                  {/* Share Section - Same width as main content */}
                  <ShareSection style={{
                    marginTop: '2rem',
                    padding: '1.5rem',
                    background: 'rgba(255, 255, 0, 0.05)',
                    border: '1px solid rgba(255, 255, 0, 0.2)',
                    borderRadius: '1rem',
                    boxShadow: '0 0 20px rgba(255, 255, 0, 0.1)'
                  }}>
                    <ShareHeader style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: '#FFD700',
                      marginBottom: '1rem',
                      textAlign: 'left'
                    }}>
                      Share this listing
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
                          window.open(`https://twitter.com/intent/tweet?text=Check out this NFT listing on Crypto Flipz! ${url}`, '_blank')
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
                          e.currentTarget.style.background = 'rgba(255, 255, 0, 0.2)'
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 0, 0.4)'
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
                          window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=Check out this NFT listing on Crypto Flipz!`, '_blank')
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
                          e.currentTarget.style.background = 'rgba(255, 255, 0, 0.2)'
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 0, 0.4)'
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
                          showSuccess('Listing link copied to clipboard!')
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
                          e.currentTarget.style.background = 'rgba(255, 255, 0, 0.2)'
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 0, 0.4)'
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
                      background: 'rgba(255, 255, 0, 0.05)',
                      border: '1px solid rgba(255, 255, 0, 0.2)',
                      borderRadius: '1rem',
                      boxShadow: '0 0 20px rgba(255, 255, 0, 0.1)',
                      textAlign: 'left'
                    }}>
                      <div style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: 'bold',
                        color: '#FFD700',
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
                          boxShadow: '0 0 15px rgba(255, 255, 0, 0.2)'
                        }}>
                          <img 
                            src={listing.coin.headsImage} 
                            alt="Heads" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{
                          fontSize: '1.5rem',
                          color: '#FFD700',
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
                          boxShadow: '0 0 15px rgba(255, 255, 0, 0.2)'
                        }}>
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
                
                <AllOffersSection>
                  <AllOffersHeader>All Offers ({offers.length})</AllOffersHeader>
                  {offers.length > 0 ? (
                    offers.map(offer => (
                      <PublicOfferCard key={offer.id}>
                        <PublicOfferHeader>
                          <PublicOfferPrice>${parseFloat(offer.offer_price).toFixed(2)}</PublicOfferPrice>
                          {isOwner && offer.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <ActionButton 
                                className="accept"
                                onClick={() => handleAcceptOffer(offer)}
                              >
                                Accept
                              </ActionButton>
                              <ActionButton 
                                className="reject"
                                onClick={() => handleRejectOffer(offer.id)}
                              >
                                Reject
                              </ActionButton>
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
                  )}
                </AllOffersSection>
              </div>
            </div>
            
            {/* Game Creation Section - Removed since game is created automatically when offer is accepted */}
          </EnvironmentContainer>
        </ContentWrapper>
      </Container>
      
      {/* Asset Loading Modal */}
      <AssetLoadingModal
        isOpen={showAssetModal}
        onClose={() => setShowAssetModal(false)}
        gameData={assetModalData}
        onGameReady={(gameId) => {
          setShowAssetModal(false)
          navigate(`/game/${gameId}`)
        }}
        isCreator={address === assetModalData?.creator}
      />
    </ThemeProvider>
  )
}

export default FlipEnvironment 