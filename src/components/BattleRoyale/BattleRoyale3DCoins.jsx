import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as THREE from 'three'

// Separate 2D Lobby Component
const Lobby2DDisplay = ({ 
  players, 
  currentUserAddress, 
  playerCoinImages, 
  coinSides, 
  onSlotClick, 
  canJoin, 
  isJoining, 
  onCoinSideToggle, 
  onCoinChange 
}) => {
  const [hoveredSlot, setHoveredSlot] = useState(null)
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '1rem',
      padding: '1rem',
      background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(138, 43, 226, 0.3))',
      borderRadius: '1rem',
      border: '2px solid rgba(255, 20, 147, 0.3)',
      minHeight: '500px'
    }}>
      {Array.from({ length: 8 }, (_, index) => {
        const player = players[index]
        const isOccupied = player?.address
        const isCurrentUser = player?.address === currentUserAddress
        const coinSide = coinSides[player?.address] || 'heads'
        
        return (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '1rem',
              background: isOccupied 
                ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 191, 255, 0.2))'
                : 'linear-gradient(135deg, rgba(255, 20, 147, 0.2), rgba(138, 43, 226, 0.2))',
              borderRadius: '0.5rem',
              border: `2px solid ${isOccupied ? 'rgba(0, 255, 136, 0.5)' : 'rgba(255, 20, 147, 0.5)'}`,
              cursor: canJoin && !isOccupied ? 'pointer' : 'default',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
            onMouseEnter={() => setHoveredSlot(index)}
            onMouseLeave={() => setHoveredSlot(null)}
            onClick={() => {
              if (canJoin && !isOccupied) {
                onSlotClick(index)
              }
            }}
          >
            <div style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              background: 'rgba(0, 0, 0, 0.7)',
              color: '#fff',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}>
              {index + 1}
            </div>
            
            {isOccupied ? (
              <>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  marginBottom: '0.5rem',
                  border: '3px solid #FFD700',
                  boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)'
                }}>
                  <img
                    src={playerCoinImages[player.address]?.[`${coinSide}Image`] || '/coins/plainh.png'}
                    alt={`${coinSide} side`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onCoinSideToggle(player.address)
                    }}
                  />
                </div>
                
                <div style={{
                  color: '#00ff88',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginBottom: '0.5rem',
                  wordBreak: 'break-all'
                }}>
                  {player.address?.slice(0, 6)}...{player.address?.slice(-4)}
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isCurrentUser ? '#00ff88' : '#00bfff'
                  }} />
                  <span style={{
                    color: isCurrentUser ? '#00ff88' : '#00bfff',
                    fontSize: '0.7rem',
                    fontWeight: 'bold'
                  }}>
                    {isCurrentUser ? 'You' : 'Player'}
                  </span>
                </div>
                
                <button
                  style={{
                    background: 'linear-gradient(135deg, #ff1493, #8a2be2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onCoinChange(player.address)
                  }}
                >
                  Change Coin
                </button>
              </>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#FF1493',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                {canJoin ? (
                  <div>
                    {isJoining ? 'Joining...' : 'Click to Join'}
                  </div>
                ) : (
                  'Empty Slot'
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Main component
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
  onSlotClick = () => {},
  canJoin = false,
  isJoining = false,
  coinSides = {},
  onCoinSideToggle = () => {},
  onCoinChange = () => {}
}) => {
  // Refs
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const coinsRef = useRef([])
  const animationIdRef = useRef(null)
  const texturesRef = useRef({})
  
  // State
  const [hoveredSlot, setHoveredSlot] = useState(null)
  const [quality] = useState('high')
  const [isSceneReady, setIsSceneReady] = useState(false)
  
  // Safe game phase check
  const safeGamePhase = gamePhase || 'filling'
  
  // Determine if we should use 3D or 2D display
  const shouldUse3D = useMemo(() => {
    const use3D = safeGamePhase !== 'filling' && safeGamePhase !== 'waiting_players'
    console.log('Should use 3D:', use3D, 'Game phase:', safeGamePhase)
    return use3D
  }, [safeGamePhase])
  
  // Memoized callback
  const safeOnFlipComplete = useCallback((playerAddress, result) => {
    if (typeof onFlipComplete === 'function') {
      onFlipComplete(playerAddress, result)
    }
  }, [onFlipComplete])
  
  // Initialize 3D scene
  useEffect(() => {
    if (!shouldUse3D || !mountRef.current) {
      setIsSceneReady(false)
      return
    }
    
    let mounted = true
    const textureLoader = new THREE.TextureLoader()
    
    // Create scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    sceneRef.current = scene
    
    // Camera setup - adjusted for better view
    const camera = new THREE.PerspectiveCamera(
      45, // Reduced FOV for less distortion
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      100
    )
    camera.position.set(0, 8, 15) // Moved camera back and up
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = quality === 'high'
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer
    
    if (mounted && mountRef.current) {
      mountRef.current.appendChild(renderer.domElement)
    }
    
    // Lighting setup - improved
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 1)
    keyLight.position.set(5, 10, 5)
    keyLight.castShadow = quality === 'high'
    if (quality === 'high') {
      keyLight.shadow.camera.near = 0.5
      keyLight.shadow.camera.far = 50
      keyLight.shadow.camera.left = -10
      keyLight.shadow.camera.right = 10
      keyLight.shadow.camera.top = 10
      keyLight.shadow.camera.bottom = -10
    }
    scene.add(keyLight)
    
    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.5)
    fillLight.position.set(-5, 5, 0)
    scene.add(fillLight)
    
    const rimLight = new THREE.PointLight(0xff1493, 0.8, 20)
    rimLight.position.set(0, 5, -8)
    scene.add(rimLight)
    
    // Add a ground plane for reference
    const groundGeometry = new THREE.PlaneGeometry(20, 20)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.2
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -1
    ground.receiveShadow = true
    scene.add(ground)
    
    // Create coins with proper materials
    const coins = []
    for (let i = 0; i < 8; i++) {
      const playerData = players[i]
      
      if (playerData?.address) {
        try {
          const { address, isEliminated = false } = playerData
          
          // Create coin geometry
          const geometry = new THREE.CylinderGeometry(0.8, 0.8, 0.15, 32, 1)
          
          // Create materials array for multi-material mesh
          const materials = []
          
          // Edge material (sides of the coin)
          materials.push(new THREE.MeshStandardMaterial({
            color: isEliminated ? 0x666666 : 0xFFD700,
            metalness: 0.7,
            roughness: 0.3
          }))
          
          // Top material (heads)
          const headsImage = playerCoinImages[address]?.headsImage || '/coins/plainh.png'
          materials.push(new THREE.MeshStandardMaterial({
            map: textureLoader.load(headsImage),
            color: isEliminated ? 0x666666 : 0xffffff
          }))
          
          // Bottom material (tails)
          const tailsImage = playerCoinImages[address]?.tailsImage || '/coins/plaint.png'
          materials.push(new THREE.MeshStandardMaterial({
            map: textureLoader.load(tailsImage),
            color: isEliminated ? 0x666666 : 0xffffff
          }))
          
          const mesh = new THREE.Mesh(geometry, materials)
          
          // Position coins in a 4x2 grid
          const cols = 4
          const col = i % cols
          const row = Math.floor(i / cols)
          const spacing = 3
          const x = (col - 1.5) * spacing
          const z = (row - 0.5) * spacing
          
          mesh.position.set(x, 0, z)
          mesh.castShadow = true
          mesh.receiveShadow = true
          
          // Store metadata
          mesh.userData = {
            playerAddress: address,
            slotIndex: i,
            isEliminated,
            originalY: 0
          }
          
          scene.add(mesh)
          coins.push(mesh)
        } catch (error) {
          console.error('Error creating coin for player:', i, error)
          coins.push(null)
        }
      } else {
        // Create placeholder ring for empty slot
        const ringGeometry = new THREE.TorusGeometry(0.8, 0.1, 8, 32)
        const ringMaterial = new THREE.MeshStandardMaterial({
          color: 0x333333,
          transparent: true,
          opacity: 0.3
        })
        const ring = new THREE.Mesh(ringGeometry, ringMaterial)
        
        // Position
        const cols = 4
        const col = i % cols
        const row = Math.floor(i / cols)
        const spacing = 3
        const x = (col - 1.5) * spacing
        const z = (row - 0.5) * spacing
        
        ring.position.set(x, 0, z)
        ring.rotation.x = -Math.PI / 2
        ring.userData = { slotIndex: i, isEmpty: true }
        
        scene.add(ring)
        coins.push(ring)
      }
    }
    
    coinsRef.current = coins
    
    if (mounted) {
      setIsSceneReady(true)
    }
    
    // Animation loop
    const clock = new THREE.Clock()
    
    const animate = () => {
      if (!mounted) return
      
      animationIdRef.current = requestAnimationFrame(animate)
      
      const deltaTime = clock.getDelta()
      const elapsedTime = clock.getElapsedTime()
      
      // Animate coins
      coinsRef.current.forEach((coin, index) => {
        if (!coin || !coin.userData) return
        
        const { playerAddress, originalY = 0 } = coin.userData
        const flipState = flipStates[playerAddress]
        
        if (flipState?.isFlipping) {
          // Flip animation
          const progress = Math.min((Date.now() - flipState.flipStartTime) / flipState.flipDuration, 1)
          coin.rotation.x = (flipState.totalRotations || (Math.PI * 4)) * progress
          coin.position.y = originalY + Math.sin(progress * Math.PI) * 2
          
          if (progress >= 1) {
            coin.rotation.x = flipState.flipResult === 'heads' ? 0 : Math.PI
            coin.position.y = originalY
            safeOnFlipComplete(playerAddress, flipState.flipResult)
          }
        } else {
          // Idle animation
          if (safeGamePhase === 'waiting_choice' || safeGamePhase === 'charging_power') {
            coin.rotation.y += deltaTime * 0.3
            coin.position.y = originalY + Math.sin(elapsedTime * 2 + index) * 0.05
          } else {
            coin.rotation.y = 0
            coin.position.y = originalY
          }
          
          // Hover effect
          if (hoveredSlot === index && !coin.userData.isEmpty) {
            coin.scale.setScalar(1.1)
          } else {
            coin.scale.setScalar(1)
          }
        }
      })
      
      // Subtle camera movement
      if (cameraRef.current) {
        cameraRef.current.position.x = Math.sin(elapsedTime * 0.1) * 0.5
        cameraRef.current.lookAt(0, 0, 0)
      }
      
      // Render
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }
    
    animate()
    
    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return
      
      cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    }
    
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => {
      mounted = false
      
      window.removeEventListener('resize', handleResize)
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      
      if (rendererRef.current && mountRef.current) {
        try {
          mountRef.current.removeChild(rendererRef.current.domElement)
        } catch (e) {
          // Already removed
        }
      }
      
      // Dispose of Three.js resources
      coins.forEach(coin => {
        if (coin) {
          if (coin.geometry) coin.geometry.dispose()
          if (coin.material) {
            if (Array.isArray(coin.material)) {
              coin.material.forEach(mat => {
                if (mat.map) mat.map.dispose()
                mat.dispose()
              })
            } else {
              if (coin.material.map) coin.material.map.dispose()
              coin.material.dispose()
            }
          }
        }
      })
      
      if (scene) {
        scene.clear()
      }
      
      if (renderer) {
        renderer.dispose()
      }
      
      setIsSceneReady(false)
    }
  }, [shouldUse3D, players, safeGamePhase, flipStates, hoveredSlot, safeOnFlipComplete, quality, playerCoinImages])
  
  // 2D Lobby Display
  if (!shouldUse3D) {
    return (
      <Lobby2DDisplay
        players={players}
        currentUserAddress={currentUserAddress}
        playerCoinImages={playerCoinImages}
        coinSides={coinSides}
        onSlotClick={onSlotClick}
        canJoin={canJoin}
        isJoining={isJoining}
        onCoinSideToggle={onCoinSideToggle}
        onCoinChange={onCoinChange}
      />
    )
  }
  
  // 3D Game Display
  return (
    <div style={{ position: 'relative', width: '100%', height: '500px', background: '#0a0a0a' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Game phase indicator */}
      {isSceneReady && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(138, 43, 226, 0.8))',
          color: '#00ff88',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          border: '2px solid rgba(255, 20, 147, 0.5)',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(255, 20, 147, 0.5)',
          zIndex: 10
        }}>
          {safeGamePhase === 'starting' && 'Game Starting...'}
          {safeGamePhase === 'revealing_target' && 'Revealing Target...'}
          {safeGamePhase === 'waiting_choice' && 'Make Your Choice!'}
          {safeGamePhase === 'charging_power' && 'Charge Your Power!'}
          {safeGamePhase === 'executing_flips' && 'Flipping...'}
          {safeGamePhase === 'showing_result' && 'Round Complete!'}
          {safeGamePhase === 'completed' && 'Game Over!'}
          {safeGamePhase === 'game_complete' && 'Game Complete!'}
        </div>
      )}
    </div>
  )
}

export default BattleRoyale3DCoins