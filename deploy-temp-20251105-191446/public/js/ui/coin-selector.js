/**
 * Coin Selector UI Module
 * Handles the coin customization modal
 */

import { isMobile } from '../utils/helpers.js';

export function showCoinSelector(tubeIndex, dependencies) {
  const {
    tubes,
    players,
    coinOptions,
    coinMaterials,
    walletParam,
    gameIdParam,
    playerSlot,
    socket,
    isServerSideMode,
    webglRenderer,
    applyCoinSelection
  } = dependencies;

  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
  `;

  const content = document.createElement('div');
  
  if (isMobile()) {
    content.style.cssText = `
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid #FFD700;
      border-radius: 12px;
      padding: 15px 20px;
      width: 95%;
      max-width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    `;
  } else {
    content.style.cssText = `
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid #FFD700;
      border-radius: 15px;
      padding: 40px 50px;
      width: 95%;
      max-width: 1600px;
      max-height: 85vh;
      overflow-y: auto;
    `;
  }

  let playerFlipBalance = 0;
  let unlockedCoins = ['plain'];
  let customCoinHeads = null;
  let customCoinTails = null;

  if (isServerSideMode && socket && walletParam) {
    console.log('📋 Fetching profile for wallet:', walletParam);
    
    socket.off('player_profile_data');
    
    socket.on('player_profile_data', (profileData) => {
      console.log('📊 Received profile data:', profileData);
      playerFlipBalance = profileData.flip_balance || 0;
      try {
        unlockedCoins = JSON.parse(profileData.unlocked_coins || '["plain"]');
      } catch (e) {
        unlockedCoins = ['plain'];
      }
      customCoinHeads = profileData.custom_coin_heads;
      customCoinTails = profileData.custom_coin_tails;
      console.log('💰 Updated FLIP balance:', playerFlipBalance);
      console.log('🪙 Updated unlocked coins:', unlockedCoins);
      updateCoinDisplay();
    });
    
    socket.emit('get_player_profile', { address: walletParam });
  }

  function updateCoinDisplay() {
    const coinGrid = content.querySelector('.coin-grid');
    if (!coinGrid) return;

    const flipBalanceElement = document.getElementById('flip-balance');
    if (flipBalanceElement) {
      flipBalanceElement.textContent = playerFlipBalance;
    }

    coinGrid.innerHTML = `
      ${coinOptions.map(coin => {
        const isUnlocked = unlockedCoins.includes(coin.id);
        const canAfford = playerFlipBalance >= (coin.cost || 0);
        const isLocked = !isUnlocked && (coin.cost || 0) > 0;
        
        let borderColor = 'rgba(255, 215, 0, 0.25)';
        let backgroundColor = 'rgba(255, 215, 0, 0.08)';
        let opacity = '1';
        let cursor = 'pointer';
        
        if (isLocked) {
          borderColor = 'rgba(255, 0, 0, 0.5)';
          backgroundColor = 'rgba(255, 0, 0, 0.1)';
          opacity = '0.6';
          cursor = canAfford ? 'pointer' : 'not-allowed';
        }
        
        const isMobileDevice = isMobile();
        return `
          <div class="coin-option" data-coin-id="${coin.id}" data-cost="${coin.cost || 0}" data-unlocked="${isUnlocked}" style="
            background: ${backgroundColor};
            border: 2px solid ${borderColor};
            border-radius: ${isMobileDevice ? '8px' : '12px'};
            padding: ${isMobileDevice ? '8px' : '15px'};
            text-align: center;
            cursor: ${cursor};
            transition: all 0.3s ease;
            opacity: ${opacity};
            position: relative;
          ">
            ${isLocked ? `
              <div style="position: absolute; top: 3px; right: 3px; background: rgba(255, 0, 0, 0.8); color: white; border-radius: 50%; width: ${isMobileDevice ? '16px' : '20px'}; height: ${isMobileDevice ? '16px' : '20px'}; display: flex; align-items: center; justify-content: center; font-size: ${isMobileDevice ? '10px' : '12px'}; font-weight: bold;">🔴</div>
            ` : ''}
            <img src="${coin.headsImage}" style="width: ${isMobileDevice ? '45px' : '65px'}; height: ${isMobileDevice ? '45px' : '65px'}; object-fit: contain; margin-bottom: ${isMobileDevice ? '4px' : '8px'}; display: block; margin-left: auto; margin-right: auto;" />
            <div style="color: #FFD700; font-weight: bold; font-family: 'Orbitron', sans-serif; font-size: ${isMobileDevice ? '0.7rem' : '0.85rem'}; margin-bottom: ${isMobileDevice ? '2px' : '4px'}; line-height: 1.2;">${coin.name}</div>
            ${(coin.cost || 0) > 0 ? `
              <div style="color: ${isUnlocked ? '#00ff00' : canAfford ? '#FFD700' : '#ff4444'}; font-size: ${isMobileDevice ? '0.6rem' : '0.75rem'}; font-weight: bold;">
                ${isUnlocked ? 'UNLOCKED' : `${coin.cost} FLIP`}
              </div>
            ` : `<div style="color: #00ff00; font-size: ${isMobileDevice ? '0.6rem' : '0.75rem'}; font-weight: bold;">FREE</div>`}
          </div>
        `;
      }).join('')}
      
      ${customCoinHeads && customCoinTails ? `
        <div class="coin-option" data-coin-id="custom" data-cost="0" data-unlocked="true" style="
          background: rgba(255, 215, 0, 0.08);
          border: 2px solid rgba(255, 215, 0, 0.25);
          border-radius: ${isMobile() ? '8px' : '12px'};
          padding: ${isMobile() ? '8px' : '15px'};
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        ">
          <img src="${customCoinHeads}" style="width: ${isMobile() ? '45px' : '65px'}; height: ${isMobile() ? '45px' : '65px'}; object-fit: contain; margin-bottom: ${isMobile() ? '4px' : '8px'}; display: block; margin-left: auto; margin-right: auto;" />
          <div style="color: #FFD700; font-weight: bold; font-family: 'Orbitron', sans-serif; font-size: ${isMobile() ? '0.7rem' : '0.85rem'}; margin-bottom: ${isMobile() ? '2px' : '4px'}; line-height: 1.2;">Custom</div>
          <div style="color: #00ff00; font-size: ${isMobile() ? '0.6rem' : '0.75rem'}; font-weight: bold;">YOURS</div>
        </div>
      ` : ''}
    `;
    
    attachCoinEventListeners();
  }

  content.innerHTML = `
    <h2 style="color: #FFD700; text-align: center; margin-bottom: ${isMobile() ? '20px' : '35px'}; font-family: 'Orbitron', sans-serif; font-size: ${isMobile() ? '1.3rem' : '1.8rem'};">Customize Your Coin</h2>
    
    <div style="text-align: center; margin-bottom: ${isMobile() ? '15px' : '30px'}; padding: ${isMobile() ? '10px' : '15px'}; background: rgba(255, 215, 0, 0.1); border-radius: ${isMobile() ? '8px' : '10px'}; border: 1px solid rgba(255, 215, 0, 0.3);">
      <div style="color: #FFD700; font-family: 'Orbitron', sans-serif; font-size: ${isMobile() ? '0.9rem' : '1.2rem'}; font-weight: bold;">
        Your FLIP Balance: <span id="flip-balance">Loading...</span>
      </div>
    </div>
    
    <h3 style="color: #FFD700; margin-bottom: ${isMobile() ? '12px' : '20px'}; font-family: 'Orbitron', sans-serif; font-size: ${isMobile() ? '1rem' : '1.2rem'};">Coin Design</h3>
    <div class="coin-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(${isMobile() ? '80px' : '110px'}, 1fr)); gap: ${isMobile() ? '10px' : '15px'}; margin-bottom: ${isMobile() ? '20px' : '40px'};">
    </div>
    
    <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.4), transparent); margin: ${isMobile() ? '15px' : '30px'} 0;"></div>
    <h3 style="color: #FFD700; margin-bottom: ${isMobile() ? '12px' : '20px'}; font-family: 'Orbitron', sans-serif; font-size: ${isMobile() ? '1rem' : '1.2rem'};">Coin Material</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(${isMobile() ? '120px' : '180px'}, 1fr)); gap: ${isMobile() ? '10px' : '15px'}; margin-bottom: ${isMobile() ? '20px' : '30px'};">
      ${coinMaterials.map(material => {
        const isMobileDevice = isMobile();
        return `
        <div class="material-option" data-material-id="${material.id}" style="
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: ${isMobileDevice ? '8px' : '12px'};
          padding: ${isMobileDevice ? '12px' : '18px'};
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        ">
          <div style="
            width: ${isMobileDevice ? '35px' : '55px'};
            height: ${isMobileDevice ? '35px' : '55px'};
            border-radius: 50%;
            margin: 0 auto ${isMobileDevice ? '8px' : '12px'};
            border: 3px solid ${material.edgeColor};
            background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), rgba(0,0,0,0.2));
            box-shadow: 0 0 15px ${material.edgeColor}60;
          "></div>
          <div style="color: #fff; font-weight: bold; font-size: ${isMobileDevice ? '0.8rem' : '1rem'}; margin-bottom: ${isMobileDevice ? '4px' : '6px'}; line-height: 1.2;">${material.name}</div>
          <div style="color: ${material.edgeColor}; font-size: ${isMobileDevice ? '0.65rem' : '0.8rem'}; margin-bottom: ${isMobileDevice ? '4px' : '8px'}; line-height: 1.2;">${material.description}</div>
          <div style="color: #fff; font-size: ${isMobileDevice ? '0.6rem' : '0.7rem'}; opacity: 0.7; line-height: 1.3;">${material.characteristics}</div>
        </div>
      `;
      }).join('')}
    </div>
    
    <button class="close-btn" style="
      width: 100%;
      max-width: ${isMobile() ? '300px' : '400px'};
      margin: ${isMobile() ? '15px' : '20px'} auto 0;
      padding: 16px;
      background: linear-gradient(135deg, #ff1493, #ff69b4);
      border: none;
      border-radius: 12px;
      color: white;
      font-weight: bold;
      cursor: pointer;
      font-family: 'Orbitron', sans-serif;
      font-size: 1rem;
      letter-spacing: 1px;
      display: block;
      box-shadow: 0 4px 15px rgba(255, 20, 147, 0.4);
      transition: all 0.3s ease;
    ">APPLY CHANGES</button>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);
  
  let selectedCoin = tubes[tubeIndex]?.selectedCoin || coinOptions[0];
  let selectedMaterial = tubes[tubeIndex]?.selectedMaterial || coinMaterials[0];
  
  updateCoinDisplay();
  
  function attachCoinEventListeners() {
    content.querySelectorAll('.coin-option').forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const coinId = option.dataset.coinId;
        const cost = parseInt(option.dataset.cost);
        const isUnlocked = option.dataset.unlocked === 'true';
        
        if (coinId === 'custom') {
          selectedCoin = {
            id: 'custom',
            name: 'Custom',
            headsImage: customCoinHeads,
            tailsImage: customCoinTails,
            cost: 0
          };
        } else {
          const coin = coinOptions.find(c => c.id === coinId);
          if (!coin) return;
          
          if (!isUnlocked && cost > 0) {
            if (playerFlipBalance >= cost && isServerSideMode && socket && walletParam) {
              socket.emit('unlock_coin', { address: walletParam, coinId, cost });
              socket.once('coin_unlocked', (result) => {
                if (result.success) {
                  playerFlipBalance = result.newBalance;
                  unlockedCoins = result.unlockedCoins;
                  updateCoinDisplay();
                  selectedCoin = coin;
                } else {
                  alert(`Failed to unlock: ${result.error}`);
                }
              });
              return;
            } else {
              alert(`Not enough FLIP! You need ${cost} FLIP.`);
              return;
            }
          }
          selectedCoin = coin;
        }
        
        content.querySelectorAll('.coin-option').forEach(opt => {
          opt.style.background = opt.dataset.unlocked === 'true' ? 'rgba(255, 215, 0, 0.08)' : 'rgba(255, 0, 0, 0.1)';
          opt.style.borderColor = opt.dataset.unlocked === 'true' ? 'rgba(255, 215, 0, 0.25)' : 'rgba(255, 0, 0, 0.5)';
        });
        
        const selectedOption = content.querySelector(`[data-coin-id="${selectedCoin.id}"]`);
        if (selectedOption) {
          selectedOption.style.background = 'rgba(255, 215, 0, 0.4)';
          selectedOption.style.borderColor = '#FFD700';
          selectedOption.style.borderWidth = '3px';
        }
      });
    });
  }
  
  content.querySelectorAll('.material-option').forEach(option => {
    option.addEventListener('click', () => {
      const materialId = option.dataset.materialId;
      selectedMaterial = coinMaterials.find(m => m.id === materialId);
      
      content.querySelectorAll('.material-option').forEach(opt => {
        opt.style.background = 'rgba(255, 255, 255, 0.05)';
        opt.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      });
      
      option.style.background = 'rgba(255, 215, 0, 0.2)';
      option.style.borderColor = '#FFD700';
    });
  });
  
  const closeBtn = content.querySelector('.close-btn');
  closeBtn.addEventListener('click', () => {
    if (tubes[tubeIndex]) {
      tubes[tubeIndex].selectedCoin = selectedCoin;
      tubes[tubeIndex].selectedMaterial = selectedMaterial;
      applyCoinSelection(tubeIndex, selectedCoin, selectedMaterial);
    }
    modal.remove();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  content.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

