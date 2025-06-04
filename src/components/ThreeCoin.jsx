import React, { useRef, useEffect } from 'react'
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
  isCharging = false,
  chargingPlayer
}) => {
  const mountRef = useRef(null)
  const coinRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const animationIdRef = useRef(null)
  const isAnimatingRef = useRef(false)
  const chargingRing = useRef(null)

  // Initialize Three.js scene ONCE
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.set(0, 0, 4)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(300, 300)
    renderer.setClearColor(0x000000, 0)

    sceneRef.current = scene
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    // Create coin
    const coinGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.15, 32)
    const headsMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFFFFF,
      shininess: 100,
      emissive: 0x333333
    })
    const tailsMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFFFFF,
      shininess: 100,
      emissive: 0x333333
    })

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

    const headsFace = new THREE.Mesh(coinGeometry, headsMaterial)
    headsFace.rotation.x = Math.PI / 2
    headsFace.position.z = 0.075

    const tailsFace = new THREE.Mesh(coinGeometry, tailsMaterial)
    tailsFace.rotation.x = -Math.PI / 2
    tailsFace.position.z = -0.075
    tailsFace.rotation.y = Math.PI

    coin.add(headsFace)
    coin.add(tailsFace)
    coin.rotation.x = 0  // No X rotation - coin faces camera
    coin.rotation.y = 0  // No Y rotation
    coin.rotation.z = 0  // No Z rotation

    scene.add(coin)
    coinRef.current = coin

    // Lights - BRIGHTER
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Add another light for more brightness
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight2.position.set(-5, -5, 5)
    scene.add(directionalLight2)

    // Animation loop
    const animate = () => {
      if (!coinRef.current || !rendererRef.current) return

      const coin = coinRef.current
      const time = Date.now() * 0.001
      
      // Charging animation
      if (isCharging && !isAnimatingRef.current) {
        coin.rotation.y += 0.02
        coin.rotation.z = Math.sin(time * 3) * 0.1
        coin.position.y = Math.sin(time * 4) * 0.05
      } else if (!isAnimatingRef.current && isPlayerTurn) {
        // Gentle hover when waiting for turn
        coin.rotation.z = 0
        coin.position.y = Math.sin(time * 2) * 0.1 // Gentle up/down hover
        coin.rotation.y += 0.005 // Very slow rotation
      } else if (!isAnimatingRef.current) {
        // Still when not in active round
        coin.rotation.z = 0
        coin.position.y = 0
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

  // Handle flip animation - ONLY when server tells us to
  useEffect(() => {
    if (!isFlipping || !flipResult || !flipDuration || !coinRef.current || isAnimatingRef.current) {
      return
    }

    console.log('🎬 Starting flip animation:', { flipResult, flipDuration })
    
    isAnimatingRef.current = true
    const coin = coinRef.current
    const isHeads = flipResult === 'heads'
   
    // Reset position
    coin.position.y = 0
    coin.rotation.z = 0
   
    const startTime = Date.now()
    const initialRotationX = coin.rotation.x
    const flips = Math.max(4, Math.floor(flipDuration / 800))
   
    const animateFlip = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / flipDuration, 1)
      
      // Advanced easing - fast start, gradual slow down, very slow end
      let easeProgress
      if (progress < 0.7) {
        // Fast spinning for first 70%
        easeProgress = progress / 0.7
      } else {
        // Dramatic slow down for last 30%
        const slowPhase = (progress - 0.7) / 0.3
        const slowEase = 1 - Math.pow(1 - slowPhase, 4) // Quartic ease-out
        easeProgress = 0.7 + (slowEase * 0.3)
      }
      
      // Multi-axis rotation with slow finish
      const totalRotationX = flips * Math.PI * 2
      coin.rotation.x = totalRotationX * easeProgress
      coin.rotation.y = Math.sin(progress * Math.PI * flips * 0.7) * 0.3 * (1 - progress * 0.5) // Reduce wobble as it slows
      coin.rotation.z = Math.cos(progress * Math.PI * flips * 0.5) * 0.2 * (1 - progress * 0.5)
      
      // Height variation with gentle landing
      coin.position.y = Math.sin(progress * Math.PI) * 0.5 * (1 - progress * 0.3)
      
      if (progress < 1) {
        requestAnimationFrame(animateFlip)
      } else {
        // Final position
        if (isHeads) {
          coin.rotation.x = 0
          coin.rotation.y = 0      
          coin.rotation.z = 0
        } else {
          coin.rotation.x = Math.PI
          coin.rotation.y = 0
          coin.rotation.z = 0
        }
        coin.position.y = 0
        isAnimatingRef.current = false
        console.log('✅ Flip animation complete:', flipResult)
      }
    }
   
    animateFlip()
  }, [isFlipping, flipResult, flipDuration])

  // Update the charging effect
  useEffect(() => {
    if (isCharging) {
      const time = Date.now() * 0.001;
      const scale = 1 + Math.sin(time * 5) * 0.1;
      chargingRing.current.scale.set(scale, scale, scale);
      chargingRing.current.rotation.z = time * 2;
      chargingRing.current.material.opacity = 0.6 + Math.sin(time * 3) * 0.2;
    }
  }, [isCharging])

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Electric Circular Charging Effect */}
      {(isCharging || chargingPlayer) && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          background: `
            radial-gradient(circle, 
              rgba(255, 20, 147, 0.4) 0%, 
              rgba(255, 20, 147, 0.2) 30%, 
              rgba(255, 105, 180, 0.1) 60%, 
              transparent 80%
            )
          `,
          border: '3px solid rgba(255, 20, 147, 0.8)',
          boxShadow: `
            0 0 20px rgba(255, 20, 147, 0.8),
            0 0 40px rgba(255, 20, 147, 0.6),
            0 0 60px rgba(255, 20, 147, 0.4),
            inset 0 0 20px rgba(255, 20, 147, 0.3)
          `,
          animation: 'electricCharge 0.3s ease-in-out infinite',
          zIndex: -1,
          pointerEvents: 'none'
        }}>
          {/* Electric Bolts */}
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '80%',
            height: '80%',
            borderRadius: '50%',
            border: '2px dashed rgba(255, 20, 147, 0.6)',
            animation: 'electricRotate 1s linear infinite'
          }} />
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '20%',
            width: '60%',
            height: '60%',
            borderRadius: '50%',
            border: '1px solid rgba(255, 105, 180, 0.8)',
            animation: 'electricRotate 0.8s linear infinite reverse'
          }} />
        </div>
      )}
      
      {/* Make sure this div gets the ref properly */}
      <div
        ref={mountRef}
        onMouseDown={isPlayerTurn && mountRef.current ? onPowerCharge : undefined}
        onMouseUp={isPlayerTurn && mountRef.current ? onPowerRelease : undefined}
        onMouseLeave={isPlayerTurn && mountRef.current ? onPowerRelease : undefined}
        onTouchStart={isPlayerTurn && mountRef.current ? onPowerCharge : undefined}
        onTouchEnd={isPlayerTurn && mountRef.current ? onPowerRelease : undefined}
        style={{
          width: '300px',
          height: '300px',
          cursor: isPlayerTurn ? 'pointer' : 'default',
          userSelect: 'none',
          position: 'relative',
          zIndex: 1
        }}
      />
    </div>
  )
}

export default ThreeCoin