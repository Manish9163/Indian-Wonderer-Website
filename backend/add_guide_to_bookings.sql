-- Add guide_id column to bookings table if it doesn't exist
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guide_id INT DEFAULT NULL;
ALTER TABLE bookings ADD KEY IF NOT EXISTS idx_guide_id (guide_id);

-- Add some sample guides if table is empty
INSERT INTO guides (user_id, specialization, experience_years, languages, bio, rating, status, application_status, hourly_rate)
SELECT 1, 'Cultural Tours', 8, '["Hindi", "English", "Punjabi"]', 'Passionate about Indian history and culture', 4.9, 'available', 'approved', 2500
WHERE NOT EXISTS (SELECT 1 FROM guides LIMIT 1)
UNION ALL
SELECT 2, 'Adventure Tours', 6, '["Hindi", "English", "German"]', 'Adventure enthusiast with expertise in Himalayan treks', 4.8, 'available', 'approved', 3000
UNION ALL
SELECT 3, 'Beach Tours', 5, '["Tamil", "English", "Telugu"]', 'Beach expert and food enthusiast', 4.7, 'available', 'approved', 2200
UNION ALL
SELECT 4, 'Desert Safari', 10, '["Hindi", "English", "Gujarati", "Rajasthani"]', 'Born and raised in the Thar Desert', 4.9, 'available', 'approved', 2800
UNION ALL
SELECT 5, 'Wildlife Safari', 7, '["Hindi", "English", "Punjabi"]', 'Wildlife photographer turned guide', 4.8, 'available', 'approved', 3500
UNION ALL
SELECT 6, 'Backwater Tours', 4, '["Malayalam", "English", "Tamil"]', 'Kerala native with deep knowledge of backwaters', 4.6, 'available', 'approved', 2400;

-- Update bookings query to include guide information
-- This is just for reference, the backend API will handle this
