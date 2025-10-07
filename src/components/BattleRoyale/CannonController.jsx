import React, { useState, useRef, useEffect } from 'react'
import styled from '@emotion/styled'

const ControlPanel = styled.div`
  background: rgba(0, 0, 40, 0.98);
  border: 3px solid #00ffff;
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
  box-shadow: 0 0 40px rgba(0, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  overflow: hidden;
`

const CoinPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(0, 191, 255, 0.1);
  border: 2px solid #00bfff;
  border-radius: 0.5rem;
  
  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid #FFD700;
  }
  
  .coin-info {
    flex: 1;
    .coin-name {
      color: #00ffff;
      font-weight: bold;
      font-size: 0.8rem;
    }
    .coin-hint {
      color: #aaa;
      font-size: 0.7rem;
    }
  }
`

const ChoiceButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  
  button { 
    flex: 1; 
    padding: 0.75rem; 
    border: none; 
    border-radius: 0.75rem; 
    font-size: 1.1rem; 
    font-weight: bold; 
    cursor: pointer; 
    transition: all 0.3s ease; 
    position: relative; 
    overflow: hidden;
    font-family: 'Hyperwave', sans-serif;
    letter-spacing: 1px;
  }
  
  button::before { 
    content: ''; 
    position: absolute; 
    top: 0; 
    left: -100%; 
    width: 100%; 
    height: 100%; 
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent); 
    transition: left 0.5s; 
  }
  
  button:hover:not(:disabled)::before { left: 100%; }
  
  .heads { 
    background: linear-gradient(135deg, #00FF41 0%, #00FF88 100%); 
    color: #000; 
    border: 3px solid #00FF41; 
  }
  
  .tails { 
    background: linear-gradient(135deg, #FF1493 0%, #FF69B4 100%); 
    color: #fff; 
    border: 3px solid #FF1493; 
  }
  
  .selected { 
    border-width: 4px; 
    box-shadow: 0 0 30px currentColor, inset 0 0 20px rgba(255, 255, 255, 0.3); 
    animation: selectedPulse 1.5s ease-in-out infinite; 
  }
  
  button:disabled { 
    opacity: 0.5; 
    cursor: not-allowed; 
  }
  
  @keyframes selectedPulse { 
    0%, 100% { transform: scale(1); } 
    50% { transform: scale(1.05); } 
  }
`

const AngleControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  
  label { 
    color: #00ffff; 
    font-weight: bold; 
    text-align: center; 
    font-size: 0.75rem;
  }
  
  input { 
    width: 100%; 
    cursor: pointer; 
  }
  
  .angle-display { 
    text-align: center; 
    color: white; 
    font-size: 1rem; 
    font-weight: bold; 
  }
`

const PowerMeter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  
  label { 
    color: #00ffff; 
    font-weight: bold; 
    text-align: center; 
    font-size: 0.75rem;
  }
  
  .power-bar { 
    width: 100%; 
    height: 30px; 
    background: rgba(0, 0, 0, 0.8); 
    border-radius: 20px; 
    overflow: hidden; 
    border: 2px solid #00ffff; 
    position: relative; 
  }
  
  .power-fill { 
    height: 100%; 
    background: linear-gradient(90deg, #00ff88 0%, #00ffff 50%, #ffff00 100%); 
    transition: width 0.1s linear; 
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.8); 
  }
  
  .power-value { 
    position: absolute; 
    top: 50%; 
    left: 50%; 
    transform: translate(-50%, -50%); 
    color: white; 
    font-weight: bold; 
    font-size: 0.9rem; 
    text-shadow: 0 0 5px rgba(0, 0, 0, 0.8); 
  }
`

const FireButton = styled.button`
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
  color: white;
  border: 3px solid #ff1493;
  padding: 0.8rem;
  border-radius: 1rem;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  
  &::before { 
    content: ''; 
    position: absolute; 
    top: 0; 
    left: -100%; 
    width: 100%; 
    height: 100%; 
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent); 
    transition: left 0.5s; 
  }
  
  &:hover:not(:disabled)::before { left: 100%; }
  
  &:hover:not(:disabled) { 
    transform: translateY(-2px); 
    box-shadow: 0 10px 30px rgba(255, 20, 147, 0.5); 
  }
  
  &.charging { 
    animation: chargeGlow 0.3s ease-in-out infinite; 
  }
  
  &:disabled { 
    opacity: 0.5; 
    cursor: not-allowed; 
    transform: none; 
  }
  
  @keyframes chargeGlow { 
    0%, 100% { box-shadow: 0 0 20px rgba(255, 20, 147, 0.6); } 
    50% { box-shadow: 0 0 40px rgba(255, 20, 147, 1); } 
  }
`

