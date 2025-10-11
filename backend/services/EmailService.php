<?php

class EmailService {
    private $from_email = 'noreply@indianwonderer.com';
    private $from_name = 'Indian Wonderer';

    public function sendCancellationEmail($to_email, $booking_details, $refund_details) {
        $subject = "Booking Cancellation Confirmed - {$booking_details['booking_reference']}";
        
        $message = $this->getCancellationEmailTemplate($booking_details, $refund_details);
        
        $headers = $this->getEmailHeaders();
        
        return mail($to_email, $subject, $message, $headers);
    }

    public function sendModificationEmail($to_email, $booking_details, $changes) {
        $subject = "Booking Modified - Confirmation Pending - {$booking_details['booking_reference']}";
        
        $message = $this->getModificationEmailTemplate($booking_details, $changes);
        
        $headers = $this->getEmailHeaders();
        
        return mail($to_email, $subject, $message, $headers);
    }
 
    private function getEmailHeaders() {
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: {$this->from_name} <{$this->from_email}>" . "\r\n";
        $headers .= "Reply-To: support@indianwonderer.com" . "\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();
        
        return $headers;
    }

    private function getCancellationEmailTemplate($booking, $refund) {
        $refund_info = '';
        if ($refund['type'] === 'giftcard') {
            $refund_info = "
            <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;'>
                <h2 style='color: white; margin: 0 0 10px 0;'>🎁 Your Gift Card</h2>
                <div style='background: white; padding: 15px; border-radius: 8px; margin: 10px 0;'>
                    <p style='font-size: 24px; font-weight: bold; color: #667eea; margin: 5px 0;'>{$refund['code']}</p>
                    <p style='font-size: 32px; font-weight: bold; color: #10b981; margin: 5px 0;'>₹" . number_format($refund['amount'], 2) . "</p>
                </div>
                <p style='color: white; margin: 10px 0; font-size: 14px;'>
                    ✨ Includes 10% bonus! Valid until " . date('d M Y', strtotime($refund['expiry'])) . "
                </p>
                <p style='color: white; margin: 10px 0; font-size: 12px;'>
                    Use this code at checkout for your next adventure!
                </p>
            </div>
            ";
        } else {
            $refund_info = "
            <div style='background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;'>
                <h3 style='color: #047857; margin: 0 0 10px 0;'>💳 Bank Refund Processing</h3>
                <p style='margin: 5px 0;'><strong>Amount:</strong> ₹" . number_format($refund['amount'], 2) . "</p>
                <p style='margin: 5px 0;'><strong>Processing Time:</strong> 5-7 business days</p>
                <p style='margin: 5px 0; font-size: 12px; color: #059669;'>
                    The refund will be credited to your original payment method.
                </p>
            </div>
            ";
        }
        
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        </head>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;'>
            <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;'>
                <h1 style='color: white; margin: 0; font-size: 28px;'>🇮🇳 Indian Wonderer</h1>
                <p style='color: white; margin: 10px 0 0 0; font-size: 16px;'>Booking Cancellation Confirmed</p>
            </div>
            
            <div style='background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;'>
                <p style='font-size: 16px; color: #1f2937;'>Dear {$booking['customer_name']},</p>
                
                <p>Your booking has been successfully cancelled. We're sorry to see you go, but we hope to serve you again in the future!</p>
                
                <div style='background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #e5e7eb;'>
                    <h2 style='color: #1f2937; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #667eea; padding-bottom: 10px;'>
                        📋 Cancelled Booking Details
                    </h2>
                    <table style='width: 100%; border-collapse: collapse;'>
                        <tr>
                            <td style='padding: 8px 0; color: #6b7280;'><strong>Booking Reference:</strong></td>
                            <td style='padding: 8px 0; text-align: right; font-weight: bold;'>{$booking['booking_reference']}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 0; color: #6b7280;'><strong>Tour:</strong></td>
                            <td style='padding: 8px 0; text-align: right;'>{$booking['tour_name']}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 0; color: #6b7280;'><strong>Travel Date:</strong></td>
                            <td style='padding: 8px 0; text-align: right;'>{$booking['travel_date']}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 0; color: #6b7280;'><strong>Travelers:</strong></td>
                            <td style='padding: 8px 0; text-align: right;'>{$booking['travelers']} person(s)</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 0; color: #6b7280;'><strong>Cancellation Date:</strong></td>
                            <td style='padding: 8px 0; text-align: right;'>" . date('d M Y, h:i A') . "</td>
                        </tr>
                    </table>
                </div>
                
                {$refund_info}
                
                <div style='background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;'>
                    <p style='margin: 0; font-size: 14px;'>
                        <strong>📝 Note:</strong> A booking fee of ₹500 has been deducted as per our cancellation policy.
                    </p>
                </div>
                
                <div style='margin: 30px 0; padding: 20px; background: white; border-radius: 8px; text-align: center;'>
                    <p style='font-size: 16px; margin: 0 0 15px 0;'>We'd love to hear your feedback!</p>
                    <a href='mailto:feedback@indianwonderer.com' style='display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;'>
                        Share Feedback
                    </a>
                </div>
            </div>
            
            <div style='background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;'>
                <p style='color: #9ca3af; margin: 5px 0; font-size: 12px;'>
                    Need help? Contact us at <a href='mailto:support@indianwonderer.com' style='color: #667eea;'>support@indianwonderer.com</a>
                </p>
                <p style='color: #9ca3af; margin: 5px 0; font-size: 12px;'>
                    📞 +91-XXXXXXXXXX | 🌐 www.indianwonderer.com
                </p>
                <p style='color: #6b7280; margin: 15px 0 5px 0; font-size: 11px;'>
                    © 2025 Indian Wonderer. All rights reserved.
                </p>
            </div>
        </body>
        </html>
        ";
    }

