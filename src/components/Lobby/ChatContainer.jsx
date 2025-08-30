import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useProfile } from '../../contexts/ProfileContext'
import ProfilePicture from '../ProfilePicture'
import styled from '@emotion/styled'

const ChatContainerStyled = styled.div`
  background: rgba(0, 0, 0, 0.7);
  border: 3px solid rgba(0, 191, 255, 0.3);
  border-radius: 1rem;
  padding: 1rem;
  height: 800px;
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
  padding: 1rem;
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
  margin-bottom: 0.75rem;
  font-size: 1rem;
  color: ${props => props.isCurrentUser ? '#00BFFF' : '#FFD700'};
`

const MessageSender = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const MessageContent = styled.div`
  color: #fff;
  word-break: break-word;
  font-size: 1.1rem;
  line-height: 1.4;
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
  background: #00FF41;
  color: #000;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #00CC33;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const ChatContainer = ({ gameId, gameData, socket, connected }) => {
  const { address } = useAccount()
  const { getPlayerName } = useProfile()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [playerNames, setPlayerNames] = useState({})
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Remove auto-scroll on new messages to prevent page jumping
  // useEffect(() => {
  //   scrollToBottom()
  // }, [messages])

  // Load player names and images
  useEffect(() => {
    const loadPlayerNames = async () => {
      const names = {}
      const addresses = [...new Set(messages.map(msg => msg.sender).filter(addr => addr && addr !== 'System'))]
      
      console.log('👥 Loading player names for addresses:', addresses)
      
      for (const addr of addresses) {
        try {
          const response = await fetch(`/api/profile/${addr}`)
          if (response.ok) {
            const profile = await response.json()
            if (profile && profile.name && profile.name.trim()) {
              names[addr] = profile.name.trim()
              console.log(`✅ Loaded name for ${addr}: ${profile.name}`)
            } else if (profile && profile.username && profile.username.trim()) {
              names[addr] = profile.username.trim()
              console.log(`✅ Loaded legacy username for ${addr}: ${profile.username}`)
            } else {
              names[addr] = 'Anonymous'
              console.log(`⚠️ No name found for ${addr}, using Anonymous`)
            }
          } else {
            names[addr] = 'Anonymous'
            console.log(`❌ Failed to load profile for ${addr}, using Anonymous`)
          }
        } catch (error) {
          console.error(`❌ Error loading profile for ${addr}:`, error)
          names[addr] = 'Anonymous'
        }
      }
      
      console.log('👥 Final player names:', names)
      setPlayerNames(names)
    }

    if (messages.length > 0) {
      loadPlayerNames()
    }
  }, [messages])

  // Auto-refresh chat every 2 seconds as fallback
  useEffect(() => {
    if (!gameId) return

    const refreshChat = async () => {
      try {
        const response = await fetch(`/api/chat/${gameId}`)
        const data = await response.json()
        
        if (data.messages && data.messages.length > 0) {
          const historyMessages = data.messages.map(msg => ({
            id: msg.id || Date.now() + Math.random(),
            sender: msg.sender_address || msg.sender,
            message: msg.message,
            timestamp: new Date(msg.created_at || msg.timestamp).toLocaleTimeString(),
            isCurrentUser: (msg.sender_address || msg.sender) === address
          }))
          
          // Only update if we have new messages
          setMessages(prev => {
            if (prev.length !== historyMessages.length) {
              console.log('🔄 Auto-refresh: Found new messages, updating...')
              return historyMessages
            }
            return prev
          })
        }
      } catch (error) {
        console.error('❌ Auto-refresh error:', error)
      }
    }

    // Initial load
    refreshChat()
    
    // Set up interval for auto-refresh
    const interval = setInterval(refreshChat, 2000)
    
    return () => clearInterval(interval)
  }, [gameId, address])

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!gameId || !address) return

    console.log('🔌 Setting up WebSocket for real-time chat...')
    
    const ws = socket || window.FlipnosisWS
    if (!ws) {
      console.error('❌ WebSocket service not available')
      return
    }

    // Connect to WebSocket
    const connectToWebSocket = async () => {
      try {
        if (!ws.isConnected()) {
          console.log('🔌 Connecting to WebSocket...')
          await ws.connect(`game_${gameId}`, address)
          console.log('✅ WebSocket connected for real-time chat')
        }
        setIsConnected(true)
      } catch (error) {
        console.error('❌ WebSocket connection failed:', error)
        setIsConnected(false)
      }
    }

    connectToWebSocket()

    // Real-time message handler
    const handleChatMessage = (data) => {
      console.log('📨 Real-time message received:', data)
      
      if (data.type === 'chat_message') {
        const newMessageObj = {
          id: Date.now() + Math.random(),
          sender: data.from || data.sender,
          message: data.message,
          timestamp: new Date().toLocaleTimeString(),
          isCurrentUser: (data.from || data.sender) === address
        }
        
        console.log('📝 Adding real-time message:', newMessageObj)
        setMessages(prev => [...prev, newMessageObj])
      }
    }

    // Register real-time handler
    ws.on('chat_message', handleChatMessage)

    return () => {
      ws.off('chat_message', handleChatMessage)
    }
  }, [gameId, address, socket])

  const sendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    console.log('📤 Sending message:', newMessage.trim())

    // Try WebSocket first
    const ws = socket || window.FlipnosisWS
    if (ws && ws.isConnected()) {
      const messageData = {
        type: 'chat_message',
        gameId: gameId,
        roomId: `game_${gameId}`,
        message: newMessage.trim(),
        from: address
      }
      
      if (ws.send(messageData)) {
        console.log('✅ Message sent via WebSocket')
        setNewMessage('')
        return
      }
    }

    // Fallback: Send via API
    fetch(`/api/chat/${gameId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: newMessage.trim(),
        sender: address
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('✅ Message sent via API:', data)
      setNewMessage('')
    })
    .catch(error => {
      console.error('❌ Failed to send message:', error)
    })
  }

  const formatTimestamp = (timestamp) => {
    return timestamp
  }

  const getDisplayName = (sender) => {
    if (sender === 'System') return 'System'
    if (sender === address) return 'You'
    // Check if we have a name for this sender
    if (playerNames[sender]) return playerNames[sender]
    // Fallback to Anonymous if no name found
    return 'Anonymous'
  }

  // Debug logging for render
  console.log('🔍 ChatContainer render - messages count:', messages.length)
  console.log('🔍 ChatContainer render - messages:', messages)

  return (
    <ChatContainerStyled>
      <ChatHeader>
        <ChatTitle>💬 Game Chat</ChatTitle>
        <ConnectionStatus>
          <StatusDot connected={connected || isConnected} />
          <StatusText connected={connected || isConnected}>
            {(connected || isConnected) ? 'Connected' : 'Disconnected'}
          </StatusText>
        </ConnectionStatus>
      </ChatHeader>

      <InputContainer>
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={(connected || isConnected) ? "Type your message..." : "Reconnecting... (you can still type)"}
          disabled={false}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage(e)}
        />
        <SendButton
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          style={{
            background: (connected || isConnected) ? '#00FF41' : '#FFA500',
            cursor: newMessage.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          {(connected || isConnected) ? 'Send' : 'Queue'}
        </SendButton>
      </InputContainer>

      <div style={{ marginBottom: '1rem' }}></div>

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
          messages.slice().reverse().map((msg, index) => {
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
                  <MessageSender>
                    <ProfilePicture 
                      address={msg.sender}
                      size={40}
                      style={{
                        borderRadius: '8px',
                        border: '2px solid rgba(255, 255, 255, 0.2)'
                      }}
                    />
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>💬 {displayName}</span>
                  </MessageSender>
                  <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{formatTimestamp(msg.timestamp)}</span>
                </MessageHeader>
                <MessageContent>{msg.message}</MessageContent>
              </Message>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>
    </ChatContainerStyled>
  )
}

export default ChatContainer 