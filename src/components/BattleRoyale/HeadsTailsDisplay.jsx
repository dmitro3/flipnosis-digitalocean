import React, { useState, useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import * as THREE from 'three'

const DisplayContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(15px);
  border: 3px solid #FF1493;
  border-radius: 1rem;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 20, 147, 0.1) 50%, transparent 70%);
    animation: shimmer 3s ease-in-out infinite;
    pointer-events: none;
    z-index: -1;
  }
  
  @keyframes shimmer {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }
`

const Title = styled.h2`
  margin: 0;
  color: #FF1493;
  font-size: 1.8rem;
  font-weight: bold;
  text-align: center;
  text-shadow: 0 0 10px rgba(255, 20, 147, 0.5);
`

const CoinContainer = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const ResultDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  
  .result-label {
    color: #00BFFF;
    font-size: 1.2rem;
    font-weight: bold;
  }
  
  .result-value {
    color: ${props => props.result === 'heads' ? '#FFD700' : '#FF1493'};
    font-size: 1.5rem;
    font-weight: bold;
    text-transform: uppercase;
    padding: 0.5rem 1rem;
    background: ${props => props.result === 'heads' 
      ? 'rgba(255, 215, 0, 0.1)' 
      : 'rgba(255, 20, 147, 0.1)'};
    border: 2px solid ${props => props.result === 'heads' 
      ? 'rgba(255, 215, 0, 0.3)' 
      : 'rgba(255, 20, 147, 0.3)'};
    border-radius: 0.5rem;
    animation: ${props => props.showing ? 'pulse 1s ease-in-out infinite' : 'none'};
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.05); }
  }
`

const TimerDisplay = styled.div`
  color: ${props => props.timeLeft <= 5 ? '#ff1493' : '#00BFFF'};
  font-size: 1.2rem;
  font-weight: bold;
  animation: ${props => props.timeLeft <= 5 ? 'pulse 0.5s ease-in-out infinite' : 'none'};
`

const HeadsTailsDisplay = ({ 
  gamePhase = 'waiting', 
  targetResult = null, 
  timeLeft = 20,
  isRevealing = false 
}) => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const coinRef = useRef(null)
  const animationIdRef = useRef(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showingResult, setShowingResult] = useState(false)

  // Initialize 3D scene for the display coin
  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    scene.background = null // Transparent background
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
    camera.position.set(0, 3, 8)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    })
    renderer.setSize(120, 120)
    renderer.setClearColor(0x000000, 0) // Transparent
    rendererRef.current = renderer

    mountRef.current.appendChild(renderer.domElement)

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    const spotLight = new THREE.SpotLight(0xffffff, 0.6)
    spotLight.position.set(0, 10, 5)
    spotLight.angle = Math.PI / 6
    spotLight.penumbra = 0.1
    scene.add(spotLight)

    // Create coin geometry and materials (similar to OptimizedGoldCoin)
    const geometry = new THREE.CylinderGeometry(3, 3, 0.4, 64)
    
    // Create materials
    const materials = [
      // Edge material
      new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF,
        metalness: 0.3,
        roughness: 0.2,
        emissive: 0x222222,
        emissiveIntensity: 0.1
      }),
      // Heads material
      new THREE.MeshStandardMaterial({ 
        color: 0xFFD700,
        metalness: 0.3,
        roughness: 0.2,
        emissive: 0x222222,
        emissiveIntensity: 0.1
      }),
      // Tails material
      new THREE.MeshStandardMaterial({ 
        color: 0xFF1493,
        metalness: 0.3,
        roughness: 0.2,
        emissive: 0x222222,
        emissiveIntensity: 0.1
      })
    ]

    const coin = new THREE.Mesh(geometry, materials)
    coin.scale.y = 1.5 // Make edge thicker
    coin.rotation.x = 0
    coin.rotation.y = Math.PI / 2 // Face forward like OptimizedGoldCoin
    coin.rotation.z = 0
    
    scene.add(coin)
    coinRef.current = coin

    // Animation loop
    const animate = () => {
      if (!coinRef.current || !rendererRef.current) return

      const time = Date.now() * 0.001
      const coin = coinRef.current

      if (isAnimating) {
        // Animation handled separately
      } else if (isRevealing) {
        // Revealing animation - rapid flipping
        coin.rotation.x += 0.3
        coin.position.y = Math.sin(time * 10) * 0.1
      } else {
        // Idle state - slow rotation
        coin.rotation.x += 0.005
        coin.position.y = 0
      }

      renderer.render(scene, camera)
      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      
      materials.forEach(mat => mat.dispose())
      geometry.dispose()
      renderer.dispose()
      
      if (mountRef.current && renderer.domElement) {
        try {
          mountRef.current.removeChild(renderer.domElement)
        } catch (e) {
          // Already removed
        }
      }
      
      sceneRef.current = null
      rendererRef.current = null
    }
  }, [])

  // Handle revealing animation
  useEffect(() => {
    if (isRevealing && targetResult && coinRef.current) {
      setIsAnimating(true)
      setShowingResult(false)
      
      const coin = coinRef.current
      const startTime = Date.now()
      const duration = 2000 // 2 seconds of rapid flipping
      
      const animateReveal = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Rapid flipping during reveal
        coin.rotation.x = progress * Math.PI * 8 // 4 full rotations
        
        if (progress < 1) {
          requestAnimationFrame(animateReveal)
        } else {
          // Land on the result
          const targetRotation = targetResult === 'heads' ? 0 : Math.PI
          coin.rotation.x = targetRotation
          setIsAnimating(false)
          setShowingResult(true)
        }
      }
      
      animateReveal()
    }
  }, [isRevealing, targetResult])

  return (
    <DisplayContainer>
      <Title>🎯 Target Side</Title>
      
      <CoinContainer>
        <div ref={mountRef} style={{ width: '120px', height: '120px' }} />
      </CoinContainer>
      
      {targetResult && (
        <ResultDisplay result={targetResult} showing={showingResult}>
          <span className="result-label">Winner:</span>
          <span className="result-value">
            {targetResult === 'heads' ? '🟡 HEADS' : '🔴 TAILS'}
          </span>
        </ResultDisplay>
      )}
      
      {gamePhase === 'charging_power' && (
        <TimerDisplay timeLeft={timeLeft}>
          ⏱️ {timeLeft}s to flip!
        </TimerDisplay>
      )}
    </DisplayContainer>
  )
}

export default HeadsTailsDisplay
