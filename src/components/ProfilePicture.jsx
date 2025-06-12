import React, { useRef, useState, useEffect } from 'react'
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
  const [profilePic, setProfilePic] = useState(null)
  const [loading, setLoading] = useState(false)
  
  // Fetch profile picture when address changes
  useEffect(() => {
    if (address) {
      setLoading(true)
      getProfilePicture(address).then(pic => {
        setProfilePic(pic)
        setLoading(false)
      })
    }
  }, [address, getProfilePicture])
  
  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      // Validate file size (max 1MB for server storage)
      if (file.size > 1024 * 1024) {
        alert('Image must be smaller than 1MB')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          // Set canvas size (96x96 for better server storage)
          const maxSize = 96
          canvas.width = maxSize
          canvas.height = maxSize
          
          ctx.drawImage(img, 0, 0, maxSize, maxSize)
          
          // Convert to data URL with compression
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
          
          // Save to profile (this will upload to server)
          setProfilePicture(address, dataUrl).then(() => {
            setProfilePic(dataUrl)
            
            // Force refresh for all users viewing this address
            window.dispatchEvent(new CustomEvent('profileUpdated', { 
              detail: { address, imageData: dataUrl } 
            }))
          })
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    }
    
    event.target.value = ''
  }
  
  // Add profile update listener
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      if (event.detail.address === address) {
        setProfilePic(event.detail.imageData)
      }
    }
    
    window.addEventListener('profileUpdated', handleProfileUpdate)
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate)
  }, [address])
  
  const handleClick = () => {
    if (isClickable && fileInputRef.current) {
      fileInputRef.current.click()
    }
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
    <div
      onClick={handleClick}
      style={{
        width: size,
        height: size,
        overflow: 'hidden',
        cursor: isClickable ? 'pointer' : 'default',
        position: 'relative',
        background: profilePic ? 'transparent' : generateGradient(address),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        ...style
      }}
    >
      {loading ? (
        <div style={{ color: 'white', fontSize: '10px' }}>...</div>
      ) : profilePic ? (
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