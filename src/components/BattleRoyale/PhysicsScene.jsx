import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const PhysicsScene = ({ 
  obstacles = [], 
  players = {}, 
  coinPositions = [],
  playerAddresses = [],
  currentPlayerAddress = null
}) => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const obstaclesRef = useRef([])
  const coinsRef = useRef(new Map())
  const animationIdRef = useRef(null)
  const [assetsLoaded, setAssetsLoaded] = useState(false)
  
  // Initialize scene
  useEffect(() => {
    if (!mountRef.current) return
    
    console.log('🎬 Initializing 3D Pinball Scene with 2D Physics')
    
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    
    const container = mountRef.current
    
    // Wait for next frame to ensure container has proper dimensions
    const initializeRenderer = () => {
      // Use clientWidth/clientHeight and fallback to window dimensions
      const width = container.clientWidth || container.offsetWidth || window.innerWidth
      const height = container.clientHeight || container.offsetHeight || window.innerHeight - 280 // Account for bottom section
      
      console.log('📐 Container dimensions:', { width, height })
      
      // Perspective camera for 3D depth
      const camera = new THREE.PerspectiveCamera(
        60,              // FOV
        width / height,  // Aspect ratio
        0.1,
        2000
      )
      camera.position.set(0, 250, 150) // Position to see full playfield
      camera.lookAt(0, 250, 0)
      
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(width, height) // Use actual container size
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.shadowMap.enabled = true
      
      console.log('🖼️ Renderer size:', { width, height })
      
      container.appendChild(renderer.domElement)
      
      sceneRef.current = scene
      cameraRef.current = camera
      rendererRef.current = renderer
      
      createSimpleStarfield(scene)
      loadAssets(scene)
      setupLighting(scene)
      
      // Animation loop
      const animate = () => {
        if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return
        
        // Rotate obstacles for visual interest
        obstaclesRef.current.forEach((obstacle, index) => {
          if (obstacle) {
            obstacle.rotation.y += 0.002 * (index % 2 === 0 ? 1 : -1)
            obstacle.rotation.x += 0.001
          }
        })
        
        rendererRef.current.render(sceneRef.current, cameraRef.current)
        animationIdRef.current = requestAnimationFrame(animate)
      }
      
      animate()
    }
    
    // Use requestAnimationFrame to ensure DOM layout is complete
    requestAnimationFrame(initializeRenderer)
    
    // Force resize after a short delay to ensure proper sizing
    setTimeout(() => {
      if (rendererRef.current && cameraRef.current) {
        const container = mountRef.current
        const width = container.clientWidth || container.offsetWidth || window.innerWidth
        const height = container.clientHeight || container.offsetHeight || window.innerHeight - 280
        
        console.log('🔧 Force resize to:', { width, height })
        console.log('🔍 Container bounds:', container.getBoundingClientRect())
        console.log('🔍 Window size:', { width: window.innerWidth, height: window.innerHeight })
        
        cameraRef.current.aspect = width / height
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(width, height)
      }
    }, 500)
    
    // Add ResizeObserver to handle dynamic sizing
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (rendererRef.current && cameraRef.current) {
          const { width, height } = entry.contentRect
          console.log('📐 ResizeObserver triggered:', { width, height })
          
          cameraRef.current.aspect = width / height
          cameraRef.current.updateProjectionMatrix()
          rendererRef.current.setSize(width, height)
        }
      }
    })
    
    if (mountRef.current) {
      resizeObserver.observe(mountRef.current)
    }
    
    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return
      
      const newWidth = mountRef.current.clientWidth || mountRef.current.offsetWidth || window.innerWidth
      const newHeight = mountRef.current.clientHeight || mountRef.current.offsetHeight || window.innerHeight - 280
      
      console.log('📐 Resize to:', { newWidth, newHeight })
      
      cameraRef.current.aspect = newWidth / newHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(newWidth, newHeight)
    }
    
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      
      obstaclesRef.current.forEach(obstacle => {
        if (obstacle) {
          if (obstacle.geometry) obstacle.geometry.dispose()
          if (obstacle.material) {
            if (Array.isArray(obstacle.material)) {
              obstacle.material.forEach(mat => mat.dispose())
            } else {
              obstacle.material.dispose()
            }
          }
        }
      })
      
      if (rendererRef.current) {
        rendererRef.current.dispose()
        if (mountRef.current && rendererRef.current.domElement) {
          mountRef.current.removeChild(rendererRef.current.domElement)
        }
      }
    }
  }, [])
  
  // Create starfield
  const createSimpleStarfield = (scene) => {
    const starGeometry = new THREE.BufferGeometry()
    const starMaterial = new THREE.PointsMaterial({ 
      color: 0xffffff, 
      size: 1.5,
      transparent: true,
      opacity: 0.8
    })
    
    const starVertices = []
    // Create stars scattered in 3D space behind playfield
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 600
      const y = Math.random() * 700 - 50
      const z = -100 - Math.random() * 200 // Behind the playfield
      starVertices.push(x, y, z)
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3))
    const stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)
    
    console.log('⭐ Added starfield')
  }
  
  // Load obstacle textures
  const loadAssets = async (scene) => {
    console.log('📦 Loading assets...')
    
    const textureLoader = new THREE.TextureLoader()
    const loadedTextures = []
    let loadedCount = 0
    
    for (let i = 1; i <= 20; i++) {
      const texturePath = `/images/space/${i}.png`
      textureLoader.load(
        texturePath,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace
          loadedTextures[i - 1] = texture
          loadedCount++
          
          if (loadedCount === 20) {
            createObstacles(scene, loadedTextures)
            setAssetsLoaded(true)
          }
        },
        undefined,
        (error) => {
          console.error(`Failed to load texture ${i}.png`)
          loadedCount++
          
          if (loadedCount === 20) {
            createObstacles(scene, loadedTextures)
            setAssetsLoaded(true)
          }
        }
      )
    }
  }
  
  // Create obstacles in 3D space but on Z=0 plane for collision
  const createObstacles = (scene, textures) => {
    console.log('🪐 Creating obstacles')
    
    if (!obstacles || obstacles.length === 0) {
      // Create well-spaced fallback obstacles
      for (let i = 0; i < 20; i++) {
        const radius = 3 + Math.random() * 4
        const geometry = new THREE.SphereGeometry(radius, 32, 32)
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, 1),
          metalness: 0.6,
          roughness: 0.4,
          emissive: new THREE.Color(0x222244),
          emissiveIntensity: 0.3
        })
        const mesh = new THREE.Mesh(geometry, material)
        
        // Pinball layout: zigzag pattern
        const row = Math.floor(i / 4)
        const col = i % 4
        const side = (col % 2 === 0) ? 1 : -1
        
        mesh.position.set(
          side * (25 + col * 10),  // X: spread horizontally
          50 + row * 45,            // Y: vertical spacing
          (Math.random() - 0.5) * 40 // Z: depth variation for 3D look
        )
        
        // Add glow
        const glowGeometry = new THREE.SphereGeometry(radius * 1.15, 16, 16)
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0x4466ff,
          transparent: true,
          opacity: 0.2,
          side: THREE.BackSide
        })
        const glow = new THREE.Mesh(glowGeometry, glowMaterial)
        mesh.add(glow)
        
        scene.add(mesh)
        obstaclesRef.current[i] = mesh
      }
      return
    }
    
    // Use provided obstacles
    obstacles.forEach((obstacle, index) => {
      const texture = textures[obstacle.textureIndex - 1]
      const geometry = new THREE.SphereGeometry(obstacle.radius, 32, 32)
      
      const material = texture ? new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.3,
        roughness: 0.7,
      }) : new THREE.MeshStandardMaterial({
        color: new THREE.Color(Math.random(), Math.random(), Math.random()),
        metalness: 0.5,
        roughness: 0.5,
      })
      
      const mesh = new THREE.Mesh(geometry, material)
      
      // Use obstacle positions with depth variation
      mesh.position.set(
        obstacle.position.x,
        obstacle.position.y,
        obstacle.position.z // Keep Z depth for visuals
      )
      
      scene.add(mesh)
      obstaclesRef.current[index] = mesh
    })
  }
  
  // Setup lighting
  const setupLighting = (scene) => {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
    directionalLight.position.set(50, 300, 100)
    directionalLight.castShadow = true
    scene.add(directionalLight)
    
    // Point lights for atmosphere
    const pointLight1 = new THREE.PointLight(0x00ffff, 2, 300)
    pointLight1.position.set(-50, 200, 50)
    scene.add(pointLight1)
    
    const pointLight2 = new THREE.PointLight(0xff00ff, 2, 300)
    pointLight2.position.set(50, 400, 50)
    scene.add(pointLight2)
    
    const pointLight3 = new THREE.PointLight(0xffff00, 1.5, 250)
    pointLight3.position.set(0, 250, 80)
    scene.add(pointLight3)
  }
  
  // Update coin positions
  useEffect(() => {
    if (!sceneRef.current || coinPositions.length === 0) return
    
    coinPositions.forEach((posData, index) => {
      const playerAddr = playerAddresses[index]
      if (!playerAddr) return
      
      let coin = coinsRef.current.get(playerAddr)
      
      if (!coin) {
        // Create coin with textures
        const coinGeometry = new THREE.CylinderGeometry(5, 5, 0.8, 32)
        const textureLoader = new THREE.TextureLoader()
        
        const sideMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xffd700, 
          metalness: 0.9, 
          roughness: 0.1,
          emissive: 0xaa8800,
          emissiveIntensity: 0.3
        })
        
        coin = new THREE.Mesh(coinGeometry, sideMaterial)
        
        // Glow effect
        const glowGeometry = new THREE.CylinderGeometry(5.8, 5.8, 1.2, 32)
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0xffd700,
          transparent: true,
          opacity: 0.5,
          side: THREE.BackSide
        })
        const glow = new THREE.Mesh(glowGeometry, glowMaterial)
        coin.add(glow)
        
        // Point light on coin
        const coinLight = new THREE.PointLight(0xffd700, 2, 40)
        coin.add(coinLight)
        
        sceneRef.current.add(coin)
        coinsRef.current.set(playerAddr, coin)
      }
      
      // Update position - coin stays at Z=0 for physics
      coin.position.set(
        posData.position.x,
        posData.position.y,
        0 // Z=0 for 2D physics
      )
      
      // Update rotation
      coin.quaternion.set(
        posData.rotation.x,
        posData.rotation.y,
        posData.rotation.z,
        posData.rotation.w
      )
    })
  }, [coinPositions, playerAddresses])
  
  // Clean up coins
  useEffect(() => {
    const currentAddresses = new Set(playerAddresses)
    
    coinsRef.current.forEach((coin, addr) => {
      if (!currentAddresses.has(addr)) {
        sceneRef.current.remove(coin)
        coin.geometry.dispose()
        if (Array.isArray(coin.material)) {
          coin.material.forEach(mat => mat.dispose())
        } else {
          coin.material.dispose()
        }
        coinsRef.current.delete(addr)
      }
    })
  }, [playerAddresses])
  
  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        overflow: 'hidden'
      }}
    >
      {!assetsLoaded && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#00ffff',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          zIndex: 10,
          textShadow: '0 0 20px rgba(0, 255, 255, 0.8)'
        }}>
          Loading Pinball Arena...
        </div>
      )}
    </div>
  )
}

export default PhysicsScene
