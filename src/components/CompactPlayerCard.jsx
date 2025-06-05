import React from 'react'
import { useWallet } from '../contexts/WalletContext'
import ProfilePicture from './ProfilePicture'
import { ethers } from 'ethers'

const CompactPlayerCard = ({
  player,
  isCurrentUser,
  playerNumber,
  nft,
  cryptoAmount,
  score,
  gamePhase,
  isActiveTurn,
  choice,
  onChoiceSelect,
  canChoose,
  hasChosen,
  contractAddress,
  tokenId,
  nftChain
}) => {
  const { address } = useWallet()

  const truncateAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getChainName = (chain) => {
    switch (chain?.toLowerCase()) {
      case 'base':
        return 'Base'
      case 'ethereum':
        return 'Ethereum'
      default:
        return chain || 'Unknown'
    }
  }

  const getChoiceButtonStyle = (choiceType) => {
    const isSelected = choice === choiceType
    const isDisabled = !canChoose || hasChosen
    
    return {
      padding: '0.5rem 1rem',
      margin: '0.25rem',
      borderRadius: '0.5rem',
      border: `2px solid ${isSelected ? '#FFD700' : 'rgba(255, 215, 0, 0.3)'}`,
      background: isSelected ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
      color: isSelected ? '#FFD700' : 'rgba(255, 215, 0, 0.7)',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.5 : 1,
      transition: 'all 0.3s ease',
      fontSize: '0.9rem',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      boxShadow: isSelected ? '0 0 15px rgba(255, 215, 0, 0.3)' : 'none'
    }
  }

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '1rem',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      border: `2px solid ${isActiveTurn ? '#FFD700' : 'rgba(255, 215, 0, 0.1)'}`,
      boxShadow: isActiveTurn ? '0 0 20px rgba(255, 215, 0, 0.2)' : 'none',
      transition: 'all 0.3s ease'
    }}>
      {/* Player Info */}
      <div style={{ textAlign: 'center' }}>
        <ProfilePicture
          address={player}
          size={80}
          style={{
            border: `3px solid ${isCurrentUser ? '#FFD700' : 'rgba(255, 215, 0, 0.3)'}`,
            boxShadow: isCurrentUser ? '0 0 15px rgba(255, 215, 0, 0.3)' : 'none'
          }}
        />
        <div style={{ marginTop: '0.5rem', color: '#FFD700', fontWeight: 'bold' }}>
          Player {playerNumber}
        </div>
        <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
          {truncateAddress(player)}
        </div>
      </div>

      {/* NFT Info */}
      {nft && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          width: '100%'
        }}>
          <div style={{ color: '#FFD700', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            NFT Details
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }}>
            <div>Contract: {truncateAddress(contractAddress)}</div>
            <div>Token ID: {tokenId}</div>
            <div>Chain: {getChainName(nftChain)}</div>
          </div>
        </div>
      )}

      {/* Game Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        padding: '0.5rem',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '0.5rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#FFD700', fontSize: '1.2rem', fontWeight: 'bold' }}>
            {score || 0}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }}>
            Wins
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#FFD700', fontSize: '1.2rem', fontWeight: 'bold' }}>
            ${cryptoAmount || '0.00'}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }}>
            Entry
          </div>
        </div>
      </div>

      {/* Choice Selection */}
      {isActiveTurn && canChoose && !hasChosen && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          width: '100%'
        }}>
          <div style={{ color: '#FFD700', fontSize: '0.9rem', fontWeight: 'bold' }}>
            Choose Your Side
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => onChoiceSelect('heads')}
              style={getChoiceButtonStyle('heads')}
              disabled={!canChoose || hasChosen}
            >
              Heads
            </button>
            <button
              onClick={() => onChoiceSelect('tails')}
              style={getChoiceButtonStyle('tails')}
              disabled={!canChoose || hasChosen}
            >
              Tails
            </button>
          </div>
        </div>
      )}

      {/* Choice Display */}
      {hasChosen && choice && (
        <div style={{
          background: 'rgba(255, 215, 0, 0.1)',
          border: '2px solid #FFD700',
          borderRadius: '0.5rem',
          padding: '0.5rem 1rem',
          color: '#FFD700',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          fontSize: '0.9rem'
        }}>
          Chose: {choice}
        </div>
      )}

      {/* Turn Indicator */}
      {isActiveTurn && (
        <div style={{
          color: '#FFD700',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          animation: 'pulse 1.5s infinite'
        }}>
          Your Turn
        </div>
      )}
    </div>
  )
}

export default CompactPlayerCard 