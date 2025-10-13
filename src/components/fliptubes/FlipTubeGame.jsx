import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { useBattleRoyaleGame } from '../../contexts/BattleRoyaleGameContext'
import { useWallet } from '../../contexts/WalletContext'
import socketService from '../../services/SocketService'
import './FlipTubeGame.css'

const FlipTubeGame = ({ gameId }) => {
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const webglRendererRef = useRef(null)
  const cssRendererRef = useRef(null)
  const bloomComposerRef = useRef(null)
  const animationIdRef = useRef(null)
  const frameCountRef = useRef(0)
  const tubesRef = useRef([])
  const coinsRef = useRef([])
  const cardsRef = useRef([])
  
  // Battle Royale game state
  const { gameState, playerCoinImages, address, updateCoin } = useBattleRoyaleGame()
  const { showToast } = useWallet()
  
  // Local game state
  const [gamePhase, setGamePhase] = useState('waiting')
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [roundTimer, setRoundTimer] = useState(60)
  const [currentRound, setCurrentRound] = useState(1)
  const [eliminatedPlayers, setEliminatedPlayers] = useState([])
  const [flipResults, setFlipResults] = useState({})

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

  // Initialize the 3D scene - FULL PAGE APPROACH
  const initializeScene = () => {
    if (!gameState) return

    console.log('🎮 Initializing FlipTube Game - Full Page Experience with real data', {
      phase: gameState.phase,
      players: gameState.currentPlayers,
      playerOrder: gameState.playerOrder
    })

    // ===== SCENE =====
    const scene = new THREE.Scene()
    scene.background = null // Transparent to show background image
    sceneRef.current = scene

    // ===== CAMERA =====
    const width = window.innerWidth
    const height = window.innerHeight
    const camera = new THREE.PerspectiveCamera(30, width / height, 1, 5000)
    camera.position.set(0, 100, 1400)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // ===== WEBGL RENDERER - DIRECTLY TO BODY =====
    const webglRenderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    })
    webglRenderer.setSize(width, height)
    webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    webglRenderer.toneMapping = THREE.ReinhardToneMapping
    webglRenderer.toneMappingExposure = 1.2
    
    // Add directly to body with absolute positioning
    webglRenderer.domElement.style.position = 'fixed'
    webglRenderer.domElement.style.top = '0'
    webglRenderer.domElement.style.left = '0'
    webglRenderer.domElement.style.zIndex = '1'
    webglRenderer.domElement.style.pointerEvents = 'auto'
    document.body.appendChild(webglRenderer.domElement)
    webglRendererRef.current = webglRenderer

    // ===== POST-PROCESSING =====
    const bloomComposer = new EffectComposer(webglRenderer)
    const renderPass = new RenderPass(scene, camera)
    bloomComposer.addPass(renderPass)
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.45,
      0.4,
      0.85
    )
    bloomComposer.addPass(bloomPass)
    bloomComposerRef.current = bloomComposer

    // ===== CSS3D RENDERER - DIRECTLY TO BODY =====
    const cssRenderer = new CSS3DRenderer()
    cssRenderer.setSize(width, height)
    cssRenderer.domElement.style.position = 'fixed'
    cssRenderer.domElement.style.top = '0'
    cssRenderer.domElement.style.left = '0'
    cssRenderer.domElement.style.zIndex = '10'
    cssRenderer.domElement.style.pointerEvents = 'none'
    document.body.appendChild(cssRenderer.domElement)
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

    // ===== CREATE GLASS TUBES BASED ON ACTIVE PLAYERS =====
    tubesRef.current = []
    coinsRef.current = []
    cardsRef.current = []

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

      const coin = createCoin(pos.x)
      scene.add(coin)
      coinsRef.current.push(coin)

      const card = createPlayerCard(pos.x, i)
      scene.add(card)
      cardsRef.current.push(card)
    })

    console.log('✅ FlipTube Game initialized - Full page experience ready')
  }

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
    tubeGroup.add(liquidMesh)

    // Add lighting for the liquid
    const liquidLight = new THREE.PointLight(color, 0.5, 200)
    liquidLight.position.set(0, 175, 0)
    tubeGroup.add(liquidLight)

    tubeGroup.tube = tubeMesh
    tubeGroup.liquid = liquidMesh
    tubeGroup.liquidLight = liquidLight
    tubeGroup.color = color

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
        ${isCurrentPlayer && !isEliminated && !player.choice ? '<div class="choice-buttons"><button class="choice-btn heads">HEADS</button><button class="choice-btn tails">TAILS</button></div>' : ''}
      `
    } else {
      cardElement.innerHTML = '<div class="empty-slot">WAITING...</div>'
    }

    const cardObject = new CSS3DObject(cardElement)
    cardObject.position.set(x, -200, 0)
    
    return cardObject
  }

  // Animation loop
  const animate = () => {
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
        }
      }
      
      // Animate glass shards
      if (tube.glassShards && tube.glassShards.length > 0) {
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
      
      if (tube && tube.isFlipping && !tube.isShattered) {
        const elapsed = Date.now() - tube.flipStartTime
        const progress = Math.min(elapsed / tube.flipDuration, 1)
        
        // Rotate coin during flip
        const rotationAmount = progress * tube.flipEndRotation.x
        coin.rotation.x = rotationAmount
        
        // Add some wobble
        const wobble = Math.sin(elapsed * 0.01) * 0.1
        coin.rotation.z = wobble
      } else if (tube && !tube.isShattered) {
        // Reset to center when idle
        coin.rotation.x = 0
        coin.rotation.z = 0
      }
    })

    // Render with bloom
    const camera = cameraRef.current
    const webglRenderer = webglRendererRef.current
    const bloomComposer = bloomComposerRef.current
    const cssRenderer = cssRendererRef.current

    // Render main scene
    webglRenderer.autoClear = true
    webglRenderer.clear(true, true, true)
    webglRenderer.render(sceneRef.current, camera)

    // Render bloom
    bloomComposer.render()

    // Render CSS3D UI
    cssRenderer.render(sceneRef.current, camera)

    animationIdRef.current = requestAnimationFrame(animate)
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
    
    tube.flipStartTime = Date.now()
    tube.flipDuration = flipDuration
    tube.flipStartRotation = startRotation
    tube.flipEndRotation = endRotation
  }

  // Handle server flip result
  const handleFlipResult = useCallback((result) => {
    console.log('🎯 Server flip result:', result)
    
    const { playerAddress, outcome, seed, signature, flipId } = result
    
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
      
      tube.glassShards = tube.glassShards || []
      tube.glassShards.push(shard)
      sceneRef.current.add(shard)
    }
  }

  // Socket event handlers
  useEffect(() => {
    const handleFlipResultEvent = (result) => {
      handleFlipResult(result)
    }

    socketService.on('coin_flip_result', handleFlipResultEvent)

    return () => {
      socketService.off('coin_flip_result', handleFlipResultEvent)
    }
  }, [handleFlipResult])

  // Start the game
  const startGame = () => {
    console.log('🎮 Starting FlipTube Game')
    setGamePhase('playing')
    setCurrentRound(1)
    
    // Start countdown timer
    let timeLeft = 60
    const timer = setInterval(() => {
      timeLeft--
      setRoundTimer(timeLeft)
      
      if (timeLeft <= 0) {
        clearInterval(timer)
        setGamePhase('ended')
      }
    }, 1000)
  }

  // Cleanup function
  const cleanup = () => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current)
    }
    
    // Remove renderers from DOM
    if (webglRendererRef.current?.domElement) {
      document.body.removeChild(webglRendererRef.current.domElement)
    }
    if (cssRendererRef.current?.domElement) {
      document.body.removeChild(cssRendererRef.current.domElement)
    }
  }

  // Initialize when gameState is ready
  useEffect(() => {
    if (gameState && (gameState.phase === 'playing' || gameState.phase === 'round_active')) {
      console.log('🎮 Starting FlipTube Game initialization')
      initializeScene()
      animate()
      
      // Set game phase based on Battle Royale state
      setGamePhase('playing')
      setCurrentRound(gameState.currentRound || 1)
    }

    return cleanup
  }, [gameState])

  // Initialize animation loop
  useEffect(() => {
    if (sceneRef.current && cameraRef.current) {
      animate()
    }
  }, [sceneRef.current, cameraRef.current])

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

  // Return minimal React component - the game renders directly to body
  return (
    <div className="flip-tube-game">
      {/* Game UI Overlay */}
      <div className="game-ui-overlay">
        <div className="top-ui">
          <div className="round-indicator">
            Round {currentRound}
          </div>
          <div className="timer-display">
            {gamePhase === 'playing' ? `⏱️ ${roundTimer}s` : '⏳ Waiting...'}
          </div>
        </div>
        
        <div className="game-status">
          {gamePhase === 'waiting' && '🎮 Game Starting...'}
          {gamePhase === 'playing' && '🎯 Game Active'}
          {gamePhase === 'ended' && '🏆 Round Complete'}
        </div>
      </div>
    </div>
  )
}

export default FlipTubeGame
