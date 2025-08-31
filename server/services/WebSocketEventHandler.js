const wsHandlers = require('./websocket-handlers');

class WebSocketEventHandler {
  constructor(gameEventService) {
    this.gameEventService = gameEventService;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for offer made events
    this.gameEventService.on(this.gameEventService.eventTypes.OFFER_MADE, (event) => {
      this.handleOfferMade(event);
    });

    // Listen for offer accepted events
    this.gameEventService.on(this.gameEventService.eventTypes.OFFER_ACCEPTED, (event) => {
      this.handleOfferAccepted(event);
    });

    // Listen for game status changed events
    this.gameEventService.on(this.gameEventService.eventTypes.GAME_STATUS_CHANGED, (event) => {
      this.handleGameStatusChanged(event);
    });

    // Listen for deposit made events
    this.gameEventService.on(this.gameEventService.eventTypes.DEPOSIT_MADE, (event) => {
      this.handleDepositMade(event);
    });

    // Listen for game started events
    this.gameEventService.on(this.gameEventService.eventTypes.GAME_STARTED, (event) => {
      this.handleGameStarted(event);
    });

    // Listen for round completed events
    this.gameEventService.on(this.gameEventService.eventTypes.ROUND_COMPLETED, (event) => {
      this.handleRoundCompleted(event);
    });

    // Listen for game ended events
    this.gameEventService.on(this.gameEventService.eventTypes.GAME_ENDED, (event) => {
      this.handleGameEnded(event);
    });

    // Listen for chat message events
    this.gameEventService.on(this.gameEventService.eventTypes.CHAT_MESSAGE, (event) => {
      this.handleChatMessage(event);
    });

    console.log('✅ WebSocket event handlers registered');
  }

  // Handle offer made event
  handleOfferMade(event) {
    console.log('📨 Handling offer made event:', event);
    
    const { gameId, eventData, targetUsers } = event;
    
    // Send notification to creator only
    targetUsers.forEach(userAddress => {
      wsHandlers.sendToUser(userAddress, {
        type: 'offer_made',
        gameId,
        data: {
          offerId: eventData.id,
          offererAddress: eventData.offerer_address,
          offerPrice: eventData.offer_price,
          message: eventData.message,
          timestamp: eventData.timestamp
        }
      });
    });
  }

  // Handle offer accepted event
  handleOfferAccepted(event) {
    console.log('📨 Handling offer accepted event:', event);
    
    const { gameId, eventData, targetUsers } = event;
    
    // Send different messages to creator and challenger
    targetUsers.forEach(userAddress => {
      const isCreator = userAddress === eventData.creator;
      const isChallenger = userAddress === eventData.challenger;
      
      if (isCreator) {
        // Creator gets notification that offer was accepted
        wsHandlers.sendToUser(userAddress, {
          type: 'offer_accepted',
          gameId,
          data: {
            offerId: eventData.id,
            challenger: eventData.challenger,
            finalPrice: eventData.offer_price,
            timestamp: eventData.timestamp
          }
        });
      } else if (isChallenger) {
        // Challenger gets notification that their offer was accepted
        wsHandlers.sendToUser(userAddress, {
          type: 'your_offer_accepted',
          gameId,
          data: {
            offerId: eventData.id,
            creator: eventData.creator,
            finalPrice: eventData.offer_price,
            timestamp: eventData.timestamp
          }
        });
      }
    });
  }

  // Handle game status changed event
  handleGameStatusChanged(event) {
    console.log('📨 Handling game status changed event:', event);
    
    const { gameId, eventData, targetUsers } = event;
    
    // Send status change notification to all affected users
    targetUsers.forEach(userAddress => {
      wsHandlers.sendToUser(userAddress, {
        type: 'game_status_changed',
        gameId,
        data: {
          newStatus: eventData.newStatus,
          previousStatus: eventData.previousStatus,
          timestamp: eventData.timestamp
        }
      });
    });
  }

  // Handle deposit made event
  handleDepositMade(event) {
    console.log('📨 Handling deposit made event:', event);
    
    const { gameId, eventData, targetUsers } = event;
    
    // Send deposit notification to all affected users
    targetUsers.forEach(userAddress => {
      wsHandlers.sendToUser(userAddress, {
        type: 'deposit_made',
        gameId,
        data: {
          depositor: eventData.depositor,
          depositType: eventData.depositType, // 'crypto' or 'nft'
          amount: eventData.amount,
          timestamp: eventData.timestamp
        }
      });
    });
  }

  // Handle game started event
  handleGameStarted(event) {
    console.log('📨 Handling game started event:', event);
    
    const { gameId, eventData, targetUsers } = event;
    
    // Send game started notification to all players
    targetUsers.forEach(userAddress => {
      wsHandlers.sendToUser(userAddress, {
        type: 'game_started',
        gameId,
        data: {
          creator: eventData.creator,
          challenger: eventData.challenger,
          timestamp: eventData.timestamp
        }
      });
    });
  }

  // Handle round completed event
  handleRoundCompleted(event) {
    console.log('📨 Handling round completed event:', event);
    
    const { gameId, eventData, targetUsers } = event;
    
    // Send round result to all players
    targetUsers.forEach(userAddress => {
      wsHandlers.sendToUser(userAddress, {
        type: 'round_completed',
        gameId,
        data: {
          roundNumber: eventData.roundNumber,
          winner: eventData.winner,
          result: eventData.result,
          timestamp: eventData.timestamp
        }
      });
    });
  }

  // Handle game ended event
  handleGameEnded(event) {
    console.log('📨 Handling game ended event:', event);
    
    const { gameId, eventData, targetUsers } = event;
    
    // Send game end notification to all players
    targetUsers.forEach(userAddress => {
      wsHandlers.sendToUser(userAddress, {
        type: 'game_ended',
        gameId,
        data: {
          winner: eventData.winner,
          finalScore: eventData.finalScore,
          timestamp: eventData.timestamp
        }
      });
    });
  }

  // Handle chat message event
  handleChatMessage(event) {
    console.log('📨 Handling chat message event:', event);
    
    const { gameId, eventData, targetUsers } = event;
    
    // Send chat message to all users in the game
    targetUsers.forEach(userAddress => {
      wsHandlers.sendToUser(userAddress, {
        type: 'chat_message',
        gameId,
        data: {
          sender: eventData.sender,
          message: eventData.message,
          timestamp: eventData.timestamp
        }
      });
    });
  }

  // Send targeted message to specific users
  sendTargetedMessage(messageType, gameId, data, targetUsers) {
    console.log(`📨 Sending targeted ${messageType} message to:`, targetUsers);
    
    targetUsers.forEach(userAddress => {
      wsHandlers.sendToUser(userAddress, {
        type: messageType,
        gameId,
        data,
        timestamp: new Date().toISOString()
      });
    });
  }
}

module.exports = WebSocketEventHandler;
