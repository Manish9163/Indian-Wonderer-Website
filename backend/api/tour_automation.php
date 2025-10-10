<?php
/**
 * Tour & Guide Automation System
 * - Auto-assign guides to bookings
 * - Auto-complete tours after travel date
 * - Auto-calculate and distribute guide earnings
 */

require_once '../config/database.php';

header('Content-Type: application/json');

class TourAutomation {
    private $pdo;
    
    public function __construct() {
        $database = new Database();
        $this->pdo = $database->getConnection();
    }
    
    /**
     * Main automation runner
     */
    public function runAutomation() {
        $results = [
            'auto_assignments' => $this->autoAssignGuidesToBookings(),
            'auto_completions' => $this->autoCompleteExpiredTours(),
            'earnings_distribution' => $this->distributeGuideEarnings()
        ];
        
        return $results;
    }
    
    /**
     * Auto-assign available guides to confirmed bookings without guides
     */
    private function autoAssignGuidesToBookings() {
        $assigned = 0;
        $errors = [];
        
        try {
            // Get confirmed bookings without guide assignments
            $stmt = $this->pdo->query("
                SELECT b.id as booking_id, b.tour_id, b.travel_date, t.title as tour_name
                FROM bookings b
                JOIN tours t ON b.tour_id = t.id
                LEFT JOIN tour_guide_assignments tga ON b.id = tga.booking_id
                WHERE b.status = 'confirmed'
                AND tga.id IS NULL
                AND b.travel_date > CURDATE()
                ORDER BY b.travel_date ASC
            ");
            $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($bookings as $booking) {
                // Find available guide
                $guideStmt = $this->pdo->prepare("
                    SELECT g.id, g.user_id, u.first_name, u.last_name
                    FROM guides g
                    JOIN users u ON g.user_id = u.id
                    WHERE g.status = 'available'
                    AND g.application_status = 'approved'
                    ORDER BY RAND()
                    LIMIT 1
                ");
                $guideStmt->execute();
                $guide = $guideStmt->fetch(PDO::FETCH_ASSOC);
                
                if ($guide) {
                    // Assign guide to booking
                    $assignStmt = $this->pdo->prepare("
                        INSERT INTO tour_guide_assignments 
                        (guide_id, booking_id, assignment_date, status)
                        VALUES (?, ?, NOW(), 'assigned')
                    ");
                    $assignStmt->execute([$guide['id'], $booking['booking_id']]);
                    
                    // Update guide status to busy
                    $updateGuideStmt = $this->pdo->prepare("
                        UPDATE guides SET status = 'busy' WHERE id = ?
                    ");
                    $updateGuideStmt->execute([$guide['id']]);
                    
                    $assigned++;
                    
                    $errors[] = [
                        'success' => true,
                        'message' => "Assigned {$guide['first_name']} {$guide['last_name']} to booking #{$booking['booking_id']} ({$booking['tour_name']})"
                    ];
                } else {
                    $errors[] = [
                        'success' => false,
                        'message' => "No available guide found for booking #{$booking['booking_id']}"
                    ];
                }
            }
            
            return [
                'success' => true,
                'assigned_count' => $assigned,
                'total_bookings_checked' => count($bookings),
                'details' => $errors
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Auto-complete tours where travel_date has passed
     */
    private function autoCompleteExpiredTours() {
        $completed = 0;
        $details = [];
        
        try {
            // Get confirmed bookings where travel date has passed
            $stmt = $this->pdo->query("
                SELECT b.id, b.booking_reference, b.travel_date, b.total_amount,
                       t.title as tour_name
                FROM bookings b
                JOIN tours t ON b.tour_id = t.id
                WHERE b.status = 'confirmed'
                AND b.travel_date < CURDATE()
            ");
            $expiredBookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($expiredBookings as $booking) {
                // Update booking status to completed
                $updateStmt = $this->pdo->prepare("
                    UPDATE bookings 
                    SET status = 'completed',
                        updated_at = NOW()
                    WHERE id = ?
                ");
                $updateStmt->execute([$booking['id']]);
                
                // Update guide assignment status
                $updateAssignmentStmt = $this->pdo->prepare("
                    UPDATE tour_guide_assignments
                    SET status = 'completed',
                        completed_date = NOW()
                    WHERE booking_id = ?
                ");
                $updateAssignmentStmt->execute([$booking['id']]);
                
                // Set guides back to available if no more active bookings
                $freeGuidesStmt = $this->pdo->query("
                    UPDATE guides g
                    SET g.status = 'available'
                    WHERE g.id IN (
                        SELECT tga.guide_id 
                        FROM tour_guide_assignments tga
                        WHERE tga.booking_id = {$booking['id']}
                    )
                    AND NOT EXISTS (
                        SELECT 1 
                        FROM tour_guide_assignments tga2
                        JOIN bookings b2 ON tga2.booking_id = b2.id
                        WHERE tga2.guide_id = g.id
                        AND b2.status IN ('confirmed', 'pending')
                        AND tga2.status = 'assigned'
                    )
                ");
                
                $completed++;
                $details[] = [
                    'booking_id' => $booking['id'],
                    'booking_reference' => $booking['booking_reference'],
                    'tour_name' => $booking['tour_name'],
                    'travel_date' => $booking['travel_date'],
                    'amount' => $booking['total_amount'],
                    'message' => 'Auto-completed'
                ];
            }
            
            return [
                'success' => true,
                'completed_count' => $completed,
                'total_checked' => count($expiredBookings),
                'details' => $details
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Calculate and distribute earnings to guides from completed tours
     */
    private function distributeGuideEarnings() {
        $distributed = 0;
        $totalAmount = 0;
        $details = [];
        
        try {
            // Check if guide_earnings table exists, if not create it
            $this->createGuideEarningsTable();
            
            // Get completed bookings with guide assignments that haven't been paid
            $stmt = $this->pdo->query("
                SELECT 
                    tga.id as assignment_id,
                    tga.guide_id,
                    tga.booking_id,
                    b.booking_reference,
                    b.total_amount,
                    b.travel_date,
                    g.user_id,
                    CONCAT(u.first_name, ' ', u.last_name) as guide_name,
                    t.title as tour_name
                FROM tour_guide_assignments tga
                JOIN bookings b ON tga.booking_id = b.id
                JOIN guides g ON tga.guide_id = g.id
                JOIN users u ON g.user_id = u.id
                JOIN tours t ON b.tour_id = t.id
                LEFT JOIN guide_earnings ge ON ge.assignment_id = tga.id
                WHERE b.status = 'completed'
                AND tga.status = 'completed'
                AND ge.id IS NULL
            ");
            $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($assignments as $assignment) {
                // Calculate guide earnings (30% of total booking amount)
                $guideCommission = floatval($assignment['total_amount']) * 0.30;
                
                // Record the earnings
                $insertStmt = $this->pdo->prepare("
                    INSERT INTO guide_earnings 
                    (guide_id, assignment_id, booking_id, amount, commission_rate, status, earned_date)
                    VALUES (?, ?, ?, ?, 30.00, 'earned', NOW())
                ");
                $insertStmt->execute([
                    $assignment['guide_id'],
                    $assignment['assignment_id'],
                    $assignment['booking_id'],
                    $guideCommission
                ]);
                
                // Update guide's total earnings
                $updateGuideStmt = $this->pdo->prepare("
                    UPDATE guides 
                    SET total_tours = COALESCE(total_tours, 0) + 1
                    WHERE id = ?
                ");
                $updateGuideStmt->execute([$assignment['guide_id']]);
                
                $distributed++;
                $totalAmount += $guideCommission;
                
                $details[] = [
                    'guide_id' => $assignment['guide_id'],
                    'guide_name' => $assignment['guide_name'],
                    'booking_reference' => $assignment['booking_reference'],
                    'tour_name' => $assignment['tour_name'],
                    'booking_amount' => $assignment['total_amount'],
                    'guide_earning' => $guideCommission,
                    'commission_rate' => '30%'
                ];
            }
            
            return [
                'success' => true,
                'distributed_count' => $distributed,
                'total_amount_distributed' => $totalAmount,
                'details' => $details
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Create guide_earnings table if it doesn't exist
     */
    private function createGuideEarningsTable() {
        $sql = "CREATE TABLE IF NOT EXISTS guide_earnings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            guide_id INT NOT NULL,
            assignment_id INT NOT NULL,
            booking_id INT NOT NULL,
            amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            commission_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00,
            status ENUM('earned', 'paid', 'pending') DEFAULT 'earned',
            earned_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            paid_date DATETIME NULL,
            notes TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE,
            FOREIGN KEY (assignment_id) REFERENCES tour_guide_assignments(id) ON DELETE CASCADE,
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
            INDEX idx_guide_id (guide_id),
            INDEX idx_booking_id (booking_id),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        
        $this->pdo->exec($sql);
    }
}

// Run automation
$automation = new TourAutomation();
$results = $automation->runAutomation();

echo json_encode([
    'success' => true,
    'timestamp' => date('Y-m-d H:i:s'),
    'results' => $results,
    'summary' => [
        'guides_assigned' => $results['auto_assignments']['assigned_count'] ?? 0,
        'tours_completed' => $results['auto_completions']['completed_count'] ?? 0,
        'earnings_distributed' => $results['earnings_distribution']['distributed_count'] ?? 0,
        'total_earnings_amount' => $results['earnings_distribution']['total_amount_distributed'] ?? 0
    ]
], JSON_PRETTY_PRINT);
