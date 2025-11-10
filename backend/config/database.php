<?php

class Database {
    private $host = "localhost";
    private $database_name = "indian_wonderer_base";
    private $username = "root";
    private $password = "";  
    private $charset = "utf8mb4";
    
    public $conn;
    
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
