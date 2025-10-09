<?php
/**
 * Authentication Controller
 * Handles user login, registration, and authentication
 */

session_start();

// Handle CORS for React frontend and Angular admin panel
$allowed_origins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'http://localhost:4201',
    'http://127.0.0.1:4201'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: http://localhost:3000');
}

header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/api_config.php';
require_once '../models/User.php';

class AuthController {
    private $db;
    private $user;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->user = new User($this->db);
    }
    
    /**
     * User registration
     */
    public function register() {
        $data = getJsonInput();
        
        // Validation
        $errors = [];
        
        if (empty($data['username'])) {
            $errors[] = "Username is required";
        }
        
        if (empty($data['email'])) {
            $errors[] = "Email is required";
        } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = "Invalid email format";
        }
        
        if (empty($data['password'])) {
            $errors[] = "Password is required";
        } elseif (strlen($data['password']) < 6) {
            $errors[] = "Password must be at least 6 characters";
        }
        
        if (empty($data['first_name'])) {
            $errors[] = "First name is required";
        }
        
        if (empty($data['last_name'])) {
            $errors[] = "Last name is required";
        }
        
        if (!empty($errors)) {
            ApiResponse::error("Validation failed", 400, $errors);
        }
        
        // Check if email exists
        if ($this->user->emailExists($data['email'])) {
            ApiResponse::error("Email already exists", 409);
        }
        
        // Check if username exists
        if ($this->user->usernameExists($data['username'])) {
            ApiResponse::error("Username already exists", 409);
        }
        
        // Set user properties
        $this->user->username = $data['username'];
        $this->user->email = $data['email'];
        $this->user->password = $data['password'];
        $this->user->first_name = $data['first_name'];
        $this->user->last_name = $data['last_name'];
        $this->user->phone = $data['phone'] ?? '';
        $this->user->role = $data['role'] ?? 'customer';
        
        // Register user
        if ($this->user->register()) {
            // Log activity
            logActivity($this->user->id, 'User registered', 'users', $this->user->id);
            
            // Generate JWT token
            $payload = [
                'user_id' => $this->user->id,
                'username' => $this->user->username,
                'email' => $this->user->email,
                'role' => $this->user->role,
                'exp' => time() + (24 * 60 * 60) // 24 hours
            ];
            
            $token = JWTHelper::encode($payload);
            
            ApiResponse::success([
                'user' => [
                    'id' => $this->user->id,
                    'username' => $this->user->username,
                    'email' => $this->user->email,
                    'first_name' => $this->user->first_name,
                    'last_name' => $this->user->last_name,
                    'phone' => $this->user->phone,
                    'role' => $this->user->role
                ],
                'token' => $token
            ], "Registration successful", 201);
        } else {
            ApiResponse::serverError("Registration failed");
        }
    }
    
    /**
     * User login
     */
    public function login() {
        $data = getJsonInput();
        
        // Validation
        if (empty($data['email']) || empty($data['password'])) {
            ApiResponse::error("Email and password are required", 400);
        }
        
        // Attempt login
        if ($this->user->login($data['email'], $data['password'])) {
            // Log activity
            logActivity($this->user->id, 'User logged in', 'users', $this->user->id);

            // Set admin session if user is admin
            if ($this->user->role === 'admin') {
                $_SESSION['admin_logged_in'] = true;
                $_SESSION['admin_id'] = $this->user->id;
            }

            // Generate JWT token
            $payload = [
                'user_id' => $this->user->id,
                'username' => $this->user->username,
                'email' => $this->user->email,
                'role' => $this->user->role,
                'exp' => time() + (24 * 60 * 60) // 24 hours
            ];

            $token = JWTHelper::encode($payload);

            ApiResponse::success([
                'user' => [
                    'id' => $this->user->id,
                    'username' => $this->user->username,
                    'email' => $this->user->email,
                    'first_name' => $this->user->first_name,
                    'last_name' => $this->user->last_name,
                    'phone' => $this->user->phone,
                    'role' => $this->user->role
                ],
                'token' => $token
            ], "Login successful");
        } else {
            ApiResponse::error("Invalid email or password", 401);
        }
    }
    
    /**
     * Get current user profile
     */
    public function getProfile() {
        $token = getAuthorizationHeader();
        
        if (!$token) {
            ApiResponse::unauthorized("Token required");
        }
        
        $decoded = JWTHelper::verify($token);
        
        if (!$decoded) {
            ApiResponse::unauthorized("Invalid token");
        }
        
        $user_data = $this->user->getUserById($decoded['user_id']);
        
        if ($user_data) {
            unset($user_data['password']); // Remove password from response
            ApiResponse::success($user_data);
        } else {
            ApiResponse::notFound("User not found");
        }
    }
    
    /**
     * Update user profile
     */
    public function updateProfile() {
        $token = getAuthorizationHeader();
        
        if (!$token) {
            ApiResponse::unauthorized("Token required");
        }
        
        $decoded = JWTHelper::verify($token);
        
        if (!$decoded) {
            ApiResponse::unauthorized("Invalid token");
        }
        
        $data = getJsonInput();
        
        // Set user properties
        $this->user->id = $decoded['user_id'];
        $this->user->first_name = $data['first_name'] ?? '';
        $this->user->last_name = $data['last_name'] ?? '';
        $this->user->phone = $data['phone'] ?? '';
        $this->user->profile_image = $data['profile_image'] ?? '';
        
        if ($this->user->updateProfile()) {
            // Log activity
            logActivity($this->user->id, 'Profile updated', 'users', $this->user->id);
            
            ApiResponse::success(null, "Profile updated successfully");
        } else {
            ApiResponse::serverError("Profile update failed");
        }
    }
    
    /**
     * Change password
     */
    public function changePassword() {
        $token = getAuthorizationHeader();
        
        if (!$token) {
            ApiResponse::unauthorized("Token required");
        }
        
        $decoded = JWTHelper::verify($token);
        
        if (!$decoded) {
            ApiResponse::unauthorized("Invalid token");
        }
        
        $data = getJsonInput();
        
        // Validation
        if (empty($data['current_password']) || empty($data['new_password'])) {
            ApiResponse::error("Current password and new password are required", 400);
        }
        
        if (strlen($data['new_password']) < 6) {
            ApiResponse::error("New password must be at least 6 characters", 400);
        }
        
        $this->user->id = $decoded['user_id'];
        
        if ($this->user->changePassword($data['current_password'], $data['new_password'])) {
            // Log activity
            logActivity($this->user->id, 'Password changed', 'users', $this->user->id);
            
            ApiResponse::success(null, "Password changed successfully");
        } else {
            ApiResponse::error("Current password is incorrect", 400);
        }
    }
    
    /**
     * Verify token
     */
    public function verifyToken() {
        $token = getAuthorizationHeader();
        
        if (!$token) {
            ApiResponse::unauthorized("Token required");
        }
        
        $decoded = JWTHelper::verify($token);
        
        if ($decoded) {
            ApiResponse::success([
                'valid' => true,
                'user_id' => $decoded['user_id'],
                'role' => $decoded['role']
            ]);
        } else {
            ApiResponse::unauthorized("Invalid token");
        }
    }
}

// Route handling
$auth = new AuthController();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'POST':
        switch ($action) {
            case 'register':
                $auth->register();
                break;
            case 'login':
                $auth->login();
                break;
            case 'change-password':
                $auth->changePassword();
                break;
            default:
                ApiResponse::error("Invalid action", 400);
        }
        break;
        
    case 'GET':
        switch ($action) {
            case 'profile':
                $auth->getProfile();
                break;
            case 'verify':
                $auth->verifyToken();
                break;
            default:
                ApiResponse::error("Invalid action", 400);
        }
        break;
        
    case 'PUT':
        switch ($action) {
            case 'profile':
                $auth->updateProfile();
                break;
            default:
                ApiResponse::error("Invalid action", 400);
        }
        break;
        
    default:
        ApiResponse::error("Method not allowed", 405);
}
?>
