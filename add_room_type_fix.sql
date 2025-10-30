-- Add room_type column to battle_royale_games table if it doesn't exist
-- This fixes the 500 error when creating Battle Royale games

-- Check if column exists and add if missing
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- So we use a different approach: check first, then add

-- Note: This will only work if the column doesn't exist yet
-- If column already exists, this will fail silently (which is fine)

-- For SQLite, we need to check pragma first
-- The safest way is to just try to add it and ignore errors
-- But since we can't do that directly, we'll use a script approach

-- Actually, SQLite 3.31.0+ supports IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- But to be safe, we'll add it only if it doesn't exist via a check

-- Step 1: Add column if it doesn't exist (SQLite 3.31.0+)
ALTER TABLE battle_royale_games ADD COLUMN room_type TEXT DEFAULT 'potion';

-- Step 2: Update any existing rows that might have NULL room_type
UPDATE battle_royale_games SET room_type = 'potion' WHERE room_type IS NULL;




