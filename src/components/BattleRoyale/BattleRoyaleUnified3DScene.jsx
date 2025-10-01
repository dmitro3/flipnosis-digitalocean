import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'

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
  const coinsRef = useRef([]) // Array of 6 coin meshes
  const textureCache = useRef({})
  const animationIdRef = useRef(null)
  const coinStatesRef = useRef([]) // Track animation state for each coin

  // Optimized texture creation (from OptimizedGoldCoin)
  const createOptimizedTexture = useCallback((type, customImage = null) => {
    const cacheKey = `${type}-${customImage || 'default'}`
    if (textureCache.current[cacheKey]) {
      return textureCache.current[cacheKey]
    }

    if (customImage) {
      const loader = new THREE.TextureLoader()
      const texture = loader.load(customImage)
      texture.colorSpace = THREE.SRGBColorSpace
      textureCache.current[cacheKey] = texture
      return texture
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
    } else {
      ctx.clearRect(0, 0, size, size)
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    textureCache.current[cacheKey] = texture
    return texture
  }, [])

  // Initialize single Three.js scene with 6 coins
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return

    console.log('🎬 Creating unified Battle Royale 3D scene')

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000)
    camera.position.set(0, 5, 20)
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

    // Create 6 coin meshes in a grid layout
    const coinPositions = [
      { x: -8, y: 2, z: 0 },   // Top left
      { x: 0, y: 2, z: 0 },    // Top center
      { x: 8, y: 2, z: 0 },    // Top right
      { x: -8, y: -2, z: 0 },  // Bottom left
      { x: 0, y: -2, z: 0 },   // Bottom center
      { x: 8, y: -2, z: 0 }    // Bottom right
    ]

    // Store positions in ref for access in animation loop
    const coinPositionsRef = useRef(coinPositions)

    for (let i = 0; i < 6; i++) {
      // Create materials with same settings as OptimizedGoldCoin
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
          map: createOptimizedTexture('heads', null),
          metalness: 0.3,
          roughness: 0.2,
          color: 0xFFFFFF,
          emissive: 0x222222,
          emissiveIntensity: 0.1
        }),
        new THREE.MeshStandardMaterial({
          map: createOptimizedTexture('tails', null),
          metalness: 0.3,
          roughness: 0.2,
          color: 0xFFFFFF,
          emissive: 0x222222,
          emissiveIntensity: 0.1
        })
      ]

      const geometry = new THREE.CylinderGeometry(3, 3, 0.4, 48)
      const coin = new THREE.Mesh(geometry, materials)
      
      // Position coin
      coin.position.set(coinPositions[i].x, coinPositions[i].y, coinPositions[i].z)
      coin.scale.y = 1.5
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
    }

    // Animation loop
    const animate = () => {
      if (!sceneRef.current || !rendererRef.current) return

      const currentTime = Date.now()

      // Update each coin
      coinsRef.current.forEach((coin, index) => {
        if (!coin) return

        const state = coinStatesRef.current[index]
        const player = players[index]

        if (state.isFlipping) {
          // Flip animation (from OptimizedGoldCoin logic)
          const elapsed = currentTime - state.flipStartTime
          const progress = Math.min(elapsed / state.flipDuration, 1)

          // Easing
          const easeOut = 1 - Math.pow(1 - progress, 3)

          // Height animation
          const heightProgress = Math.sin(progress * Math.PI)
          const launchHeight = 5 + (state.power * 0.25)
          coin.position.y = coinPositionsRef.current[index].y + (heightProgress * launchHeight)

          // Rotation animation
          const totalRotation = state.totalRotations || (10 * Math.PI * 2)
          coin.rotation.x = state.startRotation.x + (totalRotation * easeOut * state.speed)

          // Wobble
          const wobbleAmount = 0.1 * Math.sin(elapsed * 0.01) * (1 - progress)
          coin.rotation.y = Math.PI / 2 + wobbleAmount
          coin.rotation.z = wobbleAmount * 0.5

          // Complete flip
          if (progress >= 1) {
            state.isFlipping = false
            coin.position.y = coinPositionsRef.current[index].y
            
            // Land on edge based on result
            const finalRotation = state.flipResult === 'heads' ? 0 : Math.PI
            const currentRotations = Math.floor(coin.rotation.x / (Math.PI * 2))
            coin.rotation.x = currentRotations * Math.PI * 2 + finalRotation
            coin.rotation.y = Math.PI / 2
            coin.rotation.z = 0

            console.log(`✅ Coin ${index} flip complete: ${state.flipResult}`)
            
            if (player?.address && onFlipComplete) {
              onFlipComplete(player.address, state.flipResult)
            }
          }
        } else if (state.isCharging) {
          // Charging animation (from OptimizedGoldCoin)
          const intensity = Math.min(1, state.power / 10)
          const time = currentTime * 0.001
          const pulseScale = 1 + Math.sin(time * 10) * 0.05 * intensity
          coin.scale.set(pulseScale, pulseScale * 1.5, pulseScale)
          coin.position.y = coinPositionsRef.current[index].y + Math.sin(time * 5) * 0.05 * intensity
          coin.rotation.x += 0.01 * (1 + intensity * 0.5)
        } else {
          // Idle animation
          coin.scale.set(1, 1.5, 1)
          coin.position.y = coinPositionsRef.current[index].y
          coin.rotation.x += 0.0000165
        }
      })

      renderer.render(scene, camera)
      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate()

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
      
      // Cleanup
      coinsRef.current.forEach(coin => {
        if (coin) {
          coin.geometry.dispose()
          if (Array.isArray(coin.material)) {
            coin.material.forEach(mat => {
              if (mat.map) mat.map.dispose()
              mat.dispose()
            })
          }
        }
      })
      
      renderer.dispose()
      
      Object.values(textureCache.current).forEach(texture => {
        texture.dispose()
      })
      textureCache.current = {}
      
      sceneRef.current = null
      rendererRef.current = null
    }
  }, [createOptimizedTexture])

  // Update coin textures when player images change
  useEffect(() => {
    if (!coinsRef.current.length) return

    players.forEach((player, index) => {
      if (!player?.address) return

      const coin = coinsRef.current[index]
      const images = playerCoinImages[player.address]

      if (coin && images) {
        // Update heads texture
        if (coin.material[1]) {
          if (coin.material[1].map) coin.material[1].map.dispose()
          coin.material[1].map = createOptimizedTexture('heads', images.headsImage)
          coin.material[1].needsUpdate = true
        }

        // Update tails texture
        if (coin.material[2]) {
          if (coin.material[2].map) coin.material[2].map.dispose()
          coin.material[2].map = createOptimizedTexture('tails', images.tailsImage)
          coin.material[2].needsUpdate = true
        }
      }
    })
  }, [players, playerCoinImages, createOptimizedTexture])

  // Handle flip states from server
  useEffect(() => {
    if (!flipStates || !coinsRef.current.length) return

    Object.entries(flipStates).forEach(([playerAddress, flipState]) => {
      const playerIndex = players.findIndex(p => p?.address === playerAddress)
      if (playerIndex === -1) return

      const state = coinStatesRef.current[playerIndex]
      const coin = coinsRef.current[playerIndex]

      if (flipState.isFlipping && !state.isFlipping) {
        // Start flip animation
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

    players.forEach((player, index) => {
      if (!player?.address) return

      const serverPlayer = serverState.players[player.address]
      const state = coinStatesRef.current[index]

      if (serverPlayer?.power && !state.isFlipping) {
        state.isCharging = true
        state.power = serverPlayer.power
      } else if (!serverPlayer?.power) {
        state.isCharging = false
        state.power = 0
      }
    })
  }, [serverState, players])

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
        overflow: 'hidden'
      }}
    />
  )
}

export default BattleRoyaleUnified3DScene
