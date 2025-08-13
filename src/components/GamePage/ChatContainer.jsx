import React, { useState, useEffect, useRef } from 'react'
import { useWallet } from '../../contexts/WalletContext'
import { useProfile } from '../../contexts/ProfileContext'
import { useToast } from '../../contexts/ToastContext'
import styled from '@emotion/styled'
import ProfilePicture from '../ProfilePicture'
import webSocketService from '../../services/WebSocketService'

const ChatContainerStyled = styled.div`
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(0, 191, 255, 0.3);
  border-radius: 1rem;
  padding: 1rem;
  height: 500px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 20px rgba(0, 191, 255, 0.2);
`

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 191, 255, 0.3);
`

const ChatTitle = styled.h3`
  margin: 0;
  color: #00BFFF;
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
    background: rgba(0, 191, 255, 0.3);
    border-radius: 3px;
  }
`

const Message = styled.div`
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: ${props => props.isCurrentUser ? 'rgba(0, 191, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid ${props => props.isCurrentUser ? 'rgba(0, 191, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)'};
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
  color: ${props => props.isCurrentUser ? '#00BFFF' : '#FFD700'};
`

const MessageContent = styled.div`
  color: #fff;
  word-break: break-word;
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
  border: 1px solid rgba(0, 191, 255, 0.3);
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

const NameModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  alignItems: center;
  justifyContent: center;
  z-index: 1000;
`

const ModalContent = styled.div`
  background: rgba(0, 0, 0, 0.9);
  padding: 2rem;
  border-radius: 1rem;
  border: 1px solid rgba(0, 191, 255, 0.5);
  max-width: 400px;
  width: 90%;
`

const ModalInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: #fff;
`

const ModalButton = styled.button`
  flex: 1;
  background: ${props => props.primary ? '#00BFFF' : 'rgba(255, 255, 255, 0.1)'};
  color: #fff;
  border: ${props => props.primary ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'};
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  margin: 0 0.25rem;
`

const ChatContainer = ({ 
  gameId, 
  gameData, 
  isCreator, 
  socket, 
  connected 
}) => {
  const { address, isConnected } = useWallet()
  const { getPlayerName, setPlayerName } = useProfile()
  const { showError, showSuccess } = useToast()
  
  const [messages, setMessages] = useState([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isNameModalOpen, setIsNameModalOpen] = useState(false)
  const [tempName, setTempName] = useState('')
  const [playerName, setPlayerNameState] = useState('')
  const [playerNames, setPlayerNames] = useState({})
  
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

  // Listen for chat messages from socket
  useEffect(() => {
    if (!socket) return
    
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📨 Chat: Raw WebSocket message received:', data)
        
        if (data.type === 'chat_message') {
          console.log('📩 Chat: Received chat message:', data)
          addMessage({
            id: Date.now() + Math.random(),
            type: 'chat',
            address: data.from || data.address,
            message: data.message,
            timestamp: data.timestamp || new Date().toISOString()
          })
        } else if (data.type === 'chat_history') {
          console.log('📚 Chat: Received chat history:', data)
          if (data.messages && Array.isArray(data.messages)) {
            const historyMessages = data.messages
              .filter(msg => msg.message_type === 'chat') // Only chat messages
              .map(msg => ({
                id: msg.id || Date.now() + Math.random(),
                type: 'chat',
                address: msg.sender_address,
                message: msg.message,
                timestamp: msg.created_at
              }))
            
            setMessages(historyMessages)
            console.log(`📚 Chat: Loaded ${historyMessages.length} chat history messages`)
          }
        }
      } catch (error) {
        console.error('Chat: Error parsing message:', error)
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
    console.log('📝 Chat: Adding message to state:', message)
    setMessages(prev => {
      const newMessages = [...prev, message]
      console.log('📝 Chat: New messages state:', newMessages.length, 'messages')
      return newMessages
    })
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    
    if (!currentMessage.trim()) return
    
    // Try to send via WebSocket if available
    if (socket && socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify({
          type: 'chat_message',
          gameId: gameId,
          address: address,
          message: currentMessage.trim(),
          timestamp: new Date().toISOString()
        }))
        
        console.log('💬 Chat message sent via WebSocket')
        setCurrentMessage('')
      } catch (error) {
        console.error('❌ Chat: Error sending message:', error)
        showError('Failed to send message. Reconnecting...')
        
        // Try to reconnect
        if (webSocketService) {
          webSocketService.connect(gameId, address)
        }
      }
    } else {
      // Queue the message if WebSocket is not available
      console.log('⚠️ WebSocket not connected, queueing message')
      
      // Still add to local state so user sees their message
      const newMessage = {
        id: Date.now(),
        address: address,
        message: currentMessage.trim(),
        timestamp: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, newMessage])
      setCurrentMessage('')
      
      // Try to reconnect
      if (webSocketService) {
        webSocketService.sendChatMessage(gameId, address, newMessage.message)
      }
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
      console.error('Chat: Error saving name:', error)
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

  if (!isConnected) {
    return (
      <ChatContainerStyled>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#FF1493' }}>Please connect your wallet to chat</p>
        </div>
      </ChatContainerStyled>
    )
  }

  return (
    <ChatContainerStyled>
      <ChatHeader>
        <ChatTitle>💬 Game Chat</ChatTitle>
        <ConnectionStatus>
          <StatusDot connected={connected} />
          <StatusText connected={connected}>
            {connected ? 'Connected' : 'Disconnected'}
          </StatusText>
        </ConnectionStatus>
      </ChatHeader>

      <MessagesContainer>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.6)',
            padding: '2rem'
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>💬</div>
            <div style={{ marginBottom: '0.5rem' }}>No messages yet.</div>
            <div style={{ fontSize: '0.9rem', color: '#00BFFF' }}>
              Start the conversation!
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isCurrentUser = msg.address === address
            const displayName = getDisplayName(msg.address)
            
            return (
              <Message key={index} isCurrentUser={isCurrentUser}>
                <MessageHeader isCurrentUser={isCurrentUser}>
                  <span>💬 {displayName}</span>
                  <span>{formatTimestamp(msg.timestamp)}</span>
                </MessageHeader>
                <MessageContent>{msg.message}</MessageContent>
              </Message>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputContainer>
        <Input
          ref={inputRef}
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          placeholder={connected ? "Type your message..." : "Reconnecting... (you can still type)"}
          disabled={false} // Never disable
          onKeyPress={(e) => e.key === 'Enter' && sendMessage(e)}
        />
        <SendButton
          onClick={sendMessage}
          disabled={!currentMessage.trim()} // Only disable if no message
          style={{
            background: connected ? '#00BFFF' : '#FFA500',
            cursor: currentMessage.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          {connected ? 'Send' : 'Queue'}
        </SendButton>
      </InputContainer>

      {/* Name Modal */}
      {isNameModalOpen && (
        <NameModal>
          <ModalContent>
            <h3 style={{ color: '#00BFFF', marginBottom: '1rem' }}>Set Your Name</h3>
            <ModalInput
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Enter your display name"
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <ModalButton primary onClick={handleSaveName}>
                Save
              </ModalButton>
              <ModalButton onClick={() => setIsNameModalOpen(false)}>
                Cancel
              </ModalButton>
            </div>
          </ModalContent>
        </NameModal>
      )}
    </ChatContainerStyled>
  )
}

export default ChatContainer 