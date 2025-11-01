/**
 * Scene Setup
 * Initializes Three.js scene, camera, renderers, and physics world
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GAME_CONFIG } from '../config.js';
import { COLORS } from './game-state.js';

/**
 * Initialize Three.js scene and all renderers
 */
export async function initializeScene(roomParam) {
  THREE.ColorManagement.enabled = true;
  
  const scene = new THREE.Scene();
  scene.background = null; // Transparent to show CSS background image
  
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Camera setup
  const camera = new THREE.PerspectiveCamera(30, width / height, 1, 5000);
  camera.position.set(0, GAME_CONFIG.cameraHeight, 1400);
  camera.lookAt(0, GAME_CONFIG.cameraHeight, 0);
  camera.layers.enable(0); // Default layer - tubes, coins, etc.
  camera.layers.enable(1); // Bloom layer - pearls and plasma
  console.log('📷 Camera positioned for shorter tubes with dual-layer support');
  
  // WebGL Renderer
  const webglRenderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: true
  });
  webglRenderer.setSize(width, height);
  webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  webglRenderer.setClearColor(0x000000, 0);
  webglRenderer.autoClear = true;
  webglRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  webglRenderer.toneMappingExposure = 1.0;
  webglRenderer.outputColorSpace = THREE.SRGBColorSpace;
  console.log('🎨 WebGL Renderer initialized with transparency');
  document.getElementById('container').appendChild(webglRenderer.domElement);
  
  // Bloom composer for selective pearl rendering
  const bloomRenderTarget = new THREE.WebGLRenderTarget(width, height, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    colorSpace: THREE.SRGBColorSpace,
    stencilBuffer: false,
    depthBuffer: true
  });
  
  const bloomComposer = new EffectComposer(webglRenderer, bloomRenderTarget);
  
  const bloomRenderPass = new RenderPass(scene, camera);
  bloomRenderPass.clear = true;
  bloomRenderPass.clearColor = new THREE.Color(0, 0, 0);
  bloomRenderPass.clearAlpha = 0;
  bloomComposer.addPass(bloomRenderPass);
  
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    1.0,
    0.3,
    0.1
  );
  bloomPass.renderToScreen = false;
  bloomComposer.addPass(bloomPass);
  bloomComposer.renderToScreen = false;
  
  console.log('✨ Selective bloom composer created for layer 1 (pearls)!');
  
  // CSS3D Renderer for UI elements
  const cssRenderer = new CSS3DRenderer();
  cssRenderer.setSize(width, height);
  cssRenderer.domElement.style.position = 'absolute';
  cssRenderer.domElement.style.top = '0';
  cssRenderer.domElement.style.pointerEvents = 'auto';
  document.getElementById('container').appendChild(cssRenderer.domElement);
  
  // Background loading
  const bgTextureLoader = new THREE.TextureLoader();
  const bgCandidates = roomParam === 'lab' 
    ? ['/images/background/thelab.png']
    : roomParam === 'cyber'
    ? ['/images/background/cyber.png']
    : roomParam === 'mech'
    ? ['/images/background/mech.png']
    : ['/images/background/game room2.png'];
  
  function loadBackground(paths, onSuccess, onFail) {
    if (!paths.length) { onFail && onFail(new Error('No background paths worked')); return; }
    const path = paths[0];
    bgTextureLoader.load(path, onSuccess, undefined, () => loadBackground(paths.slice(1), onSuccess, onFail));
  }
  
  await new Promise((resolve, reject) => {
    loadBackground(bgCandidates, (bgTexture) => {
      bgTexture.colorSpace = THREE.SRGBColorSpace;
      bgTexture.minFilter = THREE.LinearFilter;
      bgTexture.magFilter = THREE.LinearFilter;
      
      const distanceFromCamera = 1400 - (-500);
      const vFOV = camera.fov * Math.PI / 180;
      const planeHeight = 2 * Math.tan(vFOV / 2) * distanceFromCamera;
      const planeWidth = planeHeight * camera.aspect;
      
      const bgGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
      const bgMaterial = new THREE.MeshBasicMaterial({
        map: bgTexture,
        side: THREE.FrontSide,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
        fog: false,
        color: 0xcccccc
      });
      const bgPlane = new THREE.Mesh(bgGeometry, bgMaterial);
      bgPlane.position.set(0, GAME_CONFIG.cameraHeight, -500);
      bgPlane.renderOrder = -1;
      bgPlane.layers.set(0);
      scene.add(bgPlane);
      scene.background = null;
      console.log(`🖼️ Background image loaded! Size: ${planeWidth.toFixed(0)}x${planeHeight.toFixed(0)}`);
      resolve();
    }, undefined, (error) => {
      console.error('❌ Failed to load background image:', error);
      resolve(); // Continue even if background fails
    });
  });
  
  // Lighting setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  
  const topLight = new THREE.DirectionalLight(0xffffff, 0.6);
  topLight.position.set(0, 600, 400);
  scene.add(topLight);
  
  const leftAccent = new THREE.PointLight(COLORS.cyan, 1, 1500);
  leftAccent.position.set(-800, 200, 400);
  scene.add(leftAccent);
  
  const rightAccent = new THREE.PointLight(COLORS.pink, 1, 1500);
  rightAccent.position.set(800, 200, 400);
  scene.add(rightAccent);
  
  const frontLight = new THREE.DirectionalLight(0xffffff, 1.0);
  frontLight.position.set(0, 200, 1200);
  frontLight.target.position.set(0, 200, 0);
  scene.add(frontLight);
  scene.add(frontLight.target);
  
  // Physics world
  const physicsWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0, -980, 0)
  });
  physicsWorld.defaultContactMaterial.friction = 0.1;
  physicsWorld.defaultContactMaterial.restitution = 0.3;
  console.log('⚛️ Physics world created with gravity');
  
  // Texture loaders
  const textureLoader = new THREE.TextureLoader();
  const brassColorMap = textureLoader.load('/images/textures/Brass/textures/rusty_metal_04_diff_4k.jpg');
  const brassDisplacementMap = textureLoader.load('/images/textures/Brass/textures/rusty_metal_04_disp_4k.png');
  
  brassColorMap.wrapS = THREE.RepeatWrapping;
  brassColorMap.wrapT = THREE.RepeatWrapping;
  brassColorMap.repeat.set(2, 2);
  
  brassDisplacementMap.wrapS = THREE.RepeatWrapping;
  brassDisplacementMap.wrapT = THREE.RepeatWrapping;
  brassDisplacementMap.repeat.set(2, 2);
  
  console.log('🎨 Brass metallic textures loaded');
  
  // Tube alpha texture (cutout)
  const tubeAlphaCanvas = document.createElement('canvas');
  tubeAlphaCanvas.width = 512;
  tubeAlphaCanvas.height = 512;
  const tubeAlphaCtx = tubeAlphaCanvas.getContext('2d');
  
  tubeAlphaCtx.fillStyle = 'white';
  tubeAlphaCtx.fillRect(0, 0, 512, 512);
  tubeAlphaCtx.globalCompositeOperation = 'destination-out';
  tubeAlphaCtx.fillStyle = 'black';
  
  const rectWidth = 200;
  const rectHeight = 440;
  const rectX = 256 - rectWidth / 2;
  const rectY = 36;
  const cornerRadius = 30;
  
  tubeAlphaCtx.beginPath();
  tubeAlphaCtx.moveTo(rectX + cornerRadius, rectY);
  tubeAlphaCtx.lineTo(rectX + rectWidth - cornerRadius, rectY);
  tubeAlphaCtx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + cornerRadius);
  tubeAlphaCtx.lineTo(rectX + rectWidth, rectY + rectHeight - cornerRadius);
  tubeAlphaCtx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - cornerRadius, rectY + rectHeight);
  tubeAlphaCtx.lineTo(rectX + cornerRadius, rectY + rectHeight);
  tubeAlphaCtx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - cornerRadius);
  tubeAlphaCtx.lineTo(rectX, rectY + cornerRadius);
  tubeAlphaCtx.quadraticCurveTo(rectX, rectY, rectX + cornerRadius, rectY);
  tubeAlphaCtx.closePath();
  tubeAlphaCtx.fill();
  
  const tubeAlphaTexture = new THREE.CanvasTexture(tubeAlphaCanvas);
  tubeAlphaTexture.wrapS = THREE.RepeatWrapping;
  tubeAlphaTexture.wrapT = THREE.ClampToEdgeWrapping;
  
  return {
    scene,
    camera,
    webglRenderer,
    cssRenderer,
    bloomComposer,
    physicsWorld,
    textureLoader,
    brassColorMap,
    brassDisplacementMap,
    tubeAlphaTexture
  };
}

