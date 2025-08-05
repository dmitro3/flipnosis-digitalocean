import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { ThemeProvider } from '@emotion/react'
import { useAccount } from 'wagmi'
import contractService from '../services/ContractService'
import { formatEther, formatUnits } from 'viem'
import { theme } from '../styles/theme'
import { createSafeTheme } from '../utils/styledComponentsHelper'

const RewardsContainer = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 2rem;
  margin: 2rem 0;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
`

const RewardsTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
`

const RewardItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`

const RewardAmount = styled.span`
  font-size: 1.2rem;
  font-weight: 600;
`

const ClaimButton = styled.button`
  background: white;
  color: #667eea;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  width: 100%;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const ClaimRewards = () => {
  const { address, isConnected } = useAccount()
  const [rewards, setRewards] = useState({ eth: 0n, usdc: 0n })
  const [loading, setLoading] = useState(false)
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    if (isConnected && address) {
      // checkRewards() // This function is no longer needed
    }
  }, [isConnected, address])

  // const checkRewards = async () => { // This function is no longer needed
  //   try {
  //     setLoading(true)
  //     const result = await contractService.getUnclaimedRewards(address)
  //     if (result && result.success) {
  //       setRewards({ eth: result.eth || 0n, usdc: result.usdc || 0n })
  //     }
  //   } catch (error) {
  //     console.error('Error checking rewards:', error)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const handleClaim = async () => {
    try {
      setClaiming(true)
      const result = await contractService.withdrawRewards()
      
      if (result && result.success) {
        alert('Rewards claimed successfully! 🎉')
        // Reset rewards
        setRewards({ eth: 0n, usdc: 0n })
      } else {
        alert('Failed to claim rewards: ' + (result?.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error claiming rewards:', error)
      alert('Error claiming rewards: ' + error.message)
    } finally {
      setClaiming(false)
    }
  }

  const hasRewards = rewards.eth > 0n || rewards.usdc > 0n

  if (!isConnected || loading || !hasRewards) {
    return null
  }

  return (
    <ThemeProvider theme={createSafeTheme(theme)}>
      <RewardsContainer>
        <RewardsTitle>Claim Your Rewards</RewardsTitle>
        
        {loading ? (
          <div>Loading rewards...</div>
        ) : (
          <>
            <RewardItem>
              <span>ETH Rewards:</span>
              <RewardAmount>{formatEther(rewards.eth)} ETH</RewardAmount>
            </RewardItem>
            
            <RewardItem>
              <span>USDC Rewards:</span>
              <RewardAmount>{formatUnits(rewards.usdc, 6)} USDC</RewardAmount>
            </RewardItem>
            
            <ClaimButton 
              onClick={handleClaim} 
              disabled={claiming || (rewards.eth === 0n && rewards.usdc === 0n)}
            >
              {claiming ? 'Claiming...' : 'Claim All Rewards'}
            </ClaimButton>
          </>
        )}
      </RewardsContainer>
    </ThemeProvider>
  )
}

export default ClaimRewards 