<?php
session_start();

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../PHPMailer-master/src/PHPMailer.php';
require '../PHPMailer-master/src/SMTP.php';
require '../PHPMailer-master/src/Exception.php';

$email = $_POST['email'];

$host = "localhost";
$user = "root";
$pass = "";
$db   = "textgen-ai";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

// ✅ Check if email exists and fetch user name
$sql = "SELECT name FROM users WHERE emailid = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo "❌ Email not registered!";
    exit();
}

$row = $result->fetch_assoc();
$name = $row['name'];  // 👈 Get user's name

$otp = rand(100000, 999999);
$_SESSION['reset_email'] = $email;
$_SESSION['reset_otp'] = $otp;

$mail = new PHPMailer(true);

try {
    // ✅ SMTP config
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'urbanunity12@gmail.com';
    $mail->Password = 'etcyjepspushhsrz';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;

    // ✅ Email setup
    $mail->setFrom('sonavanebharat92@gmail.com', 'TextGen-AI');
    $mail->addAddress($email);
    $mail->Subject = 'OTP for Password Reset';
    $mail->Body    = "Hi $name,\n\nYour OTP for password reset is: $otp\n\nPlease use this within 5 minutes.\n\nThank you,\nTextGen-AI Team";

    $mail->send();
    header("Location: verify_otp.html");
    exit();
} catch (Exception $e) {
    echo 'OTP sending failed. Error: ' . $mail->ErrorInfo;
}
?>