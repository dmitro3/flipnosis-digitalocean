import React, { useState } from 'react'

const CoinMaterialSelector = ({ 
  onMaterialSelect, 
  selectedMaterial = null 
}) => {
  const [selectedMaterialType, setSelectedMaterialType] = useState(selectedMaterial?.id || 'poker-chip')

  // Coin material options with physics properties and visual characteristics
  const coinMaterials = [
    {
      id: 'penny',
      name: 'Penny',
      description: 'Lightweight & Fast',
      edgeColor: '#CD7F32', // Copper/bronze
      physics: {
        weight: 'light',
        speedMultiplier: 1.5,
        durationMultiplier: 0.7,
        wobbleIntensity: 1.2,
        predictability: 'low'
      },
      characteristics: 'Fast flips, unpredictable bounces, high skill ceiling'
    },
    {
      id: 'graphite',
      name: 'Graphite',
      description: 'Ultra-Light & Swift',
      edgeColor: '#1a1a1a', // Shiny dark black
      physics: {
        weight: 'ultra-light',
        speedMultiplier: 2.0,
        durationMultiplier: 0.5,
        wobbleIntensity: 1.5,
        predictability: 'very-low'
      },
      characteristics: 'Ultra-fast flips, chaotic motion, expert level'
    },
    {
      id: 'poker-chip',
      name: 'Poker Chip',
      description: 'Balanced & Classic',
      edgeColor: '#228B22', // Green like poker chips
      physics: {
        weight: 'medium',
        speedMultiplier: 1.0,
        durationMultiplier: 1.0,
        wobbleIntensity: 1.0,
        predictability: 'medium'
      },
      characteristics: 'Balanced gameplay, reliable physics, all skill levels'
    },
    {
      id: 'silver-dollar',
      name: 'Silver Dollar',
      description: 'Heavy & Controlled',
      edgeColor: '#C0C0C0', // Bright silver
      physics: {
        weight: 'heavy',
        speedMultiplier: 0.7,
        durationMultiplier: 1.3,
        wobbleIntensity: 0.8,
        predictability: 'high'
      },
      characteristics: 'Slow, controlled flips, predictable outcomes'
    },
    {
      id: 'titanium',
      name: 'Titanium',
      description: 'Ultra-Heavy & Precise',
      edgeColor: '#E5E4E2', // Chrome/metallic with rainbow reflections
      physics: {
        weight: 'ultra-heavy',
        speedMultiplier: 0.5,
        durationMultiplier: 1.6,
        wobbleIntensity: 0.6,
        predictability: 'very-high'
      },
      characteristics: 'Very slow, precise flips, highly predictable'
    }
  ]

  const handleMaterialSelect = (material) => {
    console.log('🪙 Material selected:', material)
    setSelectedMaterialType(material.id)
    onMaterialSelect(material)
  }

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 215, 0, 0.3)',
      borderRadius: '1rem',
      padding: '2rem',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h3 style={{
        color: '#FFD700',
        textAlign: 'center',
        marginBottom: '1rem',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}>
        Choose Your Coin Material
      </h3>
      
      <p style={{
        color: '#fff',
        textAlign: 'center',
        marginBottom: '2rem',
        fontSize: '0.9rem',
        opacity: 0.8
      }}>
        Each material affects the coin's physics and flip behavior
      </p>

             {/* Materials Grid */}
       <div style={{
         display: 'grid',
         gridTemplateColumns: 'repeat(5, 1fr)',
         gap: '1rem'
       }}>
        {coinMaterials.map((material) => (
          <div
            key={material.id}
            onClick={() => handleMaterialSelect(material)}
            style={{
              background: selectedMaterialType === material.id ? 
                'rgba(255, 215, 0, 0.2)' : 
                'rgba(255, 255, 255, 0.05)',
              border: selectedMaterialType === material.id ? 
                '2px solid #FFD700' : 
                '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Coin Preview with Edge Color */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 50%, rgba(0,0,0,0.2) 100%)',
                border: (material.id === 'poker-chip' || material.id === 'penny') ? 'none' : `4px solid ${material.edgeColor}`,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: material.id === 'poker-chip' ? '0 0 20px rgba(34, 139, 34, 0.4)' : material.id === 'penny' ? '0 0 20px rgba(205, 127, 50, 0.4)' : `0 0 20px ${material.edgeColor}40`
              }}>
                {/* Special poker chip edge pattern */}
                {material.id === 'poker-chip' && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    left: '-4px',
                    right: '-4px',
                    bottom: '-4px',
                    borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, #228B22 0deg, #228B22 18deg, #FFFFFF 18deg, #FFFFFF 36deg, #228B22 36deg, #228B22 54deg, #FFFFFF 54deg, #FFFFFF 72deg, #228B22 72deg, #228B22 90deg, #FFFFFF 90deg, #FFFFFF 108deg, #228B22 108deg, #228B22 126deg, #FFFFFF 126deg, #FFFFFF 144deg, #228B22 144deg, #228B22 162deg, #FFFFFF 162deg, #FFFFFF 180deg, #228B22 180deg, #228B22 198deg, #FFFFFF 198deg, #FFFFFF 216deg, #228B22 216deg, #228B22 234deg, #FFFFFF 234deg, #FFFFFF 252deg, #228B22 252deg, #228B22 270deg, #FFFFFF 270deg, #FFFFFF 288deg, #228B22 288deg, #228B22 306deg, #FFFFFF 306deg, #FFFFFF 324deg, #228B22 324deg, #228B22 342deg, #FFFFFF 342deg, #FFFFFF 360deg)',
                    zIndex: 1
                  }} />
                )}
                {/* Special penny ridged edge pattern */}
                {material.id === 'penny' && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    left: '-4px',
                    right: '-4px',
                    bottom: '-4px',
                    borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, #CD7F32 0deg, #CD7F32 6deg, #B8860B 6deg, #B8860B 12deg, #CD7F32 12deg, #CD7F32 18deg, #B8860B 18deg, #B8860B 24deg, #CD7F32 24deg, #CD7F32 30deg, #B8860B 30deg, #B8860B 36deg, #CD7F32 36deg, #CD7F32 42deg, #B8860B 42deg, #B8860B 48deg, #CD7F32 48deg, #CD7F32 54deg, #B8860B 54deg, #B8860B 60deg, #CD7F32 60deg, #CD7F32 66deg, #B8860B 66deg, #B8860B 72deg, #CD7F32 72deg, #CD7F32 78deg, #B8860B 78deg, #B8860B 84deg, #CD7F32 84deg, #CD7F32 90deg, #B8860B 90deg, #B8860B 96deg, #CD7F32 96deg, #CD7F32 102deg, #B8860B 102deg, #B8860B 108deg, #CD7F32 108deg, #CD7F32 114deg, #B8860B 114deg, #B8860B 120deg, #CD7F32 120deg, #CD7F32 126deg, #B8860B 126deg, #B8860B 132deg, #CD7F32 132deg, #CD7F32 138deg, #B8860B 138deg, #B8860B 144deg, #CD7F32 144deg, #CD7F32 150deg, #B8860B 150deg, #B8860B 156deg, #CD7F32 156deg, #CD7F32 162deg, #B8860B 162deg, #B8860B 168deg, #CD7F32 168deg, #CD7F32 174deg, #B8860B 174deg, #B8860B 180deg, #CD7F32 180deg, #CD7F32 186deg, #B8860B 186deg, #B8860B 192deg, #CD7F32 192deg, #CD7F32 198deg, #B8860B 198deg, #B8860B 204deg, #CD7F32 204deg, #CD7F32 210deg, #B8860B 210deg, #B8860B 216deg, #CD7F32 216deg, #CD7F32 222deg, #B8860B 222deg, #B8860B 228deg, #CD7F32 228deg, #CD7F32 234deg, #B8860B 234deg, #B8860B 240deg, #CD7F32 240deg, #CD7F32 246deg, #B8860B 246deg, #B8860B 252deg, #CD7F32 252deg, #CD7F32 258deg, #B8860B 258deg, #B8860B 264deg, #CD7F32 264deg, #CD7F32 270deg, #B8860B 270deg, #B8860B 276deg, #CD7F32 276deg, #CD7F32 282deg, #B8860B 282deg, #B8860B 288deg, #CD7F32 288deg, #CD7F32 294deg, #B8860B 294deg, #B8860B 300deg, #CD7F32 300deg, #CD7F32 306deg, #B8860B 306deg, #B8860B 312deg, #CD7F32 312deg, #CD7F32 318deg, #B8860B 318deg, #B8860B 324deg, #CD7F32 324deg, #CD7F32 330deg, #B8860B 330deg, #B8860B 336deg, #CD7F32 336deg, #CD7F32 342deg, #B8860B 342deg, #B8860B 348deg, #CD7F32 348deg, #CD7F32 354deg, #B8860B 354deg, #B8860B 360deg)',
                    zIndex: 1
                  }} />
                )}
                {/* Custom coin face for each material */}
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: material.id === 'penny' ? 'linear-gradient(135deg, #CD7F32 0%, #B8860B 100%)' :
                             material.id === 'graphite' ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' :
                             material.id === 'poker-chip' ? 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)' :
                             material.id === 'silver-dollar' ? 'linear-gradient(135deg, #C0C0C0 0%, #E5E4E2 100%)' :
                             material.id === 'titanium' ? 'linear-gradient(135deg, #E5E4E2 0%, #F5F5F5 100%)' :
                             'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: material.id === 'penny' ? '2rem' : '1.5rem',
                  fontWeight: 'bold',
                  color: material.id === 'penny' ? '#8B4513' : 
                         material.id === 'graphite' ? '#FFFFFF' :
                         material.id === 'poker-chip' ? '#FFFFFF' :
                         material.id === 'silver-dollar' ? '#000000' :
                         material.id === 'titanium' ? '#000000' : '#000',
                  zIndex: 2,
                  position: 'relative',
                  border: material.id === 'poker-chip' ? '2px solid #FFFFFF' : 'none'
                }}>
                  {material.id === 'penny' && '1¢'}
                  {material.id === 'graphite' && '●'}
                  {material.id === 'poker-chip' && '♠'}
                  {material.id === 'silver-dollar' && '$'}
                  {material.id === 'titanium' && 'Ti'}
                </div>
              </div>
            </div>
            
            {/* Material Info */}
            <div style={{
              color: '#fff',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                marginBottom: '0.25rem'
              }}>
                {material.name}
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#FFD700',
                marginBottom: '0.5rem'
              }}>
                {material.description}
              </div>
            </div>

            {/* Physics Stats */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginBottom: '0.75rem'
            }}>
              <div style={{
                fontSize: '0.8rem',
                color: '#fff',
                opacity: 0.9,
                lineHeight: '1.4'
              }}>
                {material.characteristics}
              </div>
            </div>

            {/* Edge Color Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem',
              color: '#fff',
              opacity: 0.8
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: material.edgeColor,
                border: '1px solid rgba(255,255,255,0.3)'
              }} />
              <span>Edge Color</span>
            </div>

            {/* Selection Indicator */}
            {selectedMaterialType === material.id && (
              <div style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#00ff88',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: '#000'
              }}>
                ✓
              </div>
            )}
          </div>
        ))}
      </div>

      
    </div>
  )
}

export default CoinMaterialSelector 