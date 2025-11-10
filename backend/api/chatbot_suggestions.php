<?php
/**
 * Smart Chatbot API
 * Provides tour suggestions based on weather, season, and user mood
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
    
    // Get request parameters
    $input = json_decode(file_get_contents('php://input'), true);
    
    $weather = $input['weather'] ?? null;
    $season = $input['season'] ?? null;
    $mood = $input['mood'] ?? null;
    $budget = $input['budget'] ?? null;
    $duration = $input['duration'] ?? null;
    $stage = $input['stage'] ?? 'greeting'; // greeting or recommendations
    
    // Validate input - mood is required, but weather and season are optional
    if (!$mood) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing required parameter: mood'
        ]);
        exit;
    }
    
    // Stage 1: Just greet with the mood and ask if they want to go on a trip
    if ($stage === 'greeting') {
        $greetingMessage = getGreetingForMood($mood);
        echo json_encode([
            'success' => true,
            'data' => [
                'stage' => 'greeting',
                'chatbot_message' => $greetingMessage,
                'suggested_tours' => null,
                'next_action' => 'wait_for_confirmation'
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }
    
    // Stage 2: User confirmed they want to go on a trip - show recommendations
    if ($stage === 'recommendations') {
        // If weather or season not provided, use defaults based on mood
        if (!$weather) {
            $weather = 'moderate'; // Default neutral weather
        }
        if (!$season) {
            $season = 'spring'; // Default pleasant season
        }
        
        // Get chatbot suggestions
        $suggestions = getChatbotSuggestions(
            $pdo,
            $weather,
            $season,
            $mood,
            $budget,
            $duration
        );
        
        echo json_encode([
            'success' => true,
            'data' => $suggestions,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }
    
    // Default fallback
    echo json_encode([
        'success' => false,
        'message' => 'Invalid stage parameter'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

function getGreetingForMood($mood) {
    // Friendly greetings acknowledging the mood and asking if they want to travel
    $greetings = [
        'adventurous' => "🌟 Wow! I love your adventurous spirit! 🧗‍♂️\n\nYou're ready for some exciting experiences! Would you like me to suggest some thrilling tours and adventures tailored to your mood? 🚀",
        'relaxed' => "😌 That's wonderful! You're in a great mood for some relaxation! ☀️\n\nWould you like me to suggest some peaceful, beautiful destinations where you can unwind and recharge? 🏖️",
        'romantic' => "💕 Oh, how sweet! Romance is in the air! 💑\n\nWould you like me to suggest some magical, romantic destinations perfect for creating beautiful memories? 🌹",
        'cultural' => "🏛️ Fascinating! You're interested in culture and heritage! 🎭\n\nWould you like me to suggest some amazing cultural destinations rich with history and traditions? 📚",
        'family' => "👨‍👩‍👧‍👦 How lovely! You're thinking about family time! 💚\n\nWould you like me to suggest some fun, family-friendly destinations where everyone can enjoy themselves? 🎢",
        'spiritual' => "🙏 Beautiful! You're seeking spiritual growth! ✨\n\nWould you like me to suggest some sacred, peaceful destinations for meditation and spiritual exploration? 🧘",
        'budget' => "💰 Smart thinking! You're budget-conscious! 💵\n\nWould you like me to suggest some amazing affordable tours without compromising on quality? 🎁",
        'luxury' => "👑 Excellent! You deserve the best! ✨\n\nWould you like me to suggest some exclusive, luxurious destinations for a premium experience? 💎",
        'party' => "🎉 Party mode activated! Let's celebrate! 🎊\n\nWould you like me to suggest some fun, vibrant destinations with amazing nightlife and entertainment? 🎵",
        'nature_lover' => "🌿 Amazing! You love nature! 🌲\n\nWould you like me to suggest some stunning natural destinations perfect for outdoor adventures? 🏕️",
        'happy' => "😊 Your happiness is contagious! 🌟\n\nWould you like me to suggest some exciting destinations to celebrate your amazing mood? 🎉",
        'sad' => "💙 I hear you. It's okay to feel this way, and I'm here for you. 🤗\n\nSometimes a change of scenery can help heal the heart. Would you like me to suggest some peaceful, comforting destinations where you can find solace and rejuvenation? 🌺",
        'energetic' => "⚡ Wow! Your energy is incredible! 🔥\n\nWould you like me to suggest some action-packed, thrilling destinations to match your amazing energy? 🏃",
        'peaceful' => "🕊️ What serenity! You're in a peaceful place mentally! ✨\n\nWould you like me to suggest some tranquil, meditative destinations to nourish your inner peace? 🌸"
    ];
    
    return $greetings[$mood] ?? "✨ I sense your current mood! Would you like me to suggest some perfect tour destinations for you? 🌍";
}

function getChatbotSuggestions($pdo, $weather, $season, $mood, $budget = null, $duration = null) {
    // Define mood-to-tour-type mapping
    $moodMapping = getMoodToTourMapping();
    $weatherMapping = getWeatherToDestinationMapping();
    $seasonMapping = getSeasonToDestinationMapping();
    
    // Get tour types based on mood
    $tourTypes = $moodMapping[$mood] ?? ['adventure', 'cultural', 'relaxation'];
    
    // Get suitable destinations based on weather and season
    $weatherDestinations = $weatherMapping[$weather] ?? [];
    $seasonDestinations = $seasonMapping[$season] ?? [];
    
    // Limit to 2-3 best tours for ALL moods (not overwhelming for user)
    $resultLimit = 3;
    
    // Build SQL query with multiple conditions - INCLUDE PACKAGE DETAILS
    $sql = "
        SELECT DISTINCT
            t.id,
            t.title,
            t.description,
            t.destination,
            t.price,
            t.duration_days,
            t.category,
            t.difficulty_level,
            t.image_url,
            t.max_capacity,
            t.inclusions,
            t.exclusions,
            t.features,
            t.gallery,
            COUNT(DISTINCT b.id) as booking_count,
            AVG(r.rating) as average_rating,
            CASE 
                WHEN t.category IN ('" . implode("','", $tourTypes) . "') THEN 50
                ELSE 0
            END +
            CASE 
                WHEN t.destination IN ('" . implode("','", array_merge($weatherDestinations, $seasonDestinations)) . "') THEN 30
                ELSE 0
            END as relevance_score
        FROM tours t
        LEFT JOIN bookings b ON t.id = b.tour_id AND b.status = 'confirmed'
        LEFT JOIN reviews r ON t.id = r.tour_id AND r.status = 'approved'
        WHERE t.is_active = TRUE
    ";
    
    // Add budget filter if provided
    if ($budget) {
        $budgetRange = getBudgetRange($budget);
        $sql .= " AND t.price >= " . $budgetRange['min'] . " AND t.price <= " . $budgetRange['max'];
    }
    
    // Add duration filter if provided
    if ($duration) {
        $durationRange = getDurationRange($duration);
        $sql .= " AND t.duration_days >= " . $durationRange['min'] . " AND t.duration_days <= " . $durationRange['max'];
    }
    
    $sql .= "
        GROUP BY t.id
        ORDER BY relevance_score DESC, average_rating DESC, booking_count DESC
        LIMIT $resultLimit
    ";
    
    $stmt = $pdo->query($sql);
    $tours = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Generate chatbot response with personality
    $response = generateChatbotResponse($weather, $season, $mood, $tours);
    
    return [
        'chatbot_message' => $response['message'],
        'chatbot_personality' => $response['personality'],
        'suggested_tours' => $tours,
        'filters_applied' => [
            'weather' => $weather,
            'season' => $season,
            'mood' => $mood,
            'budget' => $budget,
            'duration' => $duration
        ]
    ];
}

function getMoodToTourMapping() {
    return [
        'adventurous' => ['adventure', 'trekking', 'water_sports', 'wildlife'],
        'relaxed' => ['beach', 'spa', 'wellness', 'cultural'],
        'romantic' => ['romantic', 'cultural', 'scenic', 'beach'],
        'cultural' => ['cultural', 'heritage', 'historical', 'spiritual'],
        'family' => ['family', 'adventure', 'cultural', 'educational'],
        'budget' => ['cultural', 'heritage', 'nature', 'local_experience'],
        'luxury' => ['luxury', 'exclusive', 'spa', 'premium'],
        'spiritual' => ['spiritual', 'wellness', 'meditation', 'yoga'],
        'party' => ['adventure', 'nightlife', 'social', 'beach'],
        'nature_lover' => ['nature', 'trekking', 'wildlife', 'camping'],
        // Emotional moods
        'happy' => ['beach', 'adventure', 'cultural', 'party', 'social'],
        'sad' => ['wellness', 'spa', 'spiritual', 'nature', 'scenic'],
        'energetic' => ['adventure', 'water_sports', 'trekking', 'wildlife', 'nightlife'],
        'peaceful' => ['wellness', 'spa', 'spiritual', 'nature', 'scenic', 'meditation']
    ];
}

function getWeatherToDestinationMapping() {
    return [
        'sunny' => ['Rajasthan', 'Goa', 'Kerala', 'Varanasi'],
        'rainy' => ['Kerala', 'Himalayas', 'Darjeeling', 'Coorg'],
        'cold' => ['Himalayas', 'Himachal', 'Kashmir', 'Darjeeling'],
        'hot' => ['Goa', 'Rajasthan', 'Kerala', 'Andaman'],
        'windy' => ['Himalayas', 'Coastal areas', 'Desert'],
        'moderate' => ['All destinations']
    ];
}

function getSeasonToDestinationMapping() {
    return [
        'spring' => ['Himalayas', 'Kashmir', 'Rajasthan', 'Kerala'],
        'summer' => ['Himalayas', 'Himachal', 'Kashmir', 'Darjeeling'],
        'monsoon' => ['Kerala', 'Western Ghats', 'Coorg', 'Assam'],
        'autumn' => ['Rajasthan', 'Agra', 'Varanasi', 'Northern India'],
        'winter' => ['Goa', 'Rajasthan', 'Taj Mahal', 'Desert']
    ];
}

function getBudgetRange($budget) {
    $ranges = [
        'budget' => ['min' => 0, 'max' => 1000],
        'moderate' => ['min' => 1000, 'max' => 3000],
        'premium' => ['min' => 3000, 'max' => 7000],
        'luxury' => ['min' => 7000, 'max' => 999999]
    ];
    return $ranges[$budget] ?? $ranges['moderate'];
}

function getDurationRange($duration) {
    $ranges = [
        'weekend' => ['min' => 1, 'max' => 3],
        'week' => ['min' => 4, 'max' => 7],
        'extended' => ['min' => 8, 'max' => 15],
        'long' => ['min' => 15, 'max' => 999]
    ];
    return $ranges[$duration] ?? $ranges['week'];
}

function generateChatbotResponse($weather, $season, $mood, $tours) {
    $responses = [
        'adventurous' => [
            'sunny' => "🌞 Perfect! The sun is calling your adventurous spirit! I found some thrilling tours that'll get your adrenaline pumping!",
            'rainy' => "🌧️ Rain won't stop a true adventurer! Check out these amazing water sports and jungle trek options!",
            'cold' => "❄️ Brrr! Bundle up and experience the adrenaline rush of snow-based adventures!",
            'hot' => "🔥 Hot weather, hot adventures! These desert and tropical expeditions are perfect for you!",
            'windy' => "💨 Windy conditions make for thrilling experiences! Check these epic adventures!",
            'moderate' => "🌤️ Perfect conditions for an adventure! Let me show you some amazing options!"
        ],
        'relaxed' => [
            'sunny' => "☀️ Time to unwind! I've found some beautiful sunny beach getaways perfect for relaxation.",
            'rainy' => "🌧️ Cozy rainy days deserve cozy wellness retreats. Let me suggest some peaceful escapes.",
            'cold' => "❄️ Nothing beats relaxing by a fireplace with scenic mountain views!",
            'hot' => "🌴 Kick back and cool off! These tropical paradise destinations are your sanctuary.",
            'windy' => "💨 Windy days are perfect for peaceful coastal retreats and relaxation!",
            'moderate' => "🌤️ Perfect weather for a relaxing getaway and wellness retreat!"
        ],
        'romantic' => [
            'sunny' => "💕 Romance is in the air! These sunset destinations are absolutely magical.",
            'rainy' => "🌧️ Nothing says romance like rain-soaked gardens and cozy getaways!",
            'cold' => "❄️ Romantic snowy escapes where you can snuggle up with your special someone!",
            'hot' => "🌹 Heat up your romance! These tropical beaches are perfect for couples!",
            'windy' => "💕 Windy seashores perfect for romantic walks and sunset moments!",
            'moderate' => "💑 Perfect weather for a romantic escape with your loved one!"
        ],
        'cultural' => [
            'sunny' => "🏛️ Explore ancient wonders under clear skies! These cultural treasures await!",
            'rainy' => "🌧️ Rain adds mystery to historic sites! Discover India's cultural heritage.",
            'cold' => "❄️ Perfect weather for temple hopping and cultural exploration!",
            'hot' => "🎭 Immerse yourself in vibrant cultures despite the heat!",
            'windy' => "🏛️ Explore cultural sites with scenic winds and beautiful breezes!",
            'moderate' => "🏛️ Great conditions to explore cultural heritage and historic sites!"
        ],
        'family' => [
            'sunny' => "👨‍👩‍👧‍👦 Fun in the sun! These family-friendly tours have activities for everyone!",
            'rainy' => "🌧️ Indoor and covered attractions perfect for your family adventure!",
            'cold' => "❄️ Snow fun and family activities! Your kids will love this!",
            'hot' => "🎪 Family entertainment and cool water activities await!",
            'windy' => "🎡 Family fun with outdoor activities and adventure parks!",
            'moderate' => "👨‍👩‍👧‍👦 Perfect conditions for family fun and bonding experiences!"
        ],
        'spiritual' => [
            'sunny' => "🙏 Enlightenment awaits under the bright sun! Sacred destinations call.",
            'rainy' => "🌧️ Monsoon blessings! Perfect time for spiritual retreats.",
            'cold' => "❄️ Meditate in serene mountain monasteries surrounded by snow.",
            'hot' => "✨ Feel the spiritual energy in these sacred places!",
            'windy' => "🙏 Spiritual connection with nature's winds and mystical energy!",
            'moderate' => "🧘 Perfect conditions for spiritual exploration and meditation!"
        ],
        'budget' => [
            'sunny' => "💰 Great budget-friendly tours perfect for sunny explorations!",
            'rainy' => "🌧️ Affordable rainy season deals with amazing value!",
            'cold' => "❄️ Budget-friendly cold weather adventures await!",
            'hot' => "🔥 Economical hot weather destinations perfect for your budget!",
            'windy' => "💨 Great deals on windswept coastal getaways!",
            'moderate' => "💵 Excellent budget options for perfect weather travel!"
        ],
        'luxury' => [
            'sunny' => "👑 Luxury awaits under the perfect sun! Exclusive experiences await!",
            'rainy' => "☔ Cozy luxury - perfect for 5-star indoor experiences and spa treatments!",
            'cold' => "❄️ Luxury mountain retreats with world-class amenities!",
            'hot' => "🌴 Exclusive tropical luxury - the ultimate indulgence!",
            'windy' => "💎 Premium beachfront luxury experiences and exclusive resorts!",
            'moderate' => "👑 Perfect conditions for luxury travel and premium experiences!"
        ],
        'party' => [
            'sunny' => "🎉 Party time! Sunny destinations with vibrant nightlife await!",
            'rainy' => "🌧️ Indoor party venues and entertainment options perfect for rainy days!",
            'cold' => "❄️ Winter parties and snow festivals! Let's celebrate!",
            'hot' => "🔥 Hot weather, hot parties! Beach clubs and nightlife calling!",
            'windy' => "🎊 Seaside parties and beach raves with perfect breezes!",
            'moderate' => "🎈 Great weather for outdoor festivals and party destinations!"
        ],
        'nature_lover' => [
            'sunny' => "🌿 Nature's beauty shines under sunny skies! Forests and wildlife await!",
            'rainy' => "🌧️ Lush green landscapes - monsoon is nature's best season!",
            'cold' => "❄️ Pristine snowy mountains and winter wonderlands!",
            'hot' => "🌳 Desert landscapes and tropical biodiversity await!",
            'windy' => "🍃 Windy mountain passes and scenic nature trails!",
            'moderate' => "🌲 Perfect conditions for nature exploration and outdoor adventures!"
        ],
        'happy' => [
            'sunny' => "😊 Your happiness shines brighter than the sun! Let's celebrate with amazing adventures!",
            'rainy' => "🌧️ Even rainy days can't dampen your joy! Let's explore cozy indoor attractions!",
            'cold' => "❄️ Joy in every snowflake! Winter adventures await your cheerful spirit!",
            'hot' => "🔥 Your energy matches this hot weather! Vibrant destinations call!",
            'windy' => "💨 Your positive vibes match the breeze! Scenic escapes await!",
            'moderate' => "😄 Perfect weather to spread your happiness! Beautiful destinations await!"
        ],
        'sad' => [
            'sunny' => "💙 I'm here for you. I understand you're going through a tough time right now. Sometimes, a change of scenery and a little break from routine can help ease the heart. Would you like to explore some peaceful and healing destinations? I've handpicked the best options that focus on rejuvenation and inner peace.",
            'rainy' => "💙 It's okay to feel this way. Rainy days can make us feel heavier, but they can also be a time for healing and reflection. Would you consider taking a break and visiting a serene, peaceful place where you can rest and rejuvenate? I'd love to suggest some tranquil destinations tailored just for you.",
            'cold' => "💙 I care about your wellbeing. Cold times can feel isolating, but warm connections and cozy retreats can help lift your spirits. Would you be open to exploring some beautiful destinations with warm hospitality and welcoming people? Let me show you places that can bring comfort.",
            'hot' => "💙 Your feelings matter, and I'm here to support you. Sometimes, a journey to a peaceful place is exactly what we need. Would you like to take a healing trip to somewhere calm and soothing? I have some wonderful destinations that focus on wellness and inner peace.",
            'windy' => "💙 Change can be healing. Just like the wind brings change, a journey might help you find a new perspective. Would you be interested in exploring destinations that offer peace and renewal? I have some truly special places in mind for you.",
            'moderate' => "💙 I'm really glad you're here. You deserve some care and attention right now. A break to a calm, beautiful location might be just what you need. Would you like me to suggest some peaceful destinations designed for healing and relaxation?"
        ],
        'energetic' => [
            'sunny' => "⚡ Your energy is contagious! Let's channel it into thrilling adventures under the sun!",
            'rainy' => "⚡ Rain won't slow you down! Check out high-energy water sports and adventure activities!",
            'cold' => "⚡ Dynamic you! Let's explore adrenaline-pumping cold weather activities!",
            'hot' => "🔥 You're on fire! These intense, high-energy destinations are perfect for you!",
            'windy' => "💨 Your vigor matches the wind! Let's find exhilarating outdoor adventures!",
            'moderate' => "⚡ Your energy is amazing! Let's find action-packed tours to keep that momentum going!"
        ],
        'peaceful' => [
            'sunny' => "🕊️ Your peaceful energy is beautiful. Let me find serene sunny destinations for quiet contemplation.",
            'rainy' => "🕊️ Rainy days are perfect for peaceful retreats. Let me suggest tranquil places to find inner calm.",
            'cold' => "🕊️ Snow-covered mountains and silence... Let me find peaceful winter retreats for your soul.",
            'hot' => "🕊️ Even in warmth, peace is possible. Let me find serene destinations with spiritual essence.",
            'windy' => "🕊️ Wind whispers peace. Let me suggest tranquil natural escapes for your meditative journey.",
            'moderate' => "🕊️ Perfect conditions for inner peace. Let me find the most serene destinations for you."
        ]
    ];
    
    // Get default response if specific mood/weather combo not found
    $response = $responses[$mood][$weather] ?? "✨ I found some amazing tours tailored just for you!";
    
    // Add package information hint to response
    $packageHint = "\n\n📦 Each package includes: accommodation, transportation, guide, meals & activities!\nClick a tour to see full package details including what's included & excluded.";
    
    return [
        'message' => $response . $packageHint,
        'personality' => 'enthusiastic_guide'
    ];
}
?>
