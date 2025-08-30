import React, { useState } from 'react'
import styled from '@emotion/styled'
import ChatContainer from '../../Lobby/ChatContainer'
import OffersContainer from '../../Lobby/OffersContainer'

const TabContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const SectionToggle = styled.div`
  display: flex;
  background: rgba(0, 0, 0, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const ToggleButton = styled.button`
  flex: 1;
  padding: 0.75rem 1rem;
  background: ${props => props.active ? 'rgba(0, 191, 255, 0.2)' : 'transparent'};
  color: ${props => props.active ? '#00BFFF' : 'rgba(255, 255, 255, 0.7)'};
  border: none;
  border-bottom: 2px solid ${props => props.active ? '#00BFFF' : 'transparent'};
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 191, 255, 0.1);
    color: #00BFFF;
  }
  
  &:not(:last-child) {
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }
`

const ContentContainer = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
`

const SectionPane = styled.div`
  height: 100%;
  opacity: ${props => props.active ? 1 : 0};
  visibility: ${props => props.active ? 'visible' : 'hidden'};
  position: ${props => props.active ? 'relative' : 'absolute'};
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  transition: opacity 0.3s ease;
`

const UnifiedContainer = styled.div`
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
`

const ChatSection = styled.div`
  height: 100%;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 1024px) {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
`

const OffersSection = styled.div`
  height: 100%;
`

const MobileToggleIcon = styled.span`
  margin-right: 0.5rem;
  font-size: 1rem;
`

const ChatOffersTab = ({ 
  gameData, 
  gameId, 
  socket, 
  connected, 
  offers, 
  isCreator, 
  address,
  onOfferAccepted 
}) => {
  const [activeSection, setActiveSection] = useState('unified')
  const [isMobile] = useState(window.innerWidth <= 1024)

  const handleSectionChange = (section) => {
    setActiveSection(section)
  }

  const renderUnifiedView = () => (
    <UnifiedContainer>
      <ChatSection>
        <ChatContainer
          gameId={gameId}
          gameData={gameData}
          socket={socket}
          connected={connected}
        />
      </ChatSection>
      <OffersSection>
        <OffersContainer
          gameId={gameId}
          gameData={gameData}
          socket={socket}
          connected={connected}
          offers={offers}
          isCreator={isCreator}
          onOfferSubmitted={(offerData) => {
            console.log('Offer submitted via tabbed interface:', offerData)
          }}
          onOfferAccepted={onOfferAccepted}
        />
      </OffersSection>
    </UnifiedContainer>
  )

  const renderChatOnly = () => (
    <ChatContainer
      gameId={gameId}
      gameData={gameData}
      socket={socket}
      connected={connected}
    />
  )

  const renderOffersOnly = () => (
    <OffersContainer
      gameId={gameId}
      gameData={gameData}
      socket={socket}
      connected={connected}
      offers={offers}
      isCreator={isCreator}
      onOfferSubmitted={(offerData) => {
        console.log('Offer submitted via tabbed interface:', offerData)
      }}
      onOfferAccepted={onOfferAccepted}
    />
  )

  const sections = [
    {
      id: 'unified',
      label: isMobile ? 'Both' : 'Chat & Offers',
      icon: '💬💰',
      component: renderUnifiedView
    },
    {
      id: 'chat',
      label: 'Chat Only',
      icon: '💬',
      component: renderChatOnly
    },
    {
      id: 'offers',
      label: 'Offers Only', 
      icon: '💰',
      component: renderOffersOnly
    }
  ]

  return (
    <TabContainer>
      {/* Section Toggle */}
      <SectionToggle>
        {sections.map(section => (
          <ToggleButton
            key={section.id}
            active={activeSection === section.id}
            onClick={() => handleSectionChange(section.id)}
          >
            <MobileToggleIcon>{section.icon}</MobileToggleIcon>
            {section.label}
          </ToggleButton>
        ))}
      </SectionToggle>
      
      {/* Content */}
      <ContentContainer>
        {sections.map(section => (
          <SectionPane
            key={section.id}
            active={activeSection === section.id}
          >
            {section.component()}
          </SectionPane>
        ))}
      </ContentContainer>
    </TabContainer>
  )
}

export default ChatOffersTab
