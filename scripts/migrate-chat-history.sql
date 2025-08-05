-- Chat History Migration Script
-- This script adds new columns to the chat_messages table to support different message types and data

-- Add new columns to chat_messages table
ALTER TABLE chat_messages ADD COLUMN message_type TEXT DEFAULT 'chat';
ALTER TABLE chat_messages ADD COLUMN message_data TEXT;

-- Create index for better performance when loading chat history
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_id, created_at);

-- Create index for message types
CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON chat_messages(message_type);

-- Update existing messages to have proper message_type
UPDATE chat_messages SET message_type = 'chat' WHERE message_type IS NULL;

-- Add a comment to document the table structure
PRAGMA table_info(chat_messages);

-- Show the updated table structure
SELECT sql FROM sqlite_master WHERE type='table' AND name='chat_messages'; 