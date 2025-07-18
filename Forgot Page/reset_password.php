<?php
session_start();
$entered_otp = $_POST['otp'];
$new_password = $_POST['new_password'];
$email = $_SESSION['reset_email'];
$correct_otp = $_SESSION['reset_otp'];

if ($entered_otp == $correct_otp) {
    $conn = new mysqli("localhost", "root", "", "textgen-ai");
    if ($conn->connect_error) die("Connection failed: " . $conn->connect_error);

    $stmt = $conn->prepare("UPDATE users SET password=? WHERE emailid=?");
    $stmt->bind_param("ss", $new_password, $email);

    if ($stmt->execute()) {
        echo "<script>alert('Password reset successful!'); window.location.href='../Login Page/login.html';</script>";
    } else {
        echo "Error updating password.";
    }
} else {
    echo "<script>alert('Incorrect OTP!'); window.history.back();</script>";
}
?>