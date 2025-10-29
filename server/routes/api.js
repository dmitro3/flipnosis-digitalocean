const express = require('express')
const crypto = require('crypto')
const ethers = require('ethers')
const { XPService } = require('../services/xpService')

function createApiRoutes(dbService, blockchainService, gameServer) {
  const router = express.Router()
  const db = dbService.db
  
  // gameServer is now properly passed in and available
  console.log('✅ API routes initialized with gameServer:', !!gameServer)
  
  // Helper function to send message to specific user
  const sendToUser = (address, event, data) => {
    if (gameServer && gameServer.userSockets) {
      const socketId = gameServer.userSockets.get(address.toLowerCase())
      if (socketId) {
        gameServer.io.to(socketId).emit(event, data)
      }
    }
  }
  
  // Initialize XP Service
  const xpService = new XPService(dbService.databasePath)
  xpService.initialize().catch(console.error)
  
  // Initialize Event Service
  const GameEventService = require('../services/EventService')
  
  const gameEventService = new GameEventService(dbService)

  // Health check
  router.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      server: 'clean-architecture', 
      timestamp: new Date().toISOString(),
      hasContractOwner: blockchainService.hasOwnerWallet()
    })
  })

  // Cleanup service stats
  router.get('/cleanup/stats', async (req, res) => {
    try {
      const cutoffTime = new Date(Date.now() - (10 * 60 * 1000)) // 10 minutes
      
      const stats = await new Promise((resolve, reject) => {
        db.get(`
          SELECT 
            COUNT(*) as total_games,
            SUM(CASE WHEN nft_deposited = false AND created_at < ? THEN 1 ELSE 0 END) as old_games_without_nft,
            SUM(CASE WHEN nft_deposited = true AND nft_deposit_verified = false THEN 1 ELSE 0 END) as games_needing_verification,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_games,
            SUM(CASE WHEN nft_deposited = true AND nft_deposit_verified = true THEN 1 ELSE 0 END) as verified_games
          FROM games
        `, [cutoffTime.toISOString()], (err, row) => {
          if (err) reject(err)
          else resolve(row || {})
        })
      })
      
      res.json({
        success: true,
        stats,
        cleanup_config: {
          max_age_minutes: 10,
          cleanup_interval_minutes: 5,
          contract_check_cooldown_minutes: 2
        },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error getting cleanup stats:', error)
      res.status(500).json({ error: 'Failed to get cleanup stats' })
    }
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
        // Ensure flip_balance is included with fallback to xp
        const profileWithDefaults = {
          ...profile,
          flip_balance: profile.flip_balance || profile.xp || 0,
          unlocked_coins: profile.unlocked_coins || '["plain"]'
        }
        res.json(profileWithDefaults)
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
          flip_balance: 0,
          unlocked_coins: '["plain"]',
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
          WHERE offerer_address = ?
          ORDER BY created_at DESC
        `, [address.toLowerCase()], (err, results) => {
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

  // Claimables endpoint: approximates items user can withdraw/claim
  router.get('/users/:address/claimables', async (req, res) => {
    const { address } = req.params
    try {
      // Creator claimables (post-completion, unpaid)
      const creatorClaimables = await new Promise((resolve, reject) => {
        db.all(`
          SELECT br.id as gameId, br.creator, br.entry_fee, br.service_fee, br.max_players, 
                 br.nft_name, br.nft_image, br.nft_collection, br.nft_contract, br.nft_token_id
          FROM battle_royale_games br
          WHERE br.creator = ? AND br.status = 'completed' AND (br.creator_paid IS NULL OR br.creator_paid = 0)
        `, [address.toLowerCase()], (err, rows) => {
          if (err) reject(err)
          else resolve(rows || [])
        })
      })

      // Winner claimables (post-completion, NFT not claimed)
      const winnerClaimables = await new Promise((resolve, reject) => {
        db.all(`
          SELECT br.id as gameId, br.nft_contract, br.nft_token_id, br.nft_name, br.nft_image
          FROM battle_royale_games br
          WHERE br.winner_address = ? AND br.status = 'completed' AND (br.nft_claimed IS NULL OR br.nft_claimed = 0)
        `, [address.toLowerCase()], (err, rows) => {
          if (err) reject(err)
          else resolve(rows || [])
        })
      })

      res.json({ success: true, creator: creatorClaimables, winner: winnerClaimables })
    } catch (error) {
      console.error('Error fetching claimables:', error)
      res.status(500).json({ error: 'Failed to fetch claimables' })
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
    const { listingId, transactionHash, nftDeposited, nftDepositTime, nftDepositHash, nftDepositVerified, lastNftCheckTime } = req.body
    
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
        console.log(`✅ Game already exists: ${gameId}`)
        return res.json({ success: true, gameId, already_exists: true })
      }
      
      // Check if blockchain_game_id already exists
      const blockchainGameId = ethers.id(gameId)
      const existingBlockchainGame = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM games WHERE blockchain_game_id = ?', [blockchainGameId], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      if (existingBlockchainGame) {
        console.log(`⚠️ Blockchain game ID already exists: ${blockchainGameId}`)
        return res.status(409).json({ error: 'Game with this blockchain ID already exists' })
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
      
      // Create game record with proper status and NFT deposit tracking
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO games (
            id, listing_id, blockchain_game_id, creator, challenger,
            nft_contract, nft_token_id, nft_name, nft_image, nft_collection,
            final_price, price_usd, rounds, coin_data, status, creator_deposited, game_type, chain, payment_token,
            nft_deposited, nft_deposit_time, nft_deposit_hash, nft_deposit_verified, last_nft_check_time
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          gameId, listing.id, blockchainGameId, listing.creator, '', // challenger is empty initially
          listing.nft_contract, listing.nft_token_id, listing.nft_name, 
          listing.nft_image, listing.nft_collection,
          listing.asking_price, // final_price (required field)
          listing.asking_price, // price_usd (for compatibility)
          5, // rounds - default to 5 rounds
          JSON.stringify(coinData), 
          'awaiting_deposit', // Status for game created but NFT not deposited yet
          true, // creator_deposited - NFT was just deposited
          'nft-vs-crypto', // game_type
          'base', // chain
          'ETH', // payment_token
          nftDeposited || false, // nft_deposited
          nftDepositTime || null, // nft_deposit_time
          nftDepositHash || null, // nft_deposit_hash
          nftDepositVerified || false, // nft_deposit_verified
          lastNftCheckTime || null // last_nft_check_time
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

  // Temporary endpoint to restore missing games for NFT withdrawal
  router.post('/admin/restore-missing-games', async (req, res) => {
    try {
      console.log('🔄 Restoring missing games for NFT withdrawal...')
      
      const missingGames = [
        { id: 'listing_1755362734367_80a233d43e8c7d33', nft_token_id: 5274, price_usd: 0.15 },
        { id: 'listing_1755362378481_68e63436638e60fc', nft_token_id: 9287, price_usd: 0.15 },
        { id: 'listing_1755362334407_5c7bfe5d205da6c5', nft_token_id: 9289, price_usd: 0.15 },
        { id: 'listing_1755361845873_fc762e5943599768', nft_token_id: 9201, price_usd: 0.14 },
        { id: 'listing_1755361426703_dce7bf4a68ee978c', nft_token_id: 1271, price_usd: 0.15 },
        { id: 'listing_1755432977848_761c57c637678810', nft_token_id: 2378, price_usd: 0.15 }
      ]

      const ADMIN_ADDRESS = process.env.PLATFORM_FEE_RECEIVER || '0x6BA07382CF43E41aBfC80dC43FFc96730194A3c1'
      
      let restoredCount = 0
      
      for (const game of missingGames) {
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT OR REPLACE INTO games (
              id, creator, nft_contract, nft_token_id, nft_name, nft_image, 
              nft_collection, price_usd, status, created_at, creator_deposited
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            game.id, ADMIN_ADDRESS, '0x0000000000000000000000000000000000000000', game.nft_token_id,
            `NFT #${game.nft_token_id}`, '', 'Unknown Collection',
            game.price_usd, 'waiting', new Date().toISOString(), 1
          ], function(err) {
            if (err) {
              console.error(`❌ Error restoring game ${game.id}:`, err)
              reject(err)
            } else {
              console.log(`✅ Restored game: ${game.id} (NFT #${game.nft_token_id})`)
              restoredCount++
              resolve()
            }
          })
        })
      }
      
      console.log(`🎉 Successfully restored ${restoredCount} games`)
      res.json({ 
        success: true, 
        restored: restoredCount,
        message: `Restored ${restoredCount} games for NFT withdrawal` 
      })
      
    } catch (error) {
      console.error('❌ Error restoring games:', error)
      res.status(500).json({ error: error.message })
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
    const { offerer_address, offerer_name, offer_price, message, challenger_name, challenger_image } = req.body

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
        INSERT INTO offers (id, listing_id, offerer_address, offerer_name, offer_price, message, challenger_name, challenger_image, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `, [offerId, listingId, offerer_address, offerer_name, offer_price, message, challenger_name, challenger_image], function(err) {
        if (err) {
          console.error('❌ Error creating offer in database:', err)
          return res.status(500).json({ error: 'Database error' })
        }
        
        console.log('✅ Offer created successfully:', offerId)
        // Notify listing creator and broadcast to room
        db.get('SELECT creator FROM listings WHERE id = ?', [listingId], (err, listing) => {
          if (listing) {
            // Send direct notification to listing creator
            sendToUser(listing.creator, 'new_offer', {
              type: 'new_offer',
              listingId,
              offerId,
              offer_price,
              message
            })
            
            // Broadcast to all users in the listing room for real-time updates
            gameServer.io.to(listingId).emit('listing_updated', {
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
      
      // Add type field to each offer based on offer_price
      const transformedOffers = offers.map(offer => ({
        ...offer,
        type: 'crypto_offer', // All offers in this table are crypto offers
        timestamp: offer.created_at || new Date().toISOString()
      }))
      
      res.json(transformedOffers)
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

  // Create Battle Royale game from listing
  router.post('/listings/:listingId/create-battle-royale', async (req, res) => {
    const { listingId } = req.params
    const { creator, entryFee, serviceFee, maxPlayers = 6 } = req.body
    
    try {
      const listing = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM listings WHERE id = ?', [listingId], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' })
      }
      
      const gameId = `br_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
      
      // Create Battle Royale game
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO battle_royale_games (
            id, creator, nft_contract, nft_token_id, nft_name, nft_image, 
            nft_collection, entry_fee, service_fee, max_players, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'filling')
        `, [
          gameId, creator, listing.nft_contract, listing.nft_token_id,
          listing.nft_name, listing.nft_image, listing.nft_collection,
          entryFee, serviceFee, maxPlayers
        ], function(err) {
          if (err) reject(err)
          else resolve()
        })
      })
      
      console.log(`✅ Battle Royale game created: ${gameId}`)
      res.json({ success: true, gameId })
    } catch (error) {
      console.error('❌ Error creating Battle Royale game:', error)
      res.status(500).json({ error: error.message })
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
          listing.nft_contract,
          listing.nft_token_id
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

  // OFFER ACCEPTANCE REMOVED - NOW WEBSOCKET ONLY
  // All real-time actions happen via WebSocket, not API endpoints

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
          sendToUser(offer.offerer_address, 'offer_accepted', {
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

  // Get game (Battle Royale only - 1v1 games removed)
  router.get('/games/:gameId', (req, res) => {
    const { gameId } = req.params
    
    console.log(`🔍 API: Fetching Battle Royale game data for gameId: ${gameId}`)
    
    // Only handle Battle Royale games
    if (!gameId.startsWith('br_')) {
      return res.status(404).json({ error: 'Game not found - only Battle Royale games supported' })
    }
    
    // Check if it's a Battle Royale game
    db.get('SELECT * FROM battle_royale_games WHERE id = ?', [gameId], (err, game) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      if (!game) {
        return res.status(404).json({ error: 'Battle Royale game not found' })
      }
      
      // Return Battle Royale game data
      res.json({
        id: game.id,
        type: 'battle_royale',
        game_type: 'battle_royale',
        creator: game.creator,
        creator_address: game.creator,
        nft_contract: game.nft_contract,
        nft_token_id: game.nft_token_id,
        nft_name: game.nft_name,
        nft_image: game.nft_image,
        nft_collection: game.nft_collection,
        entry_fee: game.entry_fee,
        service_fee: game.service_fee,
        max_players: game.max_players,
        current_players: game.current_players,
        status: game.status,
        created_at: game.created_at,
        updated_at: game.updated_at
      })
    })
  })

  // ===== PHYSICS BATTLE ROYALE ENDPOINTS =====
  // Create Physics Battle Royale game
  router.post('/physics-battle-royale/create', async (req, res) => {
    try {
      const {
        creator,
        nft_contract,
        nft_token_id,
        nft_name,
        nft_image,
        nft_collection,
        nft_chain,
        entry_fee,
        service_fee
      } = req.body

      if (!creator || !nft_contract || !nft_token_id || !entry_fee) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const gameId = `physics_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`

      const gameData = {
        id: gameId,
        creator: creator.toLowerCase(),
        nft_contract,
        nft_token_id,
        nft_name,
        nft_image,
        nft_collection,
        nft_chain: nft_chain || 'base',
        entry_fee: parseFloat(entry_fee),
        service_fee: parseFloat(service_fee || 0.50)
      }

      await dbService.createBattleRoyaleGame(gameData)

      if (gameServer && gameServer.physicsGameManager) {
        gameServer.physicsGameManager.createPhysicsGame(gameId, gameData)
      }

      console.log(`✅ Physics Battle Royale created: ${gameId}`)
      res.json({ success: true, gameId, message: 'Physics Battle Royale created successfully' })
    } catch (error) {
      console.error('❌ Error creating Physics Battle Royale:', error)
      res.status(500).json({ error: 'Failed to create Physics Battle Royale', details: error.message })
    }
  })

  // Join Physics Battle Royale
  router.post('/physics-battle-royale/:gameId/join', async (req, res) => {
    try {
      const { gameId } = req.params
      const { player_address, payment_hash } = req.body

      if (!player_address) {
        return res.status(400).json({ error: 'Player address required' })
      }

      if (gameServer && gameServer.physicsGameManager) {
        const success = await gameServer.physicsGameManager.addPlayer(gameId, player_address, dbService)
        if (success) {
          await dbService.addBattleRoyalePlayer(gameId, {
            player_address: player_address.toLowerCase(),
            slot_number: gameServer.physicsGameManager.getGame(gameId).currentPlayers,
            entry_paid: !!payment_hash,
            entry_payment_hash: payment_hash
          })
          // Broadcast updated physics state to room
          gameServer.physicsGameManager.broadcastState(gameId, (room, event, payload) => {
            gameServer.io.to(room).emit(event, payload)
          })
          return res.json({ success: true, message: 'Successfully joined Physics Battle Royale' })
        } else {
          return res.status(400).json({ error: 'Failed to join game' })
        }
      }
      return res.status(500).json({ error: 'Game server not available' })
    } catch (error) {
      console.error('❌ Error joining Physics Battle Royale:', error)
      res.status(500).json({ error: 'Failed to join game', details: error.message })
    }
  })

  // Get all games (Battle Royale only - 1v1 games removed)
  router.get('/games', (req, res) => {
    db.all('SELECT * FROM battle_royale_games ORDER BY created_at DESC', (err, games) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      res.json(games || [])
    })
  })

  // DEPRECATED - 1v1 deposit-confirmed endpoint removed
  // Battle Royale games handle deposits through their own endpoints

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
                gameServer.io.to(gameId).emit('offer_accepted', {
                  type: 'ready_nft_used',
                  player,
                  nft_name: game.nft_name,
                  message: 'Pre-loaded NFT used - waiting for challenger deposit'
                })
                
                gameServer.io.to(gameId).emit('offer_accepted', {
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
        'SELECT * FROM games WHERE creator = ? OR challenger = ? ORDER BY created_at DESC',
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

  // Get user winnings (completed games where user is the winner)
  router.get('/users/:address/winnings', async (req, res) => {
    const { address } = req.params

    try {
      const lower = address.toLowerCase()

      const winnings = { games: [], battleRoyale: [] }

      // Legacy/regular games table (if present)
      await new Promise((resolve) => {
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='games';", (err, tableExists) => {
          if (err || !tableExists) return resolve()

          db.all(
            "SELECT * FROM games WHERE status = 'completed' AND winner = ? ORDER BY updated_at DESC",
            [lower],
            (e, rows) => {
              if (!e && Array.isArray(rows)) {
                winnings.games = rows.map((game) => ({
                  ...game,
                  gameId: game.id,
                  createdAt: game.created_at ? Math.floor(new Date(game.created_at).getTime() / 1000) : undefined,
                  updatedAt: game.updated_at ? Math.floor(new Date(game.updated_at).getTime() / 1000) : undefined,
                }))
              }
              resolve()
            }
          )
        })
      })

      // Battle Royale winners (if present)
      await new Promise((resolve) => {
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='battle_royale_games';", (err, tableExists) => {
          if (err || !tableExists) return resolve()

          db.all(
            "SELECT * FROM battle_royale_games WHERE status = 'completed' AND winner = ? ORDER BY updated_at DESC",
            [lower],
            (e, rows) => {
              if (!e && Array.isArray(rows)) {
                winnings.battleRoyale = rows
              }
              resolve()
            }
          )
        })
      })

      // Unified response; keep array for backwards compatibility if frontend expects array
      const unified = [
        ...(winnings.games || []),
        ...(winnings.battleRoyale || [])
      ]

      res.json(unified)
    } catch (error) {
      console.error('Error fetching user winnings:', error)
      // Return empty array instead of error to avoid frontend parse issues
      res.json([])
    }
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

  // Admin: Fee settings storage (simple JSON file)
  const fs = require('fs')
  const path = require('path')
  const feeSettingsPath = path.join(process.cwd(), 'server', 'fee-settings.json')

  function readFeeSettings() {
    try {
      if (fs.existsSync(feeSettingsPath)) {
        return JSON.parse(fs.readFileSync(feeSettingsPath, 'utf-8'))
      }
    } catch {}
    return {
      serviceFeeEnabled: true,
      lowJoinFeeUSD: 0.5,
      highJoinFeeUSD: 1.0,
      under20MinUSD: 1.0,
      platformBps: 500
    }
  }

  function writeFeeSettings(settings) {
    fs.writeFileSync(feeSettingsPath, JSON.stringify(settings, null, 2))
  }

  router.get('/admin/fee-settings', (req, res) => {
    const settings = readFeeSettings()
    res.json({ success: true, settings })
  })

  router.put('/admin/fee-settings', (req, res) => {
    try {
      const current = readFeeSettings()
      const updated = { ...current, ...req.body }
      writeFeeSettings(updated)
      res.json({ success: true, settings: updated })
    } catch (e) {
      res.status(500).json({ error: 'Failed to update fee settings', details: e.message })
    }
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
    
    if (updates.challenger !== undefined) {
      updateFields.push('challenger = ?')
      updateValues.push(updates.challenger)
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

  // Chat history endpoint
  router.get('/chat/:gameId', async (req, res) => {
    const { gameId } = req.params
    const limit = parseInt(req.query.limit) || 50
    
    try {
      // Use the existing chat_messages table for all games (including battle royale)
      const roomId = gameId.startsWith('br_') ? gameId : gameId
      const messages = await dbService.getChatHistory(roomId, limit)
      console.log(`📚 API: Returning ${messages.length} chat messages for game ${gameId} (room: ${roomId})`)
      res.json({ messages })
    } catch (error) {
      console.error('❌ Error fetching chat history:', error)
      res.status(500).json({ error: 'Failed to fetch chat history' })
    }
  })

  // Handle preflight requests for deposit-confirmed endpoint
  router.options('/games/:gameId/deposit-confirmed', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
    res.header('Access-Control-Allow-Credentials', 'true')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    res.status(200).end()
  })

  // Get Battle Royale game status
  router.get('/games/:gameId/status', async (req, res) => {
    const { gameId } = req.params
    
    try {
      // Only handle Battle Royale games
      if (!gameId.startsWith('br_')) {
        return res.status(404).json({ error: 'Game not found - only Battle Royale games supported' })
      }
      
      const game = await dbService.getBattleRoyaleGame(gameId)
      
      if (!game) {
        return res.status(404).json({ error: 'Battle Royale game not found' })
      }
      
      // Return Battle Royale status info
      res.json({
        gameId: game.id,
        status: game.status,
        current_players: game.current_players,
        max_players: game.max_players,
        creator: game.creator,
        game_ready: game.status === 'ready' || game.status === 'active',
        game_type: 'battle_royale'
      })
    } catch (error) {
      console.error('Error getting Battle Royale game status:', error)
      res.status(500).json({ error: 'Failed to get game status' })
    }
  })

  // Test endpoint to check if server is responding
  router.get('/test', (req, res) => {
    console.log('🧪 Test endpoint called')
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // DEPRECATED - 1v1 deposit confirmation removed
  // Battle Royale games handle deposits through /battle-royale/:gameId/join endpoint

  // Route: Complete game (called by game engine after flip result)
  router.post('/games/:gameId/complete', async (req, res) => {
    const { gameId } = req.params
    const { winner, loser, result } = req.body
    
    try {
      console.log('🏆 Completing game:', { gameId, winner, loser, result })
      
      // Update game in database
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE games 
          SET status = 'completed', winner = ?, completed_at = ? 
          WHERE id = ?
        `, [winner, new Date().toISOString(), gameId], function(err) {
          if (err) reject(err)
          else resolve()
        })
      })
      
      // Complete game on blockchain (transfers assets to winner)
      if (blockchainService.hasOwnerWallet()) {
        const completeResult = await blockchainService.completeGameOnChain(gameId, winner)
        
        if (completeResult.success) {
          console.log('✅ Game completed on blockchain:', completeResult.transactionHash)
          
          // Broadcast completion
          gameServer.io.to(gameId).emit('offer_accepted', {
            type: 'game_completed',
            gameId,
            winner,
            loser,
            result,
            transactionHash: completeResult.transactionHash
          })
          
          res.json({ 
            success: true, 
            winner, 
            transactionHash: completeResult.transactionHash,
            message: 'Game completed and assets transferred to winner!'
          })
        } else {
          console.error('❌ Failed to complete game on blockchain:', completeResult.error)
          res.status(500).json({ 
            error: 'Failed to complete game on blockchain', 
            details: completeResult.error 
          })
        }
      } else {
        // No blockchain service - just update database
                gameServer.io.to(gameId).emit('offer_accepted', {
          type: 'game_completed',
          gameId,
          winner,
          loser,
          result
        })
        
        res.json({ success: true, winner, message: 'Game completed!' })
      }
      
    } catch (error) {
      console.error('❌ Error completing game:', error)
      res.status(500).json({ error: 'Failed to complete game', details: error.message })
    }
  })

  // Route: Complete Battle Royale on-chain and broadcast
  router.post('/battle-royale/:gameId/complete', async (req, res) => {
    const { gameId } = req.params
    const { winner } = req.body

    try {
      if (!winner) return res.status(400).json({ error: 'Winner address required' })

      if (!gameServer || !blockchainService.hasOwnerWallet()) {
        return res.status(500).json({ error: 'Blockchain service not configured' })
      }

      const result = await blockchainService.completeBattleRoyaleOnChain(gameId, winner)
      if (!result.success) {
        return res.status(500).json({ error: result.error || 'Failed to complete Battle Royale' })
      }

      // Notify room
      if (gameServer && gameServer.io) {
        gameServer.io.to(gameId).emit('battle_royale_completed_on_chain', {
          type: 'battle_royale_completed_on_chain',
          gameId,
          winner,
          transactionHash: result.transactionHash
        })
      }

      res.json({ success: true, transactionHash: result.transactionHash })
    } catch (error) {
      console.error('❌ Error completing Battle Royale on-chain:', error)
      res.status(500).json({ error: 'Failed to complete Battle Royale', details: error.message })
    }
  })

  // Route: Check game contract status
  router.get('/games/:gameId/contract-status', async (req, res) => {
    const { gameId } = req.params
    
    try {
      if (!blockchainService.hasOwnerWallet()) {
        return res.json({ 
          contractAvailable: false, 
          message: 'Blockchain service not configured' 
        })
      }
      
      const gameStateResult = await blockchainService.getGameState(gameId)
      
      if (gameStateResult.success) {
        res.json({
          contractAvailable: true,
          gameState: gameStateResult.gameState,
          isReady: gameStateResult.gameState.isReady
        })
      } else {
        res.json({
          contractAvailable: true,
          error: gameStateResult.error
        })
      }
      
    } catch (error) {
      console.error('❌ Error checking contract status:', error)
      res.status(500).json({ error: 'Failed to check contract status' })
    }
  })


  // ===== BATTLE ROYALE ENDPOINTS =====
  
  // Create Battle Royale game
  router.post('/battle-royale/create', async (req, res) => {
    try {
      const {
        creator,
        nft_contract,
        nft_token_id,
        nft_name,
        nft_image,
        nft_collection,
        nft_chain,
        entry_fee,
        service_fee,
        creator_participates,
        room_type
      } = req.body

      console.log('🎨 Room type received:', room_type)
      console.log('🎨 Full request body:', req.body)

      // Validate required fields
      if (!creator || !nft_contract || !nft_token_id || !entry_fee) {
        return res.status(400).json({
          error: 'Missing required fields: creator, nft_contract, nft_token_id, entry_fee'
        })
      }

      // Generate unique game ID with physics prefix
      const gameId = `physics_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`

      // Create game in database
      const gameData = {
        id: gameId,
        creator: creator.toLowerCase(),
        nft_contract,
        nft_token_id,
        nft_name,
        nft_image,
        nft_collection,
        nft_chain: nft_chain || 'base',
        entry_fee: parseFloat(entry_fee),
        service_fee: parseFloat(service_fee || 0.50),
        max_players: 8, // Battle royale game is 8 players max
        creator_participates: creator_participates || false,
        room_type: room_type || 'potion',
        status: 'filling' // Explicitly set initial status
      }

      // Create physics game in manager FIRST (to generate obstacles)
      let physicsGame = null
      if (gameServer && gameServer.physicsGameManager) {
        physicsGame = gameServer.physicsGameManager.createPhysicsGame(gameId, gameData)
        // Add obstacles to game_data for database storage
        gameData.game_data = {
          obstacles: physicsGame.obstacles
        }
      }

      // Save to database WITH obstacles (frontend handles on-chain create/approval)
      await dbService.createBattleRoyaleGame(gameData)

      // Add creator as participant if they want to play
      console.log(`🔍 Creator participates check: ${creator_participates}, type: ${typeof creator_participates}`)
      if (creator_participates === true || creator_participates === 'true') {
        try {
          const playerData = {
            player_address: creator.toLowerCase(),
            slot_number: 1,
            entry_paid: false, // Creator doesn't pay to join their own game
            entry_amount: 0
          }
          await dbService.addBattleRoyalePlayer(gameId, playerData)
          console.log(`✅ Creator ${creator} added as participant to database`)

          // Also reflect creator in physics game manager for lobby state
          if (gameServer && gameServer.physicsGameManager) {
            const added = await gameServer.physicsGameManager.addPlayer(gameId, creator, dbService)
            if (added) {
              gameServer.physicsGameManager.broadcastState(gameId, (room, event, payload) => {
                gameServer.io.to(room).emit(event, payload)
              })
              console.log(`✅ Creator ${creator} added to physics game manager`)
            }
          }
        } catch (error) {
          console.error(`❌ Error adding creator as participant:`, error)
        }
      } else {
        console.log(`⚠️ Creator does NOT want to participate (${creator_participates})`)
      }

      console.log(`✅ 3D Physics Battle Royale game created: ${gameId} with ${physicsGame?.obstacles?.length || 0} obstacles`)
      
      res.json({
        success: true,
        gameId,
        message: 'Battle Royale game created successfully'
      })

    } catch (error) {
      console.error('❌ Error creating Battle Royale game:', error)
      res.status(500).json({
        error: 'Failed to create Battle Royale game',
        details: error.message
      })
    }
  })

  // Get Battle Royale game details
  router.get('/battle-royale/:gameId', async (req, res) => {
    try {
      const { gameId } = req.params
      
      const game = await dbService.getBattleRoyaleGame(gameId)
      if (!game) {
        return res.status(404).json({ error: 'Battle Royale game not found' })
      }

      const participants = await dbService.getBattleRoyaleParticipants(gameId)
      const rounds = await dbService.getBattleRoyaleRounds(gameId)

      // Enrich participants with profile data
      const enrichedParticipants = await Promise.all(
        participants.map(async (participant) => {
          try {
            const profile = await dbService.getProfileByAddress(participant.player_address)
            return {
              ...participant,
              username: profile?.username || null,
              name: profile?.name || null,
              avatar: profile?.avatar || profile?.profile_picture || null
            }
          } catch (error) {
            console.warn(`⚠️ Could not fetch profile for ${participant.player_address}:`, error.message)
            return {
              ...participant,
              username: null,
              name: null,
              avatar: null
            }
          }
        })
      )

      res.json({
        success: true,
        game: {
          ...game,
          participants: enrichedParticipants,
          rounds
        }
      })

    } catch (error) {
      console.error('❌ Error getting Battle Royale game:', error)
      res.status(500).json({
        error: 'Failed to get Battle Royale game',
        details: error.message
      })
    }
  })

  // Get all Battle Royale games (with status filter)
  router.get('/battle-royale', async (req, res) => {
    try {
      const { status, limit } = req.query
      
      const games = await dbService.getBattleRoyaleGames(
        status || null, 
        parseInt(limit) || 50
      )

      // Add participant count to each game
      const gamesWithParticipants = await Promise.all(
        games.map(async (game) => {
          const participants = await dbService.getBattleRoyaleParticipants(game.id)
          return {
            ...game,
            current_players: participants.length,
            participants: participants.map(p => ({
              address: p.player_address,
              slot_number: p.slot_number,
              entry_paid: p.entry_paid,
              status: p.status
            }))
          }
        })
      )

      res.json({
        success: true,
        games: gamesWithParticipants
      })

    } catch (error) {
      console.error('❌ Error getting Battle Royale games:', error)
      res.status(500).json({
        error: 'Failed to get Battle Royale games',
        details: error.message
      })
    }
  })

  // Join Battle Royale game
  router.post('/battle-royale/:gameId/join', async (req, res) => {
    try {
      const { gameId } = req.params
      const { player_address, slot_number, entry_amount, payment_hash } = req.body

      if (!player_address) {
        return res.status(400).json({ error: 'Player address is required' })
      }

      // Check if game exists and is accepting players
      const game = await dbService.getBattleRoyaleGame(gameId)
      if (!game) {
        return res.status(404).json({ error: 'Battle Royale game not found' })
      }

      if (game.status !== 'filling') {
        return res.status(400).json({ error: 'Game is not accepting new players' })
      }

      // Check if player already joined
      const participants = await dbService.getBattleRoyaleParticipants(gameId)
      const existingPlayer = participants.find(p => p.player_address.toLowerCase() === player_address.toLowerCase())
      
      if (existingPlayer) {
        return res.status(400).json({ error: 'Player already joined this game' })
      }

      // Check if game is full
      if (participants.length >= game.max_players) {
        return res.status(400).json({ error: 'Game is full' })
      }

      // Find available slot
      let assignedSlot = slot_number
      if (!assignedSlot || participants.find(p => p.slot_number === assignedSlot)) {
        assignedSlot = null
        for (let i = 1; i <= game.max_players; i++) {
          if (!participants.find(p => p.slot_number === i)) {
            assignedSlot = i
            break
          }
        }
      }

      if (!assignedSlot) {
        return res.status(400).json({ error: 'No available slots' })
      }

      // Add player to game with new pricing (1/7th of total prize + service fee)
      const entryFeePerPlayer = game.entry_fee / 7 // Each joining player pays 1/7th of total prize
      const playerData = {
        player_address: player_address.toLowerCase(),
        slot_number: assignedSlot,
        entry_paid: !!payment_hash,
        entry_amount: parseFloat(entry_amount || entryFeePerPlayer + game.service_fee),
        entry_payment_hash: payment_hash
      }

      await dbService.addBattleRoyalePlayer(gameId, playerData)

      // Add player to physics game manager and broadcast
      if (gameServer && gameServer.physicsGameManager) {
        const added = await gameServer.physicsGameManager.addPlayer(gameId, player_address, dbService)
        if (added) {
          gameServer.physicsGameManager.broadcastState(gameId, (room, event, payload) => {
            gameServer.io.to(room).emit(event, payload)
          })
        }
      }

      // Update game player count
      const newParticipantCount = participants.length + 1
      await dbService.updateBattleRoyaleGame(gameId, {
        current_players: newParticipantCount,
        status: newParticipantCount >= game.max_players ? 'ready' : 'filling'
      })

      console.log(`✅ Player ${player_address} joined 3D Physics Battle Royale ${gameId} in slot ${assignedSlot}`)

      res.json({
        success: true,
        slot_number: assignedSlot,
        message: 'Successfully joined Battle Royale game'
      })

    } catch (error) {
      console.error('❌ Error joining Battle Royale game:', error)
      res.status(500).json({
        error: 'Failed to join Battle Royale game',
        details: error.message
      })
    }
  })

  // Update Battle Royale game (admin/server use)
  router.patch('/battle-royale/:gameId', async (req, res) => {
    try {
      const { gameId } = req.params
      const updates = req.body

      // Validate game exists
      const game = await dbService.getBattleRoyaleGame(gameId)
      if (!game) {
        return res.status(404).json({ error: 'Battle Royale game not found' })
      }

      await dbService.updateBattleRoyaleGame(gameId, updates)

      console.log(`✅ Battle Royale game updated: ${gameId}`)

      res.json({
        success: true,
        message: 'Battle Royale game updated successfully'
      })

    } catch (error) {
      console.error('❌ Error updating Battle Royale game:', error)
      res.status(500).json({
        error: 'Failed to update Battle Royale game',
        details: error.message
      })
    }
  })

  // Cancel Battle Royale game (creator only)
  router.post('/battle-royale/:gameId/cancel', async (req, res) => {
    try {
      const { gameId } = req.params
      const { creator } = req.body

      // Validate game exists
      const game = await dbService.getBattleRoyaleGame(gameId)
      if (!game) {
        return res.status(404).json({ error: 'Battle Royale game not found' })
      }

      // Verify requester is the creator
      if (game.creator?.toLowerCase() !== creator?.toLowerCase()) {
        return res.status(403).json({ error: 'Only the creator can cancel the game' })
      }

      // Check if game can be cancelled (only in filling status)
      if (game.status !== 'filling') {
        return res.status(400).json({ error: 'Game can only be cancelled before it starts' })
      }

      // Update game status to cancelled
      await dbService.updateBattleRoyaleGame(gameId, { status: 'cancelled' })

      // If there's a physics game manager, update it too and broadcast
      if (gameServer && gameServer.physicsGameManager) {
        const physicsGame = gameServer.physicsGameManager.getGame(gameId)
        if (physicsGame) {
          physicsGame.status = 'cancelled'
          physicsGame.phase = 'cancelled'
          
          // Broadcast updated state to all players in the room
          // Players join room as `game_${gameId}`, not `physics_${gameId}`
          const roomId = `game_${gameId}`
          const updatedState = gameServer.physicsGameManager.getFullGameState(gameId)
          
          console.log(`📡 Broadcasting cancellation to room: ${roomId}`)
          gameServer.io.to(roomId).emit('physics_state_update', updatedState)
          gameServer.io.to(roomId).emit('game_cancelled', {
            gameId,
            message: 'This game has been cancelled by the creator'
          })
          
          console.log(`✅ Broadcasted cancellation to ${gameServer.io.sockets.adapter.rooms.get(roomId)?.size || 0} clients in room ${roomId}`)
        }
      }

      console.log(`✅ Battle Royale game cancelled: ${gameId}`)

      res.json({
        success: true,
        message: 'Battle Royale game cancelled successfully'
      })

    } catch (error) {
      console.error('❌ Error cancelling Battle Royale game:', error)
      res.status(500).json({
        error: 'Failed to cancel Battle Royale game',
        details: error.message
      })
    }
  })

  // Player leaves Battle Royale game
  router.post('/battle-royale/:gameId/leave', async (req, res) => {
    try {
      const { gameId } = req.params
      const { player, transactionHash } = req.body

      console.log(`👋 Player ${player} leaving game ${gameId}`)

      // Update database - remove player from participants
      await new Promise((resolve, reject) => {
        dbService.db.run(`
          UPDATE battle_royale_participants 
          SET status = 'left', eliminated_at = datetime('now')
          WHERE game_id = ? AND player_address = ?
        `, [gameId, player.toLowerCase()], (err) => {
          if (err) reject(err)
          else resolve()
        })
      })

      // Update game player count in database
      const participants = await dbService.getBattleRoyaleParticipants(gameId)
      const activePlayers = participants.filter(p => p.status === 'active').length
      
      await dbService.updateBattleRoyaleGame(gameId, {
        current_players: activePlayers
      })

      // Update physics game manager and broadcast
      if (gameServer && gameServer.physicsGameManager) {
        const physicsGame = gameServer.physicsGameManager.getGame(gameId)
        if (physicsGame) {
          // Remove player from game state
          const playerAddr = player.toLowerCase()
          physicsGame.players.delete(playerAddr)
          physicsGame.activePlayers.delete(playerAddr)
          physicsGame.currentPlayers = physicsGame.players.size
          
          // Update player slots
          physicsGame.playerSlots = Array.from(physicsGame.players.keys())
          
          console.log(`🔄 Updated physics game: ${physicsGame.currentPlayers} players remaining`)
          
          // Broadcast updated state to all players in the room
          // Players join room as `game_${gameId}`, not `physics_${gameId}`
          const roomId = `game_${gameId}`
          const updatedState = gameServer.physicsGameManager.getFullGameState(gameId)
          
          console.log(`📡 Broadcasting player_left to room: ${roomId}`)
          gameServer.io.to(roomId).emit('physics_state_update', updatedState)
          gameServer.io.to(roomId).emit('player_left', {
            gameId,
            player: playerAddr,
            currentPlayers: physicsGame.currentPlayers
          })
          
          console.log(`✅ Broadcasted player_left to ${gameServer.io.sockets.adapter.rooms.get(roomId)?.size || 0} clients in room ${roomId}`)
        }
      }

      console.log(`✅ Player ${player} left game ${gameId}`)

      res.json({
        success: true,
        message: 'Player left successfully'
      })

    } catch (error) {
      console.error('❌ Error processing player leave:', error)
      res.status(500).json({
        error: 'Failed to process player leave',
        details: error.message
      })
    }
  })

  // Get user's created Battle Royale games
  router.get('/users/:address/created-games', async (req, res) => {
    try {
      const { address } = req.params
      
      const games = await new Promise((resolve, reject) => {
        const sql = `
          SELECT * FROM battle_royale_games 
          WHERE creator = ? 
          ORDER BY created_at DESC
        `
        dbService.db.all(sql, [address.toLowerCase()], (err, rows) => {
          if (err) reject(err)
          else resolve(rows || [])
        })
      })

      console.log(`✅ Retrieved ${games.length} created games for ${address}`)

      res.json({
        success: true,
        games
      })

    } catch (error) {
      console.error('❌ Error fetching created games:', error)
      res.status(500).json({
        error: 'Failed to fetch created games',
        details: error.message
      })
    }
  })

  // Get user's participated Battle Royale games
  router.get('/users/:address/participated-games', async (req, res) => {
    try {
      const { address } = req.params
      
      const games = await new Promise((resolve, reject) => {
        const sql = `
          SELECT 
            g.*,
            p.status as player_status,
            p.eliminated_round,
            p.joined_at as player_joined_at
          FROM battle_royale_participants p
          JOIN battle_royale_games g ON p.game_id = g.id
          WHERE p.player_address = ?
          ORDER BY g.created_at DESC
        `
        dbService.db.all(sql, [address.toLowerCase()], (err, rows) => {
          if (err) reject(err)
          else resolve(rows || [])
        })
      })

      console.log(`✅ Retrieved ${games.length} participated games for ${address}`)

      res.json({
        success: true,
        games
      })

    } catch (error) {
      console.error('❌ Error fetching participated games:', error)
      res.status(500).json({
        error: 'Failed to fetch participated games',
        details: error.message
      })
    }
  })

  // Mark creator funds as withdrawn (called after frontend completes withdrawal)
  router.post('/battle-royale/:gameId/mark-creator-paid', async (req, res) => {
    try {
      const { gameId } = req.params
      const { creator, transactionHash } = req.body

      if (!creator || !transactionHash) {
        return res.status(400).json({ error: 'Creator address and transaction hash required' })
      }

      // Verify game exists and creator is correct
      const game = await dbService.getBattleRoyaleGame(gameId)
      if (!game) {
        return res.status(404).json({ error: 'Game not found' })
      }

      if (game.creator.toLowerCase() !== creator.toLowerCase()) {
        return res.status(403).json({ error: 'Not the creator of this game' })
      }

      if (game.status !== 'completed') {
        return res.status(400).json({ error: 'Game not completed yet' })
      }

      if (game.creator_paid) {
        return res.status(400).json({ error: 'Creator funds already marked as claimed' })
      }

      // Update database to mark creator as paid
      await dbService.updateBattleRoyaleGame(gameId, { 
        creator_paid: 1,
        creator_paid_tx: transactionHash 
      })
      
      res.json({
        success: true,
        message: 'Creator payment status updated successfully!'
      })

    } catch (error) {
      console.error('❌ Error updating creator payment status:', error)
      res.status(500).json({
        error: 'Failed to update creator payment status',
        details: error.message
      })
    }
  })

  // Mark winner NFT as claimed (called after frontend completes withdrawal)
  router.post('/battle-royale/:gameId/mark-nft-claimed', async (req, res) => {
    try {
      const { gameId } = req.params
      const { winner, transactionHash } = req.body

      if (!winner || !transactionHash) {
        return res.status(400).json({ error: 'Winner address and transaction hash required' })
      }

      // Verify game exists and winner is correct
      const game = await dbService.getBattleRoyaleGame(gameId)
      if (!game) {
        return res.status(404).json({ error: 'Game not found' })
      }

      if (game.winner.toLowerCase() !== winner.toLowerCase()) {
        return res.status(403).json({ error: 'Not the winner of this game' })
      }

      if (game.status !== 'completed') {
        return res.status(400).json({ error: 'Game not completed yet' })
      }

      if (game.nft_claimed) {
        return res.status(400).json({ error: 'NFT already marked as claimed' })
      }

      // Update database to mark NFT as claimed
      await dbService.updateBattleRoyaleGame(gameId, { 
        nft_claimed: 1,
        nft_claimed_tx: transactionHash 
      })
      
      res.json({
        success: true,
        message: 'NFT claim status updated successfully!'
      })

    } catch (error) {
      console.error('❌ Error updating NFT claim status:', error)
      res.status(500).json({
        error: 'Failed to update NFT claim status',
        details: error.message
      })
    }
  })

  return router
}

module.exports = { createApiRoutes } 