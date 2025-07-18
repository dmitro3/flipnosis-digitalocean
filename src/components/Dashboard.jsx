import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import styled from '@emotion/styled'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import DashboardChat from './DashboardChat'
import {
  Container,
  ContentWrapper,
  GlassCard,
  NeonText,
  Button,
  LoadingSpinner
} from '../styles/components'

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2.5rem;
  height: calc(100vh - 120px);
  max-width: 1400px;
  margin: 0 auto;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    height: auto;
    gap: 1.5rem;
  }
`

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  overflow-y: auto;
  padding-right: 1rem;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 65, 0.3);
    border-radius: 4px;
  }
`

const SidePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
  @media (max-width: 1024px) {
    display: none;
  }
`

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const Tab = styled.button`
  background: none;
  border: none;
  color: ${props => props.active ? props.theme.colors.neonGreen : props.theme.colors.textSecondary};
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: ${props => props.active ? props.theme.colors.neonGreen : 'transparent'};
    transition: all 0.3s ease;
  }
  
  &:hover {
    color: ${props => props.theme.colors.neonGreen};
  }
`

const ListingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }
`

const ListingCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
`

const NFTImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
`

const ListingInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const ListingTitle = styled.h3`
  color: #333;
  font-size: 1.2rem;
  margin: 0;
  font-weight: 600;
`

const ListingPrice = styled.div`
  color: #00AA00;
  font-size: 1.5rem;
  font-weight: bold;
`

const OfferCount = styled.div`
  background: ${props => props.theme.colors.neonPink};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  position: absolute;
  top: 1rem;
  right: 1rem;
`

const OnlineIndicator = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: ${props => props.online ? '#00FF41' : '#666'};
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: ${props => props.online ? '0 0 10px #00FF41' : 'none'};
`

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`

const CoinPreview = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  align-items: center;
`

const CoinImage = styled.img`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
`

const OffersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
`

const OfferItem = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`

const OfferInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const OfferActions = styled.div`
  display: flex;
  gap: 0.5rem;
