import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from '@emotion/styled'
import { useWallet } from '../contexts/WalletContext'
import { X } from 'lucide-react'

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

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  backdrop-filter: blur(10px);
`

const ModalContent = styled.div`
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 20, 147, 0.3);
  border-radius: 1rem;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.2);
`

const ModalHeader = styled.div`
  background: linear-gradient(45deg, #FF1493, #FF69B4);
  padding: 1.5rem;
  border-radius: 1rem 1rem 0 0;
  position: relative;
`

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    color: #fff;
    transform: scale(1.1);
  }
`

const ModalBody = styled.div`
  padding: 2rem;
  overflow-y: auto;
  max-height: calc(80vh - 120px);
`

const ListingItem = styled(Link)`
  display: block;
  padding: 1.5rem;
  color: ${props => props.theme?.colors?.textPrimary || '#ffffff'};
  text-decoration: none;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  
  &:hover {
    background: rgba(0, 255, 65, 0.1);
    border-color: rgba(0, 255, 65, 0.3);
    color: ${props => props.theme?.colors?.neonGreen || '#00FF41'};
    transform: translateY(-2px);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`

const ListingContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const ListingInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const ListingTitle = styled.div`
  font-weight: 600;
  font-size: 1.1rem;
`

const ListingDetails = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme?.colors?.textSecondary || 'rgba(255, 255, 255, 0.7)'};
`

const ListingPrice = styled.div`
  font-size: 1.25rem;
  font-weight: bold;
  color: ${props => props.theme?.colors?.neonGreen || '#00FF41'};
`

const OfferBadge = styled.div`
  background: ${props => props.theme?.colors?.neonPink || '#FF1493'};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  margin-left: 1rem;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: rgba(255, 255, 255, 0.7);
`

const CreateButton = styled(Link)`
  display: inline-block;
  background: linear-gradient(45deg, #00FF41, #39FF14);
  color: #000;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
  margin-top: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 255, 65, 0.3);
  }
`

const ViewAllButton = styled(Link)`
  display: block;
  text-align: center;
  background: rgba(0, 255, 65, 0.1);
  color: ${props => props.theme?.colors?.neonGreen || '#00FF41'};
  padding: 1rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
  margin-top: 1rem;
  border: 1px solid rgba(0, 255, 65, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 255, 65, 0.2);
    transform: translateY(-2px);
  }
`

const MyFlipsDropdown = () => {
  const navigate = useNavigate()
  const { address, isConnected } = useWallet()
  const [isOpen, setIsOpen] = useState(false)
  const [listings, setListings] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (!isConnected || !address) return
    
    // Fetch user's active listings
    const fetchData = async () => {
      setLoading(true)
      try {
        const API_URL = process.env.NODE_ENV === 'production' 
          ? '/api'
: '/api'
          
        const response = await fetch(`${API_URL}/api/dashboard/${address}`)
        const data = await response.json()
        
        setListings(data.listings.filter(l => l.status === 'active').slice(0, 5))
        
        // Count pending offers as notifications
        const pendingOffers = data.incomingOffers.filter(o => o.status === 'pending').length
        setNotifications(pendingOffers)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [address, isConnected])
  
  const handleClose = () => {
    setIsOpen(false)
  }
  
  if (!isConnected) return null
  
  return (
    <>
      <DropdownButton 
        onClick={() => setIsOpen(true)}
        hasNotifications={notifications > 0}
      >
        My Flips
        {notifications > 0 && <NotificationBadge>{notifications}</NotificationBadge>}
      </DropdownButton>
      
      {isOpen && (
        <Modal onClick={handleClose}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2 style={{ margin: 0, color: '#fff' }}>My Active Flips</h2>
              <CloseButton onClick={handleClose}>
                <X size={24} />
              </CloseButton>
            </ModalHeader>
            
            <ModalBody>
              {loading ? (
                <EmptyState>
                  <div>Loading...</div>
                </EmptyState>
              ) : listings.length > 0 ? (
                <>
                  {listings.map(listing => {
                    const offerCount = notifications // Simplified for now
                    
                    return (
                      <ListingItem 
                        key={listing.id} 
                        to={`/game/${listing.id}`}
                        onClick={handleClose}
                      >
                        <ListingContent>
                          <ListingInfo>
                            <ListingTitle>{listing.nft_name}</ListingTitle>
                            <ListingDetails>{listing.nft_collection}</ListingDetails>
                            <ListingPrice>${listing.asking_price}</ListingPrice>
                          </ListingInfo>
                          {offerCount > 0 && (
                            <OfferBadge>{offerCount} offers</OfferBadge>
                          )}
                        </ListingContent>
                      </ListingItem>
                    )
                  })}
                  <ViewAllButton to="/dashboard" onClick={handleClose}>
                    View All Flips →
                  </ViewAllButton>
                </>
              ) : (
                <EmptyState>
                  <h3>No active flips</h3>
                  <p>Create your first flip to get started!</p>
                  <CreateButton to="/create" onClick={handleClose}>
                    Create Flip
                  </CreateButton>
                </EmptyState>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  )
}

export default MyFlipsDropdown 