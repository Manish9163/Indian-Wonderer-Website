-- Playlists table for destination-based music playlists
-- This allows admin to manage playlists for different destinations

USE indian_wonderer_base;

CREATE TABLE IF NOT EXISTS destination_playlists (
    id INT PRIMARY KEY AUTO_INCREMENT,
    destination VARCHAR(100) NOT NULL UNIQUE,
    destination_display_name VARCHAR(200) NOT NULL,
    spotify_playlist_name VARCHAR(255) NOT NULL,
    spotify_playlist_url VARCHAR(500),
    youtube_playlist_name VARCHAR(255) NOT NULL,
    youtube_playlist_url VARCHAR(500),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_destination (destination),
    INDEX idx_active (is_active)
);

-- Insert default playlists (from current hardcoded data)
INSERT INTO destination_playlists (destination, destination_display_name, spotify_playlist_name, youtube_playlist_name, is_active) VALUES
('goa', 'Goa', 'Goa Party Travel Songs', 'Goa Party Songs Playlist', TRUE),
('shimla', 'Shimla', 'LoFi Chill Roadtrip', 'Shimla LoFi Chill Songs', TRUE),
('rajasthan', 'Rajasthan', 'Rajasthani Folk Songs', 'Rajasthani Folk Songs Playlist', TRUE),
('ladakh', 'Ladakh', 'Himalayan Roadtrip Songs', 'Ladakh Roadtrip Songs', TRUE),
('kerala', 'Kerala', 'Kerala Travel Vibes', 'Kerala Travel Songs', TRUE),
('tajmahal', 'Taj Mahal', 'Romantic Love Travel Songs', 'Taj Mahal Romantic Songs', TRUE),
('kolkata', 'Kolkata', 'Bengali Travel Songs', 'Kolkata Bengali Songs', TRUE),
('varanasi', 'Varanasi', 'Indian Classical Devotional', 'Varanasi Ganga Aarti Songs', TRUE),
('mumbai', 'Mumbai', 'Bollywood Travel Hits', 'Mumbai Bollywood Songs', TRUE),
('himachal', 'Himachal Pradesh', 'Mountain Adventure Songs', 'Himachal Mountain Songs', TRUE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
