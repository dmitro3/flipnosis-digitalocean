import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import './FinalCoin.css'
import MobileOptimizedCoin from './MobileOptimizedCoin'

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
  seed = null, // For deterministic animations
  isMobile = false // Add mobile detection
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
      // Use custom image with enhanced brightness and contrast
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = customImage
      img.onload = () => {
        // Clear canvas first
        ctx.clearRect(0, 0, 512, 512)
        
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
        
        // No enhancement - use original image colors
        texture.needsUpdate = true
      }
      img.onerror = () => {
        console.warn('Failed to load custom image, using default')
        // Fall back to default texture - rich white coin faces
        if (type === 'heads') {
          // Rich white gradient background
          const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
          gradient.addColorStop(0, '#FFFFFF') // Bright center
          gradient.addColorStop(0.4, '#F8F8F8') // Light gray
          gradient.addColorStop(0.7, '#F0F0F0') // Medium gray
          gradient.addColorStop(1, '#E8E8E8') // Darker edge
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, 512, 512)
          
          // Crown symbol - positioned higher
          ctx.fillStyle = '#666666' // Dark gray for contrast
          ctx.font = 'bold 120px serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('♔', 256, 256 - 60) // Crown above center
          
          // "HEADS" text below crown
          ctx.fillStyle = '#333333'
          ctx.font = 'bold 80px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('HEADS', 256, 256 + 60) // Text below center
          
          // Decorative border - more prominent
          ctx.strokeStyle = '#CCCCCC'
          ctx.lineWidth = 8 // Thicker border
          ctx.beginPath()
          ctx.arc(256, 256, 220, 0, Math.PI * 2)
          ctx.stroke()
          
        } else if (type === 'tails') {
          // Rich white gradient background
          const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
          gradient.addColorStop(0, '#FFFFFF') // Bright center
          gradient.addColorStop(0.4, '#F8F8F8') // Light gray
          gradient.addColorStop(0.7, '#F0F0F0') // Medium gray
          gradient.addColorStop(1, '#E8E8E8') // Darker edge
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, 512, 512)
          
          // Diamond symbol - positioned higher
          ctx.fillStyle = '#666666' // Dark gray for contrast
          ctx.font = 'bold 120px serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('♦', 256, 256 - 60) // Diamond above center
          
          // "TAILS" text below diamond
          ctx.fillStyle = '#333333'
          ctx.font = 'bold 80px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('TAILS', 256, 256 + 60) // Text below center
          
          // Decorative border - more prominent
          ctx.strokeStyle = '#CCCCCC'
          ctx.lineWidth = 8 // Thicker border
          ctx.beginPath()
          ctx.arc(256, 256, 220, 0, Math.PI * 2)
          ctx.stroke()
        }
        texture.needsUpdate = true
      }
    } else {
      // Default designs - rich white coin faces
      if (type === 'heads') {
        // Rich white gradient background
        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
        gradient.addColorStop(0, '#FFFFFF') // Bright center
        gradient.addColorStop(0.4, '#F8F8F8') // Light gray
        gradient.addColorStop(0.7, '#F0F0F0') // Medium gray
        gradient.addColorStop(1, '#E8E8E8') // Darker edge
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 512, 512)
        
        // Crown symbol - positioned higher
        ctx.fillStyle = '#666666' // Dark gray for contrast
        ctx.font = 'bold 120px serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('♔', 256, 256 - 60) // Crown above center
        
        // "HEADS" text below crown
        ctx.fillStyle = '#333333'
        ctx.font = 'bold 80px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('HEADS', 256, 256 + 60) // Text below center
        
        // Decorative border - more prominent
        ctx.strokeStyle = '#CCCCCC'
        ctx.lineWidth = 8 // Thicker border
        ctx.beginPath()
        ctx.arc(256, 256, 220, 0, Math.PI * 2)
        ctx.stroke()
        
      } else if (type === 'tails') {
        // Rich white gradient background
        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
        gradient.addColorStop(0, '#FFFFFF') // Bright center
        gradient.addColorStop(0.4, '#F8F8F8') // Light gray
        gradient.addColorStop(0.7, '#F0F0F0') // Medium gray
        gradient.addColorStop(1, '#E8E8E8') // Darker edge
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 512, 512)
        
        // Diamond symbol - positioned higher
        ctx.fillStyle = '#666666' // Dark gray for contrast
        ctx.font = 'bold 120px serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('♦', 256, 256 - 60) // Diamond above center
        
        // "TAILS" text below diamond
        ctx.fillStyle = '#333333'
        ctx.font = 'bold 80px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('TAILS', 256, 256 + 60) // Text below center
        
        // Decorative border - more prominent
        ctx.strokeStyle = '#CCCCCC'
        ctx.lineWidth = 8 // Thicker border
        ctx.beginPath()
        ctx.arc(256, 256, 220, 0, Math.PI * 2)
        ctx.stroke()
             } else if (type === 'edge') {
         // White edge texture with subtle lines
         ctx.fillStyle = '#F8F8F8' // Slightly off-white
         ctx.fillRect(0, 0, 512, 512)
         
         // Add subtle vertical lines for coin edge texture
         ctx.strokeStyle = '#E0E0E0' // Very light gray lines
         ctx.lineWidth = 2
         for (let i = 0; i < 512; i += 12) {
           ctx.beginPath()
           ctx.moveTo(i, 0)
           ctx.lineTo(i, 512)
           ctx.stroke()
         }
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

    // Clean white lighting for vibrant coin appearance
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)
    
    // Add a second light for better highlights
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6)
    fillLight.position.set(-3, 3, 2)
    scene.add(fillLight)
    
    // Add a subtle rim light for definition
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3)
    rimLight.position.set(0, -2, 3)
    scene.add(rimLight)
    
    // Add a bright spotlight for extra richness
    const spotLight = new THREE.SpotLight(0xffffff, 0.5)
    spotLight.position.set(0, 5, 5)
    spotLight.angle = Math.PI / 6
    spotLight.penumbra = 0.1
    scene.add(spotLight)

    // Create coin geometry (cylinder)
    const geometry = new THREE.CylinderGeometry(
      3,      // radius top
      3,      // radius bottom  
      0.5,    // height (thickness)
      64      // segments for smooth edges
    )

    // Create materials array [edge, heads, tails] - vibrant coin with better reflectivity
    const materials = [
      new THREE.MeshStandardMaterial({ 
        map: createTexture('edge'),
        metalness: 0.3,
        roughness: 0.2,
        color: material?.edgeColor ? new THREE.Color(material.edgeColor) : 0xFFFFFF
      }),
      new THREE.MeshStandardMaterial({ 
        map: createTexture('heads', customHeadsImage),
        metalness: 0.2,
        roughness: 0.25,
        color: 0xFFFFFF
      }),
      new THREE.MeshStandardMaterial({ 
        map: createTexture('tails', customTailsImage),
        metalness: 0.2,
        roughness: 0.25,
        color: 0xFFFFFF
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
     
     // Set spotlight target after coin is created
     spotLight.target = coin

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
            // More dramatic charging animation
            const time = Date.now() * 0.001
            const chargeIntensity = Math.min(1, creatorPower / 10 || joinerPower / 10)
            
            // Pulsing and rotating during charge
            const scale = 1 + Math.sin(time * 8) * 0.1 * chargeIntensity
            coin.scale.set(scale, scale, scale)
            
            // Faster rotation during charge
            coin.rotation.x += 0.03 * chargeIntensity
            coin.rotation.z += 0.02 * chargeIntensity
            
            // Add glow effect (you'll need to add emissive to materials)
            if (coin.material[1]) {
              coin.material[1].emissive = new THREE.Color(0xFFD700)
              coin.material[1].emissiveIntensity = 0.3 * chargeIntensity
            }
          } else {
            // Idle state - keep coin completely still
            coin.scale.set(1, 1, 1)
            // No continuous rotation in idle state
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

  // Flip animation - SYNCHRONIZED SERVER-DRIVEN (like flip deets page)
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
    
    // Use clamped power (1-10) for consistent animation
    const totalPower = Math.max(1, Math.min(10, creatorPower + joinerPower))
    
    console.log('🎲 Using server seed for deterministic animation:', { seed, totalPower })
    
    // Calculate flip parameters - CLEAN X-AXIS ROTATION ONLY (like flip deets page)
    // Power determines number of rotations: 1 = 5 rotations, 10 = 25 rotations
    const minRotations = 5
    const maxRotations = 25
    const powerBasedRotations = minRotations + (totalPower / 10) * (maxRotations - minRotations)
    
    // Final rotation to show result - clean calculation
    // When X rotation is at 0°, we see heads (starting position)
    // When X rotation is at 180°, we see tails
    const basePosition = 0
    const fullRotations = Math.floor(powerBasedRotations)
    const finalRotation = (fullRotations * Math.PI * 2) + (flipResult === 'tails' ? Math.PI : 0)
    
    // Animation parameters
    const startTime = Date.now()
    const startRotationX = coin.rotation.x
    
    isAnimatingRef.current = true
    console.log('🎲 Starting CLEAN flip animation:', { 
      flipResult, 
      totalPower,
      rotations: powerBasedRotations.toFixed(1),
      finalAngle: (finalRotation * 180 / Math.PI).toFixed(0) + '°',
      duration: flipDuration
    })

    const animateFlip = () => {
      try {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / flipDuration, 1)
        
        // Smooth easing - fast start, smooth deceleration to stop
        const easeOutCubic = 1 - Math.pow(1 - progress, 3)
        
        // PURE X-AXIS ROTATION - NO wobble, NO height movement (like flip deets page)
        coin.rotation.x = startRotationX + (finalRotation * easeOutCubic)
        
        // Keep coin perfectly stable - no movement or wobble
        coin.position.y = 0
        coin.position.x = 0  
        coin.position.z = 0
        coin.rotation.y = Math.PI / 2 // Keep coin facing forward
        coin.rotation.z = 0 // NO wobble
        
        if (progress < 1) {
          requestAnimationFrame(animateFlip)
        } else {
          // PERFECT LANDING - ensure exact final rotation
          coin.rotation.x = finalRotation
          coin.rotation.y = Math.PI / 2
          coin.rotation.z = 0
          coin.position.set(0, 0, 0)
          coin.scale.set(1, 1, 1)
          
          isAnimatingRef.current = false
          console.log('✅ CLEAN flip animation complete - result:', flipResult)
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
    onPowerCharge() // This should start charging
  }

  const handleMouseUp = (e) => {
    if (!isPlayerTurn || !onPowerRelease) return
    e.preventDefault()
    onPowerRelease() // This should stop charging and trigger flip
  }

  const handleTouchStart = (e) => {
    if (!isPlayerTurn || !onPowerCharge) return
    e.preventDefault()
    onPowerCharge() // This should start charging
  }

  const handleTouchEnd = (e) => {
    if (!isPlayerTurn || !onPowerRelease) return
    e.preventDefault()
    onPowerRelease() // This should stop charging and trigger flip
  }

  // Use MobileOptimizedCoin for mobile devices
  if (isMobile) {
    return (
      <MobileOptimizedCoin
        isFlipping={isFlipping}
        flipResult={flipResult}
        customHeadsImage={customHeadsImage}
        customTailsImage={customTailsImage}
        size={size}
        onPowerCharge={onPowerCharge}
        onPowerRelease={onPowerRelease}
        isPlayerTurn={isPlayerTurn}
        isCharging={isCharging}
        creatorPower={creatorPower}
        joinerPower={joinerPower}
      />
    )
  }

  // Desktop uses Three.js
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
