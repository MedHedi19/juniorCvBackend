const express = require('express');
const { register, login, forgotPassword, resetPassword, refreshToken, logout } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimitMiddleware');
const router = express.Router();

// Route for user registration
router.post('/register', authLimiter, register);

// Route for user login
router.post('/login', authLimiter,login);

// Route for forgot password
router.post('/forgot-password', authLimiter, forgotPassword);

// Route for reset password
router.post('/reset-password', authLimiter, resetPassword);

// Route for refresh token
router.post('/refresh-token', refreshToken);

// Route for logout
router.post('/logout', logout);



module.exports = router;