<?php

header('Access-Control-Allow-Origin: http://localhost:4200');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/UserActivityBonus.php';

class UserBonusAPI {
    private $pdo;
    private $bonusCalculator;
    
    public function __construct() {
        try {
            $database = new Database();
            $this->pdo = $database->getConnection();
            $this->bonusCalculator = new UserActivityBonus($this->pdo);
        } catch (Exception $e) {
            $this->sendError('Database connection failed: ' . $e->getMessage(), 500);
        }
    }
    
    public function handleRequest() {
        if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
            return $this->sendError('Admin authentication required', 401);
        }
        
        $action = $_GET['action'] ?? '';
        
        try {
            switch ($action) {
                case 'get_bonus':
                    return $this->getUserBonus();
                case 'get_activity':
                    return $this->getUserActivity();
                case 'calculate_gift_card_bonus':
                    return $this->calculateGiftCardBonus();
                default:
                    return $this->sendError('Invalid action', 400);
            }
        } catch (Exception $e) {
            error_log("User Bonus API Error: " . $e->getMessage());
            return $this->sendError($e->getMessage(), 500);
        }
    }

    private function getUserBonus() {
        $userId = $_GET['user_id'] ?? null;
        
        if (!$userId) {
            return $this->sendError('User ID required', 400);
        }
        
        $bonusInfo = $this->bonusCalculator->calculateBonusPercentage($userId);
        
        return $this->sendSuccess([
            'user_id' => $userId,
            'bonus' => $bonusInfo
        ]);
    }

    private function getUserActivity() {
        $userId = $_GET['user_id'] ?? null;
        
        if (!$userId) {
            return $this->sendError('User ID required', 400);
        }
        
        $activity = $this->bonusCalculator->getUserActivityDetails($userId);
        
        if ($activity === null) {
            return $this->sendError('Failed to fetch user activity', 500);
        }
        
        return $this->sendSuccess([
            'user_id' => $userId,
            'activity' => $activity
        ]);
    }

    private function calculateGiftCardBonus() {
        $userId = $_GET['user_id'] ?? null;
        $bookingAmount = $_GET['booking_amount'] ?? 0;
        
        if (!$userId || $bookingAmount <= 0) {
            return $this->sendError('User ID and booking amount required', 400);
        }
        
        $bonusInfo = $this->bonusCalculator->calculateBonusPercentage($userId);
        $bonusAmount = ($bookingAmount * $bonusInfo['bonus_percentage']) / 100;
        $totalGiftCardAmount = $bookingAmount + $bonusAmount;
        
        return $this->sendSuccess([
            'user_id' => $userId,
            'booking_amount' => floatval($bookingAmount),
            'bonus_percentage' => $bonusInfo['bonus_percentage'],
            'bonus_amount' => round($bonusAmount, 2),
            'total_gift_card_amount' => round($totalGiftCardAmount, 2),
            'tier' => $bonusInfo['tier'],
            'reason' => $bonusInfo['reason'],
            'booking_count' => $bonusInfo['booking_count'],
            'activity_score' => $bonusInfo['activity_score'] ?? 0
        ]);
    }
    
    private function sendSuccess($data) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
        exit;
    }
    
    private function sendError($message, $code = 400) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'error' => $message
        ]);
        exit;
    }
}

$api = new UserBonusAPI();
$api->handleRequest();
?>
