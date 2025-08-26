import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { ethers } from 'ethers'
import { useToast } from '../../contexts/ToastContext'
import { useContractService } from '../../utils/useContractService'
import { getApiUrl } from '../../config/api'

const OverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 20, 0.95);
  border: 2px solid #00FF41;
  border-radius: 1rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  animation: slideIn 0.5s ease-out;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

const OverlayTitle = styled.h2`
  color: #00FF41;
  font-size: 1.8rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 1rem;
  text-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
`

const OverlaySubtitle = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  text-align: center;
  margin-bottom: 2rem;
`

const CountdownContainer = styled.div`
  background: ${props => props.isUrgent ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 165, 0, 0.2)'};
  border: 2px solid ${props => props.isUrgent ? '#ff0000' : '#ffa500'};
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin: 1rem 0;
  animation: ${props => props.isUrgent ? 'urgentPulse 1s infinite' : 'none'};
  
  @keyframes urgentPulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
`

const CountdownText = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props.isUrgent ? '#ff0000' : '#ffa500'};
  margin-bottom: 0.5rem;
`

const CountdownLabel = styled.div`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
`

const PriceDisplay = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: #00FF41;
  margin: 1rem 0;
  text-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
`

const DepositButton = styled.button`
  background: linear-gradient(45deg, #00FF41, #39FF14);
  color: #000;
  border: none;
  padding: 1rem 3rem;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0, 255, 65, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.8);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }
`

const OfferAcceptanceOverlay = ({ 
  isVisible, 
  acceptedOffer, 
  gameData, 
  gameId, 
  address, 
  onClose, 
  onDepositComplete 
}) => {
  const { showSuccess, showError, showInfo } = useToast()
  const { contractService } = useContractService()
  const [timeLeft, setTimeLeft] = useState(120) // 2 minutes
  const [isDepositing, setIsDepositing] = useState(false)
  const [deadline, setDeadline] = useState(null)

  // Set deadline when overlay becomes visible
  useEffect(() => {
    if (isVisible && acceptedOffer) {
      console.log('🎯 OfferAcceptanceOverlay: Setting deadline for offer:', acceptedOffer)
      const newDeadline = new Date(Date.now() + 120000) // 2 minutes from now
      setDeadline(newDeadline)
      setTimeLeft(120)
    }
  }, [isVisible, acceptedOffer])

  // Countdown timer
  useEffect(() => {
    if (!isVisible || !deadline) return

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = deadline.getTime() - now
      
      if (distance <= 0) {
        setTimeLeft(0)
        clearInterval(timer)
        showError('Deposit time expired!')
        onClose()
      } else {
        setTimeLeft(Math.floor(distance / 1000))
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [isVisible, deadline, showError, onClose])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleDeposit = async () => {
    if (!acceptedOffer || !gameData) return

    setIsDepositing(true)
    try {
      showInfo('Processing deposit...')
      
      const depositAmount = acceptedOffer.cryptoAmount || gameData.payment_amount
      
      const result = await contractService.depositETH(gameId, depositAmount)

      if (result.success) {
        showSuccess('Deposit successful! Game starting...')
        onDepositComplete(acceptedOffer)
      } else {
        showError(result.error || 'Deposit failed')
      }
    } catch (error) {
      console.error('Deposit error:', error)
      showError('Deposit failed: ' + error.message)
    } finally {
      setIsDepositing(false)
    }
  }

  console.log('🎯 OfferAcceptanceOverlay render:', { 
    isVisible, 
    acceptedOffer: !!acceptedOffer, 
    timeLeft,
    acceptedOfferKeys: acceptedOffer ? Object.keys(acceptedOffer) : [],
    acceptedOfferData: acceptedOffer,
    gameDataPrice: gameData?.payment_amount,
    gameDataPriceUsd: gameData?.price_usd
  })
  
  if (!isVisible || !acceptedOffer) return null

  const isUrgent = timeLeft <= 30
  // Try multiple possible price sources
  const offerAmount = acceptedOffer.cryptoAmount || 
                     acceptedOffer.offer_price || 
                     acceptedOffer.amount || 
                     gameData?.payment_amount || 
                     gameData?.price_usd || 
                     0

  return (
    <OverlayContainer>
      <CloseButton onClick={onClose}>✕</CloseButton>
      
      <OverlayTitle>🎯 Offer Accepted!</OverlayTitle>
      <OverlaySubtitle>
        {acceptedOffer.offerer_address === address 
          ? 'You need to deposit to join the game'
          : 'Waiting for challenger to deposit'
        }
      </OverlaySubtitle>

      <CountdownContainer isUrgent={isUrgent}>
        <CountdownText isUrgent={isUrgent}>
          {formatTime(timeLeft)}
        </CountdownText>
        <CountdownLabel>
          {isUrgent ? '⚠️ Time running out!' : '⏰ Deposit time remaining'}
        </CountdownLabel>
      </CountdownContainer>

      <PriceDisplay>
        ${offerAmount.toFixed(2)} USD
      </PriceDisplay>

      {acceptedOffer.offerer_address === address && (
        <DepositButton
          onClick={handleDeposit}
          disabled={isDepositing || timeLeft === 0}
        >
          {isDepositing ? 'Processing...' : 'Deposit Now'}
        </DepositButton>
      )}

      {acceptedOffer.offerer_address !== address && (
        <OverlaySubtitle>
          Waiting for {acceptedOffer.offerer_address?.slice(0, 6)}...{acceptedOffer.offerer_address?.slice(-4)} to deposit
        </OverlaySubtitle>
      )}
    </OverlayContainer>
  )
}

export default OfferAcceptanceOverlay
