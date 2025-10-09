import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

const SimpleCoinTubes = ({ 
  players = {}, 
  playerOrder = [],
  onCoinLanded 
}) => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const coinsRef = useRef(new Map())
  const tubesRef = useRef([])
  const liquidMeshesRef = useRef(new Map())
  const bubbleSystemsRef = useRef(new Map())
  const glassShardSystemsRef = useRef(new Map())
  const tubeStatesRef = useRef(new Map())
  const animationIdRef = useRef(null)

  // Color palette from the image
  const COLORS = {
    glassRim: 0x00ffff,        // Cyan rim glow
    liquidBase: 0x8b1a8b,      // Deep purple base
    liquidTop: 0xff1493,       // Hot pink top
    liquidGlow: 0xff69b4,      // Pink glow
    bubbleColor: 0xff1493,     // Pink bubbles
    splashGreen: 0x00ff41,     // Neon green splash
    coinGold: 0xFFD700         // Gold coin
  }

  // Initialize scene
  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    const container = mountRef.current
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || 600

    const camera = new THREE.OrthographicCamera(
      width / -2, width / 2,
      height / 2, height / -2,
      0.1, 1000
    )
    camera.position.set(0, 0, 500)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    container.appendChild(renderer.domElement)

    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer

    // Create 6 tubes
    createArcadeTubes(scene)

    // Lighting setup for that glow
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.6)
    mainLight.position.set(0, 200, 300)
    scene.add(mainLight)

    // Add point lights for atmospheric glow
    const glowLight1 = new THREE.PointLight(0x00ffff, 1, 300)
    glowLight1.position.set(-500, 0, 100)
    scene.add(glowLight1)

    const glowLight2 = new THREE.PointLight(0xff1493, 1, 300)
    glowLight2.position.set(500, 0, 100)
    scene.add(glowLight2)

    // Animation loop
    const animate = () => {
      if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return

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

      rendererRef.current.render(sceneRef.current, cameraRef.current)
      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return

      const newWidth = mountRef.current.clientWidth || window.innerWidth
      const newHeight = mountRef.current.clientHeight || 600

      cameraRef.current.left = newWidth / -2
      cameraRef.current.right = newWidth / 2
      cameraRef.current.top = newHeight / 2
      cameraRef.current.bottom = newHeight / -2
      cameraRef.current.updateProjectionMatrix()
      
      rendererRef.current.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement)
        rendererRef.current.dispose()
      }
    }
  }, [])

  // Create arcade-style tubes matching the image
  const createArcadeTubes = (scene) => {
    const tubeRadius = 70
    const tubeHeight = 500
    const spacing = 320
    const startX = -((spacing * 5) / 2)

    for (let i = 0; i < 6; i++) {
      const x = startX + (i * spacing)

      // Main glass tube - ultra transparent with cyan edges
      const tubeGeometry = new THREE.CylinderGeometry(tubeRadius, tubeRadius, tubeHeight, 32, 1, true)
      const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.15,
        roughness: 0.05,
        metalness: 0.0,
        transmission: 0.95,
        thickness: 0.3,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        side: THREE.DoubleSide
      })
      
      const tube = new THREE.Mesh(tubeGeometry, glassMaterial)
      tube.position.set(x, 0, 0)
      scene.add(tube)

      // Cyan rim glow - TOP (matching image)
      const rimGeometry = new THREE.TorusGeometry(tubeRadius + 2, 4, 16, 32)
      const rimMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.glassRim,
        emissive: COLORS.glassRim,
        emissiveIntensity: 1.5,
        metalness: 0.8,
        roughness: 0.2
      })
      
      const topRim = new THREE.Mesh(rimGeometry, rimMaterial)
      topRim.position.set(x, tubeHeight / 2, 0)
      topRim.rotation.x = Math.PI / 2
      scene.add(topRim)

      // Add glow sphere at top rim
      const topGlowGeometry = new THREE.SphereGeometry(tubeRadius + 8, 32, 32)
      const topGlowMaterial = new THREE.MeshBasicMaterial({
        color: COLORS.glassRim,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
      })
      const topGlow = new THREE.Mesh(topGlowGeometry, topGlowMaterial)
      topGlow.position.set(x, tubeHeight / 2, 0)
      topGlow.scale.set(1, 0.1, 1)
      scene.add(topGlow)
      
      // Cyan rim glow - BOTTOM
      const bottomRim = new THREE.Mesh(rimGeometry, rimMaterial.clone())
      bottomRim.position.set(x, -tubeHeight / 2, 0)
      bottomRim.rotation.x = Math.PI / 2
      scene.add(bottomRim)

      // Bottom glow
      const bottomGlow = new THREE.Mesh(topGlowGeometry, topGlowMaterial.clone())
      bottomGlow.position.set(x, -tubeHeight / 2, 0)
      bottomGlow.scale.set(1, 0.1, 1)
      scene.add(bottomGlow)

      // Purple liquid with gradient (deep purple → hot pink at surface)
      const liquidHeight = 150
      const liquidGeometry = new THREE.CylinderGeometry(tubeRadius - 3, tubeRadius - 3, liquidHeight, 32)
      
      // Create gradient material
      const liquidMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.liquidBase,
        transparent: true,
        opacity: 0.85,
        metalness: 0.2,
        roughness: 0.3,
        emissive: COLORS.liquidGlow,
        emissiveIntensity: 0.4
      })
      
      const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial)
      liquid.position.set(x, -(tubeHeight / 2) + (liquidHeight / 2), 0)
      scene.add(liquid)

      // Liquid surface glow (pink/orange gradient at top)
      const surfaceGeometry = new THREE.CircleGeometry(tubeRadius - 3, 32)
      const surfaceMaterial = new THREE.MeshBasicMaterial({
        color: COLORS.liquidTop,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      })
      const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial)
      surface.position.set(x, -(tubeHeight / 2) + liquidHeight, 0)
      surface.rotation.x = Math.PI / 2
      scene.add(surface)

      // Add point light at liquid surface for that glow effect
      const liquidLight = new THREE.PointLight(COLORS.liquidTop, 1.5, 150)
      liquidLight.position.set(x, -(tubeHeight / 2) + liquidHeight, 0)
      scene.add(liquidLight)

      // Base platform (dark, rounded)
      const platformGeometry = new THREE.CylinderGeometry(tubeRadius + 15, tubeRadius + 15, 8, 32)
      const platformMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.6,
        roughness: 0.4
      })
      const platform = new THREE.Mesh(platformGeometry, platformMaterial)
      platform.position.set(x, -(tubeHeight / 2) - 25, 0)
      scene.add(platform)

      tubesRef.current[i] = { 
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
        platform,
        liquidBaseHeight: liquidHeight,
        liquidBaseY: -(tubeHeight / 2) + (liquidHeight / 2)
      }

      liquidMeshesRef.current.set(i, liquid)
      tubeStatesRef.current.set(i, 'intact')
    }
  }

  // Create bubble system (pink floating particles like in image)
  const createBubbleSystem = (x, y, tubeRadius) => {
    const particleCount = 80
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
        x: (Math.random() - 0.5) * 0.3,
        y: Math.random() * 1.5 + 0.5,
        z: (Math.random() - 0.5) * 0.3
      })
      
      lifetimes.push(Math.random())
      sizes[i] = Math.random() * 5 + 2
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    // Pink glowing particles
    const material = new THREE.PointsMaterial({
      color: COLORS.bubbleColor,
      size: 8,
      transparent: true,
      opacity: 0.8,
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

  // Create circle texture for particles
  const createCircleTexture = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.5, 'rgba(255, 105, 180, 0.8)')
    gradient.addColorStop(1, 'rgba(255, 20, 147, 0)')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 32, 32)
    
    const texture = new THREE.CanvasTexture(canvas)
    return texture
  }

  // Update bubble animation
  const updateBubbles = (bubbleSystem, tubeData) => {
    const positions = bubbleSystem.mesh.geometry.attributes.position.array
    const sizes = bubbleSystem.mesh.geometry.attributes.size.array
    
    for (let i = 0; i < bubbleSystem.velocities.length; i++) {
      positions[i * 3] += bubbleSystem.velocities[i].x
      positions[i * 3 + 1] += bubbleSystem.velocities[i].y
      positions[i * 3 + 2] += bubbleSystem.velocities[i].z

      bubbleSystem.lifetimes[i] += 0.008

      // Pulse size
      sizes[i] = (Math.random() * 5 + 2) * (1 + Math.sin(Date.now() * 0.005 + i) * 0.3)

      // Reset if too high or lifetime exceeded
      if (positions[i * 3 + 1] > bubbleSystem.baseY + 200 || bubbleSystem.lifetimes[i] > 1) {
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

  // Create glass shard system with cyan edges
  const createGlassShardSystem = (x, y, tubeRadius, tubeHeight) => {
    const shardCount = 100
    const shards = []

    for (let i = 0; i < shardCount; i++) {
      const size = Math.random() * 20 + 8
      const geometry = new THREE.BufferGeometry()
      
      // Random triangle shard
      const vertices = new Float32Array([
        0, 0, 0,
        size, 0, 0,
        size * 0.5, size * 0.8, 0
      ])
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))

      const material = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.7,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.8,
        emissive: COLORS.glassRim,
        emissiveIntensity: 0.5,
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

      const velocity = {
        x: Math.cos(angle) * (Math.random() * 4 + 3),
        y: Math.random() * 3 - 0.5,
        z: Math.sin(angle) * (Math.random() * 4 + 3)
      }

      const rotVelocity = {
        x: (Math.random() - 0.5) * 0.3,
        y: (Math.random() - 0.5) * 0.3,
        z: (Math.random() - 0.5) * 0.3
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

  // Create or update coins
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
          metalness: 0.9,
          roughness: 0.1,
          emissive: 0xaa8800,
          emissiveIntensity: 0.3
        })

        const coin = new THREE.Mesh(coinGeometry, [
          sideMaterial,
          sideMaterial,
          sideMaterial
        ])

        coin.rotation.z = Math.PI / 2
        coin.rotation.x = 0
        coin.position.set(tubeData.x, -(tubeData.tubeHeight / 2) + 80, 0)

        // Coin glow
        const glowGeometry = new THREE.CylinderGeometry(coinRadius * 1.3, coinRadius * 1.3, coinThickness * 1.3, 32)
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: COLORS.coinGold,
          transparent: true,
          opacity: 0.3,
          side: THREE.BackSide
        })
        const glow = new THREE.Mesh(glowGeometry, glowMaterial)
        coin.add(glow)

        const coinLight = new THREE.PointLight(COLORS.coinGold, 2, 150)
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
            metalness: 0.3,
            roughness: 0.2,
            emissive: 0x222222,
            emissiveIntensity: 0.1
          })
          coinData.mesh.material[1] = headMaterial
          coinData.mesh.material[1].needsUpdate = true
        })

        textureLoader.load(player.coin.tailsImage, (tailTexture) => {
          tailTexture.colorSpace = THREE.SRGBColorSpace
          const tailMaterial = new THREE.MeshStandardMaterial({
            map: tailTexture,
            metalness: 0.3,
            roughness: 0.2,
            emissive: 0x222222,
            emissiveIntensity: 0.1
          })
          coinData.mesh.material[2] = tailMaterial
          coinData.mesh.material[2].needsUpdate = true
        })
      }
    })
  }, [players, playerOrder])

  // HEATING ANIMATION
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

    // Animate liquid rising and glowing
    const startTime = Date.now()
    const animate = () => {
      if (tubeStatesRef.current.get(tubeIndex) !== 'heating') return

      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / 3000, 1)

      // Rise liquid
      liquid.scale.y = 1 + progress * 0.5
      liquid.position.y = tubeData.liquidBaseY + (progress * 50)

      // Intensify glow
      const intensity = 0.4 + Math.sin(elapsed * 0.008) * 0.2 + (progress * 0.3)
      liquid.material.emissiveIntensity = intensity
      tubeData.surface.position.y = liquid.position.y + (liquid.geometry.parameters.height / 2) * liquid.scale.y
      tubeData.liquidLight.position.y = tubeData.surface.position.y
      tubeData.liquidLight.intensity = 1.5 + progress * 0.5

      // Rim glow intensifies
      tubeData.topRim.material.emissiveIntensity = 1.5 + progress * 0.5
      tubeData.bottomRim.material.emissiveIntensity = 1.5 + progress * 0.5

      requestAnimationFrame(animate)
    }
    animate()
  }

  // SHATTER ANIMATION
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
    tubeData.liquidLight.visible = false

    // Stop bubbles
    const bubbleSystem = bubbleSystemsRef.current.get(tubeIndex)
    if (bubbleSystem) {
      bubbleSystem.active = false
      bubbleSystem.mesh.visible = false
    }

    // Create shards
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
    const duration = 2500

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

        shard.velocity.y -= 0.08 // Gravity

        shard.mesh.rotation.x += shard.rotVelocity.x
        shard.mesh.rotation.y += shard.rotVelocity.y
        shard.mesh.rotation.z += shard.rotVelocity.z

        shard.mesh.material.opacity = 0.7 * (1 - progress * 0.8)
        shard.mesh.material.emissiveIntensity = 0.5 * (1 - progress)
      })

      requestAnimationFrame(animate)
    }
    animate()

    // Schedule rebuild
    setTimeout(() => {
      rebuildTube(tubeIndex)
    }, 3500)
  }

  // REBUILD ANIMATION
  const rebuildTube = (tubeIndex) => {
    const tubeData = tubesRef.current[tubeIndex]
    tubeStatesRef.current.set(tubeIndex, 'rebuilding')

    // Reset liquid
    const liquid = liquidMeshesRef.current.get(tubeIndex)
    liquid.scale.y = 1
    liquid.position.y = tubeData.liquidBaseY
    liquid.material.emissiveIntensity = 0.4
    tubeData.surface.position.y = tubeData.liquidBaseY + (tubeData.liquidBaseHeight / 2)
    tubeData.liquidLight.position.y = tubeData.surface.position.y
    tubeData.liquidLight.intensity = 1.5

    // Fade in tube from bottom to top
    let progress = 0
    const animate = () => {
      progress += 0.015
      
      if (progress >= 1) {
        tubeData.tube.visible = true
        tubeData.topRim.visible = true
        tubeData.bottomRim.visible = true
        tubeData.topGlow.visible = true
        tubeData.bottomGlow.visible = true
        liquid.visible = true
        tubeData.surface.visible = true
        tubeData.liquidLight.visible = true
        
        tubeData.tube.material.opacity = 0.15
        tubeData.topRim.material.emissiveIntensity = 1.5
        tubeData.bottomRim.material.emissiveIntensity = 1.5
        
        tubeStatesRef.current.set(tubeIndex, 'intact')
        return
      }

      // Reveal from bottom
      const revealHeight = progress * tubeData.tubeHeight
      
      tubeData.tube.visible = true
      tubeData.tube.material.opacity = 0.15 * progress
      
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

  // COIN FLIP ANIMATION (already good, just ensure it works with new system)
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
        backgroundColor: '#000000'
      }}
    />
  )
}

export default SimpleCoinTubes
