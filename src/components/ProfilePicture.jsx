import React, { useState, useEffect } from 'react'
import { useProfile } from '../contexts/ProfileContext'
import { useWallet } from '../contexts/WalletContext'
import styled from '@emotion/styled'

const ProfilePictureContainer = styled.div`
  position: relative;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: ${props => props.style?.borderRadius || '50%'};
  overflow: hidden;
  cursor: ${props => props.isClickable ? 'pointer' : 'default'};
  border: ${props => props.style?.border || '2px solid rgba(255, 255, 255, 0.2)'};
  transition: all 0.3s ease;

  &:hover {
    transform: ${props => props.isClickable ? 'scale(1.05)' : 'none'};
    box-shadow: ${props => props.isClickable ? '0 0 15px rgba(255, 255, 255, 0.3)' : 'none'};
  }
`

const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const UploadIcon = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;

  ${ProfilePictureContainer}:hover & {
    opacity: 1;
  }
`

const ProfilePicture = ({ 
  address, 
  size = 40, 
  isClickable = false, 
  showUploadIcon = false,
  style = {} 
}) => {
  const { getProfilePicture, setProfilePicture } = useProfile()
  const { address: currentUserAddress } = useWallet()
  const [imageUrl, setImageUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchImage = async () => {
      if (!address) return
      
      setIsLoading(true)
      try {
        // First try to get from local storage/cache
        const cachedImage = await getProfilePicture(address)
        if (cachedImage) {
          setImageUrl(cachedImage)
          return
        }

        // If not in cache, fetch from server
        const response = await fetch(`/api/profiles/${address}/picture`)
        if (response.ok) {
          const blob = await response.blob()
          const imageUrl = URL.createObjectURL(blob)
          setImageUrl(imageUrl)
          // Cache the image
          await setProfilePicture(address, imageUrl)
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchImage()
  }, [address, getProfilePicture, setProfilePicture])
  
  const handleImageClick = async (e) => {
    if (!isClickable || !currentUserAddress || currentUserAddress !== address) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }

      try {
        const formData = new FormData()
        formData.append('picture', file)

        const response = await fetch(`/api/profiles/${address}/picture`, {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const blob = await response.blob()
          const newImageUrl = URL.createObjectURL(blob)
          setImageUrl(newImageUrl)
          // Update cache
          await setProfilePicture(address, newImageUrl)
        }
      } catch (error) {
        console.error('Error uploading profile picture:', error)
        alert('Failed to upload image')
      }
    }

    input.click()
  }
  
  const generateGradient = (address) => {
    if (!address) return 'linear-gradient(45deg, #666, #999)'
    
    const hash = address.slice(2, 8)
    const r = parseInt(hash.slice(0, 2), 16)
    const g = parseInt(hash.slice(2, 4), 16)
    const b = parseInt(hash.slice(4, 6), 16)
    
    return `linear-gradient(45deg, rgb(${r},${g},${b}), rgb(${r*0.7},${g*0.7},${b*0.7}))`
  }
  
  return (
    <ProfilePictureContainer 
      size={size} 
      isClickable={isClickable}
      onClick={handleImageClick}
      style={style}
    >
      {imageUrl ? (
        <ProfileImage src={imageUrl} alt="Profile" />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(45deg, #FF1493, #00BFFF)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: `${size * 0.4}px`,
          fontWeight: 'bold'
        }}>
          {address ? address.slice(2, 4).toUpperCase() : '?'}
        </div>
      )}
      
      {showUploadIcon && isClickable && (
        <UploadIcon>
          📷
        </UploadIcon>
      )}
    </ProfilePictureContainer>
  )
}

export default ProfilePicture 