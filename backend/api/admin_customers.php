<?php
// Admin Customers API - Get customer statistics and data
// This endpoint provides comprehensive customer data for the admin panel

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

class AdminCustomerAPI {
    private $pdo;
    
    public function __construct() {
        $database = new Database();
        $this->pdo = $database->getConnection();
    }
    
    /**
     * Get all customers with statistics
     */
    public function getCustomers() {
        try {
            // Get all customers with their booking and spending statistics
            $query = "SELECT 
                        u.id,
                        u.username as name,
                        u.email,
                        u.phone,
                        u.profile_image as avatar,
                        u.is_active as status,
                        u.role,
                        u.created_at as joinDate,
                        COUNT(DISTINCT b.id) as totalBookings,
                        COALESCE(SUM(CASE WHEN p.status = 'paid' OR p.status = 'completed' THEN p.amount ELSE 0 END), 0) as totalSpent,
                        MAX(b.created_at) as lastBookingDate,
                        CASE 
                            WHEN COUNT(DISTINCT b.id) >= 5 THEN 'premium'
                            ELSE 'regular'
                        END as type
                    FROM users u
                    LEFT JOIN bookings b ON u.id = b.user_id
                    LEFT JOIN payments p ON b.id = p.booking_id
                    WHERE u.role = 'customer'
                    GROUP BY u.id
                    ORDER BY u.created_at DESC";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format the data for frontend
            $formattedCustomers = [];
            foreach ($customers as $customer) {
                $formattedCustomers[] = [
                    'id' => (int)$customer['id'],
                    'name' => $customer['name'],
                    'email' => $customer['email'],
                    'phone' => $customer['phone'] ?? 'N/A',
                    'avatar' => $customer['avatar'],
                    'status' => $customer['status'] ? 'active' : 'inactive',
                    'type' => $customer['type'],
                    'joinDate' => $customer['joinDate'],
                    'totalBookings' => (int)$customer['totalBookings'],
                    'totalSpent' => (float)$customer['totalSpent'],
                    'lastBookingDate' => $customer['lastBookingDate']
                ];
            }
            
            // Calculate statistics
            $totalCustomers = count($formattedCustomers);
            $activeCustomers = count(array_filter($formattedCustomers, function($c) {
                return $c['status'] === 'active';
            }));
            $premiumCustomers = count(array_filter($formattedCustomers, function($c) {
                return $c['type'] === 'premium';
            }));
            
            // Get customers joined this month
            $currentMonth = date('Y-m');
            $newThisMonth = count(array_filter($formattedCustomers, function($c) use ($currentMonth) {
                return strpos($c['joinDate'], $currentMonth) === 0;
            }));
            
            return [
                'success' => true,
                'data' => [
                    'customers' => $formattedCustomers,
                    'stats' => [
                        'total' => $totalCustomers,
                        'active' => $activeCustomers,
                        'premium' => $premiumCustomers,
                        'newThisMonth' => $newThisMonth
                    ]
                ],
                'generated_at' => date('Y-m-d H:i:s')
            ];
            
        } catch (PDOException $e) {
            return [
                'success' => false,
                'error' => 'Database error: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Get single customer details
     */
    public function getCustomer($customerId) {
        try {
            $query = "SELECT 
                        u.id,
                        u.username as name,
                        u.email,
                        u.phone,
                        u.profile_image as avatar,
                        u.is_active as status,
                        u.created_at as joinDate,
                        COUNT(DISTINCT b.id) as totalBookings,
                        COALESCE(SUM(CASE WHEN p.status = 'paid' OR p.status = 'completed' THEN p.amount ELSE 0 END), 0) as totalSpent
                    FROM users u
                    LEFT JOIN bookings b ON u.id = b.user_id
                    LEFT JOIN payments p ON b.id = p.booking_id
                    WHERE u.id = ? AND u.role = 'customer'
                    GROUP BY u.id";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$customerId]);
            $customer = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$customer) {
                return [
                    'success' => false,
                    'error' => 'Customer not found'
                ];
            }
            
            // Get customer's recent bookings
            $bookingsQuery = "SELECT 
                                b.id,
                                b.booking_reference,
                                b.status,
                                b.total_amount,
                                b.travel_date,
                                b.created_at,
                                t.title as tour_name,
                                t.destination,
                                p.status as payment_status
                            FROM bookings b
                            LEFT JOIN tours t ON b.tour_id = t.id
                            LEFT JOIN payments p ON b.id = p.booking_id
                            WHERE b.user_id = ?
                            ORDER BY b.created_at DESC
                            LIMIT 10";
            
            $bookingsStmt = $this->pdo->prepare($bookingsQuery);
            $bookingsStmt->execute([$customerId]);
            $bookings = $bookingsStmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'data' => [
                    'customer' => [
                        'id' => (int)$customer['id'],
                        'name' => $customer['name'],
                        'email' => $customer['email'],
                        'phone' => $customer['phone'] ?? 'N/A',
                        'avatar' => $customer['avatar'],
                        'status' => $customer['status'] ? 'active' : 'inactive',
                        'joinDate' => $customer['joinDate'],
                        'totalBookings' => (int)$customer['totalBookings'],
                        'totalSpent' => (float)$customer['totalSpent']
                    ],
                    'bookings' => $bookings
                ]
            ];
            
        } catch (PDOException $e) {
            return [
                'success' => false,
                'error' => 'Database error: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Update customer status (activate/deactivate)
     */
    public function updateCustomerStatus($customerId, $status) {
        try {
            $isActive = $status === 'active' ? 1 : 0;
            
            $query = "UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ? AND role = 'customer'";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$isActive, $customerId]);
            
            return [
                'success' => true,
                'message' => 'Customer status updated successfully'
            ];
            
        } catch (PDOException $e) {
            return [
                'success' => false,
                'error' => 'Database error: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Create new customer
     */
    public function createCustomer($data) {
        try {
            // Validate required fields
            if (empty($data['name']) || empty($data['email']) || empty($data['phone'])) {
                return [
                    'success' => false,
                    'error' => 'Name, email, and phone number are required'
                ];
            }
            
            // Check if email already exists
            $checkQuery = "SELECT id FROM users WHERE email = ?";
            $checkStmt = $this->pdo->prepare($checkQuery);
            $checkStmt->execute([$data['email']]);
            
            if ($checkStmt->rowCount() > 0) {
                return [
                    'success' => false,
                    'error' => 'Email already exists'
                ];
            }
            
            // Generate default password if not provided
            $password = !empty($data['password']) ? $data['password'] : 'Welcome@123';
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            
            // Insert new customer
            $query = "INSERT INTO users (username, email, password, phone, role, is_active, created_at, updated_at) 
                      VALUES (?, ?, ?, ?, 'customer', 1, NOW(), NOW())";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data['name'],
                $data['email'],
                $hashedPassword,
                $data['phone']
            ]);
            
            $newCustomerId = $this->pdo->lastInsertId();
            
            return [
                'success' => true,
                'message' => 'Customer created successfully',
                'data' => [
                    'id' => (int)$newCustomerId,
                    'defaultPassword' => $password // Return so admin can tell customer
                ]
            ];
            
        } catch (PDOException $e) {
            return [
                'success' => false,
                'error' => 'Database error: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Delete customer and all related records
     */
    public function deleteCustomer($customerId) {
        try {
            if (!$customerId) {
                return [
                    'success' => false,
                    'error' => 'Customer ID is required'
                ];
            }
            
            // Start transaction to ensure all-or-nothing deletion
            $this->pdo->beginTransaction();
            
            try {
                // Get all bookings for this customer
                $bookingQuery = "SELECT id FROM bookings WHERE user_id = ?";
                $bookingStmt = $this->pdo->prepare($bookingQuery);
                $bookingStmt->execute([$customerId]);
                $bookings = $bookingStmt->fetchAll(PDO::FETCH_COLUMN);
                
                // Delete related records for each booking
                if (!empty($bookings)) {
                    $bookingIds = implode(',', array_map('intval', $bookings));
                    
                    // Delete tour guide assignments
                    $this->pdo->exec("DELETE FROM tour_guide_assignments WHERE booking_id IN ($bookingIds)");
                    
                    // Delete payments
                    $this->pdo->exec("DELETE FROM payments WHERE booking_id IN ($bookingIds)");
                }
                
                // Delete bookings
                $stmt = $this->pdo->prepare("DELETE FROM bookings WHERE user_id = ?");
                $stmt->execute([$customerId]);
                
                // Delete activity logs
                $stmt = $this->pdo->prepare("DELETE FROM activity_logs WHERE user_id = ?");
                $stmt->execute([$customerId]);
                
                // Delete any reviews or ratings (if tables exist)
                try {
                    $stmt = $this->pdo->prepare("DELETE FROM reviews WHERE user_id = ?");
                    $stmt->execute([$customerId]);
                } catch (PDOException $e) {
                    // Table might not exist, continue
                }
                
                // Delete any notifications (if table exists)
                try {
                    $stmt = $this->pdo->prepare("DELETE FROM notifications WHERE user_id = ?");
                    $stmt->execute([$customerId]);
                } catch (PDOException $e) {
                    // Table might not exist, continue
                }
                
                // Finally, delete the customer/user
                $stmt = $this->pdo->prepare("DELETE FROM users WHERE id = ? AND role = 'customer'");
                $stmt->execute([$customerId]);
                
                // Check if customer was actually deleted
                if ($stmt->rowCount() === 0) {
                    $this->pdo->rollBack();
                    return [
                        'success' => false,
                        'error' => 'Customer not found or not a customer role'
                    ];
                }
                
                // Commit transaction
                $this->pdo->commit();
                
                return [
                    'success' => true,
                    'message' => 'Customer and all related records deleted successfully'
                ];
                
            } catch (PDOException $e) {
                // Rollback on error
                $this->pdo->rollBack();
                throw $e;
            }
            
        } catch (PDOException $e) {
            return [
                'success' => false,
                'error' => 'Database error: ' . $e->getMessage()
            ];
        }
    }
}

// Handle the request
$api = new AdminCustomerAPI();
$method = $_SERVER['REQUEST_METHOD'];

// Get customer ID from query string if present
$customerId = isset($_GET['id']) ? (int)$_GET['id'] : null;

try {
    switch ($method) {
        case 'GET':
            if ($customerId) {
                $response = $api->getCustomer($customerId);
            } else {
                $response = $api->getCustomers();
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            $response = $api->createCustomer($input);
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            if (isset($input['status'])) {
                $response = $api->updateCustomerStatus($customerId, $input['status']);
            } else {
                $response = ['success' => false, 'error' => 'Invalid request'];
            }
            break;
            
        case 'DELETE':
            $response = $api->deleteCustomer($customerId);
            break;
            
        default:
            http_response_code(405);
            $response = ['success' => false, 'error' => 'Method not allowed'];
            break;
    }
    
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
