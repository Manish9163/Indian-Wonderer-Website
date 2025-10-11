<?php

class Itineraries {
    private $conn;
    private $table_name = "itineraries";
    private $schedule_table = "itinerary_schedule";
    
    public $id;
    public $tour_id;
    public $tour_name;
    public $total_days;
    public $status;
    public $created_by;
    public $created_at;
    public $updated_at;
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
 
    public function create($schedule_data = []) {
        try {
            $this->conn->beginTransaction();
            
            $query = "INSERT INTO " . $this->table_name . " 
                      (tour_id, tour_name, total_days, status, created_by) 
                      VALUES (:tour_id, :tour_name, :total_days, :status, :created_by)";
            
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':tour_id', $this->tour_id);
            $stmt->bindParam(':tour_name', $this->tour_name);
            $stmt->bindParam(':total_days', $this->total_days);
            $stmt->bindParam(':status', $this->status);
            $stmt->bindParam(':created_by', $this->created_by);
            
            if ($stmt->execute()) {
                $this->id = $this->conn->lastInsertId();
                
                if (!empty($schedule_data)) {
                    foreach ($schedule_data as $day) {
                        $this->addScheduleDay($day);
                    }
                }
                
                $this->conn->commit();
                return true;
            }
            
            $this->conn->rollback();
            return false;
            
        } catch (Exception $e) {
            $this->conn->rollback();
            throw $e;
        }
    }

    public function addScheduleDay($day_data) {
        $query = "INSERT INTO " . $this->schedule_table . " 
                  (itinerary_id, day_number, title, description, time_schedule, location, activities) 
                  VALUES (:itinerary_id, :day_number, :title, :description, :time_schedule, :location, :activities)";
        
        $stmt = $this->conn->prepare($query);
        
        $itinerary_id = $this->id;
        $day_number = $day_data['day_number'];
        $title = $day_data['title'];
        $description = $day_data['description'];
        $time_schedule = $day_data['time_schedule'];
        $location = $day_data['location'] ?? '';
        $activities = json_encode($day_data['activities'] ?? []);
        
        $stmt->bindParam(':itinerary_id', $itinerary_id);
        $stmt->bindParam(':day_number', $day_number);
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':time_schedule', $time_schedule);
        $stmt->bindParam(':location', $location);
        $stmt->bindParam(':activities', $activities);
        
        return $stmt->execute();
    }

    public function getAllItineraries($limit = 50, $offset = 0) {
        $query = "SELECT i.*, 
                         u.first_name as creator_name,
                         (SELECT COUNT(*) FROM itinerary_schedule WHERE itinerary_id = i.id) as schedule_count,
                         (SELECT COUNT(*) FROM bookings WHERE itinerary_id = i.id) as booking_count
                  FROM " . $this->table_name . " i
                  LEFT JOIN users u ON i.created_by = u.id
                  ORDER BY i.created_at DESC
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getItineraryById($id) {
        $query = "SELECT i.*, 
                         u.first_name as creator_name,
                         t.title as tour_title, t.destination
                  FROM " . $this->table_name . " i
                  LEFT JOIN users u ON i.created_by = u.id
                  LEFT JOIN tours t ON i.tour_id = t.id
                  WHERE i.id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $itinerary = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $schedule_query = "SELECT * FROM " . $this->schedule_table . " 
                              WHERE itinerary_id = :itinerary_id 
                              ORDER BY day_number";
            
            $schedule_stmt = $this->conn->prepare($schedule_query);
            $schedule_stmt->bindParam(':itinerary_id', $id);
            $schedule_stmt->execute();
            
            $schedule = $schedule_stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($schedule as &$day) {
                $day['activities'] = json_decode($day['activities'], true) ?: [];
            }
            
            $itinerary['schedule'] = $schedule;
            
            return $itinerary;
        }
        
        return false;
    }

    public function update($schedule_data = []) {
        try {
            $this->conn->beginTransaction();
            
            $query = "UPDATE " . $this->table_name . " 
                      SET tour_name = :tour_name, total_days = :total_days, status = :status
                      WHERE id = :id";
            
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':tour_name', $this->tour_name);
            $stmt->bindParam(':total_days', $this->total_days);
            $stmt->bindParam(':status', $this->status);
            $stmt->bindParam(':id', $this->id);
            
            if ($stmt->execute()) {
                if (!empty($schedule_data)) {
                    $delete_query = "DELETE FROM " . $this->schedule_table . " WHERE itinerary_id = :itinerary_id";
                    $delete_stmt = $this->conn->prepare($delete_query);
                    $delete_stmt->bindParam(':itinerary_id', $this->id);
                    $delete_stmt->execute();
                    
                    foreach ($schedule_data as $day) {
                        $this->addScheduleDay($day);
                    }
                }
                
                $this->conn->commit();
                return true;
            }
            
            $this->conn->rollback();
            return false;
            
        } catch (Exception $e) {
            $this->conn->rollback();
            throw $e;
        }
    }

    public function delete($id) {
        try {
            $this->conn->beginTransaction();
            
            $schedule_query = "DELETE FROM " . $this->schedule_table . " WHERE itinerary_id = :itinerary_id";
            $schedule_stmt = $this->conn->prepare($schedule_query);
            $schedule_stmt->bindParam(':itinerary_id', $id);
            $schedule_stmt->execute();
            
            $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                $this->conn->commit();
                return true;
            }
            
            $this->conn->rollback();
            return false;
            
        } catch (Exception $e) {
            $this->conn->rollback();
            throw $e;
        }
    }

    public function getItineraryStats() {
        $stats = [];
        
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $stats['total_itineraries'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        $query = "SELECT status, COUNT(*) as count FROM " . $this->table_name . " GROUP BY status";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $stats['itineraries_by_status'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $query = "SELECT AVG(total_days) as avg_days FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $stats['average_days'] = round($stmt->fetch(PDO::FETCH_ASSOC)['avg_days'], 1);
        
        $query = "SELECT COUNT(*) as total FROM " . $this->schedule_table;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $stats['total_schedule_entries'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        return $stats;
    }
    

    public function searchItineraries($search_term, $limit = 20) {
        $query = "SELECT i.*, 
                         u.first_name as creator_name,
                         (SELECT COUNT(*) FROM itinerary_schedule WHERE itinerary_id = i.id) as schedule_count
                  FROM " . $this->table_name . " i
                  LEFT JOIN users u ON i.created_by = u.id
                  WHERE i.tour_name LIKE :search
                  ORDER BY i.created_at DESC
                  LIMIT :limit";
        
        $stmt = $this->conn->prepare($query);
        $search_param = '%' . $search_term . '%';
        $stmt->bindParam(':search', $search_param);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getItinerariesByTour($tour_id) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE tour_id = :tour_id AND status = 'active' 
                  ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':tour_id', $tour_id);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
