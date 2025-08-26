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

  // Render based on phase and mode - no CSS fallback
  const renderCoin = () => {
    // During flip, always use streamed data if available
    if (gamePhase === 'flipping' && streamData) {
      return <StreamedFrame src={streamData} alt="Flipping coin" />
    }

    // Use Three.js for all devices
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
