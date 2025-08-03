import { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import contractService from '../services/ContractService'

export const useContractService = () => {
  const { walletClient, publicClient } = useWallet()
  const [isInitialized, setIsInitialized] = useState(false)
  
  useEffect(() => {
    const init = async () => {
      if (walletClient && publicClient && !contractService.isReady()) {
        const result = await contractService.initialize(walletClient, publicClient)
        setIsInitialized(result.success)
      }
    }
    init()
  }, [walletClient, publicClient])
  
  return { isInitialized, contractService }
} 