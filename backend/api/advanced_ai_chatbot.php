<?php
/**
 * Advanced AI Chatbot Engine
 * Features: NLP, Context Understanding, Intelligent Decision Making, Learning
 */

// Disable error display to prevent HTML output
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Set JSON headers BEFORE any output
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    if (!$pdo) {
        http_response_code(503);
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed. Please try again later.'
        ]);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $userMessage = $input['message'] ?? null;
    $conversationHistory = $input['conversationHistory'] ?? [];
    $userPreferences = $input['userPreferences'] ?? [];
    
    if (!$userMessage) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing required parameter: message'
        ]);
        exit;
    }
    
    // Advanced AI Processing
    $aiResponse = processWithAI($pdo, $userMessage, $conversationHistory, $userPreferences);
    
    echo json_encode([
        'success' => true,
        'data' => $aiResponse,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

/**
 * MAIN AI PROCESSING ENGINE
 * Like ChatGPT: understands context, makes decisions, provides solutions
 */
function processWithAI($pdo, $userMessage, $conversationHistory, $userPreferences) {
    // Step 1: Analyze user intent and extract entities
    $analysis = analyzeUserIntent($userMessage);
    
    // Step 2: Extract entities (mood, budget, duration, destinations)
    $entities = extractEntities($userMessage);
    
    // Step 3: Check conversation context
    $context = buildConversationContext($conversationHistory, $userPreferences);
    
    // Step 4: Make intelligent decisions based on all factors
    $decision = makeIntelligentDecision($analysis, $entities, $context);
    
    // Step 5: Generate appropriate response
    $response = generateSmartResponse($pdo, $decision, $entities, $context, $userMessage);
    
    return $response;
}

/**
 * STEP 1: Analyze Intent (Like ChatGPT understanding)
 */
function analyzeUserIntent($message) {
    $lower = strtolower($message);
    
    $intents = [
        'greeting' => [
            'hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon',
            'good evening', 'howdy', 'welcome', 'namaste', 'salaam', 'hola'
        ],
        'emotion' => [
            'happy', 'sad', 'excited', 'stressed', 'angry', 'anxious', 'depressed',
            'frustrated', 'lonely', 'tired', 'bored', 'confused', 'worried', 'scared',
            'upset', 'disappointed', 'amazed', 'thrilled', 'devastated', 'overwhelmed',
            'calm', 'peaceful', 'relaxed', 'energetic', 'lazy', 'motivated'
        ],
        'recommendation' => [
            'show', 'suggest', 'recommend', 'find', 'looking for', 'want', 'need',
            'mood', 'feeling', 'interested', 'tour', 'package', 'plan', 'trip'
        ],
        'comparison' => [
            'compare', 'difference', 'vs', 'versus', 'better', 'which one', 'cheapest',
            'most expensive', 'better than', 'or', 'either', 'options'
        ],
        'clarification' => [
            'what', 'when', 'where', 'how', 'why', 'tell me', 'explain',
            'details', 'information', 'more about', 'cost', 'price', 'how much'
        ],
        'booking' => [
            'book', 'reserve', 'confirm', 'check availability', 'payment',
            'how to book', 'book now', 'reserve now', 'want to book'
        ],
        'complaint' => [
            'problem', 'issue', 'wrong', 'bad', 'terrible', 'disappointed',
            'refund', 'cancel', 'complain', 'unhappy'
        ],
        'feedback' => [
            'like', 'love', 'great', 'awesome', 'amazing', 'perfect',
            'good', 'excellent', 'bad', 'not good'
        ]
    ];
    
    $detectedIntents = [];
    $confidenceScores = [];
    
    foreach ($intents as $intent => $keywords) {
        $matches = 0;
        foreach ($keywords as $keyword) {
            if (strpos($lower, $keyword) !== false) {
                $matches++;
            }
        }
        
        if ($matches > 0) {
            $confidence = min(100, ($matches / count($keywords)) * 100);
            $detectedIntents[$intent] = $confidence;
        }
    }
    
    arsort($detectedIntents); // Sort by confidence
    
    return [
        'primary_intent' => array_key_first($detectedIntents) ?? 'general',
        'all_intents' => $detectedIntents,
        'confidence' => reset($detectedIntents) ?? 0,
        'raw_message' => $lower
    ];
}

/**
 * STEP 2: Extract Entities (Mood, Budget, Duration, Destinations)
 */
function extractEntities($message) {
    $lower = strtolower($message);
    
    $moods = ['sad', 'happy', 'adventurous', 'relaxed', 'romantic', 'cultural',
              'family', 'spiritual', 'party', 'nature_lover', 'budget', 'luxury',
              'energetic', 'peaceful', 'stressed', 'excited', 'calm', 'playful'];
    
    $destinations = ['rajasthan', 'goa', 'kerala', 'himalayas', 'kashmir', 'varanasi',
                     'agra', 'jaipur', 'delhi', 'mumbai', 'bangalore', 'udaipur',
                     'jaisalmer', 'shimla', 'manali', 'ladakh', 'assam', 'sikkim'];
    
    $seasons = ['spring', 'summer', 'monsoon', 'autumn', 'winter', 'rainy', 'cold', 'hot'];
    
    $entities = [
        'mood' => null,
        'budget' => null,
        'duration' => null,
        'destinations' => [],
        'seasons' => [],
        'travel_type' => null,
        'group_size' => null,
        'interests' => []
    ];
    
    // Extract mood
    foreach ($moods as $mood) {
        if (strpos($lower, $mood) !== false) {
            $entities['mood'] = $mood;
            break;
        }
    }
    
    // Extract destinations
    foreach ($destinations as $dest) {
        if (strpos($lower, $dest) !== false) {
            $entities['destinations'][] = $dest;
        }
    }
    
    // Extract seasons
    foreach ($seasons as $season) {
        if (strpos($lower, $season) !== false) {
            $entities['seasons'][] = $season;
        }
    }
    
    // Extract budget range (e.g., "under 2000", "50000 to 100000")
    if (preg_match('/(?:under|less than|max|upto)\s+(?:₹)?(\d+(?:,\d+)?)/i', $message, $matches)) {
        $entities['budget'] = ['max' => intval(str_replace(',', '', $matches[1]))];
    } elseif (preg_match('/(?:₹)?(\d+(?:,\d+)?)\s+(?:to|-)?\s+(?:₹)?(\d+(?:,\d+)?)/i', $message, $matches)) {
        $entities['budget'] = [
            'min' => intval(str_replace(',', '', $matches[1])),
            'max' => intval(str_replace(',', '', $matches[2]))
        ];
    }
    
    // Extract duration (e.g., "3 days", "2 weeks")
    if (preg_match('/(\d+)\s*(?:days?|d\b)/i', $message, $matches)) {
        $entities['duration'] = intval($matches[1]);
    } elseif (preg_match('/(\d+)\s*(?:weeks?|w\b)/i', $message, $matches)) {
        $entities['duration'] = intval($matches[1]) * 7;
    }
    
    // Extract travel type
    if (strpos($lower, 'solo') !== false) $entities['travel_type'] = 'solo';
    elseif (strpos($lower, 'couple') !== false) $entities['travel_type'] = 'couple';
    elseif (strpos($lower, 'family') !== false) $entities['travel_type'] = 'family';
    elseif (strpos($lower, 'group') !== false) $entities['travel_type'] = 'group';
    
    // Extract group size
    if (preg_match('/(?:for\s+)?(\d+)\s*(?:people|persons|friends)/i', $message, $matches)) {
        $entities['group_size'] = intval($matches[1]);
    }
    
    // Extract interests
    $interests_keywords = [
        'adventure' => ['adventure', 'thrill', 'adrenaline', 'extreme'],
        'culture' => ['culture', 'heritage', 'history', 'museum'],
        'nature' => ['nature', 'wildlife', 'forest', 'mountains'],
        'beach' => ['beach', 'sea', 'sand', 'water'],
        'food' => ['food', 'cuisine', 'restaurants', 'eating'],
        'photography' => ['photography', 'photo', 'pictures', 'scenic']
    ];
    
    foreach ($interests_keywords as $interest => $keywords) {
        foreach ($keywords as $keyword) {
            if (strpos($lower, $keyword) !== false) {
                $entities['interests'][] = $interest;
                break;
            }
        }
    }
    
    return $entities;
}

/**
 * STEP 3: Build Conversation Context (Memory)
 */
function buildConversationContext($conversationHistory, $userPreferences) {
    $context = [
        'turn_count' => count($conversationHistory),
        'user_preferences' => $userPreferences,
        'previous_moods' => [],
        'previous_choices' => [],
        'previous_dislikes' => [],
        'conversation_topic' => null,
        'user_satisfaction' => 0
    ];
    
    // Analyze conversation history
    foreach ($conversationHistory as $turn) {
        if ($turn['role'] === 'user') {
            // Extract mood history
            $lower = strtolower($turn['content']);
            if (strpos($lower, 'sad') !== false) $context['previous_moods'][] = 'sad';
            if (strpos($lower, 'happy') !== false) $context['previous_moods'][] = 'happy';
            
            // Track if user likes/dislikes
            if (strpos($lower, 'like') !== false || strpos($lower, 'love') !== false) {
                $context['user_satisfaction']++;
            }
            if (strpos($lower, 'dislike') !== false || strpos($lower, 'hate') !== false) {
                $context['user_satisfaction']--;
            }
        }
    }
    
    return $context;
}

/**
 * STEP 4: Make Intelligent Decisions (Like ChatGPT Decision Making)
 */
function makeIntelligentDecision($analysis, $entities, $context) {
    $decision = [
        'action' => 'provide_response',
        'response_type' => 'default',
        'should_ask_clarifications' => false,
        'clarification_questions' => [],
        'confidence' => $analysis['confidence'],
        'reasoning' => []
    ];
    
    $intent = $analysis['primary_intent'];
    
    // Decision Logic based on Intent
    switch ($intent) {
        case 'greeting':
            $decision['response_type'] = 'greeting_response';
            $decision['reasoning'][] = "User greeting detected";
            break;
            
        case 'emotion':
            $decision['response_type'] = 'emotion_response';
            $decision['reasoning'][] = "User expressing emotion";
            break;
            
        case 'recommendation':
            // Check if emotion is also detected - prioritize emotion response
            if (isset($analysis['all_intents']['emotion']) && $analysis['all_intents']['emotion'] > 0) {
                $decision['response_type'] = 'emotion_response';
                $decision['reasoning'][] = "User expressing emotion with recommendation";
            }
            // If duration is provided, we can recommend tours directly
            elseif ($entities['duration']) {
                $decision['response_type'] = 'provide_tours';
                $decision['reasoning'][] = "User specified duration - can recommend tours";
            }
            // If destination is provided, we can recommend tours directly
            elseif (!empty($entities['destinations'])) {
                $decision['response_type'] = 'provide_tours';
                $decision['reasoning'][] = "User specified destination - can recommend tours";
            }
            // If mood is missing, ask
            elseif (!$entities['mood']) {
                $decision['response_type'] = 'ask_mood';
                $decision['should_ask_clarifications'] = true;
                $decision['clarification_questions'][] = "What's your current mood or what type of experience are you looking for?";
                $decision['reasoning'][] = "Insufficient information - asking for mood/preference";
            } else {
                $decision['response_type'] = 'provide_tours';
                $decision['reasoning'][] = "User wants recommendations";
            }
            break;
            
        case 'comparison':
            $decision['response_type'] = 'provide_comparison';
            if (count($entities['destinations']) < 2) {
                $decision['should_ask_clarifications'] = true;
                $decision['clarification_questions'][] = "Which destinations would you like to compare?";
            }
            break;
            
        case 'clarification':
            $decision['response_type'] = 'provide_information';
            $decision['reasoning'][] = "User seeking detailed information";
            break;
            
        case 'booking':
            $decision['response_type'] = 'start_booking_process';
            if (!$entities['mood']) {
                $decision['should_ask_clarifications'] = true;
                $decision['clarification_questions'][] = "Which tour would you like to book?";
            }
            break;
            
        case 'complaint':
            $decision['response_type'] = 'handle_complaint';
            $decision['reasoning'][] = "User has complaint - escalate to support";
            break;
    }
    
    // Smart Decision: Ask follow-up questions if unsure
    if ($analysis['confidence'] < 50) {
        $decision['should_ask_clarifications'] = true;
        if (!$decision['clarification_questions']) {
            $decision['clarification_questions'][] = "Could you tell me more about what you're looking for?";
        }
    }
    
    return $decision;
}

/**
 * STEP 5: Generate Smart Response
 */
function generateSmartResponse($pdo, $decision, $entities, $context, $userMessage = '') {
    $response = [
        'message' => '',
        'action' => $decision['action'],
        'suggested_tours' => [],
        'clarification_needed' => $decision['should_ask_clarifications'],
        'follow_up_questions' => [],
        'reasoning' => $decision['reasoning']
    ];
    
    // Generate message based on response type
    switch ($decision['response_type']) {
        case 'greeting_response':
            $greetings = [
                "👋 Hey there! Welcome to TravelBuddy! I'm so excited to help you plan your next adventure! 🌍\n\nWhat kind of tour are you interested in today?",
                "🙏 Namaste! Welcome to TravelBuddy! Ready to explore some amazing destinations? Tell me what you're looking for! ✈️",
                "🎉 Hello! Great to meet you! I'm here to help you find the perfect tour. What's on your mind?",
                "😊 Hi! Welcome aboard! I love helping travelers discover their perfect destinations. What interests you?",
                "🌟 Hey! Excited to help you plan an amazing trip! What kind of experience are you looking for?"
            ];
            $response['message'] = $greetings[array_rand($greetings)];
            $response['follow_up_questions'] = [
                "Show me adventure tours",
                "I want beach vacations",
                "Tell me about cultural tours",
                "Show budget-friendly options"
            ];
            break;
            
        case 'emotion_response':
            // Detect emotion from the user's message directly
            $messageText = strtolower($userMessage);
            
            // Map emotions to tour recommendations
            if (preg_match('/happy|excited|thrilled|amazing|awesome|great|good mood|fantastic|wonderful/i', $messageText)) {
                $response['message'] = "🎉 That's wonderful! Your positive energy is contagious! The best way to celebrate is with an adventure! 🌟\n\n" .
                                      "Let me show you some exciting tours that'll make you even happier! Would you prefer:\n" .
                                      "• Adventure & adrenaline activities\n" .
                                      "• Beach relaxation\n" .
                                      "• Cultural exploration";
                $response['follow_up_questions'] = ["Adventure tours", "Beach vacations", "Cultural tours"];
            }
            elseif (preg_match('/sad|depressed|disappointed|devastated|upset|down|blue/i', $messageText)) {
                $response['message'] = "💙 I hear you. Sometimes a change of scenery is exactly what we need to feel better. Travel has amazing healing power! ✨\n\n" .
                                      "Let me suggest some peaceful tours that'll lift your spirits:\n" .
                                      "• Spiritual & wellness retreats\n" .
                                      "• Nature escapes\n" .
                                      "• Relaxing getaways";
                $response['follow_up_questions'] = ["Spiritual tours", "Nature escapes", "Wellness retreats"];
            }
            elseif (preg_match('/stressed|anxious|worried|overwhelmed|frustrated|tense/i', $messageText)) {
                $response['message'] = "🧘 I totally understand. Stress melts away when you're exploring something beautiful. Let me help you find the perfect escape! 🌿\n\n" .
                                      "I recommend tours that promote relaxation and peace:\n" .
                                      "• Meditation & wellness retreats\n" .
                                      "• Scenic nature walks\n" .
                                      "• Peaceful beach resorts";
                $response['follow_up_questions'] = ["Wellness retreats", "Nature tours", "Beach resorts"];
            }
            elseif (preg_match('/angry|irritated|mad|furious/i', $messageText)) {
                $response['message'] = "⚡ Sometimes we need to channel that energy into something exciting! Adventure is the perfect outlet! 🏔️\n\n" .
                                      "How about these high-energy tours:\n" .
                                      "• Trekking & mountaineering\n" .
                                      "• Water sports & adventure\n" .
                                      "• Extreme activities";
                $response['follow_up_questions'] = ["Trekking tours", "Water sports", "Adventure activities"];
            }
            elseif (preg_match('/tired|lazy|bored|exhausted|drained/i', $messageText)) {
                $response['message'] = "😴 Perfect time for a rejuvenating getaway! Sometimes rest is the best adventure! 🌴\n\n" .
                                      "Let me suggest tours focused on relaxation:\n" .
                                      "• Spa & wellness retreats\n" .
                                      "• Luxury beach vacations\n" .
                                      "• Lazy river cruises";
                $response['follow_up_questions'] = ["Spa retreats", "Beach vacations", "Relaxation tours"];
            }
            elseif (preg_match('/calm|peaceful|relaxed|serene|tranquil/i', $messageText)) {
                $response['message'] = "☮️ What a beautiful mindset! Let's find tours that match your peaceful energy! 🌸\n\n" .
                                      "I'd suggest:\n" .
                                      "• Meditation & spiritual journeys\n" .
                                      "• Scenic countryside tours\n" .
                                      "• Cultural heritage walks";
                $response['follow_up_questions'] = ["Spiritual tours", "Scenic tours", "Cultural tours"];
            }
            else {
                $response['message'] = "💭 Thanks for sharing! Every emotion deserves the right adventure! Tell me more - what kind of experience would match your mood? 🌈";
                $response['follow_up_questions'] = ["Show all tours", "Help me decide", "Popular destinations"];
            }
            break;
            
        case 'ask_mood':
            $response['message'] = "I'd love to help you find the perfect tour! 😊\n\n" .
                                  "To give you the best recommendations, could you tell me about your current mood or how you're feeling?\n\n" .
                                  "For example: adventurous, relaxed, happy, sad, romantic, cultural, or any other mood!\n\n" .
                                  "Other details that help (optional):\n" .
                                  "• Budget (e.g., under ₹5000)\n" .
                                  "• Duration (e.g., 3 days)\n" .
                                  "• Destinations you like";
            $response['follow_up_questions'] = $decision['clarification_questions'];
            break;
            
        case 'provide_tours':
            $response['suggested_tours'] = getSmartTourRecommendations($pdo, $entities);
            $tourCount = count($response['suggested_tours']);
            
            if ($tourCount === 0) {
                $response['message'] = "Hmm, I couldn't find tours matching your exact criteria. " .
                                      "But don't worry! Let me suggest alternatives:\n\n" .
                                      "Would you prefer:\n" .
                                      "• Different budget range\n" .
                                      "• Different destination\n" .
                                      "• Different duration";
            } else {
                $response['message'] = "Perfect! 🎯 Based on your " . ($entities['mood'] ?? 'preferences') . " mood, " .
                                      "I found these amazing tours just for you!\n\n" .
                                      "💡 Tip: Each includes accommodation, meals, guide, and activities!\n\n" .
                                      "Would you like to:\n" .
                                      "• Learn more about any tour\n" .
                                      "• See different options\n" .
                                      "• Book one now";
            }
            break;
            
        case 'provide_comparison':
            $response['message'] = "Great question! Let me compare these for you:\n\n" .
                                  "I'll show you side-by-side:\n" .
                                  "• Price comparison\n" .
                                  "• What's included\n" .
                                  "• Best for (your mood)\n" .
                                  "• User ratings\n\n" .
                                  "This will help you make the best choice! 🎯";
            break;
            
        case 'start_booking_process':
            $response['message'] = "Exciting! 🎉 Let's get you booked!\n\n" .
                                  "To complete your booking, I'll need:\n" .
                                  "1. Your preferred tour\n" .
                                  "2. Travel dates\n" .
                                  "3. Number of people\n" .
                                  "4. Payment method\n\n" .
                                  "Let's start: Which tour would you like to book?";
            break;
            
        case 'handle_complaint':
            $response['message'] = "I'm sorry to hear you're facing an issue. 😔\n\n" .
                                  "Your satisfaction is important to us! Let me connect you with our " .
                                  "support team who can help resolve this immediately.\n\n" .
                                  "📞 Call us: +91-9876543210\n" .
                                  "📧 Email: support@traveler.com\n" .
                                  "💬 Chat: Available 24/7\n\n" .
                                  "They'll take care of you! ✅";
            break;
            
        default:
            $response['message'] = "I'm here to help! 😊 What would you like to know?\n\n" .
                                  "I can:\n" .
                                  "• Suggest perfect tours based on your mood\n" .
                                  "• Compare destinations\n" .
                                  "• Help with bookings\n" .
                                  "• Answer travel questions";
    }
    
    return $response;
}

/**
 * Smart Tour Recommendation Algorithm
 */
function getSmartTourRecommendations($pdo, $entities) {
    $mood = $entities['mood'] ?? 'relaxed';
    $budget = $entities['budget'] ?? null;
    $duration = $entities['duration'] ?? null;
    $destinations = $entities['destinations'] ?? [];
    $interests = $entities['interests'] ?? [];
    
    // Map mood to tour categories
    $moodCategories = [
        'adventurous' => ['adventure', 'trekking', 'water_sports'],
        'relaxed' => ['beach', 'spa', 'wellness'],
        'romantic' => ['romantic', 'scenic'],
        'cultural' => ['cultural', 'heritage'],
        'family' => ['family', 'educational'],
        'spiritual' => ['spiritual', 'meditation'],
        'party' => ['adventure', 'nightlife'],
        'nature_lover' => ['nature', 'wildlife'],
        'happy' => ['adventure', 'cultural', 'beach'],
        'sad' => ['wellness', 'spiritual', 'nature'],
        'budget' => ['cultural', 'heritage'],
        'luxury' => ['luxury', 'exclusive'],
        'energetic' => ['adventure', 'water_sports'],
        'peaceful' => ['wellness', 'spiritual']
    ];
    
    $categories = $moodCategories[$mood] ?? ['relaxation', 'cultural'];
    
    $sql = "SELECT DISTINCT
            t.id, t.title, t.description, t.destination, t.price,
            t.duration_days, t.category, t.difficulty_level, t.image_url,
            t.inclusions, t.features, t.gallery,
            COUNT(DISTINCT b.id) as booking_count,
            AVG(r.rating) as average_rating,
            (SELECT COUNT(*) FROM reviews WHERE tour_id = t.id) as review_count,
            CASE 
                WHEN t.category IN ('" . implode("','", $categories) . "') THEN 100
                WHEN t.difficulty_level = 'easy' THEN 20
                ELSE 0
            END as relevance_score
            FROM tours t
            LEFT JOIN bookings b ON t.id = b.tour_id AND b.status = 'confirmed'
            LEFT JOIN reviews r ON t.id = r.tour_id AND r.status = 'approved'
            WHERE t.is_active = TRUE";
    
    // Apply filters
    if ($budget && isset($budget['max'])) {
        $sql .= " AND t.price <= " . intval($budget['max']);
    }
    
    if ($duration) {
        $tolerance = ceil($duration * 0.3); // 30% tolerance
        $sql .= " AND t.duration_days BETWEEN " . max(1, $duration - $tolerance) . 
                " AND " . ($duration + $tolerance);
    }
    
    if ($destinations) {
        $sql .= " AND t.destination IN ('" . implode("','", array_map('addslashes', $destinations)) . "')";
    }
    
    $sql .= " GROUP BY t.id
             ORDER BY relevance_score DESC, average_rating DESC, booking_count DESC
             LIMIT 3";
    
    $stmt = $pdo->query($sql);
    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?? [];
}
?>
