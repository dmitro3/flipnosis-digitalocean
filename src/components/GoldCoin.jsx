import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

const GoldCoin = ({ 
  isFlipping, 
  flipResult, 
  flipDuration = 3000,
  onPowerCharge, 
  onPowerRelease,
  isPlayerTurn,
  isCharging = false,
  chargingPlayer,
  gamePhase
}) => {
  const mountRef = useRef(null)
  const coinRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const animationIdRef = useRef(null)
  const isAnimatingRef = useRef(false)
  const powerSystemRef = useRef({
    power: 0,
    maxPower: 10,
    chargeRate: 0.15,
    isCharging: false,
    chargeInterval: null
  })

  // Initialize Three.js scene ONCE
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.set(0, 0, 4)

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    })
    renderer.setSize(400, 400)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2

    sceneRef.current = scene
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    // GOLD MATERIAL SETUP
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700,              // Pure gold color
      metalness: 1.0,               // Fully metallic
      roughness: 0.08,              // Very shiny
      emissive: 0x332200,           // Warm gold glow
      emissiveIntensity: 0.05,      // Subtle glow
    })

    // COIN GEOMETRY - Realistic proportions
    const coinRadius = 1.4
    const coinThickness = 0.12
    const coinSegments = 64

    // Create coin group
    const coin = new THREE.Group()
    coin.scale.set(1.2, 1.2, 1.2)

    // Main coin body (cylinder)
    const coinGeometry = new THREE.CylinderGeometry(
      coinRadius, coinRadius, coinThickness, coinSegments
    )

    // HEADS FACE (Front - shows first)
    const headsFaceGeometry = new THREE.CircleGeometry(coinRadius - 0.02, coinSegments)
    const headsMaterial = goldMaterial.clone()
    
    // Create procedural heads texture
    const headsCanvas = document.createElement('canvas')
    headsCanvas.width = 512
    headsCanvas.height = 512
    const headsCtx = headsCanvas.getContext('2d')
    
    // Gold background
    headsCtx.fillStyle = '#FFD700'
    headsCtx.fillRect(0, 0, 512, 512)
    
    // Crown symbol for heads
    headsCtx.fillStyle = '#B8860B'
    headsCtx.font = 'bold 120px serif'
    headsCtx.textAlign = 'center'
    headsCtx.textBaseline = 'middle'
    headsCtx.fillText('♔', 256, 256)
    
    // Border design
    headsCtx.strokeStyle = '#B8860B'
    headsCtx.lineWidth = 8
    headsCtx.beginPath()
    headsCtx.arc(256, 256, 240, 0, Math.PI * 2)
    headsCtx.stroke()
    
    const headsTexture = new THREE.CanvasTexture(headsCanvas)
    headsTexture.colorSpace = THREE.SRGBColorSpace
    headsMaterial.map = headsTexture

    const headsFace = new THREE.Mesh(headsFaceGeometry, headsMaterial)
    headsFace.position.z = coinThickness / 2 + 0.001
    headsFace.rotation.x = 0
    coin.add(headsFace)

    // TAILS FACE (Back)
    const tailsFaceGeometry = new THREE.CircleGeometry(coinRadius - 0.02, coinSegments)
    const tailsMaterial = goldMaterial.clone()
    
    // Create procedural tails texture
    const tailsCanvas = document.createElement('canvas')
    tailsCanvas.width = 512
    tailsCanvas.height = 512
    const tailsCtx = tailsCanvas.getContext('2d')
    
    // Gold background
    tailsCtx.fillStyle = '#FFD700'
    tailsCtx.fillRect(0, 0, 512, 512)
    
    // Diamond symbol for tails
    tailsCtx.fillStyle = '#B8860B'
    tailsCtx.font = 'bold 120px serif'
    tailsCtx.textAlign = 'center'
    tailsCtx.textBaseline = 'middle'
    tailsCtx.fillText('♦', 256, 256)
    
    // Border design
    tailsCtx.strokeStyle = '#B8860B'
    tailsCtx.lineWidth = 8
    tailsCtx.beginPath()
    tailsCtx.arc(256, 256, 240, 0, Math.PI * 2)
    tailsCtx.stroke()
    
    const tailsTexture = new THREE.CanvasTexture(tailsCanvas)
    tailsTexture.colorSpace = THREE.SRGBColorSpace
    tailsMaterial.map = tailsTexture

    const tailsFace = new THREE.Mesh(tailsFaceGeometry, tailsMaterial)
    tailsFace.position.z = -(coinThickness / 2) - 0.001
    tailsFace.rotation.x = Math.PI // Flip to face outward
    coin.add(tailsFace)

    // COIN EDGE
    const edgeGeometry = new THREE.CylinderGeometry(
      coinRadius, coinRadius, coinThickness, coinSegments, 1, true
    )
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xDAA520,  // Darker gold for edge
      metalness: 1.0,
      roughness: 0.2,
    })
    
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial)
    coin.add(edge)

    // INITIAL POSITION - Always start with heads facing forward
    coin.rotation.x = Math.PI / 2  // Rotate so faces point toward camera
    coin.rotation.y = 0            // Heads faces forward
    coin.rotation.z = 0
    coin.position.y = 0

    scene.add(coin)
    coinRef.current = coin

    // ENHANCED LIGHTING for gold
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)

    // Key light - warm tone for gold
    const keyLight = new THREE.DirectionalLight(0xFFF4E6, 1.5)
    keyLight.position.set(5, 5, 5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    scene.add(keyLight)

    // Fill light - cooler tone for contrast
    const fillLight = new THREE.DirectionalLight(0xE6F4FF, 0.7)
    fillLight.position.set(-3, 2, 3)
    scene.add(fillLight)

    // Rim light - dramatic edge lighting
    const rimLight = new THREE.DirectionalLight(0xFFFFFF, 0.9)
    rimLight.position.set(0, -2, 5)
    scene.add(rimLight)

    // Animation loop
    const animate = () => {
      if (!coinRef.current || !rendererRef.current) return

      const coin = coinRef.current
      const time = Date.now() * 0.001
      const powerSystem = powerSystemRef.current
      
      // Charging animation
      if (isCharging && !isAnimatingRef.current) {
        // Power-based effects
        const intensity = powerSystem.power / powerSystem.maxPower
        
        // Coin glow effect
        headsMaterial.emissiveIntensity = 0.05 + (intensity * 0.25)
        tailsMaterial.emissiveIntensity = 0.05 + (intensity * 0.25)
        
        // Gentle hover effect
        coin.position.y = Math.sin(time * 4) * 0.05 * intensity
        
        // Power-based Y rotation speed
        coin.rotation.y += 0.008 * (1 + intensity)
        
        // Scale pulsing
        const scale = 1.2 + (Math.sin(time * 6) * 0.03 * intensity)
        coin.scale.set(scale, scale, scale)
        
      } else if (!isAnimatingRef.current) {
        // Reset effects when not charging
        headsMaterial.emissiveIntensity = 0.05
        tailsMaterial.emissiveIntensity = 0.05
        coin.scale.set(1.2, 1.2, 1.2)
        
        // Gentle idle animation based on game phase
        const isWaitingInRound = gamePhase === 'round_active' && !isPlayerTurn
        const isWaitingToStart = gamePhase === 'waiting' || gamePhase === 'ready'
        
        if (isWaitingInRound || isWaitingToStart) {
          // Gentle hover when waiting
          coin.position.y = Math.sin(time * 1.5) * 0.08
          coin.rotation.y += 0.005
        } else {
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
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      
      // Cleanup materials and textures
      headsMaterial.dispose()
      tailsMaterial.dispose()
      edgeMaterial.dispose()
      headsTexture.dispose()
      tailsTexture.dispose()
      
      renderer.dispose()
      sceneRef.current = null
      rendererRef.current = null
    }
  }, [])

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

  // FLIP ANIMATION - Y-axis only, physics accurate
  useEffect(() => {
    if (!isFlipping || !flipResult || !flipDuration || !coinRef.current || isAnimatingRef.current) {
      return
    }

    console.log('🎬 Starting gold coin flip:', { flipResult, flipDuration })
    
    isAnimatingRef.current = true
    const coin = coinRef.current
    const powerSystem = powerSystemRef.current
    
    // Reset coin position and effects
    coin.position.y = 0
    coin.scale.set(1.2, 1.2, 1.2)
    
    const startTime = Date.now()
    const startRotationY = coin.rotation.y
    
    // Calculate flip parameters based on power and duration
    const minFlips = 3
    const maxFlips = 8
    const flipPower = Math.max(1, Math.min(10, powerSystem.power || 5))
    const totalFlips = minFlips + (flipPower / 10) * (maxFlips - minFlips)
    
    console.log('🎲 Flip parameters:', { flipPower, totalFlips, flipDuration })
    
    // Calculate final rotation for correct landing
    let finalRotationY = startRotationY + (totalFlips * Math.PI * 2)
    
    // Ensure correct landing side (Y-axis rotation)
    if (flipResult === 'heads') {
      // Heads: Y rotation = 0 (or multiples of 2π)
      finalRotationY = Math.round(finalRotationY / (Math.PI * 2)) * Math.PI * 2
    } else {
      // Tails: Y rotation = π (or odd multiples of π)  
      finalRotationY = Math.round(finalRotationY / (Math.PI * 2)) * Math.PI * 2 + Math.PI
    }
    
    const animateFlip = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / flipDuration, 1)
      
      // Physics-accurate easing - fast start, dramatic slowdown
      let easeProgress
      if (progress < 0.75) {
        // Fast spinning for first 75%
        easeProgress = progress / 0.75
      } else {
        // Dramatic slow down for last 25%
        const slowPhase = (progress - 0.75) / 0.25
        const slowEase = 1 - Math.pow(1 - slowPhase, 4) // Quartic ease-out
        easeProgress = 0.75 + (slowEase * 0.25)
      }
      
      // PRIMARY Y-AXIS ROTATION (the main flip)
      coin.rotation.y = startRotationY + (finalRotationY - startRotationY) * easeProgress
      
      // Realistic parabolic arc motion
      coin.position.y = Math.sin(progress * Math.PI) * 0.9 * (1 - progress * 0.1)
      
      // MINIMAL wobble on other axes (very subtle, like real coins)
      const wobbleIntensity = (1 - progress * 0.8) // Decreases as flip progresses
      coin.rotation.x = (Math.PI / 2) + (Math.sin(progress * Math.PI * totalFlips * 0.3) * 0.08 * wobbleIntensity)
      coin.rotation.z = Math.cos(progress * Math.PI * totalFlips * 0.2) * 0.05 * wobbleIntensity
      
      // Slight scale variation during peak
      const scale = 1.2 + Math.sin(progress * Math.PI) * 0.05
      coin.scale.set(scale, scale, scale)
      
      if (progress < 1) {
        requestAnimationFrame(animateFlip)
      } else {
        // FINAL LANDING POSITION
        coin.rotation.x = Math.PI / 2  // Face camera
        coin.rotation.z = 0
        coin.position.y = 0
        coin.scale.set(1.2, 1.2, 1.2)
        
        // Ensure exact final Y rotation
        if (flipResult === 'heads') {
          coin.rotation.y = 0
        } else {
          coin.rotation.y = Math.PI
        }
        
        isAnimatingRef.current = false
        console.log('✅ Gold coin flip complete:', flipResult)
        
        // Landing effect
        createLandingEffect()
      }
    }
    
    animateFlip()
  }, [isFlipping, flipResult, flipDuration])

  // Landing particle effect
  const createLandingEffect = () => {
    if (!sceneRef.current || !coinRef.current) return
    
    const scene = sceneRef.current
    const coinPosition = coinRef.current.position
    
    // Create golden particles
    const particleCount = 8
    const particles = []
    
    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.02),
        new THREE.MeshBasicMaterial({ 
          color: 0xFFD700,
          transparent: true,
          opacity: 0.8
        })
      )
      
      const angle = (i / particleCount) * Math.PI * 2
      particle.position.set(
        coinPosition.x + Math.cos(angle) * 0.3,
        coinPosition.y + 0.05,
        coinPosition.z + Math.sin(angle) * 0.3
      )
      
      particle.velocity = {
        x: Math.cos(angle) * 0.02,
        y: 0.04,
        z: Math.sin(angle) * 0.02
      }
      
      scene.add(particle)
      particles.push(particle)
    }
    
    // Animate particles
    let particleLife = 0
    const animateParticles = () => {
      particleLife += 0.05
      
      particles.forEach((particle, index) => {
        if (particle.parent) {
          particle.position.x += particle.velocity.x
          particle.position.y += particle.velocity.y
          particle.position.z += particle.velocity.z
          
          particle.velocity.y -= 0.002 // Gravity
          particle.material.opacity = Math.max(0, 0.8 - particleLife)
          
          if (particleLife > 1) {
            scene.remove(particle)
            particle.geometry.dispose()
            particle.material.dispose()
          }
        }
      })
      
      if (particleLife < 1) {
        requestAnimationFrame(animateParticles)
      }
    }
    
    animateParticles()
  }

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
          'radial-gradient(circle, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.05) 50%, transparent 100%)' : 
          'transparent',
        boxShadow: isCharging ? 
          '0 0 30px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 215, 0, 0.2)' : 
          '0 0 15px rgba(255, 215, 0, 0.2)',
        borderRadius: '50%',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    />
  )
}

export default GoldCoin 