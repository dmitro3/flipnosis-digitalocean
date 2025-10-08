import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

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
  const coinsRef = useRef(new Map()) // Map of playerAddress -> coin mesh
  const animationIdRef = useRef(null)
  const [assetsLoaded, setAssetsLoaded] = useState(false)
  const [highestCoin, setHighestCoin] = useState(null)
  const [glbLoaded, setGlbLoaded] = useState(false)
  
  // Initialize scene
  useEffect(() => {
    if (!mountRef.current) {
      console.error('❌ mountRef.current is null!')
      return
    }
    
    console.log('🎬 Initializing Physics Scene')
    console.log('📐 Container dimensions:', {
      width: mountRef.current.clientWidth,
      height: mountRef.current.clientHeight,
      offsetWidth: mountRef.current.offsetWidth,
      offsetHeight: mountRef.current.offsetHeight
    })
    
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000020) // Slightly lighter for visibility
    
    const width = mountRef.current.clientWidth || window.innerWidth
    const height = mountRef.current.clientHeight || window.innerHeight - 300
    
    console.log('🎥 Using dimensions:', { width, height })
    
    const camera = new THREE.PerspectiveCamera(
      75, // Wider FOV for better view
      width / height,
      0.1,
      3000 // Much further far plane for tall vertical scene
    )
    camera.position.set(0, 5, 80) // Start lower for pinball effect
    camera.lookAt(0, 5, 0)
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.5
    
    console.log('🖼️ Renderer created:', {
      domElement: renderer.domElement,
      size: { width: renderer.domElement.width, height: renderer.domElement.height }
    })
    
    mountRef.current.appendChild(renderer.domElement)
    console.log('✅ Renderer appended to DOM')
    
    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer
    
    loadAssets(scene)
    setupLighting(scene)
    
    // Add a test cube to verify rendering works
    const testGeometry = new THREE.BoxGeometry(10, 10, 10)
    const testMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: false })
    const testCube = new THREE.Mesh(testGeometry, testMaterial)
    testCube.position.set(0, 20, 0)
    scene.add(testCube)
    console.log('🟪 Test cube added at (0, 20, 0) - should be BRIGHT MAGENTA')
    
    // Animation loop
    let frameCount = 0
    const animate = () => {
      if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return
      
      const camera = cameraRef.current
      
      // Slowly rotate obstacles for visual interest
      obstaclesRef.current.forEach((obstacle, index) => {
        if (obstacle) {
          obstacle.rotation.y += 0.001 * (index % 2 === 0 ? 1 : -1)
        }
      })
      
      // Rotate test cube
      if (testCube) {
        testCube.rotation.x += 0.01
        testCube.rotation.y += 0.01
      }
      
      rendererRef.current.render(scene, camera)
      
      // Log first few frames to confirm animation is running
      if (frameCount < 3) {
        console.log(`🎬 Frame ${frameCount} rendered`, {
          cameraPos: camera.position,
          sceneChildren: scene.children.length
        })
        frameCount++
      }
      
      animationIdRef.current = requestAnimationFrame(animate)
    }
    
    console.log('▶️ Starting animation loop...')
    animate()
    
    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return
      cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
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
      
      sceneRef.current = null
      cameraRef.current = null
      rendererRef.current = null
    }
  }, []) // Remove highestCoin dependency to prevent re-initialization
  
  // Load GLB skybox only once
  useEffect(() => {
    if (!sceneRef.current || glbLoaded) return
    
    console.log('🌌 Loading space.glb skybox...')
    const gltfLoader = new GLTFLoader()
    
    gltfLoader.load(
      '/images/space/space.glb',
      (gltf) => {
        console.log('✅ Space GLB loaded successfully', gltf)
        const nebulaSkybox = gltf.scene
        
        // Scale it HUGE to surround the entire scene (try different scales)
        nebulaSkybox.scale.set(1000, 1000, 1000)
        
        // Position at origin
        nebulaSkybox.position.set(0, 0, 0)
        
        // Make sure it renders behind everything
        nebulaSkybox.traverse((child) => {
          if (child.isMesh) {
            console.log('Nebula mesh found:', child.name, child.geometry, child.material)
            child.renderOrder = -1000
            // Try DoubleSide first to see both sides
            if (child.material) {
              child.material.side = THREE.DoubleSide
              child.material.depthWrite = false // Don't write to depth buffer
            }
          }
        })
        
        sceneRef.current.add(nebulaSkybox)
        console.log('✅ Nebula skybox added to scene')
        setGlbLoaded(true)
      },
      (progress) => {
        const percent = (progress.loaded / progress.total) * 100
        console.log(`🌌 Loading skybox: ${percent.toFixed(1)}%`)
      },
      (error) => {
        console.error('❌ Failed to load space.glb:', error)
        console.log('⚠️ Using procedural starfield as fallback')
        // Create starfield as fallback if GLB fails
        createStarfield(sceneRef.current)
        setGlbLoaded(true) // Set to true even on error to prevent retries
      }
    )
  }, [glbLoaded])
  
  // Camera tracking effect - separate from scene initialization
  useEffect(() => {
    if (!cameraRef.current) return
    
    const camera = cameraRef.current
    
    // Camera tracking - follow highest coin (pinball style)
    if (highestCoin) {
      // Camera follows coin vertically, staying behind it
      const targetPos = new THREE.Vector3(
        0, // Keep camera centered horizontally
        highestCoin.y + 10, // Slightly above coin
        80 // Keep distance from scene
      )
      const lookAtPos = new THREE.Vector3(0, highestCoin.y, 0)
      
      camera.position.lerp(targetPos, 0.08) // Smooth following
      
      // Smoothly look at the coin's height
      const currentLookAt = new THREE.Vector3(0, 0, -1)
      currentLookAt.applyQuaternion(camera.quaternion)
      const targetLookDir = lookAtPos.clone().sub(camera.position).normalize()
      currentLookAt.lerp(targetLookDir, 0.08)
      
      const lookPoint = camera.position.clone().add(currentLookAt)
      camera.lookAt(lookPoint)
    } else {
      // Return to base position (bottom of pinball machine)
      const basePos = new THREE.Vector3(0, 5, 80)
      camera.position.lerp(basePos, 0.05)
      const baseLookAt = new THREE.Vector3(0, 5, 0)
      
      const currentLookAt = new THREE.Vector3(0, 0, -1)
      currentLookAt.applyQuaternion(camera.quaternion)
      const targetLookDir = baseLookAt.clone().sub(camera.position).normalize()
      currentLookAt.lerp(targetLookDir, 0.05)
      
      const lookPoint = camera.position.clone().add(currentLookAt)
      camera.lookAt(lookPoint)
    }
  }, [highestCoin])
  
  // Load skybox and obstacle textures
  const loadAssets = async (scene) => {
    console.log('📦 Loading assets...')
    console.log('📊 Obstacles received:', obstacles)
    console.log('📊 Number of obstacles:', obstacles?.length || 0)
    
    // Don't create starfield - let nebula.glb handle the backdrop
    // createStarfield(scene) // Removed - using GLB skybox instead
    
    // Load obstacle textures
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
            console.log('✅ All obstacle textures loaded')
            createObstacles(scene, loadedTextures)
            setAssetsLoaded(true)
          }
        },
        undefined,
        (error) => {
          console.error(`❌ Failed to load texture ${i}.png:`, error)
          loadedCount++
          
          if (loadedCount === 20) {
            console.log('⚠️ Some textures failed, proceeding with loaded ones')
            createObstacles(scene, loadedTextures)
            setAssetsLoaded(true)
          }
        }
      )
    }
  }
  
  // Create starfield - vertical space tunnel
  const createStarfield = (scene) => {
    // Main starfield
    const starGeometry = new THREE.BufferGeometry()
    const starMaterial = new THREE.PointsMaterial({ 
      color: 0xffffff, 
      size: 2.5, 
      sizeAttenuation: true,
      transparent: true,
      opacity: 1.0
    })
    
    const starVertices = []
    // Create a vertical tunnel of stars - matches obstacle height
    for (let i = 0; i < 5000; i++) {
      const x = (Math.random() - 0.5) * 300
      const y = Math.random() * 700 - 50 // Tall vertical spread
      const z = (Math.random() - 0.5) * 300
      starVertices.push(x, y, z)
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3))
    const stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)
    console.log('⭐ Added main starfield with 5000 stars')
    
    // Add purple nebula clouds
    const nebula1Geometry = new THREE.BufferGeometry()
    const nebula1Material = new THREE.PointsMaterial({ 
      color: 0x6644ff, 
      size: 5, 
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.4
    })
    
    const nebula1Vertices = []
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 250
      const y = Math.random() * 700 - 50
      const z = (Math.random() - 0.5) * 250
      nebula1Vertices.push(x, y, z)
    }
    
    nebula1Geometry.setAttribute('position', new THREE.Float32BufferAttribute(nebula1Vertices, 3))
    const nebula1 = new THREE.Points(nebula1Geometry, nebula1Material)
    scene.add(nebula1)
    
    // Add cyan nebula clouds
    const nebula2Geometry = new THREE.BufferGeometry()
    const nebula2Material = new THREE.PointsMaterial({ 
      color: 0x00ffff, 
      size: 4, 
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.3
    })
    
    const nebula2Vertices = []
    for (let i = 0; i < 800; i++) {
      const x = (Math.random() - 0.5) * 200
      const y = Math.random() * 700 - 50
      const z = (Math.random() - 0.5) * 200
      nebula2Vertices.push(x, y, z)
    }
    
    nebula2Geometry.setAttribute('position', new THREE.Float32BufferAttribute(nebula2Vertices, 3))
    const nebula2 = new THREE.Points(nebula2Geometry, nebula2Material)
    scene.add(nebula2)
    
    console.log('🌌 Added nebula clouds')
  }
  
  // Create obstacles from loaded textures
  const createObstacles = (scene, textures) => {
    if (!obstacles || obstacles.length === 0) {
      console.warn('⚠️ No obstacle data provided')
      console.warn('⚠️ Creating fallback obstacles for testing...')
      
      // Create fallback obstacles for testing
      for (let i = 0; i < 10; i++) {
        const geometry = new THREE.SphereGeometry(4 + Math.random() * 3, 64, 64)
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(Math.random(), Math.random(), Math.random()),
          metalness: 0.5,
          roughness: 0.5,
          emissive: new THREE.Color(0x444466),
          emissiveIntensity: 0.5,
        })
        const mesh = new THREE.Mesh(geometry, material)
        const side = (i % 2 === 0) ? 1 : -1
        mesh.position.set(side * (15 + Math.random() * 20), 30 + i * 40, (Math.random() - 0.5) * 30)
        scene.add(mesh)
        obstaclesRef.current[i] = mesh
      }
      console.log('✅ Created 10 fallback colored obstacles')
      return
    }
    
    console.log(`🪐 Creating ${obstacles.length} obstacles with textures`)
    
    obstacles.forEach((obstacle, index) => {
      const texture = textures[obstacle.textureIndex - 1]
      
      if (!texture) {
        console.warn(`⚠️ Texture missing for obstacle ${index}, using fallback color`)
        // Create colored sphere as fallback
        const geometry = new THREE.SphereGeometry(obstacle.radius, 64, 64)
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(Math.random(), Math.random(), Math.random()),
          metalness: 0.5,
          roughness: 0.5,
          emissive: new THREE.Color(0x444466),
          emissiveIntensity: 0.5,
        })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(obstacle.position.x, obstacle.position.y, obstacle.position.z)
        scene.add(mesh)
        obstaclesRef.current[index] = mesh
        return
      }
      
      console.log(`✅ Creating obstacle ${index} with texture at position:`, obstacle.position)
      
      const geometry = new THREE.SphereGeometry(obstacle.radius, 64, 64)
      
      // Make sure texture uses proper color space
      texture.colorSpace = THREE.SRGBColorSpace
      
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.2,  // Less metallic for planet-like surface
        roughness: 0.8,  // More rough for realistic planets
        emissive: new THREE.Color(0x000000),  // No emission initially
        emissiveIntensity: 0,
      })
      
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(
        obstacle.position.x,
        obstacle.position.y,
        obstacle.position.z
      )
      mesh.castShadow = true
      mesh.receiveShadow = true
      
      // Only add subtle glow to larger obstacles
      if (obstacle.radius > 4) {
        const glowGeometry = new THREE.SphereGeometry(obstacle.radius * 1.1, 16, 16)
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0x4466ff,
          transparent: true,
          opacity: 0.15,  // Very subtle
          side: THREE.BackSide
        })
        const glow = new THREE.Mesh(glowGeometry, glowMaterial)
        mesh.add(glow)
      }
      
      scene.add(mesh)
      obstaclesRef.current[index] = mesh
    })
  }
  
  // Setup lighting
  const setupLighting = (scene) => {
    const ambientLight = new THREE.AmbientLight(0x404080, 2.5)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
    directionalLight.position.set(50, 200, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.camera.left = -100
    directionalLight.shadow.camera.right = 100
    directionalLight.shadow.camera.top = 200
    directionalLight.shadow.camera.bottom = -100
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)
    
    // Add multiple point lights along the vertical path
    for (let i = 0; i < 8; i++) {
      const height = i * 70 // Space them out along the tall scene
      const pointLight1 = new THREE.PointLight(0x00ffff, 2.5, 180)
      pointLight1.position.set(-30, height, 20)
      scene.add(pointLight1)
      
      const pointLight2 = new THREE.PointLight(0xff00ff, 2.5, 180)
      pointLight2.position.set(30, height + 35, -20)
      scene.add(pointLight2)
    }
    
    const hemisphereLight = new THREE.HemisphereLight(0x4466ff, 0x000000, 1)
    scene.add(hemisphereLight)
  }
  
  // Update coin positions from server (multiple coins)
  useEffect(() => {
    if (!sceneRef.current || coinPositions.length === 0) {
      setHighestCoin(null)
      return
    }
    
    let highestY = -Infinity
    let highestPos = null
    
    coinPositions.forEach((posData, index) => {
      const playerAddr = playerAddresses[index]
      if (!playerAddr) return
      
      // Track highest coin for camera
      if (posData.position.y > highestY) {
        highestY = posData.position.y
        highestPos = posData.position
      }
      
      let coin = coinsRef.current.get(playerAddr)
      
      if (!coin) {
        // Create new coin for this player with custom textures
        const coinGeometry = new THREE.CylinderGeometry(5, 5, 0.8, 64) // Much bigger coins for visibility!
        
        // Create materials for different parts of the coin
        const sideMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xffd700, 
          metalness: 0.9, 
          roughness: 0.1,
          emissive: 0xffd700,
          emissiveIntensity: 0.5
        })
        
        // Load coin textures if available
        const textureLoader = new THREE.TextureLoader()
        let headsTexture = null
        let tailsTexture = null
        
        if (posData.coinData) {
          textureLoader.load(posData.coinData.headsImage, (texture) => {
            headsTexture = texture
            headsTexture.colorSpace = THREE.SRGBColorSpace
          })
          textureLoader.load(posData.coinData.tailsImage, (texture) => {
            tailsTexture = texture
            tailsTexture.colorSpace = THREE.SRGBColorSpace
          })
        }
        
        const headsMaterial = new THREE.MeshStandardMaterial({
          map: headsTexture,
          metalness: 0.8,
          roughness: 0.2
        })
        
        const tailsMaterial = new THREE.MeshStandardMaterial({
          map: tailsTexture,
          metalness: 0.8,
          roughness: 0.2
        })
        
        // Create coin with multiple materials
        coin = new THREE.Mesh(coinGeometry, [
          sideMaterial, // Side
          headsMaterial, // Top (heads)
          tailsMaterial  // Bottom (tails)
        ])
        coin.castShadow = true
        
        // Add glow effect
        const glowGeometry = new THREE.CylinderGeometry(5.5, 5.5, 1, 64)
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0xffd700,
          transparent: true,
          opacity: 0.4,
          side: THREE.BackSide
        })
        const glow = new THREE.Mesh(glowGeometry, glowMaterial)
        coin.add(glow)
        
        // Add bright point light to coin for better visibility
        const coinLight = new THREE.PointLight(0xffd700, 2, 30)
        coin.add(coinLight)
        
        sceneRef.current.add(coin)
        coinsRef.current.set(playerAddr, coin)
      }
      
      coin.position.set(
        posData.position.x,
        posData.position.y,
        posData.position.z
      )
      
      coin.quaternion.set(
        posData.rotation.x,
        posData.rotation.y,
        posData.rotation.z,
        posData.rotation.w
      )
    })
    
    setHighestCoin(highestPos)
    
  }, [coinPositions, playerAddresses])
  
  // Clean up coins when they're removed
  useEffect(() => {
    // Remove coins that are no longer in the position list
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
        position: 'relative',
        backgroundColor: '#000020',
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
          textShadow: '0 0 20px rgba(0, 255, 255, 0.8)',
          zIndex: 10
        }}>
          Loading Space Assets...
        </div>
      )}
    </div>
  )
}

export default PhysicsScene