import React from 'react'
import styled from '@emotion/styled'
import { ethers } from 'ethers'
import { useToast } from '../../contexts/ToastContext'
import { useContractService } from '../../utils/useContractService'
import { getApiUrl } from '../../config/api'

// Styled Components
const PaymentSection = styled.div`
  background: rgba(0, 0, 20, 0.95);
  border: 2px solid ${props => props.theme.colors.neonPink};
  border-radius: 1.5rem;
  padding: 2rem;
  margin-bottom: 2rem;
  text-align: center;
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.3);
  
  @keyframes pulse {
    0% { transform: scale(1); box-shadow: 0 0 20px rgba(255, 20, 147, 0.5); }
    50% { transform: scale(1.02); box-shadow: 0 0 30px rgba(255, 20, 147, 0.8); }
    100% { transform: scale(1); box-shadow: 0 0 20px rgba(255, 20, 147, 0.5); }
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const NFTPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`

const NFTImage = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 1rem;
  object-fit: cover;
  border: 2px solid ${props => props.theme.colors.neonBlue};
`

const NFTInfo = styled.div`
  text-align: left;
  flex: 1;
`

const PriceDisplay = styled.div`
  font-size: 3rem;
  font-weight: bold;
  color: ${props => props.theme.colors.neonGreen};
  margin: 1rem 0;
  text-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
`

const PayButton = styled.button`
  background: linear-gradient(45deg, #00FF41, #39FF14);
  color: #000;
  border: none;
  padding: 1rem 3rem;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0, 255, 65, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const DepositCountdown = styled.div`
  background: ${props => props.isUrgent ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 165, 0, 0.2)'};
  border: 2px solid ${props => props.isUrgent ? '#ff0000' : '#ffa500'};
  border-radius: 0.75rem;
  padding: 1rem;
  text-align: center;
  margin: 1rem 0;
  animation: ${props => props.isUrgent ? 'urgentPulse 1s infinite' : 'none'};
  
  @keyframes urgentPulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
`

const CreatorCountdown = styled.div`
  background: rgba(255, 165, 0, 0.1);
  border: 2px solid #ffa500;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  text-align: center;
`

const GamePayment = ({ 
  gameData, 
  gameId, 
  address, 
  depositTimeLeft, 
  ethAmount, 
  contractInitialized,
  countdownInterval,
  getGameCreator,
  getGameJoiner,
  getGamePrice,
  getGameNFTImage,
  getGameNFTName,
  getGameNFTCollection,
  isCreator,
  isJoiner,
  formatTimeLeft,
  startDepositCountdown,
  loadGameData
}) => {
  const { showInfo, showSuccess, showError } = useToast()
  const { contractService } = useContractService()
  const [isDepositing, setIsDepositing] = React.useState(false)

  const handleDeposit = async () => {
    try {
      setIsDepositing(true)
      
      // ALWAYS calculate fresh ETH amount from contract (never use stored value)
      console.log('💰 Calculating fresh ETH amount from contract...')
      
      const priceUSD = gameData?.price_usd || gameData?.payment_amount || gameData?.final_price || 0
      
      if (!priceUSD || priceUSD <= 0) {
        throw new Error('Invalid game price')
      }
      
      // Get fresh ETH amount from contract's Chainlink price feed
      const freshEthAmount = await contractService.contract.getETHAmount(
        ethers.parseUnits(priceUSD.toString(), 6)
      )
      
      console.log('📊 Fresh calculation from Chainlink:', {
        priceUSD: priceUSD,
        ethAmount: ethers.formatEther(freshEthAmount),
        ethAmountWei: freshEthAmount.toString()
      })
      
      // Now deposit with the correctly calculated amount
      const result = await contractService.depositETH(gameId, freshEthAmount)
      if (result.success) {
        showSuccess('ETH deposited successfully!')
        
        // Clear countdown
        if (countdownInterval) {
          clearInterval(countdownInterval)
        }
        
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
        
        // Reload game data
        loadGameData()
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

  // Show payment section for challenger who needs to deposit
  // Also check if current user is the challenger from the offer
  const isChallenger = gameData?.challenger && address && 
    gameData.challenger.toLowerCase() === address.toLowerCase()
    
  if (gameData?.status === 'waiting_challenger_deposit' && 
      (isJoiner() || isChallenger) && 
      !gameData?.challenger_deposited) {
    return (
      <PaymentSection style={{ animation: 'pulse 2s infinite' }}>
        <h2 style={{ color: '#FF1493', marginBottom: '1rem' }}>
          ⏰ Your Offer Was Accepted! Deposit Required
        </h2>
        
        {/* Countdown Timer */}
        {depositTimeLeft !== null && (
          <DepositCountdown isUrgent={depositTimeLeft < 30}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: depositTimeLeft < 30 ? '#ff0000' : '#ffa500' }}>
              {formatTimeLeft(depositTimeLeft)}
            </div>
            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Time remaining to deposit
            </div>
          </DepositCountdown>
        )}
        
        <NFTPreview>
          <NFTImage src={getGameNFTImage()} alt={getGameNFTName()} />
          <NFTInfo>
            <h3>{getGameNFTName()}</h3>
            <p>{getGameNFTCollection()}</p>
            <p style={{ color: '#CCCCCC', fontSize: '0.9rem' }}>
              Creator has already deposited this NFT!
            </p>
          </NFTInfo>
        </NFTPreview>
        
        <PriceDisplay>${(getGamePrice() || 0).toFixed(2)} USD</PriceDisplay>
        
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
          disabled={!contractInitialized || depositTimeLeft === 0 || isDepositing}
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
              ⏰ Deposit timeout! The game has been cancelled and the listing is open for new offers.
            </p>
          </div>
        )}
      </PaymentSection>
    )
  }

  // Show countdown for creator waiting for challenger deposit
  if (gameData?.status === 'waiting_challenger_deposit' && isCreator() && depositTimeLeft !== null) {
    return (
      <CreatorCountdown>
        <h4 style={{ color: '#ffa500', margin: '0 0 0.5rem 0' }}>
          ⏰ Waiting for Challenger to Deposit
        </h4>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: depositTimeLeft < 30 ? '#ff0000' : '#ffa500' }}>
          {formatTimeLeft(depositTimeLeft)}
        </div>
        <p style={{ fontSize: '0.8rem', color: '#CCCCCC', margin: '0.5rem 0 0 0' }}>
          If challenger doesn't deposit, listing will reopen for new offers
        </p>
      </CreatorCountdown>
    )
  }

  // No payment UI needed
  return null
}

export default GamePayment 