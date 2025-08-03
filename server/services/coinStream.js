const THREE = require('three')
const { createCanvas } = require('canvas')
const crypto = require('crypto')

class CoinStreamService {
  constructor() {
    this.scenes = new Map() // Store scenes per game
    this.renderers = new Map() // Store renderers per game
    this.animations = new Map() // Store animation states per game
    this.textures = new Map() // Cache textures
  }

  // Initialize a new coin scene for a game
  initializeGameScene(gameId, coinData = {}) {
    console.log('🎲 Initializing coin scene for game:', gameId)
    
    // Create canvas for server-side rendering
    const canvas = createCanvas(400, 400)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, 1, 1, 10)
    camera.position.set(0, 0, 7)

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvas,
      antialias: true,
      alpha: true
    })
    renderer.setSize(400, 400)
    renderer.setClearColor(0x000000, 0)

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xFFFFFF, 4.0)
    mainLight.position.set(0, 0, 10)
    scene.add(mainLight)

    const topLight = new THREE.DirectionalLight(0xFFE4B5, 3.0)
    topLight.position.set(0, 5, 5)
    scene.add(topLight)

    const leftLight = new THREE.DirectionalLight(0xFFE4B5, 2.5)
    leftLight.position.set(-5, 2, 5)
    scene.add(leftLight)

    const rightLight = new THREE.DirectionalLight(0xFFE4B5, 2.5)
    rightLight.position.set(5, 2, 5)
    scene.add(rightLight)

    const bottomLight = new THREE.DirectionalLight(0xFFFFFF, 2.0)
    bottomLight.position.set(0, -3, 5)
    scene.add(bottomLight)

    // Create coin geometry and materials
    const coinGeometry = new THREE.CylinderGeometry(2, 2, 0.2, 32)
    
    // Create textures
    const textureHeads = this.createGoldTexture('heads', coinData.headsImage)
    const textureTails = this.createGoldTexture('tails', coinData.tailsImage)
    const textureEdge = this.createGoldTexture('edge')

    // Set up edge texture to repeat
    textureEdge.wrapS = THREE.RepeatWrapping
    textureEdge.repeat.set(20, 1)

    // Create materials
    const materials = [
      new THREE.MeshStandardMaterial({ 
        map: textureHeads, 
        metalness: 0.6, 
        roughness: 0.1 
      }), // Top (heads)
      new THREE.MeshStandardMaterial({ 
        map: textureTails, 
        metalness: 0.6, 
        roughness: 0.1 
      }), // Bottom (tails)
      new THREE.MeshStandardMaterial({ 
        map: textureEdge, 
        metalness: 0.8, 
        roughness: 0.2 
      }) // Edge
    ]

    const coin = new THREE.Mesh(coinGeometry, materials)
    scene.add(coin)

    // Store scene data
    this.scenes.set(gameId, { scene, camera, coin, renderer, canvas })
    this.animations.set(gameId, { isAnimating: false, startTime: 0, duration: 0 })

    console.log('✅ Coin scene initialized for game:', gameId)
    return { scene, camera, coin, renderer, canvas }
  }

  // Create procedural gold textures (same as client-side)
  createGoldTexture(type, customImage = null) {
    const cacheKey = `${type}-${customImage || 'default'}`
    
    if (this.textures.has(cacheKey)) {
      return this.textures.get(cacheKey)
    }

    const canvas = createCanvas(512, 512)
    const ctx = canvas.getContext('2d')

    if (customImage) {
      // Load custom image if provided
      // This would need to be implemented based on your image loading strategy
      console.log('🖼️ Custom texture requested:', customImage)
    }

    if (type === 'heads') {
      // Gold gradient background
      const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
      gradient.addColorStop(0, '#FFEF94')
      gradient.addColorStop(0.5, '#FFD700')
      gradient.addColorStop(0.8, '#DAA520')
      gradient.addColorStop(1, '#B8860B')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 512, 512)
      
      // Crown symbol
      ctx.fillStyle = '#8B4513'
      ctx.font = 'bold 102px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('♔', 256, 230)
      
      // "HEADS" text
      ctx.fillStyle = '#654321'
      ctx.font = 'bold 92px Hyperwave'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('HEADS', 256, 330)
      
      // Decorative border
      ctx.strokeStyle = '#8B7D6B'
      ctx.lineWidth = 13
      ctx.beginPath()
      ctx.arc(256, 256, 215, 0, Math.PI * 2)
      ctx.stroke()
      
    } else if (type === 'tails') {
      // Gold gradient background
      const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
      gradient.addColorStop(0, '#FFEF94')
      gradient.addColorStop(0.5, '#FFD700')
      gradient.addColorStop(0.8, '#DAA520')
      gradient.addColorStop(1, '#B8860B')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 512, 512)
      
      // Diamond symbol
      ctx.fillStyle = '#8B4513'
      ctx.font = 'bold 102px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('♦', 256, 230)
      
      // "TAILS" text
      ctx.fillStyle = '#654321'
      ctx.font = 'bold 92px Hyperwave'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('TAILS', 256, 330)
      
      // Decorative border
      ctx.strokeStyle = '#8B7D6B'
      ctx.lineWidth = 13
      ctx.beginPath()
      ctx.arc(256, 256, 215, 0, Math.PI * 2)
      ctx.stroke()
      
    } else if (type === 'edge') {
      // Edge pattern
      ctx.fillStyle = '#FFEF94'
      ctx.fillRect(0, 0, 512, 512)
      
      // Vertical lines pattern (reeding)
      ctx.strokeStyle = '#B8860B'
      ctx.lineWidth = 3
      for (let i = 0; i < 512; i += 8) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, 512)
        ctx.stroke()
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    
    this.textures.set(cacheKey, texture)
    return texture
  }

  // Start a coin flip animation
  startFlipAnimation(gameId, flipResult, creatorPower, joinerPower, duration = 3000) {
    const gameScene = this.scenes.get(gameId)
    if (!gameScene) {
      console.error('❌ No scene found for game:', gameId)
      return false
    }

    const { coin } = gameScene
    const animation = this.animations.get(gameId)
    
    if (animation.isAnimating) {
      console.log('⚠️ Animation already in progress for game:', gameId)
      return false
    }

    console.log('🎲 Starting server-side flip animation:', {
      gameId,
      flipResult,
      creatorPower,
      joinerPower,
      duration
    })

    // Calculate power-based rotations
    const totalPower = creatorPower + joinerPower
    const powerRatio = Math.min(totalPower / 10, 1)
    
    // Base spins determined by power (5 to 30 full rotations)
    const minSpins = 5
    const maxSpins = 30
    const baseSpins = minSpins + Math.floor(powerRatio * (maxSpins - minSpins))
    
    // Calculate target rotation for the result
    const targetRotation = flipResult === 'heads' ? -Math.PI / 2 : Math.PI / 2
    
    // Calculate total rotation needed
    const totalRotation = baseSpins * Math.PI * 2 + targetRotation

    // Set animation state
    animation.isAnimating = true
    animation.startTime = Date.now()
    animation.duration = duration
    animation.totalRotation = totalRotation
    animation.startRotation = coin.rotation.x
    animation.targetRotation = targetRotation

    this.animations.set(gameId, animation)

    // Start animation loop
    this.animateFlip(gameId)

    return true
  }

  // Animation loop for coin flip
  animateFlip(gameId) {
    const gameScene = this.scenes.get(gameId)
    const animation = this.animations.get(gameId)
    
    if (!gameScene || !animation || !animation.isAnimating) {
      return
    }

    const { coin, renderer, scene, camera } = gameScene
    const elapsed = Date.now() - animation.startTime
    const progress = Math.min(elapsed / animation.duration, 1)

    // Easing function for smooth animation
    const easeOut = (t) => 1 - Math.pow(1 - t, 3)

    const easedProgress = easeOut(progress)
    const currentRotation = animation.startRotation + (animation.totalRotation * easedProgress)

    // Apply rotation
    coin.rotation.x = currentRotation

    // Add some wobble during the flip
    if (progress < 0.8) {
      coin.rotation.z = Math.sin(progress * Math.PI * 20) * 0.1
      coin.position.y = Math.sin(progress * Math.PI * 10) * 0.5
    } else {
      // Settle into final position
      coin.rotation.z = 0
      coin.position.y = 0
    }

    // Render the frame
    renderer.render(scene, camera)

    // Continue animation or finish
    if (progress < 1) {
      setTimeout(() => this.animateFlip(gameId), 16) // ~60 FPS
    } else {
      // Animation complete
      animation.isAnimating = false
      this.animations.set(gameId, animation)
      
      console.log('✅ Flip animation completed for game:', gameId)
      
      // Emit completion event
      this.emit('flipComplete', {
        gameId,
        result: animation.targetRotation === -Math.PI / 2 ? 'heads' : 'tails'
      })
    }
  }

  // Get current frame as base64 image
  getCurrentFrame(gameId) {
    const gameScene = this.scenes.get(gameId)
    if (!gameScene) {
      return null
    }

    const { renderer, scene, camera } = gameScene
    
    // Render current state
    renderer.render(scene, camera)
    
    // Get canvas data
    const canvas = renderer.domElement
    return canvas.toDataURL('image/png')
  }

  // Stream animation frames to clients
  streamAnimation(gameId, wsServer, roomId) {
    const gameScene = this.scenes.get(gameId)
    const animation = this.animations.get(gameId)
    
    if (!gameScene || !animation || !animation.isAnimating) {
      return
    }

    // Get current frame
    const frameData = this.getCurrentFrame(gameId)
    if (!frameData) {
      return
    }

    // Broadcast frame to all players in the room
    const message = {
      type: 'COIN_FRAME',
      gameId,
      frameData,
      timestamp: Date.now()
    }

    // Broadcast to room (this would need to be implemented based on your WebSocket setup)
    if (wsServer && wsServer.broadcastToRoom) {
      wsServer.broadcastToRoom(roomId, message)
    }

    // Continue streaming if animation is still active
    if (animation.isAnimating) {
      setTimeout(() => this.streamAnimation(gameId, wsServer, roomId), 50) // 20 FPS for streaming
    }
  }

  // Clean up game resources
  cleanupGame(gameId) {
    console.log('🧹 Cleaning up coin scene for game:', gameId)
    
    const gameScene = this.scenes.get(gameId)
    if (gameScene) {
      const { renderer, scene } = gameScene
      
      // Dispose of Three.js resources
      scene.traverse((object) => {
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
      
      renderer.dispose()
    }

    this.scenes.delete(gameId)
    this.renderers.delete(gameId)
    this.animations.delete(gameId)
    
    console.log('✅ Cleanup completed for game:', gameId)
  }

  // Get animation status
  getAnimationStatus(gameId) {
    const animation = this.animations.get(gameId)
    return animation ? {
      isAnimating: animation.isAnimating,
      progress: animation.isAnimating ? 
        Math.min((Date.now() - animation.startTime) / animation.duration, 1) : 0
    } : null
  }
}

module.exports = CoinStreamService 