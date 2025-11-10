<?php
/**
 * Download E-Ticket API
 * Allows users to download their e-ticket PDF via email link
 */

header('Content-Type: application/json');

try {
    $booking_reference = $_GET['ref'] ?? null;
    
    if (!$booking_reference) {
        throw new Exception('Booking reference not provided');
    }
    
    // Keep booking reference as-is
    $booking_reference = trim($booking_reference);
    
    // Search for matching PDF file
    // From: /backend/api/travel/download_eticket.php
    // Go up to: /tickets/
    $ticketsDir = realpath(__DIR__ . '/../../../tickets');
    
    if (!$ticketsDir || !is_dir($ticketsDir)) {
        throw new Exception('Tickets directory not found: ' . $ticketsDir);
    }
    
    $files = glob($ticketsDir . '/eticket_' . preg_quote($booking_reference, '/') . '_*.pdf');
    
    if (empty($files)) {
        throw new Exception('E-ticket not found for booking reference: ' . htmlspecialchars($booking_reference));
    }
    
    // Get the most recent file
    $file = end($files);
    
    if (!file_exists($file)) {
        throw new Exception('E-ticket file not found at: ' . $file);
    }
    
    // Set headers for download
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="eticket_' . $booking_reference . '.pdf"');
    header('Content-Length: ' . filesize($file));
    header('Cache-Control: no-cache, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // Stream the file
    readfile($file);
    exit;
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
