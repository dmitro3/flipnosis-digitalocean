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
    <>
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        borderRadius: '1rem',
        padding: '1rem',
        width: '100%',
        maxWidth: '550px',
        margin: '0 auto',
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
            fontSize: '1rem',
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
          height: '200px',
          overflowY: 'auto',
          marginBottom: '1rem',
          padding: '0.5rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '0.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {messages.length === 0 ? (
            <div style={{
              color: theme.colors.textSecondary,
              textAlign: 'center',
              padding: '2rem',
              fontSize: '0.9rem'
            }}>
              No messages yet. Be the first to say something!
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} style={{
                marginBottom: '0.75rem',
                padding: '0.5rem',
                background: msg.address === address ? 
                  'rgba(255, 215, 0, 0.1)' : 
                  'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.5rem',
                borderLeft: `3px solid ${
                  msg.isSystem ? '#FF6B6B' :
                  msg.address === address ? '#FFD700' : '#00FF41'
                }`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.25rem'
                }}>
                  {!msg.isSystem && (
                    <ProfilePicture
                      address={msg.address}
                      size="20px"
                      isClickable={false}
                    />
                  )}
                  <span style={{
                    color: msg.isSystem ? '#FF6B6B' :
                           msg.address === address ? '#FFD700' : '#00FF41',
                    fontWeight: 'bold',
                    fontSize: '0.8rem'
                  }}>
                    {msg.isSystem ? 'System' : (msg.name || truncateAddress(msg.address))}
                  </span>
                  <span style={{
                    color: theme.colors.textTertiary,
                    fontSize: '0.7rem'
                  }}>
                    {formatTimestamp(msg.timestamp)}
                  </span>
                </div>
                <div style={{
                  color: theme.colors.textPrimary,
                  fontSize: '0.9rem',
                  lineHeight: '1.3',
                  wordBreak: 'break-word'
                }}>
                  {formatMessage(msg.message)}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1 }}>
            <textarea
              ref={inputRef}
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={playerName ? "Type a message..." : "Set your name first..."}
              disabled={!connected || !playerName}
              style={{
                width: '100%',
                minHeight: '40px',
                maxHeight: '80px',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.5rem',
                color: theme.colors.textPrimary,
                fontSize: '0.9rem',
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none'
              }}
              maxLength={500}
            />
            <div style={{
              fontSize: '0.7rem',
              color: theme.colors.textTertiary,
              textAlign: 'right',
              marginTop: '0.25rem'
            }}>
              {currentMessage.length}/500
            </div>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!connected || !currentMessage.trim() || !playerName}
            style={{
              padding: '0.75rem 1rem',
              background: connected && currentMessage.trim() && playerName ? 
                'linear-gradient(45deg, #FFD700, #FFA500)' : 
                'rgba(255, 255, 255, 0.1)',
              color: connected && currentMessage.trim() && playerName ? '#000' : theme.colors.textSecondary,
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              cursor: connected && currentMessage.trim() && playerName ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              fontSize: '0.9rem'
            }}
          >
            Send
          </button>
        </div>

        {/* Player Name Display/Edit */}
        <div style={{
          marginTop: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            color: theme.colors.textSecondary,
            fontSize: '0.8rem'
          }}>
            Chat as: <span style={{ color: '#FFD700', fontWeight: 'bold' }}>
              {playerName || 'No name set'}
            </span>
          </div>
          <button
            onClick={() => {
              setTempName(playerName)
              setIsNameModalOpen(true)
            }}
            style={{
              padding: '0.25rem 0.75rem',
              background: 'transparent',
              border: `1px solid ${theme.colors.neonBlue}`,
              borderRadius: '0.25rem',
              color: theme.colors.neonBlue,
              fontSize: '0.7rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {playerName ? 'Change Name' : 'Set Name'}
          </button>
        </div>
      </div>

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
          zIndex: 10000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(25, 20, 0, 0.9) 100%)',
            padding: '2rem',
            borderRadius: '1rem',
            border: `2px solid #FFD700`,
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)'
          }}>
            <h3 style={{
              color: '#FFD700',
              marginBottom: '1rem',
              textAlign: 'center',
              fontSize: '1.2rem',
              fontWeight: 'bold'
            }}>
              Set Your Chat Name
            </h3>
            <p style={{
              color: theme.colors.textSecondary,
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              Choose a name to display in chat. This will be saved and remembered for future games.
            </p>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Enter your chat name..."
              maxLength={50}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '0.5rem',
                color: theme.colors.textPrimary,
                fontSize: '1rem',
                outline: 'none',
                marginBottom: '0.5rem'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSaveName()
                }
              }}
            />
            <div style={{
              fontSize: '0.7rem',
              color: theme.colors.textTertiary,
              textAlign: 'right',
              marginBottom: '1.5rem'
            }}>
              {tempName.length}/50
            </div>
            <div style={{
              display: 'flex',
              gap: '1rem'
            }}>
              <button
                onClick={() => {
                  setIsNameModalOpen(false)
                  setTempName('')
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '0.5rem',
                  color: theme.colors.textSecondary,
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveName}
                disabled={!validateName(tempName)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: validateName(tempName) ? 
                    'linear-gradient(45deg, #FFD700, #FFA500)' : 
                    'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: validateName(tempName) ? '#000' : theme.colors.textSecondary,
                  cursor: validateName(tempName) ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}
              >
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default GameChatBox 