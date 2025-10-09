<?php
/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing for both React and Angular frontends
 */

class CorsMiddleware {
    private $allowedOrigins = [
        'http://localhost:3000',    // React frontend
        'http://127.0.0.1:3000',   // React frontend (alternative)
        'http://localhost:4200',    // Angular admin panel
        'http://127.0.0.1:4200',   // Angular admin panel (alternative)
        'http://localhost:3001',    // React frontend (backup port)
        'http://localhost:5173',    // Vite dev server
    ];
    
    private $allowedMethods = [
        'GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'
    ];
    
    private $allowedHeaders = [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers',
        'X-Admin-Token',
        'X-User-Token'
    ];
    
    /**
     * Process CORS middleware
     */
    public function handle($request, $next) {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        // Set CORS headers
        $this->setCorsHeaders($origin);
        
        // Handle preflight requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            $this->handlePreflightRequest();
            return;
        }
        
        // Continue to next middleware
        return $next($request);
    }
    
    /**
     * Set CORS headers
     */
    private function setCorsHeaders($origin) {
        // Allow specific origins - NEVER use wildcard with credentials
        if (in_array($origin, $this->allowedOrigins)) {
            header("Access-Control-Allow-Origin: $origin");
        } else {
            // Default to React frontend origin instead of wildcard
            header("Access-Control-Allow-Origin: http://localhost:3000");
        }
        
        // Set other CORS headers
        header("Access-Control-Allow-Methods: " . implode(', ', $this->allowedMethods));
        header("Access-Control-Allow-Headers: " . implode(', ', $this->allowedHeaders));
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Max-Age: 86400"); // 24 hours
        header("Content-Type: application/json; charset=utf-8");
        
        // Additional headers for different frontend frameworks
        header("Vary: Origin");
        header("X-Content-Type-Options: nosniff");
    }
    
    /**
     * Handle preflight OPTIONS requests
     */
    private function handlePreflightRequest() {
        http_response_code(200);
        
        // Additional preflight headers
        $requestMethod = $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] ?? '';
        $requestHeaders = $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] ?? '';
        
        if ($requestMethod && in_array($requestMethod, $this->allowedMethods)) {
            header("Access-Control-Allow-Methods: $requestMethod");
        }
        
        if ($requestHeaders) {
            header("Access-Control-Allow-Headers: $requestHeaders");
        }
        
        // Log preflight for debugging
        error_log("CORS Preflight: " . $_SERVER['REQUEST_METHOD'] . " " . $_SERVER['REQUEST_URI']);
        
        exit(0);
    }
    
    /**
     * Check if in development mode
     */
    private function isDevelopment() {
        return !isset($_SERVER['HTTPS']) || 
               strpos($_SERVER['HTTP_HOST'], 'localhost') !== false ||
               strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false;
    }
    
    /**
     * Add custom origin to allowed origins
     */
    public function addAllowedOrigin($origin) {
        if (!in_array($origin, $this->allowedOrigins)) {
            $this->allowedOrigins[] = $origin;
        }
    }
    
    /**
     * Add custom header to allowed headers
     */
    public function addAllowedHeader($header) {
        if (!in_array($header, $this->allowedHeaders)) {
            $this->allowedHeaders[] = $header;
        }
    }
}
?>
