<?php
/**
 * Conversation Memory & Context Management System
 * Handles multi-turn conversations, context tracking, and user preferences
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
        case 'save_context':
            $response = saveConversationContext($pdo, $input);
            break;
            
        case 'get_context':
            $response = getConversationContext($pdo, $input['sessionId']);
            break;
            
        case 'analyze_history':
            $response = analyzeConversationHistory($input['conversationHistory']);
            break;
            
        case 'update_preferences':
            $response = updateUserPreferences($pdo, $input);
            break;
            
        case 'get_preferences':
            $response = getUserPreferences($pdo, $input['sessionId']);
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
 * Save conversation context to database
 */
function saveConversationContext($pdo, $data) {
    $sessionId = $data['sessionId'] ?? null;
    $conversationData = json_encode($data['context'] ?? []);
    
    ensureConversationTable($pdo);
    
    $stmt = $pdo->prepare("
        INSERT INTO conversation_history (session_id, conversation_data, created_at, updated_at)
        VALUES (?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
            conversation_data = VALUES(conversation_data),
            updated_at = NOW()
    ");
    
    $stmt->execute([$sessionId, $conversationData]);
    
    return [
        'success' => true,
        'message' => 'Context saved',
        'timestamp' => date('Y-m-d H:i:s')
    ];
}

/**
 * Get conversation context from database
 */
function getConversationContext($pdo, $sessionId) {
    ensureConversationTable($pdo);
    
    $stmt = $pdo->prepare("
        SELECT conversation_data, updated_at 
        FROM conversation_history 
        WHERE session_id = ?
        ORDER BY updated_at DESC 
        LIMIT 1
    ");
    
    $stmt->execute([$sessionId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        return [
            'success' => true,
            'context' => json_decode($result['conversation_data'], true),
            'lastUpdated' => $result['updated_at']
        ];
    }
    
    return [
        'success' => false,
        'context' => [],
        'message' => 'No context found'
    ];
}

/**
 * Analyze conversation history for patterns
 */
function analyzeConversationHistory($conversationHistory) {
    $analysis = [
        'totalTurns' => count($conversationHistory),
        'userMessages' => 0,
        'assistantMessages' => 0,
        'topics' => [],
        'intents' => [],
        'mentionedDestinations' => [],
        'mentionedMoods' => [],
        'sentiment' => 'neutral',
        'sentiment_progression' => [],
        'average_message_length' => 0,
        'conversation_coherence' => 0
    ];
    
    $sentiments = [];
    $totalLength = 0;
    $userCount = 0;
    
    foreach ($conversationHistory as $message) {
        if ($message['role'] === 'user') {
            $analysis['userMessages']++;
            $userCount++;
            $totalLength += strlen($message['content']);
            
            // Detect sentiment
            $sentiment = detectSentiment($message['content']);
            $sentiments[] = $sentiment;
            $analysis['sentiment_progression'][] = $sentiment;
            
            // Detect topics
            $topics = detectTopics($message['content']);
            $analysis['topics'] = array_merge($analysis['topics'], $topics);
            
            // Detect moods
            $moods = extractMoods($message['content']);
            $analysis['mentionedMoods'] = array_merge($analysis['mentionedMoods'], $moods);
            
            // Detect destinations
            $destinations = extractDestinations($message['content']);
            $analysis['mentionedDestinations'] = array_merge($analysis['mentionedDestinations'], $destinations);
            
        } else {
            $analysis['assistantMessages']++;
        }
    }
    
    // Calculate metrics
    $analysis['average_message_length'] = $userCount > 0 ? round($totalLength / $userCount, 2) : 0;
    
    // Overall sentiment
    if (!empty($sentiments)) {
        $analysis['sentiment'] = array_count_values($sentiments);
        $analysis['sentiment'] = array_keys($analysis['sentiment'], max($analysis['sentiment']))[0];
    }
    
    // Coherence score (how well conversation flows)
    $analysis['conversation_coherence'] = calculateCoherence($conversationHistory);
    
    // Deduplicate arrays
    $analysis['topics'] = array_unique($analysis['topics']);
    $analysis['mentionedMoods'] = array_unique($analysis['mentionedMoods']);
    $analysis['mentionedDestinations'] = array_unique($analysis['mentionedDestinations']);
    
    return [
        'success' => true,
        'analysis' => $analysis
    ];
}

/**
 * Update user preferences
 */
function updateUserPreferences($pdo, $data) {
    $sessionId = $data['sessionId'] ?? null;
    $preferences = $data['preferences'] ?? [];
    
    ensurePreferencesTable($pdo);
    
    $preferencesJson = json_encode($preferences);
    
    $stmt = $pdo->prepare("
        INSERT INTO user_preferences (session_id, preferences, updated_at)
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE
            preferences = VALUES(preferences),
            updated_at = NOW()
    ");
    
    $stmt->execute([$sessionId, $preferencesJson]);
    
    return [
        'success' => true,
        'message' => 'Preferences updated',
        'preferences' => $preferences
    ];
}

/**
 * Get user preferences
 */
function getUserPreferences($pdo, $sessionId) {
    ensurePreferencesTable($pdo);
    
    $stmt = $pdo->prepare("
        SELECT preferences, updated_at 
        FROM user_preferences 
        WHERE session_id = ?
    ");
    
    $stmt->execute([$sessionId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        return [
            'success' => true,
            'preferences' => json_decode($result['preferences'], true),
            'lastUpdated' => $result['updated_at']
        ];
    }
    
    return [
        'success' => false,
        'preferences' => [],
        'message' => 'No preferences found'
    ];
}

/**
 * Ensure conversation history table exists
 */
function ensureConversationTable($pdo) {
    $sql = "CREATE TABLE IF NOT EXISTS conversation_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        session_id VARCHAR(255) NOT NULL UNIQUE,
        conversation_data LONGTEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_session (session_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql);
}

/**
 * Ensure user preferences table exists
 */
function ensurePreferencesTable($pdo) {
    $sql = "CREATE TABLE IF NOT EXISTS user_preferences (
        id INT PRIMARY KEY AUTO_INCREMENT,
        session_id VARCHAR(255) NOT NULL UNIQUE,
        preferences JSON,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES conversation_history(session_id) ON DELETE CASCADE,
        INDEX idx_session (session_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql);
}

/**
 * Detect sentiment from text
 */
function detectSentiment($text) {
    $lower = strtolower($text);
    
    $positive_words = ['love', 'amazing', 'great', 'excellent', 'perfect', 'awesome', 'wonderful',
                       'fantastic', 'good', 'happy', 'glad', 'joy', 'excited', 'beautiful'];
    $negative_words = ['hate', 'bad', 'terrible', 'awful', 'horrible', 'poor', 'sad', 'angry',
                       'upset', 'disappointed', 'frustrated', 'problem', 'issue', 'wrong'];
    
    $positive_score = 0;
    $negative_score = 0;
    
    foreach ($positive_words as $word) {
        if (strpos($lower, $word) !== false) $positive_score++;
    }
    
    foreach ($negative_words as $word) {
        if (strpos($lower, $word) !== false) $negative_score++;
    }
    
    if ($positive_score > $negative_score) return 'positive';
    if ($negative_score > $positive_score) return 'negative';
    return 'neutral';
}

/**
 * Detect topics in conversation
 */
function detectTopics($text) {
    $lower = strtolower($text);
    $topics = [];
    
    $topic_keywords = [
        'booking' => ['book', 'reserve', 'confirm', 'payment', 'dates'],
        'pricing' => ['price', 'cost', 'budget', 'expensive', 'cheap', 'affordable'],
        'activities' => ['activities', 'things to do', 'attractions', 'explore'],
        'accommodation' => ['hotel', 'resort', 'stay', 'lodge', 'accommodation'],
        'transportation' => ['flight', 'train', 'car', 'bus', 'transport'],
        'weather' => ['weather', 'rain', 'sun', 'cold', 'hot', 'climate'],
        'food' => ['food', 'cuisine', 'restaurant', 'eat', 'meal', 'dining'],
        'duration' => ['days', 'weeks', 'hours', 'duration', 'length', 'how long']
    ];
    
    foreach ($topic_keywords as $topic => $keywords) {
        foreach ($keywords as $keyword) {
            if (strpos($lower, $keyword) !== false) {
                $topics[] = $topic;
                break;
            }
        }
    }
    
    return $topics;
}

/**
 * Extract moods mentioned
 */
function extractMoods($text) {
    $lower = strtolower($text);
    $moods = [];
    
    $mood_list = ['happy', 'sad', 'adventurous', 'relaxed', 'romantic', 'cultural',
                  'family', 'spiritual', 'party', 'nature_lover', 'budget', 'luxury',
                  'energetic', 'peaceful', 'stressed', 'excited', 'calm', 'playful'];
    
    foreach ($mood_list as $mood) {
        if (strpos($lower, $mood) !== false) {
            $moods[] = $mood;
        }
    }
    
    return $moods;
}

/**
 * Extract destinations mentioned
 */
function extractDestinations($text) {
    $lower = strtolower($text);
    $destinations = [];
    
    $destination_list = ['rajasthan', 'goa', 'kerala', 'himalayas', 'kashmir', 'varanasi',
                        'agra', 'jaipur', 'delhi', 'mumbai', 'bangalore', 'udaipur',
                        'jaisalmer', 'shimla', 'manali', 'ladakh', 'assam', 'sikkim'];
    
    foreach ($destination_list as $dest) {
        if (strpos($lower, $dest) !== false) {
            $destinations[] = $dest;
        }
    }
    
    return $destinations;
}

/**
 * Calculate conversation coherence
 * Measures how well messages follow from each other
 */
function calculateCoherence($conversationHistory) {
    if (count($conversationHistory) < 2) return 100;
    
    $coherenceScore = 0;
    $comparisons = 0;
    
    for ($i = 1; $i < count($conversationHistory); $i++) {
        $current = strtolower($conversationHistory[$i]['content']);
        $previous = strtolower($conversationHistory[$i - 1]['content']);
        
        // Check for common words (word similarity)
        $currentWords = explode(' ', $current);
        $previousWords = explode(' ', $previous);
        
        $commonWords = array_intersect($currentWords, $previousWords);
        $similarity = count($commonWords) / max(count($currentWords), count($previousWords));
        
        $coherenceScore += $similarity * 100;
        $comparisons++;
    }
    
    $averageCoherence = $comparisons > 0 ? round($coherenceScore / $comparisons, 2) : 0;
    return min(100, $averageCoherence + 50); // Scale to 0-100
}
?>
