import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { useParams } from 'react-router-dom'
import { useWallet } from '../../contexts/WalletContext'

// Tab Components
import { NFTDetailsTab, ChatOffersTab, GameRoomTab } from './tabs'

const TabbedContainer = styled.div`
  background: rgba(0, 0, 40, 0.95);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(0, 191, 255, 0.3);
  height: 900px;
  display: flex;
  flex-direction: row;
  
  @media (max-width: 768px) {
    height: 100vh;
    border-radius: 0;
    flex-direction: column;
  }
`

const TabsHeader = styled.div`
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.8);
  border-right: 2px solid rgba(0, 191, 255, 0.3);
  min-width: 200px;
  
  @media (max-width: 768px) {
    flex-direction: row;
    border-right: none;
    border-bottom: 2px solid rgba(0, 191, 255, 0.3);
    min-width: auto;
  }
`

const Tab = styled.button`
  padding: 1.5rem 1rem;
  background: ${props => props.active ? 
    'linear-gradient(135deg, rgba(0, 191, 255, 0.3), rgba(0, 255, 65, 0.2))' : 
    'transparent'
  };
  color: ${props => props.active ? '#00BFFF' : 'rgba(255, 255, 255, 0.7)'};
  border: none;
  border-right: 4px solid ${props => props.active ? '#00BFFF' : 'transparent'};
  cursor: pointer;
  font-size: 1.6rem;
  font-weight: bold;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  /* Neon glow effect for active tab */
  ${props => props.active && `
    text-shadow: 0 0 10px #00BFFF, 0 0 20px #00BFFF, 0 0 30px #00BFFF;
    box-shadow: 
      inset 0 0 20px rgba(0, 191, 255, 0.2),
      0 0 15px rgba(0, 191, 255, 0.3);
  `}
  
  /* Hover effects */
  &:hover {
    background: ${props => props.active ? 
      'linear-gradient(135deg, rgba(0, 191, 255, 0.4), rgba(0, 255, 65, 0.3))' : 
      'linear-gradient(135deg, rgba(255, 20, 147, 0.1), rgba(0, 191, 255, 0.1))'
    };
    color: ${props => props.active ? '#00BFFF' : '#FF1493'};
    transform: translateX(5px);
    
    ${props => !props.active && `
      text-shadow: 0 0 10px #FF1493, 0 0 20px #FF1493;
    `}
  }
  
  /* Animated border for active tab */
  ${props => props.active && `
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, 
        transparent 0%, 
        rgba(0, 191, 255, 0.3) 50%, 
        transparent 100%
      );
      animation: borderFlow 2s linear infinite;
    }
  `}
  
  /* Tab-specific colors */
  &:nth-child(1) {
    ${props => props.active && `
      background: linear-gradient(135deg, rgba(255, 20, 147, 0.3), rgba(255, 105, 180, 0.2));
      color: #FF1493;
      text-shadow: 0 0 10px #FF1493, 0 0 20px #FF1493, 0 0 30px #FF1493;
      border-right-color: #FF1493;
    `}
    
    &:hover {
      background: ${props => props.active ? 
        'linear-gradient(135deg, rgba(255, 20, 147, 0.4), rgba(255, 105, 180, 0.3))' : 
        'linear-gradient(135deg, rgba(255, 20, 147, 0.1), rgba(255, 105, 180, 0.1))'
      };
      color: ${props => props.active ? '#FF1493' : '#FF1493'};
    }
  }
  
  &:nth-child(2) {
    ${props => props.active && `
      background: linear-gradient(135deg, rgba(0, 255, 65, 0.3), rgba(57, 255, 20, 0.2));
      color: #00FF41;
      text-shadow: 0 0 10px #00FF41, 0 0 20px #00FF41, 0 0 30px #00FF41;
      border-right-color: #00FF41;
    `}
    
    &:hover {
      background: ${props => props.active ? 
        'linear-gradient(135deg, rgba(0, 255, 65, 0.4), rgba(57, 255, 20, 0.3))' : 
        'linear-gradient(135deg, rgba(0, 255, 65, 0.1), rgba(57, 255, 20, 0.1))'
      };
      color: ${props => props.active ? '#00FF41' : '#00FF41'};
    }
  }
  
  &:nth-child(3) {
    ${props => props.active && `
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 193, 7, 0.2));
      color: #FFD700;
      text-shadow: 0 0 10px #FFD700, 0 0 20px #FFD700, 0 0 30px #FFD700;
      border-right-color: #FFD700;
    `}
    
    &:hover {
      background: ${props => props.active ? 
        'linear-gradient(135deg, rgba(255, 215, 0, 0.4), rgba(255, 193, 7, 0.3))' : 
        'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 193, 7, 0.1))'
      };
      color: ${props => props.active ? '#FFD700' : '#FFD700'};
    }
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  @media (max-width: 768px) {
    flex: 1;
    padding: 1rem 0.5rem;
    font-size: 1.4rem;
    text-align: center;
    border-right: none;
    border-bottom: 4px solid ${props => props.active ? 
      (props.tabIndex === 0 ? '#FF1493' : props.tabIndex === 1 ? '#00FF41' : '#FFD700') : 
      'transparent'
    };
    transform: none;
    
    &:hover {
      transform: translateY(-2px);
    }
    
    &:not(:last-child) {
      border-bottom: none;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
    }
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
  
  // Listen for navigation events
  useEffect(() => {
    const handleSwitchToFlipSuite = (event) => {
      console.log('🎯 Received switchToFlipSuite event:', event.detail)
      setActiveTab('game')
    }
    
    const handleSwitchToLounge = (event) => {
      console.log('🎯 Received switchToLoungeTab event')
      setActiveTab('chat')
    }
    
    window.addEventListener('switchToFlipSuite', handleSwitchToFlipSuite)
    window.addEventListener('switchToLoungeTab', handleSwitchToLounge)
    
    return () => {
      window.removeEventListener('switchToFlipSuite', handleSwitchToFlipSuite)
      window.removeEventListener('switchToLoungeTab', handleSwitchToLounge)
    }
  }, [])
  
  // Auto-switch to game room when game starts (but only if not just joining)
  useEffect(() => {
    // Only auto-switch to game room if the game is already in progress
    // and we're not just joining the game
    if ((gameData?.status === 'active' || gameData?.status === 'in_progress') && 
        gameData?.status !== 'waiting_challenger' && 
        gameData?.status !== 'waiting_challenger_deposit') {
      setActiveTab('game')
    }
  }, [gameData?.status])

  // Check for game status changes and auto-switch tabs when needed
  useEffect(() => {
    console.log('🔍 TabbedGameInterface: Checking game status for tab switch:', {
      status: gameData?.status,
      activeTab: activeTab,
      address: address
    })
    
    // If game status indicates waiting for deposit, switch to Lounge tab
    if (gameData?.status === 'waiting_challenger_deposit' && activeTab !== 'chat') {
      console.log('🎯 Auto-switching to Lounge tab for deposit')
      setActiveTab('chat')
    }
  }, [gameData?.status, activeTab]) // Only depend on status and activeTab, not entire gameData object

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
            {renderTabContent(tab)}
          </TabPane>
        ))}
      </TabContent>
    </TabbedContainer>
  )
}

export default TabbedGameInterface
