import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'

const DeterministicGoldCoin = ({
  size = '300px',
  headsImage = null,
  tailsImage = null,
  edgeImage = null,
  isFlipping = false,
  flipResult = null,
  flipDuration = 2000,
  isCharging = false,
  chargingPlayer = null,
  isPlayerTurn = false,
  onPowerCharge = null,
  onPowerRelease = null,
  creatorPower = 0,
  joinerPower = 0,
  creatorChoice = null,
  joinerChoice = null,
  isCreator = true,
  gamePhase = 'waiting',
  onPreCalculatedResult = null
}) => {
  const mountRef = useRef(null)
  const coinRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const animationIdRef = useRef(null)
  const isAnimatingRef = useRef(false)
  const texturesRef = useRef({})
  
  // Power level mapping - 20 predetermined rotation patterns
  const ROTATION_PATTERNS = {
    // Power levels 1-10 for HEADS outcomes (always land on heads)
    heads: {
      1: { rotations: 2, finalAngle: 0 },      // 720° → heads
      2: { rotations: 4, finalAngle: 0 },      // 1440° → heads  
      3: { rotations: 6, finalAngle: 0 },      // 2160° → heads
      4: { rotations: 8, finalAngle: 0 },      // 2880° → heads
      5: { rotations: 10, finalAngle: 0 },     // 3600° → heads
      6: { rotations: 12, finalAngle: 0 },     // 4320° → heads
      7: { rotations: 15, finalAngle: 0 },     // 5400° → heads
      8: { rotations: 18, finalAngle: 0 },     // 6480° → heads
      9: { rotations: 22, finalAngle: 0 },     // 7920° → heads
      10: { rotations: 25, finalAngle: 0 }     // 9000° → heads
    },
    // Power levels 1-10 for TAILS outcomes (always land on tails)
    tails: {
      1: { rotations: 2.5, finalAngle: Math.PI },    // 900° → tails
      2: { rotations: 4.5, finalAngle: Math.PI },    // 1620° → tails
      3: { rotations: 6.5, finalAngle: Math.PI },    // 2340° → tails
      4: { rotations: 8.5, finalAngle: Math.PI },    // 3060° → tails
      5: { rotations: 10.5, finalAngle: Math.PI },   // 3780° → tails
      6: { rotations: 12.5, finalAngle: Math.PI },   // 4500° → tails
      7: { rotations: 15.5, finalAngle: Math.PI },   // 5580° → tails
      8: { rotations: 18.5, finalAngle: Math.PI },   // 6660° → tails
      9: { rotations: 22.5, finalAngle: Math.PI },   // 8100° → tails
      10: { rotations: 25.5, finalAngle: Math.PI }   // 9180° → tails
    }
  }

  // Detect mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  // Create gold texture with dynamic coloring based on player choices
  const createGoldTexture = (face) => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    
    // Base gold gradient
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
    gradient.addColorStop(0, '#FFD700')
    gradient.addColorStop(0.7, '#FFA500')
    gradient.addColorStop(1, '#FF8C00')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 512, 512)
    
    // Add choice-based colored ring
    if (face === 'heads' && creatorChoice) {
      const ringColor = creatorChoice === 'heads' ? '#00FF41' : '#FF1493'
      ctx.strokeStyle = ringColor
      ctx.lineWidth = 20
      ctx.beginPath()
      ctx.arc(256, 256, 200, 0, Math.PI * 2)
      ctx.stroke()
    } else if (face === 'tails' && joinerChoice) {
      const ringColor = joinerChoice === 'tails' ? '#00FF41' : '#FF1493'
      ctx.strokeStyle = ringColor
      ctx.lineWidth = 20
      ctx.beginPath()
      ctx.arc(256, 256, 200, 0, Math.PI * 2)
      ctx.stroke()
    }
    
    // Add face text
    ctx.fillStyle = '#000'
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(face.toUpperCase(), 256, 276)
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene
    
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.z = 8
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: !isMobile, // Disable antialiasing on mobile for performance
      alpha: true,
      powerPreference: isMobile ? 'low-power' : 'high-performance'
    })
    renderer.setSize(300, 300)
    renderer.setClearColor(0x000000, 0)
    rendererRef.current = renderer
    
    mountRef.current.appendChild(renderer.domElement)

    // Lighting setup - simplified for better performance
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 5)
    scene.add(directionalLight)

    // Create textures
    const headsTexture = createGoldTexture('heads')
    const tailsTexture = createGoldTexture('tails')
    
    // Edge texture (simple gold)
    const edgeCanvas = document.createElement('canvas')
    edgeCanvas.width = 512
    edgeCanvas.height = 64
    const edgeCtx = edgeCanvas.getContext('2d')
    const edgeGradient = edgeCtx.createLinearGradient(0, 0, 0, 64)
    edgeGradient.addColorStop(0, '#FFD700')
    edgeGradient.addColorStop(0.5, '#FFA500')
    edgeGradient.addColorStop(1, '#FFD700')
    edgeCtx.fillStyle = edgeGradient
    edgeCtx.fillRect(0, 0, 512, 64)
    const edgeTexture = new THREE.CanvasTexture(edgeCanvas)

    // Store textures for cleanup
    texturesRef.current = { headsTexture, tailsTexture, edgeTexture }

    // Create materials - simplified for performance
    const materials = [
      new THREE.MeshStandardMaterial({ 
        map: edgeTexture,
        metalness: 0.6,
        roughness: 0.1,
        emissive: new THREE.Color(0x554400),
        emissiveIntensity: 0.3
      }), // Edge
      new THREE.MeshStandardMaterial({ 
        map: headsTexture,
        metalness: 0.6,
        roughness: 0.1,
        emissive: new THREE.Color(0x554400),
        emissiveIntensity: 0.3
      }), // Heads (top)
      new THREE.MeshStandardMaterial({ 
        map: tailsTexture,
        metalness: 0.6,
        roughness: 0.1,
        emissive: new THREE.Color(0x554400),
        emissiveIntensity: 0.3
      })  // Tails (bottom)
    ]

    // Create coin geometry - reduced complexity on mobile
    const geometrySegments = isMobile ? 16 : 32
    const geometry = new THREE.CylinderGeometry(3, 3, 0.4, geometrySegments)
    const coin = new THREE.Mesh(geometry, materials)
    
    scene.add(coin)
    coinRef.current = coin

    // Set initial rotation - heads showing (top face visible)
    coin.rotation.x = 0
    coin.rotation.y = Math.PI / 2

    // Simplified animation loop
    const animate = () => {
      if (!coinRef.current || !rendererRef.current) return

      const coin = coinRef.current
      const time = Date.now() * 0.001
      
      // Handle different states
      if (isAnimatingRef.current) {
        // Flip animation is handled separately
      } else if ((chargingPlayer || isCharging) && !isAnimatingRef.current) {
        // Charging effects - simplified
        const intensity = (creatorPower + joinerPower) / 20
        const chargeIntensity = Math.min(1, intensity * 2)
        
        // Gentle charging animation
        coin.position.y = Math.sin(time * 8) * 0.1 * (1 + chargeIntensity * 0.5)
        coin.rotation.x += 0.02 * (1 + chargeIntensity)
        
        // Subtle scale pulsing
        const pulseScale = 1 + Math.sin(time * 10) * 0.05 * chargeIntensity
        coin.scale.set(pulseScale, pulseScale, pulseScale)
        
        // Simple emissive effect
        materials.forEach(material => {
          if (material.emissiveIntensity !== undefined) {
            material.emissiveIntensity = 0.3 + Math.sin(time * 12) * 0.2 * chargeIntensity
          }
        })
        
      } else {
        // Reset effects when not charging
        materials.forEach(material => {
          if (material.emissiveIntensity !== undefined) {
            material.emissiveIntensity = 0.3
            material.emissive.setHex(0x554400)
          }
        })
        coin.scale.set(1, 1, 1)
        coin.position.x = 0
        coin.position.z = 0
        
        // Gentle idle rotation
        coin.rotation.x += 0.005
        coin.position.y = Math.sin(time * 1.5) * 0.02
      }

      rendererRef.current.render(scene, camera)
      animationIdRef.current = requestAnimationFrame(animate)
    }

    // Start animation with frame rate control on mobile
    if (isMobile) {
      let lastTime = 0
      const targetFPS = 30
      const frameDelay = 1000 / targetFPS
      
      const throttledAnimate = (currentTime) => {
        const deltaTime = currentTime - lastTime
        
        if (deltaTime >= frameDelay) {
          animate()
          lastTime = currentTime
        }
        
        animationIdRef.current = requestAnimationFrame(throttledAnimate)
      }
      
      throttledAnimate(0)
    } else {
      animate()
    }

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
      
      // Clear texture cache
      Object.values(texturesRef.current).forEach(texture => {
        texture.dispose()
      })
      texturesRef.current = {}
      
      sceneRef.current = null
      rendererRef.current = null
    }
  }, [headsImage, tailsImage, edgeImage, isMobile, size])

  // Update textures when player choices change
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

  // DETERMINISTIC FLIP ANIMATION - Uses predetermined rotation patterns
  useEffect(() => {
    if (!isFlipping || !flipResult || !flipDuration || !coinRef.current) {
      return
    }

    console.log('🎬 Starting DETERMINISTIC flip animation:', { 
      flipResult, 
      flipDuration, 
      totalPower: creatorPower + joinerPower
    })
    
    // Stop any current animation
    if (isAnimatingRef.current) {
      isAnimatingRef.current = false
    }
    
    // Short delay to ensure clean state
    setTimeout(() => {
      if (!coinRef.current) return
      
      isAnimatingRef.current = true
      const coin = coinRef.current
      
      // Calculate power level (1-10) based on total power
      const totalPower = creatorPower + joinerPower
      const powerLevel = Math.max(1, Math.min(10, Math.ceil(totalPower)))
      
      // Get the predetermined rotation pattern
      const pattern = ROTATION_PATTERNS[flipResult][powerLevel]
      const totalRotations = pattern.rotations * (Math.PI * 2) // Convert to radians
      const targetAngle = pattern.finalAngle
      
      console.log('🎲 Using predetermined pattern:', {
        powerLevel,
        totalRotations: (totalRotations * 180 / Math.PI).toFixed(0) + '°',
        targetAngle: (targetAngle * 180 / Math.PI).toFixed(0) + '°',
        flipResult
      })
      
      // Reset coin state
      coin.scale.set(1, 1, 1)
      coin.position.x = 0
      coin.position.z = 0
      
      const startRotation = coin.rotation.x
      const startTime = Date.now()
      
      const animateFlip = () => {
        if (!isAnimatingRef.current || !coinRef.current) return
        
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / flipDuration, 1)
        
        if (progress < 1) {
          // Smooth easing curve
          let easedProgress
          if (progress < 0.7) {
            // Accelerate for first 70%
            easedProgress = Math.pow(progress / 0.7, 0.9) * 0.7
          } else {
            // Decelerate for last 30%
            const decelPhase = (progress - 0.7) / 0.3
            easedProgress = 0.7 + (1 - Math.pow(1 - decelPhase, 2.5)) * 0.3
          }
          
          // Calculate current rotation
          coin.rotation.x = startRotation + (totalRotations * easedProgress)
          
          // Vertical motion arc
          coin.position.y = Math.sin(progress * Math.PI) * 0.6 * (1 - progress * 0.3)
          
          // Slight wobble that decreases over time
          const wobbleIntensity = 0.03 * (1 - progress)
          coin.rotation.z = Math.sin(progress * Math.PI * 8) * wobbleIntensity
          
          requestAnimationFrame(animateFlip)
        } else {
          // PERFECT LANDING - set exact final angle
          coin.rotation.x = targetAngle
          coin.rotation.y = Math.PI / 2
          coin.rotation.z = 0
          coin.position.y = 0
          coin.position.x = 0
          coin.position.z = 0
          coin.scale.set(1, 1, 1)
          
          isAnimatingRef.current = false
          console.log('✅ DETERMINISTIC flip complete - landed PERFECTLY on:', flipResult)
        }
      }
      
      // Start the animation
      animateFlip()
      
    }, 50)
    
    // Cleanup function
    return () => {
      isAnimatingRef.current = false
    }
  }, [isFlipping, flipResult, flipDuration, creatorPower, joinerPower])

  // Power charge handler
  const handlePowerChargeStart = (e) => {
    if (!isPlayerTurn || !onPowerCharge) return
    
    console.log('🎮 Coin clicked - starting charge')
    onPowerCharge(e)
  }

  // Power release handler with INSTANT random decision
  const handlePowerRelease = (e) => {
    if (!isPlayerTurn || !onPowerRelease) return
    
    // INSTANT RANDOM DECISION - happens right here, right now!
    const instantResult = Math.random() < 0.5 ? 'heads' : 'tails'
    console.log('🎲 INSTANT decision made on release:', instantResult)
    
    // Call the callback immediately with the result
    if (onPreCalculatedResult) {
      onPreCalculatedResult(instantResult)
    }
    
    // Call original handler
    onPowerRelease(e)
  }

  return (
    <div
      ref={mountRef}
      onMouseDown={isPlayerTurn ? handlePowerChargeStart : undefined}
      onMouseUp={isPlayerTurn ? handlePowerRelease : undefined}
      onMouseLeave={isPlayerTurn ? handlePowerRelease : undefined}
      onTouchStart={isPlayerTurn ? handlePowerChargeStart : undefined}
      onTouchEnd={isPlayerTurn ? handlePowerRelease : undefined}
      style={{
        width: size,
        height: size,
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
        border: chargingPlayer ? '2px solid rgba(255, 20, 147, 0.6)' : '1px solid rgba(255, 215, 0, 0.3)',
        animation: chargingPlayer ? 'chargingRingPulse 1s ease-in-out infinite' : 'none'
      }}
    />
  )
}

export default DeterministicGoldCoin 