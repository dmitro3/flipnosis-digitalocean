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
  size = 400, // NEW: size prop for responsive coin
  onPreCalculatedResult = null // NEW: callback for pre-calculated result
}) => {
  const mountRef = useRef(null)
  const coinRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const animationIdRef = useRef(null)
  const isAnimatingRef = useRef(false)
  const texturesRef = useRef({}) // Store preloaded textures
  const isMobile = isMobileDevice() // Detect mobile once
  
  // NEW: Track when charging started and pre-calculated result
  const [chargingStarted, setChargingStarted] = useState(false)
  const preCalculatedResultRef = useRef(null)
  
  // MOBILE OPTIMIZATION: Reduce size for mobile
  const effectiveSize = isMobile ? Math.min(size, 200) : size
  
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
    
    return { headsColor, tailsColor }
  }

  // Create procedural gold textures with dynamic colors - OPTIMIZED FOR MOBILE
  const createGoldTexture = (type, size = 512) => {
    // Check if we have a cached texture for this type and color combo
    const { headsColor, tailsColor } = getTextColors()
    const cacheKey = `${type}-${type === 'heads' ? headsColor : type === 'tails' ? tailsColor : 'default'}`
    
    if (texturesRef.current[cacheKey]) {
      return texturesRef.current[cacheKey]
    }

    const canvas = document.createElement('canvas')
    // MOBILE OPTIMIZATION: Much smaller textures
    const textureSize = isMobile ? 128 : size
    canvas.width = textureSize
    canvas.height = textureSize
    const ctx = canvas.getContext('2d')

    if (type === 'heads') {
      // SIMPLIFIED gradient for mobile
      if (isMobile) {
        ctx.fillStyle = '#FFD700'
        ctx.fillRect(0, 0, textureSize, textureSize)
      } else {
        const gradient = ctx.createRadialGradient(textureSize/2, textureSize/2, 0, textureSize/2, textureSize/2, textureSize/2)
        gradient.addColorStop(0, '#FFEF94')
        gradient.addColorStop(0.5, '#FFD700')
        gradient.addColorStop(0.8, '#DAA520')
        gradient.addColorStop(1, '#B8860B')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, textureSize, textureSize)
      }
      
      // Simplified text for mobile
      ctx.fillStyle = headsColor
      ctx.font = `bold ${textureSize * 0.25}px Hyperwave`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('HEADS', textureSize/2, textureSize/2)
      
    } else if (type === 'tails') {
      // SIMPLIFIED gradient for mobile
      if (isMobile) {
        ctx.fillStyle = '#FFD700'
        ctx.fillRect(0, 0, textureSize, textureSize)
      } else {
        const gradient = ctx.createRadialGradient(textureSize/2, textureSize/2, 0, textureSize/2, textureSize/2, textureSize/2)
        gradient.addColorStop(0, '#FFEF94')
        gradient.addColorStop(0.5, '#FFD700')
        gradient.addColorStop(0.8, '#DAA520')
        gradient.addColorStop(1, '#B8860B')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, textureSize, textureSize)
      }
      
      // Simplified text for mobile
      ctx.fillStyle = tailsColor
      ctx.font = `bold ${textureSize * 0.25}px Hyperwave`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('TAILS', textureSize/2, textureSize/2)
      
    } else if (type === 'edge') {
      // Solid color for mobile
      ctx.fillStyle = '#FFD700'
      ctx.fillRect(0, 0, textureSize, textureSize)
      
      if (!isMobile) {
        // Only add pattern on desktop
        ctx.strokeStyle = '#B8860B'
        ctx.lineWidth = 2
        for (let i = 0; i < textureSize; i += 8) {
          ctx.beginPath()
          ctx.moveTo(i, 0)
          ctx.lineTo(i, textureSize)
          ctx.stroke()
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    
    // MOBILE: Lower anisotropy
    if (isMobile) {
      texture.anisotropy = 1
    }
    
    // Cache the texture
    texturesRef.current[cacheKey] = texture
    
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
      antialias: false, // ALWAYS FALSE for performance
      alpha: true,
      powerPreference: "low-power" // ALWAYS low power
    })
    
    renderer.setSize(effectiveSize, effectiveSize)
    renderer.setClearColor(0x000000, 0)
    
    // MOBILE: Cap pixel ratio at 1
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2))

    if (!mountRef.current.querySelector('canvas')) {
      mountRef.current.appendChild(renderer.domElement)
    }

    sceneRef.current = scene
    rendererRef.current = renderer

    // LIGHTING SETUP - MINIMAL ON MOBILE
    if (isMobile) {
      // Single ambient light for mobile
      const ambientLight = new THREE.AmbientLight(0xffffff, 2.0)
      scene.add(ambientLight)
    } else {
      // Desktop gets full lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 2.5)
      scene.add(ambientLight)

      const mainLight = new THREE.DirectionalLight(0xFFFFFF, 4.0)
      mainLight.position.set(0, 0, 10)
      scene.add(mainLight)

      const topLight = new THREE.DirectionalLight(0xFFE4B5, 3.0)
      topLight.position.set(0, 5, 5)
      scene.add(topLight)
    }

    // Create textures
    const textureHeads = createGoldTexture('heads')
    const textureTails = createGoldTexture('tails')
    const textureEdge = createGoldTexture('edge')

    // MOBILE: Don't repeat edge texture as much
    textureEdge.wrapS = THREE.RepeatWrapping
    textureEdge.repeat.set(isMobile ? 5 : 20, 1)

    const materials = isMobile ? [
      // Mobile uses MeshBasicMaterial
      new THREE.MeshBasicMaterial({ map: textureEdge }),
      new THREE.MeshBasicMaterial({ map: textureHeads }),
      new THREE.MeshBasicMaterial({ map: textureTails })
    ] : [
      // Desktop uses MeshStandardMaterial
      new THREE.MeshStandardMaterial({
        map: textureEdge,
        metalness: 0.6,
        roughness: 0.1,
        color: 0xFFFFCC,
        emissive: 0x443300,
        emissiveIntensity: 0.3
      }),
      new THREE.MeshStandardMaterial({
        map: textureHeads,
        metalness: 0.6,
        roughness: 0.1,
        color: 0xFFFFCC,
        emissive: 0x554400,
        emissiveIntensity: 0.4
      }),
      new THREE.MeshStandardMaterial({
        map: textureTails,
        metalness: 0.6,
        roughness: 0.1,
        color: 0xFFFFCC,
        emissive: 0x554400,
        emissiveIntensity: 0.4
      })
    ]

    // COIN GEOMETRY - VERY SIMPLE FOR MOBILE
    const geometrySegments = isMobile ? 16 : 64
    const geometry = new THREE.CylinderGeometry(3, 3, 0.4, geometrySegments)
    const coin = new THREE.Mesh(geometry, materials)
    
    scene.add(coin)
    coinRef.current = coin

    // Set initial rotation
    coin.rotation.x = 0 // Start showing heads
    coin.rotation.y = Math.PI / 2

    // SIMPLIFIED Animation loop
    let frameCount = 0
    const animate = () => {
      if (!coinRef.current || !rendererRef.current) return

      const coin = coinRef.current
      frameCount++
      
      // MOBILE: Skip frames for better performance
      if (isMobile && frameCount % 2 !== 0) {
        animationIdRef.current = requestAnimationFrame(animate)
        return
      }
      
      const time = Date.now() * 0.001
      
      // Handle different states
      if (isAnimatingRef.current) {
        // Flip animation is handled separately
      } else if (chargingPlayer && !isMobile) {
        // SIMPLE charging effect - DESKTOP ONLY
        const intensity = Math.min(1, (creatorPower + joinerPower) / 10)
        coin.position.y = Math.sin(time * 8) * 0.1 * intensity
        coin.scale.set(1 + intensity * 0.1, 1 + intensity * 0.1, 1 + intensity * 0.1)
      } else {
        // Idle state - very slow rotation
        coin.position.y = 0
        coin.scale.set(1, 1, 1)
        
        // MINIMAL idle rotation
        if (!isMobile) {
          coin.rotation.x += 0.002
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
      
      // Clear texture cache
      Object.values(texturesRef.current).forEach(texture => {
        texture.dispose()
      })
      texturesRef.current = {}
      
      sceneRef.current = null
      rendererRef.current = null
    }
  }, [headsImage, tailsImage, edgeImage, isMobile, effectiveSize])

  // Update textures when player choices change
  useEffect(() => {
    if (!coinRef.current || !sceneRef.current) return
    
    // Recreate textures with new colors
    const newHeadsTexture = createGoldTexture('heads')
    const newTailsTexture = createGoldTexture('tails')
    
    // Update materials
    const coin = coinRef.current
    if (coin.material && coin.material[1]) {
      if (coin.material[1].map) coin.material[1].map.dispose()
      coin.material[1].map = newHeadsTexture
      coin.material[1].needsUpdate = true
    }
    if (coin.material && coin.material[2]) {
      if (coin.material[2].map) coin.material[2].map.dispose()
      coin.material[2].map = newTailsTexture
      coin.material[2].needsUpdate = true
    }
  }, [creatorChoice, joinerChoice, isCreator])

  // SIMPLIFIED: Pre-calculate result when charging starts
  useEffect(() => {
    if (isCharging && !chargingStarted && isPlayerTurn) {
      console.log('⚡ Charging started - pre-calculating flip result')
      setChargingStarted(true)
      
      // Pre-calculate the result NOW
      const randomValue = Math.random()
      const result = randomValue < 0.5 ? 'heads' : 'tails'
      preCalculatedResultRef.current = result
      
      console.log('🎲 Pre-calculated result:', result)
      
      // Call the callback if provided
      if (onPreCalculatedResult) {
        onPreCalculatedResult(result)
      }
    } else if (!isCharging && chargingStarted) {
      setChargingStarted(false)
    }
  }, [isCharging, chargingStarted, isPlayerTurn, onPreCalculatedResult])

  // COMPLETELY REWRITTEN FLIP ANIMATION - SMOOTH AND PREDICTABLE
  useEffect(() => {
    if (!isFlipping || !flipResult || !coinRef.current) return

    console.log('🎬 Starting smooth flip animation:', { flipResult })
    
    isAnimatingRef.current = true
    const coin = coinRef.current
    
    // Reset coin state
    coin.scale.set(1, 1, 1)
    coin.position.set(0, 0, 0)
    
    // Get starting rotation
    const startRotation = coin.rotation.x
    
    // Calculate end rotation - ensure it lands flat
    const targetFace = flipResult === 'heads' ? 0 : Math.PI
    
    // Calculate total rotations based on power
    const totalPower = Math.max(1, creatorPower + joinerPower)
    const rotations = Math.min(8, 3 + Math.floor(totalPower / 2)) // 3-8 full rotations
    
    // Total rotation needed
    const totalRotation = (rotations * Math.PI * 2) + (targetFace - startRotation)
    
    let startTime = Date.now()
    
    const animateFlip = () => {
      if (!isAnimatingRef.current || !coinRef.current) return
      
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / flipDuration, 1)
      
      if (progress < 1) {
        // Smooth easing function
        const eased = 1 - Math.pow(1 - progress, 3) // Ease out cubic
        
        // Apply rotation
        coin.rotation.x = startRotation + (totalRotation * eased)
        
        // Simple arc motion
        coin.position.y = Math.sin(progress * Math.PI) * 0.5
        
        // Subtle wobble that decreases
        coin.rotation.z = Math.sin(progress * Math.PI * 4) * 0.03 * (1 - progress)
        
        requestAnimationFrame(animateFlip)
      } else {
        // PERFECT LANDING - Set exact rotation
        coin.rotation.x = flipResult === 'heads' ? 0 : Math.PI
        coin.rotation.y = Math.PI / 2
        coin.rotation.z = 0
        coin.position.set(0, 0, 0)
        coin.scale.set(1, 1, 1)
        
        isAnimatingRef.current = false
        preCalculatedResultRef.current = null
        
        console.log('✅ Flip complete - landed on:', flipResult)
      }
    }
    
    animateFlip()
    
    return () => {
      isAnimatingRef.current = false
    }
  }, [isFlipping, flipResult, flipDuration, creatorPower, joinerPower])

  // Enhanced power charge handler
  const handlePowerChargeStart = (e) => {
    if (!isPlayerTurn || !onPowerCharge) return
    console.log('🎮 Coin clicked - starting charge')
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
        width: effectiveSize,
        height: effectiveSize,
        cursor: isPlayerTurn ? 'pointer' : 'default',
        userSelect: 'none',
        background: chargingPlayer && !isMobile ? 
          'radial-gradient(circle, rgba(255, 20, 147, 0.15) 0%, transparent 100%)' : 
          'none',
        boxShadow: chargingPlayer && !isMobile ? 
          '0 0 30px rgba(255, 20, 147, 0.4)' : 
          'none',
        borderRadius: '50%',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

export default ReliableGoldCoin 