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
  font-family: 'Hyperwave', sans-serif;

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
            {[50, 100, 200, 250, 300, 500, 750, 1000].map((amount, index) => {
              const colors = [
                { bg: '#808080', text: '#fff' }, // Grey for 50
                { bg: '#00ffff', text: '#000' }, // Neon Cyan
                { bg: '#ff00ff', text: '#fff' }, // Neon Magenta
                { bg: '#00ff00', text: '#000' }, // Neon Green
                { bg: '#ffff00', text: '#000' }, // Neon Yellow
                { bg: '#ff0080', text: '#fff' }, // Neon Pink
                { bg: '#8000ff', text: '#fff' }, // Neon Purple
                { bg: '#FFD700', text: '#000' }  // Gold for 1000
              ];
              const colorSet = colors[index % colors.length];
              
              return (
                <div key={index} style={{
                  background: colorSet.bg,
                  border: `3px solid ${colorSet.bg}`,
                  borderRadius: '15px',
                  padding: '1rem',
                  textAlign: 'center',
                  color: colorSet.text,
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  fontFamily: 'Orbitron, sans-serif',
                  boxShadow: `0 4px 15px ${colorSet.bg}40`,
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
                <img src="/images/token.png" alt="FLIP Token" style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '12px' }} />
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
                <img src="/coins/clownt.png" alt="Clown Skin" style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px' }} />
                <img src="/coins/luigi.png" alt="Luigi Skin" style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px' }} />
                <img src="/coins/trumpheads.webp" alt="Trump Skin" style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px' }} />
              </TokenIcon>
              <TokenName>Skins</TokenName>
              <TokenDescription>
                Unlock in game coin skins and compounds with <strong>FLIP</strong> tokens.
              </TokenDescription>
            </TokenCard>
            
            <TokenCard>
              <TokenIcon>
                <img src="/images/marketplace.png" alt="Marketplace" style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '12px' }} />
              </TokenIcon>
              <TokenName>Marketplace</TokenName>
              <TokenDescription>
                Spend <strong>FLIP</strong> tokens on collectable community created skins for your coins
                <br /><br />
                New coin v coin game mode allows users to flip collectable coins against each other.
              </TokenDescription>
            </TokenCard>
            
            <TokenCard>
              <TokenIcon>
                <img src="/images/factory.png" alt="Coin Factory" style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '12px' }} />
              </TokenIcon>
              <TokenName>Coin Factory</TokenName>
              <TokenDescription>
                Mint coin collections and skins with different compounds using <strong>FLIP</strong>. Then sell them in our marketplace.
              </TokenDescription>
            </TokenCard>
          </TokenInfo>
        </Section>


        <AirdropSection style={{ marginBottom: '0' }}>
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
