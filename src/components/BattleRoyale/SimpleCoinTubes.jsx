import React, { useEffect, useRef, useState } from 'react'
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
  const animationIdRef = useRef(null)

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

  // Create 6 vertical tubes
  const createTubes = (scene) => {
    const tubeWidth = 140
    const tubeHeight = 500
    const spacing = 320 // Increased spacing to match 1920px width (6 tubes * 320 = 1920)
    const startX = -((spacing * 5) / 2)

    for (let i = 0; i < 6; i++) {
      const x = startX + (i * spacing)

      // Tube background (rectangle) - Use your backdrop images here
      const tubeGeometry = new THREE.PlaneGeometry(tubeWidth, tubeHeight)
      const tubeMaterial = new THREE.MeshBasicMaterial({
        color: 0x1a1a2e,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      })
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial)
      tube.position.set(x, 0, -10)
      scene.add(tube)

      // Tube borders (glowing cyan like original game)
      const borderMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 3 })
      const borderGeometry = new THREE.EdgesGeometry(tubeGeometry)
      const border = new THREE.LineSegments(borderGeometry, borderMaterial)
      border.position.set(x, 0, -9)
      scene.add(border)

      tubesRef.current[i] = { x, tubeHeight, tube, border }
    }
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

