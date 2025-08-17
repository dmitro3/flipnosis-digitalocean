# Temporary Solution: Manual Database Restoration

Since we can't access the database directly, here's a simple solution:

## Option 1: Add API Endpoint (Recommended)
Add this to server/routes/api.js:

```javascript
// Temporary endpoint to restore missing games
router.post('/admin/restore-games', async (req, res) => {
  try {
    const missingGames = [
      { id: 'listing_1755362734367_80a233d43e8c7d33', nft_token_id: 5274, price_usd: 0.15 },
      { id: 'listing_1755362378481_68e63436638e60fc', nft_token_id: 9287, price_usd: 0.15 },
      { id: 'listing_1755362334407_5c7bfe5d205da6c5', nft_token_id: 9289, price_usd: 0.15 },
      { id: 'listing_1755361845873_fc762e5943599768', nft_token_id: 9201, price_usd: 0.14 },
      { id: 'listing_1755361426703_dce7bf4a68ee978c', nft_token_id: 1271, price_usd: 0.15 }
    ];

    const NFT_CONTRACT = '0x70cdcc990efbd44a1cb1c86f7feb9962d15ed71f';
    const ADMIN_ADDRESS = '0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28';
    
    for (const game of missingGames) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR REPLACE INTO games (
            id, creator, nft_contract, nft_token_id, nft_name, nft_image, 
            nft_collection, price_usd, status, created_at, creator_deposited
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          game.id, ADMIN_ADDRESS, NFT_CONTRACT, game.nft_token_id,
          `NFT #${game.nft_token_id}`, '', 'Unknown Collection',
          game.price_usd, 'waiting', new Date().toISOString(), 1
        ], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    
    res.json({ success: true, restored: missingGames.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Option 2: Use SQL Direct Access
If you have database admin access, run:

```sql
INSERT OR REPLACE INTO games (id, creator, nft_contract, nft_token_id, nft_name, price_usd, status, created_at, creator_deposited) VALUES
('listing_1755362734367_80a233d43e8c7d33', '0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28', '0x70cdcc990efbd44a1cb1c86f7feb9962d15ed71f', 5274, 'NFT #5274', 0.15, 'waiting', datetime('now'), 1),
('listing_1755362378481_68e63436638e60fc', '0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28', '0x70cdcc990efbd44a1cb1c86f7feb9962d15ed71f', 9287, 'NFT #9287', 0.15, 'waiting', datetime('now'), 1),
('listing_1755362334407_5c7bfe5d205da6c5', '0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28', '0x70cdcc990efbd44a1cb1c86f7feb9962d15ed71f', 9289, 'NFT #9289', 0.15, 'waiting', datetime('now'), 1),
('listing_1755361845873_fc762e5943599768', '0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28', '0x70cdcc990efbd44a1cb1c86f7feb9962d15ed71f', 9201, 'NFT #9201', 0.14, 'waiting', datetime('now'), 1),
('listing_1755361426703_dce7bf4a68ee978c', '0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28', '0x70cdcc990efbd44a1cb1c86f7feb9962d15ed71f', 1271, 'NFT #1271', 0.15, 'waiting', datetime('now'), 1);
```
