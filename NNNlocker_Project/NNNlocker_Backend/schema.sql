-- Create the user profile table
-- This will only store one row (for user id = 1)
CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    streak_days INTEGER NOT NULL DEFAULT 0,
    fail_count INTEGER NOT NULL DEFAULT 0
);

-- Create the table for logging fail events
CREATE TABLE IF NOT EXISTS fail_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT (datetime('now', 'localtime')),
    reason TEXT,
    video_url TEXT
);

-- Insert the one and only user row.
-- IGNORE will prevent an error if the row already exists.
INSERT OR IGNORE INTO user_profile (id, streak_days, fail_count) VALUES (1, 0, 0);

