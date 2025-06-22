import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const OptimizedGoldCoin = ({
  isFlipping = false,
  flipResult = null,
  flipDuration = 2000,
  isPlayerTurn = false,
  onPowerCharge,
  onPowerRelease,
  chargingPlayer = null,
  isCharging = false,
  creatorPower = 0,
  joinerPower = 0,
  size = 300,
  creatorChoice = null,
  joinerChoice = null,
  isCreator = false,
  customHeadsImage = null,
  customTailsImage = null,
}) => {
  console.log('🪙 OptimizedGoldCoin rendering with size:', size, 'props:', { isFlipping, flipResult, isPlayerTurn })
  console.log('🪙 Component timestamp:', Date.now()) // Cache buster
  
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const coinRef = useRef(null)
  const textureCache = useRef({})
  const animationIdRef = useRef(null)
  const isAnimatingRef = useRef(false)
  const performanceRef = useRef({ level: 'high', fps: 60 })
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())

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

  // Get geometry segments based on performance
  const getGeometrySegments = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const perfLevel = performanceRef.current.level
    
    if (isMobile) {
      return perfLevel === 'low' ? 8 : 12
    }
    
    switch (perfLevel) {
      case 'low': return 12
      case 'medium': return 16
      case 'high': return 20
      default: return 16
    }
  }

  // Optimized texture creation
  const createOptimizedTexture = (type, customImage = null) => {
    const cacheKey = `${type}-${customImage || 'default'}`
    if (textureCache.current[cacheKey]) {
      return textureCache.current[cacheKey]
    }

    if (customImage) {
      // Load custom image
      const loader = new THREE.TextureLoader()
      const texture = loader.load(customImage)
      texture.colorSpace = THREE.SRGBColorSpace
      textureCache.current[cacheKey] = texture
      return texture
    }

    // Create simple procedural texture
    const size = performanceRef.current.level === 'low' ? 256 : 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    if (type === 'heads' || type === 'tails') {
      // White gradient background
      const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
      gradient.addColorStop(0, '#FFFFFF')
      gradient.addColorStop(0.7, '#F0F0F0')
      gradient.addColorStop(1, '#E0E0E0')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)

      // Simple text
      ctx.fillStyle = '#333333'
      ctx.font = `bold ${size * 0.3}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(type.toUpperCase(), size/2, size/2)

      // Player choice indicator (lightweight)
      if ((type === 'heads' && creatorChoice === 'heads') || 
          (type === 'tails' && creatorChoice === 'tails')) {
        ctx.strokeStyle = '#FF1493'
        ctx.lineWidth = size * 0.02
        ctx.beginPath()
        ctx.arc(size/2, size/2, size * 0.45, 0, Math.PI * 2)
        ctx.stroke()
      }
      if ((type === 'heads' && joinerChoice === 'heads') || 
          (type === 'tails' && joinerChoice === 'tails')) {
        ctx.strokeStyle = '#00CED1'
        ctx.lineWidth = size * 0.02
        ctx.beginPath()
        ctx.arc(size/2, size/2, size * 0.4, 0, Math.PI * 2)
        ctx.stroke()
      }
    } else if (type === 'edge') {
      // Clean white edge pattern - no ridges
      ctx.fillStyle = '#F5F5F5'
      ctx.fillRect(0, 0, size, size)
      
      // No ridges - just a clean edge
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    textureCache.current[cacheKey] = texture
    return texture
  }

  // Initialize scene
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return

    console.log('🪙 Creating new Three.js scene for OptimizedGoldCoin with size:', size)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
    camera.position.set(0, 0, 8)

    const renderer = new THREE.WebGLRenderer({ 
      antialias: performanceRef.current.level !== 'low',
      alpha: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(size, size)
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Style the canvas for proper centering
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.margin = '0 auto'
    renderer.domElement.style.position = 'relative'
    renderer.domElement.style.left = '50%'
    renderer.domElement.style.transform = 'translateX(-50%)'
    
    mountRef.current.appendChild(renderer.domElement)
    sceneRef.current = scene
    rendererRef.current = renderer

    // Brighter lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2) // Increased from 0.8 to 1.2
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0) // Increased from 0.6 to 1.0
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Create materials with white color and better reflectivity - CACHE BUSTER
    console.log('🎨 Creating materials at:', Date.now())
    const materials = [
      new THREE.MeshPhongMaterial({ 
        map: createOptimizedTexture('edge'),
        color: 0xFFFFFF, // WHITE COIN - NO DUPLICATES
        shininess: 80,
        specular: 0x444444
      }),
      new THREE.MeshPhongMaterial({ 
        map: createOptimizedTexture('heads', customHeadsImage),
        color: 0xFFFFFF, // WHITE COIN - NO DUPLICATES
        shininess: 80,
        specular: 0x444444
      }),
      new THREE.MeshPhongMaterial({ 
        map: createOptimizedTexture('tails', customTailsImage),
        color: 0xFFFFFF, // WHITE COIN - NO DUPLICATES
        shininess: 80,
        specular: 0x444444
      })
    ]

    // Create coin with dynamic segments
    const segments = getGeometrySegments()
    const geometry = new THREE.CylinderGeometry(3, 3, 0.4, segments)
    const coin = new THREE.Mesh(geometry, materials)
    
    scene.add(coin)
    coinRef.current = coin

    // Set initial rotation - tilt coin toward viewer so face is visible
    coin.rotation.x = -Math.PI / 4 // Tilt 45 degrees toward viewer
    coin.rotation.y = Math.PI / 2
    coin.rotation.z = 0

    // Optimized animation loop
    const animate = () => {
      if (!coinRef.current || !rendererRef.current) return

      measureFPS()
      const coin = coinRef.current
      const time = Date.now() * 0.001
      const perfLevel = performanceRef.current.level

      if (isAnimatingRef.current) {
        // Flip animation handled separately
      } else if (isCharging && !isAnimatingRef.current) {
        // Simplified charging effect based on performance
        const intensity = Math.min(1, (creatorPower + joinerPower) / 20)
        
        if (perfLevel !== 'low') {
          // Scale pulsing only for medium/high performance
          const pulseScale = 1 + Math.sin(time * 10) * 0.05 * intensity
          coin.scale.set(pulseScale, pulseScale, pulseScale)
          
          // Gentle vertical movement
          coin.position.y = Math.sin(time * 5) * 0.05 * intensity
        }
        
        // Simple rotation for all performance levels
        coin.rotation.x += 0.01 * (1 + intensity * 0.5)
      } else {
        // Idle animation
        if (perfLevel !== 'low') {
          coin.rotation.x += 0.003
          coin.position.y = Math.sin(time * 2) * 0.01
        }
        
        // Reset transforms
        coin.scale.set(1, 1, 1)
        coin.position.x = 0
        coin.position.z = 0
      }

      renderer.render(scene, camera)
      animationIdRef.current = requestAnimationFrame(animate)
    }

    // Start animation with optional frame limiting for low performance
    if (performanceRef.current.level === 'low') {
      let lastRender = 0
      const targetFPS = 30
      const frameDelay = 1000 / targetFPS

      const limitedAnimate = (timestamp) => {
        if (timestamp - lastRender >= frameDelay) {
          animate()
          lastRender = timestamp
        }
        animationIdRef.current = requestAnimationFrame(limitedAnimate)
      }
      
      limitedAnimate(0)
    } else {
      animate()
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      
      console.log('🪙 Cleaning up OptimizedGoldCoin Three.js scene')
      
      // Cleanup
      materials.forEach(mat => {
        if (mat.map) mat.map.dispose()
        mat.dispose()
      })
      geometry.dispose()
      renderer.dispose()
      
      // Clear texture cache
      Object.values(textureCache.current).forEach(texture => {
        texture.dispose()
      })
      textureCache.current = {}
      
      sceneRef.current = null
      rendererRef.current = null
    }
  }, [size, customHeadsImage, customTailsImage])

  // Update textures when custom images change
  useEffect(() => {
    if (!coinRef.current) return

    const coin = coinRef.current
    
    // Clear texture cache to force regeneration
    Object.values(textureCache.current).forEach(texture => {
      texture.dispose()
    })
    textureCache.current = {}
    
    // Update heads texture
    if (coin.material[1]) {
      if (coin.material[1].map) coin.material[1].map.dispose()
      coin.material[1].map = createOptimizedTexture('heads', customHeadsImage)
      coin.material[1].needsUpdate = true
    }
    
    // Update tails texture
    if (coin.material[2]) {
      if (coin.material[2].map) coin.material[2].map.dispose()
      coin.material[2].map = createOptimizedTexture('tails', customTailsImage)
      coin.material[2].needsUpdate = true
    }
    
    // Update edge texture
    if (coin.material[0]) {
      if (coin.material[0].map) coin.material[0].map.dispose()
      coin.material[0].map = createOptimizedTexture('edge')
      coin.material[0].needsUpdate = true
    }
  }, [customHeadsImage, customTailsImage, creatorChoice, joinerChoice])

  // Optimized flip animation
  useEffect(() => {
    if (!isFlipping || !flipResult || !coinRef.current) return

    isAnimatingRef.current = true
    const coin = coinRef.current
    const startTime = Date.now()
    const duration = flipDuration
    
    // Calculate rotations - SIMPLE: winning side faces viewer
    const baseTilt = -Math.PI / 4 // 45 degree tilt toward viewer
    const startRotation = coin.rotation.x
    
    // WINNING SIDE ALWAYS FACES YOU:
    // - If heads wins, heads faces you (baseTilt)
    // - If tails wins, tails faces you (flip + baseTilt)
    const targetFace = flipResult === 'heads' ? baseTilt : (Math.PI + baseTilt)
    const rotations = performanceRef.current.level === 'low' ? 3 : 5
    const totalRotation = Math.PI * 2 * rotations + (targetFace - (startRotation % (Math.PI * 2)))

    const animateFlip = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      if (progress < 1) {
        // Smooth easing
        const eased = 1 - Math.pow(1 - progress, 3)
        
        // Apply rotation
        coin.rotation.x = startRotation + (totalRotation * eased)
        
        // Simple arc motion
        coin.position.y = Math.sin(progress * Math.PI) * 0.5
        
        requestAnimationFrame(animateFlip)
      } else {
        // Perfect landing - maintain tilt for visibility
        coin.rotation.x = targetFace
        coin.rotation.y = Math.PI / 2 // Preserve side rotation
        coin.position.y = 0
        coin.rotation.z = 0
        coin.scale.set(1, 1, 1)
        
        isAnimatingRef.current = false
      }
    }
    
    animateFlip()
    
    return () => {
      isAnimatingRef.current = false
    }
  }, [isFlipping, flipResult, flipDuration])

  // Touch/mouse handlers
  const handleInteractionStart = (e) => {
    if (!isPlayerTurn || !onPowerCharge) return
    e.preventDefault()
    onPowerCharge(e)
  }

  const handleInteractionEnd = (e) => {
    if (!isPlayerTurn || !onPowerRelease) return
    e.preventDefault()
    onPowerRelease(e)
  }

  return (
    <div
      ref={mountRef}
      onMouseDown={isPlayerTurn ? handleInteractionStart : undefined}
      onMouseUp={isPlayerTurn ? handleInteractionEnd : undefined}
      onMouseLeave={isPlayerTurn ? handleInteractionEnd : undefined}
      onTouchStart={isPlayerTurn ? handleInteractionStart : undefined}
      onTouchEnd={isPlayerTurn ? handleInteractionEnd : undefined}
      style={{
        width: size,
        height: size,
        cursor: isPlayerTurn ? 'pointer' : 'default',
        userSelect: 'none',
        touchAction: 'none',
        position: 'relative',
        margin: '0 auto',
        display: 'block',
        left: '50%',
        transform: 'translateX(-50%)',
        background: isCharging ? 
          `radial-gradient(circle, rgba(255,20,147,0.1) 0%, transparent 70%)` : 
          'transparent',
        transition: 'background 0.3s ease',
        borderRadius: '50%'
      }}
    />
  )
}

export default OptimizedGoldCoin 