import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { isMobileDevice } from '../../utils/deviceDetection'

const EnhancedMobileCoin = ({ 
  isFlipping, 
  flipResult, 
  flipDuration = 3000,
  onPowerCharge, 
  onPowerRelease,
  isPlayerTurn,
  isCharging = false,
  chargingPlayer,
  gamePhase,
  creatorPower = 0,
  joinerPower = 0,
  creatorChoice = null,
  joinerChoice = null, 
  isCreator = false,
  headsImage = null,
  tailsImage = null,
  edgeImage = null,
  size = 300
}) => {
  const mountRef = useRef(null)
  const coinRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const animationIdRef = useRef(null)
  const isAnimatingRef = useRef(false)
  const currentCoinSideRef = useRef('heads')
  const velocityRef = useRef({ x: 0, y: 0, z: 0 })
  const texturesRef = useRef({})
  
  const isMobile = isMobileDevice()

  // Enhanced texture creation with better contrast for mobile
  const createEnhancedTexture = (type, size = 512) => {
    const canvas = document.createElement('canvas')
    const textureSize = isMobile ? 256 : size
    canvas.width = textureSize
    canvas.height = textureSize
    const ctx = canvas.getContext('2d')

    if (type === 'heads') {
      // High contrast gradient for better visibility during spin
      const gradient = ctx.createRadialGradient(textureSize/2, textureSize/2, 0, textureSize/2, textureSize/2, textureSize/2)
      gradient.addColorStop(0, '#FFFFFF')  // Pure white center
      gradient.addColorStop(0.3, '#FFD700') // Gold
      gradient.addColorStop(0.7, '#FFA500') // Orange
      gradient.addColorStop(1, '#CD853F')   // Dark edge
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, textureSize, textureSize)
      
      // Large, bold crown symbol
      ctx.fillStyle = '#000000'
      ctx.font = `bold ${textureSize * 0.25}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('♔', textureSize/2, textureSize/2 - textureSize * 0.05)
      
      // High contrast HEADS text
      ctx.fillStyle = creatorChoice === 'heads' || joinerChoice === 'heads' ? '#FF0000' : '#000000'
      ctx.font = `bold ${textureSize * 0.15}px Arial`
      ctx.fillText('HEADS', textureSize/2, textureSize/2 + textureSize * 0.15)
      
      // Strong border for definition
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = textureSize * 0.02
      ctx.beginPath()
      ctx.arc(textureSize/2, textureSize/2, textureSize * 0.45, 0, Math.PI * 2)
      ctx.stroke()
      
    } else if (type === 'tails') {
      // High contrast gradient
      const gradient = ctx.createRadialGradient(textureSize/2, textureSize/2, 0, textureSize/2, textureSize/2, textureSize/2)
      gradient.addColorStop(0, '#FFFFFF')  // Pure white center
      gradient.addColorStop(0.3, '#FFD700') // Gold
      gradient.addColorStop(0.7, '#FFA500') // Orange
      gradient.addColorStop(1, '#CD853F')   // Dark edge
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, textureSize, textureSize)
      
      // Large, bold diamond symbol
      ctx.fillStyle = '#000000'
      ctx.font = `bold ${textureSize * 0.25}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('♦', textureSize/2, textureSize/2 - textureSize * 0.05)
      
      // High contrast TAILS text
      ctx.fillStyle = creatorChoice === 'tails' || joinerChoice === 'tails' ? '#FF0000' : '#000000'
      ctx.font = `bold ${textureSize * 0.15}px Arial`
      ctx.fillText('TAILS', textureSize/2, textureSize/2 + textureSize * 0.15)
      
      // Strong border
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = textureSize * 0.02
      ctx.beginPath()
      ctx.arc(textureSize/2, textureSize/2, textureSize * 0.45, 0, Math.PI * 2)
      ctx.stroke()
      
    } else if (type === 'edge') {
      // High contrast edge pattern
      ctx.fillStyle = '#C0C0C0'  // Silver base
      ctx.fillRect(0, 0, textureSize, textureSize)
      
      // Bold reeding pattern
      ctx.strokeStyle = '#404040'
      ctx.lineWidth = 2
      for (let i = 0; i < textureSize; i += 6) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, textureSize)
        ctx.stroke()
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }

  // Natural physics-based easing function
  const easeOutBounce = (t) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
    }
  }

  // Smooth easing for more natural rotation
  const easeOutCubic = (t) => {
    return 1 - Math.pow(1 - t, 3)
  }

  // Initialize scene
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
    camera.position.set(0, 0, 8)

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,  // Keep antialias for smoother edges
      alpha: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(size, size)
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    renderer.domElement.style.display = 'block'
    renderer.domElement.style.margin = '0 auto'
    
    mountRef.current.appendChild(renderer.domElement)
    sceneRef.current = scene
    rendererRef.current = renderer

    // Optimized lighting for mobile
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Create materials - use StandardMaterial for better lighting
    const materials = [
      new THREE.MeshStandardMaterial({ 
        map: createEnhancedTexture('edge'),
        metalness: 0.7,
        roughness: 0.3,
        color: 0xFFFFFF
      }),
      new THREE.MeshStandardMaterial({ 
        map: createEnhancedTexture('heads'),
        metalness: 0.7,
        roughness: 0.3,
        color: 0xFFFFFF
      }),
      new THREE.MeshStandardMaterial({ 
        map: createEnhancedTexture('tails'),
        metalness: 0.7,
        roughness: 0.3,
        color: 0xFFFFFF
      })
    ]

    // Better geometry - more segments for smoother appearance
    const geometrySegments = isMobile ? 48 : 64  // Increased from 16-32
    const geometry = new THREE.CylinderGeometry(3, 3, 0.4, geometrySegments)
    const coin = new THREE.Mesh(geometry, materials)
    
    scene.add(coin)
    coinRef.current = coin

    // Set initial position - heads showing
    coin.rotation.x = -Math.PI / 2
    coin.rotation.y = Math.PI / 2
    currentCoinSideRef.current = 'heads'

    // Enhanced animation loop with motion blur simulation
    const animate = () => {
      if (!coinRef.current || !rendererRef.current) return

      const coin = coinRef.current
      const time = Date.now() * 0.001
      
      if (isAnimatingRef.current) {
        // Flip animation is handled separately
      } else if ((chargingPlayer || isCharging) && !isAnimatingRef.current) {
        // Charging effects - keep them subtle for mobile
        const intensity = (creatorPower + joinerPower) / 20
        const chargeIntensity = Math.min(1, intensity)
        
        // Gentle floating motion
        coin.position.y = Math.sin(time * 6) * 0.1 * chargeIntensity
        
        // Subtle scale pulsing
        const pulseScale = 1 + Math.sin(time * 8) * 0.02 * chargeIntensity
        coin.scale.set(pulseScale, pulseScale, pulseScale)
        
        // Material glow effect
        materials.forEach(material => {
          if (material.emissiveIntensity !== undefined) {
            material.emissiveIntensity = Math.sin(time * 10) * 0.1 * chargeIntensity
            material.emissive.setHex(0x444400)
          }
        })
        
      } else {
        // Reset effects
        materials.forEach(material => {
          if (material.emissiveIntensity !== undefined) {
            material.emissiveIntensity = 0
          }
        })
        coin.scale.set(1, 1, 1)
        coin.position.set(0, 0, 0)
        
        // Very subtle idle animation
        coin.position.y = Math.sin(time * 2) * 0.01
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
      renderer.dispose()
    }
  }, [size, creatorChoice, joinerChoice, creatorPower, joinerPower])

  // Enhanced flip animation with natural physics
  useEffect(() => {
    if (!isFlipping || !flipResult || !flipDuration || !coinRef.current) {
      return
    }

    console.log('🎬 Starting enhanced mobile flip animation:', { flipResult, flipDuration })
    
    if (isAnimatingRef.current) {
      isAnimatingRef.current = false
    }
    
    setTimeout(() => {
      if (!coinRef.current) return
      
      isAnimatingRef.current = true
      const coin = coinRef.current
      
      // Reset coin state
      coin.scale.set(1, 1, 1)
      coin.position.set(0, 0, 0)
      
      const currentSide = currentCoinSideRef.current
      const needsToFlip = currentSide !== flipResult
      
      // Calculate power-based spins with more natural ranges
      const totalPower = creatorPower + joinerPower
      const powerRatio = Math.min(totalPower / 10, 1)
      
      // More natural spin counts (3-15 full rotations)
      const minSpins = 3
      const maxSpins = 15
      const baseSpins = minSpins + Math.floor(powerRatio * (maxSpins - minSpins))
      
      // Add randomness for more natural feel
      const randomExtra = (Math.random() - 0.5) * 2  // ±1 rotation
      const finalSpins = baseSpins + randomExtra
      
      const halfFlips = Math.floor(finalSpins * 2) + (needsToFlip ? 1 : 0)
      const totalRotation = halfFlips * Math.PI
      
      console.log('📊 Enhanced flip calculation:', {
        currentSide,
        targetSide: flipResult,
        needsToFlip,
        finalSpins: finalSpins.toFixed(1),
        halfFlips,
        totalRotation: (totalRotation * 180 / Math.PI).toFixed(0) + '°'
      })
      
      const startRotation = coin.rotation.x
      const flipStartTime = Date.now()
      
      // Add initial velocity for more natural start
      velocityRef.current = {
        x: 0.2 + powerRatio * 0.3,  // Initial angular velocity
        y: 0.1 + powerRatio * 0.2,  // Vertical velocity
        z: (Math.random() - 0.5) * 0.1  // Small random wobble
      }
      
      const animateFlip = () => {
        if (!isAnimatingRef.current || !coinRef.current) return
        
        const elapsed = Date.now() - flipStartTime
        const progress = Math.min(elapsed / flipDuration, 1)
        
        if (progress < 1) {
          // Enhanced easing with three phases
          let easedProgress
          if (progress < 0.1) {
            // Quick acceleration phase
            easedProgress = progress * 5  // Fast start
          } else if (progress < 0.8) {
            // Constant speed phase
            const midProgress = (progress - 0.1) / 0.7
            easedProgress = 0.5 + midProgress * 0.35
          } else {
            // Dramatic deceleration phase
            const endProgress = (progress - 0.8) / 0.2
            easedProgress = 0.85 + easeOutCubic(endProgress) * 0.15
          }
          
          // Apply rotation with enhanced motion
          coin.rotation.x = startRotation + (totalRotation * easedProgress)
          
          // Enhanced vertical motion with physics
          const jumpHeight = 0.3 + (powerRatio * 0.5)
          const verticalProgress = Math.sin(progress * Math.PI)
          coin.position.y = verticalProgress * jumpHeight
          
          // Dynamic wobble that varies with speed
          const speed = Math.abs(velocityRef.current.x * (1 - progress))
          const wobbleIntensity = speed * 0.02
          coin.rotation.z = Math.sin(elapsed * 0.02) * wobbleIntensity
          coin.rotation.y = Math.PI / 2 + Math.sin(elapsed * 0.015) * wobbleIntensity * 0.5
          
          // Slight horizontal drift for realism
          coin.position.x = Math.sin(progress * Math.PI * 3) * 0.05 * powerRatio
          coin.position.z = Math.cos(progress * Math.PI * 2) * 0.03 * powerRatio
          
          // Simulate air resistance on velocity
          velocityRef.current.x *= 0.998
          velocityRef.current.y *= 0.995
          velocityRef.current.z *= 0.999
          
          requestAnimationFrame(animateFlip)
        } else {
          // Animation complete - ensure exact final position
          const finalRotation = startRotation + totalRotation
          coin.rotation.x = finalRotation
          coin.rotation.y = Math.PI / 2
          coin.rotation.z = 0
          coin.position.set(0, 0, 0)
          
          // Update tracked side
          currentCoinSideRef.current = flipResult
          isAnimatingRef.current = false
          
          console.log('✅ Enhanced flip animation complete. Final side:', flipResult)
        }
      }
      
      animateFlip()
    }, 100)
  }, [isFlipping, flipResult, flipDuration, creatorPower, joinerPower])

  return (
    <div 
      ref={mountRef}
      style={{
        width: size,
        height: size,
        margin: '0 auto',
        cursor: isPlayerTurn ? 'pointer' : 'default',
        position: 'relative'
      }}
      onMouseDown={onPowerCharge}
      onMouseUp={onPowerRelease}
      onTouchStart={onPowerCharge}
      onTouchEnd={onPowerRelease}
    />
  )
}

export default EnhancedMobileCoin 