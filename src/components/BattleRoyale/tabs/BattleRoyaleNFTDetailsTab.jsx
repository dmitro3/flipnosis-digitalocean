import React, { useState, useEffect, useRef, useCallback } from 'react'
import styled from '@emotion/styled'
import ProfilePicture from '../../ProfilePicture'
import socketService from '../../../services/SocketService'

const TabContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  padding: 1.5rem;
  overflow-y: auto;
  align-items: flex-start;
  min-height: 0;
  
  @media (max-width: 1200px) {
    gap: 1rem;
    padding: 1rem;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
    align-items: stretch;
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
    gap: 0.75rem;
  }
`

const NFTSection = styled.div`
  background: rgba(0, 0, 40, 0.6);
  padding: 1rem;
  border-radius: 1rem;
  border: 2px solid #FF1493;
  backdrop-filter: blur(15px);
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.3), inset 0 0 20px rgba(255, 20, 147, 0.1);
  position: relative;
  overflow: hidden;
  flex: 0.8;
  height: fit-content;
  max-height: 100%;
  min-height: 0;
  z-index: 1;
  
  @media (max-width: 1200px) {
    padding: 0.75rem;
    flex: 1;
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
    flex: none;
    width: 100%;
    max-height: none;
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 20, 147, 0.1) 50%, transparent 70%);
    animation: shimmer 3s ease-in-out infinite;
    pointer-events: none;
    z-index: -1;
  }
  
  @keyframes shimmer {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }
`

const NFTHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 20, 147, 0.3);
`

const NFTTitle = styled.h2`
  margin: 0;
  color: #FF1493;
  font-size: 1.4rem;
  font-weight: bold;
`

const VerificationBadge = styled.div`
  padding: 0.5rem 1rem;
  background: ${props => props.verified ? 'rgba(0, 255, 65, 0.2)' : 'rgba(255, 149, 0, 0.2)'};
  border: 1px solid ${props => props.verified ? '#00FF41' : '#FF9500'};
  border-radius: 0.5rem;
  color: ${props => props.verified ? '#00FF41' : '#FF9500'};
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
`

const NFTImage = styled.img`
  width: 100%;
  max-width: 200px;
  height: auto;
  border-radius: 0.75rem;
  border: 2px solid rgba(255, 20, 147, 0.3);
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #FF1493;
    box-shadow: 0 0 20px rgba(255, 20, 147, 0.4);
  }
`

const NFTInfo = styled.div`
  margin-bottom: 1rem;
`

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const InfoLabel = styled.span`
  color: #aaa;
  font-size: 0.9rem;
  font-weight: 500;
`

const InfoValue = styled.span`
  color: white;
  font-weight: bold;
  font-size: 1rem;
`

const PriceDisplay = styled.div`
  background: linear-gradient(135deg, rgba(0, 255, 0, 0.2), rgba(0, 200, 0, 0.1));
  border: 2px solid #00FF00;
  border-radius: 0.75rem;
  padding: 0.75rem;
  text-align: center;
  margin-top: 1rem;
  max-width: 200px;
  margin-left: auto;
  margin-right: auto;
`

const PriceLabel = styled.div`
  color: #aaa;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`

const PriceValue = styled.div`
  color: #00FF00;
  font-size: 1.8rem;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
`

const NFTContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1.5rem;
  align-items: start;
  
  @media (max-width: 1200px) {
    gap: 1rem;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

const NFTImageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`

const NFTDetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const ShareButtonsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  width: 100%;
  margin-top: 1rem;
`

const ActionButton = styled.button`
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 2.5rem;
  box-sizing: border-box;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-2px);
  }
  
  &.share-x {
    background: linear-gradient(135deg, #1da1f2 0%, #0d8bd9 50%, #1da1f2 100%);
    border-color: #1da1f2;
  }
  
  &.share-tg {
    background: linear-gradient(135deg, #0088cc 0%, #006699 50%, #0088cc 100%);
    border-color: #0088cc;
  }
  
  &.opensea {
    background: linear-gradient(135deg, #2081e2 0%, #1a6bb8 50%, #2081e2 100%);
    border-color: #2081e2;
  }
  
  &.explorer {
    background: linear-gradient(135deg, #6c757d 0%, #7a8288 50%, #6c757d 100%);
    border-color: #6c757d;
  }
`

// Chat Section Styles
const ChatSection = styled.div`
  background: rgba(0, 0, 40, 0.6);
  padding: 1.25rem;
  border-radius: 1rem;
  border: 2px solid #00BFFF;
  backdrop-filter: blur(15px);
  box-shadow: 0 0 30px rgba(0, 191, 255, 0.3), inset 0 0 20px rgba(0, 191, 255, 0.1);
  position: relative;
  overflow: hidden;
  flex: 1;
  height: fit-content;
  max-height: 100%;
  min-height: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 1200px) {
    padding: 1rem;
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
    flex: none;
    width: 100%;
    max-height: none;
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(0, 191, 255, 0.1) 50%, transparent 70%);
    animation: shimmer 3s ease-in-out infinite;
    pointer-events: none;
    z-index: -1;
  }
`

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 191, 255, 0.3);
  width: 100%;
`

const ChatTitle = styled.h2`
  margin: 0;
  color: #00BFFF;
  font-size: 1.4rem;
  font-weight: bold;
`

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 200px;
  max-height: 600px;
`

const Message = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: ${props => props.isCurrentUser ? 'flex-end' : 'flex-start'};
`

const MessageBubble = styled.div`
  background: ${props => props.isCurrentUser ? 
    'rgba(0, 191, 255, 0.2)' : 
    'rgba(255, 255, 255, 0.1)'
  };
  border: 2px solid transparent;
  border-radius: 0.5rem;
  padding: 1rem;
  max-width: 80%;
  word-wrap: break-word;
  color: white;
  font-size: 1.1rem;
  line-height: 1.4;
  animation: 
    slideIn 0.3s ease-out,
    rotatingBorder 3s linear infinite,
    borderPulse 1.5s ease-in-out infinite;
  animation-delay: ${props => props.index * 0.1}s, ${props => props.index * 0.1}s, ${props => props.index * 0.1}s;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes rotatingBorder {
    0% {
      border-color: rgba(255, 20, 147, 0.8);
      box-shadow: 
        0 0 20px rgba(255, 20, 147, 0.6),
        0 0 40px rgba(255, 20, 147, 0.3),
        inset 0 0 20px rgba(255, 20, 147, 0.1);
    }
    20% {
      border-color: rgba(255, 255, 0, 0.8);
      box-shadow: 
        0 0 20px rgba(255, 255, 0, 0.6),
        0 0 40px rgba(255, 255, 0, 0.3),
        inset 0 0 20px rgba(255, 255, 0, 0.1);
    }
    40% {
      border-color: rgba(0, 255, 65, 0.8);
      box-shadow: 
        0 0 20px rgba(0, 255, 65, 0.6),
        0 0 40px rgba(0, 255, 65, 0.3),
        inset 0 0 20px rgba(0, 255, 65, 0.1);
    }
    60% {
      border-color: rgba(0, 191, 255, 0.8);
      box-shadow: 
        0 0 20px rgba(0, 191, 255, 0.6),
        0 0 40px rgba(0, 191, 255, 0.3),
        inset 0 0 20px rgba(0, 191, 255, 0.1);
    }
    80% {
      border-color: rgba(138, 43, 226, 0.8);
      box-shadow: 
        0 0 20px rgba(138, 43, 226, 0.6),
        0 0 40px rgba(138, 43, 226, 0.3),
        inset 0 0 20px rgba(138, 43, 226, 0.1);
    }
    100% {
      border-color: rgba(255, 20, 147, 0.8);
      box-shadow: 
        0 0 20px rgba(255, 20, 147, 0.6),
        0 0 40px rgba(255, 20, 147, 0.3),
        inset 0 0 20px rgba(255, 20, 147, 0.1);
    }
  }
  
  @keyframes borderPulse {
    0%, 100% {
      opacity: 0.8;
    }
    50% {
      opacity: 1;
    }
  }
