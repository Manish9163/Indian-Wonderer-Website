<?php
/**
 * Travel API Integration Service
 * Intelligently routes requests to configured APIs or database fallback
 * 
 * Usage:
 * $service = new TravelAPIIntegration($db);
 * $flights = $service->searchFlights($from, $to, $date);
 */

require_once __DIR__ . '/../config/travel_api_config.php';
require_once __DIR__ . '/../services/TravelAPIKeyManager.php';

class TravelAPIIntegration {
    
    private $db;
    private $manager;
    private $config;
    private $cache_dir;
    private $log_file;

    public function __construct($db) {
        $this->db = $db;
        $this->manager = new TravelAPIKeyManager($db);
        $this->config = TravelAPIConfig::getSystemConfig();
        $this->cache_dir = sys_get_temp_dir();
        $this->log_file = $this->config['log_file'];
    }

    /**
     * Search flights from configured providers or database
     */
    public function searchFlights($from, $to, $date, $passengers = 1) {
        $cache_key = "flight_{$from}_{$to}_{$date}_{$passengers}";
        
        // Check cache first
        $cached = $this->getCache($cache_key);
        if ($cached) {
            $this->log("Cache hit: {$cache_key}");
            return $cached;
        }

        // Try configured APIs first
        $active_providers = TravelAPIConfig::getActiveProviders()['flights'];
        
        foreach ($active_providers as $provider) {
            if ($provider === 'database') {
                continue;
            }

            if (TravelAPIConfig::canUseAPI('flight', $provider)) {
                try {
                    $result = $this->callFlightAPI($provider, $from, $to, $date, $passengers);
                    if ($result && count($result) > 0) {
                        $this->setCache($cache_key, $result);
                        $this->log("Flights found via {$provider}: " . count($result));
                        return $result;
                    }
                } catch (Exception $e) {
                    $this->log("Flight API error ({$provider}): " . $e->getMessage(), 'warning');
                }
            }
        }

        // Fallback to database
        if ($this->config['use_fallback_database']) {
            $this->log("Falling back to database for flights");
            return $this->searchFlightsDatabase($from, $to, $date, $passengers);
        }

        $this->log("No flight data available", 'error');
        return [];
    }

    /**
     * Search buses from configured providers or database
     */
    public function searchBuses($from, $to, $date, $passengers = 1) {
        $cache_key = "bus_{$from}_{$to}_{$date}_{$passengers}";
        
        $cached = $this->getCache($cache_key);
        if ($cached) {
            $this->log("Cache hit: {$cache_key}");
            return $cached;
        }

        $active_providers = TravelAPIConfig::getActiveProviders()['buses'];
        
        foreach ($active_providers as $provider) {
            if ($provider === 'database') {
                continue;
            }

            if (TravelAPIConfig::canUseAPI('bus', $provider)) {
                try {
                    $result = $this->callBusAPI($provider, $from, $to, $date, $passengers);
                    if ($result && count($result) > 0) {
                        $this->setCache($cache_key, $result);
                        $this->log("Buses found via {$provider}: " . count($result));
                        return $result;
                    }
                } catch (Exception $e) {
                    $this->log("Bus API error ({$provider}): " . $e->getMessage(), 'warning');
                }
            }
        }

        if ($this->config['use_fallback_database']) {
            $this->log("Falling back to database for buses");
            return $this->searchBusesDatabase($from, $to, $date, $passengers);
        }

        $this->log("No bus data available", 'error');
        return [];
    }

    /**
     * Search trains from configured providers or database
     */
    public function searchTrains($from, $to, $date, $passengers = 1) {
        $cache_key = "train_{$from}_{$to}_{$date}_{$passengers}";
        
        $cached = $this->getCache($cache_key);
        if ($cached) {
            $this->log("Cache hit: {$cache_key}");
            return $cached;
        }

        $active_providers = TravelAPIConfig::getActiveProviders()['trains'];
        
        foreach ($active_providers as $provider) {
            if ($provider === 'database') {
                continue;
            }

            if (TravelAPIConfig::canUseAPI('train', $provider)) {
                try {
                    $result = $this->callTrainAPI($provider, $from, $to, $date, $passengers);
                    if ($result && count($result) > 0) {
                        $this->setCache($cache_key, $result);
                        $this->log("Trains found via {$provider}: " . count($result));
                        return $result;
                    }
                } catch (Exception $e) {
                    $this->log("Train API error ({$provider}): " . $e->getMessage(), 'warning');
                }
            }
        }

        if ($this->config['use_fallback_database']) {
            $this->log("Falling back to database for trains");
            return $this->searchTrainsDatabase($from, $to, $date, $passengers);
        }

        $this->log("No train data available", 'error');
        return [];
    }

