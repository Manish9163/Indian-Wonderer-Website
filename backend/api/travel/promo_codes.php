<?php
/**
 * Promo Code API - MakeMyTrip Style
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/../../config/database.php';

class PromoCodeAPI {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    /**
     * Get all active promo codes
     */
    public function getAllPromoCodes() {
        try {
            $query = "SELECT id, code, description, discount_type, discount_value, 
                            min_booking_amount, max_discount, applicable_modes,
                            DATE_FORMAT(valid_from, '%Y-%m-%d') as valid_from,
                            DATE_FORMAT(valid_until, '%Y-%m-%d') as valid_until,
                            usage_limit, used_count
                     FROM promo_codes
                     WHERE is_active = 1
                     AND (valid_until IS NULL OR valid_until >= CURDATE())
                     AND (usage_limit IS NULL OR used_count < usage_limit)
                     ORDER BY discount_value DESC";
            
            $stmt = $this->db->query($query);
            $codes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($codes as &$code) {
                $code['applicable_modes'] = json_decode($code['applicable_modes'] ?? '[]');
            }
            
            return $this->success(['promo_codes' => $codes]);
            
        } catch (Exception $e) {
            return $this->error('Failed to fetch promo codes', 500);
        }
    }
    
    /**
     * Validate and calculate discount
     */
    public function validatePromoCode() {
        $code = $_POST['code'] ?? $_GET['code'] ?? null;
        $booking_amount = floatval($_POST['booking_amount'] ?? $_GET['booking_amount'] ?? 0);
        $mode = $_POST['mode'] ?? $_GET['mode'] ?? null;
        
        if (!$code) {
            return $this->error('Promo code is required', 400);
        }
        
        if ($booking_amount <= 0) {
            return $this->error('Invalid booking amount', 400);
        }
        
        try {
            $query = "SELECT * FROM promo_codes 
                     WHERE code = :code 
                     AND is_active = 1
                     AND (valid_from IS NULL OR valid_from <= CURDATE())
                     AND (valid_until IS NULL OR valid_until >= CURDATE())
                     AND (usage_limit IS NULL OR used_count < usage_limit)";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute([':code' => strtoupper($code)]);
            $promo = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$promo) {
                return $this->error('Invalid or expired promo code', 400);
            }
            
            // Check minimum booking amount
            if ($booking_amount < $promo['min_booking_amount']) {
                return $this->error("Minimum booking amount of ₹{$promo['min_booking_amount']} required", 400);
            }
            
            // Check if applicable to mode
            if ($mode) {
                $applicable_modes = json_decode($promo['applicable_modes'] ?? '[]', true);
                if (!empty($applicable_modes) && !in_array($mode, $applicable_modes)) {
                    return $this->error("This promo code is not applicable for $mode bookings", 400);
                }
            }
            
            // Calculate discount
            $discount = 0;
            if ($promo['discount_type'] === 'percentage') {
                $discount = ($booking_amount * $promo['discount_value']) / 100;
            } else {
                $discount = $promo['discount_value'];
            }
            
            // Apply max discount cap
            if ($promo['max_discount'] && $discount > $promo['max_discount']) {
                $discount = $promo['max_discount'];
            }
            
            $final_amount = max(0, $booking_amount - $discount);
            
            return $this->success([
                'valid' => true,
                'code' => $promo['code'],
                'description' => $promo['description'],
                'discount_type' => $promo['discount_type'],
                'discount_value' => $promo['discount_value'],
                'original_amount' => $booking_amount,
                'discount_amount' => round($discount, 2),
                'final_amount' => round($final_amount, 2),
                'savings' => round($discount, 2)
            ]);
            
        } catch (Exception $e) {
            return $this->error('Failed to validate promo code', 500);
        }
    }
    
    /**
     * Apply promo code to booking
     */
    public function applyPromoCode() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return $this->error('Only POST method allowed', 405);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $code = $input['code'] ?? null;
        
        if (!$code) {
            return $this->error('Promo code is required', 400);
        }
        
        try {
            // Increment usage count
            $query = "UPDATE promo_codes 
                     SET used_count = used_count + 1 
                     WHERE code = :code AND is_active = 1";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute([':code' => strtoupper($code)]);
            
            if ($stmt->rowCount() > 0) {
                return $this->success(['message' => 'Promo code applied successfully']);
            } else {
                return $this->error('Failed to apply promo code', 400);
            }
            
        } catch (Exception $e) {
            return $this->error('Failed to apply promo code', 500);
        }
    }
    
    /**
     * Get best promo code for booking
     */
    public function getBestPromoCode() {
        $booking_amount = floatval($_GET['booking_amount'] ?? 0);
        $mode = $_GET['mode'] ?? null;
        
        if ($booking_amount <= 0) {
            return $this->error('Invalid booking amount', 400);
        }
        
        try {
            $query = "SELECT * FROM promo_codes 
                     WHERE is_active = 1
                     AND (valid_until IS NULL OR valid_until >= CURDATE())
                     AND (usage_limit IS NULL OR used_count < usage_limit)
                     AND min_booking_amount <= :booking_amount";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute([':booking_amount' => $booking_amount]);
            $promos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $best_promo = null;
            $max_discount = 0;
            
            foreach ($promos as $promo) {
                // Check mode applicability
                if ($mode) {
                    $applicable_modes = json_decode($promo['applicable_modes'] ?? '[]', true);
                    if (!empty($applicable_modes) && !in_array($mode, $applicable_modes)) {
                        continue;
                    }
                }
                
                // Calculate discount
                $discount = 0;
                if ($promo['discount_type'] === 'percentage') {
                    $discount = ($booking_amount * $promo['discount_value']) / 100;
                } else {
                    $discount = $promo['discount_value'];
                }
                
                if ($promo['max_discount'] && $discount > $promo['max_discount']) {
                    $discount = $promo['max_discount'];
                }
                
                if ($discount > $max_discount) {
                    $max_discount = $discount;
                    $best_promo = $promo;
                    $best_promo['calculated_discount'] = $discount;
                }
            }
            
            if ($best_promo) {
                return $this->success([
                    'has_recommendation' => true,
                    'best_promo' => [
                        'code' => $best_promo['code'],
                        'description' => $best_promo['description'],
                        'discount' => round($best_promo['calculated_discount'], 2),
                        'final_amount' => round($booking_amount - $best_promo['calculated_discount'], 2)
                    ]
                ]);
            } else {
                return $this->success(['has_recommendation' => false]);
            }
            
        } catch (Exception $e) {
            return $this->error('Failed to find best promo code', 500);
        }
    }
    
    private function success($data) {
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $data]);
        exit;
    }
    
    private function error($message, $code = 400) {
        http_response_code($code);
        echo json_encode(['success' => false, 'error' => $message]);
        exit;
    }
}

$api = new PromoCodeAPI();
$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'list':
        $api->getAllPromoCodes();
        break;
    case 'validate':
        $api->validatePromoCode();
        break;
    case 'apply':
        $api->applyPromoCode();
        break;
    case 'best':
        $api->getBestPromoCode();
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
}
