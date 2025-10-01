import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

// Add CSS animations
const powerChargeAnimation = `
  @keyframes powerCharge {
    0% { background: linear-gradient(90deg, #FFD700, #FFA500, #FF6B00); }
    50% { background: linear-gradient(90deg, #FFA500, #FF6B00, #FFD700); }
    100% { background: linear-gradient(90deg, #FF6B00, #FFD700, #FFA500); }
  }
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
`

// Inject the CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = powerChargeAnimation
  document.head.appendChild(style)
}

// MODIFICATION 1: Add power configurations array (original durations restored)
const powerConfigs = [
  { minFlips: 5, duration: 2000, speed: 1 },     // Level 1
  { minFlips: 6, duration: 3000, speed: 1.2 },   // Level 2
  { minFlips: 7, duration: 4000, speed: 1.4 },   // Level 3
  { minFlips: 8, duration: 5000, speed: 1.6 },   // Level 4
  { minFlips: 9, duration: 6000, speed: 1.8 },   // Level 5
  { minFlips: 10, duration: 7000, speed: 2 },    // Level 6
  { minFlips: 12, duration: 8000, speed: 2.3 },  // Level 7
  { minFlips: 14, duration: 10000, speed: 2.6 }, // Level 8
  { minFlips: 16, duration: 12000, speed: 3 },   // Level 9
  { minFlips: 20, duration: 15000, speed: 3.5 }  // Level 10
];

