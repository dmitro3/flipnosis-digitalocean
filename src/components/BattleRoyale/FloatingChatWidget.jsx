import React, { useState, useEffect, useRef, useCallback } from 'react'
import styled from '@emotion/styled'
import { useBattleRoyaleGame } from '../../contexts/BattleRoyaleGameContext'
import ProfilePicture from '../ProfilePicture'
import socketService from '../../services/SocketService'

const ChatBubble = styled.div`
  position: fixed;
  bottom: ${props => props.isOpen ? '20px' : '20px'};
  left: 20px;
  z-index: 10000;
  transition: all 0.3s ease;
`

const MinimizedButton = styled.button`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00BFFF, #0080FF);
  border: 3px solid #00BFFF;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 191, 255, 0.4);
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 30px rgba(0, 191, 255, 0.6);
  }
  
  ${props => props.hasUnread && `
    &::after {
      content: '';
      position: absolute;
      top: 3px;
      right: 3px;
      width: 8px;
      height: 8px;
      background: #ff1493;
      border-radius: 50%;
      border: 2px solid white;
      animation: pulse 2s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }
  `}
`

const ChatWindow = styled.div`
  width: 800px;
  height: 600px;
  background: rgba(0, 0, 40, 0.95);
  border: 2px solid #00BFFF;
  border-radius: 1rem;
  backdrop-filter: blur(20px);
  box-shadow: 0 0 40px rgba(0, 191, 255, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  @media (max-width: 768px) {
    width: calc(100vw - 40px);
    height: 500px;
  }
`

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(0, 191, 255, 0.1);
  border-bottom: 1px solid rgba(0, 191, 255, 0.3);
`

const ChatTitle = styled.h3`
  margin: 0;
  color: #00BFFF;
  font-size: 1.2rem;
  font-weight: bold;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #00BFFF;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    color: #ff6b6b;
    transform: rotate(90deg);
  }
`

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 191, 255, 0.5);
    border-radius: 4px;
  }
`

const Message = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: ${props => props.isCurrentUser ? 'flex-end' : 'flex-start'};
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

const MessageSender = styled.div`
  font-size: 0.9rem;
  color: ${props => props.isCurrentUser ? '#00BFFF' : '#FFD700'};
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
`

