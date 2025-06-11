import React, { useState, useEffect, useRef } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { useProfile } from '../contexts/ProfileContext'
import { useToast } from '../contexts/ToastContext'
import { theme } from '../styles/theme'
import ProfilePicture from './ProfilePicture'

const GameChatBox = ({ gameId, socket, connected }) => {
  const { address, isConnected } = useWallet()
  const { getPlayerName, setPlayerName } = useProfile()
  const { showError } = useToast()
  
  const [messages, setMessages] = useState([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isNameModalOpen, setIsNameModalOpen] = useState(false)
  const [tempName, setTempName] = useState('')
  const [playerName, setPlayerNameState] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const wsRef = useRef(null)
  
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

  // Listen for chat messages from WebSocket
  useEffect(() => {
    if (!socket) return

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'chat_message') {
          setMessages(prev => [...prev, {
            id: data.id,
            address: data.address,
            name: data.name,
            message: data.message,
            timestamp: data.timestamp,
            isSystem: data.isSystem || false
          }])
        }
      } catch (error) {
        console.error('Error parsing chat message:', error)
      }
    }

    socket.addEventListener('message', handleMessage)
    return () => socket.removeEventListener('message', handleMessage)
  }, [socket])

  // Validate and sanitize message input
  const validateMessage = (message) => {
    if (!message || typeof message !== 'string') return false
    if (message.trim().length === 0) return false
    if (message.length > 500) return false // Max length
    
    // Basic content validation - no HTML allowed
    if (message.includes('<') || message.includes('>')) return false
    if (message.includes('javascript:')) return false
    if (message.includes('data:')) return false
    
    return true
  }

  // Validate and sanitize name input
  const validateName = (name) => {
    if (!name || typeof name !== 'string') return false
    if (name.trim().length === 0) return false
    if (name.length > 50) return false // Max length
    
    // Only allow alphanumeric, spaces, and basic punctuation
    const validNameRegex = /^[a-zA-Z0-9\s\-_.!@#$%^&*()]+$/
    if (!validNameRegex.test(name)) return false
    
    // No HTML or script injection attempts
    if (name.includes('<') || name.includes('>')) return false
    if (name.includes('javascript:')) return false
    if (name.includes('data:')) return false
    
    return true
  }

  const handleSendMessage = async () => {
    if (!connected || !socket || !address || !isConnected) {
      showError('Not connected to game')
      return
    }

    // Check if user has set a name
    if (!playerName) {
      setIsNameModalOpen(true)
      return
    }

    const message = currentMessage.trim()
    if (!validateMessage(message)) {
      showError('Invalid message. Keep it under 500 characters and avoid special characters.')
      return
    }

    try {
      const chatMessage = {
        type: 'chat_message',
        gameId,
        address,
        name: playerName,
        message,
        timestamp: new Date().toISOString()
      }

      socket.send(JSON.stringify(chatMessage))
      setCurrentMessage('')
      
      // Focus back to input
      inputRef.current?.focus()
    } catch (error) {
      console.error('Error sending chat message:', error)
      showError('Failed to send message')
    }
  }

  const handleSaveName = async () => {
    if (!validateName(tempName)) {
      showError('Invalid name. Use 50 characters or less, alphanumeric and basic punctuation only.')
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatMessage = (msg) => {
    // React automatically escapes any HTML content when using {msg}
    // This prevents XSS attacks
    return msg
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const truncateAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    // Clear unread count when opening chat
    if (isChatOpen) {
      setUnreadCount(0)
    }
  }, [isChatOpen])

  useEffect(() => {
    const ws = new WebSocket(`wss://your-websocket-server.com/game/${gameId}`)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
    }

    ws.onclose = () => {
      setConnected(false)
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setMessages(prev => [...prev, data])
      
      // When new message arrives and chat is closed
      if (!isChatOpen && data.address !== address) {
        setUnreadCount(prev => prev + 1)
      }
    }

    return () => {
      ws.close()
    }
  }, [gameId, address, isChatOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const message = {
      text: newMessage,
      address: address,
      timestamp: new Date().toISOString()
    }

    wsRef.current?.send(JSON.stringify(message))
    setNewMessage('')
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
        <div style={{ color: theme.colors.textSecondary }}>
          Connect your wallet to join the chat
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(25, 20, 0, 0.9) 100%)',
      border: '2px solid #FFD700',
      borderRadius: '1rem',
      padding: '1rem',
      width: '100%',
      height: '400px',
      display: 'flex',
      flexDirection: 'column',
      backdropFilter: 'blur(10px)'
    }}>
      {/* Chat Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid rgba(255, 215, 0, 0.3)'
      }}>
        <div style={{
          color: '#FFD700',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          💬 Game Chat
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: connected ? '#00FF00' : '#FF0000',
            animation: connected ? 'pulse 2s infinite' : 'none'
          }} />
          <span style={{ 
            color: theme.colors.textSecondary, 
            fontSize: '0.8rem' 
          }}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        marginBottom: '1rem',
        padding: '0.5rem'
      }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              marginBottom: '0.5rem',
              padding: '0.5rem',
              background: msg.address === address ? 
                'rgba(255, 215, 0, 0.1)' : 
                'rgba(255, 255, 255, 0.05)',
              borderRadius: '0.5rem',
              maxWidth: '80%',
              marginLeft: msg.address === address ? 'auto' : '0'
            }}
          >
            <div style={{
              fontSize: '0.8rem',
              color: theme.colors.textSecondary,
              marginBottom: '0.25rem'
            }}>
              {msg.address.slice(0, 6)}...{msg.address.slice(-4)}
            </div>
            <div style={{ color: '#fff' }}>{msg.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} style={{
        display: 'flex',
        gap: '0.5rem'
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            color: '#fff',
            fontSize: '0.9rem'
          }}
        />
        <button
          type="submit"
          style={{
            background: 'linear-gradient(45deg, #FFD700, #FFA500)',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.75rem 1.5rem',
            color: '#000',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Send
        </button>
      </form>

      {/* Name Modal */}
      {isNameModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(25, 20, 0, 0.9) 100%)',
            border: '2px solid #FFD700',
            borderRadius: '1rem',
            padding: '1.5rem',
            width: '90%',
            maxWidth: '400px',
            position: 'relative'
          }}>
            <h3 style={{
              color: '#FFD700',
              marginBottom: '1rem',
              fontSize: '1.2rem'
            }}>
              {playerName ? 'Change Your Name' : 'Set Your Name'}
            </h3>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Enter your name..."
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.5rem',
                color: '#fff',
                fontSize: '1rem',
                marginBottom: '1rem'
              }}
            />
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setIsNameModalOpen(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 0, 0, 0.5)',
                  borderRadius: '0.5rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveName}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </div>
  )
}

export default GameChatBox