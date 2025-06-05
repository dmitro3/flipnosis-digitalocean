import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

const EnhancedReliableGoldCoin = ({ 
  isFlipping, 
  flipResult, 
  flipDuration = 3000,
  onPowerCharge, 
  onPowerRelease,
  isPlayerTurn,
  isCharging = false,
  chargingPlayer,
  gamePhase,
  // NEW: Choice-based lighting
  playerChoice = null, // 'heads' or 'tails' - current player's choice
  opponentChoice = null, // 'heads' or 'tails' - opponent's choice
  currentPlayer = null, // address of current player
  viewerAddress = null, // address of viewing player
  // Optional image props
  headsImage = null,
  tailsImage = null,
  edgeImage = null
}) => {
  const mountRef = useRef(null)
  const coinRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const animationIdRef = useRef(null)
  const isAnimatingRef = useRef(false)
  const targetAngleRef = useRef(Math.PI / 2)
  const materialsRef = useRef([])
  const powerSystemRef = useRef({
    power: 0,
    maxPower: 10,
    chargeRate: 0.15,
    isCharging: false,
    chargeInterval: null
  })

  // Create procedural gold textures with dynamic brightness
  const createGoldTexture = (type, size = 512, brightness = 1.0) => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    if (type === 'heads') {
      // Dynamic brightness based on player choice
      const centerBrightness = brightness > 1 ? '#FFFACD' : '#FFEF94'
      const midBrightness = brightness > 1 ? '#FFD700' : '#DAA520'
      const edgeBrightness = brightness > 1 ? '#DAA520' : '#B8860B'
      
      const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
      gradient.addColorStop(0, centerBrightness)
      gradient.addColorStop(0.5, midBrightness)
      gradient.addColorStop(0.8, edgeBrightness)
      gradient.addColorStop(1, '#8B7355')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
      
      // Crown symbol
      ctx.fillStyle = brightness > 1 ? '#654321' : '#8B4513'
      ctx.font = `bold ${size * 0.2}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('♔', size/2, size/2 - size * 0.08)
      
      // "HEADS" text
      ctx.fillStyle = brightness > 1 ? '#543A2F' : '#654321'
      ctx.font = `bold ${size * 0.08}px Arial`
      ctx.fillText('HEADS', size/2, size/2 + size * 0.12)
      
      // Border
      ctx.strokeStyle = brightness > 1 ? '#8B7D6B' : '#6B5B4F'
      ctx.lineWidth = size * 0.025
      ctx.beginPath()
      ctx.arc(size/2, size/2, size * 0.42, 0, Math.PI * 2)
      ctx.stroke()
      
    } else if (type === 'tails') {
      // Dynamic brightness based on player choice
      const centerBrightness = brightness > 1 ? '#FFFACD' : '#FFEF94'
      const midBrightness = brightness > 1 ? '#FFD700' : '#DAA520'
      const edgeBrightness = brightness > 1 ? '#DAA520' : '#B8860B'
      
      const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
      gradient.addColorStop(0, centerBrightness)
      gradient.addColorStop(0.5, midBrightness)
      gradient.addColorStop(0.8, edgeBrightness)
      gradient.addColorStop(1, '#8B7355')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
      
      // Diamond symbol
      ctx.fillStyle = brightness > 1 ? '#654321' : '#8B4513'
      ctx.font = `bold ${size * 0.2}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('♦', size/2, size/2 - size * 0.08)
      
      // "TAILS" text
      ctx.fillStyle = brightness > 1 ? '#543A2F' : '#654321'
      ctx.font = `bold ${size * 0.08}px Arial`
      ctx.fillText('TAILS', size/2, size/2 + size * 0.12)
      
      // Border
      ctx.strokeStyle = brightness > 1 ? '#8B7D6B' : '#6B5B4F'
      ctx.lineWidth = size * 0.025
      ctx.beginPath()
      ctx.arc(size/2, size/2, size * 0.42, 0, Math.PI * 2)
      ctx.stroke()
      
    } else if (type === 'edge') {
      // Edge brightness
      ctx.fillStyle = brightness > 1 ? '#FFFACD' : '#FFEF94'
      ctx.fillRect(0, 0, size, size)
      
      ctx.strokeStyle = brightness > 1 ? '#B8860B' : '#8B7355'
      ctx.lineWidth = 3
      for (let i = 0; i < size; i += 8) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, size)
        ctx.stroke()
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }

  // Calculate dynamic brightness based on choices
  const getDynamicBrightness = () => {
    const isCurrentPlayer = currentPlayer === viewerAddress
    let headsBrightness = 1.0
    let tailsBrightness = 1.0
    
    if (playerChoice && opponentChoice) {
      if (isCurrentPlayer) {
        // Current player sees their choice bright, opponent's dim
        headsBrightness = playerChoice === 'heads' ? 1.8 : 0.6
        tailsBrightness = playerChoice === 'tails' ? 1.8 : 0.6
      } else {
        // Opponent sees their choice bright, current player's dim
        headsBrightness = opponentChoice === 'heads' ? 1.8 : 0.6
        tailsBrightness = opponentChoice === 'tails' ? 1.8 : 0.6
      }
    }
    
    return { headsBrightness, tailsBrightness }
  }

  // Update materials with dynamic lighting
  const updateMaterialBrightness = () => {
    if (!materialsRef.current || materialsRef.current.length === 0) return
    
    const { headsBrightness, tailsBrightness } = getDynamicBrightness()
    
    // Update heads material
    if (materialsRef.current[1]) {
      const newHeadsTexture = headsImage ? 
        new THREE.TextureLoader().load(headsImage) : 
        createGoldTexture('heads', 512, headsBrightness)
      
      materialsRef.current[1].map = newHeadsTexture
      materialsRef.current[1].emissiveIntensity = headsBrightness > 1 ? 0.3 : 0.1
      materialsRef.current[1].needsUpdate = true
    }
    
    // Update tails material
    if (materialsRef.current[2]) {
      const newTailsTexture = tailsImage ? 
        new THREE.TextureLoader().load(tailsImage) : 
        createGoldTexture('tails', 512, tailsBrightness)
      
      materialsRef.current[2].map = newTailsTexture
      materialsRef.current[2].emissiveIntensity = tailsBrightness > 1 ? 0.3 : 0.1
      materialsRef.current[2].needsUpdate = true
    }
  }

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, 1, 1, 10)
    camera.position.set(0, 0, 7)

    const renderer = new THREE.WebGLRenderer({ 
      canvas: mountRef.current.querySelector('canvas') || document.createElement('canvas'),
      antialias: true, 
      alpha: true
    })
    renderer.setSize(400, 400)
    renderer.setClearColor(0x000000, 0)

    if (!mountRef.current.querySelector('canvas')) {
      mountRef.current.appendChild(renderer.domElement)
    }

    sceneRef.current = scene
    rendererRef.current = renderer

    // Enhanced lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.2))

    const pointLightLeft = new THREE.PointLight(0xFFE4B5, 2.0)
    pointLightLeft.position.set(-3, -2, 5)
    scene.add(pointLightLeft)

    const pointLightRight = new THREE.PointLight(0xFFE4B5, 2.0)
    pointLightRight.position.set(3, 2, 5)
    scene.add(pointLightRight)

    const pointLightTop = new THREE.PointLight(0xFFFFFF, 1.8)
    pointLightTop.position.set(0, 4, 3)
    scene.add(pointLightTop)

    const frontSpotlight = new THREE.SpotLight(0xFFFFFF, 2.5)
    frontSpotlight.position.set(0, 0, 8)
    frontSpotlight.target.position.set(0, 0, 0)
    frontSpotlight.angle = Math.PI / 6
    frontSpotlight.penumbra = 0.3
    scene.add(frontSpotlight)
    scene.add(frontSpotlight.target)

    const backRimLight = new THREE.PointLight(0xFFD700, 1.5)
    backRimLight.position.set(0, 0, -3)
    scene.add(backRimLight)

    // Create initial materials
    const metalness = 0.9
    const roughness = 0.05
    const { headsBrightness, tailsBrightness } = getDynamicBrightness()

    const textureHeads = headsImage ? 
      new THREE.TextureLoader().load(headsImage) : 
      createGoldTexture('heads', 512, headsBrightness)
    
    const textureTails = tailsImage ? 
      new THREE.TextureLoader().load(tailsImage) : 
      createGoldTexture('tails', 512, tailsBrightness)
    
    const textureEdge = edgeImage ? 
      new THREE.TextureLoader().load(edgeImage) : 
      createGoldTexture('edge')

    textureEdge.wrapS = THREE.RepeatWrapping
    textureEdge.repeat.set(20, 1)

    const materials = [
      // Edge
      new THREE.MeshStandardMaterial({
        map: textureEdge,
        metalness: metalness,
        roughness: roughness,
        color: 0xFFEF94,
        emissive: 0x332200,
        emissiveIntensity: 0.1
      }),
      // Heads
      new THREE.MeshStandardMaterial({
        map: textureHeads,
        metalness: metalness,
        roughness: roughness,
        color: 0xFFEF94,
        emissive: 0x443300,
        emissiveIntensity: headsBrightness > 1 ? 0.3 : 0.15
      }),
      // Tails
      new THREE.MeshStandardMaterial({
        map: textureTails,
        metalness: metalness,
        roughness: roughness,
        color: 0xFFEF94,
        emissive: 0x443300,
        emissiveIntensity: tailsBrightness > 1 ? 0.3 : 0.15
      })
    ]

    materialsRef.current = materials

    const geometry = new THREE.CylinderGeometry(3, 3, 0.4, 100)
    const coin = new THREE.Mesh(geometry, materials)
    
    scene.add(coin)
    coinRef.current = coin

    coin.rotation.x = Math.PI / 2
    coin.rotation.y = Math.PI / 2

    // Animation loop
    const animate = () => {
      if (!coinRef.current || !rendererRef.current) return

      const coin = coinRef.current
      const time = Date.now() * 0.001
      const powerSystem = powerSystemRef.current
      
      if (isAnimatingRef.current) {
        // Flip animation handled separately
      } else if (isCharging && !isAnimatingRef.current) {
        const intensity = powerSystem.power / powerSystem.maxPower
        coin.position.y = Math.sin(time * 4) * 0.1 * intensity
        coin.rotation.x += 0.01 * (1 + intensity)
      } else if (!isAnimatingRef.current) {
        const isWaitingInRound = gamePhase === 'round_active' && !isPlayerTurn
        const isWaitingToStart = gamePhase === 'waiting' || gamePhase === 'ready'
        
        if (isWaitingInRound || isWaitingToStart) {
          coin.rotation.x += 0.005
          coin.position.y = Math.sin(time * 1.5) * 0.05
        } else {
          coin.rotation.x += 0.002
          coin.position.y = 0
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
      
      materials.forEach(material => {
        if (material.map) material.map.dispose()
        material.dispose()
      })
      geometry.dispose()
      renderer.dispose()
      
      sceneRef.current = null
      rendererRef.current = null
    }
  }, [headsImage, tailsImage, edgeImage])

  // Update brightness when choices change
  useEffect(() => {
    updateMaterialBrightness()
  }, [playerChoice, opponentChoice, currentPlayer, viewerAddress])

  // Power system management
  useEffect(() => {
    const powerSystem = powerSystemRef.current
    
    if (isCharging && !powerSystem.isCharging) {
      powerSystem.isCharging = true
      powerSystem.chargeInterval = setInterval(() => {
        powerSystem.power = Math.min(powerSystem.maxPower, powerSystem.power + powerSystem.chargeRate)
      }, 100)
    } else if (!isCharging && powerSystem.isCharging) {
      clearInterval(powerSystem.chargeInterval)
      powerSystem.isCharging = false
      powerSystem.power = 0
    }
    
    return () => {
      if (powerSystem.chargeInterval) {
        clearInterval(powerSystem.chargeInterval)
        powerSystem.isCharging = false
      }
    }
  }, [isCharging])

  // Flip animation
  useEffect(() => {
    if (!isFlipping || !flipResult || !flipDuration || !coinRef.current || isAnimatingRef.current) {
      return
    }

    console.log('🎬 Starting enhanced coin flip:', { flipResult, flipDuration })
    
    isAnimatingRef.current = true
    const coin = coinRef.current
    const powerSystem = powerSystemRef.current
    
    const flipPower = Math.max(1, Math.min(10, powerSystem.power || 5))
    const rotationSpeed = 0.05 + (flipPower * 0.02)
    
    targetAngleRef.current = (flipResult === 'tails') ? (3 * Math.PI / 2) : (Math.PI / 2)
    
    let flipStartTime = Date.now()
    
    const animateFlip = () => {
      const elapsed = Date.now() - flipStartTime
      const progress = Math.min(elapsed / flipDuration, 1)
      
      if (progress < 1) {
        const currentSpeed = rotationSpeed * (1 - progress * 0.3)
        coin.rotation.x += currentSpeed
        coin.position.y = Math.sin(progress * Math.PI) * 0.5
        requestAnimationFrame(animateFlip)
      } else {
        landOnTarget()
      }
    }
    
    const landOnTarget = () => {
      const currentRotation = coin.rotation.x
      const targetAngle = targetAngleRef.current
      
      let deltaAngle = (currentRotation % (Math.PI * 2)) - targetAngle
      
      while (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2
      while (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2
      
      if (Math.abs(deltaAngle) < 0.06) {
        coin.rotation.x = targetAngle
        coin.position.y = 0
        isAnimatingRef.current = false
        console.log('✅ Enhanced coin flip complete:', flipResult)
        return
      }
      
      coin.rotation.x -= deltaAngle * 0.1
      requestAnimationFrame(landOnTarget)
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
        width: '400px',
        height: '400px',
        cursor: isPlayerTurn ? 'pointer' : 'default',
        userSelect: 'none',
        background: isCharging ? 
          'radial-gradient(circle, rgba(255, 215, 0, 0.25) 0%, rgba(255, 215, 0, 0.1) 50%, rgba(255, 215, 0, 0.05) 100%)' : 
          'radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.03) 50%, transparent 100%)',
        boxShadow: isCharging ? 
          '0 0 30px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 215, 0, 0.2)' : 
          '0 0 15px rgba(255, 215, 0, 0.2)',
        borderRadius: '50%',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <canvas style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

export default EnhancedReliableGoldCoin 