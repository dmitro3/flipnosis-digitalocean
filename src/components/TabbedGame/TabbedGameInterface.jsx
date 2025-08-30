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
  flex-direction: column;
  
  @media (max-width: 768px) {
    height: 100vh;
    border-radius: 0;
  }
`

const TabsHeader = styled.div`
  display: flex;
  background: rgba(0, 0, 0, 0.8);
  border-bottom: 2px solid rgba(0, 191, 255, 0.3);
`

const Tab = styled.button`
  flex: 1;
  padding: 1rem 1.5rem;
  background: ${props => props.active ? 'rgba(0, 191, 255, 0.2)' : 'transparent'};
  color: ${props => props.active ? '#00BFFF' : 'rgba(255, 255, 255, 0.7)'};
  border: none;
  border-bottom: 3px solid ${props => props.active ? '#00BFFF' : 'transparent'};
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    background: rgba(0, 191, 255, 0.1);
    color: #00BFFF;
  }
  
  &:not(:last-child) {
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
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

const TabIcon = styled.span`
  margin-right: 0.5rem;
  font-size: 1.2rem;
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
  
  // Auto-switch to game room when game starts
  useEffect(() => {
    if (gameData?.status === 'active' || gameData?.status === 'in_progress') {
      setActiveTab('game')
    }
  }, [gameData?.status])

  const tabs = [
    {
      id: 'nft',
      label: 'NFT & Coin',
      icon: '💎',
      component: NFTDetailsTab
    },
    {
      id: 'chat',
      label: 'Chat & Offers',
      icon: '💬',
      component: ChatOffersTab
    },
    {
      id: 'game',
      label: 'Game Room',
      icon: '🎮',
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
        {tabs.map(tab => (
          <Tab
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => handleTabChange(tab.id)}
          >
            <TabIcon>{tab.icon}</TabIcon>
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
