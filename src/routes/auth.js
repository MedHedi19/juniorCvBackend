const express = require('express');
const { register, login, forgotPassword, resetPassword, refreshToken, logout } = require('../controllers/authController');
const socialAuthRoutes = require('./socialAuth');
const router = express.Router();

// Route for user registration
router.post('/register', register);

// Route for user login
router.post('/login', login);

// Route for forgot password
router.post('/forgot-password', forgotPassword);

// Route for reset password
router.post('/reset-password', resetPassword);

// Route for refresh token
router.post('/refresh-token', refreshToken);

// Route for logout
router.post('/logout', logout);

// Social auth routes
router.use('/', socialAuthRoutes);

module.exports = router;