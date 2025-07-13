import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from '@emotion/styled'
import { useWallet } from '../contexts/WalletContext'

const DropdownContainer = styled.div`
  position: relative;
`

const DropdownButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${props => props.hasNotifications ? '#FF1493' : 'rgba(255, 255, 255, 0.2)'};
  color: ${props => props.theme?.colors?.textPrimary || '#ffffff'};
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: ${props => props.theme?.colors?.neonGreen || '#00FF41'};
  }
`

const NotificationBadge = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  background: ${props => props.theme?.colors?.neonPink || '#FF1493'};
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  box-shadow: 0 0 10px ${props => props.theme?.colors?.neonPink || '#FF1493'};
`

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  min-width: 250px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transform: translateY(${props => props.isOpen ? 0 : '-10px'});
  transition: all 0.3s ease;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 65, 0.3);
    border-radius: 3px;
  }
`

const MenuItem = styled(Link)`
  display: block;
  padding: 1rem;
  color: ${props => props.theme?.colors?.textPrimary || '#ffffff'};
  text-decoration: none;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:hover {
    background: rgba(0, 255, 65, 0.1);
    color: ${props => props.theme?.colors?.neonGreen || '#00FF41'};
  }
  
  &:last-child {
    border-bottom: none;
  }
`

const GameItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const GameInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const GameTitle = styled.div`
  font-weight: 600;
`

const GameStatus = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme?.colors?.textSecondary || 'rgba(255, 255, 255, 0.7)'};
`

const OfferBadge = styled.div`
  background: ${props => props.theme?.colors?.neonPink || '#FF1493'};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
`

const ViewAllButton = styled(MenuItem)`
  text-align: center;
  font-weight: 600;
  background: rgba(0, 255, 65, 0.1);
  
  &:hover {
    background: rgba(0, 255, 65, 0.2);
  }
`

const MyFlipsDropdown = () => {
  const navigate = useNavigate()
  const { address, isConnected } = useWallet()
  const [isOpen, setIsOpen] = useState(false)
  const [listings, setListings] = useState([])
  const [notifications, setNotifications] = useState([])
  const dropdownRef = useRef(null)
  
  useEffect(() => {
    if (!isConnected || !address) return
    
    // Fetch user's active listings
    const fetchData = async () => {
      try {
        const API_URL = process.env.NODE_ENV === 'production' 
          ? 'https://cryptoflipz2-production.up.railway.app'
          : 'https://cryptoflipz2-production.up.railway.app'
          
        const response = await fetch(`${API_URL}/api/dashboard/${address}`)
        const data = await response.json()
        
        setListings(data.listings.filter(l => l.status === 'active').slice(0, 5))
        
        // Count pending offers as notifications
        const pendingOffers = data.incomingOffers.filter(o => o.status === 'pending').length
        setNotifications(pendingOffers)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      }
    }
    
    fetchData()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [address, isConnected])
  
  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  if (!isConnected) return null
  
  return (
    <DropdownContainer ref={dropdownRef}>
      <DropdownButton 
        onClick={() => setIsOpen(!isOpen)}
        hasNotifications={notifications > 0}
      >
        My Flips
        {notifications > 0 && <NotificationBadge>{notifications}</NotificationBadge>}
      </DropdownButton>
      
      <DropdownMenu isOpen={isOpen}>
        {listings.length > 0 ? (
          <>
            {listings.map(listing => {
              const offerCount = notifications // Simplified for now
              
              return (
                <MenuItem 
                  key={listing.id} 
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                >
                  <GameItem>
                    <GameInfo>
                      <GameTitle>{listing.nft_name}</GameTitle>
                      <GameStatus>${listing.asking_price}</GameStatus>
                    </GameInfo>
                    {offerCount > 0 && (
                      <OfferBadge>{offerCount} offers</OfferBadge>
                    )}
                  </GameItem>
                </MenuItem>
              )
            })}
            <ViewAllButton to="/dashboard" onClick={() => setIsOpen(false)}>
              View All Flips →
            </ViewAllButton>
          </>
        ) : (
          <MenuItem to="/create" onClick={() => setIsOpen(false)}>
            <GameInfo>
              <GameTitle>No active flips</GameTitle>
              <GameStatus>Create your first flip!</GameStatus>
            </GameInfo>
          </MenuItem>
        )}
      </DropdownMenu>
    </DropdownContainer>
  )
}

export default MyFlipsDropdown 