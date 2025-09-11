import React, { useState, useEffect, useRef, useCallback } from 'react'
import styled from '@emotion/styled'

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
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
`

const ChatSection = styled.div`
  height: 100%;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  
  @media (max-width: 1024px) {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
`

const OffersSection = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
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
    'linear-gradient(135deg, rgba(0, 191, 255, 0.3), rgba(0, 255, 65, 0.2))' : 
    'rgba(255, 255, 255, 0.1)'
  };
  border: 1px solid ${props => props.isCurrentUser ? 
    'rgba(0, 191, 255, 0.4)' : 
    'rgba(255, 255, 255, 0.2)'
  };
  border-radius: 1rem;
  padding: 0.75rem 1rem;
  max-width: 80%;
  word-wrap: break-word;
  color: white;
  font-size: 0.9rem;
  line-height: 1.4;
`

const MessageSender = styled.div`
  font-size: 0.8rem;
  color: #aaa;
  margin-bottom: 0.25rem;
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
  socket, 
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
      const response = await fetch(`/api/chat/${gameId}?limit=100`)
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
          console.log(`📜 Loaded ${formattedMessages.length} chat messages`)
        }
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
    if (!socket) return
    
    // Chat message handler
    const handleChatMessage = (data) => {
      console.log('💬 Chat message received:', data)
      const newMsg = {
        id: Date.now() + Math.random(),
        sender: data.address || data.from || data.sender,
        message: data.message,
        timestamp: new Date(data.timestamp || Date.now()).toLocaleTimeString(),
        isCurrentUser: (data.address || data.from || data.sender)?.toLowerCase() === address?.toLowerCase()
      }
      setMessages(prev => [...prev, newMsg])
    }
    
    // Offer handler
    const handleOffer = (data) => {
      console.log('💰 New offer received:', data)
      const newOffer = {
        id: data.id || Date.now() + Math.random(),
        offerer_address: data.address,
        offer_price: data.cryptoAmount,
        message: data.message || 'Crypto offer',
        timestamp: data.timestamp || new Date().toISOString(),
        status: 'pending'
      }
      setOffers(prev => [...prev, newOffer])
    }
    
    socket.on('chat_message', handleChatMessage)
    socket.on('crypto_offer', handleOffer)
    
    return () => {
      socket.off('chat_message', handleChatMessage)
      socket.off('crypto_offer', handleOffer)
    }
  }, [socket, address])
  
  // Auto-scroll chat
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])
  
  // Send chat message
  const sendMessage = () => {
    if (!newMessage.trim()) return
    
    console.log('💬 Sending chat message:', { message: newMessage.trim(), from: address })
    
    // Send to server
    socket.emit('chat_message', {
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
    if (!newOffer.price || !newOffer.message.trim()) return
    
    setIsCreatingOffer(true)
    
    try {
      const response = await fetch(`/api/games/${gameId}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offerer_address: address,
          offer_price: parseFloat(newOffer.price),
          message: newOffer.message.trim()
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Offer created:', result)
        
        // Add optimistic offer
        const optimisticOffer = {
          id: Date.now() + Math.random(),
          offerer_address: address,
          offer_price: parseFloat(newOffer.price),
          message: newOffer.message.trim(),
          timestamp: new Date().toISOString(),
          status: 'pending'
        }
        setOffers(prev => [...prev, optimisticOffer])
        
        setNewOffer({ price: '', message: '' })
      } else {
        console.error('❌ Failed to create offer')
      }
    } catch (error) {
      console.error('❌ Error creating offer:', error)
    } finally {
      setIsCreatingOffer(false)
    }
  }
  
  // Accept offer
  const acceptOffer = async (offerId) => {
    try {
      const response = await fetch(`/api/games/${gameId}/offers/${offerId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accepter_address: address
        })
      })
      
      if (response.ok) {
        console.log('✅ Offer accepted')
        // Remove the accepted offer
        setOffers(prev => prev.filter(offer => offer.id !== offerId))
      } else {
        console.error('❌ Failed to accept offer')
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
                {messages.map((message) => (
                  <Message key={message.id} isCurrentUser={message.isCurrentUser}>
                    <MessageSender>
                      {message.isCurrentUser ? 'You' : `${message.sender?.slice(0, 6)}...${message.sender?.slice(-4)}`}
                    </MessageSender>
                    <MessageBubble isCurrentUser={message.isCurrentUser}>
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
                    
                    <OfferMessage>
                      {offer.message}
                    </OfferMessage>
                    
                    {isCreator && offer.status === 'pending' && (
                      <OfferActions>
                        <ActionButton 
                          className="accept"
                          onClick={() => acceptOffer(offer.id)}
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
                      onChange={(e) => setNewOffer(prev => ({ ...prev, price: e.target.value }))}
                    />
                    <OfferInput
                      type="text"
                      placeholder="Your message..."
                      value={newOffer.message}
                      onChange={(e) => setNewOffer(prev => ({ ...prev, message: e.target.value }))}
                    />
                    <CreateOfferButton 
                      onClick={createOffer}
                      disabled={isCreatingOffer || !newOffer.price || !newOffer.message.trim()}
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
