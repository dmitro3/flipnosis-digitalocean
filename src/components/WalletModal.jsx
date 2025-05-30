import React, { useState } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'

const WalletModal = ({ onClose }) => {
  const { connectWallet, chains, loading } = useWallet()
  const { showError, showSuccess } = useToast()
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async () => {
    setConnecting(true)
    
    try {
      const success = await connectWallet()
      if (success) {
        showSuccess('Connected with MetaMask')
        onClose()
      } else {
        showError('Failed to connect wallet')
      }
    } catch (error) {
      console.error('Connection failed:', error)
      showError(error.message || 'Failed to connect wallet')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold gradient-text">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl transition-colors"
          >
            ×
          </button>
        </div>

        <p className="text-gray-300 mb-8 text-center">
          Connect your MetaMask wallet to start flipping NFTs
        </p>

        <button
          onClick={handleConnect}
          disabled={connecting}
          className="w-full p-6 border border-border-color rounded-xl hover:bg-card-bg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              🦊
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-xl text-white group-hover:text-primary transition-colors">
                MetaMask
              </h3>
              <p className="text-gray-400 text-sm">Connect using MetaMask</p>
            </div>
            {connecting && (
              <div className="loading-spinner w-6 h-6"></div>
            )}
          </div>
        </button>

        <div className="mt-8 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg">
          <h4 className="font-semibold text-primary mb-2 flex items-center">
            <span className="mr-2">🌐</span>
            Multi-Chain Support
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.values(chains).map((chain) => (
              <span key={chain.name} className="text-xs bg-card-bg px-2 py-1 rounded-full text-gray-300 flex items-center">
                <span className="mr-1">{chain.icon}</span>
                {chain.name}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            The app will work with whatever network you're currently connected to in MetaMask
          </p>
        </div>
      </div>
    </div>
  )
}

export default WalletModal 