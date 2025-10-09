<?php
// Test script to check bookings and simulate expired booking
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$pdo = $database->getConnection();

echo "=== Current Bookings Status ===\n\n";

$stmt = $pdo->query("
    SELECT 
        b.id, 
        b.booking_reference, 
        b.travel_date, 
        b.status as booking_status,
        t.duration_days,
        t.title as tour_name,
        DATE_ADD(b.travel_date, INTERVAL t.duration_days DAY) as end_date,
        DATEDIFF(CURDATE(), DATE_ADD(b.travel_date, INTERVAL t.duration_days DAY)) as days_past_end,
        tga.id as assignment_id,
        tga.guide_id,
        tga.status as assignment_status
    FROM bookings b
    INNER JOIN tours t ON b.tour_id = t.id
    LEFT JOIN tour_guide_assignments tga ON b.id = tga.booking_id
");

$bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($bookings as $booking) {
    echo "Booking #{$booking['id']} ({$booking['booking_reference']})\n";
    echo "  Tour: {$booking['tour_name']}\n";
    echo "  Travel Date: {$booking['travel_date']}\n";
    echo "  Duration: {$booking['duration_days']} days\n";
    echo "  End Date: {$booking['end_date']}\n";
    echo "  Booking Status: {$booking['booking_status']}\n";
    echo "  Assignment: " . ($booking['assignment_id'] ? "ID {$booking['assignment_id']} (Status: {$booking['assignment_status']})" : "None") . "\n";
    echo "  Days Past End: {$booking['days_past_end']}\n";
    echo "\n";
}

echo "\n=== Setting Booking #1 to expired (for testing) ===\n";

// Set booking #1's travel date to 10 days ago and assign to guide #1
$pdo->exec("UPDATE bookings SET travel_date = DATE_SUB(CURDATE(), INTERVAL 10 DAY), status = 'confirmed' WHERE id = 1");

// Check if assignment exists for booking #1
$checkAssignment = $pdo->query("SELECT id FROM tour_guide_assignments WHERE booking_id = 1");
if (!$checkAssignment->fetch()) {
    // Create assignment for testing
    $pdo->exec("INSERT INTO tour_guide_assignments (guide_id, booking_id, assignment_date, status) VALUES (1, 1, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'assigned')");
    // Set guide to busy
    $pdo->exec("UPDATE guides SET status = 'busy' WHERE id = 1");
    echo "✅ Created test assignment for booking #1 to guide #1\n";
} else {
    echo "✅ Assignment already exists for booking #1\n";
}

echo "✅ Set booking #1 travel date to 10 days ago\n";
echo "✅ You can now test the auto-complete endpoint\n";
?>
