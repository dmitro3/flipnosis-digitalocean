import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import './GlassTubeGame.css'

const GlassTubeGame = ({ gameId }) => {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const webglRendererRef = useRef(null)
  const cssRendererRef = useRef(null)
  const bloomComposerRef = useRef(null)
  const animationIdRef = useRef(null)
  const frameCountRef = useRef(0)
  
  // Game state
  const [tubes, setTubes] = useState([])
  const [coins, setCoins] = useState([])
  const [cards, setCards] = useState([])
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [gamePhase, setGamePhase] = useState('waiting') // waiting, playing, ended
  const [roundTimer, setRoundTimer] = useState(60)
  const [currentRound, setCurrentRound] = useState(1)

  // Color palette
  const COLORS = {
    cyan: 0x00ffff,
    purple: 0x8A00C4,
    pink: 0xff1493,
    gold: 0xFFD700,
    glass: 0x88ccff
  }

  // Initialize the 3D scene
  const initializeScene = useCallback(() => {
    if (!containerRef.current) return

    console.log('🎮 Initializing clean Glass Tube Game')

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
    const tubePositions = [
      { x: -600, color: COLORS.cyan },
      { x: -200, color: COLORS.purple },
      { x: 200, color: COLORS.pink },
      { x: 600, color: COLORS.gold }
    ]

    const tubesArray = []
    const coinsArray = []
    const cardsArray = []

    tubePositions.forEach((pos, i) => {
      const tube = createGlassTube(pos.x, pos.color, i)
      scene.add(tube.tube)
      tubesArray.push(tube)

      // Create coin for this tube
      const coin = createCoin(pos.x)
      scene.add(coin)
      coinsArray.push(coin)

      // Create player card
      const card = createPlayerCard(pos.x, i)
      scene.add(card)
      cardsArray.push(card)
    })

    setTubes(tubesArray)
    setCoins(coinsArray)
    setCards(cardsArray)

    console.log('✅ Clean scene initialized with 4 tubes')

  }, []) // No dependencies to prevent infinite loops

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
    
    // Mock player data for now
    const playerNames = ['Player 1', 'Player 2', 'Player 3', 'Player 4']
    const isCurrentPlayer = index === currentPlayer

    cardElement.innerHTML = `
      <div class="card-header">
        <img src="/images/avatar-placeholder.png" alt="Avatar" class="player-avatar">
        <div class="player-info">
          <div class="player-name">${isCurrentPlayer ? 'YOU' : playerNames[index]}</div>
          <div class="player-address">0x${Math.random().toString(16).substr(2, 8)}...</div>
        </div>
      </div>
      <div class="lives-container">
        ${[1, 2, 3].map(i => 
          `<img src="/Images/potionpng.png" alt="life" class="life active">`
        ).join('')}
      </div>
      ${isCurrentPlayer ? `
        <div class="choice-buttons">
          <button class="choice-btn heads" onclick="handleChoice('heads')">HEADS</button>
          <button class="choice-btn tails" onclick="handleChoice('tails')">TAILS</button>
        </div>
      ` : ''}
    `

    const cardObject = new CSS3DObject(cardElement)
    cardObject.position.set(x, -200, 0)
    cardObject.layers.set(0)
    
    return cardObject
  }

  // Handle player choice
  const handleChoice = (choice) => {
    console.log(`Player chose: ${choice}`)
    setGamePhase('playing')
    
    // Start the flip animation for current player
    if (tubes[currentPlayer]) {
      startFlipAnimation(tubes[currentPlayer], coins[currentPlayer], 50)
    }
  }

  // Start flip animation
  const startFlipAnimation = (tube, coin, power) => {
    tube.isFlipping = true
    tube.power = power
    
    // Add foam/liquid effects during flip
    tube.foamIntensity = power / 100
    
    // Animate coin flip
    const flipDuration = 2000 + (power * 20) // 2-4 seconds based on power
    
    // Create flip animation
    tube.flipStartTime = Date.now()
    tube.flipDuration = flipDuration
    tube.flipStartRotation = { x: 0, y: 0, z: 0 }
    tube.flipEndRotation = { 
      x: Math.PI * (10 + power * 0.2), // 10-12 full rotations
      y: 0, 
      z: 0 
    }
  }

  // Animation loop
  const animate = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current) return

    const frameCount = frameCountRef.current++
    
    // Animate tubes
    tubes.forEach((tube, i) => {
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
    })
    
    // Animate coins
    coins.forEach((coin, i) => {
      const tube = tubes[i]
      
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
  }, []) // Remove dependencies to prevent infinite loops

  // Initialize scene when component mounts
  useEffect(() => {
    try {
      initializeScene()
      animate()
    } catch (error) {
      console.error('Error initializing tube game:', error)
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, []) // Remove dependencies to prevent infinite loops

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

  // Expose handleChoice globally for the cards
  useEffect(() => {
    window.handleChoice = handleChoice
    return () => {
      delete window.handleChoice
    }
  }, [handleChoice])

  return (
    <div className="glass-tube-game-container">
      <div ref={containerRef} className="threejs-container" />
      
      {/* Top UI Overlay */}
      <div className="top-ui-overlay">
        <div className="round-indicator">
          <div className="round-text">Round {currentRound}</div>
        </div>
        <div className="timer-display">
          {gamePhase === 'playing' ? `⏱️ ${roundTimer}s` : '⏳ Waiting...'}
        </div>
      </div>

      {/* Game Status */}
      <div className="game-status">
        {gamePhase === 'waiting' && <div>Choose Heads or Tails!</div>}
        {gamePhase === 'playing' && <div>Game in Progress...</div>}
        {gamePhase === 'ended' && <div>Game Over!</div>}
      </div>
    </div>
  )
}

export default GlassTubeGame