    private function getModificationEmailTemplate($booking, $changes) {
        $changes_html = '';
        foreach ($changes as $field => $change) {
            $changes_html .= "
            <tr>
                <td style='padding: 8px; color: #6b7280; border-bottom: 1px solid #e5e7eb;'><strong>{$field}:</strong></td>
                <td style='padding: 8px; border-bottom: 1px solid #e5e7eb; color: #ef4444;'>{$change['old']}</td>
                <td style='padding: 8px; border-bottom: 1px solid #e5e7eb;'>→</td>
                <td style='padding: 8px; border-bottom: 1px solid #e5e7eb; color: #10b981; font-weight: bold;'>{$change['new']}</td>
            </tr>
            ";
        }
        
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        </head>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;'>
            <div style='background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;'>
                <h1 style='color: white; margin: 0; font-size: 28px;'>🇮🇳 Indian Wonderer</h1>
                <p style='color: white; margin: 10px 0 0 0; font-size: 16px;'>Booking Modification Request</p>
            </div>
            
            <div style='background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;'>
                <p style='font-size: 16px; color: #1f2937;'>Dear {$booking['customer_name']},</p>
                
                <p>We've received your request to modify your booking. Our team will review and confirm the changes within 24 hours.</p>
                
                <div style='background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #e5e7eb;'>
                    <h2 style='color: #1f2937; margin: 0 0 15px 0; font-size: 18px;'>📋 Booking Reference</h2>
                    <p style='font-size: 24px; font-weight: bold; color: #3b82f6; margin: 0;'>{$booking['booking_reference']}</p>
                </div>
                
                <div style='background: white; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                    <h3 style='color: #1f2937; margin: 0 0 15px 0;'>🔄 Requested Changes</h3>
                    <table style='width: 100%; border-collapse: collapse;'>
                        {$changes_html}
                    </table>
                </div>
                
                <div style='background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;'>
                    <p style='margin: 0; font-size: 14px;'>
                        <strong>⏳ What's Next?</strong><br>
                        • Our team is reviewing your request<br>
                        • You'll receive confirmation within 24 hours<br>
                        • Any price adjustments will be communicated<br>
                        • Changes are subject to availability
                    </p>
                </div>
            </div>
            
            <div style='background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;'>
                <p style='color: #9ca3af; margin: 5px 0; font-size: 12px;'>
                    Questions? Contact us at <a href='mailto:support@indianwonderer.com' style='color: #3b82f6;'>support@indianwonderer.com</a>
                </p>
                <p style='color: #6b7280; margin: 15px 0 5px 0; font-size: 11px;'>
                    © 2025 Indian Wonderer. All rights reserved.
                </p>
            </div>
        </body>
        </html>
        ";
    }
}
?>
