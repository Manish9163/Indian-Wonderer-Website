<?php
/**
 * Advanced Conversational AI Features
 * Follow-up questions, clarifications, personalization, context-aware responses
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
        case 'generate_followups':
            $response = generateFollowUpQuestions($pdo, $input);
            break;
            
        case 'ask_clarifications':
            $response = generateClarificationQuestions($pdo, $input);
            break;
            
        case 'personalize_response':
            $response = personalizeResponse($pdo, $input);
            break;
            
        case 'context_aware_response':
            $response = generateContextAwareResponse($pdo, $input);
            break;
            
        case 'suggest_refinement':
            $response = suggestSearchRefinement($pdo, $input);
            break;
            
        case 'handle_ambiguity':
            $response = handleAmbiguousRequest($pdo, $input);
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
 * Generate contextual follow-up questions based on conversation
 */
function generateFollowUpQuestions($pdo, $data) {
    $conversationHistory = $data['conversationHistory'] ?? [];
    $lastRecommendation = $data['lastRecommendation'] ?? null;
    $userPreferences = $data['userPreferences'] ?? [];
    
    $followUps = [];
    
    // Analyze what was discussed
    $discussed = [
        'mood' => false,
        'budget' => false,
        'duration' => false,
        'destination' => false,
        'group' => false
    ];
    
    foreach ($conversationHistory as $msg) {
        $lower = strtolower($msg['content']);
        if (strpos($lower, 'happy') !== false || strpos($lower, 'sad') !== false) $discussed['mood'] = true;
        if (strpos($lower, '₹') !== false || strpos($lower, 'budget') !== false) $discussed['budget'] = true;
        if (strpos($lower, 'day') !== false || strpos($lower, 'week') !== false) $discussed['duration'] = true;
        if (strpos($lower, 'goa') !== false || strpos($lower, 'kerala') !== false) $discussed['destination'] = true;
        if (strpos($lower, 'people') !== false || strpos($lower, 'group') !== false) $discussed['group'] = true;
    }
    
    // Generate follow-ups for missing info
    if (!$discussed['mood']) {
        $followUps[] = [
            'question' => '🎭 What\'s your current mood? Are you feeling adventurous, relaxed, romantic, or something else?',
            'priority' => 'high',
            'type' => 'mood_clarification'
        ];
    }
    
    if (!$discussed['budget']) {
        $followUps[] = [
            'question' => '💰 Do you have a budget range in mind? (e.g., under ₹15,000 or ₹50,000-75,000)',
            'priority' => 'high',
            'type' => 'budget_clarification'
        ];
    }
    
    if (!$discussed['duration']) {
        $followUps[] = [
            'question' => '📅 How many days are you planning to travel? (3 days, 1 week, etc.)',
            'priority' => 'medium',
            'type' => 'duration_clarification'
        ];
    }
    
    if (!$discussed['destination']) {
        $followUps[] = [
            'question' => '📍 Any specific destination in mind? Popular options: Goa, Kerala, Himalayas, Rajasthan',
            'priority' => 'medium',
            'type' => 'destination_suggestion'
        ];
    }
    
    if (!$discussed['group']) {
        $followUps[] = [
            'question' => '👥 Who are you traveling with? Solo, with a partner, family, or a group?',
            'priority' => 'medium',
            'type' => 'group_clarification'
        ];
    }
    
    // If tours were shown, ask for feedback
    if ($lastRecommendation && count($conversationHistory) > 4) {
        $followUps[] = [
            'question' => '👍 Did any of these tours catch your eye? You can click "Like" on any tour to help me understand better!',
            'priority' => 'high',
            'type' => 'feedback_request',
            'actionButtons' => ['Like', 'Dislike', 'Book']
        ];
    }
    
    // Prioritize follow-ups
    usort($followUps, function ($a, $b) {
        $priority = ['high' => 3, 'medium' => 2, 'low' => 1];
        return ($priority[$b['priority']] ?? 0) <=> ($priority[$a['priority']] ?? 0);
    });
    
    return [
        'success' => true,
        'followUps' => array_slice($followUps, 0, 3), // Return top 3
        'count' => count($followUps)
    ];
}

/**
 * Generate clarification questions for ambiguous requests
 */
