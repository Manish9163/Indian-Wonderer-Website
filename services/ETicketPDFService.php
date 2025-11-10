<?php
/**
 * E-Ticket PDF Service
 * Generates professional e-tickets for travel bookings
 * Creates HTML files as printable/sendable documents
 */

class ETicketPDFService {
    
    /**
     * Generate e-ticket for booking
     * @param array $bookingData Booking information
     * @param array $passengerData Passenger information
     * @param string $booking_reference Booking reference number
     * @return string File path
     */
    public static function generateETicket($bookingData, $passengerData, $booking_reference) {
        try {
            // Create tickets directory if it doesn't exist
            $ticketsDir = __DIR__ . '/../tickets';
            if (!is_dir($ticketsDir)) {
                if (!mkdir($ticketsDir, 0755, true)) {
                    throw new Exception("Failed to create tickets directory");
                }
            }

            // Generate HTML content
            $htmlContent = self::generateHTMLContent($bookingData, $passengerData, $booking_reference);
            
            // Generate PDF file (actual PDF format, not HTML)
            $fileName = 'eticket_' . $booking_reference . '_' . time() . '.pdf';
            $filePath = $ticketsDir . '/' . $fileName;
            
            // Try to convert HTML to PDF
            $pdfContent = self::htmlToPdf($htmlContent, $bookingData, $passengerData, $booking_reference);
            
            if (!file_put_contents($filePath, $pdfContent)) {
                throw new Exception("Failed to write PDF file");
            }
            
            error_log("✅ E-Ticket PDF generated: {$filePath} (Size: " . filesize($filePath) . " bytes)");
            return $filePath;
            
        } catch (Exception $e) {
            error_log("❌ E-Ticket Generation Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Convert HTML to PDF
     * Tries multiple methods: wkhtmltopdf, online API, or fallback
     */
    private static function htmlToPdf($html, $bookingData = [], $passengerData = [], $booking_reference = '') {
        // Method 1: Try wkhtmltopdf (Windows/Linux/Mac)
        $pdf = self::tryWkhtmltopdf($html);
        if ($pdf !== false) {
            return $pdf;
        }

        // Fallback: Create a professional PDF with actual data
        return self::createProfessionalPdf($bookingData, $passengerData, $booking_reference);
    }

    /**
     * Try using wkhtmltopdf command line tool
     */
    private static function tryWkhtmltopdf($html) {
        $possiblePaths = array(
            'wkhtmltopdf',
            'C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf.exe',
            'C:\\Program Files (x86)\\wkhtmltopdf\\bin\\wkhtmltopdf.exe',
            '/usr/local/bin/wkhtmltopdf',
            '/usr/bin/wkhtmltopdf',
        );

        foreach ($possiblePaths as $path) {
            if (@file_exists($path) || self::commandExists($path)) {
                return self::executeWkhtmltopdf($path, $html);
            }
        }

        return false;
    }

    /**
     * Check if command exists (for Linux/Mac)
     */
    private static function commandExists($cmd) {
        $return = @shell_exec("command -v " . escapeshellarg($cmd) . " 2>&1");
        return !empty($return);
    }

    /**
     * Execute wkhtmltopdf command
     */
    private static function executeWkhtmltopdf($wkhtmlPath, $html) {
        try {
            $tempHtml = tempnam(sys_get_temp_dir(), 'eticket_html_') . '.html';
            $tempPdf = tempnam(sys_get_temp_dir(), 'eticket_pdf_') . '.pdf';

            file_put_contents($tempHtml, $html);

            $cmd = escapeshellcmd($wkhtmlPath) . ' ' .
                   escapeshellarg($tempHtml) . ' ' .
                   escapeshellarg($tempPdf) . ' 2>&1';

            @exec($cmd, $output, $returnCode);

            if ($returnCode === 0 && file_exists($tempPdf)) {
                $content = file_get_contents($tempPdf);
                @unlink($tempHtml);
                @unlink($tempPdf);
                error_log("✅ PDF converted using wkhtmltopdf");
                return $content;
            }

            @unlink($tempHtml);
            @unlink($tempPdf);
        } catch (Exception $e) {
            error_log("⚠️  wkhtmltopdf error: " . $e->getMessage());
        }

        return false;
    }

    /**
     * Create a professional PDF with actual booking data
     */
    private static function createProfessionalPdf($bookingData, $passengerData, $booking_reference) {
        error_log("⚠️  Using PDF generation");
        
        // Extract booking details
        $from = $bookingData['from_city'] ?? 'N/A';
        $to = $bookingData['to_city'] ?? 'N/A';
        $date = isset($bookingData['travel_date']) ? date('d M Y', strtotime($bookingData['travel_date'])) : 'N/A';
        $operator = $bookingData['operator_name'] ?? 'N/A';
        $mode = ucfirst($bookingData['mode'] ?? 'N/A');
        $seats = implode(', ', $bookingData['selected_seats'] ?? []);
        $amount = number_format($bookingData['total_with_seats'] ?? 0, 2);
        $passengers_count = count($passengerData);
        
        // Build content for PDF
        $lines = [
            "═══════════════════════════════════════════",
            "             TRAVEL BOOKING E-TICKET",
            "═══════════════════════════════════════════",
            "",
            "BOOKING REFERENCE: " . strtoupper($booking_reference),
            "STATUS: ✓ CONFIRMED",
            "",
            "─────────────────────────────────────────",
            "JOURNEY DETAILS",
            "─────────────────────────────────────────",
            "From:         " . $from,
            "To:           " . $to,
            "Date:         " . $date,
            "Mode:         " . $mode,
            "Operator:     " . substr($operator, 0, 35),
            "",
            "─────────────────────────────────────────",
            "BOOKING INFORMATION",
            "─────────────────────────────────────────",
            "Seats Reserved: " . $seats,
            "Total Passengers: " . $passengers_count,
            "Total Amount: Rs. " . $amount,
            "",
            "─────────────────────────────────────────",
            "PASSENGER DETAILS",
            "─────────────────────────────────────────",
        ];
        
        // Add passenger details
        foreach ($passengerData as $index => $passenger) {
            $name = $passenger['passenger_name'] ?? 'N/A';
            $age = $passenger['passenger_age'] ?? 'N/A';
            $seat = $passenger['seat_number'] ?? 'N/A';
            $lines[] = "Passenger " . ($index + 1) . ": " . substr($name, 0, 30) . " | Seat: " . $seat . " | Age: " . $age;
        }
        
        $lines[] = "";
        $lines[] = "─────────────────────────────────────────";
        $lines[] = "Generated: " . date('d M Y, h:i A');
        $lines[] = "═══════════════════════════════════════════";
        
        // Escape special characters and build PDF content
        $stream = "BT\n/F1 10 Tf\n40 750 Td\n";
        foreach ($lines as $line) {
            $line = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $line);
            $stream .= "(" . $line . ") Tj\n";
            $stream .= "0 -15 Td\n";
        }
        $stream .= "ET\n";
        
        // Build PDF
        $pdf = "%PDF-1.4\n";
        $obj1 = "1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n";
        $obj2 = "2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n";
        $obj3 = "3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>\nendobj\n";
        $obj4 = "4 0 obj\n<</Length " . strlen($stream) . ">>\nstream\n{$stream}endstream\nendobj\n";
        $obj5 = "5 0 obj\n<</Type/Font/Subtype/Type1/BaseFont/Courier>>\nendobj\n";
        
        $pdf .= $obj1;
        $pos1 = strlen($pdf) - strlen($obj1);
        $pdf .= $obj2;
        $pos2 = strlen($pdf) - strlen($obj2);
        $pdf .= $obj3;
        $pos3 = strlen($pdf) - strlen($obj3);
        $pdf .= $obj4;
        $pos4 = strlen($pdf) - strlen($obj4);
        $pdf .= $obj5;
        $pos5 = strlen($pdf) - strlen($obj5);
        
        $xref = strlen($pdf);
        $pdf .= "xref\n0 6\n";
        $pdf .= sprintf("%010d 65535 f \n", 0);
        $pdf .= sprintf("%010d 00000 n \n", $pos1);
        $pdf .= sprintf("%010d 00000 n \n", $pos2);
        $pdf .= sprintf("%010d 00000 n \n", $pos3);
        $pdf .= sprintf("%010d 00000 n \n", $pos4);
        $pdf .= sprintf("%010d 00000 n \n", $pos5);
        $pdf .= "trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n{$xref}\n%%EOF\n";
        
        return $pdf;
    }

    /**
     * Generate professional HTML e-ticket content
     */
    private static function generateHTMLContent($bookingData, $passengerData, $booking_reference) {
        // Pre-process data for use in heredoc
        $travelTime = $bookingData['travel_time'] ?? 'TBD';
        $vehicleNumber = $bookingData['vehicle_number'] ?? 'N/A';
        $mode = ucfirst($bookingData['mode']);
        $totalTravelers = count($passengerData);
        $basePrice = $bookingData['price'] ?? 0;
        $totalPrice = $bookingData['total_with_seats'] ?? 0;
        $generatedDate = date('d M Y, h:i A');
        $generatedDateTime = date('d M Y, h:i A');
        
        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-Ticket - {$booking_reference}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: #f9f9f9;
            padding: 10px;
            color: #333;
        }
        
        .ticket-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border: 2px dashed #d0d0d0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .ticket-header {
            background: white;
            padding: 20px;
            border-bottom: 3px solid #FF6B35;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .company-logo {
            font-size: 32px;
            font-weight: bold;
            color: #FF6B35;
            letter-spacing: 2px;
        }
        
        .company-tagline {
            font-size: 11px;
            color: #666;
            margin-top: 2px;
        }
        
        .ticket-status {
            background: #28a745;
            color: white;
            padding: 8px 15px;
            border-radius: 3px;
            font-weight: bold;
            font-size: 12px;
            text-align: center;
        }
        
        .ticket-header-right {
            text-align: right;
        }
        
        .booking-ref {
            background: #f9f9f9;
            padding: 15px 20px;
            text-align: center;
            border-bottom: 1px solid #ddd;
        }
        
        .booking-ref-label {
            font-size: 10px;
            color: #999;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        
        .booking-ref-number {
            font-size: 24px;
            font-weight: bold;
            color: #FF6B35;
            font-family: 'Courier New', monospace;
            letter-spacing: 2px;
            margin-top: 3px;
        }
        
        .content {
            padding: 20px;
        }
        
        .journey-section {
            background: white;
            border: 1px solid #ddd;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 3px;
        }
        
        .journey-title {
            font-size: 14px;
            font-weight: bold;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #FF6B35;
        }
        
        .journey-row {
            display: grid;
            grid-template-columns: 2fr 1fr 2fr;
            gap: 20px;
            align-items: center;
            margin-bottom: 20px;
            position: relative;
        }
        
        .journey-point {
            text-align: center;
        }
        
        .journey-city {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }
        
        .journey-time {
            font-size: 14px;
            color: #FF6B35;
            font-weight: bold;
        }
        
        .journey-date {
            font-size: 12px;
            color: #666;
            margin-top: 3px;
        }
        
        .journey-arrow {
            text-align: center;
            color: #FF6B35;
            font-size: 24px;
        }
        
        .travel-details {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 3px;
            margin-bottom: 15px;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .detail-item {
            font-size: 12px;
        }
        
        .detail-label {
            color: #666;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 10px;
            margin-bottom: 4px;
        }
        
        .detail-value {
            color: #333;
            font-size: 14px;
            font-weight: 500;
        }
        
        .passengers-section {
            background: white;
            border: 1px solid #ddd;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 3px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #FF6B35;
        }
        
        .passengers-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        
        .passengers-table thead {
            background: #f0f0f0;
            border-bottom: 2px solid #FF6B35;
        }
        
        .passengers-table th {
            padding: 10px;
            text-align: left;
            font-weight: bold;
            color: #333;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .passengers-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #eee;
        }
        
        .passengers-table tbody tr:nth-child(even) {
            background: #fafafa;
        }
        
        .seat-badge {
            background: #FF6B35;
            color: white;
            padding: 4px 8px;
            border-radius: 3px;
            font-weight: bold;
            font-size: 12px;
            display: inline-block;
        }
        
        .pricing-section {
            background: white;
            border: 1px solid #ddd;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 3px;
        }
        
        .price-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 13px;
            border-bottom: 1px solid #eee;
        }
        
        .price-row.total {
            border-top: 2px solid #FF6B35;
            border-bottom: 2px solid #FF6B35;
            padding: 12px 0;
            font-size: 16px;
            font-weight: bold;
            color: #FF6B35;
            margin: 10px 0;
        }
        
        .price-label {
            color: #666;
        }
        
        .price-value {
            color: #333;
            font-weight: bold;
        }
        
        .important-info {
            background: #fff8f0;
            border-left: 4px solid #FF6B35;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 3px;
        }
        
        .info-title {
            font-weight: bold;
            color: #FF6B35;
            margin-bottom: 10px;
            font-size: 12px;
            text-transform: uppercase;
        }
        
        .info-list {
            list-style: none;
            font-size: 12px;
            color: #333;
            line-height: 1.6;
        }
        
        .info-list li {
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }
        
        .info-list li:before {
            content: "✓";
            color: #FF6B35;
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        
        .footer {
            background: #f9f9f9;
            padding: 15px 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 11px;
            color: #666;
            line-height: 1.6;
        }
        
        .footer-divider {
            margin: 10px 0;
            border-top: 1px solid #ddd;
        }
        
        .barcode-section {
            text-align: center;
            padding: 15px 0;
            margin: 15px 0;
            border-top: 1px dashed #ddd;
            border-bottom: 1px dashed #ddd;
        }
        
        .barcode-placeholder {
            font-family: 'Courier New', monospace;
            font-size: 20px;
            letter-spacing: 3px;
            color: #333;
            margin: 10px 0;
        }
        
        .barcode-label {
            font-size: 10px;
            color: #999;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .ticket-container {
                box-shadow: none;
                border: 1px solid #333;
            }
        }
    </style>
</head>
<body>
    <div class="ticket-container">
        <!-- Header -->
        <div class="ticket-header">
            <div>
                <div class="company-logo">🛫 INDIAN WONDERER</div>
                <div class="company-tagline">Your Journey, Our Passion</div>
            </div>
            <div class="ticket-header-right">
                <div class="ticket-status">✓ CONFIRMED</div>
            </div>
        </div>
        
        <!-- Booking Reference -->
        <div class="booking-ref">
            <div class="booking-ref-label">Booking Reference</div>
            <div class="booking-ref-number">{$booking_reference}</div>
        </div>
        
        <!-- Content -->
        <div class="content">
            <!-- Journey Section -->
            <div class="journey-section">
                <div class="journey-title">Journey Details</div>
                <div class="journey-row">
                    <div class="journey-point">
                        <div class="journey-city">{$bookingData['from_city']}</div>
                        <div class="journey-time">{$travelTime}</div>
                        <div class="journey-date">{$bookingData['travel_date']}</div>
                    </div>
                    <div class="journey-arrow">→</div>
                    <div class="journey-point">
                        <div class="journey-city">{$bookingData['to_city']}</div>
                        <div class="journey-time">Arrival</div>
                        <div class="journey-date">{$bookingData['travel_date']}</div>
                    </div>
                </div>
                
                <div class="travel-details">
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Mode</div>
                            <div class="detail-value">{$mode}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Operator</div>
                            <div class="detail-value">{$bookingData['operator_name']}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Vehicle</div>
                            <div class="detail-value">{$vehicleNumber}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Total Travelers</div>
                            <div class="detail-value">{$totalTravelers}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Passengers Section -->
            <div class="passengers-section">
                <div class="section-title">Passengers</div>
                <table class="passengers-table">
                    <thead>
                        <tr>
                            <th>Passenger Name</th>
                            <th>Age</th>
                            <th>Seat</th>
                            <th>Email</th>
                        </tr>
                    </thead>
                    <tbody>
HTML;

        // Add passengers to table
        foreach ($passengerData as $passenger) {
            $email = !empty($passenger['passenger_email']) ? $passenger['passenger_email'] : 'N/A';
            $html .= <<<HTML
                        <tr>
                            <td>{$passenger['passenger_name']}</td>
                            <td>{$passenger['passenger_age']} yrs</td>
                            <td><span class="seat-badge">{$passenger['seat_number']}</span></td>
                            <td>{$email}</td>
                        </tr>
HTML;
        }

        $html .= <<<HTML
                    </tbody>
                </table>
            </div>
            
            <!-- Pricing Section -->
            <div class="pricing-section">
                <div class="section-title">Price Breakdown</div>
                <div class="price-row">
                    <span class="price-label">Base Fare (per person)</span>
                    <span class="price-value">₹{$basePrice}</span>
                </div>
                <div class="price-row">
                    <span class="price-label">Number of Travelers</span>
                    <span class="price-value">{$totalTravelers}</span>
                </div>
                <div class="price-row total">
                    <span class="price-label">Total Amount Paid</span>
                    <span class="price-value">₹{$totalPrice}</span>
                </div>
                <div class="price-row">
                    <span class="price-label">Payment Status</span>
                    <span class="price-value" style="color: #28a745;">✓ PAID</span>
                </div>
            </div>
            
            <!-- Important Information -->
            <div class="important-info">
                <div class="info-title">Important Information</div>
                <ul class="info-list">
                    <li>Please carry valid photo ID proof (Aadhaar, Passport, Driving License, PAN)</li>
                    <li>Arrive at the pickup point at least 15 minutes before departure</li>
                    <li>Keep this e-ticket safe for check-in</li>
                    <li>No refunds allowed within 24 hours of departure</li>
                    <li>In case of emergency, call support: +91-9876-543-210</li>
                    <li>For modifications, visit: https://indianwonderer.com/bookings</li>
                </ul>
            </div>
            
            <!-- Barcode Section -->
            <div class="barcode-section">
                <div class="barcode-label">BOOKING BARCODE</div>
                <div class="barcode-placeholder">||||| {$booking_reference} |||||</div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div>Generated on: {$generatedDate}</div>
            <div>Booking ID: {$booking_reference}</div>
            <div class="footer-divider"></div>
            <div>This is an electronically generated e-ticket. No signature required.</div>
            <div>For support, contact: support@indianwonderer.com</div>
        </div>
    </div>
</body>
</html>
HTML;

        return $html;
    }
}
?>