    /**
     * Call flight API provider
     */
    private function callFlightAPI($provider, $from, $to, $date, $passengers) {
        $config = TravelAPIConfig::getFlightAPIKeys()[$provider] ?? null;
        
        if (!$config || !$config['enabled']) {
            throw new Exception("Flight provider {$provider} not configured");
        }

        switch ($provider) {
            case 'skyscanner':
                return $this->callSkyscannerAPI($config, $from, $to, $date, $passengers);
            case 'amadeus':
                return $this->callAmadeusAPI($config, $from, $to, $date, $passengers);
            case 'rapid_api_flights':
                return $this->callRapidAPIFlights($config, $from, $to, $date, $passengers);
            default:
                throw new Exception("Unknown flight provider: {$provider}");
        }
    }

    /**
     * Call bus API provider
     */
    private function callBusAPI($provider, $from, $to, $date, $passengers) {
        $config = TravelAPIConfig::getBusAPIKeys()[$provider] ?? null;
        
        if (!$config || !$config['enabled']) {
            throw new Exception("Bus provider {$provider} not configured");
        }

        switch ($provider) {
            case 'redbus':
                return $this->callRedbusAPI($config, $from, $to, $date, $passengers);
            case 'makemytrip_bus':
                return $this->callMakeMyTripBusAPI($config, $from, $to, $date, $passengers);
            case 'goibibo':
                return $this->callGoibiboAPI($config, $from, $to, $date, $passengers);
            default:
                throw new Exception("Unknown bus provider: {$provider}");
        }
    }

    /**
     * Call train API provider
     */
    private function callTrainAPI($provider, $from, $to, $date, $passengers) {
        $config = TravelAPIConfig::getTrainAPIKeys()[$provider] ?? null;
        
        if (!$config || !$config['enabled']) {
            throw new Exception("Train provider {$provider} not configured");
        }

        switch ($provider) {
            case 'irctc_api':
                return $this->callIRCTCAPI($config, $from, $to, $date, $passengers);
            case 'cleartrip_train':
                return $this->callCleartripAPI($config, $from, $to, $date, $passengers);
            case 'makemytrip_train':
                return $this->callMakeMyTripTrainAPI($config, $from, $to, $date, $passengers);
            default:
                throw new Exception("Unknown train provider: {$provider}");
        }
    }

    // =========================================================================
    // FLIGHT API IMPLEMENTATIONS
    // =========================================================================

    private function callSkyscannerAPI($config, $from, $to, $date, $passengers) {
        $url = $config['api_url'] . '/flights/search';
        
        $response = $this->makeRequest($url, [
            'origin' => $from,
            'destination' => $to,
            'departDate' => $date,
            'adults' => $passengers,
            'apiKey' => $config['api_key']
        ], $config['timeout']);

        return $this->parseSkyscannerResponse($response);
    }

    private function callAmadeusAPI($config, $from, $to, $date, $passengers) {
        // Get access token first
        $token = $this->getAmadeusToken($config);
        
        $url = $config['api_url'] . '/v2/shopping/flight-offers';
        
        $response = $this->makeRequest($url, [], $config['timeout'], [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json'
        ], 'GET', [
            'originLocationCode' => $from,
            'destinationLocationCode' => $to,
            'departureDate' => $date,
            'adults' => $passengers
        ]);

        return $this->parseAmadeusResponse($response);
    }

    private function callRapidAPIFlights($config, $from, $to, $date, $passengers) {
        $url = $config['api_url'] . '/search';
        
        $response = $this->makeRequest($url, [
            'origin' => $from,
            'destination' => $to,
            'date' => $date,
            'passengers' => $passengers
        ], $config['timeout'], [
            'x-rapidapi-key: ' . $config['api_key'],
            'x-rapidapi-host: rapidapi.com'
        ]);

        return $this->parseRapidAPIResponse($response);
    }

