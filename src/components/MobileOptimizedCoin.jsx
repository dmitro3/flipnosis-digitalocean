import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'

const MobileOptimizedCoin = ({ 
  isFlipping, 
  flipResult, 
  flipDuration = 3000,
  onPowerCharge, 
  onPowerRelease,
  isPlayerTurn,
  isCharging = false,
  chargingPlayer,
  creatorPower = 0,
  joinerPower = 0,
  creatorChoice = null,
  joinerChoice = null, 
  isCreator = false,
  customHeadsImage = null,
  customTailsImage = null,
  size = 187
}) => {
  const mountRef = useRef(null)
  const coinRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const animationIdRef = useRef(null)
  const isAnimatingRef = useRef(false)
  const currentCoinSideRef = useRef('heads')
  
  // Aggressive caching for mobile
  const textureCache = useRef({})
  const materialCache = useRef({})
  
  // Performance monitoring
  const frameCountRef = useRef(0)
  const lastFPSCheck = useRef(Date.now())
  
  // Test mode
  const [testMode, setTestMode] = useState(false)

  // Create optimized textures
  const createMobileTexture = (type, customImage = null) => {
    const cacheKey = `${type}-${customImage || 'default'}-${creatorChoice}-${joinerChoice}`
    
    if (textureCache.current[cacheKey]) {
      return textureCache.current[cacheKey]
    }

    if (customImage) {
      const loader = new THREE.TextureLoader()
      const texture = loader.load(customImage)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.generateMipmaps = false
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      textureCache.current[cacheKey] = texture
      return texture
    }

    // Create procedural texture
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')

    if (type === 'heads') {
      // Gold gradient
      const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
      gradient.addColorStop(0, '#FFFFFF')
      gradient.addColorStop(0.3, '#FFD700')
      gradient.addColorStop(0.7, '#FFA500')
      gradient.addColorStop(1, '#CD853F')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 256, 256)
      
      // Crown symbol
      ctx.fillStyle = '#2C1810'
      ctx.font = 'bold 64px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('♔', 128, 108)
      
      // HEADS text with choice coloring
      const isMyChoice = (creatorChoice === 'heads' && isCreator) || (joinerChoice === 'heads' && !isCreator)
      const isOpponentChoice = (creatorChoice === 'heads' && !isCreator) || (joinerChoice === 'heads' && isCreator)
      
      if (isMyChoice) {
        ctx.fillStyle = '#00FF00'
        ctx.shadowColor = '#00FF00'
        ctx.shadowBlur = 8
      } else if (isOpponentChoice) {
        ctx.fillStyle = '#FF0000'
        ctx.shadowColor = '#FF0000'
        ctx.shadowBlur = 8
      } else {
        ctx.fillStyle = '#2C1810'
        ctx.shadowBlur = 0
      }
      
      ctx.font = 'bold 32px Arial'
      ctx.fillText('HEADS', 128, 148)
      ctx.shadowBlur = 0
      
      // Border
      ctx.strokeStyle = '#8B4513'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(128, 128, 120, 0, Math.PI * 2)
      ctx.stroke()
      
    } else if (type === 'tails') {
      // Same gradient
      const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
      gradient.addColorStop(0, '#FFFFFF')
      gradient.addColorStop(0.3, '#FFD700')
      gradient.addColorStop(0.7, '#FFA500')
      gradient.addColorStop(1, '#CD853F')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 256, 256)
      
      // Diamond symbol
      ctx.fillStyle = '#2C1810'
      ctx.font = 'bold 64px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('♦', 128, 108)
      
      // TAILS text with choice coloring
      const isMyChoice = (creatorChoice === 'tails' && isCreator) || (joinerChoice === 'tails' && !isCreator)
      const isOpponentChoice = (creatorChoice === 'tails' && !isCreator) || (joinerChoice === 'tails' && isCreator)
      
      if (isMyChoice) {
        ctx.fillStyle = '#00FF00'
        ctx.shadowColor = '#00FF00'
        ctx.shadowBlur = 8
      } else if (isOpponentChoice) {
        ctx.fillStyle = '#FF0000'
        ctx.shadowColor = '#FF0000'
        ctx.shadowBlur = 8
      } else {
        ctx.fillStyle = '#2C1810'
        ctx.shadowBlur = 0
      }
      
      ctx.font = 'bold 32px Arial'
      ctx.fillText('TAILS', 128, 148)
      ctx.shadowBlur = 0
      
      // Border
      ctx.strokeStyle = '#8B4513'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(128, 128, 120, 0, Math.PI * 2)
      ctx.stroke()
      
    } else if (type === 'edge') {
      // Edge pattern
      ctx.fillStyle = '#DAA520'
      ctx.fillRect(0, 0, 256, 256)
      
      // Reeding lines
      ctx.strokeStyle = '#B8860B'
      ctx.lineWidth = 2
      for (let i = 0; i < 256; i += 8) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, 256)
        ctx.stroke()
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.generateMipmaps = false
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    
    textureCache.current[cacheKey] = texture
    return texture
  }

  // Create materials with caching
  const createMobileMaterial = (type, customImage = null) => {
    const cacheKey = `material-${type}-${customImage || 'default'}-${creatorChoice}-${joinerChoice}`
    
    if (materialCache.current[cacheKey]) {
      return materialCache.current[cacheKey]
    }

    const material = new THREE.MeshPhongMaterial({
      map: createMobileTexture(type, customImage),
      color: 0xFFFFFF,
      shininess: 60,
      specular: 0x333333
    })
    
    materialCache.current[cacheKey] = material
    return material
  }

  // Test flip
  const testFlip = () => {
    if (!testMode || isAnimatingRef.current) return
    
    const results = ['heads', 'tails']
    const result = results[Math.floor(Math.random() * results.length)]
    
    simulateFlip(result)
  }

  const simulateFlip = (result) => {
    if (!coinRef.current) {
      console.warn('⚠️ No coin ref available for flip')
      return
    }
    
    if (isAnimatingRef.current) {
      console.log('⏸️ Flip already in progress, skipping')
      return
    }
    
    console.log('🎬 Mobile 3D flip starting:', { 
      result, 
      testMode,
      isFlipping,
      currentSide: currentCoinSideRef.current,
      coinVisible: coinRef.current?.visible !== false
    })
    
    isAnimatingRef.current = true
    
    const coin = coinRef.current
    const currentSide = currentCoinSideRef.current
    const needsToFlip = currentSide !== result
    
    // Ensure coin is visible during flip
    coin.visible = true
    
    // Power calculations
    const totalPower = creatorPower + joinerPower || 5
    const powerRatio = Math.min(totalPower / 10, 1)
    
    const baseRotations = 8 + (powerRatio * 10)
    const halfFlips = Math.floor(baseRotations * 2) + (needsToFlip ? 1 : 0)
    const totalRotation = halfFlips * Math.PI
    const duration = 2500 + (powerRatio * 1500)
    
    console.log('📊 Mobile flip params:', {
      currentSide,
      targetSide: result,
      needsToFlip,
      rotations: baseRotations.toFixed(1),
      duration: duration + 'ms',
      power: totalPower
    })
    
    const startRotation = coin.rotation.x
    const startTime = Date.now()
    
    const animateFlip = () => {
      if (!coinRef.current) {
        console.warn('⚠️ Coin disappeared during animation')
        isAnimatingRef.current = false
        return
      }
      
      if (!isAnimatingRef.current) {
        console.log('⏹️ Animation stopped externally')
        return
      }
      
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      if (progress < 1) {
        // Three-phase easing
        let easedProgress
        if (progress < 0.2) {
          easedProgress = (progress / 0.2) * 0.4
        } else if (progress < 0.8) {
          const midProgress = (progress - 0.2) / 0.6
          easedProgress = 0.4 + (midProgress * 0.5)
        } else {
          const endProgress = (progress - 0.8) / 0.2
          const eased = 1 - Math.pow(1 - endProgress, 4)
          easedProgress = 0.9 + (eased * 0.1)
        }
        
        coin.rotation.x = startRotation + (totalRotation * easedProgress)
        
        // Vertical motion
        const jumpHeight = 0.5 + (powerRatio * 0.3)
        coin.position.y = Math.sin(progress * Math.PI) * jumpHeight
        
        // Wobble
        const wobble = Math.sin(elapsed * 0.02) * 0.02 * (1 - progress)
        coin.rotation.z = wobble
        coin.rotation.y = Math.PI / 2 + wobble * 0.5
        
        requestAnimationFrame(animateFlip)
      } else {
        // Complete
        coin.rotation.x = startRotation + totalRotation
        coin.rotation.y = Math.PI / 2
        coin.rotation.z = 0
        coin.position.set(0, 0, 0)
        coin.visible = true // Ensure visibility
        
        currentCoinSideRef.current = result
        isAnimatingRef.current = false
        
        console.log('✅ Mobile 3D flip complete:', { 
          result, 
          finalRotation: coin.rotation.x,
          visible: coin.visible 
        })
      }
    }
    
    animateFlip()
  }

  // Initialize scene
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return

    console.log('🎯 Creating mobile optimized 3D coin')

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
    camera.position.set(0, 0, 8)

    const renderer = new THREE.WebGLRenderer({ 
      antialias: false,
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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(3, 3, 5)
    scene.add(directionalLight)

    // Create coin
    const materials = [
      createMobileMaterial('edge'),
      createMobileMaterial('heads', customHeadsImage),
      createMobileMaterial('tails', customTailsImage)
    ]

    const geometry = new THREE.CylinderGeometry(3, 3, 0.4, 32)
    const coin = new THREE.Mesh(geometry, materials)
    
    scene.add(coin)
    coinRef.current = coin

    // Initial position
    coin.rotation.x = -Math.PI / 2
    coin.rotation.y = Math.PI / 2
    coin.visible = true // Ensure initial visibility
    currentCoinSideRef.current = 'heads'
    
    console.log('🪙 Mobile coin initialized:', {
      position: coin.position,
      rotation: coin.rotation,
      visible: coin.visible,
      scale: coin.scale
    })

    // Animation loop
    const animate = () => {
      if (!coinRef.current || !rendererRef.current) {
        console.warn('⚠️ Missing refs in animation loop:', {
          coin: !!coinRef.current,
          renderer: !!rendererRef.current
        })
        return
      }

      const coin = coinRef.current
      const time = Date.now() * 0.001
      
      // Ensure coin stays visible
      coin.visible = true
      
      if (!isAnimatingRef.current) {
        if (isCharging) {
          const intensity = (creatorPower + joinerPower) / 20
          coin.position.y = Math.sin(time * 6) * 0.1 * intensity
          coin.scale.set(1 + intensity * 0.05, 1 + intensity * 0.05, 1 + intensity * 0.05)
        } else {
          coin.scale.set(1, 1, 1)
          coin.position.set(0, 0, 0)
          coin.position.y = Math.sin(time * 2) * 0.02
        }
      }

      // FPS monitoring with visibility check
      frameCountRef.current++
      if (Date.now() - lastFPSCheck.current > 1000) {
        console.log(`📱 Mobile 3D FPS: ${frameCountRef.current} | Coin visible: ${coin.visible} | Test: ${testMode}`)
        frameCountRef.current = 0
        lastFPSCheck.current = Date.now()
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
      geometry.dispose()
      materials.forEach(mat => mat.dispose())
      renderer.dispose()
    }
  }, [size, creatorChoice, joinerChoice])

  // Handle game flips
  useEffect(() => {
    if (!isFlipping || !flipResult || testMode) return
    simulateFlip(flipResult)
  }, [isFlipping, flipResult, creatorPower, joinerPower])

  return (
    <div style={{ position: 'relative' }}>
      <div 
        ref={mountRef}
        style={{
          width: size,
          height: size,
          margin: '0 auto',
          cursor: isPlayerTurn ? 'pointer' : 'default'
        }}
        onTouchStart={!testMode ? onPowerCharge : undefined}
        onTouchEnd={!testMode ? onPowerRelease : undefined}
      />

      {/* Test Interface */}
      <div style={{
        position: 'absolute',
        top: size + 10,
        left: 0,
        right: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '12px',
        padding: '12px',
        color: '#fff',
        fontSize: '14px'
      }}>
        <div style={{ marginBottom: '10px', textAlign: 'center' }}>
          <button
            onClick={() => setTestMode(!testMode)}
            style={{
              background: testMode ? '#00FF41' : '#666',
              color: testMode ? '#000' : '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {testMode ? '3D TEST ON' : 'ENABLE 3D TEST'}
          </button>
        </div>

        {testMode && (
          <>
            <div style={{ 
              fontSize: '12px', 
              textAlign: 'center', 
              marginBottom: '10px',
              color: '#ccc'
            }}>
              Mobile Optimized Three.js Coin
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={testFlip}
                disabled={isAnimatingRef.current}
                style={{
                  background: !isAnimatingRef.current ? '#FF1493' : '#444',
                  color: !isAnimatingRef.current ? '#fff' : '#999',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: !isAnimatingRef.current ? 'pointer' : 'not-allowed'
                }}
              >
                {isAnimatingRef.current ? 'FLIPPING...' : 'FLIP 3D!'}
              </button>
            </div>

            <div style={{
              textAlign: 'center',
              marginTop: '8px',
              fontSize: '12px',
              color: '#aaa'
            }}>
              Current: {currentCoinSideRef.current.toUpperCase()}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MobileOptimizedCoin 