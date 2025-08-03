import React, { useRef, useEffect, useState } from 'react'
import { isMobileDevice } from '../../utils/deviceDetection'

const StreamedCoin = ({ 
  gameId,
  isStreaming = false,
  frameData = null,
  onFlipComplete,
  size = 400
}) => {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(null)
  const isMobile = isMobileDevice()

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Set canvas size
    canvas.width = size
    canvas.height = size
    
    // Set canvas style
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    
    ctxRef.current = ctx
    
    // Draw initial state (static coin)
    drawStaticCoin()
  }, [size])

  // Handle incoming frame data
  useEffect(() => {
    if (frameData && isStreaming) {
      setCurrentFrame(frameData)
      setIsAnimating(true)
      drawFrame(frameData)
    }
  }, [frameData, isStreaming])

  // Handle flip start
  useEffect(() => {
    if (isStreaming && !isAnimating) {
      setIsAnimating(true)
      console.log('🎬 Starting streamed coin animation')
    }
  }, [isStreaming])

  // Draw a single frame from server
  const drawFrame = (frameDataUrl) => {
    if (!ctxRef.current || !frameDataUrl) return

    const img = new Image()
    img.onload = () => {
      const ctx = ctxRef.current
      const canvas = canvasRef.current
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw the frame
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    }
    img.src = frameDataUrl
  }

  // Draw static coin (fallback when not streaming)
  const drawStaticCoin = () => {
    if (!ctxRef.current) return

    const ctx = ctxRef.current
    const canvas = canvasRef.current
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(canvas.width, canvas.height) * 0.4

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw gold gradient background
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    gradient.addColorStop(0, '#FFEF94')
    gradient.addColorStop(0.5, '#FFD700')
    gradient.addColorStop(0.8, '#DAA520')
    gradient.addColorStop(1, '#B8860B')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fill()

    // Draw border
    ctx.strokeStyle = '#8B7D6B'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.stroke()

    // Draw crown symbol
    ctx.fillStyle = '#8B4513'
    ctx.font = `bold ${radius * 0.3}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('♔', centerX, centerY - radius * 0.1)

    // Draw "HEADS" text
    ctx.fillStyle = '#654321'
    ctx.font = `bold ${radius * 0.25}px Hyperwave`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('HEADS', centerX, centerY + radius * 0.2)
  }

  // Handle animation completion
  useEffect(() => {
    if (isAnimating && !isStreaming) {
      // Animation has finished
      setIsAnimating(false)
      console.log('✅ Streamed coin animation completed')
      
      if (onFlipComplete) {
        onFlipComplete()
      }
    }
  }, [isStreaming, isAnimating, onFlipComplete])

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: isAnimating ? 'default' : 'pointer'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          boxShadow: isAnimating 
            ? '0 0 30px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 215, 0, 0.3)' 
            : '0 0 20px rgba(255, 215, 0, 0.4)',
          transition: 'box-shadow 0.3s ease',
          animation: isAnimating ? 'coinGlow 0.5s ease-in-out infinite alternate' : 'none'
        }}
      />
      
      {/* Loading indicator during streaming */}
      {isStreaming && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#FFD700',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 'bold',
            zIndex: 10
          }}
        >
          🎲 Flipping...
        </div>
      )}

      <style jsx>{`
        @keyframes coinGlow {
          0% {
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 215, 0, 0.3);
          }
          100% {
            box-shadow: 0 0 40px rgba(255, 215, 0, 0.8), 0 0 80px rgba(255, 215, 0, 0.5);
          }
        }
      `}</style>
    </div>
  )
}

export default StreamedCoin 