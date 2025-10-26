import React, { useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const PageContainer = styled.div`
  min-height: 100vh;
  background: url('/Images/Background/game room2.png') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  background-position: center center;
  padding: 2rem;
  font-family: 'Orbitron', sans-serif;
  color: #fff;
  position: relative;
  overflow-x: hidden;

  @media (max-width: 768px) {
    padding: 1rem;
    background-attachment: scroll;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 20px;
  padding: 3rem;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(0, 255, 65, 0.3);
  box-shadow: 0 0 40px rgba(0, 255, 65, 0.1);

  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 15px;
  }
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2rem;
  background: linear-gradient(45deg, #00FF41, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 20px rgba(0, 255, 65, 0.5);

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Section = styled.div`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  color: #00FF41;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid rgba(0, 255, 65, 0.3);
  padding-bottom: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
`;

const RuleList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const RuleItem = styled.li`
  background: rgba(0, 255, 65, 0.1);
  border: 1px solid rgba(0, 255, 65, 0.3);
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 255, 65, 0.15);
    border-color: rgba(0, 255, 65, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 255, 65, 0.2);
  }
`;

const RuleNumber = styled.span`
  display: inline-block;
  background: linear-gradient(45deg, #ff1493, #ff69b4);
  color: #fff;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  text-align: center;
  line-height: 30px;
  font-weight: bold;
  margin-right: 1rem;
  font-size: 0.9rem;
`;

const RuleText = styled.span`
  font-size: 1.1rem;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const Highlight = styled.span`
  color: #00FF41;
  font-weight: bold;
`;

const TokenHighlight = styled.span`
  font-family: 'Orbitron', sans-serif;
  font-weight: 700;
  color: #FFD700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
`;

const GameMechanics = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const MechanicCard = styled.div`
  background: rgba(0, 255, 65, 0.05);
  border: 2px solid rgba(0, 255, 65, 0.2);
  border-radius: 15px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 255, 65, 0.5);
    background: rgba(0, 255, 65, 0.1);
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 255, 65, 0.2);
  }
`;

const MechanicIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const MechanicTitle = styled.h3`
  color: #00FF41;
  font-size: 1.3rem;
  margin-bottom: 1rem;
`;

const MechanicDescription = styled.p`
  color: #ccc;
  line-height: 1.6;
`;

const BackButton = styled.button`
  position: fixed;
  top: 2rem;
  left: 2rem;
  background: linear-gradient(45deg, #ff1493, #ff69b4);
  border: none;
  border-radius: 50px;
  padding: 1rem 2rem;
  color: #fff;
  font-family: 'Orbitron', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1000;
  box-shadow: 0 5px 15px rgba(255, 20, 147, 0.3);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(255, 20, 147, 0.5);
  }

  @media (max-width: 768px) {
    top: 1rem;
    left: 1rem;
    padding: 0.8rem 1.5rem;
    font-size: 0.9rem;
  }
`;

const TabContainer = styled.div`
  margin-top: 2rem;
`;

const TabButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const TabButton = styled.button`
  background: ${props => props.active ? 'linear-gradient(45deg, #00FF41, #00ff88)' : 'rgba(0, 255, 65, 0.1)'};
  border: 2px solid ${props => props.active ? '#00FF41' : 'rgba(0, 255, 65, 0.3)'};
  color: ${props => props.active ? '#000' : '#00FF41'};
  padding: 1rem 2rem;
  border-radius: 10px;
  font-family: 'Orbitron', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.1rem;

  &:hover {
    background: ${props => props.active ? 'linear-gradient(45deg, #00FF41, #00ff88)' : 'rgba(0, 255, 65, 0.2)'};
    border-color: #00FF41;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 255, 65, 0.3);
  }

  @media (max-width: 768px) {
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
  }
`;

const TabContent = styled.div`
  background: rgba(0, 255, 65, 0.05);
  border: 1px solid rgba(0, 255, 65, 0.2);
  border-radius: 15px;
  padding: 2rem;
  min-height: 300px;
`;

const HowToPlay = () => {
  const [activeTab, setActiveTab] = useState('creator');
  
  const handleBack = () => {
    window.history.back();
  };

  return (
    <PageContainer>
      <BackButton onClick={handleBack}>
        ← Back
      </BackButton>
      
      <ContentWrapper>
        <Title>How to Play FLIPNOSIS</Title>
        
        <Section>
          <SectionTitle>Game Overview</SectionTitle>
          <div style={{ 
            textAlign: 'center', 
            fontStyle: 'italic', 
            fontSize: '1.2rem', 
            color: '#00FF41', 
            marginBottom: '2rem',
            fontWeight: 'bold'
          }}>
            Why spend months waiting to sell an NFT when you can flip it!
          </div>
          <div style={{ 
            fontSize: '1.1rem', 
            lineHeight: '1.6', 
            color: '#ccc',
            textAlign: 'center',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <Highlight>FLIPNOSIS</Highlight> is a gamified NFT sale. Creators list NFTs for the price they want. 4 players enter (25% of the price) and flip coins to win it. Players try to choose the correct side (heads or tails), first the player to three wins the NFT.
          </div>
        </Section>

        <Section>
          <SectionTitle>Game Mechanics</SectionTitle>
          <GameMechanics>
            <MechanicCard>
              <MechanicIcon>
                <img src="/coins/calaverah.png" alt="Coin" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
              </MechanicIcon>
              <MechanicTitle>Coin Selection</MechanicTitle>
              <MechanicDescription>
                Choose between <Highlight>Heads</Highlight> or <Highlight>Tails</Highlight> before each round. Your choice determines your fate in the coin flip!
              </MechanicDescription>
            </MechanicCard>

            <MechanicCard>
              <MechanicIcon>⚡</MechanicIcon>
              <MechanicTitle>Power Charging</MechanicTitle>
              <MechanicDescription>
                Hold the <Highlight>POWER</Highlight> button to charge your flip power (0-100%). Chances are 50-50 every flip.
              </MechanicDescription>
            </MechanicCard>

            <MechanicCard>
              <MechanicIcon>🏆</MechanicIcon>
              <MechanicTitle>Winner</MechanicTitle>
              <MechanicDescription>
                The first player to 3 wins is the winner!
              </MechanicDescription>
            </MechanicCard>
          </GameMechanics>
        </Section>

        <TabContainer>
          <TabButtons>
            <TabButton active={activeTab === 'creator'} onClick={() => setActiveTab('creator')}>
              Creator's Guide
            </TabButton>
            <TabButton active={activeTab === 'player'} onClick={() => setActiveTab('player')}>
              Player's Guide
            </TabButton>
          </TabButtons>
          
          <TabContent>
            {activeTab === 'creator' && (
              <div>
                <h3 style={{ color: '#00FF41', fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                  Creator's Guide
                </h3>
                <RuleList>
                  <RuleItem>
                    <RuleNumber>1</RuleNumber>
                    <RuleText>
                      <Highlight>List Your NFT:</Highlight> Connect your wallet and select the NFT you want to sell. Set your desired price.
                    </RuleText>
                  </RuleItem>
                  <RuleItem>
                    <RuleNumber>2</RuleNumber>
                    <RuleText>
                      <Highlight>Get Paid Upfront:</Highlight> Once 4 players enter (paying 25% each), you receive the full asking price immediately.
                    </RuleText>
                  </RuleItem>
                  <RuleItem>
                    <RuleNumber>3</RuleNumber>
                    <RuleText>
                      <Highlight>Watch the Game:</Highlight> Players compete by flipping coins. The first to 3 wins gets your NFT.
                    </RuleText>
                  </RuleItem>
                  <RuleItem>
                    <RuleNumber>4</RuleNumber>
                    <RuleText>
                      <Highlight>NFT Transfer:</Highlight> The winner automatically receives your NFT in their wallet.
                    </RuleText>
                  </RuleItem>
                </RuleList>
              </div>
            )}
            
            {activeTab === 'player' && (
              <div>
                <h3 style={{ color: '#00FF41', fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                  Player's Guide
                </h3>
                <RuleList>
                  <RuleItem>
                    <RuleNumber>1</RuleNumber>
                    <RuleText>
                      <Highlight>Join a Game:</Highlight> Browse available NFT listings and join a game by paying 25% of the asking price.
                    </RuleText>
                  </RuleItem>
                  <RuleItem>
                    <RuleNumber>2</RuleNumber>
                    <RuleText>
                      <Highlight>Make Your Choice:</Highlight> Select either <Highlight>Heads</Highlight> or <Highlight>Tails</Highlight> for each coin flip.
                    </RuleText>
                  </RuleItem>
                  <RuleItem>
                    <RuleNumber>3</RuleNumber>
                    <RuleText>
                      <Highlight>Charge Power:</Highlight> Hold the <Highlight>POWER</Highlight> button to charge your flip power (0-100%).
                    </RuleText>
                  </RuleItem>
                  <RuleItem>
                    <RuleNumber>4</RuleNumber>
                    <RuleText>
                      <Highlight>Flip and Win:</Highlight> If your coin lands on your chosen side, you get a point. First to 3 points wins the NFT!
                    </RuleText>
                  </RuleItem>
                </RuleList>
              </div>
            )}
          </TabContent>
        </TabContainer>

      </ContentWrapper>
    </PageContainer>
  );
};

export default HowToPlay;
