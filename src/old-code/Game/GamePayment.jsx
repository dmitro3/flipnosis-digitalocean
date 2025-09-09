import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { ethers } from 'ethers'
import { useAccount } from 'wagmi'
import contractService from '../../services/ContractService'
import { getApiUrl } from '../../config/api'
import { useNotification } from '../../contexts/NotificationContext'
import useWebSocket from '../../utils/useWebSocket'

const PaymentSection = styled.div`
  background: linear-gradient(135deg, rgba(138, 43, 226, 0.1), rgba(30, 144, 255, 0.1));
  border: 2px solid rgba(138, 43, 226, 0.3);
  border-radius: 1rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const DepositCountdown = styled.div`
  text-align: center;
  padding: 1rem;
  background: ${props => props.$isUrgent ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 165, 0, 0.1)'};
  border: 2px solid ${props => props.$isUrgent ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 165, 0, 0.3)'};
  border-radius: 0.75rem;
`

const NFTPreview = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 0.75rem;
`

const NFTImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 0.5rem;
  object-fit: cover;
`

const NFTInfo = styled.div`
  flex: 1;
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: #FFFFFF;
  }
  
  p {
    margin: 0;
    color: #CCCCCC;
    font-size: 0.9rem;
  }
`

const PriceDisplay = styled.div`
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  color: #00BFFF;
  margin: 1rem 0;
