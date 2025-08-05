const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./server/games-v2.db');

db.run(`
  CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    game_id TEXT,
    nft_contract TEXT,
    nft_token_id TEXT,
    nft_name TEXT,
    nft_image TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`, (err) => {
  if (err) {
    console.error('Error creating offers table:', err);
  } else {
    console.log('Offers table created successfully');
  }
  db.close();
}); 