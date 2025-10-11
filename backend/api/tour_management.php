<?php

ob_start();

error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$pdo = $database->getConnection();

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'start':
            startTour($pdo);
            break;
        case 'complete':
            completeTour($pdo);
            break;
        case 'status':
            getTourStatus($pdo);
            break;
        default:
            ob_clean();
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action'
            ]);
    }
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}

function startTour($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $bookingId = $input['booking_id'] ?? null;
    $guideId = $input['guide_id'] ?? null;
    
    if (!$bookingId || !$guideId) {
        ob_clean();
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Booking ID and Guide ID are required'
        ]);
        return;
    }
    
    $pdo->beginTransaction();
    
    try {
        $stmt = $pdo->prepare("
            SELECT tga.id as assignment_id, tga.status, b.tour_id, b.user_id,
                   t.title as tour_name, u.first_name, u.last_name, u.email
            FROM tour_guide_assignments tga
            JOIN bookings b ON tga.booking_id = b.id
            JOIN tours t ON b.tour_id = t.id
            JOIN users u ON b.user_id = u.id
            WHERE tga.booking_id = ? AND tga.guide_id = ?
        ");
        $stmt->execute([$bookingId, $guideId]);
        $assignment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$assignment) {
            throw new Exception('Assignment not found');
        }
        
        $updateStmt = $pdo->prepare("
            UPDATE tour_guide_assignments 
            SET status = 'in_progress', 
                notes = CONCAT(COALESCE(notes, ''), '\nTour started at ', NOW())
            WHERE id = ?
        ");
        $updateStmt->execute([$assignment['assignment_id']]);
        
        $updateBookingStmt = $pdo->prepare("
            UPDATE bookings 
            SET status = 'in_progress',
                updated_at = NOW()
            WHERE id = ?
        ");
        $updateBookingStmt->execute([$bookingId]);
        
        $sessionStmt = $pdo->prepare("
            INSERT INTO tour_sessions 
            (booking_id, guide_id, user_id, tour_id, status, started_at, created_at)
            VALUES (?, ?, ?, ?, 'started', NOW(), NOW())
            ON DUPLICATE KEY UPDATE 
            status = 'started',
            started_at = NOW(),
            updated_at = NOW()
        ");
        $sessionStmt->execute([
            $bookingId,
            $guideId,
            $assignment['user_id'],
            $assignment['tour_id']
        ]);
        
        $pdo->commit();
        
        ob_clean();
        echo json_encode([
            'success' => true,
            'message' => 'Tour started successfully',
            'data' => [
                'booking_id' => $bookingId,
                'status' => 'in_progress',
                'started_at' => date('Y-m-d H:i:s')
            ]
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function completeTour($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $bookingId = $input['booking_id'] ?? null;
    $guideId = $input['guide_id'] ?? null;
    
    if (!$bookingId || !$guideId) {
        ob_clean();
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Booking ID and Guide ID are required'
        ]);
        return;
    }
    
    $pdo->beginTransaction();
    
    try {
        $stmt = $pdo->prepare("
            SELECT tga.id as assignment_id, b.total_amount, b.user_id, b.tour_id,
                   t.title as tour_name, u.email, u.first_name, u.last_name
            FROM tour_guide_assignments tga
            JOIN bookings b ON tga.booking_id = b.id
            JOIN tours t ON b.tour_id = t.id
            JOIN users u ON b.user_id = u.id
            WHERE tga.booking_id = ? AND tga.guide_id = ?
        ");
        $stmt->execute([$bookingId, $guideId]);
        $assignment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$assignment) {
            throw new Exception('Assignment not found');
        }
        
        $updateStmt = $pdo->prepare("
            UPDATE tour_guide_assignments 
            SET status = 'completed',
                completed_date = NOW(),
                notes = CONCAT(COALESCE(notes, ''), '\nTour completed at ', NOW())
            WHERE id = ?
        ");
        $updateStmt->execute([$assignment['assignment_id']]);
        
        $updateBookingStmt = $pdo->prepare("
            UPDATE bookings 
            SET status = 'completed',
                updated_at = NOW()
            WHERE id = ?
        ");
        $updateBookingStmt->execute([$bookingId]);
        
        $sessionStmt = $pdo->prepare("
            UPDATE tour_sessions 
            SET status = 'completed',
                completed_at = NOW(),
                updated_at = NOW()
            WHERE booking_id = ?
        ");
        $sessionStmt->execute([$bookingId]);
        
        $earningAmount = $assignment['total_amount'] * 0.30;
        
        $earningStmt = $pdo->prepare("
            INSERT INTO guide_earnings 
            (guide_id, assignment_id, booking_id, amount, status, earned_at)
            VALUES (?, ?, ?, ?, 'earned', NOW())
            ON DUPLICATE KEY UPDATE
            amount = VALUES(amount),
            status = 'earned',
            earned_at = NOW()
        ");
        $earningStmt->execute([
            $guideId,
            $assignment['assignment_id'],
            $bookingId,
            $earningAmount
        ]);
        
        $pdo->commit();
        
        ob_clean();
        echo json_encode([
            'success' => true,
            'message' => 'Tour completed successfully',
            'data' => [
                'booking_id' => $bookingId,
                'status' => 'completed',
                'completed_at' => date('Y-m-d H:i:s'),
                'earning_amount' => $earningAmount
            ]
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}


function getTourStatus($pdo) {
    $bookingId = $_GET['booking_id'] ?? null;
    
    if (!$bookingId) {
        ob_clean();
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Booking ID is required'
        ]);
        return;
    }
    
    $stmt = $pdo->prepare("
        SELECT 
            tga.status as assignment_status,
            b.status as booking_status,
            ts.status as session_status,
            ts.started_at,
            ts.completed_at
        FROM tour_guide_assignments tga
        JOIN bookings b ON tga.booking_id = b.id
        LEFT JOIN tour_sessions ts ON b.id = ts.booking_id
        WHERE tga.booking_id = ?
    ");
    $stmt->execute([$bookingId]);
    $status = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$status) {
        ob_clean();
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Booking not found'
        ]);
        return;
    }
    
    ob_clean();
    echo json_encode([
        'success' => true,
        'data' => $status
    ]);
}
