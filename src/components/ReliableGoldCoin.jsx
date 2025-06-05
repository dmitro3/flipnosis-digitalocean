import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

const ReliableGoldCoin = ({ 
  isFlipping, 
  flipResult, 
  flipDuration = 3000,
  onPowerCharge, 
  onPowerRelease,
  isPlayerTurn,
  isCharging = false,
  chargingPlayer,
  gamePhase,
  // Optional image props - if not provided, uses procedural gold textures
  headsImage = null,
  tailsImage = null,
  edgeImage = null
}) => {
  const mountRef = useRef(null)
  const coinRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const animationIdRef = useRef(null)
  const isAnimatingRef = useRef(false)
  const targetAngleRef = useRef(Math.PI / 2) // Default to heads
  const powerSystemRef = useRef({
    power: 0,
    maxPower: 10,
    chargeRate: 0.15,
    isCharging: false,
    chargeInterval: null
  })

  // Create procedural gold textures
  const createGoldTexture = (type, size = 512) => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    if (type === 'heads') {
      // Gold gradient background - BRIGHTER
      const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
      gradient.addColorStop(0, '#FFEF94') // Much brighter center
      gradient.addColorStop(0.5, '#FFD700') // Bright gold
      gradient.addColorStop(0.8, '#DAA520') // Medium gold
      gradient.addColorStop(1, '#B8860B') // Darker edge
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
      
      // Crown symbol - positioned higher
      ctx.fillStyle = '#8B4513' // Darker brown for contrast
      ctx.font = `bold ${size * 0.2}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('♔', size/2, size/2 - size * 0.08) // Moved up
      
      // "HEADS" text below crown
      ctx.fillStyle = '#654321' // Dark brown
      ctx.font = `bold ${size * 0.08}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('HEADS', size/2, size/2 + size * 0.12) // Below crown
      
      // Decorative border - more prominent
      ctx.strokeStyle = '#8B7D6B'
      ctx.lineWidth = size * 0.025 // Thicker border
      ctx.beginPath()
      ctx.arc(size/2, size/2, size * 0.42, 0, Math.PI * 2)
      ctx.stroke()
      
    } else if (type === 'tails') {
      // Gold gradient background - BRIGHTER  
      const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
      gradient.addColorStop(0, '#FFEF94') // Much brighter center
      gradient.addColorStop(0.5, '#FFD700') // Bright gold
      gradient.addColorStop(0.8, '#DAA520') // Medium gold
      gradient.addColorStop(1, '#B8860B') // Darker edge
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
      
      // Diamond symbol - positioned higher
      ctx.fillStyle = '#8B4513' // Darker brown for contrast
      ctx.font = `bold ${size * 0.2}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('♦', size/2, size/2 - size * 0.08) // Moved up
      
      // "TAILS" text below diamond
      ctx.fillStyle = '#654321' // Dark brown
      ctx.font = `bold ${size * 0.08}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('TAILS', size/2, size/2 + size * 0.12) // Below diamond
      
      // Decorative border - more prominent
      ctx.strokeStyle = '#8B7D6B'
      ctx.lineWidth = size * 0.025 // Thicker border
      ctx.beginPath()
      ctx.arc(size/2, size/2, size * 0.42, 0, Math.PI * 2)
      ctx.stroke()
      
    } else if (type === 'edge') {
      // Brighter edge pattern
      ctx.fillStyle = '#FFEF94' // Much brighter base
      ctx.fillRect(0, 0, size, size)
      
      // Vertical lines pattern (reeding) - more contrast
      ctx.strokeStyle = '#B8860B' // Darker lines for contrast
      ctx.lineWidth = 3 // Slightly thicker
      for (let i = 0; i < size; i += 8) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, size)
        ctx.stroke()
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }

  // Initialize Three.js scene ONCE
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, 1, 1, 10)
    camera.position.set(0, 0, 7)

    const renderer = new THREE.WebGLRenderer({ 
      canvas: mountRef.current.querySelector('canvas') || document.createElement('canvas'),
      antialias: true, 
      alpha: true
    })
    renderer.setSize(400, 400)
    renderer.setClearColor(0x000000, 0)

    if (!mountRef.current.querySelector('canvas')) {
      mountRef.current.appendChild(renderer.domElement)
    }

    sceneRef.current = scene
    rendererRef.current = renderer

    // LIGHTING SETUP - MUCH BRIGHTER with optimal positioning for metallic surfaces
    scene.add(new THREE.AmbientLight(0xffffff, 2.0)) // Increased from 1.2 to 2.0

    // Primary front light - directly illuminates the coin face toward camera
    const primaryLight = new THREE.DirectionalLight(0xFFFFFF, 3.0) // Much brighter
    primaryLight.position.set(0, 0, 10) // Directly in front
    scene.add(primaryLight)

    // Key light from top-front-right - main illumination
    const keyLight = new THREE.DirectionalLight(0xFFE4B5, 2.5)
    keyLight.position.set(3, 3, 8) // Closer to camera
    scene.add(keyLight)

    // Fill light from top-front-left - fills shadows
    const fillLight = new THREE.DirectionalLight(0xFFE4B5, 2.0)
    fillLight.position.set(-3, 3, 8) // Closer to camera
    scene.add(fillLight)

    // Bottom light to eliminate dark areas
    const bottomLight = new THREE.DirectionalLight(0xFFFFFF, 1.5)
    bottomLight.position.set(0, -4, 6)
    scene.add(bottomLight)

    // Rim lights for metallic edge reflection
    const rimLight1 = new THREE.PointLight(0xFFD700, 2.0) // Gold colored
    rimLight1.position.set(4, 0, 4)
    scene.add(rimLight1)

    const rimLight2 = new THREE.PointLight(0xFFD700, 2.0) // Gold colored
    rimLight2.position.set(-4, 0, 4)
    scene.add(rimLight2)

    // Back light for glow effect
    const backLight = new THREE.PointLight(0xFFE4B5, 1.0)
    backLight.position.set(0, 0, -2)
    scene.add(backLight)

    // MATERIALS SETUP - MUCH BRIGHTER GOLD with less metalness
    const metalness = 0.6 // Reduced from 0.9 - less mirror-like
    const roughness = 0.1 // Slightly increased from 0.05 - less perfect reflection

    // Create or load textures
    const textureHeads = headsImage ? 
      new THREE.TextureLoader().load(headsImage) : 
      createGoldTexture('heads')
    
    const textureTails = tailsImage ? 
      new THREE.TextureLoader().load(tailsImage) : 
      createGoldTexture('tails')
    
    const textureEdge = edgeImage ? 
      new THREE.TextureLoader().load(edgeImage) : 
      createGoldTexture('edge')

    // Set up edge texture to repeat horizontally
    textureEdge.wrapS = THREE.RepeatWrapping
    textureEdge.repeat.set(20, 1)

    const materials = [
      // Circumference (edge) - MUCH BRIGHTER
      new THREE.MeshStandardMaterial({
        map: textureEdge,
        metalness: metalness,
        roughness: roughness,
        color: 0xFFFFCC, // Much brighter base color
        emissive: 0x443300, // Warm glow
        emissiveIntensity: 0.3 // Increased from 0.1
      }),
      // Heads side (top) - MUCH BRIGHTER
      new THREE.MeshStandardMaterial({
        map: textureHeads,
        metalness: metalness,
        roughness: roughness,
        color: 0xFFFFCC, // Much brighter gold
        emissive: 0x554400, // Stronger warm glow
        emissiveIntensity: 0.4 // Increased from 0.15
      }),
      // Tails side (bottom) - MUCH BRIGHTER
      new THREE.MeshStandardMaterial({
        map: textureTails,
        metalness: metalness,
        roughness: roughness,
        color: 0xFFFFCC, // Much brighter gold
        emissive: 0x554400, // Stronger warm glow
        emissiveIntensity: 0.4 // Increased from 0.15
      })
    ]

    // COIN GEOMETRY - Based on working example
    const geometry = new THREE.CylinderGeometry(3, 3, 0.4, 100)
    const coin = new THREE.Mesh(geometry, materials)
    
    scene.add(coin)
    coinRef.current = coin

    // IMPORTANT: Set initial rotation like the working example
    coin.rotation.x = Math.PI / 2  // This makes it face the camera correctly
    coin.rotation.y = Math.PI / 2  // Initial orientation

    // Animation loop
    const animate = () => {
      if (!coinRef.current || !rendererRef.current) return

      const coin = coinRef.current
      const time = Date.now() * 0.001
      const powerSystem = powerSystemRef.current
      
      // Handle different states
      if (isAnimatingRef.current) {
        // Flip animation is handled separately
      } else if (isCharging && !isAnimatingRef.current) {
        // Power charging effects
        const intensity = powerSystem.power / powerSystem.maxPower
        
        // Gentle hover and slow rotation when charging
        coin.position.y = Math.sin(time * 4) * 0.1 * intensity
        coin.rotation.x += 0.01 * (1 + intensity) // Slow continuous rotation
        
      } else if (!isAnimatingRef.current) {
        // Idle state
        const isWaitingInRound = gamePhase === 'round_active' && !isPlayerTurn
        const isWaitingToStart = gamePhase === 'waiting' || gamePhase === 'ready'
        
        if (isWaitingInRound || isWaitingToStart) {
          // Very gentle continuous rotation when waiting
          coin.rotation.x += 0.005
          coin.position.y = Math.sin(time * 1.5) * 0.05
        } else {
          // Minimal rotation when not active
          coin.rotation.x += 0.002
          coin.position.y = 0
        }
      }

      rendererRef.current.render(scene, camera)
      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      
      // Cleanup
      materials.forEach(material => {
        if (material.map) material.map.dispose()
        material.dispose()
      })
      geometry.dispose()
      renderer.dispose()
      
      sceneRef.current = null
      rendererRef.current = null
    }
  }, [headsImage, tailsImage, edgeImage])

  // POWER SYSTEM MANAGEMENT
  useEffect(() => {
    const powerSystem = powerSystemRef.current
    
    if (isCharging && !powerSystem.isCharging) {
      // Start charging
      powerSystem.isCharging = true
      powerSystem.chargeInterval = setInterval(() => {
        powerSystem.power = Math.min(powerSystem.maxPower, powerSystem.power + powerSystem.chargeRate)
      }, 100)
    } else if (!isCharging && powerSystem.isCharging) {
      // Stop charging
      clearInterval(powerSystem.chargeInterval)
      powerSystem.isCharging = false
      powerSystem.power = 0 // Reset for next charge
    }
    
    return () => {
      if (powerSystem.chargeInterval) {
        clearInterval(powerSystem.chargeInterval)
        powerSystem.isCharging = false
      }
    }
  }, [isCharging])

  // FLIP ANIMATION - Based on working example logic
  useEffect(() => {
    if (!isFlipping || !flipResult || !flipDuration || !coinRef.current || isAnimatingRef.current) {
      return
    }

    console.log('🎬 Starting reliable coin flip:', { flipResult, flipDuration })
    
    isAnimatingRef.current = true
    const coin = coinRef.current
    const powerSystem = powerSystemRef.current
    
    // Calculate flip parameters based on power
    const flipPower = Math.max(1, Math.min(10, powerSystem.power || 5))
    const rotationSpeed = 0.05 + (flipPower * 0.02) // Speed based on power
    
    // Set target angle based on result (like the working example)
    targetAngleRef.current = (flipResult === 'tails') ? (3 * Math.PI / 2) : (Math.PI / 2)
    
    console.log('🎲 Flip parameters:', { 
      flipPower, 
      rotationSpeed, 
      targetAngle: targetAngleRef.current,
      flipResult 
    })
    
    let flipStartTime = Date.now()
    
    const animateFlip = () => {
      const elapsed = Date.now() - flipStartTime
      const progress = Math.min(elapsed / flipDuration, 1)
      
      if (progress < 1) {
        // Continue flipping with power-based speed
        const currentSpeed = rotationSpeed * (1 - progress * 0.3) // Slow down over time
        coin.rotation.x += currentSpeed
        
        // Add some vertical motion during flip
        coin.position.y = Math.sin(progress * Math.PI) * 0.5
        
        requestAnimationFrame(animateFlip)
      } else {
        // Start the precision landing phase
        landOnTarget()
      }
    }
    
    const landOnTarget = () => {
      const currentRotation = coin.rotation.x
      const targetAngle = targetAngleRef.current
      
      // Calculate shortest path to target
      let deltaAngle = (currentRotation % (Math.PI * 2)) - targetAngle
      
      // Normalize delta angle to [-pi, pi]
      while (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2
      while (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2
      
      // If close enough, snap to target
      if (Math.abs(deltaAngle) < 0.06) {
        coin.rotation.x = targetAngle
        coin.position.y = 0
        isAnimatingRef.current = false
        console.log('✅ Reliable coin flip complete:', flipResult)
        return
      }
      
      // Move towards target
      coin.rotation.x -= deltaAngle * 0.1 // Smooth approach
      requestAnimationFrame(landOnTarget)
    }
    
    animateFlip()
  }, [isFlipping, flipResult, flipDuration])

  return (
    <div
      ref={mountRef}
      onMouseDown={isPlayerTurn ? onPowerCharge : undefined}
      onMouseUp={isPlayerTurn ? onPowerRelease : undefined}
      onMouseLeave={isPlayerTurn ? onPowerRelease : undefined}
      onTouchStart={isPlayerTurn ? onPowerCharge : undefined}
      onTouchEnd={isPlayerTurn ? onPowerRelease : undefined}
      style={{
        width: '400px',
        height: '400px',
        cursor: isPlayerTurn ? 'pointer' : 'default',
        userSelect: 'none',
        background: isCharging ? 
          'radial-gradient(circle, rgba(255, 215, 0, 0.25) 0%, rgba(255, 215, 0, 0.1) 50%, rgba(255, 215, 0, 0.05) 100%)' : 
          'radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.03) 50%, transparent 100%)',
        boxShadow: isCharging ? 
          '0 0 30px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 215, 0, 0.2)' : 
          '0 0 15px rgba(255, 215, 0, 0.2)',
        borderRadius: '50%',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <canvas style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

export default ReliableGoldCoin 