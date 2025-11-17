import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { useNavigate } from 'react-router-dom'
import { ThemeProvider } from '@emotion/react'
import styled from '@emotion/styled'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import contractService from '../services/ContractService'
import NFTSelector from '../components/NFTSelector'
import { theme } from '../styles/theme'
import { API_CONFIG, getApiUrl } from '../config/api'
import {
  Container,
  ContentWrapper,
  GlassCard,
  NeonText,
  Button,
  FormGroup,
  Label,
  Input,
  LoadingSpinner
} from '../styles/components'

// Battle Royale specific styled components
const BattleContainer = styled.div`
  background: linear-gradient(135deg, rgba(10, 15, 35, 0.95), rgba(16, 33, 62, 0.95));
  border: 3px solid #00ffff;
  border-radius: 20px;
  overflow: visible;
  box-shadow: 0 0 50px rgba(0, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  min-height: 90vh;
  padding: 1.5rem;

  @media (max-width: 768px) {
    padding: 1rem;
    min-height: auto;
    border-radius: 15px;
    overflow: visible;
  }
`

// New 5-box layout: 3 boxes top (NFT small, Room Size small, Room), 2 boxes bottom
const FourBoxGrid = styled.div`
  display: grid;
  grid-template-columns: 0.8fr 0.8fr 1.4fr; /* NFT and Size smaller, Room larger */
  grid-template-rows: auto auto;
  gap: 1.5rem;
  margin-top: 1.5rem;

  /* Flip Price spans first 2 columns */
  > :nth-child(4) {
    grid-column: span 2;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto auto auto;
    gap: 1rem;
    margin-top: 1rem;

    /* Reset column span on mobile */
    > :nth-child(4) {
      grid-column: span 1;
    }
  }
`

/* Remove ThinBox - not needed anymore */

const Box = styled.div`
  background: linear-gradient(135deg, rgba(10, 15, 35, 0.8), rgba(16, 33, 62, 0.8));
  border: 2px solid #9d00ff;
  border-radius: 16px;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  min-height: 200px;
  max-height: 250px;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(157, 0, 255, 0.3);
  overflow: auto;

  &:hover {
    border-color: #00ffff;
    box-shadow: 0 0 40px rgba(0, 255, 255, 0.5);
    transform: translateY(-2px);
  }

  /* Make the Flip Price container (bottom left) taller and scrollable */
  &:nth-child(4) {
    min-height: 375px;
    max-height: 450px;
    overflow-y: auto;
  }

  @media (max-width: 1024px) {
    padding: 0.9rem;

    &:nth-child(4) {
      min-height: auto;
      max-height: none;
    }
  }

  @media (max-width: 768px) {
    padding: 1rem;
    min-height: auto;
    max-height: none;

    /* Reset height constraints on mobile */
    &:nth-child(4) {
      min-height: auto;
      max-height: none;
    }
  }
`

const BoxTitle = styled.h3`
  color: #00ffff;
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0 0 0.8rem 0;
  text-align: center;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
  font-family: 'Orbitron', sans-serif;

  @media (max-width: 1024px) {
    font-size: 1.2rem;
    margin: 0 0 0.6rem 0;
  }

  @media (max-width: 768px) {
    font-size: 1.1rem;
    margin: 0 0 0.5rem 0;
  }
`

// NFT Upload Box
const NFTUploadArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;

  @media (max-width: 768px) {
    min-height: 100px;
  }
`

const SquareUploadZone = styled.div`
  width: 100px;
  height: 100px;
  border: 2px dashed #00ffff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  @media (max-width: 768px) {
    width: 80px;
    height: 80px;
    border-radius: 8px;
  }
  transition: all 0.3s ease;
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(157, 0, 255, 0.1));
  margin-bottom: 0.8rem;
  backdrop-filter: blur(5px);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
  
  &:hover {
    border-color: #9d00ff;
    background: linear-gradient(135deg, rgba(157, 0, 255, 0.2), rgba(0, 255, 255, 0.2));
    box-shadow: 0 0 30px rgba(157, 0, 255, 0.4);
    transform: scale(1.05);
  }
`

const NFTPreviewSquare = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid #00ffff;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #9d00ff;
    box-shadow: 0 0 30px rgba(157, 0, 255, 0.6);
    transform: scale(1.05);
  }
`

// Pricing Box
const PricingContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`

const PriceInput = styled(Input)`
  margin-bottom: 0.8rem;
  text-align: center;
  font-size: 1.2rem;

  @media (max-width: 1024px) {
    font-size: 1.1rem;
  }

  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 0.6rem;
  }
