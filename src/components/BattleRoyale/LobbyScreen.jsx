import React, { useState, useCallback } from 'react'
import styled from '@emotion/styled'
import { ethers } from 'ethers'
import { useBattleRoyaleGame } from '../../contexts/BattleRoyaleGameContext'
import { useWallet } from '../../contexts/WalletContext'
import { useToast } from '../../contexts/ToastContext'
import contractService from '../../services/ContractService'
import socketService from '../../services/SocketService'
import ProfilePicture from '../ProfilePicture'
// Coin selection removed for lobby; show avatar and name only
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
  
  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
    }
    50% {
      box-shadow: 0 0 40px rgba(255, 0, 0, 0.9), 0 0 60px rgba(255, 0, 0, 0.5);
    }
  }
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  @media (max-width: 768px) {
    padding: 1rem;
    gap: 0.75rem;
    min-height: auto;
  }
`

const NFTPanel = styled.div`
  background: linear-gradient(135deg, rgba(10, 15, 35, 0.95), rgba(16, 33, 62, 0.95));
  border: 3px solid #9d00ff;
  border-radius: 20px;
  padding: 2rem;
  backdrop-filter: blur(15px);
  box-shadow: 0 0 40px rgba(157, 0, 255, 0.4);
  height: fit-content;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #00ffff;
    box-shadow: 0 0 50px rgba(0, 255, 255, 0.5);
  }

  @media (max-width: 768px) {
    padding: 1rem;
    gap: 1rem;
    border-radius: 15px;
  }
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
  border-radius: 12px;
  border: 2px solid #00ffff;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
  
  &:hover {
    border-color: #9d00ff;
    box-shadow: 0 0 30px rgba(157, 0, 255, 0.6);
  }
`

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(0, 255, 255, 0.2);
  color: white;
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.05), rgba(157, 0, 255, 0.05));
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(157, 0, 255, 0.1));
    border-bottom-color: rgba(0, 255, 255, 0.4);
  }
  
  &:last-child {
    border-bottom: 1px solid rgba(0, 255, 255, 0.2);
  }
`

const ShareButtonsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.3rem;
    margin-top: 0.5rem;
  }