const MessageBubble = styled.div`
  background: ${props => props.isCurrentUser ? 
    'rgba(0, 191, 255, 0.2)' : 
    'rgba(255, 255, 255, 0.1)'
  };
  border: 2px solid transparent;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  max-width: 80%;
  word-wrap: break-word;
  color: white;
  font-size: 1rem;
  line-height: 1.4;
  animation: 
    rotatingBorder 3s linear infinite,
    borderPulse 1.5s ease-in-out infinite;
  
  @keyframes rotatingBorder {
    0% {
      border-color: rgba(255, 20, 147, 0.8);
      box-shadow: 0 0 20px rgba(255, 20, 147, 0.3);
    }
    20% {
      border-color: rgba(255, 255, 0, 0.8);
      box-shadow: 0 0 20px rgba(255, 255, 0, 0.3);
    }
    40% {
      border-color: rgba(0, 255, 65, 0.8);
      box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
    }
    60% {
      border-color: rgba(0, 191, 255, 0.8);
      box-shadow: 0 0 20px rgba(0, 191, 255, 0.3);
    }
    80% {
      border-color: rgba(138, 43, 226, 0.8);
      box-shadow: 0 0 20px rgba(138, 43, 226, 0.3);
    }
    100% {
      border-color: rgba(255, 20, 147, 0.8);
      box-shadow: 0 0 20px rgba(255, 20, 147, 0.3);
    }
  }
  
  @keyframes borderPulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
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
  background: rgba(0, 0, 0, 0.3);
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
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #0080FF, #0060FF);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 191, 255, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const FloatingChatWidget = () => {
  const { gameState, address } = useBattleRoyaleGame()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [hasUnread, setHasUnread] = useState(false)
  const messagesEndRef = useRef(null)
  
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])
  
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])
  
  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      if (!gameState?.gameId) return
      
      try {
        const roomId = `game_${gameState.gameId}`
        const response = await fetch(`/api/chat/${roomId}?limit=100`)
        if (response.ok) {
          const data = await response.json()
          if (data.messages && Array.isArray(data.messages)) {
            const formatted = data.messages.map(msg => ({
              id: msg.id || Date.now() + Math.random(),
              sender: msg.sender_address || msg.sender,
              message: msg.message,
              timestamp: new Date(msg.timestamp || msg.created_at).toLocaleTimeString(),
              isCurrentUser: (msg.sender_address || msg.sender)?.toLowerCase() === address?.toLowerCase()
            }))
            setMessages(formatted)
          }
        }
      } catch (error) {
        console.error('Failed to load chat history:', error)
      }
    }
    
    loadHistory()
  }, [gameState?.gameId, address])
  
  // Listen for new messages
  useEffect(() => {
    if (!gameState?.gameId) return
    
    const handleMessage = (data) => {
      // Don't add our own messages (they're already added locally)
      if ((data.from || data.address)?.toLowerCase() === address?.toLowerCase()) {
        return
      }
      
      const newMsg = {
        id: Date.now() + Math.random(),
        sender: data.from || data.address,
        message: data.message,
        timestamp: new Date(data.timestamp).toLocaleTimeString(),
        isCurrentUser: false
      }
      
      setMessages(prev => [...prev, newMsg])
      
      // Show unread indicator if chat is closed
      if (!isOpen) {
        setHasUnread(true)
      }
    }
    
    socketService.on('chat_message', handleMessage)
    
    return () => {
      socketService.off('chat_message', handleMessage)
    }
  }, [gameState?.gameId, address, isOpen])
  
  const handleSend = () => {
    if (!newMessage.trim() || !gameState?.gameId || !address) return
    
    const roomId = `game_${gameState.gameId}`
    const messageText = newMessage.trim()
    
    // Add message to local state immediately for the sender
    const newMsg = {
      id: Date.now() + Math.random(),
      sender: address,
      message: messageText,
      timestamp: new Date().toLocaleTimeString(),
      isCurrentUser: true
    }
    
    setMessages(prev => [...prev, newMsg])
    setNewMessage('')
    
    // Send to server
    socketService.emit('chat_message', {
      roomId,
      message: messageText,
      address
    })
  }
  
  const handleOpen = () => {
    setIsOpen(true)
    setHasUnread(false)
  }
  
  if (!gameState) return null
  
  return (
    <ChatBubble isOpen={isOpen}>
      {isOpen ? (
        <ChatWindow>
        <ChatHeader>
          <ChatTitle>💬 Flip Chat</ChatTitle>
            <CloseButton onClick={() => setIsOpen(false)}>×</CloseButton>
          </ChatHeader>
          
          <MessagesContainer>
            {messages.map((msg, index) => (
              <Message key={msg.id} isCurrentUser={msg.isCurrentUser}>
                <MessageSender isCurrentUser={msg.isCurrentUser}>
                  <ProfilePicture 
                    address={msg.sender}
                    size={32}
                    style={{
                      borderRadius: '8px',
                      border: '2px solid rgba(255, 255, 255, 0.2)'
                    }}
                  />
                  {msg.isCurrentUser ? 'You' : `${msg.sender?.slice(0, 6)}...${msg.sender?.slice(-4)}`}
                </MessageSender>
                <MessageBubble isCurrentUser={msg.isCurrentUser}>
                  {msg.message}
                </MessageBubble>
                <MessageTime>{msg.timestamp}</MessageTime>
              </Message>
            ))}
            <div ref={messagesEndRef} />
          </MessagesContainer>
          
          <ChatInput>
            <MessageInput
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <SendButton onClick={handleSend} disabled={!newMessage.trim()}>
              Send
            </SendButton>
          </ChatInput>
        </ChatWindow>
      ) : (
        <MinimizedButton onClick={handleOpen} hasUnread={hasUnread}>
          💬
        </MinimizedButton>
      )}
    </ChatBubble>
  )
}

export default FloatingChatWidget
