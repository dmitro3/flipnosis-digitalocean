import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import './GlassTubeGame.css'

const GlassTubeGame = () => {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const webglRendererRef = useRef(null)
  const cssRendererRef = useRef(null)
  const composerRef = useRef(null)
  const tubesRef = useRef([])
  const coinsRef = useRef([])
  const cardsRef = useRef([])
  const animationIdRef = useRef(null)

  // Color palette
  const COLORS = {
    cyan: 0x00ffff,
    purple: 0x8A00C4,
    pink: 0xff1493,
    gold: 0xFFD700,
    glass: 0x88ccff
  }

  // Mock player data
  const players = [
    { id: 1, name: 'Alice', lives: 3, address: '0xabc...123', choice: null },
    { id: 2, name: 'Bob', lives: 3, address: '0xdef...456', choice: 'heads' },
    { id: 3, name: 'Charlie', lives: 2, address: '0xghi...789', choice: null },
    { id: 4, name: 'Diana', lives: 3, address: '0xjkl...012', choice: 'tails' }
  ]

  // No longer needed - filling happens in animation loop

  useEffect(() => {
    if (!containerRef.current) return

    console.log('🎮 Initializing 4-Player Glass Tube Game')

    // ===== SCENE =====
    const scene = new THREE.Scene()
    scene.background = null // Transparent to show background image
    sceneRef.current = scene

    // ===== CAMERA - FLATTER VIEW =====
    const width = window.innerWidth
    const height = window.innerHeight
    const camera = new THREE.PerspectiveCamera(30, width / height, 1, 5000) // Narrower FOV = less distortion
    camera.position.set(0, 100, 1400) // Much flatter - lower Y, higher Z
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    console.log('📷 Camera: flat frontal view')

    // ===== WEBGL RENDERER =====
    const webglRenderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    })
    webglRenderer.setSize(width, height)
    webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    webglRenderer.toneMapping = THREE.ReinhardToneMapping
    webglRenderer.toneMappingExposure = 1.2
    containerRef.current.appendChild(webglRenderer.domElement)
    webglRendererRef.current = webglRenderer

    // ===== POST-PROCESSING =====
    const composer = new EffectComposer(webglRenderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.45,  // 70% less glow (was 1.5)
      0.4,
      0.85
    )
    composer.addPass(bloomPass)
    composerRef.current = composer

    // ===== CSS3D RENDERER =====
    const cssRenderer = new CSS3DRenderer()
    cssRenderer.setSize(width, height)
    cssRenderer.domElement.style.position = 'absolute'
    cssRenderer.domElement.style.top = '0'
    cssRenderer.domElement.style.pointerEvents = 'none'
    containerRef.current.appendChild(cssRenderer.domElement)
    cssRendererRef.current = cssRenderer

    // ===== LIGHTING =====
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const topLight = new THREE.DirectionalLight(0xffffff, 1.5)
    topLight.position.set(0, 600, 400)
    scene.add(topLight)

    const leftAccent = new THREE.PointLight(COLORS.cyan, 3, 1500)
    leftAccent.position.set(-800, 200, 400)
    scene.add(leftAccent)

    const rightAccent = new THREE.PointLight(COLORS.pink, 3, 1500)
    rightAccent.position.set(800, 200, 400)
    scene.add(rightAccent)

    // ===== TUBE LAYOUT =====
    const NUM_TUBES = 4
    const TUBE_RADIUS = 80
    const TUBE_HEIGHT = 500
    const SPACING = 350

    // CALCULATE DYNAMIC CARD POSITION - fits any screen!
    // At Z=0 (where cards are), calculate visible vertical range
    const fovRadians = (camera.fov * Math.PI) / 180
    const distanceToCardPlane = camera.position.z // 1400
    const visibleHeight = 2 * distanceToCardPlane * Math.tan(fovRadians / 2)
    const frustumBottom = -visibleHeight / 2
    const cardPadding = 50 // pixels from bottom edge
    const CARD_Y_OFFSET = frustumBottom + cardPadding + 140 // 140 = half card height

    const totalWidth = SPACING * (NUM_TUBES - 1)
    const startX = -totalWidth / 2

    console.log(`📐 Layout: ${NUM_TUBES} tubes, spacing: ${SPACING}px`)
    console.log(`📐 Frustum: visible height=${visibleHeight.toFixed(0)}, bottom=${frustumBottom.toFixed(0)}`)
    console.log(`📐 Cards positioned at Y: ${CARD_Y_OFFSET.toFixed(0)}`)

    // ===== LOAD BRASS/METALLIC TEXTURES =====
    const textureLoader = new THREE.TextureLoader()
    const brassColorMap = textureLoader.load('/Images/textures/Brass/textures/rusty_metal_04_diff_4k.jpg')
    const brassDisplacementMap = textureLoader.load('/Images/textures/Brass/textures/rusty_metal_04_disp_4k.png')
    
    // Set texture properties for proper tiling
    brassColorMap.wrapS = THREE.RepeatWrapping
    brassColorMap.wrapT = THREE.RepeatWrapping
    brassColorMap.repeat.set(2, 2)
    
    brassDisplacementMap.wrapS = THREE.RepeatWrapping
    brassDisplacementMap.wrapT = THREE.RepeatWrapping
    brassDisplacementMap.repeat.set(2, 2)

    console.log('🎨 Brass metallic textures loaded')

    // No alpha map needed - using fully transparent silver glass

    // ===== CREATE TUBES =====
    for (let i = 0; i < NUM_TUBES; i++) {
      const x = startX + (i * SPACING)
      const player = players[i]

      // --- GLASS TUBE - METALLIC SILVER, FULLY TRANSPARENT ---
      const tubeGeometry = new THREE.CylinderGeometry(
        TUBE_RADIUS, TUBE_RADIUS, TUBE_HEIGHT, 64, 1, true
      )
      const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xc0c0c0, // Metallic silver
        transparent: true,
        opacity: 0.05, // Almost fully transparent
        roughness: 0.1,
        metalness: 0.9, // Very metallic
        transmission: 0.95, // Nearly full transmission
        thickness: 0.3,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        ior: 1.5,
        reflectivity: 0.8, // High reflectivity for silver
        envMapIntensity: 1.5,
        side: THREE.DoubleSide
      })
      const tube = new THREE.Mesh(tubeGeometry, glassMaterial)
      tube.position.set(x, 0, 0)
      scene.add(tube)

      // --- BRASS CAPS (TOP & BOTTOM LIDS) - METALLIC ---
      const brassCapMaterial = new THREE.MeshStandardMaterial({
        map: brassColorMap,
        displacementMap: brassDisplacementMap,
        displacementScale: 0.2,
        metalness: 0.98,
        roughness: 0.1,
      })

      // Top cap (solid brass metallic disc)
      const capGeometry = new THREE.CylinderGeometry(TUBE_RADIUS + 10, TUBE_RADIUS + 10, 15, 64)
      const topCap = new THREE.Mesh(capGeometry, brassCapMaterial)
      topCap.position.set(x, (TUBE_HEIGHT / 2) + 7.5, 0)
      scene.add(topCap)

      // Bottom cap (solid brass metallic disc)
      const bottomCap = new THREE.Mesh(capGeometry, brassCapMaterial.clone())
      bottomCap.position.set(x, -(TUBE_HEIGHT / 2) - 7.5, 0)
      scene.add(bottomCap)

      // --- DECORATIVE RIMS (ORANGE - SMOOTH & GLOSSY) ---
      const rimGeometry = new THREE.TorusGeometry(TUBE_RADIUS + 5, 8, 32, 64)
      const rimMaterial = new THREE.MeshStandardMaterial({
        color: 0xff8800, // BRIGHT ORANGE
        metalness: 0.95,
        roughness: 0.1,
      })
      
      const topRim = new THREE.Mesh(rimGeometry, rimMaterial)
      topRim.position.set(x, TUBE_HEIGHT / 2, 0)
      topRim.rotation.x = Math.PI / 2
      scene.add(topRim)

      const bottomRim = topRim.clone()
      bottomRim.position.y = -TUBE_HEIGHT / 2
      scene.add(bottomRim)

      // --- LIQUID (STARTS AT BOTTOM, VISIBLE) - SHINY GLOSSY GOO ---
      const liquidHeight = TUBE_HEIGHT - 20 // Full height capacity
      const liquidGeometry = new THREE.CylinderGeometry(
        TUBE_RADIUS - 5, TUBE_RADIUS - 5, liquidHeight, 32
      )
      const liquidMaterial = new THREE.MeshPhysicalMaterial({
        color: COLORS.purple,
        metalness: 0.8, // Very metallic/shiny
        roughness: 0.05, // Very smooth/glossy
        transparent: true,
        opacity: 0.95,
        transmission: 0.2, // Some light passes through
        thickness: 3.0,
        clearcoat: 1.0, // Maximum glossy wet surface
        clearcoatRoughness: 0.01, // Ultra smooth clearcoat
        emissive: COLORS.purple,
        emissiveIntensity: 0.5,
        ior: 1.5, // Higher refractive index
        reflectivity: 1.0 // Maximum reflectivity
      })
      const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial)
      const liquidY = -(TUBE_HEIGHT / 2) + (liquidHeight / 2)
      liquid.position.set(x, liquidY, 0)
      liquid.scale.y = 0.15 // START AT 15% HEIGHT (visible above cards)
      scene.add(liquid)

      // Removed surface disc - only using liquid cylinder

      // --- LIQUID LIGHT ---
      const initialHeight = liquidHeight * 0.15
      const liquidLight = new THREE.PointLight(COLORS.pink, 0.5, 350) // START WITH SOME LIGHT
      liquidLight.position.set(x, liquidY - (liquidHeight / 2) + initialHeight, 0)
      scene.add(liquidLight)

      // --- SPOTLIGHT ---
      const spotlight = new THREE.SpotLight(0xffffff, 3, 700, Math.PI / 6, 0.3, 2)
      spotlight.position.set(x, TUBE_HEIGHT / 2 + 300, 150)
      spotlight.target.position.set(x, 0, 0)
      scene.add(spotlight)
      scene.add(spotlight.target)

      // --- PLATFORM BASE (BRASS METALLIC) ---
      const platformGeometry = new THREE.CylinderGeometry(
        TUBE_RADIUS + 20, TUBE_RADIUS + 20, 15, 32
      )
      const platformMaterial = new THREE.MeshStandardMaterial({
        map: brassColorMap,
        displacementMap: brassDisplacementMap,
        displacementScale: 0.2,
        metalness: 0.98,
        roughness: 0.1,
      })
      const platform = new THREE.Mesh(platformGeometry, platformMaterial)
      platform.position.set(x, -(TUBE_HEIGHT / 2) - 30, 0)
      scene.add(platform)

      // --- GOLD COIN (STARTS NEAR TOP) ---
      const coinRadius = 50
      const coinThickness = 12
      const coinGeometry = new THREE.CylinderGeometry(coinRadius, coinRadius, coinThickness, 64)
      const coinMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.gold,
        metalness: 0.95,
        roughness: 0.05,
        emissive: COLORS.gold,
        emissiveIntensity: 0.8
      })
      const coin = new THREE.Mesh(coinGeometry, coinMaterial)
      coin.rotation.z = Math.PI / 2
      coin.position.set(x, (TUBE_HEIGHT / 2) - 80, 0) // Starts near top
      scene.add(coin)

      const coinGlowGeometry = new THREE.CylinderGeometry(
        coinRadius * 1.5, coinRadius * 1.5, coinThickness * 1.5, 32
      )
      const coinGlowMaterial = new THREE.MeshBasicMaterial({
        color: COLORS.gold,
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide
      })
      const coinGlow = new THREE.Mesh(coinGlowGeometry, coinGlowMaterial)
      coin.add(coinGlow)

      const coinLight = new THREE.PointLight(COLORS.gold, 4, 300)
      coin.add(coinLight)

      // --- PLAYER CARD (CSS3D) ---
      const cardElement = document.createElement('div')
      cardElement.className = 'player-card'
      cardElement.innerHTML = `
        <div class="card-header">
          <div class="player-name">${player.name}</div>
          <div class="player-address">${player.address}</div>
        </div>
        <div class="lives-container">
          ${Array.from({ length: 3 }, (_, idx) => 
            `<div class="life ${idx < player.lives ? 'active' : ''}">❤️</div>`
          ).join('')}
        </div>
        ${player.choice ? `
          <div class="choice-badge ${player.choice}">
            ${player.choice.toUpperCase()}
          </div>
        ` : `
          <div class="choice-buttons">
            <button class="choice-btn heads">HEADS</button>
            <button class="choice-btn tails">TAILS</button>
          </div>
        `}
        <button class="action-btn" data-tube="${i}">🪙 FLIP COIN</button>
      `

      cardElement.style.pointerEvents = 'auto'
      
      // Add flip button handler (HOLD TO FILL)
      const flipButton = cardElement.querySelector('.action-btn')
      flipButton.style.pointerEvents = 'auto'
      
      flipButton.addEventListener('mousedown', (e) => {
        e.stopPropagation()
        console.log(`🎲 Holding to fill tube ${i + 1}`)
        if (tubesRef.current[i]) {
          tubesRef.current[i].isFilling = true
        }
      })
      
      flipButton.addEventListener('mouseup', (e) => {
        e.stopPropagation()
        console.log(`🎲 Stopped filling tube ${i + 1}`)
        if (tubesRef.current[i]) {
          tubesRef.current[i].isFilling = false
        }
      })
      
      flipButton.addEventListener('mouseleave', (e) => {
        if (tubesRef.current[i]) {
          tubesRef.current[i].isFilling = false
        }
      })

      const choiceButtons = cardElement.querySelectorAll('.choice-btn')
      choiceButtons.forEach(btn => {
        btn.style.pointerEvents = 'auto'
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          console.log(`Choice: ${btn.textContent}`)
        })
      })

      const cssObject = new CSS3DObject(cardElement)
      cssObject.position.set(x, CARD_Y_OFFSET, 0)
      cssObject.scale.set(0.5, 0.5, 0.5)
      scene.add(cssObject)

      // Store references
      tubesRef.current.push({
        tube, topCap, bottomCap, topRim, bottomRim, 
        liquid, liquidLight, spotlight, platform, coin,
        liquidBaseY: liquidY,
        liquidBaseHeight: liquidHeight,
        isFilling: false
      })
      coinsRef.current.push(coin)
      cardsRef.current.push(cssObject)

      console.log(`✅ Tube ${i + 1} created at x=${x} for ${player.name}`)
    }

    // ===== ANIMATION LOOP =====
    let frameCount = 0
    const animate = () => {
      if (!sceneRef.current || !composerRef.current || !cssRendererRef.current) return

      frameCount++

      // Animate liquid surfaces and filling
      tubesRef.current.forEach((tube, i) => {
        const offset = i * 0.4
        
        // CONTINUOUS FILLING WHILE HOLDING
        if (tube.isFilling && tube.liquid.scale.y < 1.0) {
          const fillSpeed = 0.005 // Fill rate per frame
          tube.liquid.scale.y = Math.min(tube.liquid.scale.y + fillSpeed, 1.0)
          
          // Update liquid position
          const currentHeight = tube.liquidBaseHeight * tube.liquid.scale.y
          tube.liquid.position.y = tube.liquidBaseY + (currentHeight - tube.liquidBaseHeight) / 2
          
          // Update light position
          tube.liquidLight.position.y = tube.liquid.position.y + (currentHeight / 2)
          
          // Increase light intensity
          tube.liquidLight.intensity = Math.min(1.5 * tube.liquid.scale.y, 1.5)
        }
        
        // Pulse light based on current intensity
        if (tube.liquid.scale.y > 0.1 && tube.liquidLight.intensity > 0) {
          const basePulse = tube.liquidLight.intensity * 0.8
          const pulse = Math.sin(frameCount * 0.02 + offset) * 0.4
          tube.liquidLight.intensity = Math.max(basePulse, tube.liquidLight.intensity + pulse)
        }
      })

      // Rotate coins
      coinsRef.current.forEach((coin) => {
        coin.rotation.y += 0.015
      })

      composerRef.current.render()
      cssRendererRef.current.render(scene, camera)

      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate()
    console.log('✅ Animation started')

    // ===== RESIZE =====
    const handleResize = () => {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight

      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()

      webglRenderer.setSize(newWidth, newHeight)
      cssRenderer.setSize(newWidth, newHeight)
      composer.setSize(newWidth, newHeight)

      // RECALCULATE CARD POSITIONS - stays responsive!
      const fovRadians = (camera.fov * Math.PI) / 180
      const distanceToCardPlane = camera.position.z
      const visibleHeight = 2 * distanceToCardPlane * Math.tan(fovRadians / 2)
      const frustumBottom = -visibleHeight / 2
      const cardPadding = 50
      const newCardY = frustumBottom + cardPadding + 140

      // Update all card positions
      cardsRef.current.forEach(card => {
        card.position.y = newCardY
      })

      console.log(`📐 Resized - Cards repositioned to Y: ${newCardY.toFixed(0)}`)
    }

    window.addEventListener('resize', handleResize)

    // ===== CLEANUP =====
    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      if (composer) {
        composer.dispose()
      }
      if (webglRenderer) {
        containerRef.current?.removeChild(webglRenderer.domElement)
        webglRenderer.dispose()
      }
      if (cssRenderer) {
        containerRef.current?.removeChild(cssRenderer.domElement)
      }
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundImage: 'url(/Images/Background/game room2.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    />
  )
}

export default GlassTubeGame
