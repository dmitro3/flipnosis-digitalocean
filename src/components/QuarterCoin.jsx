import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'
import trumpHeadsImage from '../../Images/trumpheads.webp'
import trumpTailsImage from '../../Images/trumptails.webp'

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
    renderer.setSize(400, 400) // Increased size
    renderer.setClearColor(0x000000, 0)

    sceneRef.current = scene
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    // Create coin group
    const coin = new THREE.Group()
    coin.scale.set(1.2, 1.2, 1.2) // Reduced scale from 1.5

    // Load the actual Trump images
    const textureLoader = new THREE.TextureLoader()

    // Heads face (Trump side)
    const headsMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide // Add double-sided rendering
    })

    textureLoader.load(trumpHeadsImage, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.flipY = false
      texture.wrapS = THREE.ClampToEdgeWrapping
      texture.wrapT = THREE.ClampToEdgeWrapping
      headsMaterial.map = texture
      headsMaterial.needsUpdate = true
      console.log('✅ Heads texture loaded')
    }, undefined, (error) => {
      console.error('❌ Error loading heads texture:', error)
    })

    const headsGeometry = new THREE.CircleGeometry(1.4, 64)
    const headsFace = new THREE.Mesh(headsGeometry, headsMaterial)
    headsFace.position.z = 0.001
    headsFace.rotation.x = Math.PI // Flip 180 degrees
    coin.add(headsFace)

    // Tails face
    const tailsMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide // Add double-sided rendering
    })

    textureLoader.load(trumpTailsImage, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.flipY = false
      texture.wrapS = THREE.ClampToEdgeWrapping
      texture.wrapT = THREE.ClampToEdgeWrapping
      tailsMaterial.map = texture
      tailsMaterial.needsUpdate = true
      console.log('✅ Tails texture loaded')
    }, undefined, (error) => {
      console.error('❌ Error loading tails texture:', error)
    })

    const tailsGeometry = new THREE.CircleGeometry(1.4, 64)
    const tailsFace = new THREE.Mesh(tailsGeometry, tailsMaterial)
    tailsFace.position.z = -0.001
    tailsFace.rotation.x = 0 // Changed from Math.PI to 0
    coin.add(tailsFace)

    // Edge with metallic look
    const edgeGeometry = new THREE.CylinderGeometry(1.41, 1.41, 0.1, 128)
    const edgeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xc5c5c5,
      metalness: 0.9,
      roughness: 0.1,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    })
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial)
    coin.add(edge)

    // Set initial rotation to show face instead of edge
    coin.rotation.x = 0 // Changed from Math.PI / 2 to 0
    coin.rotation.y = 0
    coin.rotation.z = 0

    scene.add(coin)
    coinRef.current = coin

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5)
    scene.add(ambientLight)

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight1.position.set(3, 3, 5)
    directionalLight1.castShadow = true
    scene.add(directionalLight1)

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight2.position.set(-2, -1, 3)
    scene.add(directionalLight2)

    // Subtle accent light
    const accentLight = new THREE.DirectionalLight(0x00ff41, 0.3)
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
        width: '400px', // Increased size
        height: '400px', // Increased size
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