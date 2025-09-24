import React, { useState, useEffect, useCallback } from 'react'
import styled from '@emotion/styled'
import { useParams } from 'react-router-dom'
import { useWallet } from '../../contexts/WalletContext'
import { useToast } from '../../contexts/ToastContext'
import { getApiUrl } from '../../config/api'
import socketService from '../../services/SocketService'
import BattleRoyaleNFTDetailsTab from './tabs/BattleRoyaleNFTDetailsTab'
import BattleRoyaleGamePageTab from './tabs/BattleRoyaleGamePageTab'
import hazeVideo from '../../../Images/Video/haze.webm'

// ===== BATTLE ROYALE TABBED INTERFACE =====
// This component provides a tabbed interface for Battle Royale games
// Tabs: NFT Details (with chat) → Join Game (8 player slots)

// === BACKGROUND VIDEO (same as homepage) ===
const BackgroundVideo = styled.video`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  opacity: 0.7;
`

// === TABBED INTERFACE STYLED COMPONENTS ===
const TabbedContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 600px;
  background: transparent; /* TRANSPARENT TO SHOW VIDEO */
  border: 2px solid rgba(0, 191, 255, 0.3);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(0, 191, 255, 0.2);
  backdrop-filter: blur(5px); /* Reduced blur since no background */
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    min-height: 500px;
    border-radius: 0;
    border: none;
    background: transparent; /* TRANSPARENT TO SHOW VIDEO */
  }
`

const TabsHeader = styled.div`
  display: flex;
  background: rgba(0, 0, 0, 0.8);
  border-bottom: 2px solid rgba(0, 191, 255, 0.3);
  
  @media (max-width: 768px) {
    flex-direction: row;
    overflow-x: auto;
  }
`

const Tab = styled.button`
  flex: 1;
  padding: 1.5rem 2rem;
  background: ${props => props.active ? 
    'linear-gradient(135deg, rgba(0, 191, 255, 0.2), rgba(0, 255, 65, 0.1))' : 
    'transparent'
  };
  color: ${props => props.active ? '#00BFFF' : '#FFFFFF'};
  border: none;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    background: ${props => props.active ? 
      'linear-gradient(135deg, rgba(0, 191, 255, 0.3), rgba(0, 255, 65, 0.2))' : 
      'rgba(255, 255, 255, 0.05)'
    };
  }
  
  &:last-child {
    border-right: none;
  }
  
  /* Tab-specific colors */
  &:nth-child(1) {
    ${props => props.active && `
      background: linear-gradient(135deg, rgba(255, 20, 147, 0.3), rgba(255, 105, 180, 0.2));
      color: #FF1493;
      text-shadow: 0 0 10px #FF1493;
    `}
  }
  
  &:nth-child(2) {
    ${props => props.active && `
      background: linear-gradient(135deg, rgba(0, 255, 65, 0.3), rgba(57, 255, 20, 0.2));
      color: #00FF41;
      text-shadow: 0 0 10px #00FF41;
    `}
  }
  
  @media (max-width: 768px) {
    flex: 1;
    padding: 1rem 0.5rem;
    font-size: 0.9rem;
    min-width: 120px;
  }
`

const TabContent = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
`

const LoadingSpinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #00ff88;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 2rem auto;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const BattleRoyaleTabbedInterface = ({ gameId: propGameId, gameData: propGameData }) => {
  const { gameId: paramGameId } = useParams()
  const { address } = useWallet()
  const { showToast } = useToast()
  
  // Use gameId from props or URL params
  const gameId = propGameId || paramGameId
  
  // ===== TAB STATE =====
  // Preserve tab state in localStorage to survive reloads
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem(`battleRoyaleTab_${gameId}`)
    return savedTab || 'details'
  }) // 'details', 'game'
  
  // Update tab state when gameId changes
  useEffect(() => {
    if (gameId) {
      const savedTab = localStorage.getItem(`battleRoyaleTab_${gameId}`)
      if (savedTab && savedTab !== activeTab) {
        setActiveTab(savedTab)
      }
    }
  }, [gameId, activeTab])
  
  // ===== GAME DATA LOADING =====
  const [gameData, setGameData] = useState(propGameData || null)
  const [gameDataLoading, setGameDataLoading] = useState(!propGameData)
  const [gameDataError, setGameDataError] = useState(null)
  const [connected, setConnected] = useState(false)
  
  const loadGameData = useCallback(async () => {
    if (!gameId) return
    
    // Don't reload if we already have game data for this gameId
    if (gameData && gameData.id === gameId) {
      console.log('🔄 Game data already loaded for:', gameId)
      return
    }
    
    try {
      console.log('🔄 Loading game data for:', gameId)
      setGameDataLoading(true)
      const response = await fetch(getApiUrl(`/battle-royale/${gameId}`))
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.game) {
          console.log('✅ Game data loaded successfully')
          setGameData(data.game)
          setGameDataError(null)
        } else {
          console.log('❌ Invalid game data received')
          setGameDataError('Invalid game data received')
        }
      } else {
        console.log('❌ Failed to load game data - response not ok')
        setGameDataError('Failed to load game data')
      }
    } catch (error) {
      console.error('❌ Failed to load game data:', error)
      setGameDataError(error.message)
    } finally {
      setGameDataLoading(false)
    }
  }, [gameId, gameData])
  
  // Load game data on mount
  useEffect(() => {
    console.log('🔄 BattleRoyaleTabbedInterface: Loading game data for gameId:', gameId)
    loadGameData()
  }, [loadGameData])

  // ===== SOCKET CONNECTION =====
  useEffect(() => {
    if (!gameId || !address) return

    console.log('🔌 Connecting to Battle Royale game server...')

    const connectToGame = async () => {
      try {
        // Connect to socket using the same format as FlipSuiteFinal
        const roomId = gameId.startsWith('br_') ? `game_${gameId.replace('br_', '')}` : `game_${gameId}`
        await socketService.connect(roomId, address)
        
        console.log('✅ Connected to Battle Royale game server')
        setConnected(true)
        
        // Join room for chat functionality
        socketService.emit('join_room', { 
          roomId: roomId, 
          address 
        })
        
      } catch (error) {
        console.error('❌ Failed to connect to Battle Royale game server:', error)
        setConnected(false)
        showToast('Failed to connect to game server', 'error')
      }
    }

    connectToGame()

    // Add connection status event handlers
    const handleConnect = () => {
      console.log('🔌 Socket connected')
      setConnected(true)
    }
    
    const handleDisconnect = () => {
      console.log('🔌 Socket disconnected')
      setConnected(false)
    }
    
    socketService.on('connect', handleConnect)
    socketService.on('disconnect', handleDisconnect)

    return () => {
      // Cleanup - disconnect when component unmounts
      socketService.off('connect', handleConnect)
      socketService.off('disconnect', handleDisconnect)
      if (socketService.socket) {
        socketService.socket.disconnect()
      }
    }
  }, [gameId, address, showToast])
  
  // ===== TAB SWITCHING LOGIC =====
  const handleTabChange = useCallback(async (tabId) => {
    console.log(`📑 Switching to tab: ${tabId} (current tab: ${activeTab})`)
    
    // Handle room switching based on tab
    if (socketService.isConnected()) {
      try {
        if (tabId === 'details') {
          // Switch to regular game room for chat
          await socketService.switchRoom(`game_${gameId}`)
        } else if (tabId === 'game') {
          // Switch to Battle Royale room for game
          await socketService.switchRoom(`br_${gameId}`)
        }
      } catch (error) {
        console.error('❌ Error switching rooms:', error)
      }
    }
    
    setActiveTab(tabId)
    // Save tab state to localStorage to preserve during reloads
    if (gameId) {
      localStorage.setItem(`battleRoyaleTab_${gameId}`, tabId)
    }
  }, [activeTab, gameId])
  
  // Debug: Track activeTab changes
  useEffect(() => {
    console.log(`📑 Active tab changed to: ${activeTab}`)
  }, [activeTab])
  
  // ===== TAB RENDERING =====
  const renderTabContent = () => {
    const commonProps = {
      gameData,
      gameId,
      address,
      isCreator: gameData?.creator?.toLowerCase() === address?.toLowerCase(),
      socket: socketService,
      connected
    }

    switch (activeTab) {
      case 'details':
        return <BattleRoyaleNFTDetailsTab {...commonProps} />
      case 'game':
        return <BattleRoyaleGamePageTab {...commonProps} />
      default:
        return <BattleRoyaleNFTDetailsTab {...commonProps} />
    }
  }

  // ===== RENDER =====
  // Show loading state for game data
  if (gameDataLoading) {
    return (
      <>
        <BackgroundVideo autoPlay loop muted playsInline>
          <source src={hazeVideo} type="video/webm" />
        </BackgroundVideo>
        <TabbedContainer>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
            <LoadingSpinner />
            <div style={{ marginLeft: '1rem' }}>Loading Battle Royale...</div>
          </div>
        </TabbedContainer>
      </>
    )
  }

  // Show error state for game data
  if (gameDataError) {
    return (
      <>
        <BackgroundVideo autoPlay loop muted playsInline>
          <source src={hazeVideo} type="video/webm" />
        </BackgroundVideo>
        <TabbedContainer>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'red' }}>
            Error loading game: {gameDataError}
          </div>
        </TabbedContainer>
      </>
    )
  }

  if (!gameData) {
    return (
      <>
        <BackgroundVideo autoPlay loop muted playsInline>
          <source src={hazeVideo} type="video/webm" />
        </BackgroundVideo>
        <TabbedContainer>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'red' }}>
            Game not found
          </div>
        </TabbedContainer>
      </>
    )
  }

  return (
    <>
      <BackgroundVideo autoPlay loop muted playsInline>
        <source src={hazeVideo} type="video/webm" />
      </BackgroundVideo>
      <TabbedContainer>
        {/* Tab Header */}
        <TabsHeader>
        <Tab 
          active={activeTab === 'details'} 
          onClick={() => handleTabChange('details')}
        >
          🎨 NFT Details
        </Tab>
        <Tab 
          active={activeTab === 'game'} 
          onClick={() => handleTabChange('game')}
        >
          🎮 Join Game
        </Tab>
      </TabsHeader>

        {/* Tab Content */}
        <TabContent>
          {renderTabContent()}
        </TabContent>
      </TabbedContainer>
    </>
  )
}

export default BattleRoyaleTabbedInterface
