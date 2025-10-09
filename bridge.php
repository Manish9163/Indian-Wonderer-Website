<?php
/**
 * Unified Bridge - Connects React Frontend, Angular Admin Panel, and PHP Backend
 * This file serves as the main entry point for the application
 */

// Configuration
define('BASE_PATH', '/fu');
define('BACKEND_PATH', __DIR__ . '/backend');
define('FRONTEND_PATH', __DIR__ . '/frontend/build');
define('ADMIN_PANEL_PATH', __DIR__ . '/main_admin_panel');

// Get request information
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestPath = parse_url($requestUri, PHP_URL_PATH);

// Remove base path
$route = str_replace(BASE_PATH, '', $requestPath);
$route = trim($route, '/');

// Route the request
routeRequest($route, $requestMethod);

/**
 * Main routing function
 */
function routeRequest($route, $method) {
    // API Routes - Backend PHP
    if (strpos($route, 'backend/api/') === 0 || strpos($route, 'api/') === 0) {
        handleApiRequest($route, $method);
        return;
    }
    
    // Admin Panel Routes - Angular
    if (strpos($route, 'admin') === 0 || empty($route)) {
        serveAdminPanel($route);
        return;
    }
    
    // Frontend Routes - React
    if (strpos($route, 'app') === 0 || strpos($route, 'frontend') === 0) {
        serveFrontend($route);
        return;
    }
    
    // Health check
    if ($route === 'health') {
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'ok',
            'timestamp' => date('Y-m-d H:i:s'),
            'services' => [
                'backend' => file_exists(BACKEND_PATH) ? 'online' : 'offline',
                'frontend' => file_exists(FRONTEND_PATH) ? 'online' : 'offline',
                'admin_panel' => file_exists(ADMIN_PANEL_PATH) ? 'online' : 'offline'
            ]
        ]);
        return;
    }
    
    // Default to admin panel
    serveAdminPanel('');
}

/**
 * Handle API requests - Route to PHP Backend
 */
