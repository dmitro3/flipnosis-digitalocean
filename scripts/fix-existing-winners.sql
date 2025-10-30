-- Fix existing completed games: copy winner to winner_address if winner_address is empty
-- This only updates rows that need fixing - safe to run multiple times

UPDATE battle_royale_games 
SET winner_address = winner 
WHERE status = 'completed' 
  AND (winner_address IS NULL OR winner_address = '') 
  AND winner IS NOT NULL 
  AND winner != '';

-- Show what was fixed
SELECT 'Games fixed:' as info, changes() as count;

