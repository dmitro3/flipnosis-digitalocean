import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

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
  const coinsRef = useRef(new Map())
  const tubesRef = useRef([])
  const animationIdRef = useRef(null)
  const liquidMeshesRef = useRef(new Map())
  const bubbleSystemsRef = useRef(new Map())
  const glassShardSystemsRef = useRef(new Map())
  const tubeStatesRef = useRef(new Map()) // 'intact', 'heating', 'shattering', 'shattered', 'rebuilding'

  // Initialize scene
  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    const container = mountRef.current
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || 600

    // Simple orthographic camera looking straight at the tubes
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

    // Create 6 vertical tubes
    createTubes(scene)

    // Setup lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8)
    mainLight.position.set(0, 200, 300)
    scene.add(mainLight)

    // Animation loop
    const animate = () => {
      if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return

      // Rotate coins slightly for visual interest
      coinsRef.current.forEach((coinData) => {
        if (coinData.mesh && !coinData.isAnimating) {
          coinData.mesh.rotation.y += 0.01
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

  // Create 6 vertical tubes with glass and liquid
  const createTubes = (scene) => {
    const tubeWidth = 140
    const tubeHeight = 500
    const tubeRadius = 70
    const spacing = 320
    const startX = -((spacing * 5) / 2)

    for (let i = 0; i < 6; i++) {
      const x = startX + (i * spacing)

      // Glass tube - transparent material
      const tubeGeometry = new THREE.CylinderGeometry(tubeRadius, tubeRadius, tubeHeight, 32, 1, true)
      const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.9,
        thickness: 0.5,
        envMapIntensity: 1,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        side: THREE.DoubleSide
      })
      
      const tube = new THREE.Mesh(tubeGeometry, glassMaterial)
      tube.position.set(x, 0, 0)
      tube.rotation.x = 0 // Vertical orientation
      scene.add(tube)

      // Tube rim (top and bottom)
      const rimGeometry = new THREE.TorusGeometry(tubeRadius, 3, 16, 32)
      const rimMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x00ffff,
        emissiveIntensity: 0.3
      })
      
      const topRim = new THREE.Mesh(rimGeometry, rimMaterial)
      topRim.position.set(x, tubeHeight / 2, 0)
      topRim.rotation.x = Math.PI / 2
      scene.add(topRim)
      
      const bottomRim = new THREE.Mesh(rimGeometry, rimMaterial)
      bottomRim.position.set(x, -tubeHeight / 2, 0)
      bottomRim.rotation.x = Math.PI / 2
      scene.add(bottomRim)

      // Liquid inside tube
      const liquidHeight = 150
      const liquidGeometry = new THREE.CylinderGeometry(tubeRadius - 5, tubeRadius - 5, liquidHeight, 32)
      const liquidMaterial = new THREE.MeshStandardMaterial({
        color: 0xff1493, // Pink/purple liquid
        transparent: true,
        opacity: 0.7,
        metalness: 0.3,
        roughness: 0.3,
        emissive: 0xff1493,
        emissiveIntensity: 0.2
      })
      
      const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial)
      liquid.position.set(x, -(tubeHeight / 2) + (liquidHeight / 2), 0)
      scene.add(liquid)

      // Burner platform (placeholder for now)
      const platformGeometry = new THREE.CylinderGeometry(tubeRadius + 10, tubeRadius + 10, 10, 32)
      const platformMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.7,
        roughness: 0.3
      })
      const platform = new THREE.Mesh(platformGeometry, platformMaterial)
      platform.position.set(x, -(tubeHeight / 2) - 20, 0)
      scene.add(platform)

      tubesRef.current[i] = { 
        x, 
        tubeHeight, 
        tubeRadius,
        tube, 
        topRim,
        bottomRim,
        liquid,
        platform,
        liquidBaseHeight: liquidHeight,
        liquidBaseY: -(tubeHeight / 2) + (liquidHeight / 2)
      }

      liquidMeshesRef.current.set(i, liquid)
      tubeStatesRef.current.set(i, 'intact')
    }
  }

  // Create bubble particle system for heating effect
  const createBubbleSystem = (x, y, tubeRadius) => {
    const particleCount = 50
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = []
    const lifetimes = []

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = x + (Math.random() - 0.5) * tubeRadius * 1.5
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = (Math.random() - 0.5) * tubeRadius * 1.5
      
      velocities.push({
        x: (Math.random() - 0.5) * 0.5,
        y: Math.random() * 2 + 1,
        z: (Math.random() - 0.5) * 0.5
      })
      
      lifetimes.push(Math.random())
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 5,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    })

    const particles = new THREE.Points(geometry, material)
    particles.visible = false

    return {
      mesh: particles,
      velocities,
      lifetimes,
      active: false
    }
  }

  // Create glass shard system for shattering
  const createGlassShardSystem = (x, y, tubeRadius, tubeHeight) => {
    const shardCount = 80
    const shards = []

    for (let i = 0; i < shardCount; i++) {
      // Random triangle shard
      const size = Math.random() * 15 + 5
      const geometry = new THREE.BufferGeometry()
      const vertices = new Float32Array([
        0, 0, 0,
        size, 0, 0,
        size * 0.5, size, 0
      ])
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))

      const material = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.6,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.8,
        side: THREE.DoubleSide
      })

      const shard = new THREE.Mesh(geometry, material)
      
      // Position along tube surface
      const angle = (i / shardCount) * Math.PI * 2
      const heightPos = (Math.random() - 0.5) * tubeHeight
      shard.position.set(
        x + Math.cos(angle) * tubeRadius,
        heightPos,
        Math.sin(angle) * tubeRadius
      )

      // Random rotation
      shard.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      )

      // Velocity (explode outward)
      const velocity = {
        x: Math.cos(angle) * (Math.random() * 3 + 2),
        y: Math.random() * 2 - 1,
        z: Math.sin(angle) * (Math.random() * 3 + 2)
      }

      // Rotation velocity
      const rotVelocity = {
        x: (Math.random() - 0.5) * 0.2,
        y: (Math.random() - 0.5) * 0.2,
        z: (Math.random() - 0.5) * 0.2
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
        // Create beautiful coin like OptimizedGoldCoin
        const coinRadius = 50 // Bigger coin
        const coinThickness = 8
        
        // Create cylinder for coin body
        const coinGeometry = new THREE.CylinderGeometry(coinRadius, coinRadius, coinThickness, 64)
        
        // Get edge color from material or default to gold
        const edgeColor = 0xFFD700
        
        // Create materials array [side, top (heads), bottom (tails)]
        const sideMaterial = new THREE.MeshStandardMaterial({
          color: edgeColor,
          metalness: 0.9,
          roughness: 0.1,
          emissive: 0xaa8800,
          emissiveIntensity: 0.3
        })

        const coin = new THREE.Mesh(coinGeometry, [
          sideMaterial, // Side
          sideMaterial, // Top (will be replaced with texture)
          sideMaterial  // Bottom (will be replaced with texture)
        ])

        // CRITICAL: Rotate coin to flip vertically (like a wheel)
        // Start with coin laying flat, then it will flip on X-axis
        coin.rotation.z = Math.PI / 2 // Lay flat initially
        coin.rotation.x = 0 // This will be animated

        // Position at bottom of tube
        coin.position.set(tubeData.x, -(tubeData.tubeHeight / 2) + 80, 0)

        // Add glow effect
        const glowGeometry = new THREE.CylinderGeometry(coinRadius * 1.2, coinRadius * 1.2, coinThickness * 1.2, 32)
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0xffd700,
          transparent: true,
          opacity: 0.3,
          side: THREE.BackSide
        })
        const glow = new THREE.Mesh(glowGeometry, glowMaterial)
        coin.add(glow)

        // Add point light for extra shine
        const coinLight = new THREE.PointLight(0xffd700, 2, 150)
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

      // Load custom coin texture if available
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

  // Animate coin flip - vertical rotation like OptimizedGoldCoin
  const animateCoinFlip = (playerAddr, power, result) => {
    const coinData = coinsRef.current.get(playerAddr)
    if (!coinData || coinData.isAnimating) return

    coinData.isAnimating = true
    const coin = coinData.mesh

    console.log(`🪙 Flipping coin for ${playerAddr} - Result: ${result}`)

    // Calculate how many full rotations (minimum 5, add power bonus)
    const minFlips = 5 + Math.floor(power / 2)
    const rotationsPerFlip = Math.PI * 2
    const baseRotation = minFlips * rotationsPerFlip
    const extraRotation = Math.random() * Math.PI * 2
    const totalRotation = baseRotation + extraRotation

    // Determine final rotation based on result
    const isHeads = result === 'heads'
    const targetRotation = isHeads ? 0 : Math.PI // 0 = heads up, π = tails up

    const startTime = Date.now()
    const startY = coin.position.y
    const startRotationX = coin.rotation.x
    
    // Rise phase parameters
    const riseDuration = 800
    const riseHeight = coinData.topY

    // Fall phase parameters  
    const fallDuration = 1200

    const animate = () => {
      const elapsed = Date.now() - startTime
      
      if (elapsed < riseDuration) {
        // RISING PHASE
        const riseProgress = elapsed / riseDuration
        const easeOut = 1 - Math.pow(1 - riseProgress, 3)
        
        // Move upward
        coin.position.y = startY + (riseHeight - startY) * easeOut
        
        // Fast spinning during rise
        coin.rotation.x = startRotationX + (totalRotation * easeOut * 0.6)
        
        requestAnimationFrame(animate)
      } else if (elapsed < riseDuration + fallDuration) {
        // FALLING PHASE
        const fallProgress = (elapsed - riseDuration) / fallDuration
        const easeIn = fallProgress * fallProgress
        
        // Move downward
        coin.position.y = riseHeight - (riseHeight - coinData.startY) * easeIn
        
        // Continue spinning but slow down, ending on correct face
        const currentRotations = totalRotation * 0.6 // Amount rotated during rise
        const remainingRotations = totalRotation * 0.4 // Amount to rotate during fall
        coin.rotation.x = startRotationX + currentRotations + (remainingRotations * fallProgress)
        
        // As we approach landing, force correct orientation
        if (fallProgress > 0.8) {
          const landingProgress = (fallProgress - 0.8) / 0.2
          const currentRot = coin.rotation.x
          const targetFinal = Math.floor(currentRot / (Math.PI * 2)) * (Math.PI * 2) + targetRotation
          coin.rotation.x = currentRot + (targetFinal - currentRot) * landingProgress
        }
        
        requestAnimationFrame(animate)
      } else {
        // LANDED
        coin.position.y = coinData.startY
        
        // Ensure coin is exactly on correct face
        const finalRotationCycles = Math.floor(coin.rotation.x / (Math.PI * 2))
        coin.rotation.x = finalRotationCycles * (Math.PI * 2) + targetRotation
        
        coinData.isAnimating = false
        
        console.log(`✅ Coin landed: ${result} (rotation: ${coin.rotation.x})`)
        
        if (onCoinLanded) {
          onCoinLanded(playerAddr, result)
        }
      }
    }

    animate()
  }

  // Expose flip function with result parameter
  useEffect(() => {
    window.flipCoin = (playerAddr, power, result) => {
      animateCoinFlip(playerAddr, power, result)
    }
  }, [players, playerOrder])

  // Start heating animation
  useEffect(() => {
    window.startTubeHeating = (playerAddr) => {
      const tubeIndex = playerOrder.indexOf(playerAddr)
      if (tubeIndex === -1) return

      const tubeData = tubesRef.current[tubeIndex]
      const liquid = liquidMeshesRef.current.get(tubeIndex)
      
      if (!liquid) return

      tubeStatesRef.current.set(tubeIndex, 'heating')

      // Create bubble system if doesn't exist
      if (!bubbleSystemsRef.current.has(tubeIndex)) {
        const bubbleSystem = createBubbleSystem(
          tubeData.x,
          tubeData.liquidBaseY,
          tubeData.tubeRadius
        )
        sceneRef.current.add(bubbleSystem.mesh)
        bubbleSystemsRef.current.set(tubeIndex, bubbleSystem)
      }

      const bubbleSystem = bubbleSystemsRef.current.get(tubeIndex)
      bubbleSystem.active = true
      bubbleSystem.mesh.visible = true

      // Animate liquid rising and bubbling
      const startTime = Date.now()
      const animate = () => {
        if (tubeStatesRef.current.get(tubeIndex) !== 'heating') return

        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / 3000, 1)

        // Rise liquid
        const newHeight = tubeData.liquidBaseHeight * (1 + progress * 0.3)
        liquid.scale.y = 1 + progress * 0.3
        liquid.position.y = tubeData.liquidBaseY + (progress * 30)

        // Pulse liquid color
        const intensity = 0.2 + Math.sin(elapsed * 0.005) * 0.1
        liquid.material.emissiveIntensity = intensity

        // Update bubbles
        const positions = bubbleSystem.mesh.geometry.attributes.position.array
        for (let i = 0; i < bubbleSystem.velocities.length; i++) {
          positions[i * 3] += bubbleSystem.velocities[i].x
          positions[i * 3 + 1] += bubbleSystem.velocities[i].y
          positions[i * 3 + 2] += bubbleSystem.velocities[i].z

          bubbleSystem.lifetimes[i] += 0.01

          // Reset bubble if too high or lifetime exceeded
          if (positions[i * 3 + 1] > tubeData.liquidBaseY + 100 || bubbleSystem.lifetimes[i] > 1) {
            positions[i * 3] = tubeData.x + (Math.random() - 0.5) * tubeData.tubeRadius * 1.5
            positions[i * 3 + 1] = tubeData.liquidBaseY
            positions[i * 3 + 2] = (Math.random() - 0.5) * tubeData.tubeRadius * 1.5
            bubbleSystem.lifetimes[i] = 0
          }
        }
        bubbleSystem.mesh.geometry.attributes.position.needsUpdate = true

        requestAnimationFrame(animate)
      }
      animate()
    }
  }, [playerOrder])

  // Shatter tube animation
  useEffect(() => {
    window.shatterTube = (playerAddr) => {
      const tubeIndex = playerOrder.indexOf(playerAddr)
      if (tubeIndex === -1) return

      const tubeData = tubesRef.current[tubeIndex]
      tubeStatesRef.current.set(tubeIndex, 'shattering')

      // Hide tube
      tubeData.tube.visible = false
      tubeData.topRim.visible = false
      tubeData.bottomRim.visible = false

      // Stop bubbles
      const bubbleSystem = bubbleSystemsRef.current.get(tubeIndex)
      if (bubbleSystem) {
        bubbleSystem.active = false
        bubbleSystem.mesh.visible = false
      }

      // Create and animate glass shards
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
      const duration = 2000

      const animate = () => {
        const elapsed = Date.now() - startTime
        if (elapsed > duration) {
          tubeStatesRef.current.set(tubeIndex, 'shattered')
          shards.forEach(shard => shard.mesh.visible = false)
          return
        }

        const progress = elapsed / duration

        shards.forEach(shard => {
          // Apply velocity
          shard.mesh.position.x += shard.velocity.x
          shard.mesh.position.y += shard.velocity.y
          shard.mesh.position.z += shard.velocity.z

          // Apply gravity
          shard.velocity.y -= 0.05

          // Rotation
          shard.mesh.rotation.x += shard.rotVelocity.x
          shard.mesh.rotation.y += shard.rotVelocity.y
          shard.mesh.rotation.z += shard.rotVelocity.z

          // Fade out
          shard.mesh.material.opacity = 0.6 * (1 - progress)
        })

        requestAnimationFrame(animate)
      }
      animate()

      // Schedule rebuild
      setTimeout(() => {
        rebuildTube(tubeIndex)
      }, 3000)
    }
  }, [playerOrder])

  // Rebuild tube animation
  const rebuildTube = (tubeIndex) => {
    const tubeData = tubesRef.current[tubeIndex]
    tubeStatesRef.current.set(tubeIndex, 'rebuilding')

    // Reset liquid
    const liquid = liquidMeshesRef.current.get(tubeIndex)
    liquid.scale.y = 1
    liquid.position.y = tubeData.liquidBaseY
    liquid.material.emissiveIntensity = 0.2

    // Animate tube rebuild (fade in)
    let opacity = 0
    const animate = () => {
      opacity += 0.02
      if (opacity >= 0.3) {
        opacity = 0.3
        tubeData.tube.visible = true
        tubeData.topRim.visible = true
        tubeData.bottomRim.visible = true
        tubeStatesRef.current.set(tubeIndex, 'intact')
        return
      }

      tubeData.tube.material.opacity = opacity
      tubeData.tube.visible = true
      tubeData.topRim.visible = true
      tubeData.bottomRim.visible = true

      requestAnimationFrame(animate)
    }
    animate()
  }

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