`

const JoinButton = styled(Button)`
  background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
  margin-top: 0.8rem;
  width: 100%;
  font-size: 1.1rem;
  padding: 0.8rem;
  
  &:hover {
    background: linear-gradient(135deg, #00cc6a 0%, #00aa55 100%);
  }
`

// Room Selection Box
const RoomGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 0.4rem;
  flex: 1;

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: 0.3rem;
  }
`

const RoomOption = styled.div`
  aspect-ratio: 1;
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(157, 0, 255, 0.1));
  border: 2px solid #00ffff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 20px;
  backdrop-filter: blur(5px);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);

  &:hover {
    border-color: #9d00ff;
    background: linear-gradient(135deg, rgba(157, 0, 255, 0.2), rgba(0, 255, 255, 0.2));
    box-shadow: 0 0 20px rgba(157, 0, 255, 0.4);
    transform: scale(1.05);
  }
`

// Progress Box
const ProgressBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
`

const CompactProgressContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  position: relative;
  width: 100%;
  max-width: 320px;
`

const CompactStepCircle = styled.div`
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  border: 2px solid;
  
  ${props => {
    if (props.completed) {
      return `
        background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
        border-color: #00ff88;
        color: white;
        box-shadow: 0 0 15px rgba(0, 255, 136, 0.5);
      `
    } else if (props.active) {
      return `
        background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
        border-color: #ff1493;
        color: white;
        box-shadow: 0 0 15px rgba(255, 20, 147, 0.5);
      `
    } else {
      return `
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
        color: ${props.theme.colors.textSecondary};
      `
    }
  }}
`

const CompactProgressLine = styled.div`
  position: absolute;
  top: 22px;
  left: 22px;
  right: 22px;
  height: 2px;
  background: linear-gradient(90deg, 
    ${props => props.progress >= 50 ? '#00ff88' : 'rgba(255, 255, 255, 0.3)'} 0%, 
    ${props => props.progress >= 100 ? '#00ff88' : 'rgba(255, 255, 255, 0.3)'} 100%
  );
  border-radius: 1px;
  z-index: 1;
`

const CompactStepLabel = styled.div`
  text-align: center;
  font-size: 0.7rem;
  font-weight: 500;
  margin-top: 0.5rem;
  transition: all 0.3s ease;
  font-family: 'Orbitron', sans-serif;
  
  ${props => {
    if (props.completed) {
      return `color: #00ff88;`
    } else if (props.active) {
      return `color: #ff1493;`
    } else {
      return `color: rgba(255, 255, 255, 0.6);`
    }
  }}
`

// Styled components for progress steps (matching CreateFlip)
const ProgressContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  position: relative;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`

const ProgressStep = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
  flex: 1;
`

const StepCircle = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
  border: 3px solid;
  
  ${props => {
    if (props.completed) {
      return `
        background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
        border-color: #00ff88;
        color: white;
        box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
      `
    } else if (props.active) {
      return `
        background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
        border-color: #ff1493;
        color: white;
        box-shadow: 0 0 20px rgba(255, 20, 147, 0.5);
      `
    } else {
      return `
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
        color: ${props.theme.colors.textSecondary};
      `
    }
  }}
`

const StepLabel = styled.div`
  text-align: center;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.3s ease;
  
  ${props => {
    if (props.completed) {
      return `color: #00ff88;`
    } else if (props.active) {
      return `color: #ff1493;`
    } else {
      return `color: ${props.theme.colors.textSecondary};`
    }
  }}
`

const ProgressLine = styled.div`
  position: absolute;
  top: 25px;
  left: 25px;
  right: 25px;
  height: 3px;
  background: linear-gradient(90deg, 
    ${props => props.progress >= 50 ? '#00ff88' : 'rgba(255, 255, 255, 0.3)'} 0%, 
    ${props => props.progress >= 100 ? '#00ff88' : 'rgba(255, 255, 255, 0.3)'} 100%
  );
  border-radius: 2px;
  z-index: 1;
`

const BattleHeader = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(157, 0, 255, 0.2));
  border-radius: 20px;
  border: 3px solid #00ffff;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 40px rgba(0, 255, 255, 0.3);

  @media (max-width: 768px) {
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 15px;
  }
`

const BattleTitle = styled.h1`
  font-size: 5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ff1493, #ff69b4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 0.8rem 0;
  font-family: 'Hyperwave', sans-serif;
  text-shadow: 0 0 20px rgba(255, 20, 147, 0.8);

  @media (max-width: 768px) {
    font-size: 3.6rem;
    margin: 0 0 0.5rem 0;
  }
`

const BattleSubtitle = styled.p`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.3rem;
  margin: 0;
  font-family: 'Orbitron', sans-serif;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
`

const NFTPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px dashed ${props => props.theme.colors.neonPink};
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 20, 147, 0.05);

  &:hover {
    border-color: ${props => props.theme.colors.neonBlue};
    background: rgba(0, 191, 255, 0.05);
  }

  img {
    width: 60px;
    height: 60px;
    border-radius: 0.5rem;
    object-fit: cover;
  }

  div {
    flex: 1;
    
    h4 {
      color: ${props => props.theme.colors.textPrimary};
      margin: 0 0 0.25rem 0;
      font-size: 1rem;
    }
    
    p {
      color: ${props => props.theme.colors.textSecondary};
      margin: 0;
      font-size: 0.9rem;
    }
  }
