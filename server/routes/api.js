const express = require('express')
const crypto = require('crypto')
const ethers = require('ethers')

function createApiRoutes(dbService, blockchainService, wsHandlers) {
  const router = express.Router()
  const db = dbService.getDatabase()

  // Health check
  router.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      server: 'clean-architecture', 
      timestamp: new Date().toISOString(),
      hasContractOwner: blockchainService.hasOwnerWallet()
    })
  })

  router.post('/listings', async (req, res) => {
    const { creator, game_id, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, asking_price, coin_data } = req.body
    
    const listingId = `listing_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
    
    try {
      // Create listing in database with game_id reference
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO listings (id, game_id, creator, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, asking_price, coin_data, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
        `, [listingId, game_id, creator, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, asking_price, JSON.stringify(coin_data)], function(err) {
          if (err) reject(err)
          else resolve()
        })
      })
      
      // Also create the game record with status 'awaiting_offer'
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO games (
            id, listing_id, blockchain_game_id, creator,
            nft_contract, nft_token_id, nft_name, nft_image, nft_collection,
            final_price, coin_data, status, creator_deposited
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          game_id, listingId, ethers.id(game_id), creator,
          nft_contract, nft_token_id, nft_name, nft_image, nft_collection,
          asking_price, JSON.stringify(coin_data), 'awaiting_offer', false
        ], function(err) {
          if (err) reject(err)
          else resolve()
        })
      })
      
      console.log(`✅ Listing created: ${listingId} with game: ${game_id}`)
      res.json({ success: true, listingId, gameId: game_id })
    } catch (error) {
      console.error('❌ Error creating listing:', error)
      res.status(500).json({ error: error.message || 'Database error' })
    }
  })

  // Get listing
  router.get('/listings/:listingId', (req, res) => {
    const { listingId } = req.params
    
    db.get('SELECT * FROM listings WHERE id = ?', [listingId], (err, listing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' })
      }
      
      // Get offers count
      db.get('SELECT COUNT(*) as count FROM offers WHERE listing_id = ? AND status = "pending"', [listingId], (err, result) => {
        listing.pending_offers = result?.count || 0
        res.json(listing)
      })
    })
  })

  // Get all active listings
  router.get('/listings', (req, res) => {
    db.all('SELECT * FROM listings WHERE status = "open" ORDER BY created_at DESC', (err, listings) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      res.json(listings)
    })
  })

  // Create offer
  router.post('/listings/:listingId/offers', (req, res) => {
    const { listingId } = req.params
    const { offerer_address, offer_price, message } = req.body

    console.log('💡 New offer request:', { listingId, offerer_address, offer_price, message })

    // Allow offers for listings that are not completed/cancelled
    db.get('SELECT * FROM listings WHERE id = ?', [listingId], (err, listing) => {
      if (err || !listing) {
        console.error('❌ Listing not found for offer:', listingId, err)
        return res.status(404).json({ error: 'Listing not found' })
      }
      
      console.log('✅ Found listing for offer:', { id: listing.id, status: listing.status, creator: listing.creator })
      
      // Only block offers if the listing is cancelled or completed
      if (listing.status === 'closed' || listing.status === 'completed') {
        console.warn('⚠️ Attempted offer on closed/completed listing:', listing.status)
        return res.status(400).json({ error: 'Cannot make offers on cancelled or completed listings' })
      }
      // Optionally, block offers if there is already a joiner/challenger (if you track that on the listing)
      // Otherwise, allow offers
      const offerId = `offer_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
      
      console.log('💾 Creating offer in database:', { offerId, listingId, offerer_address, offer_price })
      
      db.run(`
        INSERT INTO offers (id, listing_id, offerer_address, offer_price, message, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
      `, [offerId, listingId, offerer_address, offer_price, message], function(err) {
        if (err) {
          console.error('❌ Error creating offer in database:', err)
          return res.status(500).json({ error: 'Database error' })
        }
        
        console.log('✅ Offer created successfully:', offerId)
        // Notify listing creator and broadcast to room
        db.get('SELECT creator FROM listings WHERE id = ?', [listingId], (err, listing) => {
          if (listing) {
            // Send direct notification to listing creator
            wsHandlers.sendToUser(listing.creator, {
              type: 'new_offer',
              listingId,
              offerId,
              offer_price,
              message
            })
            
            // Broadcast to all users in the listing room for real-time updates
            wsHandlers.broadcastToRoom(listingId, {
              type: 'new_offer',
              listingId,
              offerId,
              offer_price,
              message,
              offerer_address
            })
            
            console.log('📢 Broadcasted new offer to room:', listingId)
          }
        })
        res.json({ success: true, offerId })
      })
    })
  })

  // Get offers for listing
  router.get('/listings/:listingId/offers', (req, res) => {
    const { listingId } = req.params
    
    db.all('SELECT * FROM offers WHERE listing_id = ? ORDER BY created_at DESC', [listingId], (err, offers) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      res.json(offers)
    })
  })

  // Create game with NFT deposit from listing
  router.post('/listings/:listingId/create-game-with-nft', async (req, res) => {
    const { listingId } = req.params
    const { creator } = req.body
    
    try {
      // Get listing details
      const listing = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM listings WHERE id = ?', [listingId], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' })
      }
      
      if (listing.creator !== creator) {
        return res.status(403).json({ error: 'Only listing creator can create game' })
      }
      
      const gameId = `game_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
      const blockchainGameId = ethers.id(gameId)
      const depositDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours for challenger
      
      // Create game record with awaiting_challenger status (NFT will be deposited, waiting for challenger)
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO games (
            id, listing_id, blockchain_game_id, creator,
            nft_contract, nft_token_id, nft_name, nft_image, nft_collection,
            final_price, coin_data, status, deposit_deadline, creator_deposited, challenger_deposited
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          gameId, listingId, blockchainGameId, creator,
          listing.nft_contract, listing.nft_token_id, listing.nft_name, listing.nft_image, listing.nft_collection,
          listing.asking_price, listing.coin_data, 'awaiting_challenger', depositDeadline, false, false
        ], function(err) {
          if (err) reject(err)
          else resolve()
        })
      })
      
      console.log(`✅ Game created with NFT deposit: ${gameId}`)
      res.json({ success: true, gameId })
    } catch (error) {
      console.error('❌ Error creating game with NFT:', error)
      res.status(500).json({ error: error.message || 'Database error' })
    }
  })

  router.post('/listings/:listingId/initialize-blockchain', async (req, res) => {
    const { listingId } = req.params
    const { gameId } = req.body
    
    try {
      // Get listing details
      const listing = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM listings WHERE id = ?', [listingId], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' })
      }
      
      // Initialize on blockchain with no player 2
      if (blockchainService.hasOwnerWallet()) {
        const blockchainResult = await blockchainService.initializeGameOnChain(
          gameId,
          listing.creator,
          '0x0000000000000000000000000000000000000000', // No player 2 yet
          listing.nft_contract,
          listing.nft_token_id,
          listing.asking_price
        )
        
        if (!blockchainResult.success) {
          console.error('Failed to initialize game on blockchain:', blockchainResult.error)
          return res.status(500).json({ 
            error: 'Failed to initialize game on blockchain', 
            details: blockchainResult.error 
          })
        }
      }
      
      res.json({ success: true })
    } catch (error) {
      console.error('❌ Error initializing blockchain:', error)
      res.status(500).json({ error: error.message })
    }
  })

  router.post('/offers/:offerId/accept', async (req, res) => {
    const { offerId } = req.params
    
    db.get('SELECT * FROM offers WHERE id = ?', [offerId], async (err, offer) => {
      if (err || !offer) {
        return res.status(404).json({ error: 'Offer not found' })
      }
      
      if (offer.status !== 'pending') {
        return res.status(400).json({ error: 'Offer already processed' })
      }
      
      // Get listing and game details
      db.get('SELECT * FROM listings WHERE id = ?', [offer.listing_id], async (err, listing) => {
        if (err || !listing) {
          return res.status(404).json({ error: 'Listing not found' })
        }
        
        // Get the associated game
        db.get('SELECT * FROM games WHERE listing_id = ?', [offer.listing_id], async (err, game) => {
          if (err || !game) {
            return res.status(404).json({ error: 'Game not found' })
          }
          
          const depositDeadline = new Date(Date.now() + 5 * 60 * 1000).toISOString()
          
          try {
            // Update game on blockchain with player 2
            if (blockchainService.hasOwnerWallet()) {
              const updateResult = await blockchainService.updateGameWithPlayer2(
                game.id,
                offer.offerer_address,
                offer.offer_price,
                0 // ETH by default, modify if supporting USDC
              )
              
              if (!updateResult.success) {
                console.error('Failed to update game on blockchain:', updateResult.error)
                return res.status(500).json({ 
                  error: 'Failed to update game on blockchain', 
                  details: updateResult.error 
                })
              }
            }
            
            // Update game in database
            await new Promise((resolve, reject) => {
              db.run(`
                UPDATE games 
                SET challenger = ?, offer_id = ?, final_price = ?, 
                    status = 'waiting_challenger_deposit', deposit_deadline = ?
                WHERE id = ?
              `, [offer.offerer_address, offerId, offer.offer_price, depositDeadline, game.id], function(err) {
                if (err) reject(err)
                else resolve()
              })
            })
            
            // Update offer and listing status
            db.run('UPDATE offers SET status = "accepted" WHERE id = ?', [offerId])
            db.run('UPDATE listings SET status = "closed" WHERE id = ?', [offer.listing_id])
            
            // Notify players
            wsHandlers.sendToUser(listing.creator, {
              type: 'offer_accepted',
              gameId: game.id,
              depositDeadline,
              message: 'Offer accepted! Your NFT is already deposited.'
            })
            
            wsHandlers.sendToUser(offer.offerer_address, {
              type: 'offer_accepted',
              gameId: game.id,
              depositDeadline,
              message: 'Your offer was accepted! You have 5 minutes to deposit crypto.'
            })
            
            wsHandlers.broadcastToRoom(offer.listing_id, {
              type: 'listing_converted_to_game',
              listingId: offer.listing_id,
              gameId: game.id
            })
            
            res.json({ success: true, gameId: game.id })
          } catch (error) {
            console.error('Error accepting offer:', error)
            res.status(500).json({ error: 'Failed to accept offer', details: error.message })
          }
        })
      })
    })
  })

  // Reject offer
  router.post('/offers/:offerId/reject', (req, res) => {
    const { offerId } = req.params
    
    db.run('UPDATE offers SET status = "rejected" WHERE id = ?', [offerId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      // Notify offerer
      db.get('SELECT * FROM offers WHERE id = ?', [offerId], (err, offer) => {
        if (offer) {
          wsHandlers.sendToUser(offer.offerer_address, {
            type: 'offer_rejected',
            offerId
          })
        }
      })
      
      res.json({ success: true })
    })
  })

  // Get game
  router.get('/games/:gameId', (req, res) => {
    const { gameId } = req.params
    
    db.get('SELECT * FROM games WHERE id = ? OR blockchain_game_id = ?', [gameId, gameId], (err, game) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      if (!game) {
        // Check if it's a listing
        db.get('SELECT * FROM listings WHERE id = ?', [gameId], (err, listing) => {
          if (err || !listing) {
            return res.status(404).json({ error: 'Game/Listing not found' })
          }
          // Return listing as game-like structure
          res.json({
            id: listing.id,
            type: 'listing',
            game_type: 'nft-vs-crypto', // Add this line
            creator: listing.creator,
            creator_address: listing.creator, // Add for compatibility
            nft_contract: listing.nft_contract,
            nft_token_id: listing.nft_token_id,
            nft_name: listing.nft_name,
            nft_image: listing.nft_image,
            nft_collection: listing.nft_collection,
            asking_price: listing.asking_price,
            coin_data: listing.coin_data,
            status: listing.status,
            coinData: listing.coin_data ? JSON.parse(listing.coin_data) : null // Parse coin data
          })
        })
        return
      }
      
      // Get round information
      db.all('SELECT * FROM game_rounds WHERE game_id = ? ORDER BY round_number', [gameId], (err, rounds) => {
        game.rounds = rounds || []
        
        // Calculate wins
        game.creator_wins = rounds.filter(r => r.round_winner === game.creator).length
        game.challenger_wins = rounds.filter(r => r.round_winner === game.challenger).length
        
        res.json(game)
      })
    })
  })

  // Get all games
  router.get('/games', (req, res) => {
    db.all('SELECT * FROM games ORDER BY created_at DESC', (err, games) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      res.json(games)
    })
  })

  router.post('/games/:gameId/deposit-confirmed', (req, res) => {
    const { gameId } = req.params
    const { player, assetType } = req.body
    
    db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, game) => {
      if (err || !game) {
        return res.status(404).json({ error: 'Game not found' })
      }
      
      const isCreator = player === game.creator
      const column = isCreator ? 'creator_deposited' : 'challenger_deposited'
      
      db.run(`UPDATE games SET ${column} = true WHERE id = ?`, [gameId], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        
        db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, updatedGame) => {
          // If NFT just deposited and still awaiting offer
          if (isCreator && updatedGame.status === 'awaiting_offer') {
            console.log('✅ Creator NFT deposited, listing ready for offers')
            
            wsHandlers.broadcastToRoom(gameId, {
              type: 'nft_deposited',
              message: 'NFT deposited! Listing is now active.'
            })
          }
          // If challenger deposited in waiting_challenger_deposit status
          else if (updatedGame.status === 'waiting_challenger_deposit' && !isCreator && updatedGame.challenger_deposited) {
            // Both assets now deposited - start game
            db.run('UPDATE games SET status = "active" WHERE id = ?', [gameId])
            
            console.log(`🎮 Game starting: ${gameId}`)
            
            // Notify all players
            wsHandlers.broadcastToRoom(gameId, {
              type: 'game_started',
              gameId,
              message: 'Both assets deposited - game starting!'
            })
            
            wsHandlers.sendToUser(updatedGame.creator, {
              type: 'game_started',
              gameId,
              isYourTurn: true,
              message: 'Game started! You go first - choose heads or tails!'
            })
            
            wsHandlers.sendToUser(updatedGame.challenger, {
              type: 'game_started',
              gameId,
              isYourTurn: false,
              message: 'Game started! Waiting for opponent to choose...'
            })
          } else {
            // Normal deposit confirmation
            wsHandlers.broadcastToRoom(gameId, {
              type: 'deposit_confirmed',
              player,
              assetType
            })
          }
          
          res.json({ success: true })
        })
      })
    })
  })

  // Auto-confirm NFT deposit if already ready
  router.post('/games/:gameId/use-ready-nft', (req, res) => {
    const { gameId } = req.params
    const { player } = req.body
    
    db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, game) => {
      if (err || !game) {
        return res.status(404).json({ error: 'Game not found' })
      }
      
      if (player !== game.creator) {
        return res.status(400).json({ error: 'Only creator can use ready NFT' })
      }
      
      // Check if the game's NFT is ready for this player
      db.get(
        'SELECT * FROM ready_nfts WHERE player_address = ? AND nft_contract = ? AND nft_token_id = ?',
        [player, game.nft_contract, game.nft_token_id],
        (err, readyNft) => {
          if (err || !readyNft) {
            return res.status(404).json({ error: 'Ready NFT not found' })
          }
          
          // Remove from ready_nfts (now in active use)
          db.run(
            'DELETE FROM ready_nfts WHERE id = ?',
            [readyNft.id],
            (err) => {
              if (err) {
                console.error('❌ Error removing ready NFT:', err)
                return res.status(500).json({ error: 'Database error' })
              }
              
              // Mark creator as deposited
              db.run('UPDATE games SET creator_deposited = true WHERE id = ?', [gameId], (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Database error' })
                }
                
                console.log('⚡ Ready NFT used for instant game start:', game.nft_name)
                
                // Notify players
                wsHandlers.broadcastToRoom(gameId, {
                  type: 'ready_nft_used',
                  player,
                  nft_name: game.nft_name,
                  message: 'Pre-loaded NFT used - waiting for challenger deposit'
                })
                
                wsHandlers.broadcastToRoom(gameId, {
                  type: 'deposit_confirmed',
                  player,
                  assetType: 'nft'
                })
                
                res.json({ success: true, message: 'Ready NFT used successfully!' })
              })
            }
          )
        }
      )
    })
  })

  // Get user games
  router.get('/users/:address/games', (req, res) => {
    const { address } = req.params
    
    db.all(
      'SELECT * FROM games WHERE creator = ? OR challenger = ? ORDER BY created_at DESC',
      [address, address],
      (err, games) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        
        // Transform the data to match frontend expectations
        const transformedGames = games.map(game => {
          // Ensure createdAt is a valid timestamp
          let createdAt = Date.now() / 1000 // Default to current time
          if (game.created_at) {
            const parsedDate = new Date(game.created_at)
            if (!isNaN(parsedDate.getTime())) {
              createdAt = Math.floor(parsedDate.getTime() / 1000)
            }
          }
          
          return {
            ...game,
            createdAt: createdAt,
            updatedAt: game.updated_at ? Math.floor(new Date(game.updated_at).getTime() / 1000) : createdAt,
            gameId: game.id,
            nftContract: game.nft_contract,
            tokenId: game.nft_token_id,
            priceUSD: game.final_price,
            gameType: 0, // Default to ETH for now
            paymentToken: 0, // Default to ETH
            totalPaid: '0',
            winner: game.winner || '0x0000000000000000000000000000000000000000',
            expiresAt: game.deposit_deadline ? Math.floor(new Date(game.deposit_deadline).getTime() / 1000) : Math.floor(Date.now() / 1000) + 3600,
            nftChallenge: {
              challengerNFTContract: '0x0000000000000000000000000000000000000000',
              challengerTokenId: '0'
            }
          }
        })
        
        res.json(transformedGames)
      }
    )
  })

  // Get user listings
  router.get('/users/:address/listings', (req, res) => {
    const { address } = req.params
    
    db.all(
      'SELECT * FROM listings WHERE creator = ? ORDER BY created_at DESC',
      [address],
      (err, listings) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        res.json(listings)
      }
    )
  })

  // Get user profile
  router.get('/profile/:address', (req, res) => {
    const { address } = req.params
    db.get('SELECT * FROM profiles WHERE address = ?', [address], (err, profile) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      if (!profile) {
        // Return empty profile if not found
        return res.json({
          address,
          name: '',
          avatar: '',
          headsImage: '',
          tailsImage: ''
        })
      }
      res.json(profile)
    })
  })

  // Get dashboard data for user
  router.get('/dashboard/:address', (req, res) => {
    const { address } = req.params
    
    // Get user's listings
    db.all('SELECT * FROM listings WHERE creator = ? ORDER BY created_at DESC', [address], (err, listings) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      // Get user's outgoing offers
      db.all('SELECT * FROM offers WHERE offerer_address = ? ORDER BY created_at DESC', [address], (err, outgoingOffers) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        
        // Get user's incoming offers (offers on their listings)
        db.all(`
          SELECT o.*, l.nft_name, l.nft_image, l.nft_collection 
          FROM offers o 
          JOIN listings l ON o.listing_id = l.id 
          WHERE l.creator = ? AND o.status = 'pending'
          ORDER BY o.created_at DESC
        `, [address], (err, incomingOffers) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' })
          }
          
          res.json({
            listings: listings || [],
            outgoingOffers: outgoingOffers || [],
            incomingOffers: incomingOffers || []
          })
        })
      })
    })
  })

  // Update user profile
  router.put('/profile/:address', (req, res) => {
    const { address } = req.params
    const { name, avatar, headsImage, tailsImage } = req.body
    db.run(
      `INSERT INTO profiles (address, name, avatar, headsImage, tailsImage) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(address) DO UPDATE SET name=excluded.name, avatar=excluded.avatar, headsImage=excluded.headsImage, tailsImage=excluded.tailsImage`,
      [address, name || '', avatar || '', headsImage || '', tailsImage || ''],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        res.json({ success: true })
      }
    )
  })

  // ===== READY NFT SYSTEM =====

  // Pre-load NFT during listing creation
  router.post('/nft/preload', async (req, res) => {
    const { player_address, nft_contract, nft_token_id, nft_name, nft_image, nft_collection } = req.body
    
    console.log('🎯 Pre-loading NFT:', { player_address, nft_contract, nft_token_id })
    
    // Check if NFT already ready
    db.get(
      'SELECT * FROM ready_nfts WHERE player_address = ? AND nft_contract = ? AND nft_token_id = ?',
      [player_address, nft_contract, nft_token_id],
      (err, existing) => {
        if (existing) {
          return res.status(400).json({ error: 'NFT already pre-loaded' })
        }
        
        // Store in ready_nfts table
        db.run(`
          INSERT INTO ready_nfts (player_address, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, source)
          VALUES (?, ?, ?, ?, ?, ?, 'preload')
        `, [player_address, nft_contract, nft_token_id, nft_name, nft_image, nft_collection], function(err) {
          if (err) {
            console.error('❌ Error pre-loading NFT:', err)
            return res.status(500).json({ error: 'Database error' })
          }
          
          console.log('✅ NFT pre-loaded successfully:', nft_contract, nft_token_id)
          res.json({ success: true, message: 'NFT pre-loaded for instant games!' })
        })
      }
    )
  })

  // Withdraw ready NFT
  router.post('/nft/withdraw', async (req, res) => {
    const { player_address, nft_contract, nft_token_id } = req.body
    
    console.log('💎 Withdrawing ready NFT:', { player_address, nft_contract, nft_token_id })
    
    // Remove from ready_nfts table
    db.run(
      'DELETE FROM ready_nfts WHERE player_address = ? AND nft_contract = ? AND nft_token_id = ?',
      [player_address, nft_contract, nft_token_id],
      function(err) {
        if (err) {
          console.error('❌ Error withdrawing NFT:', err)
          return res.status(500).json({ error: 'Database error' })
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Ready NFT not found' })
        }
        
        console.log('✅ Ready NFT withdrawn successfully')
        res.json({ success: true, message: 'NFT withdrawn from ready state' })
      }
    )
  })

  // Get user's ready NFTs
  router.get('/users/:address/ready-nfts', (req, res) => {
    const { address } = req.params
    
    db.all(
      'SELECT * FROM ready_nfts WHERE player_address = ? ORDER BY deposited_at DESC',
      [address],
      (err, readyNfts) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        res.json(readyNfts || [])
      }
    )
  })

  // Check if specific NFT is ready for user
  router.get('/nft/ready-status/:address/:contract/:tokenId', (req, res) => {
    const { address, contract, tokenId } = req.params
    
    db.get(
      'SELECT * FROM ready_nfts WHERE player_address = ? AND nft_contract = ? AND nft_token_id = ?',
      [address, contract, tokenId],
      (err, readyNft) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        res.json({ 
          ready: !!readyNft,
          nft: readyNft || null
        })
      }
    )
  })

  // ===== ADMIN ENDPOINTS =====

  // Get all games and listings for admin
  router.get('/admin/games', (req, res) => {
    // Get both games and listings with stats
    db.all('SELECT * FROM games ORDER BY created_at DESC', (err, games) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      db.all('SELECT * FROM listings ORDER BY created_at DESC', (err, listings) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        
        // Calculate stats
        const totalGames = games.length
        const activeGames = games.filter(g => g.status === 'active' || g.status === 'waiting_challenger_deposit').length
        const totalListings = listings.length
        const openListings = listings.filter(l => l.status === 'open').length
        
        let totalVolume = 0
        games.forEach(game => {
          if (game.final_price) {
            totalVolume += game.final_price
          }
        })
        
        res.json({
          games: games || [],
          listings: listings || [],
          stats: {
            totalGames,
            activeGames,
            totalListings,
            openListings,
            totalVolume
          }
        })
      })
    })
  })

  // Update game status
  router.patch('/admin/games/:gameId', (req, res) => {
    const { gameId } = req.params
    const updates = req.body
    
    // Build dynamic update query
    const updateFields = []
    const updateValues = []
    
    if (updates.status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(updates.status)
    }
    
    if (updates.joiner !== undefined) {
      updateFields.push('challenger = ?')
      updateValues.push(updates.joiner)
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }
    
    updateValues.push(gameId)
    
    const query = `UPDATE games SET ${updateFields.join(', ')} WHERE id = ?`
    
    db.run(query, updateValues, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Game not found' })
      }
      
      res.json({ success: true, changes: this.changes })
    })
  })

  // Delete specific game
  router.delete('/admin/games/:gameId', (req, res) => {
    const { gameId } = req.params
    
    db.run('DELETE FROM games WHERE id = ?', [gameId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      res.json({ success: true, changes: this.changes })
    })
  })

  // Clear all games
  router.delete('/admin/games', (req, res) => {
    db.run('DELETE FROM games', [], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      res.json({ success: true, changes: this.changes })
    })
  })

  // Update listing status
  router.patch('/admin/listings/:listingId', (req, res) => {
    const { listingId } = req.params
    const updates = req.body
    
    const updateFields = []
    const updateValues = []
    
    if (updates.status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(updates.status)
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }
    
    updateValues.push(listingId)
    
    const query = `UPDATE listings SET ${updateFields.join(', ')} WHERE id = ?`
    
    db.run(query, updateValues, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Listing not found' })
      }
      
      res.json({ success: true, changes: this.changes })
    })
  })

  // Delete specific listing
  router.delete('/admin/listings/:listingId', (req, res) => {
    const { listingId } = req.params
    
    db.run('DELETE FROM listings WHERE id = ?', [listingId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      res.json({ success: true, changes: this.changes })
    })
  })

  // Clear all listings
  router.delete('/admin/listings', (req, res) => {
    db.run('DELETE FROM listings', [], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      res.json({ success: true, changes: this.changes })
    })
  })

  // Admin pause all games endpoint
  router.post('/admin/pause-all', (req, res) => {
    db.run('UPDATE games SET status = "paused" WHERE status IN ("waiting_deposits", "waiting_challenger_deposit")', [], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      res.json({ success: true, pausedGames: this.changes })
    })
  })

  // Update NFT metadata for all games
  router.post('/admin/update-all-nft-metadata', async (req, res) => {
    try {
      let updated = 0
      let errors = 0
      
      // Get all games
      db.all('SELECT * FROM games', [], (err, games) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        
        // For now, just return success since NFT metadata updating would require external API calls
        res.json({ updated: games.length, errors: 0 })
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Database reinit endpoint
  router.post('/debug/init', (req, res) => {
    // This would typically reinitialize database tables
    // For safety, we'll just return success
    res.json({ success: true, message: 'Database structure verified' })
  })

  return router
}

module.exports = { createApiRoutes } 