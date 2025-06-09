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
  const [playerNames, setPlayerNames] = useState({})
  const API_URL = 'https://cryptoflipz2-production.up.railway.app'

  // Load profiles and names from localStorage on mount
  useEffect(() => {
    try {
      const storedPictures = localStorage.getItem('flipnosis-profiles')
      if (storedPictures) {
        setProfilePictures(JSON.parse(storedPictures))
      }

      // NEW: Load player names
      const storedNames = localStorage.getItem('flipnosis-player-names')
      if (storedNames) {
        setPlayerNames(JSON.parse(storedNames))
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

  // NEW: Save player names to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('flipnosis-player-names', JSON.stringify(playerNames))
    } catch (error) {
      console.error('Error saving player names:', error)
    }
  }, [playerNames])

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

  // NEW: Player name functions
  const setPlayerName = async (address, name) => {
    if (!address || !name) return

    try {
      // Validate name (same validation as in chat component)
      const trimmedName = name.trim()
      if (trimmedName.length === 0 || trimmedName.length > 50) {
        throw new Error('Name must be 1-50 characters')
      }

      // Basic security validation
      const validNameRegex = /^[a-zA-Z0-9\s\-_.!@#$%^&*()]+$/
      if (!validNameRegex.test(trimmedName)) {
        throw new Error('Name contains invalid characters')
      }

      if (trimmedName.includes('<') || trimmedName.includes('>') || 
          trimmedName.includes('javascript:') || trimmedName.includes('data:')) {
        throw new Error('Name contains prohibited content')
      }

      // Save locally first
      setPlayerNames(prev => ({
        ...prev,
        [address.toLowerCase()]: trimmedName
      }))

      // Upload to server
      const response = await fetch(`${API_URL}/api/profile/${address}/name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName })
      })

      if (!response.ok) {
        console.error('Failed to upload player name to server')
      } else {
        console.log('✅ Player name uploaded to server')
      }
    } catch (error) {
      console.error('Error setting player name:', error)
      throw error
    }
  }

  const getPlayerName = async (address) => {
    if (!address) return null
    
    const lowerAddress = address.toLowerCase()
    
    // Check local cache first
    if (playerNames[lowerAddress]) {
      return playerNames[lowerAddress]
    }
    
    // Fetch from server
    try {
      const response = await fetch(`${API_URL}/api/profile/${address}/name`)
      if (response.ok) {
        const data = await response.json()
        // Cache locally
        setPlayerNames(prev => ({
          ...prev,
          [lowerAddress]: data.name
        }))
        return data.name
      }
    } catch (error) {
      console.error('Error fetching player name:', error)
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

  // NEW: Remove player name
  const removePlayerName = (address) => {
    setPlayerNames(prev => {
      const newNames = { ...prev }
      delete newNames[address.toLowerCase()]
      return newNames
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
      removeProfilePicture,
      // NEW: Player name functions
      playerNames,
      setPlayerName,
      getPlayerName,
      removePlayerName
    }}>
      {children}
    </ProfileContext.Provider>
  )
} 