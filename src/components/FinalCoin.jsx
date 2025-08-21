import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import './FinalCoin.css'

const FinalCoin = ({
  isFlipping = false,
  flipResult = null,
  flipDuration = 3000,
  onFlipComplete = () => {},
  onPowerCharge = () => {},
  onPowerRelease = () => {},
  isPlayerTurn = false,
  isCharging = false,
  creatorPower = 0,
  joinerPower = 0,
  customHeadsImage = null,
  customTailsImage = null,
  size = 200,
  material = null, // Material config with weight property
  seed = null // For deterministic animations
}) => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const coinRef = useRef(null)
  const animationRef = useRef(null)
  const isAnimatingRef = useRef(false)
  const textureCache = useRef({})

  // Material physics based on weight (1-5, where 5 is heaviest)
  const getMaterialPhysics = (materialConfig) => {
    const weight = materialConfig?.weight || 3
    
    // Heavier coins are harder to flip
    const physics = {
      1: { rotationSpeed: 1.2, height: 1.2, resistance: 0.8 },  // Lightest
      2: { rotationSpeed: 1.1, height: 1.1, resistance: 0.85 },
      3: { rotationSpeed: 1.0, height: 1.0, resistance: 0.9 },  // Default
      4: { rotationSpeed: 0.9, height: 0.9, resistance: 0.95 },
      5: { rotationSpeed: 0.8, height: 0.8, resistance: 1.0 }   // Heaviest
    }
    
    return physics[weight] || physics[3]
  }

  // Create optimized textures
  const createTexture = (type, customImage = null) => {
    const cacheKey = `${type}_${customImage || 'default'}`
    
    if (textureCache.current[cacheKey]) {
      return textureCache.current[cacheKey]
    }

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')

         if (customImage) {
       // Use custom image
       const img = new Image()
       img.crossOrigin = 'anonymous'
       img.src = customImage
       img.onload = () => {
         // Rotate the image based on type
         if (type === 'heads') {
           // Rotate heads 90 degrees to the left
           ctx.save()
           ctx.translate(256, 256)
           ctx.rotate(-Math.PI / 2) // 90 degrees left
           ctx.drawImage(img, -256, -256, 512, 512)
           ctx.restore()
         } else if (type === 'tails') {
           // Rotate tails 90 degrees to the right
           ctx.save()
           ctx.translate(256, 256)
           ctx.rotate(Math.PI / 2) // 90 degrees right
           ctx.drawImage(img, -256, -256, 512, 512)
           ctx.restore()
         } else {
           // Edge texture - no rotation
           ctx.drawImage(img, 0, 0, 512, 512)
         }
         texture.needsUpdate = true
       }
      img.onerror = () => {
        console.warn('Failed to load custom image, using default')
        // Fall back to default texture
        if (type === 'heads') {
          // Gold gradient background
          const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
          gradient.addColorStop(0, '#FFD700')
          gradient.addColorStop(0.5, '#FFA500')
          gradient.addColorStop(1, '#FF8C00')
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, 512, 512)
          
          // Add "HEADS" text
          ctx.fillStyle = '#8B4513'
          ctx.font = 'bold 72px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('HEADS', 256, 256)
        } else if (type === 'tails') {
          // Silver gradient background
          const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
          gradient.addColorStop(0, '#E5E5E5')
          gradient.addColorStop(0.5, '#C0C0C0')
          gradient.addColorStop(1, '#A9A9A9')
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, 512, 512)
          
          // Add "TAILS" text
          ctx.fillStyle = '#4B4B4B'
          ctx.font = 'bold 72px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('TAILS', 256, 256)
        }
        texture.needsUpdate = true
      }
    } else {
      // Default designs
      if (type === 'heads') {
        // Gold gradient background
        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
        gradient.addColorStop(0, '#FFD700')
        gradient.addColorStop(0.5, '#FFA500')
        gradient.addColorStop(1, '#FF8C00')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 512, 512)
        
        // Add "HEADS" text
        ctx.fillStyle = '#8B4513'
        ctx.font = 'bold 72px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('HEADS', 256, 256)
      } else if (type === 'tails') {
        // Silver gradient background
        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
        gradient.addColorStop(0, '#E5E5E5')
        gradient.addColorStop(0.5, '#C0C0C0')
        gradient.addColorStop(1, '#A9A9A9')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 512, 512)
        
        // Add "TAILS" text
        ctx.fillStyle = '#4B4B4B'
        ctx.font = 'bold 72px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('TAILS', 256, 256)
      } else if (type === 'edge') {
        // Edge texture
        const gradient = ctx.createLinearGradient(0, 0, 512, 0)
        gradient.addColorStop(0, '#8B7355')
        gradient.addColorStop(0.5, '#A0826D')
        gradient.addColorStop(1, '#8B7355')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 512, 512)
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    textureCache.current[cacheKey] = texture
    return texture
  }

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return
    
    // Prevent multiple initializations
    if (sceneRef.current) {
      console.warn('⚠️ Scene already initialized, skipping...')
      return
    }

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = null // Transparent background
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      1, // Square aspect ratio
      0.1,
      1000
    )
    camera.position.z = 10
    camera.position.y = 0
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(size, size)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = false // Disable shadows for performance
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

                   // Enhanced lighting for rich, vibrant appearance
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
      scene.add(ambientLight)
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
      directionalLight.position.set(5, 5, 5)
      scene.add(directionalLight)
      
      // Add a second light for better highlights
      const fillLight = new THREE.DirectionalLight(0xffffff, 1.0)
      fillLight.position.set(-3, 3, 2)
      scene.add(fillLight)
      
      // Add a warm rim light for extra vibrancy
      const rimLight = new THREE.DirectionalLight(0xffd700, 0.6)
      rimLight.position.set(0, -2, 3)
      scene.add(rimLight)
      
      // Add a bright spotlight for extra richness
      const spotLight = new THREE.SpotLight(0xffffff, 0.8)
      spotLight.position.set(0, 5, 5)
      spotLight.angle = Math.PI / 6
      spotLight.penumbra = 0.1
      spotLight.target = coin
      scene.add(spotLight)

    // Create coin geometry (cylinder)
    const geometry = new THREE.CylinderGeometry(
      3,      // radius top
      3,      // radius bottom  
      0.5,    // height (thickness)
      64      // segments for smooth edges
    )

                   // Create materials array [edge, heads, tails] - rich, vibrant finish
      const materials = [
        new THREE.MeshPhongMaterial({ 
          map: createTexture('edge'),
          color: material?.edgeColor ? new THREE.Color(material.edgeColor) : 0xFFD700,
          shininess: 500,
          specular: 0xffffff,
          reflectivity: 0.8,
          emissive: 0x222222
        }),
        new THREE.MeshPhongMaterial({ 
          map: createTexture('heads', customHeadsImage),
          shininess: 500,
          specular: 0xffffff,
          reflectivity: 0.8,
          emissive: 0x222222
        }),
        new THREE.MeshPhongMaterial({ 
          map: createTexture('tails', customTailsImage),
          shininess: 500,
          specular: 0xffffff,
          reflectivity: 0.8,
          emissive: 0x222222
        })
      ]

    // Create coin mesh
    const coin = new THREE.Mesh(geometry, materials)
    // Set initial rotation - coin faces forward (heads/tails visible)
    coin.rotation.x = Math.PI / 2 // Rotate 90 degrees on X axis to face camera
    coin.rotation.y = 0
    coin.rotation.z = 0
    scene.add(coin)
    coinRef.current = coin

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      
      // Dispose of resources
      geometry.dispose()
      materials.forEach(mat => {
        if (mat.map) mat.map.dispose()
        mat.dispose()
      })
      renderer.dispose()
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      
      // Clear texture cache
      Object.values(textureCache.current).forEach(texture => {
        texture.dispose()
      })
      textureCache.current = {}
      
      // Clear refs
      sceneRef.current = null
      rendererRef.current = null
      cameraRef.current = null
      coinRef.current = null
    }
  }, [size, material?.edgeColor])

  // Update textures when custom images change
  useEffect(() => {
    if (!coinRef.current) return
    
    const coin = coinRef.current
    
    // Update heads texture
    if (coin.material[1]) {
      if (coin.material[1].map) coin.material[1].map.dispose()
      coin.material[1].map = createTexture('heads', customHeadsImage)
      coin.material[1].needsUpdate = true
    }
    
    // Update tails texture
    if (coin.material[2]) {
      if (coin.material[2].map) coin.material[2].map.dispose()
      coin.material[2].map = createTexture('tails', customTailsImage)
      coin.material[2].needsUpdate = true
    }
  }, [customHeadsImage, customTailsImage])

  // Main animation loop
  useEffect(() => {
    if (!coinRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return

    const coin = coinRef.current
    const renderer = rendererRef.current
    const scene = sceneRef.current
    const camera = cameraRef.current

    const animate = () => {
      try {
        // Idle animation when not flipping
        if (!isAnimatingRef.current) {
                  if (isCharging) {
          // Charging animation
          const time = Date.now() * 0.001
          const intensity = Math.min(1, (creatorPower + joinerPower) / 20)
          
          // Gentle pulsing
          const scale = 1 + Math.sin(time * 5) * 0.05 * intensity
          coin.scale.set(scale, scale, scale)
          
                     // Slow rotation during charge - rotate forward (like falling towards us)
           coin.rotation.x += 0.02 * intensity
                 } else {
           // Gentle idle rotation - rotate forward (like falling towards us)
           coin.rotation.x += 0.005
           coin.scale.set(1, 1, 1)
         }
        }

        renderer.render(scene, camera)
        animationRef.current = requestAnimationFrame(animate)
      } catch (error) {
        console.error('❌ Three.js animation error:', error)
        // Stop animation on error
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
          animationRef.current = null
        }
      }
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isCharging, creatorPower, joinerPower])

  // Flip animation
  useEffect(() => {
    if (!isFlipping || !coinRef.current) {
      console.log('🔄 Flip animation blocked:', { isFlipping, hasCoin: !!coinRef.current })
      return
    }
    
    // Prevent multiple animations
    if (isAnimatingRef.current) {
      console.log('🔄 Animation already in progress, skipping...')
      return
    }

    const coin = coinRef.current
    const physics = getMaterialPhysics(material)
    
    // Calculate total power
    const totalPower = Math.max(1, Math.min(10, creatorPower + joinerPower))
    
    // Deterministic random based on seed if provided
    const getRandom = () => {
      if (seed !== null) {
        // Simple deterministic random based on seed
        const x = Math.sin(seed) * 10000
        return x - Math.floor(x)
      }
      return Math.random()
    }

         // Calculate flip parameters - simplified for test flip
     const totalRotations = 3 // Fixed number of rotations for consistent animation
     
     // Final rotation to show result
     // When X rotation is at PI/2 (90°), we see heads
     // When X rotation is at 3PI/2 (270°), we see tails
     const basePosition = Math.PI / 2 // Starting position (heads visible)
     const finalRotation = flipResult === 'heads' ? basePosition : basePosition + Math.PI
     const totalRotation = (totalRotations * Math.PI * 2) + (finalRotation - basePosition)
    
    // Animation parameters
    const startTime = Date.now()
    const startRotationX = coin.rotation.x
    const maxHeight = 2 * physics.height * (totalPower / 10) // Subtle height based on power and weight
    
         isAnimatingRef.current = true
     console.log('🎲 Starting flip animation:', { flipResult, totalRotations, finalRotation })

     const animateFlip = () => {
      try {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / flipDuration, 1)
        
        // Easing function for smooth animation
        const easeInOutCubic = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2
        
                       // Rotation animation (applying material physics) - no height movement
         coin.rotation.x = startRotationX + (totalRotation * easeInOutCubic * physics.rotationSpeed)
         
         // Keep coin at ground level (no height animation)
         coin.position.y = 0
         
         // Apply resistance (slowing down near the end)
         const resistanceEffect = 1 - (progress * (1 - physics.resistance))
        
        if (progress < 1) {
          requestAnimationFrame(animateFlip)
        } else {
          // Ensure final rotation is exact
          coin.rotation.x = finalRotation
          coin.position.y = 0
          isAnimatingRef.current = false
          onFlipComplete(flipResult)
        }
      } catch (error) {
        console.error('❌ Three.js flip animation error:', error)
        // Stop animation on error
        isAnimatingRef.current = false
        onFlipComplete(flipResult)
      }
    }

    animateFlip()

         // Don't cleanup on unmount to prevent stuttering
     // The animation will complete naturally
  }, [isFlipping, flipResult, flipDuration, creatorPower, joinerPower, material, seed])

  // Mouse interaction handlers
  const handleMouseDown = (e) => {
    if (!isPlayerTurn || !onPowerCharge) return
    e.preventDefault()
    onPowerCharge()
  }

  const handleMouseUp = (e) => {
    if (!isPlayerTurn || !onPowerRelease) return
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const power = Math.min(10, Math.max(1, Math.floor((y / rect.height) * 10)))
    onPowerRelease(power)
  }

  const handleTouchStart = (e) => {
    if (!isPlayerTurn || !onPowerCharge) return
    e.preventDefault()
    onPowerCharge()
  }

  const handleTouchEnd = (e) => {
    if (!isPlayerTurn || !onPowerRelease) return
    e.preventDefault()
    onPowerRelease(5) // Default power for touch
  }

  return (
    <div 
      ref={mountRef}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        cursor: isPlayerTurn ? 'pointer' : 'default',
        position: 'relative'
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {isCharging && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          border: '3px solid #00BFFF',
          borderRadius: '50%',
          animation: 'pulse 1s infinite',
          pointerEvents: 'none'
        }} />
      )}
    </div>
  )
}

export default FinalCoin
