import React from 'react'
import styled from '@emotion/styled'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import hazeVideo from '../../Images/Video/haze.webm'

const LandingContainer = styled.div`
  min-height: 100vh;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;
`

const BackgroundVideo = styled.video`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  opacity: 0.7;
`

const ContentBox = styled.div`
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid ${props => props.theme.colors.neonGreen};
  border-radius: 1rem;
  padding: 2rem;
  max-width: 90%;
  width: 400px;
  backdrop-filter: blur(10px);
  animation: neonPulse 2s infinite;
`

const Title = styled.h1`
  color: ${props => props.theme.colors.neonGreen};
  font-size: 2rem;
  margin-bottom: 1.5rem;
  text-shadow: 0 0 10px ${props => props.theme.colors.neonGreen};
`

const Description = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 2rem;
  line-height: 1.5;
`

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Button = styled.button`
  background: ${props => props.primary ? props.theme.colors.neonGreen : 'transparent'};
  color: ${props => props.primary ? '#000' : props.theme.colors.neonGreen};
  border: 2px solid ${props => props.theme.colors.neonGreen};
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 20px ${props => props.theme.colors.neonGreen};
  }
`

const MobileLanding = ({ onContinue }) => {
  const handleMetaMask = () => {
    const metamaskUrl = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`
    window.location.href = metamaskUrl
  }

  return (
    <ThemeProvider theme={theme}>
      <LandingContainer>
        <BackgroundVideo autoPlay loop muted playsInline>
          <source src={hazeVideo} type="video/webm" />
        </BackgroundVideo>
        <ContentBox>
          <Title>Welcome to FLIPNOSIS</Title>
          <Description>
            For the best experience, we recommend using MetaMask mobile browser.
            You can continue to the site, but some features will be limited.
          </Description>
          <ButtonContainer>
            <Button primary onClick={handleMetaMask}>
              🦊 Open in MetaMask
            </Button>
            <Button onClick={onContinue}>
              Continue to Site
            </Button>
          </ButtonContainer>
        </ContentBox>
      </LandingContainer>
    </ThemeProvider>
  )
}

export default MobileLanding 