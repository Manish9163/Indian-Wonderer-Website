<?php
/**
 * Automatic Database Backup Script
 * Can be called via cron job or browser
 */

require_once __DIR__ . '/config/database.php';

class DatabaseBackup {
    private $backupDir = __DIR__ . '/backups/';
    private $dbHost;
    private $dbName;
    private $dbUser;
    private $dbPassword;
    private $maxBackups = 10;
    private $maxAge = 30; // days
    
    public function __construct() {
        // Read credentials from .env via Config
        $this->dbHost     = Config::getDBHost();
        $this->dbName     = Config::getDBName();
        $this->dbUser     = Config::getDBUser();
        $this->dbPassword = Config::getDBPass();

        // Create backup directory if doesn't exist
        if (!is_dir($this->backupDir)) {
            mkdir($this->backupDir, 0755, true);
        }
    }
    
    public function performBackup() {
        try {
            $timestamp = date('Ymd_His');
            $backupFile = $this->backupDir . $this->dbName . '_backup_' . $timestamp . '.sql';
            
            // Use mysqldump
            $command = sprintf(
                'C:\\xampp\\mysql\\bin\\mysqldump.exe -h %s -u %s %s > %s 2>&1',
                $this->dbHost,
                $this->dbUser,
                $this->dbName,
                escapeshellarg($backupFile)
            );
            
            exec($command, $output, $returnVar);
            
            if ($returnVar === 0 && file_exists($backupFile) && filesize($backupFile) > 0) {
                $this->cleanOldBackups();
                return [
                    'success' => true,
                    'message' => 'Backup created successfully',
                    'file' => basename($backupFile),
                    'size' => $this->formatBytes(filesize($backupFile)),
                    'timestamp' => date('Y-m-d H:i:s')
                ];
            } else {
                throw new Exception('Backup failed: ' . implode("\n", $output));
            }
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    private function cleanOldBackups() {
        $files = glob($this->backupDir . '*.sql');
        
        // Sort by modification time (newest first)
        usort($files, function($a, $b) {
            return filemtime($b) - filemtime($a);
        });
        
        // Delete backups older than maxAge days
        $cutoffTime = time() - ($this->maxAge * 24 * 60 * 60);
        foreach ($files as $file) {
            if (filemtime($file) < $cutoffTime) {
                unlink($file);
            }
        }
        
        // Keep only maxBackups most recent backups
        $files = glob($this->backupDir . '*.sql');
        usort($files, function($a, $b) {
            return filemtime($b) - filemtime($a);
        });
        
        if (count($files) > $this->maxBackups) {
            $filesToDelete = array_slice($files, $this->maxBackups);
            foreach ($filesToDelete as $file) {
                unlink($file);
            }
        }
    }
    
    public function listBackups() {
        $files = glob($this->backupDir . '*.sql');
        $backups = [];
        
        foreach ($files as $file) {
            $backups[] = [
                'name' => basename($file),
                'size' => $this->formatBytes(filesize($file)),
                'date' => date('Y-m-d H:i:s', filemtime($file)),
                'path' => $file
            ];
        }
        
        // Sort by date (newest first)
        usort($backups, function($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });
        
        return $backups;
    }
    
    private function formatBytes($bytes) {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, 2) . ' ' . $units[$pow];
    }
}

// Handle command line or web execution
if (php_sapi_name() === 'cli' || isset($_GET['action'])) {
    $backup = new DatabaseBackup();
    
    $action = $_GET['action'] ?? ($argv[1] ?? 'backup');
    
    switch ($action) {
        case 'backup':
            $result = $backup->performBackup();
            header('Content-Type: application/json');
            echo json_encode($result);
            break;
            
        case 'list':
            $backups = $backup->listBackups();
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'backups' => $backups,
                'count' => count($backups)
            ]);
            break;
            
        default:
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action'
            ]);
    }
}
?>
