<?php
/**
 * Travel API Key Manager Service
 * Handles CRUD operations for API keys
 * Provides secure storage and validation
 */

require_once __DIR__ . '/../config/travel_api_config.php';

class TravelAPIKeyManager {
    
    private $db;
    private $config_file;
    private $env_file;

    public function __construct($db) {
        $this->db = $db;
        $this->config_file = __DIR__ . '/../config/travel_api_config.php';
        $this->env_file = __DIR__ . '/../../.env';
        
        $this->createConfigTable();
    }

    /**
     * Create configuration table if it doesn't exist
     */
    private function createConfigTable() {
        $sql = "CREATE TABLE IF NOT EXISTS api_key_config (
            id INT PRIMARY KEY AUTO_INCREMENT,
            provider_name VARCHAR(50) NOT NULL UNIQUE,
            mode VARCHAR(20) NOT NULL,
            api_key VARCHAR(255),
            client_id VARCHAR(255),
            client_secret VARCHAR(255),
            api_url VARCHAR(255),
            rate_limit INT DEFAULT 100,
            timeout INT DEFAULT 30,
            cache_ttl INT DEFAULT 3600,
            is_enabled BOOLEAN DEFAULT FALSE,
            is_primary BOOLEAN DEFAULT FALSE,
            last_tested DATETIME,
            test_status VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY (mode),
            KEY (is_enabled)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

        try {
            $this->db->query($sql);
            return ['success' => true];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Get all API configurations
     */
    public function getAllConfigurations() {
        $sql = "SELECT * FROM api_key_config ORDER BY mode, is_primary DESC, provider_name";
        $result = $this->db->query($sql);
        
        $configs = [];
        while ($row = $result->fetch_assoc()) {
            // Mask sensitive data
            $row['api_key'] = !empty($row['api_key']) ? substr($row['api_key'], 0, 4) . '****' : null;
            $row['client_secret'] = !empty($row['client_secret']) ? substr($row['client_secret'], 0, 4) . '****' : null;
            $configs[] = $row;
        }
        
        return $configs;
    }

    /**
     * Get configuration by mode
     */
    public function getConfigurationsByMode($mode) {
        $mode = strtolower($mode);
        $sql = "SELECT * FROM api_key_config WHERE mode = ? ORDER BY is_primary DESC, provider_name";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('s', $mode);
        $stmt->execute();
        $result = $stmt->get_result();

        $configs = [];
        while ($row = $result->fetch_assoc()) {
            $row['api_key'] = !empty($row['api_key']) ? substr($row['api_key'], 0, 4) . '****' : null;
            $row['client_secret'] = !empty($row['client_secret']) ? substr($row['client_secret'], 0, 4) . '****' : null;
            $configs[] = $row;
        }

        return $configs;
    }

    /**
     * Get single configuration
     */
    public function getConfiguration($provider_name) {
        $sql = "SELECT * FROM api_key_config WHERE provider_name = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('s', $provider_name);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($row = $result->fetch_assoc()) {
            // Don't mask in this case since it's fetched for internal use
            return $row;
        }
        return null;
    }

    /**
     * Create or update API configuration
     */
    public function saveConfiguration($provider_name, $data) {
        // Validate input
        $required = ['mode', 'api_url'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return ['success' => false, 'error' => "Missing required field: {$field}"];
            }
        }

        $mode = strtolower($data['mode']);
        $api_url = $data['api_url'];
        $rate_limit = (int)($data['rate_limit'] ?? 100);
        $timeout = (int)($data['timeout'] ?? 30);
        $cache_ttl = (int)($data['cache_ttl'] ?? 3600);
        $is_enabled = (bool)($data['is_enabled'] ?? false);

        $existing = $this->getConfiguration($provider_name);

        // If this is being set as primary, disable others for this mode
        if (!empty($data['is_primary']) && $data['is_primary']) {
            $this->db->query("UPDATE api_key_config SET is_primary = FALSE WHERE mode = ? AND provider_name != ?");
        }

        try {
            if ($existing) {
                // Update
                $sql = "UPDATE api_key_config SET 
                    mode = ?, 
                    api_url = ?, 
                    rate_limit = ?, 
                    timeout = ?, 
                    cache_ttl = ?,
                    is_enabled = ?,
                    is_primary = ?
                    WHERE provider_name = ?";
                
                $stmt = $this->db->prepare($sql);
                $is_primary = (bool)($data['is_primary'] ?? false);
                $stmt->bind_param('ssiiiisi', $mode, $api_url, $rate_limit, $timeout, $cache_ttl, $is_enabled, $is_primary, $provider_name);
            } else {
                // Insert
                $sql = "INSERT INTO api_key_config 
                    (provider_name, mode, api_url, rate_limit, timeout, cache_ttl, is_enabled, is_primary) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                
                $stmt = $this->db->prepare($sql);
                $is_primary = (bool)($data['is_primary'] ?? false);
                $stmt->bind_param('ssiiiiI', $provider_name, $mode, $api_url, $rate_limit, $timeout, $cache_ttl, $is_enabled, $is_primary);
            }

            $stmt->execute();

            // Update sensitive fields if provided
            if (!empty($data['api_key']) || !empty($data['client_id'])) {
                $this->updateSensitiveData($provider_name, $data);
            }

            // Update .env file
            $this->updateEnvFile($provider_name, $data);

            return ['success' => true, 'message' => 'Configuration saved successfully'];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Update sensitive data (API keys)
     */
    private function updateSensitiveData($provider_name, $data) {
        $updates = [];

        if (!empty($data['api_key'])) {
            $updates['api_key'] = $data['api_key'];
        }
        if (!empty($data['client_id'])) {
            $updates['client_id'] = $data['client_id'];
        }
        if (!empty($data['client_secret'])) {
            $updates['client_secret'] = $data['client_secret'];
        }

        if (empty($updates)) {
            return;
        }

        $set_parts = [];
        $values = [];
        foreach ($updates as $key => $value) {
            $set_parts[] = "$key = ?";
            $values[] = $value;
        }
        $values[] = $provider_name;

        $sql = "UPDATE api_key_config SET " . implode(', ', $set_parts) . " WHERE provider_name = ?";
        $stmt = $this->db->prepare($sql);

        // Build type string
        $types = str_repeat('s', count($values));
        $stmt->bind_param($types, ...$values);
        $stmt->execute();
    }

    /**
     * Update .env file with configuration
     */
    private function updateEnvFile($provider_name, $data) {
        if (!file_exists($this->env_file)) {
            return;
        }

        $env_content = file_get_contents($this->env_file);
        $env_lines = explode("\n", $env_content);
        $mode = strtolower($data['mode']);

        $env_prefix = strtoupper($mode) . "_" . strtoupper($provider_name);
        $env_vars = [];

        if (!empty($data['api_key'])) {
            $env_vars[$env_prefix . "_KEY"] = $data['api_key'];
            $env_vars[$env_prefix . "_ENABLED"] = "1";
        }
        if (!empty($data['client_id'])) {
            $env_vars[$env_prefix . "_CLIENT_ID"] = $data['client_id'];
        }

        // Update or add env variables
        foreach ($env_vars as $key => $value) {
            $found = false;
            foreach ($env_lines as &$line) {
                if (strpos($line, $key . '=') === 0) {
                    $line = $key . '=' . $value;
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                $env_lines[] = $key . '=' . $value;
            }
        }

        file_put_contents($this->env_file, implode("\n", $env_lines));
    }

    /**
     * Test API connection
     */
    public function testAPIConnection($provider_name) {
        $config = $this->getConfiguration($provider_name);

        if (!$config) {
            return ['success' => false, 'error' => 'Configuration not found'];
        }

        if (!$config['is_enabled']) {
            return ['success' => false, 'error' => 'API is disabled'];
        }

        try {
            // Use curl to test connection
            $headers = [];
            if (!empty($config['api_key'])) {
                $headers[] = 'Authorization: Bearer ' . $config['api_key'];
            }

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $config['api_url']);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_TIMEOUT, $config['timeout']);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

            $response = curl_exec($ch);
            $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            if ($error) {
                return ['success' => false, 'error' => $error, 'http_code' => $http_code];
            }

            // Update test status
            $sql = "UPDATE api_key_config SET last_tested = NOW(), test_status = ? WHERE provider_name = ?";
            $stmt = $this->db->prepare($sql);
            $status = ($http_code >= 200 && $http_code < 300) ? 'success' : 'failed';
            $stmt->bind_param('ss', $status, $provider_name);
            $stmt->execute();

            return [
                'success' => true,
                'http_code' => $http_code,
                'message' => 'Connection test completed',
                'status' => $status
            ];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Enable/Disable API
     */
    public function toggleAPI($provider_name, $enabled) {
        $sql = "UPDATE api_key_config SET is_enabled = ? WHERE provider_name = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('is', (int)$enabled, $provider_name);
        
        if ($stmt->execute()) {
            return ['success' => true, 'message' => 'API toggled successfully'];
        } else {
            return ['success' => false, 'error' => $stmt->error];
        }
    }

    /**
     * Delete configuration
     */
    public function deleteConfiguration($provider_name) {
        $sql = "DELETE FROM api_key_config WHERE provider_name = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('s', $provider_name);

        if ($stmt->execute()) {
            // Remove from .env
            $this->removeFromEnvFile($provider_name);
            return ['success' => true, 'message' => 'Configuration deleted'];
        } else {
            return ['success' => false, 'error' => $stmt->error];
        }
    }

    /**
     * Remove configuration from .env file
     */
    private function removeFromEnvFile($provider_name) {
        if (!file_exists($this->env_file)) {
            return;
        }

        $env_content = file_get_contents($this->env_file);
        $env_lines = explode("\n", $env_content);
        $filtered = [];

        foreach ($env_lines as $line) {
            if (stripos($line, strtoupper($provider_name)) === false) {
                $filtered[] = $line;
            }
        }

        file_put_contents($this->env_file, implode("\n", $filtered));
    }

    /**
     * Get statistics
     */
    public function getStatistics() {
        $sql = "SELECT 
            mode,
            COUNT(*) as total,
            SUM(CASE WHEN is_enabled = 1 THEN 1 ELSE 0 END) as enabled,
            SUM(CASE WHEN test_status = 'success' THEN 1 ELSE 0 END) as healthy,
            SUM(CASE WHEN test_status = 'failed' THEN 1 ELSE 0 END) as unhealthy
            FROM api_key_config
            GROUP BY mode";

        $result = $this->db->query($sql);
        $stats = [];

        while ($row = $result->fetch_assoc()) {
            $stats[$row['mode']] = $row;
        }

        return $stats;
    }
}
