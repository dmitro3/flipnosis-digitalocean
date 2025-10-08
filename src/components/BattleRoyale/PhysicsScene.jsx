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
    
    console.log('🎬 Initializing 2.5D Pinball Scene')
    
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000) // Pure black
    
    const width = mountRef.current.clientWidth || window.innerWidth
    const height = mountRef.current.clientHeight || window.innerHeight - 300
    
    // Orthographic camera for true 2D pinball view
    const aspectRatio = width / height
    const viewHeight = 300 // View height in world units
    const viewWidth = viewHeight * aspectRatio
    
    const camera = new THREE.OrthographicCamera(
      -viewWidth / 2,  // left
      viewWidth / 2,   // right
      viewHeight / 2,  // top
      -viewHeight / 2, // bottom
      0.1,             // near
      1000             // far
    )
    camera.position.set(0, 250, 100) // Look straight at the playfield
    camera.lookAt(0, 250, 0)
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    
    mountRef.current.appendChild(renderer.domElement)
    
    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer
    
    createSimpleStarfield(scene)
    loadAssets(scene)
    setupLighting(scene)
    
    // Animation loop
    const animate = () => {
      if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return
      
      // Slowly rotate obstacles for visual interest
      obstaclesRef.current.forEach((obstacle, index) => {
        if (obstacle) {
          obstacle.rotation.y += 0.001 * (index % 2 === 0 ? 1 : -1)
        }
      })
      
      rendererRef.current.render(sceneRef.current, cameraRef.current)
      animationIdRef.current = requestAnimationFrame(animate)
    }
    
    animate()
    
    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return
      
      const newWidth = mountRef.current.clientWidth
      const newHeight = mountRef.current.clientHeight
      const newAspectRatio = newWidth / newHeight
      const newViewWidth = viewHeight * newAspectRatio
      
      cameraRef.current.left = -newViewWidth / 2
      cameraRef.current.right = newViewWidth / 2
      cameraRef.current.top = viewHeight / 2
      cameraRef.current.bottom = -viewHeight / 2
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
  
  // Create simple starfield background
  const createSimpleStarfield = (scene) => {
    const starGeometry = new THREE.BufferGeometry()
    const starMaterial = new THREE.PointsMaterial({ 
      color: 0xffffff, 
      size: 2, 
      sizeAttenuation: false // Keep stars same size regardless of distance
    })
    
    const starVertices = []
    // Create stars in a flat plane behind the playfield
    for (let i = 0; i < 500; i++) {
      const x = (Math.random() - 0.5) * 400
      const y = Math.random() * 600 - 50
      const z = -50 // All stars at same depth, behind playfield
      starVertices.push(x, y, z)
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3))
    const stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)
  }
  
  // Load obstacle textures
  const loadAssets = async (scene) => {
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
  
  // Create obstacles - all at Z=0 for flat playfield
  const createObstacles = (scene, textures) => {
    if (!obstacles || obstacles.length === 0) {
      console.warn('Creating fallback obstacles')
      
      // Create fallback obstacles
      for (let i = 0; i < 15; i++) {
        const geometry = new THREE.SphereGeometry(4 + Math.random() * 3, 32, 32)
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(Math.random(), Math.random(), Math.random()),
          metalness: 0.5,
          roughness: 0.5,
        })
        const mesh = new THREE.Mesh(geometry, material)
        
        // Pinball layout: alternating left/right
        const side = (i % 2 === 0) ? 1 : -1
        mesh.position.set(
          side * (20 + Math.random() * 30), // X: left or right
          30 + i * 35,                        // Y: vertical spacing
          0                                   // Z: FLAT PLAYFIELD
        )
        
        scene.add(mesh)
        obstaclesRef.current[i] = mesh
      }
      return
    }
    
    obstacles.forEach((obstacle, index) => {
      const texture = textures[obstacle.textureIndex - 1]
      const geometry = new THREE.SphereGeometry(obstacle.radius, 32, 32)
      
      const material = texture ? new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.2,
        roughness: 0.8,
      }) : new THREE.MeshStandardMaterial({
        color: new THREE.Color(Math.random(), Math.random(), Math.random()),
        metalness: 0.5,
        roughness: 0.5,
      })
      
      const mesh = new THREE.Mesh(geometry, material)
      
      // FORCE Z = 0 for flat playfield
      mesh.position.set(
        obstacle.position.x,
        obstacle.position.y,
        0 // Override any Z position
      )
      
      scene.add(mesh)
      obstaclesRef.current[index] = mesh
    })
  }
  
  // Setup lighting
  const setupLighting = (scene) => {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight.position.set(0, 200, 50)
    scene.add(directionalLight)
    
    // Add point lights for atmosphere
    const pointLight1 = new THREE.PointLight(0x00ffff, 1, 200)
    pointLight1.position.set(-50, 150, 20)
    scene.add(pointLight1)
    
    const pointLight2 = new THREE.PointLight(0xff00ff, 1, 200)
    pointLight2.position.set(50, 300, 20)
    scene.add(pointLight2)
  }
  
  // Update coin positions
  useEffect(() => {
    if (!sceneRef.current || coinPositions.length === 0) return
    
    coinPositions.forEach((posData, index) => {
      const playerAddr = playerAddresses[index]
      if (!playerAddr) return
      
      let coin = coinsRef.current.get(playerAddr)
      
      if (!coin) {
        // Create coin
        const coinGeometry = new THREE.CylinderGeometry(5, 5, 0.8, 32)
        const textureLoader = new THREE.TextureLoader()
        
        const sideMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xffd700, 
          metalness: 0.9, 
          roughness: 0.1,
        })
        
        coin = new THREE.Mesh(coinGeometry, sideMaterial)
        
        // Add glow
        const glowGeometry = new THREE.CylinderGeometry(5.5, 5.5, 1, 32)
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0xffd700,
          transparent: true,
          opacity: 0.4,
        })
        const glow = new THREE.Mesh(glowGeometry, glowMaterial)
        coin.add(glow)
        
        sceneRef.current.add(coin)
        coinsRef.current.set(playerAddr, coin)
      }
      
      // Update coin position - CONSTRAIN Z TO 0
      coin.position.set(
        posData.position.x,
        posData.position.y,
        0 // Force Z = 0 for flat playfield
      )
      
      // Allow rotation for visual flair
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
        position: 'relative',
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
          zIndex: 10
        }}>
          Loading Pinball Arena...
        </div>
      )}
    </div>
  )
}

export default PhysicsScene
