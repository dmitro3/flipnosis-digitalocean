import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import styled from '@emotion/styled'

const LayoutContainer = styled.div`
  min-height: 100vh;
  background: #000;
  color: #fff;
  position: relative;
  overflow-x: hidden;
`

const MainContent = styled.main`
  padding-top: 1rem;
`

const Layout = () => {
  return (
    <LayoutContainer>
      <Header />
      <MainContent>
        <Outlet />
      </MainContent>
    </LayoutContainer>
  )
}

export default Layout 