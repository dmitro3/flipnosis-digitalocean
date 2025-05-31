import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import headsTexture from '../../Images/Heads.webp'
import tailsTexture from '../../Images/tails.webp'

const ThreeCoin = ({ 
  isFlipping, 
  flipResult, 
  onPowerCharge, 
  onPowerRelease,
  isPlayerTurn,
  gamePhase,
  power = 5,
  isCharging = false,
  style = {}
}) => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const coinRef = useRef(null)
  const rendererRef = useRef(null)
  const animationIdRef = useRef(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [hasResult, setHasResult] = useState(false)
  const [finalResult, setFinalResult] = useState(null)

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.set(0, 0, 3)

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(200, 200) // Reduced container size
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
      specular: 0x444444
    })

    const tailsMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFFFFF,
      shininess: 100,
      specular: 0x444444
    })

    const edgeMaterial = new THREE.MeshPhongMaterial({
      color: 0xB8860B,
      shininess: 50
    })

    // Create coin group
    const coin = new THREE.Group()
    coin.scale.set(1.5, 1.5, 1.5)

    // Load textures
    const textureLoader = new THREE.TextureLoader()
    const headsImage = textureLoader.load(headsTexture)
    const tailsImage = textureLoader.load(tailsTexture)

    // Apply textures to materials
    headsMaterial.map = headsImage
    tailsMaterial.map = tailsImage

    // Main coin body with different materials for each face
    const coinBody = new THREE.Mesh(coinGeometry, [
      edgeMaterial,  // sides
      headsMaterial, // top (heads)
      tailsMaterial  // bottom (tails)
    ])
    coinBody.castShadow = true
    coinBody.rotation.x = Math.PI / 2 // Face the camera initially
    coin.add(coinBody)

    scene.add(coin)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 5, 5)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    const pointLight = new THREE.PointLight(0xffffff, 0.5)
    pointLight.position.set(-5, 3, 3)
    scene.add(pointLight)

    // Store refs
    sceneRef.current = scene
    coinRef.current = coin
    rendererRef.current = renderer

    // Start animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)

      if (!isAnimating && !hasResult) {
        // Gentle floating animation
        coin.position.y = Math.sin(Date.now() * 0.001) * 0.1
        // Very slow rotation between heads and tails
        coin.children[0].rotation.z = Math.sin(Date.now() * 0.0008) * Math.PI
      } else if (!isAnimating && hasResult) {
        // Float gently but keep result
        coin.position.y = Math.sin(Date.now() * 0.001) * 0.1
        coin.children[0].rotation.z = finalResult ? 0 : Math.PI
      }

      renderer.render(scene, camera)
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
  }, [])

  // Handle flip animation
  const executeFlip = useCallback((flipResult, powerLevel) => {
    if (!coinRef.current || isAnimating) return

    setIsAnimating(true)
    setHasResult(false)

    const coin = coinRef.current
    const coinBody = coin.children[0]
    const isHeads = flipResult === 'heads'
    
    // Calculate animation parameters based on power
    const baseDuration = 8000
    const duration = baseDuration - (powerLevel - 1) * 400
    const baseSpins = 4
    const spins = baseSpins + (powerLevel * 1.5)
    const maxHeight = 2 + (powerLevel * 0.3)

    const startTime = Date.now()
    const initialY = coin.position.y
    const initialRotationX = coinBody.rotation.x

    const animateFlip = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Parabolic trajectory
      const height = initialY + maxHeight * (4 * progress * (1 - progress))
      coin.position.y = height

      // Spinning animation
      const totalRotationY = spins * Math.PI * 2
      const totalRotationX = spins * Math.PI * 2 * 0.6

      coinBody.rotation.y = totalRotationY * progress
      coinBody.rotation.x = initialRotationX + totalRotationX * progress

      // Add wobble at higher power levels
      if (powerLevel > 7) {
        coinBody.rotation.z = Math.sin(progress * Math.PI * 6) * 0.3
      }

      if (progress < 1) {
        requestAnimationFrame(animateFlip)
      } else {
        // Final position
        coinBody.rotation.x = Math.PI / 2
        coinBody.rotation.y = 0
        coinBody.rotation.z = isHeads ? 0 : Math.PI
        coin.position.y = initialY

        setFinalResult(isHeads)
        setHasResult(true)
        setIsAnimating(false)
      }
    }

    animateFlip()
  }, [isAnimating])

  // Trigger flip when flipResult changes
  useEffect(() => {
    if (flipResult && !isAnimating) {
      executeFlip(flipResult, power)
    }
  }, [flipResult, power, executeFlip, isAnimating])

  // Handle mouse/touch events
  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    if (gamePhase === 'round_active' && isPlayerTurn && onPowerCharge) {
      onPowerCharge()
    }
  }, [gamePhase, isPlayerTurn, onPowerCharge])

  const handleMouseUp = useCallback((e) => {
    e.preventDefault()
    if (gamePhase === 'round_active' && isPlayerTurn && onPowerRelease) {
      onPowerRelease()
    }
  }, [gamePhase, isPlayerTurn, onPowerRelease])

  const handleMouseLeave = useCallback((e) => {
    e.preventDefault()
    if (gamePhase === 'round_active' && isPlayerTurn && onPowerRelease) {
      onPowerRelease()
    }
  }, [gamePhase, isPlayerTurn, onPowerRelease])

  // Reset when game restarts
  useEffect(() => {
    if (gamePhase === 'round_active' && hasResult) {
      setHasResult(false)
      setFinalResult(null)
    }
  }, [gamePhase, hasResult])

  return (
    <div
      ref={mountRef}
      style={{
        width: '200px',
        height: '200px',
        cursor: isPlayerTurn && gamePhase === 'round_active' ? 'pointer' : 'default',
        userSelect: 'none',
        border: isCharging ? '3px solid #ff1493' : '2px solid #FFD700',
        borderRadius: '50%',
        boxShadow: isCharging 
          ? '0 0 30px #ff1493, 0 0 50px #ff1493' 
          : '0 0 20px #FFD700',
        transition: 'all 0.3s ease',
        overflow: 'hidden', // Ensure coin stays within bounds
        ...style
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
    />
  )
}

export default ThreeCoin 