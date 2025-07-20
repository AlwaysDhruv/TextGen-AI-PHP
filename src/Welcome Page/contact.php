<?php
session_start();
header('Content-Type: application/json');

// Load PHPMailer classes
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Autoload or manual includes
require '../PHPMailer-master/src/PHPMailer.php';
require '../PHPMailer-master/src/SMTP.php';
require '../PHPMailer-master/src/Exception.php';

// Get and sanitize inputs
$name = htmlspecialchars(trim($_POST['name'] ?? ''));
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$message = htmlspecialchars(trim($_POST['message'] ?? ''));

// Validate form fields
if (!$name || !$email || !$message) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit();
}

// Setup PHPMailer
$mail = new PHPMailer(true);

try {
    // Server settings
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'urbanunity12@gmail.com'; // Your Gmail
    $mail->Password   = 'etcyjepspushhsrz';       // Gmail App Password (not normal password)
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;

    // Recipients
    $mail->setFrom('urbanunity12@gmail.com', 'TextGen-AI Contact');
    $mail->addAddress('sonavanebharat92@gmail.com', 'TextGen-AI Admin'); // Receiver's email

    // Content
    $mail->Subject = 'New Contact Message from TextGen-AI';
    $mail->Body    = "You received a message from TextGen-AI:\n\n" .
                     "Name: $name\n" .
                     "Email: $email\n\n" .
                     "Message:\n$message";

    $mail->send();

    echo json_encode(['success' => true, 'message' => 'Message sent successfully!']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Mailer Error: ' . $mail->ErrorInfo]);
}
?>