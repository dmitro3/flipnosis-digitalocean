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
  padding: 2rem 1.5rem;
  background: ${props => props.active ? 'rgba(0, 191, 255, 0.2)' : 'transparent'};
  color: ${props => props.active ? '#00BFFF' : 'rgba(255, 255, 255, 0.7)'};
  border: none;
  border-right: 3px solid ${props => props.active ? '#00BFFF' : 'transparent'};
  cursor: pointer;
  font-size: 1.3rem;
  font-weight: bold;
  transition: all 0.3s ease;
  position: relative;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(0, 191, 255, 0.1);
    color: #00BFFF;
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  @media (max-width: 768px) {
    flex: 1;
    padding: 1rem 1rem;
    font-size: 1.1rem;
    text-align: center;
    border-right: none;
    border-bottom: 3px solid ${props => props.active ? '#00BFFF' : 'transparent'};
    
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

  const tabs = [
    {
      id: 'nft',
      label: 'Details',
      component: NFTDetailsTab
    },
    {
      id: 'chat',
      label: 'Chat & Offers',
      component: ChatOffersTab
    },
    {
      id: 'game',
      label: 'Game Room',
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
