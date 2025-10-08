import React, { useState, useRef, useEffect } from 'react'
import styled from '@emotion/styled'

const ControlPanel = styled.div`
  background: linear-gradient(135deg, rgba(0, 0, 50, 0.98), rgba(0, 0, 30, 0.98));
  border: 4px solid #00ffff;
  border-radius: 1.2rem;
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  height: 100%;
  box-shadow: 0 0 50px rgba(0, 255, 255, 0.4), inset 0 0 30px rgba(0, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  overflow: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(0, 255, 255, 0.05) 0%, transparent 70%);
    animation: rotate 10s linear infinite;
  }
  
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`

const ChoiceButtons = styled.div`
  display: flex;
  gap: 0.6rem;
  justify-content: center;
  z-index: 1;
  
  button { 
    flex: 1; 
    padding: 0.8rem; 
    border: none; 
    border-radius: 0.8rem; 
    font-size: 1.6rem; 
    font-weight: bold; 
    cursor: pointer; 
    transition: all 0.3s ease; 
    position: relative; 
    overflow: hidden;
    font-family: 'Hyperwave', sans-serif;
    letter-spacing: 2px;
    text-transform: uppercase;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }
  
  button::before { 
    content: ''; 
    position: absolute; 
    top: 0; 
    left: -100%; 
    width: 100%; 
    height: 100%; 
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent); 
    transition: left 0.5s; 
  }
  
  button:hover:not(:disabled)::before { left: 100%; }
  
  .heads { 
    background: linear-gradient(135deg, #00FF41 0%, #00FF88 100%); 
    color: #000; 
    border: 4px solid #00FF41; 
  }
  
  .tails { 
    background: linear-gradient(135deg, #FF1493 0%, #FF69B4 100%); 
    color: #fff; 
    border: 4px solid #FF1493; 
  }
  
  .selected { 
    border-width: 5px; 
    box-shadow: 0 0 40px currentColor, inset 0 0 30px rgba(255, 255, 255, 0.3); 
    animation: selectedPulse 1.5s ease-in-out infinite; 
    transform: scale(1.05);
  }
  
  button:disabled { 
    opacity: 0.5; 
    cursor: not-allowed; 
  }
  
  @keyframes selectedPulse { 
    0%, 100% { transform: scale(1.05); } 
    50% { transform: scale(1.1); } 
  }
`

const AngleControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  z-index: 1;
  
  label { 
    color: #00ffff; 
    font-weight: bold; 
    text-align: center; 
    font-size: 0.9rem;
    font-family: 'Hyperwave', monospace;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  input { 
    width: 100%; 
    cursor: pointer;
    height: 8px;
    border-radius: 5px;
    background: rgba(0, 0, 0, 0.5);
    outline: none;
    
    &::-webkit-slider-thumb {
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00ffff, #00ff88);
      cursor: pointer;
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
      transition: all 0.3s ease;
    }
    
    &::-webkit-slider-thumb:hover {
      transform: scale(1.2);
      box-shadow: 0 0 20px rgba(0, 255, 255, 1);
    }
  }
  
  .angle-display { 
    text-align: center; 
    color: white; 
    font-size: 1.3rem; 
    font-weight: bold;
    font-family: 'Hyperwave', monospace;
    text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
  }
`

const PowerMeter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  z-index: 1;
  
  label { 
    color: #00ffff; 
    font-weight: bold; 
    text-align: center; 
    font-size: 0.9rem;
    font-family: 'Hyperwave', monospace;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  .power-bar { 
    width: 100%; 
    height: 35px; 
    background: rgba(0, 0, 0, 0.8); 
    border-radius: 25px; 
    overflow: hidden; 
    border: 3px solid #00ffff; 
    position: relative; 
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.4), inset 0 0 10px rgba(0, 0, 0, 0.5);
  }
  
  .power-fill { 
    height: 100%; 
    background: linear-gradient(90deg, 
      #00ff88 0%, 
      #00ffff 30%, 
      #ffff00 60%, 
      #ff8800 80%, 
      #ff0000 100%
    ); 
    transition: width 0.05s linear; 
    box-shadow: 0 0 30px rgba(0, 255, 255, 1);
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent);
    }
  }
  
  .power-value { 
    position: absolute; 
    top: 50%; 
    left: 50%; 
    transform: translate(-50%, -50%); 
    color: white; 
    font-weight: bold; 
    font-size: 1.1rem; 
    text-shadow: 0 0 8px rgba(0, 0, 0, 0.9);
    font-family: 'Hyperwave', monospace;
  }
`

const FireButton = styled.button`
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 50%, #ff1493 100%);
  color: white;
  border: 4px solid #ff1493;
  padding: 1rem 1.5rem;
  border-radius: 1rem;
  font-size: 1.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  position: relative;
  overflow: hidden;
  flex: 1;
  font-family: 'Hyperwave', sans-serif;
  letter-spacing: 3px;
  box-shadow: 0 6px 25px rgba(255, 20, 147, 0.4);
  z-index: 1;
  
  &::before { 
    content: ''; 
    position: absolute; 
    top: 0; 
    left: -100%; 
    width: 100%; 
    height: 100%; 
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent); 
    transition: left 0.6s; 
  }
  
  &:hover:not(:disabled)::before { left: 100%; }
  
  &:hover:not(:disabled) { 
    transform: translateY(-3px) scale(1.02); 
    box-shadow: 0 10px 40px rgba(255, 20, 147, 0.7); 
    border-color: #ff69b4;
  }
  
  &.charging { 
    animation: chargeGlow 0.3s ease-in-out infinite;
    transform: scale(0.98);
  }
  
  &:disabled { 
    opacity: 0.5; 
    cursor: not-allowed; 
    transform: none; 
  }
  
  @keyframes chargeGlow { 
    0%, 100% { box-shadow: 0 0 30px rgba(255, 20, 147, 0.8); } 
    50% { box-shadow: 0 0 60px rgba(255, 20, 147, 1); } 
  }
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
        <label>🎯 Launch Angle</label>
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
        <label>⚡ Power Charge</label>
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
        {hasFired ? '✅ FIRED!' : (isCharging ? '⚡ CHARGE' : '🚀 FIRE')}
      </FireButton>
    </ControlPanel>
  )
}

export default CannonController
