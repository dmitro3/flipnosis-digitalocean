import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

const HologramCoin = ({ 
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
  const materialRef = useRef(null)
  const glowRingRef = useRef(null)

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

    // Create hologram coin
    const coinGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 32)
    
    // Hologram material with animated properties
    const hologramMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        charging: { value: 0 },
        isHeads: { value: 1 },
        opacity: { value: 0.8 },
        glowColor: { value: new THREE.Color(0x00ff41) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          vUv = uv;
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float charging;
        uniform float isHeads;
        uniform float opacity;
        uniform vec3 glowColor;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        // Noise function
        float noise(vec2 uv) {
          return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        // Energy wave pattern
        float energyWave(vec2 uv, float time) {
          float dist = length(uv - 0.5);
          float wave = sin(dist * 20.0 - time * 8.0) * 0.5 + 0.5;
          return wave * (1.0 - smoothstep(0.3, 0.5, dist));
        }
        
        // Circuit pattern
        float circuitPattern(vec2 uv) {
          vec2 grid = fract(uv * 10.0);
          float lines = step(0.9, max(grid.x, grid.y)) * step(0.1, min(grid.x, grid.y));
          return lines;
        }
        
        void main() {
          vec2 centeredUv = vUv - 0.5;
          float dist = length(centeredUv);
          
          // Base hologram effect
          vec3 baseColor = isHeads > 0.5 ? vec3(1.0, 0.2, 0.6) : vec3(0.2, 0.8, 1.0);
          
          // Energy waves
          float waves = energyWave(vUv, time);
          
          // Circuit lines
          float circuits = circuitPattern(vUv + time * 0.1);
          
          // Pulsing energy rings
          float rings = 0.0;
          for(int i = 0; i < 3; i++) {
            float ringDist = abs(dist - (0.1 + float(i) * 0.15 + sin(time * 2.0 + float(i)) * 0.05));
            rings += (1.0 - smoothstep(0.0, 0.02, ringDist)) * (0.8 - float(i) * 0.2);
          }
          
          // Digital artifact effect
          float artifacts = noise(vUv + time) * 0.3;
          
          // Combine effects
          vec3 finalColor = baseColor;
          finalColor += waves * glowColor * 0.5;
          finalColor += circuits * vec3(0.0, 1.0, 0.5) * 0.7;
          finalColor += rings * vec3(1.0, 1.0, 1.0);
          finalColor += artifacts * vec3(0.2, 0.8, 1.0);
          
          // Charging effect
          if(charging > 0.5) {
            finalColor += sin(time * 10.0) * vec3(1.0, 0.0, 0.5) * 0.3;
          }
          
          // Edge glow
          float edgeGlow = 1.0 - smoothstep(0.4, 0.5, dist);
          finalColor += edgeGlow * glowColor * 0.8;
          
          // Face determination (heads or tails symbol)
          if(abs(vPosition.z) > 0.04) {
            if(isHeads > 0.5) {
              // Crown pattern for heads
              float crownPattern = step(0.3, sin(atan(centeredUv.y, centeredUv.x) * 6.0 + time));
              finalColor += crownPattern * vec3(1.0, 0.8, 0.0) * 0.8;
            } else {
              // Diamond pattern for tails
              float diamondPattern = step(0.3, abs(sin(centeredUv.x * 8.0 + time)) + abs(sin(centeredUv.y * 8.0 + time)));
              finalColor += diamondPattern * vec3(0.0, 0.8, 1.0) * 0.8;
            }
          }
          
          gl_FragColor = vec4(finalColor, opacity * (1.0 - smoothstep(0.45, 0.5, dist)));
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    })

    materialRef.current = hologramMaterial

    const coin = new THREE.Group()
    coin.scale.set(1.0, 1.0, 1.0)

    const coinMesh = new THREE.Mesh(coinGeometry, hologramMaterial)
    coin.add(coinMesh)

    // Add outer glow ring
    const ringGeometry = new THREE.RingGeometry(1.4, 1.6, 32)
    const ringMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        charging: { value: 0 },
        opacity: { value: 0.3 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float charging;
        uniform float opacity;
        varying vec2 vUv;
        
        void main() {
          vec2 center = vec2(0.5);
          float dist = length(vUv - center);
          float pulse = sin(time * 4.0) * 0.5 + 0.5;
          
          vec3 color = mix(vec3(0.0, 1.0, 0.4), vec3(1.0, 0.2, 0.8), charging);
          float alpha = opacity * pulse * (1.0 - smoothstep(0.0, 0.5, dist));
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    })

    const glowRing = new THREE.Mesh(ringGeometry, ringMaterial)
    glowRing.rotation.x = Math.PI / 2
    coin.add(glowRing)
    glowRingRef.current = ringMaterial

    scene.add(coin)
    coinRef.current = coin

    // Ambient lighting for hologram effect
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)

    // Directional light with color
    const directionalLight = new THREE.DirectionalLight(0x00ff41, 1.0)
    directionalLight.position.set(2, 2, 5)
    scene.add(directionalLight)

    // Animation loop
    const animate = () => {
      if (!coinRef.current || !rendererRef.current || !materialRef.current) return

      const time = Date.now() * 0.001
      const coin = coinRef.current

      // Update shader uniforms
      materialRef.current.uniforms.time.value = time
      materialRef.current.uniforms.charging.value = isCharging ? 1.0 : 0.0
      
      if (glowRingRef.current) {
        glowRingRef.current.uniforms.time.value = time
        glowRingRef.current.uniforms.charging.value = isCharging ? 1.0 : 0.0
      }

      // Gentle hover when waiting
      if (!isAnimatingRef.current) {
        const isWaitingInRound = gamePhase === 'round_active' && !isPlayerTurn
        const isWaitingToStart = gamePhase === 'waiting' || gamePhase === 'ready'
        
        if (isWaitingInRound || isWaitingToStart) {
          coin.position.y = Math.sin(time * 2) * 0.1
          coin.rotation.y += 0.005
        } else if (isCharging) {
          coin.position.y = Math.sin(time * 8) * 0.05
          coin.rotation.y += 0.02
        } else {
          coin.position.y = 0
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

    console.log('🎬 Starting hologram flip animation:', { flipResult, flipDuration })
    
    isAnimatingRef.current = true
    const coin = coinRef.current
    const isHeads = flipResult === 'heads'
   
    // Update material for result
    if (materialRef.current) {
      materialRef.current.uniforms.isHeads.value = isHeads ? 1.0 : 0.0
    }

    coin.position.y = 0
    coin.rotation.z = 0
   
    const startTime = Date.now()
    const flips = Math.max(6, Math.floor(flipDuration / 600))
   
    const animateFlip = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / flipDuration, 1)
      
      // Smooth easing with dramatic slowdown
      let easeProgress
      if (progress < 0.7) {
        easeProgress = progress / 0.7
      } else {
        const slowPhase = (progress - 0.7) / 0.3
        const slowEase = 1 - Math.pow(1 - slowPhase, 4)
        easeProgress = 0.7 + (slowEase * 0.3)
      }
      
      // Multi-axis hologram flip with energy effects
      const totalRotationX = flips * Math.PI * 2
      coin.rotation.x = totalRotationX * easeProgress
      coin.rotation.y = Math.sin(progress * Math.PI * flips * 0.5) * 0.4 * (1 - progress * 0.3)
      coin.rotation.z = Math.cos(progress * Math.PI * flips * 0.3) * 0.3 * (1 - progress * 0.4)
      
      // Dramatic height with energy trail effect
      coin.position.y = Math.sin(progress * Math.PI) * 0.8 * (1 - progress * 0.2)
      
      // Scale pulsing during flip
      const scale = 1.0 + Math.sin(progress * Math.PI * flips) * 0.1 * (1 - progress)
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
        console.log('✅ Hologram flip animation complete:', flipResult)
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
        background: isCharging ? 
          'radial-gradient(circle, rgba(255, 20, 147, 0.2) 0%, rgba(0, 255, 65, 0.1) 50%, transparent 100%)' : 
          'radial-gradient(circle, rgba(0, 255, 65, 0.05) 0%, transparent 70%)',
        boxShadow: isCharging ? 
          '0 0 40px rgba(255, 20, 147, 0.6), 0 0 80px rgba(0, 255, 65, 0.4)' : 
          '0 0 20px rgba(0, 255, 65, 0.3)',
        borderRadius: '50%',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: isPlayerTurn ? '2px solid rgba(0, 255, 65, 0.8)' : '1px solid rgba(0, 255, 65, 0.3)'
      }}
    />
  )
}

export default HologramCoin 