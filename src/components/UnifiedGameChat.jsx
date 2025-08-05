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
  font-weight: bold;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;

  &.accept {
    background: #00FF41;
    color: #000;
    &:hover {
      background: #39FF14;
      transform: scale(1.02);
      box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
    }
  }

  &.reject {
    background: #FF1493;
    color: #000;
    &:hover {
      background: #FF69B4;
      transform: scale(1.02);
      box-shadow: 0 0 10px rgba(255, 20, 147, 0.3);
    }
  }

  &.submit {
    background: #FFD700;
    color: #000;
    &:hover {
      background: #FFA500;
      transform: scale(1.02);
      box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
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
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 0.5rem;
  color: #fff;
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: rgba(255, 20, 147, 0.5);
    box-shadow: 0 0 10px rgba(255, 20, 147, 0.2);
  }
`

const SendButton = styled.button`
  background: linear-gradient(45deg, #FF1493, #FF69B4);
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(255, 20, 147, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const ModeToggle = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 0.5rem;
  color: #fff;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.02);
  }

  &.active {
    background: rgba(255, 20, 147, 0.3);
    border-color: rgba(255, 20, 147, 0.5);
    box-shadow: 0 0 10px rgba(255, 20, 147, 0.2);
  }
`

const NFTPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.25rem;
`

const NFTImage = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 0.25rem;
  border: 2px solid #FFD700;
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
  const [isNameModalOpen, setIsNameModalOpen] = useState(false)
  const [tempName, setTempName] = useState('')
  const [playerName, setPlayerNameState] = useState('')
  const [playerNames, setPlayerNames] = useState({})
  const [inputMode, setInputMode] = useState('chat') // 'chat' or 'offer'
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [showNFTSelector, setShowNFTSelector] = useState(false)
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
            offerId: data.offerId
          })
        } else if (data.type === 'accept_nft_offer') {
          console.log('✅ Offer accepted:', data)
          addMessage({
            id: Date.now() + Math.random(),
            type: 'offer_accepted',
            address: data.creatorAddress,
            acceptedOffer: data.acceptedOffer,
            timestamp: data.timestamp || new Date().toISOString()
          })
        } else if (data.type === 'reject_nft_offer') {
          console.log('❌ Offer rejected:', data)
          addMessage({
            id: Date.now() + Math.random(),
            type: 'offer_rejected',
            address: data.creatorAddress,
            rejectedOffer: data.rejectedOffer,
            timestamp: data.timestamp || new Date().toISOString()
          })
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

  const handleSubmitOffer = async () => {
    if (!selectedNFT || !connected || !socket) {
      console.error('❌ Cannot submit offer:', { selectedNFT: !!selectedNFT, connected, socket: !!socket })
      showError('Cannot submit offer: WebSocket not connected')
      return
    }

    try {
      setIsSubmittingOffer(true)
      showInfo('Submitting NFT offer...')

      const offerData = {
        type: 'nft_offer',
        gameId,
        offererAddress: address,
        nft: {
          contractAddress: selectedNFT.contractAddress,
          tokenId: selectedNFT.tokenId,
          name: selectedNFT.name,
          image: selectedNFT.image,
          collection: selectedNFT.collection,
          chain: selectedNFT.chain
        },
        timestamp: new Date().toISOString()
      }

      console.log('📤 Sending NFT offer:', offerData)
      socket.send(JSON.stringify(offerData))
      
      showSuccess('NFT offer submitted! Waiting for creator to accept...')
      setSelectedNFT(null)
      setShowNFTSelector(false)
      setInputMode('chat')
      
      if (onOfferSubmitted) {
        onOfferSubmitted(offerData)
      }
      
    } catch (error) {
      console.error('Error submitting offer:', error)
      showError('Failed to submit offer: ' + error.message)
    } finally {
      setIsSubmittingOffer(false)
    }
  }

  const handleAcceptOffer = async (offer) => {
    if (!isCreator || !connected || !socket) return

    try {
      showInfo('Accepting NFT challenge...')

      const acceptanceData = {
        type: 'accept_nft_offer',
        gameId,
        creatorAddress: address,
        acceptedOffer: offer,
        timestamp: new Date().toISOString()
      }

      socket.send(JSON.stringify(acceptanceData))
      
      if (onOfferAccepted) {
        onOfferAccepted(offer)
      }
      
    } catch (error) {
      console.error('Error accepting offer:', error)
      showError('Failed to accept offer: ' + error.message)
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
              <strong>💎 NFT Battle Offer</strong>
            </div>
            {message.nft && (
              <NFTPreview>
                <NFTImage src={message.nft.image} alt={message.nft.name} />
                <div>
                  <div style={{ fontWeight: 'bold', color: '#FFD700' }}>
                    {message.nft.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#ccc' }}>
                    {message.nft.collection}
                  </div>
                </div>
              </NFTPreview>
            )}
            {isCreator && message.offerId && (
              <OfferActions>
                <ActionButton 
                  className="accept"
                  onClick={() => handleAcceptOffer(message)}
                >
                  ⚔️ Accept Battle
                </ActionButton>
                <ActionButton 
                  className="reject"
                  onClick={() => {/* Handle reject */}}
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
            <strong>✅ NFT Battle Accepted!</strong>
            <div style={{ fontSize: '0.9rem', color: '#00FF41', marginTop: '0.25rem' }}>
              The creator has accepted the NFT challenge!
            </div>
          </div>
        )
      
      case 'offer_rejected':
        return (
          <div>
            <strong>❌ NFT Battle Declined</strong>
            <div style={{ fontSize: '0.9rem', color: '#FF1493', marginTop: '0.25rem' }}>
              The creator has declined the NFT challenge.
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
            No messages yet. Start the conversation!
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

      {/* Input Mode Toggle */}
      {!isCreator && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <ModeToggle
            className={inputMode === 'chat' ? 'active' : ''}
            onClick={() => setInputMode('chat')}
          >
            💬 Chat
          </ModeToggle>
          <ModeToggle
            className={inputMode === 'offer' ? 'active' : ''}
            onClick={() => setInputMode('offer')}
          >
            💎 Make Offer
          </ModeToggle>
        </div>
      )}

      {/* Input Container */}
      <InputContainer>
        {inputMode === 'chat' ? (
          <>
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
          </>
        ) : (
          <>
            <Input
              type="text"
              value={selectedNFT ? `Selected: ${selectedNFT.name}` : 'Select NFT to offer...'}
              placeholder="Select NFT to offer..."
              disabled={true}
              onClick={() => setShowNFTSelector(true)}
              style={{ cursor: 'pointer' }}
            />
            <SendButton
              onClick={handleSubmitOffer}
              disabled={!connected || !selectedNFT || isSubmittingOffer}
            >
              {isSubmittingOffer ? 'Submitting...' : 'Submit Offer'}
            </SendButton>
          </>
        )}
      </InputContainer>

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

      {/* NFT Selector Modal */}
      {showNFTSelector && (
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
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ color: '#FF1493', marginBottom: '1rem' }}>Select NFT to Offer</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
              {nfts.map((nft, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedNFT(nft)
                    setShowNFTSelector(false)
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(255, 20, 147, 0.1)'
                    e.target.style.borderColor = 'rgba(255, 20, 147, 0.3)'
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <img
                    src={nft.image}
                    alt={nft.name}
                    style={{
                      width: '100%',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '0.25rem',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <div style={{ fontSize: '0.8rem', color: '#fff', textAlign: 'center' }}>
                    {nft.name}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowNFTSelector(false)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </ChatContainer>
  )
}

export default UnifiedGameChat 