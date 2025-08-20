# JuniorCV Backend Service

This is the robust and secure backend server for the JuniorCV mobile application. It is built with Node.js and Express, and it provides a comprehensive suite of services including user authentication, profile management, dynamic job scraping, and interactive quiz administration.

## ✨ Key Features & Technical Highlights

### 1. **Advanced Authentication & Security**
The authentication system is a cornerstone of this application, designed for both security and a seamless user experience.

*   **Two-Step JWT & Refresh Token Mechanism:**
    *   **Short-Lived Access Tokens (JWT):** Minimizes the risk of session hijacking. If a token is compromised, its lifespan is very short.
    *   **Secure Refresh Tokens:** A long-lived refresh token is used to silently and automatically obtain a new access token without requiring the user to log in again. This provides a smooth, uninterrupted experience.
    *   **Secure Storage:** Tokens are stored securely on the client, and the refresh token is invalidated on the server if compromised.

*   **Robust Security Measures:**
    *   **Password Hashing:** All user passwords are encrypted using the industry-standard `bcrypt` algorithm, ensuring they are never stored in plaintext.
    *   **Rate Limiting:** Protects against brute-force attacks on login and other sensitive endpoints.
    *   **Comprehensive Security Testing:** The backend has been tested against common vulnerabilities, including injection attacks and JWT security flaws.

### 2. **Dynamic Job Scraping Module**
A powerful, real-time job scraping service that provides fresh job listings to users.
*   **Technology:** Uses **Puppeteer** for browser automation and **Cheerio** for fast HTML parsing.
*   **Multi-Source Scraping:** Capable of scraping from multiple job boards (e.g., TanitJobs).
*   **Efficiency:** Scraped jobs are stored in the MongoDB database to avoid redundant scraping and to provide fast access for users.

### 3. **Interactive Quiz & Personality Engine**
A flexible system for creating and managing skills quizzes and personality tests.
*   **Dynamic Quizzes:** Serves questions, tracks user progress, and calculates scores on the backend.
*   **Personality Assessment:** Implements a personality test to provide users with insights into their professional strengths.
*   **Result Tracking:** User results and progress are saved, allowing them to track their improvement over time.

### 4. **Full-Featured Profile Management**
*   **User Data:** Endpoints to securely update user information like name and email.
*   **Password Management:** Secure endpoint for changing passwords, requiring the old password for verification.
*   **Profile Photo Uploads:** Handles image uploads (as Base64 strings) and updates the user's profile.

## 🛠️ Tech Stack

*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB with Mongoose ODM
*   **Authentication:** JSON Web Tokens (JWT)
*   **Web Scraping:** Puppeteer, Cheerio
*   **Deployment:** Render (with CI/CD)

## ⚙️ Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd juniorCvBackend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the backend directory and add the following:
    ```env
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_strong_jwt_secret
    REFRESH_TOKEN_SECRET=your_strong_refresh_token_secret
    ```

4.  **Run the server:**
    ```bash
    npm start
    ```

## 🧪 Testing
The backend includes a suite of tests to ensure reliability and security. These tests cover:
*   User registration and login flows.
*   Token refresh mechanism.
*   Security against password reset vulnerabilities.
*   System health and database connectivity.
*   Job scraping module functionality.