function generateClarificationQuestions($pdo, $data) {
    $userMessage = $data['userMessage'] ?? '';
    $ambiguities = identifyAmbiguities($userMessage);
    
    $clarifications = [];
    
    foreach ($ambiguities as $ambiguity) {
        switch ($ambiguity['type']) {
            case 'budget_unclear':
                $clarifications[] = [
                    'issue' => 'Budget not clear',
                    'question' => '💰 Just to clarify: Are you looking for ' . $ambiguity['options'][0] . ' or ' . $ambiguity['options'][1] . '?',
                    'options' => $ambiguity['options']
                ];
                break;
                
            case 'destination_ambiguous':
                $clarifications[] = [
                    'issue' => 'Multiple destinations possible',
                    'question' => '📍 You mentioned several places. Which is your top priority?',
                    'options' => $ambiguity['options']
                ];
                break;
                
            case 'mood_multiple':
                $clarifications[] = [
                    'issue' => 'Multiple moods mentioned',
                    'question' => '🎭 I sense different vibes. Which mood resonates most with you right now?',
                    'options' => $ambiguity['options']
                ];
                break;
        }
    }
    
    return [
        'success' => true,
        'clarifications' => $clarifications,
        'ambiguitiesFound' => count($ambiguities)
    ];
}

/**
 * Personalize response based on user profile
 */
