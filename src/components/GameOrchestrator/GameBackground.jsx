import React from 'react'
import styled from '@emotion/styled'
import hazeVideo from '../../../Images/Video/haze.webm'
import mobileVideo from '../../../Images/Video/Mobile/mobile.webm'

const BackgroundVideo = styled.video`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  z-index: -1;
  opacity: 0.7;
  pointer-events: none;
`

const GameBackground = ({ isMobile }) => {
  return (
    <BackgroundVideo autoPlay muted loop playsInline>
      <source src={isMobile ? mobileVideo : hazeVideo} type="video/webm" />
    </BackgroundVideo>
  )
}

export default GameBackground 