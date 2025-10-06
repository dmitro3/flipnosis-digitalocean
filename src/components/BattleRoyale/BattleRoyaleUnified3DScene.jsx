import React, { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'

const globalTextureCache = new Map()

const BattleRoyaleUnified3DScene = ({
  players = [],
  gamePhase = 'filling',
  serverState = null,
  playerCoinImages = {},
  currentUserAddress = null
}) => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const coinsRef = useRef([]) // 6 coins
  const coinStatesRef = useRef([]) // Animation states
  const animationIdRef = useRef(null)

  // Fixed 3x2 grid positions - adjusted Y values to be lower (inside container)
  const coinPositions = [
    { x: -8, y: 1, z: 0, scale: 1 },    // Top left
    { x: 0, y: 1, z: 0, scale: 1 },     // Top center
    { x: 8, y: 1, z: 0, scale: 1 },     // Top right
    { x: -8, y: -5, z: 0, scale: 1 },   // Bottom left
    { x: 0, y: -5, z: 0, scale: 1 },    // Bottom center
    { x: 8, y: -5, z: 0, scale: 1 }     // Bottom right
  ]

  // Create optimized texture
  const createTexture = useCallback((type, customImage = null) => {
    const cacheKey = `${type}-${customImage || 'default'}`
    
    if (globalTextureCache.has(cacheKey)) {
      return globalTextureCache.get(cacheKey)
    }

    if (customImage && customImage !== '/coins/plainh.png' && customImage !== '/coins/plaint.png') {
      try {
        const loader = new THREE.TextureLoader()
        const texture = loader.load(
          customImage,
          // Success callback
          (loadedTexture) => {
            console.log('✅ Texture loaded successfully:', customImage)
          },
          // Progress callback
          undefined,
          // Error callback - fallback to default
          (error) => {
            console.error('❌ Error loading texture:', customImage, error)
            console.log('🔄 Falling back to default texture')
          }
        )
        texture.colorSpace = THREE.SRGBColorSpace
        texture.flipY = true // Changed to true to fix upside-down images
        globalTextureCache.set(cacheKey, texture)
        return texture
      } catch (error) {
        console.error('Error loading texture:', customImage, error)
        // Fall through to default texture generation
      }
    }

    // Generate default texture
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    if (type === 'edge') {
      ctx.fillStyle = '#F8F8F8'
      ctx.fillRect(0, 0, size, size)
    } else if (type === 'heads') {
      const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
      gradient.addColorStop(0, '#FFD700')
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
      gradient.addColorStop(1, '#A0A0A0')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
      ctx.fillStyle = '#333'
      ctx.font = 'bold 200px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('T', size/2, size/2)
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.flipY = true // Fixed orientation
    globalTextureCache.set(cacheKey, texture)
    return texture
  }, [])

  // Initialize scene
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return

    console.log('🎬 Initializing 3D scene')

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000)
    camera.position.set(0, 0, 25)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    mountRef.current.appendChild(renderer.domElement)
    sceneRef.current = scene
    rendererRef.current = renderer
    cameraRef.current = camera

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.3))
    const directional = new THREE.DirectionalLight(0xffffff, 1.0)
    directional.position.set(5, 5, 5)
    scene.add(directional)

    // Create 6 coin slots
    for (let i = 0; i < 6; i++) {
      const materials = [
        new THREE.MeshStandardMaterial({ map: createTexture('edge'), metalness: 0.3, roughness: 0.2 }),
        new THREE.MeshStandardMaterial({ map: createTexture('heads'), metalness: 0.3, roughness: 0.2 }),
        new THREE.MeshStandardMaterial({ map: createTexture('tails'), metalness: 0.3, roughness: 0.2 })
      ]

      const geometry = new THREE.CylinderGeometry(3, 3, 0.4, 48)
      const coin = new THREE.Mesh(geometry, materials)
      
      const pos = coinPositions[i]
      coin.position.set(pos.x, pos.y, pos.z)
      coin.scale.set(pos.scale, 1.5 * pos.scale, pos.scale)
      coin.rotation.x = Math.PI
      coin.rotation.y = Math.PI / 2
      coin.visible = false // Hide until player joins

      scene.add(coin)
      coinsRef.current[i] = coin
      coinStatesRef.current[i] = {
        isFlipping: false,
        flipStartTime: null,
        flipDuration: 2000,
        flipResult: null,
        hasLanded: false,
        flipPower: 5
      }
    }

    // Animation loop
    const animate = (currentTime) => {
      if (!sceneRef.current || !rendererRef.current) return

      const time = currentTime * 0.001

      coinsRef.current.forEach((coin, index) => {
        if (!coin || !coin.visible) return
        
        const state = coinStatesRef.current[index]
        const pos = coinPositions[index]

        if (state.isFlipping) {
          const elapsed = currentTime - state.flipStartTime
          const progress = Math.min(elapsed / state.flipDuration, 1)
          
          // Easing function for smooth landing
          const easeOut = 1 - Math.pow(1 - progress, 3)
          
          // Flip animation - spins based on power, goes up and comes down
          const flipSpeed = 0.15 + (state.flipPower * 0.03) // More power = faster spin
          const numRotations = 3 + state.flipPower // More power = more rotations
          
          // Height arc - goes up then comes down
          const heightProgress = Math.sin(progress * Math.PI)
          const maxHeight = 2 + (state.flipPower * 0.3) // More power = higher flip
          coin.position.y = pos.y + (heightProgress * maxHeight)
          coin.position.z = pos.z + (Math.sin(progress * Math.PI) * 1.5)
          
          // Rotation during flip
          coin.rotation.x = (progress * numRotations * Math.PI * 2)
          
          if (progress >= 1) {
            // Landing - set final orientation based on result
            state.isFlipping = false
            state.hasLanded = true
            coin.position.y = pos.y
            coin.position.z = pos.z
            coin.rotation.x = state.flipResult === 'heads' ? 0 : Math.PI
            coin.rotation.y = Math.PI / 2
            console.log(`🎯 Coin ${index} landed: ${state.flipResult}`)
          }
        } else if (!state.hasLanded) {
          // Idle animation - gentle floating before flip
          coin.rotation.x += 0.02
          coin.position.y = pos.y + Math.sin(time * 0.5 + index) * 0.2
        } else {
          // Landed - gentle breathing animation
          coin.position.y = pos.y + Math.sin(time * 0.3 + index) * 0.05
        }
      })

      renderer.render(scene, camera)
      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate(0)

    // Resize handler
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
      coinsRef.current.forEach(coin => {
        if (coin) {
          if (coin.geometry) coin.geometry.dispose()
          if (Array.isArray(coin.material)) {
            coin.material.forEach(mat => mat.dispose())
          }
        }
      })
      if (renderer) renderer.dispose()
      sceneRef.current = null
    }
  }, [createTexture])

  // Update coins based on players
  useEffect(() => {
    if (!sceneRef.current) return

    players.forEach((player, index) => {
      const coin = coinsRef.current[index]
      if (!coin) return

      if (player?.address) {
        // Show coin and update textures
        coin.visible = true
        
        const images = playerCoinImages[player.address.toLowerCase()]
        if (images && coin.material[1]) {
          // Update heads texture
          const newHeadsTexture = createTexture('heads', images.headsImage)
          coin.material[1].map = newHeadsTexture
          coin.material[1].needsUpdate = true
          
          // Update tails texture
          const newTailsTexture = createTexture('tails', images.tailsImage)
          coin.material[2].map = newTailsTexture
          coin.material[2].needsUpdate = true
        }
      } else {
        coin.visible = false
      }
    })
  }, [players, playerCoinImages, createTexture])

  // Handle flip animations from server
  useEffect(() => {
    if (!serverState?.players) return

    Object.entries(serverState.players).forEach(([playerAddress, playerData]) => {
      if (playerData.hasFlipped && playerData.flipResult) {
        const playerIndex = players.findIndex(p => p?.address?.toLowerCase() === playerAddress.toLowerCase())
        if (playerIndex === -1 || playerIndex >= 6) return

        const state = coinStatesRef.current[playerIndex]
        if (!state.isFlipping && !state.hasLanded) {
          state.isFlipping = true
          state.flipStartTime = Date.now()
          state.flipPower = playerData.flipPower || 5 // Use server-sent power or default
          state.flipDuration = 1500 + (state.flipPower * 100) // Longer power = longer flip
          state.flipResult = playerData.flipResult
          console.log(`🎲 Starting flip animation for slot ${playerIndex}: ${playerData.flipResult} with power ${state.flipPower}`)
        }
      }
    })
  }, [serverState, players])

  // Display player choices and results
  const renderChoiceOverlays = () => {
    return players.map((player, index) => {
      if (!player?.address) return null
      
      const playerData = serverState?.players?.[player.address.toLowerCase()]
      const choice = playerData?.choice
      const hasFlipped = playerData?.hasFlipped
      const flipResult = playerData?.flipResult
      const state = coinStatesRef.current[index]
      
      if (!choice) return null
      
      const pos = coinPositions[index]
      
      // Show Win/Lose if coin has landed
      const showResult = state?.hasLanded && hasFlipped && flipResult
      const isWin = showResult && choice === flipResult
      
      return (
        <div
          key={`choice-${index}`}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(${pos.x * 15 + 50}px, ${-pos.y * 15 + 130}px)`,
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 100
          }}
        >
          {/* Choice display */}
          <div style={{
            color: choice === 'heads' ? '#FFD700' : '#C0C0C0',
            fontSize: '1rem',
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(0,0,0,0.8)',
            background: 'rgba(0,0,0,0.8)',
            padding: '0.3rem 0.6rem',
            borderRadius: '0.5rem',
            border: `2px solid ${choice === 'heads' ? '#FFD700' : '#C0C0C0'}`,
            textTransform: 'uppercase',
            marginBottom: '0.5rem'
          }}>
            {choice}
          </div>
          
          {/* Win/Lose display */}
          {showResult && (
            <div style={{
              color: isWin ? '#00ff88' : '#ff6b6b',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              textShadow: `0 0 15px ${isWin ? 'rgba(0,255,136,0.8)' : 'rgba(255,107,107,0.8)'}`,
              background: isWin ? 'rgba(0,255,136,0.15)' : 'rgba(255,107,107,0.15)',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: `3px solid ${isWin ? '#00ff88' : '#ff6b6b'}`,
              textTransform: 'uppercase',
              animation: 'resultPop 0.5s ease-out'
            }}>
              {isWin ? '✅ WIN' : '❌ LOSE'}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative'
      }}
    >
      {renderChoiceOverlays()}
    </div>
  )
}

export default BattleRoyaleUnified3DScene