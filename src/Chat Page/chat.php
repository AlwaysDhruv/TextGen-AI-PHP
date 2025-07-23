<?php
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["prompt"])) {
    $prompt = escapeshellarg($_POST["prompt"]);
    $command = "echo $prompt | ollama run mistral:latest";
    $output = shell_exec($command);

    echo json_encode(["response" => $output]);
    exit;
}
echo json_encode(["response" => "Invalid request."]);
?>