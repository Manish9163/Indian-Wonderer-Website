<?php
// Simple Admin Guides API
// Handle CORS properly for credentials
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4200', 'http://127.0.0.1:4200'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:4200';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: http://localhost:4200');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$pdo = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$guideId = isset($_GET['id']) ? (int)$_GET['id'] : null;

try {
    switch ($method) {
        case 'GET':
            if ($guideId) {
                // Get single guide
                $stmt = $pdo->prepare("SELECT g.*, 
                    CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as name,
                    u.email,
                    u.phone,
                    u.profile_image as photo,
                    COUNT(DISTINCT tga.booking_id) as tours_completed,
                    COALESCE(SUM(b.total_amount), 0) as total_earnings
                    FROM guides g
                    LEFT JOIN users u ON g.user_id = u.id
                    LEFT JOIN tour_guide_assignments tga ON g.id = tga.guide_id
                    LEFT JOIN bookings b ON tga.booking_id = b.id AND b.status = 'completed'
                    WHERE g.id = ?
                    GROUP BY g.id");
                $stmt->execute([$guideId]);
                $guide = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($guide) {
                    // Process guide data
                    $guide['name'] = trim($guide['name']);
                    if (empty($guide['name'])) {
                        $guide['name'] = $guide['email'] ?? 'Unknown Guide';
                    }
                    $guide['tours_completed'] = (int)$guide['tours_completed'];
                    $guide['total_earnings'] = (float)$guide['total_earnings'];
                    $guide['total_tours'] = (int)($guide['total_tours'] ?? 0);
                    $guide['experience_years'] = (int)($guide['experience_years'] ?? 0);
                    $guide['rating'] = (float)($guide['rating'] ?? 0);
                    
                    // Add computed fields
                    $guide['trips'] = $guide['tours_completed'];
                    
                    // Add default photo if missing
                    if (empty($guide['photo'])) {
                        $guide['photo'] = 'https://i.pravatar.cc/150?img=' . $guide['id'];
                    }
                    
                    // Keep languages as JSON string for frontend processing
                    // Frontend will parse it in viewGuideDetails()
                    
                    echo json_encode(['success' => true, 'data' => $guide]);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Guide not found']);
                }
            } else {
                // Get all guides with optional filtering
                $applicationStatus = $_GET['application_status'] ?? null;
                
                $query = "SELECT g.*, 
                    CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as name,
                    u.email,
                    u.phone,
                    u.profile_image as photo,
                    COUNT(DISTINCT tga.booking_id) as tours_completed,
                    COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_amount ELSE 0 END), 0) as total_earnings,
                    COUNT(DISTINCT CASE WHEN b.status IN ('pending', 'confirmed') THEN tga.booking_id END) as active_bookings
                    FROM guides g
                    LEFT JOIN users u ON g.user_id = u.id
                    LEFT JOIN tour_guide_assignments tga ON g.id = tga.guide_id
                    LEFT JOIN bookings b ON tga.booking_id = b.id";
                
                // Add WHERE clause for filtering by application_status
                if ($applicationStatus && in_array($applicationStatus, ['pending', 'approved', 'rejected'])) {
                    $query .= " WHERE g.application_status = ?";
                }
                
                $query .= " GROUP BY g.id ORDER BY g.created_at DESC";
                
                if ($applicationStatus && in_array($applicationStatus, ['pending', 'approved', 'rejected'])) {
                    $stmt = $pdo->prepare($query);
                    $stmt->execute([$applicationStatus]);
                } else {
                    $stmt = $pdo->query($query);
                }
                
                $guides = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Process each guide
                foreach ($guides as &$guide) {
                    // Clean up name
                    $guide['name'] = trim($guide['name']);
                    if (empty($guide['name'])) {
                        $guide['name'] = $guide['email'] ?? 'Unknown Guide';
                    }
                    
                    // Convert to proper types
                    $guide['tours_completed'] = (int)$guide['tours_completed'];
                    $guide['total_earnings'] = (float)$guide['total_earnings'];
                    $guide['active_bookings'] = (int)$guide['active_bookings'];
                    $guide['experience_years'] = (int)($guide['experience_years'] ?? 0);
                    $guide['rating'] = (float)($guide['rating'] ?? 0);
                    $guide['total_tours'] = (int)($guide['total_tours'] ?? 0);
                    
                    // Add computed fields
                    $guide['trips'] = $guide['tours_completed'];
                    $guide['traveler'] = $guide['active_bookings'];
                    
                    // Determine availability status
                    if ($guide['status'] === 'busy' || $guide['active_bookings'] > 0) {
                        $guide['availability'] = 'Busy';
                    } elseif ($guide['status'] === 'available') {
                        $guide['availability'] = 'Available';
                    } else {
                        $guide['availability'] = 'Inactive';
                    }
                    
                    // Add default photo if missing
                    if (empty($guide['photo'])) {
                        $guide['photo'] = 'https://i.pravatar.cc/150?img=' . $guide['id'];
                    }
                    
                    // Parse languages if JSON
                    if (!empty($guide['languages'])) {
                        $decoded = json_decode($guide['languages'], true);
                        if (is_array($decoded)) {
                            $guide['languages'] = implode(', ', $decoded);
                        }
                    }
                }
                unset($guide);
                
                // Calculate stats
                $statsStmt = $pdo->query("SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
                    COUNT(CASE WHEN status = 'busy' THEN 1 END) as busy,
                    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
                    COUNT(CASE WHEN application_status = 'approved' THEN 1 END) as approved,
                    COUNT(CASE WHEN application_status = 'pending' THEN 1 END) as pending,
                    AVG(rating) as avg_rating
                    FROM guides");
                $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);
                
                // Calculate total earnings across all guides from guide_earnings table
                $earningsStmt = $pdo->query("SELECT 
                    COALESCE(SUM(amount), 0) as total_earnings
                    FROM guide_earnings
                    WHERE status IN ('earned', 'paid')");
                $earnings = $earningsStmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'guides' => $guides,
                        'stats' => [
                            'totalGuides' => (int)$stats['total'],
                            'availableGuides' => (int)$stats['available'],
                            'busyGuides' => (int)$stats['busy'],
                            'inactiveGuides' => (int)$stats['inactive'],
                            'approvedGuides' => (int)$stats['approved'],
                            'pendingGuides' => (int)$stats['pending'],
                            'averageRating' => round((float)$stats['avg_rating'], 2),
                            'totalEarnings' => (float)$earnings['total_earnings']
                        ]
                    ],
                    'generated_at' => date('Y-m-d H:i:s')
                ]);
            }
            break;
            
        case 'POST':
            // Create new guide
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['user_id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'user_id is required']);
                break;
            }
            
            $stmt = $pdo->prepare("INSERT INTO guides 
                (user_id, specialization, experience_years, languages, certification, bio, hourly_rate, status, application_status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
            $stmt->execute([
                $input['user_id'],
                $input['specialization'] ?? null,
                $input['experience_years'] ?? 0,
                json_encode($input['languages'] ?? []),
                $input['certification'] ?? null,
                $input['bio'] ?? null,
                $input['hourly_rate'] ?? null,
                $input['status'] ?? 'available',
                $input['application_status'] ?? 'pending'
            ]);
            
            $newId = $pdo->lastInsertId();
            echo json_encode(['success' => true, 'message' => 'Guide created', 'id' => $newId]);
            break;
            
        case 'PUT':
            // Update guide
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$guideId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Guide ID is required']);
                break;
            }
            
            $updates = [];
            $params = [];
            
            if (isset($input['specialization'])) {
                $updates[] = "specialization = ?";
                $params[] = $input['specialization'];
            }
            if (isset($input['experience_years'])) {
                $updates[] = "experience_years = ?";
                $params[] = $input['experience_years'];
            }
            if (isset($input['languages'])) {
                $updates[] = "languages = ?";
                $params[] = is_array($input['languages']) ? json_encode($input['languages']) : $input['languages'];
            }
            if (isset($input['certification'])) {
                $updates[] = "certification = ?";
                $params[] = $input['certification'];
            }
            if (isset($input['bio'])) {
                $updates[] = "bio = ?";
                $params[] = $input['bio'];
            }
            if (isset($input['rating'])) {
                $updates[] = "rating = ?";
                $params[] = $input['rating'];
            }
            if (isset($input['hourly_rate'])) {
                $updates[] = "hourly_rate = ?";
                $params[] = $input['hourly_rate'];
            }
            if (isset($input['status'])) {
                $updates[] = "status = ?";
                $params[] = $input['status'];
            }
            if (isset($input['application_status'])) {
                $updates[] = "application_status = ?";
                $params[] = $input['application_status'];
                
                // Send notification email when application status changes
                if (in_array($input['application_status'], ['approved', 'rejected'])) {
                    sendApplicationStatusEmail($pdo, $guideId, $input['application_status']);
                    
                    // If approved, update user role to 'guide' and activate account
                    if ($input['application_status'] === 'approved') {
                        $guideInfoStmt = $pdo->prepare("SELECT user_id FROM guides WHERE id = ?");
                        $guideInfoStmt->execute([$guideId]);
                        $guideInfo = $guideInfoStmt->fetch(PDO::FETCH_ASSOC);
                        
                        if ($guideInfo) {
                            $updateUserStmt = $pdo->prepare("UPDATE users SET role = 'guide', is_active = 1 WHERE id = ?");
                            $updateUserStmt->execute([$guideInfo['user_id']]);
                        }
                    }
                }
            }
            
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'No fields to update']);
                break;
            }
            
            $params[] = $guideId;
            $sql = "UPDATE guides SET " . implode(', ', $updates) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            echo json_encode(['success' => true, 'message' => 'Guide updated successfully']);
            break;
            
        case 'DELETE':
            if (!$guideId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Guide ID is required']);
                break;
            }
            
            // Check if guide has active bookings
            $checkStmt = $pdo->prepare("SELECT COUNT(*) as count FROM tour_guide_assignments tga
                JOIN bookings b ON tga.booking_id = b.id
                WHERE tga.guide_id = ? AND b.status IN ('pending', 'confirmed')");
            $checkStmt->execute([$guideId]);
            $activeBookings = $checkStmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            if ($activeBookings > 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'error' => "Cannot delete guide with {$activeBookings} active bookings. Please set status to inactive instead."
                ]);
                break;
            }
            
            $stmt = $pdo->prepare("DELETE FROM guides WHERE id = ?");
            $stmt->execute([$guideId]);
            echo json_encode(['success' => true, 'message' => 'Guide deleted']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}

