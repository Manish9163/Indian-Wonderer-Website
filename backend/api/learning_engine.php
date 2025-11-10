<?php
/**
 * Dynamic Learning & Adaptation System
 * Learns from user interactions and improves recommendations over time
 */

require_once __DIR__ . '/../config/database.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? null;
    
    switch ($action) {
        case 'record_interaction':
            $response = recordUserInteraction($pdo, $input);
            break;
            
        case 'get_learning_profile':
            $response = getUserLearningProfile($pdo, $input['sessionId']);
            break;
            
        case 'update_tour_score':
            $response = updateTourLearningScore($pdo, $input);
            break;
            
        case 'get_personalized_tours':
            $response = getPersonalizedTours($pdo, $input);
            break;
            
        case 'predict_preference':
            $response = predictUserPreference($pdo, $input);
            break;
            
        case 'analyze_behavior_patterns':
            $response = analyzeBehaviorPatterns($pdo, $input['sessionId']);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
    
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

/**
 * Record user interaction with tours
 */
function recordUserInteraction($pdo, $data) {
    $sessionId = $data['sessionId'];
    $tourId = $data['tourId'];
    $interactionType = $data['type']; // view, click, like, dislike, book, review
    $metadata = json_encode($data['metadata'] ?? []);
    
    ensureInteractionTable($pdo);
    
    $stmt = $pdo->prepare("
        INSERT INTO user_interactions (session_id, tour_id, interaction_type, metadata, created_at)
        VALUES (?, ?, ?, ?, NOW())
    ");
    
    $stmt->execute([$sessionId, $tourId, $interactionType, $metadata]);
    
    // Update learning profile
    updateLearningProfile($pdo, $sessionId, $tourId, $interactionType);
    
    return [
        'success' => true,
        'message' => 'Interaction recorded',
        'interactionId' => $pdo->lastInsertId()
    ];
}

/**
 * Get user's learning profile - what the AI has learned about them
 */
function getUserLearningProfile($pdo, $sessionId) {
    ensureProfileTable($pdo);
    
    $stmt = $pdo->prepare("
        SELECT 
            session_id,
            favorite_moods,
            favorite_destinations,
            price_preference,
            duration_preference,
            interest_categories,
            booking_history,
            interaction_count,
            last_updated
        FROM user_learning_profiles
        WHERE session_id = ?
    ");
    
    $stmt->execute([$sessionId]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($profile) {
        return [
            'success' => true,
            'profile' => [
                'sessionId' => $profile['session_id'],
                'favoriteMoods' => json_decode($profile['favorite_moods'], true) ?? [],
                'favoriteDestinations' => json_decode($profile['favorite_destinations'], true) ?? [],
                'pricePreference' => $profile['price_preference'],
                'durationPreference' => $profile['duration_preference'],
                'interestCategories' => json_decode($profile['interest_categories'], true) ?? [],
                'bookingHistory' => json_decode($profile['booking_history'], true) ?? [],
                'interactionCount' => $profile['interaction_count'],
                'lastUpdated' => $profile['last_updated']
            ]
        ];
    }
    
    return [
        'success' => false,
        'profile' => null,
        'message' => 'No profile found'
    ];
}

/**
 * Update tour's learning score based on interactions
 */
function updateTourLearningScore($pdo, $data) {
    $tourId = $data['tourId'];
    $updateType = $data['updateType']; // view, like, dislike, book
    
    ensureTourScoresTable($pdo);
    
    $scoreChanges = [
        'view' => 0.1,      // Small boost for views
        'click' => 0.2,     // Moderate boost for clicks
        'like' => 0.5,      // Good boost for likes
        'book' => 2.0,      // Large boost for bookings
        'dislike' => -1.0   // Penalty for dislikes
    ];
    
    $scoreChange = $scoreChanges[$updateType] ?? 0;
    
    // Get current score
    $stmt = $pdo->prepare("SELECT learning_score FROM tour_learning_scores WHERE tour_id = ?");
    $stmt->execute([$tourId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$result) {
        // Initialize score
        $stmt = $pdo->prepare("
            INSERT INTO tour_learning_scores (tour_id, learning_score, interaction_count)
            VALUES (?, 50, 1)
        ");
        $stmt->execute([$tourId]);
    } else {
        // Update score with decay (older scores matter less)
        $newScore = $result['learning_score'] + $scoreChange;
        $newScore = max(0, min(100, $newScore)); // Keep between 0-100
        
        $stmt = $pdo->prepare("
            UPDATE tour_learning_scores 
            SET learning_score = ?,
                interaction_count = interaction_count + 1,
                last_interaction = NOW()
            WHERE tour_id = ?
        ");
        $stmt->execute([$newScore, $tourId]);
    }
    
    return [
        'success' => true,
        'message' => 'Tour learning score updated',
        'scoreChange' => $scoreChange
    ];
}

/**
 * Get personalized tour recommendations based on learning
 */
function getPersonalizedTours($pdo, $data) {
    $sessionId = $data['sessionId'] ?? null;
    $limit = $data['limit'] ?? 3;
    
    ensureProfileTable($pdo);
    ensureTourScoresTable($pdo);
    
    // Get user's learning profile
    $stmt = $pdo->prepare("
        SELECT 
            favorite_moods,
            favorite_destinations,
            price_preference,
            interest_categories
        FROM user_learning_profiles
        WHERE session_id = ?
    ");
    $stmt->execute([$sessionId]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$profile) {
        return [
            'success' => false,
            'tours' => [],
            'message' => 'No user profile found'
        ];
    }
    
    $favoriteMoods = json_decode($profile['favorite_moods'], true) ?? [];
    $favoriteDestinations = json_decode($profile['favorite_destinations'], true) ?? [];
    $priceRange = $profile['price_preference']; // e.g., "budget", "mid-range", "luxury"
    $interests = json_decode($profile['interest_categories'], true) ?? [];
    
    // Build personalized query
    $sql = "
        SELECT 
            t.id, t.title, t.description, t.destination, t.price,
            t.duration_days, t.category, t.image_url,
            tls.learning_score,
            COUNT(b.id) as booking_count,
            AVG(r.rating) as average_rating,
            (
                CASE 
                    WHEN t.category IN ('" . implode("','", array_map('addslashes', $interests ?: [])) . "') THEN 30
                    ELSE 0
                END +
                CASE
                    WHEN t.destination IN ('" . implode("','", array_map('addslashes', $favoriteDestinations ?: [])) . "') THEN 20
                    ELSE 0
                END +
                (tls.learning_score OR 50)
            ) as personalization_score
        FROM tours t
        LEFT JOIN tour_learning_scores tls ON t.id = tls.tour_id
        LEFT JOIN bookings b ON t.id = b.tour_id AND b.status = 'confirmed'
        LEFT JOIN reviews r ON t.id = r.tour_id AND r.status = 'approved'
        WHERE t.is_active = TRUE
    ";
    
    // Apply price filter based on preference
    if ($priceRange === 'budget') {
        $sql .= " AND t.price <= 15000";
    } elseif ($priceRange === 'mid-range') {
        $sql .= " AND t.price BETWEEN 15000 AND 50000";
    } elseif ($priceRange === 'luxury') {
        $sql .= " AND t.price > 50000";
    }
    
    $sql .= " GROUP BY t.id
              ORDER BY personalization_score DESC, average_rating DESC
              LIMIT ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$limit]);
    $tours = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return [
        'success' => true,
        'tours' => $tours,
        'personalizationFactors' => [
            'moods' => $favoriteMoods,
            'destinations' => $favoriteDestinations,
            'priceRange' => $priceRange,
            'interests' => $interests
        ]
    ];
}

/**
 * Predict user preference for a tour
 * Uses historical patterns to predict if user will like a tour
 */
function predictUserPreference($pdo, $data) {
    $sessionId = $data['sessionId'];
    $tourId = $data['tourId'];
    
    $stmt = $pdo->prepare("
        SELECT 
            t.id, t.category, t.destination, t.price, t.duration_days,
            (SELECT COUNT(*) FROM user_interactions 
             WHERE session_id = ? AND interaction_type = 'like') as user_like_count,
            (SELECT COUNT(*) FROM user_interactions ui
             JOIN tours t2 ON ui.tour_id = t2.id
             WHERE ui.session_id = ? AND t2.category = t.category) as similar_likes
        FROM tours t
        WHERE t.id = ?
    ");
    
    $stmt->execute([$sessionId, $sessionId, $tourId]);
    $tour = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$tour) {
        return [
            'success' => false,
            'prediction' => 0,
            'message' => 'Tour not found'
        ];
    }
    
    // Calculate prediction score
    $predictionScore = 0;
    
    // Factor 1: Category match
    if ($tour['similar_likes'] > 0) {
        $predictionScore += 40;
    }
    
    // Factor 2: User engagement level
    if ($tour['user_like_count'] > 5) {
        $predictionScore += 30;
    }
    
    // Factor 3: Tour popularity
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as booking_count FROM bookings 
        WHERE tour_id = ? AND status = 'confirmed'
    ");
    $stmt->execute([$tourId]);
    $bookings = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($bookings['booking_count'] > 10) {
        $predictionScore += 20;
    }
    
    // Factor 4: Tour rating
    $stmt = $pdo->prepare("
        SELECT AVG(rating) as avg_rating FROM reviews 
        WHERE tour_id = ? AND status = 'approved'
    ");
    $stmt->execute([$tourId]);
    $rating = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($rating['avg_rating'] >= 4.5) {
        $predictionScore += 10;
    }
    
    $confidence = min(100, $predictionScore);
    
    return [
        'success' => true,
        'tourId' => $tourId,
        'predictionScore' => $predictionScore,
        'confidence' => $confidence,
        'prediction' => $confidence > 60 ? 'likely' : ($confidence > 40 ? 'possible' : 'unlikely'),
        'reasoning' => [
            'categoryMatch' => $tour['similar_likes'] > 0,
            'userEngagement' => $tour['user_like_count'],
            'popularity' => $bookings['booking_count'],
            'rating' => round($rating['avg_rating'] ?? 0, 1)
        ]
    ];
}

/**
 * Analyze user's behavior patterns
 */
function analyzeBehaviorPatterns($pdo, $sessionId) {
    $stmt = $pdo->prepare("
        SELECT 
            interaction_type,
            COUNT(*) as count
        FROM user_interactions
        WHERE session_id = ?
        GROUP BY interaction_type
    ");
    $stmt->execute([$sessionId]);
    $interactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->prepare("
        SELECT 
            t.category,
            COUNT(ui.id) as interaction_count
        FROM user_interactions ui
        JOIN tours t ON ui.tour_id = t.id
        WHERE ui.session_id = ?
        GROUP BY t.category
        ORDER BY interaction_count DESC
    ");
    $stmt->execute([$sessionId]);
    $categoryPreferences = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate engagement score
    $totalInteractions = array_sum(array_column($interactions, 'count'));
    $engagementScore = min(100, ($totalInteractions / 10) * 100);
    
    return [
        'success' => true,
        'patterns' => [
            'totalInteractions' => $totalInteractions,
            'engagementScore' => round($engagementScore, 2),
            'interactionBreakdown' => $interactions,
            'topCategories' => array_slice($categoryPreferences, 0, 3),
            'userType' => classifyUserType($totalInteractions, $categoryPreferences)
        ]
    ];
}

/**
 * Classify user type based on behavior
 */
function classifyUserType($totalInteractions, $categoryPreferences) {
    if ($totalInteractions < 3) return 'new';
    if ($totalInteractions < 10) return 'casual';
    if ($totalInteractions < 30) return 'engaged';
    return 'loyal';
}

/**
 * Update learning profile based on interaction
 */
function updateLearningProfile($pdo, $sessionId, $tourId, $interactionType) {
    ensureProfileTable($pdo);
    
    // Get tour details
    $stmt = $pdo->prepare("
        SELECT category, destination, price FROM tours WHERE id = ?
    ");
    $stmt->execute([$tourId]);
    $tour = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$tour) return;
    
    // Get or create profile
    $stmt = $pdo->prepare("
        SELECT * FROM user_learning_profiles WHERE session_id = ?
    ");
    $stmt->execute([$sessionId]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$profile) {
        // Create new profile
        $stmt = $pdo->prepare("
            INSERT INTO user_learning_profiles 
            (session_id, favorite_moods, favorite_destinations, price_preference, interest_categories, interaction_count)
            VALUES (?, '[]', ?, ?, ?, 1)
        ");
        
        $priceCategory = $tour['price'] < 15000 ? 'budget' : ($tour['price'] < 50000 ? 'mid-range' : 'luxury');
        
        $stmt->execute([
            $sessionId,
            json_encode([$tour['destination']]),
            $priceCategory,
            json_encode([$tour['category']])
        ]);
    } else {
        // Update existing profile
        $favorites = json_decode($profile['favorite_destinations'], true) ?? [];
        if (!in_array($tour['destination'], $favorites)) {
            $favorites[] = $tour['destination'];
        }
        
        $interests = json_decode($profile['interest_categories'], true) ?? [];
        if (!in_array($tour['category'], $interests)) {
            $interests[] = $tour['category'];
        }
        
        $stmt = $pdo->prepare("
            UPDATE user_learning_profiles
            SET 
                favorite_destinations = ?,
                interest_categories = ?,
                interaction_count = interaction_count + 1,
                last_updated = NOW()
            WHERE session_id = ?
        ");
        
        $stmt->execute([
            json_encode($favorites),
            json_encode($interests),
            $sessionId
        ]);
    }
}

/**
 * Ensure user interactions table exists
 */
function ensureInteractionTable($pdo) {
    $sql = "CREATE TABLE IF NOT EXISTS user_interactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        session_id VARCHAR(255),
        tour_id INT,
        interaction_type VARCHAR(50),
        metadata JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tour_id) REFERENCES tours(id),
        INDEX idx_session (session_id),
        INDEX idx_tour (tour_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    $pdo->exec($sql);
}

/**
 * Ensure user learning profiles table exists
 */
function ensureProfileTable($pdo) {
    $sql = "CREATE TABLE IF NOT EXISTS user_learning_profiles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        session_id VARCHAR(255) UNIQUE,
        favorite_moods JSON,
        favorite_destinations JSON,
        price_preference VARCHAR(50),
        duration_preference INT,
        interest_categories JSON,
        booking_history JSON,
        interaction_count INT DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_session (session_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    $pdo->exec($sql);
}

/**
 * Ensure tour learning scores table exists
 */
function ensureTourScoresTable($pdo) {
    $sql = "CREATE TABLE IF NOT EXISTS tour_learning_scores (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tour_id INT UNIQUE,
        learning_score DECIMAL(5,2) DEFAULT 50,
        interaction_count INT DEFAULT 0,
        last_interaction DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tour_id) REFERENCES tours(id),
        INDEX idx_tour (tour_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    $pdo->exec($sql);
}
?>
