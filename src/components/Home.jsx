import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useWallet } from '../contexts/WalletContext';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: ${props => props.theme.colors.background};
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.neonPink};
  font-size: 3rem;
  margin-bottom: 2rem;
  text-align: center;
`;

const GameFlipButton = styled(Link)`
  display: inline-block;
  padding: 1rem 2rem;
  font-size: 1.2rem;
  color: white;
  background: ${props => props.theme.colors.neonPink};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px ${props => props.theme.colors.neonPink};
  }
`;

const Home = () => {
  const { selectedFlip } = useWallet();

  return (
    <HomeContainer>
      <Title>Crypto Flipz</Title>
      {selectedFlip ? (
        <GameFlipButton
          to={`/game/${selectedFlip.id}`}
          style={{ 
            background: selectedFlip.status === 'completed' ? props => props.theme.colors.neonBlue : props => props.theme.colors.neonPink 
          }}
        >
          {selectedFlip.status === 'completed' ? 'VIEW RESULTS' : 'VIEW GAME'}
        </GameFlipButton>
      ) : (
        <GameFlipButton to="/create-game">
          CREATE NEW GAME
        </GameFlipButton>
      )}
    </HomeContainer>
  );
};

export default Home; 