/**
 * Send application status notification email to guide
 */
function sendApplicationStatusEmail($pdo, $guideId, $status) {
    try {
        // Get guide and user information
        $stmt = $pdo->prepare("SELECT g.*, u.email, u.first_name, u.last_name 
            FROM guides g 
            JOIN users u ON g.user_id = u.id 
            WHERE g.id = ?");
        $stmt->execute([$guideId]);
        $guide = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$guide) {
            return false;
        }
        
        $email = $guide['email'];
        $name = trim($guide['first_name'] . ' ' . $guide['last_name']);
        
        if ($status === 'approved') {
            sendApprovalEmail($email, $name);
        } else {
            sendRejectionEmail($email, $name);
        }
        
        // Log notification
        $logStmt = $pdo->prepare("INSERT INTO activity_logs 
            (user_id, action, table_name, record_id) 
            VALUES (?, ?, ?, ?)");
        $logStmt->execute([
            $guide['user_id'],
            "Guide application $status notification sent to $email",
            'guides',
            $guideId
        ]);
        
        return true;
    } catch (Exception $e) {
        error_log("Error sending status email: " . $e->getMessage());
        return false;
    }
}

/**
 * Send approval email
 */
function sendApprovalEmail($email, $name) {
    $subject = "🎉 Your Guide Application is APPROVED! - Indian Wonderer";
    
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-badge { display: inline-block; padding: 12px 24px; background: #10b981; color: white; border-radius: 25px; font-weight: bold; font-size: 16px; }
            .info-box { background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            ul.checklist { list-style: none; padding: 0; }
            ul.checklist li { padding: 8px 0; }
            ul.checklist li:before { content: '✅ '; margin-right: 10px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>🎉 Congratulations!</h1>
                <h2>You're Now an Official Guide!</h2>
            </div>
            <div class='content'>
                <p>Dear <strong>$name</strong>,</p>
                
                <p style='text-align: center; margin: 30px 0;'>
                    <span class='success-badge'>✅ APPLICATION APPROVED</span>
                </p>
                
                <p style='font-size: 18px;'>We are thrilled to inform you that your application to become a tour guide with <strong>Indian Wonderer</strong> has been <strong style='color: #10b981;'>APPROVED</strong>! 🎊</p>
                
                <div class='info-box'>
                    <h3 style='margin-top: 0;'>🚀 Your Account Has Been Activated!</h3>
                    <p>Your account has been upgraded to <strong>Guide Status</strong>. You can now log in and start accepting tour bookings!</p>
                </div>
                
                <h3>📋 Next Steps:</h3>
                <ul class='checklist'>
                    <li><strong>Log in to your account</strong> using your registered email</li>
                    <li><strong>Complete your profile</strong> with photos and detailed bio</li>
                    <li><strong>Set your availability</strong> and hourly rates</li>
                    <li><strong>Browse available tours</strong> and start accepting bookings</li>
                    <li><strong>Review our guide guidelines</strong> and best practices</li>
                </ul>
                
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='http://localhost:3000' class='button'>Login to Your Account</a>
                </div>
                
                <h3>💼 What You Can Do Now:</h3>
                <ul>
                    <li>✨ Accept tour booking requests from customers</li>
                    <li>🗓️ Manage your schedule and availability</li>
                    <li>💰 Set your hourly rates and earn from tours</li>
                    <li>⭐ Build your reputation with customer reviews</li>
                    <li>📊 Track your earnings and performance</li>
                </ul>
                
                <div class='info-box'>
                    <p style='margin: 0;'><strong>📞 Need Help?</strong><br>
                    Contact our support team at <a href='mailto:support@indianwonderer.com'>support@indianwonderer.com</a><br>
                    We're here to help you succeed!</p>
                </div>
                
                <p style='margin-top: 30px;'>Welcome to the Indian Wonderer family! We look forward to working with you and creating memorable experiences for our travelers.</p>
                
                <p>Best regards,<br><strong>Indian Wonderer Team</strong></p>
            </div>
            <div class='footer'>
                <p>&copy; " . date('Y') . " Indian Wonderer. All rights reserved.</p>
                <p>This is an automated email. Please do not reply directly to this message.</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: Indian Wonderer <noreply@indianwonderer.com>" . "\r\n";
    
    error_log("APPROVAL Email would be sent to: $email");
    return true;
}

/**
 * Send rejection email
 */
function sendRejectionEmail($email, $name) {
    $subject = "Update on Your Guide Application - Indian Wonderer";
    
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-badge { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; border-radius: 25px; font-weight: bold; }
            .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>Guide Application Update</h1>
            </div>
            <div class='content'>
                <p>Dear <strong>$name</strong>,</p>
                
                <p>Thank you for your interest in becoming a tour guide with <strong>Indian Wonderer</strong>.</p>
                
                <p style='text-align: center; margin: 30px 0;'>
                    <span class='info-badge'>Application Status Update</span>
                </p>
                
                <p>After careful review of your application, we regret to inform you that we are unable to approve your guide application at this time.</p>
                
                <div class='info-box'>
                    <h3 style='margin-top: 0;'>📋 Common Reasons:</h3>
                    <ul>
                        <li>Insufficient experience in the tourism industry</li>
                        <li>Missing required certifications or qualifications</li>
                        <li>Current capacity of guides in your specialization area</li>
                        <li>Incomplete application information</li>
                    </ul>
                </div>
                
                <h3>🔄 Reapplication:</h3>
                <p>We encourage you to reapply in the future if you:</p>
                <ul>
                    <li>Gain additional experience in tour guiding</li>
                    <li>Obtain relevant certifications (First Aid, Tourism Board licenses, etc.)</li>
                    <li>Develop specialized knowledge in specific destinations</li>
                    <li>Improve your language skills</li>
                </ul>
                
                <p>You are welcome to reapply after <strong>3 months</strong> from today's date.</p>
                
                <h3>💡 Alternative Options:</h3>
                <p>In the meantime, you can still enjoy Indian Wonderer as a customer:</p>
                <ul>
                    <li>✈️ Book amazing tours across India</li>
                    <li>🗺️ Create custom itineraries</li>
                    <li>⭐ Leave reviews and share your experiences</li>
                </ul>
                
                <p style='margin-top: 30px;'>We appreciate your interest in joining our team and wish you the best in your future endeavors.</p>
                
                <p>If you have any questions, please contact us at <a href='mailto:support@indianwonderer.com'>support@indianwonderer.com</a></p>
                
                <p>Best regards,<br><strong>Indian Wonderer Team</strong></p>
            </div>
            <div class='footer'>
                <p>&copy; " . date('Y') . " Indian Wonderer. All rights reserved.</p>
                <p>This is an automated email. Please do not reply directly to this message.</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: Indian Wonderer <noreply@indianwonderer.com>" . "\r\n";
    
    error_log("REJECTION Email would be sent to: $email");
    return true;
}
?>
