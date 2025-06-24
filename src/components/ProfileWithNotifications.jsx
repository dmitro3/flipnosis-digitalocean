import React, { useState, useEffect } from 'react'
import { User, Gamepad2, Trophy, TrendingUp, Image, Coins, Clock, AlertCircle, ExternalLink, Copy, CheckCircle } from 'lucide-react'
import NotificationSystem from './NotificationSystem'
import contractService from '../services/ContractService'

const ProfileWithNotifications = ({ address, isConnected, currentChain }) => {
  const [profileData, setProfileData] = useState({
    name: '',
    avatar: '',
    headsImage: '',
    tailsImage: '',
    stats: {
      totalGames: 0,
      gamesWon: 0,
      gamesLost: 0,
      winRate: 0,
      totalVolume: 0,
      activeGames: []
    }
  })
  
  const [activeGames, setActiveGames] = useState([])
  const [showProfile, setShowProfile] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const API_URL = 'https://cryptoflipz2-production.up.railway.app'

  // Load profile data
  const loadProfileData = async () => {
    if (!address || !isConnected) return

    setLoading(true)
    try {
      // Load from localStorage (for demo)
      const savedProfile = localStorage.getItem(`profile-${address}`)
      if (savedProfile) {
        const profile = JSON.parse(savedProfile)
        setProfileData(prev => ({ ...prev, ...profile }))
      }

      // Load active games from contract
      const gameIds = await contractService.getUserActiveGames(address)
      const games = []
      
      for (const gameId of gameIds) {
        const details = await contractService.getGameDetails(gameId)
        games.push({
          id: gameId.toString(),
          ...details
        })
      }
      
      setActiveGames(games)

      // Load stats from database
      const response = await fetch(`${API_URL}/api/games/creator/${address}`)
      if (response.ok) {
        const userGames = await response.json()
        
        const won = userGames.filter(g => g.winner === address).length
        const lost = userGames.filter(g => g.winner && g.winner !== address).length
        const volume = userGames.reduce((sum, g) => sum + (g.price_usd || 0), 0)
        
        setProfileData(prev => ({
          ...prev,
          stats: {
            totalGames: userGames.length,
            gamesWon: won,
            gamesLost: lost,
            winRate: userGames.length > 0 ? (won / userGames.length * 100) : 0,
            totalVolume: volume,
            activeGames: games
          }
        }))
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfileData()
  }, [address, isConnected])

  // Copy address
  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Format address
  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Get game status color
  const getGameStatusColor = (state) => {
    switch (state) {
      case 0: return 'text-yellow-500' // Created
      case 1: return 'text-blue-500' // Joined
      case 2: return 'text-green-500' // InProgress
      case 3: return 'text-purple-500' // Completed
      case 4: return 'text-gray-500' // Expired
      case 5: return 'text-red-500' // Cancelled
      default: return 'text-gray-500'
    }
  }

  // Get game status text
  const getGameStatusText = (state) => {
    switch (state) {
      case 0: return 'Waiting for Player'
      case 1: return 'Player Joined'
      case 2: return 'In Progress'
      case 3: return 'Completed'
      case 4: return 'Expired'
      case 5: return 'Cancelled'
      default: return 'Unknown'
    }
  }

  return (
    <>
      {/* Profile Button */}
      <button
        onClick={() => setShowProfile(true)}
        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
      >
        {profileData.avatar ? (
          <img 
            src={profileData.avatar} 
            alt="Profile" 
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <User className="w-5 h-5 text-white" />
        )}
        <span className="text-white font-medium">
          {profileData.name || formatAddress(address)}
        </span>
      </button>

      {/* Notification System */}
      <NotificationSystem 
        address={address} 
        isConnected={isConnected} 
        currentChain={currentChain} 
      />

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Player Profile</h2>
                <button
                  onClick={() => setShowProfile(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              {/* Profile Info */}
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  {profileData.avatar ? (
                    <img 
                      src={profileData.avatar} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-700"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center border-4 border-gray-700">
                      <User className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {profileData.name || 'Anonymous Player'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <code className="text-gray-400 bg-gray-800 px-3 py-1 rounded font-mono text-sm">
                      {address}
                    </code>
                    <button
                      onClick={copyAddress}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Total Games</span>
                    <Gamepad2 className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-white">{profileData.stats.totalGames}</div>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Win Rate</span>
                    <Trophy className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div className="text-2xl font-bold text-white">{profileData.stats.winRate.toFixed(1)}%</div>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Games Won</span>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-green-500">{profileData.stats.gamesWon}</div>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Total Volume</span>
                    <Coins className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold text-white">${profileData.stats.totalVolume.toFixed(2)}</div>
                </div>
              </div>

              {/* Coin Images */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">Custom Coin Designs</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <h5 className="text-sm text-gray-400 mb-2">Heads</h5>
                    {profileData.headsImage ? (
                      <img 
                        src={profileData.headsImage} 
                        alt="Heads" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-700 rounded-lg flex items-center justify-center">
                        <Image className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <h5 className="text-sm text-gray-400 mb-2">Tails</h5>
                    {profileData.tailsImage ? (
                      <img 
                        src={profileData.tailsImage} 
                        alt="Tails" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-700 rounded-lg flex items-center justify-center">
                        <Image className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Games */}
              {activeGames.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Active Games ({activeGames.length})
                  </h4>
                  <div className="space-y-3">
                    {activeGames.map((game) => (
                      <div 
                        key={game.id}
                        className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-gray-400">
                                Game #{game.id}
                              </span>
                              <span className={`text-sm font-medium ${getGameStatusColor(game.core.state)}`}>
                                {getGameStatusText(game.core.state)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-400">
                              {game.core.gameType === 0 ? 'NFT vs Crypto' : 'NFT vs NFT'} • 
                              Round {game.progress.currentRound}/{game.progress.maxRounds}
                            </div>
                          </div>
                          <a
                            href={`/game/${game.id}`}
                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium text-sm transition-colors flex items-center gap-2"
                          >
                            View Game
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ProfileWithNotifications 