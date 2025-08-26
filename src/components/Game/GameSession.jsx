import React, { useState, useEffect, useRef, useMemo } from 'react'
import styled from 'styled-components'
import { useParams, useNavigate } from 'react-router-dom'
import { useWallet } from '../../contexts/WalletContext'
import { useToast } from '../../contexts/ToastContext'
import webSocketService from '../../services/WebSocketService'
import OptimizedCoinWrapper from './OptimizedCoinWrapper'
import PlayerCard from './PlayerCard'
import ChatContainer from '../Lobby/ChatContainer'
import OffersContainer from '../Lobby/OffersContainer'
import NFTDetailsContainer from '../Lobby/NFTDetailsContainer'
import { getApiUrl } from '../../config/api'

const GameContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: ${props => props.layout === 'game' ? 'row' : 'column'};
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
  position: relative;
  overflow: hidden;
`

const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: ${props => props.expanded ? '350px' : '300px'};
  transition: all 0.3s ease;
  opacity: ${props => props.show ? 1 : 0};
  transform: ${props => props.show ? 'translateX(0)' : 'translateX(-20px)'};
`

const CenterArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 30px;
  position: relative;
`

const GameArea = styled.div`
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`

const PlayersContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 40px;
`

const CoinContainer = styled.div`
  width: ${props => props.size || '300px'};
  height: ${props => props.size || '300px'};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`

const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  width: 100%;
  max-width: 400px;
`

const ChoiceButtons = styled.div`
  display: flex;
  gap: 20px;
  opacity: ${props => props.show ? 1 : 0.5};
  pointer-events: ${props => props.show ? 'auto' : 'none'};
  transition: all 0.3s ease;
`

const ChoiceButton = styled.button`
  padding: 15px 30px;
  font-size: 18px;
  font-weight: bold;
  border: 2px solid ${props => props.selected ? '#00ff88' : '#444'};
  border-radius: 10px;
  background: ${props => props.selected ? 
    'linear-gradient(45deg, #00ff88, #00ff44)' : 
    'linear-gradient(45deg, #2a2a2a, #1a1a1a)'};
  color: ${props => props.selected ? '#000' : '#fff'};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 20px rgba(0, 255, 136, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const PowerBar = styled.div`
  width: 100%;
  height: 40px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
`

const PowerFill = styled.div`
  height: 100%;
  width: ${props => props.power}%;
  background: linear-gradient(90deg, #ff1493, #ff69b4);
  transition: width 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #fff;
`

const PowerButton = styled.button`
  padding: 12px 30px;
  font-size: 16px;
  font-weight: bold;
  background: linear-gradient(45deg, #ff1493, #ff69b4);
  border: none;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 20px rgba(255, 20, 147, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const CountdownOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: ${props => props.show ? 1 : 0};
  pointer-events: ${props => props.show ? 'auto' : 'none'};
  transition: opacity 0.5s ease;
`

const CountdownNumber = styled.div`
  font-size: 120px;
  font-weight: bold;
  color: #00ff88;
  text-shadow: 0 0 40px rgba(0, 255, 136, 0.8);
  animation: pulse 1s ease-in-out infinite;
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
`

const RoundIndicator = styled.div`
  display: flex;
  gap: 10px;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 20px;
`

const RoundDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.active ? '#00ff88' : 
               props.won ? '#ffd700' : '#444'};
  transition: all 0.3s ease;
`

const StatusMessage = styled.div`
  padding: 15px 30px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 10px;
  text-align: center;
  font-size: 18px;
  color: #fff;
  border: 1px solid #444;
