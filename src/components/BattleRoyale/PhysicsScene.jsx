import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

const PhysicsScene = ({ obstacles = [], players = {}, coinPositions = [], cameraTarget = null, currentPlayerAddress = null, isMyTurn = false }) => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const obstaclesRef = useRef([])
  const coinRef = useRef(null)
  const animationIdRef = useRef(null)
  const cameraBasePositionRef = useRef({ x: 0, y: 5, z: 30 })

  useEffect(() => {
    if (!mountRef.current) return
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000011)
    const camera = new THREE.PerspectiveCamera(60, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000)
    camera.position.set(0, 5, 30)
    camera.lookAt(0, 20, 0)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mountRef.current.appendChild(renderer.domElement)
    const ambientLight = new THREE.AmbientLight(0x404080, 1.5)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight.position.set(10, 50, 10)
    directionalLight.castShadow = true
    directionalLight.shadow.camera.left = -50
    directionalLight.shadow.camera.right = 50
    directionalLight.shadow.camera.top = 50
    directionalLight.shadow.camera.bottom = -50
    scene.add(directionalLight)
    const pointLight1 = new THREE.PointLight(0x00ffff, 2, 100)
    pointLight1.position.set(-20, 30, 10)
    scene.add(pointLight1)
    const pointLight2 = new THREE.PointLight(0xff00ff, 2, 100)
    pointLight2.position.set(20, 30, -10)
    scene.add(pointLight2)
    const starGeometry = new THREE.BufferGeometry()
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, sizeAttenuation: true })
    const starVertices = []
    for (let i = 0; i < 1000; i++) { const x = (Math.random() - 0.5) * 200; const y = (Math.random() - 0.5) * 200; const z = (Math.random() - 0.5) * 200; starVertices.push(x, y, z) }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3))
    const stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)
    obstacles.forEach((obstacle, index) => {
      let geometry, material
      if (obstacle.type === 'sphere') {
        geometry = new THREE.SphereGeometry(obstacle.radius, 32, 32)
        const colors = [0xff6b6b, 0x6b9eff, 0x9eff6b, 0xff6bff, 0xffff6b, 0x6bffff]
        const color = colors[index % colors.length]
        material = new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.7, emissive: color, emissiveIntensity: 0.2 })
      }
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(obstacle.position.x, obstacle.position.y, obstacle.position.z)
      mesh.castShadow = true
      mesh.receiveShadow = true
      scene.add(mesh)
      obstaclesRef.current.push(mesh)
    })
    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer
    const animate = () => {
      if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return
      if (stars) { stars.rotation.y += 0.0002 }
      if (cameraTarget && isMyTurn) {
        const targetPos = new THREE.Vector3(cameraTarget.x, cameraTarget.y - 5, cameraTarget.z + 15)
        camera.position.lerp(targetPos, 0.05)
        camera.lookAt(cameraTarget.x, cameraTarget.y, cameraTarget.z)
      } else {
        const basePos = new THREE.Vector3(cameraBasePositionRef.current.x, cameraBasePositionRef.current.y, cameraBasePositionRef.current.z)
        camera.position.lerp(basePos, 0.02)
        camera.lookAt(0, 20, 0)
      }
      renderer.render(scene, camera)
      animationIdRef.current = requestAnimationFrame(animate)
    }
    animate()
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationIdRef.current) { cancelAnimationFrame(animationIdRef.current) }
      obstaclesRef.current.forEach(obstacle => { if (obstacle.geometry) obstacle.geometry.dispose(); if (obstacle.material) obstacle.material.dispose() })
      if (renderer) { renderer.dispose(); if (mountRef.current) { mountRef.current.removeChild(renderer.domElement) } }
      sceneRef.current = null
      cameraRef.current = null
      rendererRef.current = null
    }
  }, [obstacles])

  useEffect(() => {
    if (!sceneRef.current || coinPositions.length === 0) return
    const latestPosition = coinPositions[coinPositions.length - 1]
    if (!coinRef.current) {
      const coinGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 32)
      const coinMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2, emissive: 0xffd700, emissiveIntensity: 0.3 })
      const coin = new THREE.Mesh(coinGeometry, coinMaterial)
      coin.castShadow = true
      sceneRef.current.add(coin)
      coinRef.current = coin
    }
    coinRef.current.position.set(latestPosition.position.x, latestPosition.position.y, latestPosition.position.z)
    coinRef.current.quaternion.set(latestPosition.rotation.x, latestPosition.rotation.y, latestPosition.rotation.z, latestPosition.rotation.w)
  }, [coinPositions])

  useEffect(() => {
    if (coinPositions.length === 0 && coinRef.current && sceneRef.current) {
      sceneRef.current.remove(coinRef.current)
      coinRef.current.geometry.dispose()
      coinRef.current.material.dispose()
      coinRef.current = null
    }
  }, [coinPositions.length])

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
  )
}

export default PhysicsScene


