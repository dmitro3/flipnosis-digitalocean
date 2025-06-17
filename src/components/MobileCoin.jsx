import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';

const CoinContainer = styled.div`
  width: 100%;
  height: 100%;
  perspective: 1000px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Coin = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.1s linear;
  transform: ${props => props.isFlipping ? `rotateY(${props.rotation}deg)` : 'rotateY(0deg)'};
`;

const Face = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(45deg, #FFE135, #FFD700);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  border: 2px solid #DAA520;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 0%,
      rgba(255, 255, 255, 0.1) 45%,
      rgba(255, 255, 255, 0.5) 50%,
      rgba(255, 255, 255, 0.1) 55%,
      transparent 100%
    );
    transform: rotate(45deg);
    animation: shine 3s infinite;
  }

  /* Add texture pattern */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
      radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
      radial-gradient(circle at 75% 25%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
      radial-gradient(circle at 25% 75%, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
    background-size: 20px 20px;
    opacity: 0.5;
  }

  @keyframes shine {
    0% {
      transform: translateX(-100%) rotate(45deg);
    }
    100% {
      transform: translateX(100%) rotate(45deg);
    }
  }
`;

const Symbol = styled.div`
  font-size: 3rem;
  color: #4A3728;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 5px rgba(74, 55, 40, 0.5);
  filter: drop-shadow(0 0 2px rgba(255, 215, 0, 0.5));
`;

const Text = styled.div`
  font-family: 'Orbitron', sans-serif;
  font-size: 1.2rem;
  color: #4A3728;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 0 5px rgba(74, 55, 40, 0.5);
  font-weight: 600;
  filter: drop-shadow(0 0 2px rgba(255, 215, 0, 0.5));
`;

const Heads = styled(Face)`
  transform: rotateY(0deg);
`;

const Tails = styled(Face)`
  transform: rotateY(180deg);
`;

const Edge = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: repeating-linear-gradient(
    90deg,
    #FFE135,
    #FFE135 2px,
    #FFD700 2px,
    #FFD700 4px
  );
  transform: rotateX(90deg);
  transform-style: preserve-3d;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
`;

const MobileCoin = ({
  isFlipping = false,
  flipResult = null,
  flipDuration = 3000,
  creatorPower = 0,
  joinerPower = 0,
  isPlayerTurn = false,
  chargingPlayer = null,
  isCreator = false,
  creatorChoice = null,
  joinerChoice = null,
  onMouseDown,
  onMouseUp,
  size = 200
}) => {
  const rotationRef = useRef(0);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(0);
  const coinRef = useRef(null);

  useEffect(() => {
    if (isFlipping) {
      startTimeRef.current = performance.now();
      const animate = (currentTime) => {
        const elapsed = currentTime - startTimeRef.current;
        const progress = Math.min(elapsed / flipDuration, 1);
        
        // Calculate total power for speed scaling
        const totalPower = creatorPower + joinerPower;
        const powerRatio = Math.min(totalPower / 10, 1);
        
        // Calculate rotation based on power and progress
        const minFlips = 4;
        const maxFlips = 15;
        const totalFlips = minFlips + (powerRatio * (maxFlips - minFlips));
        
        // Base rotation with power-based speed
        const baseRotation = progress * 360 * totalFlips;
        
        // Add vertical motion during flip
        const verticalOffset = Math.sin(progress * Math.PI) * 20 * (1 - progress * 0.2);
        
        // Add small wobble for realism
        const wobble = Math.sin(progress * Math.PI * totalFlips * 0.1) * 5 * (1 - progress);
        
        // Apply all transformations
        rotationRef.current = baseRotation;
        
        // Update coin position for vertical motion
        if (coinRef.current) {
          coinRef.current.style.transform = `rotateY(${baseRotation}deg) translateY(${verticalOffset}px) rotateZ(${wobble}deg)`;
        }

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Ensure final rotation matches the result
          const finalRotation = flipResult === 'heads' ? 0 : 180;
          if (coinRef.current) {
            coinRef.current.style.transform = `rotateY(${finalRotation}deg)`;
          }
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isFlipping, flipDuration, flipResult, creatorPower, joinerPower]);

  // Handle charging animation
  useEffect(() => {
    if (chargingPlayer && !isFlipping) {
      const animate = (currentTime) => {
        rotationRef.current = (rotationRef.current + 2) % 360;
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [chargingPlayer, isFlipping]);

  return (
    <CoinContainer
      style={{ width: size, height: size }}
      onMouseDown={isPlayerTurn ? onMouseDown : undefined}
      onMouseUp={isPlayerTurn ? onMouseUp : undefined}
      onTouchStart={isPlayerTurn ? onMouseDown : undefined}
      onTouchEnd={isPlayerTurn ? onMouseUp : undefined}
    >
      <Coin
        ref={coinRef}
        isFlipping={isFlipping || chargingPlayer}
        rotation={rotationRef.current}
      >
        <Heads>
          <Symbol>♔</Symbol>
          <Text>Heads</Text>
        </Heads>
        <Tails>
          <Symbol>♦</Symbol>
          <Text>Tails</Text>
        </Tails>
        <Edge />
      </Coin>
    </CoinContainer>
  );
};

export default MobileCoin; 