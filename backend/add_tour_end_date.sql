-- Add end_date column to bookings table for tracking feature
-- This will store the last day of the tour

ALTER TABLE bookings 
ADD COLUMN tour_end_date DATE NULL AFTER travel_date;

-- Update existing bookings to set end_date based on tour duration
UPDATE bookings b
JOIN tours t ON b.tour_id = t.id
SET b.tour_end_date = DATE_ADD(b.travel_date, INTERVAL t.duration_days DAY);

-- Add comment for documentation
ALTER TABLE bookings 
MODIFY COLUMN tour_end_date DATE NULL COMMENT 'Last day of the tour (travel_date + duration_days)';
