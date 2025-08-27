import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import * as THREE from 'three'
import { detectDevice } from '../../utils/deviceDetection'
import useWebSocket from '../../hooks/useWebSocket'

const CoinContainer = styled.div`
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  position: relative;
  perspective: 1000px;
`

const CSSCoin = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.1s linear;
  transform: rotateY(${props => props.$rotation}deg);
`

const CoinFace = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  backface-visibility: hidden;
  background-size: cover;
  background-position: center;
  box-shadow: 0 0 20px rgba(138, 43, 226, 0.5);
`

const HeadsFace = styled(CoinFace)`
  background-image: url(${props => props.$image});
  transform: rotateY(0deg);
`

const TailsFace = styled(CoinFace)`
  background-image: url(${props => props.$image});
  transform: rotateY(180deg);
`

const CanvasContainer = styled.canvas`
  width: 100%;
  height: 100%;
  border-radius: 50%;
`

export default function OptimizedCoinWrapper({
  size = 300,
  headsImage = '/coins/plainh.png',
  tailsImage = '/coins/plaint.png',
  isFlipping = false,
  result = null,
  serverControlled = false,
  gameId = null,
  isDisplay = false
}) {
  const { lastMessage } = useWebSocket()
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const coinRef = useRef(null)
  const frameRef = useRef(null)
  
  const [rotation, setRotation] = useState(0)
  const [useThreeJS, setUseThreeJS] = useState(false)
  const { isMobile, isLowPerformance } = detectDevice()
  
  // Initialize Three.js for desktop/high-performance devices
  useEffect(() => {
    if (!isDisplay && !isMobile && !isLowPerformance && !serverControlled) {
      setUseThreeJS(true)
      initThreeJS()
    } else {
      setUseThreeJS(false)
    }
    
    return () => {
      if (sceneRef.current) {
        cleanupThreeJS()
      }
    }
  }, [isMobile, isLowPerformance, serverControlled, isDisplay])
  
  // Handle server-controlled animation frames
  useEffect(() => {
    if (!serverControlled || !lastMessage) return
    
    const data = JSON.parse(lastMessage.data)
    
    if (data.type === 'coin_flip_frame' && data.gameId === gameId) {
      // Update rotation based on server frame
      setRotation(data.rotation)
      
      // If it's the last frame, show result
      if (data.result) {
        const finalRotation = data.result === 'heads' ? 0 : 180
        setTimeout(() => {
          setRotation(finalRotation)
        }, 100)
      }
    }
  }, [lastMessage, serverControlled, gameId])
  
  // Display coin animation (client-side only)
  useEffect(() => {
    if (!isDisplay) return
    
    const interval = setInterval(() => {
      setRotation(prev => (prev + 10) % 360)
    }, 50)
    
    return () => clearInterval(interval)
  }, [isDisplay])
  
  // Initialize Three.js scene
  const initThreeJS = () => {
    if (!containerRef.current) return
    
    // Scene setup
    const scene = new THREE.Scene()
    scene.background = null
    sceneRef.current = scene
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      1,
      0.1,
      1000
    )
    camera.position.z = 2.5
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })
    renderer.setSize(size, size)
    renderer.setClearColor(0x000000, 0)
    rendererRef.current = renderer
    
    if (containerRef.current) {
      containerRef.current.appendChild(renderer.domElement)
    }
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(1, 1, 0.5)
    scene.add(directionalLight)
    
    // Create coin geometry
    const geometry = new THREE.CylinderGeometry(1, 1, 0.1, 64)
    
    // Load textures
    const textureLoader = new THREE.TextureLoader()
    const headsTexture = textureLoader.load(headsImage)
    const tailsTexture = textureLoader.load(tailsImage)
    
    // Materials
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8, roughness: 0.2 }), // Edge
      new THREE.MeshStandardMaterial({ map: headsTexture }), // Top (heads)
      new THREE.MeshStandardMaterial({ map: tailsTexture }) // Bottom (tails)
    ]
    
    // Create coin mesh
    const coin = new THREE.Mesh(geometry, materials)
    coin.rotation.x = Math.PI / 2
    coinRef.current = coin
    scene.add(coin)
    
    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate)
      
      if (coinRef.current && !serverControlled && !isFlipping) {
        // Gentle rotation when idle
        coinRef.current.rotation.z += 0.01
      }
      
      renderer.render(scene, camera)
    }
    
    animate()
  }
  
  // Cleanup Three.js
  const cleanupThreeJS = () => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }
    
    if (rendererRef.current && containerRef.current) {
      containerRef.current.removeChild(rendererRef.current.domElement)
      rendererRef.current.dispose()
    }
    
    if (sceneRef.current) {
      sceneRef.current.traverse(object => {
        if (object.geometry) object.geometry.dispose()
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => mat.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
    }
  }
  
  // Three.js flip animation
  useEffect(() => {
    if (!useThreeJS || !coinRef.current || serverControlled) return
    
    if (isFlipping) {
      const duration = 3000
      const startTime = Date.now()
      const startRotation = coinRef.current.rotation.y
      
      const flip = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Easing function
        const eased = 1 - Math.pow(1 - progress, 3)
        
        // Multiple rotations
        coinRef.current.rotation.y = startRotation + (Math.PI * 8 * eased)
        
        if (progress < 1) {
          requestAnimationFrame(flip)
        } else {
          // Set final position based on result
          const finalRotation = result === 'heads' ? 0 : Math.PI
          coinRef.current.rotation.y = finalRotation
        }
      }
      
      flip()
    }
  }, [isFlipping, result, useThreeJS, serverControlled])
  
  // Render based on device and control mode
  if (useThreeJS && !serverControlled && !isDisplay) {
    return (
      <CoinContainer ref={containerRef} $size={size} />
    )
  } else {
    // CSS-based coin for mobile, server-controlled, or display
    return (
      <CoinContainer $size={size}>
        <CSSCoin $rotation={rotation}>
          <HeadsFace $image={headsImage} />
          <TailsFace $image={tailsImage} />
        </CSSCoin>
      </CoinContainer>
    )
  }
}