`

const AcceptButton = styled(Button)`
  background: linear-gradient(45deg, #00FF41, #39FF14);
  color: #000;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
`

const RejectButton = styled(Button)`
  background: rgba(255, 68, 68, 0.2);
  border: 1px solid #FF4444;
  color: #FF4444;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  
  &:hover {
    background: rgba(255, 68, 68, 0.3);
  }
`

const Dashboard = () => {
  const navigate = useNavigate()
  const { showSuccess, showError, showInfo } = useToast()
  const { isConnected, address } = useWallet()
  
  const [activeTab, setActiveTab] = useState('listings')
  const [listings, setListings] = useState([])
  const [outgoingOffers, setOutgoingOffers] = useState([])
  const [incomingOffers, setIncomingOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [socket, setSocket] = useState(null)
  const [notifications, setNotifications] = useState([])
  
  // WebSocket connection
  useEffect(() => {
    if (!address) return
    
    // Use production WebSocket URL
    const wsUrl = 'wss://cryptoflipz2-production.up.railway.app'
    
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('🔌 Dashboard WebSocket connected')
      ws.send(JSON.stringify({
        type: 'subscribe_dashboard',
        address
      }))
      
      // Update presence
      ws.send(JSON.stringify({
        type: 'update_presence',
        address
      }))
    }
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      // Make socket available globally for components
      window.socket = ws
      
      // Also dispatch WebSocket messages as window events
      try {
        window.dispatchEvent(new CustomEvent('websocketMessage', { detail: data }))
      } catch (error) {
        console.error('Error dispatching WebSocket message event:', error)
      }
      
      switch (data.type) {
        case 'new_offer':
          showInfo('New offer received!')
          fetchDashboardData()
          break
          
        case 'offer_accepted':
          showSuccess('Your offer was accepted!')
          // Navigate directly to the game
          if (data.gameId) {
            navigate(`/game/${data.gameId}`)
          }
          break
          
        case 'new_notification':
          setNotifications(prev => [data.notification, ...prev])
          // Show browser notification if permitted
          if (Notification.permission === 'granted') {
            new Notification(data.notification.title, {
              body: data.notification.message,
              icon: '/favicon.ico'
            })
          }
          break
      }
    }
    
    setSocket(ws)
    
    return () => {
      ws.close()
    }
  }, [address])
  
  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])
  
  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!address) return
    
    try {
      setLoading(true)
      
      // Use production API URL
      const baseUrl = 'https://cryptoflipz2-production.up.railway.app'
      
      const response = await fetch(`${baseUrl}/api/dashboard/${address}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          // If endpoint doesn't exist, initialize with empty data
          console.log('Dashboard endpoint not found, initializing with empty data')
          setListings([])
          setOutgoingOffers([])
          setIncomingOffers([])
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Ensure we have arrays even if the API returns undefined
      setListings(data.listings || [])
      setOutgoingOffers(data.outgoingOffers || [])
      setIncomingOffers(data.incomingOffers || [])
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      showError('Failed to load dashboard data')
      
      // Initialize with empty arrays on error
      setListings([])
      setOutgoingOffers([])
      setIncomingOffers([])
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    if (isConnected && address) {
      fetchDashboardData()
    }
  }, [isConnected, address])
  
  const handleAcceptOffer = async (offer) => {
    try {
      const baseUrl = 'https://cryptoflipz2-production.up.railway.app'
      
      const response = await fetch(`${baseUrl}/api/offers/${offer.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptor_address: address })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to accept offer')
      }
      
      const result = await response.json()
      showSuccess('Offer accepted! Loading game...')
      
      // Navigate directly to the game
      if (result.gameId) {
        navigate(`/game/${result.gameId}`)
      }
      
      fetchDashboardData()
    } catch (error) {
      showError(error.message)
    }
  }
  
  const handleRejectOffer = async (offerId) => {
    try {
      const baseUrl = 'https://cryptoflipz2-production.up.railway.app'
      
      const response = await fetch(`${baseUrl}/api/offers/${offerId}/reject`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject offer')
      }
      
      showInfo('Offer rejected')
      fetchDashboardData()
    } catch (error) {
      showError(error.message)
    }
  }
  
  const handleCancelListing = async (listingId) => {
    try {
      const baseUrl = 'https://cryptoflipz2-production.up.railway.app'
      
      const response = await fetch(`${baseUrl}/api/listings/${listingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_address: address })
      })
      
      if (!response.ok) throw new Error('Failed to cancel listing')
      
      showSuccess('Listing cancelled')
      fetchDashboardData()
    } catch (error) {
      showError(error.message)
    }
  }
  
  const renderListings = () => {
    const activeListings = listings.filter(l => l.status === 'active')
    
    if (activeListings.length === 0) {
      return (
        <EmptyState>
          <h3>No active listings</h3>
          <p>Create your first flip to get started!</p>
          <Button onClick={() => navigate('/create')}>Create Flip</Button>
        </EmptyState>
      )
    }
    
    return (
      <ListingGrid>
        {activeListings.map(listing => {
          const offerCount = incomingOffers.filter(o => 
            o.listing_id === listing.id && o.status === 'pending'
          ).length
          
          return (
            <ListingCard 
              key={listing.id}
              onClick={() => navigate(`/flip/${listing.id}`)}
            >
              {listing.creator_online && <OnlineIndicator online />}
              {offerCount > 0 && <OfferCount>{offerCount} offers</OfferCount>}
              
              <NFTImage src={listing.nft_image} alt={listing.nft_name} />
              
              <ListingInfo>
                <ListingTitle>{listing.nft_name}</ListingTitle>
                <div style={{ color: '#666', fontSize: '0.875rem' }}>
                  {listing.nft_collection}
                </div>
                <ListingPrice>${listing.asking_price}</ListingPrice>
                
                {listing.coin && (
                  <CoinPreview>
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>
                      Coin:
                    </span>
                    <CoinImage src={listing.coin.headsImage} alt="Heads" />
                    <CoinImage src={listing.coin.tailsImage} alt="Tails" />
                  </CoinPreview>
                )}
              </ListingInfo>
            </ListingCard>
          )
        })}
      </ListingGrid>
    )
  }
  
  const renderIncomingOffers = () => {
    const pendingOffers = incomingOffers.filter(o => o.status === 'pending')
    
    if (pendingOffers.length === 0) {
      return (
        <EmptyState>
          <p>No pending offers</p>
        </EmptyState>
      )
    }
    
    return (
      <OffersList>
        {pendingOffers.map(offer => (
          <OfferItem key={offer.id}>
            <OfferInfo>
              <div style={{ fontWeight: 'bold' }}>{offer.nft_name}</div>
              <div style={{ color: '#00AA00', fontSize: '1.2rem' }}>
                ${offer.offer_price}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                from {offer.offerer_name || (offer.offerer_address ? offer.offerer_address.slice(0, 6) + '...' : 'Unknown')}
              </div>
              {offer.message && (
                <div style={{ fontSize: '0.875rem', fontStyle: 'italic' }}>
                  "{offer.message}"
                </div>
              )}
            </OfferInfo>
            
            <OfferActions>
              <AcceptButton onClick={() => handleAcceptOffer(offer)}>
                Accept
              </AcceptButton>
              <RejectButton onClick={() => handleRejectOffer(offer.id)}>
                Reject
              </RejectButton>
            </OfferActions>
          </OfferItem>
        ))}
      </OffersList>
    )
  }
  
  const renderOutgoingOffers = () => {
    const activeOffers = outgoingOffers.filter(o => o.status === 'pending')
    
    if (activeOffers.length === 0) {
      return (
        <EmptyState>
          <p>No active offers</p>
        </EmptyState>
      )
    }
    
    return (
      <OffersList>
        {activeOffers.map(offer => (
          <OfferItem key={offer.id}>
            <OfferInfo>
              <div style={{ fontWeight: 'bold' }}>{offer.nft_name}</div>
              <div style={{ color: '#00AA00', fontSize: '1.2rem' }}>
                ${offer.offer_price}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                to {offer.creator ? offer.creator.slice(0, 6) + '...' : 'Unknown'}
              </div>
            </OfferInfo>
            
            <div style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255, 165, 0, 0.2)',
              border: '1px solid #FFA500',
              borderRadius: '0.5rem',
              color: '#FFA500'
            }}>
              Pending
            </div>
          </OfferItem>
        ))}
      </OffersList>
    )
  }
  
  if (!isConnected) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <GlassCard style={{ textAlign: 'center' }}>
              <NeonText>Connect your wallet to view your dashboard</NeonText>
            </GlassCard>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }
  
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
              <LoadingSpinner />
            </div>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }
  
  return (
    <ThemeProvider theme={theme}>
      <Container>
        <ContentWrapper>
          <DashboardContainer>
            <MainContent>
              <div>
                <NeonText style={{ marginBottom: '2rem' }}>Your Flips Dashboard</NeonText>
                
                <TabContainer>
                  <Tab 
                    active={activeTab === 'listings'} 
                    onClick={() => setActiveTab('listings')}
                  >
                    Active Listings ({listings.filter(l => l.status === 'active').length})
                  </Tab>
                  <Tab 
                    active={activeTab === 'incoming'} 
                    onClick={() => setActiveTab('incoming')}
                  >
                    Incoming Offers ({incomingOffers.filter(o => o.status === 'pending').length})
                  </Tab>
                  <Tab 
                    active={activeTab === 'outgoing'} 
                    onClick={() => setActiveTab('outgoing')}
                  >
                    Your Offers ({outgoingOffers.filter(o => o.status === 'pending').length})
                  </Tab>
                </TabContainer>
                
                {activeTab === 'listings' && renderListings()}
                {activeTab === 'incoming' && renderIncomingOffers()}
                {activeTab === 'outgoing' && renderOutgoingOffers()}
              </div>
            </MainContent>
            
            <SidePanel>
              <GlassCard>
                <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Button onClick={() => navigate('/create')}>
                    Create New Listing
                  </Button>
                  <div style={{ fontSize: '0.875rem', color: '#666', textAlign: 'center' }}>
                    Click on any listing to view details, chat, and manage offers
                  </div>
                </div>
              </GlassCard>
            </SidePanel>
          </DashboardContainer>
        </ContentWrapper>
        

        

      </Container>
    </ThemeProvider>
  )
}

export default Dashboard 