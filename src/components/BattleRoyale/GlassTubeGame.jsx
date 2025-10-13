import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { useBattleRoyaleGame } from '../../contexts/BattleRoyaleGameContext'
import { useWallet } from '../../contexts/WalletContext'
import socketService from '../../services/SocketService'
import CoinSelector from '../CoinSelector'
import './GlassTubeGame.css'

const GlassTubeGame = () => {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const webglRendererRef = useRef(null)
  const cssRendererRef = useRef(null)
  const bloomComposerRef = useRef(null)
  const tubesRef = useRef([])
  const coinsRef = useRef([])
  const cardsRef = useRef([])
  const animationIdRef = useRef(null)
  const frameCountRef = useRef(0)

  // Game state from context
  const { gameState, playerCoinImages, address, updateCoin } = useBattleRoyaleGame()
  const { showToast } = useWallet()

  // Local state
  const [showCoinSelector, setShowCoinSelector] = useState(false)
  const [selectedPlayerForCoin, setSelectedPlayerForCoin] = useState(null)
  const [currentRound, setCurrentRound] = useState(1)
  const [gamePhase, setGamePhase] = useState('waiting') // waiting, playing, ended
  const [activePlayer, setActivePlayer] = useState(null)
  const [flipResults, setFlipResults] = useState({})
  const [eliminatedPlayers, setEliminatedPlayers] = useState([])

  // Color palette
  const COLORS = {
    cyan: 0x00ffff,
    purple: 0x8A00C4,
    pink: 0xff1493,
    gold: 0xFFD700,
    glass: 0x88ccff
  }

  // Get active players (not eliminated)
  const activePlayers = gameState?.playerOrder?.filter(addr => 
    gameState.players?.[addr.toLowerCase()] && 
    !eliminatedPlayers.includes(addr.toLowerCase())
  ) || []

  // Initialize the 3D scene
  const initializeScene = useCallback(() => {
    if (!containerRef.current || !gameState) return

    console.log('🎮 Initializing 4-Player Glass Tube Game with real data', {
      phase: gameState.phase,
      players: gameState.currentPlayers,
      playerOrder: gameState.playerOrder
    })

    // Clear existing content
    if (containerRef.current.firstChild) {
      containerRef.current.innerHTML = ''
    }

    // ===== SCENE =====
    const scene = new THREE.Scene()
    scene.background = null // Transparent to show background image
    sceneRef.current = scene

    // ===== CAMERA - FLATTER VIEW =====
    const width = window.innerWidth
    const height = window.innerHeight
    const camera = new THREE.PerspectiveCamera(30, width / height, 1, 5000)
    camera.position.set(0, 100, 1400) // Much flatter - lower Y, higher Z
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // ===== WEBGL RENDERER =====
    const webglRenderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    })
    webglRenderer.setSize(width, height)
    webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    webglRenderer.toneMapping = THREE.ReinhardToneMapping
    webglRenderer.toneMappingExposure = 1.2
    containerRef.current.appendChild(webglRenderer.domElement)
    webglRendererRef.current = webglRenderer

    // ===== POST-PROCESSING =====
    const bloomComposer = new EffectComposer(webglRenderer)
    const renderPass = new RenderPass(scene, camera)
    bloomComposer.addPass(renderPass)
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.45,  // 70% less glow
      0.4,
      0.85
    )
    bloomComposer.addPass(bloomPass)
    bloomComposerRef.current = bloomComposer

    // ===== CSS3D RENDERER =====
    const cssRenderer = new CSS3DRenderer()
    cssRenderer.setSize(width, height)
    cssRenderer.domElement.style.position = 'absolute'
    cssRenderer.domElement.style.top = '0'
    cssRenderer.domElement.style.pointerEvents = 'none'
    containerRef.current.appendChild(cssRenderer.domElement)
    cssRendererRef.current = cssRenderer

    // ===== LIGHTING =====
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const topLight = new THREE.DirectionalLight(0xffffff, 1.5)
    topLight.position.set(0, 600, 400)
    topLight.castShadow = true
    topLight.shadow.mapSize.width = 2048
    topLight.shadow.mapSize.height = 2048
    topLight.shadow.camera.near = 0.5
    topLight.shadow.camera.far = 1000
    topLight.shadow.camera.left = -400
    topLight.shadow.camera.right = 400
    topLight.shadow.camera.top = 400
    topLight.shadow.camera.bottom = -400
    scene.add(topLight)

    // ===== CREATE 4 GLASS TUBES =====
    tubesRef.current = []
    coinsRef.current = []
    cardsRef.current = []

    // Tube positions for 4 players (centered)
    const tubePositions = [
      { x: -600, color: COLORS.cyan },
      { x: -200, color: COLORS.purple },
      { x: 200, color: COLORS.pink },
      { x: 600, color: COLORS.gold }
    ]

    tubePositions.forEach((pos, i) => {
      const tube = createGlassTube(pos.x, pos.color, i)
      scene.add(tube.tube)
      tubesRef.current.push(tube)

      // Create coin for this tube
      const coin = createCoin(pos.x)
      scene.add(coin)
      coinsRef.current.push(coin)

      // Create player card
      const card = createPlayerCard(pos.x, i)
      scene.add(card)
      cardsRef.current.push(card)
    })

    console.log('✅ Scene initialized with 4 tubes and real player data')

  }, [gameState])

  // Create a glass tube
  const createGlassTube = (x, color, index) => {
    const tubeGroup = new THREE.Group()
    tubeGroup.position.x = x

    // Glass tube geometry
    const tubeGeometry = new THREE.CylinderGeometry(80, 80, 400, 32)
    const tubeMaterial = new THREE.MeshPhysicalMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      transmission: 0.9,
      ior: 1.5
    })
    
    const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial)
    tubeMesh.position.y = 200
    tubeMesh.castShadow = true
    tubeMesh.receiveShadow = true
    tubeMesh.layers.set(0) // Main scene layer
    tubeGroup.add(tubeMesh)

    // Liquid inside tube
    const liquidGeometry = new THREE.CylinderGeometry(75, 75, 350, 32)
    const liquidMaterial = new THREE.MeshPhysicalMaterial({
      color: color,
      transparent: true,
      opacity: 0.6,
      roughness: 0.2,
      metalness: 0.1
    })
    
    const liquidMesh = new THREE.Mesh(liquidGeometry, liquidMaterial)
    liquidMesh.position.y = 175
    liquidMesh.layers.set(0)
    tubeGroup.add(liquidMesh)

    // Add lighting for the liquid
    const liquidLight = new THREE.PointLight(color, 0.5, 200)
    liquidLight.position.set(0, 175, 0)
    liquidLight.layers.set(1) // Bloom layer
    tubeGroup.add(liquidLight)

    // Store tube properties
    tubeGroup.tube = tubeMesh
    tubeGroup.liquid = liquidMesh
    tubeGroup.liquidLight = liquidLight
    tubeGroup.color = color
    tubeGroup.power = 0
    tubeGroup.isFlipping = false
    tubeGroup.isFilling = false
    tubeGroup.isShattered = false
    tubeGroup.foamIntensity = 0
    tubeGroup.liquidParticles = []
    tubeGroup.liquidParticleMeshes = []
    tubeGroup.glassShards = []

    return tubeGroup
  }

  // Create a coin
  const createCoin = (x) => {
    const coinGroup = new THREE.Group()
    coinGroup.position.set(x, 200, 0)

    // Coin geometry
    const coinGeometry = new THREE.CylinderGeometry(40, 40, 8, 16)
    const coinMaterial = new THREE.MeshPhysicalMaterial({
      color: COLORS.gold,
      metalness: 0.8,
      roughness: 0.2,
      clearcoat: 1.0
    })
    
    const coinMesh = new THREE.Mesh(coinGeometry, coinMaterial)
    coinMesh.castShadow = true
    coinMesh.receiveShadow = true
    coinMesh.layers.set(0)
    coinGroup.add(coinMesh)

    // Add glow effect
    const glowGeometry = new THREE.CylinderGeometry(45, 45, 2, 16)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.gold,
      transparent: true,
      opacity: 0.3
    })
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
    glowMesh.position.y = 4
    glowMesh.layers.set(1) // Bloom layer
    coinGroup.add(glowMesh)

    return coinGroup
  }

  // Create a player card
  const createPlayerCard = (x, index) => {
    const cardElement = document.createElement('div')
    cardElement.className = 'player-card'
    cardElement.style.position = 'absolute'
    cardElement.style.transform = 'translate(-50%, -50%)'
    
    // Get player data
    const playerAddr = gameState?.playerOrder?.[index]
    const player = playerAddr ? gameState.players?.[playerAddr.toLowerCase()] : null
    const isCurrentPlayer = playerAddr?.toLowerCase() === address?.toLowerCase()
    const isEliminated = eliminatedPlayers.includes(playerAddr?.toLowerCase())

    if (player) {
      cardElement.innerHTML = `
        <div class="card-header">
          <img src="/images/avatar-placeholder.png" alt="Avatar" class="player-avatar">
          <div class="player-info">
            <div class="player-name">${isCurrentPlayer ? 'YOU' : playerAddr.slice(0, 6) + '...' + playerAddr.slice(-4)}</div>
            <div class="player-address">${playerAddr}</div>
          </div>
        </div>
        <div class="lives-container">
          ${[1, 2, 3].map(i => 
            `<img src="/Images/potionpng.png" alt="life" class="life" style="opacity: ${i <= player.lives ? 1 : 0.3}">`
          ).join('')}
        </div>
        ${player.choice ? `<div class="choice-display">${player.choice.toUpperCase()}</div>` : ''}
        ${isCurrentPlayer && !isEliminated ? '<button class="flip-button">FLIP</button>' : ''}
      `
    } else {
      cardElement.innerHTML = '<div class="empty-slot">WAITING...</div>'
    }

    const cardObject = new CSS3DObject(cardElement)
    cardObject.position.set(x, -200, 0)
    cardObject.layers.set(0)
    
    return cardObject
  }

  // Handle coin flip with server authority
  const handleFlipRequest = useCallback(async (playerAddr, choice, power) => {
    try {
      console.log(`🪙 Starting flip for ${playerAddr}: ${choice} at ${power}% power`)
      
      // Request flip from server with commit-reveal
      const flipRequest = {
        gameId: gameState.gameId,
        playerAddress: playerAddr,
        choice: choice,
        power: power,
        coinData: gameState.players[playerAddr.toLowerCase()]?.coin
      }

      // Start flip animation immediately (client-side)
      const tubeIndex = activePlayers.indexOf(playerAddr)
      if (tubeIndex >= 0) {
        const tube = tubesRef.current[tubeIndex]
        const coin = coinsRef.current[tubeIndex]
        
        // Start the visual flip animation
        startFlipAnimation(tube, coin, power)
      }

      // Send to server for authoritative result
      socketService.emit('request_coin_flip', flipRequest)

    } catch (error) {
      console.error('Error requesting flip:', error)
      showToast('Failed to start flip', 'error')
    }
  }, [gameState, activePlayers, showToast])

  // Start the visual flip animation
  const startFlipAnimation = (tube, coin, power) => {
    tube.isFlipping = true
    tube.power = power
    
    // Add foam/liquid effects during flip
    tube.foamIntensity = power / 100
    
    // Animate coin flip
    const flipDuration = 2000 + (power * 20) // 2-4 seconds based on power
    
    // Create flip animation
    const startRotation = { x: 0, y: 0, z: 0 }
    const endRotation = { 
      x: Math.PI * (10 + power * 0.2), // 10-12 full rotations
      y: 0, 
      z: 0 
    }
    
    // Use TWEEN.js or similar for smooth animation
    // For now, we'll use a simple animation in the render loop
    tube.flipStartTime = Date.now()
    tube.flipDuration = flipDuration
    tube.flipStartRotation = startRotation
    tube.flipEndRotation = endRotation
  }

  // Handle server flip result
  const handleFlipResult = useCallback((result) => {
    console.log('🎯 Server flip result:', result)
    
    const { playerAddress, outcome, seed, signature, flipId } = result
    
    // Verify the result (commit-reveal verification)
    // TODO: Implement hash verification
    
    // Update game state
    setFlipResults(prev => ({
      ...prev,
      [playerAddress.toLowerCase()]: outcome
    }))
    
    // Check if player should be eliminated
    const player = gameState.players[playerAddress.toLowerCase()]
    if (player && outcome !== player.choice) {
      // Player guessed wrong - eliminate them
      setEliminatedPlayers(prev => [...prev, playerAddress.toLowerCase()])
      
      // Shatter their tube
      const tubeIndex = activePlayers.indexOf(playerAddress)
      if (tubeIndex >= 0) {
        shatterTube(tubesRef.current[tubeIndex])
      }
    }
    
    // Check win condition
    const remainingPlayers = activePlayers.filter(addr => 
      !eliminatedPlayers.includes(addr.toLowerCase())
    )
    
    if (remainingPlayers.length === 1) {
      // Game over - we have a winner!
      setGamePhase('ended')
      showToast(`🎉 ${remainingPlayers[0]} wins the game!`, 'success')
      
      // TODO: Handle prize distribution
    }
    
  }, [gameState, activePlayers, eliminatedPlayers, showToast])

  // Shatter a tube when player is eliminated
  const shatterTube = (tube) => {
    tube.isShattered = true
    
    // Create glass shards
    for (let i = 0; i < 20; i++) {
      const shardGeometry = new THREE.BoxGeometry(
        5 + Math.random() * 10,
        5 + Math.random() * 10,
        2 + Math.random() * 3
      )
      const shardMaterial = new THREE.MeshPhysicalMaterial({
        color: tube.color,
        transparent: true,
        opacity: 0.8
      })
      
      const shard = new THREE.Mesh(shardGeometry, shardMaterial)
      shard.position.copy(tube.tube.position)
      shard.position.y += (Math.random() - 0.5) * 100
      
      // Add random velocity
      shard.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          Math.random() * 10,
          (Math.random() - 0.5) * 20
        ),
        rotVelocity: new THREE.Vector3(
          Math.random() * 0.5,
          Math.random() * 0.5,
          Math.random() * 0.5
        ),
        lifetime: 0
      }
      
      tube.glassShards.push(shard)
      sceneRef.current.add(shard)
    }
  }

  // Animation loop
  const animate = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current) return

    const frameCount = frameCountRef.current++
    
    // Animate tubes
    tubesRef.current.forEach((tube, i) => {
      // Animate liquid foam effects
      if (tube.foamIntensity > 0 && !tube.isShattered) {
        const powerPercent = tube.power / 100
        const currentColor = new THREE.Color(tube.color)
        
        // Update liquid color based on power
        currentColor.lerp(new THREE.Color(0xffffff), powerPercent * 0.3)
        tube.liquid.material.color.copy(currentColor)
        
        // Update lighting
        tube.liquidLight.color.copy(currentColor)
        tube.liquidLight.intensity = 0.3 + (powerPercent * 15.0)
      }
      
      // Handle flip animation
      if (tube.isFlipping && !tube.isShattered) {
        const elapsed = Date.now() - tube.flipStartTime
        const progress = Math.min(elapsed / tube.flipDuration, 1)
        
        if (progress >= 1) {
          // Flip animation complete
          tube.isFlipping = false
          tube.foamIntensity = 0
          
          // TODO: Wait for server result and snap to final position
        }
      }
      
      // Animate glass shards
      if (tube.glassShards.length > 0) {
        tube.glassShards.forEach(shard => {
          shard.userData.lifetime += 0.016
          
          // Apply velocity
          shard.position.x += shard.userData.velocity.x
          shard.position.y += shard.userData.velocity.y
          shard.position.z += shard.userData.velocity.z
          
          // Apply gravity
          shard.userData.velocity.y -= 0.3
          
          // Rotate
          shard.rotation.x += shard.userData.rotVelocity.x
          shard.rotation.y += shard.userData.rotVelocity.y
          shard.rotation.z += shard.userData.rotVelocity.z
          
          // Fade out
          shard.material.opacity = Math.max(0, 0.8 - (shard.userData.lifetime / 2) * 0.8)
          
          // Remove after 2 seconds
          if (shard.userData.lifetime > 2) {
            shard.visible = false
          }
        })
      }
    })
    
    // Animate coins
    coinsRef.current.forEach((coin, i) => {
      const tube = tubesRef.current[i]
      
      if (tube.isFlipping && !tube.isShattered) {
        const elapsed = Date.now() - tube.flipStartTime
        const progress = Math.min(elapsed / tube.flipDuration, 1)
        
        // Rotate coin during flip
        const rotationAmount = progress * tube.flipEndRotation.x
        coin.rotation.x = rotationAmount
        
        // Add some wobble
        const wobble = Math.sin(elapsed * 0.01) * 0.1
        coin.rotation.z = wobble
      } else if (!tube.isShattered) {
        // Reset to center when idle
        coin.rotation.x = 0
        coin.rotation.z = 0
      }
    })

    // Render with selective bloom
    const camera = cameraRef.current
    const webglRenderer = webglRendererRef.current
    const bloomComposer = bloomComposerRef.current
    const cssRenderer = cssRendererRef.current

    // Render main scene (layer 0)
    camera.layers.disableAll()
    camera.layers.enable(0)
    webglRenderer.autoClear = true
    webglRenderer.clear(true, true, true)
    webglRenderer.render(sceneRef.current, camera)

    // Render pearls with bloom (layer 1)
    camera.layers.disableAll()
    camera.layers.enable(1)
    bloomComposer.render()

    // Composite bloom
    webglRenderer.autoClear = false
    const bloomTexture = bloomComposer.readBuffer.texture
    
    if (!window.bloomQuadMesh) {
      const quadGeometry = new THREE.PlaneGeometry(2, 2)
      const quadMaterial = new THREE.MeshBasicMaterial({
        map: bloomTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        toneMapped: false
      })
      const quadMesh = new THREE.Mesh(quadGeometry, quadMaterial)
      
      const quadScene = new THREE.Scene()
      quadScene.add(quadMesh)
      
      const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
      
      window.bloomQuadMesh = quadMesh
      window.bloomQuadScene = quadScene
      window.bloomQuadCamera = quadCamera
    }
    
    window.bloomQuadMesh.material.map = bloomTexture
    webglRenderer.render(window.bloomQuadScene, window.bloomQuadCamera)

    // Restore renderer settings
    webglRenderer.autoClear = true
    camera.layers.enableAll()

    // Render CSS3D UI
    cssRenderer.render(sceneRef.current, camera)

    animationIdRef.current = requestAnimationFrame(animate)
  }, [])

  // Socket event handlers
  useEffect(() => {
    const handleFlipResult = (result) => {
      handleFlipResult(result)
    }

    socketService.on('coin_flip_result', handleFlipResult)

    return () => {
      socketService.off('coin_flip_result', handleFlipResult)
    }
  }, [handleFlipResult])

  // Initialize scene when gameState is ready
  useEffect(() => {
    console.log('🎮 GlassTubeGame useEffect triggered', {
      hasGameState: !!gameState,
      phase: gameState?.phase,
      shouldInitialize: gameState && (gameState.phase === 'playing' || gameState.phase === 'round_active')
    })
    
    if (gameState && (gameState.phase === 'playing' || gameState.phase === 'round_active')) {
      console.log('🎮 Starting GlassTubeGame initialization and animation')
      initializeScene()
      animate()
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [gameState, initializeScene, animate])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight

      if (cameraRef.current) {
        cameraRef.current.aspect = newWidth / newHeight
        cameraRef.current.updateProjectionMatrix()
      }

      if (webglRendererRef.current) {
        webglRendererRef.current.setSize(newWidth, newHeight)
      }

      if (cssRendererRef.current) {
        cssRendererRef.current.setSize(newWidth, newHeight)
      }

      if (bloomComposerRef.current) {
        bloomComposerRef.current.setSize(newWidth, newHeight)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Render UI overlay
  const renderUIOverlay = () => {
    if (!gameState) return null

    return (
      <div className="glass-tube-ui">
        {/* Top UI */}
        <div className="top-ui-overlay">
          <div className="round-indicator">
            <div className="round-text">Round {currentRound}</div>
          </div>
          <div className="timer-display">
            {gamePhase === 'playing' ? '⏱️ 30s' : '⏳ Waiting...'}
          </div>
        </div>

        {/* Player Cards */}
        <div className="player-cards-overlay">
          {activePlayers.map((playerAddr, index) => {
            const player = gameState.players[playerAddr.toLowerCase()]
            const isCurrentPlayer = playerAddr.toLowerCase() === address?.toLowerCase()
            const isEliminated = eliminatedPlayers.includes(playerAddr.toLowerCase())

            return (
              <div 
                key={playerAddr} 
                className={`player-card-overlay ${isCurrentPlayer ? 'current-player' : ''} ${isEliminated ? 'eliminated' : ''}`}
                style={{ left: `${20 + index * 20}%` }}
              >
                <div className="player-info">
                  <div className="player-name">
                    {isCurrentPlayer ? 'YOU' : `${playerAddr.slice(0, 6)}...${playerAddr.slice(-4)}`}
                  </div>
                  <div className="lives">
                    {[1, 2, 3].map(i => (
                      <span key={i} className={`life ${i <= player.lives ? 'active' : ''}`}>💚</span>
                    ))}
                  </div>
                </div>
                
                {player.choice && (
                  <div className={`choice ${player.choice}`}>
                    {player.choice.toUpperCase()}
                  </div>
                )}

                {isCurrentPlayer && !isEliminated && !player.choice && (
                  <div className="choice-buttons">
                    <button 
                      onClick={() => handleFlipRequest(playerAddr, 'heads', 50)}
                      className="choice-btn heads"
                    >
                      HEADS
                    </button>
                    <button 
                      onClick={() => handleFlipRequest(playerAddr, 'tails', 50)}
                      className="choice-btn tails"
                    >
                      TAILS
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Coin Selector Modal */}
        {showCoinSelector && (
          <div className="coin-selector-modal" onClick={() => setShowCoinSelector(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setShowCoinSelector(false)}>×</button>
              <h2>Choose Your Coin</h2>
              <CoinSelector
                selectedCoin={gameState.players?.[selectedPlayerForCoin?.toLowerCase()]?.coin}
                onCoinSelect={(coinData) => {
                  updateCoin(coinData)
                  setShowCoinSelector(false)
                  setSelectedPlayerForCoin(null)
                }}
                showCustomOption={true}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!gameState || (gameState.phase !== 'playing' && gameState.phase !== 'round_active')) {
    return <div className="loading-screen">Loading Glass Tube Game...</div>
  }

  return (
    <div className="glass-tube-game-container">
      <div ref={containerRef} className="threejs-container" />
      {renderUIOverlay()}
    </div>
  )
}

export default GlassTubeGame
