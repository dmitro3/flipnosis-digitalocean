import React, { useState } from 'react'
import { theme } from '../styles/theme'

const NFTVerificationDisplay = ({ nftData, chainConfig }) => {
  if (!nftData) {
    return (
      <div style={{ color: '#888', textAlign: 'center', padding: '1rem' }}>
        NFT data not available
      </div>
    )
  }

  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedText, setCopiedText] = useState('')

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label)
    setTimeout(() => setCopiedText(''), 2000)
  }

  const formatRarity = (rarity) => {
    if (!rarity) return 'N/A'
    return `${(rarity * 100).toFixed(2)}%`
  }

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '12px',
      padding: '16px',
      color: '#fff',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header with verification badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>
          {nftData.name || 'Unnamed NFT'}
        </h3>
      </div>

      {/* Quick info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>Collection</div>
          <div style={{ fontWeight: 'bold' }}>{nftData.collection || 'Unknown'}</div>
        </div>
        <div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>Token ID</div>
          <div style={{ fontWeight: 'bold' }}>#{nftData.tokenId}</div>
        </div>
      </div>

      {/* Quick links */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <a
          href={`${chainConfig.explorerUrl}/token/${nftData.contractAddress}?a=${nftData.tokenId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            textDecoration: 'none',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          🔍 Explorer
        </a>
        <a
          href={`${chainConfig.marketplaceUrl}/${nftData.contractAddress}/${nftData.tokenId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            textDecoration: 'none',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          🛍️ OpenSea
        </a>
      </div>

      {/* Expandable section */}
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: '8px',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px'
          }}
        >
          <span>View Details</span>
          <span>{isExpanded ? '▲' : '▼'}</span>
        </button>

        {isExpanded && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px'
          }}>
            {/* Contract Info */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>
                Contract Address
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                wordBreak: 'break-all'
              }}>
                <span>{`${nftData.contractAddress.slice(0, 6)}...${nftData.contractAddress.slice(-4)}`}</span>
                <button
                  onClick={() => copyToClipboard(nftData.contractAddress, 'contract')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  {copiedText === 'contract' ? '✓' : '📋'}
                </button>
              </div>
            </div>

            {/* Metadata */}
            {nftData.metadata?.description && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>
                  Description
                </div>
                <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  {nftData.metadata.description}
                </div>
              </div>
            )}

            {/* Attributes */}
            {nftData.metadata?.attributes?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>
                  Attributes
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '8px'
                }}>
                  {nftData.metadata.attributes.map((attr, index) => (
                    <div
                      key={index}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '8px',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ opacity: 0.8 }}>{attr.trait_type}</div>
                      <div style={{ fontWeight: 'bold' }}>{attr.value}</div>
                      {attr.rarity && (
                        <div style={{ fontSize: '10px', opacity: 0.6 }}>
                          Rarity: {formatRarity(attr.rarity)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Status */}
            <div>
              <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>
                Verification Status
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: theme.colors.neonGreen
                }} />
                <span>Verified on {chainConfig.name}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NFTVerificationDisplay 