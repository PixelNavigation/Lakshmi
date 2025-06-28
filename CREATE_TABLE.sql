-- Create the user_watchlist table in Supabase
-- Copy and paste this into the Supabase SQL Editor and click "Run"

CREATE TABLE user_watchlist (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, symbol)
);

-- Create indexes for better performance
CREATE INDEX idx_user_watchlist_user_id ON user_watchlist(user_id);
CREATE INDEX idx_user_watchlist_symbol ON user_watchlist(symbol);

-- Insert some sample data for testing
INSERT INTO user_watchlist (user_id, symbol, name) VALUES 
('user123', 'AAPL', 'Apple Inc.'),
('user123', 'MSFT', 'Microsoft Corporation'),
('user123', 'GOOGL', 'Alphabet Inc.')
ON CONFLICT (user_id, symbol) DO NOTHING;