    // =========================================================================
    // BUS API IMPLEMENTATIONS
    // =========================================================================

    private function callRedbusAPI($config, $from, $to, $date, $passengers) {
        $url = $config['api_url'] . '/buses/search';
        
        $response = $this->makeRequest($url, [
            'origin' => $from,
            'destination' => $to,
            'date' => $date,
            'passengers' => $passengers,
            'apiKey' => $config['api_key']
        ], $config['timeout']);

        return $this->parseRedbusResponse($response);
    }

    private function callMakeMyTripBusAPI($config, $from, $to, $date, $passengers) {
        $url = $config['api_url'] . '/buses';
        
        $response = $this->makeRequest($url, [
            'source' => $from,
            'destination' => $to,
            'journeyDate' => $date,
            'noOfPassengers' => $passengers,
            'partnerId' => $config['partner_id'] ?? '',
            'apiKey' => $config['api_key']
        ], $config['timeout']);

        return $this->parseMakeMyTripResponse($response);
    }

    private function callGoibiboAPI($config, $from, $to, $date, $passengers) {
        $url = $config['api_url'] . '/bus/search';
        
        $response = $this->makeRequest($url, [
            'source' => $from,
            'destination' => $to,
            'date' => $date,
            'passengers' => $passengers,
            'apiKey' => $config['api_key']
        ], $config['timeout']);

        return $this->parseGoibiboResponse($response);
    }

    // =========================================================================
    // TRAIN API IMPLEMENTATIONS
    // =========================================================================

    private function callIRCTCAPI($config, $from, $to, $date, $passengers) {
        // IRCTC API uses username/password authentication
        $url = $config['api_url'] . '/trains/search';
        
        $response = $this->makeRequest($url, [
            'from' => $from,
            'to' => $to,
            'date' => $date,
            'passengers' => $passengers
        ], $config['timeout'], [], 'POST', [], [
            'username' => $config['username'],
            'password' => $config['password']
        ]);

        return $this->parseIRCTCResponse($response);
    }

    private function callCleartripAPI($config, $from, $to, $date, $passengers) {
        $url = $config['api_url'] . '/v1/trains/search';
        
        $response = $this->makeRequest($url, [
            'origin' => $from,
            'destination' => $to,
            'departDate' => $date,
            'adults' => $passengers,
            'apiKey' => $config['api_key']
        ], $config['timeout']);

        return $this->parseCleartripResponse($response);
    }

    private function callMakeMyTripTrainAPI($config, $from, $to, $date, $passengers) {
        $url = $config['api_url'] . '/trains';
        
        $response = $this->makeRequest($url, [
            'source' => $from,
            'destination' => $to,
            'journeyDate' => $date,
            'noOfPassengers' => $passengers,
            'partnerId' => $config['partner_id'] ?? '',
            'apiKey' => $config['api_key']
        ], $config['timeout']);

        return $this->parseMakeMyTripResponse($response);
    }

    // =========================================================================
    // DATABASE FALLBACK METHODS
    // =========================================================================

