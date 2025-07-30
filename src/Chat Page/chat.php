<?php
header('Content-Type: application/json');

// --- Get available models using only `ollama list`
function getAvailableModels(): array {
    $output = shell_exec("ollama list");
    $lines = explode("\n", trim($output));
    $models = [];

    foreach ($lines as $i => $line) {
        if ($i === 0 || trim($line) === '') continue; // Skip header
        $parts = preg_split('/\s+/', $line);
        if (!empty($parts[0])) {
            $models[] = $parts[0];
        }
    }
    return $models;
}

// --- GET request: return available models
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($_GET['action'] ?? '') === 'get_models') {
    $models = getAvailableModels();
    if (count($models)) {
        echo json_encode(['success' => true, 'models' => $models]);
    } else {
        echo json_encode(['success' => false, 'error' => 'No models found.']);
    }
    exit;
}

// --- POST request: send prompt and run model
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $model = trim($data['model'] ?? '');
    $prompt = trim($data['message'] ?? '');

    if ($model === '' || $prompt === '') {
        echo json_encode(['success' => false, 'error' => 'Model and prompt are required.']);
        exit;
    }

    $availableModels = getAvailableModels();
    if (!in_array($model, $availableModels)) {
        echo json_encode(['success' => false, 'error' => 'Invalid model selected.']);
        exit;
    }

    // Escape user input and build command
    $escapedPrompt = escapeshellarg($prompt);
    $escapedModel = escapeshellarg($model);
    $command = "echo $escapedPrompt | ollama run $escapedModel";

    $output = shell_exec($command);

    if (!empty($output)) {
        echo json_encode(['success' => true, 'response' => $output]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Model failed to generate output.']);
    }
    exit;
}

// --- Fallback for invalid request
echo json_encode(['success' => false, 'error' => 'Unsupported request.']);
exit;