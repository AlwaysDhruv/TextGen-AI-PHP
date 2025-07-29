<?php
// Set header to indicate JSON content type
header('Content-Type: application/json');

/**
 * Sanitizes input for use in shell commands.
 * This is a basic sanitization using escapeshellarg.
 * For production, consider more robust validation and whitelisting.
 * @param string $input The string to sanitize.
 * @return string The sanitized string.
 */
function sanitizeInput($input) {
    // escapeshellarg adds single quotes around a string and escapes any existing single quotes,
    // making it safe to pass as a single argument to a shell command.
    return escapeshellarg($input);
}

/**
 * Executes 'ollama list' command to get available models.
 * @return array An associative array with 'success' status and 'models' array or 'error' message.
 */
function getOllamaModels() {
    // Command to list local Ollama models.
    // '2>&1' redirects standard error to standard output, so we capture all output.
    $command = 'ollama list 2>&1';
    $output = []; // Array to store lines of output
    $returnValue = 0; // Variable to store the command's exit code

    // Execute the command
    exec($command, $output, $returnValue);

    if ($returnValue === 0) {
        $models = [];
        // Parse the output to extract model names.
        // Example `ollama list` output:
        // NAME                   ID          SIZE    MODIFIED
        // llama2:latest          f823f360ae5f    3.8 GB  2 days ago
        // mistral:latest         9f315a6639c0    4.1 GB  18 hours ago

        $isFirstLine = true; // Flag to skip the header line
        foreach ($output as $line) {
            if ($isFirstLine) {
                $isFirstLine = false;
                continue; // Skip the header row
            }
            // Split the line by one or more whitespace characters, limit to 2 parts
            $parts = preg_split('/\s+/', $line, 2);
            if (count($parts) >= 1) {
                $modelName = trim($parts[0]); // Get the first part (model name)
                if (!empty($modelName)) {
                    $models[] = $modelName; // Add to models array
                }
            }
        }
        return ['success' => true, 'models' => $models];
    } else {
        // Command failed, return error message from output
        return ['success' => false, 'error' => 'Failed to list Ollama models: ' . implode("\n", $output)];
    }
}

// --- Handle GET requests ---
// Check if the request method is GET and if 'action' parameter is set to 'get_models'
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_models') {
    echo json_encode(getOllamaModels()); // Return the list of models as JSON
    exit; // Terminate script execution
}

// --- Handle POST requests (for chat messages) ---
// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Read the raw POST data (JSON payload from JavaScript)
    $input = json_decode(file_get_contents('php://input'), true);

    // Get message and model from the decoded input, with null coalescing for safety
    $message = $input['message'] ?? '';
    $model = $input['model'] ?? '';

    // Validate if message and model are provided
    if (empty($message) || empty($model)) {
        echo json_encode(['success' => false, 'error' => 'Message and model are required.']);
        exit;
    }

    // Sanitize the message and model name before using them in a shell command
    $sanitizedMessage = sanitizeInput($message);
    $sanitizedModel = sanitizeInput($model);

    // Construct the Ollama command to run the selected model with the user's message.
    // 'ollama run <model> <prompt>' executes the model with the given prompt.
    // '2>&1' ensures both standard output and standard error are captured in $output.
    $command = "ollama run $sanitizedModel $sanitizedMessage 2>&1";

    $output = []; // Array to store command output lines
    $returnValue = 0; // Variable to store the command's exit code

    // Execute the Ollama command
    exec($command, $output, $returnValue);

    if ($returnValue === 0) {
        // If command executed successfully, return the combined output as the response
        echo json_encode(['success' => true, 'response' => implode("\n", $output)]);
    } else {
        // If command failed, return an error message including the command's output
        echo json_encode(['success' => false, 'error' => 'Ollama command failed: ' . implode("\n", $output)]);
    }
} else {
    // Handle invalid request methods
    echo json_encode(['success' => false, 'error' => 'Invalid request method. Only GET for models and POST for chat are supported.']);
}
?>
