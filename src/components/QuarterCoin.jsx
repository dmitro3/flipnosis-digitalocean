import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

const QuarterCoin = ({ 
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

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.set(0, 0, 4)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(320, 320) // Larger for quarter size
    renderer.setClearColor(0x000000, 0)

    sceneRef.current = scene
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    // Create realistic silver quarter
    const coinGeometry = new THREE.CylinderGeometry(1.4, 1.4, 0.15, 64) // Thicker like real quarter
    
    // Realistic silver material
    const silverMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xc5c5c5,
      metalness: 0.95,
      roughness: 0.05,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.0
    })

    const coin = new THREE.Group()
    coin.scale.set(1.1, 1.1, 1.1)

    // Main coin body
    const coinMesh = new THREE.Mesh(coinGeometry, silverMaterial)
    coin.add(coinMesh)

    // Create detailed quarter textures
    const createQuarterTexture = (isHeads = true) => {
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const context = canvas.getContext('2d')
      
      // Clear with silver background
      context.fillStyle = '#c5c5c5'
      context.fillRect(0, 0, 512, 512)
      
      // Add subtle radial gradient for depth
      const gradient = context.createRadialGradient(256, 256, 0, 256, 256, 256)
      gradient.addColorStop(0, '#d5d5d5')
      gradient.addColorStop(0.7, '#c5c5c5')
      gradient.addColorStop(1, '#a5a5a5')
      context.fillStyle = gradient
      context.fillRect(0, 0, 512, 512)
      
      if (isHeads) {
        // HEADS side - Trump profile and text
        context.fillStyle = '#2a2a2a'
        context.strokeStyle = '#1a1a1a'
        context.lineWidth = 2
        
        // Draw simplified Trump profile silhouette
        context.beginPath()
        context.ellipse(256, 220, 80, 95, 0, 0, 2 * Math.PI) // Head shape
        context.fill()
        context.stroke()
        
        // Hair outline (distinctive shape)
        context.beginPath()
        context.ellipse(256, 180, 90, 45, 0, 0, Math.PI, true) // Hair curve
        context.fill()
        
        // "LIBERTY" text (curved at top)
        context.font = 'bold 24px serif'
        context.textAlign = 'center'
        context.fillStyle = '#2a2a2a'
        context.fillText('LIBERTY', 256, 80)
        
        // "IN GOD WE TRUST" (left side)
        context.font = 'bold 16px serif'
        context.save()
        context.translate(120, 180)
        context.rotate(-Math.PI/2)
        context.fillText('IN GOD', 0, 0)
        context.fillText('WE TRUST', 0, 20)
        context.restore()
        
        // Date (right side)
        context.font = 'bold 20px serif'
        context.textAlign = 'center'
        context.fillText('2024', 380, 200)
        
        // "UNITED STATES OF AMERICA" (bottom curve)
        context.font = 'bold 18px serif'
        context.fillText('UNITED STATES', 256, 380)
        context.fillText('OF AMERICA', 256, 405)
        
      } else {
        // TAILS side - Eagle design
        context.fillStyle = '#2a2a2a'
        context.strokeStyle = '#1a1a1a'
        context.lineWidth = 2
        
        // Eagle body (simplified)
        context.beginPath()
        context.ellipse(256, 256, 60, 80, 0, 0, 2 * Math.PI)
        context.fill()
        context.stroke()
        
        // Wings spread
        context.beginPath()
        context.ellipse(200, 240, 40, 25, -0.3, 0, 2 * Math.PI) // Left wing
        context.fill()
        context.beginPath()
        context.ellipse(312, 240, 40, 25, 0.3, 0, 2 * Math.PI) // Right wing
        context.fill()
        
        // "QUARTER DOLLAR" text (bottom)
        context.font = 'bold 20px serif'
        context.textAlign = 'center'
        context.fillText('QUARTER', 256, 380)
        context.fillText('DOLLAR', 256, 405)
        
        // "E PLURIBUS UNUM" (top)
        context.font = 'bold 16px serif'
        context.fillText('E PLURIBUS UNUM', 256, 80)
        
        // Stars around edge
        context.font = 'bold 20px serif'
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2
          const x = 256 + Math.cos(angle) * 180
          const y = 256 + Math.sin(angle) * 180
          context.fillText('★', x, y)
        }
      }
      
      // Add raised edge effect
      context.strokeStyle = '#999999'
      context.lineWidth = 8
      context.beginPath()
      context.arc(256, 256, 248, 0, 2 * Math.PI)
      context.stroke()
      
      const texture = new THREE.CanvasTexture(canvas)
      texture.needsUpdate = true
      return texture
    }

    // Heads face (Trump side)
    const headsTexture = createQuarterTexture(true)
    const headsMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xc5c5c5,
      metalness: 0.9,
      roughness: 0.1,
      map: headsTexture,
      normalScale: new THREE.Vector2(0.5, 0.5) // Subtle depth
    })
    
    const headsGeometry = new THREE.CircleGeometry(1.4, 64)
    const headsFace = new THREE.Mesh(headsGeometry, headsMaterial)
    headsFace.position.z = 0.076
    headsFace.rotation.x = 0
    coin.add(headsFace)

    // Tails face (Eagle side)
    const tailsTexture = createQuarterTexture(false)
    const tailsMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xc5c5c5,
      metalness: 0.9,
      roughness: 0.1,
      map: tailsTexture,
      normalScale: new THREE.Vector2(0.5, 0.5)
    })
    
    const tailsGeometry = new THREE.CircleGeometry(1.4, 64)
    const tailsFace = new THREE.Mesh(tailsGeometry, tailsMaterial)
    tailsFace.position.z = -0.076
    tailsFace.rotation.x = Math.PI
    coin.add(tailsFace)

    // Detailed edge with reeding (like real quarters)
    const edgeGeometry = new THREE.CylinderGeometry(1.41, 1.41, 0.15, 128)
    const edgeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xa5a5a5,
      metalness: 1.0,
      roughness: 0.4,
      normalScale: new THREE.Vector2(1.0, 0.2) // Reeded edge texture
    })
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial)
    coin.add(edge)

    // Set initial rotation to face camera (heads up)
    coin.rotation.x = Math.PI / 2
    coin.rotation.y = 0
    coin.rotation.z = 0

    scene.add(coin)
    coinRef.current = coin

    // Professional lighting for realistic metal
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3)
    scene.add(ambientLight)

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.2)
    directionalLight1.position.set(3, 3, 5)
    directionalLight1.castShadow = true
    scene.add(directionalLight1)

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6)
    directionalLight2.position.set(-2, -1, 3)
    scene.add(directionalLight2)

    // Subtle accent light for neon theme
    const accentLight = new THREE.DirectionalLight(0x00ff41, 0.2)
    accentLight.position.set(0, 0, 5)
    scene.add(accentLight)

    // Animation loop
    const animate = () => {
      if (!coinRef.current || !rendererRef.current) return

      const time = Date.now() * 0.001
      const coin = coinRef.current

      // Coin animations
      if (!isAnimatingRef.current) {
        if (isCharging) {
          // Pulsing and slight rotation when charging
          const pulse = Math.sin(time * 5) * 0.04 + 1.0
          coin.scale.set(pulse * 1.1, pulse * 1.1, pulse * 1.1)
          coin.rotation.z += 0.008
          coin.position.y = Math.sin(time * 6) * 0.02
        } else {
          // Gentle hover when waiting
          const isWaitingInRound = gamePhase === 'round_active' && !isPlayerTurn
          const isWaitingToStart = gamePhase === 'waiting' || gamePhase === 'ready'
          
          if (isWaitingInRound || isWaitingToStart) {
            coin.position.y = Math.sin(time * 1.5) * 0.06
            coin.rotation.z += 0.002
          } else {
            coin.position.y = 0
          }
          coin.scale.set(1.1, 1.1, 1.1)
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
      renderer.dispose()
      sceneRef.current = null
      rendererRef.current = null
    }
  }, [])

  // Handle flip animation
  useEffect(() => {
    if (!isFlipping || !flipResult || !flipDuration || !coinRef.current || isAnimatingRef.current) {
      return
    }

    console.log('🎬 Starting quarter flip:', { flipResult, flipDuration })
    
    isAnimatingRef.current = true
    const coin = coinRef.current
    const isHeads = flipResult === 'heads'
   
    coin.position.y = 0
    coin.rotation.z = 0
    coin.scale.set(1.1, 1.1, 1.1)
   
    const startTime = Date.now()
    const flips = Math.max(4, Math.floor(flipDuration / 900))
   
    const animateFlip = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / flipDuration, 1)
      
      // Realistic quarter flip physics
      let easeProgress
      if (progress < 0.8) {
        easeProgress = progress / 0.8
      } else {
        const slowPhase = (progress - 0.8) / 0.2
        const slowEase = 1 - Math.pow(1 - slowPhase, 4)
        easeProgress = 0.8 + (slowEase * 0.2)
      }
      
      // Quarter flip rotation
      const totalRotationX = flips * Math.PI * 2
      coin.rotation.x = Math.PI / 2 + (totalRotationX * easeProgress)
      
      // Realistic wobble
      coin.rotation.y = Math.sin(progress * Math.PI * flips * 0.2) * 0.15 * (1 - progress * 0.6)
      coin.rotation.z = Math.cos(progress * Math.PI * flips * 0.15) * 0.1 * (1 - progress * 0.4)
      
      // Parabolic arc
      coin.position.y = Math.sin(progress * Math.PI) * 0.7 * (1 - progress * 0.05)
      
      // Slight scale during peak
      const scale = 1.1 + Math.sin(progress * Math.PI) * 0.03
      coin.scale.set(scale, scale, scale)
      
      if (progress < 1) {
        requestAnimationFrame(animateFlip)
      } else {
        // Final position
        if (isHeads) {
          coin.rotation.x = Math.PI / 2  // Trump side up
          coin.rotation.y = 0      
          coin.rotation.z = 0
        } else {
          coin.rotation.x = -Math.PI / 2  // Eagle side up
          coin.rotation.y = 0
          coin.rotation.z = 0
        }
        coin.position.y = 0
        coin.scale.set(1.1, 1.1, 1.1)
        isAnimatingRef.current = false
        console.log('✅ Quarter flip complete:', flipResult)
      }
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
        width: '320px',
        height: '320px',
        cursor: isPlayerTurn ? 'pointer' : 'default',
        userSelect: 'none',
        background: isCharging ? 
          'radial-gradient(circle, rgba(255, 20, 147, 0.15) 0%, rgba(255, 20, 147, 0.05) 50%, transparent 100%)' : 
          'transparent',
        boxShadow: isCharging ? 
          '0 0 30px rgba(255, 20, 147, 0.4), 0 0 60px rgba(255, 20, 147, 0.2)' : 
          '0 0 15px rgba(192, 192, 192, 0.3)',
        borderRadius: '50%',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    />
  )
}

export default QuarterCoin 