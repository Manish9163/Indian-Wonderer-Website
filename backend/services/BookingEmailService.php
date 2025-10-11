<?php

require_once __DIR__ . '/../lib/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/../lib/PHPMailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class BookingEmailService
{
    private $config;
    private $mail;
    
    public function __construct()
    {
        $this->config = require __DIR__ . '/../config/email_config.php';
        $this->initializeMailer();
    }
    
    private function initializeMailer()
    {
        $this->mail = new PHPMailer(true);
        
        try {
            $this->mail->SMTPDebug = $this->config['debug'];
            $this->mail->Mailer = 'smtp';
            $this->mail->Host = $this->config['smtp_host'];
            $this->mail->SMTPAuth = $this->config['smtp_auth'];
            $this->mail->Username = $this->config['smtp_username'];
            $this->mail->Password = $this->config['smtp_password'];
            $this->mail->SMTPSecure = $this->config['smtp_secure'];
            $this->mail->Port = $this->config['smtp_port'];
            $this->mail->Timeout = $this->config['timeout'];
            
            $this->mail->setFrom($this->config['from_email'], $this->config['from_name']);
            $this->mail->addReplyTo($this->config['reply_to'], $this->config['from_name']);
            
            $this->mail->isHTML(true);
            $this->mail->CharSet = $this->config['charset'];
            
        } catch (Exception $e) {
            error_log("Email initialization error: " . $e->getMessage());
        }
    }

    public function sendCustomerBookingConfirmation($bookingData)
    {
        try {
            $this->mail->clearAddresses();
            $this->mail->clearAttachments();
            
            $this->mail->addAddress($bookingData['customer_email'], $bookingData['customer_name']);
            
            $this->mail->Subject = "✅ Booking Confirmed - {$bookingData['tour_name']} | Indian Wonderer";
            
            $this->mail->Body = $this->getCustomerBookingTemplate($bookingData);
            $this->mail->AltBody = $this->getCustomerBookingTextVersion($bookingData);
            
            $result = $this->mail->send();
            
            if ($result) {
                error_log("Booking confirmation sent to customer: {$bookingData['customer_email']}");
                return ['success' => true, 'message' => 'Email sent successfully'];
            }
            
            return ['success' => false, 'message' => 'Failed to send email'];
            
        } catch (Exception $e) {
            error_log("Email send error: " . $this->mail->ErrorInfo);
            return ['success' => false, 'message' => $this->mail->ErrorInfo];
        }
    }

    public function sendGuideAssignmentNotification($bookingData, $guideData)
    {
        try {
            $this->mail->clearAddresses();
            $this->mail->clearAttachments();
            
            $this->mail->addAddress($guideData['email'], $guideData['name']);
            
            $this->mail->Subject = "🎯 New Tour Assignment - {$bookingData['tour_name']} | Indian Wonderer";
            
            $this->mail->Body = $this->getGuideAssignmentTemplate($bookingData, $guideData);
            $this->mail->AltBody = $this->getGuideAssignmentTextVersion($bookingData, $guideData);
            
            $result = $this->mail->send();
            
            if ($result) {
                error_log("Guide assignment notification sent to: {$guideData['email']}");
                return ['success' => true, 'message' => 'Email sent successfully'];
            }
            
            return ['success' => false, 'message' => 'Failed to send email'];
            
        } catch (Exception $e) {
            error_log("Email send error: " . $this->mail->ErrorInfo);
            return ['success' => false, 'message' => $this->mail->ErrorInfo];
        }
    }

    public function sendCancellationEmail($customerEmail, $bookingDetails, $refundDetails)
    {
        try {
            $this->mail->clearAddresses();
            $this->mail->clearAttachments();
            
            $this->mail->addAddress($customerEmail, $bookingDetails['customer_name']);
            
            $this->mail->Subject = "🔄 Booking Cancellation Confirmed - {$bookingDetails['booking_reference']} | Indian Wonderer";
            
            $this->mail->Body = $this->getCancellationEmailTemplate($bookingDetails, $refundDetails);
            $this->mail->AltBody = $this->getCancellationEmailTextVersion($bookingDetails, $refundDetails);
            
            $result = $this->mail->send();
            
            if ($result) {
                error_log("✓ Cancellation email sent to: {$customerEmail}");
                return ['success' => true, 'message' => 'Cancellation email sent successfully'];
            }
            
            return ['success' => false, 'message' => 'Failed to send cancellation email'];
            
        } catch (Exception $e) {
            error_log("✗ Cancellation email error: " . $this->mail->ErrorInfo);
            return ['success' => false, 'message' => $this->mail->ErrorInfo];
        }
    }

    public function sendEmail($to, $subject, $htmlBody, $recipientName = '')
    {
        try {
            $this->mail->clearAddresses();
            $this->mail->clearAttachments();
            
            if ($recipientName) {
                $this->mail->addAddress($to, $recipientName);
            } else {
                $this->mail->addAddress($to);
            }
            
            $this->mail->Subject = $subject;
            
            if (strpos($htmlBody, '<html') === false) {
                $htmlBody = $this->wrapInBasicTemplate($htmlBody, $subject);
            }
            $this->mail->Body = $htmlBody;
            $this->mail->AltBody = strip_tags($htmlBody);
            
            $result = $this->mail->send();
            
            if ($result) {
                error_log("✓ Email sent to: {$to}");
                return true;
            }
            
            return false;
            
        } catch (Exception $e) {
            error_log("✗ Email error: " . $this->mail->ErrorInfo);
            return false;
        }
    }

    private function wrapInBasicTemplate($content, $subject)
    {
        $colors = $this->config['templates'];
        $company = $this->config['company'];
        
        return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
        <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f3f4f6">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1)">
            <tr><td style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);padding:30px;text-align:center">
                <h1 style="color:#fff;margin:0;font-size:24px">🇮🇳 Indian Wonderer</h1>
            </td></tr>
            <tr><td style="padding:30px">' . $content . '</td></tr>
            <tr><td style="background:#1f2937;padding:20px;text-align:center">
                <p style="color:#9ca3af;margin:0;font-size:13px">Need help? Contact us at <a href="mailto:' . $company['support_email'] . '" style="color:' . $colors['primary_color'] . ';text-decoration:none">' . $company['support_email'] . '</a></p>
                <p style="color:#6b7280;margin:10px 0 0;font-size:11px">© 2025 ' . $company['name'] . '. All rights reserved.</p>
            </td></tr>
        </table></body></html>';
    }
    

    private function getCustomerBookingTemplate($data)
    {
        $colors = $this->config['templates'];
        $company = $this->config['company'];
        
        $travelDate = date('l, F j, Y', strtotime($data['travel_date']));
        $bookingDate = date('F j, Y', strtotime($data['booking_date']));
        $arrivalTime = isset($data['arrival_time']) ? $data['arrival_time'] : '10:00 AM';
        $tourEndDate = isset($data['tour_end_date']) ? date('l, F j, Y', strtotime($data['tour_end_date'])) : '';
        $meetingPoint = isset($data['meeting_point']) ? $data['meeting_point'] : $data['destination'];
        
        $html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Booking Confirmation</title></head>';
        $html .= '<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f9fafb">';
        $html .= '<table style="width:100%;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">';
        
        $html .= '<tr><td style="background:linear-gradient(135deg,' . $colors['primary_color'] . ',' . $colors['secondary_color'] . ');padding:30px;text-align:center">';
        $html .= '<h1 style="margin:0;color:#fff;font-size:26px">🎉 Booking Confirmed!</h1>';
        $html .= '<p style="margin:10px 0 0;color:#fff;opacity:0.9">Your adventure awaits</p></td></tr>';
        
        $html .= '<tr><td style="padding:20px;text-align:center;background:#f3f4f6">';
        $html .= '<p style="margin:0 0 5px;font-size:12px;color:#6b7280">Booking Reference</p>';
        $html .= '<p style="margin:0;font-size:22px;font-weight:bold;color:' . $colors['primary_color'] . ';letter-spacing:2px">' . $data['booking_reference'] . '</p>';
        $html .= '</td></tr>';
        
        $html .= '<tr><td style="padding:20px"><h2 style="margin:0 0 15px;font-size:18px">👤 Customer Information</h2>';
        $html .= '<table style="width:100%">';
        $html .= '<tr><td style="padding:5px 0;color:#6b7280">Name:</td><td style="padding:5px 0;font-weight:600;text-align:right">' . $data['customer_name'] . '</td></tr>';
        $html .= '<tr><td style="padding:5px 0;color:#6b7280">Email:</td><td style="padding:5px 0;font-weight:600;text-align:right">' . $data['customer_email'] . '</td></tr>';
        $html .= '<tr><td style="padding:5px 0;color:#6b7280">Phone:</td><td style="padding:5px 0;font-weight:600;text-align:right">' . $data['customer_phone'] . '</td></tr>';
        $html .= '</table></td></tr>';
        
        $html .= '<tr><td style="padding:20px"><h2 style="margin:0 0 15px;font-size:18px">🗺️ Tour Details</h2>';
        $html .= '<table style="width:100%">';
        $html .= '<tr><td style="padding:5px 0;color:#6b7280">Tour:</td><td style="padding:5px 0;font-weight:600;text-align:right">' . $data['tour_name'] . '</td></tr>';
        $html .= '<tr><td style="padding:5px 0;color:#6b7280">Destination:</td><td style="padding:5px 0;font-weight:600;text-align:right">' . $data['destination'] . '</td></tr>';
        $html .= '<tr><td style="padding:5px 0;color:#6b7280">Duration:</td><td style="padding:5px 0;font-weight:600;text-align:right">' . $data['duration_days'] . ' Days</td></tr>';
        $html .= '<tr><td style="padding:5px 0;color:#6b7280">Travelers:</td><td style="padding:5px 0;font-weight:600;text-align:right">' . $data['number_of_travelers'] . '</td></tr>';
        $html .= '</table></td></tr>';
        
        $html .= '<tr><td style="padding:20px"><h2 style="margin:0 0 15px;font-size:18px">📅 Travel Schedule</h2>';
        $html .= '<table style="width:100%">';
        $html .= '<tr><td style="padding:5px 0;color:#6b7280">Start Date:</td><td style="padding:5px 0;font-weight:600;text-align:right">' . $travelDate . '</td></tr>';
        $html .= '<tr><td style="padding:5px 0;color:#6b7280">Arrival Time:</td><td style="padding:5px 0;font-weight:600;text-align:right">' . $arrivalTime . '</td></tr>';
        if ($tourEndDate) {
            $html .= '<tr><td style="padding:5px 0;color:#6b7280">End Date:</td><td style="padding:5px 0;font-weight:600;text-align:right">' . $tourEndDate . '</td></tr>';
        }
        $html .= '<tr><td style="padding:5px 0;color:#6b7280">Meeting Point:</td><td style="padding:5px 0;font-weight:600;text-align:right">' . $meetingPoint . '</td></tr>';
        $html .= '</table></td></tr>';
        
        if (!empty($data['guide_name'])) {
            $html .= '<tr><td style="padding:20px;background:#f3f4f6"><h2 style="margin:0 0 15px;font-size:18px">🎯 Your Tour Guide</h2>';
            $html .= '<table style="width:100%">';
            $html .= '<tr><td style="padding:5px 0;color:#6b7280">Name:</td><td style="padding:5px 0;font-weight:600;text-align:right">' . $data['guide_name'] . '</td></tr>';
            $html .= '<tr><td style="padding:5px 0;color:#6b7280">Contact:</td><td style="padding:5px 0;font-weight:600;text-align:right">' . $data['guide_phone'] . '</td></tr>';
            $html .= '<tr><td style="padding:5px 0;color:#6b7280">Email:</td><td style="padding:5px 0;font-weight:600;text-align:right">' . $data['guide_email'] . '</td></tr>';
            $html .= '</table></td></tr>';
        }
        
        $html .= '<tr><td style="padding:20px"><h2 style="margin:0 0 15px;font-size:18px">💳 Payment Summary</h2>';
        $html .= '<table style="width:100%">';
        $html .= '<tr><td style="padding:5px 0;color:#6b7280">Total Amount:</td><td style="padding:5px 0;font-weight:bold;text-align:right;font-size:18px;color:' . $colors['primary_color'] . '">₹' . number_format($data['total_amount'], 2) . '</td></tr>';
        $html .= '<tr><td style="padding:5px 0;color:#6b7280">Status:</td><td style="padding:5px 0;text-align:right"><span style="background:' . $colors['secondary_color'] . ';color:#fff;padding:3px 10px;border-radius:12px;font-size:12px">' . strtoupper($data['payment_status']) . '</span></td></tr>';
        $html .= '</table></td></tr>';
        
        $html .= '<tr><td style="padding:20px;background:#fef3c7"><h3 style="margin:0 0 10px;font-size:16px;color:#92400e">⚠️ Important Information</h3>';
        $html .= '<ul style="margin:0;padding-left:20px;color:#92400e;font-size:13px;line-height:1.8">';
        $html .= '<li>Arrive 15 minutes early at the meeting point</li>';
        $html .= '<li>Carry valid ID proof</li>';
        $html .= '<li>Bring comfortable clothing and shoes</li>';
        $html .= '<li>Contact your guide 24 hours before departure</li>';
        $html .= '</ul></td></tr>';
        
        $html .= '<tr><td style="padding:20px;text-align:center;background:#eef2ff">';
        $html .= '<h3 style="margin:0 0 10px;color:' . $colors['primary_color'] . '">📍 Track Your Guide</h3>';
        $html .= '<p style="margin:0 0 15px;color:#6b7280;font-size:13px">Track your guide in real-time during the tour</p>';
        $html .= '<a href="' . $company['website'] . '" style="display:inline-block;background:' . $colors['primary_color'] . ';color:#fff;padding:10px 25px;text-decoration:none;border-radius:6px;font-weight:600">View My Itineraries</a>';
        $html .= '</td></tr>';
        
        $html .= '<tr><td style="padding:20px;text-align:center;background:#1f2937;color:#fff">';
        $html .= '<p style="margin:0 0 5px;font-weight:bold">' . $company['name'] . '</p>';
        $html .= '<p style="margin:0;font-size:12px;opacity:0.8">© 2025 All rights reserved</p>';
        $html .= '</td></tr>';
        
        $html .= '</table></body></html>';
        
        return $html;
    }

    private function getCustomerBookingTextVersion($data)
    {
        $text = "BOOKING CONFIRMED - Indian Wonderer\n\n";
        $text .= "Booking Reference: {$data['booking_reference']}\n\n";
        $text .= "CUSTOMER INFORMATION\n";
        $text .= "Name: {$data['customer_name']}\n";
        $text .= "Email: {$data['customer_email']}\n";
        $text .= "Phone: {$data['customer_phone']}\n\n";
        $text .= "TOUR DETAILS\n";
        $text .= "Tour: {$data['tour_name']}\n";
        $text .= "Destination: {$data['destination']}\n";
        $text .= "Duration: {$data['duration_days']} Days\n";
        $text .= "Travelers: {$data['number_of_travelers']}\n\n";
        $text .= "TRAVEL SCHEDULE\n";
        $text .= "Start Date: " . date('F j, Y', strtotime($data['travel_date'])) . "\n";
        $text .= "Meeting Point: " . (isset($data['meeting_point']) ? $data['meeting_point'] : $data['destination']) . "\n\n";
        
        if (!empty($data['guide_name'])) {
            $text .= "YOUR TOUR GUIDE\n";
            $text .= "Name: {$data['guide_name']}\n";
            $text .= "Contact: {$data['guide_phone']}\n\n";
        }
        
        $text .= "PAYMENT\n";
        $text .= "Total Amount: ₹{$data['total_amount']}\n";
        $text .= "Status: {$data['payment_status']}\n\n";
        $text .= "For queries, contact: {$this->config['company']['support_email']}\n";
        
        return $text;
    }
    

    private function getGuideAssignmentTemplate($bookingData, $guideData)
    {
        $colors = $this->config['templates'];
        $company = $this->config['company'];
        
        $travelDate = date('l, F j, Y', strtotime($bookingData['travel_date']));
        $daysUntilTour = max(0, ceil((strtotime($bookingData['travel_date']) - time()) / 86400));
        $meetingPoint = isset($bookingData['meeting_point']) ? $bookingData['meeting_point'] : $bookingData['destination'];
        
        $html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>';
        $html .= '<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f9fafb">';
        $html .= '<table style="width:100%;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">';
        
        $html .= '<tr><td style="background:linear-gradient(135deg,' . $colors['primary_color'] . ',' . $colors['secondary_color'] . ');padding:30px;text-align:center">';
        $html .= '<h1 style="margin:0;color:#fff;font-size:26px">🎯 New Tour Assignment!</h1>';
        $html .= '<p style="margin:10px 0 0;color:#fff">You have been assigned a new tour</p></td></tr>';
        
        $html .= '<tr><td style="padding:15px;text-align:center;background:#dbeafe">';
        $html .= '<p style="margin:0;color:#1e40af;font-weight:600">Tour starts in <span style="font-size:20px;color:' . $colors['primary_color'] . '">' . $daysUntilTour . ' days</span></p>';
        $html .= '</td></tr>';
        
        $html .= '<tr><td style="padding:20px">';
        $html .= '<p style="margin:0 0 10px">Dear <strong>' . $guideData['name'] . '</strong>,</p>';
        $html .= '<p style="margin:0;color:#6b7280;font-size:14px">You have been assigned to guide a new tour. Please review the details below.</p>';
        $html .= '</td></tr>';
        
        $html .= '<tr><td style="padding:0 20px 20px;text-align:center">';
        $html .= '<div style="background:#f3f4f6;padding:15px;border-radius:8px;display:inline-block">';
        $html .= '<p style="margin:0 0 5px;font-size:12px;color:#6b7280">Booking Reference</p>';
        $html .= '<p style="margin:0;font-size:20px;font-weight:bold;color:' . $colors['primary_color'] . '">' . $bookingData['booking_reference'] . '</p>';
        $html .= '</div></td></tr>';
        
        $html .= '<tr><td style="padding:20px"><h2 style="margin:0 0 15px;font-size:18px">🗺️ Tour Details</h2>';
        $html .= '<table style="width:100%;background:#f9fafb;border-radius:8px">';
        $html .= '<tr><td style="padding:10px;color:#6b7280;border-bottom:1px solid #e5e7eb">Tour:</td><td style="padding:10px;font-weight:600;text-align:right;border-bottom:1px solid #e5e7eb">' . $bookingData['tour_name'] . '</td></tr>';
        $html .= '<tr><td style="padding:10px;color:#6b7280;border-bottom:1px solid #e5e7eb">Destination:</td><td style="padding:10px;font-weight:600;text-align:right;border-bottom:1px solid #e5e7eb">' . $bookingData['destination'] . '</td></tr>';
        $html .= '<tr><td style="padding:10px;color:#6b7280;border-bottom:1px solid #e5e7eb">Duration:</td><td style="padding:10px;font-weight:600;text-align:right;border-bottom:1px solid #e5e7eb">' . $bookingData['duration_days'] . ' Days</td></tr>';
        $html .= '<tr><td style="padding:10px;color:#6b7280;border-bottom:1px solid #e5e7eb">Start Date:</td><td style="padding:10px;font-weight:600;text-align:right;border-bottom:1px solid #e5e7eb">' . $travelDate . '</td></tr>';
        $html .= '<tr><td style="padding:10px;color:#6b7280;border-bottom:1px solid #e5e7eb">Meeting Point:</td><td style="padding:10px;font-weight:600;text-align:right;border-bottom:1px solid #e5e7eb">' . $meetingPoint . '</td></tr>';
        $html .= '<tr><td style="padding:10px;color:#6b7280">Travelers:</td><td style="padding:10px;font-weight:600;text-align:right">' . $bookingData['number_of_travelers'] . '</td></tr>';
        $html .= '</table></td></tr>';
        
        $html .= '<tr><td style="padding:20px"><h2 style="margin:0 0 15px;font-size:18px">👥 Customer Information</h2>';
        $html .= '<table style="width:100%;background:#f9fafb;border-radius:8px">';
        $html .= '<tr><td style="padding:10px;color:#6b7280;border-bottom:1px solid #e5e7eb">Name:</td><td style="padding:10px;font-weight:600;text-align:right;border-bottom:1px solid #e5e7eb">' . $bookingData['customer_name'] . '</td></tr>';
        $html .= '<tr><td style="padding:10px;color:#6b7280;border-bottom:1px solid #e5e7eb">Email:</td><td style="padding:10px;font-weight:600;text-align:right;border-bottom:1px solid #e5e7eb">' . $bookingData['customer_email'] . '</td></tr>';
        $html .= '<tr><td style="padding:10px;color:#6b7280">Phone:</td><td style="padding:10px;font-weight:600;text-align:right">' . $bookingData['customer_phone'] . '</td></tr>';
        $html .= '</table>';
        $html .= '<div style="margin-top:10px;padding:12px;background:#ecfdf5;border-left:4px solid ' . $colors['secondary_color'] . ';border-radius:4px">';
        $html .= '<p style="margin:0;color:#065f46;font-size:13px">💡 <strong>Tip:</strong> Contact customer 24 hours before the tour</p>';
        $html .= '</div></td></tr>';
        
        $html .= '<tr><td style="padding:20px"><h2 style="margin:0 0 15px;font-size:18px">✅ Action Items</h2>';
        $html .= '<div style="background:#fef3c7;padding:15px;border-radius:8px">';
        $html .= '<ul style="margin:0;padding-left:20px;color:#92400e;font-size:13px;line-height:1.8">';
        $html .= '<li>Review tour itinerary</li>';
        $html .= '<li>Prepare necessary equipment</li>';
        $html .= '<li>Contact customer 24 hours before</li>';
        $html .= '<li>Enable GPS tracking on tour day</li>';
        $html .= '</ul></div></td></tr>';
        
        $html .= '<tr><td style="padding:20px"><div style="background:#eef2ff;padding:15px;border-radius:8px;border:2px solid ' . $colors['primary_color'] . '">';
        $html .= '<h3 style="margin:0 0 8px;color:' . $colors['primary_color'] . ';font-size:15px">📍 GPS Tracking Required</h3>';
        $html .= '<p style="margin:0;color:#1e40af;font-size:13px">GPS will auto-activate during tour and cannot be disabled for safety purposes.</p>';
        $html .= '</div></td></tr>';
        
        $html .= '<tr><td style="padding:20px;text-align:center">';
        $html .= '<a href="http://localhost:3001/dashboard" style="display:inline-block;background:' . $colors['primary_color'] . ';color:#fff;padding:12px 30px;text-decoration:none;border-radius:8px;font-weight:600">View in Dashboard</a>';
        $html .= '</td></tr>';
        
        $html .= '<tr><td style="padding:20px;text-align:center;background:#1f2937;color:#fff">';
        $html .= '<p style="margin:0 0 5px;font-weight:bold">' . $company['name'] . '</p>';
        $html .= '<p style="margin:0;font-size:12px;opacity:0.8">© 2025 All rights reserved</p>';
        $html .= '</td></tr>';
        
        $html .= '</table></body></html>';
        
        return $html;
    }

    private function getGuideAssignmentTextVersion($bookingData, $guideData)
    {
        $text = "NEW TOUR ASSIGNMENT - Indian Wonderer\n\n";
        $text .= "Dear {$guideData['name']},\n\n";
        $text .= "You have been assigned to guide a new tour.\n\n";
        $text .= "Booking Reference: {$bookingData['booking_reference']}\n\n";
        $text .= "TOUR DETAILS\n";
        $text .= "Tour: {$bookingData['tour_name']}\n";
        $text .= "Destination: {$bookingData['destination']}\n";
        $text .= "Duration: {$bookingData['duration_days']} Days\n";
        $text .= "Start Date: " . date('F j, Y', strtotime($bookingData['travel_date'])) . "\n";
        $text .= "Travelers: {$bookingData['number_of_travelers']}\n\n";
        $text .= "CUSTOMER INFORMATION\n";
        $text .= "Name: {$bookingData['customer_name']}\n";
        $text .= "Email: {$bookingData['customer_email']}\n";
        $text .= "Phone: {$bookingData['customer_phone']}\n\n";
        $text .= "Contact customer 24 hours before the tour.\n";
        $text .= "GPS tracking will be mandatory during tour.\n\n";
        $text .= "For support: {$this->config['company']['support_email']}\n";
        
        return $text;
    }

    private function getCancellationEmailTemplate($booking, $refund)
    {
        $colors = $this->config['templates'];
        $company = $this->config['company'];
        
        $refund_info = '';
        if ($refund['type'] === 'giftcard') {
            $refund_info = '
            <tr><td style="padding:20px">
                <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);padding:25px;border-radius:12px;text-align:center">
                    <h2 style="color:#fff;margin:0 0 15px;font-size:22px">🎁 Your Gift Card</h2>
                    <div style="background:#fff;padding:20px;border-radius:10px;margin:15px 0">
                        <p style="font-size:28px;font-weight:bold;color:#667eea;margin:8px 0;letter-spacing:2px">' . $refund['code'] . '</p>
                        <p style="font-size:36px;font-weight:bold;color:' . $colors['secondary_color'] . ';margin:8px 0">₹' . number_format($refund['amount'], 2) . '</p>
                    </div>
                    <p style="color:#fff;margin:12px 0;font-size:14px">✨ Includes 10% bonus! Valid until ' . date('d M Y', strtotime($refund['expiry'])) . '</p>
                    <p style="color:#fff;margin:8px 0;font-size:13px;opacity:0.9">Use this code at checkout for your next adventure!</p>
                </div>
            </td></tr>';
        } else {
            $refund_info = '
            <tr><td style="padding:20px">
                <div style="background:#f0fdf4;border-left:5px solid ' . $colors['secondary_color'] . ';padding:20px;border-radius:8px">
                    <h3 style="color:#047857;margin:0 0 12px;font-size:18px">💳 Bank Refund Processing</h3>
                    <table style="width:100%">
                        <tr><td style="padding:8px 0;color:#059669"><strong>Amount:</strong></td><td style="text-align:right;font-size:20px;font-weight:bold;color:' . $colors['secondary_color'] . '">₹' . number_format($refund['amount'], 2) . '</td></tr>
                        <tr><td style="padding:8px 0;color:#059669"><strong>Processing Time:</strong></td><td style="text-align:right">5-7 business days</td></tr>
                        <tr><td colspan="2" style="padding:12px 0;font-size:13px;color:#047857">The refund will be credited to your original payment method.</td></tr>
                    </table>
                </div>
            </td></tr>';
        }
        
        $html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>';
        $html .= '<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f3f4f6">';
        $html .= '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1)">';
        
        $html .= '<tr><td style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);padding:35px;text-align:center">';
        $html .= '<h1 style="color:#fff;margin:0;font-size:28px">🇮🇳 Indian Wonderer</h1>';
        $html .= '<p style="color:#fff;margin:12px 0 0;font-size:16px;opacity:0.95">Booking Cancellation Confirmed</p>';
        $html .= '</td></tr>';
        
        $html .= '<tr><td style="padding:25px 20px">';
        $html .= '<p style="font-size:16px;color:#1f2937;margin:0 0 15px">Dear ' . $booking['customer_name'] . ',</p>';
        $html .= '<p style="margin:0 0 15px">Your booking has been successfully cancelled. We\'re sorry to see you go, but we hope to serve you again in the future!</p>';
        $html .= '</td></tr>';
        
        $html .= '<tr><td style="padding:0 20px 20px">';
        $html .= '<div style="background:#f9fafb;padding:20px;border-radius:10px;border:2px solid #e5e7eb">';
        $html .= '<h2 style="color:#1f2937;margin:0 0 15px;font-size:18px;border-bottom:3px solid ' . $colors['primary_color'] . ';padding-bottom:10px">📋 Cancelled Booking Details</h2>';
        $html .= '<table style="width:100%">';
        $html .= '<tr><td style="padding:10px 0;color:#6b7280"><strong>Booking Reference:</strong></td><td style="text-align:right;font-weight:bold">' . $booking['booking_reference'] . '</td></tr>';
        $html .= '<tr><td style="padding:10px 0;color:#6b7280"><strong>Tour:</strong></td><td style="text-align:right">' . $booking['tour_name'] . '</td></tr>';
        $html .= '<tr><td style="padding:10px 0;color:#6b7280"><strong>Travel Date:</strong></td><td style="text-align:right">' . $booking['travel_date'] . '</td></tr>';
        $html .= '<tr><td style="padding:10px 0;color:#6b7280"><strong>Travelers:</strong></td><td style="text-align:right">' . $booking['travelers'] . ' person(s)</td></tr>';
        $html .= '<tr><td style="padding:10px 0;color:#6b7280"><strong>Cancellation Date:</strong></td><td style="text-align:right">' . date('d M Y, h:i A') . '</td></tr>';
        $html .= '</table></div></td></tr>';
        
        $html .= $refund_info;
        
        $html .= '<tr><td style="padding:20px">';
        $html .= '<div style="background:#fef3c7;border-left:5px solid #f59e0b;padding:15px;border-radius:8px">';
        $html .= '<p style="margin:0;font-size:14px;color:#92400e"><strong>📝 Note:</strong> A booking fee of ₹500 has been deducted as per our cancellation policy.</p>';
        $html .= '</div></td></tr>';
        
        $html .= '<tr><td style="padding:20px">';
        $html .= '<div style="background:#fff;padding:25px;border-radius:10px;text-align:center;border:2px solid #e5e7eb">';
        $html .= '<p style="font-size:16px;margin:0 0 18px;color:#1f2937">We\'d love to hear your feedback!</p>';
        $html .= '<a href="mailto:' . $company['support_email'] . '?subject=Feedback - ' . $booking['booking_reference'] . '" style="display:inline-block;background:' . $colors['primary_color'] . ';color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">Share Feedback</a>';
        $html .= '</div></td></tr>';
        
        $html .= '<tr><td style="background:#1f2937;padding:25px;text-align:center">';
        $html .= '<p style="color:#9ca3af;margin:0 0 8px;font-size:13px">Need help? Contact us at <a href="mailto:' . $company['support_email'] . '" style="color:' . $colors['primary_color'] . ';text-decoration:none">' . $company['support_email'] . '</a></p>';
        $html .= '<p style="color:#9ca3af;margin:0 0 8px;font-size:13px">📞 ' . $company['phone'] . ' | 🌐 ' . $company['website'] . '</p>';
        $html .= '<p style="color:#6b7280;margin:15px 0 0;font-size:11px">© 2025 ' . $company['name'] . '. All rights reserved.</p>';
        $html .= '</td></tr>';
        
        $html .= '</table></body></html>';
        
        return $html;
    }

    private function getCancellationEmailTextVersion($booking, $refund)
    {
        $text = "BOOKING CANCELLATION CONFIRMED - Indian Wonderer\n\n";
        $text .= "Dear {$booking['customer_name']},\n\n";
        $text .= "Your booking has been successfully cancelled.\n\n";
        $text .= "CANCELLED BOOKING DETAILS\n";
        $text .= "Booking Reference: {$booking['booking_reference']}\n";
        $text .= "Tour: {$booking['tour_name']}\n";
        $text .= "Travel Date: {$booking['travel_date']}\n";
        $text .= "Travelers: {$booking['travelers']} person(s)\n";
        $text .= "Cancellation Date: " . date('d M Y, h:i A') . "\n\n";
        
        if ($refund['type'] === 'giftcard') {
            $text .= "GIFT CARD ISSUED\n";
            $text .= "Code: {$refund['code']}\n";
            $text .= "Value: ₹" . number_format($refund['amount'], 2) . " (includes 10% bonus)\n";
            $text .= "Valid Until: " . date('d M Y', strtotime($refund['expiry'])) . "\n";
            $text .= "Use this code at checkout for your next adventure!\n\n";
        } else {
            $text .= "BANK REFUND PROCESSING\n";
            $text .= "Amount: ₹" . number_format($refund['amount'], 2) . "\n";
            $text .= "Processing Time: 5-7 business days\n";
            $text .= "The refund will be credited to your original payment method.\n\n";
        }
        
        $text .= "NOTE: A booking fee of ₹500 has been deducted as per our cancellation policy.\n\n";
        $text .= "For support: {$this->config['company']['support_email']}\n";
        $text .= "Phone: {$this->config['company']['phone']}\n";
        $text .= "Website: {$this->config['company']['website']}\n";
        
        return $text;
    }
}
