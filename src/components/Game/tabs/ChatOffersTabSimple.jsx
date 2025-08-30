import React, { useState } from 'react'
import styled from '@emotion/styled'

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

const ChatArea = styled.div`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 65, 0.3);
    border-radius: 3px;
  }
`

const ChatInput = styled.div`
  display: flex;
  gap: 0.5rem;
`

const Input = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 0.75rem;
  color: white;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #00FF41;
    box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
  }
`

const Button = styled.button`
  background: linear-gradient(135deg, #00FF41, #39FF14);
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  color: #000;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
  }
`

const OffersArea = styled.div`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 20, 147, 0.3);
    border-radius: 3px;
  }
`

const MessageItem = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  
  .sender {
    color: #00FF41;
    font-weight: bold;
    font-size: 0.8rem;
    margin-bottom: 0.25rem;
  }
  
  .message {
    color: white;
  }
  
  .time {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.7rem;
    margin-top: 0.25rem;
  }
`

const OfferItem = styled.div`
  background: rgba(255, 20, 147, 0.1);
  border: 1px solid rgba(255, 20, 147, 0.3);
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  
  .offer-type {
    color: #FF1493;
    font-weight: bold;
    font-size: 0.8rem;
    margin-bottom: 0.25rem;
  }
  
  .offer-details {
    color: white;
  }
  
  .offer-time {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.7rem;
    margin-top: 0.25rem;
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

const ChatOffersTabSimple = ({ gameData, gameId, isCreator, isJoiner, address }) => {
  const [chatMessage, setChatMessage] = useState('')
  const [offerAmount, setOfferAmount] = useState('')
  
  // Mock data for demonstration
  const messages = [
    {
      id: 1,
      sender: 'Player 1',
      message: 'Hey! Ready for this coin flip battle?',
      time: '2 minutes ago'
    },
    {
      id: 2,
      sender: 'You',
      message: 'Absolutely! Let\'s do this!',
      time: '1 minute ago'
    }
  ]
  
  const offers = [
    {
      id: 1,
      type: 'Crypto Offer',
      details: '$100 USDC - Standard offer',
      time: '5 minutes ago'
    }
  ]
  
  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      console.log('Sending message:', chatMessage)
      setChatMessage('')
    }
  }
  
  const handleMakeOffer = () => {
    if (offerAmount.trim()) {
      console.log('Making offer:', offerAmount)
      setOfferAmount('')
    }
  }
  
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
            <StatusDot $connected={true} />
            <StatusText $connected={true}>Connected</StatusText>
          </ConnectionStatus>
          
          <SectionContent>
            <ChatArea>
              {messages.map(msg => (
                <MessageItem key={msg.id}>
                  <div className="sender">{msg.sender}</div>
                  <div className="message">{msg.message}</div>
                  <div className="time">{msg.time}</div>
                </MessageItem>
              ))}
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', padding: '1rem' }}>
                Chat functionality will be connected to real-time messaging
              </div>
            </ChatArea>
            
            <ChatInput>
              <Input
                type="text"
                placeholder="Type your message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={handleSendMessage}>Send</Button>
            </ChatInput>
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
            <OffersArea>
              {offers.map(offer => (
                <OfferItem key={offer.id}>
                  <div className="offer-type">{offer.type}</div>
                  <div className="offer-details">{offer.details}</div>
                  <div className="offer-time">{offer.time}</div>
                </OfferItem>
              ))}
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', padding: '1rem' }}>
                Offers system will connect to real game offers
              </div>
            </OffersArea>
            
            <ChatInput>
              <Input
                type="text"
                placeholder="Enter offer amount (USD)..."
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleMakeOffer()}
              />
              <Button 
                onClick={handleMakeOffer}
                style={{ background: 'linear-gradient(135deg, #FF1493, #FF69B4)' }}
              >
                Make Offer
              </Button>
            </ChatInput>
          </SectionContent>
        </SectionWrapper>
      </RightSection>
    </TabContainer>
  )
}

export default ChatOffersTabSimple
