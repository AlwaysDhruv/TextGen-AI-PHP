# TextGen AI Chat Application

![transformer_decoding_2](https://github.com/user-attachments/assets/0617e6fe-f0a0-4c89-b6f4-e85d8b3783a7)

This is a web-based chat application that allows users to communicate with a GPT-based AI. The project includes features for user authentication, real-time chat, and more. It is designed with a user-friendly interface and is built using PHP, JavaScript, HTML, and CSS.

## Features

*   **User Authentication:** Secure user registration and login system.
*   **Password Recovery:** Functionality to reset passwords via email verification.
*   **Real-time Chat:** An interactive chat interface for communicating with the AI.
*   **Contact Page:** A page for users to send inquiries or feedback.
*   **Welcome Page:** A landing page for new users.

## Technologies Used

*   **Frontend:**
    *   HTML5
    *   CSS3
    *   JavaScript
*   **Backend:**
    *   PHP
*   **Libraries:**
    *   PHPMailer

## Project Structure

The project is organized into several directories, each corresponding to a specific feature or page of the application.

```
.
├── src
│   ├── Chat Page/        # Contains the chat interface files
│   ├── Contact Page/     # Files for the contact form
│   ├── Forgot Page/      # Password recovery pages and scripts
│   ├── Login Page/       # Login page and authentication scripts
│   ├── PHPMailer-master/ # PHPMailer library for sending emails
│   ├── Sign Page/        # Signup page and registration scripts
│   ├── Temp Chat/        # Temporary chat files
│   └── Welcome Page/     # The landing page for the application
├── README.md             # This file
└── TextGen-AI.docx       # Project documentation
```

## Installation and Setup

To get this project up and running on your local machine, please follow these steps:

1.  **Prerequisites:**
    *   Make sure you have a local web server environment that supports PHP, such as [XAMPP](https://www.apachefriends.org/index.html), [WAMP](https://www.wampserver.com/en/), or [MAMP](https://www.mamp.info/en/mamp/).

2.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/your-repository.git
    ```

3.  **Deploy the Project:**
    *   Move the cloned project folder to the root directory of your web server (e.g., `htdocs` in XAMPP).

4.  **Database Setup:**
    *   Open your database management tool (e.g., phpMyAdmin).
    *   Create a new database named `textgen-ai`.
    *   Run the following SQL query to create the `users` table:
        ```sql
        CREATE TABLE users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            emailid VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL
        );
        ```

5.  **Configure PHPMailer (Optional):**
    *   If you want to use the password recovery feature, you will need to configure PHPMailer in the `src/Forgot Page/` files (`send_otp.php`, `reset_password.php`). You will need to provide your SMTP server details and email credentials.

6.  **Access the Application:**
    *   Open your web browser and navigate to `http://localhost/your-project-folder-name/src/Welcome%20Page/Welcome.html`.