const StatusText = styled.div`
  text-align: center;
  color: ${props => props.hasFired ? '#00ff88' : '#ffff00'};
  font-weight: bold;
  font-size: 0.75rem;
  padding: 0.35rem;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 0.5rem;
`

const CannonController = ({ 
  onChoiceSelect, 
  onFire, 
  selectedChoice = null, 
  disabled = false, 
  hasFired = false,
  currentCoin = null
}) => {
  const [angle, setAngle] = useState(0)
  const [power, setPower] = useState(5)
  const [isCharging, setIsCharging] = useState(false)
  const chargeIntervalRef = useRef(null)

  const handleChoiceClick = (choice) => { 
    if (disabled || hasFired) return
    onChoiceSelect(choice) 
  }
  
  const handleAngleChange = (e) => { setAngle(parseInt(e.target.value)) }

  const handleFireMouseDown = () => {
    if (disabled || !selectedChoice || hasFired) return
    setIsCharging(true)
    setPower(1)
    chargeIntervalRef.current = setInterval(() => { 
      setPower(prev => { 
        const np = prev + 0.5
        return np > 10 ? 10 : np 
      }) 
    }, 100)
  }

  const stopCharging = () => { 
    if (chargeIntervalRef.current) { 
      clearInterval(chargeIntervalRef.current)
      chargeIntervalRef.current = null 
    } 
  }

  const handleFireMouseUp = () => {
    if (disabled || !selectedChoice || !isCharging || hasFired) return
    stopCharging()
    setIsCharging(false)
    onFire(angle, Math.floor(power))
    setTimeout(() => setPower(5), 500)
  }

  const handleFireMouseLeave = () => { 
    stopCharging()
    setIsCharging(false)
    setPower(5) 
  }

  useEffect(() => { return () => { stopCharging() } }, [])

  return (
    <ControlPanel>
      <CoinPreview>
        <img 
          src={currentCoin?.headsImage || '/coins/plainh.png'} 
          alt="Current coin" 
        />
        <div className="coin-info">
          <div className="coin-name">{currentCoin?.name || 'Classic'}</div>
          <div className="coin-hint">
            {hasFired ? 'Locked until next round' : 'Your coin'}
          </div>
        </div>
      </CoinPreview>
      
      <ChoiceButtons>
        <button 
          className={`heads ${selectedChoice === 'heads' ? 'selected' : ''}`} 
          onClick={() => handleChoiceClick('heads')} 
          disabled={disabled || hasFired}
        >
          HEADS
        </button>
        <button 
          className={`tails ${selectedChoice === 'tails' ? 'selected' : ''}`} 
          onClick={() => handleChoiceClick('tails')} 
          disabled={disabled || hasFired}
        >
          TAILS
        </button>
      </ChoiceButtons>
      
      <AngleControl>
        <label>🎯 Aim Angle</label>
        <input 
          type="range" 
          min="-45" 
          max="45" 
          value={angle} 
          onChange={handleAngleChange} 
          disabled={disabled || !selectedChoice || hasFired} 
        />
        <div className="angle-display">{angle}°</div>
      </AngleControl>
      
      <PowerMeter>
        <label>⚡ Fire Power</label>
        <div className="power-bar">
          <div className="power-fill" style={{ width: `${(power / 10) * 100}%` }} />
          <div className="power-value">{Math.floor(power)}/10</div>
        </div>
      </PowerMeter>
      
      <FireButton 
        className={isCharging ? 'charging' : ''} 
        onMouseDown={handleFireMouseDown} 
        onMouseUp={handleFireMouseUp} 
        onMouseLeave={handleFireMouseLeave} 
        onTouchStart={handleFireMouseDown} 
        onTouchEnd={handleFireMouseUp} 
        disabled={disabled || !selectedChoice || hasFired}
      >
        {hasFired ? '✅ FIRED!' : (isCharging ? '⚡ CHARGING...' : '🚀 HOLD TO FIRE')}
      </FireButton>
      
      {hasFired && (
        <StatusText hasFired={true}>
          Coin in flight! Waiting for result...
        </StatusText>
      )}
    </ControlPanel>
  )
}

export default CannonController