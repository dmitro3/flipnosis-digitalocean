import React, { useState } from 'react'
import styled from '@emotion/styled'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import { GlassCard, Button, Input, Label } from '../styles/components'

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
`

const ModalContent = styled(GlassCard)`
  max-width: 500px;
  width: 90%;
  padding: 2rem;
  position: relative;
`

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 1.5rem;
  cursor: pointer;
  
  &:hover {
    color: ${props => props.theme.colors.neonGreen};
  }
`

const NFTPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
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
    color: ${props => props.theme.colors.textPrimary};
  }
  
  p {
    margin: 0;
    color: ${props => props.theme.colors.textSecondary};
  }
`

const PriceInfo = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(0, 255, 65, 0.1);
  border: 1px solid rgba(0, 255, 65, 0.3);
  border-radius: 0.5rem;
  
  .asking-price {
    font-size: 1.5rem;
    font-weight: bold;
    color: ${props => props.theme.colors.neonGreen};
  }
  
  .min-offer {
    font-size: 0.875rem;
    color: ${props => props.theme.colors.textSecondary};
    margin-top: 0.5rem;
  }
`

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`

const StyledInput = styled(Input)`
  width: 100%;
  box-sizing: border-box;
`

const StyledLabel = styled(Label)`
  display: block;
  margin-bottom: 0.5rem;
`

const TextArea = styled.textarea`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.neonGreen};
  }
`

const SubmitButton = styled(Button)`
  width: 100%;
  background: linear-gradient(45deg, #00FF41, #39FF14);
  color: #000;
  font-weight: bold;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const OfferModal = ({ listing, onClose, onSuccess }) => {
  const { address } = useWallet()
  const { showSuccess, showError } = useToast()
  
  const [offerPrice, setOfferPrice] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!address) {
      showError('Please connect your wallet first')
      return
    }
    
    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      showError('Please enter a valid offer price')
      return
    }
    
    if (parseFloat(offerPrice) < listing.min_offer_price) {
      showError(`Minimum offer is $${listing.min_offer_price}`)
      return
    }
    
    setLoading(true)
    
    try {
      const baseUrl = '/api'
      
      const response = await fetch(`${baseUrl}/api/listings/${listing.id}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          offerer_address: address,
          offerer_name: address ? address.slice(0, 6) + '...' + address.slice(-4) : 'Unknown',
          offer_price: parseFloat(offerPrice),
          message: message.trim() || null
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create offer')
      }
      
      const result = await response.json()
      showSuccess('Offer submitted successfully!')
      onSuccess()
      
    } catch (error) {
      console.error('Error creating offer:', error)
      showError(error.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Modal>
      <ModalContent>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', textAlign: 'center' }}>
          Make an Offer
        </h2>
        
        <NFTPreview>
          <NFTImage src={listing.nft_image} alt={listing.nft_name} />
          <NFTInfo>
            <h3>{listing.nft_name}</h3>
            <p>{listing.nft_collection}</p>
          </NFTInfo>
        </NFTPreview>
        
        <PriceInfo>
          <div className="asking-price">${listing.asking_price}</div>
          <div className="min-offer">Asking Price</div>
          <div className="min-offer">Minimum offer: ${listing.min_offer_price}</div>
        </PriceInfo>
        
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <StyledLabel>Your Offer (USD)</StyledLabel>
            <StyledInput
              type="number"
              placeholder="Enter your offer"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              min={listing.min_offer_price}
              step="0.01"
              required
            />
          </FormGroup>
          
          <FormGroup>
            <StyledLabel>Message (Optional)</StyledLabel>
            <TextArea
              placeholder="Add a message to your offer..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
            />
          </FormGroup>
          
          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Offer'}
          </SubmitButton>
        </form>
      </ModalContent>
    </Modal>
  )
}

export default OfferModal 