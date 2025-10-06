import React, { useState, useCallback } from 'react'
import styled from '@emotion/styled'
import { ethers } from 'ethers'
import { useBattleRoyaleGame } from '../../contexts/BattleRoyaleGameContext'
import { useWallet } from '../../contexts/WalletContext'
import { useToast } from '../../contexts/ToastContext'
import contractService from '../../services/ContractService'
import socketService from '../../services/SocketService'
import ProfilePicture from '../ProfilePicture'
import CoinSelector from '../CoinSelector'
import FloatingChatWidget from './FloatingChatWidget'

// Utility function to format entry fee
const formatEntryFee = (fee) => {
  if (!fee) return '0.00'
  const num = parseFloat(fee)
  if (num < 1) {
    // For amounts less than $1, round up to 2 decimal places
    return Math.ceil(num * 100) / 100
  } else {
    // For amounts $1 and above, round to 2 decimal places normally
    return Math.round(num * 100) / 100
  }
}

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

const NFTPanel = styled.div`
  background: rgba(0, 0, 40, 0.8);
  border: 2px solid #FF1493;
  border-radius: 1rem;
  padding: 2rem;
  backdrop-filter: blur(15px);
  height: fit-content;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const NFTImageContainer = styled.div`
  width: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.02);
  }
`

const NFTImage = styled.img`
  width: 100%;
  border-radius: 0.5rem;
  border: 2px solid rgba(255, 20, 147, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #FF1493;
    box-shadow: 0 0 20px rgba(255, 20, 147, 0.4);
  }
`

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  
  &:last-child {
    border-bottom: none;
  }
`

const ShareButtonsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-top: 1rem;
`

const ActionButton = styled.button`
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 48px;
  width: 100%;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-2px);
  }
  
  &.share-x {
    background: linear-gradient(135deg, #1da1f2 0%, #0d8bd9 50%, #1da1f2 100%);
    border-color: #1da1f2;
  }
  
  &.share-tg {
    background: linear-gradient(135deg, #0088cc 0%, #006699 50%, #0088cc 100%);
    border-color: #0088cc;
  }
  
  &.opensea {
    background: linear-gradient(135deg, #2081e2 0%, #1a6bb8 50%, #2081e2 100%);
    border-color: #2081e2;
  }
  
  &.explorer {
    background: linear-gradient(135deg, #6c757d 0%, #7a8288 50%, #6c757d 100%);
    border-color: #6c757d;
  }
`

const GamePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`

const StatusBar = styled.div`
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #00ff88;
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  color: white;
  
  h2 {
    color: #00ff88;
    margin: 0 0 0.5rem 0;
  }
`

const PlayerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 1rem;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #FF1493;
  border-radius: 1rem;
  padding: 2rem;
  min-height: 400px;
`

const PlayerSlot = styled.div`
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 1rem;
  padding: 1rem;
  background: ${props => {
    if (props.occupied) {
      return props.isCurrentUser 
        ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 204, 106, 0.2))'
        : 'linear-gradient(135deg, rgba(0, 191, 255, 0.2), rgba(138, 43, 226, 0.2))'
    }
    return 'rgba(255, 255, 255, 0.05)'
  }};
  border: 3px solid ${props => {
    if (props.occupied) {
      return props.isCurrentUser ? '#00ff88' : '#00bfff'
    }
    return 'rgba(255, 255, 255, 0.2)'
  }};
  cursor: ${props => props.canJoin ? 'pointer' : 'default'};
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    ${props => props.canJoin && `
      border-color: #ff1493;
      background: rgba(255, 20, 147, 0.1);
      transform: translateY(-5px);
    `}
  }
`

const CoinDisplay = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #FFD700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  background: radial-gradient(circle, #FFD700, #FFA500);
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const JoinActionButton = styled.button`
  background: linear-gradient(135deg, #ff1493, #ff69b4);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 2rem;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(255, 20, 147, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const CoinChangeButton = styled.button`
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #000;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
  
  &:hover {
    background: linear-gradient(135deg, #FFA500, #FF8C00);
    transform: translateY(-2px);
  }
`

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 2rem;
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

const ModalContent = styled.div`
  background: rgba(0, 0, 0, 0.95);
  border: 2px solid #FFD700;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #FFD700;
  font-size: 2rem;
  cursor: pointer;
  padding: 0.5rem;
  z-index: 10;
  
  &:hover {
    color: #ff6b6b;
  }
`

const EnlargedImage = styled.img`
  max-width: 100%;
  max-height: 80vh;
  border-radius: 0.5rem;
  display: block;
`

const LobbyScreen = () => {
  const { gameState, playerCoinImages, address, updateCoin, startGameEarly } = useBattleRoyaleGame()
  const { isContractInitialized } = useWallet()
  const { showToast } = useToast()
  
  const [isJoining, setIsJoining] = useState(false)
  const [showCoinSelector, setShowCoinSelector] = useState(false)
  const [selectedSlotAddress, setSelectedSlotAddress] = useState(null)
  const [coinSides, setCoinSides] = useState({})
  const [showImageModal, setShowImageModal] = useState(false)

  if (!gameState) return null

  const isCreator = gameState.creator?.toLowerCase() === address?.toLowerCase()
  const userInGame = gameState.playerSlots?.some(addr => addr?.toLowerCase() === address?.toLowerCase())
  const canJoin = !userInGame && gameState.currentPlayers < 6

  const handleJoinGame = async () => {
    if (!isContractInitialized || !contractService) {
      showToast('Connect your wallet first', 'error')
      return
    }

    setIsJoining(true)
    try {
      showToast('Opening MetaMask...', 'info')
      
      const totalPrize = parseFloat(gameState.entryFee || 0)
      const entryFeeUSD = totalPrize / 6
      const serviceFeeUSD = parseFloat(gameState.serviceFee || 0)
      const totalAmountUSD = entryFeeUSD + serviceFeeUSD
      
      const totalAmountETHWei = await contractService.getETHAmount(totalAmountUSD)
      const totalAmountETH = ethers.formatEther(totalAmountETHWei)
      
      const result = await contractService.joinBattleRoyale(gameState.gameId, totalAmountETH)
      
      if (result.success) {
        showToast('Successfully joined!', 'success')
        
        // 🔥 THIS WAS MISSING - Tell the server to add player to game
        socketService.emit('join_battle_royale', {
          gameId: gameState.gameId,
          address: address,
          betAmount: totalAmountETH
        })
        
        // Request updated state
        socketService.emit('request_battle_royale_state', { 
          gameId: gameState.gameId 
        })
        
        console.log('✅ Notified server of player join')
      } else {
        throw new Error(result.error || 'Failed to join')
      }
    } catch (error) {
      console.error('Join error:', error)
      showToast(`Failed to join: ${error.message}`, 'error')
    } finally {
      setIsJoining(false)
    }
  }

  const handleCoinClick = (playerAddress) => {
    if (playerAddress?.toLowerCase() === address?.toLowerCase()) {
      setSelectedSlotAddress(playerAddress)
      setShowCoinSelector(true)
    } else {
      const key = playerAddress?.toLowerCase()
      setCoinSides(prev => ({
        ...prev,
        [key]: prev[key] === 'tailsImage' ? 'headsImage' : 'tailsImage'
      }))
    }
  }

  const handleCoinSelect = (coinData) => {
    updateCoin(coinData)
    setShowCoinSelector(false)
    setSelectedSlotAddress(null)
  }

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Helper functions for marketplace links
  const getMarketplaceUrl = (chain) => {
    const marketplaces = {
      ethereum: 'https://opensea.io/assets/ethereum',
      polygon: 'https://opensea.io/assets/matic',
      base: 'https://opensea.io/assets/base',
      arbitrum: 'https://opensea.io/assets/arbitrum',
      optimism: 'https://opensea.io/assets/optimism',
    }
    return marketplaces[chain?.toLowerCase()] || 'https://opensea.io/assets/base'
  }

  const getExplorerUrl = (chain, contract, tokenId) => {
    if (!chain || !contract || !tokenId) return '#'
    
    const explorers = {
      ethereum: 'https://etherscan.io/token',
      polygon: 'https://polygonscan.com/token',
      base: 'https://basescan.org/token',
      arbitrum: 'https://arbiscan.io/token',
      optimism: 'https://optimistic.etherscan.io/token',
    }
    
    const baseUrl = explorers[chain.toLowerCase()] || 'https://basescan.org/token'
    return `${baseUrl}/${contract}?a=${tokenId}`
  }

  const handleShare = (platform) => {
    const gameUrl = window.location.href
    const nftName = gameState.nftName
    const collection = gameState.nftCollection
    
    let shareUrl = ''
    let shareText = ''
    
    switch (platform) {
      case 'twitter':
        shareText = `Check out this Battle Royale NFT game! 🎮\n\n${nftName} from ${collection}\n\nJoin the game: ${gameUrl}`
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
        break
      case 'telegram':
        shareText = `Check out this Battle Royale NFT game! 🎮\n\n${nftName} from ${collection}\n\nJoin the game: ${gameUrl}`
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${encodeURIComponent(shareText)}`
        break
      default:
        return
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  return (
    <Container>
      {/* LEFT: NFT INFO */}
      <NFTPanel>
        <h2 style={{ color: '#FF1493', marginTop: 0 }}>🎨 NFT Prize</h2>
        
        <NFTImageContainer onClick={() => setShowImageModal(true)}>
          <NFTImage src={gameState.nftImage} alt={gameState.nftName} />
        </NFTImageContainer>
        
        <InfoRow>
          <span>Name:</span>
          <strong>{gameState.nftName}</strong>
        </InfoRow>
        <InfoRow>
          <span>Collection:</span>
          <strong>{gameState.nftCollection}</strong>
        </InfoRow>
        <InfoRow>
          <span>Entry Fee:</span>
          <strong style={{ color: '#00ff88' }}>${formatEntryFee(gameState.entryFee)}</strong>
        </InfoRow>
        <InfoRow>
          <span>Creator:</span>
          <strong>{formatAddress(gameState.creator)}</strong>
        </InfoRow>
        
        <ShareButtonsGrid>
          <ActionButton 
            className="share-x"
            onClick={() => handleShare('twitter')}
          >
            Share on X
          </ActionButton>
          <ActionButton 
            className="share-tg"
            onClick={() => handleShare('telegram')}
          >
            Share on TG
          </ActionButton>
          <a
            href={gameState.nftContract && gameState.nftTokenId ? 
              `${getMarketplaceUrl(gameState.nftChain)}/${gameState.nftContract}/${gameState.nftTokenId}` :
              '#'
            }
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!gameState.nftContract || !gameState.nftTokenId) {
                e.preventDefault()
              }
            }}
            style={{ textDecoration: 'none' }}
          >
            <ActionButton className="opensea">
              <img 
                src="/images/opensea.png" 
                alt="OpenSea" 
                style={{ width: '16px', height: '16px', objectFit: 'contain' }} 
              />
              OpenSea
            </ActionButton>
          </a>
          <a
            href={getExplorerUrl(gameState.nftChain, gameState.nftContract, gameState.nftTokenId)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!gameState.nftContract || !gameState.nftTokenId) {
                e.preventDefault()
              }
            }}
            style={{ textDecoration: 'none' }}
          >
            <ActionButton className="explorer">
              🔍 Explorer
            </ActionButton>
          </a>
        </ShareButtonsGrid>
      </NFTPanel>

      {/* RIGHT: GAME AREA */}
      <GamePanel>
        <StatusBar>
          <h2>⏳ Waiting for Players</h2>
          <p style={{ fontSize: '1.2rem', margin: 0 }}>
            {gameState.currentPlayers} / 6 Players
          </p>
          {isCreator && gameState.currentPlayers >= 2 && (
            <JoinActionButton
              onClick={startGameEarly}
              style={{ marginTop: '1rem', background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
            >
              🚀 Start Game Early ({gameState.currentPlayers}/6)
            </JoinActionButton>
          )}
        </StatusBar>

        <PlayerGrid>
          {Array.from({ length: 6 }, (_, i) => {
            const playerAddr = gameState.playerSlots?.[i]
            const player = playerAddr ? gameState.players?.[playerAddr.toLowerCase()] : null
            const isCurrentUser = playerAddr?.toLowerCase() === address?.toLowerCase()
            const images = playerAddr ? playerCoinImages[playerAddr.toLowerCase()] : null
            const side = coinSides[playerAddr?.toLowerCase()] || 'headsImage'

            return (
              <PlayerSlot
                key={i}
                occupied={!!player}
                isCurrentUser={isCurrentUser}
                canJoin={!player && canJoin}
                onClick={() => !player && canJoin && handleJoinGame()}
              >
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  left: '0.5rem',
                  color: '#aaa',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  {i + 1}
                </div>

                {player ? (
                  <>
                    <CoinDisplay clickable onClick={() => handleCoinClick(playerAddr)}>
                      {images ? (
                        <img src={images[side]} alt="coin" />
                      ) : (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                          fontSize: '3rem'
                        }}>🪙</div>
                      )}
                    </CoinDisplay>
                    
                    <div style={{ color: 'white', fontSize: '0.7rem', textAlign: 'center' }}>
                      {formatAddress(playerAddr)}
                    </div>
                    
                    {player.isCreator && (
                      <div style={{ color: '#FFD700', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        👑 Creator
                      </div>
                    )}
                    
                    {isCurrentUser && (
                      <CoinChangeButton onClick={() => handleCoinClick(playerAddr)}>
                        Change Coin
                      </CoinChangeButton>
                    )}
                  </>
                ) : (
                  <div style={{ color: '#FF1493', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>
                    {canJoin ? '➕ Click to Join' : 'Waiting...'}
                  </div>
                )}
              </PlayerSlot>
            )
          })}
        </PlayerGrid>

        {!userInGame && canJoin && (
          <JoinActionButton onClick={handleJoinGame} disabled={isJoining}>
            {isJoining ? 'Joining...' : '🎮 Join Battle Royale'}
          </JoinActionButton>
        )}
      </GamePanel>

      {/* COIN SELECTOR MODAL */}
      {showCoinSelector && (
        <Modal onClick={() => setShowCoinSelector(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={() => setShowCoinSelector(false)}>×</CloseButton>
            <h2 style={{ color: '#FFD700', textAlign: 'center', marginBottom: '1rem' }}>
              Choose Your Coin
            </h2>
            <CoinSelector
              selectedCoin={gameState.players?.[selectedSlotAddress?.toLowerCase()]?.coin}
              onCoinSelect={handleCoinSelect}
              showCustomOption={true}
            />
          </ModalContent>
        </Modal>
      )}

      {/* IMAGE MODAL */}
      {showImageModal && (
        <Modal onClick={() => setShowImageModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={() => setShowImageModal(false)}>×</CloseButton>
            <EnlargedImage src={gameState.nftImage} alt={gameState.nftName} />
            <div style={{ 
              textAlign: 'center', 
              marginTop: '1rem', 
              color: 'white',
              fontSize: '1.2rem',
              fontWeight: 'bold'
            }}>
              {gameState.nftName}
            </div>
          </ModalContent>
        </Modal>
      )}

      {/* FLOATING CHAT */}
      <FloatingChatWidget />
    </Container>
  )
}

export default LobbyScreen