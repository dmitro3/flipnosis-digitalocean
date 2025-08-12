-- Update challenger with joiner data
UPDATE games SET challenger = joiner WHERE challenger IS NULL AND joiner IS NOT NULL;

-- Generate listing_id for existing games
UPDATE games SET listing_id = 'listing_' || CAST((ABS(RANDOM()) % 9000000000000 + 1000000000000) AS TEXT) || '_legacy' WHERE listing_id IS NULL;

-- Show final column count
PRAGMA table_info(games);
