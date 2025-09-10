import React from 'react'

const GameHeader = ({
  gameData,
  gameState,
  getGameCreator,
  getGameJoiner,
  getGamePrice,
  getGameNFTImage,
  getGameNFTName,
  getGameNFTCollection,
  getGameNFTContract,
  getGameNFTTokenId
}) => {
  return (
    <div style={{
      textAlign: 'center',
      marginBottom: '2rem',
      padding: '1rem',
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <h1 style={{ 
        color: '#FFD700', 
        margin: '0 0 0.5rem 0',
        fontSize: '2rem',
        textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
      }}>
        🎲 NFT Flip Game
      </h1>
      <p style={{ 
        color: '#FFFFFF', 
        margin: 0,
        fontSize: '1rem'
      }}>
        {getGameNFTName()} - ${(getGamePrice() || 0).toFixed(2)} USD
      </p>
    </div>
  )
}

export default GameHeader 