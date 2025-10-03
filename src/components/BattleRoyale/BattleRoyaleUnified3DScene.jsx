import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'

const globalTextureCache = new Map()

// Power configurations (from OptimizedGoldCoin)
const powerConfigs = [
  { minFlips: 5, duration: 2000, speed: 1 },
  { minFlips: 6, duration: 3000, speed: 1.2 },
  { minFlips: 7, duration: 4000, speed: 1.4 },
  { minFlips: 8, duration: 5000, speed: 1.6 },
  { minFlips: 9, duration: 6000, speed: 1.8 },
  { minFlips: 10, duration: 7000, speed: 2 },
  { minFlips: 12, duration: 8000, speed: 2.3 },
  { minFlips: 14, duration: 10000, speed: 2.6 },
  { minFlips: 16, duration: 12000, speed: 3 },
  { minFlips: 20, duration: 15000, speed: 3.5 }
];

const BattleRoyaleUnified3DScene = ({
  players = [],
  gamePhase = 'filling',
  serverState = null,
  flipStates = {},
  playerCoinImages = {},
  currentUserAddress = null,
  onFlipComplete = () => {}
}) => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const coinsRef = useRef([]) // Array of 6 coin meshes in 3x2 grid
  const textureCache = useRef({})
  const animationIdRef = useRef(null)
  const coinStatesRef = useRef([]) // Track animation state for each coin

  // Optimized texture creation with global caching
  const createOptimizedTexture = useCallback((type, customImage = null) => {
    const cacheKey = `${type}-${customImage || 'default'}`
    
    // Check global cache first
    if (globalTextureCache.has(cacheKey)) {
      return globalTextureCache.get(cacheKey)
    }

    if (customImage && customImage !== '/coins/plainh.png' && customImage !== '/coins/plaint.png') {
      try {
        const loader = new THREE.TextureLoader()
        const texture = loader.load(customImage)
        texture.colorSpace = THREE.SRGBColorSpace
        texture.flipY = false
        globalTextureCache.set(cacheKey, texture)
        return texture
      } catch (error) {
        console.error(`❌ Error loading custom texture: ${customImage}`, error)
      }
    }

    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    if (type === 'edge') {
      ctx.fillStyle = '#F8F8F8'
      ctx.fillRect(0, 0, size, size)
      ctx.strokeStyle = '#E0E0E0'
      ctx.lineWidth = 2
      for (let i = 0; i < size; i += 12) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, size)
        ctx.stroke()
      }
    } else if (type === 'heads') {
      const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
      gradient.addColorStop(0, '#FFD700')
      gradient.addColorStop(0.5, '#FFA500')
      gradient.addColorStop(1, '#FF8C00')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
      ctx.fillStyle = '#333'
      ctx.font = 'bold 200px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('H', size/2, size/2)
    } else if (type === 'tails') {
      const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
      gradient.addColorStop(0, '#E5E5E5')
      gradient.addColorStop(0.5, '#C0C0C0')
      gradient.addColorStop(1, '#A0A0A0')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
      ctx.fillStyle = '#333'
      ctx.font = 'bold 200px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('T', size/2, size/2)
    } else {
      ctx.clearRect(0, 0, size, size)
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.flipY = false
    globalTextureCache.set(cacheKey, texture)
    return texture
  }, [])

  // Initialize Three.js scene with 6 coins in 3x2 grid
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return

    console.log('🎬 Creating unified Battle Royale 3D scene')
    
    // Clear any existing scene
    if (sceneRef.current) {
      sceneRef.current.clear()
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000)
    camera.position.set(0, 0, 25)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    mountRef.current.appendChild(renderer.domElement)
    sceneRef.current = scene
    rendererRef.current = renderer
    cameraRef.current = camera

    // Enhanced lighting (from OptimizedGoldCoin)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    const spotLight = new THREE.SpotLight(0xffffff, 0.6)
    spotLight.position.set(0, 10, 5)
    spotLight.angle = Math.PI / 6
    spotLight.penumbra = 0.1
    spotLight.decay = 2
    spotLight.distance = 20
    scene.add(spotLight)

    const fillLight = new THREE.DirectionalLight(0xFFFFFF, 0.4)
    fillLight.position.set(0, -3, 5)
    scene.add(fillLight)

    // Create coins only for actual players (not empty slots)
    const numPlayers = players.filter(p => p?.address).length
    
    // Fixed 3x2 grid layout for all players
    const coinPositions = [
      // Top row (3 coins) - increased y from 3 to 4
      { x: -8, y: 4, z: 0, scale: 1 },    // Top left
      { x: 0, y: 4, z: 0, scale: 1 },     // Top center  
      { x: 8, y: 4, z: 0, scale: 1 },     // Top right
      // Bottom row (3 coins) - decreased y from -3 to -4
      { x: -8, y: -4, z: 0, scale: 1 },   // Bottom left
      { x: 0, y: -4, z: 0, scale: 1 },    // Bottom center
      { x: 8, y: -4, z: 0, scale: 1 },    // Bottom right
    ]

    // Only create coins for players that actually exist
    const activePlayers = players.filter(p => p?.address)
    console.log(`🎯 Creating ${activePlayers.length} coins for active players`)

    for (let i = 0; i < 6; i++) {
      const player = players[i]
      
      if (player?.address) {
        const playerAddressLower = player.address.toLowerCase()
        
        const materials = [
          new THREE.MeshStandardMaterial({
            map: createOptimizedTexture('edge'),
            metalness: 0.3,
            roughness: 0.2,
            color: 0xFFFFFF,
            emissive: 0x222222,
            emissiveIntensity: 0.1
          }),
          new THREE.MeshStandardMaterial({
            map: createOptimizedTexture('heads', playerCoinImages[playerAddressLower]?.headsImage || null),
            metalness: 0.3,
            roughness: 0.2,
            color: 0xFFFFFF,
            emissive: 0x222222,
            emissiveIntensity: 0.1
          }),
          new THREE.MeshStandardMaterial({
            map: createOptimizedTexture('tails', playerCoinImages[playerAddressLower]?.tailsImage || null),
            metalness: 0.3,
            roughness: 0.2,
            color: 0xFFFFFF,
            emissive: 0x222222,
            emissiveIntensity: 0.1
          })
        ]

        // Detect device performance
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
        const segments = isMobile ? 32 : 48
        
        const geometry = new THREE.CylinderGeometry(3, 3, 0.4, segments)
        const coin = new THREE.Mesh(geometry, materials)
        
        const posData = coinPositions[i]
        coin.position.set(posData.x, posData.y, posData.z)
        coin.scale.set(posData.scale, 1.5 * posData.scale, posData.scale)
        coin.rotation.x = 0
        coin.rotation.y = Math.PI / 2
        coin.rotation.z = 0

        scene.add(coin)
        coinsRef.current[i] = coin

        // Initialize coin state
        coinStatesRef.current[i] = {
          isFlipping: false,
          flipStartTime: null,
          flipDuration: 2000,
          flipResult: null,
          startRotation: { x: 0, y: Math.PI / 2, z: 0 },
          targetRotation: 0,
          isCharging: false,
          power: 0
        }
      } else {
        coinsRef.current[i] = null
        coinStatesRef.current[i] = null
      }
    }

    // Clear any leftover coins - keep only 6 coins
    coinsRef.current = coinsRef.current.slice(0, 6)
    coinStatesRef.current = coinStatesRef.current.slice(0, 6)

    // Create visual frames for each coin slot
    for (let i = 0; i < 6; i++) {
      const pos = coinPositions[i]
      const player = players[i]
      
      // Only create frame if player exists
      if (player?.address) {
        const frameGeometry = new THREE.BoxGeometry(5, 5, 0.1)
        const edges = new THREE.EdgesGeometry(frameGeometry)
        const frameMaterial = new THREE.LineBasicMaterial({ 
          color: 0x00ff88,
          linewidth: 1,
          opacity: 0.3,
          transparent: true
        })
        const frame = new THREE.LineSegments(edges, frameMaterial)
        frame.position.set(pos.x, pos.y, pos.z - 2)
        scene.add(frame)
      }
    }

    // Animation loop with adaptive frame rate
    let lastFrameTime = 0
    const targetFrameTime = 1000 / 30 // 30 FPS default

    const animate = (currentTime) => {
      if (!sceneRef.current || !rendererRef.current) return

      // Adaptive frame rate
      const deltaTime = currentTime - lastFrameTime
      
      // Determine target FPS based on activity
      let targetFPS = 30 // Default: 30 FPS
      
      const hasFlippingCoins = coinStatesRef.current.some(state => state?.isFlipping)
      if (hasFlippingCoins) {
        targetFPS = 60 // During flips: 60 FPS
      }
      
      const frameInterval = 1000 / targetFPS
      
      if (deltaTime >= frameInterval) {
        lastFrameTime = currentTime - (deltaTime % frameInterval)
        
        const time = currentTime * 0.001

        // Update each coin
        coinsRef.current.forEach((coin, index) => {
          if (!coin) return
          
          const state = coinStatesRef.current[index]
          if (!state) return
          
          const player = players[index]
          if (!player?.address) return
          
          const posData = coinPositions[index]

          if (state.isFlipping) {
            // Flip animation
            const elapsed = currentTime - state.flipStartTime
            const progress = Math.min(elapsed / state.flipDuration, 1)
            const easeOut = 1 - Math.pow(1 - progress, 3)
            
            const heightProgress = Math.sin(progress * Math.PI)
            const launchHeight = 2.5
            coin.position.y = posData.y + (heightProgress * launchHeight)
            
            const totalRotation = 10 * Math.PI * 2
            coin.rotation.x = state.startRotation.x + (totalRotation * easeOut)
            
            const wobbleAmount = 0.1 * Math.sin(elapsed * 0.01) * (1 - progress)
            coin.rotation.y = Math.PI / 2 + wobbleAmount
            coin.rotation.z = wobbleAmount * 0.5

            if (progress >= 1) {
              state.isFlipping = false
              coin.position.y = posData.y
              
              const finalRotation = state.flipResult === 'heads' ? 0 : Math.PI
              const currentRotations = Math.floor(coin.rotation.x / (Math.PI * 2))
              coin.rotation.x = currentRotations * Math.PI * 2 + finalRotation
              coin.rotation.y = Math.PI / 2
              coin.rotation.z = 0

              if (player?.address && onFlipComplete) {
                onFlipComplete(player.address, state.flipResult)
              }
            }
          } else {
            // Idle animation - very slow
            const baseScale = posData.scale
            coin.scale.set(baseScale, 1.5 * baseScale, baseScale)
            coin.position.y = posData.y
            coin.rotation.x += 0.000017 // Very slow idle rotation
          }
        })

        if (renderer && scene && camera) {
          renderer.render(scene, camera)
        }
      }
      
      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate(0)

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      
      // Cleanup coins
      coinsRef.current.forEach(coin => {
        if (coin) {
          if (coin.geometry) coin.geometry.dispose()
          if (Array.isArray(coin.material)) {
            coin.material.forEach(mat => {
              if (mat.map && !globalTextureCache.has(mat.map)) {
                mat.map.dispose()
              }
              mat.dispose()
            })
          }
        }
      })
      
      if (renderer) renderer.dispose()
      
      // Don't clear global texture cache - it persists across games
      // Only clear local references
      textureCache.current = {}
      
      sceneRef.current = null
      rendererRef.current = null
    }
  }, [])

  // Handle player changes without recreating the scene
  useEffect(() => {
    if (!sceneRef.current) return

    // Update existing coins or create new ones for new players
    for (let i = 0; i < 6; i++) {
      const player = players[i]
      const existingCoin = coinsRef.current[i]
      
      if (player?.address && !existingCoin) {
        // Create new coin for new player
        const posData = coinPositions[i]
        
        const materials = [
          new THREE.MeshStandardMaterial({
            map: createOptimizedTexture('edge'),
            metalness: 0.3,
            roughness: 0.2,
            color: 0xFFFFFF,
            emissive: 0x222222,
            emissiveIntensity: 0.1
          }),
          new THREE.MeshStandardMaterial({
            map: createOptimizedTexture('heads', playerCoinImages[player.address.toLowerCase()]?.headsImage || null),
            metalness: 0.3,
            roughness: 0.2,
            color: 0xFFFFFF,
            emissive: 0x222222,
            emissiveIntensity: 0.1
          }),
          new THREE.MeshStandardMaterial({
            map: createOptimizedTexture('tails', playerCoinImages[player.address.toLowerCase()]?.tailsImage || null),
            metalness: 0.3,
            roughness: 0.2,
            color: 0xFFFFFF,
            emissive: 0x222222,
            emissiveIntensity: 0.1
          })
        ]

        const geometry = new THREE.CylinderGeometry(3, 3, 0.4, 48)
        const newCoin = new THREE.Mesh(geometry, materials)
        
        newCoin.position.set(posData.x, posData.y, posData.z)
        newCoin.scale.set(posData.scale, 1.5 * posData.scale, posData.scale)
        newCoin.rotation.x = 0
        newCoin.rotation.y = Math.PI / 2
        newCoin.rotation.z = 0

        sceneRef.current.add(newCoin)
        coinsRef.current[i] = newCoin

        coinStatesRef.current[i] = {
          isFlipping: false,
          flipStartTime: null,
          flipDuration: 2000,
          flipResult: null,
          startRotation: { x: 0, y: Math.PI / 2, z: 0 },
          targetRotation: 0,
          isCharging: false,
          power: 0
        }
      } else if (!player?.address && existingCoin) {
        // Remove coin for player that left
        sceneRef.current.remove(existingCoin)
        existingCoin.geometry.dispose()
        if (Array.isArray(existingCoin.material)) {
          existingCoin.material.forEach(mat => {
            if (mat.map) mat.map.dispose()
            mat.dispose()
          })
        }
        coinsRef.current[i] = null
        coinStatesRef.current[i] = null
      } else if (player?.address && existingCoin) {
        // Update textures for existing player - check if we have new images
        const playerAddressLower = player.address.toLowerCase()
        const images = playerCoinImages[playerAddressLower]
        
        // Only update if we have new images to avoid unnecessary updates
        if (images) {
          console.log(`🎯 Updating coin textures for player ${i}:`, {
            address: player.address,
            addressLower: playerAddressLower,
            images: images,
            allCoinImages: Object.keys(playerCoinImages)
          })
          
          // Update heads texture
          if (existingCoin.material[1] && images.headsImage) {
            if (existingCoin.material[1].map) {
              existingCoin.material[1].map.dispose()
            }
            const newHeadsTexture = createOptimizedTexture('heads', images.headsImage)
            existingCoin.material[1].map = newHeadsTexture
            existingCoin.material[1].needsUpdate = true
          }

          // Update tails texture
          if (existingCoin.material[2] && images.tailsImage) {
            if (existingCoin.material[2].map) {
              existingCoin.material[2].map.dispose()
            }
            const newTailsTexture = createOptimizedTexture('tails', images.tailsImage)
            existingCoin.material[2].map = newTailsTexture
            existingCoin.material[2].needsUpdate = true
          }
        }
      }
    }
  }, [players, playerCoinImages])

  // Handle flip states from server
  useEffect(() => {
    if (!flipStates || !coinsRef.current.length) return

    Object.entries(flipStates).forEach(([playerAddress, flipState]) => {
      const playerIndex = players.findIndex(p => p?.address === playerAddress)
      if (playerIndex === -1 || playerIndex >= 6) return

      const state = coinStatesRef.current[playerIndex]
      const coin = coinsRef.current[playerIndex]

      if (flipState.isFlipping && !state.isFlipping) {
        // Start flip animation for small coin
        const power = flipState.creatorPower || flipState.joinerPower || 1
        const powerLevel = Math.max(1, Math.min(10, Math.ceil(power)))
        const config = powerConfigs[Math.max(0, powerLevel - 1)]

        state.isFlipping = true
        state.flipStartTime = Date.now()
        state.flipDuration = config.duration
        state.flipResult = flipState.flipResult
        state.startRotation = {
          x: coin.rotation.x,
          y: coin.rotation.y,
          z: coin.rotation.z
        }
        state.totalRotations = config.minFlips * Math.PI * 2
        state.speed = config.speed
        state.power = power

        console.log(`🎲 Starting flip for coin ${playerIndex}:`, {
          result: flipState.flipResult,
          power,
          duration: config.duration
        })
      }
    })
  }, [flipStates, players])

  // Handle power charging from server state
  useEffect(() => {
    if (!serverState?.players || !coinsRef.current.length) return

    for (let i = 0; i < 6; i++) {
      const player = players[i]
      if (!player?.address) continue

      const serverPlayer = serverState.players[player.address]
      const state = coinStatesRef.current[i]

      if (serverPlayer?.power && !state.isFlipping) {
        state.isCharging = true
        state.power = serverPlayer.power
      } else if (!serverPlayer?.power) {
        state.isCharging = false
        state.power = 0
      }
    }
  }, [serverState, players])

  // Listen for individual player flip events
  useEffect(() => {
    if (!sceneRef.current) return

    const handlePlayerFlipped = (data) => {
      const { playerAddress, flipResult, coinState } = data
      const playerIndex = players.findIndex(p => p?.address === playerAddress)
      
      if (playerIndex === -1 || playerIndex >= 6) return

      const state = coinStatesRef.current[playerIndex]
      const coin = coinsRef.current[playerIndex]

      if (!state || !coin) return

      state.isFlipping = true
      state.flipStartTime = Date.now()
      state.flipDuration = 2000
      state.flipResult = flipResult
      state.totalRotations = 10 * Math.PI * 2
      state.speed = 1
      state.power = 1
      state.startRotation = {
        x: coin.rotation.x,
        y: coin.rotation.y,
        z: coin.rotation.z
      }

      console.log(`🎲 Coin ${playerIndex} starting flip animation: ${flipResult}`)
    }

    if (typeof window !== 'undefined' && window.socketService) {
      console.log('✅ Registering flip listener (one time)')
      window.socketService.on('battle_royale_player_flipped', handlePlayerFlipped)

      return () => {
        console.log('🧹 Cleaning up flip listener')
        window.socketService.off('battle_royale_player_flipped', handlePlayerFlipped)
      }
    }
  }, []) // EMPTY DEPENDENCY ARRAY - only register once!

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '600px',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(138, 43, 226, 0.3))',
        borderRadius: '1rem',
        border: '2px solid rgba(255, 20, 147, 0.3)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    />
  )
}

export default BattleRoyaleUnified3DScene