`

const PlaceholderText = styled.div`
  color: ${props => props.theme.colors.textSecondary};
  font-style: italic;
  text-align: center;
  width: 100%;
`

const BattleSubmitButton = styled(Button)`
  margin-top: 1.5rem;
  width: 100%;
  background: linear-gradient(135deg, #ff1493, #ff69b4);
  border: 2px solid #ff1493;
  color: #fff;
  font-size: 1.3rem;
  padding: 1rem;
  border-radius: 12px;
  font-weight: bold;
  font-family: 'Orbitron', sans-serif;
  box-shadow: 0 0 20px rgba(255, 20, 147, 0.6);
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #ff69b4, #ff1493);
    box-shadow: 0 0 30px rgba(255, 20, 147, 0.8);
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 1024px) {
    font-size: 1.2rem;
    padding: 0.9rem;
  }

  @media (max-width: 768px) {
    font-size: 1.1rem;
    padding: 0.8rem;
  }
`

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(157, 0, 255, 0.1));
  border: 2px solid #00ffff;
  border-radius: 12px;
  margin-bottom: 1rem;
  backdrop-filter: blur(5px);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
  gap: 0.5rem;

  @media (max-width: 1024px) {
    padding: 0.8rem;
    flex-wrap: wrap;
  }

  @media (max-width: 768px) {
    padding: 0.7rem;
    flex-direction: column;
    align-items: flex-start;
  }
`

const ToggleLabel = styled.div`
  color: #00ffff;
  font-weight: 600;
  font-size: 1rem;
  font-family: 'Orbitron', sans-serif;
  text-shadow: 0 0 5px rgba(0, 255, 255, 0.3);

  @media (max-width: 1024px) {
    font-size: 0.95rem;
  }

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`

