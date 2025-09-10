import React, { useState } from 'react'
import styled from '@emotion/styled'
import ChatContainer from '../../../legacy/components/Lobby/ChatContainer'
import OffersContainer from '../../../legacy/components/Lobby/OffersContainer'

const TabContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const ContentContainer = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
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
  return (
    <TabContainer>
      <ContentContainer>
        <UnifiedContainer>
          <ChatSection>
            <ChatContainer
              gameId={gameId}
              gameData={gameData}
              socket={socket}
              connected={connected}
              address={address} // Pass address prop
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
              address={address} // Make sure address is passed
              onOfferSubmitted={(offerData) => {
                console.log('Offer submitted via tabbed interface:', offerData)
              }}
              onOfferAccepted={onOfferAccepted}
            />
          </OffersSection>
        </UnifiedContainer>
      </ContentContainer>
    </TabContainer>
  )
}

export default ChatOffersTab
