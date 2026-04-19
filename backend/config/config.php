<?php

/**
 * Central Configuration - Indian Wonderer
 * 
 * Loads .env and provides getEnv() for the entire application.
 * All sensitive values are read from .env — never hardcoded.
 */

// ── Load .env once ──────────────────────────────────────────────
if (!function_exists('_iw_load_env')) {
    function _iw_load_env() {
        static $loaded = false;
        if ($loaded) return;

        $envPath = __DIR__ . '/../../.env';
        if (!file_exists($envPath)) return;

        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') continue;
            if (strpos($line, '=') === false) continue;

            [$name, $value] = explode('=', $line, 2);
            $name  = trim($name);
            $value = trim($value);

            if (!empty($name)) {
                putenv("{$name}={$value}");
                $_ENV[$name]    = $value;
                $_SERVER[$name] = $value;
            }
        }
        $loaded = true;
    }
    _iw_load_env();
}

class Config {

    // ── Helper: read from environment with fallback ──────────────
    public static function getEnv($key, $default = null) {
        $val = getenv($key);
        return ($val !== false && $val !== '') ? $val : $default;
    }

    // ── Database (from .env) ─────────────────────────────────────
    public static function getDBHost()    { return self::getEnv('DB_HOST',    'localhost'); }
    public static function getDBName()    { return self::getEnv('DB_NAME',    'indian_wonderer_base'); }
    public static function getDBUser()    { return self::getEnv('DB_USER',    'root'); }
    public static function getDBPass()    { return self::getEnv('DB_PASS',    ''); }
    public static function getDBCharset() { return self::getEnv('DB_CHARSET', 'utf8mb4'); }

    public static function getDBConfig() {
        return [
            'host'    => self::getDBHost(),
            'name'    => self::getDBName(),
            'user'    => self::getDBUser(),
            'pass'    => self::getDBPass(),
            'charset' => self::getDBCharset()
        ];
    }

    // ── Security (from .env) ─────────────────────────────────────
    public static function getJWTSecret() {
        return self::getEnv('JWT_SECRET', 'CHANGE_ME_IN_ENV');
    }

    // ── Session & Auth ───────────────────────────────────────────
    const SESSION_LIFETIME  = 86400;
    const OTP_EXPIRY        = 300;
    const MAX_LOGIN_ATTEMPTS = 5;

    // ── SMS API (from .env) ──────────────────────────────────────
    public static function getSmsApiUrl() { return self::getEnv('SMS_API_URL', 'https://2factor.in/API/V1/'); }
    public static function getSmsApiKey() { return self::getEnv('SMS_API_KEY', ''); }

    // ── Payment — Razorpay (from .env) ───────────────────────────
    public static function getRazorpayKeyId()     { return self::getEnv('RAZORPAY_KEY_ID',     ''); }
    public static function getRazorpayKeySecret()  { return self::getEnv('RAZORPAY_KEY_SECRET', ''); }

    // ── Upload ───────────────────────────────────────────────────
    const UPLOAD_PATH        = '../uploads/';
    const MAX_FILE_SIZE      = 5242880; // 5 MB
    const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const ALLOWED_DOC_TYPES   = ['pdf', 'doc', 'docx'];

    // ── URLs (from .env) ─────────────────────────────────────────
    public static function getSiteUrl()  { return self::getEnv('SITE_URL',  'http://localhost/fu/frontend'); }
    public static function getApiUrl()   { return self::getEnv('API_URL',   'http://localhost/fu/backend/api'); }
    public static function getAdminUrl() { return self::getEnv('ADMIN_URL', 'http://localhost/fu/backend/admin'); }

    // ── SMTP (from .env) ─────────────────────────────────────────
    public static function getSmtpHost()     { return self::getEnv('SMTP_HOST',       'smtp.gmail.com'); }
    public static function getSmtpPort()     { return (int) self::getEnv('SMTP_PORT',  587); }
    public static function getSmtpUsername()  { return self::getEnv('SMTP_USERNAME',   ''); }
    public static function getSmtpPassword()  { return self::getEnv('SMTP_PASSWORD',   ''); }
    public static function getFromEmail()     { return self::getEnv('FROM_EMAIL',      'noreply@indianwonderer.com'); }
    public static function getFromName()      { return self::getEnv('FROM_NAME',       'Indian Wonderer'); }

    // ── Rate limits ──────────────────────────────────────────────
    const API_RATE_LIMIT = 100;
    const OTP_RATE_LIMIT = 5;

    // ── Locale / Display ─────────────────────────────────────────
    const TIMEZONE        = 'Asia/Kolkata';
    const DATE_FORMAT     = 'Y-m-d H:i:s';
    const CURRENCY        = 'INR';
    const CURRENCY_SYMBOL = '₹';

    // ── Pagination ───────────────────────────────────────────────
    const DEFAULT_PAGE_SIZE = 20;
    const MAX_PAGE_SIZE     = 100;

    // ── Cache ────────────────────────────────────────────────────
    const CACHE_ENABLED  = true;
    const CACHE_LIFETIME = 3600;

    // ── Legacy accessor (kept for backward-compat) ───────────────
    public static function get($key, $default = null) {
        // Try .env first
        $val = getenv(strtoupper($key));
        if ($val !== false && $val !== '') return $val;

        // Fall back to class constant
        return defined("self::{$key}") ? constant("self::{$key}") : $default;
    }
}

// ── Set timezone ─────────────────────────────────────────────────
date_default_timezone_set(Config::getEnv('TIMEZONE', 'Asia/Kolkata'));

// ── Error display based on environment ───────────────────────────
if (Config::getEnv('DEBUG_MODE', 'false') === 'true') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}
?>
