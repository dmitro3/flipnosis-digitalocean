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
  const starsRef = useRef(null)
  const [assetsLoaded, setAssetsLoaded] = useState(false)
  
  // Initialize scene
  useEffect(() => {
    if (!mountRef.current) return
    
    console.log('🎬 Initializing 3D Pinball Scene')
    
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    
    const container = mountRef.current
    
    const initializeRenderer = () => {
      // Get actual container dimensions - REDUCED SIZE
      const rect = container.getBoundingClientRect()
      const width = Math.min(rect.width || container.clientWidth || window.innerWidth, 1920)
      const height = Math.min(rect.height || container.clientHeight || window.innerHeight - 300, 1080)
      
      console.log('📐 Scene dimensions:', { width, height, rect })
      
      // Camera positioned to view vertical pinball machine
      const camera = new THREE.PerspectiveCamera(
        50,              // FOV
        width / height,
        0.1,
        2000
      )
      // Position camera to see full height (0 to 500 units)
      camera.position.set(0, 250, 400)  // Looking at center of playfield
      camera.lookAt(0, 250, 0)
      
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: false
      })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      
      // Ensure canvas fills container
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      renderer.domElement.style.display = 'block'
      
      container.appendChild(renderer.domElement)
      
      sceneRef.current = scene
      cameraRef.current = camera
      rendererRef.current = renderer
      
      createStarfield(scene)
      loadObstacles(scene)
      setupLighting(scene)
      
      // Animation loop
      const animate = () => {
        if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return
        
        // Rotate stars slowly for depth
        if (starsRef.current) {
          starsRef.current.rotation.z += 0.0001
        }
        
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
    
    requestAnimationFrame(initializeRenderer)
    
    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return
      
      const rect = mountRef.current.getBoundingClientRect()
      const newWidth = Math.min(rect.width || mountRef.current.clientWidth || window.innerWidth, 1920)
      const newHeight = Math.min(rect.height || mountRef.current.clientHeight || window.innerHeight - 300, 1080)
      
      console.log('🔄 Resize to:', { newWidth, newHeight })
      
      cameraRef.current.aspect = newWidth / newHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(newWidth, newHeight)
    }
    
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
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
  
  // Create animated starfield background - REDUCED SIZE
  const createStarfield = (scene) => {
    const starGeometry = new THREE.BufferGeometry()
    const starVertices = []
    const starSizes = []
    
    // Create 2000 stars scattered in background - REDUCED AREA
    for (let i = 0; i < 2000; i++) {
      const x = (Math.random() - 0.5) * 600  // Reduced from 800
      const y = Math.random() * 400          // Reduced from 600
      const z = -150 - Math.random() * 200   // Behind playfield
      starVertices.push(x, y, z)
      starSizes.push(Math.random() * 2 + 0.5)
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3))
    starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1))
    
    const starMaterial = new THREE.PointsMaterial({ 
      color: 0xffffff, 
      size: 2,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    })
    
    const stars = new THREE.Points(starGeometry, starMaterial)
    starsRef.current = stars
    scene.add(stars)
    
    console.log('⭐ Added twinkling starfield')
  }
  
  // Load obstacles in pinball layout
  const loadObstacles = (scene) => {
    console.log('🪨 Creating 3D pinball obstacles')
    
    if (!obstacles || obstacles.length === 0) {
      // Create 20 obstacles in vertical pinball pattern
      for (let i = 0; i < 20; i++) {
        const radius = 8 + Math.random() * 6
        
        // Create textured sphere
        const geometry = new THREE.SphereGeometry(radius, 32, 32)
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(
            0.3 + Math.random() * 0.7,
            0.3 + Math.random() * 0.7,
            0.8 + Math.random() * 0.2
          ),
          metalness: 0.6,
          roughness: 0.3,
          emissive: new THREE.Color(0x222244),
          emissiveIntensity: 0.4
        })
        
        const mesh = new THREE.Mesh(geometry, material)
        
        // Vertical zigzag pattern (pinball bumpers)
        const row = Math.floor(i / 4)
        const col = i % 4
        const side = (col % 2 === 0) ? 1 : -1
        
        mesh.position.set(
          side * (30 + col * 12),     // X: horizontal spread
          80 + row * 50,               // Y: vertical spacing (20 obstacles over 500 units)
          0                            // Z: locked at 0 for 2D physics
        )
        
        mesh.castShadow = true
        mesh.receiveShadow = true
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(radius * 1.2, 16, 16)
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0x4466ff,
          transparent: true,
          opacity: 0.15,
          side: THREE.BackSide
        })
        const glow = new THREE.Mesh(glowGeometry, glowMaterial)
        mesh.add(glow)
        
        scene.add(mesh)
        obstaclesRef.current[i] = mesh
      }
    } else {
      // Use provided obstacles
      obstacles.forEach((obstacle, index) => {
        const geometry = new THREE.SphereGeometry(obstacle.radius, 32, 32)
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(Math.random(), Math.random(), Math.random()),
          metalness: 0.5,
          roughness: 0.4,
        })
        
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(
          obstacle.position.x,
          obstacle.position.y,
          0 // Force Z=0 for 2D physics
        )
        
        mesh.castShadow = true
        mesh.receiveShadow = true
        
        scene.add(mesh)
        obstaclesRef.current[index] = mesh
      })
    }
    
    setAssetsLoaded(true)
  }
  
  // Setup dramatic lighting
  const setupLighting = (scene) => {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    // Main directional light (from above)
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2)
    mainLight.position.set(0, 400, 200)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 1000
    mainLight.shadow.camera.left = -200
    mainLight.shadow.camera.right = 200
    mainLight.shadow.camera.top = 200
    mainLight.shadow.camera.bottom = -200
    scene.add(mainLight)
    
    // Colored accent lights
    const accentLight1 = new THREE.PointLight(0x00ffff, 1.5, 400)
    accentLight1.position.set(-100, 300, 100)
    scene.add(accentLight1)
    
    const accentLight2 = new THREE.PointLight(0xff00ff, 1.5, 400)
    accentLight2.position.set(100, 200, 100)
    scene.add(accentLight2)
    
    const accentLight3 = new THREE.PointLight(0xffff00, 1.2, 350)
    accentLight3.position.set(0, 450, 80)
    scene.add(accentLight3)
    
    console.log('💡 Lighting configured')
  }
  
  // Update coin positions
  useEffect(() => {
    if (!sceneRef.current || coinPositions.length === 0) return
    
    coinPositions.forEach((posData, index) => {
      const playerAddr = playerAddresses[index]
      if (!playerAddr) return
      
      let coin = coinsRef.current.get(playerAddr)
      
      if (!coin) {
        // Create beautiful 3D coin
        const coinGeometry = new THREE.CylinderGeometry(5, 5, 0.8, 32)
        
        const sideMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xffd700, 
          metalness: 0.9, 
          roughness: 0.1,
          emissive: 0xaa8800,
          emissiveIntensity: 0.4
        })
        
        coin = new THREE.Mesh(coinGeometry, sideMaterial)
        coin.castShadow = true
        coin.receiveShadow = true
        
        // Glow effect
        const glowGeometry = new THREE.CylinderGeometry(6, 6, 1.2, 32)
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0xffd700,
          transparent: true,
          opacity: 0.4,
          side: THREE.BackSide
        })
        const glow = new THREE.Mesh(glowGeometry, glowMaterial)
        coin.add(glow)
        
        // Point light on coin
        const coinLight = new THREE.PointLight(0xffd700, 3, 50)
        coin.add(coinLight)
        
        sceneRef.current.add(coin)
        coinsRef.current.set(playerAddr, coin)
      }
      
      // Update position - LOCKED AT Z=0
      coin.position.set(
        posData.position.x,
        posData.position.y,
        0 // CRITICAL: Z=0 for 2D physics
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
        position: 'absolute',
        top: 0,
        left: 0,
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
          fontSize: '2rem',
          fontWeight: 'bold',
          zIndex: 10,
          textShadow: '0 0 20px rgba(0, 255, 255, 0.8)',
          fontFamily: 'monospace'
        }}>
          ⚡ LOADING PINBALL ARENA...
        </div>
      )}
    </div>
  )
}

export default PhysicsScene
