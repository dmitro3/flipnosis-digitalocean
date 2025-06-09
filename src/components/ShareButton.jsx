import React, { useState } from 'react'
import { theme } from '../styles/theme'

const ShareButton = ({ gameId, gameData }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  
  const gameUrl = `${window.location.origin}/game/${gameId}`
  const gameTitle = `Check out this epic NFT flip game!`
  const gameDescription = `${gameData?.nft?.name || 'NFT'} vs ${gameData?.priceUSD || '0'} USD - Best of ${gameData?.rounds || 5} rounds!`
  
  const shareTexts = {
    twitter: `🎮 ${gameTitle}\n\n💎 ${gameDescription}\n\n🔥 Join the flip battle now!\n\n${gameUrl}\n\n#FLIPNOSIS #NFTGaming #Web3`,
    telegram: `🎮 ${gameTitle}\n\n💎 ${gameDescription}\n\n🔥 Join the flip battle now!\n\n${gameUrl}`
  }
  
  const handleShare = (platform) => {
    let url = ''
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTexts.twitter)}`
        break
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${encodeURIComponent(shareTexts.telegram)}`
        break
      case 'copy':
        navigator.clipboard.writeText(gameUrl).then(() => {
          alert('Link copied to clipboard!')
        }).catch(() => {
          alert('Failed to copy link')
        })
        return
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400')
    }
    
    setShowDropdown(false)
  }
  
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          background: 'linear-gradient(45deg, #00FF41, #39FF14)',
          color: 'white',
          border: '2px solid #00FF41',
          borderRadius: '0.75rem',
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 0 10px rgba(0, 255, 65, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-2px)'
          e.target.style.boxShadow = '0 0 20px rgba(0, 255, 65, 0.5)'
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0)'
          e.target.style.boxShadow = '0 0 10px rgba(0, 255, 65, 0.3)'
        }}
      >
        🚀 Share Game
      </button>
      
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          marginTop: '0.5rem',
          background: 'rgba(0, 0, 0, 0.95)',
          border: '1px solid rgba(0, 255, 65, 0.3)',
          borderRadius: '0.75rem',
          padding: '0.5rem',
          minWidth: '200px',
          zIndex: 1000,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
        }}>
          <button
            onClick={() => handleShare('twitter')}
            style={{
              width: '100%',
              background: 'linear-gradient(45deg, #1DA1F2, #0d8bd9)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginBottom: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            🐦 Share on X (Twitter)
          </button>
          
          <button
            onClick={() => handleShare('telegram')}
            style={{
              width: '100%',
              background: 'linear-gradient(45deg, #0088cc, #006699)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginBottom: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            📱 Share on Telegram
          </button>
          
          <button
            onClick={() => handleShare('copy')}
            style={{
              width: '100%',
              background: 'linear-gradient(45deg, #666, #888)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            📋 Copy Link
          </button>
        </div>
      )}
    </div>
  )
}

export default ShareButton 