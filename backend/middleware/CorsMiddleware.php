<?php

class CorsMiddleware {
    private $allowedOrigins = [
        'http://localhost:3000',    
        'http://127.0.0.1:3000',   
        'http://localhost:4200',    
        'http://127.0.0.1:4200',   
        'http://localhost:3001',    
        'http://localhost:5173',    
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

    public function handle($request, $next) {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        $this->setCorsHeaders($origin);
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            $this->handlePreflightRequest();
            return;
        }
        
        return $next($request);
    }
 
    private function setCorsHeaders($origin) {
        if (in_array($origin, $this->allowedOrigins)) {
            header("Access-Control-Allow-Origin: $origin");
        } else {
            header("Access-Control-Allow-Origin: http://localhost:3000");
        }
        
        header("Access-Control-Allow-Methods: " . implode(', ', $this->allowedMethods));
        header("Access-Control-Allow-Headers: " . implode(', ', $this->allowedHeaders));
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Max-Age: 86400"); // 24 hours
        header("Content-Type: application/json; charset=utf-8");
        
        header("Vary: Origin");
        header("X-Content-Type-Options: nosniff");
    }

    private function handlePreflightRequest() {
        http_response_code(200);
        
        $requestMethod = $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] ?? '';
        $requestHeaders = $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] ?? '';
        
        if ($requestMethod && in_array($requestMethod, $this->allowedMethods)) {
            header("Access-Control-Allow-Methods: $requestMethod");
        }
        
        if ($requestHeaders) {
            header("Access-Control-Allow-Headers: $requestHeaders");
        }
        
        error_log("CORS Preflight: " . $_SERVER['REQUEST_METHOD'] . " " . $_SERVER['REQUEST_URI']);
        
        exit(0);
    }

    private function isDevelopment() {
        return !isset($_SERVER['HTTPS']) || 
               strpos($_SERVER['HTTP_HOST'], 'localhost') !== false ||
               strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false;
    }
    

    public function addAllowedOrigin($origin) {
        if (!in_array($origin, $this->allowedOrigins)) {
            $this->allowedOrigins[] = $origin;
        }
    }

    public function addAllowedHeader($header) {
        if (!in_array($header, $this->allowedHeaders)) {
            $this->allowedHeaders[] = $header;
        }
    }
}
?>
