// CLEAN DEPOSIT OVERLAY - WEBSOCKET ONLY
// Shows when offer is accepted and countdown begins

import { useState, useEffect } from 'react'
import { useToast } from '../ui/Toast'
import { useContractService } from '../../context/ContractContext'

const DepositOverlay = ({ 
  isVisible, 
  acceptedOffer, 
  address,
  onClose,
  webSocket
}) => {
  const { showSuccess, showError } = useToast()
  const { contractService } = useContractService()
  const [timeLeft, setTimeLeft] = useState(120) // 2 minutes
  const [isDepositing, setIsDepositing] = useState(false)

  // ===== COUNTDOWN TIMER =====
  useEffect(() => {
    if (!isVisible || !acceptedOffer) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          showError('Deposit time expired!')
          onClose()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isVisible, acceptedOffer, showError, onClose])

  // ===== DEPOSIT CRYPTO =====
  const handleDeposit = async () => {
    if (!acceptedOffer?.cryptoAmount) {
      showError('Invalid deposit amount')
      return
    }

    setIsDepositing(true)
    try {
      // Use contract service to deposit crypto
      const txHash = await contractService.depositCrypto(
        acceptedOffer.cryptoAmount,
        address
      )
      
      showSuccess('Deposit confirmed!')
      
      // Notify via WebSocket
      webSocket.confirmDeposit(address, 'crypto', txHash)
      
      onClose()
    } catch (error) {
      console.error('Deposit failed:', error)
      showError('Deposit failed: ' + error.message)
    } finally {
      setIsDepositing(false)
    }
  }

  // ===== FORMAT TIME =====
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isVisible || !acceptedOffer) return null

  const isUrgent = timeLeft <= 30

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="float-right text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-4">🎯 Offer Accepted!</h2>

        {/* Message */}
        <div className="mb-4">
          {acceptedOffer.isCreatorWaiting ? (
            <p className="text-blue-600">
              Waiting for challenger to deposit...
            </p>
          ) : acceptedOffer.needsDeposit ? (
            <p className="text-orange-600">
              You need to deposit to join the game!
            </p>
          ) : (
            <p>Processing...</p>
          )}
        </div>

        {/* Countdown */}
        <div className={`text-center mb-4 p-4 rounded ${
          isUrgent ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          <div className="text-3xl font-bold">
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm">
            {isUrgent ? '⚠️ Time running out!' : '⏰ Deposit time remaining'}
          </div>
        </div>

        {/* Amount */}
        <div className="text-center mb-4">
          <div className="text-xl font-semibold">
            ${acceptedOffer.cryptoAmount?.toFixed(2)} USD
          </div>
        </div>

        {/* Deposit Button (only for challenger) */}
        {acceptedOffer.needsDeposit && (
          <button
            onClick={handleDeposit}
            disabled={isDepositing || timeLeft === 0}
            className="w-full py-3 bg-green-500 text-white rounded font-semibold disabled:bg-gray-400"
          >
            {isDepositing ? 'Processing Deposit...' : 'Deposit Now'}
          </button>
        )}

        {/* Waiting Message (for creator) */}
        {acceptedOffer.isCreatorWaiting && (
          <div className="text-center text-gray-600">
            <p>Your NFT is already deposited.</p>
            <p>Waiting for challenger to deposit crypto...</p>
          </div>
        )}

        {/* Connection Status */}
        <div className="mt-4 text-xs text-center">
          WebSocket: {webSocket.connected ? (
            <span className="text-green-600">Connected ✅</span>
          ) : (
            <span className="text-red-600">Disconnected ❌</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default DepositOverlay
