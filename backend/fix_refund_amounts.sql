-- SQL Script to Fix Refund Amounts
-- Run this in phpMyAdmin or MySQL command line

-- Check current state
SELECT 
    r.id as refund_id,
    r.amount as current_amount,
    b.total_amount as booking_total,
    r.status,
    r.method,
    b.booking_reference
FROM refunds r
JOIN bookings b ON r.booking_id = b.id;

-- Update all refund amounts to match booking totals
UPDATE refunds r
JOIN bookings b ON r.booking_id = b.id
SET r.amount = b.total_amount
WHERE r.amount = 0 OR r.amount IS NULL OR r.amount = '0.00';

-- Verify the fix
SELECT 
    r.id as refund_id,
    r.amount as updated_amount,
    b.total_amount as booking_total,
    CASE 
        WHEN r.amount = b.total_amount THEN '✓ Fixed'
        ELSE '✗ Mismatch'
    END as status
FROM refunds r
JOIN bookings b ON r.booking_id = b.id;
