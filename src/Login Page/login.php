<?php
session_start(); // ✅ Start session for storing login info

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
try {
    $conn = new mysqli("localhost", "root", "", "textgen-ai");
    $conn->set_charset("utf8mb4");

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        if (empty($email) || empty($password)) {
            echo "<script>alert('⚠️ Please fill in both email and password.'); window.location.href = 'login.html';</script>";
            exit();
        }

        $stmt = $conn->prepare("SELECT name, password FROM users WHERE emailid = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows === 1) {
            $stmt->bind_result($name, $storedPassword);
            $stmt->fetch();

            $isValid = password_verify($password, $storedPassword) || $password === $storedPassword;

            if ($isValid) {
                // ✅ Store data in session
                $_SESSION['email'] = $email;
                $_SESSION['name'] = $name;

                // ✅ Redirect to PHP page that can access session data
                header("Location: ../Chat Page/chat.php");
                exit();
            } else {
                echo "<script>alert('❌ Incorrect password.'); window.location.href = 'login.html';</script>";
                exit();
            }
        } else {
            echo "<script>alert('⚠️ Email not registered.'); window.location.href = 'login.html';</script>";
            exit();
        }
    }
} catch (mysqli_sql_exception $e) {
    $error = htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8');
    echo "<script>alert('🚨 Server error: $error'); window.location.href = 'login.html';</script>";
    exit();
} finally {
    if (isset($stmt) && $stmt instanceof mysqli_stmt) $stmt->close();
    if (isset($conn) && $conn instanceof mysqli) $conn->close();
}
?>