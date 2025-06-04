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

  const setProfilePicture = (address, imageDataUrl) => {
    setProfilePictures(prev => ({
      ...prev,
      [address.toLowerCase()]: imageDataUrl
    }))
  }

  const getProfilePicture = (address) => {
    if (!address) return null
    return profilePictures[address.toLowerCase()] || null
  }

  const removeProfilePicture = (address) => {
    setProfilePictures(prev => {
      const newProfiles = { ...prev }
      delete newProfiles[address.toLowerCase()]
      return newProfiles
    })
  }

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