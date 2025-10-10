import React, { useEffect, useRef } from 'react'
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
  const liquidSpraySystemsRef = useRef(new Map()) // NEW
  const tubeStatesRef = useRef(new Map())
  const animationIdRef = useRef(null)

  // UPDATED COLOR PALETTE
  const COLORS = {
    glassRim: 0x00ffff,
    liquidBase: 0x8A00C4,        // NEW COLOR - brighter purple
    liquidTop: 0xff1493,
    liquidGlow: 0xff69b4,
    bubbleColor: 0xff1493,
    splashGreen: 0x00ff41,
    coinGold: 0xFFD700
  }

  // Initialize scene
  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000) // Pure black, no dark overlay

    const container = mountRef.current
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    // IMPROVED CAMERA - closer and shows all 6 tubes
    const aspectRatio = width / height
    const viewWidth = 2000 // Ensure all 6 tubes fit
    const viewHeight = viewWidth / aspectRatio
    
    const camera = new THREE.OrthographicCamera(
      -viewWidth / 2, viewWidth / 2,
      viewHeight / 2, -viewHeight / 2,
      0.1, 2000
    )
    camera.position.set(0, 0, 300) // CLOSER - was 500
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false // No transparency = no dark overlay
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ReinhardToneMapping // Better colors
    renderer.toneMappingExposure = 1.5 // Brighter

    container.appendChild(renderer.domElement)

    // POST-PROCESSING - BLOOM EFFECTS
    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.5,  // strength
      0.4,  // radius
      0.85  // threshold
    )
    composer.addPass(bloomPass)
    
    composerRef.current = composer
    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer

    // IMPROVED LIGHTING SETUP
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6) // Brighter
    scene.add(ambientLight)

    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0) // Brighter
    mainLight.position.set(0, 500, 400)
    scene.add(mainLight)

    // Dramatic colored accent lights
    const leftAccent = new THREE.PointLight(0x00ffff, 2, 800)
    leftAccent.position.set(-800, 200, 200)
    scene.add(leftAccent)

    const rightAccent = new THREE.PointLight(0xff1493, 2, 800)
    rightAccent.position.set(800, 200, 200)
    scene.add(rightAccent)

    // Top rim light for drama
    const topLight = new THREE.PointLight(0xffffff, 1.5, 1000)
    topLight.position.set(0, 600, 300)
    scene.add(topLight)

    // DYNAMIC TUBE CREATION - fits viewport
    const tubeRadius = 70
    const tubeHeight = 500
    const numTubes = 6
    
    // Calculate spacing to fit all tubes with padding
    const availableWidth = width * 0.9 // 90% of viewport
    const spacing = availableWidth / numTubes
    const startX = -((spacing * (numTubes - 1)) / 2)

    for (let i = 0; i < numTubes; i++) {
      const x = startX + (i * spacing)
      createArcadeTube(scene, x, tubeRadius, tubeHeight, i)
    }

    // Animation loop
    const animate = () => {
      if (!sceneRef.current || !composerRef.current || !cameraRef.current) return

      // Rotate coins
      coinsRef.current.forEach((coinData) => {
        if (coinData.mesh && !coinData.isAnimating) {
          coinData.mesh.rotation.y += 0.01
        }
      })

      // Update bubble systems
      bubbleSystemsRef.current.forEach((bubbleSystem, index) => {
        if (bubbleSystem.active && bubbleSystem.mesh.visible) {
          updateBubbles(bubbleSystem, tubesRef.current[index])
        }
      })

      // Update liquid spray systems (NEW)
      liquidSpraySystemsRef.current.forEach((spraySystem, index) => {
        if (spraySystem.active) {
          updateLiquidSpray(spraySystem)
        }
      })

      composerRef.current.render() // Use composer for bloom
      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !composerRef.current) return

      const newWidth = mountRef.current.clientWidth || window.innerWidth
      const newHeight = mountRef.current.clientHeight || window.innerHeight

      const aspectRatio = newWidth / newHeight
      const viewWidth = 2000
      const viewHeight = viewWidth / aspectRatio

      cameraRef.current.left = -viewWidth / 2
      cameraRef.current.right = viewWidth / 2
      cameraRef.current.top = viewHeight / 2
      cameraRef.current.bottom = -viewHeight / 2
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

  // CREATE TUBE FUNCTION (extracted for clarity)
  const createArcadeTube = (scene, x, tubeRadius, tubeHeight, index) => {
    // Main glass tube - BRIGHTER, MORE VISIBLE
    const tubeGeometry = new THREE.CylinderGeometry(tubeRadius, tubeRadius, tubeHeight, 32, 1, true)
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.25, // More visible
      roughness: 0.05,
      metalness: 0.0,
      transmission: 0.9,
      thickness: 0.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      side: THREE.DoubleSide
    })
    
    const tube = new THREE.Mesh(tubeGeometry, glassMaterial)
    tube.position.set(x, 0, 0)
    scene.add(tube)

    // Enhanced rim glow - BRIGHTER
    const rimGeometry = new THREE.TorusGeometry(tubeRadius + 2, 5, 16, 32) // Thicker
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.glassRim,
      emissive: COLORS.glassRim,
      emissiveIntensity: 2.5, // Much brighter
      metalness: 0.9,
      roughness: 0.1
    })
    
    const topRim = new THREE.Mesh(rimGeometry, rimMaterial)
    topRim.position.set(x, tubeHeight / 2, 0)
    topRim.rotation.x = Math.PI / 2
    scene.add(topRim)

    // Glow sphere at top
    const topGlowGeometry = new THREE.SphereGeometry(tubeRadius + 15, 32, 32)
    const topGlowMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.glassRim,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    })
    const topGlow = new THREE.Mesh(topGlowGeometry, topGlowMaterial)
    topGlow.position.set(x, tubeHeight / 2, 0)
    topGlow.scale.set(1, 0.15, 1)
    scene.add(topGlow)
    
    // Bottom rim
    const bottomRim = topRim.clone()
    bottomRim.position.set(x, -tubeHeight / 2, 0)
    scene.add(bottomRim)

    // Bottom glow
    const bottomGlow = topGlow.clone()
    bottomGlow.position.set(x, -tubeHeight / 2, 0)
    scene.add(bottomGlow)

    // UPGRADED LIQUID - brighter purple
    const liquidHeight = 150
    const liquidGeometry = new THREE.CylinderGeometry(tubeRadius - 3, tubeRadius - 3, liquidHeight, 32)
    
    const liquidMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.liquidBase, // New brighter purple
      transparent: true,
      opacity: 0.9, // More opaque
      metalness: 0.3,
      roughness: 0.2,
      emissive: COLORS.liquidBase,
      emissiveIntensity: 0.8 // Much brighter glow
    })
    
    const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial)
    liquid.position.set(x, -(tubeHeight / 2) + (liquidHeight / 2), 0)
    scene.add(liquid)

    // Brighter liquid surface
    const surfaceGeometry = new THREE.CircleGeometry(tubeRadius - 3, 32)
    const surfaceMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.liquidTop,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    })
    const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial)
    surface.position.set(x, -(tubeHeight / 2) + liquidHeight, 0)
    surface.rotation.x = Math.PI / 2
    scene.add(surface)

    // MUCH BRIGHTER liquid light
    const liquidLight = new THREE.PointLight(COLORS.liquidTop, 3.0, 200) // Was 1.5
    liquidLight.position.set(x, -(tubeHeight / 2) + liquidHeight, 0)
    scene.add(liquidLight)

    // Spotlight on each tube (NEW)
    const spotlight = new THREE.SpotLight(0xffffff, 2, 400, Math.PI / 6, 0.5, 2)
    spotlight.position.set(x, tubeHeight / 2 + 200, 100)
    spotlight.target.position.set(x, 0, 0)
    scene.add(spotlight)
    scene.add(spotlight.target)

    // Base platform
    const platformGeometry = new THREE.CylinderGeometry(tubeRadius + 15, tubeRadius + 15, 8, 32)
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.8,
      roughness: 0.3
    })
    const platform = new THREE.Mesh(platformGeometry, platformMaterial)
    platform.position.set(x, -(tubeHeight / 2) - 25, 0)
    scene.add(platform)

    tubesRef.current[index] = { 
      x, 
      tubeHeight, 
      tubeRadius,
      tube, 
      topRim,
      bottomRim,
      topGlow,
      bottomGlow,
      liquid,
      surface,
      liquidLight,
      spotlight,
      platform,
      liquidBaseHeight: liquidHeight,
      liquidBaseY: -(tubeHeight / 2) + (liquidHeight / 2)
    }

    liquidMeshesRef.current.set(index, liquid)
    tubeStatesRef.current.set(index, 'intact')
  }

  // EPIC GLASS SHATTERING - BIGGER, MORE DRAMATIC
  const createGlassShardSystem = (x, y, tubeRadius, tubeHeight) => {
    const shardCount = 150 // More shards!
    const shards = []

    for (let i = 0; i < shardCount; i++) {
      const size = Math.random() * 40 + 20 // BIGGER - was 20 + 8
      const geometry = new THREE.BufferGeometry()
      
      // Random triangle shard
      const vertices = new Float32Array([
        0, 0, 0,
        size, 0, 0,
        size * 0.5, size * 0.8, 0
      ])
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))

      const material = new THREE.MeshPhysicalMaterial({
        color: 0xaaddff, // Brighter
        transparent: true,
        opacity: 0.85, // More visible
        roughness: 0.1,
        metalness: 0.2,
        transmission: 0.7,
        emissive: COLORS.glassRim,
        emissiveIntensity: 1.0, // Glow more
        side: THREE.DoubleSide
      })

      const shard = new THREE.Mesh(geometry, material)
      
      const angle = (i / shardCount) * Math.PI * 2
      const heightPos = (Math.random() - 0.5) * tubeHeight
      shard.position.set(
        x + Math.cos(angle) * tubeRadius,
        heightPos,
        Math.sin(angle) * tubeRadius
      )

      shard.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      )

      // FASTER, MORE EXPLOSIVE velocities
      const velocity = {
        x: Math.cos(angle) * (Math.random() * 8 + 6), // Was 4 + 3
        y: Math.random() * 6 - 1, // More upward momentum
        z: Math.sin(angle) * (Math.random() * 8 + 6)
      }

      const rotVelocity = {
        x: (Math.random() - 0.5) * 0.5, // Spin faster
        y: (Math.random() - 0.5) * 0.5,
        z: (Math.random() - 0.5) * 0.5
      }

      shard.visible = false

      shards.push({
        mesh: shard,
        velocity,
        rotVelocity,
        lifetime: 0
      })
    }

    return shards
  }

  // NEW: LIQUID SPRAY SYSTEM
  const createLiquidSpraySystem = (x, y, tubeRadius) => {
    const particleCount = 200
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const velocities = []

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const radius = Math.random() * tubeRadius
      
      positions[i * 3] = x + Math.cos(angle) * radius
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(angle) * radius
      
      // Color gradient: purple → pink → cyan
      const t = Math.random()
      if (t < 0.33) {
        colors[i * 3] = 0.54 // Purple
        colors[i * 3 + 1] = 0.0
        colors[i * 3 + 2] = 0.77
      } else if (t < 0.66) {
        colors[i * 3] = 1.0 // Pink
        colors[i * 3 + 1] = 0.08
        colors[i * 3 + 2] = 0.58
      } else {
        colors[i * 3] = 0.0 // Cyan
        colors[i * 3 + 1] = 1.0
        colors[i * 3 + 2] = 1.0
      }
      
      velocities.push({
        x: Math.cos(angle) * (Math.random() * 5 + 3),
        y: Math.random() * 3 - 1,
        z: Math.sin(angle) * (Math.random() * 5 + 3)
      })
      
      sizes[i] = Math.random() * 15 + 8
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.PointsMaterial({
      size: 15,
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      map: createCircleTexture()
    })

    const particles = new THREE.Points(geometry, material)
    particles.visible = false

    return {
      mesh: particles,
      velocities,
      lifetime: 0,
      active: false,
      baseX: x,
      baseY: y
    }
  }

  // UPDATE LIQUID SPRAY
  const updateLiquidSpray = (spraySystem) => {
    const positions = spraySystem.mesh.geometry.attributes.position.array
    const sizes = spraySystem.mesh.geometry.attributes.size.array
    
    for (let i = 0; i < spraySystem.velocities.length; i++) {
      positions[i * 3] += spraySystem.velocities[i].x
      positions[i * 3 + 1] += spraySystem.velocities[i].y
      positions[i * 3 + 2] += spraySystem.velocities[i].z

      spraySystem.velocities[i].y -= 0.15 // Gravity
      
      // Fade out
      sizes[i] *= 0.98
    }
    
    spraySystem.lifetime += 0.016
    spraySystem.mesh.material.opacity = Math.max(0, 1 - spraySystem.lifetime / 2)
    
    if (spraySystem.lifetime > 2.5) {
      spraySystem.active = false
      spraySystem.mesh.visible = false
    }
    
    spraySystem.mesh.geometry.attributes.position.needsUpdate = true
    spraySystem.mesh.geometry.attributes.size.needsUpdate = true
  }

  // Circle texture helper
  const createCircleTexture = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.5, 'rgba(255, 150, 200, 0.8)')
    gradient.addColorStop(1, 'rgba(138, 0, 196, 0)')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 64, 64)
    
    return new THREE.CanvasTexture(canvas)
  }

  // BUBBLE SYSTEM (keep existing, just brighter)
  const createBubbleSystem = (x, y, tubeRadius) => {
    const particleCount = 100 // More bubbles
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = []
    const lifetimes = []
    const sizes = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * (tubeRadius - 10)
      
      positions[i * 3] = x + Math.cos(angle) * radius
      positions[i * 3 + 1] = y + Math.random() * 50
      positions[i * 3 + 2] = Math.sin(angle) * radius
      
      velocities.push({
        x: (Math.random() - 0.5) * 0.5,
        y: Math.random() * 2 + 1, // Faster
        z: (Math.random() - 0.5) * 0.5
      })
      
      lifetimes.push(Math.random())
      sizes[i] = Math.random() * 8 + 4
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.PointsMaterial({
      color: COLORS.bubbleColor,
      size: 10,
      transparent: true,
      opacity: 0.9, // More visible
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      map: createCircleTexture()
    })

    const particles = new THREE.Points(geometry, material)
    particles.visible = false

    return {
      mesh: particles,
      velocities,
      lifetimes,
      active: false,
      baseY: y,
      baseX: x,
      tubeRadius
    }
  }

  const updateBubbles = (bubbleSystem, tubeData) => {
    const positions = bubbleSystem.mesh.geometry.attributes.position.array
    const sizes = bubbleSystem.mesh.geometry.attributes.size.array
    
    for (let i = 0; i < bubbleSystem.velocities.length; i++) {
      positions[i * 3] += bubbleSystem.velocities[i].x
      positions[i * 3 + 1] += bubbleSystem.velocities[i].y
      positions[i * 3 + 2] += bubbleSystem.velocities[i].z

      bubbleSystem.lifetimes[i] += 0.01

      sizes[i] = (Math.random() * 8 + 4) * (1 + Math.sin(Date.now() * 0.005 + i) * 0.4)

      if (positions[i * 3 + 1] > bubbleSystem.baseY + 250 || bubbleSystem.lifetimes[i] > 1) {
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * (bubbleSystem.tubeRadius - 10)
        
        positions[i * 3] = bubbleSystem.baseX + Math.cos(angle) * radius
        positions[i * 3 + 1] = bubbleSystem.baseY
        positions[i * 3 + 2] = Math.sin(angle) * radius
        bubbleSystem.lifetimes[i] = 0
      }
    }
    
    bubbleSystem.mesh.geometry.attributes.position.needsUpdate = true
    bubbleSystem.mesh.geometry.attributes.size.needsUpdate = true
  }

  // HEATING ANIMATION (enhanced)
  window.startTubeHeating = (playerAddr) => {
    const tubeIndex = playerOrder.indexOf(playerAddr)
    if (tubeIndex === -1) return

    const tubeData = tubesRef.current[tubeIndex]
    const liquid = liquidMeshesRef.current.get(tubeIndex)
    
    if (!liquid) return

    tubeStatesRef.current.set(tubeIndex, 'heating')

    // Create bubble system
    if (!bubbleSystemsRef.current.has(tubeIndex)) {
      const bubbleSystem = createBubbleSystem(
        tubeData.x,
        tubeData.liquidBaseY + (tubeData.liquidBaseHeight / 2),
        tubeData.tubeRadius
      )
      sceneRef.current.add(bubbleSystem.mesh)
      bubbleSystemsRef.current.set(tubeIndex, bubbleSystem)
    }

    const bubbleSystem = bubbleSystemsRef.current.get(tubeIndex)
    bubbleSystem.active = true
    bubbleSystem.mesh.visible = true

    // Animate liquid rising and GLOWING INTENSELY
    const startTime = Date.now()
    const animate = () => {
      if (tubeStatesRef.current.get(tubeIndex) !== 'heating') return

      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / 3000, 1)

      liquid.scale.y = 1 + progress * 0.6
      liquid.position.y = tubeData.liquidBaseY + (progress * 60)

      // INTENSE GLOW
      const intensity = 0.8 + Math.sin(elapsed * 0.01) * 0.3 + (progress * 0.5)
      liquid.material.emissiveIntensity = intensity
      tubeData.surface.position.y = liquid.position.y + (liquid.geometry.parameters.height / 2) * liquid.scale.y
      tubeData.liquidLight.position.y = tubeData.surface.position.y
      tubeData.liquidLight.intensity = 3.0 + progress * 2.0 // Much brighter

      // Pulse rim glow
      tubeData.topRim.material.emissiveIntensity = 2.5 + progress * 1.0
      tubeData.bottomRim.material.emissiveIntensity = 2.5 + progress * 1.0
      
      // Spotlight pulses
      tubeData.spotlight.intensity = 2 + Math.sin(elapsed * 0.008) * 0.5

      requestAnimationFrame(animate)
    }
    animate()
  }

  // SHATTER ANIMATION (with liquid spray!)
  window.shatterTube = (playerAddr) => {
    const tubeIndex = playerOrder.indexOf(playerAddr)
    if (tubeIndex === -1) return

    const tubeData = tubesRef.current[tubeIndex]
    tubeStatesRef.current.set(tubeIndex, 'shattering')

    // Hide tube
    tubeData.tube.visible = false
    tubeData.topRim.visible = false
    tubeData.bottomRim.visible = false
    tubeData.topGlow.visible = false
    tubeData.bottomGlow.visible = false

    // Hide liquid and surface
    const liquid = liquidMeshesRef.current.get(tubeIndex)
    liquid.visible = false
    tubeData.surface.visible = false
    
    // Keep light briefly for dramatic effect
    setTimeout(() => {
      tubeData.liquidLight.visible = false
    }, 500)

    // Stop bubbles
    const bubbleSystem = bubbleSystemsRef.current.get(tubeIndex)
    if (bubbleSystem) {
      bubbleSystem.active = false
      bubbleSystem.mesh.visible = false
    }

    // CREATE LIQUID SPRAY
    if (!liquidSpraySystemsRef.current.has(tubeIndex)) {
      const spraySystem = createLiquidSpraySystem(
        tubeData.x,
        tubeData.liquidBaseY + (tubeData.liquidBaseHeight / 2),
        tubeData.tubeRadius
      )
      sceneRef.current.add(spraySystem.mesh)
      liquidSpraySystemsRef.current.set(tubeIndex, spraySystem)
    }

    const spraySystem = liquidSpraySystemsRef.current.get(tubeIndex)
    spraySystem.active = true
    spraySystem.mesh.visible = true
    spraySystem.lifetime = 0

    // Create glass shards
    if (!glassShardSystemsRef.current.has(tubeIndex)) {
      const shards = createGlassShardSystem(
        tubeData.x,
        0,
        tubeData.tubeRadius,
        tubeData.tubeHeight
      )
      shards.forEach(shard => sceneRef.current.add(shard.mesh))
      glassShardSystemsRef.current.set(tubeIndex, shards)
    }

    const shards = glassShardSystemsRef.current.get(tubeIndex)
    shards.forEach(shard => {
      shard.mesh.visible = true
      shard.lifetime = 0
    })

    // Animate shards
    const startTime = Date.now()
    const duration = 3000 // Longer for more drama

    const animate = () => {
      const elapsed = Date.now() - startTime
      if (elapsed > duration) {
        tubeStatesRef.current.set(tubeIndex, 'shattered')
        shards.forEach(shard => shard.mesh.visible = false)
        return
      }

      const progress = elapsed / duration

      shards.forEach(shard => {
        shard.mesh.position.x += shard.velocity.x
        shard.mesh.position.y += shard.velocity.y
        shard.mesh.position.z += shard.velocity.z

        shard.velocity.y -= 0.12 // Stronger gravity

        shard.mesh.rotation.x += shard.rotVelocity.x
        shard.mesh.rotation.y += shard.rotVelocity.y
        shard.mesh.rotation.z += shard.rotVelocity.z

        shard.mesh.material.opacity = 0.85 * (1 - progress * 0.7)
        shard.mesh.material.emissiveIntensity = 1.0 * (1 - progress)
      })

      requestAnimationFrame(animate)
    }
    animate()

    // Schedule rebuild
    setTimeout(() => {
      rebuildTube(tubeIndex)
    }, 4000)
  }

  // REBUILD (keep existing logic)
  const rebuildTube = (tubeIndex) => {
    const tubeData = tubesRef.current[tubeIndex]
    tubeStatesRef.current.set(tubeIndex, 'rebuilding')

    const liquid = liquidMeshesRef.current.get(tubeIndex)
    liquid.scale.y = 1
    liquid.position.y = tubeData.liquidBaseY
    liquid.material.emissiveIntensity = 0.8
    tubeData.surface.position.y = tubeData.liquidBaseY + (tubeData.liquidBaseHeight / 2)
    tubeData.liquidLight.position.y = tubeData.surface.position.y
    tubeData.liquidLight.intensity = 3.0

    let progress = 0
    const animate = () => {
      progress += 0.02
      
      if (progress >= 1) {
        tubeData.tube.visible = true
        tubeData.topRim.visible = true
        tubeData.bottomRim.visible = true
        tubeData.topGlow.visible = true
        tubeData.bottomGlow.visible = true
        liquid.visible = true
        tubeData.surface.visible = true
        tubeData.liquidLight.visible = true
        
        tubeData.tube.material.opacity = 0.25
        tubeData.topRim.material.emissiveIntensity = 2.5
        tubeData.bottomRim.material.emissiveIntensity = 2.5
        
        tubeStatesRef.current.set(tubeIndex, 'intact')
        return
      }

      tubeData.tube.visible = true
      tubeData.tube.material.opacity = 0.25 * progress
      
      if (progress > 0.1) {
        liquid.visible = true
        tubeData.surface.visible = true
        tubeData.liquidLight.visible = true
      }
      
      if (progress > 0.9) {
        tubeData.topRim.visible = true
        tubeData.topGlow.visible = true
      }
      
      tubeData.bottomRim.visible = true
      tubeData.bottomGlow.visible = true

      requestAnimationFrame(animate)
    }
    animate()
  }

  // Coin creation/updates (keep existing logic)
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
        const coinThickness = 8
        
        const coinGeometry = new THREE.CylinderGeometry(coinRadius, coinRadius, coinThickness, 64)
        
        const sideMaterial = new THREE.MeshStandardMaterial({
          color: COLORS.coinGold,
          metalness: 0.95,
          roughness: 0.05,
          emissive: 0xaa8800,
          emissiveIntensity: 0.5
        })

        const coin = new THREE.Mesh(coinGeometry, [
          sideMaterial,
          sideMaterial,
          sideMaterial
        ])

        coin.rotation.z = Math.PI / 2
        coin.rotation.x = 0
        coin.position.set(tubeData.x, -(tubeData.tubeHeight / 2) + 80, 0)

        // Brighter coin glow
        const glowGeometry = new THREE.CylinderGeometry(coinRadius * 1.4, coinRadius * 1.4, coinThickness * 1.4, 32)
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: COLORS.coinGold,
          transparent: true,
          opacity: 0.4,
          side: THREE.BackSide
        })
        const glow = new THREE.Mesh(glowGeometry, glowMaterial)
        coin.add(glow)

        const coinLight = new THREE.PointLight(COLORS.coinGold, 3, 200) // Brighter
        coin.add(coinLight)

        sceneRef.current.add(coin)

        coinData = {
          mesh: coin,
          tubeData,
          isAnimating: false,
          startY: -(tubeData.tubeHeight / 2) + 80,
          topY: (tubeData.tubeHeight / 2) - 80
        }

        coinsRef.current.set(playerAddr, coinData)
      }

      // Load custom coin textures
      if (player.coin && player.coin.headsImage) {
        const textureLoader = new THREE.TextureLoader()
        
        textureLoader.load(player.coin.headsImage, (headTexture) => {
          headTexture.colorSpace = THREE.SRGBColorSpace
          const headMaterial = new THREE.MeshStandardMaterial({
            map: headTexture,
            metalness: 0.4,
            roughness: 0.15,
            emissive: 0x333333,
            emissiveIntensity: 0.2
          })
          coinData.mesh.material[1] = headMaterial
          coinData.mesh.material[1].needsUpdate = true
        })

        textureLoader.load(player.coin.tailsImage, (tailTexture) => {
          tailTexture.colorSpace = THREE.SRGBColorSpace
          const tailMaterial = new THREE.MeshStandardMaterial({
            map: tailTexture,
            metalness: 0.4,
            roughness: 0.15,
            emissive: 0x333333,
            emissiveIntensity: 0.2
          })
          coinData.mesh.material[2] = tailMaterial
          coinData.mesh.material[2].needsUpdate = true
        })
      }
    })
  }, [players, playerOrder])

  // Coin flip animation (keep existing)
  const animateCoinFlip = (playerAddr, power, result) => {
    const coinData = coinsRef.current.get(playerAddr)
    if (!coinData || coinData.isAnimating) return

    coinData.isAnimating = true
    const coin = coinData.mesh

    const minFlips = 5 + Math.floor(power / 2)
    const rotationsPerFlip = Math.PI * 2
    const baseRotation = minFlips * rotationsPerFlip
    const extraRotation = Math.random() * Math.PI * 2
    const totalRotation = baseRotation + extraRotation

    const isHeads = result === 'heads'
    const targetRotation = isHeads ? 0 : Math.PI

    const startTime = Date.now()
    const startY = coin.position.y
    const startRotationX = coin.rotation.x
    
    const riseDuration = 800
    const riseHeight = coinData.topY
    const fallDuration = 1200

    const animate = () => {
      const elapsed = Date.now() - startTime
      
      if (elapsed < riseDuration) {
        const riseProgress = elapsed / riseDuration
        const easeOut = 1 - Math.pow(1 - riseProgress, 3)
        
        coin.position.y = startY + (riseHeight - startY) * easeOut
        coin.rotation.x = startRotationX + (totalRotation * easeOut * 0.6)
        
        requestAnimationFrame(animate)
      } else if (elapsed < riseDuration + fallDuration) {
        const fallProgress = (elapsed - riseDuration) / fallDuration
        const easeIn = fallProgress * fallProgress
        
        coin.position.y = riseHeight - (riseHeight - coinData.startY) * easeIn
        
        const currentRotations = totalRotation * 0.6
        const remainingRotations = totalRotation * 0.4
        coin.rotation.x = startRotationX + currentRotations + (remainingRotations * fallProgress)
        
        if (fallProgress > 0.8) {
          const landingProgress = (fallProgress - 0.8) / 0.2
          const currentRot = coin.rotation.x
          const targetFinal = Math.floor(currentRot / (Math.PI * 2)) * (Math.PI * 2) + targetRotation
          coin.rotation.x = currentRot + (targetFinal - currentRot) * landingProgress
        }
        
        requestAnimationFrame(animate)
      } else {
        coin.position.y = coinData.startY
        const finalRotationCycles = Math.floor(coin.rotation.x / (Math.PI * 2))
        coin.rotation.x = finalRotationCycles * (Math.PI * 2) + targetRotation
        
        coinData.isAnimating = false
        
        if (onCoinLanded) {
          onCoinLanded(playerAddr, result)
        }
      }
    }

    animate()
  }

  // Expose flip function
  useEffect(() => {
    window.flipCoin = (playerAddr, power, result) => {
      animateCoinFlip(playerAddr, power, result)
    }
  }, [players, playerOrder])

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        position: 'relative'
      }}
    />
  )
}

export default SimpleCoinTubes
