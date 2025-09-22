import React, { useState, useEffect, useRef } from 'react'
import styled from '@emotion/styled'

const VideoContainer = styled.video`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  opacity: 0.7;
  transition: opacity 0.3s ease;
  
  /* Performance optimizations */
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
  
  /* Reduce quality on mobile for better performance */
  @media (max-width: 768px) {
    opacity: 0.5;
  }
  
  /* Disable on very small screens or low-end devices */
  @media (max-width: 480px) {
    opacity: 0.3;
  }
`

const BackgroundVideo = ({ 
  videoSrc, 
  enablePerformanceMode = true,
  enableMobileOptimization = true 
}) => {
  const videoRef = useRef(null)
  const [isVisible, setIsVisible] = useState(true)
  const [isLowEndDevice, setIsLowEndDevice] = useState(false)

  // Detect low-end devices
  useEffect(() => {
    const checkDeviceCapability = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4
      const isSlowConnection = navigator.connection && navigator.connection.effectiveType === 'slow-2g'
      
      setIsLowEndDevice(isMobile && (isLowMemory || isSlowConnection))
    }

    checkDeviceCapability()
  }, [])

  // Handle tab visibility changes
  useEffect(() => {
    if (!enablePerformanceMode) return

    const handleVisibilityChange = () => {
      if (videoRef.current) {
        if (document.hidden) {
          videoRef.current.pause()
        } else {
          videoRef.current.play().catch(console.warn)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [enablePerformanceMode])

  // Handle page focus/blur
  useEffect(() => {
    if (!enablePerformanceMode) return

    const handleFocus = () => {
      if (videoRef.current) {
        videoRef.current.play().catch(console.warn)
      }
    }

    const handleBlur = () => {
      if (videoRef.current) {
        videoRef.current.pause()
      }
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [enablePerformanceMode])

  // Don't render video on very low-end devices
  if (isLowEndDevice && enableMobileOptimization) {
    return null
  }

  return (
    <VideoContainer
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata" // Only load metadata initially
      onLoadStart={() => console.log('🎥 Background video loading...')}
      onCanPlay={() => console.log('🎥 Background video ready')}
      onError={(e) => console.warn('🎥 Background video error:', e)}
    >
      <source src={videoSrc} type="video/webm" />
      {/* Fallback for browsers that don't support WebM */}
      <source src={videoSrc.replace('.webm', '.mp4')} type="video/mp4" />
    </VideoContainer>
  )
}

export default BackgroundVideo
