<?php
/**
 * Enhanced Travel Search API - MakeMyTrip Style
 * Advanced filters, sorting, price comparison, etc.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';

class EnhancedTravelAPI {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    /**
     * Advanced search with filters and sorting
     */
    public function advancedSearch() {
        $from = $_GET['from'] ?? null;
        $to = $_GET['to'] ?? null;
        $date = $_GET['date'] ?? null;
        $mode = $_GET['mode'] ?? 'all';
        
        // Advanced filters
        $min_price = $_GET['min_price'] ?? null;
        $max_price = $_GET['max_price'] ?? null;
        $departure_time = $_GET['departure_time'] ?? null; // morning, afternoon, evening, night
        $seat_class = $_GET['seat_class'] ?? null;
        $operators = $_GET['operators'] ?? null; // comma-separated
        $sort_by = $_GET['sort_by'] ?? 'price'; // price, duration, departure, rating
        $sort_order = $_GET['sort_order'] ?? 'asc';
        
        if (!$from || !$to || !$date) {
            return $this->error('Missing required parameters', 400);
        }
        
        try {
            // Build query
            $query = "SELECT t.*, 
                      (SELECT COUNT(*) FROM travel_bookings WHERE travel_id = t.id) as total_bookings,
                      (SELECT AVG(rating) FROM travel_reviews WHERE travel_id = t.id) as avg_rating
                      FROM travel_options t
                      WHERE LOWER(from_city) = LOWER(:from)
                      AND LOWER(to_city) = LOWER(:to)
                      AND DATE(travel_date) = :date
                      AND status IN ('confirmed', 'pending')";
            
            $params = [
                ':from' => $from,
                ':to' => $to,
                ':date' => $date
            ];
            
            // Mode filter
            if ($mode && $mode !== 'all') {
                $query .= " AND mode = :mode";
                $params[':mode'] = $mode;
            }
            
            // Price range filter
            if ($min_price !== null) {
                $query .= " AND total_amount >= :min_price";
                $params[':min_price'] = $min_price;
            }
            if ($max_price !== null) {
                $query .= " AND total_amount <= :max_price";
                $params[':max_price'] = $max_price;
            }
            
            // Seat class filter
            if ($seat_class) {
                $query .= " AND LOWER(seat_class) LIKE LOWER(:seat_class)";
                $params[':seat_class'] = "%$seat_class%";
            }
            
            // Operator filter
            if ($operators) {
                $ops = explode(',', $operators);
                $op_conditions = [];
                foreach ($ops as $i => $op) {
                    $key = ":operator$i";
                    $op_conditions[] = "LOWER(operator_name) LIKE LOWER($key)";
                    $params[$key] = "%$op%";
                }
                $query .= " AND (" . implode(" OR ", $op_conditions) . ")";
            }
            
            // Departure time filter
            if ($departure_time) {
                switch ($departure_time) {
                    case 'morning':
                        $query .= " AND TIME(travel_time) BETWEEN '06:00:00' AND '11:59:59'";
                        break;
                    case 'afternoon':
                        $query .= " AND TIME(travel_time) BETWEEN '12:00:00' AND '17:59:59'";
                        break;
                    case 'evening':
                        $query .= " AND TIME(travel_time) BETWEEN '18:00:00' AND '21:59:59'";
                        break;
                    case 'night':
                        $query .= " AND (TIME(travel_time) >= '22:00:00' OR TIME(travel_time) < '06:00:00')";
                        break;
                }
            }
            
            // Sorting
            $allowed_sorts = ['price' => 'total_amount', 'duration' => 'duration', 'departure' => 'travel_time', 'rating' => 'avg_rating'];
            $sort_column = $allowed_sorts[$sort_by] ?? 'total_amount';
            $order = strtoupper($sort_order) === 'DESC' ? 'DESC' : 'ASC';
            $query .= " ORDER BY $sort_column $order, travel_time ASC";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Calculate statistics
            $stats = $this->calculateStats($results);
            
            // Add recommended flag
            foreach ($results as &$result) {
                $result['is_recommended'] = $this->isRecommended($result);
                $result['price_tag'] = $this->getPriceTag($result, $stats);
                $result['amenities'] = json_decode($result['amenities'] ?? '[]');
            }
            
            return $this->success([
                'count' => count($results),
                'results' => $results,
                'filters_applied' => $this->getAppliedFilters($_GET),
                'statistics' => $stats,
                'route' => "$from → $to",
                'date' => $date
            ]);
            
        } catch (Exception $e) {
            return $this->error('Search failed: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Get available filter options for a route
     */
    public function getFilterOptions() {
        $from = $_GET['from'] ?? null;
        $to = $_GET['to'] ?? null;
        $date = $_GET['date'] ?? null;
        
        if (!$from || !$to || !$date) {
            return $this->error('Missing required parameters', 400);
        }
        
        try {
            // Get unique operators
            $ops_query = "SELECT DISTINCT operator_name FROM travel_options 
                         WHERE LOWER(from_city) = LOWER(:from) AND LOWER(to_city) = LOWER(:to) 
                         AND DATE(travel_date) = :date";
            $ops_stmt = $this->db->prepare($ops_query);
            $ops_stmt->execute([':from' => $from, ':to' => $to, ':date' => $date]);
            $operators = $ops_stmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Get price range
            $price_query = "SELECT MIN(total_amount) as min_price, MAX(total_amount) as max_price 
                           FROM travel_options 
                           WHERE LOWER(from_city) = LOWER(:from) AND LOWER(to_city) = LOWER(:to) 
                           AND DATE(travel_date) = :date";
            $price_stmt = $this->db->prepare($price_query);
            $price_stmt->execute([':from' => $from, ':to' => $to, ':date' => $date]);
            $price_range = $price_stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get available seat classes
            $class_query = "SELECT DISTINCT seat_class FROM travel_options 
                           WHERE LOWER(from_city) = LOWER(:from) AND LOWER(to_city) = LOWER(:to) 
                           AND DATE(travel_date) = :date AND seat_class IS NOT NULL";
            $class_stmt = $this->db->prepare($class_query);
            $class_stmt->execute([':from' => $from, ':to' => $to, ':date' => $date]);
            $seat_classes = $class_stmt->fetchAll(PDO::FETCH_COLUMN);
            
            return $this->success([
                'operators' => $operators,
                'price_range' => $price_range,
                'seat_classes' => $seat_classes,
                'departure_times' => ['morning', 'afternoon', 'evening', 'night']
            ]);
            
        } catch (Exception $e) {
            return $this->error('Failed to fetch filter options', 500);
        }
    }
    
    /**
     * Price comparison across modes
     */
    public function priceComparison() {
        $from = $_GET['from'] ?? null;
        $to = $_GET['to'] ?? null;
        $date = $_GET['date'] ?? null;
        
        if (!$from || !$to || !$date) {
            return $this->error('Missing required parameters', 400);
        }
        
        try {
            $query = "SELECT mode, 
                            MIN(total_amount) as cheapest,
                            MAX(total_amount) as most_expensive,
                            AVG(total_amount) as average,
                            COUNT(*) as options_count
                     FROM travel_options
                     WHERE LOWER(from_city) = LOWER(:from)
                     AND LOWER(to_city) = LOWER(:to)
                     AND DATE(travel_date) = :date
                     GROUP BY mode";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute([':from' => $from, ':to' => $to, ':date' => $date]);
            $comparison = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return $this->success([
                'route' => "$from → $to",
                'date' => $date,
                'comparison' => $comparison
            ]);
            
        } catch (Exception $e) {
            return $this->error('Price comparison failed', 500);
        }
    }
    
    /**
     * Flexible date search (±3 days)
     */
    public function flexibleDateSearch() {
        $from = $_GET['from'] ?? null;
        $to = $_GET['to'] ?? null;
        $date = $_GET['date'] ?? null;
        $mode = $_GET['mode'] ?? 'all';
        
        if (!$from || !$to || !$date) {
            return $this->error('Missing required parameters', 400);
        }
        
        try {
            $query = "SELECT DATE(travel_date) as search_date,
                            MIN(total_amount) as lowest_price,
                            COUNT(*) as options_count
                     FROM travel_options
                     WHERE LOWER(from_city) = LOWER(:from)
                     AND LOWER(to_city) = LOWER(:to)
                     AND DATE(travel_date) BETWEEN DATE_SUB(:date, INTERVAL 3 DAY) AND DATE_ADD(:date, INTERVAL 3 DAY)";
            
            if ($mode !== 'all') {
                $query .= " AND mode = :mode";
            }
            
            $query .= " GROUP BY DATE(travel_date) ORDER BY search_date";
            
            $stmt = $this->db->prepare($query);
            $params = [':from' => $from, ':to' => $to, ':date' => $date];
            if ($mode !== 'all') {
                $params[':mode'] = $mode;
            }
            $stmt->execute($params);
            $dates = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return $this->success([
                'route' => "$from → $to",
                'center_date' => $date,
                'flexible_dates' => $dates
            ]);
            
        } catch (Exception $e) {
            return $this->error('Flexible search failed', 500);
        }
    }
    
    private function calculateStats($results) {
        if (empty($results)) {
            return [];
        }
        
        $prices = array_column($results, 'total_amount');
        return [
            'cheapest' => min($prices),
            'most_expensive' => max($prices),
            'average' => round(array_sum($prices) / count($prices), 2),
            'total_options' => count($results)
        ];
    }
    
    private function isRecommended($travel) {
        // Logic: good rating, reasonable price, available seats
        $rating = floatval($travel['avg_rating'] ?? 0);
        $availability = intval($travel['available_seats'] ?? 0);
        
        return $rating >= 4.0 && $availability > 10;
    }
    
    private function getPriceTag($travel, $stats) {
        if (empty($stats)) return 'standard';
        
        $price = floatval($travel['total_amount']);
        $cheapest = floatval($stats['cheapest']);
        $avg = floatval($stats['average']);
        
        if ($price <= $cheapest * 1.1) return 'cheapest';
        if ($price <= $avg * 0.9) return 'good_deal';
        if ($price >= $avg * 1.5) return 'premium';
        return 'standard';
    }
    
    private function getAppliedFilters($params) {
        $filters = [];
        if (isset($params['min_price'])) $filters[] = "Min Price: ₹{$params['min_price']}";
        if (isset($params['max_price'])) $filters[] = "Max Price: ₹{$params['max_price']}";
        if (isset($params['departure_time'])) $filters[] = "Time: " . ucfirst($params['departure_time']);
        if (isset($params['seat_class'])) $filters[] = "Class: {$params['seat_class']}";
        if (isset($params['operators'])) $filters[] = "Operators: {$params['operators']}";
        return $filters;
    }
    
    private function success($data) {
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => $data]);
        exit;
    }
    
    private function error($message, $code = 400) {
        http_response_code($code);
        echo json_encode(['success' => false, 'error' => $message]);
        exit;
    }
}

// Route handling
$api = new EnhancedTravelAPI();
$action = $_GET['action'] ?? 'search';

switch ($action) {
    case 'search':
        $api->advancedSearch();
        break;
    case 'filters':
        $api->getFilterOptions();
        break;
    case 'compare':
        $api->priceComparison();
        break;
    case 'flexible':
        $api->flexibleDateSearch();
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
}
