import React, { useState, useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import * as THREE from 'three'

const LobbyCoinContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
`

const Canvas = styled.canvas`
  border-radius: 50%;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
`

const LobbyCoin = ({ 
  customHeadsImage = '/coins/plainh.png', 
  customTailsImage = '/coins/plaint.png',
  size = 200 
}) => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const coinRef = useRef(null)
  const animationIdRef = useRef(null)
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipResult, setFlipResult] = useState(null)

  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.z = 5

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      canvas: mountRef.current, 
      alpha: true,
      antialias: true 
    })
    renderer.setSize(size, size)
    renderer.setClearColor(0x000000, 0)
    rendererRef.current = renderer

    // Create coin geometry
    const geometry = new THREE.CylinderGeometry(2, 2, 0.2, 32)
    
    // Load textures
    const textureLoader = new THREE.TextureLoader()
    const headsTexture = textureLoader.load(customHeadsImage)
    const tailsTexture = textureLoader.load(customTailsImage)
    
    // Create materials
    const headsMaterial = new THREE.MeshBasicMaterial({ 
      map: headsTexture,
      transparent: true
    })
    const tailsMaterial = new THREE.MeshBasicMaterial({ 
      map: tailsTexture,
      transparent: true
    })

    // Create coin mesh
    const coin = new THREE.Mesh(geometry, headsMaterial)
    coin.rotation.x = Math.PI / 2
    scene.add(coin)
    coinRef.current = coin

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      
      if (!isFlipping) {
        // Gentle floating animation
        coin.rotation.y += 0.01
        coin.position.y = Math.sin(Date.now() * 0.001) * 0.1
      } else {
        // Fast flip animation
        coin.rotation.y += 0.3
        coin.rotation.x += 0.2
        
        // Switch material halfway through flip
        if (coin.rotation.y > Math.PI && coin.material === headsMaterial) {
          coin.material = tailsMaterial
        } else if (coin.rotation.y > Math.PI * 2 && coin.material === tailsMaterial) {
          coin.material = headsMaterial
        }
      }
      
      renderer.render(scene, camera)
    }
    
    animate()

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      if (renderer) {
        renderer.dispose()
      }
    }
  }, [customHeadsImage, customTailsImage, size])

  const handleClick = () => {
    if (isFlipping) return
    
    setIsFlipping(true)
    setFlipResult(null)
    
    // Simple flip animation
    setTimeout(() => {
      const result = Math.random() < 0.5 ? 'heads' : 'tails'
      setFlipResult(result)
      
      // Reset after showing result
      setTimeout(() => {
        setIsFlipping(false)
        setFlipResult(null)
      }, 1000)
    }, 800)
  }

  return (
    <LobbyCoinContainer onClick={handleClick}>
      <Canvas ref={mountRef} />
    </LobbyCoinContainer>
  )
}

export default LobbyCoin
