<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = $_POST['email'];
    $password = $_POST['password'];
    $found = false;

    $lines = file('../users.txt', FILE_IGNORE_NEW_LINES);
    foreach ($lines as $line) {
        list($name, $userEmail, $hashedPassword) = explode('|', $line);
        if ($email === $userEmail && password_verify($password, $hashedPassword)) {
            $found = true;
            break;
        }
    }

    if ($found) {
        header("Location: ../Chat Page/chat.html");
        exit();
    } else {
        echo "<script>alert('Invalid credentials'); window.location.href = '../login.html';</script>";
        exit();
    }
}
?>