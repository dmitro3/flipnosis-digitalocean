import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import { useWalletConnection } from '../utils/useWalletConnection'
import contractService from '../services/ContractService'
import FlipGameComponent from '../components/FlipGame'
import GameResultPopup from '../components/GameResultPopup'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import {
  Container,
  ContentWrapper,
  GameContainer,
  LoadingContainer,
  LoadingSpinner,
  ErrorContainer,
  ErrorTitle,
  ErrorMessage,
  ConnectWalletPrompt,
  PromptTitle,
  PromptText
} from '../styles/components'
import { ConnectButton } from '@rainbow-me/rainbowkit'

const FlipGame = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { isFullyConnected, connectionError, address, walletClient, publicClient } = useWalletConnection()
  const { chain } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [gameResult, setGameResult] = useState(null)
  const [isJoining, setIsJoining] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  

  
  // Initialize contract service when wallet is connected
  useEffect(() => {
    if (isFullyConnected && walletClient && publicClient && chain) {
      const chainName = chain.name.toLowerCase()
      contractService.initializeClients(chain.id, walletClient)
        .then(() => {
          console.log('✅ Contract service initialized for chain:', chainName)
        })
        .catch(error => {
          console.error('❌ Failed to initialize contract service:', error)
          setError('Failed to connect to smart contract')
        })
    }
  }, [isFullyConnected, walletClient, publicClient, chain, contractService])

  // Load game data
  useEffect(() => {
    if (gameId) {
      loadGame()
    }
  }, [gameId])

  const loadGame = async () => {
    try {
      setLoading(true)
      setError('')

      // First try to load from smart contract
      if (isFullyConnected && contractService.isInitialized()) {
        try {
          const contractGame = await contractService.getGame(gameId)
          if (contractGame.success && contractGame.game) {
            console.log('✅ Game loaded from smart contract:', contractGame.game)
            
            // Transform contract data to match our UI format
            const transformedGame = transformContractGameToUI(contractGame.game)
            setGame(transformedGame)
            setLoading(false)
            return
          }
        } catch (contractError) {
          console.warn('⚠️ Failed to load from contract, trying database:', contractError)
        }
      }

      // Fallback to database
      const API_URL = 'https://cryptoflipz2-production.up.railway.app'
      const response = await fetch(`${API_URL}/api/games/${gameId}`)
      
      if (!response.ok) {
        throw new Error('Game not found')
      }
      
      const gameData = await response.json()
      console.log('✅ Game loaded from database:', gameData)
      
      setGame(gameData)
      
    } catch (err) {
      console.error('❌ Error loading game:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const transformContractGameToUI = (contractGame) => {
    // Transform smart contract game data to match our UI format
    return {
      id: contractGame.gameId.toString(),
      creator: contractGame.creator,
      joiner: contractGame.joiner,
      nft_contract: contractGame.nftContract,
      token_id: contractGame.tokenId.toString(),
      price_usd: parseFloat(contractGame.priceUSD) / 100, // Convert from cents
      game_type: contractGame.gameType === 1 ? 'nft-vs-nft' : 'nft-vs-crypto',
      status: getGameStatus(contractGame),
      current_round: contractGame.currentRound,
      max_rounds: contractGame.maxRounds,
      creator_score: contractGame.creatorScore,
      joiner_score: contractGame.joinerScore,
      auth_info: contractGame.authInfo ? JSON.parse(contractGame.authInfo) : {},
      created_at: new Date().toISOString(),
      contract_game_id: contractGame.gameId.toString()
    }
  }

  const getGameStatus = (contractGame) => {
    if (contractGame.joiner === '0x0000000000000000000000000000000000000000') {
      return 'waiting'
    }
    if (contractGame.currentRound >= contractGame.maxRounds) {
      return 'completed'
    }
    return 'active'
  }

  const handleJoinGame = async () => {
    if (!isFullyConnected || !address) {
      showError('Please connect your wallet to join the game')
      return
    }

    if (!game) {
      showError('Game data not available')
      return
    }

    setIsJoining(true)
    try {
      showInfo('Joining game...')

      // Prepare join parameters
      const joinParams = {
        gameId: gameId,
        joiner: address,
        acceptedToken: 0, // 0 = ETH, 1 = USDC
        authInfo: JSON.stringify({
          joiner: address,
          joinedAt: new Date().toISOString()
        })
      }

      console.log('🎮 Joining game with smart contract:', joinParams)

      // Join game using smart contract
      const result = await contractService.joinGame(joinParams)
      
      if (!result.success) {
        throw new Error('Failed to join game: ' + result.error)
      }

      showSuccess('Successfully joined the game!')
      console.log('✅ Joined game on blockchain:', result)

      // Update local game state
      setGame(prev => ({
        ...prev,
        joiner: address,
        status: 'active'
      }))

      // Update database
      await updateGameInDatabase({
        joiner: address,
        status: 'active'
      })

    } catch (error) {
      console.error('❌ Error joining game:', error)
      showError('Failed to join game: ' + error.message)
    } finally {
      setIsJoining(false)
    }
  }

  const handleFlipCoin = async () => {
    if (!isFullyConnected || !address) {
      showError('Please connect your wallet to flip the coin')
      return
    }

    if (!game) {
      showError('Game data not available')
      return
    }

    setIsFlipping(true)
    try {
      showInfo('Flipping coin...')

      // Prepare flip parameters
      const flipParams = {
        gameId: gameId,
        player: address,
        authInfo: JSON.stringify({
          player: address,
          flippedAt: new Date().toISOString()
        })
      }

      console.log('🎮 Flipping coin with smart contract:', flipParams)

      // Flip coin using smart contract
      const result = await contractService.flipCoin(flipParams)
      
      if (!result.success) {
        throw new Error('Failed to flip coin: ' + result.error)
      }

      console.log('✅ Coin flipped on blockchain:', result)

      // Update local game state with new round data
      const updatedGame = await loadGameFromContract()
      if (updatedGame) {
        setGame(updatedGame)
      }

      // Show result
      setGameResult({
        winner: result.winner,
        round: result.round,
        isFinal: result.isFinal,
        transactionHash: result.transactionHash
      })

      if (result.isFinal) {
        showSuccess(`Game completed! ${result.winner === address ? 'You won!' : 'You lost!'}`)
      } else {
        showSuccess(`Round ${result.round} completed! ${result.winner === address ? 'You won this round!' : 'Opponent won this round!'}`)
      }

    } catch (error) {
      console.error('❌ Error flipping coin:', error)
      showError('Failed to flip coin: ' + error.message)
    } finally {
      setIsFlipping(false)
    }
  }

  const loadGameFromContract = async () => {
    try {
      const contractGame = await contractService.getGame(gameId)
      if (contractGame.success && contractGame.game) {
        return transformContractGameToUI(contractGame.game)
      }
    } catch (error) {
      console.error('❌ Error loading updated game from contract:', error)
    }
    return null
  }

  const updateGameInDatabase = async (updates) => {
    try {
      const API_URL = 'https://cryptoflipz2-production.up.railway.app'
      const response = await fetch(`${API_URL}/api/games/${gameId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update game in database')
      }
      
      console.log('✅ Game updated in database')
      
    } catch (error) {
      console.error('❌ Error updating game in database:', error)
    }
  }

  const handleWithdrawRewards = async () => {
    if (!isFullyConnected || !address) {
      showError('Please connect your wallet to withdraw rewards')
      return
    }

    try {
      showInfo('Checking for unclaimed rewards...')

      const result = await contractService.getUnclaimedRewards(address)
      
      if (!result.success) {
        throw new Error('Failed to check rewards: ' + result.error)
      }

      if (result.ethAmount > 0 || result.usdcAmount > 0 || result.nftCount > 0) {
        showInfo('Withdrawing rewards...')
        
        const withdrawResult = await contractService.withdrawRewards()
        
        if (!withdrawResult.success) {
          throw new Error('Failed to withdraw rewards: ' + withdrawResult.error)
        }

        showSuccess('Rewards withdrawn successfully!')
        console.log('✅ Rewards withdrawn:', withdrawResult)
      } else {
        showInfo('No unclaimed rewards found')
      }

    } catch (error) {
      console.error('❌ Error withdrawing rewards:', error)
      showError('Failed to withdraw rewards: ' + error.message)
    }
  }

  if (!isFullyConnected || !address) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <ConnectWalletPrompt>
              <PromptTitle>Connect Your Wallet</PromptTitle>
              <PromptText>
                {connectionError || 'Please connect your wallet to play the game.'}
              </PromptText>
              <ConnectButton />
              {connectionError && (
                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#FF6B6B' }}>
                  {connectionError}
                </div>
              )}
            </ConnectWalletPrompt>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <LoadingContainer>
              <LoadingSpinner />
              <div>Loading game...</div>
            </LoadingContainer>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <ErrorContainer>
              <ErrorTitle>Error Loading Game</ErrorTitle>
              <ErrorMessage>{error}</ErrorMessage>
              <button 
                onClick={() => navigate('/')}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(45deg, #00FF41, #39FF14)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#000',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Go Home
              </button>
            </ErrorContainer>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }

  if (!game) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <ErrorContainer>
              <ErrorTitle>Game Not Found</ErrorTitle>
              <ErrorMessage>This game doesn't exist or has been removed.</ErrorMessage>
              <button 
                onClick={() => navigate('/')}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(45deg, #00FF41, #39FF14)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#000',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Go Home
              </button>
            </ErrorContainer>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <ContentWrapper>
          <GameContainer>
            <FlipGameComponent
              game={game}
              currentPlayer={address}
              onJoinGame={handleJoinGame}
              onFlipCoin={handleFlipCoin}
              onWithdrawRewards={handleWithdrawRewards}
              isJoining={isJoining}
              isFlipping={isFlipping}
              contractService={contractService}
              gameId={gameId}
              socket={null}
              connected={false}
            />
          </GameContainer>
        </ContentWrapper>

        {gameResult && (
          <GameResultPopup
            result={gameResult}
            onClose={() => setGameResult(null)}
            onPlayAgain={() => {
              setGameResult(null)
              navigate('/create')
            }}
          />
        )}
      </Container>
    </ThemeProvider>
  )
}

export default FlipGame 