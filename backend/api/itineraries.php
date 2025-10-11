<?php

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

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
    

    public function getAllItineraries() {
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
    

    public function getItineraryById() {
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

    public function createItinerary() {
        $token = getAuthorizationHeader();
        $isAuthenticated = false;
        $user_id = null;
        
        if ($token) {
            $decoded = JWTHelper::verify($token);
            if ($decoded && isset($decoded['role']) && $decoded['role'] === 'admin') {
                $isAuthenticated = true;
                $user_id = $decoded['user_id'] ?? null;
            }
        }
        
        if (!$isAuthenticated && isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
            $isAuthenticated = true;
            $user_id = $_SESSION['user_id'] ?? $_SESSION['admin_id'] ?? 1;
        }
        
        if (!$isAuthenticated) {
            ApiResponse::forbidden("Admin access required");
        }
        
        $data = getJsonInput();
        
        $errors = [];
        
        if (empty($data['tour_name'])) $errors[] = "Tour name is required";
        if (empty($data['total_days']) || !is_numeric($data['total_days'])) $errors[] = "Valid total days is required";
        
        if (!empty($errors)) {
            ApiResponse::error("Validation failed", 400, $errors);
        }
        
        $this->itineraries->tour_id = $data['tour_id'] ?? 0;
        $this->itineraries->tour_name = $data['tour_name'];
        $this->itineraries->total_days = $data['total_days'];
        $this->itineraries->status = $data['status'] ?? 'active';
        $this->itineraries->created_by = $user_id;
        
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
            try {
                if (function_exists('logActivity') && $user_id) {
                    logActivity($user_id, 'Itinerary created', 'itineraries', $this->itineraries->id);
                }
            } catch (Exception $e) {
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
    

    public function updateItinerary() {
        $token = getAuthorizationHeader();
        $isAuthenticated = false;
        $user_id = null;
        
        if ($token) {
            $decoded = JWTHelper::verify($token);
            if ($decoded && isset($decoded['role']) && $decoded['role'] === 'admin') {
                $isAuthenticated = true;
                $user_id = $decoded['user_id'] ?? null;
            }
        }
        if (!$isAuthenticated && isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
            $isAuthenticated = true;
            $user_id = $_SESSION['user_id'] ?? $_SESSION['admin_id'] ?? 1;
        }
        
        if (!$isAuthenticated) {
            ApiResponse::forbidden("Admin access required");
        }
        
        $id = $_GET['id'] ?? null;
        if (!$id) {
            ApiResponse::error("Itinerary ID is required", 400);
        }
        
        $data = getJsonInput();
        
        $old_itinerary = $this->itineraries->getItineraryById($id);
        
        $this->itineraries->id = $id;
        $this->itineraries->tour_name = $data['tour_name'] ?? '';
        $this->itineraries->total_days = $data['total_days'] ?? 0;
        $this->itineraries->status = $data['status'] ?? 'active';
        
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
            try {
                if (function_exists('logActivity') && $user_id) {
                    logActivity($user_id, 'Itinerary updated', 'itineraries', $id, $old_itinerary, $data);
                }
            } catch (Exception $e) {
                error_log("logActivity error: " . $e->getMessage());
            }
            
            ApiResponse::success(null, "Itinerary updated successfully");
        } else {
            ApiResponse::serverError("Itinerary update failed");
        }
    }
    
 
    public function deleteItinerary() {
        $token = getAuthorizationHeader();
        $isAuthenticated = false;
        $user_id = null;
        
        if ($token) {
            $decoded = JWTHelper::verify($token);
            if ($decoded && isset($decoded['role']) && $decoded['role'] === 'admin') {
                $isAuthenticated = true;
                $user_id = $decoded['user_id'] ?? null;
            }
        }
        
        if (!$isAuthenticated && isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
            $isAuthenticated = true;
            $user_id = $_SESSION['user_id'] ?? $_SESSION['admin_id'] ?? 1;
        }
        
        if (!$isAuthenticated) {
            ApiResponse::forbidden("Admin access required");
        }
        
        $id = $_GET['id'] ?? null;
        if (!$id) {
            ApiResponse::error("Itinerary ID is required", 400);
        }
        
        if ($this->itineraries->delete($id)) {
            try {
                if (function_exists('logActivity') && $user_id) {
                    logActivity($user_id, 'Itinerary deleted', 'itineraries', $id);
                }
            } catch (Exception $e) {
                error_log("logActivity error: " . $e->getMessage());
            }
            
            ApiResponse::success(null, "Itinerary deleted successfully");
        } else {
            ApiResponse::serverError("Itinerary deletion failed");
        }
    }

    public function searchItineraries() {
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
    

    public function getItineraryStats() {
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
    

    public function getItinerariesByTour() {
        $tour_id = $_GET['tour_id'] ?? null;
        
        if (!$tour_id) {
            ApiResponse::error("Tour ID is required", 400);
        }
        
        $itineraries = $this->itineraries->getItinerariesByTour($tour_id);
        ApiResponse::success($itineraries);
    }
}

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
