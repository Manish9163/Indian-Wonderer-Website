<?php
/**
 * Production Admin Configuration
 * Environment-specific settings for production deployment
 */

class AdminConfig {
    
    // Environment settings
    const ENVIRONMENT = 'production'; // development, staging, production
    const DEBUG_MODE = false;
    const LOG_LEVEL = 'info'; // debug, info, warning, error
    
    // Security settings
    const JWT_SECRET = 'your_production_jwt_secret_key_here'; // Change this in production
    const JWT_EXPIRY = 3600; // 1 hour
    const REFRESH_TOKEN_EXPIRY = 2592000; // 30 days
    const RATE_LIMIT_ATTEMPTS = 10;
    const RATE_LIMIT_WINDOW = 900; // 15 minutes
    const SESSION_TIMEOUT = 3600; // 1 hour
    
    // Database settings
    const DB_HOST = 'localhost';
    const DB_NAME = 'indian_wonderer_base';
    const DB_USER = 'root';
    const DB_PASS = '';
    const DB_CHARSET = 'utf8mb4';
    
    // Admin settings
    const ADMIN_EMAIL = 'admin@indianwonderer.com';
    const SUPER_ADMIN_ROLE = 'admin';
    const DEFAULT_ADMIN_PASSWORD = 'Admin@123!'; // Change immediately after setup
    
    // Application settings
    const APP_NAME = 'Indian Wonderer Admin';
    const APP_VERSION = '2.0.0';
    const API_VERSION = 'v2';
    const TIMEZONE = 'Asia/Kolkata';
    
