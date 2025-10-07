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
  
  // Initialize scene
  useEffect(() => {
    if (!mountRef.current) return
    
    console.log('🎬 Initializing Physics Scene')
    
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000020) // Slightly lighter for visibility
    
    const camera = new THREE.PerspectiveCamera(
      75, // Wider FOV for better view
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      3000 // Much further far plane for tall vertical scene
    )
    camera.position.set(0, 5, 80) // Start lower for pinball effect
    camera.lookAt(0, 5, 0)
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.5
    
    mountRef.current.appendChild(renderer.domElement)
    
    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer
    
    loadAssets(scene)
    setupLighting(scene)
    
    // Animation loop
    const animate = () => {
      if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return
      
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
      
      // Slowly rotate obstacles for visual interest
      obstaclesRef.current.forEach((obstacle, index) => {
        if (obstacle) {
          obstacle.rotation.y += 0.001 * (index % 2 === 0 ? 1 : -1)
        }
      })
      
      renderer.render(scene, camera)
      animationIdRef.current = requestAnimationFrame(animate)
    }
    
    animate()
    
    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
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
      
      if (renderer) {
        renderer.dispose()
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement)
        }
      }
      
      sceneRef.current = null
      cameraRef.current = null
      rendererRef.current = null
    }
  }, [])
  
  // Load skybox and obstacle textures
  const loadAssets = async (scene) => {
    console.log('📦 Loading assets...')
    
    // Always use starfield - it's more reliable and looks good
    console.log('🌟 Creating vertical space starfield...')
    createStarfield(scene)
    
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
      return
    }
    
    console.log(`🪐 Creating ${obstacles.length} obstacles`)
    
    obstacles.forEach((obstacle, index) => {
      const texture = textures[obstacle.textureIndex - 1]
      
      if (!texture) {
        console.warn(`⚠️ Texture missing for obstacle ${index}`)
        return
      }
      
      const geometry = new THREE.SphereGeometry(obstacle.radius, 64, 64)
      
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.4,
        roughness: 0.5,
        emissive: new THREE.Color(0x333366),
        emissiveIntensity: 0.4,
      })
      
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(
        obstacle.position.x,
        obstacle.position.y,
        obstacle.position.z
      )
      mesh.castShadow = true
      mesh.receiveShadow = true
      
      // Add glow effect to all obstacles for visibility
      const glowGeometry = new THREE.SphereGeometry(obstacle.radius * 1.15, 32, 32)
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x6688ff,
        transparent: true,
        opacity: 0.25,
        side: THREE.BackSide
      })
      const glow = new THREE.Mesh(glowGeometry, glowMaterial)
      mesh.add(glow)
      
      // Add point light to each obstacle for better visibility
      const obstacleLight = new THREE.PointLight(0x6688ff, 1.5, obstacle.radius * 5)
      mesh.add(obstacleLight)
      
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
        position: 'absolute',
        top: 0,
        left: 0
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