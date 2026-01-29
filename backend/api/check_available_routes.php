<?php
header('Content-Type: application/json');

try {
    $conn = new PDO('mysql:host=localhost;dbname=indian_wonderer_base', 'root', '');
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get all unique routes with dates
    $stmt = $conn->query("SELECT DISTINCT from_city, to_city, travel_date, COUNT(*) as option_count 
                          FROM travel_options 
                          WHERE is_active = 1 
                          GROUP BY from_city, to_city, travel_date 
                          ORDER BY from_city, to_city, travel_date");
    
    $routes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get summary
    $summary = $conn->query("SELECT 
        COUNT(DISTINCT CONCAT(from_city, '-', to_city)) as unique_routes,
        COUNT(DISTINCT travel_date) as unique_dates,
        COUNT(*) as total_options,
        MIN(travel_date) as earliest_date,
        MAX(travel_date) as latest_date
        FROM travel_options WHERE is_active = 1")->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'summary' => $summary,
        'routes' => $routes
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
