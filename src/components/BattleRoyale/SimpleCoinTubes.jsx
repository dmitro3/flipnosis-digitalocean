import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'

const SimpleCoinTubes = ({ 
  players = {}, 
  playerOrder = [],
  onCoinLanded,
  onPowerChange
}) => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const composerRef = useRef(null)
  const coinsRef = useRef(new Map())
  const tubesRef = useRef([])
  const liquidMeshesRef = useRef(new Map())
  const animationIdRef = useRef(null)
  
  const [debugInfo, setDebugInfo] = useState({
    tubesCreated: 0,
    rendering: false
  })

  const COLORS = {
    glassRim: 0x00ffff,
    liquidBase: 0x8A00C4,
    liquidTop: 0xff1493,
    liquidGlow: 0xff69b4,
    coinGold: 0xFFD700
  }

  useEffect(() => {
    if (!mountRef.current) return

    console.log('🎮 Initializing scene with better layout...')

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    const container = mountRef.current
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    // HYBRID CAMERA - Slight perspective but still shows everything
    const camera = new THREE.PerspectiveCamera(
      35, // Narrower FOV = less distortion
      width / height,
      1,
      3000
    )
    // Position for slight 3D effect but not too steep
    camera.position.set(0, 200, 1000)
    camera.lookAt(0, 0, 0)
    
    console.log('📷 Camera positioned for optimal view')

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ReinhardToneMapping
    renderer.toneMappingExposure = 2.0 // Brighter

    container.appendChild(renderer.domElement)

    // Post-processing
    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      2.5,  // Strong glow
      0.5,
      0.2
    )
    composer.addPass(bloomPass)
    
    composerRef.current = composer
    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer

    // LIGHTING - Bright and clear
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambientLight)

    const topLight = new THREE.DirectionalLight(0xffffff, 2.0)
    topLight.position.set(0, 500, 300)
    scene.add(topLight)

    const leftLight = new THREE.PointLight(0x00ffff, 4, 1200)
    leftLight.position.set(-800, 200, 300)
    scene.add(leftLight)

    const rightLight = new THREE.PointLight(0xff1493, 4, 1200)
    rightLight.position.set(800, 200, 300)
    scene.add(rightLight)

    // TUBE LAYOUT - Match card spacing exactly
    const tubeRadius = 70
    const tubeHeight = 450
    const numTubes = 6
    
    // Calculate spacing to fill viewport width nicely
    const viewportPadding = 0.15 // 15% padding on sides
    const availableWidth = width * (1 - viewportPadding * 2)
    const spacing = availableWidth / (numTubes - 1) // Space between centers
    const startX = -(availableWidth / 2)
    
    console.log(`📐 Layout: width=${width}, spacing=${spacing.toFixed(0)}`)

    for (let i = 0; i < numTubes; i++) {
      const x = startX + (i * spacing)
      
      // GLASS TUBE - More visible, less transparent
      const tubeGeometry = new THREE.CylinderGeometry(
        tubeRadius, tubeRadius, tubeHeight, 32, 1, true
      )
      const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.35, // More visible than before
        roughness: 0.05,
        metalness: 0.1,
        transmission: 0.7, // Less transparent
        thickness: 0.8,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        side: THREE.DoubleSide
      })
      
      const tube = new THREE.Mesh(tubeGeometry, glassMaterial)
      tube.position.set(x, 0, 0)
      scene.add(tube)

      // BRIGHT CYAN RIMS
      const rimGeometry = new THREE.TorusGeometry(tubeRadius + 4, 7, 16, 64)
      const rimMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.glassRim,
        emissive: COLORS.glassRim,
        emissiveIntensity: 5.0, // Very bright
        metalness: 0.9,
        roughness: 0.05
      })
      
      const topRim = new THREE.Mesh(rimGeometry, rimMaterial)
      topRim.position.set(x, tubeHeight / 2, 0)
      topRim.rotation.x = Math.PI / 2
      scene.add(topRim)

      const bottomRim = topRim.clone()
      bottomRim.position.y = -tubeHeight / 2
      scene.add(bottomRim)

      // LIQUID - HIGHLY VISIBLE
      const liquidHeight = 220
      const liquidGeometry = new THREE.CylinderGeometry(
        tubeRadius - 5, tubeRadius - 5, liquidHeight, 32
      )
      
      const liquidMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.liquidBase,
        transparent: false, // OPAQUE
        metalness: 0.3,
        roughness: 0.3,
        emissive: COLORS.liquidBase,
        emissiveIntensity: 2.0, // BRIGHT GLOW
      })
      
      const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial)
      const liquidY = -(tubeHeight / 2) + (liquidHeight / 2)
      liquid.position.set(x, liquidY, 0)
      scene.add(liquid)

      // LIQUID SURFACE - Bright pink disc
      const surfaceGeometry = new THREE.CircleGeometry(tubeRadius - 5, 64)
      const surfaceMaterial = new THREE.MeshBasicMaterial({
        color: COLORS.liquidTop,
        transparent: false,
        side: THREE.DoubleSide
      })
      const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial)
      surface.position.set(x, liquidY + (liquidHeight / 2) + 1, 0)
      surface.rotation.x = Math.PI / 2
      scene.add(surface)

      // BRIGHT LIQUID LIGHT
      const liquidLight = new THREE.PointLight(COLORS.liquidTop, 6, 300)
      liquidLight.position.set(x, liquidY + (liquidHeight / 2), 0)
      scene.add(liquidLight)

      // SPOTLIGHT from above
      const spotlight = new THREE.SpotLight(0xffffff, 4, 600, Math.PI / 6, 0.3, 2)
      spotlight.position.set(x, tubeHeight / 2 + 250, 100)
      spotlight.target.position.set(x, 0, 0)
      scene.add(spotlight)
      scene.add(spotlight.target)

      // PLATFORM BASE - Dark with cyan glow
      const platformGeometry = new THREE.CylinderGeometry(
        tubeRadius + 18, tubeRadius + 18, 12, 32
      )
      const platformMaterial = new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x00ffff,
        emissiveIntensity: 0.4
      })
      const platform = new THREE.Mesh(platformGeometry, platformMaterial)
      platform.position.set(x, -(tubeHeight / 2) - 28, 0)
      scene.add(platform)

      // Platform glow ring
      const glowRingGeometry = new THREE.TorusGeometry(tubeRadius + 18, 2, 16, 64)
      const glowRingMaterial = new THREE.MeshBasicMaterial({
        color: COLORS.glassRim,
        transparent: true,
        opacity: 0.8
      })
      const glowRing = new THREE.Mesh(glowRingGeometry, glowRingMaterial)
      glowRing.position.set(x, -(tubeHeight / 2) - 28, 0)
      glowRing.rotation.x = Math.PI / 2
      scene.add(glowRing)

      tubesRef.current[i] = { 
        x, 
        tubeHeight, 
        tubeRadius,
        tube, 
        topRim,
        bottomRim,
        liquid,
        surface,
        liquidLight,
        spotlight,
        platform,
        glowRing,
        liquidBaseHeight: liquidHeight,
        liquidBaseY: liquidY
      }

      liquidMeshesRef.current.set(i, liquid)
      
      console.log(`✅ Tube ${i + 1} at x=${x.toFixed(0)}`)
    }

    setDebugInfo({
      tubesCreated: 6,
      rendering: false
    })

    // ANIMATION LOOP
    let frameCount = 0
    const animate = () => {
      if (!sceneRef.current || !composerRef.current) return

      frameCount++

      // Animate liquid surfaces
      tubesRef.current.forEach((tubeData, i) => {
        if (tubeData.surface) {
          const offset = i * 0.3
          tubeData.surface.rotation.z = Math.sin(frameCount * 0.015 + offset) * 0.08
          tubeData.surface.scale.set(
            1 + Math.sin(frameCount * 0.02 + offset) * 0.03,
            1 + Math.sin(frameCount * 0.02 + offset) * 0.03,
            1
          )
        }
        
        // Pulse liquid light
        if (tubeData.liquidLight) {
          tubeData.liquidLight.intensity = 6 + Math.sin(frameCount * 0.025 + i * 0.5) * 1.5
        }
        
        // Pulse glow rings
        if (tubeData.glowRing) {
          tubeData.glowRing.material.opacity = 0.6 + Math.sin(frameCount * 0.03 + i * 0.4) * 0.3
        }
      })

      // Rotate coins
      coinsRef.current.forEach((coinData) => {
        if (coinData.mesh && !coinData.isAnimating) {
          coinData.mesh.rotation.y += 0.02
        }
      })

      composerRef.current.render()
      
      if (frameCount === 60) {
        setDebugInfo(prev => ({ ...prev, rendering: true }))
      }

      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current) return

      const newWidth = mountRef.current.clientWidth || window.innerWidth
      const newHeight = mountRef.current.clientHeight || window.innerHeight

      cameraRef.current.aspect = newWidth / newHeight
      cameraRef.current.updateProjectionMatrix()
      
      rendererRef.current.setSize(newWidth, newHeight)
      composerRef.current.setSize(newWidth, newHeight)
      
      console.log(`📐 Resized: ${newWidth}x${newHeight}`)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      if (composerRef.current) {
        composerRef.current.dispose()
      }
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement)
        rendererRef.current.dispose()
      }
    }
  }, [])

  // COIN CREATION + FLIPPING
  useEffect(() => {
    if (!sceneRef.current) return

    playerOrder.forEach((playerAddr, index) => {
      if (!playerAddr || index >= 6) return

      const player = players[playerAddr.toLowerCase()]
      if (!player) return

      const tubeData = tubesRef.current[index]
      if (!tubeData) return

      let coinData = coinsRef.current.get(playerAddr)

      if (!coinData) {
        const coinRadius = 45
        const coinThickness = 10
        
        const coinGeometry = new THREE.CylinderGeometry(coinRadius, coinRadius, coinThickness, 64)
        
        const coinMaterial = new THREE.MeshStandardMaterial({
          color: COLORS.coinGold,
          metalness: 0.95,
          roughness: 0.05,
          emissive: COLORS.coinGold,
          emissiveIntensity: 0.6
        })

        const coin = new THREE.Mesh(coinGeometry, [
          coinMaterial,
          coinMaterial.clone(),
          coinMaterial.clone()
        ])

        coin.rotation.z = Math.PI / 2
        coin.position.set(tubeData.x, -(tubeData.tubeHeight / 2) + 90, 0)

        // Coin glow
        const glowGeometry = new THREE.CylinderGeometry(
          coinRadius * 1.4, coinRadius * 1.4, coinThickness * 1.3, 32
        )
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: COLORS.coinGold,
          transparent: true,
          opacity: 0.5,
          side: THREE.BackSide
        })
        const glow = new THREE.Mesh(glowGeometry, glowMaterial)
        coin.add(glow)

        const coinLight = new THREE.PointLight(COLORS.coinGold, 5, 250)
        coin.add(coinLight)

        sceneRef.current.add(coin)

        coinData = {
          mesh: coin,
          tubeData,
          isAnimating: false,
          startY: -(tubeData.tubeHeight / 2) + 90,
          topY: (tubeData.tubeHeight / 2) - 80
        }

        coinsRef.current.set(playerAddr, coinData)
      }

      // Load custom textures
      if (player.coin?.headsImage) {
        const textureLoader = new THREE.TextureLoader()
        
        textureLoader.load(player.coin.headsImage, (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace
          const material = new THREE.MeshStandardMaterial({
            map: texture,
            metalness: 0.5,
            roughness: 0.1,
            emissive: 0x333333,
            emissiveIntensity: 0.3
          })
          coinData.mesh.material[1] = material
        })

        textureLoader.load(player.coin.tailsImage, (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace
          const material = new THREE.MeshStandardMaterial({
            map: texture,
            metalness: 0.5,
            roughness: 0.1,
            emissive: 0x333333,
            emissiveIntensity: 0.3
          })
          coinData.mesh.material[2] = material
        })
      }
    })
  }, [players, playerOrder])

  // COIN FLIP ANIMATION - RESTORED
  const animateCoinFlip = (playerAddr, power, result) => {
    const coinData = coinsRef.current.get(playerAddr)
    if (!coinData || coinData.isAnimating) return

    console.log(`🪙 Flipping coin for ${playerAddr}: ${result}`)
    coinData.isAnimating = true
    const coin = coinData.mesh

    const minFlips = 5 + Math.floor(power / 2)
    const rotationsPerFlip = Math.PI * 2
    const totalRotation = minFlips * rotationsPerFlip + Math.random() * Math.PI

    const isHeads = result === 'heads'
    const targetRotation = isHeads ? 0 : Math.PI

    const startTime = Date.now()
    const startY = coin.position.y
    const startRotationX = coin.rotation.x
    
    const riseDuration = 900
    const riseHeight = coinData.topY
    const fallDuration = 1300

    const animate = () => {
      const elapsed = Date.now() - startTime
      
      if (elapsed < riseDuration) {
        // RISE
        const progress = elapsed / riseDuration
        const easeOut = 1 - Math.pow(1 - progress, 3)
        
        coin.position.y = startY + (riseHeight - startY) * easeOut
        coin.rotation.x = startRotationX + (totalRotation * easeOut * 0.6)
        
        requestAnimationFrame(animate)
      } else if (elapsed < riseDuration + fallDuration) {
        // FALL
        const progress = (elapsed - riseDuration) / fallDuration
        const easeIn = progress * progress
        
        coin.position.y = riseHeight - (riseHeight - coinData.startY) * easeIn
        
        const currentRotations = totalRotation * 0.6
        const remainingRotations = totalRotation * 0.4
        coin.rotation.x = startRotationX + currentRotations + (remainingRotations * progress)
        
        // Lock to result in final 20%
        if (progress > 0.8) {
          const landingProgress = (progress - 0.8) / 0.2
          const currentRot = coin.rotation.x
          const targetFinal = Math.floor(currentRot / (Math.PI * 2)) * (Math.PI * 2) + targetRotation
          coin.rotation.x = currentRot + (targetFinal - currentRot) * landingProgress
        }
        
        requestAnimationFrame(animate)
      } else {
        // LANDED
        coin.position.y = coinData.startY
        const finalCycles = Math.floor(coin.rotation.x / (Math.PI * 2))
        coin.rotation.x = finalCycles * (Math.PI * 2) + targetRotation
        
        coinData.isAnimating = false
        console.log(`✅ Coin landed: ${result}`)
        
        if (onCoinLanded) {
          onCoinLanded(playerAddr, result)
        }
      }
    }

    animate()
  }

  // Expose functions
  useEffect(() => {
    window.flipCoin = (playerAddr, power, result) => {
      animateCoinFlip(playerAddr, power, result)
    }
    
    window.startTubeHeating = (playerAddr) => {
      console.log('🔥 Heating:', playerAddr)
      // TODO: Add heating animation
    }

    window.shatterTube = (playerAddr) => {
      console.log('💥 Shatter:', playerAddr)
      // TODO: Add shatter animation
    }
  }, [players, playerOrder])

  return (
    <>
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#000000'
        }}
      />
      
      {/* Minimal debug */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: '#00ff00',
        padding: '10px',
        fontFamily: 'monospace',
        fontSize: '12px',
        borderRadius: '5px',
        border: '1px solid #00ff00'
      }}>
        Tubes: {debugInfo.tubesCreated}/6 | Rendering: {debugInfo.rendering ? '✅' : '⏳'}
      </div>
    </>
  )
}

export default SimpleCoinTubes
