<?php


header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

class TrackingAPI {
    private $conn;
    private $db;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    public function updateLocation($data) {
        try {
            $query = "INSERT INTO guide_locations 
                      (guide_id, booking_id, latitude, longitude, accuracy, speed, heading, altitude, battery_level, recorded_at) 
                      VALUES (:guide_id, :booking_id, :latitude, :longitude, :accuracy, :speed, :heading, :altitude, :battery_level, :recorded_at)";
            
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':guide_id', $data['guide_id']);
            $stmt->bindParam(':booking_id', $data['booking_id']);
            $stmt->bindParam(':latitude', $data['latitude']);
            $stmt->bindParam(':longitude', $data['longitude']);
            $stmt->bindParam(':accuracy', $data['accuracy']);
            $stmt->bindParam(':speed', $data['speed']);
            $stmt->bindParam(':heading', $data['heading']);
            $stmt->bindParam(':altitude', $data['altitude']);
            $stmt->bindParam(':battery_level', $data['battery_level']);
            
            $recorded_at = $data['recorded_at'] ?? date('Y-m-d H:i:s');
            $stmt->bindParam(':recorded_at', $recorded_at);
            
            if ($stmt->execute()) {
                $this->updateTourDistance($data['booking_id']);
                
                return [
                    'success' => true,
                    'message' => 'Location updated successfully',
                    'location_id' => $this->conn->lastInsertId()
                ];
            }
            
            return ['success' => false, 'message' => 'Failed to update location'];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function getCurrentLocation($booking_id) {
        try {
            $query = "SELECT gl.*, 
                      CONCAT(u.first_name, ' ', u.last_name) as guide_name, 
                      u.phone as guide_phone,
                      ts.status as tour_status, ts.started_at, ts.total_distance
                      FROM guide_locations gl
                      JOIN users u ON gl.guide_id = u.id
                      LEFT JOIN tour_sessions ts ON gl.booking_id = ts.booking_id
                      WHERE gl.booking_id = :booking_id AND gl.is_active = 1
                      ORDER BY gl.recorded_at DESC
                      LIMIT 1";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':booking_id', $booking_id);
            $stmt->execute();
            
            $location = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($location) {
                return [
                    'success' => true,
                    'location' => $location,
                    'last_updated' => $location['recorded_at']
                ];
            }
            
            return ['success' => false, 'message' => 'No active tracking found'];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function getLocationHistory($booking_id, $limit = 100) {
        try {
            $query = "SELECT latitude, longitude, speed, heading, accuracy, recorded_at
                      FROM guide_locations
                      WHERE booking_id = :booking_id AND is_active = 1
                      ORDER BY recorded_at DESC
                      LIMIT :limit";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':booking_id', $booking_id);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'trail' => $history,
                'count' => count($history)
            ];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function startTourSession($data) {
        try {
            $checkQuery = "SELECT id, status FROM tour_sessions WHERE booking_id = :booking_id";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bindParam(':booking_id', $data['booking_id']);
            $checkStmt->execute();
            $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existing) {
                $query = "UPDATE tour_sessions SET 
                          status = 'started',
                          started_at = :started_at,
                          start_location_lat = :lat,
                          start_location_lng = :lng
                          WHERE booking_id = :booking_id";
                
                $stmt = $this->conn->prepare($query);
                $started_at = date('Y-m-d H:i:s');
                $stmt->bindParam(':started_at', $started_at);
                $stmt->bindParam(':lat', $data['latitude']);
                $stmt->bindParam(':lng', $data['longitude']);
                $stmt->bindParam(':booking_id', $data['booking_id']);
                $stmt->execute();
                
                $session_id = $existing['id'];
            } else {
                $query = "INSERT INTO tour_sessions 
                          (booking_id, guide_id, user_id, tour_id, status, started_at, start_location_lat, start_location_lng, scheduled_at) 
                          VALUES (:booking_id, :guide_id, :user_id, :tour_id, 'started', :started_at, :lat, :lng, :scheduled_at)";
                
                $stmt = $this->conn->prepare($query);
                $started_at = date('Y-m-d H:i:s');
                $scheduled_at = $data['scheduled_at'] ?? $started_at;
                
                $stmt->bindParam(':booking_id', $data['booking_id']);
                $stmt->bindParam(':guide_id', $data['guide_id']);
                $stmt->bindParam(':user_id', $data['user_id']);
                $stmt->bindParam(':tour_id', $data['tour_id']);
                $stmt->bindParam(':started_at', $started_at);
                $stmt->bindParam(':lat', $data['latitude']);
                $stmt->bindParam(':lng', $data['longitude']);
                $stmt->bindParam(':scheduled_at', $scheduled_at);
                $stmt->execute();
                
                $session_id = $this->conn->lastInsertId();
            }
            
            $this->sendNotification(
                $data['user_id'],
                $data['booking_id'],
                'tour_started',
                'Tour Started! 🚀',
                'Your tour guide has started the tour. Track their location in real-time.',
                ['session_id' => $session_id]
            );
            
            return [
                'success' => true,
                'message' => 'Tour session started successfully',
                'session_id' => $session_id
            ];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function completeTourSession($booking_id, $data) {
        try {
            $query = "UPDATE tour_sessions SET 
                      status = 'completed',
                      completed_at = :completed_at,
                      end_location_lat = :lat,
                      end_location_lng = :lng
                      WHERE booking_id = :booking_id";
            
            $stmt = $this->conn->prepare($query);
            $completed_at = date('Y-m-d H:i:s');
            
            $stmt->bindParam(':completed_at', $completed_at);
            $stmt->bindParam(':lat', $data['latitude']);
            $stmt->bindParam(':lng', $data['longitude']);
            $stmt->bindParam(':booking_id', $booking_id);
            
            if ($stmt->execute()) {
                $userQuery = "SELECT user_id FROM tour_sessions WHERE booking_id = :booking_id";
                $userStmt = $this->conn->prepare($userQuery);
                $userStmt->bindParam(':booking_id', $booking_id);
                $userStmt->execute();
                $session = $userStmt->fetch(PDO::FETCH_ASSOC);
                
                $this->sendNotification(
                    $session['user_id'],
                    $booking_id,
                    'tour_completed',
                    'Tour Completed! ✅',
                    'Your tour has been completed successfully. Thank you for traveling with us!',
                    ['completed_at' => $completed_at]
                );
                
                return [
                    'success' => true,
                    'message' => 'Tour session completed successfully'
                ];
            }
            
            return ['success' => false, 'message' => 'Failed to complete tour session'];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function getTourSession($booking_id) {
        try {
            $query = "SELECT ts.*, 
                      CONCAT(u.first_name, ' ', u.last_name) as guide_name, 
                      u.phone as guide_phone, u.email as guide_email,
                      CONCAT(cu.first_name, ' ', cu.last_name) as customer_name, 
                      cu.phone as customer_phone,
                      t.title as tour_name, t.destination,
                      b.booking_reference, b.travel_date, b.number_of_travelers
                      FROM tour_sessions ts
                      JOIN users u ON ts.guide_id = u.id
                      JOIN users cu ON ts.user_id = cu.id
                      JOIN tours t ON ts.tour_id = t.id
                      JOIN bookings b ON ts.booking_id = b.id
                      WHERE ts.booking_id = :booking_id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':booking_id', $booking_id);
            $stmt->execute();
            
            $session = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($session) {
                $checkpointsQuery = "SELECT * FROM tour_checkpoints WHERE tour_session_id = :session_id ORDER BY planned_arrival ASC";
                $cpStmt = $this->conn->prepare($checkpointsQuery);
                $cpStmt->bindParam(':session_id', $session['id']);
                $cpStmt->execute();
                $session['checkpoints'] = $cpStmt->fetchAll(PDO::FETCH_ASSOC);
                
                return [
                    'success' => true,
                    'session' => $session
                ];
            }
            
            return ['success' => false, 'message' => 'Tour session not found'];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function sendChatMessage($data) {
        try {
            $query = "INSERT INTO tour_chat_messages 
                      (booking_id, sender_type, sender_id, message, message_type, media_url) 
                      VALUES (:booking_id, :sender_type, :sender_id, :message, :message_type, :media_url)";
            
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':booking_id', $data['booking_id']);
            $stmt->bindParam(':sender_type', $data['sender_type']);
            $stmt->bindParam(':sender_id', $data['sender_id']);
            $stmt->bindParam(':message', $data['message']);
            $message_type = $data['message_type'] ?? 'text';
            $stmt->bindParam(':message_type', $message_type);
            $media_url = $data['media_url'] ?? null;
            $stmt->bindParam(':media_url', $media_url);
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Message sent successfully',
                    'message_id' => $this->conn->lastInsertId()
                ];
            }
            
            return ['success' => false, 'message' => 'Failed to send message'];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function getChatMessages($booking_id, $limit = 50) {
        try {
            $query = "SELECT tcm.*, 
                      CONCAT(u.first_name, ' ', u.last_name) as sender_name
                      FROM tour_chat_messages tcm
                      JOIN users u ON tcm.sender_id = u.id
                      WHERE tcm.booking_id = :booking_id
                      ORDER BY tcm.sent_at DESC
                      LIMIT :limit";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':booking_id', $booking_id);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'messages' => array_reverse($messages)
            ];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function createEmergencyAlert($data) {
        try {
            $query = "INSERT INTO emergency_alerts 
                      (booking_id, guide_id, user_id, alert_type, latitude, longitude, description) 
                      VALUES (:booking_id, :guide_id, :user_id, :alert_type, :latitude, :longitude, :description)";
            
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':booking_id', $data['booking_id']);
            $stmt->bindParam(':guide_id', $data['guide_id']);
            $stmt->bindParam(':user_id', $data['user_id']);
            $stmt->bindParam(':alert_type', $data['alert_type']);
            $stmt->bindParam(':latitude', $data['latitude']);
            $stmt->bindParam(':longitude', $data['longitude']);
            $stmt->bindParam(':description', $data['description']);
            
            if ($stmt->execute()) {
                $this->sendNotification(
                    $data['user_id'],
                    $data['booking_id'],
                    'emergency',
                    '🚨 Emergency Alert',
                    'An emergency alert has been triggered. Please check immediately.',
                    ['alert_id' => $this->conn->lastInsertId(), 'alert_type' => $data['alert_type']]
                );
                
                return [
                    'success' => true,
                    'message' => 'Emergency alert created successfully',
                    'alert_id' => $this->conn->lastInsertId()
                ];
            }
            
            return ['success' => false, 'message' => 'Failed to create emergency alert'];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function getNotifications($user_id, $unread_only = false) {
        try {
            $query = "SELECT * FROM tracking_notifications 
                      WHERE user_id = :user_id";
            
            if ($unread_only) {
                $query .= " AND is_read = 0";
            }
            
            $query .= " ORDER BY sent_at DESC LIMIT 50";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            
            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'notifications' => $notifications,
                'count' => count($notifications)
            ];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function markNotificationRead($notification_id) {
        try {
            $query = "UPDATE tracking_notifications SET is_read = 1 WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $notification_id);
            $stmt->execute();
            
            return ['success' => true, 'message' => 'Notification marked as read'];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    private function sendNotification($user_id, $booking_id, $type, $title, $message, $data = null) {
        try {
            $query = "INSERT INTO tracking_notifications 
                      (user_id, booking_id, notification_type, title, message, data) 
                      VALUES (:user_id, :booking_id, :type, :title, :message, :data)";
            
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':booking_id', $booking_id);
            $stmt->bindParam(':type', $type);
            $stmt->bindParam(':title', $title);
            $stmt->bindParam(':message', $message);
            $dataJson = $data ? json_encode($data) : null;
            $stmt->bindParam(':data', $dataJson);
            
            $stmt->execute();
            return true;
        } catch (PDOException $e) {
            error_log("Failed to send notification: " . $e->getMessage());
            return false;
        }
    }

    private function updateTourDistance($booking_id) {
        try {
            $query = "SELECT latitude, longitude FROM guide_locations 
                      WHERE booking_id = :booking_id AND is_active = 1
                      ORDER BY recorded_at DESC LIMIT 2";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':booking_id', $booking_id);
            $stmt->execute();
            
            $locations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($locations) >= 2) {
                $distance = $this->calculateDistance(
                    $locations[1]['latitude'], $locations[1]['longitude'],
                    $locations[0]['latitude'], $locations[0]['longitude']
                );
                
                $updateQuery = "UPDATE tour_sessions SET 
                               total_distance = total_distance + :distance 
                               WHERE booking_id = :booking_id";
                
                $updateStmt = $this->conn->prepare($updateQuery);
                $updateStmt->bindParam(':distance', $distance);
                $updateStmt->bindParam(':booking_id', $booking_id);
                $updateStmt->execute();
            }
        } catch (PDOException $e) {
            error_log("Failed to update tour distance: " . $e->getMessage());
        }
    }

    private function calculateDistance($lat1, $lon1, $lat2, $lon2) {
        $earthRadius = 6371; // km
        
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        
        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon/2) * sin($dLon/2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        
        return $earthRadius * $c;
    }
}

$api = new TrackingAPI();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if ($action === 'update_location') {
                $response = $api->updateLocation($data);
            } elseif ($action === 'start_session') {
                $response = $api->startTourSession($data);
            } elseif ($action === 'complete_session') {
                $booking_id = $_GET['booking_id'] ?? $data['booking_id'];
                $response = $api->completeTourSession($booking_id, $data);
            } elseif ($action === 'send_message') {
                $response = $api->sendChatMessage($data);
            } elseif ($action === 'emergency_alert') {
                $response = $api->createEmergencyAlert($data);
            } else {
                $response = ['success' => false, 'message' => 'Invalid action'];
            }
            break;
            
        case 'GET':
            $booking_id = $_GET['booking_id'] ?? null;
            $user_id = $_GET['user_id'] ?? null;
            
            if ($action === 'current_location' && $booking_id) {
                $response = $api->getCurrentLocation($booking_id);
            } elseif ($action === 'location_history' && $booking_id) {
                $limit = $_GET['limit'] ?? 100;
                $response = $api->getLocationHistory($booking_id, $limit);
            } elseif ($action === 'session' && $booking_id) {
                $response = $api->getTourSession($booking_id);
            } elseif ($action === 'chat_messages' && $booking_id) {
                $limit = $_GET['limit'] ?? 50;
                $response = $api->getChatMessages($booking_id, $limit);
            } elseif ($action === 'notifications' && $user_id) {
                $unread_only = isset($_GET['unread_only']) && $_GET['unread_only'] === 'true';
                $response = $api->getNotifications($user_id, $unread_only);
            } else {
                $response = ['success' => false, 'message' => 'Invalid action or missing parameters'];
            }
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if ($action === 'mark_read' && isset($_GET['notification_id'])) {
                $response = $api->markNotificationRead($_GET['notification_id']);
            } else {
                $response = ['success' => false, 'message' => 'Invalid action'];
            }
            break;
            
        default:
            $response = ['success' => false, 'message' => 'Method not allowed'];
            break;
    }
    
    echo json_encode($response);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
