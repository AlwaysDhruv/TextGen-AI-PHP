<?php

header('Content-Type: application/json');

// Your Gemini API Key
$apiKey = 'AIzaSyDIVwk47kbBNhixJG0JW2aQzIbdt2T0j1E'; 

// Check if the request is a POST and has a query
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['query'])) {
    $userInput = $_POST['query'];

    // Construct the API URL
    $apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$apiKey";

    // Prepare the data to send to the API
    $data = [
        'contents' => [
            [
                'parts' => [
                    ['text' => $userInput]
                ]
            ]
        ]
    ];

    $json_data = json_encode($data);

    // Initialize cURL session
    $ch = curl_init($apiUrl);

    // Set cURL options
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $json_data);
    
    // Disable SSL verification for development environments
    // For a production environment, this should be set to true
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 

    // Execute the request
    $response = curl_exec($ch);

    // Check for cURL errors
    if (curl_errno($ch)) {
        echo json_encode(['error' => 'cURL Error: ' . curl_error($ch)]);
    } else {
        // Decode the JSON response and send it back to the frontend
        $responseData = json_decode($response, true);
        echo json_encode($responseData);
    }

    // Close the cURL session
    curl_close($ch);
} else {
    // Handle invalid requests
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request.']);
}
?>