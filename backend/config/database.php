<?php

require_once __DIR__ . '/config.php'; // loads .env

class Database {
    private $host;
    private $database_name;
    private $username;
    private $password;
    private $charset;
    
    public $conn;

    public function __construct() {
        $this->host          = Config::getDBHost();
        $this->database_name = Config::getDBName();
        $this->username      = Config::getDBUser();
        $this->password      = Config::getDBPass();
        $this->charset       = Config::getDBCharset();
    }
    
    public function getConnection() {
        $this->conn = null;
        
        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->database_name . ";charset=" . $this->charset;
            
            $this->conn = new PDO($dsn, $this->username, $this->password);
            
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
        } catch(PDOException $exception) {
            // Log the error but don't output it
            error_log("Database Connection Error: " . $exception->getMessage());
            // Return null and let the calling code handle it
            return null;
        }
        
        return $this->conn;
    }
    
    public function closeConnection() {
        $this->conn = null;
    }
}
?>
