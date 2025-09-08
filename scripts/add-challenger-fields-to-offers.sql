-- Add challenger name and image fields to offers table
-- This allows us to store the challenger's profile data directly in the offer
-- instead of relying on separate profile lookups

-- Add the new fields to the offers table
ALTER TABLE offers ADD COLUMN challenger_name TEXT;
ALTER TABLE offers ADD COLUMN challenger_image TEXT;

-- Update the database master documentation
-- The offers table now includes:
-- - challenger_name: The display name of the challenger at the time of offer
-- - challenger_image: The profile image URL of the challenger at the time of offer

-- These fields will be populated when an offer is created and will be used
-- to display challenger information in the flip suite without needing
-- separate profile lookups that might fail or return outdated data.
