# juniorCvBackend

## Overview
This project is an Express application that connects to a MongoDB database and implements a user authentication system. It follows best practices for architecture and code organization, utilizing middleware, encryption, and token management.

## Features
- User registration and login
- JWT-based authentication
- Password encryption
- Error handling middleware
- Organized file structure for scalability

## Technologies Used
- Node.js
- Express
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- bcrypt for password hashing

## Project Structure
```
juniorCvBackend
├── src
│   ├── app.js               # Entry point of the application
│   ├── config
│   │   └── db.js           # MongoDB connection logic
│   ├── controllers
│   │   ├── authController.js # User authentication logic
│   │   └── index.js        # Other controller functions
│   ├── middleware
│   │   ├── authMiddleware.js # Authentication middleware
│   │   └── errorHandler.js   # Error handling middleware
│   ├── models
│   │   └── user.js         # User schema and methods
│   ├── routes
│   │   ├── auth.js         # Authentication routes
│   │   └── index.js        # Application routes
│   └── utils
│       └── token.js        # JWT utility functions
├── server.js                # Starts the Express server
├── package.json             # Project metadata and dependencies
└── README.md                # Project documentation
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd juniorCvBackend
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage
1. Set up your MongoDB connection string in `src/config/db.js`.
2. Start the server:
   ```
   npm start
   ```
3. The server will run on `http://localhost:3000`.

## API Endpoints
- **POST /api/auth/register** - Register a new user
- **POST /api/auth/login** - Log in an existing user

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.