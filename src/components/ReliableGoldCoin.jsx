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
      // Gold gradient background
      const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
      gradient.addColorStop(0, '#FFD700')
      gradient.addColorStop(0.7, '#DAA520')
      gradient.addColorStop(1, '#B8860B')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
      
      // Crown symbol
      ctx.fillStyle = '#B8860B'
      ctx.font = `bold ${size * 0.25}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('♔', size/2, size/2)
      
      // Decorative border
      ctx.strokeStyle = '#8B7D6B'
      ctx.lineWidth = size * 0.02
      ctx.beginPath()
      ctx.arc(size/2, size/2, size * 0.45, 0, Math.PI * 2)
      ctx.stroke()
      
    } else if (type === 'tails') {
      // Gold gradient background
      const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
      gradient.addColorStop(0, '#FFD700')
      gradient.addColorStop(0.7, '#DAA520')
      gradient.addColorStop(1, '#B8860B')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
      
      // Diamond symbol
      ctx.fillStyle = '#B8860B'
      ctx.font = `bold ${size * 0.25}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('♦', size/2, size/2)
      
      // Decorative border
      ctx.strokeStyle = '#8B7D6B'
      ctx.lineWidth = size * 0.02
      ctx.beginPath()
      ctx.arc(size/2, size/2, size * 0.45, 0, Math.PI * 2)
      ctx.stroke()
      
    } else if (type === 'edge') {
      // Repeating edge pattern
      ctx.fillStyle = '#DAA520'
      ctx.fillRect(0, 0, size, size)
      
      // Vertical lines pattern (reeding)
      ctx.strokeStyle = '#B8860B'
      ctx.lineWidth = 2
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

    // LIGHTING SETUP - Bright and professional
    scene.add(new THREE.AmbientLight(0xffffff, 0.8))

    // Left point light
    const pointLightLeft = new THREE.PointLight(0xFFE4B5, 1.2)
    pointLightLeft.position.set(-3, -2, 5)
    scene.add(pointLightLeft)

    // Right point light  
    const pointLightRight = new THREE.PointLight(0xFFE4B5, 1.2)
    pointLightRight.position.set(3, 2, 5)
    scene.add(pointLightRight)

    // Top point light
    const pointLightTop = new THREE.PointLight(0xFFFFFF, 1.0)
    pointLightTop.position.set(0, 4, 3)
    scene.add(pointLightTop)

    // MATERIALS SETUP
    const metalness = 0.8
    const roughness = 0.1

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
      // Circumference (edge)
      new THREE.MeshStandardMaterial({
        map: textureEdge,
        metalness: metalness,
        roughness: roughness,
        color: 0xDAA520
      }),
      // Heads side (top)
      new THREE.MeshStandardMaterial({
        map: textureHeads,
        metalness: metalness,
        roughness: roughness,
        color: 0xFFD700
      }),
      // Tails side (bottom)
      new THREE.MeshStandardMaterial({
        map: textureTails,
        metalness: metalness,
        roughness: roughness,
        color: 0xFFD700
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