`

const GameSession = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { address, isMobile } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()
  
  // Game state
  const [gameData, setGameData] = useState(null)
  const [gamePhase, setGamePhase] = useState('waiting')
  const [players, setPlayers] = useState({ creator: null, joiner: null })
  const [scores, setScores] = useState({ creator: 0, joiner: 0 })
  const [currentRound, setCurrentRound] = useState(1)
  const [currentTurn, setCurrentTurn] = useState('creator')
  const [myRole, setMyRole] = useState('spectator')
  
  // UI state
  const [showOffers, setShowOffers] = useState(true)
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdownNumber, setCountdownNumber] = useState(3)
  const [layoutMode, setLayoutMode] = useState('lobby') // lobby | game
  
  // Game interaction state
  const [choice, setChoice] = useState(null)
  const [opponentChoice, setOpponentChoice] = useState(null)
  const [powerLevel, setPowerLevel] = useState(0)
  const [isCharging, setIsCharging] = useState(false)
  const [flipResult, setFlipResult] = useState(null)
  
  // Chat and offers
  const [chatMessages, setChatMessages] = useState([])
  const [offers, setOffers] = useState([])
  
  // Coin state
  const [serverCoinRotation, setServerCoinRotation] = useState(0)
  const [coinFlipping, setCoinFlipping] = useState(false)
  
  // Timer refs
  const chargeInterval = useRef(null)
  const countdownInterval = useRef(null)
  
  // Load initial game data
  useEffect(() => {
    loadGameData()
  }, [gameId])
  
  const loadGameData = async () => {
    try {
      const response = await fetch(getApiUrl(`/games/${gameId}`))
      const data = await response.json()
      setGameData(data)
      
      // Set players
      setPlayers({
        creator: data.creator,
        joiner: data.challenger || data.joiner
      })
    } catch (error) {
      console.error('Error loading game:', error)
      showError('Failed to load game')
    }
  }
  
  // WebSocket connection
  useEffect(() => {
    if (!gameId || !address) return
    
    const connectWebSocket = async () => {
      try {
        await webSocketService.connect(`game_${gameId}`, address)
        
        // Join game
        webSocketService.send({
          type: 'join_game',
          gameId,
          address
        })
        
        // Register handlers
        webSocketService.on('game_joined', handleGameJoined)
        webSocketService.on('game_transition_started', handleGameTransition)
        webSocketService.on('countdown_update', handleCountdownUpdate)
        webSocketService.on('game_started', handleGameStarted)
        webSocketService.on('turn_changed', handleTurnChanged)
        webSocketService.on('choice_made', handleChoiceMade)
        webSocketService.on('power_phase_started', handlePowerPhase)
        webSocketService.on('power_charged', handlePowerCharged)
        webSocketService.on('flip_started', handleFlipStarted)
        webSocketService.on('coin_frame', handleCoinFrame)
        webSocketService.on('flip_result', handleFlipResult)
        webSocketService.on('next_round', handleNextRound)
        webSocketService.on('game_completed', handleGameCompleted)
        webSocketService.on('deposit_received', handleDepositReceived)
        webSocketService.on('chat_message', handleChatMessage)
        webSocketService.on('offer_made', handleOfferMade)
        webSocketService.on('offer_accepted', handleOfferAccepted)
        
      } catch (error) {
        console.error('WebSocket connection failed:', error)
        showError('Failed to connect to game')
      }
    }
    
    connectWebSocket()
    
    return () => {
      // Clean up
      webSocketService.disconnect()
      if (chargeInterval.current) clearInterval(chargeInterval.current)
      if (countdownInterval.current) clearInterval(countdownInterval.current)
    }
  }, [gameId, address])
  
  // Message handlers
  const handleGameJoined = (data) => {
    setMyRole(data.role)
    setGamePhase(data.phase)
    setScores(data.scores)
    setCurrentRound(data.currentRound)
    setCurrentTurn(data.currentTurn || 'creator')
    setOffers(data.offers || [])
    setChatMessages(data.messages || [])
    
    if (data.players) {
      setPlayers(data.players)
    }
  }
  
  const handleGameTransition = (data) => {
    console.log('🎮 Game transition started!')
    setShowOffers(false)
    setLayoutMode('game')
    setShowCountdown(true)
    setCountdownNumber(3)
    showInfo('Game starting!')
  }
  
  const handleCountdownUpdate = (data) => {
    setCountdownNumber(data.count)
    if (data.count === 0) {
      setShowCountdown(false)
    }
  }
  
  const handleGameStarted = (data) => {
    setGamePhase('choosing')
    setLayoutMode('game')
    setShowOffers(false)
    setCurrentTurn(data.currentTurn)
    showSuccess('Game started! Player 1 goes first.')
  }
  
  const handleTurnChanged = (data) => {
    setCurrentTurn(data.currentTurn)
    if (data.currentTurn === myRole) {
      showInfo('Your turn!')
    }
  }
  
  const handleChoiceMade = (data) => {
    if (data.player !== myRole) {
      setOpponentChoice(true) // Just show they made a choice
    }
  }
  
  const handlePowerPhase = (data) => {
    setGamePhase('power')
    showInfo('Both players chosen! Charge your power!')
  }
  
  const handlePowerCharged = (data) => {
    if (data.player !== myRole) {
      // Update opponent power display if needed
    }
  }
  
  const handleFlipStarted = (data) => {
    setGamePhase('flipping')
    setCoinFlipping(true)
    setChoice(data.choices[myRole])
    setOpponentChoice(data.choices[myRole === 'creator' ? 'joiner' : 'creator'])
    showInfo('Flipping coin!')
  }
  
  const handleCoinFrame = (data) => {
    setServerCoinRotation(data.rotation)
  }
  
  const handleFlipResult = (data) => {
    setCoinFlipping(false)
    setFlipResult(data.result)
    setScores(data.scores)
    
    const winner = data.roundWinner === myRole ? 'You' : 'Opponent'
    showInfo(`${winner} won this round! Result: ${data.result}`)
    
    // Reset for next round
    setTimeout(() => {
      setChoice(null)
      setOpponentChoice(null)
      setPowerLevel(0)
      setFlipResult(null)
    }, 3000)
  }
  
  const handleNextRound = (data) => {
    setCurrentRound(data.round)
    setCurrentTurn(data.currentTurn)
    setGamePhase('choosing')
    setScores(data.scores)
  }
  
  const handleGameCompleted = (data) => {
    setGamePhase('completed')
    const winner = data.winner === myRole ? 'You' : 'Opponent'
    showSuccess(`Game Over! ${winner} won!`)
  }
  
  const handleDepositReceived = (data) => {
    if (data.bothDeposited) {
      showSuccess('Both players deposited! Game starting...')
    } else {
      showInfo(`${data.player === address ? 'Your' : 'Opponent'} deposit confirmed`)
    }
  }
  
  const handleChatMessage = (data) => {
    setChatMessages(prev => [...prev, data])
  }
  
  const handleOfferMade = (data) => {
    setOffers(prev => [...prev, data.offer])
  }
  
  const handleOfferAccepted = (data) => {
    showInfo('Offer accepted! Waiting for deposit...')
    setGamePhase('deposit')
  }
  
  // Game actions
  const makeChoice = (selectedChoice) => {
    if (currentTurn !== myRole) {
      showError('Not your turn!')
      return
    }
    
    setChoice(selectedChoice)
    webSocketService.send({
      type: 'choice_made',
      gameId,
      choice: selectedChoice
    })
  }
  
  const startCharging = () => {
    if (!choice) {
      showError('Make a choice first!')
      return
    }
    
    setIsCharging(true)
    chargeInterval.current = setInterval(() => {
      setPowerLevel(prev => {
        if (prev >= 100) {
          releasePower()
          return 100
        }
        return prev + 2
      })
    }, 50)
  }
  
  const releasePower = () => {
    if (chargeInterval.current) {
      clearInterval(chargeInterval.current)
      chargeInterval.current = null
    }
    
    setIsCharging(false)
    
    webSocketService.send({
      type: 'power_charged',
      gameId,
      powerLevel
    })
  }
  
  const sendChatMessage = (message) => {
    webSocketService.send({
      type: 'chat_message',
      gameId,
      message
    })
  }
  
  const confirmDeposit = () => {
    webSocketService.send({
      type: 'deposit_confirmed',
      gameId,
      assetType: myRole === 'creator' ? 'nft' : 'eth'
    })
  }
  
  // Render helpers
  const isMyTurn = currentTurn === myRole
  const isPlayer = myRole === 'creator' || myRole === 'joiner'
  const canInteract = isPlayer && gamePhase === 'choosing' && isMyTurn
  
  // Coin configuration
  const coinConfig = useMemo(() => ({
    gamePhase,
    isFlipping: coinFlipping,
    flipResult,
    customHeadsImage: gameData?.coinData?.headsImage || '/coins/plainh.png',
    customTailsImage: gameData?.coinData?.tailsImage || '/coins/plaint.png',
    size: isMobile ? 200 : 300
  }), [gameData, coinFlipping, flipResult, gamePhase, isMobile])
  
  return (
    <GameContainer layout={layoutMode}>
      {/* Countdown Overlay */}
      <CountdownOverlay show={showCountdown}>
        <CountdownNumber>{countdownNumber > 0 ? countdownNumber : 'GO!'}</CountdownNumber>
      </CountdownOverlay>
      
      {/* Left Panel */}
      <LeftPanel show={true} expanded={layoutMode === 'game'}>
        {/* Chat - Always visible, moves to top-left in game mode */}
        <ChatContainer
          gameId={gameId}
          gameData={gameData}
          socket={webSocketService}
          connected={true}
        />
        
        {/* NFT Details - Only in game mode */}
        {layoutMode === 'game' && gameData && (
          <NFTDetailsContainer
            gameData={gameData}
            isCreator={myRole === 'creator'}
            currentTurn={currentTurn}
            nftData={{
              image: gameData?.nft_image,
              name: gameData?.nft_name,
              contract_address: gameData?.nft_contract_address,
              token_id: gameData?.nft_token_id
            }}
            currentChain={gameData?.chain || 'base'}
          />
        )}
      </LeftPanel>
      
      {/* Center Area */}
      <CenterArea>
        {layoutMode === 'lobby' ? (
          <>
            {/* Lobby Mode - Offers visible */}
            {showOffers && (
              <OffersContainer
                gameId={gameId}
                gameData={gameData}
                socket={webSocketService}
                connected={true}
                offers={offers}
                isCreator={() => myRole === 'creator'}
                onOfferSubmitted={(offerData) => {
                  console.log('Offer submitted:', offerData)
                }}
                onOfferAccepted={(offer) => {
                  webSocketService.send({
                    type: 'accept_offer',
                    gameId,
                    offerId: offer.id
                  })
                }}
              />
            )}
          </>
        ) : (
          <>
            {/* Game Mode */}
            <GameArea>
              {/* Round Indicator */}
              <RoundIndicator>
                {[1, 2, 3, 4, 5].map(round => (
                  <RoundDot
                    key={round}
                    active={round === currentRound}
                    won={round < currentRound && scores[myRole] > 0}
                  />
                ))}
              </RoundIndicator>
              
              {/* Players */}
              <PlayersContainer>
                <PlayerCard
                  player={{
                    name: "Player 1",
                    address: players.creator
                  }}
                  score={scores.creator}
                  choice={gamePhase === 'flipping' && myRole === 'creator' ? choice : null}
                  power={myRole === 'creator' ? powerLevel : 0}
                  isActive={currentTurn === 'creator'}
                />
                
                <PlayerCard
                  player={{
                    name: "Player 2",
                    address: players.joiner
                  }}
                  score={scores.joiner}
                  choice={gamePhase === 'flipping' && myRole === 'joiner' ? choice : null}
                  power={myRole === 'joiner' ? powerLevel : 0}
                  isActive={currentTurn === 'joiner'}
                />
              </PlayersContainer>
              
              {/* Coin */}
              <CoinContainer>
                <OptimizedCoinWrapper
                  {...coinConfig}
                  isMobile={isMobile}
                />
              </CoinContainer>
              
              {/* Controls */}
              {isPlayer && (
                <ControlsContainer>
                  {gamePhase === 'choosing' && (
                    <>
                      <StatusMessage>
                        {isMyTurn ? 'Your turn! Choose heads or tails' : 'Waiting for opponent...'}
                      </StatusMessage>
                      
                      <ChoiceButtons show={isMyTurn}>
                        <ChoiceButton
                          selected={choice === 'heads'}
                          onClick={() => makeChoice('heads')}
                          disabled={!isMyTurn || choice !== null}
                        >
                          HEADS
                        </ChoiceButton>
                        
                        <ChoiceButton
                          selected={choice === 'tails'}
                          onClick={() => makeChoice('tails')}
                          disabled={!isMyTurn || choice !== null}
                        >
                          TAILS
                        </ChoiceButton>
                      </ChoiceButtons>
                    </>
                  )}
                  
                  {gamePhase === 'power' && (
                    <>
                      <StatusMessage>Charge your power!</StatusMessage>
                      
                      <PowerBar>
                        <PowerFill power={powerLevel}>
                          {powerLevel}%
                        </PowerFill>
                      </PowerBar>
                      
                      <PowerButton
                        onMouseDown={startCharging}
                        onMouseUp={releasePower}
                        onTouchStart={startCharging}
                        onTouchEnd={releasePower}
                        disabled={!choice}
                      >
                        {isCharging ? 'RELEASE!' : 'HOLD TO CHARGE'}
                      </PowerButton>
                    </>
                  )}
                  
                  {gamePhase === 'flipping' && (
                    <StatusMessage>Flipping coin...</StatusMessage>
                  )}
                  
                  {gamePhase === 'completed' && (
                    <StatusMessage>
                      Game Over! {scores.creator > scores.joiner ? 'Player 1' : 'Player 2'} wins!
                    </StatusMessage>
                  )}
                </ControlsContainer>
              )}
              
              {/* Spectator Message */}
              {!isPlayer && (
                <StatusMessage>
                  Watching as spectator. Round {currentRound} of 5
                </StatusMessage>
              )}
            </GameArea>
          </>
        )}
      </CenterArea>
    </GameContainer>
  )
}

export default GameSession
