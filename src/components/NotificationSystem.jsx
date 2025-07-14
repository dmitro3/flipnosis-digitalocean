import React, { useState, useEffect, useCallback } from 'react'
import { Bell, X, DollarSign, Image, AlertCircle, CheckCircle, TrendingUp, Gift, Coins } from 'lucide-react'
import contractService from '../services/ContractService'

const NotificationSystem = ({ address, isConnected, currentChain }) => {
  const [notifications, setNotifications] = useState([])
  const [unclaimedRewards, setUnclaimedRewards] = useState({
    eth: 0,
    usdc: 0,
    nfts: []
  })
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasNewNotifications, setHasNewNotifications] = useState(false)

  // Check for unclaimed rewards
  const checkUnclaimedRewards = useCallback(async () => {
    if (!address || !isConnected || !currentChain) return

    // Check if contract service is initialized before calling methods
    if (!contractService.isInitialized()) {
      console.log('ℹ️ Contract service not initialized, skipping reward check')
      return
    }

    try {
      // Get unclaimed crypto rewards
      const rewards = await contractService.getUnclaimedRewards(address)
      
      // For NFTs, we'd need to check multiple contracts
      // This is simplified - in production, track NFT contracts from games
      const nftContracts = [] // Would be populated from game history
      const unclaimedNFTs = []
      
      for (const nftContract of nftContracts) {
        try {
          const tokenIds = await contractService.getUserUnclaimedNFTs(address, nftContract)
          if (tokenIds && tokenIds.length > 0) {
            unclaimedNFTs.push({ contract: nftContract, tokenIds })
          }
        } catch (nftError) {
          console.warn('⚠️ Failed to check NFT rewards for contract:', nftContract, nftError.message)
        }
      }

      setUnclaimedRewards({
        eth: parseFloat(rewards.eth || 0),
        usdc: parseFloat(rewards.usdc || 0),
        nfts: unclaimedNFTs
      })

      // Create notifications for unclaimed rewards
      const newNotifications = []
      
      if (rewards.eth > 0) {
        newNotifications.push({
          id: `eth-${Date.now()}`,
          type: 'reward',
          title: 'Unclaimed ETH',
          message: `You have ${rewards.eth} ETH ready to withdraw!`,
          icon: <Coins className="w-5 h-5" />,
          action: 'withdraw',
          timestamp: Date.now()
        })
      }

      if (rewards.usdc > 0) {
        newNotifications.push({
          id: `usdc-${Date.now()}`,
          type: 'reward',
          title: 'Unclaimed USDC',
          message: `You have ${rewards.usdc} USDC ready to withdraw!`,
          icon: <DollarSign className="w-5 h-5" />,
          action: 'withdraw',
          timestamp: Date.now()
        })
      }

      if (unclaimedNFTs.length > 0) {
        const totalNFTs = unclaimedNFTs.reduce((sum, nft) => sum + nft.tokenIds.length, 0)
        newNotifications.push({
          id: `nfts-${Date.now()}`,
          type: 'nft',
          title: 'Unclaimed NFTs',
          message: `You have ${totalNFTs} NFT${totalNFTs > 1 ? 's' : ''} ready to claim!`,
          icon: <Image className="w-5 h-5" />,
          action: 'claim',
          timestamp: Date.now()
        })
      }

      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev])
        setHasNewNotifications(true)
      }
    } catch (error) {
      console.error('❌ Error checking unclaimed rewards:', error)
      // Don't show error to user for background checks
    }
  }, [address, isConnected, currentChain])

  // Check rewards on mount and periodically
  useEffect(() => {
    checkUnclaimedRewards()
    
    // Check every 30 seconds
    const interval = setInterval(checkUnclaimedRewards, 30000)
    
    return () => clearInterval(interval)
  }, [checkUnclaimedRewards])

  // Handle withdraw all rewards
  const handleWithdrawAll = async () => {
    if (!address || !isConnected) return

    setLoading(true)
    try {
      // Withdraw crypto rewards
      if (unclaimedRewards.eth > 0 || unclaimedRewards.usdc > 0) {
        const tx = await contractService.withdrawRewards()
        await tx.receipt
        
        // Add success notification
        setNotifications(prev => [{
          id: `success-${Date.now()}`,
          type: 'success',
          title: 'Rewards Withdrawn!',
          message: 'Your crypto rewards have been sent to your wallet.',
          icon: <CheckCircle className="w-5 h-5" />,
          timestamp: Date.now()
        }, ...prev])
      }

      // Refresh rewards
      await checkUnclaimedRewards()
    } catch (error) {
      console.error('Error withdrawing rewards:', error)
      
      setNotifications(prev => [{
        id: `error-${Date.now()}`,
        type: 'error',
        title: 'Withdrawal Failed',
        message: 'There was an error withdrawing your rewards. Please try again.',
        icon: <AlertCircle className="w-5 h-5" />,
        timestamp: Date.now()
      }, ...prev])
    } finally {
      setLoading(false)
    }
  }

  // Handle claim specific NFT
  const handleClaimNFT = async (nftContract, tokenId) => {
    if (!address || !isConnected) return

    setLoading(true)
    try {
      const tx = await contractService.withdrawNFT(nftContract, tokenId)
      await tx.receipt
      
      setNotifications(prev => [{
        id: `nft-success-${Date.now()}`,
        type: 'success',
        title: 'NFT Claimed!',
        message: 'Your NFT has been sent to your wallet.',
        icon: <CheckCircle className="w-5 h-5" />,
        timestamp: Date.now()
      }, ...prev])
      
      // Refresh rewards
      await checkUnclaimedRewards()
    } catch (error) {
      console.error('Error claiming NFT:', error)
      
      setNotifications(prev => [{
        id: `nft-error-${Date.now()}`,
        type: 'error',
        title: 'Claim Failed',
        message: 'There was an error claiming your NFT. Please try again.',
        icon: <AlertCircle className="w-5 h-5" />,
        timestamp: Date.now()
      }, ...prev])
    } finally {
      setLoading(false)
    }
  }

  // Clear notification
  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Mark as read
  const markAsRead = () => {
    setHasNewNotifications(false)
  }

  // Get notification color
  const getNotificationColor = (type) => {
    switch (type) {
      case 'reward':
        return 'border-yellow-500 bg-yellow-500/10'
      case 'nft':
        return 'border-purple-500 bg-purple-500/10'
      case 'success':
        return 'border-green-500 bg-green-500/10'
      case 'error':
        return 'border-red-500 bg-red-500/10'
      default:
        return 'border-blue-500 bg-blue-500/10'
    }
  }

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => {
            setShowNotificationPanel(!showNotificationPanel)
            markAsRead()
          }}
          className="relative p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          <Bell className="w-5 h-5 text-white" />
          {hasNewNotifications && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
          {(unclaimedRewards.eth > 0 || unclaimedRewards.usdc > 0 || unclaimedRewards.nfts.length > 0) && (
            <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unclaimedRewards.nfts.length + (unclaimedRewards.eth > 0 ? 1 : 0) + (unclaimedRewards.usdc > 0 ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Notification Panel */}
      {showNotificationPanel && (
        <div className="fixed right-4 top-16 w-96 max-h-[600px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </h3>
            <button
              onClick={() => setShowNotificationPanel(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Unclaimed Rewards Summary */}
          {(unclaimedRewards.eth > 0 || unclaimedRewards.usdc > 0 || unclaimedRewards.nfts.length > 0) && (
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-b border-yellow-500/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-yellow-400 flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Unclaimed Rewards
                </h4>
                <button
                  onClick={handleWithdrawAll}
                  disabled={loading}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-3 py-1 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {loading ? 'Claiming...' : 'Claim All'}
                </button>
              </div>
              
              <div className="space-y-2">
                {unclaimedRewards.eth > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">ETH Balance:</span>
                    <span className="font-mono text-white">{unclaimedRewards.eth.toFixed(4)} ETH</span>
                  </div>
                )}
                {unclaimedRewards.usdc > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">USDC Balance:</span>
                    <span className="font-mono text-white">{unclaimedRewards.usdc.toFixed(2)} USDC</span>
                  </div>
                )}
                {unclaimedRewards.nfts.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">NFTs to Claim:</span>
                    <span className="font-mono text-white">
                      {unclaimedRewards.nfts.reduce((sum, nft) => sum + nft.tokenIds.length, 0)} NFTs
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`mb-2 p-3 rounded-lg border ${getNotificationColor(notification.type)} relative`}
                  >
                    <button
                      onClick={() => clearNotification(notification.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    
                    <div className="flex items-start gap-3">
                      <div className="text-white mt-1">
                        {notification.icon}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-white text-sm">
                          {notification.title}
                        </h5>
                        <p className="text-gray-300 text-sm mt-1">
                          {notification.message}
                        </p>
                        <p className="text-gray-500 text-xs mt-2">
                          {formatTimeAgo(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Rewards Indicator (shows when panel is closed) */}
      {!showNotificationPanel && (unclaimedRewards.eth > 0 || unclaimedRewards.usdc > 0) && (
        <div className="fixed bottom-4 right-4 bg-yellow-500/90 backdrop-blur-sm text-black p-3 rounded-lg shadow-lg animate-pulse cursor-pointer"
             onClick={() => setShowNotificationPanel(true)}>
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            <span className="font-semibold">
              You have unclaimed rewards!
            </span>
          </div>
        </div>
      )}
    </>
  )
}

export default NotificationSystem 