import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

// Single 3D coin for embedding in player slots
const SinglePlayer3DCoin = ({
  playerAddress,
  coinData,
  playerIndex,
  gamePhase = 'filling',
  isFlippable = false,
  onFlip = () => {},
  playerCoinImages = {},
  coinSides = {},
  size = 200
}) => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const coinRef = useRef(null)
  const animationIdRef = useRef(null)
  const isFlippingRef = useRef(false)

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
  const createCoin = () => {
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
    
    // Position coin in center
    coin.position.set(0, 0, 0)
    
    // Set initial rotation based on user's chosen side
    coin.rotation.x = 0
    coin.rotation.y = chosenSide === 'tails' ? Math.PI : Math.PI / 2 // Show chosen side
    coin.rotation.z = 0
    
    // Store player data
    coin.userData = { playerAddress, playerIndex, chosenSide }
    
    return coin
  }

  // Flip animation
  const flipCoin = () => {
    if (isFlippingRef.current) return
    isFlippingRef.current = true
    
    const coin = coinRef.current
    if (!coin) return
    
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
        animationIdRef.current = requestAnimationFrame(animateFlip)
      } else {
        isFlippingRef.current = false
        // Call the flip callback
        const result = coin.rotation.y % (Math.PI * 2) < Math.PI ? 'heads' : 'tails'
        onFlip(playerAddress, result)
      }
    }
    
    animateFlip()
  }

  // Handle click
  const handleClick = () => {
    if (isFlippable && gamePhase === 'round_active') {
      flipCoin()
    }
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
    camera.position.set(0, 2, 3)
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

    // Create coin
    const coin = createCoin()
    scene.add(coin)
    coinRef.current = coin

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(2, 4, 2)
    scene.add(directionalLight)

    // Add click listener
    mountRef.current.addEventListener('click', handleClick)

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      
      // Gentle rotation during active phases
      if (gamePhase === 'round_active' && !isFlippingRef.current) {
        coin.rotation.y += 0.01
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
      mountRef.current?.removeEventListener('click', handleClick)
      
      // Cleanup
      if (rendererRef.current) {
        mountRef.current?.removeChild(rendererRef.current.domElement)
        rendererRef.current.dispose()
      }
      
      if (sceneRef.current) {
        sceneRef.current.clear()
      }
    }
  }, [playerAddress, coinData, playerIndex, gamePhase, playerCoinImages, coinSides, size, handleClick])

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        background: 'transparent',
        cursor: isFlippable && gamePhase === 'round_active' ? 'pointer' : 'default'
      }}
      onClick={handleClick}
    />
  )
}

export default SinglePlayer3DCoin