    // File upload settings
    const MAX_FILE_SIZE = 10485760; // 10MB
    const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'webp'];
    const UPLOAD_PATH = '/uploads/';
    
    // Email settings (configure for production)
    const SMTP_HOST = 'smtp.gmail.com';
    const SMTP_PORT = 587;
    const SMTP_USERNAME = 'your_email@gmail.com';
    const SMTP_PASSWORD = 'your_app_password';
    const SMTP_ENCRYPTION = 'tls';
    
    // Notification settings
    const ENABLE_EMAIL_NOTIFICATIONS = true;
    const ENABLE_SMS_NOTIFICATIONS = false;
    const ENABLE_PUSH_NOTIFICATIONS = true;
    
    // Analytics settings
    const ENABLE_ANALYTICS = true;
    const ANALYTICS_RETENTION_DAYS = 365;
    const ENABLE_PERFORMANCE_MONITORING = true;
    
    // Cache settings
    const ENABLE_CACHE = true;
    const CACHE_TTL = 3600; // 1 hour
    const CACHE_PREFIX = 'iwonder_';
    
    // Backup settings
    const ENABLE_AUTO_BACKUP = true;
    const BACKUP_FREQUENCY = 'daily'; // hourly, daily, weekly
    const BACKUP_RETENTION_DAYS = 30;
    const BACKUP_PATH = '/backups/';
    
    // API Rate limiting
    const API_RATE_LIMIT = 1000; // requests per hour per IP
    const ADMIN_API_RATE_LIMIT = 5000; // requests per hour for admin users
    
    // Monitoring settings
    const HEALTH_CHECK_INTERVAL = 300; // 5 minutes
    const ALERT_EMAIL = 'admin@indianwonderer.com';
    const DISK_SPACE_THRESHOLD = 85; // percent
    const MEMORY_THRESHOLD = 80; // percent
    
    // Business settings
    const DEFAULT_CURRENCY = 'USD';
    const SUPPORTED_CURRENCIES = ['USD', 'INR', 'EUR', 'GBP'];
    const TAX_RATE = 0.18; // 18% GST for India
    const COMMISSION_RATE = 0.10; // 10% commission
    
    // Feature flags
    const FEATURES = [
        'advanced_analytics' => true,
        'real_time_dashboard' => true,
        'bulk_operations' => true,
        'user_impersonation' => true,
        'audit_logging' => true,
        'automated_backups' => true,
        'multi_language' => false,
        'multi_currency' => true,
        'social_login' => false,
        'two_factor_auth' => false
    ];
    
    // Dashboard widgets configuration
    const DASHBOARD_WIDGETS = [
        'overview_metrics' => true,
        'revenue_chart' => true,
        'booking_trends' => true,
        'top_tours' => true,
        'recent_bookings' => true,
        'user_analytics' => true,
        'system_health' => true,
        'quick_actions' => true,
        'notifications' => true,
        'activity_feed' => true
    ];
    
    // Permission matrix
    const PERMISSIONS = [
        'admin' => [
            'dashboard' => ['view', 'export'],
            'tours' => ['create', 'read', 'update', 'delete', 'analytics'],
            'users' => ['create', 'read', 'update', 'delete', 'impersonate'],
            'bookings' => ['create', 'read', 'update', 'delete', 'confirm', 'cancel'],
            'payments' => ['read', 'update', 'refund', 'analytics'],
            'analytics' => ['view', 'export', 'configure'],
            'system' => ['settings', 'logs', 'backup', 'health']
        ],
        'guide' => [
            'dashboard' => ['view'],
            'tours' => ['read', 'update_assigned'],
            'bookings' => ['read', 'update_assigned'],
            'users' => ['read_customers'],
            'payments' => ['read_assigned']
        ],
        'customer' => [
            'tours' => ['read'],
            'bookings' => ['create', 'read_own', 'update_own'],
            'profile' => ['read', 'update']
        ]
    ];
    
    /**
     * Get configuration value
     */
    public static function get($key, $default = null) {
        return defined("self::$key") ? constant("self::$key") : $default;
    }
    
    /**
     * Check if feature is enabled
     */
    public static function isFeatureEnabled($feature) {
        return self::FEATURES[$feature] ?? false;
    }
    
    /**
     * Get user permissions
     */
    public static function getUserPermissions($role) {
        return self::PERMISSIONS[$role] ?? [];
    }
    
    /**
     * Check user permission
     */
    public static function hasPermission($role, $resource, $action) {
        $permissions = self::getUserPermissions($role);
        return isset($permissions[$resource]) && in_array($action, $permissions[$resource]);
    }
    
    /**
     * Get database configuration
     */
    public static function getDatabaseConfig() {
        return [
            'host' => self::DB_HOST,
            'dbname' => self::DB_NAME,
            'username' => self::DB_USER,
            'password' => self::DB_PASS,
            'charset' => self::DB_CHARSET,
            'options' => [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        ];
    }
    
    /**
     * Get email configuration
     */
    public static function getEmailConfig() {
        return [
            'host' => self::SMTP_HOST,
            'port' => self::SMTP_PORT,
            'username' => self::SMTP_USERNAME,
            'password' => self::SMTP_PASSWORD,
            'encryption' => self::SMTP_ENCRYPTION
        ];
    }
    
    /**
     * Get application info
     */
    public static function getAppInfo() {
        return [
            'name' => self::APP_NAME,
            'version' => self::APP_VERSION,
            'api_version' => self::API_VERSION,
            'environment' => self::ENVIRONMENT,
            'timezone' => self::TIMEZONE,
            'debug_mode' => self::DEBUG_MODE
        ];
    }
    
    /**
     * Validate configuration
     */
    public static function validate() {
        $errors = [];
        
        // Check required settings
        if (self::JWT_SECRET === 'your_production_jwt_secret_key_here') {
            $errors[] = 'JWT secret key must be changed for production';
        }
        
        if (self::ENVIRONMENT === 'production' && self::DEBUG_MODE) {
            $errors[] = 'Debug mode should be disabled in production';
        }
        
        if (empty(self::ADMIN_EMAIL) || !filter_var(self::ADMIN_EMAIL, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Valid admin email is required';
        }
        
        return $errors;
    }
    
    /**
     * Initialize application settings
     */
    public static function initialize() {
        // Set timezone
        date_default_timezone_set(self::TIMEZONE);
        
        // Set error reporting based on environment
        if (self::ENVIRONMENT === 'production') {
            error_reporting(0);
            ini_set('display_errors', 0);
            ini_set('log_errors', 1);
        } else {
            error_reporting(E_ALL);
            ini_set('display_errors', 1);
        }
        
        // Set memory limit
        ini_set('memory_limit', '256M');
        
        // Set execution time
        set_time_limit(300); // 5 minutes for admin operations
        
        return true;
    }
}

// Initialize configuration
AdminConfig::initialize();
