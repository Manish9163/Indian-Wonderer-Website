<?php

class Tours {
    private $conn;
    private $table_name = "tours";
    
    public $id;
    public $title;
    public $description;
    public $destination;
    public $price;
    public $duration_days;
    public $max_capacity;
    public $category;
    public $difficulty_level;
    public $image_url;
    public $gallery;
    public $features;
    public $inclusions;
    public $exclusions;
    public $is_active;
    public $created_by;
    public $created_at;
    public $updated_at;
    
    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (title, description, destination, price, duration_days, max_capacity, 
                   category, difficulty_level, image_url, gallery, features, inclusions, 
                   exclusions, created_by) 
                  VALUES (:title, :description, :destination, :price, :duration_days, 
                          :max_capacity, :category, :difficulty_level, :image_url, 
                          :gallery, :features, :inclusions, :exclusions, :created_by)";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':destination', $this->destination);
        $stmt->bindParam(':price', $this->price);
        $stmt->bindParam(':duration_days', $this->duration_days);
        $stmt->bindParam(':max_capacity', $this->max_capacity);
        $stmt->bindParam(':category', $this->category);
        $stmt->bindParam(':difficulty_level', $this->difficulty_level);
        $stmt->bindParam(':image_url', $this->image_url);
        $stmt->bindParam(':gallery', json_encode($this->gallery));
        $stmt->bindParam(':features', json_encode($this->features));
        $stmt->bindParam(':inclusions', json_encode($this->inclusions));
        $stmt->bindParam(':exclusions', json_encode($this->exclusions));
        $stmt->bindParam(':created_by', $this->created_by);
        
        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        
        return false;
    }
    

    public function getAllTours($filters = [], $limit = 20, $offset = 0) {
        $query = "SELECT t.*, 
                         u.first_name as creator_name,
                         (SELECT COUNT(*) FROM bookings WHERE tour_id = t.id) as total_bookings,
                         (SELECT AVG(rating) FROM reviews WHERE tour_id = t.id) as avg_rating
                  FROM " . $this->table_name . " t
                  LEFT JOIN users u ON t.created_by = u.id
                  WHERE t.is_active = 1";
        
        $params = [];
        
        if (isset($filters['destination']) && !empty($filters['destination'])) {
            $query .= " AND t.destination LIKE :destination";
            $params[':destination'] = '%' . $filters['destination'] . '%';
        }
        
        if (isset($filters['category']) && !empty($filters['category'])) {
            $query .= " AND t.category = :category";
            $params[':category'] = $filters['category'];
        }
        
        if (isset($filters['min_price']) && is_numeric($filters['min_price'])) {
            $query .= " AND t.price >= :min_price";
            $params[':min_price'] = $filters['min_price'];
        }
        
        if (isset($filters['max_price']) && is_numeric($filters['max_price'])) {
            $query .= " AND t.price <= :max_price";
            $params[':max_price'] = $filters['max_price'];
        }
        
        if (isset($filters['duration_days']) && is_numeric($filters['duration_days'])) {
            $query .= " AND t.duration_days = :duration_days";
            $params[':duration_days'] = $filters['duration_days'];
        }
        
        if (isset($filters['difficulty_level']) && !empty($filters['difficulty_level'])) {
            $query .= " AND t.difficulty_level = :difficulty_level";
            $params[':difficulty_level'] = $filters['difficulty_level'];
        }
        
        $query .= " ORDER BY t.created_at DESC LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        
        $stmt->execute();
        
        $tours = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($tours as &$tour) {
            $tour['gallery'] = json_decode($tour['gallery'], true) ?: [];
            $tour['features'] = json_decode($tour['features'], true) ?: [];
            $tour['inclusions'] = json_decode($tour['inclusions'], true) ?: [];
            $tour['exclusions'] = json_decode($tour['exclusions'], true) ?: [];
            $tour['avg_rating'] = round($tour['avg_rating'], 1);
        }
        
        return $tours;
    }
    

    public function getTourById($id) {
        $query = "SELECT t.*, 
                         u.first_name as creator_name,
                         (SELECT COUNT(*) FROM bookings WHERE tour_id = t.id) as total_bookings,
                         (SELECT AVG(rating) FROM reviews WHERE tour_id = t.id) as avg_rating,
                         (SELECT COUNT(*) FROM reviews WHERE tour_id = t.id) as review_count
                  FROM " . $this->table_name . " t
                  LEFT JOIN users u ON t.created_by = u.id
                  WHERE t.id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $tour = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $tour['gallery'] = json_decode($tour['gallery'], true) ?: [];
            $tour['features'] = json_decode($tour['features'], true) ?: [];
            $tour['inclusions'] = json_decode($tour['inclusions'], true) ?: [];
            $tour['exclusions'] = json_decode($tour['exclusions'], true) ?: [];
            $tour['avg_rating'] = round($tour['avg_rating'], 1);
            
            return $tour;
        }
        
        return false;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET title = :title, description = :description, destination = :destination,
                      price = :price, duration_days = :duration_days, max_capacity = :max_capacity,
                      category = :category, difficulty_level = :difficulty_level, 
                      image_url = :image_url, gallery = :gallery, features = :features,
                      inclusions = :inclusions, exclusions = :exclusions
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':destination', $this->destination);
        $stmt->bindParam(':price', $this->price);
        $stmt->bindParam(':duration_days', $this->duration_days);
        $stmt->bindParam(':max_capacity', $this->max_capacity);
        $stmt->bindParam(':category', $this->category);
        $stmt->bindParam(':difficulty_level', $this->difficulty_level);
        $stmt->bindParam(':image_url', $this->image_url);
        $stmt->bindParam(':gallery', json_encode($this->gallery));
        $stmt->bindParam(':features', json_encode($this->features));
        $stmt->bindParam(':inclusions', json_encode($this->inclusions));
        $stmt->bindParam(':exclusions', json_encode($this->exclusions));
        $stmt->bindParam(':id', $this->id);
        
        return $stmt->execute();
    }

    public function delete($id) {
        $query = "UPDATE " . $this->table_name . " SET is_active = 0 WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }
    

    public function getPopularTours($limit = 10) {
        $query = "SELECT t.*, 
                         (SELECT COUNT(*) FROM bookings WHERE tour_id = t.id) as booking_count,
                         (SELECT AVG(rating) FROM reviews WHERE tour_id = t.id) as avg_rating
                  FROM " . $this->table_name . " t
                  WHERE t.is_active = 1
                  ORDER BY booking_count DESC, avg_rating DESC
                  LIMIT :limit";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        $tours = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($tours as &$tour) {
            $tour['gallery'] = json_decode($tour['gallery'], true) ?: [];
            $tour['features'] = json_decode($tour['features'], true) ?: [];
            $tour['avg_rating'] = round($tour['avg_rating'], 1);
        }
        
        return $tours;
    }

    public function getTourStats() {
        $stats = [];
        
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name . " WHERE is_active = 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $stats['total_tours'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        $query = "SELECT category, COUNT(*) as count FROM " . $this->table_name . " 
                  WHERE is_active = 1 GROUP BY category";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $stats['tours_by_category'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $query = "SELECT AVG(price) as avg_price FROM " . $this->table_name . " WHERE is_active = 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $stats['average_price'] = round($stmt->fetch(PDO::FETCH_ASSOC)['avg_price'], 2);
        
        return $stats;
    }
    

    public function searchTours($search_term, $limit = 20) {
        $query = "SELECT t.*, 
                         (SELECT AVG(rating) FROM reviews WHERE tour_id = t.id) as avg_rating
                  FROM " . $this->table_name . " t
                  WHERE t.is_active = 1 
                  AND (t.title LIKE :search OR t.description LIKE :search OR t.destination LIKE :search)
                  ORDER BY t.created_at DESC
                  LIMIT :limit";
        
        $stmt = $this->conn->prepare($query);
        $search_param = '%' . $search_term . '%';
        $stmt->bindParam(':search', $search_param);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        $tours = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($tours as &$tour) {
            $tour['gallery'] = json_decode($tour['gallery'], true) ?: [];
            $tour['features'] = json_decode($tour['features'], true) ?: [];
            $tour['avg_rating'] = round($tour['avg_rating'], 1);
        }
        
        return $tours;
    }
}
?>
