// CoinStream service without canvas dependency
const THREE = require('three')

class CoinStreamService {
  constructor() {
    this.scenes = new Map()
    this.isCanvasAvailable = false
    this.createCanvas = null
    
    // Try to load canvas, but don't fail if it's not available
    try {
      const canvasModule = require('canvas')
      this.createCanvas = canvasModule.createCanvas
      this.isCanvasAvailable = true
      console.log('✅ Canvas available for server-side rendering')
    } catch (error) {
      console.log('⚠️ Canvas not available, using fallback mode:', error.message)
      this.isCanvasAvailable = false
    }
  }

  createScene(gameId) {
    if (this.scenes.has(gameId)) {
      return this.scenes.get(gameId)
    }

    // Create Three.js scene
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    
    // Create a simple coin geometry
    const geometry = new THREE.CylinderGeometry(1, 1, 0.1, 32)
    const material = new THREE.MeshBasicMaterial({ color: 0xFFD700 })
    const coin = new THREE.Mesh(geometry, material)
    
    scene.add(coin)
    camera.position.z = 5

    // Create renderer
    let renderer
    let canvas
    
    if (this.isCanvasAvailable) {
      // Create canvas for server-side rendering
      canvas = this.createCanvas(400, 400)
      renderer = new THREE.CanvasRenderer({
        canvas: canvas,
        alpha: true
      })
    } else {
      // Fallback: create a mock renderer
      renderer = {
        domElement: {
          toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        },
        render: () => {},
        setSize: () => {}
      }
    }

    renderer.setSize(400, 400)
    
    const sceneData = {
      scene,
      camera,
      coin,
      renderer,
      canvas
    }
    
    this.scenes.set(gameId, sceneData)
    return sceneData
  }

  renderFrame(gameId, rotation = 0) {
    const sceneData = this.createScene(gameId)
    const { scene, camera, coin, renderer } = sceneData

    // Rotate the coin
    coin.rotation.y = rotation

    // Render the scene
    renderer.render(scene, camera)

    if (this.isCanvasAvailable && renderer.domElement) {
      // Get canvas data
      const canvas = renderer.domElement
      const frameData = canvas.toDataURL('image/png')
      return frameData
    } else {
      // Return a placeholder image
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    }
  }

  cleanupScene(gameId) {
    if (this.scenes.has(gameId)) {
      const sceneData = this.scenes.get(gameId)
      
      // Dispose of Three.js resources
      if (sceneData.scene) {
        sceneData.scene.traverse((object) => {
          if (object.geometry) {
            object.geometry.dispose()
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose())
            } else {
              object.material.dispose()
            }
          }
        })
      }
      
      if (sceneData.renderer) {
        sceneData.renderer.dispose()
      }
      
      this.scenes.delete(gameId)
    }
  }

  // Generate a simple coin flip animation
  generateFlipAnimation(gameId, duration = 2000) {
    const frames = []
    const frameCount = 60 // 60fps for 2 seconds
    
    for (let i = 0; i < frameCount; i++) {
      const progress = i / frameCount
      const rotation = progress * Math.PI * 10 // 5 full rotations
      const frameData = this.renderFrame(gameId, rotation)
      frames.push(frameData)
    }
    
    return frames
  }
}

module.exports = CoinStreamService 