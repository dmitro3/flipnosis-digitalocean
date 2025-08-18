import React, { useState, useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
import contractService from '../services/ContractService'

const NFTDepositBadge = ({ gameId, isListing, nftDeposited, nftDepositVerified }) => {
  const [depositStatus, setDepositStatus] = useState(null)
  const [isChecking, setIsChecking] = useState(false)
  const { showError } = useToast()

  useEffect(() => {
    if (!isListing) {
      // For actual games, check the database status first
      if (nftDeposited !== undefined) {
        setDepositStatus({
          deposited: nftDeposited,
          verified: nftDepositVerified || false
        })
      } else {
        // Fallback to contract check if database status not available
        checkNFTDeposit()
      }
    }
  }, [gameId, isListing, nftDeposited, nftDepositVerified])

  const checkNFTDeposit = async () => {
    if (isChecking) return
    
    try {
      setIsChecking(true)
      const gameState = await contractService.getGameState(gameId)
      
      if (gameState.success) {
        setDepositStatus({
          deposited: gameState.gameState.nftDeposit.hasDeposit,
          verified: true
        })
      } else {
        setDepositStatus({
          deposited: false,
          verified: false
        })
      }
    } catch (error) {
      console.error('Error checking NFT deposit:', error)
      setDepositStatus({
        deposited: false,
        verified: false
      })
    } finally {
      setIsChecking(false)
    }
  }

  // Don't show badge for listings
  if (isListing) return null

  // Show loading state
  if (depositStatus === null) {
    return (
      <div style={{
        background: 'rgba(128, 128, 128, 0.2)',
        color: '#808080',
        padding: '0.1rem 0.3rem',
        borderRadius: '0.2rem',
        fontSize: '0.6rem',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '0.2rem'
      }}>
        <span>⏳</span>
        <span>Checking...</span>
      </div>
    )
  }

  // Show deposit status
  const isDeposited = depositStatus.deposited
  const isVerified = depositStatus.verified

  return (
    <div style={{
      background: isDeposited && isVerified ? 'rgba(0, 255, 65, 0.2)' : 
                 isDeposited && !isVerified ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 0, 0, 0.2)',
      color: isDeposited && isVerified ? '#00FF41' : 
             isDeposited && !isVerified ? '#FFC107' : '#FF0000',
      padding: '0.1rem 0.3rem',
      borderRadius: '0.2rem',
      fontSize: '0.6rem',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '0.2rem',
      cursor: isChecking ? 'not-allowed' : 'pointer',
      opacity: isChecking ? 0.7 : 1
    }}
    onClick={!isChecking ? checkNFTDeposit : undefined}
    title={isChecking ? 'Checking...' : 'Click to refresh NFT status'}
    >
      <span>
        {isDeposited && isVerified ? '✅' : 
         isDeposited && !isVerified ? '⚠️' : '❌'}
      </span>
      <span>
        {isDeposited && isVerified ? 'NFT Ready' : 
         isDeposited && !isVerified ? 'Verifying...' : 'NFT Missing'}
      </span>
    </div>
  )
}

export default NFTDepositBadge
