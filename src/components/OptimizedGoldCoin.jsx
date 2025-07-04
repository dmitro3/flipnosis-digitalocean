import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

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

const OptimizedGoldCoin = ({
  isFlipping = false,
  flipResult = null,
  flipDuration = 2000,
  isPlayerTurn = false,
  onPowerCharge,
  onPowerRelease,
  chargingPlayer = null,
  isCharging = false,
  creatorPower = 0,
  joinerPower = 0,
  size = 300,
  creatorChoice = null,
  joinerChoice = null,
  isCreator = false,
  customHeadsImage = null,
  customTailsImage = null,
}) => {
  console.log('🪙 OptimizedGoldCoin rendering with size:', size, 'props:', { isFlipping, flipResult, isPlayerTurn })
  console.log('🪙 Component timestamp:', Date.now()) // Cache buster
  
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
      // Restore clean white edge pattern
      ctx.fillStyle = '#F5F5F5'
      ctx.fillRect(0, 0, size, size)
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

    console.log('🪙 Creating new Three.js scene for OptimizedGoldCoin with size:', size)

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

    // Brighter lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2) // Increased from 0.8 to 1.2
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0) // Increased from 0.6 to 1.0
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Create materials with white color and better reflectivity - CACHE BUSTER
    console.log('🎨 Creating materials at:', Date.now())
    const materials = [
      new THREE.MeshPhongMaterial({ 
        map: createOptimizedTexture('edge'),
        color: 0xFFFFFF, // WHITE COIN - NO DUPLICATES
        shininess: 80,
        specular: 0x444444
      }),
      new THREE.MeshPhongMaterial({ 
        map: createOptimizedTexture('heads', customHeadsImage),
        color: 0xFFFFFF, // WHITE COIN - NO DUPLICATES
        shininess: 80,
        specular: 0x444444
      }),
      new THREE.MeshPhongMaterial({ 
        map: createOptimizedTexture('tails', customTailsImage),
        color: 0xFFFFFF, // WHITE COIN - NO DUPLICATES
        shininess: 80,
        specular: 0x444444
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
        // Idle animation
        if (perfLevel !== 'low') {
          coin.rotation.x += 0.003
          coin.position.y = Math.sin(time * 2) * 0.01
        }
        
        // Reset transforms
        coin.scale.set(1, 1, 1)
        coin.position.x = 0
        coin.position.z = 0
      }

      renderer.render(scene, camera)
      animationIdRef.current = requestAnimationFrame(animate)
    }

    // Start animation with optional frame limiting for low performance
    if (performanceRef.current.level === 'low') {
      let lastRender = 0
      const targetFPS = 30
      const frameDelay = 1000 / targetFPS

      const limitedAnimate = (timestamp) => {
        if (timestamp - lastRender >= frameDelay) {
          animate()
          lastRender = timestamp
        }
        animationIdRef.current = requestAnimationFrame(limitedAnimate)
      }
      
      limitedAnimate(0)
    } else {
      animate()
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      
      console.log('🪙 Cleaning up OptimizedGoldCoin Three.js scene')
      
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
  }, [customHeadsImage, customTailsImage, creatorChoice, joinerChoice])

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
      
      // Get power configuration based on current power level
      const config = powerConfigs[Math.max(0, powerLevel - 1)];
      const { minFlips, duration, speed } = config;
      
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
        
        // Keep Y and Z rotation stable (no wobble)
        coin.rotation.y = Math.PI / 2; // Maintain 90-degree left rotation
        coin.rotation.z = 0;
        
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

  // Touch/mouse handlers
  const handleInteractionStart = (e) => {
    if (!isPlayerTurn || !onPowerCharge) return
    e.preventDefault()
    onPowerCharge(e)
  }

  const handleInteractionEnd = (e) => {
    if (!isPlayerTurn || !onPowerRelease) return
    e.preventDefault()
    onPowerRelease(e)
  }

  return (
    <div
      ref={mountRef}
      onMouseDown={isPlayerTurn ? handleInteractionStart : undefined}
      onMouseUp={isPlayerTurn ? handleInteractionEnd : undefined}
      onMouseLeave={isPlayerTurn ? handleInteractionEnd : undefined}
      onTouchStart={isPlayerTurn ? handleInteractionStart : undefined}
      onTouchEnd={isPlayerTurn ? handleInteractionEnd : undefined}
      style={{
        width: size,
        height: size,
        cursor: isPlayerTurn ? 'pointer' : 'default',
        userSelect: 'none',
        touchAction: 'none',
        position: 'relative',
        margin: '0 auto',
        display: 'block',
        background: isCharging ? 
          `radial-gradient(circle, rgba(255,20,147,0.1) 0%, transparent 70%)` : 
          'transparent',
        transition: 'background 0.3s ease',
        borderRadius: '50%'
      }}
    />
  )
}

export default OptimizedGoldCoin 