<?php
/**
 * Itineraries API Controller
 * Handles itinerary management for admin panel
 */

// Disable HTML error output to prevent breaking JSON responses
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

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

// Start session for authentication
session_start();

require_once '../config/api_config.php';
require_once '../models/Itineraries.php';

class ItinerariesController {
    private $db;
    private $itineraries;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->itineraries = new Itineraries($this->db);
    }
    
    /**
     * Get all itineraries
     */
    public function getAllItineraries() {
        // TEMPORARY: Allow access without authentication for debugging
        // TODO: Re-enable authentication after testing
        error_log("⚠️ WARNING: Itineraries endpoint running without authentication!");
        
        /* AUTHENTICATION DISABLED FOR DEBUGGING
        // Verify admin authentication (JWT token or session)
        $token = getAuthorizationHeader();
        $isAuthenticated = false;
        
        // Try JWT token first
        if ($token) {
            $decoded = JWTHelper::verify($token);
            if ($decoded) {
                $isAuthenticated = true;
            }
        }
        
        // Fallback to session-based auth
        if (!$isAuthenticated && isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
            $isAuthenticated = true;
        }
        
        // If neither authentication method worked, deny access
        if (!$isAuthenticated) {
            ApiResponse::forbidden("Admin access required");
        }
        */
        
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        
        $itineraries = $this->itineraries->getAllItineraries($limit, $offset);
        
        ApiResponse::success([
            'itineraries' => $itineraries,
            'pagination' => [
                'limit' => $limit,
                'offset' => $offset,
                'total' => count($itineraries)
            ]
        ]);
    }
    
    /**
     * Get itinerary by ID
     */
    public function getItineraryById() {
        // Verify authentication
        $token = getAuthorizationHeader();
        if (!$token) {
            ApiResponse::unauthorized("Token required");
        }
        
        $decoded = JWTHelper::verify($token);
        if (!$decoded) {
            ApiResponse::unauthorized("Invalid token");
        }
        
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            ApiResponse::error("Itinerary ID is required", 400);
        }
        
        $itinerary = $this->itineraries->getItineraryById($id);
        
        if ($itinerary) {
            ApiResponse::success($itinerary);
        } else {
            ApiResponse::notFound("Itinerary not found");
        }
    }
    
    /**
     * Create new itinerary
     */
    public function createItinerary() {
        // Verify admin authentication
        $token = getAuthorizationHeader();
        $isAuthenticated = false;
        $user_id = null;
        
        // Try JWT token first
        if ($token) {
            $decoded = JWTHelper::verify($token);
            if ($decoded && isset($decoded['role']) && $decoded['role'] === 'admin') {
                $isAuthenticated = true;
                $user_id = $decoded['user_id'] ?? null;
            }
        }
        
        // Fallback to session-based auth
        if (!$isAuthenticated && isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
            $isAuthenticated = true;
            $user_id = $_SESSION['user_id'] ?? $_SESSION['admin_id'] ?? 1;
        }
        
        // If neither authentication method worked, deny access
        if (!$isAuthenticated) {
            ApiResponse::forbidden("Admin access required");
        }
        
        $data = getJsonInput();
        
        // Validation
        $errors = [];
        
        if (empty($data['tour_name'])) $errors[] = "Tour name is required";
        if (empty($data['total_days']) || !is_numeric($data['total_days'])) $errors[] = "Valid total days is required";
        
        if (!empty($errors)) {
            ApiResponse::error("Validation failed", 400, $errors);
        }
        
        // Set itinerary properties
        $this->itineraries->tour_id = $data['tour_id'] ?? 0;
        $this->itineraries->tour_name = $data['tour_name'];
        $this->itineraries->total_days = $data['total_days'];
        $this->itineraries->status = $data['status'] ?? 'active';
        $this->itineraries->created_by = $user_id;
        
        // Prepare schedule data
        $schedule_data = [];
        if (isset($data['schedule']) && is_array($data['schedule'])) {
            foreach ($data['schedule'] as $day) {
                $schedule_data[] = [
                    'day_number' => $day['day'] ?? $day['day_number'] ?? 1,
                    'title' => $day['title'] ?? '',
                    'description' => $day['description'] ?? '',
                    'time_schedule' => $day['time'] ?? $day['time_schedule'] ?? '',
                    'location' => $day['location'] ?? '',
                    'activities' => $day['activities'] ?? []
                ];
            }
        }
        
        if ($this->itineraries->create($schedule_data)) {
            // Log activity (wrapped in try-catch to prevent breaking response)
            try {
                if (function_exists('logActivity') && $user_id) {
                    logActivity($user_id, 'Itinerary created', 'itineraries', $this->itineraries->id);
                }
            } catch (Exception $e) {
                // Log error but don't break the response
                error_log("logActivity error: " . $e->getMessage());
            }
            
            ApiResponse::success([
                'id' => $this->itineraries->id,
                'message' => 'Itinerary created successfully'
            ], "Itinerary created successfully", 201);
        } else {
            ApiResponse::serverError("Itinerary creation failed");
        }
    }
    
    /**
     * Update itinerary
     */
    public function updateItinerary() {
        // Verify admin authentication
        $token = getAuthorizationHeader();
        $isAuthenticated = false;
        $user_id = null;
        
        // Try JWT token first
        if ($token) {
            $decoded = JWTHelper::verify($token);
            if ($decoded && isset($decoded['role']) && $decoded['role'] === 'admin') {
                $isAuthenticated = true;
                $user_id = $decoded['user_id'] ?? null;
            }
        }
        
        // Fallback to session-based auth
        if (!$isAuthenticated && isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
            $isAuthenticated = true;
            $user_id = $_SESSION['user_id'] ?? $_SESSION['admin_id'] ?? 1;
        }
        
        // If neither authentication method worked, deny access
        if (!$isAuthenticated) {
            ApiResponse::forbidden("Admin access required");
        }
        
        $id = $_GET['id'] ?? null;
        if (!$id) {
            ApiResponse::error("Itinerary ID is required", 400);
        }
        
        $data = getJsonInput();
        
        // Get existing itinerary for logging
        $old_itinerary = $this->itineraries->getItineraryById($id);
        
        // Set itinerary properties
        $this->itineraries->id = $id;
        $this->itineraries->tour_name = $data['tour_name'] ?? '';
        $this->itineraries->total_days = $data['total_days'] ?? 0;
        $this->itineraries->status = $data['status'] ?? 'active';
        
        // Prepare schedule data
        $schedule_data = [];
        if (isset($data['schedule']) && is_array($data['schedule'])) {
            foreach ($data['schedule'] as $day) {
                $schedule_data[] = [
                    'day_number' => $day['day'] ?? $day['day_number'] ?? 1,
                    'title' => $day['title'] ?? '',
                    'description' => $day['description'] ?? '',
                    'time_schedule' => $day['time'] ?? $day['time_schedule'] ?? '',
                    'location' => $day['location'] ?? '',
                    'activities' => $day['activities'] ?? []
                ];
            }
        }
        
        if ($this->itineraries->update($schedule_data)) {
            // Log activity (wrapped in try-catch to prevent breaking response)
            try {
                if (function_exists('logActivity') && $user_id) {
                    logActivity($user_id, 'Itinerary updated', 'itineraries', $id, $old_itinerary, $data);
                }
            } catch (Exception $e) {
                // Log error but don't break the response
                error_log("logActivity error: " . $e->getMessage());
            }
            
            ApiResponse::success(null, "Itinerary updated successfully");
        } else {
            ApiResponse::serverError("Itinerary update failed");
        }
    }
    
    /**
     * Delete itinerary
     */
    public function deleteItinerary() {
        // Verify admin authentication
        $token = getAuthorizationHeader();
        $isAuthenticated = false;
        $user_id = null;
        
        // Try JWT token first
        if ($token) {
            $decoded = JWTHelper::verify($token);
            if ($decoded && isset($decoded['role']) && $decoded['role'] === 'admin') {
                $isAuthenticated = true;
                $user_id = $decoded['user_id'] ?? null;
            }
        }
        
        // Fallback to session-based auth
        if (!$isAuthenticated && isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
            $isAuthenticated = true;
            $user_id = $_SESSION['user_id'] ?? $_SESSION['admin_id'] ?? 1;
        }
        
        // If neither authentication method worked, deny access
        if (!$isAuthenticated) {
            ApiResponse::forbidden("Admin access required");
        }
        
        $id = $_GET['id'] ?? null;
        if (!$id) {
            ApiResponse::error("Itinerary ID is required", 400);
        }
        
        if ($this->itineraries->delete($id)) {
            // Log activity (wrapped in try-catch to prevent breaking response)
            try {
                if (function_exists('logActivity') && $user_id) {
                    logActivity($user_id, 'Itinerary deleted', 'itineraries', $id);
                }
            } catch (Exception $e) {
                // Log error but don't break the response
                error_log("logActivity error: " . $e->getMessage());
            }
            
            ApiResponse::success(null, "Itinerary deleted successfully");
        } else {
            ApiResponse::serverError("Itinerary deletion failed");
        }
    }
    
    /**
     * Search itineraries
     */
    public function searchItineraries() {
        // Verify admin authentication
        $token = getAuthorizationHeader();
        if (!$token) {
            ApiResponse::unauthorized("Token required");
        }
        
        $decoded = JWTHelper::verify($token);
        if (!$decoded || $decoded['role'] !== 'admin') {
            ApiResponse::forbidden("Admin access required");
        }
        
        $search_term = $_GET['q'] ?? '';
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        
        if (empty($search_term)) {
            ApiResponse::error("Search term is required", 400);
        }
        
        $itineraries = $this->itineraries->searchItineraries($search_term, $limit);
        
        ApiResponse::success($itineraries);
    }
    
    /**
     * Get itinerary statistics
     */
    public function getItineraryStats() {
        // Verify admin authentication
        $token = getAuthorizationHeader();
        if (!$token) {
            ApiResponse::unauthorized("Token required");
        }
        
        $decoded = JWTHelper::verify($token);
        if (!$decoded || $decoded['role'] !== 'admin') {
            ApiResponse::forbidden("Admin access required");
        }
        
        $stats = $this->itineraries->getItineraryStats();
        ApiResponse::success($stats);
    }
    
    /**
     * Get itineraries for a specific tour (for frontend)
     */
    public function getItinerariesByTour() {
        $tour_id = $_GET['tour_id'] ?? null;
        
        if (!$tour_id) {
            ApiResponse::error("Tour ID is required", 400);
        }
        
        $itineraries = $this->itineraries->getItinerariesByTour($tour_id);
        ApiResponse::success($itineraries);
    }
}

// Route handling
$itineraries_controller = new ItinerariesController();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        switch ($action) {
            case 'all':
                $itineraries_controller->getAllItineraries();
                break;
            case 'single':
                $itineraries_controller->getItineraryById();
                break;
            case 'search':
                $itineraries_controller->searchItineraries();
                break;
            case 'stats':
                $itineraries_controller->getItineraryStats();
                break;
            case 'by-tour':
                $itineraries_controller->getItinerariesByTour();
                break;
            default:
                $itineraries_controller->getAllItineraries();
        }
        break;
        
    case 'POST':
        $itineraries_controller->createItinerary();
        break;
        
    case 'PUT':
        $itineraries_controller->updateItinerary();
        break;
        
    case 'DELETE':
        $itineraries_controller->deleteItinerary();
        break;
        
    default:
        ApiResponse::error("Method not allowed", 405);
}
?>
