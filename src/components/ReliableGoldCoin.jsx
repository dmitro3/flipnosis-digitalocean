import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { isMobileDevice } from '../../utils/deviceDetection'

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
  edgeImage = null,
  size = 400 // NEW: size prop for responsive coin
}) => {
  const mountRef = useRef(null)
  const coinRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const animationIdRef = useRef(null)
  const isAnimatingRef = useRef(false)
  const targetAngleRef = useRef(0) // Default to heads (0°)
  const texturesRef = useRef({}) // Store preloaded textures
  const isMobile = isMobileDevice() // Detect mobile once
  
  // Removed pre-calculation logic - keeping it simple

  // NEW: Function to determine text colors based on player choices
  const getTextColors = () => {
    // Default colors (no choice made)
    let headsColor = '#654321' // Dark brown
    let tailsColor = '#654321' // Dark brown
    
    // Show both players' choices to everyone
    if (creatorChoice && joinerChoice) {
      // Both players have chosen - show their choices
      if (isCreator) {
        // Show from creator's perspective
        headsColor = creatorChoice === 'heads' ? '#00FF00' : '#FF0000'
        tailsColor = creatorChoice === 'tails' ? '#00FF00' : '#FF0000'
      } else {
        // Show from joiner's perspective
        headsColor = joinerChoice === 'heads' ? '#00FF00' : '#FF0000'
        tailsColor = joinerChoice === 'tails' ? '#00FF00' : '#FF0000'
      }
    } else if (creatorChoice || joinerChoice) {
      // Only one player has chosen
      const playerChoice = creatorChoice || joinerChoice
      const isMyChoice = (creatorChoice && isCreator) || (joinerChoice && !isCreator)
      
      if (isMyChoice) {
        // This is my choice - show green for my choice, orange for opponent's potential choice
        headsColor = playerChoice === 'heads' ? '#00FF00' : '#FFA500'
        tailsColor = playerChoice === 'tails' ? '#00FF00' : '#FFA500'
      } else {
        // This is opponent's choice - show red for their choice, orange for my potential choice
        headsColor = playerChoice === 'heads' ? '#FF0000' : '#FFA500'
        tailsColor = playerChoice === 'tails' ? '#FF0000' : '#FFA500'
      }
    }
    
    console.log('🎨 Color calculation:', {
      isCreator,
      creatorChoice,
      joinerChoice,
      headsColor,
      tailsColor
    })
    
    return { headsColor, tailsColor }
  }

  // Create procedural gold textures with dynamic colors
  const createGoldTexture = (type, size = 512) => {
    // Check if we have a cached texture for this type and color combo
    const { headsColor, tailsColor } = getTextColors()
    const cacheKey = `${type}-${type === 'heads' ? headsColor : type === 'tails' ? tailsColor : 'default'}`
    
    if (texturesRef.current[cacheKey]) {
      return texturesRef.current[cacheKey]
    }

    const canvas = document.createElement('canvas')
    // Use smaller texture size on mobile for better performance
    const textureSize = isMobile ? 256 : size
    canvas.width = textureSize
    canvas.height = textureSize
    const ctx = canvas.getContext('2d')

    if (type === 'heads') {
      // Gold gradient background - BRIGHTER
      const gradient = ctx.createRadialGradient(textureSize/2, textureSize/2, 0, textureSize/2, textureSize/2, textureSize/2)
      gradient.addColorStop(0, '#FFEF94') // Much brighter center
      gradient.addColorStop(0.5, '#FFD700') // Bright gold
      gradient.addColorStop(0.8, '#DAA520') // Medium gold
      gradient.addColorStop(1, '#B8860B') // Darker edge
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, textureSize, textureSize)
      
      // Crown symbol - positioned higher
      ctx.fillStyle = '#8B4513' // Darker brown for contrast
      ctx.font = `bold ${textureSize * 0.2}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('♔', textureSize/2, textureSize/2 - textureSize * 0.08) // Moved up
      
      // "HEADS" text below crown - NOW WITH DYNAMIC COLOR
      ctx.fillStyle = headsColor // Use dynamic color
      ctx.font = `bold ${textureSize * 0.18}px Hyperwave` // Increased size by 50%
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('HEADS', textureSize/2, textureSize/2 + textureSize * 0.12) // Below crown
      
      // Add glow effect for green text
      if (headsColor === '#00FF00') {
        ctx.shadowColor = '#00FF00'
        ctx.shadowBlur = 10
        ctx.fillText('HEADS', textureSize/2, textureSize/2 + textureSize * 0.12)
        ctx.shadowBlur = 0 // Reset shadow
      }
      
      // Decorative border - more prominent
      ctx.strokeStyle = '#8B7D6B'
      ctx.lineWidth = textureSize * 0.025 // Thicker border
      ctx.beginPath()
      ctx.arc(textureSize/2, textureSize/2, textureSize * 0.42, 0, Math.PI * 2)
      ctx.stroke()
      
    } else if (type === 'tails') {
      // Gold gradient background - BRIGHTER  
      const gradient = ctx.createRadialGradient(textureSize/2, textureSize/2, 0, textureSize/2, textureSize/2, textureSize/2)
      gradient.addColorStop(0, '#FFEF94') // Much brighter center
      gradient.addColorStop(0.5, '#FFD700') // Bright gold
      gradient.addColorStop(0.8, '#DAA520') // Medium gold
      gradient.addColorStop(1, '#B8860B') // Darker edge
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, textureSize, textureSize)
      
      // Diamond symbol - positioned higher
      ctx.fillStyle = '#8B4513' // Darker brown for contrast
      ctx.font = `bold ${textureSize * 0.2}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('♦', textureSize/2, textureSize/2 - textureSize * 0.08) // Moved up
      
      // "TAILS" text below diamond - NOW WITH DYNAMIC COLOR
      ctx.fillStyle = tailsColor // Use dynamic color
      ctx.font = `bold ${textureSize * 0.18}px Hyperwave` // Increased size by 50%
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('TAILS', textureSize/2, textureSize/2 + textureSize * 0.12) // Below diamond
      
      // Add glow effect for green text
      if (tailsColor === '#00FF00') {
        ctx.shadowColor = '#00FF00'
        ctx.shadowBlur = 10
        ctx.fillText('TAILS', textureSize/2, textureSize/2 + textureSize * 0.12)
        ctx.shadowBlur = 0 // Reset shadow
      }
      
      // Decorative border - more prominent
      ctx.strokeStyle = '#8B7D6B'
      ctx.lineWidth = textureSize * 0.025 // Thicker border
      ctx.beginPath()
      ctx.arc(textureSize/2, textureSize/2, textureSize * 0.42, 0, Math.PI * 2)
      ctx.stroke()
      
    } else if (type === 'edge') {
      // Brighter edge pattern
      ctx.fillStyle = '#FFEF94' // Much brighter base
      ctx.fillRect(0, 0, textureSize, textureSize)
      
      // Vertical lines pattern (reeding) - more contrast
      ctx.strokeStyle = '#B8860B' // Darker lines for contrast
      ctx.lineWidth = 3 // Slightly thicker
      for (let i = 0; i < textureSize; i += 8) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, textureSize)
        ctx.stroke()
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    
    // Cache the texture
    texturesRef.current[cacheKey] = texture
    
    return texture
  }

  // Preload textures on mount
  useEffect(() => {
    // Preload default textures
    createGoldTexture('heads')
    createGoldTexture('tails')
    createGoldTexture('edge')
  }, [])

  // Initialize Three.js scene ONCE
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, 1, 1, 10)
    camera.position.set(0, 0, 7)

    const renderer = new THREE.WebGLRenderer({ 
      canvas: mountRef.current.querySelector('canvas') || document.createElement('canvas'),
      antialias: !isMobile, // Disable antialiasing on mobile for performance
      alpha: true,
      powerPreference: isMobile ? "low-power" : "high-performance"
    })
    renderer.setSize(size, size)
    renderer.setClearColor(0x000000, 0)
    
    // Lower pixel ratio on mobile for better performance
    if (isMobile) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    }

    if (!mountRef.current.querySelector('canvas')) {
      mountRef.current.appendChild(renderer.domElement)
    }

    sceneRef.current = scene
    rendererRef.current = renderer

    // LIGHTING SETUP - ZERO LIGHTS ON MOBILE
    if (isMobile) {
      // NO LIGHTS AT ALL - Just use unlit materials
      console.log('📱 Mobile detected: Using unlit materials with no lights')
    } else {
      // Desktop gets full lighting
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
    }

    // MATERIALS SETUP - Different for mobile vs desktop
    const metalness = isMobile ? 0 : 0.6 // No metalness on mobile
    const roughness = isMobile ? 1 : 0.1 // Full roughness on mobile

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
    textureEdge.repeat.set(isMobile ? 10 : 20, 1) // Less repetition on mobile

    const materials = isMobile ? [
      // Mobile uses MeshBasicMaterial - no lighting calculations needed
      // Circumference (edge)
      new THREE.MeshBasicMaterial({
        map: textureEdge,
        color: 0xFFFFCC
      }),
      // Heads side (top)
      new THREE.MeshBasicMaterial({
        map: textureHeads,
        color: 0xFFFFCC
      }),
      // Tails side (bottom)
      new THREE.MeshBasicMaterial({
        map: textureTails,
        color: 0xFFFFCC
      })
    ] : [
      // Desktop uses full MeshStandardMaterial
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

    // COIN GEOMETRY - SIMPLIFIED FOR MOBILE
    const geometrySegments = isMobile ? 32 : 100 // Much fewer segments on mobile
    const geometry = new THREE.CylinderGeometry(3, 3, 0.4, geometrySegments)
    const coin = new THREE.Mesh(geometry, materials)
    
    scene.add(coin)
    coinRef.current = coin

    // IMPORTANT: Set initial rotation with 90-degree forward tilt
    coin.rotation.x = -Math.PI / 2  // Start showing heads tilted 90° forward
    coin.rotation.y = Math.PI / 2   // Initial orientation

    // Animation loop
    const animate = () => {
      if (!coinRef.current || !rendererRef.current) return

      const coin = coinRef.current
      const time = Date.now() * 0.001
      
      // Handle different states
      if (isAnimatingRef.current) {
        // Flip animation is handled separately - DON'T INTERFERE
      } else if ((chargingPlayer || isCharging) && !isAnimatingRef.current && !isMobile) {
        // CHARGING EFFECTS - DISABLED ON MOBILE
        const intensity = (creatorPower + joinerPower) / 20 // Use total power for intensity
        const chargeIntensity = Math.min(1, intensity * 2) // More dramatic scaling
        
        // MOVEMENT EFFECTS ONLY - NO ROTATION
        coin.position.y = Math.sin(time * 12) * 0.25 * (1 + chargeIntensity)
        
        // VIOLENT PULSING SCALE
        const pulseScale = 1 + Math.sin(time * 15) * 0.15 * chargeIntensity
        coin.scale.set(pulseScale, pulseScale, pulseScale)
        
        // INTENSE MATERIAL EFFECTS - PINK ELECTRIC ENERGY
        materials.forEach((material, index) => {
          if (material.emissiveIntensity !== undefined) { // Only for StandardMaterial
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
          }
        })
        
        // Add random jitter for frenzied effect
        coin.position.x = Math.sin(time * 30) * 0.03 * chargeIntensity
        coin.position.z = Math.cos(time * 35) * 0.03 * chargeIntensity
        
      } else if (!isAnimatingRef.current) {
        // Reset effects when not charging
        if (!isMobile) {
          materials.forEach(material => {
            if (material.emissiveIntensity !== undefined) {
              material.emissiveIntensity = 0.4
              material.emissive.setHex(0x554400) // Back to gold
              material.metalness = 0.6
              material.roughness = 0.1
            }
          })
        }
        coin.scale.set(1, 1, 1)
        coin.position.x = 0
        coin.position.z = 0
        coin.position.y = 0 // Keep coin at rest position
        
        // NO IDLE ROTATION - Coin stays at its current position
      }

      rendererRef.current.render(scene, camera)
      animationIdRef.current = requestAnimationFrame(animate)
    }

    // Start animation with reduced framerate on mobile
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

  // NEW: Update textures and rotation when player choices change
  useEffect(() => {
    if (!coinRef.current || !sceneRef.current) return
    
    console.log('🎨 Updating coin due to choice change:', {
      creatorChoice,
      joinerChoice,
      isCreator,
      flipResult,
      isAnimating: isAnimatingRef.current
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
    
    // ONLY show the player's chosen side if we're in the choosing phase AND no flip has happened yet
    // If a flip has already happened, keep the coin on the last result
    const myChoice = isCreator ? creatorChoice : joinerChoice
    if (myChoice && !isAnimatingRef.current && !flipResult) {
      console.log('🎯 Setting coin to show chosen side (no previous flip):', myChoice)
      if (myChoice === 'heads') {
        coin.rotation.x = -Math.PI / 2 // Show heads tilted 90° forward
      } else if (myChoice === 'tails') {
        coin.rotation.x = Math.PI / 2 // Show tails tilted 90° forward
      }
    } else if (flipResult && !isAnimatingRef.current) {
      // If we have a flip result and we're not animating, stay on that result
      console.log('🎯 Keeping coin on last flip result:', flipResult)
      if (flipResult === 'heads') {
        coin.rotation.x = -Math.PI / 2 // Show heads tilted 90° forward
      } else if (flipResult === 'tails') {
        coin.rotation.x = Math.PI / 2 // Show tails tilted 90° forward
      }
    }
  }, [creatorChoice, joinerChoice, isCreator, flipResult])

  // Removed pre-calculation logic - result will be determined on server instantly when released

  // DETERMINISTIC FLIP ANIMATION - Guaranteed perfect landing
  useEffect(() => {
    if (!isFlipping || !flipResult || !flipDuration || !coinRef.current) {
      return
    }

    console.log('🎬 Starting DETERMINISTIC flip animation:', { 
      flipResult, 
      flipDuration, 
      totalPower: creatorPower + joinerPower
    })
    
    // FORCE STOP any current animation
    if (isAnimatingRef.current) {
      console.log('⚠️ Stopping existing animation')
      isAnimatingRef.current = false
    }
    
    // Short delay to ensure state is clean
    setTimeout(() => {
      if (!coinRef.current) return
      
      isAnimatingRef.current = true
      const coin = coinRef.current
      
      // RESET COIN TO CLEAN STATE (except rotation)
      coin.scale.set(1, 1, 1)
      coin.position.x = 0
      coin.position.y = 0
      coin.position.z = 0
      
      // Get starting position (should be showing the last flip result or player's choice)
      const startRotation = coin.rotation.x
      const myChoice = isCreator ? creatorChoice : joinerChoice
      
      // Calculate power-based rotations
      const totalPower = creatorPower + joinerPower
      const powerRatio = Math.min(totalPower / 10, 1)
      
      // Base spins determined by power (5 to 30 full rotations)
      const minSpins = 5
      const maxSpins = 30
      const baseSpins = minSpins + Math.floor(powerRatio * (maxSpins - minSpins))
      
      // SIMPLIFIED DETERMINISTIC CALCULATION:
      // Calculate how many half-flips we need to go from current position to target result
      const currentSide = startRotation === -Math.PI / 2 ? 'heads' : 'tails'
      const needsToFlip = currentSide !== flipResult
      const halfFlips = baseSpins * 2 + (needsToFlip ? 1 : 0) // Odd if we need to flip, even if we don't
      
      // Total rotation in radians
      const totalRotation = halfFlips * Math.PI
      
      console.log('🎲 SIMPLIFIED DETERMINISTIC Flip calculations:', { 
        totalPower,
        powerRatio: powerRatio.toFixed(2),
        myChoice,
        flipResult,
        currentSide,
        needsToFlip,
        baseSpins,
        halfFlips,
        startingSide: currentSide,
        targetSide: flipResult,
        flipDuration: flipDuration + 'ms'
      })
      
      const flipStartTime = Date.now()
      
      const animateFlip = () => {
        if (!isAnimatingRef.current || !coinRef.current) return
        
        const elapsed = Date.now() - flipStartTime
        const progress = Math.min(elapsed / flipDuration, 1)
        
        if (progress < 1) {
          // Enhanced easing for dramatic slowdown
          let easedProgress
          if (progress < 0.7) {
            // Fast spinning for first 70%
            easedProgress = progress / 0.7 * 0.85
          } else {
            // Dramatic slowdown for last 30%
            const slowPhase = (progress - 0.7) / 0.3
            easedProgress = 0.85 + (1 - Math.pow(1 - slowPhase, 4)) * 0.15
          }
          
          // Apply rotation
          coin.rotation.x = startRotation + (totalRotation * easedProgress)
          
          // Vertical motion - higher with more power
          const jumpHeight = 0.5 + (powerRatio * 1.0)
          coin.position.y = Math.sin(progress * Math.PI) * jumpHeight
          
          // Dynamic wobble that increases then decreases
          const wobbleIntensity = Math.sin(progress * Math.PI) * 0.03
          coin.rotation.z = Math.sin(elapsed * 0.015) * wobbleIntensity
          
          // Slight forward/backward motion for drama
          coin.position.z = Math.sin(progress * Math.PI * 2) * 0.1
          
          requestAnimationFrame(animateFlip)
        } else {
          // PERFECT LANDING - deterministic result with 90-degree forward tilt
          if (flipResult === 'heads') {
            coin.rotation.x = -Math.PI / 2 // Heads tilted 90° forward
          } else {
            coin.rotation.x = Math.PI / 2 // Tails tilted 90° forward
          }
          
          // Reset all other properties
          coin.rotation.y = Math.PI / 2
          coin.rotation.z = 0
          coin.position.y = 0
          coin.position.x = 0
          coin.position.z = 0
          coin.scale.set(1, 1, 1)
          
          isAnimatingRef.current = false
          console.log('✅ DETERMINISTIC flip complete - landed PERFECTLY on:', flipResult, 'with 90° tilt')
        }
      }
      
      // Start the animation
      animateFlip()
      
    }, 50) // Small delay to ensure clean state
    
    // Cleanup function
    return () => {
      isAnimatingRef.current = false
    }
  }, [isFlipping, flipResult, flipDuration, creatorPower, joinerPower, creatorChoice, joinerChoice, isCreator])

  // Enhanced power charge handler
  const handlePowerChargeStart = (e) => {
    if (!isPlayerTurn || !onPowerCharge) return
    
    console.log('🎮 Coin clicked - starting charge')
    
    // Call original handler
    onPowerCharge(e)
  }

  return (
    <div
      ref={mountRef}
      onMouseDown={isPlayerTurn ? handlePowerChargeStart : undefined}
      onMouseUp={isPlayerTurn ? onPowerRelease : undefined}
      onMouseLeave={isPlayerTurn ? onPowerRelease : undefined}
      onTouchStart={isPlayerTurn ? handlePowerChargeStart : undefined}
      onTouchEnd={isPlayerTurn ? onPowerRelease : undefined}
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
        // Subtle outer ring when charging
        border: chargingPlayer ? '2px solid rgba(255, 20, 147, 0.6)' : '1px solid rgba(255, 215, 0, 0.3)',
        animation: chargingPlayer ? 'chargingRingPulse 0.3s ease-in-out infinite' : 'none',
        position: 'relative'
      }}
    >
      <canvas style={{ width: '100%', height: '100%' }} />
      
      {/* Debug overlay - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute',
          top: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '0.5rem',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          whiteSpace: 'nowrap',
          zIndex: 10,
          pointerEvents: 'none'
        }}>
          <div>Flip: {flipResult || 'none'}</div>
          <div>Choice: {isCreator ? creatorChoice : joinerChoice || 'none'}</div>
          <div>Flipping: {isFlipping ? 'yes' : 'no'}</div>
          <div>Animating: {isAnimatingRef.current ? 'yes' : 'no'}</div>
        </div>
      )}
    </div>
  )
}

export default ReliableGoldCoin 