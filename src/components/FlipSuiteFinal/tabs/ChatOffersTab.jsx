import React, { useState, useEffect, useRef, useCallback } from 'react'
import styled from '@emotion/styled'
import ProfilePicture from '../../ProfilePicture'

const TabContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const ContentContainer = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
`

const UnifiedContainer = styled.div`
  height: 100%;
  display: flex;
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 1rem;
  }
`

const ChatSection = styled.div`
  height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.7);
  border: 3px solid rgba(0, 191, 255, 0.3);
  border-radius: 1rem;
  box-shadow: 0 0 20px rgba(0, 191, 255, 0.2);
`

const OffersSection = styled.div`
  height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.7);
  border: 3px solid rgba(0, 255, 65, 0.3);
  border-radius: 1rem;
  box-shadow: 0 0 20px rgba(0, 255, 65, 0.2);
`

const SectionHeader = styled.div`
  background: rgba(0, 0, 0, 0.8);
  padding: 1rem;
  border-bottom: 2px solid rgba(0, 191, 255, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const SectionTitle = styled.h3`
  margin: 0;
  color: ${props => props.color || '#00BFFF'};
  font-size: 1.2rem;
  font-weight: bold;
`

const SectionContent = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

// Chat Styles
const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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

// Offers Styles
const OffersList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const OfferCard = styled.div`
  background: rgba(0, 255, 65, 0.1);
  border: 1px solid rgba(0, 255, 65, 0.3);
  border-radius: 0.75rem;
  padding: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 255, 65, 0.15);
    border-color: rgba(0, 255, 65, 0.5);
    transform: translateY(-2px);
  }
`

const OfferHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`

const OfferPrice = styled.div`
  color: #00FF41;
  font-size: 1.2rem;
  font-weight: bold;
`

const OfferTime = styled.div`
  color: #aaa;
  font-size: 0.8rem;
`

const OfferSender = styled.div`
  color: white;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`

const OfferMessage = styled.div`
  color: #ccc;
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 0.75rem;
`

const OfferActions = styled.div`
  display: flex;
  gap: 0.5rem;
`

const ActionButton = styled.button`
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.accept {
    background: linear-gradient(135deg, #00FF41, #00CC33);
    color: white;
    
    &:hover {
      background: linear-gradient(135deg, #00CC33, #00AA22);
      transform: translateY(-1px);
    }
  }
  
  &.reject {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }
  }
`

const CreateOfferSection = styled.div`
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
`

const OfferForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const OfferInput = styled.input`
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
    border-color: #00FF41;
    box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
  }
`

const CreateOfferButton = styled.button`
  background: linear-gradient(135deg, #00FF41, #00CC33);
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #00CC33, #00AA22);
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const ChatOffersTab = ({ 
  gameData, 
  gameId, 
  socket: socketService, 
  connected, 
  address,
  isCreator 
}) => {
  const [messages, setMessages] = useState([])
  const [offers, setOffers] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [newOffer, setNewOffer] = useState({ price: '', message: '' })
  const [isCreatingOffer, setIsCreatingOffer] = useState(false)
  
  const messagesEndRef = useRef(null)
  const chatMessagesRef = useRef(null)
  
  // Scroll to bottom of chat
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])
  
  // Load chat history
  const loadChatHistory = useCallback(async () => {
    try {
      // API expects just the gameId, not the full roomId
      const cleanGameId = gameId.startsWith('game_') ? gameId.replace('game_', '') : gameId
      const response = await fetch(`/api/chat/${cleanGameId}?limit=100`)
      if (response.ok) {
        const data = await response.json()
        if (data.messages && Array.isArray(data.messages)) {
          const formattedMessages = data.messages.map(msg => ({
            id: msg.id || Date.now() + Math.random(),
            sender: msg.sender_address || msg.sender,
            message: msg.message,
            timestamp: new Date(msg.timestamp).toLocaleTimeString(),
            isCurrentUser: (msg.sender_address || msg.sender)?.toLowerCase() === address?.toLowerCase()
          }))
          setMessages(formattedMessages)
          console.log(`📜 Loaded ${formattedMessages.length} chat messages for game ${cleanGameId}`)
        }
      } else {
        console.error('❌ Failed to load chat history - response not ok:', response.status)
      }
    } catch (error) {
      console.error('❌ Failed to load chat history:', error)
    }
  }, [gameId, address])
  
  // Load offers
  const loadOffers = useCallback(async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/offers`)
      if (response.ok) {
        const data = await response.json()
        setOffers(Array.isArray(data) ? data : [])
        console.log('💰 Offers loaded:', Array.isArray(data) ? data.length : 0)
      }
    } catch (error) {
      console.error('❌ Failed to load offers:', error)
    }
  }, [gameId])
  
  // Load initial data
  useEffect(() => {
    loadChatHistory()
    loadOffers()
  }, [loadChatHistory, loadOffers])
  
  // Socket event handlers
  useEffect(() => {
    if (!socketService) return
    
    // Chat message handler
    const handleChatMessage = (data) => {
      console.log('💬 Chat message received:', data)
      
      // Check if this message is from the current user (to avoid duplicates from optimistic updates)
      const isFromCurrentUser = (data.address || data.from || data.sender)?.toLowerCase() === address?.toLowerCase()
      
      if (isFromCurrentUser) {
        console.log('💬 Skipping message from current user (already added optimistically)')
        return
      }
      
      const newMsg = {
        id: Date.now() + Math.random(),
        sender: data.address || data.from || data.sender,
        message: data.message,
        timestamp: new Date(data.timestamp || Date.now()).toLocaleTimeString(),
        isCurrentUser: false
      }
      setMessages(prev => [...prev, newMsg])
    }
    
    // Chat history handler - FIXED: Now listens for server-sent chat history
    const handleChatHistory = (data) => {
      console.log('📜 Chat history received:', data.messages?.length || 0, 'messages')
      if (data.messages && Array.isArray(data.messages)) {
        const formattedMessages = data.messages.map(msg => ({
          id: msg.id || Date.now() + Math.random(),
          sender: msg.sender_address || msg.sender,
          message: msg.message,
          timestamp: new Date(msg.created_at || msg.timestamp).toLocaleTimeString(),
          isCurrentUser: (msg.sender_address || msg.sender)?.toLowerCase() === address?.toLowerCase()
        }))
        setMessages(formattedMessages)
        console.log('📜 Updated messages from chat history:', formattedMessages.length)
      }
    }
    
    // Offer handler
    const handleOffer = (data) => {
      console.log('💰 New offer received:', data)
      console.log('💰 Current offers before adding:', offers.length)
      
      // Check if this offer is from the current user (to avoid duplicates from optimistic updates)
      const isFromCurrentUser = data.address?.toLowerCase() === address?.toLowerCase()
      
      if (isFromCurrentUser) {
        console.log('💰 Skipping offer from current user (already added optimistically)')
        return
      }
      
      const newOffer = {
        id: data.id || Date.now() + Math.random(),
        offerer_address: data.address,
        offer_price: data.cryptoAmount,
        message: data.message || 'Crypto offer',
        timestamp: data.timestamp || new Date().toISOString(),
        status: 'pending'
      }
      setOffers(prev => {
        console.log('💰 Adding offer to state:', newOffer)
        const updatedOffers = [...prev, newOffer]
        console.log('💰 Updated offers count:', updatedOffers.length)
        return updatedOffers
      })
    }
    
    socketService.on('chat_message', handleChatMessage)
    socketService.on('chat_history', handleChatHistory)
    socketService.on('crypto_offer', handleOffer)
    
    return () => {
      socketService.off('chat_message', handleChatMessage)
      socketService.off('chat_history', handleChatHistory)
      socketService.off('crypto_offer', handleOffer)
    }
  }, [socketService, address])
  
  // Auto-scroll chat
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])
  
  // Send chat message
  const sendMessage = () => {
    if (!newMessage.trim()) return
    
    console.log('💬 Sending chat message:', { message: newMessage.trim(), from: address })
    
    // Send to server
    socketService.emit('chat_message', {
      roomId: gameId.startsWith('game_') ? gameId : `game_${gameId}`,
      message: newMessage.trim(),
      address: address
    })
    
    // Add optimistic message
    const optimisticMessage = {
      id: Date.now() + Math.random(),
      sender: address,
      message: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString(),
      isCurrentUser: true
    }
    setMessages(prev => [...prev, optimisticMessage])
    
    setNewMessage('')
  }
  
  // Create offer
  const createOffer = async () => {
    if (!newOffer.price) return
    
    setIsCreatingOffer(true)
    
    try {
      // Send via Socket.io like the legacy version
      if (socketService && connected) {
        const offerData = {
          gameId: gameId,
          address: address,
          cryptoAmount: parseFloat(newOffer.price)
        }
        console.log('💰 Sending offer data:', offerData)
        socketService.emit('crypto_offer', offerData)
        
        // Add optimistic offer
        const optimisticOffer = {
          id: Date.now() + Math.random(),
          offerer_address: address,
          offer_price: parseFloat(newOffer.price),
          message: newOffer.message || 'Crypto offer',
          timestamp: new Date().toISOString(),
          status: 'pending'
        }
        setOffers(prev => [...prev, optimisticOffer])
        
        console.log('✅ Offer sent via Socket.io')
        setNewOffer({ price: '', message: '' })
      } else {
        console.error('❌ Socket.io not connected')
      }
    } catch (error) {
      console.error('❌ Error creating offer:', error)
    } finally {
      setIsCreatingOffer(false)
    }
  }
  
  // Accept offer
  const acceptOffer = async (offer) => {
    try {
      // Send via Socket.io like the legacy version
      if (socketService && connected) {
        socketService.emit('accept_offer', {
          gameId: gameId,
          address: address,
          offerId: offer.id,
          challengerAddress: offer.offerer_address,
          cryptoAmount: offer.offer_price
        })
        
        console.log('✅ Offer acceptance sent via Socket.io')
        // Remove the accepted offer
        setOffers(prev => prev.filter(o => o.id !== offer.id))
      } else {
        console.error('❌ Socket.io not connected')
      }
    } catch (error) {
      console.error('❌ Error accepting offer:', error)
    }
  }

  return (
    <TabContainer>
      <ContentContainer>
        <UnifiedContainer>
          {/* Chat Section */}
          <ChatSection>
            <SectionHeader>
              <SectionTitle color="#00BFFF">💬 Flip Lounge</SectionTitle>
              <div style={{ color: '#aaa', fontSize: '0.8rem' }}>
                {connected ? '🟢 Connected' : '🔴 Disconnected'}
              </div>
            </SectionHeader>
            
            <SectionContent>
              <ChatMessages ref={chatMessagesRef}>
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
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={!connected}
                />
                <SendButton onClick={sendMessage} disabled={!connected || !newMessage.trim()}>
                  Send
                </SendButton>
              </ChatInput>
            </SectionContent>
          </ChatSection>

          {/* Offers Section */}
          <OffersSection>
            <SectionHeader>
              <SectionTitle color="#00FF41">💰 Crypto Offers</SectionTitle>
              <div style={{ color: '#aaa', fontSize: '0.8rem' }}>
                {offers.length} pending
              </div>
            </SectionHeader>
            
            <SectionContent>
              <OffersList>
                {offers.map((offer) => (
                  <OfferCard key={offer.id}>
                    <OfferHeader>
                      <OfferPrice>${offer.offer_price}</OfferPrice>
                      <OfferTime>
                        {new Date(offer.timestamp).toLocaleTimeString()}
                      </OfferTime>
                    </OfferHeader>
                    
                    <OfferSender>
                      From: {offer.offerer_address?.slice(0, 6)}...{offer.offerer_address?.slice(-4)}
                    </OfferSender>
                    
                    {isCreator && offer.status === 'pending' && (
                      <OfferActions>
                        <ActionButton 
                          className="accept"
                          onClick={() => acceptOffer(offer)}
                        >
                          Accept
                        </ActionButton>
                        <ActionButton 
                          className="reject"
                          onClick={() => setOffers(prev => prev.filter(o => o.id !== offer.id))}
                        >
                          Reject
                        </ActionButton>
                      </OfferActions>
                    )}
                  </OfferCard>
                ))}
                
                {offers.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#aaa', 
                    padding: '2rem',
                    fontSize: '0.9rem'
                  }}>
                    No offers yet. Be the first to make an offer!
                  </div>
                )}
              </OffersList>
              
              {!isCreator && (
                <CreateOfferSection>
                  <OfferForm>
                    <OfferInput
                      type="number"
                      placeholder="Offer amount (USD)"
                      value={newOffer.price}
                      onChange={(e) => {
                        // Only allow digits and decimal point
                        const value = e.target.value.replace(/[^0-9.]/g, '')
                        // Prevent multiple decimal points
                        const parts = value.split('.')
                        if (parts.length <= 2) {
                          setNewOffer(prev => ({ ...prev, price: value }))
                        }
                      }}
                    />
                    <CreateOfferButton 
                      onClick={createOffer}
                      disabled={isCreatingOffer || !newOffer.price}
                    >
                      {isCreatingOffer ? 'Creating...' : 'Make Offer'}
                    </CreateOfferButton>
                  </OfferForm>
                </CreateOfferSection>
              )}
            </SectionContent>
          </OffersSection>
        </UnifiedContainer>
      </ContentContainer>
    </TabContainer>
  )
}

export default ChatOffersTab
