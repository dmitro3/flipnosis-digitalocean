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
  // Add these new props for charging effects
  creatorPower = 0,
  joinerPower = 0,
  // NEW: Add props for player choices and player identification
  creatorChoice = null,
  joinerChoice = null,
  isCreator = false,
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

  // NEW: Function to determine text colors based on player choices
  const getTextColors = () => {
    // Default colors (no choice made)
    let headsColor = '#654321' // Dark brown
    let tailsColor = '#654321' // Dark brown
    
    // If any player has made a choice, update colors
    if (creatorChoice || joinerChoice) {
      if (isCreator) {
        // For the creator's view
        if (creatorChoice === 'heads') {
          headsColor = '#00FF00' // Green for their choice
          tailsColor = '#FF0000' // Red for opponent's side
        } else if (creatorChoice === 'tails') {
          headsColor = '#FF0000' // Red for opponent's side
          tailsColor = '#00FF00' // Green for their choice
        }
      } else {
        // For the joiner's view (reversed perspective)
        if (joinerChoice === 'heads') {
          headsColor = '#00FF00' // Green for their choice
          tailsColor = '#FF0000' // Red for opponent's side
        } else if (joinerChoice === 'tails') {
          headsColor = '#FF0000' // Red for opponent's side
          tailsColor = '#00FF00' // Green for their choice
        }
        
        // If joiner hasn't chosen but creator has, show creator's choice
        if (!joinerChoice && creatorChoice) {
          if (creatorChoice === 'heads') {
            headsColor = '#FF0000' // Red for opponent's choice
            tailsColor = '#00FF00' // Green for joiner's designated side
          } else if (creatorChoice === 'tails') {
            headsColor = '#00FF00' // Green for joiner's designated side
            tailsColor = '#FF0000' // Red for opponent's choice
          }
        }
      }
    }
    
    return { headsColor, tailsColor }
  }

  // Create procedural gold textures with dynamic colors
  const createGoldTexture = (type, size = 512) => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    // Get current text colors
    const { headsColor, tailsColor } = getTextColors()

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
      
      // "HEADS" text below crown - NOW WITH DYNAMIC COLOR
      ctx.fillStyle = headsColor // Use dynamic color
      ctx.font = `bold ${size * 0.08}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('HEADS', size/2, size/2 + size * 0.12) // Below crown
      
      // Add glow effect for green text
      if (headsColor === '#00FF00') {
        ctx.shadowColor = '#00FF00'
        ctx.shadowBlur = 10
        ctx.fillText('HEADS', size/2, size/2 + size * 0.12)
        ctx.shadowBlur = 0 // Reset shadow
      }
      
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
      
      // "TAILS" text below diamond - NOW WITH DYNAMIC COLOR
      ctx.fillStyle = tailsColor // Use dynamic color
      ctx.font = `bold ${size * 0.08}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('TAILS', size/2, size/2 + size * 0.12) // Below diamond
      
      // Add glow effect for green text
      if (tailsColor === '#00FF00') {
        ctx.shadowColor = '#00FF00'
        ctx.shadowBlur = 10
        ctx.fillText('TAILS', size/2, size/2 + size * 0.12)
        ctx.shadowBlur = 0 // Reset shadow
      }
      
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

    // LIGHTING SETUP - WORKING BRIGHT CONFIGURATION
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5) // Very bright ambient
    scene.add(ambientLight)

    // Primary directional light - front facing
    const mainLight = new THREE.DirectionalLight(0xFFFFFF, 4.0) // Very bright
    mainLight.position.set(0, 0, 10) // Directly in front
    scene.add(mainLight)

    // Top light
    const topLight = new THREE.DirectionalLight(0xFFE4B5, 3.0)
    topLight.position.set(0, 5, 5)
    scene.add(topLight)

    // Left side light
    const leftLight = new THREE.DirectionalLight(0xFFE4B5, 2.5)
    leftLight.position.set(-5, 2, 5)
    scene.add(leftLight)

    // Right side light
    const rightLight = new THREE.DirectionalLight(0xFFE4B5, 2.5)
    rightLight.position.set(5, 2, 5)
    scene.add(rightLight)

    // Bottom fill light
    const bottomLight = new THREE.DirectionalLight(0xFFFFFF, 2.0)
    bottomLight.position.set(0, -3, 5)
    scene.add(bottomLight)

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
      } else if (chargingPlayer && !isAnimatingRef.current) {
        // FEROCIOUS CHARGING EFFECTS - visible to all players
        const intensity = (creatorPower + joinerPower) / 20 // Use total power for intensity
        const chargeIntensity = Math.min(1, intensity * 2) // More dramatic scaling
        
        // FRENZIED ROTATION AND MOVEMENT
        coin.position.y = Math.sin(time * 12) * 0.25 * (1 + chargeIntensity)
        coin.rotation.x += 0.05 * (1 + chargeIntensity * 3) // Much faster rotation
        coin.rotation.z += Math.sin(time * 8) * 0.02 * chargeIntensity // Z-axis wobble
        
        // VIOLENT PULSING SCALE
        const pulseScale = 1 + Math.sin(time * 15) * 0.15 * chargeIntensity
        coin.scale.set(pulseScale, pulseScale, pulseScale)
        
        // INTENSE MATERIAL EFFECTS - PINK ELECTRIC ENERGY
        materials.forEach((material, index) => {
          // Crazy emissive pulsing
          const emissivePulse = Math.sin(time * 20) * 0.5 + 0.5
          material.emissiveIntensity = 0.6 + emissivePulse * chargeIntensity
          
          // Electric pink energy effect
          const pinkIntensity = Math.sin(time * 25) * chargeIntensity
          const redComponent = Math.floor(255 * (0.2 + pinkIntensity * 0.8))
          const greenComponent = Math.floor(20 * (1 + pinkIntensity))
          const blueComponent = Math.floor(147 * (0.3 + pinkIntensity * 0.7))
          
          material.emissive.setRGB(
            redComponent / 255,
            greenComponent / 255, 
            blueComponent / 255
          )
          
          // Make the coin surface more reflective during charging
          material.metalness = 0.6 + chargeIntensity * 0.4
          material.roughness = Math.max(0.05, 0.1 - chargeIntensity * 0.05)
        })
        
        // Add random jitter for frenzied effect
        coin.position.x = Math.sin(time * 30) * 0.03 * chargeIntensity
        coin.position.z = Math.cos(time * 35) * 0.03 * chargeIntensity
        
      } else if (!isAnimatingRef.current) {
        // Reset effects when not charging
        materials.forEach(material => {
          material.emissiveIntensity = 0.4
          material.emissive.setHex(0x554400) // Back to gold
          material.metalness = 0.6
          material.roughness = 0.1
        })
        coin.scale.set(1, 1, 1)
        coin.position.x = 0
        coin.position.z = 0
        
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

  // NEW: Update textures when player choices change
  useEffect(() => {
    if (!coinRef.current || !sceneRef.current) return
    
    console.log('🎨 Updating coin textures due to choice change:', {
      creatorChoice,
      joinerChoice,
      isCreator
    })
    
    // Recreate textures with new colors
    const newHeadsTexture = createGoldTexture('heads')
    const newTailsTexture = createGoldTexture('tails')
    
    // Update materials
    const coin = coinRef.current
    if (coin.material && coin.material[1]) { // Heads material
      if (coin.material[1].map) coin.material[1].map.dispose()
      coin.material[1].map = newHeadsTexture
      coin.material[1].needsUpdate = true
    }
    if (coin.material && coin.material[2]) { // Tails material
      if (coin.material[2].map) coin.material[2].map.dispose()
      coin.material[2].map = newTailsTexture
      coin.material[2].needsUpdate = true
    }
  }, [creatorChoice, joinerChoice, isCreator])

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
        background: chargingPlayer ? 
          'radial-gradient(circle, rgba(255, 20, 147, 0.15) 0%, rgba(255, 20, 147, 0.05) 50%, transparent 100%)' : 
          'radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.03) 50%, transparent 100%)',
        boxShadow: chargingPlayer ? 
          '0 0 60px rgba(255, 20, 147, 0.6), 0 0 120px rgba(255, 20, 147, 0.3)' : 
          '0 0 15px rgba(255, 215, 0, 0.2)',
        borderRadius: '50%',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Subtle outer ring when charging
        border: chargingPlayer ? '2px solid rgba(255, 20, 147, 0.6)' : '1px solid rgba(255, 215, 0, 0.3)',
        animation: chargingPlayer ? 'chargingRingPulse 0.3s ease-in-out infinite' : 'none'
      }}
    >
      <canvas style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

export default ReliableGoldCoin 