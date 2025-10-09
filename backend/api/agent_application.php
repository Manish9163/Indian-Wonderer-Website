<?php
// Agent/Guide Application API
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$pdo = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'POST') {
        // Get form data
        $name = $_POST['name'] ?? '';
        $email = $_POST['email'] ?? '';
        $phone = $_POST['phone'] ?? '';
        $address = $_POST['address'] ?? '';
        $experience_years = $_POST['experience_years'] ?? 0;
        $specialization = $_POST['specialization'] ?? '';
        $languages_spoken = $_POST['languages_spoken'] ?? '';
        $certification = $_POST['certification'] ?? '';
        $additional_notes = $_POST['additional_notes'] ?? '';
        
        // Validate required fields
        if (empty($name) || empty($email) || empty($phone)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Name, email, and phone are required fields'
            ]);
            exit();
        }
        
        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid email format'
            ]);
            exit();
        }
        
        // Check if email already exists in users table
        $checkEmailStmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $checkEmailStmt->execute([$email]);
        $existingUser = $checkEmailStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingUser) {
            // Check if user already has a guide application
            $checkGuideStmt = $pdo->prepare("SELECT id, application_status FROM guides WHERE user_id = ?");
            $checkGuideStmt->execute([$existingUser['id']]);
            $existingGuide = $checkGuideStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existingGuide) {
                $status = $existingGuide['application_status'];
                if ($status === 'pending') {
                    echo json_encode([
                        'success' => false,
                        'message' => 'You already have a pending application. Please wait for admin review.'
                    ]);
                    exit();
                } elseif ($status === 'approved') {
                    echo json_encode([
                        'success' => false,
                        'message' => 'You are already an approved guide.'
                    ]);
                    exit();
                }
            }
        }
        
        // Start transaction
        $pdo->beginTransaction();
        
        try {
            $userId = null;
            
            if ($existingUser) {
                // Use existing user
                $userId = $existingUser['id'];
            } else {
                // Create new user account for the applicant
                $username = strtolower(str_replace(' ', '_', $name)) . '_' . substr(uniqid(), -4);
                $defaultPassword = password_hash('Welcome@123', PASSWORD_BCRYPT);
                
                // Split name into first and last name
                $nameParts = explode(' ', trim($name), 2);
                $firstName = $nameParts[0];
                $lastName = $nameParts[1] ?? '';
                
                $createUserStmt = $pdo->prepare("INSERT INTO users 
                    (username, email, password, first_name, last_name, phone, role, is_active, email_verified) 
                    VALUES (?, ?, ?, ?, ?, ?, 'customer', 0, 0)");
                
                $createUserStmt->execute([
                    $username,
                    $email,
                    $defaultPassword,
                    $firstName,
                    $lastName,
                    $phone
                ]);
                
                $userId = $pdo->lastInsertId();
            }
            
            // Parse languages (comma-separated to JSON array)
            $languagesArray = array_map('trim', explode(',', $languages_spoken));
            $languagesJson = json_encode($languagesArray);
            
            // Create guide application
            $createGuideStmt = $pdo->prepare("INSERT INTO guides 
                (user_id, specialization, experience_years, languages, certification, bio, 
                status, application_status, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, 'inactive', 'pending', NOW())");
            
            $bio = "Address: $address\nAdditional Notes: $additional_notes";
            
            $createGuideStmt->execute([
                $userId,
                $specialization,
                (int)$experience_years,
                $languagesJson,
                $certification,
                $bio
            ]);
            
            $guideId = $pdo->lastInsertId();
            
            // Send notification to admin (store in activity log)
            $notificationStmt = $pdo->prepare("INSERT INTO activity_logs 
                (user_id, action, table_name, record_id) 
                VALUES (?, ?, ?, ?)");
            
            $notificationStmt->execute([
                $userId,
                "New guide application from $name ($email). Specialization: $specialization, Experience: $experience_years years",
                'guides',
                $guideId
            ]);
            
            // Commit transaction
            $pdo->commit();
            
            // Send confirmation email to applicant
            $confirmationSent = sendApplicationConfirmationEmail($email, $name);
            
            echo json_encode([
                'success' => true,
                'message' => 'Your application has been submitted successfully! Our admin team will review it shortly and send you an email notification.',
                'data' => [
                    'guide_id' => $guideId,
                    'user_id' => $userId,
                    'application_status' => 'pending',
                    'email_sent' => $confirmationSent
                ]
            ]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        
    } else {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed'
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Application submission failed: ' . $e->getMessage()
    ]);
}

/**
 * Send application confirmation email to applicant
 */
function sendApplicationConfirmationEmail($email, $name) {
    $subject = "Guide Application Received - Indian Wonderer";
    
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .status-badge { display: inline-block; padding: 8px 16px; background: #fbbf24; color: #78350f; border-radius: 20px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>🎉 Application Received!</h1>
            </div>
            <div class='content'>
                <p>Dear <strong>$name</strong>,</p>
                
                <p>Thank you for applying to become a tour guide with <strong>Indian Wonderer</strong>!</p>
                
                <p>We have successfully received your application and it is currently being reviewed by our admin team.</p>
                
                <p style='text-align: center;'>
                    <span class='status-badge'>⏳ Application Status: PENDING REVIEW</span>
                </p>
                
                <h3>📋 What Happens Next?</h3>
                <ul>
                    <li><strong>Review Process:</strong> Our team will carefully review your application and qualifications</li>
                    <li><strong>Verification:</strong> We may contact you for additional information or documents</li>
                    <li><strong>Decision:</strong> You will receive an email notification within 3-5 business days</li>
                    <li><strong>Next Steps:</strong> If approved, we'll send you onboarding instructions</li>
                </ul>
                
                <h3>✉️ Stay Connected</h3>
                <p>We will notify you via email once your application has been reviewed. Please check your email regularly.</p>
                
                <p>If you have any questions, feel free to contact us at <a href='mailto:support@indianwonderer.com'>support@indianwonderer.com</a></p>
                
                <p style='margin-top: 30px;'>Best regards,<br><strong>Indian Wonderer Team</strong></p>
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
    
    // In production, use proper email service (PHPMailer, SendGrid, etc.)
    // For now, we'll just log it
    error_log("Email would be sent to: $email\nSubject: $subject");
    
    return true; // Return true for now (in production, return actual mail() result)
}
