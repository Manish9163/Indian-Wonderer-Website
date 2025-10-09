<?php
/**
 * Travel Management System API
 * RESTful API for Frontend and Admin Panel
 */

header("Content-Type: application/json; charset=UTF-8");

$api_info = [
    "name" => "Travel Management System API",
    "version" => "1.0.0",
    "description" => "RESTful API for travel booking system with admin panel",
    "base_url" => "http://localhost/backend/api/",
    "endpoints" => [
        "authentication" => [
            "POST /auth.php?action=register" => "Register new user",
            "POST /auth.php?action=login" => "User login",
            "GET /auth.php?action=profile" => "Get user profile (requires token)",
            "PUT /auth.php?action=profile" => "Update user profile (requires token)",
            "POST /auth.php?action=change-password" => "Change password (requires token)",
            "GET /auth.php?action=verify" => "Verify token"
        ],
        "tours" => [
            "GET /tours.php?action=all" => "Get all tours with filters",
            "GET /tours.php?action=single&id={id}" => "Get tour by ID",
            "GET /tours.php?action=popular" => "Get popular tours",
            "GET /tours.php?action=search&q={term}" => "Search tours",
            "GET /tours.php?action=stats" => "Get tour statistics (admin only)",
            "POST /tours.php" => "Create new tour (admin only)",
            "PUT /tours.php?id={id}" => "Update tour (admin only)",
            "DELETE /tours.php?id={id}" => "Delete tour (admin only)"
        ],
        "itineraries" => [
            "GET /itineraries.php?action=all" => "Get all itineraries (admin only)",
            "GET /itineraries.php?action=single&id={id}" => "Get itinerary by ID",
            "GET /itineraries.php?action=search&q={term}" => "Search itineraries (admin only)",
            "GET /itineraries.php?action=stats" => "Get itinerary statistics (admin only)",
            "GET /itineraries.php?action=by-tour&tour_id={id}" => "Get itineraries for tour",
            "POST /itineraries.php" => "Create new itinerary (admin only)",
            "PUT /itineraries.php?id={id}" => "Update itinerary (admin only)",
            "DELETE /itineraries.php?id={id}" => "Delete itinerary (admin only)"
        ]
    ],
    "authentication" => [
        "type" => "JWT Bearer Token",
        "header" => "Authorization: Bearer {token}",
        "description" => "Include JWT token in Authorization header for protected endpoints"
    ],
    "response_format" => [
        "success" => [
            "success" => true,
            "message" => "Operation successful",
            "data" => "Response data",
            "timestamp" => "2024-01-01 12:00:00"
        ],
        "error" => [
            "success" => false,
            "message" => "Error message",
            "errors" => "Validation errors (if any)",
            "timestamp" => "2024-01-01 12:00:00"
        ]
    ],
    "status_codes" => [
        200 => "OK - Success",
        201 => "Created - Resource created successfully",
        400 => "Bad Request - Invalid input",
        401 => "Unauthorized - Authentication required",
        403 => "Forbidden - Insufficient permissions",
        404 => "Not Found - Resource not found",
        405 => "Method Not Allowed",
        500 => "Internal Server Error"
    ],
    "setup_instructions" => [
        "1. Create MySQL database using database_schema.sql",
        "2. Update database credentials in config/database.php",
        "3. Update JWT secret key in config/api_config.php",
        "4. Place backend folder in web server directory",
        "5. Update frontend/admin panel API endpoints to point to this backend",
        "6. Test API endpoints using Postman or similar tool"
    ]
];

echo json_encode($api_info, JSON_PRETTY_PRINT);
?>
