-- Add new fields to battle_royale_participants table
ALTER TABLE battle_royale_participants ADD COLUMN lives INTEGER DEFAULT 3;
ALTER TABLE battle_royale_participants ADD COLUMN power INTEGER DEFAULT 10;
ALTER TABLE battle_royale_participants ADD COLUMN has_shield BOOLEAN DEFAULT 1;
ALTER TABLE battle_royale_participants ADD COLUMN consecutive_wins INTEGER DEFAULT 0;
ALTER TABLE battle_royale_participants ADD COLUMN has_lightning_round BOOLEAN DEFAULT 0;
ALTER TABLE battle_royale_participants ADD COLUMN total_xp_earned INTEGER DEFAULT 0;
ALTER TABLE battle_royale_participants ADD COLUMN last_xp_drop INTEGER DEFAULT 0;
ALTER TABLE battle_royale_participants ADD COLUMN shield_used_round INTEGER DEFAULT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_br_participants_lives ON battle_royale_participants(lives);
CREATE INDEX IF NOT EXISTS idx_br_participants_status ON battle_royale_participants(status);

-- Update existing records to have new default values
UPDATE battle_royale_participants 
SET lives = 3, 
    power = 10, 
    has_shield = 1, 
    consecutive_wins = 0,
    has_lightning_round = 0,
    total_xp_earned = 0
WHERE lives IS NULL;

