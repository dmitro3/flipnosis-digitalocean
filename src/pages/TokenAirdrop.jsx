import React, { useState, useEffect } from 'react';
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

// Floating FLIP reward animation
const floatIn = keyframes`
  0% { 
    opacity: 0; 
    transform: translate(-50%, -50%) scale(0.5) translateY(50px); 
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1) translateY(-10px);
  }
  100% { 
    opacity: 0; 
    transform: translate(-50%, -50%) scale(0.8) translateY(-100px); 
  }
`;

const FloatingReward = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  color: #FFD700;
  padding: 15px 25px;
  border-radius: 12px;
  font-size: 1.2rem;
  font-weight: bold;
  z-index: 10000;
  text-align: center;
  box-shadow: 0 0 40px rgba(255, 215, 0, 0.6);
  pointer-events: none;
  animation: ${floatIn} 3s ease-out forwards;
  font-family: 'Orbitron', sans-serif;
  border: 2px solid rgba(255, 215, 0, 0.5);
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

const TokenAirdrop = () => {
  const [floatingRewards, setFloatingRewards] = useState([]);

  const showFloatingReward = () => {
    const amounts = [50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000];
    const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];
    
    const newReward = {
      id: Date.now() + Math.random(),
      amount: randomAmount,
      text: `+${randomAmount} FLIP earned!`
    };
    
    setFloatingRewards(prev => [...prev, newReward]);
    
    // Remove the reward after animation completes
    setTimeout(() => {
      setFloatingRewards(prev => prev.filter(reward => reward.id !== newReward.id));
    }, 3000);
  };

  useEffect(() => {
    // Show floating rewards every 3 seconds
    const interval = setInterval(showFloatingReward, 3000);
    
    // Show initial reward after 1 second
    const initialTimeout = setTimeout(showFloatingReward, 1000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, []);

  const handleBack = () => {
    window.history.back();
  };

  return (
    <PageContainer>
      <BackButton onClick={handleBack}>
        ← Back
      </BackButton>
      
      {/* Floating FLIP rewards */}
      {floatingRewards.map(reward => (
        <FloatingReward key={reward.id}>
          {reward.text}
        </FloatingReward>
      ))}
      
      <ContentWrapper>
        <Title>Token & Airdrop</Title>
        
        <Section>
          <SectionTitle>FLIP Token Information</SectionTitle>
          <TokenInfo>
            <TokenCard>
              <TokenIcon>🪙</TokenIcon>
              <TokenName>FLIP</TokenName>
              <TokenValue>10,000,000,000</TokenValue>
              <TokenDescription>
                Total supply of <strong>FLIP</strong> tokens. Our native utility token that powers the entire FLIPNOSIS ecosystem.
              </TokenDescription>
            </TokenCard>
            
            <TokenCard>
              <TokenIcon>🎁</TokenIcon>
              <TokenName>Airdrop</TokenName>
              <TokenValue>1,000,000,000</TokenValue>
              <TokenDescription>
                <strong>1 billion FLIP</strong> tokens (10% of total supply) will be distributed through gameplay rewards and community events.
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

        <AirdropSection>
          <AirdropTitle>🎉 Massive Airdrop Campaign</AirdropTitle>
          <AirdropAmount>1,000,000,000 FLIP</AirdropAmount>
          <AirdropDescription>
            We're giving away <strong>1 billion FLIP tokens</strong> to our community! 
            This represents <strong>10% of the total supply</strong> and will be distributed through various methods including gameplay rewards, community events, and special promotions.
          </AirdropDescription>
        </AirdropSection>

        <Section>
          <SectionTitle>How to Earn FLIP Tokens</SectionTitle>
          <RewardMechanism>
            <RewardCard>
              <RewardIcon>🎮</RewardIcon>
              <RewardTitle>Gameplay Rewards</RewardTitle>
              <RewardDescription>
                Earn 50-1000 FLIP every time your coin spins in a battle royale game. The amount varies based on game performance and luck!
              </RewardDescription>
            </RewardCard>
            
            <RewardCard>
              <RewardIcon>🏆</RewardIcon>
              <RewardTitle>Victory Bonuses</RewardTitle>
              <RewardDescription>
                Win games to earn bonus FLIP tokens on top of your regular gameplay rewards. The bigger the win, the bigger the bonus!
              </RewardDescription>
            </RewardCard>
            
            <RewardCard>
              <RewardIcon>🎯</RewardIcon>
              <RewardTitle>Daily Challenges</RewardTitle>
              <RewardDescription>
                Complete daily challenges and special events to earn additional FLIP tokens. Check back regularly for new opportunities!
              </RewardDescription>
            </RewardCard>
            
            <RewardCard>
              <RewardIcon>👥</RewardIcon>
              <RewardTitle>Referral Program</RewardTitle>
              <RewardDescription>
                Invite friends to join FLIPNOSIS and earn FLIP tokens when they start playing. Build your network and earn together!
              </RewardDescription>
            </RewardCard>
          </RewardMechanism>
        </Section>

        <Section>
          <SectionTitle>Token Utility</SectionTitle>
          <TokenInfo>
            <TokenCard>
              <TokenIcon>🎮</TokenIcon>
              <TokenName>Game Entry</TokenName>
              <TokenDescription>
                Use <strong>FLIP</strong> tokens to enter battle royale games and compete for NFT prizes. The more you stake, the bigger the potential rewards!
              </TokenDescription>
            </TokenCard>
            
            <TokenCard>
              <TokenIcon>🏪</TokenIcon>
              <TokenName>Marketplace</TokenName>
              <TokenDescription>
                Trade <strong>FLIP</strong> tokens in our upcoming marketplace for NFTs, special items, and exclusive game features.
              </TokenDescription>
            </TokenCard>
            
            <TokenCard>
              <TokenIcon>🎨</TokenIcon>
              <TokenName>Coin Factory</TokenName>
              <TokenDescription>
                Create custom coins and materials using <strong>FLIP</strong> tokens in our upcoming Coin Factory feature.
              </TokenDescription>
            </TokenCard>
          </TokenInfo>
        </Section>

        <Section>
          <SectionTitle>Distribution Timeline</SectionTitle>
          <RewardMechanism>
            <RewardCard>
              <RewardIcon>🚀</RewardIcon>
              <RewardTitle>Phase 1: Launch</RewardTitle>
              <RewardDescription>
                <strong>200M FLIP</strong> distributed through gameplay rewards and early adopter bonuses during the first month.
              </RewardDescription>
            </RewardCard>
            
            <RewardCard>
              <RewardIcon>📈</RewardIcon>
              <RewardTitle>Phase 2: Growth</RewardTitle>
              <RewardDescription>
                <strong>300M FLIP</strong> distributed through community events, tournaments, and referral programs over 3 months.
              </RewardDescription>
            </RewardCard>
            
            <RewardCard>
              <RewardIcon>🌟</RewardIcon>
              <RewardTitle>Phase 3: Expansion</RewardTitle>
              <RewardDescription>
                <strong>500M FLIP</strong> distributed through special promotions, partnerships, and long-term holder rewards.
              </RewardDescription>
            </RewardCard>
          </RewardMechanism>
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
