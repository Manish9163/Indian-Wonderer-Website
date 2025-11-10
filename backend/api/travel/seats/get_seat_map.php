<?php
/**
 * Get Seat Map API
 * Fetches seat layout and availability for a specific travel option
 * 
 * GET /backend/api/travel/seats/get_seat_map.php?travel_id=X&mode=flight|bus|train
 */

session_start();

// Set CORS headers
$allowed_origins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: http://localhost:3000');
}

header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(json_encode(['success' => true]));
}

require_once __DIR__ . '/../../../config/database.php';

class SeatMapAPI {
    private $pdo;

    public function __construct() {
        try {
            $database = new Database();
            $this->pdo = $database->getConnection();
        } catch (Exception $e) {
            $this->error('Database connection failed', 503);
        }
    }

    /**
     * Get seat map for a travel option
     */
    public function getSeatMap() {
        $travel_id = $_GET['travel_id'] ?? null;
        $mode = $_GET['mode'] ?? null;

        if (!$travel_id) {
            return $this->error('travel_id parameter required', 400);
        }

        try {
            // Fetch all seats for this travel
            $stmt = $this->pdo->prepare("
                SELECT 
                    id,
                    seat_no,
                    seat_type,
                    row_number,
                    is_booked,
                    price
                FROM seats
                WHERE travel_id = :travel_id
                ORDER BY row_number ASC, seat_no ASC
            ");
            $stmt->execute([':travel_id' => $travel_id]);
            $seats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($seats)) {
                return $this->error('No seats found for this travel', 404);
            }

            // Get travel info
            $travelStmt = $this->pdo->prepare("
                SELECT mode FROM travel_options WHERE id = :id
            ");
            $travelStmt->execute([':id' => $travel_id]);
            $travel = $travelStmt->fetch(PDO::FETCH_ASSOC);

            $seatMode = $mode ?: ($travel['mode'] ?? 'bus');

            // Organize seats by layout
            $seatLayout = $this->organizeSeatsByLayout($seats, $seatMode);

            // Cast prices to float for proper JSON handling in frontend
            $seatsForResponse = array_map(function($seat) {
                $seat['price'] = (float)$seat['price'];
                return $seat;
            }, $seats);

            return $this->success([
                'travel_id' => $travel_id,
                'mode' => $seatMode,
                'total_seats' => count($seats),
                'available_seats' => count(array_filter($seats, fn($s) => !$s['is_booked'])),
                'booked_seats' => count(array_filter($seats, fn($s) => $s['is_booked'])),
                'layout' => $seatLayout,
                'seats' => $seatsForResponse
            ]);

        } catch (Exception $e) {
            return $this->error('Failed to fetch seat map: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Organize seats by layout type
     */
    private function organizeSeatsByLayout($seats, $mode) {
        $layout = [];

        // Cast prices to float to prevent JSON string concatenation in frontend
        $seats = array_map(function($seat) {
            $seat['price'] = (float)$seat['price'];
            return $seat;
        }, $seats);

        switch ($mode) {
            case 'bus':
                $layout = $this->organizeBusSeats($seats);
                break;
            case 'train':
                $layout = $this->organizeTrainSeats($seats);
                break;
            case 'flight':
                $layout = $this->organizeFlightSeats($seats);
                break;
            default:
                $layout = $this->organizeBusSeats($seats);
        }

        return $layout;
    }

    /**
     * Organize seats in bus layout (2x3 grid)
     */
    private function organizeBusSeats($seats) {
        $rows = [];
        foreach ($seats as $seat) {
            $row = $seat['row_number'] ?? 1;
            if (!isset($rows[$row])) {
                $rows[$row] = [];
            }
            $rows[$row][] = [
                'id' => $seat['id'],
                'seat_no' => $seat['seat_no'],
                'seat_type' => $seat['seat_type'],
                'is_booked' => (bool)$seat['is_booked'],
                'price' => $seat['price'],
                'column' => $seat['column_letter'] ?? 'A'
            ];
        }
        return $rows;
    }

    /**
     * Organize seats in train layout (Lower, Middle, Upper, Side berths)
     */
    private function organizeTrainSeats($seats) {
        $layout = [
            'lower' => [],
            'middle' => [],
            'upper' => [],
            'side' => []
        ];

        foreach ($seats as $seat) {
            $type = strtolower($seat['seat_type']);
            if (isset($layout[$type])) {
                $layout[$type][] = [
                    'id' => $seat['id'],
                    'seat_no' => $seat['seat_no'],
                    'row' => $seat['row_number'],
                    'is_booked' => (bool)$seat['is_booked'],
                    'price' => $seat['price']
                ];
            }
        }

        return $layout;
    }

    /**
     * Organize seats in flight layout (6x6 cabin)
     */
    private function organizeFlightSeats($seats) {
        $rows = [];
        foreach ($seats as $seat) {
            $row = $seat['row_number'];
            if (!isset($rows[$row])) {
                $rows[$row] = [];
            }
            $rows[$row][] = [
                'id' => $seat['id'],
                'seat_no' => $seat['seat_no'],
                'seat_type' => $seat['seat_type'],
                'is_booked' => (bool)$seat['is_booked'],
                'price' => $seat['price'],
                'column' => $seat['column_letter'] ?? null
            ];
        }
        ksort($rows);
        return $rows;
    }

    /**
     * Response helpers
     */
    private function success($data, $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
        exit;
    }

    private function error($message, $code = 400) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'error' => $message
        ]);
        exit;
    }
}

// Handle request
try {
    $api = new SeatMapAPI();
    $api->getSeatMap();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
