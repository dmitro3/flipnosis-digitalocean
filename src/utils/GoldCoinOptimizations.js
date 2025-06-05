import * as THREE from 'three'

// Performance optimization utilities for the gold coin
export class GoldCoinOptimizations {
  constructor() {
    this.materials = new Map()
    this.geometries = new Map()
    this.textureCache = new Map()
  }

  // Shared material instances to reduce GPU calls
  getGoldMaterial(variant = 'default') {
    if (!this.materials.has(variant)) {
      const material = new THREE.MeshStandardMaterial({
        color: variant === 'heads' ? 0xFFD700 : variant === 'tails' ? 0xDAA520 : 0xFFD700,
        metalness: 1.0,
        roughness: variant === 'edge' ? 0.15 : 0.08,
        emissive: 0x332200,
        emissiveIntensity: 0.05,
      })
      this.materials.set(variant, material)
    }
    return this.materials.get(variant)
  }

  // Shared geometry instances
  getCoinGeometry(type, radius = 1.4, thickness = 0.12) {
    const key = `${type}_${radius}_${thickness}`
    if (!this.geometries.has(key)) {
      let geometry
      switch (type) {
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(radius, radius, thickness, 64)
          break
        case 'circle':
          geometry = new THREE.CircleGeometry(radius - 0.02, 64)
          break
        default:
          geometry = new THREE.SphereGeometry(0.02)
      }
      this.geometries.set(key, geometry)
    }
    return this.geometries.get(key)
  }

  // Efficient texture creation with caching
  createProceduralTexture(type, size = 512) {
    if (this.textureCache.has(type)) {
      return this.textureCache.get(type)
    }

    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    // Gold background
    ctx.fillStyle = '#FFD700'
    ctx.fillRect(0, 0, size, size)

    if (type === 'heads') {
      // Crown symbol for heads
      ctx.fillStyle = '#B8860B'
      ctx.font = `bold ${size * 0.25}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('♔', size / 2, size / 2)
    } else if (type === 'tails') {
      // Diamond symbol for tails
      ctx.fillStyle = '#B8860B'
      ctx.font = `bold ${size * 0.25}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('♦', size / 2, size / 2)
    }

    // Border design
    ctx.strokeStyle = '#B8860B'
    ctx.lineWidth = size * 0.015
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size * 0.47, 0, Math.PI * 2)
    ctx.stroke()

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    this.textureCache.set(type, texture)
    
    return texture
  }

  // Level of Detail system
  createLODCoin() {
    const lod = new THREE.LOD()

    // High detail (close up)
    const highDetail = this.createCoinMesh(64, true)
    lod.addLevel(highDetail, 0)

    // Medium detail (medium distance)
    const mediumDetail = this.createCoinMesh(32, true)
    lod.addLevel(mediumDetail, 50)

    // Low detail (far away)
    const lowDetail = this.createCoinMesh(16, false)
    lod.addLevel(lowDetail, 200)

    return lod
  }

  createCoinMesh(segments, includeTextures) {
    const coin = new THREE.Group()
    
    // Reuse geometries and materials
    const coinGeometry = new THREE.CylinderGeometry(1.4, 1.4, 0.12, segments)
    const goldMaterial = this.getGoldMaterial()
    
    const mainCoin = new THREE.Mesh(coinGeometry, goldMaterial)
    coin.add(mainCoin)

    if (includeTextures) {
      // Add faces only for higher LOD levels
      const headsGeometry = new THREE.CircleGeometry(1.38, segments)
      const tailsGeometry = new THREE.CircleGeometry(1.38, segments)
      
      const headsMaterial = goldMaterial.clone()
      const tailsMaterial = goldMaterial.clone()
      
      headsMaterial.map = this.createProceduralTexture('heads')
      tailsMaterial.map = this.createProceduralTexture('tails')
      
      const headsFace = new THREE.Mesh(headsGeometry, headsMaterial)
      headsFace.position.z = 0.061
      
      const tailsFace = new THREE.Mesh(tailsGeometry, tailsMaterial)
      tailsFace.position.z = -0.061
      tailsFace.rotation.x = Math.PI
      
      coin.add(headsFace, tailsFace)
    }

    return coin
  }

  // Efficient animation frame limiter
  createFrameLimiter(targetFPS = 60) {
    let lastTime = 0
    const interval = 1000 / targetFPS

    return (callback) => {
      return (currentTime) => {
        if (currentTime - lastTime >= interval) {
          callback(currentTime)
          lastTime = currentTime
        }
      }
    }
  }

  // Smart visibility culling
  shouldRender(camera, object, frustum = null) {
    if (!frustum) {
      frustum = new THREE.Frustum()
      const matrix = new THREE.Matrix4().multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      )
      frustum.setFromProjectionMatrix(matrix)
    }

    return frustum.intersectsObject(object)
  }

  // Memory management
  dispose() {
    // Dispose all cached materials
    this.materials.forEach(material => material.dispose())
    this.materials.clear()

    // Dispose all cached geometries
    this.geometries.forEach(geometry => geometry.dispose())
    this.geometries.clear()

    // Dispose all cached textures
    this.textureCache.forEach(texture => texture.dispose())
    this.textureCache.clear()
  }
}

// Singleton instance for reuse across components
export const goldCoinOptimizer = new GoldCoinOptimizations()

// Easing functions for smooth animations
export const EasingFunctions = {
  // Quartic ease-out for realistic coin settling
  quarticOut: (t) => 1 - Math.pow(1 - t, 4),
  
  // Cubic ease-in-out for smooth power charging
  cubicInOut: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  
  // Elastic ease-out for bouncy effects
  elasticOut: (t) => {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  },
  
  // Bounce ease-out for landing effects
  bounceOut: (t) => {
    const n1 = 7.5625
    const d1 = 2.75
    
    if (t < 1 / d1) {
      return n1 * t * t
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375
    }
  }
} 