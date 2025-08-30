import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from '@emotion/styled'
import { useAccount } from 'wagmi'

// Import existing components
import useGameData from './hooks/useGameData'
import useWebSocket from '../../utils/useWebSocket'
import { useNotification } from '../../contexts/NotificationContext'

// Import tab content components - use the real ones
import NFTDetailsTab from './tabs/NFTDetailsTab'
import ChatOffersTab from './tabs/ChatOffersTab'
import GameRoomTab from './tabs/GameRoomTab'
import GameBackground from '../GameOrchestrator/GameBackground'

// Main container with flashing lights design inspired by homepage
const GamePageContainer = styled.div`
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
  }
`

// Left sidebar for tab navigation
const TabSidebar = styled.div`
  width: 250px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  @media (max-width: 768px) {
    width: 100%;
    flex-direction: row;
    justify-content: space-around;
  }
`

const TabButton = styled.button`
  background: ${props => props.$active ? 
    'linear-gradient(135deg, rgba(0, 255, 65, 0.3), rgba(0, 255, 65, 0.1))' : 
    'rgba(0, 0, 0, 0.7)'
  };
  border: 2px solid ${props => props.$active ? '#00FF41' : 'rgba(0, 255, 65, 0.3)'};
  border-radius: 1rem;
  padding: 1.5rem 1rem;
  color: ${props => props.$active ? '#00FF41' : 'rgba(255, 255, 255, 0.7)'};
  font-size: 1rem;
  font-weight: bold;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  opacity: ${props => props.$disabled ? 0.5 : 1};
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(0, 255, 65, 0.1) 50%, transparent 70%);
    animation: ${props => props.$active ? 'shimmer 3s ease-in-out infinite' : 'none'};
    pointer-events: none;
  }
  
  @keyframes shimmer {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }
  
  &:hover:not(:disabled) {
    border-color: #00FF41;
    color: #00FF41;
    box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
    transform: scale(1.02);
  }
  
  @media (max-width: 768px) {
    padding: 1rem 0.5rem;
    font-size: 0.9rem;
    flex: 1;
  }
`

const TabIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
    margin-bottom: 0.25rem;
  }
`

const TabLabel = styled.div`
  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`

const TabLockIcon = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 1.2rem;
  color: #FF6B6B;
`

// Main content area with flashing lights design
const TabContentContainer = styled.div`
  flex: 1;
  background: rgba(0, 0, 20, 0.95);
  border: 2px solid #FFD700;
  border-radius: 1rem;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 215, 0, 0.05) 50%, transparent 70%);
    animation: shimmer 3s ease-in-out infinite;
    pointer-events: none;
  }
  
  @keyframes shimmer {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const TabContent = styled.div`
  position: relative;
  z-index: 2;
  height: 100%;
  min-height: 500px;
`

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  color: #00FF41;
  font-size: 1.2rem;
`

const TabbedGamePage = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { address } = useAccount()
  const { showSuccess, showError, showInfo } = useNotification()
  
  // Game data and WebSocket - use your existing architecture
  const gameData = useGameData(gameId)
  const { isConnected, lastMessage, sendMessage, connect } = useWebSocket()
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (gameId && address) {
      console.log('🔌 Connecting to WebSocket for game:', gameId)
      connect(`game_${gameId}`, address)
    }
  }, [gameId, address, connect])
  
  // Extract messages from game data (your existing pattern)
  const messages = gameData?.messages || []
  
  // Tab state
  const [activeTab, setActiveTab] = useState('nft-details')
  
  // Game state
  const [isGameActive, setIsGameActive] = useState(false)
  const [gamePhase, setGamePhase] = useState('waiting') // waiting, payment, active, completed
  
  useEffect(() => {
    if (gameData) {
      // Update game phase based on game data
      if (gameData.status === 'completed') {
        setGamePhase('completed')
      } else if (gameData.status === 'active' || gameData.status === 'in_progress') {
        setGamePhase('active')
        setIsGameActive(true)
        // Auto-switch to game room when game becomes active
        setActiveTab('game-room')
      } else if (gameData.status === 'waiting_challenger_deposit') {
        setGamePhase('payment')
      } else {
        setGamePhase('waiting')
      }
    }
  }, [gameData])
  
  // Helper functions
  const isCreator = () => gameData?.creator?.toLowerCase() === address?.toLowerCase()
  const isJoiner = () => gameData?.joiner?.toLowerCase() === address?.toLowerCase() || 
                          gameData?.challenger?.toLowerCase() === address?.toLowerCase()
  
  const tabs = [
    {
      id: 'nft-details',
      icon: '💎',
      label: 'NFT Details',
      disabled: false,
      description: 'Verify coin authenticity'
    },
    {
      id: 'chat-offers',
      icon: '💬',
      label: 'Chat & Offers',
      disabled: false,
      description: 'Communicate and make offers'
    },
    {
      id: 'game-room',
      icon: '🎮',
      label: 'Game Room',
      disabled: !isGameActive,
      description: isGameActive ? 'Game in progress' : 'Locked until game starts'
    }
  ]
  
  const handleTabChange = (tabId) => {
    const tab = tabs.find(t => t.id === tabId)
    if (tab && !tab.disabled) {
      setActiveTab(tabId)
    }
  }
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'nft-details':
        return (
          <NFTDetailsTab
            gameData={gameData}
            gameId={gameId}
            isCreator={isCreator()}
            isJoiner={isJoiner()}
          />
        )
      case 'chat-offers':
        return (
          <ChatOffersTab
            gameData={gameData}
            gameId={gameId}
            messages={messages}
            sendMessage={sendMessage}
            isConnected={isConnected}
            isCreator={isCreator()}
            isJoiner={isJoiner()}
            address={address}
          />
        )
      case 'game-room':
        return (
          <GameRoomTab
            gameData={gameData}
            gameId={gameId}
            isCreator={isCreator()}
            isJoiner={isJoiner()}
            address={address}
            isGameActive={isGameActive}
            gamePhase={gamePhase}
          />
        )
      default:
        return <div>Select a tab</div>
    }
  }
  
  if (!gameData) {
    return (
      <GamePageContainer>
        <LoadingContainer>
          Loading game data...
        </LoadingContainer>
      </GamePageContainer>
    )
  }
  
  return (
    <>
      <GameBackground />
      <GamePageContainer>
        {/* Left Sidebar - Tab Navigation */}
        <TabSidebar>
        {tabs.map(tab => (
          <TabButton
            key={tab.id}
            $active={activeTab === tab.id}
            $disabled={tab.disabled}
            onClick={() => handleTabChange(tab.id)}
            title={tab.description}
          >
            {tab.disabled && <TabLockIcon>🔒</TabLockIcon>}
            <TabIcon>{tab.icon}</TabIcon>
            <TabLabel>{tab.label}</TabLabel>
          </TabButton>
        ))}
      </TabSidebar>
      
      {/* Main Content Area */}
      <TabContentContainer>
        <TabContent>
          {renderTabContent()}
        </TabContent>
      </TabContentContainer>
    </GamePageContainer>
    </>
  )
}

export default TabbedGamePage
