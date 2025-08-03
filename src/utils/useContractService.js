import { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import contractService from '../services/ContractService'

export const useContractService = () => {
  const { walletClient, publicClient, address } = useWallet()
  const [isInitialized, setIsInitialized] = useState(false)
  
  useEffect(() => {
    const init = async () => {
      if (walletClient && address && !contractService.isReady()) {
        const result = await contractService.initialize(walletClient, address)
        setIsInitialized(result.success)
      }
    }
    init()
  }, [walletClient, address])
  
  return { isInitialized, contractService }
} 