<?php
/**
 * Unified Application Router
 * Connects Angular Admin Panel, React Frontend, and PHP Backend
 */

header('Content-Type: text/html; charset=UTF-8');

// Get the request path
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$basePath = '/fu/';

// Remove base path
$route = str_replace($basePath, '', $requestPath);
$route = trim($route, '/');

// Route handling
switch (true) {
    // Admin Panel (Angular) Routes
    case (empty($route) || $route === 'admin' || strpos($route, 'admin') === 0):
        serveAdminPanel($route);
        break;
        
    // Frontend (React) Routes  
    case (strpos($route, 'app') === 0 || strpos($route, 'frontend') === 0):
        serveFrontend($route);
        break;
        
    // API Routes (PHP Backend)
    case (strpos($route, 'backend') === 0 || strpos($route, 'api') === 0):
        serveBackend($route);
        break;
        
    // Default to admin panel
    default:
        serveAdminPanel('');
        break;
}

/**
 * Serve Angular Admin Panel
 */
function serveAdminPanel($route) {
    $adminIndexPath = __DIR__ . '/main_admin_panel/src/index.html';
    
    if (file_exists($adminIndexPath)) {
        // Read the admin panel HTML
        $content = file_get_contents($adminIndexPath);
        
        // Inject base path configuration
        $baseConfig = "
        <script>
            window.APP_CONFIG = {
                environment: 'production',
                apiUrl: '/fu/backend/api',
                backendUrl: '/fu/backend',
                frontendUrl: '/fu/frontend',
                basePath: '/fu/',
                currentApp: 'admin'
            };
        </script>";
        
        // Insert before closing head tag
        $content = str_replace('</head>', $baseConfig . '</head>', $content);
        
        // Update base href
        $content = str_replace('<base href="/">', '<base href="/fu/admin/">', $content);
        
        echo $content;
    } else {
        // Fallback admin interface
        echo getAdminFallback();
    }
}

/**
 * Serve React Frontend
 */
function serveFrontend($route) {
    $frontendIndexPath = __DIR__ . '/frontend/public/index.html';
    
    if (file_exists($frontendIndexPath)) {
        // Read the frontend HTML
        $content = file_get_contents($frontendIndexPath);
        
        // Inject configuration
        $frontendConfig = "
        <script>
            window.REACT_APP_CONFIG = {
                API_BASE_URL: '/fu/backend/api',
                BACKEND_URL: '/fu/backend',
                ADMIN_URL: '/fu/admin',
                basePath: '/fu/app/',
                currentApp: 'frontend'
            };
        </script>";
        
        // Insert before closing head tag
        $content = str_replace('</head>', $frontendConfig . '</head>', $content);
        
        echo $content;
    } else {
        // Fallback frontend interface
        echo getFrontendFallback();
    }
}

/**
 * Serve PHP Backend
 */
function serveBackend($route) {
    // Clean the route for backend
    $backendRoute = str_replace(['backend/', 'api/'], '', $route);
    
    // Include the gateway
    require_once __DIR__ . '/backend/gateway.php';
}

/**
 * Admin Panel Fallback
 */
function getAdminFallback() {
    return '
    <!DOCTYPE html>
    <html>
    <head>
        <title>Indian Wonderer - Admin Panel</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .nav-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 30px; }
            .nav-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-decoration: none; transition: transform 0.3s; }
            .nav-card:hover { transform: translateY(-5px); }
            .nav-card h3 { margin: 0 0 10px 0; }
            .nav-card p { margin: 0; opacity: 0.9; }
        </style>
        <script>
            window.APP_CONFIG = {
                environment: "production",
                apiUrl: "/fu/backend/api",
                backendUrl: "/fu/backend",
                frontendUrl: "/fu/frontend",
                basePath: "/fu/",
                currentApp: "admin"
            };
        </script>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏛️ Indian Wonderer - Admin Panel</h1>
                <p>Comprehensive Travel Management System</p>
            </div>
            
            <div class="nav-grid">
                <a href="/fu/backend/api/admin_dashboard.php?action=overview" class="nav-card">
                    <h3>📊 Dashboard</h3>
                    <p>Real-time analytics and system overview</p>
                </a>
                
                <a href="/fu/backend/api/admin_tours.php" class="nav-card">
                    <h3>🗺️ Tour Management</h3>
                    <p>Create, edit, and manage tour packages</p>
                </a>
                
                <a href="/fu/backend/api/admin_users.php" class="nav-card">
                    <h3>👥 User Management</h3>
                    <p>Manage customers, agents, and staff</p>
                </a>
                
                <a href="/fu/backend/api/admin_bookings.php" class="nav-card">
                    <h3>📋 Booking Management</h3>
                    <p>Handle reservations and payments</p>
                </a>
                
                <a href="/fu/backend/api/admin_analytics.php?action=dashboard" class="nav-card">
                    <h3>📈 Analytics</h3>
                    <p>Business insights and reports</p>
                </a>
                
                <a href="/fu/frontend" class="nav-card">
                    <h3>🌐 Customer Portal</h3>
                    <p>View customer-facing website</p>
                </a>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666;">
                <p>Production-ready admin system with comprehensive management tools</p>
                <p><strong>API Gateway:</strong> <a href="/fu/backend/gateway.php">/fu/backend/gateway.php</a></p>
            </div>
        </div>
    </body>
    </html>';
}

/**
 * Frontend Fallback
 */
function getFrontendFallback() {
    return '
    <!DOCTYPE html>
    <html>
    <head>
        <title>Indian Wonderer - Travel Portal</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 0 30px rgba(0,0,0,0.2); }
            .header { text-align: center; margin-bottom: 40px; }
            .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 30px; }
            .feature { background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #667eea; }
            .cta { text-align: center; margin-top: 40px; }
            .btn { background: #667eea; color: white; padding: 12px 30px; border: none; border-radius: 25px; text-decoration: none; display: inline-block; transition: all 0.3s; }
            .btn:hover { background: #764ba2; transform: translateY(-2px); }
        </style>
        <script>
            window.REACT_APP_CONFIG = {
                API_BASE_URL: "/fu/backend/api",
                BACKEND_URL: "/fu/backend",
                ADMIN_URL: "/fu/admin",
                basePath: "/fu/app/",
                currentApp: "frontend"
            };
        </script>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌟 Welcome to Indian Wonderer</h1>
                <p>Discover the Magic of India with Our Expert Travel Services</p>
            </div>
            
            <div class="features">
                <div class="feature">
                    <h3>🏛️ Cultural Tours</h3>
                    <p>Explore India\'s rich heritage with our curated cultural experiences</p>
                </div>
                
                <div class="feature">
                    <h3>🏔️ Adventure Tours</h3>
                    <p>Thrilling adventures in the Himalayas and beyond</p>
                </div>
                
                <div class="feature">
                    <h3>🌴 Nature Escapes</h3>
                    <p>Serene backwaters, beaches, and wildlife sanctuaries</p>
                </div>
                
                <div class="feature">
                    <h3>🏰 Royal Experiences</h3>
                    <p>Palace stays and royal heritage tours</p>
                </div>
            </div>
            
            <div class="cta">
                <a href="/fu/backend/api/tours.php" class="btn">Explore Tours</a>
                <a href="/fu/admin" class="btn">Admin Portal</a>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666;">
                <p>Powered by advanced booking system with real-time availability</p>
            </div>
        </div>
    </body>
    </html>';
}
?>
