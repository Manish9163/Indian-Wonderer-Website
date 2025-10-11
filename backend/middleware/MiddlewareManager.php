<?php


require_once 'AuthMiddleware.php';
require_once 'CorsMiddleware.php';
require_once 'RateLimitMiddleware.php';
require_once 'RequestResponseMiddleware.php';

class MiddlewareManager {
    private $middlewares = [];
    private $config;
    
    public function __construct($config = []) {
        $this->config = array_merge([
            'enable_cors' => true,
            'enable_auth' => true,
            'enable_rate_limit' => true,
            'enable_request_response' => true,
            'log_enabled' => true
        ], $config);
        
        $this->initializeMiddlewares();
    }

    private function initializeMiddlewares() {
        if ($this->config['enable_cors']) {
            $this->middlewares[] = new CorsMiddleware();
        }
        
        if ($this->config['enable_request_response']) {
            $this->middlewares[] = new RequestResponseMiddleware();
        }
        
        if ($this->config['enable_rate_limit']) {
            $this->middlewares[] = new RateLimitMiddleware();
        }
        
        if ($this->config['enable_auth']) {
            $this->middlewares[] = new AuthMiddleware();
        }
    }

    public function handle($request, $finalHandler) {
        return $this->processMiddleware(0, $request, $finalHandler);
    }

    private function processMiddleware($index, $request, $finalHandler) {
        if ($index >= count($this->middlewares)) {
            return $finalHandler($request);
        }
        
        $middleware = $this->middlewares[$index];
        
        $next = function($request) use ($index, $finalHandler) {
            return $this->processMiddleware($index + 1, $request, $finalHandler);
        };
        
        return $middleware->handle($request, $next);
    }
    

    public static function route($endpoint, $data = null) {
        $manager = new self();
        
        $request = [
            'endpoint' => $endpoint,
            'data' => $data,
            'method' => $_SERVER['REQUEST_METHOD'],
            'headers' => getallheaders(),
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ];
        
        return $manager->handle($request, function($request) {
            return MiddlewareManager::executeEndpoint($request);
        });
    }

    private static function executeEndpoint($request) {
        $endpoint = $request['endpoint'];
        $method = $request['method'];
        
        $routes = [
            'auth/login' => function() use ($method) {
                if ($method === 'POST') {
                    return self::handleAuthLogin();
                }
                return self::methodNotAllowed();
            },
            
            'auth/logout' => function() use ($method) {
                if ($method === 'POST') {
                    return self::handleAuthLogout();
                }
                return self::methodNotAllowed();
            },
            
            'auth/verify' => function() use ($method) {
                if ($method === 'GET') {
                    return self::handleAuthVerify();
                }
                return self::methodNotAllowed();
            },
            
            'admin/tours' => function() use ($method) {
                return self::handleAdminTours();
            },
            
            'admin/users' => function() use ($method) {
                return self::handleAdminUsers();
            },
            
            'admin/bookings' => function() use ($method) {
                return self::handleAdminBookings();
            },
            
            'admin/dashboard' => function() use ($method) {
                return self::handleAdminDashboard();
            },
            
            'admin/analytics' => function() use ($method) {
                return self::handleAdminAnalytics();
            },
            
            'tours' => function() use ($method) {
                switch ($method) {
                    case 'GET':
                        return self::handleGetTours();
                    default:
                        return self::methodNotAllowed();
                }
            },
            
            'bookings' => function() use ($method) {
                switch ($method) {
                    case 'GET':
                        return self::handleGetBookings();
                    case 'POST':
                        return self::handleCreateBooking();
                    default:
                        return self::methodNotAllowed();
                }
            },
            
            'users' => function() use ($method) {
                switch ($method) {
                    case 'GET':
                        return self::handleGetUsers();
                    case 'POST':
                        return self::handleCreateUser();
                    default:
                        return self::methodNotAllowed();
                }
            },
            
            'dashboard/stats' => function() use ($method) {
                if ($method === 'GET') {
                    return self::handleDashboardStats();
                }
                return self::methodNotAllowed();
            },
            
            'analytics' => function() use ($method) {
                if ($method === 'GET') {
                    return self::handleAnalytics();
                }
                return self::methodNotAllowed();
            },
            
            'customers' => function() use ($method) {
                switch ($method) {
                    case 'GET':
                        return self::handleGetCustomers();
                    case 'POST':
                        return self::handleCreateCustomer();
                    default:
                        return self::methodNotAllowed();
                }
            },
            
            'itineraries' => function() use ($method) {
                switch ($method) {
                    case 'GET':
                        return self::handleGetItineraries();
                    case 'POST':
                        return self::handleCreateItinerary();
                    default:
                        return self::methodNotAllowed();
                }
            },
            
            'payments' => function() use ($method) {
                switch ($method) {
                    case 'GET':
                        return self::handleGetPayments();
                    case 'POST':
                        return self::handleProcessPayment();
                    default:
                        return self::methodNotAllowed();
                }
            }
        ];
        
        if (isset($routes[$endpoint])) {
            try {
                return $routes[$endpoint]();
            } catch (Exception $e) {
                return self::errorResponse('Internal server error: ' . $e->getMessage(), 500);
            }
        }
        
        return self::notFoundResponse();
    }

