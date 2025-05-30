import React from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'

const FlipCard = ({ flip }) => {
  const { chains } = useWallet()
  const chain = chains[flip.chain] || { name: flip.chain, icon: '🌐' }

  const formatTimeLeft = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-400'
      case 'waiting':
        return 'text-yellow-400'
      case 'ended':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return '🟢 Active'
      case 'waiting':
        return '⏳ Waiting'
      case 'ended':
        return '🔴 Ended'
      default:
        return status
    }
  }

  return (
    <div className="card group hover:scale-105 transition-all">
      {/* NFT Image */}
      <div className="relative aspect-square overflow-hidden rounded-t-lg">
        <img
          src={flip.nft.image}
          alt={flip.nft.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 bg-card-bg px-3 py-1 rounded-full text-sm font-medium">
          <span className="mr-1">{chain.icon}</span>
          {chain.name}
        </div>
      </div>

      {/* NFT Info */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{flip.nft.name}</h3>
          <p className="text-gray-400 text-sm">{flip.nft.collection}</p>
        </div>

        {/* Game Details */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Price</span>
            <span className="font-bold text-white">
              ${flip.priceUSD.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Rounds</span>
            <span className="font-bold text-white">
              Best of {flip.rounds}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Creator</span>
            <span className="font-mono text-sm text-gray-300">
              {flip.creator}
            </span>
          </div>
        </div>

        {/* Status & Action */}
        <div className="pt-4 border-t border-border-color">
          <div className="flex justify-between items-center mb-4">
            <span className={`font-medium ${getStatusColor(flip.status)}`}>
              {getStatusText(flip.status)}
            </span>
            <span className="text-sm text-gray-400">
              {new Date(flip.createdAt).toLocaleDateString()}
            </span>
          </div>
          <Link
            to={`/flip/${flip.id}`}
            className="btn-primary w-full text-center"
          >
            {flip.status === 'waiting' ? 'Join Game' : 'View Details'}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default FlipCard 