`

const MessageSender = styled.div`
  font-size: 1rem;
  color: ${props => props.isCurrentUser ? '#00BFFF' : '#FFD700'};
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const MessageTime = styled.div`
  font-size: 0.7rem;
  color: #666;
  margin-top: 0.25rem;
`

const ChatInput = styled.div`
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 0.75rem;
`

const MessageInput = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 0.75rem;
  color: white;
  font-size: 0.9rem;
  
  &::placeholder {
    color: #aaa;
  }
  
  &:focus {
    outline: none;
    border-color: #00BFFF;
    box-shadow: 0 0 10px rgba(0, 191, 255, 0.3);
  }
`

const SendButton = styled.button`
  background: linear-gradient(135deg, #00BFFF, #0080FF);
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #0080FF, #0060FF);
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const BattleRoyaleNFTDetailsTab = ({ gameData, gameId, address }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [connected, setConnected] = useState(true) // For now, assume connected
  
  const messagesEndRef = useRef(null)
  
  // Scroll to bottom of chat
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])
  
  // Load chat history
  const loadChatHistory = useCallback(async () => {
    try {
      // For battle royale, we need to use the br_ format for the API call
      const cleanGameId = gameId.startsWith('game_') ? gameId : `game_${gameId}`
      const response = await fetch(`/api/chat/${cleanGameId}?limit=100`)
      if (response.ok) {
        const data = await response.json()
        if (data.messages && Array.isArray(data.messages)) {
          const formattedMessages = data.messages.map(msg => ({
            id: msg.id || Date.now() + Math.random(),
            sender: msg.sender_address || msg.sender,
            message: msg.message,
            timestamp: new Date(msg.timestamp || msg.created_at).toLocaleTimeString(),
            isCurrentUser: (msg.sender_address || msg.sender)?.toLowerCase() === address?.toLowerCase()
          }))
          setMessages(formattedMessages)
          console.log(`📜 Loaded ${formattedMessages.length} chat messages for game ${cleanGameId}`)
        }
      }
    } catch (error) {
      console.error('❌ Failed to load chat history:', error)
    }
  }, [gameId, address])
  
  // Load initial data
  useEffect(() => {
    loadChatHistory()
  }, [loadChatHistory])
  
  // Socket connection and chat functionality
  useEffect(() => {
    if (!gameId || !address) return

    let mounted = true

    const setupChatSocket = async () => {
      try {
        // Connect to socket if not already connected
        if (!socketService.isConnected()) {
          await socketService.connect(gameId, address)
        }

        // Join the battle royale room - use br_ format for battle royale
        const roomId = gameId.startsWith('game_') ? gameId : `game_${gameId}`
        socketService.emit('join_battle_royale_room', {
          roomId: roomId,
          address
        })

        // Listen for incoming chat messages
        const handleChatMessage = (data) => {
          if (!mounted) return
          
          const newMessage = {
            id: Date.now() + Math.random(),
            sender: data.from || data.address,
            message: data.message,
            timestamp: new Date(data.timestamp).toLocaleTimeString(),
            isCurrentUser: (data.from || data.address)?.toLowerCase() === address?.toLowerCase()
          }
          
          setMessages(prev => [...prev, newMessage])
        }

        socketService.on('chat_message', handleChatMessage)

        // Clean up on unmount
        return () => {
          mounted = false
          socketService.off('chat_message', handleChatMessage)
        }
      } catch (error) {
        console.error('Failed to setup chat socket:', error)
      }
    }

    const cleanup = setupChatSocket()

    return () => {
      mounted = false
      cleanup?.then(fn => fn?.())
    }
  }, [gameId, address])
  
  // Auto-scroll chat
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])
  
  // Send chat message
  const sendMessage = () => {
    if (!newMessage.trim()) return
    
    const messageText = newMessage.trim()
    console.log('💬 Sending chat message:', { message: messageText, from: address })
    
    // Use br_ format for battle royale room
    const roomId = gameId.startsWith('game_') ? gameId : `game_${gameId}`
    
    // Send to server via socket
    socketService.emit('chat_message', {
      roomId: roomId,
      message: messageText,
      address
    })
    
    // Clear input immediately to prevent double sending
    setNewMessage('')
    
    // Don't add optimistic message - let server handle it to prevent duplicates
  }

  // Helper functions for NFT data
  const getNFTName = () => {
    return gameData?.nft_name || gameData?.nftName || 'Unknown NFT'
  }

  const getNFTCollection = () => {
    return gameData?.nft_collection || gameData?.nftCollection || 'Unknown Collection'
  }

  const getNFTTokenId = () => {
    return gameData?.nft_token_id || gameData?.nftTokenId || 'Unknown'
  }

  const getNFTContract = () => {
    return gameData?.nft_contract || gameData?.nftContract || 'Unknown'
  }

  const getNFTChain = () => {
    return gameData?.nft_chain || gameData?.nftChain || 'Unknown'
  }

  const getNFTImage = () => {
    return gameData?.nft_image || gameData?.nftImage || '/placeholder-nft.svg'
  }

  // Helper function to get marketplace URL
  const getMarketplaceUrl = (chain) => {
    const marketplaces = {
      ethereum: 'https://opensea.io/assets/ethereum',
      polygon: 'https://opensea.io/assets/matic',
      base: 'https://opensea.io/assets/base',
      arbitrum: 'https://opensea.io/assets/arbitrum',
      optimism: 'https://opensea.io/assets/optimism',
    }
    return marketplaces[chain?.toLowerCase()] || 'https://opensea.io/assets/base'
  }

  // Helper function to get explorer URL
  const getExplorerUrl = (chain, contract, tokenId) => {
    if (!chain || !contract || !tokenId) return '#'
    
    const explorers = {
      ethereum: 'https://etherscan.io/token',
      polygon: 'https://polygonscan.com/token',
      base: 'https://basescan.org/token',
      arbitrum: 'https://arbiscan.io/token',
      optimism: 'https://optimistic.etherscan.io/token',
    }
    
    const baseUrl = explorers[chain.toLowerCase()] || 'https://basescan.org/token'
    return `${baseUrl}/${contract}?a=${tokenId}`
  }

  // Share functions
  const handleShare = (platform) => {
    const gameUrl = window.location.href
    const nftName = getNFTName()
    const collection = getNFTCollection()
    
    let shareUrl = ''
    let shareText = ''
    
    switch (platform) {
      case 'twitter':
        shareText = `Check out this Battle Royale NFT game! 🎮\n\n${nftName} from ${collection}\n\nJoin the game: ${gameUrl}`
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
        break
      case 'telegram':
        shareText = `Check out this Battle Royale NFT game! 🎮\n\n${nftName} from ${collection}\n\nJoin the game: ${gameUrl}`
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${encodeURIComponent(shareText)}`
        break
      default:
        return
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  const handleCopyContract = async () => {
    const contractAddress = getNFTContract()
    if (contractAddress && contractAddress !== 'Unknown') {
      try {
        await navigator.clipboard.writeText(contractAddress)
        console.log('Contract address copied to clipboard')
      } catch (err) {
        console.error('Failed to copy contract address:', err)
      }
    }
  }

  if (!gameData) {
    return (
      <TabContainer>
        <div style={{ color: 'white', textAlign: 'center', width: '100%' }}>
          Loading NFT details...
        </div>
      </TabContainer>
    )
  }

  return (
    <TabContainer>
      {/* NFT Details Section */}
      <NFTSection>
        <NFTHeader>
          <NFTTitle>NFT Details</NFTTitle>
          <VerificationBadge verified={gameData?.nft_verified || gameData?.verified}>
            {gameData?.nft_verified || gameData?.verified ? '✓ Verified' : '⚠️ Unverified'}
          </VerificationBadge>
        </NFTHeader>

        <NFTContent>
          <NFTImageContainer>
            <NFTImage 
              src={getNFTImage()} 
              alt={getNFTName()}
            />
            
            {/* Price beneath the image */}
            <PriceDisplay>
              <PriceLabel>Entry Fee</PriceLabel>
              <PriceValue>${gameData.entryFee || gameData.entry_fee || 0}</PriceValue>
            </PriceDisplay>
          </NFTImageContainer>

          <NFTDetailsContainer>
            <NFTInfo>
              <InfoRow>
                <InfoLabel>Name:</InfoLabel>
                <InfoValue>{getNFTName()}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Collection:</InfoLabel>
                <InfoValue>{getNFTCollection()}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Token ID:</InfoLabel>
                <InfoValue>#{getNFTTokenId()}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Contract:</InfoLabel>
                <InfoValue 
                  onClick={handleCopyContract}
                  style={{ 
                    cursor: getNFTContract() !== 'Unknown' ? 'pointer' : 'default',
                    textDecoration: getNFTContract() !== 'Unknown' ? 'underline' : 'none',
                    color: getNFTContract() !== 'Unknown' ? '#00BFFF' : 'white'
                  }}
                  title={getNFTContract() !== 'Unknown' ? 'Click to copy full address' : ''}
                >
                  {getNFTContract() !== 'Unknown' ? 
                    `${getNFTContract().slice(0, 6)}...${getNFTContract().slice(-4)}` : 
                    'Unknown'
                  }
                </InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Chain:</InfoLabel>
                <InfoValue>{getNFTChain()}</InfoValue>
              </InfoRow>
            </NFTInfo>

            {/* Share Buttons - 2x2 Grid */}
            <ShareButtonsContainer>
              <ActionButton 
                className="share-x"
                onClick={() => handleShare('twitter')}
              >
                Share on X
              </ActionButton>
              <ActionButton 
                className="share-tg"
                onClick={() => handleShare('telegram')}
              >
                Share on TG
              </ActionButton>
              <a
                href={getNFTContract() !== 'Unknown' && getNFTTokenId() !== 'Unknown' ? 
                  `${getMarketplaceUrl(getNFTChain())}/${getNFTContract()}/${getNFTTokenId()}` :
                  '#'
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (getNFTContract() === 'Unknown' || getNFTTokenId() === 'Unknown') {
                    e.preventDefault()
                    console.error('NFT contract details not available')
                  }
                }}
                style={{ textDecoration: 'none', width: '100%', display: 'block' }}
              >
                <ActionButton className="opensea">
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
                </ActionButton>
              </a>
              <a
                href={getExplorerUrl(getNFTChain(), getNFTContract(), getNFTTokenId())}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (getNFTContract() === 'Unknown' || getNFTTokenId() === 'Unknown') {
                    e.preventDefault()
                    console.error('NFT contract details not available')
                  }
                }}
                style={{ textDecoration: 'none', width: '100%', display: 'block' }}
              >
                <ActionButton className="explorer">
                  🔍 Explorer
                </ActionButton>
              </a>
            </ShareButtonsContainer>
          </NFTDetailsContainer>
        </NFTContent>
      </NFTSection>

      {/* Chat Section */}
      <ChatSection>
        <ChatHeader>
          <ChatTitle>💬 Battle Royale Chat</ChatTitle>
          <div style={{ color: '#aaa', fontSize: '0.8rem' }}>
            {connected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
        </ChatHeader>
        
        <ChatMessages>
          {messages.map((message, index) => (
            <Message key={message.id} isCurrentUser={message.isCurrentUser}>
              <MessageSender isCurrentUser={message.isCurrentUser}>
                <ProfilePicture 
                  address={message.sender}
                  size={40}
                  style={{
                    borderRadius: '8px',
                    border: '2px solid rgba(255, 255, 255, 0.2)'
                  }}
                />
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>💬 {message.isCurrentUser ? 'You' : `${message.sender?.slice(0, 6)}...${message.sender?.slice(-4)}`}</span>
              </MessageSender>
              <MessageBubble isCurrentUser={message.isCurrentUser} index={index}>
                {message.message}
              </MessageBubble>
              <MessageTime>{message.timestamp}</MessageTime>
            </Message>
          ))}
          <div ref={messagesEndRef} />
        </ChatMessages>
        
        <ChatInput>
          <MessageInput
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            disabled={!connected}
          />
          <SendButton onClick={sendMessage} disabled={!connected || !newMessage.trim()}>
            Send
          </SendButton>
        </ChatInput>
      </ChatSection>
    </TabContainer>
  )
}

export default BattleRoyaleNFTDetailsTab
