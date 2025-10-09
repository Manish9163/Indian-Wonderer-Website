<?php
/**
 * Admin Refund Management API
 * Handles refund processing and status updates
 */

require_once '../config/database.php';
require_once '../config/api_config.php';
require_once '../services/EmailService.php';

// Handle CORS
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4200', 'http://127.0.0.1:4200'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:4200';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: http://localhost:4200');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

class AdminRefundAPI {
    private $pdo;
    private $emailService;
    
    public function __construct() {
        try {
            $database = new Database();
            $this->pdo = $database->getConnection();
            
            // Try to initialize EmailService, but don't fail if it doesn't exist
            if (class_exists('EmailService')) {
                $this->emailService = new EmailService();
            } else {
                $this->emailService = null;
                error_log("EmailService class not found - emails will not be sent");
            }
        } catch (Exception $e) {
            error_log("AdminRefundAPI Constructor Error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Database connection failed: ' . $e->getMessage()
            ]);
            exit;
        }
    }
    
    /**
     * Handle API requests
     */
    public function handleRequest() {
        $action = $_GET['action'] ?? '';
        
        try {
            switch ($action) {
                case 'complete':
                    return $this->completeRefund();
                case 'complete_giftcard':
                    return $this->completeGiftCard();
                case 'get_pending':
                    return $this->getPendingRefunds();
                case 'get_details':
                    return $this->getRefundDetails();
                default:
                    return $this->sendError('Invalid action', 400);
            }
        } catch (Exception $e) {
            error_log("Admin Refund API Error: " . $e->getMessage());
            return $this->sendError($e->getMessage(), 500);
        }
    }
    
    /**
     * Complete a bank refund
     */
    private function completeRefund() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return $this->sendError('Method not allowed', 405);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $refundId = $data['refund_id'] ?? null;
        $notes = $data['notes'] ?? 'Refund processed by admin';
        
        if (!$refundId) {
            return $this->sendError('Refund ID is required', 400);
        }
        
        try {
            $this->pdo->beginTransaction();
            
            // Get refund details
            $stmt = $this->pdo->prepare("
                SELECT r.*, b.booking_reference, b.user_id, b.tour_id,
                       u.first_name, u.last_name, u.email,
                       t.title as tour_name
                FROM refunds r
                JOIN bookings b ON r.booking_id = b.id
                JOIN users u ON b.user_id = u.id
                LEFT JOIN tours t ON b.tour_id = t.id
                WHERE r.id = ? AND r.status = 'pending'
            ");
            $stmt->execute([$refundId]);
            $refund = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$refund) {
                throw new Exception('Refund not found or already processed');
            }
            
            // Update refund status
            $stmt = $this->pdo->prepare("
                UPDATE refunds 
                SET status = 'completed', 
                    completed_at = NOW(),
                    notes = ?
                WHERE id = ?
            ");
            $stmt->execute([$notes, $refundId]);
            
            // Log the action
            $stmt = $this->pdo->prepare("
                INSERT INTO booking_logs (booking_id, action, details, created_at)
                VALUES (?, 'refund_completed', ?, NOW())
            ");
            $stmt->execute([
                $refund['booking_id'],
                json_encode([
                    'refund_id' => $refundId,
                    'amount' => $refund['amount'],
                    'method' => $refund['method'],
                    'notes' => $notes,
                    'completed_by' => 'admin'
                ])
            ]);
            
            $this->pdo->commit();
            
            // Send email notification to customer
            $this->sendRefundCompletedEmail($refund);
            
            return $this->sendSuccess([
                'message' => 'Refund processed successfully',
                'refund' => [
                    'id' => $refundId,
                    'status' => 'completed',
                    'amount' => $refund['amount'],
                    'completed_at' => date('Y-m-d H:i:s')
                ]
            ]);
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            error_log("Complete Refund Error: " . $e->getMessage());
            return $this->sendError($e->getMessage(), 500);
        }
    }
    
    /**
     * Complete a gift card (mark as activated/notified)
     */
    private function completeGiftCard() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return $this->sendError('Method not allowed', 405);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $giftCardId = $data['giftcard_id'] ?? null;
        $bookingId = $data['booking_id'] ?? null;
        
        if (!$giftCardId && !$bookingId) {
            return $this->sendError('Gift card ID or Booking ID is required', 400);
        }
        
        try {
            $this->pdo->beginTransaction();
            
            // Get gift card details
            if ($giftCardId) {
                $stmt = $this->pdo->prepare("
                    SELECT g.*, b.booking_reference, b.user_id,
                           u.first_name, u.last_name, u.email
                    FROM gift_cards g
                    JOIN bookings b ON g.booking_id = b.id
                    JOIN users u ON b.user_id = u.id
                    WHERE g.id = ?
                ");
                $stmt->execute([$giftCardId]);
            } else {
                $stmt = $this->pdo->prepare("
                    SELECT g.*, b.booking_reference, b.user_id,
                           u.first_name, u.last_name, u.email
                    FROM gift_cards g
                    JOIN bookings b ON g.booking_id = b.id
                    JOIN users u ON b.user_id = u.id
                    WHERE g.booking_id = ?
                ");
                $stmt->execute([$bookingId]);
            }
            
            $giftCard = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$giftCard) {
                throw new Exception('Gift card not found');
            }
            
            // Update gift card status if needed (ensure it's active)
            $stmt = $this->pdo->prepare("
                UPDATE gift_cards 
                SET status = 'active'
                WHERE id = ?
            ");
            $stmt->execute([$giftCard['id']]);
            
            // Log the action
            $stmt = $this->pdo->prepare("
                INSERT INTO booking_logs (booking_id, action, details, created_at)
                VALUES (?, 'giftcard_activated', ?, NOW())
            ");
            $stmt->execute([
                $giftCard['booking_id'],
                json_encode([
                    'giftcard_id' => $giftCard['id'],
                    'code' => $giftCard['code'],
                    'amount' => $giftCard['amount'],
                    'balance' => $giftCard['balance'],
                    'activated_by' => 'admin'
                ])
            ]);
            
            $this->pdo->commit();
            
            // Send reminder email with gift card details
            $this->sendGiftCardReminderEmail($giftCard);
            
            return $this->sendSuccess([
                'message' => 'Gift card activated and customer notified',
                'giftcard' => [
                    'id' => $giftCard['id'],
                    'code' => $giftCard['code'],
                    'status' => 'active',
                    'amount' => $giftCard['amount']
                ]
            ]);
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            error_log("Complete Gift Card Error: " . $e->getMessage());
            return $this->sendError($e->getMessage(), 500);
        }
    }
    
    /**
     * Get all pending refunds
     */
    private function getPendingRefunds() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    r.id as refund_id,
                    r.amount as refund_amount,
                    r.method as refund_method,
                    r.initiated_at,
                    b.id as booking_id,
                    b.booking_reference,
                    u.first_name,
                    u.last_name,
                    u.email,
                    t.title as tour_name
                FROM refunds r
                JOIN bookings b ON r.booking_id = b.id
                JOIN users u ON b.user_id = u.id
                LEFT JOIN tours t ON b.tour_id = t.id
                WHERE r.status = 'pending'
                ORDER BY r.initiated_at DESC
                LIMIT 100
            ");
            $stmt->execute();
            $refunds = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return $this->sendSuccess([
                'refunds' => $refunds,
                'count' => count($refunds)
            ]);
            
        } catch (Exception $e) {
            error_log("Get Pending Refunds Error: " . $e->getMessage());
            return $this->sendError($e->getMessage(), 500);
        }
    }
    
    /**
     * Get refund details
     */
    private function getRefundDetails() {
        $refundId = $_GET['refund_id'] ?? null;
        
        if (!$refundId) {
            return $this->sendError('Refund ID is required', 400);
        }
        
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    r.*,
                    b.booking_reference,
                    b.total_amount as booking_amount,
                    b.cancelled_at,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone,
                    t.title as tour_name,
                    t.start_date,
                    t.end_date
                FROM refunds r
                JOIN bookings b ON r.booking_id = b.id
                JOIN users u ON b.user_id = u.id
                LEFT JOIN tours t ON b.tour_id = t.id
                WHERE r.id = ?
            ");
            $stmt->execute([$refundId]);
            $refund = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$refund) {
                return $this->sendError('Refund not found', 404);
            }
            
            return $this->sendSuccess(['refund' => $refund]);
            
        } catch (Exception $e) {
            error_log("Get Refund Details Error: " . $e->getMessage());
            return $this->sendError($e->getMessage(), 500);
        }
    }
    
    /**
     * Send refund completed email to customer
     */
    private function sendRefundCompletedEmail($refund) {
        // Check if email service is available
        if (!$this->emailService) {
            error_log("EmailService not available - skipping refund email");
            return;
        }
        
        try {
            $subject = "Your Refund Has Been Processed - " . $refund['booking_reference'];
            
            $message = "
                <h2>Refund Processed Successfully</h2>
                <p>Dear {$refund['first_name']} {$refund['last_name']},</p>
                <p>We are pleased to inform you that your refund has been processed.</p>
                
                <div style='background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                    <h3 style='margin-top: 0;'>Refund Details</h3>
                    <p><strong>Booking Reference:</strong> {$refund['booking_reference']}</p>
                    <p><strong>Tour:</strong> {$refund['tour_name']}</p>
                    <p><strong>Refund Amount:</strong> ₹" . number_format($refund['amount'], 2) . "</p>
                    <p><strong>Refund Method:</strong> " . ucfirst($refund['method']) . "</p>
                    <p><strong>Processed Date:</strong> " . date('F j, Y g:i A') . "</p>
                </div>
                
                <div style='background: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;'>
                    <p><strong>⏱️ Expected Timeline:</strong></p>
                    <p>The refund amount will be credited to your original payment method within <strong>5-7 business days</strong>.</p>
                    <p>Please allow your bank/card issuer additional processing time.</p>
                </div>
                
                <p>If you do not receive the refund within the expected timeframe, please contact us with your booking reference.</p>
                
                <p>Thank you for your patience and understanding.</p>
                
                <p>Best regards,<br>
                Indian Wonderer Tours Team</p>
            ";
            
            $this->emailService->sendEmail(
                $refund['email'],
                $subject,
                $message
            );
            
        } catch (Exception $e) {
            error_log("Send Refund Email Error: " . $e->getMessage());
            // Don't throw - email failure shouldn't block refund processing
        }
    }
    
    /**
     * Send gift card reminder email
     */
    private function sendGiftCardReminderEmail($giftCard) {
        // Check if email service is available
        if (!$this->emailService) {
            error_log("EmailService not available - skipping gift card email");
            return;
        }
        
        try {
            $subject = "Your Gift Card is Ready to Use - " . $giftCard['code'];
            
            $expiryDate = date('F j, Y', strtotime($giftCard['expires_at']));
            
            $message = "
                <h2>🎁 Your Gift Card is Active!</h2>
                <p>Dear {$giftCard['first_name']} {$giftCard['last_name']},</p>
                <p>Great news! Your gift card is now active and ready to use for your next adventure.</p>
                
                <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center; color: white;'>
                    <h3 style='margin-top: 0; color: white;'>Your Gift Card</h3>
                    <div style='background: white; color: #333; padding: 15px; border-radius: 8px; border: 2px dashed #667eea; display: inline-block; margin: 10px 0;'>
                        <p style='font-size: 24px; font-weight: bold; margin: 5px 0; letter-spacing: 2px;'>{$giftCard['code']}</p>
                    </div>
                    <p style='font-size: 28px; font-weight: bold; margin: 10px 0;'>₹" . number_format($giftCard['amount'], 2) . "</p>
                    <p style='margin: 5px 0;'>Current Balance: ₹" . number_format($giftCard['balance'], 2) . "</p>
                </div>
                
                <div style='background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;'>
                    <p><strong>📅 Valid Until:</strong> {$expiryDate}</p>
                    <p style='margin: 0;'><strong>💡 Bonus:</strong> This gift card includes a 10% bonus on your original booking amount!</p>
                </div>
                
                <h3>How to Use Your Gift Card</h3>
                <ol style='text-align: left;'>
                    <li>Browse our tours at Indian Wonderer</li>
                    <li>Select your preferred tour and proceed to booking</li>
                    <li>During checkout, enter your gift card code: <strong>{$giftCard['code']}</strong></li>
                    <li>The amount will be automatically deducted from your booking total</li>
                </ol>
                
                <div style='background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                    <p><strong>📌 Important Notes:</strong></p>
                    <ul style='margin: 10px 0;'>
                        <li>Gift card can be used for any tour booking</li>
                        <li>Can be used partially - remaining balance saved for next booking</li>
                        <li>Non-transferable and cannot be redeemed for cash</li>
                        <li>Must be used before expiry date</li>
                    </ul>
                </div>
                
                <p>Start planning your next adventure today!</p>
                
                <p>Best regards,<br>
                Indian Wonderer Tours Team</p>
            ";
            
            $this->emailService->sendEmail(
                $giftCard['email'],
                $subject,
                $message
            );
            
        } catch (Exception $e) {
            error_log("Send Gift Card Email Error: " . $e->getMessage());
            // Don't throw - email failure shouldn't block processing
        }
    }
    
    /**
     * Send success response
     */
    private function sendSuccess($data) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
        exit;
    }
    
    /**
     * Send error response
     */
    private function sendError($message, $code = 400) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'error' => $message
        ]);
        exit;
    }
}

// Initialize and handle request
$api = new AdminRefundAPI();
$api->handleRequest();
