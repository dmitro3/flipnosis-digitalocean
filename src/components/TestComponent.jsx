import React from 'react'
import { useWallet } from '../contexts/WalletContext'
import { useContractService } from '../utils/useContractService'

const TestComponent = () => {
  console.log('🧪 TestComponent - Starting render')
  
  try {
    const wallet = useWallet()
    console.log('🧪 TestComponent - Wallet context loaded:', {
      isConnected: wallet.isConnected,
      address: wallet.address
    })
    
    const contract = useContractService()
    console.log('🧪 TestComponent - Contract service loaded:', {
      isInitialized: contract.isInitialized
    })
    
    return (
      <div style={{ padding: '20px', background: '#f0f0f0', margin: '10px' }}>
        <h3>Test Component</h3>
        <p>Wallet Connected: {wallet.isConnected ? 'Yes' : 'No'}</p>
        <p>Contract Initialized: {contract.isInitialized ? 'Yes' : 'No'}</p>
        <p>Address: {wallet.address || 'None'}</p>
      </div>
    )
  } catch (error) {
    console.error('🧪 TestComponent - Error:', error)
    return (
      <div style={{ padding: '20px', background: '#ffcccc', margin: '10px' }}>
        <h3>Test Component Error</h3>
        <p>Error: {error.message}</p>
        <pre>{error.stack}</pre>
      </div>
    )
  }
}

export default TestComponent 