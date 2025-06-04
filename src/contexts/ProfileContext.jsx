import React, { createContext, useContext, useState, useEffect } from 'react'

const ProfileContext = createContext()

export const useProfile = () => {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}

export const ProfileProvider = ({ children }) => {
  const [profilePictures, setProfilePictures] = useState({})
  const API_URL = 'https://cryptoflipz2-production.up.railway.app'

  // Load profiles from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('flipnosis-profiles')
      if (stored) {
        setProfilePictures(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading profiles:', error)
    }
  }, [])

  // Save to localStorage whenever profiles change
  useEffect(() => {
    try {
      localStorage.setItem('flipnosis-profiles', JSON.stringify(profilePictures))
    } catch (error) {
      console.error('Error saving profiles:', error)
    }
  }, [profilePictures])

  const setProfilePicture = async (address, imageDataUrl) => {
    try {
      // Save locally first
      setProfilePictures(prev => ({
        ...prev,
        [address.toLowerCase()]: imageDataUrl
      }))

      // Upload to server
      const response = await fetch(`${API_URL}/api/profile/${address}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: imageDataUrl })
      })

      if (!response.ok) {
        console.error('Failed to upload profile picture to server')
      } else {
        console.log('✅ Profile picture uploaded to server')
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error)
    }
  }

  const getProfilePicture = async (address) => {
    if (!address) return null
    
    const lowerAddress = address.toLowerCase()
    
    // Check local cache first
    if (profilePictures[lowerAddress]) {
      return profilePictures[lowerAddress]
    }
    
    // Fetch from server
    try {
      const response = await fetch(`${API_URL}/api/profile/${address}`)
      if (response.ok) {
        const data = await response.json()
        // Cache locally
        setProfilePictures(prev => ({
          ...prev,
          [lowerAddress]: data.imageData
        }))
        return data.imageData
      }
    } catch (error) {
      console.error('Error fetching profile picture:', error)
    }
    
    return null
  }

  const removeProfilePicture = (address) => {
    setProfilePictures(prev => {
      const newProfiles = { ...prev }
      delete newProfiles[address.toLowerCase()]
      return newProfiles
    })
  }

  const updateProfilePicture = async (newPicture) => {
    try {
      setProfilePicture(newPicture);
      localStorage.setItem('profilePicture', newPicture);
      
      // Sync with server
      const response = await fetch('/api/profile/picture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ picture: newPicture }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync profile picture');
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
    }
  };

  return (
    <ProfileContext.Provider value={{
      profilePictures,
      setProfilePicture,
      getProfilePicture,
      removeProfilePicture
    }}>
      {children}
    </ProfileContext.Provider>
  )
} 