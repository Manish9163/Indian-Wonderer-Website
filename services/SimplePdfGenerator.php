<?php
/**
 * Simple HTML to PDF Converter
 * Creates actual PDF files without external dependencies
 */

class SimplePdfGenerator {
    
    /**
     * Generate PDF from HTML using wkhtmltopdf or fallback method
     */
    public static function htmlToPdf($html, $filename) {
        // Try Method 1: wkhtmltopdf (best quality)
        $pdf = self::tryWkhtmltopdf($html);
        if ($pdf !== false) {
            return file_put_contents($filename, $pdf);
        }

        // Try Method 2: Use online conversion service
        $pdf = self::tryOnlineConversion($html);
        if ($pdf !== false) {
            return file_put_contents($filename, $pdf);
        }

        // Fallback: Create a simple PDF-like document
        $pdf = self::createSimplePdf($html);
        return file_put_contents($filename, $pdf);
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
            if (self::commandExists($path)) {
                return self::executeWkhtmltopdf($path, $html);
            }
        }

        return false;
    }

    /**
     * Check if command exists
     */
    private static function commandExists($cmd) {
        $return = shell_exec("command -v " . escapeshellarg($cmd) . " 2>&1");
        return !empty($return);
    }

    /**
     * Execute wkhtmltopdf
     */
    private static function executeWkhtmltopdf($wkhtmlPath, $html) {
        $tempHtml = tempnam(sys_get_temp_dir(), 'html_') . '.html';
        $tempPdf = tempnam(sys_get_temp_dir(), 'pdf_') . '.pdf';

        file_put_contents($tempHtml, $html);

        $cmd = escapeshellcmd($wkhtmlPath) . ' ' .
               escapeshellarg($tempHtml) . ' ' .
               escapeshellarg($tempPdf) . ' 2>&1';

        exec($cmd, $output, $returnCode);

        if ($returnCode === 0 && file_exists($tempPdf)) {
            $content = file_get_contents($tempPdf);
            @unlink($tempHtml);
            @unlink($tempPdf);
            return $content;
        }

        @unlink($tempHtml);
        @unlink($tempPdf);
        return false;
    }

    /**
     * Use online API to convert HTML to PDF
     * (for production use, but requires internet)
     */
    private static function tryOnlineConversion($html) {
        // This would require an API key and internet connection
        // Skipping for now
        return false;
    }

    /**
     * Create a basic but valid PDF file
     * This is a fallback method
     */
    private static function createSimplePdf($html) {
        // Extract text from HTML
        $text = strip_tags($html);
        $text = preg_replace('/\s+/', ' ', $text);
        $text = trim($text);

        // Create basic PDF structure
        $pdf = "%PDF-1.4\n";
        $pdf .= "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
        $pdf .= "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
        $pdf .= "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n";
        
        $textContent = "BT\n/F1 12 Tf\n50 750 Td\n(" . addslashes($text) . ") Tj\nET\n";
        $pdf .= "4 0 obj\n<< /Length " . strlen($textContent) . " >>\nstream\n" . $textContent . "endstream\nendobj\n";
        
        $pdf .= "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";
        $pdf .= "xref\n0 6\n";
        $pdf .= "0000000000 65535 f \n";
        $pdf .= "0000000009 00000 n \n";
        $pdf .= "0000000058 00000 n \n";
        $pdf .= "0000000115 00000 n \n";
        $pdf .= "0000000275 00000 n \n";
        $pdf .= "0000000372 00000 n \n";
        $pdf .= "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n451\n%%EOF\n";

        return $pdf;
    }
}
?>
