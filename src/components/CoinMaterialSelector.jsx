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
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem'
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
                border: `4px solid ${material.edgeColor}`,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 20px ${material.edgeColor}40`
              }}>
                {/* Coin face placeholder */}
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#000'
                }}>
                  $
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

      {/* Physics Legend */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: 'rgba(255, 215, 0, 0.1)',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        borderRadius: '0.5rem'
      }}>
        <div style={{
          color: '#FFD700',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          textAlign: 'center'
        }}>
          Physics Guide
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.5rem',
          fontSize: '0.8rem',
          color: '#fff',
          opacity: 0.8
        }}>
          <div>• <strong>Light coins:</strong> Fast, unpredictable, high skill</div>
          <div>• <strong>Medium coins:</strong> Balanced, reliable, all levels</div>
          <div>• <strong>Heavy coins:</strong> Slow, controlled, predictable</div>
        </div>
      </div>
    </div>
  )
}

export default CoinMaterialSelector 