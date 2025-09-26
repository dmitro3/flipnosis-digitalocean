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
  // Refs
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const coinsRef = useRef([])
  const animationIdRef = useRef(null)
  const textureLoaderRef = useRef(new THREE.TextureLoader())
  
  // State
  const [hoveredSlot, setHoveredSlot] = useState(null)
  const [quality, setQuality] = useState('high')
  
  // Safe game phase check
  const safeGamePhase = gamePhase || 'filling'
  
  // Determine if we should use 3D or 2D display
  const shouldUse3D = useMemo(() => {
    return safeGamePhase !== 'filling' && safeGamePhase !== 'waiting_players'
  }, [safeGamePhase])
  
  // Memoized callback
  const safeOnFlipComplete = useCallback((playerAddress, result) => {
    if (typeof onFlipComplete === 'function') {
      onFlipComplete(playerAddress, result)
    }
  }, [onFlipComplete])
  
  // Create background gradient
  const createBackgroundGradient = useCallback(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 512)
    gradient.addColorStop(0, 'rgba(138, 43, 226, 0.3)')
    gradient.addColorStop(0.5, 'rgba(0, 191, 255, 0.2)')
    gradient.addColorStop(1, 'rgba(255, 20, 147, 0.1)')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 512, 512)
    
    return new THREE.CanvasTexture(canvas)
  }, [])
  
  // Create coin mesh
  const createCoinMesh = useCallback((playerData, index) => {
    if (!playerData || !playerData.address) return null
    
    const { address, isEliminated = false } = playerData
    
    // Geometry
    const segments = quality === 'high' ? 64 : 32
    const geometry = new THREE.CylinderGeometry(0.8, 0.8, 0.15, segments)
    
    // Textures
    const headsImage = playerCoinImages[address]?.headsImage || '/coins/plainh.png'
    const tailsImage = playerCoinImages[address]?.tailsImage || '/coins/plaint.png'
    
    const headsTexture = textureLoaderRef.current.load(headsImage)
    const tailsTexture = textureLoaderRef.current.load(tailsImage)
    
    // Optimize textures
    [headsTexture, tailsTexture].forEach(tex => {
      tex.minFilter = THREE.LinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.format = THREE.RGBAFormat
    })
    
    // Materials
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
    
    // Create mesh
    const materials = [edgeMaterial, headsMaterial, tailsMaterial]
    const mesh = new THREE.Mesh(geometry, materials)
    
    // Position
    const cols = 4
    const rows = 2
    const spacing = 2.2
    const col = index % cols
    const row = Math.floor(index / cols)
    const angleOffset = (col - 1.5) * 0.15
    const x = (col - 1.5) * spacing
    const z = (row - 0.5) * spacing + Math.abs(angleOffset) * 2
    const y = 0
    
    mesh.position.set(x, y, z)
    mesh.rotation.y = Math.PI / 2
    
    // Store metadata
    mesh.userData = {
      playerAddress: address,
      slotIndex: index,
      isEliminated,
      originalY: y
    }
    
    return mesh
  }, [playerCoinImages, quality])
  
  // Initialize 3D scene
  useEffect(() => {
    if (!shouldUse3D || !mountRef.current) return
    
    // Create scene
    const scene = new THREE.Scene()
    sceneRef.current = scene
    
    // Background
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
    
    // Fog
    scene.fog = new THREE.Fog(0x000000, 10, 30)
    
    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 6, 12)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera
    
    // Renderer
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
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8)
    keyLight.position.set(5, 10, 5)
    keyLight.castShadow = quality === 'high'
    scene.add(keyLight)
    
    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3)
    fillLight.position.set(-5, 5, 0)
    scene.add(fillLight)
    
    const rimLight = new THREE.PointLight(0xff1493, 0.5, 20)
    rimLight.position.set(0, 8, -5)
    scene.add(rimLight)
    
    // Create coins
    const coins = []
    for (let i = 0; i < 8; i++) {
      const playerData = players[i] || { address: null, coin: null, isEliminated: false }
      
      if (playerData.address) {
        const coin = createCoinMesh(playerData, i)
        if (coin) {
          scene.add(coin)
          coins.push(coin)
        }
      } else {
        // Placeholder
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
      
      // Animate coins
      coinsRef.current.forEach((coin, index) => {
        if (!coin || !coin.userData) return
        
        const { playerAddress, isEliminated, originalY } = coin.userData
        const flipState = flipStates[playerAddress]
        
        if (flipState?.isFlipping) {
          // Flip animation
          const progress = (Date.now() - flipState.flipStartTime) / flipState.flipDuration
          if (progress < 1) {
            coin.rotation.x = flipState.totalRotations * progress
            coin.position.y = originalY + Math.sin(progress * Math.PI) * 2
          } else {
            coin.rotation.x = flipState.finalRotation
            coin.position.y = originalY
            safeOnFlipComplete(playerAddress, flipState.flipResult)
          }
        } else {
          // Idle animation
          if (safeGamePhase === 'waiting_choice' || safeGamePhase === 'charging_power') {
            coin.rotation.y += deltaTime * 0.5
            coin.position.y = originalY + Math.sin(elapsedTime * 2 + index) * 0.05
          }
          
          // Hover effect
          if (hoveredSlot === index) {
            coin.position.y = originalY + 0.2
            coin.scale.setScalar(1.1)
          } else {
            coin.position.y = originalY
            coin.scale.setScalar(1)
          }
        }
      })
      
      // Camera animation
      if (cameraRef.current) {
        cameraRef.current.position.x = Math.sin(elapsedTime * 0.1) * 2
        cameraRef.current.lookAt(0, 0, 0)
      }
      
      // Render
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }
    
    animate()
    
    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      
      if (rendererRef.current && mountRef.current && rendererRef.current.domElement) {
        mountRef.current.removeChild(rendererRef.current.domElement)
      }
      
      // Dispose of resources
      coinsRef.current.forEach(coin => {
        if (coin && coin.geometry) coin.geometry.dispose()
        if (coin && coin.material) {
          if (Array.isArray(coin.material)) {
            coin.material.forEach(mat => mat.dispose())
          } else {
            coin.material.dispose()
          }
        }
      })
      
      if (sceneRef.current) {
        sceneRef.current.clear()
      }
    }
  }, [shouldUse3D, players, safeGamePhase, flipStates, hoveredSlot, createBackgroundGradient, createCoinMesh, safeOnFlipComplete, quality])
  
  // 2D Lobby Display
  if (!shouldUse3D) {
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
              {/* Slot number badge */}
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
                  {/* Coin image */}
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
                  
                  {/* Player address */}
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
                  
                  {/* Status indicator */}
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
                  
                  {/* Change coin button */}
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
                    <div onClick={() => onSlotClick(index)}>
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
  
  // 3D Game Display
  return (
    <div style={{ position: 'relative', width: '100%', height: '500px' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Game phase indicator */}
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
        {safeGamePhase === 'waiting_choice' && 'Make Your Choice!'}
        {safeGamePhase === 'charging_power' && 'Charge Your Power!'}
        {safeGamePhase === 'executing_flips' && 'Flipping...'}
        {safeGamePhase === 'showing_result' && 'Round Complete!'}
      </div>
    </div>
  )
}

export default BattleRoyale3DCoins