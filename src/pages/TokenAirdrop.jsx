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
  position: relative;

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
  background: linear-gradient(45deg, #FFD700, #FFA500);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Section = styled.div`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  color: #FFD700;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid rgba(255, 215, 0, 0.3);
  padding-bottom: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
`;

const TokenInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const TokenCard = styled.div`
  background: rgba(255, 215, 0, 0.1);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 15px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(255, 215, 0, 0.5);
    background: rgba(255, 215, 0, 0.15);
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(255, 215, 0, 0.2);
  }
`;

const TokenIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const TokenName = styled.h3`
  color: #FFD700;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  font-family: 'Orbitron', sans-serif;
  font-weight: 700;
`;

const TokenValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #00FF41;
  margin-bottom: 1rem;
`;

const TokenDescription = styled.p`
  color: #ccc;
  line-height: 1.6;
  font-size: 1.1rem;
`;

const AirdropSection = styled.div`
  background: rgba(255, 20, 147, 0.1);
  border: 2px solid rgba(255, 20, 147, 0.3);
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 3rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  min-height: 200px;
`;

const AirdropTitle = styled.h3`
  color: #ff1493;
  font-size: 2rem;
  margin-bottom: 1rem;
`;

const AirdropAmount = styled.div`
  font-size: 3rem;
  font-weight: bold;
  color: #FFD700;
  margin-bottom: 1rem;
  font-family: 'Orbitron', sans-serif;
`;

const AirdropDescription = styled.p`
  color: #ccc;
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const RewardMechanism = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const RewardCard = styled.div`
  background: rgba(0, 255, 65, 0.1);
  border: 1px solid rgba(0, 255, 65, 0.3);
  border-radius: 10px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 255, 65, 0.15);
    border-color: rgba(0, 255, 65, 0.5);
    transform: translateY(-3px);
  }
`;

const RewardIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1rem;
`;

const RewardTitle = styled.h4`
  color: #00FF41;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
`;

const RewardDescription = styled.p`
  color: #ccc;
  font-size: 0.9rem;
  line-height: 1.4;
`;


const TokenAirdrop = () => {

  return (
    <PageContainer>
      <ContentWrapper>
        <Title>Token & Airdrop</Title>
        
        <AirdropSection>
          <AirdropTitle>Massive Airdrop Campaign</AirdropTitle>
          <AirdropAmount>1,000,000,000 FLIP</AirdropAmount>
          <AirdropDescription>
            We're giving away <strong>1 billion FLIP tokens</strong> to our community! 
            This represents <strong>10% of the total supply</strong> and will be distributed through our games only.
            <br /><br />
            <strong>Every time you flip you win FLIP.</strong>
          </AirdropDescription>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: '1rem', 
            marginTop: '2rem',
            padding: '1rem'
          }}>
            {[50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000].map((amount, index) => {
              const colors = [
                { bg: '#ff6b6b', border: '#ff5252' }, // Red
                { bg: '#4ecdc4', border: '#26a69a' }, // Teal
                { bg: '#45b7d1', border: '#2196f3' }, // Blue
                { bg: '#96ceb4', border: '#4caf50' }, // Green
                { bg: '#feca57', border: '#ffc107' }, // Yellow
                { bg: '#ff9ff3', border: '#e91e63' }, // Pink
                { bg: '#a8e6cf', border: '#8bc34a' }, // Light Green
                { bg: '#ffd93d', border: '#ffeb3b' }, // Gold
                { bg: '#b4a7d6', border: '#9c27b0' }, // Purple
                { bg: '#ffb3ba', border: '#f44336' }, // Light Red
                { bg: '#FFD700', border: '#FFA500' }  // Gold for 1000
              ];
              const colorSet = colors[index % colors.length];
              const isGold = amount === 1000;
              
              return (
                <div key={index} style={{
                  background: isGold ? '#FFD700' : 'white',
                  border: `3px solid ${isGold ? '#FFA500' : colorSet.border}`,
                  borderRadius: '15px',
                  padding: '1rem',
                  textAlign: 'center',
                  color: isGold ? '#000' : colorSet.bg,
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  fontFamily: 'Orbitron, sans-serif',
                  boxShadow: `0 4px 15px ${colorSet.border}40`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}>
                  +{amount} FLIP
                </div>
              );
            })}
          </div>
        </AirdropSection>

        <Section>
          <TokenInfo>
            <TokenCard>
              <TokenIcon>
                <img src="/token.png" alt="FLIP Token" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
              </TokenIcon>
              <TokenName>FLIP</TokenName>
              <TokenValue>10,000,000,000</TokenValue>
              <TokenDescription>
                Total supply of <strong>FLIP</strong> tokens. Our native utility token that powers the entire FLIPNOSIS ecosystem.
              </TokenDescription>
            </TokenCard>
            
            <TokenCard>
              <TokenIcon>🪂</TokenIcon>
              <TokenName>Airdrop</TokenName>
              <TokenValue>1,000,000,000</TokenValue>
              <TokenDescription>
                <strong>1 billion FLIP</strong> tokens (10% of total supply) will be distributed through gameplay rewards.
              </TokenDescription>
            </TokenCard>
            
            <TokenCard>
              <TokenIcon>⚡</TokenIcon>
              <TokenName>Earn Rate</TokenName>
              <TokenValue>50-1000</TokenValue>
              <TokenDescription>
                Earn <strong>50-1000 FLIP</strong> tokens every time your coin spins in a game. The more you play, the more you earn!
              </TokenDescription>
            </TokenCard>
          </TokenInfo>
        </Section>


        <Section>
          <SectionTitle>Token Utility</SectionTitle>
          <TokenInfo>
            <TokenCard>
              <TokenIcon style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <img src="/coins/clownt.png" alt="Clown Skin" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                <img src="/coins/luigi.png" alt="Luigi Skin" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                <img src="/coins/trumpheads.webp" alt="Trump Skin" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
              </TokenIcon>
              <TokenName>Skins</TokenName>
              <TokenDescription>
                Unlock in game coin skins and compounds with <strong>FLIP</strong> tokens.
              </TokenDescription>
            </TokenCard>
            
            <TokenCard>
              <TokenIcon>
                <img src="/marketplace.png" alt="Marketplace" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
              </TokenIcon>
              <TokenName>Marketplace</TokenName>
              <TokenDescription>
                Trade <strong>FLIP</strong> tokens in our upcoming marketplace for NFTs, special items, and exclusive game features. Purchase creator made skins on our marketplace.
              </TokenDescription>
            </TokenCard>
            
            <TokenCard>
              <TokenIcon>
                <img src="/factory.png" alt="Coin Factory" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
              </TokenIcon>
              <TokenName>Coin Factory</TokenName>
              <TokenDescription>
                Mint coin collections and skins with different compounds using <strong>FLIP</strong>. Then sell them in our marketplace.
              </TokenDescription>
            </TokenCard>
          </TokenInfo>
        </Section>


        <AirdropSection>
          <AirdropTitle>🎯 Start Earning Now!</AirdropTitle>
          <AirdropDescription>
            Join the FLIPNOSIS community today and start earning <strong>FLIP</strong> tokens immediately! 
            Every coin flip brings you closer to claiming your share of the massive airdrop.
          </AirdropDescription>
        </AirdropSection>
      </ContentWrapper>
    </PageContainer>
  );
};

export default TokenAirdrop;
