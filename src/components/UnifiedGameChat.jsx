import React, { useState, useEffect, useRef } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { useProfile } from '../contexts/ProfileContext'
import { useToast } from '../contexts/ToastContext'
import { theme } from '../styles/theme'
import ProfilePicture from './ProfilePicture'
import styled from '@emotion/styled'

// Styled Components
const ChatContainer = styled.div`
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1rem;
  height: 400px;
  display: flex;
  flex-direction: column;
`

const MessagesContainer = styled.div`
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
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`

const Message = styled.div`
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: ${props => {
    if (props.messageType === 'offer') return 'rgba(255, 20, 147, 0.15)'
    if (props.messageType === 'offer_accepted') return 'rgba(0, 255, 65, 0.15)'
    if (props.messageType === 'offer_rejected') return 'rgba(255, 0, 0, 0.15)'
    if (props.messageType === 'system') return 'rgba(255, 215, 0, 0.15)'
    return props.isCurrentUser ? 'rgba(255, 20, 147, 0.2)' : 'rgba(255, 255, 255, 0.1)'
  }};
  border: 1px solid ${props => {
    if (props.messageType === 'offer') return 'rgba(255, 20, 147, 0.4)'
    if (props.messageType === 'offer_accepted') return 'rgba(0, 255, 65, 0.4)'
    if (props.messageType === 'offer_rejected') return 'rgba(255, 0, 0, 0.4)'
    if (props.messageType === 'system') return 'rgba(255, 215, 0, 0.4)'
    return props.isCurrentUser ? 'rgba(255, 20, 147, 0.3)' : 'rgba(255, 255, 255, 0.2)'
  }};
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
`

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  color: ${props => {
    if (props.messageType === 'offer') return '#FF1493'
    if (props.messageType === 'offer_accepted') return '#00FF41'
    if (props.messageType === 'offer_rejected') return '#FF0000'
    if (props.messageType === 'system') return '#FFD700'
    return props.isCurrentUser ? '#FF1493' : '#00BFFF'
  }};
`

const MessageContent = styled.div`
  color: #fff;
  word-break: break-word;
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
  
  &.reject {
    background: #FF4444;
    color: #fff;
    
    &:hover {
      background: #CC3333;
    }
  }
`

const InputContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
`

const Input = styled.input`
  flex: 1;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: #fff;
  font-size: 0.9rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #00BFFF;
    box-shadow: 0 0 10px rgba(0, 191, 255, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const SendButton = styled.button`
  padding: 0.75rem 1rem;
  background: #00BFFF;
  color: #000;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #0099CC;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const DualInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const InputLabel = styled.div`
  font-size: 0.8rem;
  color: #FFD700;
  font-weight: bold;
  margin-bottom: 0.25rem;
`

const OfferInputContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
`

const OfferInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  background: rgba(255, 20, 147, 0.1);
  border: 1px solid rgba(255, 20, 147, 0.3);
  border-radius: 0.5rem;
  color: #fff;
  font-size: 0.9rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #FF1493;
    box-shadow: 0 0 10px rgba(255, 20, 147, 0.3);
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



