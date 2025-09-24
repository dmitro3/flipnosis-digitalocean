import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'

// Single optimized renderer for all 8 battle royale coins
const OptimizedBattleRoyaleCoins = ({
  players = [],
  gamePhase = 'filling',
  flipStates = {},
  onFlipComplete = () => {},
  playerCoinImages = {},
  size = 180
}) => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const coinsRef = useRef([])
  const animationIdRef = useRef(null)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const performanceRef = useRef({ level: 'high', fps: 60 })
  
  // Performance settings based on game phase
  const getPerformanceSettings = useCallback(() => {
    switch (gamePhase) {
      case 'filling':
      case 'waiting':
        return { targetFPS: 10, enableRotation: false }
      case 'waiting_choice':
      case 'charging_power':
        return { targetFPS: 15, enableRotation: true }
      case 'executing_flips':
        return { targetFPS: 30, enableRotation: false }
      default:
        return { targetFPS: 15, enableRotation: false }
    }
  }, [gamePhase])

  // Performance detection
  const detectPerformanceLevel = () => {
    const fps = performanceRef.current.fps
    if (fps < 30) return 'low'
    if (fps < 50) return 'medium'
    return 'high'
  }

  // Measure FPS
  const measureFPS = () => {
    frameCountRef.current++
    const currentTime = performance.now()
    const elapsed = currentTime - lastTimeRef.current

    if (elapsed >= 1000) {
      performanceRef.current.fps = Math.round((frameCountRef.current * 1000) / elapsed)
      performanceRef.current.level = detectPerformanceLevel()
      frameCountRef.current = 0
      lastTimeRef.current = currentTime
    }
  }

  // Create coin geometry and materials
  const createCoin = useCallback((playerAddress, coinData, index) => {
    const geometry = new THREE.CylinderGeometry(1, 1, 0.1, 32)
    
    // Create materials with custom textures
    const headsTexture = new THREE.TextureLoader().load(
      playerCoinImages[playerAddress]?.headsImage || '/coins/plainh.png'
    )
    const tailsTexture = new THREE.TextureLoader().load(
      playerCoinImages[playerAddress]?.tailsImage || '/coins/plaint.png'
    )
    
    const headsMaterial = new THREE.MeshLambertMaterial({ map: headsTexture })
    const tailsMaterial = new THREE.MeshLambertMaterial({ map: tailsTexture })
    const edgeMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 })
    
    const materials = [edgeMaterial, headsMaterial, tailsMaterial]
    const coin = new THREE.Mesh(geometry, materials)
    
    // Position coins in a grid
    const cols = 4
    const rows = 2
    const spacing = 2.5
    const startX = -(cols - 1) * spacing / 2
    const startZ = -(rows - 1) * spacing / 2
    
    const col = index % cols
    const row = Math.floor(index / cols)
    
    coin.position.x = startX + col * spacing
    coin.position.z = startZ + row * spacing
    coin.position.y = 0
    
    // Initial rotation
    coin.rotation.x = 0
    coin.rotation.y = Math.PI / 2
    coin.rotation.z = 0
    
    // Store player address for reference
    coin.userData = { playerAddress, index }
    
    return coin
  }, [playerCoinImages])

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return

    // Create scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    sceneRef.current = scene

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 5, 8)
    camera.lookAt(0, 0, 0)

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Cap pixel ratio for performance
    renderer.shadowMap.enabled = false // Disable shadows for performance
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 5)
    scene.add(directionalLight)

    // Create coins for active players
    const coins = []
    players.forEach((player, index) => {
      if (player && player.address) {
        const coin = createCoin(player.address, player.coin, index)
        scene.add(coin)
        coins.push(coin)
      }
    })
    coinsRef.current = coins

    // Animation loop with performance optimization
    const settings = getPerformanceSettings()
    let lastTime = 0
    const frameInterval = 1000 / settings.targetFPS

    const animate = (currentTime) => {
      measureFPS()
      
      const deltaTime = currentTime - lastTime
      
      if (deltaTime > frameInterval) {
        // Update coin animations
        coins.forEach((coin, index) => {
          const playerAddress = coin.userData.playerAddress
          const flipState = flipStates[playerAddress]
          
          if (flipState?.isFlipping) {
            // Handle flip animation
            const elapsed = Date.now() - flipState.flipStartTime
            const progress = Math.min(elapsed / flipState.flipDuration, 1)
            
            if (progress < 1) {
              // Animate flip
              const easeOut = 1 - Math.pow(1 - progress, 3)
              coin.rotation.x = flipState.totalRotations * easeOut
            } else {
              // Flip complete
              coin.rotation.x = flipState.finalRotation
              onFlipComplete(playerAddress, flipState.flipResult)
            }
          } else if (settings.enableRotation && gamePhase === 'waiting_choice') {
            // Gentle rotation during choice phase only
            coin.rotation.x += 0.005
          }
          // No rotation during filling/waiting phases
        })

        renderer.render(scene, camera)
        lastTime = currentTime - (deltaTime % frameInterval)
      }
      
      animationIdRef.current = requestAnimationFrame(animate)
    }

    animationIdRef.current = requestAnimationFrame(animate)

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return
      
      const width = mountRef.current.clientWidth
      const height = mountRef.current.clientHeight
      
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      
      window.removeEventListener('resize', handleResize)
      
      // Cleanup
      coins.forEach(coin => {
        scene.remove(coin)
        coin.geometry.dispose()
        coin.material.forEach(mat => {
          if (mat.map) mat.map.dispose()
          mat.dispose()
        })
      })
      
      scene.clear()
      renderer.dispose()
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, [players, createCoin, getPerformanceSettings, flipStates, onFlipComplete, gamePhase])

  // Update coin textures when player coin images change
  useEffect(() => {
    if (!coinsRef.current) return

    coinsRef.current.forEach(coin => {
      const playerAddress = coin.userData.playerAddress
      const coinImages = playerCoinImages[playerAddress]
      
      if (coinImages) {
        // Update textures
        const headsTexture = new THREE.TextureLoader().load(coinImages.headsImage)
        const tailsTexture = new THREE.TextureLoader().load(coinImages.tailsImage)
        
        coin.material[1].map = headsTexture
        coin.material[2].map = tailsTexture
        coin.material[1].needsUpdate = true
        coin.material[2].needsUpdate = true
      }
    })
  }, [playerCoinImages])

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: '100%', 
        height: '400px',
        background: 'transparent'
      }} 
    />
  )
}

export default OptimizedBattleRoyaleCoins
