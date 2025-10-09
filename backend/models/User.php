<?php
/**
 * User Model
 * Handles user authentication, registration, and profile management
 */

class User {
    private $conn;
    private $table_name = "users";
    
    // User properties
    public $id;
    public $username;
    public $email;
    public $password;
    public $first_name;
    public $last_name;
    public $phone;
    public $role;
    public $profile_image;
    public $is_active;
    public $email_verified;
    public $created_at;
    public $updated_at;
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    /**
     * Register new user
     */
    public function register() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (username, email, password, first_name, last_name, phone, role) 
                  VALUES (:username, :email, :password, :first_name, :last_name, :phone, :role)";
        
        $stmt = $this->conn->prepare($query);
        
        // Hash password
        $this->password = password_hash($this->password, PASSWORD_DEFAULT);
        
        $stmt->bindParam(':username', $this->username);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':password', $this->password);
        $stmt->bindParam(':first_name', $this->first_name);
        $stmt->bindParam(':last_name', $this->last_name);
        $stmt->bindParam(':phone', $this->phone);
        $stmt->bindParam(':role', $this->role);
        
        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        
        return false;
    }
    
    /**
     * Login user
     */
    public function login($email, $password) {
        $query = "SELECT id, username, email, password, first_name, last_name, role, is_active 
                  FROM " . $this->table_name . " 
                  WHERE email = :email AND is_active = 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (password_verify($password, $row['password'])) {
                $this->id = $row['id'];
                $this->username = $row['username'];
                $this->email = $row['email'];
                $this->first_name = $row['first_name'];
                $this->last_name = $row['last_name'];
                $this->role = $row['role'];
                
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Get user by ID
     */
    public function getUserById($id) {
        $query = "SELECT id, username, email, first_name, last_name, phone, role, profile_image, 
                         is_active, email_verified, created_at 
                  FROM " . $this->table_name . " 
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        return false;
    }
    
    /**
     * Get all users (admin only)
     */
    public function getAllUsers($role = null, $limit = 50, $offset = 0) {
        $query = "SELECT id, username, email, first_name, last_name, phone, role, 
                         is_active, email_verified, created_at 
                  FROM " . $this->table_name;
        
        if ($role) {
            $query .= " WHERE role = :role";
        }
        
        $query .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        
        if ($role) {
            $stmt->bindParam(':role', $role);
        }
        
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Update user profile
     */
    public function updateProfile() {
        $query = "UPDATE " . $this->table_name . " 
                  SET first_name = :first_name, last_name = :last_name, 
                      phone = :phone, profile_image = :profile_image 
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':first_name', $this->first_name);
        $stmt->bindParam(':last_name', $this->last_name);
        $stmt->bindParam(':phone', $this->phone);
        $stmt->bindParam(':profile_image', $this->profile_image);
        $stmt->bindParam(':id', $this->id);
        
        return $stmt->execute();
    }
    
    /**
     * Change password
     */
    public function changePassword($current_password, $new_password) {
        // First verify current password
        $query = "SELECT password FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (password_verify($current_password, $row['password'])) {
                // Update password
                $query = "UPDATE " . $this->table_name . " SET password = :password WHERE id = :id";
                $stmt = $this->conn->prepare($query);
                
                $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
                $stmt->bindParam(':password', $hashed_password);
                $stmt->bindParam(':id', $this->id);
                
                return $stmt->execute();
            }
        }
        
        return false;
    }
    
    /**
     * Check if email exists
     */
    public function emailExists($email) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE email = :email";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Check if username exists
     */
    public function usernameExists($username) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE username = :username";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Delete user (admin only)
     */
    public function deleteUser($id) {
        $query = "UPDATE " . $this->table_name . " SET is_active = 0 WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }
    
    /**
     * Get user statistics (admin dashboard)
     */
    public function getUserStats() {
        $stats = [];
        
        // Total users
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name . " WHERE is_active = 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $stats['total_users'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // New users this month
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name . " 
                  WHERE is_active = 1 AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $stats['new_users_month'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Users by role
        $query = "SELECT role, COUNT(*) as count FROM " . $this->table_name . " 
                  WHERE is_active = 1 GROUP BY role";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $stats['users_by_role'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return $stats;
    }
}
?>
