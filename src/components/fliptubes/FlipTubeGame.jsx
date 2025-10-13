import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import './FlipTubeGame.css'

const FlipTubeGame = ({ gameId }) => {
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const webglRendererRef = useRef(null)
  const cssRendererRef = useRef(null)
  const bloomComposerRef = useRef(null)
  const animationIdRef = useRef(null)
  const frameCountRef = useRef(0)
  
  // Game state - simplified for now
  const [gamePhase, setGamePhase] = useState('waiting')
  const [currentPlayer, setCurrentPlayer] = useState(0)
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

  // Initialize the 3D scene - FULL PAGE APPROACH
  const initializeScene = () => {
    console.log('🎮 Initializing FlipTube Game - Full Page Experience')

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

    // ===== CREATE 4 GLASS TUBES =====
    const tubePositions = [
      { x: -600, color: COLORS.cyan },
      { x: -200, color: COLORS.purple },
      { x: 200, color: COLORS.pink },
      { x: 600, color: COLORS.gold }
    ]

    tubePositions.forEach((pos, i) => {
      const tube = createGlassTube(pos.x, pos.color, i)
      scene.add(tube.tube)

      const coin = createCoin(pos.x)
      scene.add(coin)

      const card = createPlayerCard(pos.x, i)
      scene.add(card)
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
    cardElement.innerHTML = `
      <div class="card-header">
        <img src="/images/avatar-placeholder.png" alt="Avatar" class="player-avatar">
        <div class="player-info">
          <div class="player-name">Player ${index + 1}</div>
          <div class="player-address">0xabc...123</div>
        </div>
      </div>
      <div class="lives-container">
        <img src="/Images/potionpng.png" alt="life" class="life active">
        <img src="/Images/potionpng.png" alt="life" class="life active">
        <img src="/Images/potionpng.png" alt="life" class="life active">
      </div>
      <div class="choice-buttons">
        <button class="choice-btn heads">HEADS</button>
        <button class="choice-btn tails">TAILS</button>
      </div>
    `

    const cardObject = new CSS3DObject(cardElement)
    cardObject.position.set(x, -200, 0)
    
    return cardObject
  }

  // Animation loop
  const animate = () => {
    if (!sceneRef.current || !cameraRef.current) return

    const frameCount = frameCountRef.current++

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

  // Initialize on mount
  useEffect(() => {
    initializeScene()
    animate()
    
    // Auto-start game after 2 seconds
    const startTimer = setTimeout(() => {
      startGame()
    }, 2000)

    return cleanup
  }, [])

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
