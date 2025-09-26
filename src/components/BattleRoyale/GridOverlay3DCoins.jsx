import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'

// Single Three.js scene that overlays the entire player grid with 8 coin meshes
const GridOverlay3DCoins = ({
  players = [],
  gamePhase = 'filling',
  flipStates = {},
  onFlipComplete = () => {},
  playerCoinImages = {},
  coinSides = {}, // User's chosen coin sides from previous phase
  size = 200
}) => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const coinsRef = useRef([])
  const animationIdRef = useRef(null)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const performanceRef = useRef({ level: 'high', fps: 60 })

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

  // Create optimized texture
  const createOptimizedTexture = (side, customImage) => {
    const texture = new THREE.TextureLoader().load(
      customImage || (side === 'heads' ? '/coins/plainh.png' : '/coins/plaint.png')
    )
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    return texture
  }

  // Create coin geometry and materials
  const createCoin = useCallback((playerAddress, coinData, index) => {
    // Scale coin size based on the size prop
    const coinScale = size / 200 // Normalize to default size
    const geometry = new THREE.CylinderGeometry(1 * coinScale, 1 * coinScale, 0.1 * coinScale, 32)
    
    // Get user's chosen coin side from previous phase
    const chosenSide = coinSides[playerAddress] || 'heads'
    
    // Create materials with custom textures
    const headsTexture = createOptimizedTexture('heads', playerCoinImages[playerAddress]?.headsImage)
    const tailsTexture = createOptimizedTexture('tails', playerCoinImages[playerAddress]?.tailsImage)
    
    const headsMaterial = new THREE.MeshLambertMaterial({ map: headsTexture })
    const tailsMaterial = new THREE.MeshLambertMaterial({ map: tailsTexture })
    const edgeMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 })
    
    // Create coin mesh with multiple materials
    const coin = new THREE.Mesh(geometry, [
      edgeMaterial, // Top
      edgeMaterial, // Bottom  
      headsMaterial, // Side 1 (heads)
      tailsMaterial, // Side 2 (tails)
      edgeMaterial, // Side 3
      edgeMaterial  // Side 4
    ])
    
    // Position coins to match the CSS grid layout
    // The grid is 4 columns, 2 rows with 1rem gap
    const cols = 4
    const rows = 2
    const spacing = 2.5 * coinScale // Scale spacing with coin size
    const startX = -(cols - 1) * spacing / 2
    const startZ = -(rows - 1) * spacing / 2
    
    const col = index % cols
    const row = Math.floor(index / cols)
    
    coin.position.x = startX + col * spacing
    coin.position.z = startZ + row * spacing
    coin.position.y = 0
    
    // Set initial rotation based on user's chosen side
    coin.rotation.x = 0
    coin.rotation.y = chosenSide === 'tails' ? Math.PI : Math.PI / 2 // Show chosen side
    coin.rotation.z = 0
    
    // Store player data
    coin.userData = { playerAddress, index, chosenSide }
    
    return coin
  }, [size, playerCoinImages, coinSides])

  // Handle coin click
  const handleCoinClick = (event) => {
    if (gamePhase !== 'round_active') return
    
    const mouse = new THREE.Vector2()
    const raycaster = new THREE.Raycaster()
    
    // Calculate mouse position
    const rect = mountRef.current.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    // Raycast to find clicked coin
    raycaster.setFromCamera(mouse, sceneRef.current.children.find(child => child.type === 'PerspectiveCamera'))
    const intersects = raycaster.intersectObjects(coinsRef.current)
    
    if (intersects.length > 0) {
      const clickedCoin = intersects[0].object
      const { playerAddress, index } = clickedCoin.userData
      
      // Trigger flip animation
      flipCoin(clickedCoin, playerAddress, index)
    }
  }

  // Flip animation
  const flipCoin = (coin, playerAddress, index) => {
    const startRotation = coin.rotation.y
    const endRotation = startRotation + Math.PI // Flip 180 degrees
    
    const duration = 1000 // 1 second flip
    const startTime = Date.now()
    
    const animateFlip = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth flip
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      
      coin.rotation.y = startRotation + (endRotation - startRotation) * easeProgress
      
      if (progress < 1) {
        requestAnimationFrame(animateFlip)
      } else {
        // Call the flip callback
        const result = coin.rotation.y % (Math.PI * 2) < Math.PI ? 'heads' : 'tails'
        onFlipComplete(playerAddress, result)
      }
    }
    
    animateFlip()
  }

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
    // Adjust camera position based on coin size
    const cameraScale = size / 200
    camera.position.set(0, 5 * cameraScale, 8 * cameraScale)
    camera.lookAt(0, 0, 0)

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.setClearColor(0x000000, 0) // Transparent background
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Create coins for each player
    coinsRef.current = []
    players.forEach((player, index) => {
      if (player) {
        const coin = createCoin(player.address, player.coin, index)
        scene.add(coin)
        coinsRef.current.push(coin)
      }
    })

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(2, 4, 2)
    scene.add(directionalLight)

    // Add click listener
    mountRef.current.addEventListener('click', handleCoinClick)

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      
      measureFPS()
      
      // Gentle rotation during active phases
      if (gamePhase === 'round_active') {
        coinsRef.current.forEach(coin => {
          if (coin && coin.userData) {
            coin.rotation.y += 0.01
          }
        })
      }
      
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
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
      mountRef.current?.removeEventListener('click', handleCoinClick)
      
      // Cleanup
      if (rendererRef.current) {
        mountRef.current?.removeChild(rendererRef.current.domElement)
        rendererRef.current.dispose()
      }
      
      if (sceneRef.current) {
        sceneRef.current.clear()
      }
    }
  }, [players, gamePhase, size, createCoin, handleCoinClick])

  return (
    <div 
      ref={mountRef} 
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%', 
        height: '100%',
        background: 'transparent',
        pointerEvents: gamePhase === 'round_active' ? 'auto' : 'none',
        zIndex: 10
      }} 
    />
  )
}

export default GridOverlay3DCoins
