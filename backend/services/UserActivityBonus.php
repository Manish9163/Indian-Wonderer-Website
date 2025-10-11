<?php

class UserActivityBonus {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    

    public function calculateBonusPercentage($userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as booking_count 
                FROM bookings 
                WHERE user_id = ? AND status != 'cancelled'
            ");
            $stmt->execute([$userId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $bookingCount = $result['booking_count'];
            
            if ($bookingCount == 0) {
                return [
                    'bonus_percentage' => 10,
                    'reason' => 'First time user bonus',
                    'tier' => 'bronze',
                    'booking_count' => 0
                ];
            }
            
            $activityScore = $this->calculateActivityScore($userId);
            
            if ($activityScore >= 80) {
                $bonus = 5.0;
                $tier = 'gold';
                $reason = 'High activity user (5% bonus)';
            } elseif ($activityScore >= 50) {
                $bonus = 4.0;
                $tier = 'silver';
                $reason = 'Medium activity user (4% bonus)';
            } else {
                $bonus = 3.0;
                $tier = 'bronze';
                $reason = 'Regular user (3% bonus)';
            }
            
            return [
                'bonus_percentage' => $bonus,
                'reason' => $reason,
                'tier' => $tier,
                'booking_count' => $bookingCount,
                'activity_score' => $activityScore
            ];
            
        } catch (Exception $e) {
            error_log("Bonus calculation error: " . $e->getMessage());
            return [
                'bonus_percentage' => 3,
                'reason' => 'Default bonus',
                'tier' => 'bronze',
                'booking_count' => 0,
                'activity_score' => 0
            ];
        }
    }

    private function calculateActivityScore($userId) {
        $score = 0;
        
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) as count 
            FROM bookings 
            WHERE user_id = ? AND status != 'cancelled'
        ");
        $stmt->execute([$userId]);
        $bookingCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        $score += min($bookingCount * 5, 30); 
        
        $stmt = $this->pdo->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM bookings 
            WHERE user_id = ? AND status != 'cancelled'
        ");
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($result['total'] > 0) {
            $completionRatio = $result['completed'] / $result['total'];
            $score += $completionRatio * 25;
        }
        
        $stmt = $this->pdo->prepare("
            SELECT COALESCE(SUM(total_amount), 0) as total_spent
            FROM bookings 
            WHERE user_id = ? AND payment_status = 'paid'
        ");
        $stmt->execute([$userId]);
        $totalSpent = $stmt->fetch(PDO::FETCH_ASSOC)['total_spent'];
        $score += min($totalSpent / 1000, 25); // 1 point per 1000 spent, max 25
        
        $stmt = $this->pdo->prepare("
            SELECT DATEDIFF(CURDATE(), MAX(booking_date)) as days_since_last
            FROM bookings 
            WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        $daysSinceLast = $stmt->fetch(PDO::FETCH_ASSOC)['days_since_last'];
        if ($daysSinceLast !== null) {
            if ($daysSinceLast <= 30) {
                $score += 20;
            } elseif ($daysSinceLast <= 90) {
                $score += 15;
            } elseif ($daysSinceLast <= 180) {
                $score += 10;
            } else {
                $score += 5;
            }
        }
        
        return min($score, 100);
    }
    

    public function getUserActivityDetails($userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    COUNT(*) as total_bookings,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
                    COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as total_spent,
                    MAX(booking_date) as last_booking_date,
                    MIN(booking_date) as first_booking_date
                FROM bookings 
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as gift_cards_received
                FROM gift_cards 
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $giftCardCount = $stmt->fetch(PDO::FETCH_ASSOC)['gift_cards_received'];
            
            $stats['gift_cards_received'] = $giftCardCount;
            $stats['activity_score'] = $this->calculateActivityScore($userId);
            $stats['bonus_info'] = $this->calculateBonusPercentage($userId);
            
            return $stats;
            
        } catch (Exception $e) {
            error_log("User activity details error: " . $e->getMessage());
            return null;
        }
    }
}
?>