const ToggleDescription = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin-top: 0.25rem;
  font-family: 'Orbitron', sans-serif;

  @media (max-width: 1024px) {
    font-size: 0.85rem;
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
  flex-shrink: 0;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(157, 0, 255, 0.2));
    transition: .4s;
    border-radius: 34px;
    border: 2px solid #00ffff;
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }

  input:checked + .slider {
    background: linear-gradient(135deg, #00ff00, #39ff14);
    border-color: #00ff00;
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
  }

  input:checked + .slider:before {
    transform: translateX(26px);
  }

  @media (max-width: 768px) {
    margin-top: 0.5rem;
  }
`

const ModeSelector = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;

  @media (max-width: 1024px) {
    gap: 0.7rem;
    margin-bottom: 1.2rem;
  }

  @media (max-width: 768px) {
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
`

// Price Breakdown Box
const PriceBreakdownBox = styled.div`
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(157, 0, 255, 0.1));
  border: 2px solid #00ffff;
  border-radius: 12px;
  padding: 0.75rem;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  backdrop-filter: blur(5px);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);

  @media (max-width: 1200px) {
    font-size: 1rem;
    padding: 0.65rem;
  }

  @media (max-width: 768px) {
    font-size: 0.9rem;
    padding: 0.6rem;
    border-radius: 8px;
  }
`

const PriceBreakdownRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  gap: 0.5rem;

  @media (max-width: 768px) {
    flex-direction: ${props => props.allowWrap ? 'column' : 'row'};
    align-items: ${props => props.allowWrap ? 'flex-start' : 'center'};
    gap: 0.3rem;
  }
`

const PriceLabel = styled.span`
  word-break: break-word;
  flex-shrink: 0;

  @media (max-width: 768px) {
    font-size: 0.85rem;
  }
`

const PriceValue = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  word-break: break-all;

  @media (max-width: 768px) {
    font-size: 0.85rem;
  }
`

const PriceSubValue = styled.span`
  font-size: 0.95rem;
  color: ${props => props.theme.colors.textSecondary};
  margin-top: 0.15rem;

  @media (max-width: 1024px) {
    font-size: 0.85rem;
  }

  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`

const ModeButton = styled.button`
  background: ${props => props.selected
    ? 'linear-gradient(135deg, #ff1493, #ff69b4)'
    : 'linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(157, 0, 255, 0.1))'};
  border: 2px solid ${props => props.selected ? '#ff1493' : '#00ffff'};
  border-radius: 12px;
  padding: 0.8rem 1.5rem;
  color: white;
  font-family: 'Orbitron', sans-serif;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${props => props.selected
    ? '0 0 25px rgba(255, 20, 147, 0.6)'
    : '0 0 15px rgba(0, 255, 255, 0.2)'};
  backdrop-filter: blur(5px);

  &:hover {
    border-color: ${props => props.selected ? '#ff69b4' : '#9d00ff'};
    transform: translateY(-2px);
    box-shadow: ${props => props.selected
      ? '0 0 30px rgba(255, 20, 147, 0.8)'
      : '0 0 25px rgba(157, 0, 255, 0.4)'};
  }

  @media (max-width: 1200px) {
    padding: 0.6rem 1rem;
    font-size: 0.95rem;
  }

  @media (max-width: 768px) {
    padding: 0.5rem 0.8rem;
    font-size: 0.85rem;
  }
`


const CreateBattle = () => {
  const navigate = useNavigate()
  const { showSuccess, showError, showInfo } = useToast()
  const { address, walletClient, publicClient, nfts, loading: nftsLoading, chainId, switchToBase, isConnected, isConnecting, chains } = useWallet()
  
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [totalEth, setTotalEth] = useState('0.10')
  const [loading, setLoading] = useState(false)
  const [isNFTSelectorOpen, setIsNFTSelectorOpen] = useState(false)
  const [creatorParticipates, setCreatorParticipates] = useState(false)
  const [ethPriceUSD, setEthPriceUSD] = useState(0)
  const [selectedRoom, setSelectedRoom] = useState(1) // Default to Potion Room (id: 1)
  const [gameMode, setGameMode] = useState('6player') // Default to 6-player mode

  // Progress tracking
  const [currentStep, setCurrentStep] = useState(0)
  const [stepStatus, setStepStatus] = useState({
    create: false,
    approve: false,
    deposit: false
  })

  const isFullyConnected = address && walletClient

  // Calculate progress percentage for progress bar
  const getProgressPercentage = () => {
    let completed = 0
    if (stepStatus.create) completed++
    if (stepStatus.approve) completed++
    if (stepStatus.deposit) completed++
    return (completed / 3) * 100
  }

  useEffect(() => {
    console.log('🏆 Battle Royale creation page loaded')
    console.log('🔍 Wallet status:', { address, isConnected, chainId })
  }, [address, isConnected, chainId])

  // Fetch ETH price for USD display
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const price = await contractService.getETHPriceUSD()
        setEthPriceUSD(price)
      } catch (error) {
        console.warn('Failed to fetch ETH price for display:', error)
      }
    }
    fetchPrice()
    const interval = setInterval(fetchPrice, 90000) // Update every 90 seconds
    return () => clearInterval(interval)
  }, [])

  // Get max players based on game mode
  const getMaxPlayers = () => {
    const modes = {
      '1v1': 2,
      '6player': 6,
      '12player': 12,
      '18player': 18,
      '24player': 24
    }
    return modes[gameMode] || 6
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedNFT) {
      showError('Please select an NFT')
      return
    }
    if (!totalEth || parseFloat(totalEth) <= 0) {
      showError('Please enter a valid total price in ETH (> 0)')
      return
    }
    
    // Debug room selection
    console.log('🎨 Selected room:', selectedRoom)
    const roomType = selectedRoom === 2 ? 'lab' : selectedRoom === 3 ? 'cyber' : selectedRoom === 4 ? 'mech' : 'potion'
    console.log('🎨 Room type will be:', roomType)
    
    if (chainId !== 8453) {
      const requiredNetwork = chains[8453]?.name || 'Base'
      showError(`Please switch to ${requiredNetwork} network to create a new flip`)
      return
    }
    
    if (!contractService.isReady()) {
      showError('Wallet not connected or contract service not initialized. Please try connecting your wallet again.')
      return
    }
    
    setLoading(true)
    setCurrentStep(1)
    
    try {
      // Step 1: Create Battle Royale in database
      showInfo('Creating Battle Royale game...')
      setStepStatus({ create: true, approve: false, deposit: false })
      
      // Calculate pricing in ETH
      const maxPlayers = getMaxPlayers()
      const totalEthNum = Math.round(parseFloat(totalEth) * 1e6) / 1e6
      // If creator participates, they take 1 seat, so paying players = maxPlayers - 1
      const payingPlayers = creatorParticipates ? maxPlayers - 1 : maxPlayers
      const perPlayerEth = Math.round((totalEthNum / maxPlayers) * 1e6) / 1e6
      const entryFeeWei = ethers.parseEther(perPlayerEth.toString())

      // Percent fee: 5% of per-player entry (in wei)
      const percentFeeWei = (entryFeeWei * 5n) / 100n

      // Flat tier: $0.50 if total < $50, else $1.00 — converted once to ETH
      let ethPriceUSD = 0
      try {
        ethPriceUSD = await contractService.getETHPriceUSD()
      } catch {
        ethPriceUSD = 0
      }
      if (!ethPriceUSD || ethPriceUSD <= 0) {
        throw new Error('Failed to fetch price for fee calculation. Please try again.')
      }
      const totalUsd = totalEthNum * ethPriceUSD
      const flatUsd = totalUsd < 50 ? 0.50 : 1.00
      const flatEth = Math.round((flatUsd / ethPriceUSD) * 1e6) / 1e6
      const flatFeeWei = ethers.parseEther(flatEth.toString())

      const serviceFeeWei = percentFeeWei + flatFeeWei

      // For the withdraw-minimum path we are not using under-$20 anymore
      const isUnder20 = false
      const minUnder20Wei = 0n
      
      // Validate and sanitize data before sending
      const requestData = {
        creator: address,
        nft_contract: selectedNFT.contractAddress,
        nft_token_id: selectedNFT.tokenId,
        nft_name: selectedNFT.name || '',
        nft_image: selectedNFT.image || '',
        nft_collection: selectedNFT.collection || '',
        nft_chain: 'base', // Battle royale games are on Base
        entry_fee: perPlayerEth, // store for display if server desires
        service_fee: ethers.formatEther(serviceFeeWei),
        creator_participates: creatorParticipates, // Add creator participation flag
        room_type: selectedRoom === 2 ? 'lab' : selectedRoom === 3 ? 'cyber' : selectedRoom === 4 ? 'mech' : 'potion', // Add room type (default to potion if not selected)
        game_mode: gameMode, // Add game mode (1v1, 6player, etc.)
        max_players: maxPlayers // Add max players for this game
      }
      
      // Validate required fields
      if (!requestData.creator || !requestData.nft_contract || !requestData.nft_token_id) {
        throw new Error('Missing required NFT information')
      }
      
      // Validate numeric values
      if (isNaN(requestData.entry_fee) || isNaN(requestData.service_fee)) {
        throw new Error('Invalid price values')
      }
      
      console.log('Sending Battle Royale request:', requestData)
      
      const battleRoyaleResponse = await fetch(getApiUrl('/battle-royale/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })
      
      if (!battleRoyaleResponse.ok) {
        let errorMessage = 'Failed to create Battle Royale game'
        try {
          const error = await battleRoyaleResponse.json()
          errorMessage = error.error || error.message || errorMessage
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          errorMessage = `Server error: ${battleRoyaleResponse.status} ${battleRoyaleResponse.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const battleRoyaleResult = await battleRoyaleResponse.json()
      console.log('✅ Battle Royale game created:', battleRoyaleResult)
      
      // Step 2: Approve and deposit NFT on blockchain
      setCurrentStep(2)
      showInfo('Approving and depositing NFT...')
      setStepStatus({ create: true, approve: true, deposit: false })
      
      const createResult = await contractService.createBattleRoyale(
        battleRoyaleResult.gameId,
        selectedNFT.contractAddress,
        selectedNFT.tokenId,
        entryFeeWei.toString(),
        serviceFeeWei.toString(),
        isUnder20,
        minUnder20Wei.toString(),
        creatorParticipates
      )
      
      if (!createResult.success) {
        throw new Error(createResult.error || 'Failed to create Battle Royale on blockchain')
      }
      
      // Verify we have a transaction hash
      if (!createResult.transactionHash) {
        throw new Error('Transaction submitted but no hash received')
      }
      
      // Step 2.5: Update database to mark NFT as deposited
      // Note: Even if receipt wait failed, we still have the tx hash and can mark it
      const markDepositedResponse = await fetch(
        getApiUrl(`/battle-royale/${battleRoyaleResult.gameId}/mark-nft-deposited`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creator: address,
            transactionHash: createResult.transactionHash
          })
        }
      )
      
      if (!markDepositedResponse.ok) {
        console.warn('⚠️ Failed to mark NFT as deposited in database, but transaction was submitted')
        const errorData = await markDepositedResponse.json().catch(() => ({}))
        console.error('Mark deposit error:', errorData)
        // Don't throw - transaction was submitted, this is just a database update
      } else {
        console.log('✅ NFT deposit recorded in database')
      }
      
      // Show info about transaction status
      if (!createResult.receipt) {
        showInfo('Transaction submitted! Waiting for confirmation... You can check the transaction on BaseScan.')
      }
      
      // Step 3: Complete
      setCurrentStep(3)
      setStepStatus({ create: true, approve: true, deposit: true })
      
      showSuccess('🏆 Battle Royale created successfully! Opening lobby...')
      // Keep lobby at /battle-royale/:gameId; gameplay will redirect when active
      navigate(`/battle-royale/${battleRoyaleResult.gameId}`)
      
    } catch (error) {
      console.error('Error creating Battle Royale:', error)
      showError(error.message || 'Failed to create Battle Royale')
      setCurrentStep(0)
      setStepStatus({ create: false, approve: false, deposit: false })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Container style={{ paddingTop: '0.5rem', paddingBottom: '2rem' }}>
        <ContentWrapper style={{ paddingTop: '0.5rem', paddingBottom: '1rem' }}>
          <BattleContainer>
            <BattleHeader>
              <BattleTitle>Create Flip</BattleTitle>
            </BattleHeader>
            
            {/* Network Check */}
            {isConnected && chainId !== 8453 && (
              <div style={{
                background: 'rgba(255, 165, 0, 0.1)',
                border: '2px solid orange',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '2rem',
                textAlign: 'center'
              }}>
                <p style={{ color: 'orange', margin: '0 0 1rem 0' }}>
                  ⚠️ Please switch to {chains[8453]?.name || 'Base'} network to create a new flip
                </p>
                <Button onClick={switchToBase} style={{ background: 'orange' }}>
                  Switch to {chains[8453]?.name || 'Base'} Network
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <FourBoxGrid>
                {/* Top Left: Load Your NFT */}
                <Box>
                  <BoxTitle>Load Your NFT</BoxTitle>
                  <NFTUploadArea>
                    {selectedNFT ? (
                      <NFTPreviewSquare 
                        src={selectedNFT.image} 
                        alt={selectedNFT.name}
                        onClick={() => setIsNFTSelectorOpen(true)}
                      />
                    ) : (
                      <SquareUploadZone onClick={() => setIsNFTSelectorOpen(true)}>
                        <div style={{ textAlign: 'center', color: theme.colors.textSecondary }}>
                          <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>📷</div>
                          <div style={{ fontSize: '1.1rem' }}>Upload NFT</div>
                        </div>
                      </SquareUploadZone>
                    )}
                    {selectedNFT && (
                      <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                        <div style={{ color: theme.colors.textPrimary, fontWeight: '600', fontSize: '1.1rem' }}>
                          {selectedNFT.name}
                        </div>
                        <div style={{ color: theme.colors.textSecondary, fontSize: '1rem' }}>
                          {selectedNFT.collection}
                        </div>
                      </div>
                    )}
                  </NFTUploadArea>
                </Box>

                {/* Second Column: Room Size */}
                <Box>
                  <BoxTitle>Room Size</BoxTitle>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gridTemplateRows: 'auto auto',
                    gap: '0.6rem'
                  }}>
                    <ModeButton
                      type="button"
                      selected={gameMode === '1v1'}
                      onClick={() => setGameMode('1v1')}
                    >
                      1v1
                    </ModeButton>
                    <ModeButton
                      type="button"
                      selected={gameMode === '6player'}
                      onClick={() => setGameMode('6player')}
                    >
                      6 Players
                    </ModeButton>
                    <ModeButton
                      type="button"
                      selected={gameMode === '12player'}
                      onClick={() => setGameMode('12player')}
                    >
                      12 Players
                    </ModeButton>
                    <ModeButton
                      type="button"
                      selected={gameMode === '18player'}
                      onClick={() => setGameMode('18player')}
                      style={{ gridColumn: 'span 1' }}
                    >
                      18 Players
                    </ModeButton>
                    <ModeButton
                      type="button"
                      selected={gameMode === '24player'}
                      onClick={() => setGameMode('24player')}
                      style={{ gridColumn: 'span 1' }}
                    >
                      24 Players
                    </ModeButton>
                  </div>
                </Box>

                {/* Third Column: Choose Your Room */}
                <Box>
                  <BoxTitle>Choose Your Room</BoxTitle>
                  <RoomGrid>
                    {[
                      { id: 1, image: '/images/background/game room2.png', label: 'Potion Room' },
                      { id: 2, image: '/images/background/thelab.png', label: 'The Lab' },
                      { id: 3, image: '/images/background/cyber.png', label: 'Cyber Bay' },
                      { id: 4, image: '/images/background/mech.png', label: 'Mech Room' }
                    ].map((room) => (
                      <RoomOption 
                        key={room.id}
                        onClick={() => {
                          console.log('🎨 Room clicked:', room.id, room.label)
                          setSelectedRoom(room.id)
                        }}
                        style={{
                          borderColor: selectedRoom === room.id ? '#9d00ff' : '#00ffff',
                          background: selectedRoom === room.id ? 'linear-gradient(135deg, rgba(157, 0, 255, 0.3), rgba(0, 255, 255, 0.3))' : 'linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(157, 0, 255, 0.1))',
                          boxShadow: selectedRoom === room.id ? '0 0 20px rgba(157, 0, 255, 0.6)' : '0 0 10px rgba(0, 255, 255, 0.2)',
                          flexDirection: 'column',
                          padding: '0.35rem'
                        }}
                      >
                        {room.image ? (
                          <img
                            src={room.image}
                            alt={room.label}
                            style={{
                              width: '100%',
                              height: '40%',
                              objectFit: 'cover',
                              borderRadius: '5px',
                              marginBottom: '0.2rem'
                            }}
                          />
                        ) : (
                          <div style={{
                            color: selectedRoom === room.id ? '#9d00ff' : '#00ffff',
                            fontSize: '1rem',
                            textAlign: 'center',
                            textShadow: selectedRoom === room.id ? '0 0 10px rgba(157, 0, 255, 0.8)' : '0 0 5px rgba(0, 255, 255, 0.5)',
                            marginBottom: '0.2rem'
                          }}>
                            🏠
                          </div>
                        )}
                        <div style={{
                          color: selectedRoom === room.id ? '#9d00ff' : '#ff8c00',
                          fontSize: '0.95rem',
                          textAlign: 'center',
                          fontFamily: 'Orbitron, sans-serif',
                          fontWeight: 'bold',
                          textShadow: selectedRoom === room.id ? '0 0 8px rgba(157, 0, 255, 0.8)' : '0 0 8px rgba(255, 140, 0, 0.8)'
                        }}>
                          {room.label}
                          {selectedRoom === room.id && ' ✓'}
                        </div>
                      </RoomOption>
                    ))}
                  </RoomGrid>
                </Box>

                {/* Fourth Box: Flip Price (spans 2 columns) */}
                <Box>
                  <BoxTitle>Flip Price</BoxTitle>
                  <PricingContainer>
                    <div style={{ marginBottom: '1rem' }}>
                      <Label style={{
                        fontSize: '1.1rem',
                        marginBottom: '0.5rem',
                        display: 'block'
                      }}>
                        Total Price (ETH)
                      </Label>
                      <PriceInput
                        type="text"
                        placeholder="1.00"
                        value={totalEth}
                        onChange={(e) => setTotalEth(e.target.value)}
                      />
                      {ethPriceUSD > 0 && (
                        <div style={{
                          color: theme.colors.textSecondary,
                          fontSize: '1rem',
                          marginTop: '0.25rem',
                          textAlign: 'center'
                        }}>
                          ≈ ${(parseFloat(totalEth || '0') * ethPriceUSD).toFixed(2)} USD
                        </div>
                      )}
                    </div>

                    {/* Creator Participation Toggle */}
                    <ToggleContainer>
                      <div>
                        <ToggleLabel>Creator Participates</ToggleLabel>
                        <ToggleDescription>
                          {creatorParticipates
                            ? `You will take 1 seat (${getMaxPlayers() - 1} others join)`
                            : `You will not participate (${getMaxPlayers()} others join)`}
                        </ToggleDescription>
                      </div>
                      <ToggleSwitch>
                        <input
                          type="checkbox"
                          checked={creatorParticipates}
                          onChange={(e) => setCreatorParticipates(e.target.checked)}
                        />
                        <span className="slider"></span>
                      </ToggleSwitch>
                    </ToggleContainer>

                    {totalEth && (
                      <PriceBreakdownBox>
                        <PriceBreakdownRow>
                          <PriceLabel>Per Player Entry:</PriceLabel>
                          <PriceValue>
                            <span>{(() => {
                              const n = parseFloat(totalEth || '0')
                              if (!n || n <= 0) return '0 ETH'
                              const maxPlayers = getMaxPlayers()
                              const perPlayer = n / maxPlayers
                              return parseFloat(perPlayer.toFixed(6)).toString() + ' ETH'
                            })()}</span>
                            {ethPriceUSD > 0 && (
                              <PriceSubValue theme={theme}>
                                ≈ ${((parseFloat(totalEth || '0') / getMaxPlayers()) * ethPriceUSD).toFixed(2)} USD
                              </PriceSubValue>
                            )}
                          </PriceValue>
                        </PriceBreakdownRow>
                        <PriceBreakdownRow>
                          <PriceLabel>Total Pool:</PriceLabel>
                          <PriceValue>
                            <span>{(() => {
                              const n = parseFloat(totalEth || '0')
                              if (!n || n <= 0) return '0 ETH'
                              const maxPlayers = getMaxPlayers()
                              // Total pool = what others contribute
                              // If creator participates: (maxPlayers - 1) others pay
                              // If creator doesn't: maxPlayers others pay
                              const payingPlayers = creatorParticipates ? maxPlayers - 1 : maxPlayers
                              const poolFromOthers = (n / maxPlayers) * payingPlayers
                              return parseFloat(poolFromOthers.toFixed(6)).toString() + ' ETH'
                            })()}</span>
                            {ethPriceUSD > 0 && (
                              <PriceSubValue theme={theme}>
                                ≈ ${((() => {
                                  const n = parseFloat(totalEth || '0')
                                  const maxPlayers = getMaxPlayers()
                                  const payingPlayers = creatorParticipates ? maxPlayers - 1 : maxPlayers
                                  return (n / maxPlayers) * payingPlayers * ethPriceUSD
                                })()).toFixed(2)} USD
                              </PriceSubValue>
                            )}
                          </PriceValue>
                        </PriceBreakdownRow>
                        <PriceBreakdownRow>
                          <PriceLabel>Service Fee (5%):</PriceLabel>
                          <PriceValue>
                            <span>{(() => {
                              const n = parseFloat(totalEth || '0')
                              if (!n || n <= 0) return '0 ETH'

                              // Service fee is 5% of the total pool amount
                              // Note: Flat fee ($0.50/$1.00) is paid by players when joining, not by creator
                              const serviceFee = n * 0.05

                              // Check for minimum fee if under threshold (currently disabled)
                              // If enabled: if total < $X and minFee > 5%, use minFee instead

                              return parseFloat(serviceFee.toFixed(6)).toString() + ' ETH'
                            })()}</span>
                            {ethPriceUSD > 0 && (
                              <PriceSubValue theme={theme}>
                                ≈ ${((parseFloat(totalEth || '0') * 0.05) * ethPriceUSD).toFixed(2)} USD
                              </PriceSubValue>
                            )}
                          </PriceValue>
                        </PriceBreakdownRow>
                        <PriceBreakdownRow style={{ color: '#00ff88' }}>
                          <PriceLabel style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Your Earnings:</PriceLabel>
                          <PriceValue>
                            <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{(() => {
                              const n = parseFloat(totalEth || '0')
                              if (!n || n <= 0) return '0 ETH'
                              const maxPlayers = getMaxPlayers()

                              // Pool from others (what creator earns from)
                              const payingPlayers = creatorParticipates ? maxPlayers - 1 : maxPlayers
                              const poolFromOthers = (n / maxPlayers) * payingPlayers

                              // Service fee is 5% of the total pool amount
                              // Note: Flat fee is paid by players, not deducted from creator earnings
                              const serviceFee = n * 0.05

                              // Earnings = pool from others - service fee
                              const earnings = poolFromOthers - serviceFee
                              return parseFloat(earnings.toFixed(6)).toString() + ' ETH'
                            })()}</span>
                            {ethPriceUSD > 0 && (
                              <span style={{ fontSize: '1.1rem', color: '#00ff88', opacity: 0.8, marginTop: '0.15rem', fontWeight: 'bold' }}>
                                ≈ ${((() => {
                                  const n = parseFloat(totalEth || '0')
                                  if (!n || n <= 0) return 0
                                  const maxPlayers = getMaxPlayers()
                                  const payingPlayers = creatorParticipates ? maxPlayers - 1 : maxPlayers
                                  const poolFromOthers = (n / maxPlayers) * payingPlayers
                                  const serviceFee = n * 0.05
                                  const earnings = poolFromOthers - serviceFee
                                  return earnings * ethPriceUSD
                                })()).toFixed(2)} USD
                              </span>
                            )}
                          </PriceValue>
                        </PriceBreakdownRow>
                      </PriceBreakdownBox>
                    )}
                  </PricingContainer>
                </Box>

                {/* Bottom Right: Progress & Create Button */}
                <Box>
                  <BoxTitle>Progress</BoxTitle>
                  <ProgressBox>
                    <CompactProgressContainer>
                      <CompactProgressLine progress={getProgressPercentage()} />
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <CompactStepCircle 
                          completed={stepStatus.create}
                          active={currentStep === 1 && !stepStatus.create}
                        >
                          {stepStatus.create ? '✓' : '1'}
                        </CompactStepCircle>
                        <CompactStepLabel 
                          completed={stepStatus.create}
                          active={currentStep === 1 && !stepStatus.create}
                        >
                          Create Game
                        </CompactStepLabel>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <CompactStepCircle 
                          completed={stepStatus.approve}
                          active={currentStep === 2 && !stepStatus.approve}
                        >
                          {stepStatus.approve ? '✓' : '2'}
                        </CompactStepCircle>
                        <CompactStepLabel 
                          completed={stepStatus.approve}
                          active={currentStep === 2 && !stepStatus.approve}
                        >
                          Approve & Deposit
                        </CompactStepLabel>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <CompactStepCircle 
                          completed={stepStatus.deposit}
                          active={currentStep === 3 && !stepStatus.deposit}
                        >
                          {stepStatus.deposit ? '✓' : '3'}
                        </CompactStepCircle>
                        <CompactStepLabel 
                          completed={stepStatus.deposit}
                          active={currentStep === 3 && !stepStatus.deposit}
                        >
                          Complete Setup
                        </CompactStepLabel>
                      </div>
                    </CompactProgressContainer>

                    <BattleSubmitButton type="submit" disabled={loading || !isFullyConnected}>
                      {loading ? (
                        <>
                          <LoadingSpinner /> Creating Flip...
                        </>
                      ) : (
                        'Create Flip'
                      )}
                    </BattleSubmitButton>
                  </ProgressBox>
                </Box>
              </FourBoxGrid>
            </form>
          </BattleContainer>
        </ContentWrapper>

        <NFTSelector
          isOpen={isNFTSelectorOpen}
          onClose={() => setIsNFTSelectorOpen(false)}
          onSelect={(nft) => {
            console.log('🎨 NFT selected for Battle Royale:', nft)
            setSelectedNFT(nft)
          }}
          nfts={nfts || []}
          loading={nftsLoading}
          selectedNFT={selectedNFT}
        />
      </Container>
    </ThemeProvider>
  )
}

export default CreateBattle
