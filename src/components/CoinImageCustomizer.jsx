import React, { useState, useRef } from 'react'

const CoinImageCustomizer = ({ 
  onHeadsImageChange, 
  onTailsImageChange,
  currentHeadsImage = null,
  currentTailsImage = null 
}) => {
  const [headsPreview, setHeadsPreview] = useState(currentHeadsImage)
  const [tailsPreview, setTailsPreview] = useState(currentTailsImage)
  const [activeTab, setActiveTab] = useState('heads')
  const headsInputRef = useRef(null)
  const tailsInputRef = useRef(null)
  
  const handleImageUpload = (event, side) => {
    const file = event.target.files[0]
    if (!file) return
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageData = e.target.result
      
      // Create a smaller version for performance
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const maxSize = 512
        
        let width = img.width
        let height = img.height
        
        // Calculate new dimensions
        if (width > height) {
          if (width > maxSize) {
            height = height * (maxSize / width)
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = width * (maxSize / height)
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height)
        
        const resizedImage = canvas.toDataURL('image/jpeg', 0.9)
        
        if (side === 'heads') {
          setHeadsPreview(resizedImage)
          onHeadsImageChange(resizedImage)
        } else {
          setTailsPreview(resizedImage)
          onTailsImageChange(resizedImage)
        }
      }
      img.src = imageData
    }
    reader.readAsDataURL(file)
  }
  
  const removeImage = (side) => {
    if (side === 'heads') {
      setHeadsPreview(null)
      onHeadsImageChange(null)
    } else {
      setTailsPreview(null)
      onTailsImageChange(null)
    }
  }
  
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 215, 0, 0.3)',
      borderRadius: '1rem',
      padding: '2rem',
      maxWidth: '500px',
      margin: '0 auto'
    }}>
      <h3 style={{
        color: '#FFD700',
        textAlign: 'center',
        marginBottom: '1.5rem',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}>
        Customize Your Coin
      </h3>
      
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        marginBottom: '2rem',
        borderBottom: '2px solid rgba(255, 215, 0, 0.3)'
      }}>
        <button
          onClick={() => setActiveTab('heads')}
          style={{
            flex: 1,
            padding: '1rem',
            background: activeTab === 'heads' ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
            border: 'none',
            color: activeTab === 'heads' ? '#FFD700' : '#fff',
            fontSize: '1.1rem',
            fontWeight: activeTab === 'heads' ? 'bold' : 'normal',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            borderBottom: activeTab === 'heads' ? '2px solid #FFD700' : 'none',
            marginBottom: '-2px'
          }}
        >
          Heads
        </button>
        <button
          onClick={() => setActiveTab('tails')}
          style={{
            flex: 1,
            padding: '1rem',
            background: activeTab === 'tails' ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
            border: 'none',
            color: activeTab === 'tails' ? '#FFD700' : '#fff',
            fontSize: '1.1rem',
            fontWeight: activeTab === 'tails' ? 'bold' : 'normal',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            borderBottom: activeTab === 'tails' ? '2px solid #FFD700' : 'none',
            marginBottom: '-2px'
          }}
        >
          Tails
        </button>
      </div>
      
      {/* Content Area */}
      <div style={{ minHeight: '300px' }}>
        {activeTab === 'heads' ? (
          <div>
            <div style={{
              width: '200px',
              height: '200px',
              margin: '0 auto 2rem',
              borderRadius: '50%',
              border: '3px solid #FFD700',
              overflow: 'hidden',
              background: headsPreview ? 'transparent' : 'linear-gradient(45deg, #FFD700, #DAA520)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={() => headsInputRef.current?.click()}
            >
              {headsPreview ? (
                <img 
                  src={headsPreview} 
                  alt="Heads" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: '#8B4513'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>+</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>Add Image</div>
                  <div style={{ fontSize: '0.8rem' }}>HEADS</div>
                </div>
              )}
            </div>
            
            <input
              ref={headsInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'heads')}
              style={{ display: 'none' }}
            />
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => headsInputRef.current?.click()}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#000',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {headsPreview ? 'Change Image' : 'Upload Image'}
              </button>
              
              {headsPreview && (
                <button
                  onClick={() => removeImage('heads')}
                  style={{
                    padding: '0.75rem 2rem',
                    background: 'rgba(255, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 0, 0, 0.5)',
                    borderRadius: '0.5rem',
                    color: '#ff6b6b',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              width: '200px',
              height: '200px',
              margin: '0 auto 2rem',
              borderRadius: '50%',
              border: '3px solid #FFD700',
              overflow: 'hidden',
              background: tailsPreview ? 'transparent' : 'linear-gradient(45deg, #FFD700, #DAA520)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={() => tailsInputRef.current?.click()}
            >
              {tailsPreview ? (
                <img 
                  src={tailsPreview} 
                  alt="Tails" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: '#8B4513'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>+</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>Add Image</div>
                  <div style={{ fontSize: '0.8rem' }}>TAILS</div>
                </div>
              )}
            </div>
            
            <input
              ref={tailsInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'tails')}
              style={{ display: 'none' }}
            />
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => tailsInputRef.current?.click()}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#000',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {tailsPreview ? 'Change Image' : 'Upload Image'}
              </button>
              
              {tailsPreview && (
                <button
                  onClick={() => removeImage('tails')}
                  style={{
                    padding: '0.75rem 2rem',
                    background: 'rgba(255, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 0, 0, 0.5)',
                    borderRadius: '0.5rem',
                    color: '#ff6b6b',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: 'rgba(255, 215, 0, 0.1)',
        borderRadius: '0.5rem',
        fontSize: '0.9rem',
        color: '#FFD700',
        textAlign: 'center'
      }}>
        <p style={{ margin: '0 0 0.5rem 0' }}>
          💡 <strong>Tip:</strong> Square images work best. Images will be automatically resized and cropped to fit the coin.
        </p>
        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>
          Maximum file size: 5MB • Supported formats: JPG, PNG, GIF
        </p>
      </div>
    </div>
  )
}

export default CoinImageCustomizer 