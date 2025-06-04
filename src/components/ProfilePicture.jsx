import React, { useRef } from 'react'
import { useProfile } from '../contexts/ProfileContext'
import { theme } from '../styles/theme'

const ProfilePicture = ({ 
  address, 
  size = '40px', 
  isClickable = false, 
  showUploadIcon = false,
  style = {} 
}) => {
  const { getProfilePicture, setProfilePicture } = useProfile()
  const fileInputRef = useRef(null)
  
  const profilePic = getProfilePicture(address)
  
  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image must be smaller than 2MB')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        // Create image to resize
        const img = new Image()
        img.onload = () => {
          // Create canvas to resize image
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          // Set canvas size (square, 128x128 for storage efficiency)
          const maxSize = 128
          canvas.width = maxSize
          canvas.height = maxSize
          
          // Draw resized image
          ctx.drawImage(img, 0, 0, maxSize, maxSize)
          
          // Convert to data URL with compression
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
          
          // Save to profile
          setProfilePicture(address, dataUrl)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    }
    
    // Reset input
    event.target.value = ''
  }
  
  const handleClick = () => {
    if (isClickable && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }
  
  const generateGradient = (address) => {
    if (!address) return 'linear-gradient(45deg, #666, #999)'
    
    // Generate deterministic colors from address
    const hash = address.slice(2, 8) // Use first 6 chars after 0x
    const r = parseInt(hash.slice(0, 2), 16)
    const g = parseInt(hash.slice(2, 4), 16)
    const b = parseInt(hash.slice(4, 6), 16)
    
    return `linear-gradient(45deg, rgb(${r},${g},${b}), rgb(${r*0.7},${g*0.7},${b*0.7}))`
  }
  
  return (
    <div
      onClick={handleClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        cursor: isClickable ? 'pointer' : 'default',
        border: `2px solid ${theme.colors.neonGreen}`,
        position: 'relative',
        background: profilePic ? 'transparent' : generateGradient(address),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        ...style
      }}
    >
      {profilePic ? (
        <img
          src={profilePic}
          alt="Profile"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      ) : (
        <div style={{
          color: 'white',
          fontSize: parseInt(size) * 0.4 + 'px',
          fontWeight: 'bold'
        }}>
          {address ? address.slice(2, 4).toUpperCase() : '??'}
        </div>
      )}
      
      {/* Upload icon overlay */}
      {showUploadIcon && isClickable && (
        <div style={{
          position: 'absolute',
          bottom: '0',
          right: '0',
          width: '16px',
          height: '16px',
          background: theme.colors.neonPink,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          color: 'white'
        }}>
          📷
        </div>
      )}
      
      {/* Hidden file input */}
      {isClickable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      )}
    </div>
  )
}

export default ProfilePicture 