function handleApiRequest($route, $method) {
    // Extract the API endpoint
    $apiRoute = str_replace('backend/api/', '', $route);
    $apiRoute = str_replace('api/', '', $apiRoute);
    
    // Build the backend file path
    $backendFile = BACKEND_PATH . '/api/' . $apiRoute;
    
    // If no file extension, try common API files
    if (!pathinfo($backendFile, PATHINFO_EXTENSION)) {
        $possibleFiles = [
            $backendFile . '.php',
            BACKEND_PATH . '/api/' . explode('/', $apiRoute)[0] . '.php'
        ];
        
        foreach ($possibleFiles as $file) {
            if (file_exists($file)) {
                $backendFile = $file;
                break;
            }
        }
    }
    
    // Check if backend file exists
    if (file_exists($backendFile)) {
        // Set CORS headers for API requests
        setCorsHeaders();
        
        // Include and execute the backend API
        require_once $backendFile;
    } else {
        // API endpoint not found
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'API endpoint not found',
            'requested' => $route,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
}

/**
 * Serve Angular Admin Panel
 */
function serveAdminPanel($route) {
    // Check if we're in development or production
    $isDevelopment = !file_exists(ADMIN_PANEL_PATH . '/dist/admin-panel/browser');
    
    if ($isDevelopment) {
        // Development mode - serve the source index.html with configuration
        $indexPath = ADMIN_PANEL_PATH . '/src/index.html';
        
        if (file_exists($indexPath)) {
            $content = file_get_contents($indexPath);
            
            // Inject configuration
            $config = getAppConfig();
            $configScript = "<script>window.APP_CONFIG = " . json_encode($config) . ";</script>";
            $content = str_replace('</head>', $configScript . '</head>', $content);
            
            // Inject development server message
            $devMessage = "<div style='position:fixed;bottom:10px;right:10px;background:#ff6b6b;color:white;padding:10px;border-radius:5px;z-index:9999;font-family:sans-serif;'>
                Development Mode - Run: cd main_admin_panel && npm start
            </div>";
            $content = str_replace('</body>', $devMessage . '</body>', $content);
            
            header('Content-Type: text/html; charset=UTF-8');
            echo $content;
        } else {
            showError('Admin panel not found. Please build the Angular application.');
        }
    } else {
        // Production mode - serve built files
        $buildPath = ADMIN_PANEL_PATH . '/dist/admin-panel/browser';
        serveStaticFiles($buildPath, $route, 'index.html');
    }
}

/**
 * Serve React Frontend
 */
function serveFrontend($route) {
    // Remove 'frontend' or 'app' prefix
    $route = str_replace(['frontend/', 'app/'], '', $route);
    
    // Check if build exists
    if (!file_exists(FRONTEND_PATH)) {
        showError('Frontend not found. Please build the React application: cd frontend && npm run build');
        return;
    }
    
    // Serve static files or index.html
    serveStaticFiles(FRONTEND_PATH, $route, 'index.html');
}

/**
 * Serve static files with fallback to index
 */
function serveStaticFiles($basePath, $route, $fallbackFile) {
    $filePath = $basePath . '/' . $route;
    
    // If route is empty, serve index
    if (empty($route)) {
        $filePath = $basePath . '/' . $fallbackFile;
    }
    
    // Serve file if it exists
    if (file_exists($filePath) && is_file($filePath)) {
        $extension = pathinfo($filePath, PATHINFO_EXTENSION);
        $contentType = getContentType($extension);
        
        header('Content-Type: ' . $contentType);
        readfile($filePath);
        return;
    }
    
    // Fallback to index for SPA routing
    $indexPath = $basePath . '/' . $fallbackFile;
    if (file_exists($indexPath)) {
        $content = file_get_contents($indexPath);
        
        // Inject configuration
        $config = getAppConfig();
        $configScript = "<script>window.APP_CONFIG = " . json_encode($config) . ";</script>";
        $content = str_replace('</head>', $configScript . '</head>', $content);
        
        header('Content-Type: text/html; charset=UTF-8');
        echo $content;
    } else {
        showError('Application not found');
    }
}

/**
 * Get application configuration
 */
function getAppConfig() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $basePath = BASE_PATH;
    
    return [
        'API_BASE_URL' => "$protocol://$host$basePath/backend/api",
        'BACKEND_URL' => "$protocol://$host$basePath/backend",
        'ADMIN_URL' => "$protocol://$host$basePath/admin",
        'FRONTEND_URL' => "$protocol://$host$basePath/app",
        'BASE_PATH' => $basePath,
        'NODE_ENV' => 'production',
        'timestamp' => date('Y-m-d H:i:s')
    ];
}

/**
 * Set CORS headers
 */
function setCorsHeaders() {
    $allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:4200',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:4200',
    ];
    
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header("Access-Control-Allow-Origin: *");
    }
    
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Allow-Credentials: true");
    
    // Handle preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

/**
 * Get content type by extension
 */
function getContentType($extension) {
    $mimeTypes = [
        'html' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'json' => 'application/json',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon',
        'avif' => 'image/avif',
        'webp' => 'image/webp',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'eot' => 'application/vnd.ms-fontobject'
    ];
    
    return $mimeTypes[$extension] ?? 'application/octet-stream';
}

/**
 * Show error page
 */
function showError($message) {
    http_response_code(500);
    header('Content-Type: text/html; charset=UTF-8');
    echo "<!DOCTYPE html>
<html>
<head>
    <title>Application Error</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .error-container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            max-width: 500px;
            text-align: center;
        }
        h1 {
            color: #e74c3c;
            margin-top: 0;
        }
        p {
            color: #555;
            line-height: 1.6;
        }
        .instructions {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-top: 20px;
            text-align: left;
        }
        code {
            background: #e9ecef;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <div class='error-container'>
        <h1>⚠️ Application Error</h1>
        <p><strong>$message</strong></p>
        <div class='instructions'>
            <h3>Setup Instructions:</h3>
            <ol>
                <li>Frontend: <code>cd frontend && npm install && npm run build</code></li>
                <li>Admin Panel: <code>cd main_admin_panel && npm install && npm run build</code></li>
                <li>Backend: Ensure PHP and MySQL are running</li>
            </ol>
        </div>
    </div>
</body>
</html>";
}
