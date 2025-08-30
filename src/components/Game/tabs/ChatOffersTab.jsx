import React from 'react'
import styled from '@emotion/styled'
import GameChat from '../GameChat'
import OffersContainer from '../../Lobby/OffersContainer'

const TabContainer = styled.div`
  height: 100%;
  display: flex;
  gap: 2rem;
  
  @media (max-width: 1200px) {
    flex-direction: column;
    gap: 1.5rem;
  }
`

const LeftSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`

const RightSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`

const SectionWrapper = styled.div`
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid ${props => props.$borderColor || 'rgba(0, 255, 65, 0.3)'};
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 0 20px ${props => props.$glowColor || 'rgba(0, 255, 65, 0.2)'};
  position: relative;
  overflow: hidden;
  height: 100%;
  min-height: 600px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, ${props => props.$shimmerColor || 'rgba(0, 255, 65, 0.05)'} 50%, transparent 70%);
    animation: shimmer 3s ease-in-out infinite;
    pointer-events: none;
  }
  
  @keyframes shimmer {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }
`

const SectionTitle = styled.h2`
  color: ${props => props.$titleColor || '#00FF41'};
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-align: center;
  text-shadow: 0 0 10px ${props => props.$titleColor || 'rgba(0, 255, 65, 0.5)'};
  position: relative;
  z-index: 2;
`

const SectionContent = styled.div`
  position: relative;
  z-index: 2;
  height: calc(100% - 3rem);
  display: flex;
  flex-direction: column;
`

const ChatWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  
  /* Override any existing chat styling to fit our container */
  .chat-container {
    height: 100%;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }
`

const OffersWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  
  /* Override any existing offers styling to fit our container */
  .offers-container {
    height: 100%;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }
`

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  position: relative;
  z-index: 2;
  justify-content: center;
`

const StatusDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => props.$connected ? '#00FF41' : '#FF6B6B'};
  animation: ${props => props.$connected ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
`

const StatusText = styled.span`
  color: ${props => props.$connected ? '#00FF41' : '#FF6B6B'};
  font-size: 0.9rem;
  font-weight: bold;
`

const ChatOffersTab = ({ 
  gameData, 
  gameId, 
  messages, 
  sendMessage, 
  isConnected, 
  isCreator, 
  isJoiner, 
  address 
}) => {
  return (
    <TabContainer>
      {/* Left Section - Chat */}
      <LeftSection>
        <SectionWrapper 
          $borderColor="rgba(0, 255, 65, 0.3)"
          $glowColor="rgba(0, 255, 65, 0.2)"
          $shimmerColor="rgba(0, 255, 65, 0.05)"
        >
          <SectionTitle $titleColor="#00FF41">💬 Game Chat</SectionTitle>
          
          <ConnectionStatus>
            <StatusDot $connected={isConnected} />
            <StatusText $connected={isConnected}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </StatusText>
          </ConnectionStatus>
          
          <SectionContent>
            <ChatWrapper>
              <GameChat
                messages={messages}
                onSendMessage={sendMessage}
                isCompact={false}
                className="chat-container"
              />
            </ChatWrapper>
          </SectionContent>
        </SectionWrapper>
      </LeftSection>

      {/* Right Section - Offers */}
      <RightSection>
        <SectionWrapper 
          $borderColor="rgba(255, 20, 147, 0.3)"
          $glowColor="rgba(255, 20, 147, 0.2)"
          $shimmerColor="rgba(255, 20, 147, 0.05)"
        >
          <SectionTitle $titleColor="#FF1493">💰 Offers & Negotiations</SectionTitle>
          
          <SectionContent>
            <OffersWrapper>
              <OffersContainer
                gameId={gameId}
                gameData={gameData}
                socket={null} // Will be handled by the parent WebSocket
                connected={isConnected}
                isCreator={isCreator}
                isJoiner={isJoiner}
                address={address}
                className="offers-container"
              />
            </OffersWrapper>
          </SectionContent>
        </SectionWrapper>
      </RightSection>
    </TabContainer>
  )
}

export default ChatOffersTab
