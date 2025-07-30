import { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import contractService from '../services/ContractService'

export const useContractService = () => {
  const { walletClient } = useWallet()
  const [isInitialized, setIsInitialized] = useState(false)
  
  useEffect(() => {
    const init = async () => {
      if (walletClient && !contractService.isReady()) {
        const result = await contractService.initialize(walletClient)
        setIsInitialized(result.success)
      }
    }
    init()
  }, [walletClient])
  
  return { isInitialized, contractService }
} 