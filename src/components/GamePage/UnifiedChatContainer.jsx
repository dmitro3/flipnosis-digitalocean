import React, { useState, useEffect, useRef } from 'react'
import { useWallet } from '../../contexts/WalletContext'
import { useProfile } from '../../contexts/ProfileContext'
import { useToast } from '../../contexts/ToastContext'
import styled from '@emotion/styled'

const ChatContainerStyled = styled.div`
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(0, 255, 65, 0.3);
  border-radius: 1rem;
  padding: 1rem;
  height: 667px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 20px rgba(0, 255, 65, 0.2);
`

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 255, 65, 0.3);
`

const ChatTitle = styled.h3`
  margin: 0;
  color: #00FF41;
  font-size: 1.2rem;
  font-weight: bold;
`

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.connected ? '#00FF41' : '#FF1493'};
  animation: ${props => props.connected ? 'pulse 2s infinite' : 'none'};
`

const StatusText = styled.span`
  color: ${props => props.connected ? '#00FF41' : '#FF1493'};
  font-size: 0.8rem;
`

const MessagesList = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
  padding-right: 0.5rem;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 65, 0.3);
    border-radius: 3px;
  }
`

const MessageItem = styled.div`
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: rgba(0, 255, 65, 0.15);
  border: 1px solid rgba(0, 255, 65, 0.4);
  animation: slideIn 0.3s ease-out;
  
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

  &.offer {
    background: rgba(255, 215, 0, 0.15);
    border: 1px solid rgba(255, 215, 0, 0.4);
  }

  &.system {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
`

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  color: #00FF41;
`

const MessageContent = styled.div`
  color: #fff;
  margin-bottom: 0.5rem;
`

const OfferAmount = styled.div`
  padding: 0.5rem;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 0.25rem;
  border: 1px solid rgba(255, 215, 0, 0.3);
  margin-bottom: 0.5rem;
`

const OfferAmountLabel = styled.div`
  color: #FFD700;
  font-weight: bold;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
`

const OfferAmountValue = styled.div`
  color: #fff;
  font-size: 1.1rem;
  font-weight: bold;
`

const OfferActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`

const ActionButton = styled.button`
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
  
  &.accept {
    background: #00FF41;
    color: #000;
    
    &:hover {
      background: #00CC33;
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const InputContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
`

const ChatInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  background: rgba(0, 255, 65, 0.1);
  border: 1px solid rgba(0, 255, 65, 0.3);
  border-radius: 0.5rem;
  color: #fff;
  font-size: 0.9rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #00FF41;
    box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const OfferInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 0.5rem;
  color: #fff;
  font-size: 0.9rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #FFD700;
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const SendButton = styled.button`
  padding: 0.75rem 1rem;
  background: linear-gradient(45deg, #00FF41, #00CC33);
  color: #000;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: linear-gradient(45deg, #00CC33, #009926);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const OfferButton = styled.button`
  padding: 0.75rem 1rem;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  color: #000;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: linear-gradient(45deg, #FFA500, #FF8C00);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 255, 65, 0.3);
`

const Tab = styled.button`
  flex: 1;
  padding: 0.5rem;
  background: ${props => props.active ? 'rgba(0, 255, 65, 0.2)' : 'transparent'};
  border: none;
  color: ${props => props.active ? '#00FF41' : 'rgba(255, 255, 255, 0.7)'};
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background: rgba(0, 255, 65, 0.1);
    color: #00FF41;
  }
`

const NotificationBadge = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  background: #FF1493;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`

const UnifiedChatContainer = ({ 
  gameId, 
  gameData, 
  socket, 
  connected,
  onOfferAccepted 
}) => {
  const { address, isConnected } = useWallet()
  const { getPlayerName } = useProfile()
  const { showError, showSuccess, showInfo } = useToast()
  
  const [messages, setMessages] = useState([])
  const [chatMessage, setChatMessage] = useState('')
  const [cryptoOffer, setCryptoOffer] = useState('')
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false)
  const [isSubmittingChat, setIsSubmittingChat] = useState(false)
  const [playerNames, setPlayerNames] = useState({})
  const [activeTab, setActiveTab] = useState('chat') // 'chat' or 'offer'
  const [unreadOffers, setUnreadOffers] = useState(0)
  
  const messagesEndRef = useRef(null)
  
  // Get game price for validation
  const gamePrice = gameData?.payment_amount || gameData?.price_usd || gameData?.final_price || gameData?.price || gameData?.asking_price || gameData?.priceUSD || 0
  const minOfferAmount = gamePrice * 0.8 // 80% of the game price
  
  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isCreator = () => {
    if (!gameData || !address) return false
    
    // Check both possible creator field names
    const creatorAddress = gameData.creator || gameData.creator_address
    if (!creatorAddress) return false
    
    return address.toLowerCase() === creatorAddress.toLowerCase()
  }

  // Listen for messages from WebSocket service
  useEffect(() => {
    if (!socket) {
      console.log('❌ Unified Chat: No socket provided')
      return
    }
    
    console.log('🔌 Unified Chat: Setting up WebSocket message handler with socket:', socket)
    
    // Check if there are any pending messages in the WebSocket service
    if (socket.messageHandlers && socket.messageHandlers.size > 0) {
      console.log('🔌 Unified Chat: WebSocket service has existing message handlers')
    }
    
    const handleMessage = (messageData) => {
      try {
        console.log('💬 Unified Chat: WebSocket message received:', messageData)
        
        // Message data is passed directly from the WebSocket service
        
        if (messageData.type === 'chat_message') {
          console.log('💬 Chat message received:', messageData)
          addMessage({
            id: Date.now() + Math.random(),
            type: 'chat',
            address: messageData.from,
            message: messageData.message,
            timestamp: messageData.timestamp || new Date().toISOString()
          })
        } else if (messageData.type === 'nft_offer') {
          console.log('💎 NFT offer received:', messageData)
          addMessage({
            id: Date.now() + Math.random(),
            type: 'nft_offer',
            address: messageData.offererAddress,
            nft: messageData.nft,
            timestamp: messageData.timestamp || new Date().toISOString(),
            offerId: messageData.offerId,
            offerText: messageData.offerText
          })
          
          // Increment unread offers count if not the active tab
          if (activeTab !== 'offer') {
            setUnreadOffers(prev => prev + 1)
          }
                 } else if (messageData.type === 'crypto_offer') {
           console.log('💰 Crypto offer received:', messageData)
           console.log('💰 Processing crypto offer with data:', {
             offererAddress: messageData.offererAddress,
             cryptoAmount: messageData.cryptoAmount,
             offerId: messageData.offerId
           })
           addMessage({
             id: Date.now() + Math.random(),
             type: 'crypto_offer',
             address: messageData.offererAddress,
             cryptoAmount: messageData.cryptoAmount,
             timestamp: messageData.timestamp || new Date().toISOString(),
             offerId: messageData.offerId
           })
          
          // Increment unread offers count if not the active tab
          if (activeTab !== 'offer') {
            setUnreadOffers(prev => prev + 1)
          }
          
          // Show success message to the offerer
          if (messageData.offererAddress === address) {
            showSuccess(`Your offer of $${messageData.cryptoAmount} USD has been submitted!`)
          }
        } else if (messageData.type === 'accept_nft_offer' || messageData.type === 'accept_crypto_offer') {
          console.log('✅ Offer accepted:', messageData)
          addMessage({
            id: Date.now() + Math.random(),
            type: 'offer_accepted',
            address: messageData.creatorAddress,
            acceptedOffer: messageData.acceptedOffer,
            timestamp: messageData.timestamp || new Date().toISOString()
          })
          
          // Force reload game data to get updated status
          if (window.location.pathname.includes('/game/')) {
            setTimeout(() => {
              window.location.reload() // Force page reload to ensure fresh data
            }, 500)
          }
          
          // Add a system message to prompt the joiner to load their crypto
          if (messageData.type === 'accept_crypto_offer' && messageData.acceptedOffer?.cryptoAmount) {
            addMessage({
              id: Date.now() + Math.random() + 1,
              type: 'system',
              address: 'system',
              message: `🎮 Game accepted! Player 2, please load your ${messageData.acceptedOffer.cryptoAmount} USD worth of ETH to start the game!`,
              timestamp: new Date().toISOString()
            })
          }
                          } else if (messageData.type === 'chat_history') {
           console.log('📚 Chat history received:', messageData)
           console.log('📚 Chat history messages array:', messageData.messages)
           if (messageData.messages && Array.isArray(messageData.messages)) {
             console.log('📚 Processing chat history messages...')
             const historyMessages = messageData.messages.map(msg => {
               console.log('📝 Processing history message:', msg)
               
               // Handle different message types from database
               let messageType = 'chat'
               if (msg.message_type === 'offer' || msg.message_data?.offerType) {
                 messageType = 'crypto_offer'
               } else if (msg.message_type === 'nft_offer') {
                 messageType = 'nft_offer'
               } else if (msg.message_type === 'system') {
                 messageType = 'system'
               }
               
               return {
                 id: msg.id || Date.now() + Math.random(),
                 type: messageType,
                 address: msg.sender_address,
                 message: msg.message,
                 timestamp: msg.created_at || msg.timestamp,
                 cryptoAmount: msg.message_data?.cryptoAmount,
                 nft: msg.message_data?.nft,
                 offerType: msg.message_data?.offerType,
                 acceptedOffer: msg.message_data?.acceptedOffer,
                 rejectedOffer: msg.message_data?.rejectedOffer
               }
             })
             
             console.log(`📚 Processed ${historyMessages.length} chat history messages:`, historyMessages)
             setMessages(historyMessages)
           }
         }
        }
      } catch (error) {
        console.error('Unified Chat: Error parsing message:', error)
      }
    }
    
    // Register message handlers for specific message types
    console.log('🔌 Unified Chat: Registering message handlers with socket:', socket)
    
    // Register handlers for each message type
    socket.on('chat_message', handleMessage)
    socket.on('chat_history', handleMessage)
    socket.on('crypto_offer', handleMessage)
    socket.on('nft_offer', handleMessage)
    socket.on('accept_crypto_offer', handleMessage)
    socket.on('accept_nft_offer', handleMessage)
    
    return () => {
      console.log('🔌 Unified Chat: Cleaning up message handlers')
      socket.off('chat_message', handleMessage)
      socket.off('chat_history', handleMessage)
      socket.off('crypto_offer', handleMessage)
      socket.off('nft_offer', handleMessage)
      socket.off('accept_crypto_offer', handleMessage)
      socket.off('accept_nft_offer', handleMessage)
    }
  }, [socket, address, showSuccess])

  // Load player names for messages
  useEffect(() => {
    const loadPlayerNames = async () => {
      const names = {}
      const uniqueAddresses = [...new Set(messages.map(m => m.address).filter(Boolean))]
      
      for (const addr of uniqueAddresses) {
        if (!names[addr] && addr) {
          const name = await getPlayerName(addr)
          names[addr] = name || `${addr.slice(0, 6)}...${addr.slice(-4)}`
        }
      }
      setPlayerNames(names)
    }

    if (messages.length > 0) {
      loadPlayerNames()
    }
  }, [messages, getPlayerName])

  const addMessage = (message) => {
    console.log('📝 Adding message to state:', message)
    setMessages(prev => {
      const newMessages = [...prev, message]
      console.log('📝 New messages state:', newMessages.length, 'messages:', newMessages)
      return newMessages
    })
  }

  const handleSubmitChat = async () => {
    if (!chatMessage.trim()) {
      console.error('❌ No chat message entered')
      return
    }

    setIsSubmittingChat(true)

    try {
      const isSocketConnected = socket && socket.isConnected && socket.isConnected()
      console.log('🔍 WebSocket connection check for chat:', isSocketConnected)
      
      if (isSocketConnected) {
        const messageData = {
          type: 'chat_message',
          gameId,
          message: chatMessage.trim(),
          from: address,
          timestamp: new Date().toISOString()
        }
        
        console.log('📤 Sending chat message:', messageData)
        socket.send(messageData)
        
        console.log('💬 Chat message sent via WebSocket')
        setChatMessage('')
      } else {
        console.error('❌ WebSocket not connected for chat')
        showError('Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error submitting chat:', error)
      showError('Failed to send message. Please try again.')
    } finally {
      setIsSubmittingChat(false)
    }
  }

  const handleSubmitCryptoOffer = async () => {
    if (!cryptoOffer.trim()) {
      console.error('❌ No offer amount entered')
      return
    }

    const offerAmount = parseFloat(cryptoOffer)
    
    // Validate offer amount
    if (isNaN(offerAmount) || offerAmount < minOfferAmount) {
      showError(`Minimum offer is $${minOfferAmount.toFixed(2)} USD`)
      return
    }

    setIsSubmittingOffer(true)

    try {
      const isSocketConnected = socket && socket.isConnected && socket.isConnected()
      console.log('🔍 WebSocket connection check for offer:', isSocketConnected)
      
      if (isSocketConnected) {
        const messageData = {
          type: 'crypto_offer',
          listingId: gameData.listing_id,
          address: address,
          cryptoAmount: offerAmount,
          timestamp: new Date().toISOString()
        }
        
                 console.log('📤 Sending crypto offer:', messageData)
         console.log('📤 WebSocket send method available:', typeof socket.send === 'function')
         socket.send(messageData)
         
         console.log('💰 Crypto offer sent via WebSocket')
        showSuccess(`Offer of $${offerAmount.toFixed(2)} USD sent!`)
        setCryptoOffer('')
      } else {
        console.error('❌ WebSocket not connected for offer')
        showError('Failed to send offer. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error submitting offer:', error)
      showError('Failed to submit offer. Please try again.')
    } finally {
      setIsSubmittingOffer(false)
    }
  }

  const handleAcceptOffer = async (message) => {
    if (!isCreator() || !connected || !socket) {
      console.log('❌ Cannot accept offer:', { isCreator: isCreator(), connected, hasSocket: !!socket })
      return
    }

    try {
      const offerType = message.cryptoAmount ? 'offer' : 'NFT'
      showInfo(`Accepting ${offerType} challenge...`)

      const acceptanceData = {
        type: message.cryptoAmount ? 'accept_crypto_offer' : 'accept_nft_offer',
        gameId,
        creatorAddress: address,
        acceptedOffer: message,
        timestamp: new Date().toISOString()
      }

      console.log('📤 Sending offer acceptance:', acceptanceData)
      socket.send(acceptanceData)
      
      // Reload game data after a short delay to get updated status
      setTimeout(() => {
        if (window.location.pathname.includes('/game/')) {
          window.location.reload() // Force reload to get updated game status
        }
      }, 1000)
      
      if (onOfferAccepted) {
        onOfferAccepted(message)
      }
      
    } catch (error) {
      console.error('Error accepting offer:', error)
      showError('Failed to accept offer: ' + error.message)
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getDisplayName = (addr) => {
    if (!addr) return 'Unknown'
    if (addr === 'system') return 'System'
    return playerNames[addr] || `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const renderMessageContent = (message) => {
    switch (message.type) {
      case 'chat':
        return <div style={{ color: '#fff' }}>{message.message}</div>
      
      case 'crypto_offer':
        return (
          <div>
            <OfferAmount>
              <OfferAmountLabel>💰 Offer Amount:</OfferAmountLabel>
              <OfferAmountValue>${message.cryptoAmount} USD</OfferAmountValue>
            </OfferAmount>
            {isCreator() && gameData?.status !== 'waiting_challenger_deposit' && (
              <OfferActions>
                <ActionButton 
                  className="accept"
                  onClick={() => handleAcceptOffer(message)}
                >
                  ✅ Accept
                </ActionButton>
              </OfferActions>
            )}
          </div>
        )
      
      case 'nft_offer':
        return (
          <div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>💎 NFT Offer</strong>
            </div>
            {message.offerText && (
              <div style={{ 
                marginBottom: '0.5rem', 
                padding: '0.5rem', 
                background: 'rgba(255, 255, 255, 0.05)', 
                borderRadius: '0.25rem',
                border: '1px solid rgba(0, 255, 65, 0.2)'
              }}>
                <strong style={{ color: '#FFD700' }}>Offer Message:</strong>
                <div style={{ color: '#fff', marginTop: '0.25rem' }}>{message.offerText}</div>
              </div>
            )}
            {isCreator() && gameData?.status !== 'waiting_challenger_deposit' && (
              <OfferActions>
                <ActionButton 
                  className="accept"
                  onClick={() => handleAcceptOffer(message)}
                >
                  ✅ Accept
                </ActionButton>
              </OfferActions>
            )}
          </div>
        )
      
      case 'offer_accepted':
        return (
          <div>
            <strong>✅ Offer Accepted!</strong>
            <div style={{ fontSize: '0.9rem', color: '#00FF41', marginTop: '0.25rem' }}>
              The creator has accepted the offer!
            </div>
          </div>
        )
      
      case 'system':
        return (
          <div style={{ color: '#FFD700', fontStyle: 'italic' }}>
            {message.message}
          </div>
        )
      
      default:
        return <div style={{ color: '#fff' }}>{message.message}</div>
    }
  }

  // Check if offer input should be shown
  const shouldShowOfferInput = () => {
    // Show for non-creators when game is waiting for challenger
    if (isCreator()) return false
    
    // Don't show if game is waiting for deposit
    if (gameData?.status === 'waiting_challenger_deposit') return false
    
    // Check if game is in a state where offers are accepted
    const validStatuses = ['waiting_challenger', 'awaiting_challenger', 'waiting_for_challenger', 'open']
    
    // Also check if listing status allows offers (for games that are listings)
    const gameStatus = gameData?.status
    const listingStatus = gameData?.type === 'listing' ? gameData?.status : null
    
    return validStatuses.includes(gameStatus) || validStatuses.includes(listingStatus)
  }

  if (!isConnected) {
    return (
      <ChatContainerStyled>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#00FF41' }}>Please connect your wallet to view chat</p>
        </div>
      </ChatContainerStyled>
    )
  }

  return (
    <ChatContainerStyled>
      <ChatHeader>
        <ChatTitle>💬 Chat & Offers</ChatTitle>
        <ConnectionStatus>
          <StatusDot connected={connected} />
          <StatusText connected={connected}>
            {connected ? 'Connected' : 'Disconnected'}
          </StatusText>
        </ConnectionStatus>
      </ChatHeader>

             {/* Tab Navigation */}
       <TabContainer>
         <Tab 
           active={activeTab === 'chat'} 
           onClick={() => setActiveTab('chat')}
         >
           💬 Chat
         </Tab>
         {shouldShowOfferInput() && (
           <Tab 
             active={activeTab === 'offer'} 
             onClick={() => {
               setActiveTab('offer')
               setUnreadOffers(0) // Clear unread offers when switching to offer tab
             }}
           >
             💰 Make Offer
             {unreadOffers > 0 && <NotificationBadge>{unreadOffers}</NotificationBadge>}
           </Tab>
         )}
       </TabContainer>

      {/* Game Price Info for Offer Tab */}
      {activeTab === 'offer' && gamePrice > 0 && (
        <div style={{
          background: 'rgba(255, 215, 0, 0.1)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
            🎯 Game Price: ${gamePrice.toFixed(2)} USD
          </div>
          <div style={{ color: '#00FF41', fontSize: '0.8rem' }}>
            Minimum offer: ${minOfferAmount.toFixed(2)} USD (80%)
          </div>
        </div>
      )}

      <MessagesList>
        {console.log('🎨 Rendering messages:', messages.length, messages)}
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.6)',
            padding: '2rem'
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>💬</div>
            <div style={{ marginBottom: '0.5rem' }}>No messages yet.</div>
            <div style={{ fontSize: '0.9rem', color: '#00FF41' }}>
              Start the conversation!
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const displayName = getDisplayName(message.address)
            console.log('🎨 Rendering message:', index, message)
            
            return (
              <MessageItem key={index} className={message.type}>
                <MessageHeader>
                  <span>
                    {message.type === 'crypto_offer' ? '💰' : 
                     message.type === 'nft_offer' ? '💎' : 
                     message.type === 'offer_accepted' ? '✅' : 
                     message.type === 'system' ? '⚙️' : '💬'} {displayName}
                  </span>
                  <span>{formatTimestamp(message.timestamp)}</span>
                </MessageHeader>
                {renderMessageContent(message)}
              </MessageItem>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </MessagesList>

      {/* Input Section */}
      {activeTab === 'chat' ? (
        <InputContainer>
          <ChatInput
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isSubmittingChat}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmitChat()}
          />
          <SendButton
            onClick={handleSubmitChat}
            disabled={!chatMessage.trim() || isSubmittingChat}
          >
            {isSubmittingChat ? 'Sending...' : 'Send'}
          </SendButton>
        </InputContainer>
      ) : shouldShowOfferInput() ? (
        <InputContainer>
          <OfferInput
            type="text"
            value={cryptoOffer}
            onChange={(e) => {
              // Only allow digits and decimal point
              const value = e.target.value.replace(/[^0-9.]/g, '')
              // Prevent multiple decimal points
              const parts = value.split('.')
              if (parts.length <= 2) {
                setCryptoOffer(value)
              }
            }}
            placeholder={`Min $${minOfferAmount.toFixed(2)} USD...`}
            disabled={isSubmittingOffer}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmitCryptoOffer()}
          />
          <OfferButton
            onClick={handleSubmitCryptoOffer}
            disabled={!cryptoOffer.trim() || isSubmittingOffer}
          >
            {isSubmittingOffer ? 'Submitting...' : 'Make Offer'}
          </OfferButton>
        </InputContainer>
      ) : null}
    </ChatContainerStyled>
  )
}

export default UnifiedChatContainer
