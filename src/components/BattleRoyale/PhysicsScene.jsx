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
      // Get actual container dimensions
      const rect = container.getBoundingClientRect()
      const width = rect.width || container.clientWidth || window.innerWidth
      const height = rect.height || container.clientHeight || window.innerHeight - 300
      
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
      const newWidth = rect.width || mountRef.current.clientWidth || window.innerWidth
      const newHeight = rect.height || mountRef.current.clientHeight || window.innerHeight - 300
      
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
  
  // Create animated starfield background - MUCH TALLER AND WIDER
  const createStarfield = (scene) => {
    const starGeometry = new THREE.BufferGeometry()
    const starVertices = []
    const starSizes = []
    
    // Create 2000 stars scattered in background - MUCH TALLER SCENE
    for (let i = 0; i < 2000; i++) {
      const x = (Math.random() - 0.5) * 2400  // 25% wider than 1920
      const y = Math.random() * 3000           // MUCH taller - 3x height
      const z = -150 - Math.random() * 200     // Behind playfield
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
    
    console.log('⭐ Added twinkling starfield (2400x3000 - MUCH TALLER)')
  }
  
  // Load obstacles with proper textures - BIGGER ELEMENTS
  const loadObstacles = (scene) => {
    console.log('🪨 Creating 3D pinball obstacles with textures - BIGGER')
    
    if (!obstacles || obstacles.length === 0) {
      // Create 20 obstacles in vertical pinball pattern with textures - BIGGER
      for (let i = 0; i < 20; i++) {
        const radius = 15 + Math.random() * 10  // MUCH BIGGER (was 8-14, now 15-25)
        
        // Create textured sphere
        const geometry = new THREE.SphereGeometry(radius, 32, 32)
        
        // Load texture for this obstacle
        const textureLoader = new THREE.TextureLoader()
        const texturePath = `/images/space/${i + 1}.png`
        
        const material = new THREE.MeshStandardMaterial({
          map: textureLoader.load(texturePath, 
            (texture) => {
              console.log(`✅ Loaded texture ${i + 1}.png`)
              texture.colorSpace = THREE.SRGBColorSpace
            },
            undefined,
            (error) => {
              console.warn(`⚠️ Failed to load texture ${i + 1}.png, using fallback`)
            }
          ),
          metalness: 0.6,
          roughness: 0.3,
          emissive: new THREE.Color(0x222244),
          emissiveIntensity: 0.4
        })
        
        const mesh = new THREE.Mesh(geometry, material)
        
        // Vertical zigzag pattern (pinball bumpers) - SPREAD OVER TALLER AREA
        const row = Math.floor(i / 4)
        const col = i % 4
        const side = (col % 2 === 0) ? 1 : -1
        
        mesh.position.set(
          side * (50 + col * 20),      // X: wider spread (was 30+12, now 50+20)
          100 + row * 120,             // Y: much taller spacing (was 50, now 120)
          0                            // Z: locked at 0 for 2D physics
        )
        
        mesh.castShadow = true
        mesh.receiveShadow = true
        
        // Add glow effect - BIGGER
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
      // Use provided obstacles with textures - BIGGER
      obstacles.forEach((obstacle, index) => {
        const geometry = new THREE.SphereGeometry(obstacle.radius * 2, 32, 32)  // 2x bigger
        
        const textureLoader = new THREE.TextureLoader()
        const texturePath = `/images/space/${obstacle.textureIndex || (index + 1)}.png`
        
        const material = new THREE.MeshStandardMaterial({
          map: textureLoader.load(texturePath,
            (texture) => {
              console.log(`✅ Loaded obstacle texture ${obstacle.textureIndex || (index + 1)}.png`)
              texture.colorSpace = THREE.SRGBColorSpace
            },
            undefined,
            (error) => {
              console.warn(`⚠️ Failed to load obstacle texture, using fallback`)
            }
          ),
          metalness: 0.5,
          roughness: 0.4,
        })
        
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(
          obstacle.position.x,
          obstacle.position.y * 2,  // 2x taller spacing
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
    
    // Main directional light (from above) - ADJUSTED FOR TALLER SCENE
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2)
    mainLight.position.set(0, 800, 400)  // Higher up for taller scene
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 2000
    mainLight.shadow.camera.left = -400
    mainLight.shadow.camera.right = 400
    mainLight.shadow.camera.top = 400
    mainLight.shadow.camera.bottom = -400
    scene.add(mainLight)
    
    // Colored accent lights - ADJUSTED FOR TALLER SCENE
    const accentLight1 = new THREE.PointLight(0x00ffff, 1.5, 600)
    accentLight1.position.set(-150, 600, 150)
    scene.add(accentLight1)
    
    const accentLight2 = new THREE.PointLight(0xff00ff, 1.5, 600)
    accentLight2.position.set(150, 400, 150)
    scene.add(accentLight2)
    
    const accentLight3 = new THREE.PointLight(0xffff00, 1.2, 500)
    accentLight3.position.set(0, 900, 120)
    scene.add(accentLight3)
    
    console.log('💡 Lighting configured for taller scene')
  }
  
  // Update coin positions - BIGGER COINS
  useEffect(() => {
    if (!sceneRef.current || coinPositions.length === 0) return
    
    coinPositions.forEach((posData, index) => {
      const playerAddr = playerAddresses[index]
      if (!playerAddr) return
      
      let coin = coinsRef.current.get(playerAddr)
      
      if (!coin) {
        // Create beautiful 3D coin - BIGGER
        const coinGeometry = new THREE.CylinderGeometry(8, 8, 1.5, 32)  // Bigger (was 5, now 8)
        
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
        
        // Glow effect - BIGGER
        const glowGeometry = new THREE.CylinderGeometry(10, 10, 2, 32)  // Bigger (was 6, now 10)
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0xffd700,
          transparent: true,
          opacity: 0.4,
          side: THREE.BackSide
        })
        const glow = new THREE.Mesh(glowGeometry, glowMaterial)
        coin.add(glow)
        
        // Point light on coin - BIGGER
        const coinLight = new THREE.PointLight(0xffd700, 3, 80)  // Bigger range (was 50, now 80)
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
