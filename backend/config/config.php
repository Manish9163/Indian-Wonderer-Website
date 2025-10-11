<?php

class Config {
    const DB_HOST = 'localhost';
    const DB_NAME = 'indian_wonderer_base';
    const DB_USER = 'root';
    const DB_PASS = '';
    const DB_CHARSET = 'utf8mb4';
    
    const JWT_SECRET = 'indianwonderer_jwt_secret_key_2025';
    const SESSION_LIFETIME = 86400;
    const OTP_EXPIRY = 300; 
    const MAX_LOGIN_ATTEMPTS = 5;
    
    const SMS_API_URL = 'https://2factor.in/API/V1/';
    const SMS_API_KEY = 'your_sms_api_key';
    
    const RAZORPAY_KEY_ID = 'your_razorpay_key_id';
    const RAZORPAY_KEY_SECRET = 'your_razorpay_key_secret';
    
    const UPLOAD_PATH = '../uploads/';
    const MAX_FILE_SIZE = 5242880; // 5MB
    const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const ALLOWED_DOC_TYPES = ['pdf', 'doc', 'docx'];
    
    const SITE_URL = 'http://localhost/fu/frontend';
    const API_URL = 'http://localhost/fu/backend/api';
    const ADMIN_URL = 'http://localhost/fu/backend/admin';
    
    const SMTP_HOST = 'smtp.gmail.com';
    const SMTP_PORT = 587;
    const SMTP_USERNAME = 'your_email@gmail.com';
    const SMTP_PASSWORD = 'your_app_password';
    const FROM_EMAIL = 'noreply@indianwonderer.com';
    const FROM_NAME = 'Indian Wonderer';
    
    const API_RATE_LIMIT = 100; 
    const OTP_RATE_LIMIT = 5; 
    
    const TIMEZONE = 'Asia/Kolkata';
    const DATE_FORMAT = 'Y-m-d H:i:s';
    const CURRENCY = 'INR';
    const CURRENCY_SYMBOL = '₹';
    
    const DEFAULT_PAGE_SIZE = 20;
    const MAX_PAGE_SIZE = 100;
    
    const CACHE_ENABLED = true;
    const CACHE_LIFETIME = 3600;
    
    public static function get($key, $default = null) {
        return defined("self::$key") ? constant("self::$key") : $default;
    }
}

date_default_timezone_set(Config::TIMEZONE);

if ($_SERVER['SERVER_NAME'] === 'localhost') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}
?>
