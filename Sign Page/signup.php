<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name     = $_POST['name'];
    $email    = $_POST['email'];
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);

    $file = fopen('../users.txt', 'a');
    fwrite($file, "$name|$email|$password\n");
    fclose($file);

    header("Location: ../Login Page/login.html");
    exit();
}
?>