    private static function handleAuthLogin() {
        $input = RequestResponseMiddleware::getJsonInput();
        
        if (!$input || !isset($input['email']) || !isset($input['password'])) {
            return self::errorResponse('Email and password are required', 400);
        }
        
        require_once __DIR__ . '/../api/auth.php';
        
        $_POST = $input;
        ob_start();
        include __DIR__ . '/../api/auth.php';
        $output = ob_get_clean();
        
        return json_decode($output, true) ?: ['success' => false, 'message' => 'Login failed'];
    }
    
    private static function handleAuthLogout() {
        return ['success' => true, 'message' => 'Logged out successfully'];
    }
    
    private static function handleAuthVerify() {
        $headers = getallheaders();
        $token = $headers['Authorization'] ?? '';
        
        if (strpos($token, 'Bearer ') === 0) {
            $token = substr($token, 7);
            return ['success' => true, 'valid' => true];
        }
        
        return ['success' => false, 'valid' => false];
    }

    private static function handleGetTours() {
        require_once __DIR__ . '/../api/tours.php';
        
        ob_start();
        include __DIR__ . '/../api/tours.php';
        $output = ob_get_clean();
        
        return json_decode($output, true) ?: [];
    }
    
    private static function handleCreateTour() {
        $input = RequestResponseMiddleware::getJsonInput();
        
        if (!$input) {
            return self::errorResponse('Tour data is required', 400);
        }
        
        $_POST = $input;
        require_once __DIR__ . '/../api/tours.php';
        
        ob_start();
        include __DIR__ . '/../api/tours.php';
        $output = ob_get_clean();
        
        return json_decode($output, true) ?: ['success' => false];
    }

    private static function handleGetUsers() {
        require_once __DIR__ . '/../api/users.php';
        
        ob_start();
        include __DIR__ . '/../api/users.php';
        $output = ob_get_clean();
        
        return json_decode($output, true) ?: [];
    }
    
    private static function handleCreateUser() {
        $input = RequestResponseMiddleware::getJsonInput();
        
        if (!$input) {
            return self::errorResponse('User data is required', 400);
        }
        
        $_POST = $input;
        require_once __DIR__ . '/../api/users.php';
        
        ob_start();
        include __DIR__ . '/../api/users.php';
        $output = ob_get_clean();
        
        return json_decode($output, true) ?: ['success' => false];
    }
    

    private static function handleGetBookings() {
        require_once __DIR__ . '/../api/bookings.php';
        
        ob_start();
        include __DIR__ . '/../api/bookings.php';
        $output = ob_get_clean();
        
        return json_decode($output, true) ?: [];
    }
    
    private static function handleCreateBooking() {
        $input = RequestResponseMiddleware::getJsonInput();
        
        if (!$input) {
            return self::errorResponse('Booking data is required', 400);
        }
        
        $_POST = $input;
        require_once __DIR__ . '/../api/bookings.php';
        
        ob_start();
        include __DIR__ . '/../api/bookings.php';
        $output = ob_get_clean();
        
        return json_decode($output, true) ?: ['success' => false];
    }

    private static function handleDashboardStats() {
        require_once __DIR__ . '/../api/dashboard.php';
        
        ob_start();
        include __DIR__ . '/../api/dashboard.php';
        $output = ob_get_clean();
        
        return json_decode($output, true) ?: [];
    }

    private static function handleAnalytics() {
        require_once __DIR__ . '/../api/analytics.php';
        
        ob_start();
        include __DIR__ . '/../api/analytics.php';
        $output = ob_get_clean();
        
        return json_decode($output, true) ?: [];
    }

    private static function handleGetCustomers() {
        require_once __DIR__ . '/../api/customers.php';
        
        ob_start();
        include __DIR__ . '/../api/customers.php';
        $output = ob_get_clean();
        
        return json_decode($output, true) ?: [];
    }
    
