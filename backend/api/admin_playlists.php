<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/database.php';

class PlaylistAPI {
    private $conn;
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    public function getAllPlaylists() {
        try {
            $query = "SELECT 
                        id,
                        destination,
                        destination_display_name,
                        spotify_playlist_name,
                        spotify_playlist_url,
                        youtube_playlist_name,
                        youtube_playlist_url,
                        description,
                        is_active,
                        created_at,
                        updated_at
                      FROM destination_playlists
                      ORDER BY destination_display_name ASC";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            $playlists = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'playlists' => $playlists
            ];
        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Error fetching playlists: ' . $e->getMessage()
            ];
        }
    }
    
    public function getActivePlaylists() {
        try {
            $query = "SELECT 
                        destination,
                        spotify_playlist_name,
                        youtube_playlist_name
                      FROM destination_playlists
                      WHERE is_active = 1
                      ORDER BY destination_display_name ASC";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            $playlists = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $playlists[$row['destination']] = [
                    'spotify' => $row['spotify_playlist_name'],
                    'youtube' => $row['youtube_playlist_name']
                ];
            }
            
            return [
                'success' => true,
                'playlists' => $playlists
            ];
        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Error fetching playlists: ' . $e->getMessage()
            ];
        }
    }
    
    // Get single playlist by destination
    public function getPlaylistByDestination($destination) {
        try {
            $query = "SELECT * FROM destination_playlists WHERE destination = :destination";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':destination', $destination);
            $stmt->execute();
            
            $playlist = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($playlist) {
                return [
                    'success' => true,
                    'playlist' => $playlist
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Playlist not found'
                ];
            }
        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Error fetching playlist: ' . $e->getMessage()
            ];
        }
    }
    
    // Create new playlist
    public function createPlaylist($data) {
        try {
            $query = "INSERT INTO destination_playlists 
                      (destination, destination_display_name, spotify_playlist_name, 
                       spotify_playlist_url, youtube_playlist_name, youtube_playlist_url, 
                       description, is_active, created_by)
                      VALUES 
                      (:destination, :destination_display_name, :spotify_playlist_name,
                       :spotify_playlist_url, :youtube_playlist_name, :youtube_playlist_url,
                       :description, :is_active, :created_by)";
            
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':destination', $data['destination']);
            $stmt->bindParam(':destination_display_name', $data['destination_display_name']);
            $stmt->bindParam(':spotify_playlist_name', $data['spotify_playlist_name']);
            $stmt->bindParam(':spotify_playlist_url', $data['spotify_playlist_url']);
            $stmt->bindParam(':youtube_playlist_name', $data['youtube_playlist_name']);
            $stmt->bindParam(':youtube_playlist_url', $data['youtube_playlist_url']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':is_active', $data['is_active']);
            $stmt->bindParam(':created_by', $data['created_by']);
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Playlist created successfully',
                    'id' => $this->conn->lastInsertId()
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to create playlist'
                ];
            }
        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Error creating playlist: ' . $e->getMessage()
            ];
        }
    }
    
    // Update playlist
    public function updatePlaylist($id, $data) {
        try {
            $query = "UPDATE destination_playlists SET
                      destination = :destination,
                      destination_display_name = :destination_display_name,
                      spotify_playlist_name = :spotify_playlist_name,
                      spotify_playlist_url = :spotify_playlist_url,
                      youtube_playlist_name = :youtube_playlist_name,
                      youtube_playlist_url = :youtube_playlist_url,
                      description = :description,
                      is_active = :is_active
                      WHERE id = :id";
            
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':destination', $data['destination']);
            $stmt->bindParam(':destination_display_name', $data['destination_display_name']);
            $stmt->bindParam(':spotify_playlist_name', $data['spotify_playlist_name']);
            $stmt->bindParam(':spotify_playlist_url', $data['spotify_playlist_url']);
            $stmt->bindParam(':youtube_playlist_name', $data['youtube_playlist_name']);
            $stmt->bindParam(':youtube_playlist_url', $data['youtube_playlist_url']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':is_active', $data['is_active']);
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Playlist updated successfully'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to update playlist'
                ];
            }
        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Error updating playlist: ' . $e->getMessage()
            ];
        }
    }
    
    // Delete playlist
    public function deletePlaylist($id) {
        try {
            $query = "DELETE FROM destination_playlists WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Playlist deleted successfully'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to delete playlist'
                ];
            }
        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Error deleting playlist: ' . $e->getMessage()
            ];
        }
    }
    
    public function togglePlaylistStatus($id) {
        try {
            $query = "UPDATE destination_playlists 
                      SET is_active = NOT is_active 
                      WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Playlist status updated successfully'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to update status'
                ];
            }
        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Error updating status: ' . $e->getMessage()
            ];
        }
    }
}

$database = new Database();
$db = $database->getConnection();

$api = new PlaylistAPI($db);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['destination'])) {
            echo json_encode($api->getPlaylistByDestination($_GET['destination']));
        } elseif (isset($_GET['active']) && $_GET['active'] === 'true') {
            echo json_encode($api->getActivePlaylists());
        } else {
            echo json_encode($api->getAllPlaylists());
        }
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['destination']) || !isset($data['destination_display_name']) ||
            !isset($data['spotify_playlist_name']) || !isset($data['youtube_playlist_name'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Missing required fields'
            ]);
            exit;
        }
        
        $data['spotify_playlist_url'] = $data['spotify_playlist_url'] ?? '';
        $data['youtube_playlist_url'] = $data['youtube_playlist_url'] ?? '';
        $data['description'] = $data['description'] ?? '';
        $data['is_active'] = $data['is_active'] ?? 1;
        $data['created_by'] = $data['created_by'] ?? null;
        
        echo json_encode($api->createPlaylist($data));
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['id'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Playlist ID is required'
            ]);
            exit;
        }
        
        if (isset($data['toggle_status'])) {
            echo json_encode($api->togglePlaylistStatus($data['id']));
        } else {
            echo json_encode($api->updatePlaylist($data['id'], $data));
        }
        break;
        
    case 'DELETE':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['id'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Playlist ID is required'
            ]);
            exit;
        }
        
        echo json_encode($api->deletePlaylist($data['id']));
        break;
        
    default:
        echo json_encode([
            'success' => false,
            'message' => 'Invalid request method'
        ]);
        break;
}
?>