`

const PayButton = styled.button`
  padding: 1rem 2rem;
  font-size: 1.2rem;
  font-weight: bold;
  background: linear-gradient(135deg, #FF1493, #00BFFF);
  border: none;
  border-radius: 0.75rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 0 30px rgba(255, 20, 147, 0.5);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const CreatorWaitingBox = styled.div`
  text-align: center;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(138, 43, 226, 0.3);
  border-radius: 0.75rem;
`

export default function GamePayment({ gameData, onDepositComplete }) {
  const { address } = useAccount()
  const { showSuccess, showError, showInfo } = useNotification()
  const { sendMessage: wsSend } = useWebSocket()
  
  const [depositTimeLeft, setDepositTimeLeft] = useState(null)
  const [isDepositing, setIsDepositing] = useState(false)
  const [ethAmount, setEthAmount] = useState(null)
  const [contractInitialized, setContractInitialized] = useState(false)
  
  // Initialize contract
  useEffect(() => {
    const init = async () => {
      try {
        await contractService.initialize()
        setContractInitialized(true)
      } catch (error) {
        console.error('Failed to initialize contract:', error)
        showError('Failed to connect to contract')
      }
    }
    init()
  }, [])
  
  // Calculate ETH amount
  useEffect(() => {
    if (!gameData?.payment_amount && !gameData?.price_usd) return
    
    const fetchEthAmount = async () => {
      try {
        const amount = gameData.payment_amount || gameData.price_usd
        const eth = await contractService.getETHAmount(amount)
        setEthAmount(eth)
      } catch (error) {
        console.error('Error calculating ETH amount:', error)
      }
    }
    
    fetchEthAmount()
  }, [gameData])
  
  // Deposit countdown
  useEffect(() => {
    if (!gameData?.deposit_deadline) return
    
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const deadline = new Date(gameData.deposit_deadline).getTime()
      const timeLeft = Math.max(0, deadline - now)
      
      if (timeLeft === 0) {
        clearInterval(interval)
        setDepositTimeLeft(0)
        showError('Deposit timeout! Game cancelled.')
      } else {
        setDepositTimeLeft(Math.floor(timeLeft / 1000))
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [gameData?.deposit_deadline])
  
  // Format time helper
  const formatTimeLeft = (seconds) => {
    if (seconds === null) return ''
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Check if current user is creator
  const isCreator = () => {
    return address && gameData?.creator && 
      address.toLowerCase() === gameData.creator.toLowerCase()
  }
  
  // Check if current user is challenger/joiner
  const isChallenger = () => {
    return address && gameData?.challenger && 
      address.toLowerCase() === gameData.challenger.toLowerCase()
  }
  
  // Handle ETH deposit
  const handleDeposit = async () => {
    if (!ethAmount || !contractInitialized) {
      showError('Cannot process deposit at this time')
      return
    }
    
    setIsDepositing(true)
    
    try {
      showInfo('Processing deposit...')
      
      const depositAmount = gameData.payment_amount || gameData.price_usd
      console.log('💎 Depositing ETH:', {
        amount: depositAmount,
        ethAmount: ethers.formatEther(ethAmount),
        gameId: gameData.id
      })
      
      // Call contract to deposit ETH
      const result = await contractService.depositETH(gameData.id, depositAmount)
      
      if (result.success) {
        showSuccess('Deposit successful! Confirming with server...')
        
        // Confirm deposit to backend via WebSocket
        wsSend({
          type: 'deposit_confirmed',
          gameId: gameData.id,
          assetType: 'eth',
          transactionHash: result.transactionHash,
          player: address
        })
        
        // Also confirm via HTTP as backup
        await fetch(getApiUrl(`/games/${gameData.id}/deposit-confirmed`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            player: address,
            assetType: 'eth',
            transactionHash: result.transactionHash
          })
        })
        
        // Notify parent component
        if (onDepositComplete) {
          onDepositComplete({
            success: true,
            transactionHash: result.transactionHash
          })
        }
        
        showSuccess('Deposit confirmed! Waiting for game to start...')
      } else {
        showError(result.error || 'Failed to deposit ETH')
      }
    } catch (error) {
      console.error('❌ Deposit failed:', error)
      showError(`Failed to deposit: ${error.message}`)
    } finally {
      setIsDepositing(false)
    }
  }
  
  // Handle NFT deposit (for creator)
  const handleNFTDeposit = async () => {
    setIsDepositing(true)
    
    try {
      showInfo('Confirming NFT deposit...')
      
      // For MVP, we assume NFT is already locked when game was created
      // Just confirm to server
      wsSend({
        type: 'deposit_confirmed',
        gameId: gameData.id,
        assetType: 'nft',
        player: address
      })
      
      // Also confirm via HTTP as backup
      await fetch(getApiUrl(`/games/${gameData.id}/deposit-confirmed`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: address,
          assetType: 'nft'
        })
      })
      
      showSuccess('NFT deposit confirmed!')
      
      if (onDepositComplete) {
        onDepositComplete({ success: true })
      }
    } catch (error) {
      console.error('❌ NFT deposit confirmation failed:', error)
      showError('Failed to confirm NFT deposit')
    } finally {
      setIsDepositing(false)
    }
  }
  
  // Render different UI based on game state and user role
  
  // Show deposit UI for challenger
  if (gameData?.status === 'waiting_challenger_deposit' && isChallenger() && !gameData?.challenger_deposited) {
    return (
      <PaymentSection style={{ animation: 'pulse 2s infinite' }}>
        <h2 style={{ color: '#FF1493', marginBottom: '1rem' }}>
          ⏰ Your Offer Was Accepted! Deposit Required
        </h2>
        
        {/* Countdown Timer */}
        {depositTimeLeft !== null && (
          <DepositCountdown $isUrgent={depositTimeLeft < 30}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: depositTimeLeft < 30 ? '#ff0000' : '#ffa500' }}>
              {formatTimeLeft(depositTimeLeft)}
            </div>
            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Time remaining to deposit
            </div>
          </DepositCountdown>
        )}
        
        <NFTPreview>
          <NFTImage 
            src={gameData.nft_image || '/nft-placeholder.png'} 
            alt={gameData.nft_name || 'NFT'} 
          />
          <NFTInfo>
            <h3>{gameData.nft_name || 'NFT'}</h3>
            <p>{gameData.nft_collection || 'Collection'}</p>
            <p style={{ color: '#00FF00' }}>
              ✅ Creator has deposited this NFT!
            </p>
          </NFTInfo>
        </NFTPreview>
        
        <PriceDisplay>${(gameData.payment_amount || gameData.price_usd || 0).toFixed(2)} USD</PriceDisplay>
        
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          padding: '1rem', 
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
            💎 ETH Amount: {ethAmount ? ethers.formatEther(ethAmount) : 'Calculating...'} ETH
          </p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#CCCCCC' }}>
            Includes 3.5% platform fee
          </p>
        </div>
        
        <PayButton
          onClick={handleDeposit}
          disabled={!contractInitialized || depositTimeLeft === 0 || isDepositing || !ethAmount}
        >
          {depositTimeLeft === 0 ? 'Deposit Timeout' : isDepositing ? 'Depositing...' : 'Deposit ETH & Start Game'}
        </PayButton>
        
        {depositTimeLeft === 0 && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: 'rgba(255, 0, 0, 0.1)', 
            border: '1px solid rgba(255, 0, 0, 0.3)',
            borderRadius: '0.5rem'
          }}>
            <p style={{ color: '#ff6666', margin: 0 }}>
              ⏰ Deposit timeout! The game has been cancelled.
            </p>
          </div>
        )}
      </PaymentSection>
    )
  }
  
  // Show waiting UI for creator
  if (gameData?.status === 'waiting_challenger_deposit' && isCreator()) {
    return (
      <PaymentSection>
        <CreatorWaitingBox>
          <h3 style={{ color: '#ffa500', marginBottom: '1rem' }}>
            ⏰ Waiting for Challenger to Deposit
          </h3>
          
          {depositTimeLeft !== null && (
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: depositTimeLeft < 30 ? '#ff0000' : '#ffa500' }}>
              {formatTimeLeft(depositTimeLeft)}
            </div>
          )}
          
          <p style={{ color: '#CCCCCC', marginTop: '1rem' }}>
            The challenger needs to deposit ${(gameData.payment_amount || gameData.price_usd || 0).toFixed(2)} worth of ETH
          </p>
          
          {!gameData?.creator_deposited && (
            <PayButton
              onClick={handleNFTDeposit}
              disabled={isDepositing}
              style={{ marginTop: '1rem' }}
            >
              {isDepositing ? 'Confirming...' : 'Confirm NFT Deposit'}
            </PayButton>
          )}
        </CreatorWaitingBox>
      </PaymentSection>
    )
  }
  
  // Show "waiting for players" for active games
  if (gameData?.status === 'active') {
    return (
      <PaymentSection>
        <CreatorWaitingBox>
          <h3 style={{ color: '#00FF00' }}>✅ Game Active!</h3>
          <p>Both players have deposited. Game will start shortly...</p>
        </CreatorWaitingBox>
      </PaymentSection>
    )
  }
  
  // Default: No payment needed
  return null
}