    private static function handleCreateCustomer() {
        $input = RequestResponseMiddleware::getJsonInput();
        
        if (!$input) {
            return self::errorResponse('Customer data is required', 400);
        }
        
        $_POST = $input;
        require_once __DIR__ . '/../api/customers.php';
        
        ob_start();
        include __DIR__ . '/../api/customers.php';
        $output = ob_get_clean();
        
        return json_decode($output, true) ?: ['success' => false];
    }

    private static function handleGetItineraries() {
        require_once __DIR__ . '/../api/itineraries.php';
        
        ob_start();
        include __DIR__ . '/../api/itineraries.php';
        $output = ob_get_clean();
        
        return json_decode($output, true) ?: [];
    }
    
    private static function handleCreateItinerary() {
        $input = RequestResponseMiddleware::getJsonInput();
        
        if (!$input) {
            return self::errorResponse('Itinerary data is required', 400);
        }
        
        $_POST = $input;
        require_once __DIR__ . '/../api/itineraries.php';
        
        ob_start();
        include __DIR__ . '/../api/itineraries.php';
        $output = ob_get_clean();
        
        return json_decode($output, true) ?: ['success' => false];
    }
    

    private static function handleAdminTours() {
        require_once __DIR__ . '/../api/admin_tours.php';
        
        ob_start();
        $api = new AdminToursAPI();
        $api->handleRequest();
        $output = ob_get_clean();
        
        return json_decode($output, true) ?: ['success' => false, 'message' => 'Admin tours API error'];
    }
    
    private static function handleAdminUsers() {
        require_once __DIR__ . '/../api/admin_users.php';
        
        ob_start();
        $api = new AdminUserManagementAPI();
        $api->handleRequest();
        $output = ob_get_clean();
        
        return json_decode($output, true) ?: ['success' => false, 'message' => 'Admin users API error'];
    }
    
    private static function handleAdminBookings() {
        require_once __DIR__ . '/../api/admin_bookings.php';
        
        ob_start();
        $api = new AdminBookingManagementAPI();
        $api->handleRequest();
        $output = ob_get_clean();
        
        return json_decode($output, true) ?: ['success' => false, 'message' => 'Admin bookings API error'];
    }
    
    private static function handleAdminDashboard() {
        require_once __DIR__ . '/../api/admin_dashboard.php';
        
        ob_start();
        $api = new AdminDashboardAPI();
        $api->handleRequest();
        $output = ob_get_clean();
        
        return json_decode($output, true) ?: ['success' => false, 'message' => 'Admin dashboard API error'];
    }
    
    private static function handleAdminAnalytics() {
        require_once __DIR__ . '/../api/admin_analytics.php';
        
        ob_start();
        $api = new AdvancedAnalyticsAPI();
        $api->handleRequest();
        $output = ob_get_clean();
        
        return json_decode($output, true) ?: ['success' => false, 'message' => 'Admin analytics API error'];
    }
    

    private static function handleGetPayments() {
        require_once __DIR__ . '/../api/payments.php';
        
        ob_start();
        include __DIR__ . '/../api/payments.php';
        $output = ob_get_clean();
        
        return json_decode($output, true) ?: [];
    }
    
    private static function handleProcessPayment() {
        $input = RequestResponseMiddleware::getJsonInput();
        
        if (!$input) {
            return self::errorResponse('Payment data is required', 400);
        }
        
        $_POST = $input;
        require_once __DIR__ . '/../api/payments.php';
        
        ob_start();
        include __DIR__ . '/../api/payments.php';
        $output = ob_get_clean();
        
        return json_decode($output, true) ?: ['success' => false];
    }
    private static function methodNotAllowed() {
        http_response_code(405);
        return [
            'success' => false,
            'message' => 'Method not allowed',
            'error_code' => 'METHOD_NOT_ALLOWED'
        ];
    }
    
    private static function notFoundResponse() {
        http_response_code(404);
        return [
            'success' => false,
            'message' => 'Endpoint not found',
            'error_code' => 'NOT_FOUND'
        ];
    }
    
    private static function errorResponse($message, $code = 500) {
        http_response_code($code);
        return [
            'success' => false,
            'message' => $message,
            'error_code' => 'ERROR_' . $code
        ];
    }
 
    public static function sendResponse($data) {
        header('Content-Type: application/json');
        echo json_encode($data, JSON_PRETTY_PRINT);
        exit;
    }
}
?>