const OptimizedGoldCoin = React.memo(({
  isFlipping = false,
  flipResult = null,
  flipDuration = 2000,
  isPlayerTurn = false,
  onPowerCharge,
  onPowerRelease,
  chargingPlayer = null,
  creatorPower = 0,
  joinerPower = 0,
  size = 300,
  creatorChoice = null,
  joinerChoice = null,
  isCreator = false,
  customHeadsImage = null,
  customTailsImage = null,
  gamePhase = 'choosing',
  material = null,
  isInteractive = false,
  onCoinClick = null,
  onFlipComplete = null,
}) => {
  // Add performance throttling for mobile
  const [frameRate, setFrameRate] = useState(30) // Default to 30 FPS to save resources
  
  useEffect(() => {
    // Keep at 30 FPS for better performance
    setFrameRate(30)
  }, [])
  // Add missing state variables
  const [currentPower, setCurrentPower] = useState(0)
  const [powerInterval, setPowerInterval] = useState(null)
  const [isCharging, setIsCharging] = useState(false)
  // Debug logs removed to reduce console spam
  
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

  // Function to apply material physics to power configurations
  const applyMaterialPhysics = (config, material) => {
    if (!material || !material.physics) return config
    
    const { speedMultiplier = 1.0, durationMultiplier = 1.0, wobbleIntensity = 1.0 } = material.physics
    
    return {
      ...config,
      duration: Math.round(config.duration * durationMultiplier),
      speed: config.speed * speedMultiplier,
      wobbleIntensity: wobbleIntensity
    }
  }

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
      return perfLevel === 'low' ? 24 : 32
    }
    
    switch (perfLevel) {
      case 'low': return 32
      case 'medium': return 48
      case 'high': return 64
      default: return 48
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

    const size = performanceRef.current.level === 'low' ? 256 : 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    if (type === 'edge') {
      // Clean white edge pattern with subtle texture
      ctx.fillStyle = '#F8F8F8' // Slightly off-white for depth
      ctx.fillRect(0, 0, size, size)
      
      // Add subtle vertical lines for coin edge texture
      ctx.strokeStyle = '#E0E0E0' // Very light gray lines
      ctx.lineWidth = 2
      for (let i = 0; i < size; i += 12) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, size)
        ctx.stroke()
      }
    } else {
      // For heads/tails, keep transparent if no custom image
      ctx.clearRect(0, 0, size, size)
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    textureCache.current[cacheKey] = texture
    return texture
  }

  // Initialize scene
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return

    // Creating new Three.js scene for OptimizedGoldCoin

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
    // MODIFICATION 7: Camera adjustment for better edge viewing
    camera.position.set(0, 3, 10) // Slightly higher and further back
    camera.lookAt(0, 0, 0)

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

    // Enhanced lighting setup for white coin
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3) // Good ambient lighting
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0) // Main directional light
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Add subtle spot light for definition
    const spotLight = new THREE.SpotLight(0xffffff, 0.6) // White spot light
    spotLight.position.set(0, 10, 5)
    spotLight.angle = Math.PI / 6
    spotLight.penumbra = 0.1
    spotLight.decay = 2
    spotLight.distance = 20
    scene.add(spotLight)

    // Add fill light from below for better definition
    const fillLight = new THREE.DirectionalLight(0xFFFFFF, 0.4)
    fillLight.position.set(0, -3, 5)
    scene.add(fillLight)

    // Get material edge color or default to white
    const edgeColor = material?.edgeColor ? parseInt(material.edgeColor.replace('#', '0x')) : 0xFFFFFF
    
    // Create materials with better reflectivity for white coin
    const materials = [
      new THREE.MeshStandardMaterial({ 
        map: createOptimizedTexture('edge'),
        metalness: 0.3,
        roughness: 0.2,
        color: edgeColor, // Use material's edge color
        emissive: 0x222222, // Subtle glow
        emissiveIntensity: 0.1
      }),
      new THREE.MeshStandardMaterial({ 
        map: createOptimizedTexture('heads', customHeadsImage),
        metalness: 0.3,
        roughness: 0.2,
        color: 0xFFFFFF, // Pure white
        emissive: 0x222222, // Subtle glow
        emissiveIntensity: 0.1
      }),
      new THREE.MeshStandardMaterial({ 
        map: createOptimizedTexture('tails', customTailsImage),
        metalness: 0.3,
        roughness: 0.2,
        color: 0xFFFFFF, // Pure white
        emissive: 0x222222, // Subtle glow
        emissiveIntensity: 0.1
      })
    ]

    // Create coin with dynamic segments
    const segments = getGeometrySegments()
    const geometry = new THREE.CylinderGeometry(3, 3, 0.4, segments)
    const coin = new THREE.Mesh(geometry, materials)
    
    // MODIFICATION 6: Make the coin edge thicker so it looks good standing up
    coin.scale.y = 1.5 // Makes the edge 50% thicker
    
    scene.add(coin)
    coinRef.current = coin

    // Set initial rotation - clean wheel-like orientation
    coin.rotation.x = 0 // Start flat
    coin.rotation.y = Math.PI / 2 // Rotated 90 degrees left for proper facing
    coin.rotation.z = 0 // No tilt

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
        // Idle state - very slow, gentle rotation
        coin.scale.set(1, 1, 1)
        coin.position.x = 0
        coin.position.y = 0
        coin.position.z = 0
        // Even slower rotation - about 1 full rotation per 360 seconds
        coin.rotation.x += 0.000017
      }

      renderer.render(scene, camera)
      animationIdRef.current = requestAnimationFrame(animate)
    }

    // Start animation with frame rate throttling
    let lastTime = 0
    const targetFPS = frameRate
    const frameInterval = 1000 / targetFPS

    const throttledAnimate = (currentTime) => {
      const deltaTime = currentTime - lastTime
      
      if (deltaTime > frameInterval) {
        animate()
        lastTime = currentTime - (deltaTime % frameInterval)
      }
      
      animationIdRef.current = requestAnimationFrame(throttledAnimate)
    }
    
    animationIdRef.current = requestAnimationFrame(throttledAnimate)

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      
      // Cleaning up OptimizedGoldCoin Three.js scene
      
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
  }, [customHeadsImage, customTailsImage])

  // MODIFICATION 3: New landing function to make coin stand on edge
  const landOnEdge = (targetRotation, isHeads) => {
    if (!coinRef.current) return
    
    const landingDuration = 200; // Fast landing for quick winner announcement
    const startTime = Date.now();
    const coin = coinRef.current
    const startRotation = {
      x: coin.rotation.x,
      y: coin.rotation.y,
      z: coin.rotation.z
    };
    
    // Calculate the nearest edge position
    const currentRotations = Math.floor(startRotation.x / (Math.PI * 2));
    const finalRotationX = currentRotations * Math.PI * 2 + targetRotation;
    
    const animateLanding = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / landingDuration, 1);
      
      // Smooth easing for landing
      const easeInOut = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      // Rotate to target edge position (standing upright)
      coin.rotation.x = startRotation.x + (finalRotationX - startRotation.x) * easeInOut;
      
      // Always maintain proper orientation
      coin.rotation.y = Math.PI / 2; // Maintain 90-degree left rotation
      coin.rotation.z = 0;
      
      // Ensure coin is at ground level
      coin.position.y = 0;
      
      // Add a subtle bounce effect when landing
      if (progress < 0.3) {
        coin.position.y = Math.sin(progress * 10) * 0.1 * (1 - progress * 3);
      }
      
      if (progress < 1) {
        requestAnimationFrame(animateLanding);
      } else {
        // Ensure perfect edge alignment
        coin.rotation.x = finalRotationX;
        coin.rotation.y = Math.PI / 2; // Maintain 90-degree left rotation
        coin.rotation.z = 0;
        
        // Animation complete - winner should be announced immediately now
        isAnimatingRef.current = false;
        console.log('🏁 Desktop coin animation fully complete - winner should be announced now');
        
        // Call onFlipComplete callback if provided
        if (onFlipComplete) {
          onFlipComplete();
        }
      }
    };
    
    animateLanding();
  };

  // MODIFICATION 2: Replace your existing flipCoin function
  useEffect(() => {
    if (!isFlipping || !flipResult || !coinRef.current) return
    
    const flipCoin = () => {
      if (isAnimatingRef.current) return;
      
      isAnimatingRef.current = true;
      const coin = coinRef.current;
      
      // Calculate power level from creator and joiner power (1-10)
      const totalPower = (creatorPower || 0) + (joinerPower || 0);
      const powerLevel = Math.max(1, Math.min(10, Math.ceil(totalPower)));
      
      // Get power configuration based on current power level and apply material physics
      const baseConfig = powerConfigs[Math.max(0, powerLevel - 1)];
      const config = applyMaterialPhysics(baseConfig, material);
      const { minFlips, duration, speed, wobbleIntensity = 1.0 } = config;
      
      // Calculate total rotation to ensure minimum flips
      const rotationsPerFlip = Math.PI * 2;
      const baseRotation = minFlips * rotationsPerFlip;
      const extraRotation = Math.random() * Math.PI * 4; // Add some randomness
      const totalRotation = baseRotation + extraRotation;
      
      // Determine result (using flipResult)
      const isHeads = flipResult === 'heads';
      
      // For edge landing: the coin will stand upright
      // 0 rotation = north edge down (heads), π rotation = south edge down (tails)
      const targetEdgeRotation = isHeads ? 0 : Math.PI;
      
      // Animation variables
      const startTime = Date.now();
      const startRotation = {
        x: coin.rotation.x,
        y: coin.rotation.y,
        z: coin.rotation.z
      };
      
      // Initial launch parameters (reduced by half)
      const launchHeight = (5 + (powerLevel * 0.5)) / 2; // Reduced height by half
      const spinSpeed = speed;
      
      const animateFlip = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for realistic motion
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        // Height animation (parabolic arc)
        const heightProgress = Math.sin(progress * Math.PI);
        coin.position.y = heightProgress * launchHeight;
        
        // Rotation animation with speed multiplier (X-axis only - like a wheel)
        coin.rotation.x = startRotation.x + (totalRotation * easeOut * spinSpeed);
        
        // Apply wobble effects based on material physics
        const wobbleAmount = wobbleIntensity * 0.1 * Math.sin(elapsed * 0.01) * (1 - progress);
        coin.rotation.y = Math.PI / 2 + wobbleAmount; // Add wobble to Y rotation
        coin.rotation.z = wobbleAmount * 0.5; // Add subtle Z wobble
        
        if (progress < 1) {
          requestAnimationFrame(animateFlip);
        } else {
          // Start landing sequence
          landOnEdge(targetEdgeRotation, isHeads);
        }
      };
      
      animateFlip();
    };
    
    flipCoin();
    
    return () => {
      isAnimatingRef.current = false;
    };
  }, [isFlipping, flipResult, flipDuration, creatorPower, joinerPower])

  // Mouse Events
  const handleMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Handle demo coin click (interactive mode)
    if (isInteractive && onCoinClick) {
      console.log('🪙 Demo coin clicked')
      onCoinClick()
      return
    }
    
    // For battle royale, allow interaction if it's player's turn and correct phase
    const hasMadeChoice = (isCreator && creatorChoice) || (!isCreator && joinerChoice)
    
    console.log('🖱️ Mouse down - checking conditions:', {
      isPlayerTurn,
      gamePhase,
      chargingPlayer,
      isCharging,
      hasMadeChoice,
      canInteract: isPlayerTurn && gamePhase === 'charging_power'
    })
    
    // Battle Royale logic - check if it's player's turn and correct phase
    if (!isPlayerTurn || gamePhase !== 'charging_power') {
      console.log('❌ Cannot interact with coin - not player turn or wrong phase')
      return
    }
    
    if (isCharging || chargingPlayer) {
      console.log('❌ Already charging or someone else is charging')
      return
    }
    
    setIsCharging(true)
    setCurrentPower(0)
    
    // Start power charging
    if (onPowerCharge) {
      console.log('⚡ Starting power charge')
      onPowerCharge()
    }
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    
    const startTime = Date.now()
    
    const powerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newPower = Math.min(10, (elapsed / 200)) // 2 seconds to reach max power
      
      setCurrentPower(newPower)
      
      if (newPower >= 10) {
        clearInterval(powerInterval)
      }
    }, 50) // Update every 50ms for smooth animation
    
    setPowerInterval(powerInterval)
  }

  const handleMouseUp = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isCharging) return
    
    console.log('🖱️ Mouse up - releasing power:', currentPower)
    
    setIsCharging(false)
    
    if (powerInterval) {
      clearInterval(powerInterval)
      setPowerInterval(null)
    }
    
    // Send power level
    if (onPowerRelease && currentPower > 0) {
      console.log('⚡ Releasing power:', currentPower)
      onPowerRelease(currentPower)
    }
    
    // Keep the power level visible briefly
    setTimeout(() => {
      setCurrentPower(0)
    }, 1000)
  }

  // Touch Events (for mobile)
  const handleTouchStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Handle demo coin click (interactive mode)
    if (isInteractive && onCoinClick) {
      console.log('🪙 Demo coin touched')
      onCoinClick()
      return
    }
    
    // For battle royale, allow interaction if it's player's turn and correct phase
    const hasMadeChoice = (isCreator && creatorChoice) || (!isCreator && joinerChoice)
    
    console.log('📱 Touch start - checking conditions:', {
      isPlayerTurn,
      gamePhase,
      chargingPlayer,
      isCharging,
      hasMadeChoice
    })
    
    // Battle Royale logic - check if it's player's turn and correct phase
    if (!isPlayerTurn || gamePhase !== 'charging_power') {
      console.log('❌ Cannot interact with coin - not player turn or wrong phase')
      return
    }
    
    if (isCharging || chargingPlayer) {
      console.log('❌ Already charging or someone else is charging')
      return
    }
    
    setIsCharging(true)
    setCurrentPower(0)
    
    // Start power charging
    if (onPowerCharge) {
      console.log('⚡ Starting power charge (touch)')
      onPowerCharge()
    }
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    
    const startTime = Date.now()
    
    const powerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newPower = Math.min(10, (elapsed / 200)) // 2 seconds to reach max power
      
      setCurrentPower(newPower)
      
      if (newPower >= 10) {
        clearInterval(powerInterval)
      }
    }, 50)
    
    setPowerInterval(powerInterval)
  }

  const handleTouchEnd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isCharging) return
    
    console.log('📱 Touch end - releasing power:', currentPower)
    
    setIsCharging(false)
    
    if (powerInterval) {
      clearInterval(powerInterval)
      setPowerInterval(null)
    }
    
    // Send power level
    if (onPowerRelease && currentPower > 0) {
      console.log('⚡ Releasing power (touch):', currentPower)
      onPowerRelease(currentPower)
    }
    
    // Keep the power level visible briefly
    setTimeout(() => {
      setCurrentPower(0)
    }, 1000)
  }

  // Helper functions for styling
  const getCoinBackground = () => {
    if (isCharging) {
      return 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,165,0,0.2) 50%, transparent 100%)'
    }
    return 'transparent'
  }

  const getBorderColor = () => {
    if (isCharging) return '#FFD700'
    if (isPlayerTurn && gamePhase === 'charging_power') return '#FFA500'
    return '#666'
  }

  const getBoxShadow = () => {
    if (isCharging) {
      return '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 165, 0, 0.4)'
    }
    if (isPlayerTurn && gamePhase === 'charging_power') {
      return '0 0 10px rgba(255, 165, 0, 0.5)'
    }
    return 'none'
  }

  const getAnimation = () => {
    if (isCharging) return 'pulse 0.5s ease-in-out infinite'
    return 'none'
  }

  const getCurrentCoinImage = () => {
    // This would need to be implemented based on your coin image logic
    // For now, return a default image
    return customHeadsImage || '/images/Heads.webp'
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none'
      }}
    >
      {/* Three.js Coin Canvas */}
      <div
        ref={mountRef}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: 'relative',
          cursor: (isInteractive || (isPlayerTurn && gamePhase === 'charging_power')) ? 'pointer' : 'default',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none'
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // Also release on mouse leave
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd} // Also release on touch cancel
      />
      
      {/* Power Level Display */}
      {(isCharging || currentPower > 0) && (
        <div
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '0.5rem 1rem',
            borderRadius: '1rem',
            border: '2px solid #FFD700',
            textAlign: 'center',
            minWidth: '120px'
          }}
        >
          <div style={{
            color: '#FFD700',
            fontSize: '1rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            POWER: {currentPower.toFixed(1)}/10
          </div>
          
          <div style={{
            height: '8px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${(currentPower / 10) * 100}%`,
              background: isCharging ? 
                'linear-gradient(90deg, #FFD700, #FFA500, #FF6B00)' : 
                '#FFD700',
              borderRadius: '4px',
              transition: 'width 0.1s ease',
              animation: isCharging ? 'powerCharge 0.5s linear infinite' : 'none'
            }} />
          </div>
        </div>
      )}
    </div>
  )
})

export default OptimizedGoldCoin 