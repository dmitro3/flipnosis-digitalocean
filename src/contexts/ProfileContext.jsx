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
  const [loading, setLoading] = useState({})

  // API base URL
  const API_BASE = import.meta.env.VITE_API_URL || 'https://cryptoflipz2-production.up.railway.app'
  
  console.log('🌐 ProfileContext API_BASE:', API_BASE, 'NODE_ENV:', process.env.NODE_ENV)

  const getPlayerName = async (playerAddress) => {
    try {
      const profile = await getProfile(playerAddress)
      return profile?.name || ''
    } catch (error) {
      console.error('Error getting player name:', error)
      return ''
    }
  }

  const setPlayerName = async (playerAddress, name) => {
    try {
      const profile = await getProfile(playerAddress)
      await updateProfile(playerAddress, {
        ...profile,
        name
      })
      
      // Update local state
      setProfiles(prev => ({
        ...prev,
        [playerAddress]: {
          ...prev[playerAddress],
          name
        }
      }))
    } catch (error) {
      console.error('Error setting player name:', error)
      throw error
    }
  }

  const getProfilePicture = async (playerAddress) => {
    try {
      const profile = await getProfile(playerAddress)
      return profile?.avatar || ''
    } catch (error) {
      console.error('Error getting profile picture:', error)
      return ''
    }
  }

  const setProfilePicture = async (playerAddress, imageUrl) => {
    try {
      const profile = await getProfile(playerAddress)
      await updateProfile(playerAddress, {
        ...profile,
        avatar: imageUrl
      })
      
      // Update local state
      setProfiles(prev => ({
        ...prev,
        [playerAddress]: {
          ...prev[playerAddress],
          avatar: imageUrl
        }
      }))
    } catch (error) {
      console.error('Error setting profile picture:', error)
      throw error
    }
  }

  // Coin image functions
  const getCoinHeadsImage = async (playerAddress) => {
    try {
      console.log('🪙 Getting coin heads image for:', playerAddress)
      const profile = await getProfile(playerAddress)
      console.log('🪙 Profile loaded for heads:', { 
        hasProfile: !!profile, 
        hasHeadsImage: !!profile?.headsImage,
        headsLength: profile?.headsImage?.length || 0
      })
      return profile?.headsImage || null
    } catch (error) {
      console.error('Error getting coin heads image:', error)
      return null
    }
  }

  const setCoinHeadsImage = async (playerAddress, imageUrl) => {
    try {
      const profile = await getProfile(playerAddress)
      await updateProfile(playerAddress, {
        ...profile,
        headsImage: imageUrl
      })
      
      // Update local state
      setProfiles(prev => ({
        ...prev,
        [playerAddress]: {
          ...prev[playerAddress],
          headsImage: imageUrl
        }
      }))
    } catch (error) {
      console.error('Error setting coin heads image:', error)
      throw error
    }
  }

  const getCoinTailsImage = async (playerAddress) => {
    try {
      console.log('🪙 Getting coin tails image for:', playerAddress)
      const profile = await getProfile(playerAddress)
      console.log('🪙 Profile loaded for tails:', { 
        hasProfile: !!profile, 
        hasTailsImage: !!profile?.tailsImage,
        tailsLength: profile?.tailsImage?.length || 0
      })
      return profile?.tailsImage || null
    } catch (error) {
      console.error('Error getting coin tails image:', error)
      return null
    }
  }

  const setCoinTailsImage = async (playerAddress, imageUrl) => {
    try {
      const profile = await getProfile(playerAddress)
      await updateProfile(playerAddress, {
        ...profile,
        tailsImage: imageUrl
      })
      
      // Update local state
      setProfiles(prev => ({
        ...prev,
        [playerAddress]: {
          ...prev[playerAddress],
          tailsImage: imageUrl
        }
      }))
    } catch (error) {
      console.error('Error setting coin tails image:', error)
      throw error
    }
  }

  // Helper functions
  const getProfile = async (playerAddress) => {
    if (loading[playerAddress]) {
      // Wait for existing request
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (!loading[playerAddress]) {
            resolve(profiles[playerAddress] || null)
          } else {
            setTimeout(checkLoading, 100)
          }
        }
        checkLoading()
      })
    }

    if (profiles[playerAddress]) {
      return profiles[playerAddress]
    }

    setLoading(prev => ({ ...prev, [playerAddress]: true }))

    try {
      console.log('🌐 Fetching profile from:', `${API_BASE}/api/profile/${playerAddress}`)
      const response = await fetch(`${API_BASE}/api/profile/${playerAddress}`)
      console.log('🌐 Profile API response:', { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText
      })
      
      if (response.ok) {
        const profile = await response.json()
        console.log('🌐 Profile data received:', {
          address: profile.address,
          hasName: !!profile.name,
          hasAvatar: !!profile.avatar,
          hasHeadsImage: !!profile.headsImage,
          hasTailsImage: !!profile.tailsImage
        })
        setProfiles(prev => ({ ...prev, [playerAddress]: profile }))
        return profile
      } else {
        console.warn('Profile not found, returning empty profile')
        const emptyProfile = {
          address: playerAddress,
          name: '',
          avatar: '',
          headsImage: '',
          tailsImage: ''
        }
        setProfiles(prev => ({ ...prev, [playerAddress]: emptyProfile }))
        return emptyProfile
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      const emptyProfile = {
        address: playerAddress,
        name: '',
        avatar: '',
        headsImage: '',
        tailsImage: ''
      }
      setProfiles(prev => ({ ...prev, [playerAddress]: emptyProfile }))
      return emptyProfile
    } finally {
      setLoading(prev => ({ ...prev, [playerAddress]: false }))
    }
  }

  const updateProfile = async (playerAddress, profileData) => {
    try {
      const response = await fetch(`${API_BASE}/api/profile/${playerAddress}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
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