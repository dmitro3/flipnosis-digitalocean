import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import headsTexture from '../../Images/Heads.webp'
import tailsTexture from '../../Images/tails.webp'

const ThreeCoin = ({ 
  isFlipping, 
  flipResult, 
  flipDuration = 3000,
  onPowerCharge, 
  onPowerRelease,
  isPlayerTurn,
  gamePhase,
  power = 5,
  isCharging = false,
  style = {}
}) => {
  const mountRef = useRef(null)
  const coinRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const animationIdRef = useRef(null)
  const isFlipAnimatingRef = useRef(false)
  
  const [currentSide, setCurrentSide] = useState('heads')

  // Initialize Three.js scene ONCE
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return

    console.log('🎬 Initializing Three.js scene')

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.set(0, 0, 4)

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(300, 300)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setClearColor(0x000000, 0)

    // Store refs
    sceneRef.current = scene
    rendererRef.current = renderer

    // Add renderer to DOM
    mountRef.current.appendChild(renderer.domElement)

    // Create coin geometry
    const coinGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.15, 32)

    // Create materials
    const headsMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFFFFF,
      shininess: 100,
      specular: 0x666666,
      emissive: 0x111111
    })

    const tailsMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFFFFF,
      shininess: 100,
      specular: 0x666666,
      emissive: 0x111111
    })

    // Create coin group
    const coin = new THREE.Group()
    coin.scale.set(1.2, 1.2, 1.2)

    // Load textures
    const textureLoader = new THREE.TextureLoader()
    textureLoader.load(headsTexture, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      headsMaterial.map = texture
      headsMaterial.needsUpdate = true
    })
    textureLoader.load(tailsTexture, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      tailsMaterial.map = texture
      tailsMaterial.needsUpdate = true
    })

    // Create coin faces
    const headsFace = new THREE.Mesh(coinGeometry, headsMaterial)
    headsFace.rotation.x = Math.PI / 2
    headsFace.position.z = 0.075

    const tailsFace = new THREE.Mesh(coinGeometry, tailsMaterial)
    tailsFace.rotation.x = -Math.PI / 2
    tailsFace.position.z = -0.075
    tailsFace.rotation.y = Math.PI

    // Add faces to coin group
    coin.add(headsFace)
    coin.add(tailsFace)

    // Set initial rotation to show heads
    coin.rotation.x = Math.PI / 2
    coin.rotation.y = 0

    // Add coin to scene
    scene.add(coin)
    coinRef.current = coin

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Animation loop
    const animate = () => {
      if (!coinRef.current || !rendererRef.current) return

      // Only gentle rotation when charging (not flipping)
      if (isCharging && !isFlipAnimatingRef.current) {
        coinRef.current.rotation.y += 0.01
      }

      rendererRef.current.render(scene, camera)
      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up Three.js scene')
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      sceneRef.current = null
      rendererRef.current = null
      coinRef.current = null
    }
  }, []) // Only run once

  // Handle flip animation - SINGLE useEffect
  useEffect(() => {
    if (!isFlipping || !flipResult || !flipDuration || !coinRef.current || isFlipAnimatingRef.current) {
      return
    }

    console.log('🎬 Starting flip animation:', { flipResult, flipDuration })
    
    isFlipAnimatingRef.current = true
    const coin = coinRef.current
    const isHeads = flipResult === 'heads'
    
    const startTime = Date.now()
    const initialRotationX = coin.rotation.x
    const flips = Math.max(3, Math.floor(flipDuration / 1000))
    
    const animateFlip = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / flipDuration, 1)
      
      // Smooth easing
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      
      // Calculate rotation
      const totalRotationX = flips * Math.PI * 2
      coin.rotation.x = initialRotationX + totalRotationX * easeProgress
      coin.rotation.y = Math.sin(progress * Math.PI * flips) * 0.5
      
      if (progress < 1) {
        requestAnimationFrame(animateFlip)
      } else {
        // Final position
        coin.rotation.x = isHeads ? Math.PI / 2 : -Math.PI / 2
        coin.rotation.y = 0
        setCurrentSide(isHeads ? 'heads' : 'tails')
        isFlipAnimatingRef.current = false
        console.log('✅ Flip animation complete:', flipResult)
      }
    }
    
    animateFlip()
  }, [isFlipping, flipResult, flipDuration]) // Clean dependencies

  // Handle mouse/touch events
  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    if (isPlayerTurn && onPowerCharge && !isFlipAnimatingRef.current) {
      onPowerCharge()
    }
  }, [isPlayerTurn, onPowerCharge])

  const handleMouseUp = useCallback((e) => {
    e.preventDefault()
    if (isPlayerTurn && onPowerRelease && !isFlipAnimatingRef.current) {
      onPowerRelease()
    }
  }, [isPlayerTurn, onPowerRelease])

  return (
    <div
      ref={mountRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      style={{
        width: '300px',
        height: '300px',
        cursor: isPlayerTurn && !isFlipAnimatingRef.current ? 'pointer' : 'default',
        userSelect: 'none',
        background: (isCharging || style?.opponentCharging) ? 
          'radial-gradient(circle, rgba(255, 20, 147, 0.3) 0%, rgba(255, 20, 147, 0.1) 50%, transparent 100%)' : 
          'transparent',
        boxShadow: (isCharging || style?.opponentCharging) ? 
          '0 0 30px rgba(255, 20, 147, 0.6), 0 0 60px rgba(255, 20, 147, 0.4)' : 
          'none',
        animation: (isCharging || style?.opponentCharging) ? 
          'powerPulse 0.5s ease-in-out infinite' : 
          'none',
        ...style
      }}
    />
  )
}

export default ThreeCoin