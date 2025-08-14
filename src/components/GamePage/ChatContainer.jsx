import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAccount } from 'wagmi'

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
      if (data.type === 'chat_message' && data.roomId === gameId) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: data.sender,
          message: data.message,
          timestamp: new Date().toLocaleTimeString()
        }])
      }
    }

    const handleUserJoined = (data) => {
      console.log('👤 User joined:', data)
      if (data.type === 'user_joined' && data.roomId === gameId) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: 'System',
          message: `${data.address} joined the game`,
          timestamp: new Date().toLocaleTimeString(),
          isSystem: true
        }])
      }
    }

    const handleUserLeft = (data) => {
      console.log('👤 User left:', data)
      if (data.type === 'user_left' && data.roomId === gameId) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: 'System',
          message: `${data.address} left the game`,
          timestamp: new Date().toLocaleTimeString(),
          isSystem: true
        }])
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
        if (data.messages) {
          setMessages(data.messages.map(msg => ({
            id: msg.id,
            sender: msg.sender,
            message: msg.message,
            timestamp: new Date(msg.timestamp).toLocaleTimeString()
          })))
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

  return (
    <div className="chat-container bg-gray-900 rounded-lg p-4 h-96 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold">Game Chat</h3>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>
      
      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isSystem ? 'justify-center' : 'justify-start'}`}>
            <div className={`max-w-xs px-3 py-2 rounded-lg ${
              msg.isSystem 
                ? 'bg-gray-700 text-gray-300 text-sm' 
                : msg.sender === address 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-white'
            }`}>
              {!msg.isSystem && (
                <div className="text-xs text-gray-300 mb-1">
                  {msg.sender === address ? 'You' : msg.sender}
                </div>
              )}
              <div>{msg.message}</div>
              <div className="text-xs text-gray-400 mt-1">{msg.timestamp}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
          disabled={!isConnected}
        />
        <button
          type="submit"
          disabled={!isConnected || !newMessage.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default ChatContainer 