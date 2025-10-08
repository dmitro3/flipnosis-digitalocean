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
    const tubeWidth = 120
    const tubeHeight = 500
    const spacing = 180
    const startX = -((spacing * 5) / 2)

    for (let i = 0; i < 6; i++) {
      const x = startX + (i * spacing)

      // Tube background (rectangle)
      const tubeGeometry = new THREE.PlaneGeometry(tubeWidth, tubeHeight)
      const tubeMaterial = new THREE.MeshBasicMaterial({
        color: 0x1a1a2e,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      })
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial)
      tube.position.set(x, 0, -10)
      scene.add(tube)

      // Tube borders
      const borderMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 })
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
        // Create coin
        const coinGeometry = new THREE.CylinderGeometry(40, 40, 8, 32)
        const coinMaterial = new THREE.MeshStandardMaterial({
          color: 0xffd700,
          metalness: 0.9,
          roughness: 0.1,
          emissive: 0xaa8800,
          emissiveIntensity: 0.3
        })
        const coin = new THREE.Mesh(coinGeometry, coinMaterial)
        coin.rotation.x = Math.PI / 2 // Lay flat

        // Position at bottom of tube
        coin.position.set(tubeData.x, -(tubeData.tubeHeight / 2) + 60, 0)

        sceneRef.current.add(coin)

        coinData = {
          mesh: coin,
          tubeData,
          isAnimating: false,
          startY: -(tubeData.tubeHeight / 2) + 60,
          topY: (tubeData.tubeHeight / 2) - 60
        }

        coinsRef.current.set(playerAddr, coinData)
      }

      // Load custom coin texture if available
      if (player.coin && player.coin.headsImage) {
        const textureLoader = new THREE.TextureLoader()
        
        const headTexture = textureLoader.load(player.coin.headsImage)
        const tailTexture = textureLoader.load(player.coin.tailsImage)

        const materials = [
          new THREE.MeshBasicMaterial({ color: 0xffd700 }), // Side
          new THREE.MeshBasicMaterial({ map: headTexture }), // Top (heads)
          new THREE.MeshBasicMaterial({ map: tailTexture })  // Bottom (tails)
        ]

        coinData.mesh.material = materials
      }
    })
  }, [players, playerOrder])

  // Animate coin flip
  const animateCoinFlip = (playerAddr, power) => {
    const coinData = coinsRef.current.get(playerAddr)
    if (!coinData || coinData.isAnimating) return

    coinData.isAnimating = true
    const coin = coinData.mesh

    // Rise to top
    const riseSpeed = power * 5
    let currentY = coin.position.y
    const targetY = coinData.topY

    const rise = () => {
      currentY += riseSpeed
      coin.position.y = Math.min(currentY, targetY)
      coin.rotation.z += 0.2

      if (currentY < targetY) {
        requestAnimationFrame(rise)
      } else {
        // Start falling
        setTimeout(() => fall(), 200)
      }
    }

    const fall = () => {
      const fallSpeed = 8
      let velocity = 0
      const gravity = 0.5
      let rotations = 0
      const totalRotations = 5 + Math.random() * 3

      const fallAnimation = () => {
        velocity += gravity
        currentY -= velocity
        coin.position.y = Math.max(currentY, coinData.startY)

        // Spin during fall
        coin.rotation.z += 0.3
        rotations += 0.3 / (Math.PI * 2)

        if (currentY > coinData.startY) {
          requestAnimationFrame(fallAnimation)
        } else {
          // Landed - determine result
          const result = (rotations % 1) < 0.5 ? 'heads' : 'tails'
          coinData.isAnimating = false

          if (onCoinLanded) {
            onCoinLanded(playerAddr, result)
          }
        }
      }

      fallAnimation()
    }

    rise()
  }

  // Expose flip function
  useEffect(() => {
    window.flipCoin = animateCoinFlip
  }, [])

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

