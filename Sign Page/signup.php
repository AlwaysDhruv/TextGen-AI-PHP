<?php

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);    
    try
    {
        $conn = new mysqli("localhost", "root", "", "textgen-ai");
        $conn->set_charset("utf8mb4");
    
        if ($_SERVER['REQUEST_METHOD'] === 'POST')
        {
            $name     = $_POST['name'];
            $email    = $_POST['email'];
            $password = $_POST['password'];
    
            $sql = "INSERT INTO users (name, emailid, password) VALUES (?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("sss", $name, $email, $password);
            $stmt->execute();
    
            header("Location: ../Login Page/login.html");
            exit();
        }
    
    }
    catch (mysqli_sql_exception $e)
    {
        if ($e->getCode() == 1062)
        {
            echo "<script>
                alert('⚠️ This email is already registered. Please try with another.');
                window.location.href = 'signup.html';
            </script>";
        }
        else
        {
            echo "<script>
                alert('❌ Server error: " . $e->getMessage() . "');
                window.location.href = 'signup.html';
            </script>";
        }
        exit();
    }
?>