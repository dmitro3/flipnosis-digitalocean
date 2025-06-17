import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { isMobileDevice, getDevicePerformanceTier } from '../utils/deviceDetection'

const MobileOptimizedGoldCoin = ({
  isFlipping = false,
  flipResult = null,
  flipDuration = 3000,
  creatorPower = 0,
  joinerPower = 0,
  isPlayerTurn = false,
  chargingPlayer = null,
  isCreator = false,
  creatorChoice = null,
  joinerChoice = null,
  onMouseDown,
  onMouseUp,
  size = 200
}) => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const coinRef = useRef(null)
  const isAnimatingRef = useRef(false)
  const targetAngleRef = useRef(Math.PI / 2)
  const animationFrameRef = useRef(null)

  // Mobile performance settings
  const deviceTier = getDevicePerformanceTier()
  const isMobile = isMobileDevice()
  
  const mobileSettings = {
    low: {
      segments: 16,
      textureSize: 256,
      maxFPS: 30,
      antialias: false,
      shadows: false,
      lighting: 'basic'
    },
    medium: {
      segments: 24,
      textureSize: 512,
      maxFPS: 45,
      antialias: false,
      shadows: false,
      lighting: 'standard'
    },
    high: {
      segments: 32,
      textureSize: 512,
      maxFPS: 60,
      antialias: true,
      shadows: true,
      lighting: 'enhanced'
    }
  }

  const settings = isMobile ? mobileSettings[deviceTier] : {
    segments: 64,
    textureSize: 1024,
    maxFPS: 60,
    antialias: true,
    shadows: true,
    lighting: 'enhanced'
  }

  // Frame limiter for mobile
  const frameLimiter = useRef({
    lastTime: 0,
    interval: 1000 / settings.maxFPS
  })

  // Mobile-optimized texture creation
  const createMobileTexture = (type) => {
    const canvas = document.createElement('canvas')
    canvas.width = settings.textureSize
    canvas.height = settings.textureSize
    const ctx = canvas.getContext('2d')

    // Simpler gradients for mobile
    if (type === 'heads') {
      // Simple gold gradient
      const gradient = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0,
        canvas.width/2, canvas.height/2, canvas.width/2
      )
      gradient.addColorStop(0, '#FFE55C')
      gradient.addColorStop(1, '#B8860B')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Simple crown symbol
      ctx.fillStyle = '#8B7355'
      ctx.font = `bold ${canvas.width * 0.2}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('♔', canvas.width/2, canvas.height/2)

    } else if (type === 'tails') {
      // Simple gold gradient
      const gradient = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0,
        canvas.width/2, canvas.height/2, canvas.width/2
      )
      gradient.addColorStop(0, '#FFE55C')
      gradient.addColorStop(1, '#B8860B')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Simple diamond symbol
      ctx.fillStyle = '#8B7355'
      ctx.font = `bold ${canvas.width * 0.2}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('♦', canvas.width/2, canvas.height/2)

    } else if (type === 'edge') {
      // Simple repeating pattern
      ctx.fillStyle = '#DAA520'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Simplified edge pattern
      ctx.strokeStyle = '#B8860B'
      ctx.lineWidth = 2
      for (let i = 0; i < canvas.width; i += 8) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, canvas.height)
        ctx.stroke()
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }

  // Initialize Three.js scene with mobile optimizations
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 1, 10)
    camera.position.set(0, 0, 6)

    const renderer = new THREE.WebGLRenderer({
      canvas: mountRef.current.querySelector('canvas') || document.createElement('canvas'),
      antialias: settings.antialias,
      alpha: true,
      powerPreference: isMobile ? 'low-power' : 'high-performance'
    })

    renderer.setSize(size, size)
    renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio)
    renderer.outputColorSpace = THREE.SRGBColorSpace

    // Mobile-optimized lighting
    if (settings.lighting === 'basic') {
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
      scene.add(ambientLight)
    } else if (settings.lighting === 'standard') {
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(5, 5, 5)
      scene.add(ambientLight, directionalLight)
    } else {
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
      directionalLight.position.set(5, 5, 5)
      const rimLight = new THREE.DirectionalLight(0xffd700, 0.3)
      rimLight.position.set(-3, 2, -5)
      scene.add(ambientLight, directionalLight, rimLight)
    }

    if (!mountRef.current.querySelector('canvas')) {
      mountRef.current.appendChild(renderer.domElement)
    }

    sceneRef.current = scene
    rendererRef.current = renderer

    // Create mobile-optimized coin
    const textureHeads = createMobileTexture('heads')
    const textureTails = createMobileTexture('tails')
    const textureEdge = createMobileTexture('edge')

    textureEdge.wrapS = THREE.RepeatWrapping
    textureEdge.repeat.set(isMobile ? 10 : 20, 1)

    // Simplified materials for mobile
    const materials = [
      // Edge material
      new THREE.MeshStandardMaterial({
        map: textureEdge,
        metalness: isMobile ? 0.7 : 0.9,
        roughness: isMobile ? 0.3 : 0.15,
        color: 0xFFE55C
      }),
      // Heads material
      new THREE.MeshStandardMaterial({
        map: textureHeads,
        metalness: isMobile ? 0.7 : 0.9,
        roughness: isMobile ? 0.3 : 0.15,
        color: 0xFFE55C
      }),
      // Tails material
      new THREE.MeshStandardMaterial({
        map: textureTails,
        metalness: isMobile ? 0.7 : 0.9,
        roughness: isMobile ? 0.3 : 0.15,
        color: 0xFFE55C
      })
    ]

    // Mobile-optimized geometry
    const geometry = new THREE.CylinderGeometry(3, 3, 0.4, settings.segments)
    const coin = new THREE.Mesh(geometry, materials)
    
    scene.add(coin)
    coinRef.current = coin

    coin.rotation.x = Math.PI / 2
    coin.rotation.y = Math.PI / 2

    // Mobile-optimized animation loop
    const animate = (currentTime) => {
      if (!coinRef.current || !rendererRef.current) return

      // Frame limiting for mobile
      if (isMobile) {
        const { lastTime, interval } = frameLimiter.current
        if (currentTime - lastTime < interval) {
          animationFrameRef.current = requestAnimationFrame(animate)
          return
        }
        frameLimiter.current.lastTime = currentTime
      }

      const coin = coinRef.current
      const time = currentTime * 0.001
      
      if (isAnimatingRef.current) {
        // Flip animation is handled separately
      } else if (chargingPlayer && !isAnimatingRef.current) {
        // Simplified charging effect for mobile
        if (isMobile) {
          coin.rotation.y += 0.02
          const scale = 1 + Math.sin(time * 8) * 0.05
          coin.scale.set(scale, scale, scale)
        } else {
          // Desktop charging effect
          coin.rotation.y += 0.05
          coin.rotation.z += 0.03
          const scale = 1 + Math.sin(time * 10) * 0.1
          coin.scale.set(scale, scale, scale)
          coin.position.y = Math.sin(time * 15) * 0.2
        }
      } else {
        // Idle animation - more subtle on mobile
        const idleSpeed = isMobile ? 0.3 : 0.5
        coin.rotation.y = Math.sin(time * idleSpeed) * 0.1
        coin.position.y = Math.sin(time * idleSpeed * 0.7) * (isMobile ? 0.05 : 0.1)
      }

      rendererRef.current.render(sceneRef.current, camera)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate(0)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      renderer.dispose()
      geometry.dispose()
      materials.forEach(mat => mat.dispose())
      textureHeads.dispose()
      textureTails.dispose()
      textureEdge.dispose()
    }
  }, [size, chargingPlayer])

  // Mobile-optimized flip animation
  useEffect(() => {
    if (!isFlipping || !flipResult || !flipDuration || !coinRef.current) {
      return
    }

    console.log('🎬 Starting mobile-optimized flip:', { flipResult, isMobile, deviceTier })
    
    if (isAnimatingRef.current) {
      isAnimatingRef.current = false
    }
    
    setTimeout(() => {
      if (!coinRef.current) return
      
      isAnimatingRef.current = true
      const coin = coinRef.current
      
      coin.scale.set(1, 1, 1)
      coin.position.x = 0
      coin.position.y = 0
      coin.position.z = 0
      
      const totalPower = creatorPower + joinerPower
      const powerRatio = Math.min(totalPower / 10, 1)
      
      // Mobile gets reduced animation complexity
      let rotationSpeed, totalFlips
      if (isMobile) {
        const minSpeed = 0.05
        const maxSpeed = 0.25  // Reduced from desktop
        rotationSpeed = minSpeed + (powerRatio * (maxSpeed - minSpeed))
        
        const minFlips = 3   // Reduced from desktop
        const maxFlips = 8   // Reduced from desktop
        totalFlips = minFlips + (powerRatio * (maxFlips - minFlips))
      } else {
        const minSpeed = 0.03
        const maxSpeed = 0.4
        rotationSpeed = minSpeed + (powerRatio * (maxSpeed - minSpeed))
        
        const minFlips = 4
        const maxFlips = 15
        totalFlips = minFlips + (powerRatio * (maxFlips - minFlips))
      }
      
      targetAngleRef.current = (flipResult === 'tails') ? 
        (3 * Math.PI / 2) : (Math.PI / 2)
      
      let flipStartTime = Date.now()
      
      const animateFlip = () => {
        if (!isAnimatingRef.current || !coinRef.current) return
        
        const elapsed = Date.now() - flipStartTime
        const progress = Math.min(elapsed / flipDuration, 1)
        
        if (progress < 1) {
          let speedMultiplier
          if (progress < 0.85) {
            speedMultiplier = 1
          } else {
            const endPhase = (progress - 0.85) / 0.15
            speedMultiplier = Math.pow(1 - endPhase, 3)
          }
          
          const currentSpeed = rotationSpeed * speedMultiplier
          coin.rotation.x += currentSpeed
          
          // Reduced vertical motion on mobile for performance
          const verticalMultiplier = isMobile ? 0.3 : 0.6
          coin.position.y = Math.sin(progress * Math.PI) * verticalMultiplier * (1 - progress * 0.2)
          
          // Reduced wobble on mobile
          if (!isMobile || deviceTier !== 'low') {
            coin.rotation.z = Math.sin(progress * Math.PI * totalFlips * 0.1) * 0.05 * (1 - progress)
          }
          
          requestAnimationFrame(animateFlip)
        } else {
          landOnTarget()
        }
      }
      
      const landOnTarget = () => {
        if (!isAnimatingRef.current || !coinRef.current) return
        
        const currentRotation = coin.rotation.x
        const targetAngle = targetAngleRef.current
        
        let deltaAngle = (currentRotation % (Math.PI * 2)) - targetAngle
        
        while (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2
        while (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2
        
        if (Math.abs(deltaAngle) < 0.05) {
          coin.rotation.x = targetAngle
          coin.rotation.z = 0
          coin.position.y = 0
          coin.position.x = 0
          coin.position.z = 0
          coin.scale.set(1, 1, 1)
          
          isAnimatingRef.current = false
          console.log('✅ Mobile flip animation complete:', flipResult)
          return
        }
        
        coin.rotation.x -= deltaAngle * (isMobile ? 0.1 : 0.15)
        requestAnimationFrame(landOnTarget)
      }
      
      animateFlip()
      
    }, 50)
    
    return () => {
      isAnimatingRef.current = false
    }
  }, [isFlipping, flipResult, flipDuration, creatorPower, joinerPower, isMobile, deviceTier])

  return (
    <div
      ref={mountRef}
      onMouseDown={isPlayerTurn ? onMouseDown : undefined}
      onMouseUp={isPlayerTurn ? onMouseUp : undefined}
      onTouchStart={isPlayerTurn ? onMouseDown : undefined}
      onTouchEnd={isPlayerTurn ? onMouseUp : undefined}
      style={{
        width: size,
        height: size,
        cursor: isPlayerTurn ? 'pointer' : 'default',
        borderRadius: '50%',
        overflow: 'hidden',
        position: 'relative',
        margin: '0 auto'
      }}
    />
  )
}

export default MobileOptimizedGoldCoin 