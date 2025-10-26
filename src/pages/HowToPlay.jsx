import React from 'react';
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

const HowToPlay = () => {
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
          <RuleList>
            <RuleItem>
              <RuleNumber>1</RuleNumber>
              <RuleText>
                <Highlight>Why spend months waiting to sell an NFT when you can flip it!</Highlight>
              </RuleText>
            </RuleItem>
            <RuleItem>
              <RuleNumber>2</RuleNumber>
              <RuleText>
                <Highlight>FLIPNOSIS</Highlight> is a gamified NFT sale where 4 players flip coins to win NFTs. When the game starts, the creator receives the full amount they have asked for. The first player to three wins, wins the NFT.
              </RuleText>
            </RuleItem>
            <RuleItem>
              <RuleNumber>3</RuleNumber>
              <RuleText>
                Creators deposit their NFTs for the exact price they want. Players pay 1/4 of the asking price as an entry fee.
              </RuleText>
            </RuleItem>
          </RuleList>
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

        <Section>
          <SectionTitle>Step-by-Step Guide</SectionTitle>
          <RuleList>
            <RuleItem>
              <RuleNumber>1</RuleNumber>
              <RuleText>
                <Highlight>Join a Game:</Highlight> Connect your wallet and join an existing game room or create your own battle.
              </RuleText>
            </RuleItem>
            <RuleItem>
              <RuleNumber>2</RuleNumber>
              <RuleText>
                <Highlight>Deposit Assets:</Highlight> Deposit your NFTs and <TokenHighlight>FLIP</TokenHighlight> tokens to enter the game.
              </RuleText>
            </RuleItem>
            <RuleItem>
              <RuleNumber>3</RuleNumber>
              <RuleText>
                <Highlight>Make Your Choice:</Highlight> Select either <Highlight>Heads</Highlight> or <Highlight>Tails</Highlight> for the upcoming coin flip.
              </RuleText>
            </RuleItem>
            <RuleItem>
              <RuleNumber>4</RuleNumber>
              <RuleText>
                <Highlight>Charge Power:</Highlight> Hold down the <Highlight>POWER</Highlight> button to charge your flip power. Release when you're ready!
              </RuleText>
            </RuleItem>
            <RuleItem>
              <RuleNumber>5</RuleNumber>
              <RuleText>
                <Highlight>Watch the Flip:</Highlight> Your coin will flip with physics-based animation. If it matches your choice, you survive!
              </RuleText>
            </RuleItem>
            <RuleItem>
              <RuleNumber>6</RuleNumber>
              <RuleText>
                <Highlight>Eliminate Others:</Highlight> Continue until only one player remains. The winner takes all the deposited assets!
              </RuleText>
            </RuleItem>
          </RuleList>
        </Section>

      </ContentWrapper>
    </PageContainer>
  );
};

export default HowToPlay;
