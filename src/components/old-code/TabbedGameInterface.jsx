import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { useWallet } from '../../contexts/WalletContext'
import { NFTDetailsTab, ChatOffersTab, GameRoomTab } from './tabs'

// Styled Components
const TabbedContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 600px;
  background: rgba(0, 0, 20, 0.95);
  border: 2px solid rgba(0, 191, 255, 0.3);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(0, 191, 255, 0.2);
  
  @media (max-width: 768px) {
    min-height: 500px;
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
  
  &:nth-child(3) {
    ${props => props.active && `
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 193, 7, 0.2));
      color: #FFD700;
      text-shadow: 0 0 10px #FFD700;
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

const TabPane = styled.div`
  height: 100%;
  opacity: ${props => props.active ? 1 : 0};
  visibility: ${props => props.active ? 'visible' : 'hidden'};
  position: ${props => props.active ? 'relative' : 'absolute'};
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  transition: opacity 0.3s ease;
  overflow: auto;
`

const TabbedGameInterface = ({ 
  gameData, 
  gameId, 
  socket, 
  connected, 
  offers, 
  isCreator,
  coinConfig,
  onOfferAccepted 
}) => {
  const [activeTab, setActiveTab] = useState('nft')
  const { address } = useWallet()
  
  // Listen for navigation events from other components
  useEffect(() => {
    const handleSwitchToFlipSuite = (event) => {
      console.log('🎯 TabbedGameInterface: Switching to Flip Suite tab', event.detail)
      setActiveTab('game')
      
      // Force focus to ensure the tab switch is visible
      setTimeout(() => {
        console.log('🎯 TabbedGameInterface: Confirming tab switch to game')
        setActiveTab('game')
      }, 100)
    }
    
    const handleSwitchToLounge = (event) => {
      console.log('🎯 TabbedGameInterface: Switching to Lounge tab')
      setActiveTab('chat')
    }
    
    const handleSwitchToDetails = (event) => {
      console.log('🎯 TabbedGameInterface: Switching to Details tab')
      setActiveTab('nft')
    }
    
    window.addEventListener('switchToFlipSuite', handleSwitchToFlipSuite)
    window.addEventListener('switchToLoungeTab', handleSwitchToLounge)
    window.addEventListener('switchToDetailsTab', handleSwitchToDetails)
    
    return () => {
      window.removeEventListener('switchToFlipSuite', handleSwitchToFlipSuite)
      window.removeEventListener('switchToLoungeTab', handleSwitchToLounge)
      window.removeEventListener('switchToDetailsTab', handleSwitchToDetails)
    }
  }, [])
  
  // Auto-switch to game room when game becomes active
  useEffect(() => {
    if (!gameData) return
    
    const isGameActive = 
      gameData.status === 'active' || 
      gameData.status === 'in_progress' ||
      gameData.status === 'playing' ||
      gameData.phase === 'active'
    
    const isWaitingForPlayers = 
      gameData.status === 'waiting_challenger' || 
      gameData.status === 'waiting_for_challenger' ||
      gameData.status === 'waiting_challenger_deposit'
    
    if (isGameActive && activeTab !== 'game') {
      console.log('🎮 Auto-switching to game room - game is active!')
      setActiveTab('game')
    } else if (isWaitingForPlayers && activeTab === 'game') {
      // If we're in game tab but game isn't ready, go back to lounge
      console.log('🏠 Game not ready, switching to lounge')
      setActiveTab('chat')
    }
  }, [gameData?.status, gameData?.phase, activeTab])
  
  // Listen for switchToFlipSuite events from LobbyFinal
  useEffect(() => {
    const handleSwitchToFlipSuite = (event) => {
      console.log('🎯 TabbedGameInterface: Switching to Flip Suite from LobbyFinal', event.detail)
      setActiveTab('game')
      
      // Force focus to ensure the tab switch is visible
      setTimeout(() => {
        console.log('🎯 TabbedGameInterface: Confirming tab switch to game')
        setActiveTab('game')
      }, 100)
    }
    
    window.addEventListener('switchToFlipSuite', handleSwitchToFlipSuite)
    
    return () => {
      window.removeEventListener('switchToFlipSuite', handleSwitchToFlipSuite)
    }
  }, [])
  
  // Listen for socket events that might trigger tab changes
  useEffect(() => {
    if (!socket) return
    
    const handleGameReady = (data) => {
      console.log('🎮 Game ready event received, switching to game tab')
      setActiveTab('game')
    }
    
    const handleDepositReceived = (data) => {
      console.log('💰 Deposit received, preparing for game')
      // Stay in lounge until both deposits are confirmed
      if (data.bothDeposited) {
        setTimeout(() => setActiveTab('game'), 1000)
      }
    }
    
    const handleGameComplete = (data) => {
      console.log('🏁 Game complete, showing results')
      // Stay in game tab to show results
    }
    
    socket.on('game_ready', handleGameReady)
    socket.on('deposit_received', handleDepositReceived)
    socket.on('game_complete', handleGameComplete)
    
    return () => {
      socket.off('game_ready', handleGameReady)
      socket.off('deposit_received', handleDepositReceived)
      socket.off('game_complete', handleGameComplete)
    }
  }, [socket])
  
  const tabs = [
    {
      id: 'nft',
      label: 'Flip Deets',
      component: NFTDetailsTab
    },
    {
      id: 'chat',
      label: 'Flip Lounge',
      component: ChatOffersTab
    },
    {
      id: 'game',
      label: 'Flip Suite',
      component: GameRoomTab
    }
  ]
  
  const handleTabChange = (tabId) => {
    console.log(`📑 Manual tab change to: ${tabId}`)
    setActiveTab(tabId)
  }
  
  const renderTabContent = (tab) => {
    const TabComponent = tab.component
    
    const commonProps = {
      gameData,
      gameId,
      socket,
      connected,
      offers,
      isCreator,
      address,
      coinConfig,
      onOfferAccepted
    }
    
    return <TabComponent {...commonProps} />
  }
  
  return (
    <TabbedContainer>
      <TabsHeader>
        {tabs.map((tab, index) => (
          <Tab
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => handleTabChange(tab.id)}
            tabIndex={index}
          >
            {tab.label}
          </Tab>
        ))}
      </TabsHeader>
      
      <TabContent>
        {tabs.map(tab => (
          <TabPane
            key={tab.id}
            active={activeTab === tab.id}
          >
            {activeTab === tab.id && renderTabContent(tab)}
          </TabPane>
        ))}
      </TabContent>
    </TabbedContainer>
  )
}

export default TabbedGameInterface