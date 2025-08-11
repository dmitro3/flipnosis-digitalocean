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
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
      border-color: ${props => props.isClickable ? 'rgba(0, 191, 255, 0.5)' : props.style?.border};
  box-shadow: ${props => props.isClickable ? '0 0 15px rgba(0, 191, 255, 0.3)' : 'none'};
  }
`

const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const UploadIcon = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 1.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;

  ${ProfilePictureContainer}:hover & {
    opacity: 1;
  }
`

const ProfilePicture = ({ 
  address, 
  size = 40, 
  isClickable = false, 
  showUploadIcon = false,
  profileData = null,
  style = {} 
}) => {
  const { getProfilePicture, setProfilePicture } = useProfile()
  const { address: currentUserAddress } = useWallet()
  const [imageUrl, setImageUrl] = useState(profileData?.imageUrl || null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    if (profileData?.imageUrl) {
      setImageUrl(profileData.imageUrl)
      setIsLoading(false)
      return
    }
    
    const loadImage = async () => {
      if (!address) return
      
      try {
        setIsLoading(true)
        const url = await getProfilePicture(address)
        setImageUrl(url)
      } catch (error) {
        console.error('Error loading profile picture:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadImage()
  }, [address, profileData, getProfilePicture])
  
  const handleImageClick = async (e) => {
    if (!isClickable) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (event) => {
      const file = event.target.files[0]
      if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          alert('Image size must be less than 5MB')
          return
        }

        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const imageData = e.target.result
            await setProfilePicture(address, imageData)
            setImageUrl(imageData)
          } catch (error) {
            console.error('Error uploading profile picture:', error)
          }
        }
        reader.readAsDataURL(file)
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
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: `${size * 0.4}px`
        }}>
          {address?.slice(0, 2).toUpperCase()}
        </div>
      )}
      
      {showUploadIcon && isClickable && (
        <UploadIcon>📷</UploadIcon>
      )}
    </ProfilePictureContainer>
  )
}

export default ProfilePicture 