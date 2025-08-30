import React, { useState, useRef, useEffect } from 'react'
import styled from '@emotion/styled'
import { useAccount } from 'wagmi'

const ChatContainer = styled.div`
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(138, 43, 226, 0.3);
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  height: ${props => props.$isCompact ? '200px' : '300px'};
  transition: all 0.5s ease;
`

const ChatHeader = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(138, 43, 226, 0.3);
  font-weight: bold;
  color: #00BFFF;
`

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const Message = styled.div`
  padding: 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  word-break: break-word;
  
  ${props => props.$isOwn && `
    background: rgba(0, 191, 255, 0.2);
    border: 1px solid rgba(0, 191, 255, 0.3);
    align-self: flex-end;
    max-width: 80%;
  `}
  
  ${props => !props.$isOwn && `
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    align-self: flex-start;
    max-width: 80%;
  `}
`

const MessageSender = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.25rem;
`

const MessageText = styled.div`
  color: white;
`

const InputContainer = styled.div`
  padding: 0.75rem;
  border-top: 1px solid rgba(138, 43, 226, 0.3);
  display: flex;
  gap: 0.5rem;
`

const MessageInput = styled.input`
  flex: 1;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(138, 43, 226, 0.3);
  border-radius: 0.5rem;
  padding: 0.5rem;
  color: white;
  font-size: 0.9rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #00BFFF;
  }
`

const SendButton = styled.button`
  background: linear-gradient(135deg, #00BFFF, #8A2BE2);
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 0 10px rgba(0, 191, 255, 0.5);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export default function GameChat({ messages = [], onSendMessage, isCompact = false }) {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)
  const { address } = useAccount()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!inputValue.trim() || !onSendMessage) return
    
    onSendMessage(inputValue.trim())
    setInputValue('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend()
    }
  }

  return (
    <ChatContainer $isCompact={isCompact}>
      <ChatHeader>Game Chat</ChatHeader>
      
      <MessagesContainer>
        {messages.map((message, index) => (
          <Message 
            key={message.id || index} 
            $isOwn={message.sender === address}
          >
            <MessageSender>
              {message.sender === address ? 'You' : message.sender?.slice(0, 6) + '...'}
            </MessageSender>
            <MessageText>{message.message}</MessageText>
          </Message>
        ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      
      <InputContainer>
        <MessageInput
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={!onSendMessage}
        />
        <SendButton 
          onClick={handleSend}
          disabled={!inputValue.trim() || !onSendMessage}
        >
          Send
        </SendButton>
      </InputContainer>
    </ChatContainer>
  )
}
