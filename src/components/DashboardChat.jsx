import React, { useState, useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import { useToast } from '../contexts/ToastContext'
import { GlassCard, Button } from '../styles/components'

const ChatContainer = styled(GlassCard)`
  height: 400px;
  display: flex;
  flex-direction: column;
  padding: 1rem;
`

const ChatHeader = styled.div`
  font-weight: bold;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 65, 0.3);
    border-radius: 3px;
  }
`

const Message = styled.div`
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: ${props => props.isOwn ? 'rgba(0, 255, 65, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 0.5rem;
  border: 1px solid ${props => props.isOwn ? 'rgba(0, 255, 65, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
`

const MessageAuthor = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 0.25rem;
`

const MessageText = styled.div`
  color: ${props => props.theme.colors.textPrimary};
`

const ChatInput = styled.div`
  display: flex;
  gap: 0.5rem;
`

const Input = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.5rem;
  border-radius: 0.5rem;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.neonGreen};
  }
`

const SendButton = styled(Button)`
  padding: 0.5rem 1rem;
  background: linear-gradient(45deg, #00FF41, #39FF14);
  color: #000;
`

const DashboardChat = ({ listingId, socket, currentUser }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)
  const { showError } = useToast()
  
  useEffect(() => {
    if (!socket) return
    
    // Subscribe to this listing's chat
    socket.send(JSON.stringify({
      type: 'subscribe_listing_chat',
      listingId
    }))
    
    // Listen for messages
    const handleMessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'dashboard_chat_message' && data.listingId === listingId) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          address: data.address,
          message: data.message,
          timestamp: data.timestamp
        }])
      }
    }
    
    socket.addEventListener('message', handleMessage)
    
    return () => {
      socket.removeEventListener('message', handleMessage)
    }
  }, [socket, listingId])
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return
    
    socket.send(JSON.stringify({
      type: 'dashboard_chat',
      listingId,
      message: newMessage.trim()
    }))
    
    setNewMessage('')
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  return (
    <ChatContainer>
      <ChatHeader>Listing Chat</ChatHeader>
      
      <MessagesContainer>
        {messages.map(msg => (
          <Message key={msg.id} isOwn={msg.address === currentUser}>
            <MessageAuthor>
              {msg.address === currentUser ? 'You' : `${msg.address ? msg.address.slice(0, 6) + '...' : 'Unknown'}`}
            </MessageAuthor>
            <MessageText>{msg.message}</MessageText>
          </Message>
        ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      
      <ChatInput>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
        />
        <SendButton onClick={sendMessage}>Send</SendButton>
      </ChatInput>
    </ChatContainer>
  )
}

export default DashboardChat 