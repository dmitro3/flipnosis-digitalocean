import React, { createContext, useContext, useState, useEffect } from 'react'
import { useWallet } from './WalletContext'

const ProfileContext = createContext()

export const useProfile = () => {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}

export const ProfileProvider = ({ children }) => {
  const { address } = useWallet()
  const [profiles, setProfiles] = useState({})

  // Load profiles from localStorage on mount
  useEffect(() => {
    const savedProfiles = localStorage.getItem('userProfiles')
    if (savedProfiles) {
      setProfiles(JSON.parse(savedProfiles))
    }
  }, [])

  // Save profiles to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userProfiles', JSON.stringify(profiles))
  }, [profiles])

  const getPlayerName = async (playerAddress) => {
    return profiles[playerAddress]?.name || ''
  }

  const setPlayerName = async (playerAddress, name) => {
    setProfiles(prev => ({
      ...prev,
      [playerAddress]: {
        ...prev[playerAddress],
        name
      }
    }))
  }

  const getProfilePicture = async (playerAddress) => {
    return profiles[playerAddress]?.image || ''
  }

  const setProfilePicture = async (playerAddress, imageUrl) => {
    setProfiles(prev => ({
      ...prev,
      [playerAddress]: {
        ...prev[playerAddress],
        image: imageUrl
      }
    }))
  }

  // Coin image functions
  const getCoinHeadsImage = async (playerAddress) => {
    return profiles[playerAddress]?.coinHeadsImage || null
  }

  const setCoinHeadsImage = async (playerAddress, imageUrl) => {
    setProfiles(prev => ({
      ...prev,
      [playerAddress]: {
        ...prev[playerAddress],
        coinHeadsImage: imageUrl
      }
    }))
  }

  const getCoinTailsImage = async (playerAddress) => {
    return profiles[playerAddress]?.coinTailsImage || null
  }

  const setCoinTailsImage = async (playerAddress, imageUrl) => {
    setProfiles(prev => ({
      ...prev,
      [playerAddress]: {
        ...prev[playerAddress],
        coinTailsImage: imageUrl
      }
    }))
  }

  const value = {
    getPlayerName,
    setPlayerName,
    getProfilePicture,
    setProfilePicture,
    getCoinHeadsImage,
    setCoinHeadsImage,
    getCoinTailsImage,
    setCoinTailsImage
  }

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  )
} 