/**
 * Update Client From Server State
 * Handles synchronization of game state from server to client
 */

import { TUBE_RADIUS, TUBE_HEIGHT, TUBE_Y_POSITION } from '../config.js';
import { updateCoinRotationsFromPlayerChoices, updateCoinStatesFromServer } from '../systems/coin-manager.js';

/**
 * Update client state from server state update
 */
export function updateClientFromServerState(state, dependencies) {
  const {
    gameOver,
    players,
    tubes,
    coins,
    scene,
    physicsWorld,
    playerSlot,
    walletParam,
    gameIdParam,
    currentRound,
    updateRoundDisplay,
    updateTimerDisplay,
    saveGameState,
    updateWinsDisplay,
    updatePlayerCardButtons,
    updatePearlColors,
    showGameOverScreen
  } = dependencies;

  if (gameOver && state && state.phase !== 'game_over') {
    console.log('🛑 Ignoring state update after game over:', state.phase);
    return;
  }
  if (!state) return;

  if (state.phase === 'round_active' && !gameOver) {
    const existingIndicator = document.getElementById('game-phase-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    console.log(`🎮 Game is now round_active - Round ${state.currentRound}`);
    updatePlayerCardButtons();
  } else if (state.phase === 'game_over') {
    console.log(`🏁 GAME OVER DETECTED!`, {
      phase: state.phase,
      winner: state.winner,
      gameOver: gameOver,
      players: players.map(p => ({ name: p.name, address: p.address }))
    });

    if (state.winner) {
      const winnerIndex = players.findIndex(p => p.address && p.address.toLowerCase() === state.winner.toLowerCase());
      console.log(`🏆 Winner search:`, {
        winnerAddress: state.winner,
        winnerIndex: winnerIndex,
        players: players.map(p => ({ name: p.name, address: p.address }))
      });

      if (winnerIndex >= 0) {
        console.log(`🏆 Server declared winner: ${players[winnerIndex].name}`);
        if (typeof showGameOverScreen === 'function') {
          showGameOverScreen(winnerIndex, players[winnerIndex].name);
        } else {
          console.error('❌ showGameOverScreen is not a function:', typeof showGameOverScreen);
        }
      } else {
        console.log(`🏆 Server declared winner but couldn't find player: ${state.winner}`);
        if (typeof showGameOverScreen === 'function') {
          showGameOverScreen(-1, state.winner);
        } else {
          console.error('❌ showGameOverScreen is not a function:', typeof showGameOverScreen);
        }
      }
    } else {
      console.log(`🏆 Server declared game over with no winner`);
      if (typeof showGameOverScreen === 'function') {
        showGameOverScreen(-1, null);
      } else {
        console.error('❌ showGameOverScreen is not a function:', typeof showGameOverScreen);
      }
    }
  }

  if (state.players && walletParam) {
    const normalizedAddress = walletParam.toLowerCase();
    const player = state.players[normalizedAddress];
    if (player) {
      playerSlot = player.slotNumber;
      console.log(`🎮 Player slot: ${playerSlot}`);

      if (playerSlot >= 0 && playerSlot < 4) {
        tubes[playerSlot].isCurrentPlayer = true;
        players[playerSlot].isCurrentPlayer = true;
      }

      updatePlayerCardButtons();
    }

    Object.keys(state.players).forEach(address => {
      const serverPlayer = state.players[address];
      if (serverPlayer && serverPlayer.slotNumber >= 0 && serverPlayer.slotNumber < 4) {
        const localPlayer = players[serverPlayer.slotNumber];
        if (localPlayer && !localPlayer.isEmpty) {
          if (serverPlayer.choice !== localPlayer.choice) {
            console.log(`🔄 Syncing player ${serverPlayer.slotNumber + 1} choice: ${serverPlayer.choice || 'null'} (was: ${localPlayer.choice || 'null'})`);
            localPlayer.choice = serverPlayer.choice;

            const tube = tubes[serverPlayer.slotNumber];
            if (tube && tube.cardElement) {
              const choiceButtons = tube.cardElement.querySelector('.choice-buttons');
              const choiceBadge = tube.cardElement.querySelector('.choice-badge');

              if (choiceButtons && choiceBadge) {
                if (serverPlayer.choice) {
                  choiceButtons.style.display = 'none';
                  choiceBadge.style.display = 'inline-block';
                  choiceBadge.textContent = serverPlayer.choice.toUpperCase();
                  choiceBadge.className = `choice-badge ${serverPlayer.choice}`;
                } else {
                  choiceBadge.style.display = 'none';
                  if (playerSlot === serverPlayer.slotNumber) {
                    choiceButtons.style.display = 'flex';
                  } else {
                    choiceButtons.style.display = 'none';
                  }
                }
              }
            }
          }

          if (serverPlayer.wins !== undefined && localPlayer.wins !== serverPlayer.wins) {
            localPlayer.wins = serverPlayer.wins;
            updateWinsDisplay(serverPlayer.slotNumber);
          }
        }
      }
    });
  }

  if (state.roundTimer !== undefined) {
    updateTimerDisplay(state.roundTimer);
  }

  if (state.currentRound !== undefined) {
    const oldRound = currentRound;
    currentRound = state.currentRound;
    updateRoundDisplay();
    // Note: saveGameState needs args but currentRound is read-only here
    // The caller should handle saving if needed

    if (currentRound > oldRound) {
      console.log(`🔄 Round ${currentRound} started - FULL RESET`);
      tubes.forEach((tube, i) => {
        tube.hasUsedPower = false;
        tube.power = 0;
        tube.isFilling = false;
        tube.foamIntensity = 0;

        tube.isShattered = false;
        tube.animationState = 'idle';
        tube.animationStartTime = null;
        tube.animationEndTime = null;
        tube.flipId = null;
        tube.landingId = null;
        tube.lastStableRotation = null;
        tube.isFlipping = false;
        tube.isLanding = false;
        tube.flipStartTime = null;
        tube.currentFlipId = null;
        tube.currentLandingId = null;

        tube.tube.visible = true;
        tube.backing.visible = true;
        tube.topRim.visible = true;
        tube.bottomRim.visible = true;
        tube.liquid.visible = true;
        tube.coinShadow.visible = false;

        if (tube.glassShards && tube.glassShards.length > 0) {
          tube.glassShards.forEach(shard => {
            scene.remove(shard.mesh);
          });
          tube.glassShards = [];
        }

        if (!physicsWorld.bodies.includes(tube.glassBody)) {
          physicsWorld.addBody(tube.glassBody);
        }

        updatePearlColors(tube, 0, i);

        tube.liquidParticles.forEach((particleBody, idx) => {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * (TUBE_RADIUS - 25);
          const pearlX = tube.tube.position.x + Math.cos(angle) * radius;
          const pearlZ = Math.sin(angle) * radius;
          const pearlY = TUBE_Y_POSITION - (TUBE_HEIGHT / 2) + 30 + Math.random() * 60;

          particleBody.position.set(pearlX, pearlY, pearlZ);
          particleBody.velocity.set(0, 0, 0);
          particleBody.angularVelocity.set(0, 0, 0);

          if (tube.liquidParticleMeshes[idx]) {
            tube.liquidParticleMeshes[idx].visible = true;
          }
        });

        tube.liquidLight.color.setHex(0x1a1a2e);
        tube.liquidLight.intensity = 0.3;

        const coin = coins[i];
        if (coin) {
          coin.position.set(tube.tube.position.x, TUBE_Y_POSITION, 0);
          coin.rotation.x = Math.PI / 2;
          coin.rotation.y = Math.PI / 2;
          coin.rotation.z = 0;
          coin.quaternion.setFromEuler(coin.rotation);

          if (tube.winLight) {
            coin.remove(tube.winLight);
            tube.winLight = null;
          }
          if (tube.loseLight) {
            coin.remove(tube.loseLight);
            tube.loseLight = null;
          }
        }

        if (tube.resultBox) {
          scene.remove(tube.resultBox);
          tube.resultBox = null;
        }

        if (tube.cardElement) {
          const powerButton = tube.cardElement.querySelectorAll('.action-btn')[0];
          if (powerButton) {
            powerButton.style.background = 'linear-gradient(135deg, #9d00ff, #c44aff)';
            powerButton.style.color = '#ffffff';
            powerButton.style.borderColor = '#9d00ff';
            powerButton.disabled = false;
            powerButton.style.opacity = '1';
            powerButton.style.cursor = 'pointer';
          }

          const powerFill = tube.cardElement.querySelector('.power-fill');
          const powerValue = tube.cardElement.querySelector('.power-value');
          if (powerFill) {
            powerFill.style.width = '0%';
          }
          if (powerValue) {
            powerValue.textContent = '0';
          }
        }
      });

      players.forEach((player, i) => {
        if (!player.isEmpty) {
          player.choice = null;

          const tube = tubes[i];
          if (tube && tube.cardElement) {
            const choiceButtons = tube.cardElement.querySelector('.choice-buttons');
            const choiceBadge = tube.cardElement.querySelector('.choice-badge');

            if (choiceButtons && choiceBadge) {
              choiceBadge.style.display = 'none';
              if (playerSlot === i) {
                choiceButtons.style.display = 'flex';

                const choiceBtnElements = tube.cardElement.querySelectorAll('.choice-btn');
                choiceBtnElements.forEach(btn => {
                  btn.style.opacity = '1';
                  btn.style.transform = 'scale(1)';
                  btn.style.boxShadow = '';
                });
              } else {
                choiceButtons.style.display = 'none';
              }
            }
          }
        }
      });

      const mobileHeadsBtn = document.getElementById('mobile-heads');
      const mobileTailsBtn = document.getElementById('mobile-tails');
      if (mobileHeadsBtn && mobileTailsBtn) {
        mobileHeadsBtn.classList.remove('selected');
        mobileTailsBtn.classList.remove('selected');
      }

      const mobilePowerFill = document.getElementById('mobile-power-fill');
      const mobilePowerValue = document.querySelector('#mobile-power-text .power-value');
      if (mobilePowerFill && mobilePowerValue) {
        mobilePowerFill.style.width = '0%';
        mobilePowerValue.textContent = '0';
      }

      console.log(`✅ Round ${currentRound} reset complete - players can charge and choose again`);
      updatePlayerCardButtons();
    }
  }

  if (state.coinStates) {
    updateCoinStatesFromServer(state.coinStates, tubes, coins);
  }

  updateCoinRotationsFromPlayerChoices(tubes, players, coins);
}

