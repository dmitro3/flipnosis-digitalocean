import React, { useState, useEffect } from 'react'
import { useProfile } from '../contexts/ProfileContext'
import { useWallet } from '../contexts/WalletContext'

const CoinSelector = ({ 
  onCoinSelect, 
  selectedCoin = null,
  showCustomOption = true 
}) => {
  const { address } = useWallet()
  const { getCoinHeadsImage, getCoinTailsImage } = useProfile()
  const [customHeadsImage, setCustomHeadsImage] = useState(null)
  const [customTailsImage, setCustomTailsImage] = useState(null)
  const [selectedCoinType, setSelectedCoinType] = useState(selectedCoin?.type || null)

  // Default coin options
  const defaultCoins = [
    {
      id: 'plain',
      type: 'default',
      name: 'Classic',
      headsImage: '/coins/plainh.png',
      tailsImage: '/coins/plaint.png'
    },
    {
      id: 'skull',
      type: 'default', 
      name: 'Skull',
      headsImage: '/coins/skullh.png',
      tailsImage: '/coins/skullt.png'
    },
    {
      id: 'trump',
      type: 'default',
      name: 'Trump',
      headsImage: '/coins/trumpheads.webp',
      tailsImage: '/coins/trumptails.webp'
    },
    {
      id: 'mario',
      type: 'default',
      name: 'Mario Bros',
      headsImage: '/coins/mario.png',
      tailsImage: '/coins/luigi.png'
    }
  ]

  // Load user's custom coin images
  useEffect(() => {
    const loadCustomCoin = async () => {
      if (!address) return
      
      try {
        console.log('🪙 Loading custom coin for address:', address)
        const headsImage = await getCoinHeadsImage(address)
        const tailsImage = await getCoinTailsImage(address)
        console.log('🪙 Custom coin loaded:', { 
          hasHeads: !!headsImage, 
          hasTails: !!tailsImage,
          headsLength: headsImage?.length || 0,
          tailsLength: tailsImage?.length || 0
        })
        setCustomHeadsImage(headsImage)
        setCustomTailsImage(tailsImage)
      } catch (error) {
        console.error('Error loading custom coin:', error)
      }
    }

    loadCustomCoin()
  }, [address, getCoinHeadsImage, getCoinTailsImage])

  const handleCoinSelect = (coin) => {
    setSelectedCoinType(coin.id)
    
    // For default coins, only send the essential data (not large image data)
    if (coin.type === 'default') {
      const optimizedCoin = {
        id: coin.id,
        type: coin.type,
        name: coin.name,
        headsImage: coin.headsImage, // These are just paths, not large data
        tailsImage: coin.tailsImage
      }
      onCoinSelect(optimizedCoin)
    } else {
      // For custom coins, send the full data (which includes base64 images)
      onCoinSelect(coin)
    }
  }

  const hasCustomCoin = customHeadsImage || customTailsImage
  
  console.log('🪙 CoinSelector state:', {
    address,
    hasCustomCoin,
    customHeadsImage: !!customHeadsImage,
    customTailsImage: !!customTailsImage,
    showCustomOption,
    selectedCoinType
  })

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
        marginBottom: '1.5rem',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}>
        Choose Your Coin Design
      </h3>
      
      <p style={{
        color: '#fff',
        textAlign: 'center',
        marginBottom: '2rem',
        fontSize: '0.9rem',
        opacity: 0.8
      }}>
        Both players will see this coin design during the game
      </p>

      {/* Default Coins Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1.5rem',
        marginBottom: showCustomOption && hasCustomCoin ? '2rem' : '0'
      }}>
        {defaultCoins.map((coin) => (
          <div
            key={coin.id}
            onClick={() => handleCoinSelect(coin)}
            style={{
              background: selectedCoinType === coin.id ? 
                'rgba(255, 215, 0, 0.2)' : 
                'rgba(255, 255, 255, 0.05)',
              border: selectedCoinType === coin.id ? 
                '2px solid #FFD700' : 
                '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center'
            }}
          >
            {/* Coin Preview */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              {/* Heads */}
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                backgroundImage: `url(${coin.headsImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '3px solid #FFD700',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: '-25px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.8rem',
                  color: '#FFD700',
                  fontWeight: 'bold'
                }}>
                  H
                </div>
              </div>
              
              {/* Tails */}
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                backgroundImage: `url(${coin.tailsImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '3px solid #FFD700',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: '-25px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.8rem',
                  color: '#FFD700',
                  fontWeight: 'bold'
                }}>
                  T
                </div>
              </div>
            </div>
            
            {/* Coin Info */}
            <div style={{
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              {coin.name}
            </div>
          </div>
        ))}
      </div>

      {/* Custom Coin Option */}
      {showCustomOption && hasCustomCoin && (
        <>
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.3), transparent)',
            margin: '2rem 0'
          }} />
          
          <div
            onClick={() => handleCoinSelect({
              id: 'custom',
              type: 'custom',
              name: 'Your Custom Coin',
              headsImage: customHeadsImage || '/coins/plainh.png', // Fallback to default if missing
              tailsImage: customTailsImage || '/coins/plaint.png', // Fallback to default if missing
              description: 'Your personal coin design'
            })}
            style={{
              background: selectedCoinType === 'custom' ? 
                'rgba(255, 215, 0, 0.2)' : 
                'rgba(255, 255, 255, 0.05)',
              border: selectedCoinType === 'custom' ? 
                '2px solid #FFD700' : 
                '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center'
            }}
          >
            {/* Custom Coin Preview */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              {/* Custom Heads */}
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundImage: customHeadsImage ? `url(${customHeadsImage})` : 'none',
                backgroundColor: customHeadsImage ? 'transparent' : 'rgba(255, 215, 0, 0.2)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '4px solid #FFD700',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {!customHeadsImage && (
                  <div style={{
                    color: '#FFD700',
                    fontSize: '2rem',
                    fontWeight: 'bold'
                  }}>
                    ?
                  </div>
                )}
                <div style={{
                  position: 'absolute',
                  bottom: '-30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.9rem',
                  color: '#FFD700',
                  fontWeight: 'bold'
                }}>
                  HEADS
                </div>
              </div>
              
              {/* Custom Tails */}
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundImage: customTailsImage ? `url(${customTailsImage})` : 'none',
                backgroundColor: customTailsImage ? 'transparent' : 'rgba(255, 215, 0, 0.2)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '4px solid #FFD700',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {!customTailsImage && (
                  <div style={{
                    color: '#FFD700',
                    fontSize: '2rem',
                    fontWeight: 'bold'
                  }}>
                    ?
                  </div>
                )}
                <div style={{
                  position: 'absolute',
                  bottom: '-30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.9rem',
                  color: '#FFD700',
                  fontWeight: 'bold'
                }}>
                  TAILS
                </div>
              </div>
            </div>
            
            {/* Custom Coin Info */}
            <div style={{
              color: '#FFD700',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              ✨ Your Custom Coin
            </div>
            <div style={{
              color: '#fff',
              fontSize: '0.8rem',
              opacity: 0.8
            }}>
              Use your personalized coin design
            </div>
          </div>
        </>
      )}

      {/* No Custom Coin Message */}
      {showCustomOption && !hasCustomCoin && (
        <>
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.3), transparent)',
            margin: '2rem 0'
          }} />
          
          <div style={{
            padding: '1.5rem',
            background: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '1rem',
            textAlign: 'center'
          }}>
            <div style={{
              color: '#FFD700',
              fontSize: '1rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              💡 Want to use a custom coin?
            </div>
            <div style={{
              color: '#fff',
              fontSize: '0.9rem',
              opacity: 0.8
            }}>
              Go to your profile and upload custom heads & tails images to unlock this option!
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default CoinSelector 