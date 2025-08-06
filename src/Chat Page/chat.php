<?php
// ollama_api.php - Backend API handler for Ollama integration

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

class OllamaAPI {
    private $baseUrl;
    private $timeout;
    
    public function __construct($baseUrl = 'http://localhost:11434', $timeout = 30) {
        $this->baseUrl = $baseUrl;
        $this->timeout = $timeout;
    }
    
    /**
     * Check if Ollama server is running and get basic info
     */
    public function checkStatus() {
        try {
            // Try to get tags first (lighter operation)
            $response = $this->makeRequest('GET', '/api/tags');
            
            $modelCount = isset($response['models']) ? count($response['models']) : 0;
            
            return [
                'success' => true,
                'message' => 'Ollama server is running',
                'models_count' => $modelCount,
                'server_version' => $this->getServerVersion()
            ];
        } catch (Exception $e) {
            // If API fails, try command line check
            return $this->checkStatusFromCommand();
        }
    }
    
    /**
     * Check Ollama status using command line
     */
    private function checkStatusFromCommand() {
        try {
            $command = 'ollama list 2>&1';
            $output = shell_exec($command);
            
            if ($output && strpos($output, 'Error') === false && strpos($output, 'command not found') === false) {
                return [
                    'success' => true,
                    'message' => 'Ollama server is running (detected via CLI)',
                    'models_count' => $this->countModelsInOutput($output)
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Ollama server is not running or not accessible'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Cannot access Ollama: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Count models in ollama list output
     */
    private function countModelsInOutput($output) {
        $lines = explode("\n", trim($output));
        $count = 0;
        
        foreach ($lines as $line) {
            $line = trim($line);
            if (!empty($line) && strpos($line, 'NAME') !== 0 && strpos($line, '----') === false) {
                $count++;
            }
        }
        
        return $count;
    }
    
    /**
     * Get server version if available
     */
    private function getServerVersion() {
        try {
            $command = 'ollama --version 2>&1';
            $output = shell_exec($command);
            return trim($output) ?: 'unknown';
        } catch (Exception $e) {
            return 'unknown';
        }
    }
    
    /**
     * Pull a model from Ollama
     */
    public function pullModel($modelName) {
        try {
            // First check if model already exists
            $existingModels = $this->getModels();
            foreach ($existingModels as $model) {
                if (strpos($model['name'], $modelName) !== false) {
                    return [
                        'success' => true,
                        'message' => 'Model already exists',
                        'model' => $modelName
                    ];
                }
            }
            
            // Pull the model
            $response = $this->makeRequest('POST', '/api/pull', [
                'name' => $modelName
            ]);
            
            return [
                'success' => true,
                'message' => 'Model pulled successfully',
                'model' => $modelName
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to pull model: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Get list of available models using ollama list command
     */
    public function getModels() {
        try {
            // First try API method
            $response = $this->makeRequest('GET', '/api/tags');
            if (isset($response['models']) && !empty($response['models'])) {
                return $this->formatModelsFromAPI($response['models']);
            }
        } catch (Exception $e) {
            // If API fails, try command line method
            return $this->getModelsFromCommand();
        }
        
        // Fallback to command line if API returns no models
        return $this->getModelsFromCommand();
    }
    
    /**
     * Get models using ollama list command
     */
    private function getModelsFromCommand() {
        try {
            // Execute ollama list command
            $command = 'ollama list 2>&1';
            $output = shell_exec($command);
            
            if (empty($output)) {
                return [];
            }
            
            return $this->parseOllamaListOutput($output);
            
        } catch (Exception $e) {
            throw new Exception('Failed to get models from command: ' . $e->getMessage());
        }
    }
    
    /**
     * Parse ollama list command output
     */
    private function parseOllamaListOutput($output) {
        $models = [];
        $lines = explode("\n", trim($output));
        
        // Skip header line and empty lines
        foreach ($lines as $line) {
            $line = trim($line);
            
            // Skip empty lines and header
            if (empty($line) || strpos($line, 'NAME') === 0 || strpos($line, '----') !== false) {
                continue;
            }
            
            // Parse line format: NAME    ID    SIZE    MODIFIED
            $parts = preg_split('/\s+/', $line);
            
            if (count($parts) >= 3) {
                $name = $parts[0];
                $id = $parts[1] ?? '';
                $size = $parts[2] ?? '';
                $modified = isset($parts[3]) ? implode(' ', array_slice($parts, 3)) : '';
                
                // Convert size to bytes for consistency
                $sizeBytes = $this->convertSizeToBytes($size);
                
                $models[] = [
                    'name' => $name,
                    'model' => $name, // For compatibility
                    'tag' => $this->extractTag($name),
                    'digest' => $id,
                    'size' => $sizeBytes,
                    'size_formatted' => $size,
                    'modified_at' => $modified,
                    'details' => [
                        'format' => 'gguf',
                        'family' => $this->detectModelFamily($name),
                        'families' => [$this->detectModelFamily($name)],
                        'parameter_size' => $this->extractParameterSize($name),
                        'quantization_level' => $this->extractQuantization($name)
                    ]
                ];
            }
        }
        
        return $models;
    }
    
    /**
     * Format models from API response
     */
    private function formatModelsFromAPI($apiModels) {
        $models = [];
        
        foreach ($apiModels as $model) {
            $models[] = [
                'name' => $model['name'] ?? $model['model'] ?? 'unknown',
                'model' => $model['model'] ?? $model['name'] ?? 'unknown',
                'tag' => $model['tag'] ?? 'latest',
                'digest' => $model['digest'] ?? '',
                'size' => $model['size'] ?? 0,
                'size_formatted' => $this->formatBytes($model['size'] ?? 0),
                'modified_at' => $model['modified_at'] ?? '',
                'details' => $model['details'] ?? []
            ];
        }
        
        return $models;
    }
    
    /**
     * Convert size string to bytes
     */
    private function convertSizeToBytes($sizeStr) {
        if (empty($sizeStr) || $sizeStr === '-') {
            return 0;
        }
        
        $sizeStr = strtoupper(trim($sizeStr));
        $number = floatval($sizeStr);
        
        if (strpos($sizeStr, 'KB') !== false) {
            return $number * 1024;
        } elseif (strpos($sizeStr, 'MB') !== false) {
            return $number * 1024 * 1024;
        } elseif (strpos($sizeStr, 'GB') !== false) {
            return $number * 1024 * 1024 * 1024;
        } elseif (strpos($sizeStr, 'TB') !== false) {
            return $number * 1024 * 1024 * 1024 * 1024;
        } else {
            return $number; // Assume bytes
        }
    }
    
    /**
     * Format bytes to human readable string
     */
    private function formatBytes($bytes) {
        if ($bytes == 0) return '0 B';
        
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $factor = floor(log($bytes, 1024));
        
        return sprintf("%.1f %s", $bytes / pow(1024, $factor), $units[$factor]);
    }
    
    /**
     * Extract tag from model name
     */
    private function extractTag($name) {
        if (strpos($name, ':') !== false) {
            return explode(':', $name)[1];
        }
        return 'latest';
    }
    
    /**
     * Detect model family from name
     */
    private function detectModelFamily($name) {
        $name = strtolower($name);
        
        if (strpos($name, 'llama') !== false) {
            return 'llama';
        } elseif (strpos($name, 'mistral') !== false) {
            return 'mistral';
        } elseif (strpos($name, 'codellama') !== false) {
            return 'llama';
        } elseif (strpos($name, 'phi') !== false) {
            return 'phi';
        } elseif (strpos($name, 'gemma') !== false) {
            return 'gemma';
        } elseif (strpos($name, 'neural-chat') !== false) {
            return 'neural-chat';
        } elseif (strpos($name, 'starling') !== false) {
            return 'starling';
        } elseif (strpos($name, 'vicuna') !== false) {
            return 'vicuna';
        } elseif (strpos($name, 'orca') !== false) {
            return 'orca';
        } else {
            return 'other';
        }
    }
    
    /**
     * Extract parameter size from model name
     */
    private function extractParameterSize($name) {
        // Look for patterns like 7b, 13b, 70b, etc.
        if (preg_match('/(\d+(?:\.\d+)?)b/i', $name, $matches)) {
            return $matches[1] . 'B';
        }
        return 'unknown';
    }
    
    /**
     * Extract quantization level from model name
     */
    private function extractQuantization($name) {
        // Look for patterns like q4_0, q8_0, f16, etc.
        if (preg_match('/(q\d+_\d+|f\d+|fp\d+)/i', $name, $matches)) {
            return strtoupper($matches[1]);
        }
        return 'unknown';
    }
    
    /**
     * Send chat message to Ollama
     */
    public function chat($modelName, $message, $history = []) {
        try {
            // Prepare the conversation context
            $messages = [];
            
            // Add history to context (last few messages)
            foreach ($history as $msg) {
                $role = $msg['sender'] === 'user' ? 'user' : 'assistant';
                $messages[] = [
                    'role' => $role,
                    'content' => $msg['content']
                ];
            }
            
            // Add current message
            $messages[] = [
                'role' => 'user',
                'content' => $message
            ];
            
            // Make the chat request
            $response = $this->makeRequest('POST', '/api/chat', [
                'model' => $modelName,
                'messages' => $messages,
                'stream' => false
            ]);
            
            return [
                'success' => true,
                'response' => $response['message']['content'] ?? 'No response received'
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Chat request failed: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Make HTTP request to Ollama API
     */
    private function makeRequest($method, $endpoint, $data = null) {
        $url = $this->baseUrl . $endpoint;
        $curl = curl_init();
        
        curl_setopt_array($curl, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json'
            ]
        ]);
        
        if ($data && ($method === 'POST' || $method === 'PUT')) {
            curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);
        
        curl_close($curl);
        
        if ($error) {
            throw new Exception("cURL Error: $error");
        }
        
        if ($httpCode >= 400) {
            throw new Exception("HTTP Error: $httpCode - $response");
        }
        
        $decodedResponse = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON response: " . json_last_error_msg());
        }
        
        return $decodedResponse;
    }
    
    /**
     * Execute Ollama command via shell
     */
    public function executeOllamaCommand($command) {
        // Sanitize command to prevent injection
        $allowedCommands = ['serve', 'list', 'pull', 'run', 'rm', 'cp', 'create', 'show'];
        $commandParts = explode(' ', $command);
        
        if (empty($commandParts) || !in_array($commandParts[0], $allowedCommands)) {
            return [
                'success' => false,
                'message' => 'Invalid or unauthorized command'
            ];
        }
        
        try {
            $fullCommand = 'ollama ' . escapeshellcmd($command) . ' 2>&1';
            $output = shell_exec($fullCommand);
            
            return [
                'success' => true,
                'output' => $output,
                'command' => $command
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Command execution failed: ' . $e->getMessage()
            ];
        }
    }
}

// Handle incoming requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['action'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid request format'
        ]);
        exit;
    }
    
    $ollama = new OllamaAPI();
    $action = $input['action'];
    
    switch ($action) {
        case 'check_status':
            $result = $ollama->checkStatus();
            break;
            
        case 'pull_model':
            if (!isset($input['model'])) {
                $result = [
                    'success' => false,
                    'message' => 'Model name is required'
                ];
            } else {
                $result = $ollama->pullModel($input['model']);
            }
            break;
            
        case 'get_models':
            try {
                $models = $ollama->getModels();
                $result = [
                    'success' => true,
                    'models' => $models,
                    'count' => count($models)
                ];
            } catch (Exception $e) {
                $result = [
                    'success' => false,
                    'message' => $e->getMessage(),
                    'models' => []
                ];
            }
            break;
            
        case 'check_installation':
            $result = $ollama->checkOllamaInstallation();
            break;
            
        case 'chat':
            if (!isset($input['model']) || !isset($input['message'])) {
                $result = [
                    'success' => false,
                    'message' => 'Model and message are required'
                ];
            } else {
                $history = $input['history'] ?? [];
                $result = $ollama->chat($input['model'], $input['message'], $history);
            }
            break;
            
        case 'execute_command':
            if (!isset($input['command'])) {
                $result = [
                    'success' => false,
                    'message' => 'Command is required'
                ];
            } else {
                $result = $ollama->executeOllamaCommand($input['command']);
            }
            break;
            
        default:
            $result = [
                'success' => false,
                'message' => 'Unknown action: ' . $action
            ];
            break;
    }
    
    echo json_encode($result);
} else {
    // Handle GET requests for basic info
    echo json_encode([
        'success' => true,
        'message' => 'Ollama API Handler',
        'version' => '1.0',
        'endpoints' => [
            'check_status' => 'Check if Ollama server is running',
            'pull_model' => 'Pull a model from Ollama',
            'get_models' => 'Get list of available models',
            'chat' => 'Send a chat message to a model',
            'execute_command' => 'Execute Ollama CLI command'
        ]
    ]);
}
?>