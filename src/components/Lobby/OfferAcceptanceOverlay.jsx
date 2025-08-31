import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { useToast } from '../../contexts/ToastContext'
import { useContractService } from '../../contexts/ContractServiceContext'
import { getApiUrl } from '../../config/api'

const OverlayContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  backdrop-filter: blur(10px);
`

const OverlayTitle = styled.h2`
  color: #00FF41;
  font-size: 2.5rem;
  margin: 0 0 1rem 0;
  text-align: center;
  text-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
`

const OverlaySubtitle = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin: 0 0 2rem 0;
`

const CountdownContainer = styled.div`
  text-align: center;
  margin: 2rem 0;
  padding: 1.5rem;
  background: ${props => props.isUrgent ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 165, 0, 0.1)'};
  border: 2px solid ${props => props.isUrgent ? '#ff0000' : '#ffa500'};
  border-radius: 1rem;
  animation: ${props => props.isUrgent ? 'pulse 1s infinite' : 'none'};
`

const CountdownText = styled.div`
  font-size: 3rem;
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

const NFTPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const NFTImage = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 0.5rem;
  object-fit: cover;
`

const NFTInfo = styled.div`
  h3 {
    margin: 0 0 0.25rem 0;
    color: #fff;
    font-size: 1rem;
  }
  
  p {
    margin: 0;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
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
      
      // Use the same logic as GamePayment
      const priceUSD = gameData?.price_usd || gameData?.payment_amount || gameData?.final_price || 0
      
      if (!priceUSD || priceUSD <= 0) {
        throw new Error('Invalid game price')
      }
      
      console.log('💰 Depositing with price:', priceUSD, 'USD')
      
      // Call depositETH with the USD price - contract will calculate ETH amount
      const result = await contractService.depositETH(gameId, priceUSD)
      
      if (result.success) {
        showSuccess('Crypto deposited successfully!')
        
        // Confirm deposit to backend
        await fetch(getApiUrl(`/games/${gameId}/deposit-confirmed`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            player: address,
            assetType: 'eth',
            transactionHash: result.transactionHash
          })
        })
        
        // Call onDepositComplete to trigger redirect to Flip Suite
        onDepositComplete(acceptedOffer)
      } else {
        showError(result.error || 'Failed to deposit ETH')
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
  const offerAmount = gameData?.price_usd || gameData?.payment_amount || gameData?.final_price || 0

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

      <NFTPreview>
        <NFTImage 
          src={gameData?.nft_image || '/placeholder-nft.svg'} 
          alt={gameData?.nft_name || 'NFT'} 
        />
        <NFTInfo>
          <h3>{gameData?.nft_name || 'NFT'}</h3>
          <p>{gameData?.nft_collection || 'Collection'}</p>
          <p style={{ color: '#CCCCCC', fontSize: '0.9rem' }}>
            Creator has already deposited this NFT!
          </p>
        </NFTInfo>
      </NFTPreview>

      <PriceDisplay>
        ${offerAmount.toFixed(2)} USD
      </PriceDisplay>

      <div style={{ 
        background: 'rgba(255, 255, 255, 0.1)', 
        padding: '1rem', 
        borderRadius: '0.5rem',
        marginBottom: '1rem'
      }}>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
          💎 ETH Amount: Calculating... ETH
        </p>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#CCCCCC' }}>
          Includes 3.5% platform fee
        </p>
      </div>

      {acceptedOffer.offerer_address === address && (
        <DepositButton
          onClick={handleDeposit}
          disabled={isDepositing || timeLeft === 0}
        >
          {timeLeft === 0 ? 'Deposit Timeout' : isDepositing ? 'Depositing...' : 'Deposit ETH & Start Game'}
        </DepositButton>
      )}

      {acceptedOffer.offerer_address !== address && (
        <OverlaySubtitle>
          Waiting for {acceptedOffer.offerer_address?.slice(0, 6)}...{acceptedOffer.offerer_address?.slice(-4)} to deposit
        </OverlaySubtitle>
      )}

      {timeLeft === 0 && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: 'rgba(255, 0, 0, 0.1)', 
          border: '1px solid rgba(255, 0, 0, 0.3)',
          borderRadius: '0.5rem'
        }}>
          <p style={{ color: '#ff6666', margin: 0 }}>
            ⏰ Deposit timeout! The game has been cancelled and the listing is open for new offers.
          </p>
        </div>
      )}
    </OverlayContainer>
  )
}

export default OfferAcceptanceOverlay
