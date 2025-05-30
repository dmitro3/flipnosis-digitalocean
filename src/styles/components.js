import styled from '@emotion/styled'

export const Container = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.bgDark};
  color: ${props => props.theme.colors.textPrimary};
  padding: 2rem;
`

export const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`

export const GlassCard = styled.div`
  background: rgba(255, 255, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 0, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
  transition: ${props => props.theme.transitions.default};
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.glass};
    border-color: rgba(255, 255, 0, 0.3);
  }
`

export const NeonText = styled.h3`
  color: ${props => props.theme.colors.neonPink};
  animation: neonPulse 2s infinite;
  ${props => props.theme.animations.neonPulse}
`

export const NeonBorder = styled.div`
  position: relative;
  border: 2px solid transparent;
  animation: neonBorder 3s infinite;
  ${props => props.theme.animations.neonBorder}
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: inherit;
    background: linear-gradient(45deg, ${props => props.theme.colors.neonGreen}, ${props => props.theme.colors.neonGreen}, ${props => props.theme.colors.neonGreen});
    z-index: -1;
    animation: neonRotate 2s linear infinite;
    ${props => props.theme.animations.neonRotate}
  }
`

export const Button = styled.button`
  background: linear-gradient(45deg, ${props => props.theme.colors.neonPink}, ${props => props.theme.colors.neonBlue});
  color: white;
  border: none;
  border-radius: 0.75rem;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
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

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  padding: 1rem;
  
  @media (max-width: 1400px) {
    grid-template-columns: repeat(4, 1fr);
  }
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`

export const GameCard = styled(GlassCard)`
  cursor: pointer;
  overflow: hidden;
  position: relative;
  padding: 0;
  max-width: 240px;
  margin: 0 auto;
  
  ${props => props.selected && `
    border-color: ${props.theme.colors.neonPink};
    box-shadow: ${props.theme.shadows.neon};
  `}
`

export const GameImage = styled.img`
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 0.5rem 0.5rem 0 0;
  transition: ${props => props.theme.transitions.default};
  position: relative;
  
  &:hover {
    transform: scale(1.02);
  }
`

export const Badge = styled.div`
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 9999px;
  padding: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
`

export const ChainBadge = styled(Badge)`
  top: 0.5rem;
  right: 0.5rem;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const StatusBadge = styled(Badge)`
  top: 0.5rem;
  left: 0.5rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
`

export const PriceBadge = styled(Badge)`
  bottom: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5rem 1rem;
`

export const SelectedGameContainer = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  max-width: 300px;
  margin-left: 0;
  margin-right: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`

export const GameDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

export const DetailCard = styled.div`
  background: #f9fafb;
  border-radius: 0.75rem;
  padding: 1rem;
  
  span {
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  div {
    color: ${props => props.theme.colors.neonPink};
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 0.25rem;
    animation: neonPulse 2s infinite;
    ${props => props.theme.animations.neonPulse}
  }
`

export const LoadingSpinner = styled.div`
  display: inline-block;
  width: 2rem;
  height: 2rem;
  border: 3px solid ${props => props.theme.colors.neonPink};
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

export const FormContainer = styled.div`
  max-width: 2xl;
  margin: 0 auto;
  padding: 2rem;
`

export const FormTitle = styled(NeonText)`
  font-size: 2rem;
  margin-bottom: 2rem;
`

export const FormSection = styled(GlassCard)`
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`

export const SectionTitle = styled.h2`
  color: ${props => props.theme.colors.neonPink};
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
`

export const NFTPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

export const NFTImage = styled.img`
  width: 5rem;
  height: 5rem;
  border-radius: 0.5rem;
  object-fit: cover;
`

export const NFTInfo = styled.div`
  flex: 1;
`

export const NFTName = styled.h3`
  color: ${props => props.theme.colors.textPrimary};
  font-weight: 600;
  margin-bottom: 0.25rem;
`

export const NFTCollection = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem;
`

export const SelectNFTButton = styled.button`
  width: 100%;
  padding: 1.5rem;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  background: transparent;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 1rem;
  cursor: pointer;
  transition: ${props => props.theme.transitions.default};
  
  &:hover {
    border-color: ${props => props.theme.colors.neonPink};
    color: ${props => props.theme.colors.neonPink};
    background: rgba(255, 255, 255, 0.05);
  }
`

export const InputWrapper = styled.div`
  position: relative;
`

export const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: ${props => props.theme.colors.textPrimary};
  font-size: 1rem;
  transition: ${props => props.theme.transitions.default};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.neonPink};
    box-shadow: ${props => props.theme.shadows.neon};
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.textTertiary};
  }
`

export const CurrencyLabel = styled.div`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem;
`

export const RoundsContainer = styled.div`
  display: flex;
  gap: 1rem;
`

export const RoundButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  background: ${props => props.active ? props.theme.colors.neonPink : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.active ? props.theme.colors.neonPink : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 0.5rem;
  color: ${props => props.active ? 'white' : props.theme.colors.textSecondary};
  font-weight: 500;
  cursor: pointer;
  transition: ${props => props.theme.transitions.default};
  
  &:hover {
    background: ${props => props.active ? props.theme.colors.neonPink : 'rgba(255, 255, 255, 0.1)'};
    border-color: ${props => props.theme.colors.neonPink};
    color: ${props => props.active ? 'white' : props.theme.colors.neonPink};
  }
`

export const SubmitButton = styled(Button)`
  width: 100%;
  padding: 1rem;
  font-size: 1.125rem;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const ConnectWalletPrompt = styled.div`
  text-align: center;
  padding: 4rem 2rem;
`

export const PromptTitle = styled(NeonText)`
  font-size: 2rem;
  margin-bottom: 1rem;
`

export const PromptText = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 2rem;
`

export const ErrorMessage = styled.div`
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.2);
  color: #ff4444;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  animation: fadeIn 0.3s ease-in-out;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`

export const TwoBoxLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  width: 100%;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`

export const ActiveGamesBox = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 1rem;
  padding: 1.5rem;
  height: fit-content;
`

export const ActiveGamesTitle = styled.h2`
  color: white;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

export const LiveDot = styled.div`
  width: 8px;
  height: 8px;
  background: #00FF00;
  border-radius: 50%;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`

export const ActiveGameItem = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateX(5px);
  }
`

export const GameItemInfo = styled.div`
  flex: 1;
`

export const GameItemTitle = styled.h3`
  color: white;
  font-size: 1rem;
  margin-bottom: 0.25rem;
`

export const GameItemDetails = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  display: flex;
  gap: 1rem;
`

export const GameInfo = styled.div`
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

export const GameTitle = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: white;
  margin: 0;
`

export const GameCollection = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.75rem;
  margin: 0;
`

export const GameStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
`

export const GameStat = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 0.15rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  color: ${props => props.theme.colors.textSecondary};
`

export const GamePrice = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: ${props => props.theme.colors.neonPink};
  margin-top: 0.25rem;
`

export const GameFlipButton = styled(Button)`
  width: 100%;
  margin-top: 1rem;
  background: linear-gradient(45deg, ${props => props.theme.colors.neonPink}, ${props => props.theme.colors.neonBlue});
  color: white;
  border: none;
  border-radius: 0.75rem;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
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

export const TransparentCard = styled.div`
  background: transparent;
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.theme.colors.neonGreen};
  border-radius: 1rem;
  padding: 1rem;
  transition: ${props => props.theme.transitions.default};
  margin-bottom: 2rem;
` 