<?php

session_start();

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

require_once '../config/database.php';
require_once '../config/api_config.php';
require_once '../models/Tours.php';

class ToursController {
    private $db;
    private $tours;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->tours = new Tours($this->db);
    }
    

    public function getAllTours() {
        $filters = [];
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        
        if (isset($_GET['destination'])) $filters['destination'] = $_GET['destination'];
        if (isset($_GET['category'])) $filters['category'] = $_GET['category'];
        if (isset($_GET['min_price'])) $filters['min_price'] = $_GET['min_price'];
        if (isset($_GET['max_price'])) $filters['max_price'] = $_GET['max_price'];
        if (isset($_GET['duration_days'])) $filters['duration_days'] = $_GET['duration_days'];
        if (isset($_GET['difficulty_level'])) $filters['difficulty_level'] = $_GET['difficulty_level'];
        
        $tours = $this->tours->getAllTours($filters, $limit, $offset);
        
        ApiResponse::success([
            'tours' => $tours,
            'pagination' => [
                'limit' => $limit,
                'offset' => $offset,
                'total' => count($tours)
            ]
        ]);
    }

    public function getTourById() {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            ApiResponse::error("Tour ID is required", 400);
        }
        
        $tour = $this->tours->getTourById($id);
        
        if ($tour) {
            ApiResponse::success($tour);
        } else {
            ApiResponse::notFound("Tour not found");
        }
    }

    public function createTour() {
        $token = getAuthorizationHeader();
        if (!$token) {
            ApiResponse::unauthorized("Token required");
        }
        
        $decoded = JWTHelper::verify($token);
        if (!$decoded || $decoded['role'] !== 'admin') {
            ApiResponse::forbidden("Admin access required");
        }
        
        $data = getJsonInput();
        
        $errors = [];
        
        if (empty($data['title'])) $errors[] = "Title is required";
        if (empty($data['destination'])) $errors[] = "Destination is required";
        if (empty($data['price']) || !is_numeric($data['price'])) $errors[] = "Valid price is required";
        if (empty($data['duration_days']) || !is_numeric($data['duration_days'])) $errors[] = "Valid duration is required";
        
        if (!empty($errors)) {
            ApiResponse::error("Validation failed", 400, $errors);
        }
        
        $this->tours->title = $data['title'];
        $this->tours->description = $data['description'] ?? '';
        $this->tours->destination = $data['destination'];
        $this->tours->price = $data['price'];
        $this->tours->duration_days = $data['duration_days'];
        $this->tours->max_capacity = $data['max_capacity'] ?? 20;
        $this->tours->category = $data['category'] ?? '';
        $this->tours->difficulty_level = $data['difficulty_level'] ?? 'easy';
        $this->tours->image_url = $data['image_url'] ?? '';
        $this->tours->gallery = $data['gallery'] ?? [];
        $this->tours->features = $data['features'] ?? [];
        $this->tours->inclusions = $data['inclusions'] ?? [];
        $this->tours->exclusions = $data['exclusions'] ?? [];
        $this->tours->created_by = $decoded['user_id'];
        
        if ($this->tours->create()) {
            logActivity($decoded['user_id'], 'Tour created', 'tours', $this->tours->id);
            
            ApiResponse::success([
                'id' => $this->tours->id,
                'message' => 'Tour created successfully'
            ], "Tour created successfully", 201);
        } else {
            ApiResponse::serverError("Tour creation failed");
        }
    }

    public function updateTour() {
        $token = getAuthorizationHeader();
        if (!$token) {
            ApiResponse::unauthorized("Token required");
        }
        
        $decoded = JWTHelper::verify($token);
        if (!$decoded || $decoded['role'] !== 'admin') {
            ApiResponse::forbidden("Admin access required");
        }
        
        $id = $_GET['id'] ?? null;
        if (!$id) {
            ApiResponse::error("Tour ID is required", 400);
        }
        
        $data = getJsonInput();
        
        $old_tour = $this->tours->getTourById($id);
        
        $this->tours->id = $id;
        $this->tours->title = $data['title'] ?? '';
        $this->tours->description = $data['description'] ?? '';
        $this->tours->destination = $data['destination'] ?? '';
        $this->tours->price = $data['price'] ?? 0;
        $this->tours->duration_days = $data['duration_days'] ?? 0;
        $this->tours->max_capacity = $data['max_capacity'] ?? 20;
        $this->tours->category = $data['category'] ?? '';
        $this->tours->difficulty_level = $data['difficulty_level'] ?? 'easy';
        $this->tours->image_url = $data['image_url'] ?? '';
        $this->tours->gallery = $data['gallery'] ?? [];
        $this->tours->features = $data['features'] ?? [];
        $this->tours->inclusions = $data['inclusions'] ?? [];
        $this->tours->exclusions = $data['exclusions'] ?? [];
        
        if ($this->tours->update()) {
            logActivity($decoded['user_id'], 'Tour updated', 'tours', $id, $old_tour, $data);
            
            ApiResponse::success(null, "Tour updated successfully");
        } else {
            ApiResponse::serverError("Tour update failed");
        }
    }

    public function deleteTour() {
        $token = getAuthorizationHeader();
        if (!$token) {
            ApiResponse::unauthorized("Token required");
        }
        
        $decoded = JWTHelper::verify($token);
        if (!$decoded || $decoded['role'] !== 'admin') {
            ApiResponse::forbidden("Admin access required");
        }
        
        $id = $_GET['id'] ?? null;
        if (!$id) {
            ApiResponse::error("Tour ID is required", 400);
        }
        
        if ($this->tours->delete($id)) {
            logActivity($decoded['user_id'], 'Tour deleted', 'tours', $id);
            
            ApiResponse::success(null, "Tour deleted successfully");
        } else {
            ApiResponse::serverError("Tour deletion failed");
        }
    }
 
    public function getPopularTours() {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $tours = $this->tours->getPopularTours($limit);
        
        ApiResponse::success($tours);
    }
 
    public function searchTours() {
        $search_term = $_GET['q'] ?? '';
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        
        if (empty($search_term)) {
            ApiResponse::error("Search term is required", 400);
        }
        
        $tours = $this->tours->searchTours($search_term, $limit);
        
        ApiResponse::success($tours);
    }

    public function getTourStats() {
        $token = getAuthorizationHeader();
        if (!$token) {
            ApiResponse::unauthorized("Token required");
        }
        
        $decoded = JWTHelper::verify($token);
        if (!$decoded || $decoded['role'] !== 'admin') {
            ApiResponse::forbidden("Admin access required");
        }
        
        $stats = $this->tours->getTourStats();
        ApiResponse::success($stats);
    }

    public function getGalleryImages() {
        $tourId = $_GET['tourId'] ?? null;
        
        if (!$tourId) {
            ApiResponse::error("Tour ID is required", 400);
        }
        
        // Return fallback gallery images
        $images = [
            '/goa.avif',
            '/shimla.avif',
            '/rajasthan.avif',
            '/kerala.avif',
            '/ladakh.avif',
            '/tajmahal.avif'
        ];
        
        ApiResponse::success($images);
    }
}

$tours_controller = new ToursController();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        switch ($action) {
            case 'all':
                $tours_controller->getAllTours();
                break;
            case 'single':
                $tours_controller->getTourById();
                break;
            case 'popular':
                $tours_controller->getPopularTours();
                break;
            case 'search':
                $tours_controller->searchTours();
                break;
            case 'stats':
                $tours_controller->getTourStats();
                break;
            case 'gallery':
                $tours_controller->getGalleryImages();
                break;
            default:
                $tours_controller->getAllTours();
        }
        break;
        
    case 'POST':
        $tours_controller->createTour();
        break;
        
    case 'PUT':
        $tours_controller->updateTour();
        break;
        
    case 'DELETE':
        $tours_controller->deleteTour();
        break;
        
    default:
        ApiResponse::error("Method not allowed", 405);
}
?>