const UnifiedGameChat = ({ 
  gameId, 
  gameData, 
  isCreator, 
  socket, 
  connected,
  offeredNFTs = [],
  onOfferSubmitted,
  onOfferAccepted 
}) => {
  const { address, isConnected, nfts } = useWallet()
  const { getPlayerName, setPlayerName } = useProfile()
  const { showError, showSuccess, showInfo } = useToast()
  
  const [messages, setMessages] = useState([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [cryptoOffer, setCryptoOffer] = useState('')
  const [isNameModalOpen, setIsNameModalOpen] = useState(false)
  const [tempName, setTempName] = useState('')
  const [playerName, setPlayerNameState] = useState('')
  const [playerNames, setPlayerNames] = useState({})
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false)
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  
  // Load player name on mount
  useEffect(() => {
    if (address && isConnected) {
      const loadName = async () => {
        const name = await getPlayerName(address)
        setPlayerNameState(name || '')
      }
      loadName()
    }
  }, [address, isConnected, getPlayerName])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Listen for messages and offers from socket
  useEffect(() => {
    if (!socket) return
    
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📨 Raw WebSocket message received:', data)
        
        if (data.type === 'chat_message') {
          console.log('📩 Received chat message:', data)
          addMessage({
            id: Date.now() + Math.random(),
            type: 'chat',
            address: data.from || data.address,
            message: data.message,
            timestamp: data.timestamp || new Date().toISOString()
          })
        } else if (data.type === 'nft_offer') {
          console.log('💎 Received NFT offer:', data)
          addMessage({
            id: Date.now() + Math.random(),
            type: 'offer',
            address: data.offererAddress,
            nft: data.nft,
            timestamp: data.timestamp || new Date().toISOString(),
            offerId: data.offerId,
            offerText: data.offerText // Store offer text
          })
        } else if (data.type === 'crypto_offer') {
          console.log('💰 Received crypto offer:', data)
          addMessage({
            id: Date.now() + Math.random(),
            type: 'offer',
            address: data.offererAddress,
            cryptoAmount: data.cryptoAmount,
            timestamp: data.timestamp || new Date().toISOString(),
            offerId: data.offerId,
            message: `Crypto offer of ${data.cryptoAmount} ETH`
          })
        } else if (data.type === 'accept_nft_offer' || data.type === 'accept_crypto_offer') {
          console.log('✅ Offer accepted:', data)
          addMessage({
            id: Date.now() + Math.random(),
            type: 'offer_accepted',
            address: data.creatorAddress,
            acceptedOffer: data.acceptedOffer,
            timestamp: data.timestamp || new Date().toISOString()
          })
          
          // Add a system message to prompt the joiner to load their crypto
          if (data.type === 'accept_crypto_offer' && data.acceptedOffer?.cryptoAmount) {
            addMessage({
              id: Date.now() + Math.random() + 1,
              type: 'system',
              address: 'system',
              message: `🎮 Game accepted! Player 2, please load your ${data.acceptedOffer.cryptoAmount} ETH to start the battle!`,
              timestamp: new Date().toISOString()
            })
          }
        } else if (data.type === 'reject_nft_offer' || data.type === 'reject_crypto_offer') {
          console.log('❌ Offer rejected:', data)
          addMessage({
            id: Date.now() + Math.random(),
            type: 'offer_rejected',
            address: data.creatorAddress,
            rejectedOffer: data.rejectedOffer,
            timestamp: data.timestamp || new Date().toISOString()
          })
        } else if (data.type === 'chat_history') {
          console.log('📚 Received chat history:', data)
          // Load chat history messages
          if (data.messages && Array.isArray(data.messages)) {
            const historyMessages = data.messages.map(msg => ({
              id: msg.id || Date.now() + Math.random(),
              type: msg.message_type || 'chat',
              address: msg.sender_address,
              message: msg.message,
              timestamp: msg.created_at,
              // Parse additional data for offers
              cryptoAmount: msg.message_data?.cryptoAmount,
              nft: msg.message_data?.nft,
              offerType: msg.message_data?.offerType,
              acceptedOffer: msg.message_data?.acceptedOffer,
              rejectedOffer: msg.message_data?.rejectedOffer
            }))
            
            // Replace current messages with history
            setMessages(historyMessages)
            console.log(`📚 Loaded ${historyMessages.length} chat history messages`)
            
            // Add a welcome message if there's history
            if (historyMessages.length > 0) {
              addMessage({
                id: Date.now() + Math.random(),
                type: 'system',
                address: 'system',
                message: `📚 Loaded ${historyMessages.length} previous messages. Welcome to the game!`,
                timestamp: new Date().toISOString()
              })
            }
          }
        }
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    }
    
    socket.addEventListener('message', handleMessage)
    
    return () => {
      socket.removeEventListener('message', handleMessage)
    }
  }, [socket])

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
    setMessages(prev => [...prev, message])
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    
    if (!currentMessage.trim() || !socket || socket.readyState !== WebSocket.OPEN || !address) {
      if (!address) showError('Please connect your wallet')
      else if (!socket || socket.readyState !== WebSocket.OPEN) showError('Not connected to game')
      return
    }

    // Check if user has set a name
    if (!playerName) {
      setIsNameModalOpen(true)
      return
    }

    try {
      const chatMessage = {
        type: 'chat_message',
        roomId: gameId,
        message: currentMessage.trim(),
        from: address,
        timestamp: new Date().toISOString()
      }

      console.log('📤 Sending chat message:', chatMessage)
      socket.send(JSON.stringify(chatMessage))
      
      setCurrentMessage('')
      inputRef.current?.focus()
    } catch (error) {
      console.error('Error sending chat message:', error)
      showError('Failed to send message')
    }
  }

  const handleSubmitCryptoOffer = async () => {
    if (!cryptoOffer.trim() || !connected || !socket) {
      console.error('❌ Cannot submit crypto offer:', { 
        cryptoOffer: cryptoOffer.trim(), 
        connected, 
        socket: !!socket,
        socketState: socket?.readyState,
        gameId,
        address
      })
      showError('Please enter a valid crypto amount')
      return
    }

    const offerAmount = parseFloat(cryptoOffer)
    if (isNaN(offerAmount) || offerAmount <= 0) {
      showError('Please enter a valid positive number for the crypto offer')
      return
    }

    try {
      setIsSubmittingOffer(true)
      showInfo('Submitting crypto offer...')

      const offerData = {
        type: 'crypto_offer',
        gameId,
        offererAddress: address,
        cryptoAmount: offerAmount,
        timestamp: new Date().toISOString()
      }

      console.log('📤 Sending crypto offer:', offerData)
      console.log('📡 WebSocket state:', socket.readyState)
      socket.send(JSON.stringify(offerData))
      
      showSuccess(`Crypto offer of $${offerAmount} USD submitted! Waiting for creator to accept...`)
      setCryptoOffer('') // Clear the crypto offer input
      
      if (onOfferSubmitted) {
        onOfferSubmitted(offerData)
      }
      
    } catch (error) {
      console.error('Error submitting crypto offer:', error)
      showError('Failed to submit crypto offer: ' + error.message)
    } finally {
      setIsSubmittingOffer(false)
    }
  }

  const handleAcceptOffer = async (offer) => {
    if (!isCreator || !connected || !socket) {
      console.log('❌ Cannot accept offer:', { isCreator, connected, hasSocket: !!socket })
      return
    }

    try {
      const offerType = offer.cryptoAmount ? 'crypto' : 'NFT'
      showInfo(`Accepting ${offerType} challenge...`)

      const acceptanceData = {
        type: offer.cryptoAmount ? 'accept_crypto_offer' : 'accept_nft_offer',
        gameId,
        creatorAddress: address,
        acceptedOffer: offer,
        timestamp: new Date().toISOString()
      }

      console.log('📤 Sending offer acceptance:', acceptanceData)
      socket.send(JSON.stringify(acceptanceData))
      
      if (onOfferAccepted) {
        onOfferAccepted(offer)
      }
      
    } catch (error) {
      console.error('Error accepting offer:', error)
      showError('Failed to accept offer: ' + error.message)
    }
  }

  const handleRejectOffer = async (offer) => {
    if (!isCreator || !connected || !socket) {
      console.log('❌ Cannot reject offer:', { isCreator, connected, hasSocket: !!socket })
      return
    }

    try {
      const offerType = offer.cryptoAmount ? 'crypto' : 'NFT'
      showInfo(`Rejecting ${offerType} challenge...`)

      const rejectionData = {
        type: offer.cryptoAmount ? 'reject_crypto_offer' : 'reject_nft_offer',
        gameId,
        creatorAddress: address,
        rejectedOffer: offer,
        timestamp: new Date().toISOString()
      }

      console.log('📤 Sending offer rejection:', rejectionData)
      socket.send(JSON.stringify(rejectionData))
      
    } catch (error) {
      console.error('Error rejecting offer:', error)
      showError('Failed to reject offer: ' + error.message)
    }
  }

  const handleSaveName = async () => {
    if (!tempName.trim()) {
      showError('Please enter a valid name')
      return
    }

    try {
      await setPlayerName(address, tempName.trim())
      setPlayerNameState(tempName.trim())
      setIsNameModalOpen(false)
      setTempName('')
    } catch (error) {
      console.error('Error saving name:', error)
      showError('Failed to save name')
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getDisplayName = (addr) => {
    if (!addr) return 'Unknown'
    return playerNames[addr] || `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getMessageIcon = (messageType) => {
    switch (messageType) {
      case 'offer': return '💎'
      case 'offer_accepted': return '✅'
      case 'offer_rejected': return '❌'
      case 'system': return '⚡'
      default: return '💬'
    }
  }

  const renderMessageContent = (message) => {
    switch (message.type) {
      case 'offer':
        return (
          <div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>💎 {message.cryptoAmount ? 'Crypto' : 'NFT'} Battle Offer</strong>
            </div>
            {message.cryptoAmount ? (
              <div style={{ 
                marginBottom: '0.5rem', 
                padding: '0.5rem', 
                background: 'rgba(255, 215, 0, 0.1)', 
                borderRadius: '0.25rem',
                border: '1px solid rgba(255, 215, 0, 0.3)'
              }}>
                <strong style={{ color: '#FFD700' }}>Crypto Offer:</strong>
                <div style={{ color: '#fff', marginTop: '0.25rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                  ${message.cryptoAmount} USD
                </div>
              </div>
            ) : (
              <>
                {message.offerText && (
                  <div style={{ 
                    marginBottom: '0.5rem', 
                    padding: '0.5rem', 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    borderRadius: '0.25rem',
                    border: '1px solid rgba(255, 20, 147, 0.2)'
                  }}>
                    <strong style={{ color: '#FFD700' }}>Offer Message:</strong>
                    <div style={{ color: '#fff', marginTop: '0.25rem' }}>{message.offerText}</div>
                  </div>
                )}

              </>
            )}
            {isCreator && (
              <OfferActions>
                <ActionButton 
                  className="accept"
                  onClick={() => handleAcceptOffer(message)}
                >
                  ✅ Accept
                </ActionButton>
                <ActionButton 
                  className="reject"
                  onClick={() => handleRejectOffer(message)}
                >
                  ❌ Decline
                </ActionButton>
              </OfferActions>
            )}
          </div>
        )
      
      case 'offer_accepted':
        return (
          <div>
            <strong>✅ Battle Accepted!</strong>
            <div style={{ fontSize: '0.9rem', color: '#00FF41', marginTop: '0.25rem' }}>
              The creator has accepted the challenge!
            </div>
          </div>
        )
      
      case 'offer_rejected':
        return (
          <div>
            <strong>❌ Battle Declined</strong>
            <div style={{ fontSize: '0.9rem', color: '#FF1493', marginTop: '0.25rem' }}>
              The creator has declined the challenge.
            </div>
          </div>
        )
      
      default:
        return <MessageContent>{message.message}</MessageContent>
    }
  }

  if (!isConnected) {
    return (
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '1rem',
        padding: '1rem',
        textAlign: 'center'
      }}>
        <p style={{ color: '#FF1493' }}>Please connect your wallet to chat</p>
      </div>
    )
  }

  return (
    <ChatContainer>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h4 style={{ margin: 0, color: '#00BFFF' }}>
          💬 Game Chat & Offers
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: connected ? '#00FF41' : '#FF1493',
            animation: connected ? 'pulse 2s infinite' : 'none'
          }}></div>
          <span style={{ 
            color: connected ? '#00FF41' : '#FF1493', 
            fontSize: '0.8rem' 
          }}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Messages Container */}
      <MessagesContainer>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: theme.colors.textSecondary,
            padding: '2rem'
          }}>
            <div>
              <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>💬</div>
              <div style={{ marginBottom: '0.5rem' }}>No messages yet. Start the conversation!</div>
              <div style={{ fontSize: '0.9rem', color: '#FFD700' }}>
                {isCreator 
                  ? 'Use the chat input below to send messages. Wait for other players to make crypto offers!'
                  : 'Use the chat input below to send messages, or make a crypto offer to join the game!'
                }
              </div>

            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isCurrentUser = msg.address === address
            const displayName = getDisplayName(msg.address)
            

            
            return (
              <Message key={index} isCurrentUser={isCurrentUser} messageType={msg.type}>
                <MessageHeader isCurrentUser={isCurrentUser} messageType={msg.type}>
                  <span>
                    {getMessageIcon(msg.type)} {displayName}
                  </span>
                  <span>{formatTimestamp(msg.timestamp)}</span>
                </MessageHeader>
                {renderMessageContent(msg)}
              </Message>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      {/* Dual Input System */}
      <DualInputContainer>
        {/* Chat Input */}
        <div>
          <InputLabel>💬 Chat Message</InputLabel>
          <InputContainer>
            <Input
              ref={inputRef}
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={!connected}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(e)}
            />
            <SendButton
              onClick={sendMessage}
              disabled={!connected || !currentMessage.trim()}
            >
              Send
            </SendButton>
          </InputContainer>
        </div>

        {/* Crypto Offer Input - Only for non-creators (joiners and spectators) */}
        {!isCreator && (
          <div>
            <InputLabel>💰 Crypto Offer (USD)</InputLabel>
            <OfferInputContainer>
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
                placeholder="Enter USD amount (we'll convert to ETH)..."
                disabled={!connected}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitCryptoOffer()}
              />
              <OfferButton
                onClick={handleSubmitCryptoOffer}
                disabled={!connected || !cryptoOffer.trim() || isSubmittingOffer}
              >
                {isSubmittingOffer ? 'Submitting...' : 'Make Offer'}
              </OfferButton>
            </OfferInputContainer>

          </div>
        )}
      </DualInputContainer>

      {/* Name Modal */}
      {isNameModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.9)',
            padding: '2rem',
            borderRadius: '1rem',
            border: '1px solid rgba(255, 20, 147, 0.5)',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ color: '#FF1493', marginBottom: '1rem' }}>Set Your Name</h3>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Enter your display name"
              style={{
                width: '100%',
                padding: '0.5rem',
                marginBottom: '1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.5rem',
                color: '#fff'
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleSaveName}
                style={{
                  flex: 1,
                  background: '#FF1493',
                  color: '#fff',
                  border: 'none',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
              <button
                onClick={() => setIsNameModalOpen(false)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


    </ChatContainer>
  )
}

export default UnifiedGameChat 