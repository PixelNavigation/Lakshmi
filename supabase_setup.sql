-- SQL script to create the user_watchlist table in Supabase
-- Run this in the Supabase SQL editor if the table doesn't exist

CREATE TABLE IF NOT EXISTS user_watchlist (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, symbol)
);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_watchlist_user_id ON user_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_symbol ON user_watchlist(symbol);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to access their own watchlist data
CREATE POLICY IF NOT EXISTS "Users can view their own watchlist" ON user_watchlist
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY IF NOT EXISTS "Users can insert their own watchlist items" ON user_watchlist
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY IF NOT EXISTS "Users can delete their own watchlist items" ON user_watchlist
    FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
