<?php
/**
 * Advanced Decision-Making Engine
 * Multi-criteria scoring and intelligent tour ranking
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
        case 'rank_tours':
            $response = rankToursWithMultiCriteria($pdo, $input);
            break;
            
        case 'calculate_scores':
            $response = calculateDetailedScores($pdo, $input);
            break;
            
        case 'get_best_match':
            $response = findBestMatchTour($pdo, $input);
            break;
            
        case 'compare_tours':
            $response = compareTours($pdo, $input);
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
 * Rank tours using multi-criteria scoring algorithm
 */
function rankToursWithMultiCriteria($pdo, $data) {
    $criteria = $data['criteria'] ?? [];
    $userPreferences = $data['userPreferences'] ?? [];
    $limit = $data['limit'] ?? 3;
    
    // Get all active tours
    $stmt = $pdo->query("
        SELECT 
            t.id, t.title, t.description, t.destination, t.price,
            t.duration_days, t.category, t.difficulty_level, t.image_url,
            t.inclusions, t.features, t.rating_count, t.total_rating,
            (SELECT COUNT(*) FROM bookings WHERE tour_id = t.id AND status = 'confirmed') as booking_count,
            (SELECT AVG(rating) FROM reviews WHERE tour_id = t.id AND status = 'approved') as average_rating,
            (SELECT learning_score FROM tour_learning_scores WHERE tour_id = t.id) as ai_score,
            t.is_active
        FROM tours t
        WHERE t.is_active = TRUE
    ");
    
    $tours = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Score each tour
    $scoredTours = [];
    foreach ($tours as $tour) {
        $scores = calculateDetailedScores($pdo, [
            'tourId' => $tour['id'],
            'criteria' => $criteria,
            'userPreferences' => $userPreferences
        ]);
        
        $tour['scores'] = $scores['data']['scores'];
        $tour['finalScore'] = $scores['data']['finalScore'];
        $tour['matchPercentage'] = $scores['data']['matchPercentage'];
        $tour['explanation'] = $scores['data']['explanation'];
        
        $scoredTours[] = $tour;
    }
    
    // Sort by final score
    usort($scoredTours, function ($a, $b) {
        return $b['finalScore'] <=> $a['finalScore'];
    });
    
    // Return top matches
    $results = array_slice($scoredTours, 0, $limit);
    
    return [
        'success' => true,
        'tours' => $results,
        'ranking' => [
            'totalToursEvaluated' => count($tours),
            'topMatches' => count($results),
            'averageScore' => round(array_sum(array_column($scoredTours, 'finalScore')) / count($scoredTours), 2)
        ]
    ];
}

/**
 * Calculate detailed scores for a tour across all criteria
 */
function calculateDetailedScores($pdo, $data) {
    $tourId = $data['tourId'] ?? null;
    $criteria = $data['criteria'] ?? [];
    $userPreferences = $data['userPreferences'] ?? [];
    
    if (!$tourId) {
        return ['success' => false, 'message' => 'Tour ID required'];
    }
    
    // Get tour details
    $stmt = $pdo->prepare("
        SELECT * FROM tours WHERE id = ?
    ");
    $stmt->execute([$tourId]);
    $tour = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$tour) {
        return ['success' => false, 'message' => 'Tour not found'];
    }
    
    $scores = [];
    $weights = [];
    $explanations = [];
    
    // Criteria 1: Mood Match
    if (isset($criteria['mood'])) {
        $moodScore = calculateMoodMatch($tour, $criteria['mood']);
        $scores['moodMatch'] = $moodScore;
        $weights['moodMatch'] = 0.25; // 25% weight
        $explanations[] = "Mood match: " . round($moodScore) . "% - Tour category matches your mood";
    }
    
    // Criteria 2: Budget Fit
    if (isset($criteria['budget'])) {
        $budgetScore = calculateBudgetFit($tour['price'], $criteria['budget']);
        $scores['budgetFit'] = $budgetScore;
        $weights['budgetFit'] = 0.20; // 20% weight
        $explanations[] = "Budget fit: " . round($budgetScore) . "% - Price aligns with your budget";
    }
    
    // Criteria 3: Duration Match
    if (isset($criteria['duration'])) {
        $durationScore = calculateDurationMatch($tour['duration_days'], $criteria['duration']);
        $scores['durationMatch'] = $durationScore;
        $weights['durationMatch'] = 0.15; // 15% weight
        $explanations[] = "Duration: " . round($durationScore) . "% - Trip length matches your preference";
    }
    
    // Criteria 4: Quality (Ratings & Reviews)
    $qualityScore = calculateQualityScore($pdo, $tourId, $tour);
    $scores['quality'] = $qualityScore;
    $weights['quality'] = 0.20; // 20% weight
    $explanations[] = "Quality: " . round($qualityScore) . "% - High ratings and reviews";
    
    // Criteria 5: Popularity (Bookings)
    $popularityScore = calculatePopularityScore($pdo, $tourId);
    $scores['popularity'] = $popularityScore;
    $weights['popularity'] = 0.10; // 10% weight
    $explanations[] = "Popularity: " . round($popularityScore) . "% - Many users book this tour";
    
    // Criteria 6: AI Learning Score
    $aiScore = getAILearningScore($pdo, $tourId);
    $scores['aiScore'] = $aiScore;
    $weights['aiScore'] = 0.10; // 10% weight
    $explanations[] = "AI learning: " . round($aiScore) . "% - Based on similar user preferences";
    
    // Calculate weighted final score
    $finalScore = 0;
    $totalWeight = 0;
    
    foreach ($scores as $criterion => $score) {
        if (isset($weights[$criterion])) {
            $finalScore += ($score * $weights[$criterion]);
            $totalWeight += $weights[$criterion];
        }
    }
    
    if ($totalWeight > 0) {
        $finalScore = $finalScore / $totalWeight;
    }
    
    $finalScore = round(min(100, max(0, $finalScore)), 2);
    $matchPercentage = $finalScore;
    
    return [
        'success' => true,
        'data' => [
            'tourId' => $tourId,
            'scores' => $scores,
            'weights' => $weights,
            'finalScore' => $finalScore,
            'matchPercentage' => $matchPercentage,
            'explanation' => $explanations,
            'recommendation' => generateRecommendation($finalScore)
        ]
    ];
}

/**
 * Find the single best match tour for user
 */
function findBestMatchTour($pdo, $data) {
    $criteria = $data['criteria'] ?? [];
    $userPreferences = $data['userPreferences'] ?? [];
    
    $ranking = rankToursWithMultiCriteria($pdo, [
        'criteria' => $criteria,
        'userPreferences' => $userPreferences,
        'limit' => 1
    ]);
    
    if (!empty($ranking['tours'])) {
        $bestTour = $ranking['tours'][0];
        return [
            'success' => true,
            'bestMatch' => $bestTour,
            'confidence' => $bestTour['finalScore'],
            'message' => 'This tour is ' . round($bestTour['finalScore']) . '% compatible with your preferences'
        ];
    }
    
    return [
        'success' => false,
        'message' => 'No suitable tours found'
    ];
}

/**
 * Compare multiple tours side by side
 */
function compareTours($pdo, $data) {
    $tourIds = $data['tourIds'] ?? [];
    $criteria = $data['criteria'] ?? [];
    
    if (empty($tourIds)) {
        return ['success' => false, 'message' => 'Tour IDs required'];
    }
    
    $comparison = [];
    
    foreach ($tourIds as $tourId) {
        $scores = calculateDetailedScores($pdo, [
            'tourId' => $tourId,
            'criteria' => $criteria
        ]);
        
        if ($scores['success']) {
            $comparison[] = $scores['data'];
        }
    }
    
    if (empty($comparison)) {
        return ['success' => false, 'message' => 'No tours found for comparison'];
    }
    
    // Sort by final score
    usort($comparison, function ($a, $b) {
        return $b['finalScore'] <=> $a['finalScore'];
    });
    
    return [
        'success' => true,
        'comparison' => $comparison,
        'winner' => $comparison[0]['tourId'],
        'winnerScore' => $comparison[0]['finalScore'],
        'scores' => array_column($comparison, 'finalScore')
    ];
}

/**
 * Calculate mood-category match score
 */
function calculateMoodMatch($tour, $mood) {
    $moodCategories = [
        'adventurous' => ['adventure', 'trekking', 'extreme'],
        'relaxed' => ['beach', 'wellness', 'spa'],
        'romantic' => ['romantic', 'couple', 'scenic'],
        'cultural' => ['cultural', 'heritage', 'historical'],
        'family' => ['family', 'educational', 'fun'],
        'spiritual' => ['spiritual', 'meditation', 'sacred'],
        'luxury' => ['luxury', 'premium', 'exclusive'],
        'nature_lover' => ['nature', 'wildlife', 'hiking'],
        'happy' => ['adventure', 'beach', 'cultural'],
        'sad' => ['wellness', 'spiritual', 'nature'],
        'energetic' => ['adventure', 'sports', 'water'],
        'peaceful' => ['wellness', 'meditation', 'spa']
    ];
    
    $tourCategory = strtolower($tour['category']);
    $moodCategories = $moodCategories[$mood] ?? [];
    
    if (in_array($tourCategory, $moodCategories)) {
        return 95; // Perfect match
    }
    
    // Partial match scoring
    $score = 50;
    foreach ($moodCategories as $category) {
        if (strpos($tourCategory, $category) !== false) {
            $score = 75;
            break;
        }
    }
    
    return $score;
}

/**
 * Calculate budget fitness score
 */
function calculateBudgetFit($tourPrice, $userBudget) {
    if ($userBudget === null || $userBudget === 0) {
        return 50; // Neutral if no budget specified
    }
    
    $percentageDifference = abs($tourPrice - $userBudget) / $userBudget;
    
    if ($percentageDifference <= 0.1) {
        return 100; // Perfect fit (±10%)
    } elseif ($percentageDifference <= 0.2) {
        return 85; // Good fit (±20%)
    } elseif ($percentageDifference <= 0.3) {
        return 70; // Acceptable (±30%)
    } elseif ($percentageDifference <= 0.5) {
        return 50; // Fair (±50%)
    } else {
        return 30; // Poor fit
    }
}

/**
 * Calculate duration match score
 */
function calculateDurationMatch($tourDuration, $userDuration) {
    if ($userDuration === null || $userDuration === 0) {
        return 50; // Neutral if no preference
    }
    
    $percentageDifference = abs($tourDuration - $userDuration) / $userDuration;
    
    if ($percentageDifference <= 0.1) {
        return 100; // Perfect match (±10%)
    } elseif ($percentageDifference <= 0.25) {
        return 85; // Good match (±25%)
    } elseif ($percentageDifference <= 0.5) {
        return 70; // Acceptable (±50%)
    } else {
        return 40; // Poor match
    }
}

/**
 * Calculate quality score based on ratings
 */
function calculateQualityScore($pdo, $tourId, $tour) {
    $avgRating = $tour['total_rating'] / max(1, $tour['rating_count']) ?? 0;
    
    if ($avgRating >= 4.8) return 95;
    if ($avgRating >= 4.5) return 85;
    if ($avgRating >= 4.0) return 75;
    if ($avgRating >= 3.5) return 60;
    
    return 50;
}

/**
 * Calculate popularity score
 */
function calculatePopularityScore($pdo, $tourId) {
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as booking_count FROM bookings 
        WHERE tour_id = ? AND status = 'confirmed'
    ");
    $stmt->execute([$tourId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $bookings = $result['booking_count'] ?? 0;
    
    if ($bookings >= 100) return 95;
    if ($bookings >= 50) return 85;
    if ($bookings >= 20) return 75;
    if ($bookings >= 5) return 60;
    if ($bookings > 0) return 40;
    
    return 30;
}

/**
 * Get AI learning score for tour
 */
function getAILearningScore($pdo, $tourId) {
    $stmt = $pdo->prepare("
        SELECT learning_score FROM tour_learning_scores WHERE tour_id = ?
    ");
    $stmt->execute([$tourId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    return $result['learning_score'] ?? 50;
}

/**
 * Generate human-readable recommendation
 */
function generateRecommendation($score) {
    if ($score >= 90) return "Excellent match! ⭐⭐⭐⭐⭐";
    if ($score >= 80) return "Very good match ⭐⭐⭐⭐";
    if ($score >= 70) return "Good match ⭐⭐⭐";
    if ($score >= 60) return "Fair match ⭐⭐";
    return "Consider other options";
}
?>
