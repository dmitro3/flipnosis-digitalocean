import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import webSocketService from '../services/WebSocketService'

const Container = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #0f0f23 100%);
  border-radius: 16px;
  padding: 1.5rem;
  height: 500px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`

const Title = styled.h3`
  color: #00FF41;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-bottom: 1rem;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #00FF41;
    border-radius: 3px;
  }
`

const Message = styled.div`
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background: ${props => props.isCurrentUser ? 
    'linear-gradient(135deg, rgba(0, 255, 65, 0.2), rgba(0, 191, 255, 0.1))' : 
    'rgba(255, 255, 255, 0.05)'};
  border-radius: 8px;
  border-left: 3px solid ${props => props.isCurrentUser ? '#00FF41' : '#00BFFF'};
  animation: slideIn 0.3s ease;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(${props => props.isCurrentUser ? '10px' : '-10px'});
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
`

const MessageText = styled.div`
  color: #fff;
  word-wrap: break-word;
`

const InputContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`

const Input = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 255, 65, 0.3);
  color: #fff;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #00FF41;
    background: rgba(0, 255, 65, 0.05);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`

const SendButton = styled.button`
  background: linear-gradient(135deg, #00FF41, #00BFFF);
  color: #000;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 255, 65, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: ${props => props.connected ? '#00FF41' : '#FFA500'};
  margin-bottom: 0.5rem;
`

const StatusDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${props => props.connected ? '#00FF41' : '#FFA500'};
  animation: ${props => props.connected ? 'none' : 'pulse 2s infinite'};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`

export default function ChatContainer({ gameId, address, username }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // WebSocket connection and message handling
  useEffect(() => {
    if (!gameId || !address) return

    console.log('💬 ChatContainer: Setting up WebSocket connection...')
    
    // Connect to WebSocket
    const connectAndSetup = async () => {
      try {
        await webSocketService.connect(gameId, address)
        console.log('✅ ChatContainer: WebSocket connected')
        
        // Load chat history from API (once)
        try {
          const response = await fetch(`/api/chat/${gameId}?limit=50`)
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
              console.log(`📊 Loaded ${formattedMessages.length} messages from history`)
            }
          }
        } catch (error) {
          console.error('❌ Failed to load chat history:', error)
        }
      } catch (error) {
        console.error('❌ WebSocket connection failed:', error)
      }
    }

    connectAndSetup()

    // Real-time message handler
    const handleChatMessage = (data) => {
      console.log('💬 Chat message received:', data)
      
      const newMsg = {
        id: Date.now() + Math.random(),
        sender: data.from || data.sender,
        message: data.message,
        timestamp: new Date().toLocaleTimeString(),
        isCurrentUser: (data.from || data.sender)?.toLowerCase() === address?.toLowerCase()
      }
      
      setMessages(prev => [...prev, newMsg])
    }

    // Handle chat history
    const handleChatHistory = (data) => {
      if (data.messages && Array.isArray(data.messages)) {
        const formattedMessages = data.messages.map(msg => ({
          id: msg.id || Date.now() + Math.random(),
          sender: msg.sender_address || msg.sender,
          message: msg.message,
          timestamp: new Date(msg.timestamp).toLocaleTimeString(),
          isCurrentUser: (msg.sender_address || msg.sender)?.toLowerCase() === address?.toLowerCase()
        }))
        setMessages(formattedMessages)
      }
    }

    const handleConnectionStatus = () => {
      setConnectionStatus(webSocketService.getConnectionStatus())
    }

    // Register handlers
    webSocketService.on('chat_message', handleChatMessage)
    webSocketService.on('chat_history', handleChatHistory)
    webSocketService.on('connected', handleConnectionStatus)
    webSocketService.on('disconnected', handleConnectionStatus)
    
    // Set initial connection status
    handleConnectionStatus()

    // Cleanup
    return () => {
      webSocketService.off('chat_message', handleChatMessage)
      webSocketService.off('chat_history', handleChatHistory)
      webSocketService.off('connected', handleConnectionStatus)
      webSocketService.off('disconnected', handleConnectionStatus)
    }
  }, [gameId, address])

  const sendMessage = () => {
    if (!newMessage.trim()) return

    // Send via WebSocket
    const sent = webSocketService.send({
      type: 'chat_message',
      gameId,
      from: address,
      message: newMessage.trim()
    })

    if (sent) {
      // Add optimistically if sent successfully
      const optimisticMessage = {
        id: Date.now(),
        sender: address,
        message: newMessage.trim(),
        timestamp: new Date().toLocaleTimeString(),
        isCurrentUser: true
      }
      setMessages(prev => [...prev, optimisticMessage])
    }

    setNewMessage('')
  }

  return (
    <Container>
      <Title>
        💬 Game Chat
        <ConnectionStatus connected={connectionStatus === 'connected'}>
          <StatusDot connected={connectionStatus === 'connected'} />
          {connectionStatus === 'connected' ? 'Live' : 
           connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
        </ConnectionStatus>
      </Title>

      <MessagesContainer>
        {messages.length > 0 ? (
          messages.map(msg => (
            <Message key={msg.id} isCurrentUser={msg.isCurrentUser}>
              <MessageHeader>
                <span>{msg.isCurrentUser ? 'You' : `${msg.sender?.slice(0, 6)}...${msg.sender?.slice(-4)}`}</span>
                <span>{msg.timestamp}</span>
              </MessageHeader>
              <MessageText>{msg.message}</MessageText>
            </Message>
          ))
        ) : (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.5)',
            padding: '2rem'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
            <div>No messages yet</div>
            <div style={{ fontSize: '0.9rem' }}>Start the conversation!</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputContainer>
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={connectionStatus === 'connected' ? "Type your message..." : "Connecting..."}
          disabled={connectionStatus !== 'connected'}
        />
        <SendButton
          onClick={sendMessage}
          disabled={!newMessage.trim() || connectionStatus !== 'connected'}
        >
          Send
        </SendButton>
      </InputContainer>
    </Container>
  )
}