`

const ActionButton = styled.button`
  padding: 0.75rem;
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(157, 0, 255, 0.1));
  border: 2px solid #00ffff;
  border-radius: 12px;
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
  backdrop-filter: blur(5px);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
  
  &:hover {
    background: linear-gradient(135deg, rgba(157, 0, 255, 0.2), rgba(0, 255, 255, 0.2));
    border-color: #9d00ff;
    box-shadow: 0 0 25px rgba(157, 0, 255, 0.4);
    transform: translateY(-2px);
  }
  
  &.share-x {
    background: linear-gradient(135deg, #1da1f2 0%, #0d8bd9 50%, #1da1f2 100%);
    border-color: #1da1f2;
    box-shadow: 0 0 20px rgba(29, 161, 242, 0.4);
  }
  
  &.share-tg {
    background: linear-gradient(135deg, #0088cc 0%, #006699 50%, #0088cc 100%);
    border-color: #0088cc;
    box-shadow: 0 0 20px rgba(0, 136, 204, 0.4);
  }
  
  &.opensea {
    background: linear-gradient(135deg, #2081e2 0%, #1a6bb8 50%, #2081e2 100%);
    border-color: #2081e2;
    box-shadow: 0 0 20px rgba(32, 129, 226, 0.4);
  }
  
  &.explorer {
    background: linear-gradient(135deg, #6c757d 0%, #7a8288 50%, #6c757d 100%);
    border-color: #6c757d;
    box-shadow: 0 0 20px rgba(108, 117, 125, 0.4);
  }

  @media (max-width: 768px) {
    padding: 0.5rem;
    font-size: 0.8rem;
    border-radius: 8px;
    min-height: 40px;
  }
`

const GamePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (max-width: 768px) {
    gap: 1rem;
  }
`

const StatusBar = styled.div`
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(157, 0, 255, 0.2));
  border: 3px solid #00ffff;
  border-radius: 20px;
  padding: 1.5rem;
  text-align: center;
  color: white;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 40px rgba(0, 255, 255, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #9d00ff;
    box-shadow: 0 0 50px rgba(157, 0, 255, 0.5);
  }

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 15px;
  }
  
  h2 {
    color: #00ffff;
    margin: 0 0 0.5rem 0;
    font-family: 'Orbitron', sans-serif;
    text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
  }
`

const PlayerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: 1fr;
  gap: 1rem;
  background: linear-gradient(135deg, rgba(10, 15, 35, 0.95), rgba(16, 33, 62, 0.95));
  border: 3px solid #9d00ff;
  border-radius: 20px;
  padding: 1.5rem;
  min-height: 200px;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 40px rgba(157, 0, 255, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #00ffff;
    box-shadow: 0 0 50px rgba(0, 255, 255, 0.5);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 0.75rem;
    padding: 1rem;
    min-height: 300px;
    border-radius: 15px;
  }
`

const PlayerSlot = styled.div`
  aspect-ratio: 0.8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  border-radius: 12px;
  padding: 0.8rem;
  background: ${props => {
    if (props.occupied) {
      return props.isCurrentUser 
        ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 204, 106, 0.2))'
        : 'linear-gradient(135deg, rgba(0, 255, 255, 0.15), rgba(157, 0, 255, 0.15))'
    }
    return 'linear-gradient(135deg, rgba(0, 255, 255, 0.05), rgba(157, 0, 255, 0.05))'
  }};
  border: 2px solid ${props => {
    if (props.occupied) {
      return props.isCurrentUser ? '#00ff88' : '#00ffff'
    }
    return 'rgba(0, 255, 255, 0.3)'
  }};
  cursor: ${props => props.canJoin ? 'pointer' : 'default'};
  transition: all 0.3s ease;
  position: relative;
  backdrop-filter: blur(5px);
  box-shadow: ${props => {
    if (props.occupied) {
      return props.isCurrentUser 
        ? '0 0 20px rgba(0, 255, 136, 0.3)' 
        : '0 0 20px rgba(0, 255, 255, 0.3)'
    }
    return '0 0 10px rgba(0, 255, 255, 0.1)'
  }};
  
  &:hover {
    ${props => props.canJoin && `
      border-color: #9d00ff;
      background: linear-gradient(135deg, rgba(157, 0, 255, 0.2), rgba(0, 255, 255, 0.2));
      box-shadow: 0 0 30px rgba(157, 0, 255, 0.5);
      transform: translateY(-3px);
    `}
    ${props => !props.canJoin && props.occupied && `
      box-shadow: 0 0 30px ${props.isCurrentUser ? 'rgba(0, 255, 136, 0.5)' : 'rgba(0, 255, 255, 0.5)'};
    `}
  }

  @media (max-width: 768px) {
    aspect-ratio: 1;
    padding: 0.5rem;
    gap: 0.2rem;
    border-radius: 8px;
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
  border: 2px solid #ff1493;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Orbitron', sans-serif;
  box-shadow: 0 0 20px rgba(255, 20, 147, 0.4);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 0 30px rgba(255, 20, 147, 0.6);
    background: linear-gradient(135deg, #ff69b4, #ff1493);
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
  backdrop-filter: blur(10px);
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

const ModalContent = styled.div`
  background: linear-gradient(135deg, rgba(10, 15, 35, 0.98), rgba(16, 33, 62, 0.98));
  border: 3px solid #00ffff;
  border-radius: 20px;
  padding: 2rem;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 0 60px rgba(0, 255, 255, 0.6);
  backdrop-filter: blur(15px);
`

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: linear-gradient(135deg, rgba(157, 0, 255, 0.2), rgba(0, 255, 255, 0.2));
  border: 2px solid #00ffff;
  border-radius: 8px;
  color: #00ffff;
  font-size: 2rem;
  cursor: pointer;
  padding: 0.5rem;
  z-index: 10;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
  
  &:hover {
    color: #ff6b6b;
    border-color: #ff6b6b;
    box-shadow: 0 0 25px rgba(255, 107, 107, 0.5);
    background: linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 0, 0, 0.2));
  }
`

const EnlargedImage = styled.img`
  max-width: 100%;
  max-height: 80vh;
  border-radius: 12px;
  display: block;
  border: 2px solid #00ffff;
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
`

const LobbyScreen = () => {
  const { gameState, playerCoinImages, address, updateCoin, startGameEarly } = useBattleRoyaleGame()
  const handleStartEarly = async () => {
    try {
      await startGameEarly()
      // Hard redirect to avoid any transient React render errors
      if (gameState?.gameId) {
        setTimeout(() => {
          const roomType = gameState?.room_type || 'potion'
          window.location.href = `/test-tubes.html?gameId=${gameState.gameId}&room=${roomType}`
        }, 50)
      }
    } catch (e) {
      console.error('Start early error:', e)
    }
  }
  const { isContractInitialized } = useWallet()
  const { showToast } = useToast()
  
  const [isJoining, setIsJoining] = useState(false)
  // Simplified lobby: no coin selection
  const [showImageModal, setShowImageModal] = useState(false)
  const [escrowCheck, setEscrowCheck] = useState({ checking: false, inEscrow: null, error: null })
  const [claiming, setClaiming] = useState(false)

  // Escrow verification: check ownerOf(tokenId) equals contract address
  const verifyEscrow = useCallback(async () => {
    if (!gameState?.nftContract || !gameState?.nftTokenId) return
    setEscrowCheck({ checking: true, inEscrow: null, error: null })
    try {
      const owner = await contractService.publicClient.readContract({
        address: gameState.nftContract,
        abi: [
          {
            inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
            name: 'ownerOf',
            outputs: [{ internalType: 'address', name: '', type: 'address' }],
            stateMutability: 'view',
            type: 'function'
          }
        ],
        functionName: 'ownerOf',
        args: [BigInt(gameState.nftTokenId)]
      })
      const inEscrow = owner?.toLowerCase() === contractService.contractAddress.toLowerCase()
      setEscrowCheck({ checking: false, inEscrow, error: null })
    } catch (e) {
      setEscrowCheck({ checking: false, inEscrow: null, error: e?.message || 'Failed to verify' })
    }
  }, [gameState])

  if (!gameState) return null

  const isCreator = gameState.creator?.toLowerCase() === address?.toLowerCase()
  const userInGame = gameState.playerSlots?.some(addr => addr?.toLowerCase() === address?.toLowerCase())
  const canJoin = !userInGame && gameState.currentPlayers < 4

  // Winner claim gate: only show if player is winner and server marked completed
  const isWinner = gameState?.winner && gameState.winner.toLowerCase?.() === address?.toLowerCase?.()
  const canClaim = isWinner && gameState?.phase === 'completed'

  const handleJoinGame = async () => {
    if (!isContractInitialized || !contractService) {
      showToast('Connect your wallet first', 'error')
      return
    }

    setIsJoining(true)
    try {
      showToast('Opening MetaMask...', 'info')
      // Read on-chain entryFee and serviceFee, pay exact sum (wei)
      const gameIdBytes32 = contractService.getGameIdBytes32(gameState.gameId)
      const onchain = await contractService.publicClient.readContract({
        address: contractService.contractAddress,
        abi: [
          {
            inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
            name: 'battleRoyaleGames',
            outputs: [
              { internalType: 'address', name: 'creator', type: 'address' },
              { internalType: 'address', name: 'nftContract', type: 'address' },
              { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
              { internalType: 'uint256', name: 'entryFee', type: 'uint256' },
              { internalType: 'uint256', name: 'serviceFee', type: 'uint256' },
              { internalType: 'uint8', name: 'maxPlayers', type: 'uint8' },
              { internalType: 'uint8', name: 'currentPlayers', type: 'uint8' },
              { internalType: 'address', name: 'winner', type: 'address' },
              { internalType: 'bool', name: 'completed', type: 'bool' },
              { internalType: 'bool', name: 'creatorPaid', type: 'bool' },
              { internalType: 'bool', name: 'nftClaimed', type: 'bool' },
              { internalType: 'uint256', name: 'totalPool', type: 'uint256' },
              { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
              { internalType: 'bool', name: 'isUnder20', type: 'bool' },
              { internalType: 'uint256', name: 'minUnder20Wei', type: 'uint256' }
            ],
            stateMutability: 'view',
            type: 'function'
          }
        ],
        functionName: 'battleRoyaleGames',
        args: [gameIdBytes32]
      })
      const entryFeeWei = onchain[3]
      const serviceFeeWei = onchain[4]
      const totalWei = (BigInt(entryFeeWei) + BigInt(serviceFeeWei)).toString()
      const totalAmountETH = ethers.formatEther(totalWei)
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

  // Coin click removed

  // Coin selection removed

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

  const handleClaimNFT = async () => {
    if (!canClaim) return
    try {
      setClaiming(true)
      const res = await contractService.withdrawBattleRoyaleWinnerNFT(gameState.gameId)
      if (res.success) {
        showToast('NFT claimed successfully!', 'success')
      } else {
        showToast(res.error || 'Failed to claim NFT', 'error')
      }
    } catch (e) {
      showToast(e?.message || 'Failed to claim NFT', 'error')
    } finally {
      setClaiming(false)
    }
  }

  const [isCancelling, setIsCancelling] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  
  const handleCancelGame = async () => {
    if (!confirm('Are you sure you want to cancel this game? You will be able to reclaim your NFT from your profile.')) {
      return
    }
    
    try {
      setIsCancelling(true)
      const response = await fetch(`/api/battle-royale/${gameState.gameId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator: address })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel game')
      }
      
      showToast('Game cancelled successfully. You can reclaim your NFT from your profile.', 'success')
      
      // Redirect to profile after short delay
      setTimeout(() => {
        window.location.href = `/profile/${address}`
      }, 2000)
      
    } catch (error) {
      console.error('Cancel game error:', error)
      showToast(error.message || 'Failed to cancel game', 'error')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleLeaveGame = async () => {
    if (!confirm('Are you sure you want to leave this game? You will get your entry fee back (service fee is non-refundable).')) {
      return
    }
    
    try {
      setIsLeaving(true)
      showToast('Withdrawing your entry fee...', 'info')
      
      // Withdraw from smart contract
      const result = await contractService.withdrawBattleRoyaleEntry(gameState.gameId)
      
      if (result.success) {
        // Notify server to update database and broadcast
        try {
          await fetch(`/api/battle-royale/${gameState.gameId}/leave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              player: address,
              transactionHash: result.transactionHash 
            })
          })
        } catch (apiError) {
          console.warn('Database update failed, but withdrawal succeeded:', apiError)
        }
        
        showToast('Successfully left the game! Your entry fee has been refunded.', 'success')
        
        // Refresh the page to update player list
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        showToast(result.error || 'Failed to leave game', 'error')
      }
      
    } catch (error) {
      console.error('Leave game error:', error)
      showToast(error.message || 'Failed to leave game', 'error')
    } finally {
      setIsLeaving(false)
    }
  }

  return (
    <Container>
      {/* LEFT: NFT INFO */}
      <NFTPanel>
        <h2 style={{ color: '#00ffff', marginTop: 0, fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 10px rgba(0, 255, 255, 0.5)' }}>🎨 NFT Prize</h2>
        
        <NFTImageContainer onClick={() => setShowImageModal(true)}>
          <NFTImage src={gameState.nftImage} alt={gameState.nftName} />
        </NFTImageContainer>
        
        <ActionButton onClick={verifyEscrow} style={{ marginTop: '0.5rem' }}>
          {escrowCheck.checking ? 'Checking escrow...' : '✅ Verify NFT is in escrow'}
        </ActionButton>
        {escrowCheck.inEscrow === true && (
          <div style={{ color: '#00ff88', fontWeight: 'bold' }}>NFT is held in the game contract</div>
        )}
        {escrowCheck.inEscrow === false && (
          <div style={{ color: '#ff6b6b', fontWeight: 'bold' }}>Warning: NFT not found in escrow</div>
        )}
        {escrowCheck.error && (
          <div style={{ color: '#ffa500', fontWeight: 'bold' }}>{escrowCheck.error}</div>
        )}
        
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
          <span>Service Fee:</span>
          <strong style={{ color: '#ffa500' }}>${formatEntryFee(gameState.serviceFee)}</strong>
        </InfoRow>
        <InfoRow>
          <span>Creator:</span>
          <strong>{formatAddress(gameState.creator)}</strong>
        </InfoRow>
        <InfoRow>
          <span>Room:</span>
          <strong style={{ 
            color: gameState.room_type === 'lab' ? '#00ff88' : 
                   gameState.room_type === 'cyber' ? '#ff6600' : 
                   gameState.room_type === 'mech' ? '#ff0000' : '#ff8800' 
          }}>
            {gameState.room_type === 'lab' ? '🧪 The Lab' : 
             gameState.room_type === 'cyber' ? '🤖 Cyber Bay' : 
             gameState.room_type === 'mech' ? '🔧 Mech Room' : '🧙 Potion Room'}
          </strong>
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
          {gameState.status === 'cancelled' || gameState.phase === 'cancelled' ? (
            <>
              <div style={{
                background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                border: '3px solid #ff0000',
                borderRadius: '15px',
                padding: '1.5rem',
                marginBottom: '1rem',
                boxShadow: '0 0 20px rgba(255, 0, 0, 0.5)',
                animation: 'pulse 2s infinite'
              }}>
                <h2 style={{ 
                  color: '#fff', 
                  fontSize: '2rem', 
                  margin: '0 0 0.5rem 0',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                }}>
                  ⛔ GAME CANCELLED ⛔
                </h2>
                <p style={{ 
                  fontSize: '1.1rem', 
                  margin: 0, 
                  color: '#ffee00',
                  fontWeight: 'bold' 
                }}>
                  This game has been cancelled by the creator
                </p>
              </div>
              <p style={{ fontSize: '1rem', color: '#ffaa00', margin: 0 }}>
                Players: Use the "Withdraw Entry Fee" button below
              </p>
            </>
          ) : (
            <>
              <h2>⏳ Waiting for Players</h2>
              <p style={{ fontSize: '1.2rem', margin: 0 }}>
                {gameState.currentPlayers} / 4 Players
              </p>
            </>
          )}
          {isCreator && gameState.currentPlayers >= 2 && (
            <JoinActionButton
              onClick={handleStartEarly}
              style={{ marginTop: '1rem', background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
            >
              🚀 Start Game Early ({gameState.currentPlayers}/4)
            </JoinActionButton>
          )}
          {isCreator && gameState.status !== 'cancelled' && gameState.currentPlayers < 4 && (
            <JoinActionButton
              onClick={handleCancelGame}
              disabled={isCancelling}
              style={{ marginTop: '1rem', background: 'linear-gradient(135deg, #ff4444, #cc0000)' }}
            >
              {isCancelling ? 'Cancelling...' : '❌ Cancel Flip'}
            </JoinActionButton>
          )}
          {canClaim && (
            <JoinActionButton onClick={handleClaimNFT} disabled={claiming} style={{ marginTop: '1rem', background: 'linear-gradient(135deg, #00c853, #00e676)' }}>
              {claiming ? 'Claiming...' : '🏆 Claim NFT'}
            </JoinActionButton>
          )}
        </StatusBar>

        <PlayerGrid>
          {Array.from({ length: 4 }, (_, i) => {
            const playerAddr = gameState.playerOrder?.[i] || gameState.playerSlots?.[i]
            const player = playerAddr ? gameState.players?.[playerAddr.toLowerCase()] : null
            const isCurrentUser = playerAddr?.toLowerCase() === address?.toLowerCase()
            const images = null

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
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                      <div style={{ width: '140px', height: '140px', borderRadius: '10px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)' }}>
                        <ProfilePicture address={playerAddr} size={140} fallbackEmoji="😊" />
                      </div>
                      <div style={{ color: '#00ffff', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center' }}>
                        {player?.username || player?.name || `Player ${i + 1}`}
                      </div>
                      <div style={{ color: '#cccccc', fontSize: '0.7rem', textAlign: 'center' }}>
                        {formatAddress(playerAddr)}
                      </div>
                      {player.isCreator && (
                        <div style={{ color: '#FFD700', fontSize: '0.7rem', fontWeight: 'bold' }}>
                          👑 Creator
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#9d00ff', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center', textShadow: '0 0 10px rgba(157, 0, 255, 0.5)' }}>
                    {canJoin ? '➕ Click to Join' : 'Empty'}
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
        
        {userInGame && !isCreator && gameState.currentPlayers < 4 && gameState.status !== 'cancelled' && gameState.phase !== 'cancelled' && (
          <JoinActionButton 
            onClick={handleLeaveGame} 
            disabled={isLeaving}
            style={{ 
              marginTop: '1rem', 
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
              border: '2px solid #ff4444'
            }}
          >
            {isLeaving ? 'Leaving...' : '🚪 Leave Game'}
          </JoinActionButton>
        )}
        
        {userInGame && !isCreator && (gameState.status === 'cancelled' || gameState.phase === 'cancelled') && (
          <JoinActionButton 
            onClick={handleLeaveGame} 
            disabled={isLeaving}
            style={{ 
              marginTop: '1rem', 
              background: 'linear-gradient(135deg, #ffa500, #ff8c00)',
              border: '2px solid #ff6b00'
            }}
          >
            {isLeaving ? 'Withdrawing...' : '💰 Withdraw Entry Fee'}
          </JoinActionButton>
        )}
      </GamePanel>

      {/* Coin selector removed in lobby */}

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