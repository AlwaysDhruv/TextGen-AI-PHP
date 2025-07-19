<?php
session_start();
if (!isset($_SESSION['name'])) {
    header("Location: ../Login Page/login.html");
    exit();
}
$initial = strtoupper(substr($_SESSION['name'], 0, 1));
?>
<div class="profile-section">
    <div class="profile-icon"><?= htmlspecialchars($initial) ?></div>
    <form method="post" action="../Welcome Page/Welcome.html" style="display:inline;">
        <button class="logout-btn" type="submit">Logout</button>
    </form>
</div>