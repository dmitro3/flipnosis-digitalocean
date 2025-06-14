import React from 'react'
import { useWallet } from '../contexts/WalletContext'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import {
  Container,
  ContentWrapper,
  GlassCard,
  NeonText,
  Button,
  Grid,
  GameCard,
  GameImage,
  LoadingSpinner
} from '../styles/components'

const NFTSelector = ({ isOpen, onClose, onSelect, nfts = [], loading = false }) => {
  const { chain, chains } = useWallet()

  if (!isOpen) return null

  return (
    <ThemeProvider theme={theme}>
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '1rem'
      }}>
        <GlassCard style={{
          width: '100%',
          maxWidth: '1200px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <NeonText style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                Select NFT
              </NeonText>
              <p style={{ color: theme.colors.textSecondary }}>
                Choose an NFT from your {chains[chain]?.name || 'wallet'}
              </p>
            </div>
            <Button
              onClick={onClose}
              style={{ padding: '0.5rem' }}
            >
              ✕
            </Button>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '0.5rem'
          }}>
            {loading ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem'
              }}>
                {[...Array(6)].map((_, i) => (
                  <GlassCard key={i} style={{ padding: '1rem' }}>
                    <div style={{
                      width: '100%',
                      height: '200px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '0.5rem',
                      marginBottom: '1rem'
                    }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{
                        height: '1rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '0.25rem',
                        width: '75%'
                      }} />
                      <div style={{
                        height: '1rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '0.25rem',
                        width: '50%'
                      }} />
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : !nfts || nfts.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 0',
                color: theme.colors.textSecondary
              }}>
                <p style={{ fontSize: '1.125rem' }}>
                  No NFTs found in your {chains[chain]?.name || 'wallet'}
                </p>
              </div>
            ) : (
              <Grid>
                {nfts.map((nft) => (
                  <GameCard
                    key={`${nft.contractAddress}-${nft.tokenId}`}
                    onClick={() => {
                      onSelect(nft)
                      onClose()
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <GameImage
                      src={nft.image}
                      alt={nft.name}
                      onError={(e) => {
                        console.error('❌ Image failed to load:', nft.image)
                        e.target.src = '/placeholder-nft.svg'
                      }}
                      onLoad={() => {
                        console.log('✅ Image loaded successfully:', nft.image)
                      }}
                    />
                    <div style={{ padding: '1rem' }}>
                      <h3 style={{
                        color: theme.colors.textPrimary,
                        fontWeight: 600,
                        marginBottom: '0.25rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {nft.name}
                      </h3>
                      <p style={{
                        color: theme.colors.textSecondary,
                        fontSize: '0.875rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {nft.collection}
                      </p>
                      <div style={{
                        marginTop: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: theme.colors.textSecondary
                      }}>
                        <span>Token ID:</span>
                        <span style={{ color: theme.colors.textPrimary }}>
                          #{nft.tokenId}
                        </span>
                      </div>
                    </div>
                  </GameCard>
                ))}
              </Grid>
            )}
          </div>
        </GlassCard>
      </div>
    </ThemeProvider>
  )
}

export default NFTSelector 