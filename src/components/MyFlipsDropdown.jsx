import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styled from '@emotion/styled'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`

const DropdownButton = styled.button`
  background: linear-gradient(45deg, #00FF41, #39FF14);
  color: #000000;
  padding: 0.5rem 1.5rem;
  border-radius: 0.75rem;
  border: 2px solid #00FF41;
  font-weight: 600;
  cursor: pointer;
  transition: ${props => props.theme.transitions.default};
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 5px #00FF41, 0 0 10px #00FF41, 0 0 20px #00FF41;
  min-width: 120px;
  text-align: center;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transform: translateX(-100%);
    transition: ${props => props.theme.transitions.default};
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 10px #00FF41, 0 0 20px #00FF41, 0 0 40px #00FF41;
    
    &::before {
      transform: translateX(100%);
    }
  }
`

const DropdownContent = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: ${props => props.theme.colors.bgDark};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  min-width: 300px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 2100;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    min-width: 280px;
    max-width: 90vw;
    right: 0;
    left: auto;
  }
`

const FlipItem = styled.div`
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`

const FlipInfo = styled.div`
  flex: 1;
`

const FlipTitle = styled.div`
  color: ${props => props.theme.colors.neonPink};
  font-weight: 600;
  margin-bottom: 0.25rem;
`

const FlipStatus = styled.div`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem;
`

const CancelButton = styled.button`
  background: rgba(255, 20, 147, 0.1);
  color: ${props => props.theme.colors.neonPink};
  border: 1px solid ${props => props.theme.colors.neonPink};
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: ${props => props.theme.transitions.default};
  
  &:hover {
    background: rgba(255, 20, 147, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: ${props => props.theme.colors.textSecondary};
`

const MyFlipsDropdown = () => {
  const { address, isConnected } = useWallet()
  const { showSuccess, showError } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [myFlips, setMyFlips] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchMyFlips = async () => {
    if (!address) return
    
    try {
      setLoading(true)
      const API_URL = import.meta.env.VITE_API_URL || 'https://cryptoflipz2-production.up.railway.app'
      const response = await fetch(`${API_URL}/api/games?creator=${address}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch flips')
      }
      
      const data = await response.json()
      setMyFlips(data)
    } catch (error) {
      console.error('Error fetching my flips:', error)
      showError('Failed to load your flips')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && isConnected) {
      fetchMyFlips()
    }
  }, [isOpen, isConnected, address])

  const handleCancelFlip = async (gameId) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://cryptoflipz2-production.up.railway.app'
      const response = await fetch(`${API_URL}/api/games/${gameId}/delist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ creatorAddress: address })
      })
      
      if (!response.ok) {
        throw new Error('Failed to cancel flip')
      }
      
      showSuccess('Flip cancelled successfully')
      fetchMyFlips() // Refresh the list
    } catch (error) {
      console.error('Error cancelling flip:', error)
      showError('Failed to cancel flip')
    }
  }

  if (!isConnected) return null

  return (
    <DropdownContainer>
      <DropdownButton onClick={() => setIsOpen(!isOpen)}>
        My Flips
      </DropdownButton>
      {isOpen && (
        <DropdownContent>
          {loading ? (
            <EmptyState>Loading...</EmptyState>
          ) : myFlips.length === 0 ? (
            <EmptyState>No active flips found</EmptyState>
          ) : (
            myFlips.map(flip => (
              <FlipItem key={flip.id}>
                <FlipInfo>
                  <FlipTitle>{flip.nft_name || 'Unknown NFT'}</FlipTitle>
                  <FlipStatus>
                    Status: {flip.status}
                    {flip.joiner && ` • Joined by ${flip.joiner.slice(0, 6)}...${flip.joiner.slice(-4)}`}
                  </FlipStatus>
                </FlipInfo>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/game/${flip.id}`} style={{ textDecoration: 'none' }}>
                    <CancelButton>View</CancelButton>
                  </Link>
                  {flip.status === 'waiting' && (
                    <CancelButton 
                      onClick={() => handleCancelFlip(flip.id)}
                      disabled={loading}
                    >
                      Cancel
                    </CancelButton>
                  )}
                </div>
              </FlipItem>
            ))
          )}
        </DropdownContent>
      )}
    </DropdownContainer>
  )
}

export default MyFlipsDropdown 