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

    console.log('🎮 Initializing 3D scene...')

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    scene.fog = new THREE.Fog(0x000000, 800, 2000) // Add depth fog

    const container = mountRef.current
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    // PERSPECTIVE CAMERA - gives 3D depth!
    const camera = new THREE.PerspectiveCamera(
      45, // FOV
      width / height, // aspect
      1, // near
      3000 // far
    )
    // Position camera at an angle for better view
    camera.position.set(0, 400, 1200)
    camera.lookAt(0, -100, 0)
    
    console.log('📷 Perspective camera created')

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ReinhardToneMapping
    renderer.toneMappingExposure = 1.8
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    container.appendChild(renderer.domElement)

    // Post-processing with bloom
    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      2.0,  // strength - MORE GLOW
      0.6,  // radius
      0.3   // threshold - lower = more things glow
    )
    composer.addPass(bloomPass)
    
    composerRef.current = composer
    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer

    // LIGHTING - Arcade style
    const ambientLight = new THREE.AmbientLight(0x404040, 1.0)
    scene.add(ambientLight)

    // Main top light
    const topLight = new THREE.DirectionalLight(0xffffff, 1.5)
    topLight.position.set(0, 800, 500)
    topLight.castShadow = true
    scene.add(topLight)

    // Colored accent lights for arcade feel
    const leftNeon = new THREE.PointLight(0x00ffff, 3, 1500)
    leftNeon.position.set(-1000, 300, 400)
    scene.add(leftNeon)

    const rightNeon = new THREE.PointLight(0xff1493, 3, 1500)
    rightNeon.position.set(1000, 300, 400)
    scene.add(rightNeon)

    // GROUND PLANE - neon grid (optional but looks cool)
    const gridHelper = new THREE.GridHelper(3000, 50, 0x00ffff, 0x004444)
    gridHelper.position.y = -300
    scene.add(gridHelper)

    // CREATE TUBES - with proper materials
    const tubeRadius = 70
    const tubeHeight = 500
    const numTubes = 6
    const spacing = 300
    const startX = -((spacing * (numTubes - 1)) / 2)

    console.log('🧪 Creating tubes...')

    for (let i = 0; i < numTubes; i++) {
      const x = startX + (i * spacing)
      
      // GLASS TUBE - highly transparent with refraction
      const tubeGeometry = new THREE.CylinderGeometry(
        tubeRadius, tubeRadius, tubeHeight, 32, 1, true
      )
      const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.15, // Very transparent
        roughness: 0.0,
        metalness: 0.0,
        transmission: 0.95, // High transmission = see-through
        thickness: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        side: THREE.DoubleSide,
        envMapIntensity: 1.0
      })
      
      const tube = new THREE.Mesh(tubeGeometry, glassMaterial)
      tube.position.set(x, 0, 0)
      tube.castShadow = true
      tube.receiveShadow = true
      scene.add(tube)

      // GLOWING RIMS - top and bottom
      const rimGeometry = new THREE.TorusGeometry(tubeRadius + 3, 6, 16, 64)
      const rimMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.glassRim,
        emissive: COLORS.glassRim,
        emissiveIntensity: 4.0, // BRIGHT GLOW
        metalness: 0.9,
        roughness: 0.1
      })
      
      const topRim = new THREE.Mesh(rimGeometry, rimMaterial)
      topRim.position.set(x, tubeHeight / 2, 0)
      topRim.rotation.x = Math.PI / 2
      scene.add(topRim)

      const bottomRim = topRim.clone()
      bottomRim.position.y = -tubeHeight / 2
      scene.add(bottomRim)

      // LIQUID - bright, glowing, with gradient effect
      const liquidHeight = 250
      const liquidGeometry = new THREE.CylinderGeometry(
        tubeRadius - 5, tubeRadius - 5, liquidHeight, 32
      )
      
      // Create vertex colors for gradient (purple at bottom, pink at top)
      const colors = []
      const positions = liquidGeometry.attributes.position
      for (let j = 0; j < positions.count; j++) {
        const y = positions.getY(j)
        const t = (y + liquidHeight / 2) / liquidHeight // 0 at bottom, 1 at top
        
        // Interpolate from purple to pink
        const r = 0.54 + t * 0.46 // 0.54 -> 1.0
        const g = 0.0 + t * 0.08  // 0.0 -> 0.08
        const b = 0.77 + t * 0.19 // 0.77 -> 0.96
        
        colors.push(r, g, b)
      }
      liquidGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
      
      const liquidMaterial = new THREE.MeshStandardMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        metalness: 0.4,
        roughness: 0.2,
        emissive: COLORS.liquidBase,
        emissiveIntensity: 1.5,
        side: THREE.DoubleSide
      })
      
      const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial)
      const liquidY = -(tubeHeight / 2) + (liquidHeight / 2)
      liquid.position.set(x, liquidY, 0)
      liquid.castShadow = true
      scene.add(liquid)

      // LIQUID SURFACE - bright disc
      const surfaceGeometry = new THREE.CircleGeometry(tubeRadius - 5, 64)
      const surfaceMaterial = new THREE.MeshBasicMaterial({
        color: COLORS.liquidTop,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      })
      const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial)
      surface.position.set(x, liquidY + (liquidHeight / 2), 0)
      surface.rotation.x = Math.PI / 2
      scene.add(surface)

      // LIQUID LIGHT - point light at surface
      const liquidLight = new THREE.PointLight(COLORS.liquidTop, 5, 300)
      liquidLight.position.set(x, liquidY + (liquidHeight / 2), 0)
      scene.add(liquidLight)

      // SPOTLIGHT from above (no helper)
      const spotlight = new THREE.SpotLight(0xffffff, 3, 600, Math.PI / 5, 0.3, 2)
      spotlight.position.set(x, tubeHeight / 2 + 300, 150)
      spotlight.target.position.set(x, 0, 0)
      spotlight.castShadow = true
      scene.add(spotlight)
      scene.add(spotlight.target)

      // PLATFORM BASE
      const platformGeometry = new THREE.CylinderGeometry(
        tubeRadius + 20, tubeRadius + 20, 15, 32
      )
      const platformMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x00ffff,
        emissiveIntensity: 0.2
      })
      const platform = new THREE.Mesh(platformGeometry, platformMaterial)
      platform.position.set(x, -(tubeHeight / 2) - 30, 0)
      platform.castShadow = true
      platform.receiveShadow = true
      scene.add(platform)

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
        liquidBaseHeight: liquidHeight,
        liquidBaseY: liquidY
      }

      liquidMeshesRef.current.set(i, liquid)
      
      console.log(`✅ Tube ${i + 1} created at x=${x}`)
    }

    setDebugInfo({
      tubesCreated: 6,
      rendering: false
    })

    console.log('🎬 Starting animation...')

    // ANIMATION LOOP
    let frameCount = 0
    const animate = () => {
      if (!sceneRef.current || !composerRef.current) return

      frameCount++

      // Subtle camera sway for dynamic feel
      if (cameraRef.current) {
        const t = frameCount * 0.001
        cameraRef.current.position.x = Math.sin(t * 0.5) * 50
        cameraRef.current.lookAt(0, -100, 0)
      }

      // Animate liquid surfaces (wave effect)
      tubesRef.current.forEach((tubeData, i) => {
        if (tubeData.surface) {
          const offset = i * 0.5
          tubeData.surface.rotation.z = Math.sin(frameCount * 0.02 + offset) * 0.1
        }
        
        // Pulse liquid glow
        if (tubeData.liquidLight) {
          tubeData.liquidLight.intensity = 5 + Math.sin(frameCount * 0.03 + i) * 1
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
        console.log('✅ Rendering confirmed')
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

  // Simplified coin creation
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
        const coinRadius = 50
        const coinThickness = 10
        
        const coinGeometry = new THREE.CylinderGeometry(coinRadius, coinRadius, coinThickness, 64)
        
        const coinMaterial = new THREE.MeshStandardMaterial({
          color: COLORS.coinGold,
          metalness: 0.95,
          roughness: 0.05,
          emissive: COLORS.coinGold,
          emissiveIntensity: 0.5
        })

        const coin = new THREE.Mesh(coinGeometry, [
          coinMaterial,
          coinMaterial,
          coinMaterial
        ])

        coin.rotation.z = Math.PI / 2
        coin.position.set(tubeData.x, -(tubeData.tubeHeight / 2) + 100, 0)
        coin.castShadow = true

        // Coin glow
        const glowGeometry = new THREE.CylinderGeometry(
          coinRadius * 1.3, coinRadius * 1.3, coinThickness * 1.2, 32
        )
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: COLORS.coinGold,
          transparent: true,
          opacity: 0.4,
          side: THREE.BackSide
        })
        const glow = new THREE.Mesh(glowGeometry, glowMaterial)
        coin.add(glow)

        const coinLight = new THREE.PointLight(COLORS.coinGold, 4, 250)
        coin.add(coinLight)

        sceneRef.current.add(coin)

        coinData = {
          mesh: coin,
          tubeData,
          isAnimating: false
        }

        coinsRef.current.set(playerAddr, coinData)
      }

      // Load custom textures if available
      if (player.coin?.headsImage) {
        const textureLoader = new THREE.TextureLoader()
        
        textureLoader.load(player.coin.headsImage, (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace
          const material = new THREE.MeshStandardMaterial({
            map: texture,
            metalness: 0.5,
            roughness: 0.1,
            emissive: 0x222222,
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
            emissive: 0x222222,
            emissiveIntensity: 0.3
          })
          coinData.mesh.material[2] = material
        })
      }
    })
  }, [players, playerOrder])

  // Expose functions (simplified for now)
  window.startTubeHeating = (playerAddr) => {
    console.log('🔥 Heating:', playerAddr)
  }

  window.shatterTube = (playerAddr) => {
    console.log('💥 Shatter:', playerAddr)
  }

  window.flipCoin = (playerAddr, power, result) => {
    console.log('🪙 Flip:', playerAddr, result)
  }

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
      
      {/* MINIMAL DEBUG */}
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
