<?php


define('BASE_URL', 'http://localhost/fu/backend');
define('API_BASE_URL', BASE_URL . '/api');

class Endpoints {
    const BASE = 'http://localhost/fu/backend';
    const API = self::BASE . '/api';
    
    const AUTH_LOGIN = self::API . '/auth.php?action=login';
    const AUTH_REGISTER = self::API . '/auth.php?action=register';
    const AUTH_LOGOUT = self::API . '/auth.php?action=logout';
    const AUTH_PROFILE = self::API . '/auth.php?action=profile';
    
    const TOURS_LIST = self::API . '/tours.php';
    const TOURS_CREATE = self::API . '/tours.php?action=create';
    const TOURS_UPDATE = self::API . '/tours.php?action=update';
    const TOURS_DELETE = self::API . '/tours.php?action=delete';
    const TOURS_BY_ID = self::API . '/tours.php?action=get';
    
    const ITINERARIES_LIST = self::API . '/itineraries.php';
    const ITINERARIES_CREATE = self::API . '/itineraries.php?action=create';
    const ITINERARIES_UPDATE = self::API . '/itineraries.php?action=update';
    const ITINERARIES_DELETE = self::API . '/itineraries.php?action=delete';
    const ITINERARIES_BY_USER = self::API . '/itineraries.php?action=user';
    
    const BOOKINGS_LIST = self::API . '/bookings.php';
    const BOOKINGS_CREATE = self::API . '/bookings.php?action=create';
    const BOOKINGS_UPDATE = self::API . '/bookings.php?action=update';
    const BOOKINGS_DELETE = self::API . '/bookings.php?action=delete';
    const BOOKINGS_BY_USER = self::API . '/bookings.php?action=user';
    
    const CUSTOMERS_LIST = self::API . '/customers.php';
    const CUSTOMERS_CREATE = self::API . '/customers.php?action=create';
    const CUSTOMERS_UPDATE = self::API . '/customers.php?action=update';
    const CUSTOMERS_DELETE = self::API . '/customers.php?action=delete';
    
    const USERS_LIST = self::API . '/users.php';
    const USERS_CREATE = self::API . '/users.php?action=create';
    const USERS_UPDATE = self::API . '/users.php?action=update';
    const USERS_DELETE = self::API . '/users.php?action=delete';
    
    const PAYMENTS_LIST = self::API . '/payments.php';
    const PAYMENTS_CREATE = self::API . '/payments.php?action=create';
    const PAYMENTS_UPDATE = self::API . '/payments.php?action=update';
    const PAYMENTS_VERIFY = self::API . '/payments.php?action=verify';
    
    const ANALYTICS_DASHBOARD = self::API . '/analytics.php?action=dashboard';
    const ANALYTICS_BOOKINGS = self::API . '/analytics.php?action=bookings';
    const ANALYTICS_REVENUE = self::API . '/analytics.php?action=revenue';
    const ANALYTICS_CUSTOMERS = self::API . '/analytics.php?action=customers';
    
    const DASHBOARD_STATS = self::API . '/dashboard.php?action=stats';
    const DASHBOARD_RECENT = self::API . '/dashboard.php?action=recent';
    
    public static function getAllEndpoints() {
        $reflection = new ReflectionClass(__CLASS__);
        return $reflection->getConstants();
    }
    

    public static function isValidEndpoint($url) {
        $endpoints = self::getAllEndpoints();
        return in_array($url, $endpoints);
    }
}

class CorsConfig {
    const ALLOWED_ORIGINS = [
        'http://localhost:3000',   
        'http://localhost:3001',   
        'http://localhost:4200',    
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:4200',
        'http://localhost:5173',   
        'http://127.0.0.1:5173'
    ];
    
    const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
    const ALLOWED_HEADERS = [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'Accept',
        'Origin'
    ];
    
    public static function setCorsHeaders() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:4200';
        

        if (in_array($origin, self::ALLOWED_ORIGINS)) {
            header("Access-Control-Allow-Origin: $origin");
        } else {
            header("Access-Control-Allow-Origin: http://localhost:4200");
        }
        
        header("Access-Control-Allow-Methods: " . implode(', ', self::ALLOWED_METHODS));
        header("Access-Control-Allow-Headers: " . implode(', ', self::ALLOWED_HEADERS));
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Max-Age: 86400");
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }
}
?>
