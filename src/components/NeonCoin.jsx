import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

const NeonCoin = ({ 
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
  const energyLinesRef = useRef([])
  const pulseRingRef = useRef(null)

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

    const coin = new THREE.Group()
    coin.scale.set(1.2, 1.2, 1.2)

    // Create wireframe cylinder for coin edge
    const coinGeometry = new THREE.CylinderGeometry(1.0, 1.0, 0.08, 32, 1, true)
    const wireframeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        charging: { value: 0 },
        glowColor: { value: new THREE.Color(0x00ff41) },
        pulseIntensity: { value: 1.0 }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec2 vUv;
        uniform float time;
        
        void main() {
          vPosition = position;
          vUv = uv;
          
          vec3 pos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float charging;
        uniform vec3 glowColor;
        uniform float pulseIntensity;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
          // Create wireframe effect
          vec2 grid = fract(vUv * vec2(32.0, 4.0));
          float wireframe = step(0.95, max(grid.x, grid.y)) + step(max(grid.x, grid.y), 0.05);
          
          // Pulsing effect
          float pulse = sin(time * 4.0) * 0.3 + 0.7;
          float chargePulse = charging > 0.5 ? sin(time * 12.0) * 0.5 + 0.5 : 0.0;
          
          // Energy flow effect
          float flow = sin(vUv.x * 20.0 - time * 8.0) * 0.5 + 0.5;
          
          vec3 finalColor = glowColor * (pulse + chargePulse * 0.8);
          finalColor += flow * vec3(1.0, 0.2, 0.8) * charging * 0.6;
          
          float alpha = wireframe * pulseIntensity * (0.8 + chargePulse * 0.4);
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    })

    const coinWireframe = new THREE.Mesh(coinGeometry, wireframeMaterial)
    coin.add(coinWireframe)

    // Create circular wireframe faces
    const createCircularWireframe = (radius, segments = 32) => {
      const geometry = new THREE.BufferGeometry()
      const vertices = []
      
      // Outer circle
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2
        vertices.push(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)
      }
      
      // Inner circles (concentric)
      for (let ring = 1; ring <= 3; ring++) {
        const ringRadius = radius * (0.7 - ring * 0.15)
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2
          vertices.push(Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius, 0)
        }
      }
      
      // Radial lines
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        vertices.push(0, 0, 0)
        vertices.push(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)
      }
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
      return geometry
    }

    // Heads face wireframe
    const headsWireframe = new THREE.LineSegments(
      createCircularWireframe(1.0),
      new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          charging: { value: 0 },
          isHeads: { value: 1.0 },
          glowColor: { value: new THREE.Color(0xff1493) }
        },
        vertexShader: `
          uniform float time;
          varying vec3 vPosition;
          
          void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform float charging;
          uniform float isHeads;
          uniform vec3 glowColor;
          varying vec3 vPosition;
          
          void main() {
            float pulse = sin(time * 3.0) * 0.3 + 0.7;
            float chargePulse = charging > 0.5 ? sin(time * 10.0) * 0.5 + 0.5 : 0.0;
            
            vec3 headsColor = vec3(1.0, 0.2, 0.6); // Pink for heads
            vec3 finalColor = mix(headsColor, glowColor, pulse * 0.5);
            finalColor += chargePulse * vec3(1.0, 0.8, 0.2) * 0.6;
            
            float alpha = (pulse + chargePulse * 0.4) * isHeads;
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true
      })
    )
    headsWireframe.position.z = 0.045
    coin.add(headsWireframe)

    // Tails face wireframe
    const tailsWireframe = new THREE.LineSegments(
      createCircularWireframe(1.0),
      new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          charging: { value: 0 },
          isTails: { value: 1.0 },
          glowColor: { value: new THREE.Color(0x00bfff) }
        },
        vertexShader: `
          uniform float time;
          varying vec3 vPosition;
          
          void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform float charging;
          uniform float isTails;
          uniform vec3 glowColor;
          varying vec3 vPosition;
          
          void main() {
            float pulse = sin(time * 3.0 + 1.57) * 0.3 + 0.7; // Offset pulse
            float chargePulse = charging > 0.5 ? sin(time * 10.0) * 0.5 + 0.5 : 0.0;
            
            vec3 tailsColor = vec3(0.2, 0.8, 1.0); // Blue for tails
            vec3 finalColor = mix(tailsColor, glowColor, pulse * 0.5);
            finalColor += chargePulse * vec3(1.0, 0.8, 0.2) * 0.6;
            
            float alpha = (pulse + chargePulse * 0.4) * isTails;
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true
      })
    )
    tailsWireframe.position.z = -0.045
    tailsWireframe.rotation.x = Math.PI
    coin.add(tailsWireframe)

    // Add text geometry for HEADS and TAILS
    const createTextOutline = (text) => {
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const context = canvas.getContext('2d')
      
      context.strokeStyle = '#ffffff'
      context.lineWidth = 3
      context.font = 'bold 40px Arial'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.strokeText(text, 128, 128)
      
      const texture = new THREE.CanvasTexture(canvas)
      return texture
    }

    // HEADS text
    const headsTextGeometry = new THREE.PlaneGeometry(0.8, 0.2)
    const headsTextMaterial = new THREE.MeshBasicMaterial({
      map: createTextOutline('HEADS'),
      transparent: true,
      opacity: 0.9
    })
    const headsText = new THREE.Mesh(headsTextGeometry, headsTextMaterial)
    headsText.position.z = 0.046
    coin.add(headsText)

    // TAILS text
    const tailsTextGeometry = new THREE.PlaneGeometry(0.8, 0.2)
    const tailsTextMaterial = new THREE.MeshBasicMaterial({
      map: createTextOutline('TAILS'),
      transparent: true,
      opacity: 0.9
    })
    const tailsText = new THREE.Mesh(tailsTextGeometry, tailsTextMaterial)
    tailsText.position.z = -0.046
    tailsText.rotation.x = Math.PI
    coin.add(tailsText)

    // Create energy flow lines around coin
    const createEnergyLine = (radius, offset = 0) => {
      const geometry = new THREE.BufferGeometry()
      const vertices = []
      const segments = 64
      
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2 + offset
        vertices.push(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          0
        )
      }
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
      return geometry
    }

    // Add multiple energy rings
    for (let i = 0; i < 3; i++) {
      const energyRing = new THREE.Line(
        createEnergyLine(1.3 + i * 0.15, i * 0.5),
        new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
            charging: { value: 0 },
            offset: { value: i * 0.3 }
          },
          vertexShader: `
            uniform float time;
            uniform float offset;
            varying float vAlpha;
            
            void main() {
              float wave = sin(position.x * 10.0 + position.y * 10.0 + time * 4.0 + offset);
              vAlpha = wave * 0.5 + 0.5;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float charging;
            varying float vAlpha;
            
            void main() {
              vec3 energyColor = mix(vec3(0.0, 1.0, 0.4), vec3(1.0, 0.2, 0.8), vAlpha);
              float alpha = vAlpha * charging * 0.6;
              gl_FragColor = vec4(energyColor, alpha);
            }
          `,
          transparent: true
        })
      )
      coin.add(energyRing)
      energyLinesRef.current.push(energyRing.material)
    }

    // Set initial rotation to face camera
    coin.rotation.x = Math.PI / 2
    coin.rotation.y = 0
    coin.rotation.z = 0

    scene.add(coin)
    coinRef.current = coin

    // Minimal lighting for neon effect
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3)
    scene.add(ambientLight)

    // Animation loop
    const animate = () => {
      if (!coinRef.current || !rendererRef.current) return

      const time = Date.now() * 0.001
      const coin = coinRef.current

      // Update all shader uniforms
      coin.traverse((child) => {
        if (child.material && child.material.uniforms) {
          if (child.material.uniforms.time) {
            child.material.uniforms.time.value = time
          }
          if (child.material.uniforms.charging) {
            child.material.uniforms.charging.value = isCharging ? 1.0 : 0.0
          }
        }
      })

      // Update energy lines
      energyLinesRef.current.forEach((material, index) => {
        material.uniforms.time.value = time
        material.uniforms.charging.value = isCharging ? 1.0 : 0.0
      })

      // Coin animations
      if (!isAnimatingRef.current) {
        if (isCharging) {
          // Pulsing and rotation when charging
          const pulse = Math.sin(time * 6) * 0.03 + 1.0
          coin.scale.set(pulse * 1.2, pulse * 1.2, pulse * 1.2)
          coin.rotation.z += 0.02
          coin.position.y = Math.sin(time * 8) * 0.02
        } else {
          // Gentle hover when waiting
          const isWaitingInRound = gamePhase === 'round_active' && !isPlayerTurn
          const isWaitingToStart = gamePhase === 'waiting' || gamePhase === 'ready'
          
          if (isWaitingInRound || isWaitingToStart) {
            coin.position.y = Math.sin(time * 2) * 0.05
            coin.rotation.z += 0.002
          } else {
            coin.position.y = 0
          }
          coin.scale.set(1.2, 1.2, 1.2)
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

    console.log('🎬 Starting neon coin flip:', { flipResult, flipDuration })
    
    isAnimatingRef.current = true
    const coin = coinRef.current
    const isHeads = flipResult === 'heads'
   
    coin.position.y = 0
    coin.rotation.z = 0
    coin.scale.set(1.2, 1.2, 1.2)
   
    const startTime = Date.now()
    const flips = Math.max(4, Math.floor(flipDuration / 800))
   
    const animateFlip = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / flipDuration, 1)
      
      // Smooth easing
      let easeProgress
      if (progress < 0.75) {
        easeProgress = progress / 0.75
      } else {
        const slowPhase = (progress - 0.75) / 0.25
        const slowEase = 1 - Math.pow(1 - slowPhase, 4)
        easeProgress = 0.75 + (slowEase * 0.25)
      }
      
      // Neon wireframe flip with energy trails
      const totalRotationX = flips * Math.PI * 2
      coin.rotation.x = Math.PI / 2 + (totalRotationX * easeProgress)
      coin.rotation.y = Math.sin(progress * Math.PI * flips * 0.4) * 0.3 * (1 - progress * 0.4)
      coin.rotation.z = Math.cos(progress * Math.PI * flips * 0.3) * 0.2 * (1 - progress * 0.3)
      
      // Height with neon trail effect
      coin.position.y = Math.sin(progress * Math.PI) * 0.5 * (1 - progress * 0.1)
      
      // Scale pulsing during flip
      const scale = 1.2 + Math.sin(progress * Math.PI * flips) * 0.1 * (1 - progress)
      coin.scale.set(scale, scale, scale)
      
      if (progress < 1) {
        requestAnimationFrame(animateFlip)
      } else {
        // Final position
        if (isHeads) {
          coin.rotation.x = Math.PI / 2
          coin.rotation.y = 0      
          coin.rotation.z = 0
        } else {
          coin.rotation.x = -Math.PI / 2
          coin.rotation.y = 0
          coin.rotation.z = 0
        }
        coin.position.y = 0
        coin.scale.set(1.2, 1.2, 1.2)
        isAnimatingRef.current = false
        console.log('✅ Neon coin flip complete:', flipResult)
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
        justifyContent: 'center',
        filter: isCharging ? 'drop-shadow(0 0 20px #ff1493)' : 'drop-shadow(0 0 10px #00ff41)'
      }}
    />
  )
}

export default NeonCoin 