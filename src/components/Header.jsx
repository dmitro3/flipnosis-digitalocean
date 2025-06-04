import React from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import styled from '@emotion/styled'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'

const HeaderContainer = styled.header`
  background-color: ${props => props.theme.colors.bgDark};
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 100;
`

const Logo = styled(Link)`
  color: ${props => props.theme.colors.neonPink};
  font-size: 1.5rem;
  font-weight: 700;
  text-decoration: none;
  letter-spacing: 1px;
  animation: neonPulse 2s infinite;
  ${props => props.theme.animations.neonPulse}
`

const CreateButton = styled(Link)`
  background: linear-gradient(45deg, ${props => props.theme.colors.neonPink}, ${props => props.theme.colors.neonBlue});
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 0.75rem;
  text-decoration: none;
  font-weight: 600;
  transition: ${props => props.theme.transitions.default};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transform: translateX(-100%);
    transition: ${props => props.theme.transitions.default};
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.neon};
    
    &::before {
      transform: translateX(100%);
    }
  }
`

const WalletSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const WalletButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: ${props => props.theme.colors.neonPink};
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: ${props => props.theme.transitions.default};
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: ${props => props.theme.colors.neonPink};
    box-shadow: ${props => props.theme.shadows.neon};
  }
`

const WalletInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
`

const WalletAddress = styled.div`
  color: ${props => props.theme.colors.neonPink};
  font-weight: 500;
  font-family: monospace;
`

const ChainIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem;
`

const ChainDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => 
    props.chain === 'ethereum' ? '#627EEA' :
    props.chain === 'polygon' ? '#8247E5' :
    props.chain === 'arbitrum' ? '#28A0F0' :
    props.chain === 'optimism' ? '#FF0420' :
    props.chain === 'bnb' ? '#F3BA2F' :
    props.chain === 'avalanche' ? '#E84142' :
    props.chain === 'base' ? '#0052FF' : '#666'
  };
`

const Header = () => {
  const { address, connectWallet, disconnectWallet, isConnected, chain, chains, loading } = useWallet()

  const handleConnect = async () => {
    try {
      await connectWallet() // Let it use whatever chain the user is currently on
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <HeaderContainer>
        <Logo to="/">FLIPNOSIS</Logo>
        
        <CreateButton to="/create">
          Create Flip
        </CreateButton>
        
        <WalletSection>
          {isConnected && address ? (
            <>
              <WalletInfo>
                <ChainIndicator>
                  <ChainDot chain={chain} />
                  <span>{chains[chain]?.name || 'Unknown'}</span>
                </ChainIndicator>
                <WalletAddress>
                  {address.slice(0, 6)}...{address.slice(-4)}
                </WalletAddress>
              </WalletInfo>
              <WalletButton onClick={disconnectWallet}>
                Disconnect
              </WalletButton>
            </>
          ) : (
            <WalletButton onClick={handleConnect} disabled={loading}>
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </WalletButton>
          )}
        </WalletSection>
      </HeaderContainer>
    </ThemeProvider>
  )
}

export default Header 