function personalizeResponse($pdo, $data) {
    $sessionId = $data['sessionId'] ?? null;
    $baseMessage = $data['message'] ?? '';
    $userPreferences = $data['userPreferences'] ?? [];
    
    // Fetch user profile to personalize
    $stmt = $pdo->prepare("
        SELECT 
            favorite_destinations,
            interaction_count
        FROM user_learning_profiles
        WHERE session_id = ?
    ");
    $stmt->execute([$sessionId]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $personalized = $baseMessage;
    
    // Add personalization based on user history
    if ($profile) {
        $interactionCount = $profile['interaction_count'] ?? 0;
        
        if ($interactionCount > 10) {
            // Loyal user - add personal touches
            $personalized .= "\n\n✨ I notice you love adventurous trips! Let me find something extra special.";
        } elseif ($interactionCount > 5) {
            // Engaged user
            $personalized .= "\n\n📍 Based on your interests, here are my top picks:";
        } else {
            // New user
            $personalized .= "\n\nLet me help you discover your next perfect getaway!";
        }
    }
    
    return [
        'success' => true,
        'originalMessage' => $baseMessage,
        'personalizedMessage' => $personalized,
        'personalizationLevel' => $profile ? 'high' : 'low'
    ];
}

/**
 * Generate context-aware responses
 */
function generateContextAwareResponse($pdo, $data) {
    $conversationHistory = $data['conversationHistory'] ?? [];
    $currentTopic = $data['topic'] ?? 'general';
    $userSentiment = $data['sentiment'] ?? 'neutral';
    $responseType = $data['responseType'] ?? 'recommendation';
    
    $response = '';
    
    // Adjust tone based on sentiment
    $tonePrefix = '';
    if ($userSentiment === 'negative') {
        $tonePrefix = 'I understand your concern. ';
    } elseif ($userSentiment === 'positive') {
        $tonePrefix = 'Great to hear your enthusiasm! ';
    }
    
    // Topic-specific responses
    switch ($currentTopic) {
        case 'booking':
            $response = $tonePrefix . "Perfect! Let's complete your booking. I'll guide you through each step to make it smooth and easy.";
            break;
            
        case 'comparison':
            $response = $tonePrefix . "Let me break down the differences for you:";
            break;
            
        case 'complaint':
            $response = "I'm sorry you're facing this issue. " . ($userSentiment === 'negative' 
                ? "Your satisfaction is our priority. Let me connect you with our support team." 
                : "Let's resolve this together!");
            break;
            
        case 'price':
            $response = $tonePrefix . "I found great value options that fit your budget without compromising on quality.";
            break;
            
        case 'destination':
            $response = $tonePrefix . "This destination is perfect for your mood! Here's why:";
            break;
            
        default:
            $response = $tonePrefix . "Based on what you've told me, here are my recommendations:";
    }
    
    // Add context-specific details
    $contextDetails = [];
    
    if (count($conversationHistory) > 1) {
        $contextDetails[] = "I remember you mentioned an interest in adventures";
    }
    
    if (count($contextDetails) > 0) {
        $response .= "\n\n✨ " . implode(", ", $contextDetails) . ".";
    }
    
    return [
        'success' => true,
        'response' => $response,
        'tone' => $tonePrefix ? 'adjusted' : 'neutral',
        'contextLevel' => 'high'
    ];
}

/**
 * Suggest search refinement for better results
 */
function suggestSearchRefinement($pdo, $data) {
    $toursFound = $data['toursFound'] ?? 0;
    $searchCriteria = $data['criteria'] ?? [];
    $message = '';
    $suggestions = [];
    
    if ($toursFound === 0) {
        $message = 'No tours found with your criteria. Let me suggest some refinements:';
        
        if (isset($searchCriteria['budget'])) {
            $suggestions[] = '💰 Increase budget by ₹5,000-10,000 for more options';
        }
        if (isset($searchCriteria['destination'])) {
            $suggestions[] = '📍 Try nearby destinations in the same region';
        }
        if (isset($searchCriteria['duration'])) {
            $suggestions[] = '📅 Adjust trip length by 1-2 days';
        }
        
    } elseif ($toursFound < 3) {
        $message = 'Found a few options, but let me expand the search:';
        $suggestions[] = '🔍 Try adjusting your preferences slightly for more choices';
        
    } else {
        $message = 'Great! I found several perfect matches for you.';
    }
    
    return [
        'success' => true,
        'message' => $message,
        'suggestions' => $suggestions,
        'toursFound' => $toursFound
    ];
}

/**
 * Handle ambiguous or unclear requests
 */
function handleAmbiguousRequest($pdo, $data) {
    $userMessage = $data['userMessage'] ?? '';
    $sessionId = $data['sessionId'] ?? null;
    
    // Determine ambiguity level
    $ambiguityScore = calculateAmbiguityScore($userMessage);
    
    if ($ambiguityScore > 70) {
        // Very ambiguous - ask multiple clarifications
        return [
            'success' => true,
            'ambiguityLevel' => 'high',
            'action' => 'ask_clarifications',
            'message' => "I want to help, but I need a bit more information. Could you tell me:",
            'questions' => [
                "1️⃣ What's your mood or how are you feeling?",
                "2️⃣ What's your approximate budget?",
                "3️⃣ How many days can you travel?"
            ]
        ];
        
    } elseif ($ambiguityScore > 40) {
        // Moderately ambiguous - ask for clarification
        return [
            'success' => true,
            'ambiguityLevel' => 'medium',
            'action' => 'partial_clarification',
            'message' => 'A bit more detail would help me find the perfect tour:',
            'clarifyingQuestions' => identifyMissingInfo($userMessage)
        ];
        
    } else {
        // Clear request
        return [
            'success' => true,
            'ambiguityLevel' => 'low',
            'action' => 'proceed',
            'message' => 'I understand! Let me find the best tours for you.'
        ];
    }
}

/**
 * Calculate how ambiguous a message is
 */
function calculateAmbiguityScore($message) {
    $lower = strtolower($message);
    $score = 0;
    
    // Score increases for ambiguous phrases
    if (strpos($lower, 'something') !== false) $score += 10;
    if (strpos($lower, 'any') !== false) $score += 10;
    if (strpos($lower, 'show me tours') === 0) $score += 20;
    if (strlen($message) < 15) $score += 15;
    
    // Score decreases for specific details
    if (preg_match('/₹?\d+/', $message)) $score -= 15;
    if (preg_match('/\d+\s*(days|weeks)/', $message)) $score -= 15;
    if (strpos($lower, 'goa') !== false) $score -= 10;
    if (strpos($lower, 'kerala') !== false) $score -= 10;
    
    return max(0, min(100, $score + 50));
}

/**
 * Identify what information is missing
 */
function identifyMissingInfo($message) {
    $missing = [];
    $lower = strtolower($message);
    
    if (!preg_match('/(happy|sad|adventurous|relaxed|romantic)/', $lower)) {
        $missing[] = '🎭 What mood are you in?';
    }
    
    if (!preg_match('/₹?\d+|budget|price|cost/i', $message)) {
        $missing[] = '💰 What\'s your budget range?';
    }
    
    if (!preg_match('/\d+\s*(days?|weeks?)/', $message)) {
        $missing[] = '📅 How long do you want to travel?';
    }
    
    if (!preg_match('/(goa|kerala|himalayas|rajasthan)/', $lower)) {
        $missing[] = '📍 Any destination preference?';
    }
    
    return $missing;
}

/**
 * Identify ambiguities in user message
 */
function identifyAmbiguities($message) {
    $ambiguities = [];
    $lower = strtolower($message);
    
    // Check for budget ambiguity
    if (preg_match('/(\d+).*(\d+)/', $message, $matches)) {
        if ($matches[1] != $matches[2]) {
            $ambiguities[] = [
                'type' => 'budget_unclear',
                'options' => ['₹' . $matches[1], '₹' . $matches[2]]
            ];
        }
    }
    
    // Check for multiple destinations
    $destinations = [];
    foreach (['goa', 'kerala', 'himalayas', 'rajasthan'] as $dest) {
        if (strpos($lower, $dest) !== false) {
            $destinations[] = ucfirst($dest);
        }
    }
    if (count($destinations) > 1) {
        $ambiguities[] = [
            'type' => 'destination_ambiguous',
            'options' => $destinations
        ];
    }
    
    // Check for multiple moods
    $moods = [];
    foreach (['happy', 'sad', 'adventurous', 'relaxed'] as $mood) {
        if (strpos($lower, $mood) !== false) {
            $moods[] = ucfirst($mood);
        }
    }
    if (count($moods) > 1) {
        $ambiguities[] = [
            'type' => 'mood_multiple',
            'options' => $moods
        ];
    }
    
    return $ambiguities;
}
?>
