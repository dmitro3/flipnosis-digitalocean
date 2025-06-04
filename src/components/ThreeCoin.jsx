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
  creatorPower = 0,
  joinerPower = 0,
  isCharging = false,
  chargingPlayer = null,
  style = {}
}) => {
  const mountRef = useRef(null)
  const coinRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const animationIdRef = useRef(null)
  const isAnimatingRef = useRef(false)
  
  const [currentSide, setCurrentSide] = useState('heads')

  // Initialize Three.js scene ONCE
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return

    console.log('🎬 Initializing Three.js scene')

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.set(0, 0, 4)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(300, 300)
    renderer.setClearColor(0x000000, 0)

    sceneRef.current = scene
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    // Create coin
    const coinGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.15, 32)
    const headsMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFFFFF,
      shininess: 100
    })
    const tailsMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFFFFF,
      shininess: 100
    })

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

    const headsFace = new THREE.Mesh(coinGeometry, headsMaterial)
    headsFace.rotation.x = Math.PI / 2
    headsFace.position.z = 0.075

    const tailsFace = new THREE.Mesh(coinGeometry, tailsMaterial)
    tailsFace.rotation.x = -Math.PI / 2
    tailsFace.position.z = -0.075
    tailsFace.rotation.y = Math.PI

    coin.add(headsFace)
    coin.add(tailsFace)
    coin.rotation.x = Math.PI / 2
    coin.rotation.y = 0

    scene.add(coin)
    coinRef.current = coin

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Animation loop
    const animate = () => {
      if (!coinRef.current || !rendererRef.current) return

      const coin = coinRef.current
      
      // Charging animation with tilt effect
      if ((isCharging || chargingPlayer) && !isAnimatingRef.current) {
        const time = Date.now() * 0.001
        
        // Gentle rotation
        coin.rotation.y += 0.01
        
        // Power-based tilt effect
        const totalPower = creatorPower + joinerPower
        const tiltAmount = Math.min(totalPower * 0.05, 0.3) // Max 0.3 radians tilt
        
        coin.rotation.z = Math.sin(time * 3) * tiltAmount
        coin.position.y = Math.sin(time * 4) * 0.1 // Gentle hover
        
        // Pulsing scale based on power
        const scaleMultiplier = 1 + (totalPower * 0.02)
        coin.scale.set(1.2 * scaleMultiplier, 1.2 * scaleMultiplier, 1.2 * scaleMultiplier)
      } else if (!isAnimatingRef.current) {
        // Reset to neutral position when not charging
        coin.rotation.z = 0
        coin.position.y = 0
        coin.scale.set(1.2, 1.2, 1.2)
      }

      rendererRef.current.render(scene, camera)
      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      sceneRef.current = null
      rendererRef.current = null
    }
  }, [])

  // Handle flip animation - CLEAN SINGLE TRIGGER
  useEffect(() => {
    if (!isFlipping || !flipResult || !flipDuration || !coinRef.current || isAnimatingRef.current) {
      return
    }

    console.log('🎬 Starting flip animation:', { flipResult, flipDuration })
    
    isAnimatingRef.current = true
    const coin = coinRef.current
    const isHeads = flipResult === 'heads'
    
    // Reset position and scale
    coin.position.y = 0
    coin.rotation.z = 0
    coin.scale.set(1.2, 1.2, 1.2)
    
    const startTime = Date.now()
    const initialRotationX = coin.rotation.x
    const flips = Math.max(4, Math.floor(flipDuration / 800)) // More flips for longer duration
    
    const animateFlip = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / flipDuration, 1)
      
      // Smooth easing with slow end
      const easeProgress = progress < 0.8 ? 
        progress / 0.8 : 
        0.8 + (1 - Math.pow(1 - (progress - 0.8) / 0.2, 3)) * 0.2
      
      // Multi-axis rotation for dramatic effect
      const totalRotationX = flips * Math.PI * 2
      coin.rotation.x = initialRotationX + totalRotationX * easeProgress
      coin.rotation.y = Math.sin(progress * Math.PI * flips * 0.7) * 0.8
      coin.rotation.z = Math.cos(progress * Math.PI * flips * 0.5) * 0.4
      
      // Height variation during flip
      coin.position.y = Math.sin(progress * Math.PI) * 0.5
      
      if (progress < 1) {
        requestAnimationFrame(animateFlip)
      } else {
        // Final position
        coin.rotation.x = isHeads ? Math.PI / 2 : -Math.PI / 2
        coin.rotation.y = 0
        coin.rotation.z = 0
        coin.position.y = 0
        setCurrentSide(isHeads ? 'heads' : 'tails')
        isAnimatingRef.current = false
        console.log('✅ Flip animation complete:', flipResult)
      }
    }
    
    animateFlip()
  }, [isFlipping, flipResult, flipDuration])

  // Update animation variables when power changes
  useEffect(() => {
    // This effect just ensures the animation loop has access to current power values
  }, [creatorPower, joinerPower, isCharging, chargingPlayer])

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    if (isPlayerTurn && onPowerCharge && !isAnimatingRef.current) {
      onPowerCharge()
    }
  }, [isPlayerTurn, onPowerCharge])

  const handleMouseUp = useCallback((e) => {
    e.preventDefault()
    if (isPlayerTurn && onPowerRelease && !isAnimatingRef.current) {
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
        cursor: isPlayerTurn && !isAnimatingRef.current ? 'pointer' : 'default',
        userSelect: 'none',
        background: (isCharging || chargingPlayer) ? 
          'radial-gradient(circle, rgba(255, 20, 147, 0.3) 0%, rgba(255, 20, 147, 0.1) 50%, transparent 100%)' : 
          'transparent',
        boxShadow: (isCharging || chargingPlayer) ? 
          '0 0 30px rgba(255, 20, 147, 0.6), 0 0 60px rgba(255, 20, 147, 0.4)' : 
          'none',
        ...style
      }}
    />
  )
}

export default ThreeCoin