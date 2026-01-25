const express = require('express');
const { register, login, forgotPassword, resetPassword, refreshToken, logout, deleteAccount } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
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

// Route for delete account (requires authentication)
router.delete('/delete-account', authMiddleware, deleteAccount);

// Social auth routes
router.use('/', socialAuthRoutes);

module.exports = router;