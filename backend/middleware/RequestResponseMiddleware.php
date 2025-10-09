<?php
/**
 * Request/Response Middleware
 * Handles request parsing and response formatting for both frontends
 */

class RequestResponseMiddleware {
    private $startTime;
    
    public function __construct() {
        $this->startTime = microtime(true);
    }
    
    /**
     * Process request/response middleware
     */
    public function handle($request, $next) {
        // Process incoming request
        $this->processRequest();
        
        // Add response headers
        $this->addResponseHeaders();
        
        // Execute next middleware/controller
        $response = $next($request);
        
        // Process outgoing response
        $this->processResponse($response);
        
        return $response;
    }
    
    /**
     * Process incoming request
     */
    private function processRequest() {
        // Log request for debugging
        $this->logRequest();
        
        // Validate request format
        $this->validateRequest();
        
        // Parse request body for JSON
        $this->parseJsonBody();
    }
    
    /**
     * Add common response headers
     */
    private function addResponseHeaders() {
        // Security headers
        header('X-Frame-Options: DENY');
        header('X-XSS-Protection: 1; mode=block');
        header('X-Content-Type-Options: nosniff');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        
        // API headers
        header('X-API-Version: 1.0');
        header('X-Response-Time: ' . round((microtime(true) - $this->startTime) * 1000, 2) . 'ms');
        
        // Cache headers for different content types
        $this->setCacheHeaders();
    }
    
    /**
     * Set appropriate cache headers
     */
    private function setCacheHeaders() {
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        
        if (strpos($uri, 'auth.php') !== false) {
            // No cache for auth endpoints
            header('Cache-Control: no-store, no-cache, must-revalidate');
            header('Pragma: no-cache');
        } elseif (strpos($uri, 'tours.php') !== false) {
            // Short cache for tours data
            header('Cache-Control: public, max-age=300'); // 5 minutes
        } elseif (strpos($uri, 'dashboard.php') !== false) {
            // No cache for dashboard (real-time data)
            header('Cache-Control: no-cache, must-revalidate');
        } else {
            // Default cache
            header('Cache-Control: public, max-age=3600'); // 1 hour
        }
    }
    
    /**
     * Validate request format
     */
    private function validateRequest() {
        // Check for required headers based on method
        if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
            $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
            
            // For JSON endpoints, ensure proper content type
            if (strpos($_SERVER['REQUEST_URI'], '.php') !== false && 
                !empty(file_get_contents('php://input')) &&
                strpos($contentType, 'application/json') === false &&
                strpos($contentType, 'multipart/form-data') === false) {
                
                $this->sendBadRequestResponse('Invalid Content-Type. Expected application/json');
            }
        }
    }
    
    /**
     * Parse JSON request body
     */
    private function parseJsonBody() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
            $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
            
            if (strpos($contentType, 'application/json') !== false) {
                $input = file_get_contents('php://input');
                if (!empty($input)) {
                    $decoded = json_decode($input, true);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        $this->sendBadRequestResponse('Invalid JSON in request body');
                    }
                    
                    // Make parsed JSON available globally
                    $GLOBALS['json_input'] = $decoded;
                }
            }
        }
    }
    
    /**
     * Process outgoing response
     */
    private function processResponse($response) {
        // Add timing information
        $executionTime = round((microtime(true) - $this->startTime) * 1000, 2);
        
        // Log response for debugging
        $this->logResponse($executionTime);
        
        // Add response metadata if JSON
        if (is_array($response) || is_object($response)) {
            if (!isset($response['meta'])) {
                $response['meta'] = [];
            }
            $response['meta']['execution_time_ms'] = $executionTime;
            $response['meta']['memory_usage'] = round(memory_get_peak_usage(true) / 1024 / 1024, 2) . 'MB';
        }
        
        return $response;
    }
    
    /**
     * Log incoming request
     */
    private function logRequest() {
        if ($this->shouldLog()) {
            $logData = [
                'timestamp' => date('Y-m-d H:i:s'),
                'method' => $_SERVER['REQUEST_METHOD'],
                'uri' => $_SERVER['REQUEST_URI'],
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
                'origin' => $_SERVER['HTTP_ORIGIN'] ?? 'direct'
            ];
            
            error_log('API Request: ' . json_encode($logData));
        }
    }
    
    /**
     * Log outgoing response
     */
    private function logResponse($executionTime) {
        if ($this->shouldLog()) {
            $logData = [
                'timestamp' => date('Y-m-d H:i:s'),
                'execution_time_ms' => $executionTime,
                'memory_peak_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
                'response_code' => http_response_code()
            ];
            
            error_log('API Response: ' . json_encode($logData));
        }
    }
    
    /**
     * Determine if request should be logged
     */
    private function shouldLog() {
        // Don't log OPTIONS requests (CORS preflight)
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            return false;
        }
        
        // Don't log health checks
        if (strpos($_SERVER['REQUEST_URI'], 'health') !== false) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Send bad request response
     */
    private function sendBadRequestResponse($message) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'error_code' => 'BAD_REQUEST',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }
    
    /**
     * Get parsed JSON input
     */
    public static function getJsonInput() {
        return $GLOBALS['json_input'] ?? null;
    }
}
?>
