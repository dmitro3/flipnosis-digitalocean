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

    // Set initial rotation to show heads
    coin.rotation.x = Math.PI / 2
    coin.rotation.y = 0

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
  const executeFlip = useCallback((flipResult, powerLevel) => {
    if (!coinRef.current || isAnimating) return

    setIsAnimating(true)
    const coin = coinRef.current
    const isHeads = flipResult === 'heads'
    
    const duration = 3000
    const startTime = Date.now()
    const initialRotationX = coin.rotation.x

    const animateFlip = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Flip the coin
      coin.rotation.x = initialRotationX + (Math.PI * 8 * progress)

      if (progress < 1) {
        requestAnimationFrame(animateFlip)
      } else {
        // Final position
        coin.rotation.x = isHeads ? Math.PI / 2 : -Math.PI / 2
        coin.rotation.y = 0
        setCurrentSide(isHeads ? 'heads' : 'tails')
        setIsAnimating(false)
      }
    }

    animateFlip()
  }, [isAnimating])

  // Trigger synchronized flip when flipResult changes
  useEffect(() => {
    if (isFlipping && flipResult && flipDuration && !isAnimating) {
      executeFlip(flipResult, power)
    }
  }, [isFlipping, flipResult, flipDuration, executeFlip, isAnimating, power])

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
    <div style={{ position: 'relative', width: '300px', height: '300px' }}>
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
          cursor: gamePhase === 'round_active' && isPlayerTurn ? 'pointer' : 'default',
          ...style
        }}
      />
      
      {/* Electric Energy Effect */}
      {isCharging && (
        <div className="electric-energy">
          <div className="energy-ring"></div>
          <div className="energy-ring"></div>
          <div className="energy-ring"></div>
          <div className="electric-sparks">
            <div className="spark"></div>
            <div className="spark"></div>
            <div className="spark"></div>
            <div className="spark"></div>
            <div className="spark"></div>
            <div className="spark"></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ThreeCoin