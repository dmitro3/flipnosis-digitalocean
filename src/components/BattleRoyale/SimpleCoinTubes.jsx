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
  const bubbleSystemsRef = useRef(new Map())
  const glassShardSystemsRef = useRef(new Map())
  const liquidSpraySystemsRef = useRef(new Map())
  const tubeStatesRef = useRef(new Map())
  const animationIdRef = useRef(null)
  
  // DEBUG STATE
  const [debugInfo, setDebugInfo] = useState({
    tubesCreated: 0,
    liquidsCreated: 0,
    materialsLoaded: false,
    cameraPosition: [0, 0, 0],
    cameraFrustum: {},
    tubePositions: [],
    rendering: false,
    canvasSize: [0, 0],
    errors: []
  })

  const COLORS = {
    glassRim: 0x00ffff,
    liquidBase: 0x8A00C4,
    liquidTop: 0xff1493,
    liquidGlow: 0xff69b4,
    bubbleColor: 0xff1493,
    splashGreen: 0x00ff41,
    coinGold: 0xFFD700
  }

  // DEBUG HELPER - Add visual indicators
  const addDebugHelper = (scene, x, y, z, color, label) => {
    const geometry = new THREE.BoxGeometry(20, 20, 20)
    const material = new THREE.MeshBasicMaterial({ 
      color: color,
      wireframe: true 
    })
    const cube = new THREE.Mesh(geometry, material)
    cube.position.set(x, y, z)
    scene.add(cube)
    
    console.log(`🎯 Debug Helper "${label}" at (${x}, ${y}, ${z})`)
  }

  // DEBUG LOGGER
  const log = (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString()
    console.log(`[${timestamp}] 🔍 ${message}`, data || '')
    
    setDebugInfo(prev => ({
      ...prev,
      errors: [...prev.errors, { time: timestamp, message, data }].slice(-10)
    }))
  }

  useEffect(() => {
    if (!mountRef.current) {
      log('ERROR: mountRef.current is null')
      return
    }

    log('Starting initialization...')

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    log('Scene created', { background: scene.background.getHexString() })

    const container = mountRef.current
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight
    log('Container dimensions', { width, height })

    // Camera setup with debug
    const aspectRatio = width / height
    const viewWidth = 2000
    const viewHeight = viewWidth / aspectRatio
    
    const camera = new THREE.OrthographicCamera(
      -viewWidth / 2, viewWidth / 2,
      viewHeight / 2, -viewHeight / 2,
      0.1, 2000
    )
    camera.position.set(0, 0, 300)
    camera.lookAt(0, 0, 0)
    
    log('Camera created', { 
      left: camera.left, 
      right: camera.right, 
      top: camera.top, 
      bottom: camera.bottom,
      position: camera.position.toArray()
    })

    // Add camera frustum debug helper
    const frustumHelper = new THREE.CameraHelper(camera)
    scene.add(frustumHelper)
    log('Camera frustum helper added')

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ReinhardToneMapping
    renderer.toneMappingExposure = 1.5
    
    log('Renderer created', {
      size: [width, height],
      pixelRatio: renderer.getPixelRatio(),
      capabilities: renderer.capabilities
    })

    container.appendChild(renderer.domElement)
    log('Canvas appended to DOM')

    // Check canvas z-index
    const canvasStyle = window.getComputedStyle(renderer.domElement)
    log('Canvas computed style', {
      zIndex: canvasStyle.zIndex,
      position: canvasStyle.position,
      width: canvasStyle.width,
      height: canvasStyle.height
    })

    // Post-processing with error handling
    let composer
    try {
      composer = new EffectComposer(renderer)
      const renderPass = new RenderPass(scene, camera)
      composer.addPass(renderPass)
      
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        1.5,
        0.4,
        0.85
      )
      composer.addPass(bloomPass)
      log('Post-processing setup complete')
    } catch (error) {
      log('ERROR: Post-processing failed', error)
      composer = null
    }
    
    composerRef.current = composer
    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer

    // LIGHTING with debug
    log('Setting up lighting...')
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)
    log('Ambient light added', { intensity: 0.8 })

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2)
    mainLight.position.set(0, 500, 400)
    scene.add(mainLight)
    
    // Add helper for main light
    const mainLightHelper = new THREE.DirectionalLightHelper(mainLight, 50)
    scene.add(mainLightHelper)
    log('Main directional light added with helper')

    const leftAccent = new THREE.PointLight(0x00ffff, 2, 800)
    leftAccent.position.set(-800, 200, 200)
    scene.add(leftAccent)
    
    const leftHelper = new THREE.PointLightHelper(leftAccent, 30)
    scene.add(leftHelper)
    log('Left accent light added')

    const rightAccent = new THREE.PointLight(0xff1493, 2, 800)
    rightAccent.position.set(800, 200, 200)
    scene.add(rightAccent)
    
    const rightHelper = new THREE.PointLightHelper(rightAccent, 30)
    scene.add(rightHelper)
    log('Right accent light added')

    // TUBE CREATION with extensive debug
    log('Creating tubes...')
    const tubeRadius = 70
    const tubeHeight = 500
    const numTubes = 6
    
    const availableWidth = width * 0.9
    const spacing = availableWidth / numTubes
    const startX = -((spacing * (numTubes - 1)) / 2)
    
    log('Tube layout calculated', { 
      availableWidth, 
      spacing, 
      startX,
      numTubes 
    })

    const tubePositions = []

    for (let i = 0; i < numTubes; i++) {
      const x = startX + (i * spacing)
      tubePositions.push(x)
      log(`Creating tube ${i + 1}/6 at x=${x}`)
      
      // Add debug marker at tube position
      addDebugHelper(scene, x, 0, 0, 0xff0000, `Tube ${i + 1} Center`)

      try {
        // GLASS TUBE
        const tubeGeometry = new THREE.CylinderGeometry(tubeRadius, tubeRadius, tubeHeight, 32, 1, true)
        const glassMaterial = new THREE.MeshPhysicalMaterial({
          color: 0x88ccff,
          transparent: true,
          opacity: 0.3,
          roughness: 0.05,
          metalness: 0.0,
          transmission: 0.85,
          thickness: 0.5,
          clearcoat: 1.0,
          clearcoatRoughness: 0.05,
          side: THREE.DoubleSide,
          depthWrite: false // Help with transparency
        })
        
        const tube = new THREE.Mesh(tubeGeometry, glassMaterial)
        tube.position.set(x, 0, 0)
        scene.add(tube)
        log(`Tube ${i + 1} glass created`, { 
          position: tube.position.toArray(),
          visible: tube.visible,
          opacity: glassMaterial.opacity
        })

        // RIM
        const rimGeometry = new THREE.TorusGeometry(tubeRadius + 2, 5, 16, 32)
        const rimMaterial = new THREE.MeshStandardMaterial({
          color: COLORS.glassRim,
          emissive: COLORS.glassRim,
          emissiveIntensity: 3.0,
          metalness: 0.9,
          roughness: 0.1
        })
        
        const topRim = new THREE.Mesh(rimGeometry, rimMaterial)
        topRim.position.set(x, tubeHeight / 2, 0)
        topRim.rotation.x = Math.PI / 2
        scene.add(topRim)
        log(`Tube ${i + 1} top rim added`)

        const bottomRim = topRim.clone()
        bottomRim.position.set(x, -tubeHeight / 2, 0)
        scene.add(bottomRim)

        // LIQUID - CRITICAL
        const liquidHeight = 200 // Taller for visibility
        const liquidGeometry = new THREE.CylinderGeometry(tubeRadius - 5, tubeRadius - 5, liquidHeight, 32)
        
        const liquidMaterial = new THREE.MeshStandardMaterial({
          color: COLORS.liquidBase,
          transparent: true,
          opacity: 1.0, // FULLY OPAQUE for debugging
          metalness: 0.3,
          roughness: 0.2,
          emissive: COLORS.liquidBase,
          emissiveIntensity: 1.5,
          side: THREE.DoubleSide
        })
        
        const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial)
        const liquidY = -(tubeHeight / 2) + (liquidHeight / 2)
        liquid.position.set(x, liquidY, 0)
        scene.add(liquid)
        
        log(`Tube ${i + 1} LIQUID created`, { 
          position: liquid.position.toArray(),
          visible: liquid.visible,
          color: liquidMaterial.color.getHexString(),
          emissive: liquidMaterial.emissive.getHexString(),
          emissiveIntensity: liquidMaterial.emissiveIntensity,
          opacity: liquidMaterial.opacity,
          height: liquidHeight
        })
        
        // Add debug box around liquid
        addDebugHelper(scene, x, liquidY, 0, 0x00ff00, `Tube ${i + 1} Liquid`)

        // LIQUID SURFACE
        const surfaceGeometry = new THREE.CircleGeometry(tubeRadius - 5, 32)
        const surfaceMaterial = new THREE.MeshBasicMaterial({
          color: COLORS.liquidTop,
          transparent: true,
          opacity: 1.0,
          side: THREE.DoubleSide
        })
        const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial)
        surface.position.set(x, liquidY + (liquidHeight / 2), 0)
        surface.rotation.x = Math.PI / 2
        scene.add(surface)
        log(`Tube ${i + 1} surface added`)

        // LIQUID LIGHT
        const liquidLight = new THREE.PointLight(COLORS.liquidTop, 5.0, 300)
        liquidLight.position.set(x, liquidY, 0)
        scene.add(liquidLight)
        
        const liquidLightHelper = new THREE.PointLightHelper(liquidLight, 20)
        scene.add(liquidLightHelper)
        log(`Tube ${i + 1} liquid light added with helper`)

        // SPOTLIGHT
        const spotlight = new THREE.SpotLight(0xffffff, 3, 500, Math.PI / 6, 0.5, 2)
        spotlight.position.set(x, tubeHeight / 2 + 200, 100)
        spotlight.target.position.set(x, 0, 0)
        scene.add(spotlight)
        scene.add(spotlight.target)
        
        const spotHelper = new THREE.SpotLightHelper(spotlight)
        scene.add(spotHelper)
        log(`Tube ${i + 1} spotlight added with helper`)

        // PLATFORM
        const platformGeometry = new THREE.CylinderGeometry(tubeRadius + 15, tubeRadius + 15, 10, 32)
        const platformMaterial = new THREE.MeshStandardMaterial({
          color: 0x333333,
          metalness: 0.8,
          roughness: 0.3
        })
        const platform = new THREE.Mesh(platformGeometry, platformMaterial)
        platform.position.set(x, -(tubeHeight / 2) - 30, 0)
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
        tubeStatesRef.current.set(i, 'intact')
        
        log(`✅ Tube ${i + 1} complete`)

      } catch (error) {
        log(`ERROR creating tube ${i + 1}`, error)
      }
    }

    // Update debug info
    setDebugInfo(prev => ({
      ...prev,
      tubesCreated: tubesRef.current.length,
      liquidsCreated: liquidMeshesRef.current.size,
      materialsLoaded: true,
      cameraPosition: camera.position.toArray(),
      cameraFrustum: {
        left: camera.left,
        right: camera.right,
        top: camera.top,
        bottom: camera.bottom
      },
      tubePositions,
      canvasSize: [width, height]
    }))

    log('All tubes created', { 
      total: tubesRef.current.length,
      positions: tubePositions 
    })

    // Test render
    log('Performing test render...')
    if (composer) {
      composer.render()
    } else {
      renderer.render(scene, camera)
    }
    log('Test render complete')

    // Animation loop with debug counter
    let frameCount = 0
    const animate = () => {
      if (!sceneRef.current || !cameraRef.current) return

      frameCount++
      
      // Log every 60 frames (about 1 second)
      if (frameCount % 60 === 0) {
        log('Animation loop running', { 
          frame: frameCount,
          tubesVisible: tubesRef.current.filter(t => t?.tube?.visible).length,
          liquidsVisible: Array.from(liquidMeshesRef.current.values()).filter(l => l?.visible).length
        })
      }

      // Rotate coins
      coinsRef.current.forEach((coinData) => {
        if (coinData.mesh && !coinData.isAnimating) {
          coinData.mesh.rotation.y += 0.01
        }
      })

      // Update bubbles
      bubbleSystemsRef.current.forEach((bubbleSystem, index) => {
        if (bubbleSystem.active && bubbleSystem.mesh.visible) {
          updateBubbles(bubbleSystem, tubesRef.current[index])
        }
      })

      // Render
      try {
        if (composerRef.current) {
          composerRef.current.render()
        } else {
          rendererRef.current.render(sceneRef.current, cameraRef.current)
        }
        
        if (frameCount === 1) {
          setDebugInfo(prev => ({ ...prev, rendering: true }))
        }
      } catch (error) {
        log('ERROR during render', error)
      }

      animationIdRef.current = requestAnimationFrame(animate)
    }

    log('Starting animation loop...')
    animate()

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current) return

      const newWidth = mountRef.current.clientWidth || window.innerWidth
      const newHeight = mountRef.current.clientHeight || window.innerHeight

      log('Window resized', { width: newWidth, height: newHeight })

      const aspectRatio = newWidth / newHeight
      const viewWidth = 2000
      const viewHeight = viewWidth / aspectRatio

      cameraRef.current.left = -viewWidth / 2
      cameraRef.current.right = viewWidth / 2
      cameraRef.current.top = viewHeight / 2
      cameraRef.current.bottom = -viewHeight / 2
      cameraRef.current.updateProjectionMatrix()
      
      rendererRef.current.setSize(newWidth, newHeight)
      if (composerRef.current) {
        composerRef.current.setSize(newWidth, newHeight)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      log('Cleaning up...')
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

  // Bubble system (simplified for now)
  const createBubbleSystem = (x, y, tubeRadius) => {
    // Simplified - just return empty for now
    return {
      mesh: new THREE.Points(),
      velocities: [],
      lifetimes: [],
      active: false,
      baseY: y,
      baseX: x,
      tubeRadius
    }
  }

  const updateBubbles = (bubbleSystem, tubeData) => {
    // Simplified - no-op for now
  }

  // Expose functions for testing
  window.startTubeHeating = (playerAddr) => {
    log('startTubeHeating called', { playerAddr })
  }

  window.shatterTube = (playerAddr) => {
    log('shatterTube called', { playerAddr })
  }

  window.flipCoin = (playerAddr, power, result) => {
    log('flipCoin called', { playerAddr, power, result })
  }

  return (
    <>
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#000000',
          position: 'relative'
        }}
      />
      
      {/* DEBUG OVERLAY */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0, 0, 0, 0.9)',
        color: '#00ff00',
        padding: '15px',
        fontFamily: 'monospace',
        fontSize: '11px',
        borderRadius: '5px',
        maxWidth: '400px',
        maxHeight: '90vh',
        overflow: 'auto',
        zIndex: 10000,
        border: '2px solid #00ff00'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>
          🔍 DEBUG INFO
        </div>
        <div>Tubes Created: {debugInfo.tubesCreated}/6</div>
        <div>Liquids Created: {debugInfo.liquidsCreated}/6</div>
        <div>Materials Loaded: {debugInfo.materialsLoaded ? '✅' : '❌'}</div>
        <div>Rendering: {debugInfo.rendering ? '✅' : '❌'}</div>
        <div>Canvas Size: {debugInfo.canvasSize[0]} x {debugInfo.canvasSize[1]}</div>
        <div>Camera Position: ({debugInfo.cameraPosition.map(v => v.toFixed(0)).join(', ')})</div>
        <div>Camera Frustum:</div>
        <div style={{ marginLeft: '10px', fontSize: '10px' }}>
          Left: {debugInfo.cameraFrustum.left?.toFixed(0)}<br/>
          Right: {debugInfo.cameraFrustum.right?.toFixed(0)}<br/>
          Top: {debugInfo.cameraFrustum.top?.toFixed(0)}<br/>
          Bottom: {debugInfo.cameraFrustum.bottom?.toFixed(0)}
        </div>
        <div style={{ marginTop: '10px' }}>
          <strong>Tube Positions (X):</strong>
          {debugInfo.tubePositions.map((pos, i) => (
            <div key={i} style={{ fontSize: '10px' }}>
              Tube {i + 1}: {pos.toFixed(0)}
            </div>
          ))}
        </div>
        <div style={{ marginTop: '10px', borderTop: '1px solid #00ff00', paddingTop: '10px' }}>
          <strong>Recent Logs:</strong>
          {debugInfo.errors.slice(-5).map((err, i) => (
            <div key={i} style={{ fontSize: '9px', marginTop: '5px', color: '#ffff00' }}>
              [{err.time}] {err.message}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default SimpleCoinTubes
