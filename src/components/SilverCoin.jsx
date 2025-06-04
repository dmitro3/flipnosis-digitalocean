import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

const SilverCoin = ({ 
  isFlipping, 
  flipResult, 
  flipDuration = 3000,
  onPowerCharge, 
  onPowerRelease,
  isPlayerTurn,
  isCharging = false,
  chargingPlayer,
  gamePhase
}) => {
  const mountRef = useRef(null)
  const coinRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const animationIdRef = useRef(null)
  const isAnimatingRef = useRef(false)
  const particlesRef = useRef(null)
  const glowRef = useRef(null)

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.set(0, 0, 4)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(280, 280)
    renderer.setClearColor(0x000000, 0)

    sceneRef.current = scene
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    // Create silver coin
    const coinGeometry = new THREE.CylinderGeometry(1.3, 1.3, 0.12, 64)
    
    // Silver material with realistic metallic properties
    const silverMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xc0c0c0,
      metalness: 0.9,
      roughness: 0.1,
      reflectivity: 0.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    })

    const coin = new THREE.Group()
    coin.scale.set(1.0, 1.0, 1.0)

    // Main coin body
    const coinMesh = new THREE.Mesh(coinGeometry, silverMaterial)
    coin.add(coinMesh)

    // Create text textures
    const createTextTexture = (text, color = '#000000') => {
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const context = canvas.getContext('2d')
      
      // Clear canvas
      context.fillStyle = 'transparent'
      context.fillRect(0, 0, 512, 512)
      
      // Draw text
      context.fillStyle = color
      context.font = 'bold 80px Arial'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(text, 256, 256)
      
      // Add subtle border for definition
      context.strokeStyle = '#333333'
      context.lineWidth = 2
      context.strokeText(text, 256, 256)
      
      const texture = new THREE.CanvasTexture(canvas)
      texture.needsUpdate = true
      return texture
    }

    // Heads face (front)
    const headsTexture = createTextTexture('HEADS')
    const headsMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xc0c0c0,
      metalness: 0.9,
      roughness: 0.1,
      map: headsTexture,
      transparent: true
    })
    
    const headsGeometry = new THREE.CircleGeometry(1.3, 64)
    const headsFace = new THREE.Mesh(headsGeometry, headsMaterial)
    headsFace.position.z = 0.061
    headsFace.rotation.x = 0
    coin.add(headsFace)

    // Tails face (back)
    const tailsTexture = createTextTexture('TAILS')
    const tailsMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xc0c0c0,
      metalness: 0.9,
      roughness: 0.1,
      map: tailsTexture,
      transparent: true
    })
    
    const tailsGeometry = new THREE.CircleGeometry(1.3, 64)
    const tailsFace = new THREE.Mesh(tailsGeometry, tailsMaterial)
    tailsFace.position.z = -0.061
    tailsFace.rotation.x = Math.PI
    coin.add(tailsFace)

    // Edge/rim of coin
    const rimGeometry = new THREE.CylinderGeometry(1.31, 1.31, 0.12, 64)
    const rimMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xa0a0a0,
      metalness: 1.0,
      roughness: 0.3
    })
    const rim = new THREE.Mesh(rimGeometry, rimMaterial)
    coin.add(rim)

    scene.add(coin)
    coinRef.current = coin

    // Create charging glow effect
    const glowGeometry = new THREE.SphereGeometry(1.6, 32, 32)
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        intensity: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float intensity;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          float pulse = sin(time * 8.0) * 0.5 + 0.5;
          
          vec3 glowColor = mix(vec3(1.0, 0.2, 0.8), vec3(1.0, 0.8, 0.2), pulse);
          float alpha = fresnel * intensity * pulse * 0.6;
          
          gl_FragColor = vec4(glowColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.BackSide
    })
    
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial)
    glowSphere.visible = false
    scene.add(glowSphere)
    glowRef.current = { mesh: glowSphere, material: glowMaterial }

    // Create spark particles
    const particleCount = 50
    const particleGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)
    const lifetimes = new Float32Array(particleCount)
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0
      velocities[i * 3] = (Math.random() - 0.5) * 2
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 2
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2
      lifetimes[i] = Math.random()
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    particleGeometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1))
    
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        intensity: { value: 0 }
      },
      vertexShader: `
        attribute vec3 velocity;
        attribute float lifetime;
        uniform float time;
        uniform float intensity;
        varying float vAlpha;
        
        void main() {
          float life = mod(lifetime + time * 2.0, 1.0);
          vec3 pos = position;
          
          // Emit from coin edge
          float angle = lifetime * 6.28318;
          pos.x += cos(angle) * 1.4;
          pos.y += sin(angle) * 1.4;
          
          // Move particles outward
          pos += velocity * life * intensity;
          
          vAlpha = (1.0 - life) * intensity;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = mix(3.0, 1.0, life) * intensity;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          vec3 sparkColor = mix(vec3(1.0, 0.8, 0.2), vec3(1.0, 0.2, 0.8), gl_PointCoord.x);
          float alpha = (1.0 - dist * 2.0) * vAlpha;
          
          gl_FragColor = vec4(sparkColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    })
    
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    particles.visible = false
    scene.add(particles)
    particlesRef.current = { mesh: particles, material: particleMaterial }

    // Enhanced lighting for metallic coin
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    scene.add(ambientLight)

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0)
    directionalLight1.position.set(2, 2, 5)
    scene.add(directionalLight1)

    const directionalLight2 = new THREE.DirectionalLight(0x00ff41, 0.3)
    directionalLight2.position.set(-2, -1, 3)
    scene.add(directionalLight2)

    // Animation loop
    const animate = () => {
      if (!coinRef.current || !rendererRef.current) return

      const time = Date.now() * 0.001
      const coin = coinRef.current

      // Update glow and particles
      if (glowRef.current) {
        glowRef.current.material.uniforms.time.value = time
        glowRef.current.material.uniforms.intensity.value = isCharging ? 1.0 : 0.0
        glowRef.current.mesh.visible = isCharging
        glowRef.current.mesh.position.copy(coin.position)
        glowRef.current.mesh.rotation.copy(coin.rotation)
      }

      if (particlesRef.current) {
        particlesRef.current.material.uniforms.time.value = time
        particlesRef.current.material.uniforms.intensity.value = isCharging ? 1.0 : 0.0
        particlesRef.current.mesh.visible = isCharging
        particlesRef.current.mesh.position.copy(coin.position)
      }

      // Coin animations
      if (!isAnimatingRef.current) {
        if (isCharging) {
          // Pulsing and slight rotation when charging
          const pulse = Math.sin(time * 6) * 0.05 + 1.0
          coin.scale.set(pulse, pulse, pulse)
          coin.rotation.y += 0.01
          coin.position.y = Math.sin(time * 4) * 0.03
        } else {
          // Gentle hover when waiting
          const isWaitingInRound = gamePhase === 'round_active' && !isPlayerTurn
          const isWaitingToStart = gamePhase === 'waiting' || gamePhase === 'ready'
          
          if (isWaitingInRound || isWaitingToStart) {
            coin.position.y = Math.sin(time * 2) * 0.08
            coin.rotation.y += 0.003
          } else {
            coin.position.y = 0
          }
          coin.scale.set(1, 1, 1)
        }
      }

      rendererRef.current.render(scene, camera)
      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      sceneRef.current = null
      rendererRef.current = null
    }
  }, [])

  // Handle flip animation
  useEffect(() => {
    if (!isFlipping || !flipResult || !flipDuration || !coinRef.current || isAnimatingRef.current) {
      return
    }

    console.log('🎬 Starting silver coin flip:', { flipResult, flipDuration })
    
    isAnimatingRef.current = true
    const coin = coinRef.current
    const isHeads = flipResult === 'heads'
   
    coin.position.y = 0
    coin.rotation.z = 0
    coin.scale.set(1, 1, 1)
   
    const startTime = Date.now()
    const flips = Math.max(5, Math.floor(flipDuration / 700))
   
    const animateFlip = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / flipDuration, 1)
      
      // Smooth easing with dramatic slowdown
      let easeProgress
      if (progress < 0.8) {
        easeProgress = progress / 0.8
      } else {
        const slowPhase = (progress - 0.8) / 0.2
        const slowEase = 1 - Math.pow(1 - slowPhase, 5)
        easeProgress = 0.8 + (slowEase * 0.2)
      }
      
      // Realistic coin flip physics
      const totalRotationX = flips * Math.PI * 2
      coin.rotation.x = totalRotationX * easeProgress
      
      // Slight wobble during flip
      coin.rotation.y = Math.sin(progress * Math.PI * flips * 0.3) * 0.2 * (1 - progress * 0.5)
      coin.rotation.z = Math.cos(progress * Math.PI * flips * 0.2) * 0.1 * (1 - progress * 0.5)
      
      // Arc trajectory
      coin.position.y = Math.sin(progress * Math.PI) * 0.6 * (1 - progress * 0.1)
      
      // Slight scale change during peak
      const scale = 1.0 + Math.sin(progress * Math.PI) * 0.05
      coin.scale.set(scale, scale, scale)
      
      if (progress < 1) {
        requestAnimationFrame(animateFlip)
      } else {
        // Final position
        if (isHeads) {
          coin.rotation.x = 0
          coin.rotation.y = 0      
          coin.rotation.z = 0
        } else {
          coin.rotation.x = Math.PI
          coin.rotation.y = 0
          coin.rotation.z = 0
        }
        coin.position.y = 0
        coin.scale.set(1, 1, 1)
        isAnimatingRef.current = false
        console.log('✅ Silver coin flip complete:', flipResult)
      }
    }
   
    animateFlip()
  }, [isFlipping, flipResult, flipDuration])

  return (
    <div
      ref={mountRef}
      onMouseDown={isPlayerTurn ? onPowerCharge : undefined}
      onMouseUp={isPlayerTurn ? onPowerRelease : undefined}
      onMouseLeave={isPlayerTurn ? onPowerRelease : undefined}
      onTouchStart={isPlayerTurn ? onPowerCharge : undefined}
      onTouchEnd={isPlayerTurn ? onPowerRelease : undefined}
      style={{
        width: '280px',
        height: '280px',
        cursor: isPlayerTurn ? 'pointer' : 'default',
        userSelect: 'none',
        background: 'transparent',
        borderRadius: '50%',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    />
  )
}

export default SilverCoin 