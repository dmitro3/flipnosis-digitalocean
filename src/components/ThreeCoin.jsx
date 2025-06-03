import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import headsTexture from '../../Images/Heads.webp'
import tailsTexture from '../../Images/tails.webp'

const ThreeCoin = ({ 
  isFlipping, 
  flipResult, 
  flipDuration = 3000,
  onPowerCharge, 
  onPowerRelease,
  isPlayerTurn,
  gamePhase,
  power = 5,
  isCharging = false,
  style = {}
}) => {
  const mountRef = useRef(null)
  const coinRef = useRef(null)
  const animationIdRef = useRef(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentSide, setCurrentSide] = useState('heads')

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.set(0, 0, 4)

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(300, 300)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setClearColor(0x000000, 0)

    // Add renderer to DOM
    mountRef.current.appendChild(renderer.domElement)

    // Create coin geometry
    const coinGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.15, 32)

    // Create materials
    const headsMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFFFFF,
      shininess: 100,
      specular: 0x666666,
      emissive: 0x111111
    })

    const tailsMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFFFFF,
      shininess: 100,
      specular: 0x666666,
      emissive: 0x111111
    })

    // Create coin group
    const coin = new THREE.Group()
    coin.scale.set(1.2, 1.2, 1.2)

    // Load textures
    const textureLoader = new THREE.TextureLoader()
    textureLoader.load(headsTexture, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      headsMaterial.map = texture
      headsMaterial.needsUpdate = true
    })
    textureLoader.load(tailsTexture, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      tailsMaterial.map = texture
      tailsMaterial.needsUpdate = true
    })

    // Create coin faces
    const headsFace = new THREE.Mesh(coinGeometry, headsMaterial)
    headsFace.rotation.x = Math.PI / 2
    headsFace.position.z = 0.075

    const tailsFace = new THREE.Mesh(coinGeometry, tailsMaterial)
    tailsFace.rotation.x = -Math.PI / 2
    tailsFace.position.z = -0.075
    tailsFace.rotation.y = Math.PI

    // Add faces to coin group
    coin.add(headsFace)
    coin.add(tailsFace)

    // Set initial rotation to show heads FACING the camera
    coin.rotation.x = Math.PI / 2
    coin.rotation.y = 0
    coin.rotation.z = 0

    // Add coin to scene
    scene.add(coin)
    coinRef.current = coin

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Animation loop
    const animate = () => {
      if (!coinRef.current) return

      // Gentle rotation when charging
      if (isCharging && !isFlipping) {
        coinRef.current.rotation.y += 0.01
      }

      renderer.render(scene, camera)
      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [isCharging, isFlipping])

  // Handle synchronized flip animation
  const executeSynchronizedFlip = useCallback((flipResult, duration) => {
    if (!coinRef.current || isAnimating) return

    console.log('🎬 Starting synchronized flip animation:', { flipResult, duration })
    
    setIsAnimating(true)
    const coin = coinRef.current
    const isHeads = flipResult === 'heads'
    
    // Calculate flips based on duration
    const flips = Math.max(3, Math.floor(duration / 1000)) // At least 3 flips
    const startTime = Date.now()
    const initialRotationX = Math.PI / 2  // Always start from heads facing camera

    const animateFlip = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Smooth easing
      const easeProgress = 1 - Math.pow(1 - progress, 3)

      // Calculate rotation with proper ending - flip around X axis to face camera
      const totalRotationX = flips * Math.PI * 2
      coin.rotation.x = initialRotationX + totalRotationX * easeProgress
      
      // Add some Y rotation for more dynamic movement
      coin.rotation.y = Math.sin(progress * Math.PI * flips) * 0.5

      if (progress < 1) {
        requestAnimationFrame(animateFlip)
      } else {
        // Final position - face the camera properly
        if (isHeads) {
          coin.rotation.x = Math.PI / 2  // Heads facing camera
        } else {
          coin.rotation.x = -Math.PI / 2  // Tails facing camera
        }
        coin.rotation.y = 0
        coin.rotation.z = 0
        setCurrentSide(isHeads ? 'heads' : 'tails')
        setIsAnimating(false)
        console.log('✅ Flip animation complete:', flipResult)
      }
    }

    animateFlip()

    // Make the images on the coins brighter
    headsMaterial.emissiveIntensity = 0.5
    headsMaterial.color.setHex(0xFFFFFF)
    tailsMaterial.emissiveIntensity = 0.5
    tailsMaterial.color.setHex(0xFFFFFF)
  }, [isAnimating])

  // Trigger synchronized flip when flipResult changes
  useEffect(() => {
    if (isFlipping && flipResult && flipDuration && !isAnimating) {
      executeSynchronizedFlip(flipResult, flipDuration)
    }
  }, [isFlipping, flipResult, flipDuration, executeSynchronizedFlip, isAnimating])

  // Handle mouse/touch events
  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    if (isPlayerTurn && onPowerCharge && !isFlipping) {
      onPowerCharge()
    }
  }, [isPlayerTurn, onPowerCharge, isFlipping])

  const handleMouseUp = useCallback((e) => {
    e.preventDefault()
    if (isPlayerTurn && onPowerRelease && !isFlipping) {
      onPowerRelease()
    }
  }, [isPlayerTurn, onPowerRelease, isFlipping])

  const handleMouseLeave = useCallback((e) => {
    e.preventDefault()
    if (isPlayerTurn && onPowerRelease && !isFlipping) {
      onPowerRelease()
    }
  }, [isPlayerTurn, onPowerRelease, isFlipping])

  return (
    <div
      ref={mountRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      style={{
        width: '300px',
        height: '300px',
        cursor: isPlayerTurn && !isFlipping ? 'pointer' : 'default',
        userSelect: 'none',
        ...style
      }}
    />
  )
}

export default ThreeCoin