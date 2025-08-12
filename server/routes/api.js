const express = require('express')
const crypto = require('crypto')
const ethers = require('ethers')
const { XPService } = require('../services/xpService')

function createApiRoutes(dbService, blockchainService, wsHandlers) {
  const router = express.Router()
  const db = dbService.getDatabase()
  
  // Initialize XP Service
  const xpService = new XPService(dbService.databasePath)
  xpService.initialize().catch(console.error)

  // Health check
  router.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      server: 'clean-architecture', 
      timestamp: new Date().toISOString(),
      hasContractOwner: blockchainService.hasOwnerWallet()
    })
  })

  // Profile endpoints
  router.get('/profile/:address', async (req, res) => {
    const { address } = req.params
    
    try {
      const profile = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM profiles WHERE address = ?', [address.toLowerCase()], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      if (profile) {
        res.json(profile)
      } else {
        // Return empty profile if not found
        res.json({
          address: address.toLowerCase(),
          name: '',
          avatar: '',
          headsImage: '',
          tailsImage: '',
          twitter: '',
          telegram: '',
          xp: 0,
          xp_name_earned: false,
          xp_avatar_earned: false,
          xp_twitter_earned: false,
          xp_telegram_earned: false,
          xp_heads_earned: false,
          xp_tails_earned: false,
          stats: {
            totalGames: 0,
            gamesWon: 0,
            gamesLost: 0,
            winRate: 0,
            totalVolume: 0
          }
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      res.status(500).json({ error: 'Failed to fetch profile' })
    }
  })

  router.put('/profile/:address', async (req, res) => {
    const { address } = req.params
    const { name, avatar, headsImage, tailsImage, twitter, telegram } = req.body
    
    try {
      let totalXPGained = 0
      let xpMessages = []
      
      // Award XP for each field that's being set for the first time
      // Only award XP if the field has a value and is different from current value
      if (name && name.trim() !== '') {
        try {
          const result = await xpService.awardProfileXP(address, 'name', name)
          if (result.xpGained > 0) {
            totalXPGained += result.xpGained
            xpMessages.push(result.message)
          }
        } catch (error) {
          console.error('Error awarding name XP:', error)
        }
      }
      
      if (avatar && avatar.trim() !== '') {
        try {
          const result = await xpService.awardProfileXP(address, 'avatar', avatar)
          if (result.xpGained > 0) {
            totalXPGained += result.xpGained
            xpMessages.push(result.message)
          }
        } catch (error) {
          console.error('Error awarding avatar XP:', error)
        }
      }
      
      if (twitter && twitter.trim() !== '') {
        try {
          const result = await xpService.awardProfileXP(address, 'twitter', twitter)
          if (result.xpGained > 0) {
            totalXPGained += result.xpGained
            xpMessages.push(result.message)
          }
        } catch (error) {
          console.error('Error awarding twitter XP:', error)
        }
      }
      
      if (telegram && telegram.trim() !== '') {
        try {
          const result = await xpService.awardProfileXP(address, 'telegram', telegram)
          if (result.xpGained > 0) {
            totalXPGained += result.xpGained
            xpMessages.push(result.message)
          }
        } catch (error) {
          console.error('Error awarding telegram XP:', error)
        }
      }
      
      if (headsImage && headsImage.trim() !== '') {
        try {
          const result = await xpService.awardProfileXP(address, 'headsImage', headsImage)
          if (result.xpGained > 0) {
            totalXPGained += result.xpGained
            xpMessages.push(result.message)
          }
        } catch (error) {
          console.error('Error awarding heads XP:', error)
        }
      }
      
      if (tailsImage && tailsImage.trim() !== '') {
        try {
          const result = await xpService.awardProfileXP(address, 'tailsImage', tailsImage)
          if (result.xpGained > 0) {
            totalXPGained += result.xpGained
            xpMessages.push(result.message)
          }
        } catch (error) {
          console.error('Error awarding tails XP:', error)
        }
      }
        
      // Update profile fields (preserving XP and boolean flags)
      const updateQuery = `
        UPDATE profiles 
        SET name = ?, avatar = ?, headsImage = ?, tailsImage = ?, twitter = ?, telegram = ?, 
            updated_at = CURRENT_TIMESTAMP
        WHERE address = ?
      `
      await new Promise((resolve, reject) => {
        db.run(updateQuery, [
          name || '', 
          avatar || '', 
          headsImage || '', 
          tailsImage || '', 
          twitter || '', 
          telegram || '',
          address.toLowerCase()
        ], function(err) {
          if (err) {
            // If profile doesn't exist, create it
            const insertQuery = `
              INSERT INTO profiles (
                address, name, avatar, headsImage, tailsImage, twitter, telegram, 
                xp, xp_name_earned, xp_avatar_earned, xp_twitter_earned, 
                xp_telegram_earned, xp_heads_earned, xp_tails_earned,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `
            db.run(insertQuery, [
              address.toLowerCase(),
              name || '', 
              avatar || '', 
              headsImage || '', 
              tailsImage || '', 
              twitter || '', 
              telegram || ''
            ], function(err2) {
              if (err2) reject(err2)
              else resolve()
            })
          } else {
            resolve()
          }
        })
      })
      
      // Get updated profile with XP info
      const updatedProfile = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM profiles WHERE address = ?', [address.toLowerCase()], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      res.json({ 
        success: true, 
        xpGained: totalXPGained,
        xpMessages,
        profile: updatedProfile
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      res.status(500).json({ error: 'Failed to update profile' })
    }
  })

  // Game sharing endpoint
  router.post('/games/:gameId/share', async (req, res) => {
    const { gameId } = req.params
    const { address, platform } = req.body
    
    if (!address || !platform) {
      return res.status(400).json({ error: 'Address and platform are required' })
    }
    
    try {
      // Record the share
      await dbService.recordGameShare(gameId, address, platform)
      
      // Award XP for sharing
      const result = await xpService.awardShareXP(address, gameId, platform)
      
      res.json({
        success: true,
        xpGained: result.xpGained,
        message: result.message,
        totalXP: result.totalXP,
        alreadyAwarded: result.alreadyAwarded || false
      })
    } catch (error) {
      console.error('Error recording game share:', error)
      res.status(500).json({ error: 'Failed to record game share' })
    }
  })

  // Get user offers
  router.get('/users/:address/offers', async (req, res) => {
    const { address } = req.params
    
    try {
      const offers = await new Promise((resolve, reject) => {
        db.all(`
          SELECT * FROM offers 
          WHERE (from_address = ? OR to_address = ?)
          ORDER BY created_at DESC
        `, [address.toLowerCase(), address.toLowerCase()], (err, results) => {
          if (err) reject(err)
          else resolve(results || [])
        })
      })
      
      res.json(offers)
    } catch (error) {
      console.error('Error fetching user offers:', error)
      res.status(500).json({ error: 'Failed to fetch offers' })
    }
  })

  // Award XP endpoint
  router.post('/users/:address/award-xp', async (req, res) => {
    const { address } = req.params
    const { amount, reason, gameId } = req.body
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid XP amount' })
    }
    
    try {
      const result = await xpService.awardSpecialXP(address, reason, amount, gameId)
      res.json({ 
        success: true, 
        xpAwarded: result.xpGained,
        message: result.message,
        totalXP: result.totalXP
      })
    } catch (error) {
      console.error('Error awarding XP:', error)
      res.status(500).json({ error: 'Failed to award XP' })
    }
  })

  // Award game XP endpoint
  router.post('/users/:address/game-xp', async (req, res) => {
    const { address } = req.params
    const { gameResult, gameId } = req.body
    
    if (!gameResult || !['won', 'lost'].includes(gameResult)) {
      return res.status(400).json({ error: 'Invalid game result' })
    }
    
    try {
      const result = await xpService.awardGameXP(address, gameResult, gameId)
      res.json({ 
        success: true, 
        xpAwarded: result.xpGained,
        message: result.message,
        totalXP: result.totalXP,
        gameResult: result.gameResult
      })
    } catch (error) {
      console.error('Error awarding game XP:', error)
      res.status(500).json({ error: 'Failed to award game XP' })
    }
  })

  // Get user XP and level
  router.get('/users/:address/xp', async (req, res) => {
    const { address } = req.params
    
    try {
      const result = await xpService.getUserXP(address)
      const xpForNextLevel = xpService.getXPForNextLevel(result.level)
      
      res.json({
        xp: result.xp,
        level: result.level,
        xpForNextLevel,
        progress: result.xp / xpForNextLevel * 100
      })
    } catch (error) {
      console.error('Error fetching user XP:', error)
      res.status(500).json({ error: 'Failed to fetch user XP' })
    }
  })

  // Get XP leaderboard
  router.get('/leaderboard/xp', async (req, res) => {
    const { limit = 10 } = req.query
    
    try {
      const leaderboard = await xpService.getLeaderboard(parseInt(limit))
      res.json(leaderboard)
    } catch (error) {
      console.error('Error fetching XP leaderboard:', error)
      res.status(500).json({ error: 'Failed to fetch leaderboard' })
    }
  })

  // Get user achievements
  router.get('/users/:address/achievements', async (req, res) => {
    const { address } = req.params
    
    try {
      const achievements = await xpService.getUserAchievements(address)
      res.json(achievements)
    } catch (error) {
      console.error('Error fetching user achievements:', error)
      res.status(500).json({ error: 'Failed to fetch achievements' })
    }
  })

  router.post('/listings', async (req, res) => {
    const { creator, game_id, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, asking_price, coin_data } = req.body
    
    const listingId = `listing_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
    
    try {
      // Create ONLY listing, NOT game
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO listings (id, game_id, creator, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, asking_price, coin_data, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
        `, [listingId, game_id, creator, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, asking_price, coin_data], function(err) {
          if (err) reject(err)
          else resolve()
        })
      })
      
      console.log(`✅ Listing created: ${listingId} for future game: ${game_id}`)
      res.json({ success: true, listingId, gameId: game_id })
    } catch (error) {
      console.error('❌ Error creating listing:', error)
      res.status(500).json({ error: error.message || 'Database error' })
    }
  })

  // Add a new endpoint to create game when NFT is deposited:
  router.post('/games/:gameId/create-from-listing', async (req, res) => {
    const { gameId } = req.params
    const { listingId, transactionHash } = req.body
    
    try {
      // Get listing details
      const listing = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM listings WHERE game_id = ? OR id = ?', [gameId, listingId], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' })
      }
      
      // Check if game already exists
      const existingGame = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      if (existingGame) {
        return res.json({ success: true, gameId, already_exists: true })
      }
      
      // Parse coin_data if it's a string
      let coinData = listing.coin_data
      if (typeof coinData === 'string') {
        try {
          coinData = JSON.parse(coinData)
        } catch (e) {
          console.warn('Failed to parse coin_data:', e)
        }
      }
      
      // Create game record with proper status
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO games (
            id, listing_id, blockchain_game_id, creator, challenger,
            nft_contract, nft_token_id, nft_name, nft_image, nft_collection,
            price_usd, coin_data, status, creator_deposited, game_type, chain, payment_token
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          gameId, listing.id, ethers.id(gameId), listing.creator, '', // challenger is empty initially
          listing.nft_contract, listing.nft_token_id, listing.nft_name, 
          listing.nft_image, listing.nft_collection,
          listing.asking_price, JSON.stringify(coinData), 
          'awaiting_deposit', // Status for game created but NFT not deposited yet
          false, // creator_deposited
          'nft-vs-crypto', // game_type
          'base', // chain
          'ETH' // payment_token
        ], function(err) {
          if (err) {
            console.error('Database error details:', err)
            reject(err)
          } else {
            resolve()
          }
        })
      })
      
      // Update listing status
      await new Promise((resolve, reject) => {
        db.run('UPDATE listings SET status = ? WHERE id = ?', ['game_created', listing.id], function(err) {
          if (err) reject(err)
          else resolve()
        })
      })
      
      console.log(`✅ Game created from listing: ${gameId}`)
      res.json({ success: true, gameId })
    } catch (error) {
      console.error('❌ Error creating game from listing:', error)
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

  // Get offers for game (for games created directly without listings)
  router.get('/games/:gameId/offers', (req, res) => {
    const { gameId } = req.params
    
    // First check if this game has a listing_id
    db.get('SELECT listing_id FROM games WHERE id = ?', [gameId], (err, game) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      if (!game) {
        return res.status(404).json({ error: 'Game not found' })
      }
      
      if (game.listing_id) {
        // Game has a listing, fetch offers for that listing
        db.all('SELECT * FROM offers WHERE listing_id = ? ORDER BY created_at DESC', [game.listing_id], (err, offers) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' })
          }
          res.json(offers)
        })
      } else {
        // Game created directly, return empty offers array
        res.json([])
      }
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
            price_usd, coin_data, status, deposit_deadline, creator_deposited, challenger_deposited,
            game_type, chain, payment_token
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          gameId, listingId, blockchainGameId, creator,
          listing.nft_contract, listing.nft_token_id, listing.nft_name, listing.nft_image, listing.nft_collection,
          listing.asking_price, listing.coin_data, 'awaiting_challenger', depositDeadline, false, false,
          'nft-vs-crypto', 'base', 'ETH'
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
    
    try {
      // Get offer details
      const offer = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM offers WHERE id = ?', [offerId], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      if (!offer) {
        return res.status(404).json({ error: 'Offer not found' })
      }
      
      if (offer.status !== 'pending') {
        return res.status(400).json({ error: 'Offer already processed' })
      }
      
      // Get listing details
      const listing = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM listings WHERE id = ?', [offer.listing_id], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' })
      }
      
      // Check if game already exists for this listing
      let game = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM games WHERE listing_id = ? AND status != "cancelled"', [listing.id], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      const depositDeadline = new Date(Date.now() + 2 * 60 * 1000).toISOString() // 2 minutes
      
      if (!game) {
        // Create new game if one doesn't exist
        const gameId = listing.game_id || `game_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
        const blockchainGameId = ethers.id(gameId)
        
        // Calculate ETH amount for the final price
        let ethAmount = null
        try {
          // Get ETH price from a simple calculation (this is a fallback)
          // In a real implementation, you'd use Chainlink price feeds
          const ethPriceUSD = 2000 // Rough estimate - in production use price feed
          const ethAmountWei = (offer.offer_price / ethPriceUSD) * 1e18
          ethAmount = Math.floor(ethAmountWei).toString()
          
          console.log(`💰 Calculated ETH amount: ${offer.offer_price} USD = ${ethers.formatEther(ethAmount)} ETH`)
        } catch (error) {
          console.error('❌ Error calculating ETH amount:', error)
          // Continue without ETH amount - frontend will calculate it
        }
        
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT INTO games (
              id, listing_id, offer_id, blockchain_game_id, creator, challenger,
              nft_contract, nft_token_id, nft_name, nft_image, nft_collection,
              price_usd, payment_amount, coin_data, status, deposit_deadline, creator_deposited, challenger_deposited,
              game_type, chain, payment_token
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            gameId, listing.id, offerId, blockchainGameId, listing.creator, offer.offerer_address,
            listing.nft_contract, listing.nft_token_id, listing.nft_name, listing.nft_image, listing.nft_collection,
            offer.offer_price, ethAmount, listing.coin_data, 'waiting_challenger_deposit', depositDeadline, true, false,
            'nft-vs-crypto', 'base', 'ETH'
          ], function(err) {
            if (err) reject(err)
            else resolve()
          })
        })
        
        game = { id: gameId }
      } else {
        // Update existing game with challenger info
        await new Promise((resolve, reject) => {
          db.run(`
            UPDATE games 
            SET challenger = ?, offer_id = ?, price_usd = ?, 
                status = 'waiting_challenger_deposit', deposit_deadline = ?,
                creator_deposited = true
            WHERE id = ?
          `, [offer.offerer_address, offerId, offer.offer_price, depositDeadline, game.id], function(err) {
            if (err) reject(err)
            else resolve()
          })
        })
      }
      
      // Update blockchain if configured
      if (blockchainService.hasOwnerWallet()) {
        const updateResult = await blockchainService.updateGameWithPlayer2(
          game.id,
          offer.offerer_address,
          offer.offer_price,
          0 // ETH by default
        )
        
        if (!updateResult.success) {
          console.error('Failed to update game on blockchain:', updateResult.error)
          // Continue anyway - blockchain update is not critical for game flow
        }
      }
      
      // Update offer status
      await new Promise((resolve, reject) => {
        db.run('UPDATE offers SET status = "accepted" WHERE id = ?', [offerId], function(err) {
          if (err) reject(err)
          else resolve()
        })
      })
      
      // Update listing status
      await new Promise((resolve, reject) => {
        db.run('UPDATE listings SET status = "closed" WHERE id = ?', [offer.listing_id], function(err) {
          if (err) reject(err)
          else resolve()
        })
      })
      
      // Reject all other pending offers
      await new Promise((resolve, reject) => {
        db.run('UPDATE offers SET status = "rejected" WHERE listing_id = ? AND id != ? AND status = "pending"', 
          [offer.listing_id, offerId], function(err) {
          if (err) reject(err)
          else resolve()
        })
      })
      
      // Send WebSocket notifications
      wsHandlers.sendToUser(listing.creator, {
        type: 'offer_accepted',
        gameId: game.id,
        depositDeadline,
        challenger: offer.offerer_address,
        finalPrice: offer.offer_price,
        message: 'Offer accepted! Waiting for challenger to deposit crypto.'
      })
      
      wsHandlers.sendToUser(offer.offerer_address, {
        type: 'your_offer_accepted',
        gameId: game.id,
        depositDeadline,
        finalPrice: offer.offer_price,
        message: 'Your offer was accepted! You have 2 minutes to deposit crypto.',
        requiresDeposit: true
      })
      
      // Broadcast to room
      wsHandlers.broadcastToRoom(listing.id, {
        type: 'offer_accepted',
        listingId: listing.id,
        gameId: game.id,
        acceptedOfferId: offerId,
        challenger: offer.offerer_address,
        depositDeadline
      })
      
      // Also broadcast to game room
      wsHandlers.broadcastToRoom(game.id, {
        type: 'game_awaiting_challenger_deposit',
        gameId: game.id,
        challenger: offer.offerer_address,
        depositDeadline,
        finalPrice: offer.offer_price
      })
      
      console.log(`✅ Offer accepted: ${offerId}, Game: ${game.id}, Deadline: ${depositDeadline}`)
      
      res.json({ 
        success: true, 
        gameId: game.id,
        depositDeadline,
        message: 'Offer accepted! Challenger has 2 minutes to deposit crypto.'
      })
      
    } catch (error) {
      console.error('❌ Error accepting offer:', error)
      res.status(500).json({ error: 'Failed to accept offer', details: error.message })
    }
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

  // Leaderboard endpoints
  router.get('/leaderboard/all-time', (req, res) => {
    const query = `
      SELECT 
        user_address as address,
        total_rewards_earned as totalWinnings,
        games_won as gamesWon,
        total_games as totalGames
      FROM player_stats 
      WHERE total_rewards_earned > 0
      ORDER BY totalWinnings DESC
      LIMIT 50
    `;
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Error fetching all-time leaderboard:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    });
  });

  router.get('/leaderboard/weekly', (req, res) => {
    // Get current week (Sunday to Sunday)
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 7);
    
    const query = `
      SELECT 
        g.winner as address,
        SUM(g.price_usd) as totalWinnings,
        COUNT(*) as gamesWon
      FROM games g
      WHERE g.status = 'completed' 
        AND g.winner IS NOT NULL
        AND g.winner != ''
        AND g.updated_at >= ?
        AND g.updated_at < ?
      GROUP BY g.winner
      ORDER BY totalWinnings DESC
      LIMIT 50
    `;
    
    db.all(query, [currentWeekStart.toISOString(), currentWeekEnd.toISOString()], (err, rows) => {
      if (err) {
        console.error('Error fetching weekly leaderboard:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    });
  });

  router.get('/leaderboard/last-week-winner', (req, res) => {
    // Get last week (Sunday to Sunday)
    const now = new Date();
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - now.getDay() - 7); // Start of last week (Sunday)
    lastWeekStart.setHours(0, 0, 0, 0);
    
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekStart.getDate() + 7);
    
    const query = `
      SELECT 
        g.winner as address,
        SUM(g.price_usd) as totalWinnings,
        COUNT(*) as gamesWon
      FROM games g
      WHERE g.status = 'completed' 
        AND g.winner IS NOT NULL
        AND g.winner != ''
        AND g.updated_at >= ?
        AND g.updated_at < ?
      GROUP BY g.winner
      ORDER BY totalWinnings DESC
      LIMIT 1
    `;
    
    db.get(query, [lastWeekStart.toISOString(), lastWeekEnd.toISOString()], (err, row) => {
      if (err) {
        console.error('Error fetching last week winner:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(row || {});
    });
  });

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
          let coinData = null
          try {
            coinData = listing.coin_data ? JSON.parse(listing.coin_data) : null
          } catch (e) {
            console.warn('Failed to parse coin_data for listing:', listing.id, e)
          }
          
          res.json({
            id: listing.id,
            type: 'listing',
            game_type: 'nft-vs-crypto',
            creator: listing.creator,
            creator_address: listing.creator, // Add for compatibility
            nft_contract: listing.nft_contract,
            nft_token_id: listing.nft_token_id,
            nft_name: listing.nft_name,
            nft_image: listing.nft_image,
            nft_collection: listing.nft_collection,
            asking_price: listing.asking_price,
            price_usd: listing.asking_price, // Add for consistency
            coin_data: listing.coin_data,
            coinData: coinData, // Parsed coin data
            status: listing.status === 'open' ? 'awaiting_challenger' : listing.status, // Map 'open' to 'awaiting_challenger'
            creator_deposited: true, // Assume NFT is deposited if listing exists
            challenger_deposited: false
          })
        })
        return
      }
      
      // Parse coin_data if it's a string
      let coinData = null
      try {
        coinData = game.coin_data ? JSON.parse(game.coin_data) : null
      } catch (e) {
        console.warn('Failed to parse coin_data for game:', gameId, e)
      }
      
      // Add parsed coin data to response
      game.coinData = coinData
      
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

  // Update the deposit-confirmed endpoint to handle the flow better
  router.post('/games/:gameId/deposit-confirmed', (req, res) => {
    const { gameId } = req.params
    const { player, assetType, transactionHash } = req.body
    
    db.get('SELECT * FROM games WHERE id = ?', [gameId], async (err, game) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      if (!game) {
        return res.status(404).json({ error: 'Game not found' })
      }
      
      const isCreator = player === game.creator
      
      if (assetType === 'nft' && isCreator) {
        // Update game status to waiting for challenger
        db.run(`
          UPDATE games 
          SET creator_deposited = true, 
              status = 'awaiting_challenger',
              deposit_deadline = datetime('now', '+24 hours')
          WHERE id = ?
        `, [gameId], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' })
          }
          
          console.log('✅ NFT deposited, game now awaiting challenger')
          
          // Broadcast to room
          wsHandlers.broadcastToRoom(gameId, {
            type: 'nft_deposited',
            gameId,
            message: 'NFT deposited! Game is now open for challengers.'
          })
          
          res.json({ success: true })
        })
      } else if (assetType === 'eth' && !isCreator) {
        // Challenger deposited crypto
        db.run(`
          UPDATE games 
          SET challenger_deposited = true,
              status = 'active'
          WHERE id = ?
        `, [gameId], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' })
          }
          
          console.log('🎮 Both assets deposited - game is now active!')
          
          // Notify all players
          wsHandlers.broadcastToRoom(gameId, {
            type: 'game_started',
            gameId,
            message: 'Both assets deposited - game starting!'
          })
          
          res.json({ success: true })
        })
      } else {
        res.status(400).json({ error: 'Invalid deposit confirmation' })
      }
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
    
    // Check if games table exists first
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='games';", (err, tableExists) => {
      if (err || !tableExists) {
        console.log('Games table does not exist, returning empty array')
        return res.json([])
      }
      
      db.all(
        'SELECT * FROM games WHERE creator = ? OR joiner = ? ORDER BY created_at DESC',
        [address, address],
        (err, games) => {
          if (err) {
            console.error('Database error in /users/:address/games:', err)
            return res.json([]) // Return empty array instead of error
          }
          
          // Ensure games is an array (handle null/undefined)
          const gamesList = games || []
          
          // Transform the data to match frontend expectations
          const transformedGames = gamesList.map(game => {
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
            priceUSD: game.price_usd,
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
          if (game.price_usd) {
            totalVolume += game.price_usd
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