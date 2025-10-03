import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const OptimizedGoldCoin = React.memo(({
  isFlipping = false,
  flipResult = null,
  flipDuration = 2000,
  size = 300,
  customHeadsImage = null,
  customTailsImage = null,
  material = null,
  onFlipComplete = null,
}) => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const coinRef = useRef(null)
  const textureCache = useRef({})
  const animationIdRef = useRef(null)
  const isAnimatingRef = useRef(false)

  // Optimized texture creation
  const createOptimizedTexture = (type, customImage = null) => {
    const cacheKey = `${type}-${customImage || 'default'}`
    if (textureCache.current[cacheKey]) {
      return textureCache.current[cacheKey]
    }

    if (customImage) {
      const loader = new THREE.TextureLoader()
      const texture = loader.load(customImage)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.flipY = false
      textureCache.current[cacheKey] = texture
      return texture
    }

    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    if (type === 'edge') {
      ctx.fillStyle = '#F8F8F8'
      ctx.fillRect(0, 0, size, size)
      ctx.strokeStyle = '#E0E0E0'
      ctx.lineWidth = 2
      for (let i = 0; i < size; i += 12) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, size)
        ctx.stroke()
      }
    } else if (type === 'heads') {
      const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
      gradient.addColorStop(0, '#FFD700')
      gradient.addColorStop(0.5, '#FFA500')
      gradient.addColorStop(1, '#FF8C00')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
      ctx.fillStyle = '#333'
      ctx.font = 'bold 200px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('H', size/2, size/2)
    } else if (type === 'tails') {
      const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
      gradient.addColorStop(0, '#E5E5E5')
      gradient.addColorStop(0.5, '#C0C0C0')
      gradient.addColorStop(1, '#A0A0A0')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
      ctx.fillStyle = '#333'
      ctx.font = 'bold 200px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('T', size/2, size/2)
    } else {
      ctx.clearRect(0, 0, size, size)
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.flipY = false
    textureCache.current[cacheKey] = texture
    return texture
  }

  // Initialize scene
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
    camera.position.set(0, 3, 10)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(size, size)
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    renderer.domElement.style.display = 'block'
    renderer.domElement.style.margin = '0 auto'
    renderer.domElement.style.position = 'relative'
    renderer.domElement.style.left = '50%'
    renderer.domElement.style.transform = 'translateX(-50%)'
    
    mountRef.current.appendChild(renderer.domElement)
    sceneRef.current = scene
    rendererRef.current = renderer

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    const spotLight = new THREE.SpotLight(0xffffff, 0.6)
    spotLight.position.set(0, 10, 5)
    scene.add(spotLight)

    const fillLight = new THREE.DirectionalLight(0xFFFFFF, 0.4)
    fillLight.position.set(0, -3, 5)
    scene.add(fillLight)

    const edgeColor = material?.edgeColor ? parseInt(material.edgeColor.replace('#', '0x')) : 0xFFFFFF
    
    const materials = [
      new THREE.MeshStandardMaterial({ 
        map: createOptimizedTexture('edge'),
        metalness: 0.3,
        roughness: 0.2,
        color: edgeColor,
        emissive: 0x222222,
        emissiveIntensity: 0.1
      }),
      new THREE.MeshStandardMaterial({ 
        map: createOptimizedTexture('heads', customHeadsImage),
        metalness: 0.3,
        roughness: 0.2,
        color: 0xFFFFFF,
        emissive: 0x222222,
        emissiveIntensity: 0.1
      }),
      new THREE.MeshStandardMaterial({ 
        map: createOptimizedTexture('tails', customTailsImage),
        metalness: 0.3,
        roughness: 0.2,
        color: 0xFFFFFF,
        emissive: 0x222222,
        emissiveIntensity: 0.1
      })
    ]

    const geometry = new THREE.CylinderGeometry(3, 3, 0.4, 48)
    const coin = new THREE.Mesh(geometry, materials)
    coin.scale.y = 1.5
    scene.add(coin)
    coinRef.current = coin

    coin.rotation.x = 0
    coin.rotation.y = Math.PI / 2
    coin.rotation.z = 0

    // Animation loop with adaptive frame rate
    let lastFrameTime = 0
    
    const animate = (currentTime) => {
      if (!coinRef.current || !rendererRef.current) return

      const deltaTime = currentTime - lastFrameTime
      const targetFPS = isAnimatingRef.current ? 60 : 30
      const frameInterval = 1000 / targetFPS

      if (deltaTime >= frameInterval) {
        lastFrameTime = currentTime - (deltaTime % frameInterval)
        
        const coin = coinRef.current

        if (!isAnimatingRef.current) {
          // Idle animation - very slow rotation
          coin.scale.set(1, 1.5, 1)
          coin.position.y = 0
          coin.rotation.x += 0.000017
        }

        renderer.render(scene, camera)
      }
      
      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate(0)

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      
      materials.forEach(mat => {
        if (mat.map) mat.map.dispose()
        mat.dispose()
      })
      geometry.dispose()
      renderer.dispose()
      
      Object.values(textureCache.current).forEach(texture => {
        texture.dispose()
      })
      textureCache.current = {}
      
      sceneRef.current = null
      rendererRef.current = null
    }
  }, [size, customHeadsImage, customTailsImage])

  // Flip animation
  useEffect(() => {
    if (!isFlipping || !flipResult || !coinRef.current) return
    
    const flipCoin = () => {
      if (isAnimatingRef.current) return
      
      isAnimatingRef.current = true
      const coin = coinRef.current
      
      const totalRotation = 10 * Math.PI * 2
      const isHeads = flipResult === 'heads'
      const targetEdgeRotation = isHeads ? 0 : Math.PI
      
      const startTime = Date.now()
      const startRotation = {
        x: coin.rotation.x,
        y: coin.rotation.y,
        z: coin.rotation.z
      }
      
      const launchHeight = 2.5
      
      const animateFlip = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / flipDuration, 1)
        const easeOut = 1 - Math.pow(1 - progress, 3)
        
        const heightProgress = Math.sin(progress * Math.PI)
        coin.position.y = heightProgress * launchHeight
        
        coin.rotation.x = startRotation.x + (totalRotation * easeOut)
        
        const wobbleAmount = 0.1 * Math.sin(elapsed * 0.01) * (1 - progress)
        coin.rotation.y = Math.PI / 2 + wobbleAmount
        coin.rotation.z = wobbleAmount * 0.5
        
        if (progress < 1) {
          requestAnimationFrame(animateFlip)
        } else {
          // Land on edge
          const landingDuration = 200
          const landStartTime = Date.now()
          const landStartRotation = coin.rotation.x
          const currentRotations = Math.floor(landStartRotation / (Math.PI * 2))
          const finalRotationX = currentRotations * Math.PI * 2 + targetEdgeRotation
          
          const animateLanding = () => {
            const elapsed = Date.now() - landStartTime
            const progress = Math.min(elapsed / landingDuration, 1)
            const easeInOut = progress < 0.5 
              ? 2 * progress * progress 
              : 1 - Math.pow(-2 * progress + 2, 2) / 2
            
            coin.rotation.x = landStartRotation + (finalRotationX - landStartRotation) * easeInOut
            coin.rotation.y = Math.PI / 2
            coin.rotation.z = 0
            coin.position.y = 0
            
            if (progress < 0.3) {
              coin.position.y = Math.sin(progress * 10) * 0.1 * (1 - progress * 3)
            }
            
            if (progress < 1) {
              requestAnimationFrame(animateLanding)
            } else {
              coin.rotation.x = finalRotationX
              coin.rotation.y = Math.PI / 2
              coin.rotation.z = 0
              isAnimatingRef.current = false
              
              if (onFlipComplete) {
                onFlipComplete()
              }
            }
          }
          
          animateLanding()
        }
      }
      
      animateFlip()
    }
    
    flipCoin()
    
    return () => {
      isAnimatingRef.current = false
    }
  }, [isFlipping, flipResult, flipDuration, onFlipComplete])

  // Update textures when custom images change
  useEffect(() => {
    if (!coinRef.current) return

    const coin = coinRef.current
    
    Object.values(textureCache.current).forEach(texture => {
      texture.dispose()
    })
    textureCache.current = {}
    
    if (coin.material[1]) {
      if (coin.material[1].map) coin.material[1].map.dispose()
      coin.material[1].map = createOptimizedTexture('heads', customHeadsImage)
      coin.material[1].needsUpdate = true
    }
    
    if (coin.material[2]) {
      if (coin.material[2].map) coin.material[2].map.dispose()
      coin.material[2].map = createOptimizedTexture('tails', customTailsImage)
      coin.material[2].needsUpdate = true
    }
    
    if (coin.material[0]) {
      if (coin.material[0].map) coin.material[0].map.dispose()
      coin.material[0].map = createOptimizedTexture('edge')
      coin.material[0].needsUpdate = true
    }
  }, [customHeadsImage, customTailsImage])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none'
      }}
    >
      <div
        ref={mountRef}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: 'relative',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none'
        }}
      />
    </div>
  )
})

export default OptimizedGoldCoin