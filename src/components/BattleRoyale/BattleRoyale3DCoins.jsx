import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as THREE from 'three'

const BattleRoyale3DCoins = ({
  players = [],
  gamePhase = 'filling',
  serverState = null,
  flipStates = {},
  onFlipComplete = () => {},
  playerCoinImages = {},
  isCreator = false,
  currentUserAddress = null,
  size = 240,
  // New props for slot interaction
  onSlotClick = () => {},
  canJoin = false,
  isJoining = false,
  coinSides = {},
  onCoinSideToggle = () => {},
  onCoinChange = () => {}
}) => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const coinsRef = useRef([])
  const animationIdRef = useRef(null)
  const textureLoaderRef = useRef(new THREE.TextureLoader())
  const [hoveredSlot, setHoveredSlot] = useState(null)
  
  // Performance optimization: adaptive quality
  const [quality, setQuality] = useState('high')
  
  // Memoize the flip complete callback to prevent unnecessary re-renders
  const memoizedOnFlipComplete = useCallback((playerAddress, result) => {
    if (typeof onFlipComplete === 'function') {
      onFlipComplete(playerAddress, result)
    }
  }, [onFlipComplete])
  
  // Determine if we should use 3D or 2D display
  const use3D = useMemo(() => {
    return gamePhase !== 'filling' && gamePhase !== 'waiting_players' && gamePhase !== null
  }, [gamePhase])
  
  // Create gradient background texture
  const createBackgroundGradient = useCallback(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    
    // Create radial gradient
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 512)
    gradient.addColorStop(0, 'rgba(138, 43, 226, 0.3)') // Purple center
    gradient.addColorStop(0.5, 'rgba(0, 191, 255, 0.2)') // Blue middle
    gradient.addColorStop(1, 'rgba(255, 20, 147, 0.1)') // Pink outer
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 512, 512)
    
    return new THREE.CanvasTexture(canvas)
  }, [])
  
  // Create optimized coin mesh
  const createCoinMesh = useCallback((playerData, index) => {
    const { address, coin, isEliminated } = playerData
    
    // Coin geometry - optimized with less segments for performance
    const segments = quality === 'high' ? 64 : 32
    const geometry = new THREE.CylinderGeometry(0.8, 0.8, 0.15, segments)
    
    // Load textures with error handling
    const headsImage = playerCoinImages[address]?.headsImage || '/coins/plainh.png'
    const tailsImage = playerCoinImages[address]?.tailsImage || '/coins/plaint.png'
    
    const headsTexture = textureLoaderRef.current.load(headsImage)
    const tailsTexture = textureLoaderRef.current.load(tailsImage)
    
    // Optimize texture settings
    [headsTexture, tailsTexture].forEach(tex => {
      tex.minFilter = THREE.LinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.format = THREE.RGBAFormat
    })
    
    // Create materials
    const edgeMaterial = new THREE.MeshPhongMaterial({
      color: isEliminated ? 0x666666 : 0xFFD700,
      metalness: 0.7,
      roughness: 0.3,
      emissive: isEliminated ? 0x000000 : 0xFFD700,
      emissiveIntensity: 0.1
    })
    
    const headsMaterial = new THREE.MeshPhongMaterial({
      map: headsTexture,
      transparent: true,
      opacity: isEliminated ? 0.5 : 1
    })
    
    const tailsMaterial = new THREE.MeshPhongMaterial({
      map: tailsTexture,
      transparent: true,
      opacity: isEliminated ? 0.5 : 1
    })
    
    // Create mesh with material array
    const materials = [edgeMaterial, headsMaterial, tailsMaterial]
    const mesh = new THREE.Mesh(geometry, materials)
    
    // Position coins in a curved arc for better visibility
    const cols = 4
    const rows = 2
    const spacing = 2.2
    const col = index % cols
    const row = Math.floor(index / cols)
    
    // Curved arrangement
    const angleOffset = (col - 1.5) * 0.15 // Slight curve
    const x = (col - 1.5) * spacing
    const z = (row - 0.5) * spacing + Math.abs(angleOffset) * 2
    const y = 0
    
    mesh.position.set(x, y, z)
    mesh.rotation.y = Math.PI / 2 // Show heads by default
    
    // Store metadata
    mesh.userData = {
      playerAddress: address,
      slotIndex: index,
      isEliminated,
      originalY: y
    }
    
    return mesh
  }, [playerCoinImages, quality, size])
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!use3D || !mountRef.current || !gamePhase) return

    // Create scene with gradient background
    const scene = new THREE.Scene()
    
    // Add gradient background plane
    const bgGeometry = new THREE.PlaneGeometry(50, 50)
    const bgTexture = createBackgroundGradient()
    const bgMaterial = new THREE.MeshBasicMaterial({
      map: bgTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    })
    const backgroundMesh = new THREE.Mesh(bgGeometry, bgMaterial)
    backgroundMesh.position.z = -15
    scene.add(backgroundMesh)
    
    // Add fog for depth
    scene.fog = new THREE.Fog(0x000000, 10, 30)
    
    sceneRef.current = scene

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 6, 12)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Create renderer with optimizations
    const renderer = new THREE.WebGLRenderer({ 
      antialias: quality === 'high',
      alpha: true,
      powerPreference: 'high-performance'
    })
    
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = quality === 'high'
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)
    
    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)
    
    // Key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8)
    keyLight.position.set(5, 10, 5)
    keyLight.castShadow = quality === 'high'
    scene.add(keyLight)
    
    // Fill light
    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3)
    fillLight.position.set(-5, 5, 0)
    scene.add(fillLight)
    
    // Rim light for coin edges
    const rimLight = new THREE.PointLight(0xff1493, 0.5, 20)
    rimLight.position.set(0, 8, -5)
    scene.add(rimLight)
    
    // Create coins for all 8 slots
    const coins = []
    for (let i = 0; i < 8; i++) {
      const playerData = players[i] || {
        address: null,
        coin: null,
        isEliminated: false
      }
      
      if (playerData.address) {
        const coin = createCoinMesh(playerData, i)
        scene.add(coin)
        coins.push(coin)
      } else {
        // Create placeholder for empty slot
        const geometry = new THREE.RingGeometry(0.7, 0.9, 32)
        const material = new THREE.MeshBasicMaterial({
          color: 0x333333,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide
        })
        const placeholder = new THREE.Mesh(geometry, material)
        
        const cols = 4
        const rows = 2
        const spacing = 2.2
        const col = i % cols
        const row = Math.floor(i / cols)
        const angleOffset = (col - 1.5) * 0.15
        const x = (col - 1.5) * spacing
        const z = (row - 0.5) * spacing + Math.abs(angleOffset) * 2
        
        placeholder.position.set(x, 0, z)
        placeholder.rotation.x = -Math.PI / 2
        placeholder.userData = { slotIndex: i, isEmpty: true }
        
        scene.add(placeholder)
        coins.push(placeholder)
      }
    }
    
    coinsRef.current = coins

    // Animation loop
    const clock = new THREE.Clock()
    
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      
      const deltaTime = clock.getDelta()
      const elapsedTime = clock.getElapsedTime()
      
      // Update coin animations
      coinsRef.current.forEach((coin, index) => {
        if (!coin.userData.isEmpty) {
          const playerAddress = coin.userData.playerAddress
          const flipState = flipStates[playerAddress]
          
          if (flipState?.isFlipping) {
            // Flip animation
            const progress = (Date.now() - flipState.flipStartTime) / flipState.flipDuration
            if (progress < 1) {
              coin.rotation.x = flipState.totalRotations * progress
              coin.position.y = coin.userData.originalY + Math.sin(progress * Math.PI) * 2
            } else {
              coin.rotation.x = flipState.finalRotation
              coin.position.y = coin.userData.originalY
              memoizedOnFlipComplete(playerAddress, flipState.flipResult)
            }
          } else {
            // Idle animation based on game phase
            if (gamePhase === 'waiting_choice' || gamePhase === 'charging_power') {
              coin.rotation.y += deltaTime * 0.5
              coin.position.y = coin.userData.originalY + Math.sin(elapsedTime * 2 + index) * 0.05
            }
            
            // Hover effect
            if (hoveredSlot === index) {
              coin.scale.setScalar(1.1)
            } else {
              coin.scale.setScalar(1)
            }
          }
        }
      })
      
      // Rotate background slowly
      backgroundMesh.rotation.z += deltaTime * 0.05
      
      renderer.render(scene, camera)
    }
    
    animate()

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    }

    window.addEventListener('resize', handleResize)

    // Mouse interaction
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    
    const handleMouseMove = (event) => {
      if (!mountRef.current) return
      
      const rect = mountRef.current.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(coinsRef.current)
      
      if (intersects.length > 0) {
        const slot = intersects[0].object.userData.slotIndex
        setHoveredSlot(slot)
      } else {
        setHoveredSlot(null)
      }
    }
    
    mountRef.current.addEventListener('mousemove', handleMouseMove)
    
    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      
      window.removeEventListener('resize', handleResize)
      mountRef.current?.removeEventListener('mousemove', handleMouseMove)
      
      // Dispose of Three.js resources
      coinsRef.current.forEach(coin => {
        coin.geometry.dispose()
        if (Array.isArray(coin.material)) {
          coin.material.forEach(mat => {
            if (mat.map) mat.map.dispose()
            mat.dispose()
          })
        } else {
          if (coin.material.map) coin.material.map.dispose()
          coin.material.dispose()
        }
      })
      
      scene.clear()
      renderer.dispose()
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, [use3D, players, gamePhase, flipStates, hoveredSlot, createBackgroundGradient, createCoinMesh, memoizedOnFlipComplete, quality])
  
  // 2D Lobby Display
  if (!use3D && gamePhase) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem',
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.1), rgba(0, 191, 255, 0.1))',
        borderRadius: '1rem',
        border: '2px solid rgba(255, 20, 147, 0.3)'
      }}>
        {Array.from({ length: 8 }).map((_, index) => {
          const player = players[index]
          const isCurrentUser = player?.address === currentUserAddress
          const isEmpty = !player?.address
          
          return (
            <div
              key={index}
              style={{
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                background: isEmpty 
                  ? 'rgba(255, 255, 255, 0.05)'
                  : isCurrentUser
                    ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 204, 106, 0.2))'
                    : 'linear-gradient(135deg, rgba(0, 191, 255, 0.2), rgba(138, 43, 226, 0.2))',
                border: `3px solid ${
                  isEmpty ? 'rgba(255, 255, 255, 0.2)' :
                  isCurrentUser ? '#00ff88' : '#00bfff'
                }`,
                borderRadius: '1rem',
                padding: '1rem',
                position: 'relative',
                transition: 'all 0.3s ease',
                cursor: isEmpty ? 'pointer' : 'default'
              }}
            >
              {/* Slot number badge */}
              <div style={{
                position: 'absolute',
                top: '0.5rem',
                left: '0.5rem',
                background: 'rgba(0, 0, 0, 0.7)',
                color: '#FFD700',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                {index === 0 ? 'Creator' : `Slot ${index + 1}`}
              </div>
              
              {player?.address ? (
                <>
                  {/* 2D Coin Image */}
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '3px solid #FFD700',
                    boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                    background: 'radial-gradient(circle, #FFD700, #FFA500)',
                    cursor: 'pointer'
                  }}
                  onClick={() => onCoinSideToggle(player.address)}
                  >
                    <img
                      src={
                        coinSides[player.address] === 'tails' 
                          ? (playerCoinImages[player.address]?.tailsImage || '/coins/plaint.png')
                          : (playerCoinImages[player.address]?.headsImage || '/coins/plainh.png')
                      }
                      alt="Player coin"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                  
                  {/* Coin side indicator */}
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: '#FFD700',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.7rem',
                    fontWeight: 'bold'
                  }}>
                    {coinSides[player.address] === 'tails' ? 'Tails' : 'Heads'}
                  </div>
                  
                  {/* Player address */}
                  <div style={{
                    color: 'white',
                    fontSize: '0.7rem',
                    fontFamily: 'monospace',
                    textAlign: 'center'
                  }}>
                    {player.address.slice(0, 6)}...{player.address.slice(-4)}
                  </div>
                  
                  {/* Status indicator */}
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#00ff88',
                    boxShadow: '0 0 10px rgba(0, 255, 136, 0.5)'
                  }} />
                  
                  {/* Change Coin Button for current user */}
                  {player.address === currentUserAddress && (
                    <button 
                      style={{
                        position: 'absolute',
                        bottom: '0.5rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                        color: '#000',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.5rem 1rem',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        zIndex: 4,
                        boxShadow: '0 2px 10px rgba(255, 215, 0, 0.3)'
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onCoinChange(player.address)
                      }}
                    >
                      Change Coin
                    </button>
                  )}
                </>
              ) : (
                <div 
                  style={{
                    color: '#FF1493',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    cursor: canJoin ? 'pointer' : 'default'
                  }}
                  onClick={() => canJoin && onSlotClick(index)}
                >
                  {isJoining ? 'Joining...' : 'Click to Join'}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }
  
  // Fallback for invalid game phase
  if (!gamePhase) {
    return (
      <div style={{
        width: '100%',
        height: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(138, 43, 226, 0.3))',
        borderRadius: '1rem',
        border: '2px solid rgba(255, 20, 147, 0.3)',
        color: '#FFD700',
        fontSize: '1.2rem',
        fontWeight: 'bold'
      }}>
        Loading game...
      </div>
    )
  }

  // 3D Game Display
  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: '100%', 
        height: '500px',
        borderRadius: '1rem',
        overflow: 'hidden',
        border: '2px solid rgba(255, 20, 147, 0.3)',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(138, 43, 226, 0.3))',
        position: 'relative'
      }}
    >
      {/* Performance indicator */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        padding: '0.5rem 1rem',
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '0.5rem',
        color: quality === 'high' ? '#00ff88' : '#ffed4e',
        fontSize: '0.8rem',
        zIndex: 10
      }}>
        Quality: {quality}
      </div>
      
      {/* Game phase indicator */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '0.75rem 2rem',
        background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.9), rgba(255, 105, 180, 0.9))',
        borderRadius: '2rem',
        color: 'white',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(255, 20, 147, 0.5)',
        zIndex: 10
      }}>
        {gamePhase === 'waiting_choice' && 'Make Your Choice!'}
        {gamePhase === 'charging_power' && 'Charge Your Power!'}
        {gamePhase === 'executing_flips' && 'Flipping...'}
        {gamePhase === 'showing_result' && 'Round Complete!'}
      </div>
    </div>
  )
}

export default BattleRoyale3DCoins