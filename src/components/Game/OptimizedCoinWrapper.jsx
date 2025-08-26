import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import styled from '@emotion/styled'
import OptimizedGoldCoin from '../OptimizedGoldCoin'

const CoinContainer = styled.div`
  position: relative;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const PerformanceMonitor = styled.div`
  position: absolute;
  top: -30px;
  right: 0;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  display: ${props => props.show ? 'block' : 'none'};
`

const FallbackCoin = styled.div`
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => props.size * 0.3}px;
  color: #FFFFFF;
  font-weight: bold;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  animation: ${props => props.isFlipping ? 'cssFlip 2s ease-in-out' : 'float 4s ease-in-out infinite'};
  transform-style: preserve-3d;
  
  @keyframes cssFlip {
    0% { transform: rotateY(0deg) scale(1); }
    50% { transform: rotateY(1800deg) scale(1.2); }
    100% { transform: rotateY(3600deg) scale(1); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0) rotateY(0deg); }
    50% { transform: translateY(-10px) rotateY(180deg); }
  }
`

const StreamedFrame = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`

export const OptimizedCoinWrapper = ({
  gamePhase,
  isFlipping,
  flipResult,
  streamData,
  customHeadsImage,
  customTailsImage,
  size = 200,
  isMobile,
  ...coinProps
}) => {
  const [renderMode, setRenderMode] = useState('auto') // 'three' | 'css' | 'stream' | 'auto'
  const [fps, setFps] = useState(60)
  const [useThreeJS, setUseThreeJS] = useState(!isMobile)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const rafRef = useRef(null)

  // Detect device capabilities
  useEffect(() => {
    const checkPerformance = () => {
      // Check for WebGL support
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      const hasWebGL = !!gl
      
      // Check device memory (if available)
      const memoryGB = navigator.deviceMemory || 4
      
      // Check CPU cores
      const cores = navigator.hardwareConcurrency || 4
      
      // Decision logic
      if (!hasWebGL || isMobile) {
        setRenderMode('css')
        setUseThreeJS(false)
      } else if (memoryGB < 4 || cores < 4) {
        // Lower-end desktop
        setRenderMode('css')
        setUseThreeJS(false)
      } else {
        // Good performance device
        setRenderMode('three')
        setUseThreeJS(true)
      }
    }

    checkPerformance()
  }, [isMobile])

  // FPS monitoring for development
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const measureFPS = () => {
      frameCountRef.current++
      const currentTime = performance.now()
      
      if (currentTime >= lastTimeRef.current + 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / (currentTime - lastTimeRef.current)))
        frameCountRef.current = 0
        lastTimeRef.current = currentTime
      }
      
      rafRef.current = requestAnimationFrame(measureFPS)
    }
    
    rafRef.current = requestAnimationFrame(measureFPS)
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  // Reduce quality on low FPS
  useEffect(() => {
    if (fps < 30 && useThreeJS) {
      console.warn('Low FPS detected, switching to CSS mode')
      setRenderMode('css')
      setUseThreeJS(false)
    }
  }, [fps, useThreeJS])

  // Memoize coin props to prevent unnecessary re-renders
  const memoizedCoinProps = useMemo(() => ({
    ...coinProps,
    customHeadsImage,
    customTailsImage,
    size,
    isFlipping,
    flipResult
  }), [coinProps, customHeadsImage, customTailsImage, size, isFlipping, flipResult])

  // Render based on phase and mode
  const renderCoin = () => {
    // During flip, always use streamed data if available
    if (gamePhase === 'flipping' && streamData) {
      return <StreamedFrame src={streamData} alt="Flipping coin" />
    }

    // Use CSS fallback for mobile or low-performance
    if (renderMode === 'css' || !useThreeJS) {
      return (
        <FallbackCoin size={size} isFlipping={isFlipping}>
          {customHeadsImage ? (
            <img 
              src={isFlipping ? '/coins/blur.png' : customHeadsImage} 
              alt="Coin" 
              style={{ width: '80%', height: '80%', borderRadius: '50%' }}
            />
          ) : (
            <span>{isFlipping ? '?' : 'COIN'}</span>
          )}
        </FallbackCoin>
      )
    }

    // Use Three.js for desktop/high-performance
    return <OptimizedGoldCoin {...memoizedCoinProps} />
  }

  return (
    <CoinContainer size={size}>
      {renderCoin()}
      <PerformanceMonitor show={process.env.NODE_ENV === 'development'}>
        FPS: {fps} | Mode: {renderMode}
      </PerformanceMonitor>
    </CoinContainer>
  )
}

export default OptimizedCoinWrapper
