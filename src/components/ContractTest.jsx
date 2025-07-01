import React, { useState, useEffect } from 'react'
import { useWalletConnection } from '../utils/useWalletConnection'
import { useWallet } from '../contexts/WalletContext'
import { MultiChainContractService, CONTRACT_ABI } from '../services/ContractService'

const ContractTest = () => {
  const { isFullyConnected, connectionError, address, walletClient, publicClient } = useWalletConnection()
  const { chain } = useWallet()
  const [contractService] = useState(() => new MultiChainContractService())
  const [testResults, setTestResults] = useState([])
  const [isTesting, setIsTesting] = useState(false)

  const addResult = (message, type = 'info') => {
    setTestResults(prev => [...prev, { message, type, timestamp: new Date().toISOString() }])
  }

  const runTests = async () => {
    setIsTesting(true)
    setTestResults([])
    
    try {
      addResult('🧪 Starting contract service tests...', 'info')
      
      // Test 1: Check wallet connection
      addResult(`🔍 Wallet connection: ${isFullyConnected ? '✅ Connected' : '❌ Not connected'}`, isFullyConnected ? 'success' : 'error')
      
      if (!isFullyConnected) {
        addResult(`❌ Connection error: ${connectionError}`, 'error')
        return
      }

      // Test 2: Check clients
      addResult(`🔍 Wallet client: ${walletClient ? '✅ Available' : '❌ Missing'}`, walletClient ? 'success' : 'error')
      addResult(`🔍 Public client: ${publicClient ? '✅ Available' : '❌ Missing'}`, publicClient ? 'success' : 'error')
      addResult(`🔍 Chain: ${chain?.name || 'Unknown'}`, 'info')

      if (!walletClient || !publicClient || !chain) {
        addResult('❌ Missing required clients or chain info', 'error')
        return
      }

      // Test 3: Initialize contract service
      try {
        const chainName = chain.name.toLowerCase()
        addResult(`🔧 Initializing contract service for ${chainName}...`, 'info')
        
        await contractService.init(chainName, walletClient, publicClient)
        addResult('✅ Contract service initialized successfully', 'success')
      } catch (error) {
        addResult(`❌ Failed to initialize contract service: ${error.message}`, 'error')
        return
      }

      // Test 4: Check if service is initialized
      const isInitialized = contractService.isInitialized()
      addResult(`🔍 Service initialized: ${isInitialized ? '✅ Yes' : '❌ No'}`, isInitialized ? 'success' : 'error')

      if (!isInitialized) {
        addResult('❌ Contract service not properly initialized', 'error')
        return
      }

      // Test 5: Try to get current config
      try {
        const config = contractService.getCurrentConfig()
        addResult(`🔍 Contract address: ${config.address}`, 'info')
        addResult(`🔍 Full config object: ${JSON.stringify(config, null, 2)}`, 'info')
        addResult('✅ Successfully retrieved contract config', 'success')
      } catch (error) {
        addResult(`❌ Failed to get contract config: ${error.message}`, 'error')
      }

      // Test 6: Try to get current clients
      try {
        const clients = contractService.getCurrentClients()
        addResult(`🔍 Wallet client available: ${!!clients.wallet}`, clients.wallet ? 'success' : 'error')
        addResult(`🔍 Public client available: ${!!clients.public}`, clients.public ? 'success' : 'error')
        addResult('✅ Successfully retrieved clients', 'success')
      } catch (error) {
        addResult(`❌ Failed to get clients: ${error.message}`, 'error')
      }

      // Test 7: Try to call a view function (getETHAmount)
      try {
        addResult('🔍 Testing getETHAmount function...', 'info')
        
        // Debug: Check clients again before calling getETHAmount
        const clientsBeforeCall = contractService.getCurrentClients()
        addResult(`🔍 Clients before getETHAmount - wallet: ${!!clientsBeforeCall.wallet}, public: ${!!clientsBeforeCall.public}`, 'info')
        
        // Try a simpler approach - call the function directly with the public client
        try {
          const config = contractService.getCurrentConfig()
          addResult(`🔍 Trying direct publicClient call...`, 'info')
          
          const directResult = await clientsBeforeCall.public.readContract({
            address: config.address,
            abi: CONTRACT_ABI,
            functionName: 'getETHAmount',
            args: [1000000], // $1.00 in 6 decimals
          })
          
          addResult(`✅ Direct call result: ${directResult} wei`, 'success')
        } catch (directError) {
          addResult(`❌ Direct call failed: ${directError.message}`, 'error')
        }
        
        // Test getCurrentClients method specifically
        try {
          addResult('🔍 Testing getCurrentClients method...', 'info')
          const testClients = contractService.getCurrentClients()
          addResult(`✅ getCurrentClients returned - wallet: ${!!testClients.wallet}, public: ${!!testClients.public}`, 'success')
          
          if (testClients.public) {
            addResult(`✅ publicClient has readContract: ${typeof testClients.public.readContract}`, 'success')
          } else {
            addResult(`❌ publicClient is undefined`, 'error')
          }
        } catch (clientsError) {
          addResult(`❌ getCurrentClients failed: ${clientsError.message}`, 'error')
        }
        
        // Now try the service method
        const ethAmount = await contractService.getETHAmount(1000000) // $1.00 in 6 decimals
        addResult(`✅ getETHAmount result: ${ethAmount} wei`, 'success')
      } catch (error) {
        addResult(`❌ getETHAmount failed: ${error.message}`, 'error')
        
        // Debug: Check what's in the contract service
        try {
          addResult(`🔍 Current chain: ${contractService.currentChain}`, 'info')
          addResult(`🔍 Available chains: ${Object.keys(contractService.clients || {}).join(', ')}`, 'info')
          addResult(`🔍 Available contracts: ${Object.keys(contractService.contracts || {}).join(', ')}`, 'info')
        } catch (debugError) {
          addResult(`🔍 Debug error: ${debugError.message}`, 'error')
        }
      }

      addResult('🎉 All tests completed!', 'success')
      
    } catch (error) {
      addResult(`❌ Test suite error: ${error.message}`, 'error')
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Contract Service Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runTests}
          disabled={isTesting}
          style={{
            padding: '10px 20px',
            background: isTesting ? '#666' : '#00FF41',
            color: 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: isTesting ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isTesting ? 'Running Tests...' : 'Run Tests'}
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Current State:</h3>
        <ul>
          <li>Wallet Connected: {isFullyConnected ? '✅ Yes' : '❌ No'}</li>
          <li>Address: {address || 'Not connected'}</li>
          <li>Chain: {chain?.name || 'Unknown'}</li>
          <li>Connection Error: {connectionError || 'None'}</li>
        </ul>
      </div>

      <div>
        <h3>Test Results:</h3>
        <div style={{ 
          background: '#1a1a1a', 
          padding: '15px', 
          borderRadius: '5px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {testResults.length === 0 ? (
            <p style={{ color: '#888' }}>No tests run yet. Click "Run Tests" to start.</p>
          ) : (
            testResults.map((result, index) => (
              <div 
                key={index} 
                style={{ 
                  marginBottom: '5px',
                  color: result.type === 'error' ? '#ff6b6b' : 
                         result.type === 'success' ? '#00FF41' : '#ffffff'
                }}
              >
                <span style={{ color: '#888' }}>[{new Date(result.timestamp).toLocaleTimeString()}]</span> {result.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default ContractTest 