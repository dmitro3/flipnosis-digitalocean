import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAccount } from 'wagmi'
import styled from '@emotion/styled'

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

const ChatContainer = () => {
  const { gameId } = useParams()
  const { address } = useAccount()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!gameId || !address) return

    // Use the global WebSocket service
    const ws = window.FlipnosisWS
    if (!ws) {
      console.error('❌ WebSocket service not available')
      return
    }

    console.log('🔌 Connecting to WebSocket for chat...')
    
    // Connect to WebSocket
    ws.connect(gameId, address)
      .then(() => {
        console.log('✅ Connected to WebSocket for chat')
        setIsConnected(true)
      })
      .catch((error) => {
        console.error('❌ Failed to connect to WebSocket:', error)
        setIsConnected(false)
      })

    // Set up message handlers
    const handleChatMessage = (data) => {
      console.log('📨 Chat message received:', data)
      if (data.type === 'chat_message') {
        const newMessageObj = {
          id: Date.now() + Math.random(), // Ensure unique ID
          sender: data.from || data.sender,
          message: data.message,
          timestamp: new Date().toLocaleTimeString(),
          isCurrentUser: (data.from || data.sender) === address
        }
        console.log('📝 Adding message to state:', newMessageObj)
        setMessages(prev => {
          const newMessages = [...prev, newMessageObj]
          console.log('📝 New messages state:', newMessages.length, 'messages')
          return newMessages
        })
      }
    }

    const handleUserJoined = (data) => {
      console.log('👤 User joined:', data)
      if (data.type === 'user_joined') {
        const systemMessage = {
          id: Date.now() + Math.random(),
          sender: 'System',
          message: `${data.address} joined the game`,
          timestamp: new Date().toLocaleTimeString(),
          isSystem: true
        }
        setMessages(prev => [...prev, systemMessage])
      }
    }

    const handleUserLeft = (data) => {
      console.log('👤 User left:', data)
      if (data.type === 'user_left') {
        const systemMessage = {
          id: Date.now() + Math.random(),
          sender: 'System',
          message: `${data.address} left the game`,
          timestamp: new Date().toLocaleTimeString(),
          isSystem: true
        }
        setMessages(prev => [...prev, systemMessage])
      }
    }

    // Register handlers
    ws.on('chat_message', handleChatMessage)
    ws.on('user_joined', handleUserJoined)
    ws.on('user_left', handleUserLeft)

    // Load chat history
    fetch(`/api/chat/${gameId}`)
      .then(response => response.json())
      .then(data => {
        console.log('📚 Chat history loaded:', data)
        if (data.messages) {
          const historyMessages = data.messages.map(msg => ({
            id: msg.id || Date.now() + Math.random(),
            sender: msg.sender,
            message: msg.message,
            timestamp: new Date(msg.timestamp).toLocaleTimeString(),
            isCurrentUser: msg.sender === address
          }))
          console.log('📚 Setting history messages:', historyMessages)
          setMessages(historyMessages)
        }
      })
      .catch(error => {
        console.error('Error loading chat history:', error)
      })

    // Cleanup
    return () => {
      ws.off('chat_message', handleChatMessage)
      ws.off('user_joined', handleUserJoined)
      ws.off('user_left', handleUserLeft)
    }
  }, [gameId, address])

  const sendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !isConnected) return

    const ws = window.FlipnosisWS
    if (!ws) {
      console.error('❌ WebSocket service not available')
      return
    }

    const messageData = {
      type: 'chat_message',
      gameId: gameId,
      message: newMessage.trim(),
      sender: address
    }

    console.log('📤 Sending chat message:', messageData)
    
    if (ws.send(messageData)) {
      setNewMessage('')
    } else {
      console.error('❌ Failed to send message')
    }
  }

  const formatTimestamp = (timestamp) => {
    return timestamp
  }

  const getDisplayName = (sender) => {
    if (sender === 'System') return 'System'
    if (sender === address) return 'You'
    return sender ? `${sender.slice(0, 6)}...${sender.slice(-4)}` : 'Unknown'
  }

  // Debug logging for render
  console.log('🔍 ChatContainer render - messages count:', messages.length)
  console.log('🔍 ChatContainer render - messages:', messages)

  return (
    <ChatContainerStyled>
      <ChatHeader>
        <ChatTitle>💬 Game Chat</ChatTitle>
        <ConnectionStatus>
          <StatusDot connected={isConnected} />
          <StatusText connected={isConnected}>
            {isConnected ? 'Connected' : 'Disconnected'}
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
            const isCurrentUser = msg.sender === address
            const displayName = getDisplayName(msg.sender)
            
            console.log('🔍 Rendering message:', { index, msg, isCurrentUser, displayName })
            
            if (msg.isSystem) {
              return (
                <div key={msg.id || index} style={{
                  textAlign: 'center',
                  marginBottom: '0.75rem',
                  padding: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#FFD700',
                  fontSize: '0.8rem',
                  fontStyle: 'italic'
                }}>
                  {msg.message}
                </div>
              )
            }
            
            return (
              <Message key={msg.id || index} isCurrentUser={isCurrentUser}>
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
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isConnected ? "Type your message..." : "Reconnecting... (you can still type)"}
          disabled={false}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage(e)}
        />
        <SendButton
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          style={{
            background: isConnected ? '#00BFFF' : '#FFA500',
            cursor: newMessage.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          {isConnected ? 'Send' : 'Queue'}
        </SendButton>
      </InputContainer>
    </ChatContainerStyled>
  )
}

export default ChatContainer 