    private function searchFlightsDatabase($from, $to, $date, $passengers) {
        $sql = "SELECT * FROM travel_options 
                WHERE mode = 'flight' 
                AND from_location = ? 
                AND to_location = ? 
                AND departure_date = ?
                AND capacity >= ?
                ORDER BY price ASC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('sssi', $from, $to, $date, $passengers);
        $stmt->execute();
        
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    private function searchBusesDatabase($from, $to, $date, $passengers) {
        $sql = "SELECT * FROM travel_options 
                WHERE mode = 'bus' 
                AND from_location = ? 
                AND to_location = ? 
                AND departure_date = ?
                AND capacity >= ?
                ORDER BY price ASC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('sssi', $from, $to, $date, $passengers);
        $stmt->execute();
        
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    private function searchTrainsDatabase($from, $to, $date, $passengers) {
        $sql = "SELECT * FROM travel_options 
                WHERE mode = 'train' 
                AND from_location = ? 
                AND to_location = ? 
                AND departure_date = ?
                AND capacity >= ?
                ORDER BY price ASC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('sssi', $from, $to, $date, $passengers);
        $stmt->execute();
        
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    // =========================================================================
    // UTILITY METHODS
    // =========================================================================

    private function makeRequest($url, $params = [], $timeout = 30, $headers = [], $method = 'POST', $query = [], $auth = null) {
        $ch = curl_init();

        if ($method === 'GET' && count($query) > 0) {
            $url .= '?' . http_build_query($query);
        }

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));
            if (empty($headers) || !in_array('Content-Type: application/json', $headers)) {
                $headers[] = 'Content-Type: application/json';
            }
        }

        if ($auth) {
            curl_setopt($ch, CURLOPT_USERPWD, $auth['username'] . ':' . $auth['password']);
        }

        if (!empty($headers)) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        }

        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("API request failed: {$error}");
        }

        return json_decode($response, true) ?? $response;
    }

    private function getAmadeusToken($config) {
        $cache_key = 'amadeus_token';
        $cached = $this->getCache($cache_key);
        
        if ($cached) {
            return $cached;
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $config['api_url'] . '/v1/security/oauth2/token');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'grant_type' => 'client_credentials',
            'client_id' => $config['client_id'],
            'client_secret' => $config['client_secret']
        ]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = json_decode(curl_exec($ch), true);
        curl_close($ch);

        if (isset($response['access_token'])) {
            $this->setCache($cache_key, $response['access_token']);
            return $response['access_token'];
        }

        throw new Exception("Failed to get Amadeus token");
    }

    // =========================================================================
    // RESPONSE PARSERS
    // =========================================================================

    private function parseSkyscannerResponse($response) {
        if (is_array($response) && isset($response['quotes'])) {
            return array_map(function($quote) {
                return [
                    'id' => $quote['QuoteId'] ?? null,
                    'airline' => $quote['OutboundLeg']['CarrierIds'][0] ?? null,
                    'price' => $quote['MinPrice'] ?? null,
                    'direct' => ($quote['OutboundLeg']['StopCount'] ?? 1) === 0
                ];
            }, $response['quotes']);
        }
        return [];
    }

    private function parseAmadeusResponse($response) {
        if (is_array($response) && isset($response['data'])) {
            return array_map(function($offer) {
                return [
                    'id' => $offer['id'] ?? null,
                    'price' => $offer['price']['total'] ?? null,
                    'direct' => count($offer['itineraries'][0]['segments'] ?? []) <= 1
                ];
            }, array_slice($response['data'], 0, 10));
        }
        return [];
    }

    private function parseRapidAPIResponse($response) {
        return is_array($response) ? $response : [];
    }

    private function parseRedbusResponse($response) {
        return is_array($response) ? ($response['buses'] ?? []) : [];
    }

    private function parseMakeMyTripResponse($response) {
        return is_array($response) ? ($response['options'] ?? []) : [];
    }

    private function parseGoibiboResponse($response) {
        return is_array($response) ? ($response['data'] ?? []) : [];
    }

    private function parseIRCTCResponse($response) {
        return is_array($response) ? ($response['trains'] ?? []) : [];
    }

    private function parseCleartripResponse($response) {
        return is_array($response) ? ($response['results'] ?? []) : [];
    }

    // =========================================================================
    // CACHING
    // =========================================================================

    private function getCache($key) {
        if (!$this->config['cache_enabled']) {
            return null;
        }

        $cache_file = $this->cache_dir . "/travel_{$key}.json";
        
        if (file_exists($cache_file)) {
            $data = json_decode(file_get_contents($cache_file), true);
            
            if ($data && isset($data['expires']) && $data['expires'] > time()) {
                return $data['value'];
            } else {
                unlink($cache_file);
            }
        }

        return null;
    }

    private function setCache($key, $value) {
        if (!$this->config['cache_enabled']) {
            return;
        }

        $cache_file = $this->cache_dir . "/travel_{$key}.json";
        $data = [
            'value' => $value,
            'expires' => time() + $this->config['cache_ttl']
        ];

        file_put_contents($cache_file, json_encode($data));
    }

    // =========================================================================
    // LOGGING
    // =========================================================================

    private function log($message, $level = 'info') {
        if (!$this->config['log_api_requests']) {
            return;
        }

        $timestamp = date('Y-m-d H:i:s');
        $log_line = "[{$timestamp}] [{$level}] {$message}\n";

        if (file_exists($this->log_file)) {
            file_put_contents($this->log_file, $log_line, FILE_APPEND);
        }
    }
}
